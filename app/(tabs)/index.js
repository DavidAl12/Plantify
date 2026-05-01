import { useRouter } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AppHeader from "../../components/ui/AppHeader";
import { auth, db } from "../../src/config/firebase";
import { COLORS } from "../../styles/colors";
import { Ionicons } from "@expo/vector-icons";
import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export default function Home() {
  const router = useRouter();
  const [plants, setPlants] = useState([]);
  const [userName, setUserName] = useState("");
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const name = user.displayName || "Usuario";
    setUserName(name);

    const unsubscribe = onSnapshot(
      collection(db, "users", user.uid, "plants"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPlants(data);
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=3.44&longitude=-76.52&current_weather=true&hourly=relativehumidity_2m",
    )
      .then((res) => res.json())
      .then((data) => {
        setWeather({
          temp: data.current_weather.temperature,
          humidity: data.hourly.relativehumidity_2m[0],
        });
      });
  }, []);

  const weeklyTips = [
    { id: "1", title: "Riego de Verano", text: "En días calurosos, riega temprano en la mañana para evitar la evaporación.", icon: "sunny" },
    { id: "2", title: "Hojas Limpias", text: "Limpia el polvo de las hojas con un paño húmedo para que respiren mejor.", icon: "leaf" },
    { id: "3", title: "Drenaje Vital", text: "Asegúrate de que tus macetas no acumulen agua en el fondo para evitar hongos.", icon: "water" },
  ];

  const suggestedPlants = [
    { id: 's1', name: 'Monstera Deliciosa', scientific: 'Monstera deliciosa', image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400' },
    { id: 's2', name: 'Lengua de Suegra', scientific: 'Sansevieria', image: 'https://images.unsplash.com/photo-1593482892290-f54927ae1bf7?w=400' },
    { id: 's3', name: 'Aloe Vera', scientific: 'Aloe barbadensis', image: 'https://images.unsplash.com/photo-1567348123946-778a483a7abc?w=400' },
  ];

  return (
    <View style={styles.container}>
      <AppHeader />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Saludo */}
        <View style={styles.greeting}>
          <Text style={styles.welcome}>Bienvenido de nuevo</Text>
          <Text style={styles.name}>Hola, {userName} 👋</Text>
        </View>

        {/* CLIMA CARD */}
        {weather && (
          <View style={styles.weatherCard}>
             <View style={styles.weatherInfo}>
                <Text style={styles.weatherLocation}>Cali, Colombia</Text>
                <Text style={styles.weatherTemp}>{Math.round(weather.temp)}°C</Text>
                <Text style={styles.weatherStatus}>Humedad: {weather.humidity}%</Text>
             </View>
             <Ionicons name="partly-sunny" size={60} color="white" />
          </View>
        )}

        {/* MI JARDÍN */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>MI JARDÍN</Text>
            <TouchableOpacity
              onPress={() => router.push("/plant/add")}
              style={styles.addBtn}
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {plants.length === 0 ? (
             <TouchableOpacity style={styles.emptyGarden} onPress={() => router.push("/plant/add")}>
                <Ionicons name="add-circle-outline" size={40} color="#ccc" />
                <Text style={styles.emptyText}>Agrega tu primera planta</Text>
             </TouchableOpacity>
          ) : (
            <FlatList
              data={plants}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.plantCard}
                  onPress={() => router.push(`/plant/${item.id}`)}
                >
                  <Image
                    source={{
                      uri: item.imageUrl || "https://via.placeholder.com/150",
                    }}
                    style={styles.plantImage}
                  />
                  <Text style={styles.plantName} numberOfLines={1}>
                    {item.commonNames?.[0] || item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        {/* SUGERENCIAS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUGERENCIAS PARA TI</Text>
          <FlatList
            data={suggestedPlants}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.suggestedCard}>
                <Image source={{ uri: item.image }} style={styles.suggestedImage} />
                <View style={styles.suggestedOverlay}>
                   <Text style={styles.suggestedName}>{item.name}</Text>
                   <Text style={styles.suggestedScientific}>{item.scientific}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* TIPS SEMANALES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TIPS SEMANALES</Text>
          {weeklyTips.map((tip) => (
            <View key={tip.id} style={styles.tipCard}>
              <View style={styles.tipIconContainer}>
                <Ionicons name={tip.icon} size={24} color={COLORS.primary} />
              </View>
              <View style={styles.tipTextContainer}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipDescription}>{tip.text}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f7f2",
  },
  content: {
    paddingBottom: 20,
  },
  greeting: { padding: 20, paddingTop: 10 },
  welcome: { color: "#888", fontSize: 14 },
  name: { fontSize: 28, fontWeight: "800", color: "#1b1b1b" },
  weatherCard: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 4,
  },
  weatherInfo: { flex: 1 },
  weatherLocation: { color: "rgba(255,255,255,0.8)", fontSize: 12 },
  weatherTemp: { color: "white", fontSize: 32, fontWeight: "bold" },
  weatherStatus: { color: "white", fontSize: 14, opacity: 0.9 },
  section: {
    paddingLeft: 20,
    marginTop: 30,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontWeight: "800",
    color: "#2e7d32",
    fontSize: 14,
    letterSpacing: 1,
  },
  addBtn: {
    backgroundColor: "#2e7d32",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  plantCard: {
    marginRight: 15,
  },
  plantImage: {
    width: 140,
    height: 140,
    borderRadius: 20,
  },
  plantName: {
    marginTop: 8,
    fontWeight: "600",
    fontSize: 14,
    width: 140,
    color: "#333",
  },
  emptyGarden: {
    height: 140,
    width: width - 40,
    backgroundColor: "white",
    borderRadius: 20,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#aaa",
    marginTop: 8,
  },
  suggestedCard: {
    marginRight: 15,
    borderRadius: 20,
    overflow: "hidden",
    width: 200,
    height: 120,
  },
  suggestedImage: {
    width: "100%",
    height: "100%",
  },
  suggestedOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  suggestedName: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  suggestedScientific: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10,
    fontStyle: "italic",
  },
  tipCard: {
    flexDirection: "row",
    backgroundColor: "white",
    marginRight: 20,
    marginBottom: 12,
    padding: 15,
    borderRadius: 20,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  tipIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  tipTextContainer: {
    flex: 1,
  },
  tipTitle: {
    fontWeight: "bold",
    fontSize: 15,
    color: "#333",
  },
  tipDescription: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
    lineHeight: 18,
  },
});

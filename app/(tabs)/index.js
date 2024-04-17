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

  // 🌤 CLIMA (Cali ejemplo)
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

  // 💡 TIPS
  const tips = [
    "No riegues en exceso 🌱",
    "Evita sol directo en tropicales ☀️",
    "Usa macetas con drenaje 🪴",
    "Limpia las hojas regularmente 🍃",
  ];

  return (
    <View style={styles.container}>
      <AppHeader />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Saludo debajo del header */}
        <View style={styles.greeting}>
          <Text style={styles.welcome}>Bienvenido de nuevo</Text>
          <Text style={styles.name}>Hola, {userName} 👋</Text>
        </View>
        {/* MI JARDÍN */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>MI JARDÍN</Text>

            <TouchableOpacity
              onPress={() => router.push("/plant/add")}
              style={styles.addBtn}
            >
              <Text style={{ color: "white", fontSize: 18 }}>+</Text>
            </TouchableOpacity>
          </View>

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
                <Text style={styles.plantName}>
                  {item.commonNames?.[0] || item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
        {/* TIPS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TIPS</Text>

          <FlatList
            data={tips}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, i) => i.toString()}
            renderItem={({ item }) => (
              <View style={styles.tipCard}>
                <Text style={styles.tipText}>{item}</Text>
              </View>
            )}
          />
        </View>
        {/* CLIMA */}
        {weather && (
          <View style={styles.weatherRow}>
            <View style={styles.weatherBox}>
              <Text style={styles.weatherTitle}>Pronóstico</Text>
              <Text style={styles.weatherValue}>{weather.temp}°C</Text>
            </View>

            <View style={styles.weatherBox}>
              <Text style={styles.weatherTitle}>Humedad</Text>
              <Text style={styles.weatherValue}>{weather.humidity}%</Text>
            </View>
          </View>
        )}
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
    paddingBottom: 40,
  },

  greeting: { padding: 20, paddingTop: 10 },

  welcome: { color: "#888" },

  name: {
    fontSize: 28,
    fontWeight: "800",
  },

  section: {
    paddingLeft: 20,
    marginTop: 20,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 20,
  },

  sectionTitle: {
    fontWeight: "700",
    color: "#2e7d32",
  },

  addBtn: {
    backgroundColor: "#2e7d32",
    width: 35,
    height: 35,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  plantCard: {
    marginRight: 12,
    marginTop: 10,
  },

  plantImage: {
    width: 180,
    height: 180,
    borderRadius: 20,
  },

  plantName: {
    marginTop: 6,
    fontWeight: "600",
  },

  tipCard: {
    backgroundColor: "#2e7d32",
    padding: 16,
    borderRadius: 20,
    marginRight: 12,
    marginTop: 10,
    width: 180,
  },

  tipText: {
    color: "white",
  },

  weatherRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 30,
  },

  weatherBox: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    width: 140,
    alignItems: "center",
  },

  weatherTitle: {
    color: "#888",
  },

  weatherValue: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 5,
  },
});

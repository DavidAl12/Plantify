import { useRouter } from "expo-router";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AppHeader from "../../components/ui/AppHeader";
import { auth, db } from "../../src/config/firebase";

// Helpers
const diasDesde = (timestamp) => {
  if (!timestamp) return null;
  const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return Math.floor((Date.now() - fecha.getTime()) / 86400000);
};

export default function Garden() {
  const router = useRouter();
  const [plants, setPlants] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "plants"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPlants(data);
    });

    return unsubscribe;
  }, []);

  // FILTRO
  const filteredPlants = plants.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()),
  );

  // MÉTRICAS
  const total = plants.length;
  const needsWater = plants.filter((p) => {
    const d = diasDesde(p.lastWatered);
    return p.wateringFrequencyDays && d >= p.wateringFrequencyDays;
  }).length;

  const healthy = total - needsWater;

  // CARD
  const renderItem = ({ item }) => {
    const dias = diasDesde(item.lastWatered);

    const necesita =
      item.wateringFrequencyDays &&
      dias !== null &&
      dias >= item.wateringFrequencyDays;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/plant/${item.id}`)}
        activeOpacity={0.9}
      >
        {/* Imagen */}
        <Image
          source={{
            uri:
              item.imageUrl ||
              "https://via.placeholder.com/300x200.png?text=Plant",
          }}
          style={styles.image}
        />

        {/* Estado */}
        <View
          style={[
            styles.badge,
            { backgroundColor: necesita ? "#ffebee" : "#e8f5e9" },
          ]}
        >
          <Text
            style={{
              color: necesita ? "#c62828" : "#2e7d32",
              fontWeight: "600",
            }}
          >
            {necesita ? "Necesita agua" : "Sana"}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.cardContent}>
          <Text style={styles.name}>{item.name}</Text>

          <Text style={styles.subtitle}>
            {necesita
              ? "Atrasado"
              : `En ${item.wateringFrequencyDays || 0} días`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader />

      {/* BUSCADOR */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Busca en tu jardín..."
          value={search}
          onChangeText={setSearch}
          style={styles.search}
        />

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/plant/add")}
        >
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* MÉTRICAS */}
      <View style={styles.metrics}>
        <View style={styles.metricBox}>
          <Text style={styles.metricNumber}>{total}</Text>
          <Text style={styles.metricLabel}>Total</Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.metricNumber}>{healthy}</Text>
          <Text style={styles.metricLabel}>Sanas</Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={[styles.metricNumber, { color: "#c62828" }]}>
            {needsWater}
          </Text>
          <Text style={styles.metricLabel}>Cuidado</Text>
        </View>
      </View>

      {/* LISTA */}
      <FlatList
        data={filteredPlants}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8f5" },

  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 10,
  },

  search: {
    flex: 1,
    backgroundColor: "#eee",
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 45,
  },

  addButton: {
    backgroundColor: "#2e7d32",
    width: 45,
    height: 45,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  addText: {
    color: "white",
    fontSize: 22,
  },

  metrics: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
    marginTop: 10,
  },

  metricBox: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    width: 90,
  },

  metricNumber: {
    fontSize: 18,
    fontWeight: "700",
  },

  metricLabel: {
    fontSize: 12,
    color: "#888",
  },

  card: {
    backgroundColor: "white",
    borderRadius: 20,
    marginBottom: 16,
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: 180,
  },

  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  cardContent: {
    padding: 14,
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
  },

  subtitle: {
    color: "#888",
    marginTop: 4,
  },
});

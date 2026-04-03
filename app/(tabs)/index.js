import { useRouter } from "expo-router";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
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
import { auth, db } from "../../src/config/firebase";

// Calcula días desde una fecha Firestore
const diasDesde = (timestamp) => {
  if (!timestamp) return null;
  const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = Date.now() - fecha.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

// Determina el estado de la planta según los días desde el último riego
const getEstado = (diasUltimoRiego, frecuencia) => {
  if (diasUltimoRiego === null) return { texto: "Sin registros", color: "#aaa", icono: "🌱" };
  if (diasUltimoRiego === 0) return { texto: "Regada hoy", color: "#4CAF50", icono: "✅" };
  if (frecuencia && diasUltimoRiego >= frecuencia) return { texto: "Necesita riego", color: "#FF7043", icono: "⚠️" };
  if (diasUltimoRiego === 1) return { texto: "Regada ayer", color: "#66BB6A", icono: "✅" };
  return { texto: `Hace ${diasUltimoRiego} días`, color: "#FFA726", icono: "💧" };
};

export default function Home() {
  const router = useRouter();
  const [plants, setPlants] = useState([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Nombre del usuario
    const name = user.displayName || user.email?.split("@")[0] || "Usuario";
    setUserName(name);

    const q = query(
      collection(db, "users", user.uid, "plants"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plantList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPlants(plantList);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Plantas que necesitan riego hoy
  const plantasUrgentes = plants.filter((p) => {
    const dias = diasDesde(p.lastWatered);
    return dias !== null && p.wateringFrequencyDays && dias >= p.wateringFrequencyDays;
  });

  const renderPlanta = ({ item }) => {
    const dias = diasDesde(item.lastWatered);
    const estado = getEstado(dias, item.wateringFrequencyDays);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/plant/${item.id}`)}
        activeOpacity={0.85}
      >
        {/* Imagen de la planta */}
        <View style={styles.cardImageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
          ) : (
            <View style={styles.cardImagePlaceholder}>
              <Text style={styles.cardImageEmoji}>🌿</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          {item.commonNames?.length > 0 && (
            <Text style={styles.cardSpecies} numberOfLines={1}>
              {item.commonNames[0]}
            </Text>
          )}
          <View style={styles.cardStatusRow}>
            <Text style={styles.cardStatusIcon}>{estado.icono}</Text>
            <Text style={[styles.cardStatus, { color: estado.color }]}>
              {estado.texto}
            </Text>
          </View>
          {item.wateringFrequencyDays && (
            <Text style={styles.cardFreq}>
              💧 Cada {item.wateringFrequencyDays} días
            </Text>
          )}
        </View>

        {/* Flecha */}
        <Text style={styles.cardArrow}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {userName} 👋</Text>
          <Text style={styles.subtitle}>
            {plants.length === 0
              ? "Agrega tu primera planta"
              : `${plants.length} planta${plants.length !== 1 ? "s" : ""} registrada${plants.length !== 1 ? "s" : ""}`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/plant/add")}
          activeOpacity={0.85}
        >
          <Text style={styles.addButtonText}>+ Agregar</Text>
        </TouchableOpacity>
      </View>

      {/* Alerta de plantas urgentes */}
      {plantasUrgentes.length > 0 && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>
            ⚠️ {plantasUrgentes.length} planta{plantasUrgentes.length !== 1 ? "s necesitan" : " necesita"} riego hoy:{" "}
            {plantasUrgentes.map((p) => p.name).join(", ")}
          </Text>
        </View>
      )}

      {/* Lista de plantas */}
      {loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Cargando plantas...</Text>
        </View>
      ) : plants.length === 0 ? (
        <ScrollView contentContainerStyle={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🪴</Text>
          <Text style={styles.emptyTitle}>Aún no tienes plantas</Text>
          <Text style={styles.emptySubtitle}>
            Agrega tu primera planta manualmente o escanea una con la cámara
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push("/plant/add")}
          >
            <Text style={styles.emptyButtonText}>+ Agregar planta</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <FlatList
          data={plants}
          keyExtractor={(item) => item.id}
          renderItem={renderPlanta}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8faf7",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a2e1a",
  },
  subtitle: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  addButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  addButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
  alertBanner: {
    backgroundColor: "#FFF3E0",
    borderLeftWidth: 4,
    borderLeftColor: "#FF7043",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
  },
  alertText: {
    color: "#BF360C",
    fontSize: 13,
    fontWeight: "500",
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 12,
    backgroundColor: "#e8f5e9",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cardImagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  cardImageEmoji: {
    fontSize: 28,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a2e1a",
  },
  cardSpecies: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
    marginTop: 1,
  },
  cardStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  cardStatusIcon: {
    fontSize: 12,
  },
  cardStatus: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardFreq: {
    fontSize: 11,
    color: "#aaa",
    marginTop: 2,
  },
  cardArrow: {
    fontSize: 24,
    color: "#ccc",
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a2e1a",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  emptyButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },
  emptyText: {
    color: "#888",
    fontSize: 15,
  },
});
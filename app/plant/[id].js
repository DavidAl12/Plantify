import { useLocalSearchParams, useRouter } from "expo-router";
import { deleteDoc, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../src/config/firebase";

const diasDesde = (timestamp) => {
  if (!timestamp) return null;
  const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = Date.now() - fecha.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const formatFecha = (timestamp) => {
  if (!timestamp) return "Sin registro";
  const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return fecha.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default function PlantDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [plant, setPlant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regando, setRegando] = useState(false);

  useEffect(() => {
    const fetchPlant = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const docRef = doc(db, "users", user.uid, "plants", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPlant({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlant();
  }, [id]);

  const handleRegar = async () => {
    try {
      setRegando(true);
      const user = auth.currentUser;
      await updateDoc(doc(db, "users", user.uid, "plants", id), {
        lastWatered: serverTimestamp(),
      });
      // Actualizar estado local
      setPlant((prev) => ({ ...prev, lastWatered: { toDate: () => new Date() } }));
      Alert.alert("¡Listo! 💧", "Riego registrado correctamente.");
    } catch (err) {
      console.error(err);
    } finally {
      setRegando(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Eliminar planta",
      `¿Estás seguro de que quieres eliminar "${plant?.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const user = auth.currentUser;
            await deleteDoc(doc(db, "users", user.uid, "plants", id));
            router.replace("/(tabs)");
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Cargando planta...</Text>
      </View>
    );
  }

  if (!plant) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Planta no encontrada</Text>
      </View>
    );
  }

  const diasUltimoRiego = diasDesde(plant.lastWatered);
  const necesitaRiego = plant.wateringFrequencyDays && diasUltimoRiego !== null
    && diasUltimoRiego >= plant.wateringFrequencyDays;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Imagen hero */}
      <View style={styles.imageContainer}>
        {plant.imageUrl ? (
          <Image source={{ uri: plant.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderEmoji}>🌿</Text>
          </View>
        )}
        {/* Botón volver */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        {/* Badge de coincidencia */}
        {plant.probability && (
          <View style={styles.probBadge}>
            <Text style={styles.probText}>
              {(plant.probability * 100).toFixed(0)}% coincidencia
            </Text>
          </View>
        )}
      </View>

      {/* Nombre y especie */}
      <View style={styles.headerSection}>
        <Text style={styles.plantName}>{plant.name}</Text>
        {plant.commonNames?.length > 0 && (
          <Text style={styles.commonName}>{plant.commonNames[0]}</Text>
        )}

        {/* Estado de riego */}
        <View style={[styles.riegoStatus, necesitaRiego ? styles.riegoUrgente : styles.riegoBien]}>
          <Text style={styles.riegoStatusText}>
            {necesitaRiego
              ? `⚠️ Necesita riego (hace ${diasUltimoRiego} días)`
              : diasUltimoRiego === 0
              ? "✅ Regada hoy"
              : diasUltimoRiego === 1
              ? "✅ Regada ayer"
              : `💧 Último riego hace ${diasUltimoRiego ?? "—"} días`}
          </Text>
        </View>
      </View>

      {/* Botón regar */}
      <TouchableOpacity
        style={[styles.regarButton, regando && styles.regarButtonDisabled]}
        onPress={handleRegar}
        disabled={regando}
      >
        <Text style={styles.regarButtonText}>
          {regando ? "Registrando..." : "💧 Registrar riego hoy"}
        </Text>
      </TouchableOpacity>

      {/* Info rápida */}
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>📅</Text>
          <Text style={styles.infoLabel}>Último riego</Text>
          <Text style={styles.infoValue}>{formatFecha(plant.lastWatered)}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>💧</Text>
          <Text style={styles.infoLabel}>Frecuencia</Text>
          <Text style={styles.infoValue}>
            {plant.wateringFrequencyDays ? `Cada ${plant.wateringFrequencyDays} días` : "No definida"}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>📆</Text>
          <Text style={styles.infoLabel}>Agregada</Text>
          <Text style={styles.infoValue}>{formatFecha(plant.createdAt)}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>🎯</Text>
          <Text style={styles.infoLabel}>Próximo riego</Text>
          <Text style={styles.infoValue}>
            {plant.lastWatered && plant.wateringFrequencyDays
              ? (() => {
                  const last = plant.lastWatered.toDate
                    ? plant.lastWatered.toDate()
                    : new Date(plant.lastWatered);
                  const next = new Date(last.getTime() + plant.wateringFrequencyDays * 86400000);
                  const daysLeft = Math.ceil((next - Date.now()) / 86400000);
                  if (daysLeft <= 0) return "Hoy";
                  if (daysLeft === 1) return "Mañana";
                  return `En ${daysLeft} días`;
                })()
              : "No definido"}
          </Text>
        </View>
      </View>

      {/* Descripción */}
      {plant.description ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📖 Sobre esta planta</Text>
          <Text style={styles.cardText}>{plant.description}</Text>
        </View>
      ) : null}

      {/* Cuidados */}
      {(plant.watering || plant.light || plant.soilType || plant.toxicity) && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌱 Cuidados</Text>
          {plant.watering ? (
            <View style={styles.tipRow}>
              <Text style={styles.tipIcon}>💧</Text>
              <View style={styles.tipContent}>
                <Text style={styles.tipLabel}>Riego</Text>
                <Text style={styles.tipValue}>{plant.watering}</Text>
              </View>
            </View>
          ) : null}
          {plant.light ? (
            <View style={styles.tipRow}>
              <Text style={styles.tipIcon}>☀️</Text>
              <View style={styles.tipContent}>
                <Text style={styles.tipLabel}>Luz</Text>
                <Text style={styles.tipValue}>{plant.light}</Text>
              </View>
            </View>
          ) : null}
          {plant.soilType ? (
            <View style={styles.tipRow}>
              <Text style={styles.tipIcon}>🪴</Text>
              <View style={styles.tipContent}>
                <Text style={styles.tipLabel}>Suelo</Text>
                <Text style={styles.tipValue}>{plant.soilType}</Text>
              </View>
            </View>
          ) : null}
          {plant.toxicity ? (
            <View style={styles.tipRow}>
              <Text style={styles.tipIcon}>⚠️</Text>
              <View style={styles.tipContent}>
                <Text style={styles.tipLabel}>Toxicidad</Text>
                <Text style={styles.tipValue}>{plant.toxicity}</Text>
              </View>
            </View>
          ) : null}
        </View>
      )}

      {/* Botón eliminar */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteText}>🗑 Eliminar planta</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8faf7" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#888", fontSize: 15 },

  // Imagen
  imageContainer: { position: "relative", height: 300 },
  image: { width: "100%", height: 300, resizeMode: "cover" },
  imagePlaceholder: {
    width: "100%",
    height: 300,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderEmoji: { fontSize: 80 },
  backButton: {
    position: "absolute",
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: { color: "white", fontSize: 28, lineHeight: 32 },
  probBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  probText: { color: "white", fontSize: 12, fontWeight: "600" },

  // Header
  headerSection: { padding: 20, paddingBottom: 0 },
  plantName: { fontSize: 28, fontWeight: "800", color: "#1a2e1a", fontStyle: "italic" },
  commonName: { fontSize: 15, color: "#888", marginTop: 4, fontStyle: "italic" },
  riegoStatus: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  riegoBien: { backgroundColor: "#e8f5e9" },
  riegoUrgente: { backgroundColor: "#FBE9E7" },
  riegoStatusText: { fontSize: 13, fontWeight: "600", color: "#333" },

  // Botón regar
  regarButton: {
    backgroundColor: "#1565C0",
    marginHorizontal: 20,
    marginTop: 16,
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
  },
  regarButtonDisabled: { backgroundColor: "#90CAF9" },
  regarButtonText: { color: "white", fontWeight: "700", fontSize: 15 },

  // Grid de info
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: 16,
    marginTop: 16,
    gap: 10,
  },
  infoItem: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    width: "47%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  infoIcon: { fontSize: 20, marginBottom: 4 },
  infoLabel: { fontSize: 11, color: "#888", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  infoValue: { fontSize: 13, color: "#1a2e1a", fontWeight: "600", marginTop: 2 },

  // Cards
  card: {
    backgroundColor: "white",
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1a2e1a", marginBottom: 12 },
  cardText: { fontSize: 14, color: "#444", lineHeight: 22 },
  tipRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12, gap: 12 },
  tipIcon: { fontSize: 20, marginTop: 2 },
  tipContent: { flex: 1 },
  tipLabel: { fontSize: 11, color: "#888", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  tipValue: { fontSize: 14, color: "#333", marginTop: 2 },

  // Eliminar
  deleteButton: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ffcdd2",
    backgroundColor: "#fff8f8",
  },
  deleteText: { color: "#c62828", fontWeight: "600", fontSize: 14 },
});
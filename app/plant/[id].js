import { useLocalSearchParams, useRouter } from "expo-router";
import { deleteDoc, doc, getDoc, serverTimestamp, updateDoc, collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { auth, db } from "../../src/config/firebase";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../styles/colors";

const diasDesde = (timestamp) => {
  if (!timestamp) return null;
  const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return Math.floor((Date.now() - fecha.getTime()) / 86400000);
};

export default function PlantDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [plant, setPlant] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const handleDelete = () => {
  Alert.alert(
    "Eliminar planta",
    "¿Seguro que quieres eliminar esta planta?",
    [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            const user = auth.currentUser;

            await deleteDoc(
              doc(db, "users", user.uid, "plants", id)
            );

            router.replace("/(tabs)/garden");
          } catch (error) {
            console.log("Error eliminando:", error);
          }
        },
      },
    ]
  );
};

  useEffect(() => {
    const fetchPlant = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const snap = await getDoc(
        doc(db, "users", user.uid, "plants", id)
      );

      if (snap.exists()) {
        setPlant({ id: snap.id, ...snap.data() });
      }
    };

    fetchPlant();
  }, [id]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !id) return;

    const tasksRef = collection(db, "users", user.uid, "tasks");
    const q = query(
      tasksRef,
      where("plantId", "==", id),
      where("completed", "==", true),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setHistory(data);
      setLoadingHistory(false);
    });

    return unsubscribe;
  }, [id]);

  if (!plant) return null;

  const dias = diasDesde(plant.lastWatered);

  const handleWater = async () => {
    const user = auth.currentUser;

    await updateDoc(
      doc(db, "users", user.uid, "plants", id),
      {
        lastWatered: serverTimestamp(),
      }
    );

    setPlant((prev) => ({
      ...prev,
      lastWatered: { toDate: () => new Date() },
    }));
  };

  return (
    <ScrollView style={styles.container}>
      {/* HERO */}
      <View style={styles.hero}>
        <Image
          source={{
            uri:
              plant.imageUrl ||
              "https://via.placeholder.com/400x300.png?text=Plant",
          }}
          style={styles.image}
        />

        {/* BACK */}
        <TouchableOpacity
          style={styles.back}
          onPress={() => router.back()}
        >
          <Text style={{ color: "white", fontSize: 20 }}>‹</Text>
        </TouchableOpacity>
      </View>

      {/* CARD FLOTANTE */}
      <View style={styles.infoCard}>
        <Text style={styles.tag}>Planta</Text>
        <Text style={styles.name}>
          {plant.commonNames?.[0] || plant.name}
        </Text>

        <Text style={{ color: "#666", marginTop: 4 }}>
          {plant.name}
        </Text>
        <Text style={styles.location}>Interior</Text>
      </View>

      {/* RUTINA */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rutina de Cuidado</Text>

        <View style={styles.grid}>
          {/* RIEGO */}
          <View style={styles.box}>
            <Text style={styles.icon}>💧</Text>
            <Text style={styles.label}>Riego</Text>
            <Text style={styles.value}>
              Cada {plant.wateringFrequencyDays || 0} días
            </Text>
          </View>

          {/* LUZ */}
          <View style={styles.box}>
            <Text style={styles.icon}>☀️</Text>
            <Text style={styles.label}>Luz</Text>
            <Text style={styles.value}>
              {plant.light || "Sombra parcial"}
            </Text>
          </View>
        </View>
      </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Información</Text>

              {plant.description ? (
                <View style={styles.infoBox}>
                  <Text style={styles.infoTitle}>📖 Descripción</Text>
                  <Text style={styles.infoText}>{plant.description}</Text>
                </View>
              ) : null}

              {plant.soilType ? (
                <View style={styles.infoBox}>
                  <Text style={styles.infoTitle}>🪴 Suelo</Text>
                  <Text style={styles.infoText}>{plant.soilType}</Text>
                </View>
              ) : null}

              {plant.toxicity ? (
                <View style={styles.infoBox}>
                  <Text style={styles.infoTitle}>⚠️ Toxicidad</Text>
                  <Text style={styles.infoText}>{plant.toxicity}</Text>
                </View>
              ) : null}

              {plant.propagation?.length ? (
                <View style={styles.infoBox}>
                  <Text style={styles.infoTitle}>🌱 Propagación</Text>
                  <Text style={styles.infoText}>
                    {plant.propagation.join(", ")}
                  </Text>
                </View>
              ) : null}
            </View>
      {/* BOTÓN REGAR */}
      <TouchableOpacity style={styles.waterBtn} onPress={handleWater}>
        <Text style={styles.waterText}>💧 Regar hoy</Text>
      </TouchableOpacity>

      {/* IA CARD */}
      <View style={styles.aiCard}>
        <Text style={styles.aiTitle}>
          ¿Algo va mal con {plant.name}?
        </Text>
        <Text style={styles.aiText}>
          Detecta plagas, enfermedades o deficiencias.
        </Text>

        <TouchableOpacity
          style={styles.aiButton}
          onPress={() => router.push("/camera")}
        >
          <Text style={styles.aiButtonText}>
            Detectar problemas
          </Text>
        </TouchableOpacity>
      </View>

      {/* HISTORIAL */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historial de Cuidados</Text>
        
        {loadingHistory ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : history.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Ionicons name="calendar-outline" size={32} color="#ccc" />
            <Text style={styles.emptyHistoryText}>Sin actividades aún</Text>
          </View>
        ) : (
          Object.entries(groupTasksByDate(history)).map(([label, tasks]) => (
            <HistorySection key={label} title={label}>
              {tasks.map((task) => (
                <TimelineItem
                  key={task.id}
                  icon={getTaskIcon(task.type)}
                  title={getTaskTitle(task)}
                  time={formatTime(task.completedAt)}
                />
              ))}
            </HistorySection>
          ))
        )}
      </View>

      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteText}>Eliminar planta 🗑️</Text>
      </TouchableOpacity>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Componentes Auxiliares ──────────────────────────────────────────────────

function HistorySection({ title, children }) {
  return (
    <View style={styles.historySection}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyLabel}>{title}</Text>
        <View style={styles.historyLine} />
      </View>
      <View style={styles.historyTimeline}>{children}</View>
    </View>
  );
}

function TimelineItem({ icon, title, time }) {
  return (
    <View style={styles.historyItem}>
      <View style={styles.historyVerticalLine} />
      <View style={styles.historyDot} />
      <View style={styles.historyCard}>
        <View style={styles.historyIconContainer}>
          <Ionicons name={icon} size={18} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.historyRowBetween}>
            <Text style={styles.historyItemTitle}>{title}</Text>
            <Text style={styles.historyTime}>{time}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const groupTasksByDate = (tasks) => {
  const groups = {};
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  tasks.forEach((task) => {
    let label = task.date;
    if (task.date === today) label = "HOY";
    else if (task.date === yesterdayStr) label = "AYER";
    else {
      const [year, month, day] = task.date.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      label = date.toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
      }).toUpperCase();
    }
    if (!groups[label]) groups[label] = [];
    groups[label].push(task);
  });
  return groups;
};

const getTaskIcon = (type) => {
  switch (type) {
    case "watering": return "water-outline";
    case "fertilizing": return "flask-outline";
    case "pruning": return "leaf-outline";
    case "pest_control": return "bug-outline";
    default: return "flower-outline";
  }
};

const getTaskTitle = (task) => {
  const labels = {
    watering: "Riego",
    fertilizing: "Fertilización",
    pruning: "Poda",
    pest_control: "Control de plagas",
  };
  return labels[task.type] || "Cuidado";
};

const formatTime = (timestamp) => {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8f5" },

  hero: { height: 300 },
  image: { width: "100%", height: 300 },

  back: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  infoCard: {
    backgroundColor: "white",
    marginTop: -40,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
  },

  tag: {
    backgroundColor: "#dcedc8",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 5,
  },

  name: {
    fontSize: 22,
    fontWeight: "800",
  },

  location: {
    color: "#888",
    marginTop: 4,
  },

  section: {
    padding: 20,
  },

  sectionTitle: {
    fontWeight: "700",
    marginBottom: 10,
  },

  grid: {
    flexDirection: "row",
    gap: 10,
  },

  box: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },

  icon: { fontSize: 20 },

  label: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },

  value: {
    fontWeight: "700",
    marginTop: 4,
  },

  waterBtn: {
    marginHorizontal: 20,
    backgroundColor: "#2e7d32",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },

  waterText: {
    color: "white",
    fontWeight: "700",
  },

  aiCard: {
    backgroundColor: "#2e7d32",
    margin: 20,
    padding: 20,
    borderRadius: 20,
  },

  aiTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },

  aiText: {
    color: "#dcedc8",
    marginTop: 6,
  },

  aiButton: {
    backgroundColor: "white",
    marginTop: 15,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  aiButtonText: {
    color: "#2e7d32",
    fontWeight: "700",
  },

  infoBox: {
  backgroundColor: "white",
  padding: 14,
  borderRadius: 14,
  marginBottom: 10,
},

infoTitle: {
  fontWeight: "700",
  marginBottom: 4,
},

infoText: {
  color: "#444",
  lineHeight: 20,
},

deleteBtn: {
  marginHorizontal: 20,
  backgroundColor: "#e53935",
  padding: 14,
  borderRadius: 14,
  alignItems: "center",
  marginTop: 10,
},

deleteText: {
  color: "white",
  fontWeight: "700",
},

  // Estilos del Historial
  historySection: {
    marginBottom: 15,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  historyLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#888",
    letterSpacing: 1,
  },
  historyLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#eee",
    marginLeft: 10,
  },
  historyTimeline: {
    paddingLeft: 8,
  },
  historyItem: {
    marginBottom: 15,
    paddingLeft: 15,
  },
  historyVerticalLine: {
    position: "absolute",
    left: 4,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "#eee",
  },
  historyDot: {
    position: "absolute",
    left: 0,
    top: 10,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  historyIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  historyRowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyItemTitle: {
    fontWeight: "600",
    fontSize: 14,
    color: "#333",
  },
  historyTime: {
    fontSize: 10,
    color: "#999",
  },
  emptyHistory: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 15,
    marginTop: 10,
  },
  emptyHistoryText: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 5,
  },
});
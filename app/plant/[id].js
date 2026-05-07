import { useLocalSearchParams, useRouter } from "expo-router";
import { deleteDoc, doc, getDoc, serverTimestamp, updateDoc, collection, onSnapshot, query, where, orderBy, setDoc } from "firebase/firestore";
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
  Modal,
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
  const [showHistory, setShowHistory] = useState(false);

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

  const performActivity = async (type) => {
    const user = auth.currentUser;
    if (!user || !plant) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    const taskId = `${id}_${type}_${todayStr}`;

    try {
      const updateData = {};
      if (type === "watering") {
        updateData.lastWatered = serverTimestamp();
      } else {
        updateData[`carePlan.${type}.lastDate`] = serverTimestamp();
      }

      await updateDoc(doc(db, "users", user.uid, "plants", id), updateData);

      await setDoc(doc(db, "users", user.uid, "tasks", taskId), {
        plantId: id,
        type,
        date: todayStr,
        completed: true,
        completedAt: serverTimestamp(),
        name: plant.name,
        image: plant.imageUrl || null
      });

      setPlant((prev) => {
        const newPlant = { ...prev };
        const simulatedTimestamp = { toDate: () => new Date() };
        if (type === "watering") {
          newPlant.lastWatered = simulatedTimestamp;
        } else {
          if (!newPlant.carePlan) newPlant.carePlan = {};
          if (!newPlant.carePlan[type]) newPlant.carePlan[type] = {};
          newPlant.carePlan[type].lastDate = simulatedTimestamp;
        }
        return newPlant;
      });

      const labels = {
        watering: "Riego",
        fertilizing: "Fertilización",
        pruning: "Poda",
        pest_control: "Control de plagas"
      };

      Alert.alert("¡Excelente!", `${labels[type]} registrado correctamente para ${plant.commonNames?.[0] || plant.name}.`);
    } catch (error) {
      console.error(`Error al registrar ${type}:`, error);
      Alert.alert("Error", "No se pudo registrar la actividad.");
    }
  };

  const lastActivity = history[0];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* CARD FLOTANTE */}
        <View style={styles.infoCard}>
          <View style={styles.rowBetween}>
            <View>
               <Text style={styles.tag}>Planta</Text>
               <Text style={styles.name}>{plant.commonNames?.[0] || plant.name}</Text>
               <Text style={styles.scientificName}>{plant.name}</Text>
            </View>
            <View style={styles.locationBadge}>
               <Ionicons name="home-outline" size={14} color={COLORS.primary} />
               <Text style={styles.locationText}>Interior</Text>
            </View>
          </View>
        </View>

        {/* RUTINA DE CUIDADO (4 PILARES) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rutina de Cuidado</Text>
          <View style={styles.grid}>
            {/* RIEGO */}
            <View style={styles.box}>
              <View style={[styles.iconCircle, { backgroundColor: '#e3f2fd' }]}>
                <Ionicons name="water" size={20} color="#2196f3" />
              </View>
              <Text style={styles.label}>Riego</Text>
              <Text style={styles.value}>Cada {plant.wateringFrequencyDays || 0} días</Text>
            </View>

            {/* FERTILIZACIÓN */}
            <View style={styles.box}>
              <View style={[styles.iconCircle, { backgroundColor: '#efebe9' }]}>
                <Ionicons name="flask" size={20} color="#b38575" />
              </View>
              <Text style={styles.label}>Abono</Text>
              <Text style={styles.value}>Cada {plant.carePlan?.fertilizing?.frequencyDays || 30} días</Text>
            </View>
          </View>

          <View style={[styles.grid, { marginTop: 15 }]}>
            {/* PODA */}
            <View style={styles.box}>
              <View style={[styles.iconCircle, { backgroundColor: '#e8f5e9' }]}>
                <Ionicons name="leaf" size={20} color="#4caf50" />
              </View>
              <Text style={styles.label}>Poda</Text>
              <Text style={styles.value}>Cada {plant.carePlan?.pruning?.frequencyDays || 60} días</Text>
            </View>

            {/* CONTROL DE PLAGAS */}
            <View style={styles.box}>
              <View style={[styles.iconCircle, { backgroundColor: '#fff3e0' }]}>
                <Ionicons name="bug" size={20} color="#ff9800" />
              </View>
              <Text style={styles.label}>Plagas</Text>
              <Text style={styles.value}>Cada {plant.carePlan?.pest_control?.frequencyDays || 21} días</Text>
            </View>
          </View>
        </View>

        {/* REALIZAR AHORA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Realizar Ahora</Text>
          <View style={styles.quickActionRow}>
            {/* RIEGO */}
            <TouchableOpacity style={styles.quickActionBtn} onPress={() => performActivity('watering')}>
              <View style={[styles.quickActionCircle, { backgroundColor: '#e3f2fd' }]}>
                <Ionicons name="water" size={24} color="#2196f3" />
              </View>
              <Text style={styles.quickActionLabel}>Regar</Text>
            </TouchableOpacity>

            {/* FERTILIZACIÓN */}
            <TouchableOpacity style={styles.quickActionBtn} onPress={() => performActivity('fertilizing')}>
              <View style={[styles.quickActionCircle, { backgroundColor: '#efebe9' }]}>
                <Ionicons name="flask" size={24} color="#b38575" />
              </View>
              <Text style={styles.quickActionLabel}>Abonar</Text>
            </TouchableOpacity>

            {/* PODA */}
            <TouchableOpacity style={styles.quickActionBtn} onPress={() => performActivity('pruning')}>
              <View style={[styles.quickActionCircle, { backgroundColor: '#e8f5e9' }]}>
                <Ionicons name="leaf" size={24} color="#4caf50" />
              </View>
              <Text style={styles.quickActionLabel}>Podar</Text>
            </TouchableOpacity>

            {/* PLAGAS */}
            <TouchableOpacity style={styles.quickActionBtn} onPress={() => performActivity('pest_control')}>
              <View style={[styles.quickActionCircle, { backgroundColor: '#fff3e0' }]}>
                <Ionicons name="bug" size={24} color="#ff9800" />
              </View>
              <Text style={styles.quickActionLabel}>Plagas</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* HISTORIAL PREVIEW CARD */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actividad Reciente</Text>
          <TouchableOpacity 
            style={styles.historyPreviewCard} 
            onPress={() => setShowHistory(true)}
            activeOpacity={0.7}
          >
            <View style={styles.historyPreviewLeft}>
              <View style={styles.historyPreviewIcon}>
                <Ionicons 
                  name={lastActivity ? getTaskIcon(lastActivity.type) : "calendar-outline"} 
                  size={24} 
                  color={COLORS.primary} 
                />
              </View>
              <View>
                <Text style={styles.historyPreviewTitle}>
                  {lastActivity ? `Último: ${getTaskTitle(lastActivity)}` : "Sin actividades"}
                </Text>
                <Text style={styles.historyPreviewSubtitle}>
                  {lastActivity ? `Realizado el ${lastActivity.date}` : "Registra tu primer cuidado"}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* INFORMACIÓN */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información General</Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoBoxHalf}>
              <Text style={styles.infoTitle}>☀️ Luz</Text>
              <Text style={styles.infoText}>{plant.light || "Media"}</Text>
            </View>
            {plant.soilType ? (
              <View style={styles.infoBoxHalf}>
                <Text style={styles.infoTitle}>🪴 Suelo</Text>
                <Text style={styles.infoText}>{plant.soilType}</Text>
              </View>
            ) : null}
          </View>

          {plant.description ? (
            <View style={[styles.infoBox, { marginTop: 15 }]}>
              <Text style={styles.infoTitle}>📖 Descripción</Text>
              <Text style={styles.infoText}>{plant.description}</Text>
            </View>
          ) : null}
        </View>


        {/* BOTÓN REGAR */}
        <TouchableOpacity style={styles.waterBtn} onPress={() => performActivity('watering')}>

          <Ionicons name="water" size={20} color="white" style={{ marginRight: 8 }} />
          <Text style={styles.waterText}>Regar hoy</Text>
        </TouchableOpacity>

        {/* IA CARD */}
        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <Ionicons name="sparkles" size={24} color="white" />
            <Text style={styles.aiTitle}>Asistente IA</Text>
          </View>
          <Text style={styles.aiText}>
            ¿Ves manchas u hojas amarillas? Deja que nuestra IA diagnostique a {plant.name}.
          </Text>
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => router.push("/camera")}
          >
            <Text style={styles.aiButtonText}>Detectar Problemas</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteText}>Eliminar Planta 🗑️</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL DE HISTORIAL */}
      <Modal
        visible={showHistory}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBlur} 
            activeOpacity={1} 
            onPress={() => setShowHistory(false)} 
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <View style={styles.modalTitleRow}>
                <Text style={styles.modalTitle}>Historial de Cuidados</Text>
                <TouchableOpacity onPress={() => setShowHistory(false)}>
                  <Ionicons name="close-circle" size={28} color="#ccc" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {loadingHistory ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
              ) : history.length === 0 ? (
                <View style={styles.emptyHistoryModal}>
                  <Ionicons name="calendar-outline" size={64} color="#eee" />
                  <Text style={styles.emptyHistoryText}>Aún no hay registros para esta planta.</Text>
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
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
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
          <Text style={styles.historyDescription}>Tarea completada con éxito.</Text>
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
        year: "numeric"
      }).toUpperCase();
    }
    if (!groups[label]) groups[label] = [];
    groups[label].push(task);
  });
  return groups;
};

const getTaskIcon = (type) => {
  switch (type) {
    case "watering": return "water";
    case "fertilizing": return "flask";
    case "pruning": return "leaf";
    case "pest_control": return "bug";
    default: return "flower";
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
  container: { flex: 1, backgroundColor: "#f8faf7" },
  hero: { height: 350 },
  image: { width: "100%", height: "100%", borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  back: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    width: 45,
    height: 45,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  infoCard: {
    backgroundColor: "white",
    marginTop: -50,
    marginHorizontal: 20,
    padding: 25,
    borderRadius: 25,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  tag: {
    backgroundColor: COLORS.primaryLight,
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 8,
    textTransform: "uppercase"
  },
  name: { fontSize: 26, fontWeight: "800", color: "#1b1b1b" },
  scientificName: { fontSize: 14, fontStyle: "italic", color: "#888", marginTop: 2 },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4
  },
  locationText: { fontSize: 11, fontWeight: "600", color: "#666" },
  section: { padding: 20, paddingTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1b1b1b", marginBottom: 15 },
  grid: { flexDirection: "row", gap: 15 },
  box: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  label: { fontSize: 12, color: "#888", fontWeight: "600" },
  value: { fontWeight: "800", color: "#333", marginTop: 4 },
  historyPreviewCard: {
    flexDirection: "row",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 2,
  },
  historyPreviewLeft: { flexDirection: "row", alignItems: "center", gap: 15 },
  historyPreviewIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  historyPreviewTitle: { fontWeight: "700", fontSize: 15, color: "#333" },
  historyPreviewSubtitle: { fontSize: 12, color: "#888", marginTop: 2 },
  quickActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 25,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  quickActionBtn: { alignItems: "center", gap: 8 },
  quickActionCircle: {
    width: 55,
    height: 55,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  quickActionLabel: { fontSize: 10, fontWeight: "700", color: "#666" },
  infoGrid: { flexDirection: "row", gap: 15 },

  infoBoxHalf: { flex: 1, backgroundColor: "white", padding: 20, borderRadius: 20, elevation: 1 },
  infoBox: { backgroundColor: "white", padding: 20, borderRadius: 20, marginBottom: 15, elevation: 1 },
  infoTitle: { fontWeight: "700", fontSize: 15, color: COLORS.primary, marginBottom: 8 },
  infoText: { color: "#555", lineHeight: 22, fontSize: 14 },

  waterBtn: {
    marginHorizontal: 20,
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  waterText: { color: "white", fontWeight: "700", fontSize: 16 },
  aiCard: {
    backgroundColor: COLORS.primary,
    margin: 20,
    padding: 25,
    borderRadius: 25,
    elevation: 5,
  },
  aiHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  aiTitle: { color: "white", fontSize: 18, fontWeight: "800" },
  aiText: { color: "rgba(255,255,255,0.8)", lineHeight: 22, fontSize: 14, marginBottom: 20 },
  aiButton: { backgroundColor: "white", padding: 15, borderRadius: 15, alignItems: "center" },
  aiButtonText: { color: COLORS.primary, fontWeight: "800" },
  deleteBtn: { marginTop: 20, alignItems: "center", padding: 20 },
  deleteText: { color: "#ff8a80", fontWeight: "600", fontSize: 14 },

  // MODAL STYLES
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  modalBlur: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: "80%",
    padding: 25,
    elevation: 20,
  },
  modalHeader: { alignItems: "center", marginBottom: 20 },
  modalHandle: { width: 40, height: 5, backgroundColor: "#eee", borderRadius: 10, marginBottom: 20 },
  modalTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" },
  modalTitle: { fontSize: 22, fontWeight: "800", color: "#1b1b1b" },
  modalScroll: { flex: 1 },
  historySection: { marginBottom: 25 },
  historyHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  historyLabel: { fontSize: 11, fontWeight: "800", color: "#aaa", letterSpacing: 1 },
  historyLine: { flex: 1, height: 1, backgroundColor: "#f0f0f0", marginLeft: 15 },
  historyTimeline: { paddingLeft: 10 },
  historyItem: { marginBottom: 20, paddingLeft: 20 },
  historyVerticalLine: { position: "absolute", left: 4, top: 0, bottom: 0, width: 2, backgroundColor: "#f0f0f0" },
  historyDot: { position: "absolute", left: -1, top: 12, width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary, borderWidth: 2, borderColor: "white" },
  historyCard: { backgroundColor: "#f9fbf9", padding: 15, borderRadius: 20, flexDirection: "row", gap: 15, alignItems: "center" },
  historyIconContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: "white", justifyContent: "center", alignItems: "center", elevation: 1 },
  historyRowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  historyItemTitle: { fontWeight: "700", fontSize: 15, color: "#333" },
  historyTime: { fontSize: 11, color: "#999" },
  historyDescription: { fontSize: 12, color: "#777", marginTop: 4 },
  emptyHistoryModal: { alignItems: "center", justifyContent: "center", marginTop: 100, opacity: 0.5 },
  emptyHistoryText: { color: "#888", marginTop: 15, textAlign: "center" },
});
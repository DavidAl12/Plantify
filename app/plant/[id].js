import { useLocalSearchParams, useRouter } from "expo-router";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../../src/config/firebase";
import { getAppNow, getAppTodayString, getFirestoreNow, parseLocalDate } from "../../src/utils/dateUtils";
import { COLORS } from "../../styles/colors";

const diasDesde = (timestamp) => {
  if (!timestamp) return null;
  const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return Math.floor((getAppNow().getTime() - fecha.getTime()) / 86400000);
};

export default function PlantDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [plant, setPlant] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  // ESTADOS PARA EDICIÓN
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editWatering, setEditWatering] = useState("");
  const [editFertilizing, setEditFertilizing] = useState("");
  const [editPruning, setEditPruning] = useState("");
  const [editPest, setEditPest] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const handleEdit = () => {
    setEditName(plant.commonNames?.[0] || plant.name || "");
    setEditWatering(String(plant.wateringFrequencyDays || ""));
    setEditFertilizing(
      String(plant.carePlan?.fertilizing?.frequencyDays || ""),
    );
    setEditPruning(String(plant.carePlan?.pruning?.frequencyDays || ""));
    setEditPest(String(plant.carePlan?.pest_control?.frequencyDays || ""));
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    if (!editName) {
      Alert.alert(
        "Campo requerido",
        "Por favor ingresa un nombre para la planta.",
      );
      return;
    }

    setSavingEdit(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const plantRef = doc(db, "users", user.uid, "plants", id);

      await updateDoc(plantRef, {
        name: editName,
        commonNames: [editName],
        wateringFrequencyDays: Number(editWatering) || 0,
        "carePlan.fertilizing.frequencyDays": Number(editFertilizing) || 0,
        "carePlan.pruning.frequencyDays": Number(editPruning) || 0,
        "carePlan.pest_control.frequencyDays": Number(editPest) || 0,
      });

      setShowEdit(false);
      Alert.alert("¡Éxito!", "Planta actualizada correctamente.");
    } catch (error) {
      console.error("Error al guardar:", error);
      Alert.alert("Error", "Hubo un problema al guardar los cambios.");
    } finally {
      setSavingEdit(false);
    }
  };

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
              if (!user) return;

              const batch = writeBatch(db);
              const taskQuery = query(
                collection(db, "users", user.uid, "tasks"),
                where("plantId", "==", id),
              );
              const taskSnapshots = await getDocs(taskQuery);

              taskSnapshots.forEach((taskDoc) => {
                batch.delete(doc(db, "users", user.uid, "tasks", taskDoc.id));
              });

              batch.delete(doc(db, "users", user.uid, "plants", id));
              await batch.commit();

              router.replace("/(tabs)/garden");
            } catch (error) {
              console.log("Error eliminando:", error);
            }
          },
        },
      ],
    );
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !id) return;

    const plantRef = doc(db, "users", user.uid, "plants", id);
    const unsubscribe = onSnapshot(plantRef, (snap) => {
      if (snap.exists()) {
        setPlant({ id: snap.id, ...snap.data() });
      }
    });

    return unsubscribe;
  }, [id]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !id) return;

    const tasksRef = collection(db, "users", user.uid, "tasks");
    const q = query(
      tasksRef,
      where("plantId", "==", id),
      where("completed", "==", true),
      orderBy("date", "desc"),
      orderBy("completedAt", "desc"),
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

    const todayStr = getAppTodayString();

    const taskId = `${id}_${type}_${todayStr}`;

    try {
      const updateData = {};
      if (type === "watering") {
        updateData.lastWatered = getFirestoreNow();
      } else {
        updateData[`carePlan.${type}.lastDate`] = getFirestoreNow();
      }

      await updateDoc(doc(db, "users", user.uid, "plants", id), updateData);

      await setDoc(doc(db, "users", user.uid, "tasks", taskId), {
        plantId: id,
        type,
        date: todayStr,
        completed: true,
        completedAt: getFirestoreNow(),
        name: plant.name,
        image: plant.imageUrl || null,
      });

      setPlant((prev) => {
        const newPlant = { ...prev };
        const simulatedTimestamp = { toDate: () => getAppNow() };
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
        pest_control: "Control de plagas",
      };

      Alert.alert(
        "¡Excelente!",
        `${labels[type]} registrado correctamente para ${plant.commonNames?.[0] || plant.name}.`,
      );
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
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>

          {/* ACCIONES SUPERIOR DERECHA */}
          <View style={styles.topActions}>
            <TouchableOpacity style={styles.editBtnTop} onPress={handleEdit}>
              <Ionicons name="pencil" size={20} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteBtnTop}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={20} color="#ff5252" />
            </TouchableOpacity>
          </View>
        </View>

        {/* CARD FLOTANTE */}
        <View style={styles.infoCard}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.tag}>Planta</Text>
              <Text style={styles.name}>
                {plant.commonNames?.[0] || plant.name}
              </Text>
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
              <View style={[styles.iconCircle, { backgroundColor: "#e3f2fd" }]}>
                <Ionicons name="water" size={20} color="#2196f3" />
              </View>
              <Text style={styles.label}>Riego</Text>
              <Text style={styles.value}>
                Cada {plant.wateringFrequencyDays || 0} días
              </Text>
            </View>

            {/* FERTILIZACIÓN */}
            <View style={styles.box}>
              <View style={[styles.iconCircle, { backgroundColor: "#efebe9" }]}>
                <Ionicons name="flask" size={20} color="#b38575" />
              </View>
              <Text style={styles.label}>Abono</Text>
              <Text style={styles.value}>
                Cada {plant.carePlan?.fertilizing?.frequencyDays || 30} días
              </Text>
            </View>
          </View>

          <View style={[styles.grid, { marginTop: 15 }]}>
            {/* PODA */}
            <View style={styles.box}>
              <View style={[styles.iconCircle, { backgroundColor: "#e8f5e9" }]}>
                <Ionicons name="leaf" size={20} color="#4caf50" />
              </View>
              <Text style={styles.label}>Poda</Text>
              <Text style={styles.value}>
                Cada {plant.carePlan?.pruning?.frequencyDays || 60} días
              </Text>
            </View>

            {/* CONTROL DE PLAGAS */}
            <View style={styles.box}>
              <View style={[styles.iconCircle, { backgroundColor: "#fff3e0" }]}>
                <Ionicons name="bug" size={20} color="#ff9800" />
              </View>
              <Text style={styles.label}>Plagas</Text>
              <Text style={styles.value}>
                Cada {plant.carePlan?.pest_control?.frequencyDays || 21} días
              </Text>
            </View>
          </View>
        </View>

        {/* REALIZAR AHORA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Realizar Ahora</Text>
          <View style={styles.quickActionRow}>
            {/* RIEGO */}
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => performActivity("watering")}
            >
              <View
                style={[
                  styles.quickActionCircle,
                  { backgroundColor: "#e3f2fd" },
                ]}
              >
                <Ionicons name="water" size={24} color="#2196f3" />
              </View>
              <Text style={styles.quickActionLabel}>Regar</Text>
            </TouchableOpacity>

            {/* FERTILIZACIÓN */}
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => performActivity("fertilizing")}
            >
              <View
                style={[
                  styles.quickActionCircle,
                  { backgroundColor: "#efebe9" },
                ]}
              >
                <Ionicons name="flask" size={24} color="#b38575" />
              </View>
              <Text style={styles.quickActionLabel}>Abonar</Text>
            </TouchableOpacity>

            {/* PODA */}
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => performActivity("pruning")}
            >
              <View
                style={[
                  styles.quickActionCircle,
                  { backgroundColor: "#e8f5e9" },
                ]}
              >
                <Ionicons name="leaf" size={24} color="#4caf50" />
              </View>
              <Text style={styles.quickActionLabel}>Podar</Text>
            </TouchableOpacity>

            {/* PLAGAS */}
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => performActivity("pest_control")}
            >
              <View
                style={[
                  styles.quickActionCircle,
                  { backgroundColor: "#fff3e0" },
                ]}
              >
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
                  name={
                    lastActivity
                      ? getTaskIcon(lastActivity.type)
                      : "calendar-outline"
                  }
                  size={24}
                  color={COLORS.primary}
                />
              </View>
              <View>
                <Text style={styles.historyPreviewTitle}>
                  {lastActivity
                    ? `Último: ${getTaskTitle(lastActivity)}`
                    : "Sin actividades"}
                </Text>
                <Text style={styles.historyPreviewSubtitle}>
                  {lastActivity
                    ? `Realizado el ${lastActivity.date}`
                    : "Registra tu primer cuidado"}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* INFORMACIÓN GENERAL CONSOLIDADA */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información General</Text>
          <View style={styles.infoBox}>
            {/* DESCRIPCIÓN */}
            {plant.description ? (
              <View style={styles.infoItemVertical}>
                <Text style={styles.infoTitle}>📖 Descripción</Text>
                <Text style={styles.infoText}>{plant.description}</Text>
              </View>
            ) : null}

            {/* LUZ */}
            <View style={styles.infoItemVertical}>
              <Text style={styles.infoTitle}>☀️ Luz</Text>
              <Text style={styles.infoText}>{plant.light || "Media"}</Text>
            </View>

            {/* SUELO */}
            {plant.soilType ? (
              <View style={styles.infoItemVertical}>
                <Text style={styles.infoTitle}>🪴 Suelo</Text>
                <Text style={styles.infoText}>{plant.soilType}</Text>
              </View>
            ) : null}

            {/* TOXICIDAD */}
            {plant.toxicity ? (
              <View style={styles.infoItemVertical}>
                <Text style={styles.infoTitle}>⚠️ Toxicidad</Text>
                <Text style={styles.infoText}>{plant.toxicity}</Text>
              </View>
            ) : null}
          </View>
        </View>

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

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              {loadingHistory ? (
                <ActivityIndicator
                  size="large"
                  color={COLORS.primary}
                  style={{ marginTop: 50 }}
                />
              ) : history.length === 0 ? (
                <View style={styles.emptyHistoryModal}>
                  <Ionicons name="calendar-outline" size={64} color="#eee" />
                  <Text style={styles.emptyHistoryText}>
                    Aún no hay registros para esta planta.
                  </Text>
                </View>
              ) : (
                Object.entries(groupTasksByDate(history)).map(
                  ([label, tasks], groupIndex) => (
                    <HistorySection key={label} title={label}>
                      {tasks.map((task, index) => (
                        <TimelineItem
                          key={task.id}
                          icon={getTaskIcon(task.type)}
                          type={task.type}
                          title={getTaskTitle(task)}
                          time={formatTime(task.completedAt)}
                          showDot={groupIndex === 0 && index === 0}
                        />
                      ))}
                    </HistorySection>
                  ),
                )
              )}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL DE EDICIÓN */}
      <Modal
        visible={showEdit}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowEdit(false)}
      >
        <View style={styles.editModalOverlay}>
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Editar Planta 🌱</Text>
              <TouchableOpacity onPress={() => setShowEdit(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.editLabel}>Nombre de la planta</Text>
              <TextInput
                style={styles.editInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Ej: Monstera deliciosa"
              />

              <View style={styles.editDivider} />
              <Text style={styles.editSectionSubtitle}>Frecuencias (días)</Text>

              <View style={styles.editInputGroup}>
                <View style={styles.editInputHalf}>
                  <Text style={styles.editLabel}>💧 Riego</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editWatering}
                    onChangeText={setEditWatering}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.editInputHalf}>
                  <Text style={styles.editLabel}>🟤 Abono</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editFertilizing}
                    onChangeText={setEditFertilizing}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.editInputGroup}>
                <View style={styles.editInputHalf}>
                  <Text style={styles.editLabel}>🌿 Poda</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editPruning}
                    onChangeText={setEditPruning}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.editInputHalf}>
                  <Text style={styles.editLabel}>🟠 Plagas</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editPest}
                    onChangeText={setEditPest}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.editSaveBtn, savingEdit && { opacity: 0.7 }]}
                onPress={handleSaveEdit}
                disabled={savingEdit}
              >
                {savingEdit ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.editSaveBtnText}>Guardar Cambios</Text>
                )}
              </TouchableOpacity>
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
      <View style={styles.historyTimeline}>
        <View style={styles.historyVerticalLine} />
        {children}
      </View>
    </View>
  );
}

function TimelineItem({ icon, title, time, showDot, type }) {
  const color = getTaskColor(type);
  return (
    <View style={styles.historyItem}>
      {showDot && (
        <View style={[styles.historyDot, { backgroundColor: color }]} />
      )}
      <View style={styles.historyCard}>
        <View style={styles.historyIconContainer}>
          <Ionicons name={icon} size={18} color={color} />
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.historyRowBetween}>
            <Text style={styles.historyItemTitle}>{title}</Text>
            <Text style={styles.historyTime}>{time}</Text>
          </View>
          <Text style={styles.historyDescription}>
            Tarea completada con éxito.
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const groupTasksByDate = (tasks) => {
  const groups = {};

  const now = getAppNow();
  now.setHours(0, 0, 0, 0); // Normalizar hoy a medianoche local

  tasks.forEach((task) => {
    // 1. Parsear la fecha de la tarea (YYYY-MM-DD)
    const taskDate = parseLocalDate(task.date);
    taskDate.setHours(0, 0, 0, 0); // Normalizar tarea a medianoche

    // 2. Calcular diferencia en días
    const diffTime = now.getTime() - taskDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    let label = "";

    if (diffDays === 0) {
      label = "HOY";
    } else if (diffDays === 1) {
      label = "AYER";
    } else if (diffDays < 7) {
      // Nombre del día (ej: LUNES)
      label = taskDate
        .toLocaleDateString("es-CO", { weekday: "long" })
        .toUpperCase();
    } else {
      // Fecha completa (ej: 7 DE MAYO DE 2026)
      label = taskDate
        .toLocaleDateString("es-CO", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
        .toUpperCase();
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(task);
  });
  return groups;
};

const getTaskIcon = (type) => {
  switch (type) {
    case "watering":
      return "water";
    case "fertilizing":
      return "flask";
    case "pruning":
      return "leaf";
    case "pest_control":
      return "bug";
    default:
      return "flower";
  }
};

const getTaskColor = (type) => {
  const colors = {
    watering: "#2196f3",
    fertilizing: "#b38575",
    pruning: "#4caf50",
    pest_control: "#ff9800",
  };
  return colors[type] || COLORS.primary;
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
  topActions: {
    position: "absolute",
    top: 50,
    right: 20,
    flexDirection: "row",
    gap: 12,
  },
  editBtnTop: {
    backgroundColor: "white",
    width: 45,
    height: 45,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  deleteBtnTop: {
    backgroundColor: "#ffebee",
    width: 45,
    height: 45,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },

  image: {
    width: "100%",
    height: "100%",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
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
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
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
    textTransform: "uppercase",
  },
  name: { fontSize: 26, fontWeight: "800", color: "#1b1b1b" },
  scientificName: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#888",
    marginTop: 2,
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  locationText: { fontSize: 11, fontWeight: "600", color: "#666" },
  section: { padding: 20, paddingTop: 10 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1b1b1b",
    marginBottom: 15,
  },
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
  infoGrid: { gap: 15 },
  infoItemVertical: { marginBottom: 15 },

  infoBox: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 25,
    marginBottom: 15,
    elevation: 1,
  },
  infoTitle: {
    fontWeight: "700",
    fontSize: 15,
    color: COLORS.primary,
    marginBottom: 8,
  },
  infoTitleMini: { fontWeight: "700", fontSize: 14, color: COLORS.primary },
  infoText: { color: "#555", lineHeight: 22, fontSize: 14 },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
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
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#eee",
    borderRadius: 10,
    marginBottom: 20,
  },
  modalTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  modalTitle: { fontSize: 22, fontWeight: "800", color: "#1b1b1b" },
  modalScroll: { flex: 1 },
  historySection: { marginBottom: 25 },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  historyLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#aaa",
    letterSpacing: 1,
  },
  historyLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#f0f0f0",
    marginLeft: 15,
  },
  historyTimeline: { paddingLeft: 10, position: "relative" },
  historyItem: { marginBottom: 20, paddingLeft: 25 },
  historyVerticalLine: {
    position: "absolute",
    left: 14,
    top: 0,
    bottom: 20,
    width: 2,
    backgroundColor: "#f0f0f0",
  },
  historyDot: {
    position: "absolute",
    left: 9,
    top: 28,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: "white",
    zIndex: 10,
  },

  historyCard: {
    backgroundColor: "#f9fbf9",
    padding: 15,
    borderRadius: 20,
    flexDirection: "row",
    gap: 15,
    alignItems: "center",
  },
  historyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    elevation: 1,
  },
  historyRowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyItemTitle: { fontWeight: "700", fontSize: 15, color: "#333" },
  historyTime: { fontSize: 12, color: "#999" },
  historyDescription: { fontSize: 13, color: "#777", marginTop: 4 },

  // EDIT MODAL STYLES
  editModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  editModalContent: {
    backgroundColor: "white",
    borderRadius: 30,
    padding: 25,
    maxHeight: "80%",
  },
  editModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  editModalTitle: { fontSize: 22, fontWeight: "800", color: "#1a2e1a" },
  editLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#444",
    marginBottom: 8,
    marginTop: 15,
  },
  editInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: "#333",
  },
  editDivider: { height: 1, backgroundColor: "#eee", marginVertical: 20 },
  editSectionSubtitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 10,
  },
  editInputGroup: { flexDirection: "row", gap: 15 },
  editInputHalf: { flex: 1 },
  editSaveBtn: {
    marginTop: 30,
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
  },
  editSaveBtnText: { color: "white", fontWeight: "800", fontSize: 16 },

  emptyHistoryModal: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
    opacity: 0.5,
  },
  emptyHistoryText: { color: "#888", marginTop: 15, textAlign: "center" },
});

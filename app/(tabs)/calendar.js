import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import AppHeader from "../../components/ui/AppHeader";
import { auth, db } from "../../src/config/firebase";
import { useAlert } from "../../src/context/AlertContext";
import { COLORS } from "../../styles/colors";

import { generateFullSchedule } from "../../src/utils/calendarUtils";
import { getAppTodayString, getFirestoreNow, parseLocalDate } from "../../src/utils/dateUtils";

const TASK_COLORS = {
  watering: "#4FC3F7",
  fertilizing: "#b38575ff",
  pruning: "#81C784",
  pest_control: "#ffb34fff",
};

const formatDatePretty = (dateStr) => {
  if (!dateStr) return "";

  // 🔑 Parsear manualmente para evitar que JS lo trate como UTC
  const date = parseLocalDate(dateStr);

  return date.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
};

export default function CalendarScreen() {
  const scrollRef = useRef(null);
  const today = getAppTodayString();

  const { date: selectedDateParam } = useLocalSearchParams();
  const [selectedDate, setSelectedDate] = useState(() => selectedDateParam || today);

  useEffect(() => {
    if (selectedDateParam && selectedDateParam !== selectedDate) {
      setSelectedDate(selectedDateParam);
    }
  }, [selectedDateParam, selectedDate]);

  const [plants, setPlants] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [schedule, setSchedule] = useState({});
  const { showAlert } = useAlert();

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, []),
  );

  // Cargar plantas
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const ref = collection(db, "users", user.uid, "plants");

    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPlants(data);
    });

    return unsubscribe;
  }, []);

  // Cargar tareas completadas
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const ref = collection(db, "users", user.uid, "tasks");

    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setCompletedTasks(data);
    });

    return unsubscribe;
  }, []);

  //Generar calendario SOLO cuando cambian datos reales
  useEffect(() => {
    const generated = generateFullSchedule(plants, completedTasks);
    setSchedule(generated);
  }, [plants, completedTasks]);

  // Limpiar tareas huérfanas de plantas que ya no están en el jardín
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || plants.length === 0 || completedTasks.length === 0) return;

    const plantIds = new Set(plants.map((p) => p.id));
    const orphanTasks = completedTasks.filter(
      (t) => t.plantId && !plantIds.has(t.plantId),
    );

    if (orphanTasks.length > 0) {
      orphanTasks.forEach(async (task) => {
        try {
          await deleteDoc(doc(db, "users", user.uid, "tasks", task.id));
          console.log("Tarea huérfana eliminada:", task.id);
        } catch (e) {
          console.error("Error al eliminar tarea huérfana:", e);
        }
      });
    }
  }, [plants, completedTasks]);

  // MARCADO OPTIMIZADO (no recalcular en cada render)
  const markedDates = useMemo(() => {
    const marks = {};

    Object.keys(schedule).forEach((date) => {
      const tasks = schedule[date];
      const pendingTasks = tasks.filter((t) => !t.completed);
      if (pendingTasks.length === 0) return;

      const hasOverdue = date < today;

      if (hasOverdue) {
        marks[date] = {
          dots: [{ key: "pending_overdue", color: "#F44336" }],
        };
        return;
      }

      const uniqueTypes = [...new Set(pendingTasks.map((t) => t.type))];

      marks[date] = {
        dots: uniqueTypes.map((type) => ({
          key: type,
          color: TASK_COLORS[type],
        })),
      };
    });

    // mantener selección sin dañar fechas
    if (selectedDate) {
      marks[selectedDate] = {
        ...marks[selectedDate],
        selected: true,
        selectedColor: COLORS.primary,
      };
    }

    return marks;
  }, [schedule, selectedDate, today]);

  // 🔑 tareas del día seleccionado (NO recalcula nada)
  const selectedTasks = useMemo(() => {
    return schedule[selectedDate] || [];
  }, [schedule, selectedDate]);

  const confirmTaskCompletion = (task) => {
    const today = getAppTodayString();

    if (selectedDate > today) {
      showAlert({
        title: "No puedes marcar tareas futuras",
        message: "Solo puedes marcar tareas para hoy o días anteriores.",
        confirmLabel: "Entendido",
      });
      return;
    }

    if (task.completed) {
      showAlert({
        title: "Tarea ya completada",
        message: "Esta tarea ya fue marcada como realizada y no puede revertirse.",
        confirmLabel: "Entendido",
      });
      return;
    }

    showAlert({
      title: "Confirmar tarea",
      message: "¿Deseas marcar esta tarea como completada? Esta acción no se puede revertir.",
      details: getTaskLabel(task),
      confirmLabel: "Confirmar",
      cancelLabel: "Cancelar",
      confirmColor: "#2e7d32",
      cancelColor: "#c62828",
      onConfirm: () => completeTask(task),
    });
  };

  const completeTask = async (task) => {
    if (!task) return;

    const user = auth.currentUser;
    if (!user) return;

    const todayStr = getAppTodayString();

    // Registrar la actividad en la fecha que la app considera como hoy.
    const actualTaskId = `${task.plantId}_${task.type}_${todayStr}`;
    const taskRef = doc(db, "users", user.uid, "tasks", actualTaskId);
    const plantRef = doc(db, "users", user.uid, "plants", task.plantId);

    try {
      await setDoc(taskRef, {
        id: actualTaskId,
        plantId: task.plantId,
        type: task.type,
        name: task.name,
        image: task.image || null,
        date: todayStr,
        completed: true,
        completedAt: getFirestoreNow(),
      });

      const updateData = {};
      if (task.type === "watering") {
        updateData.lastWatered = getFirestoreNow();
      } else {
        updateData[`carePlan.${task.type}.lastDate`] = getFirestoreNow();
      }

      await updateDoc(plantRef, updateData);
    } catch (error) {
      console.error("Error al completar tarea:", error);
    }
  };

  // 🏷️ Etiquetas bonitas
  const getTaskLabel = (task) => {
    const labels = {
      watering: "💧 Regar",
      fertilizing: "🌿 Fertilizar",
      pruning: "✂️ Podar",
      pest_control: "🐛 Control plagas",
    };

    return `${labels[task.type] || "🌱"} ${getPlantName(task)}`;
  };

  const getPlantName = (task) => {
    const plant = plants.find((p) => p.id === task.plantId);

    if (!plant) return task.name;

    return plant.commonNames?.[0] || plant.name;
  };

  // Título sin emoji, para jerarquía visual
  const getTaskTitle = (task) => {
    const titles = {
      watering: `Riego de ${getPlantName(task)}`,
      fertilizing: `Fertilización de ${getPlantName(task)}`,
      pruning: `Poda de ${getPlantName(task)}`,
      pest_control: `Control de plagas de ${getPlantName(task)}`,
    };

    return titles[task.type] || `Actividad de ${getPlantName(task)}`;
  };

  // Descripción breve de la tarea (para mostrar bajo el título)
  const getTaskDescription = (task) => {
    const desc = {
      watering: "Riega la planta hasta que el sustrato esté húmedo pero no encharcado.",
      fertilizing: "Aplica fertilizante ligero siguiendo la dosis recomendada.",
      pruning: "Corta o elimina las hojas o brotes marchitos.",
      pest_control: "Revisa y trata signos de plagas o infestaciones.",
    };

    return desc[task.type] || "Revisa y atiende la planta según necesidad.";
  };

  return (
    <View style={styles.container}>
      <AppHeader />

      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Calendario</Text>
          <Text style={styles.bannerText}>
            Aquí puedes ver cuándo tus plantas necesitan atención. ¡No olvides
            mantener tu jardín siempre saludable!
          </Text>
        </View>

        <View style={styles.calendarContainer}>
          <Calendar
            markingType="multi-dot"
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            renderArrow={(direction) => (
              <Ionicons
                name={direction === 'left' ? 'chevron-back' : 'chevron-forward'}
                size={24}
                color="#555"
              />
            )}
            theme={{
              todayTextColor: COLORS.primary,
              arrowColor: "#666",
              monthTextColor: COLORS.primary,
              textMonthFontWeight: "bold",
              textSectionTitleColor: "#000",
            }}
          />
        </View>

        <View style={styles.tasksSection}>
          <View style={styles.tasksHeader}>
            <Text style={styles.tasksTitle}>Tareas Diarias</Text>

            <View style={styles.dateBadge}>
              <Text style={styles.dateBadgeText}>
                {formatDatePretty(selectedDate)}
              </Text>
            </View>
          </View>

          {selectedTasks.length === 0 ? (
            <View style={styles.noTasksCard}>
              <Text style={styles.noTasksCardText}>¡Increíble — hoy nos podemos tomar un descanso, así como nuestras plantas!</Text>
            </View>
          ) : (
            selectedTasks.map((task) => {
              const isOverdue = !task.completed && task.date < today;
              return (
                <View key={task.id} style={[styles.taskCard, task.completed && styles.taskCardCompleted]}>
                  {/* Left: small image */}
                  <View style={styles.taskImageContainer}>
                    {task.image ? (
                      <Image
                        source={{ uri: task.image }}
                        style={[styles.taskImage, task.completed && styles.taskImageCompleted]}
                      />
                    ) : (
                      <View style={[styles.taskImagePlaceholder, task.completed && styles.taskImageCompleted]} />
                    )}
                  </View>

                  {/* Center: main content (title + description) */}
                  <View style={styles.taskMain}>
                    <Text style={[styles.taskMainTitle, task.completed && styles.taskTitleCompleted]}>
                      {getTaskTitle(task)}
                    </Text>
                    <Text style={styles.taskMainDesc}>
                      {getTaskDescription(task)}
                    </Text>
                    {isOverdue && (
                      <TouchableOpacity
                        style={styles.performNowBtn}
                        onPress={() => confirmTaskCompletion(task)}
                      >
                        <Ionicons name="flash" size={14} color="white" />
                        <Text style={styles.performNowBtnText}>Realizar ahora</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Right: action checkbox */}
                  <TouchableOpacity
                    style={[
                      styles.taskAction,
                      isOverdue && styles.taskActionOverdue
                    ]}
                    onPress={() => confirmTaskCompletion(task)}
                    disabled={task.completed}
                  >
                    <Ionicons
                      name={task.completed ? "checkmark-circle" : (isOverdue ? "close" : "ellipse-outline")}
                      size={isOverdue ? 16 : 28}
                      color={task.completed ? COLORS.primary : (isOverdue ? "white" : "gray")}
                    />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  calendarContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },

  banner: {
    backgroundColor: COLORS.primaryContainer,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },

  bannerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.onPrimary,
  },

  bannerText: {
    fontSize: 12,
    color: COLORS.onPrimary,
  },

  tasksSection: {
    marginTop: 20,
  },

  noTasks: {
    color: COLORS.onSurfaceVariant,
  },

  noTasksCard: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 22,
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },

  noTasksCardText: {
    fontWeight: "800",
    fontSize: 16,
    color: "#2b2b2b",
    textAlign: "center",
  },

  taskCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "white",
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
  },

  taskAction: {
    marginLeft: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  tasksHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  taskLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  taskTitle: {
    fontSize: 16,
    color: "#1b1b1b",
    fontWeight: "500",
    flexShrink: 1,
  },

  taskImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: "hidden",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  taskImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },

  taskImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: "#eef6ea",
  },

  taskMain: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },

  taskMainTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#13320f",
  },

  taskMainDesc: {
    fontSize: 13,
    color: "#556254",
    marginTop: 4,
  },

  dateBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  dateBadgeText: {
    color: COLORS.primary,
    fontWeight: "600",
  },

  tasksTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
  },

  taskCardCompleted: {
    opacity: 0.6,
  },

  taskImageCompleted: {
    opacity: 0.6,
  },

  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#888',
  },

  taskActionOverdue: {
    backgroundColor: "#F44336",
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },

  performNowBtn: {
    backgroundColor: "#F44336",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
  },

  performNowBtnText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});

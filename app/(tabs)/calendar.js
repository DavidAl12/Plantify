import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Calendar } from "react-native-calendars";

import AppHeader from "../../components/ui/AppHeader";
import { COLORS } from "../../styles/colors";

import { collection, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../src/config/firebase";

import { generateFullSchedule } from "../../src/utils/calendarUtils";

const TASK_COLORS = {
  watering: "#4FC3F7",
  fertilizing: "#b38575ff",
  pruning: "#81C784",
  pest_control: "#ffb34fff",
};

const formatDatePretty = (dateStr) => {
  if (!dateStr) return "";

  // 🔑 Parsear manualmente para evitar que JS lo trate como UTC
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
};

export default function CalendarScreen() {
  // HOY en tiempo LOCAL
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  const [plants, setPlants] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [schedule, setSchedule] = useState({});

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

  // MARCADO OPTIMIZADO (no recalcular en cada render)
  const markedDates = useMemo(() => {
    const marks = {};

    Object.keys(schedule).forEach((date) => {
      const tasks = schedule[date];

      const uniqueTypes = [...new Set(tasks.map((t) => t.type))];

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
  }, [schedule, selectedDate]);

  // 🔑 tareas del día seleccionado (NO recalcula nada)
  const selectedTasks = useMemo(() => {
    return schedule[selectedDate] || [];
  }, [schedule, selectedDate]);

  // ✅ Toggle check
  const toggleTask = async (task) => {
    const user = auth.currentUser;
    if (!user) return;

    // Verificar si la fecha seleccionada es futura
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate > today) {
      Alert.alert("No puedes marcar tareas futuras", "Solo puedes marcar tareas para hoy o días anteriores.");
      return;
    }

    const taskRef = doc(db, "users", user.uid, "tasks", task.id);
    const plantRef = doc(db, "users", user.uid, "plants", task.plantId);

    const isCompleting = !task.completed;

    try {
      // 1. Actualizar la tarea
      await setDoc(taskRef, {
        ...task,
        date: selectedDate,
        completed: isCompleting,
        completedAt: isCompleting ? serverTimestamp() : null,
      });

      // 2. Si es riego, sincronizar con el estado de la planta
      if (task.type === "watering" && isCompleting) {
        await updateDoc(plantRef, {
          lastWatered: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error al sincronizar tarea:", error);
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

  return (
    <ScrollView style={styles.container}>
      <AppHeader />

      <View style={styles.content}>
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
            <Text style={styles.noTasks}>No hay tareas programadas</Text>
          ) : (
            selectedTasks.map((task) => (
              <View key={task.id} style={[styles.taskCard, task.completed && styles.taskCardCompleted]}>
                <View style={styles.taskLeft}>
                  {task.image && (
                    <Image
                      source={{ uri: task.image }}
                      style={[styles.taskImage, task.completed && styles.taskImageCompleted]}
                    />
                  )}

                  <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>{getTaskLabel(task)}</Text>
                </View>

                <TouchableOpacity onPress={() => toggleTask(task)}>
                  <Ionicons
                    name={
                      task.completed ? "checkmark-circle" : "ellipse-outline"
                    }
                    size={26}
                    color={task.completed ? COLORS.primary : "gray"}
                  />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
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

  taskImage: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },

  taskTitle: {
    fontSize: 16,
    color: "#1b1b1b",
    fontWeight: "500",
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
});

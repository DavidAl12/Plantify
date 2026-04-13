import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
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
import { COLORS } from "../../styles/colors";

import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
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

  const date = new Date(dateStr);

  return date.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
};

export default function CalendarScreen() {
  // HOY por defecto (SIN useEffect)
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

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

    const ref = doc(db, "users", user.uid, "tasks", task.id);

    await setDoc(ref, {
      ...task,
      date: selectedDate,
      completed: !task.completed,
    });
  };

  // 🏷️ Etiquetas bonitas
  const getTaskLabel = (task) => {
    const labels = {
      watering: "💧 Regar",
      fertilizing: "🌿 Fertilizar",
      pruning: "✂️ Podar",
      pest_control: "🐛 Control plagas",
    };

    return `${labels[task.type] || "🌱"} ${task.name}`;
  };

  return (
    <ScrollView style={styles.container}>
      <AppHeader />

      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Calendario</Text>
        <Text style={styles.bannerText}>
          Aquí puedes ver cuándo tus plantas necesitan atención. ¡No olvides
          mantener tu jardín siempre saludable!
        </Text>
      </View>

      <Calendar
        markingType="multi-dot"
        onDayPress={(day) => setSelectedDate(day.dateString)} // 🔑 SOLO cambia vista
        markedDates={markedDates}
        theme={{
          todayTextColor: COLORS.primary,
          arrowColor: COLORS.primary,
          monthTextColor: COLORS.primary,
          textMonthFontWeight: "bold",
          textSectionTitleColor: "#000",
        }}
      />

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
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.taskLeft}>
                {task.image && (
                  <Image
                    source={{ uri: task.image }}
                    style={styles.taskImage}
                  />
                )}

                <Text style={styles.taskTitle}>{getTaskLabel(task)}</Text>
              </View>

              <TouchableOpacity onPress={() => toggleTask(task)}>
                <Ionicons
                  name={task.completed ? "checkmark-circle" : "ellipse-outline"}
                  size={26}
                  color={task.completed ? COLORS.primary : "gray"}
                />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
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
    backgroundColor: COLORS.surfaceContainerLowest,
    marginBottom: 10,
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

  dateBadge: {
    backgroundColor: "#bff0b1ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  dateBadgeText: {
    color: "#2E7D32",
    fontWeight: "600",
  },

  tasksTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
  },
});

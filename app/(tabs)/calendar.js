import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import AppHeader from "../../components/ui/AppHeader";
import { COLORS } from "../../styles/colors";

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState("");

  // 🔥 TAREAS DE EJEMPLO (luego puedes traerlas de Firebase)
  const [tasks, setTasks] = useState({
    "2026-04-06": [
      {
        id: 1,
        title: "Regar planta",
        subtitle: "Sala • 200ml",
        done: false,
      },
      {
        id: 2,
        title: "Revisar hojas",
        subtitle: "Balcón",
        done: true,
      },
    ],
  });

  // 🔥 MARCAR COMPLETADO
  const toggleTask = (date, id) => {
    const updated = tasks[date].map((task) =>
      task.id === id ? { ...task, done: !task.done } : task,
    );

    setTasks({ ...tasks, [date]: updated });
  };

  const selectedTasks = tasks[selectedDate] || [];

  return (
    <ScrollView style={styles.container}>
      <AppHeader />

      {/* RESUMEN */}
      <View style={styles.banner}>
        <Text style={styles.bannerLabel}>Schedule</Text>
        <Text style={styles.bannerTitle}>Calendario</Text>
        <Text style={styles.bannerText}>
          Selecciona un día para ver tus tareas
        </Text>
      </View>

      {/* CALENDARIO */}
      <Calendar
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={{
          [selectedDate]: {
            selected: true,
            selectedColor: COLORS.primary,
          },
        }}
        theme={{
          todayTextColor: COLORS.primary,
          arrowColor: COLORS.primary,
        }}
      />

      {/* TAREAS */}
      <View style={styles.tasksSection}>
        <Text style={styles.tasksTitle}>
          {selectedDate ? `Tareas - ${selectedDate}` : "Selecciona un día"}
        </Text>

        {selectedTasks.length === 0 ? (
          <Text style={styles.noTasks}>No hay tareas para este día</Text>
        ) : (
          selectedTasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={[styles.taskCard, task.done && styles.taskDone]}
              onPress={() => toggleTask(selectedDate, task.id)}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.taskTitle, task.done && styles.taskTextDone]}
                >
                  {task.title}
                </Text>
                <Text style={styles.taskSubtitle}>{task.subtitle}</Text>
              </View>

              <View
                style={[styles.checkbox, task.done && styles.checkboxActive]}
              >
                {task.done && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
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

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.onSurface,
  },

  banner: {
    backgroundColor: COLORS.primaryContainer,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },

  bannerLabel: {
    fontSize: 12,
    opacity: 0.7,
  },

  bannerTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },

  bannerText: {
    fontSize: 12,
  },

  tasksSection: {
    marginTop: 20,
  },

  tasksTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },

  noTasks: {
    color: COLORS.onSurfaceVariant,
  },

  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerLowest,
    marginBottom: 10,
  },

  taskDone: {
    opacity: 0.5,
  },

  taskTitle: {
    fontWeight: "bold",
    color: COLORS.onSurface,
  },

  taskTextDone: {
    textDecorationLine: "line-through",
  },

  taskSubtitle: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  checkboxActive: {
    backgroundColor: COLORS.primary,
  },
});

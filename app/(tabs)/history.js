import { Ionicons } from "@expo/vector-icons";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../../components/ui/AppHeader";
import { auth, db } from "../../src/config/firebase";
import { COLORS } from "../../styles/colors";

export default function History() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const tasksRef = collection(db, "users", user.uid, "tasks");
    const q = query(
      tasksRef,
      where("completed", "==", true),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks(data);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const groupTasksByDate = (tasks) => {
    const groups = {};
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    tasks.forEach((task) => {
      let dateKey = task.date;
      let label = task.date;

      if (task.date === today) {
        label = "HOY";
      } else if (task.date === yesterdayStr) {
        label = "AYER";
      } else {
        // Formato: Lunes, 26 de abr
        const date = new Date(task.date);
        label = date.toLocaleDateString("es-CO", {
          weekday: "long",
          day: "numeric",
          month: "short",
        }).toUpperCase();
      }

      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(task);
    });

    return groups;
  };

  const groupedTasks = groupTasksByDate(tasks);

  const getTaskIcon = (type) => {
    switch (type) {
      case "watering":
        return "water-outline";
      case "fertilizing":
        return "flask-outline";
      case "pruning":
        return "leaf-outline";
      case "pest_control":
        return "bug-outline";
      default:
        return "flower-outline";
    }
  };

  const getTaskTitle = (task) => {
    const labels = {
      watering: "Riego",
      fertilizing: "Fertilización",
      pruning: "Poda",
      pest_control: "Control de plagas",
    };
    return `${labels[task.type] || "Cuidado"} de ${task.name}`;
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader />

      <ScrollView>
        <View style={styles.container}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Historial de Cuidados</Text>
            <Text style={styles.subtitle}>
              Seguimiento de tu viaje botánico 🌱
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : tasks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No hay actividades registradas aún.</Text>
              <Text style={styles.emptySubtext}>Completa tareas en tu calendario para verlas aquí.</Text>
            </View>
          ) : (
            Object.keys(groupedTasks).map((label, index) => (
              <Section key={label} title={label} primary={label === "HOY"}>
                {groupedTasks[label].map((task) => (
                  <TimelineItem
                    key={task.id}
                    icon={getTaskIcon(task.type)}
                    title={getTaskTitle(task)}
                    time={formatTime(task.completedAt)}
                    description={`Actividad realizada correctamente en ${task.name}.`}
                  />
                ))}
              </Section>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children, primary }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View
          style={[
            styles.badge,
            primary ? styles.badgePrimary : styles.badgeSecondary,
          ]}
        >
          <Text style={styles.badgeText}>{title}</Text>
        </View>
        <View style={styles.line} />
      </View>

      <View style={styles.timeline}>{children}</View>
    </View>
  );
}

function TimelineItem({ icon, title, time, description, faded }) {
  return (
    <View style={[styles.itemContainer, faded && { opacity: 0.6 }]}>
      <View style={styles.verticalLine} />
      <View style={styles.dot} />
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={24} color={COLORS.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.itemTitle}>{title}</Text>
            <Text style={styles.time}>{time}</Text>
          </View>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 100,
  },
  titleContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1b1b1b",
  },
  subtitle: {
    color: "#555",
    marginTop: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgePrimary: {
    backgroundColor: COLORS.primary,
  },
  badgeSecondary: {
    backgroundColor: "#ccc",
  },
  badgeText: {
    fontWeight: "bold",
    fontSize: 12,
    color: "#fff",
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#ccc",
    marginLeft: 10,
  },
  timeline: {
    paddingLeft: 10,
  },
  itemContainer: {
    marginBottom: 25,
    paddingLeft: 20,
  },
  verticalLine: {
    position: "absolute",
    left: 7,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "#ccc",
  },
  dot: {
    position: "absolute",
    left: 0,
    top: 10,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
  },
  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemTitle: {
    fontWeight: "bold",
    fontSize: 15,
    color: "#333",
    flex: 1,
  },
  time: {
    fontSize: 11,
    color: "#777",
    marginLeft: 5,
  },
  description: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 50,
    opacity: 0.8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#888",
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 10,
    textAlign: "center",
  },
});


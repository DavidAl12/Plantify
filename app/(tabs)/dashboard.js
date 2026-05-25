import { Ionicons } from "@expo/vector-icons";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Dimensions } from "react-native";
import AppHeader from "../../components/ui/AppHeader";
import { auth, db } from "../../src/config/firebase";
import { COLORS } from "../../styles/colors";

const { width } = Dimensions.get("window");

export default function Dashboard() {
  const [plants, setPlants] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    // Cargar Plantas
    const plantsRef = collection(db, "users", user.uid, "plants");
    const unsubPlants = onSnapshot(plantsRef, (snapshot) => {
      setPlants(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Cargar Tareas Completadas
    const tasksRef = collection(db, "users", user.uid, "tasks");
    const qTasks = query(tasksRef, where("completed", "==", true));
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubPlants();
      unsubTasks();
    };
  }, []);

  // CÁLCULOS
  const totalPlants = plants.length;
  
  const diasDesde = (timestamp) => {
    if (!timestamp) return null;
    const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return Math.floor((Date.now() - fecha.getTime()) / 86400000);
  };

  const needsWater = plants.filter(p => {
    const d = diasDesde(p.lastWatered);
    return p.wateringFrequencyDays && d >= p.wateringFrequencyDays;
  }).length;

  const healthyPlants = totalPlants - needsWater;
  const healthPercentage = totalPlants > 0 ? Math.round((healthyPlants / totalPlants) * 100) : 100;

  // Tareas esta semana
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const tasksThisWeek = tasks.filter(t => {
    const taskDate = new Date(t.date);
    return taskDate >= oneWeekAgo;
  }).length;

  // Planta favorita (más cuidada)
  const taskCounts = {};
  tasks.forEach(t => {
    taskCounts[t.plantId] = (taskCounts[t.plantId] || 0) + 1;
  });
  const favoritePlantId = Object.keys(taskCounts).reduce((a, b) => taskCounts[a] > taskCounts[b] ? a : b, null);
  const favoritePlant = plants.find(p => p.id === favoritePlantId);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Estado del Jardín</Text>
          <Text style={styles.subtitle}>Resumen del cuidado de tus plantas 🌿</Text>
        </View>

        {/* HEALTH SCORE CARD */}
        <View style={styles.healthCard}>
          <View style={styles.healthInfo}>
            <Text style={styles.healthTitle}>Salud General</Text>
            <Text style={styles.healthScore}>{healthPercentage}%</Text>
            <Text style={styles.healthStatus}>
              {healthPercentage > 80 ? "¡Tu jardín está increíble!" : "Algunas plantas necesitan amor."}
            </Text>
          </View>
          <View style={styles.healthIconContainer}>
            <Ionicons name="heart" size={60} color="#ff8a80" />
          </View>
        </View>

        {/* METRICS GRID */}
        <View style={styles.grid}>
          <MetricBox 
            icon="leaf" 
            label="Plantas" 
            value={totalPlants} 
            color="#4caf50" 
          />
          <MetricBox 
            icon="water" 
            label="Sedientas" 
            value={needsWater} 
            color="#2196f3" 
          />
          <MetricBox 
            icon="checkmark-done" 
            label="Tareas/Sem" 
            value={tasksThisWeek} 
            color="#ff9800" 
          />
          <MetricBox 
            icon="star" 
            label="Logros" 
            value={Math.floor(tasks.length / 5)} 
            color="#9c27b0" 
          />
        </View>

        {/* FAVORITE PLANT */}
        {favoritePlant && (
          <View style={styles.favCard}>
            <Text style={styles.favTitle}>🏆 Planta más consentida</Text>
            <View style={styles.favContent}>
              <View style={styles.favIcon}>
                <Ionicons name="flower" size={30} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.favName}>{favoritePlant.commonNames?.[0] || favoritePlant.name}</Text>
                <Text style={styles.favText}>Con {taskCounts[favoritePlantId]} actividades realizadas</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.activityCard}>
           <Text style={styles.favTitle}>📈 Rendimiento</Text>
           <Text style={styles.activitySubtext}>Has completado un total de {tasks.length} tareas desde que empezaste tu viaje botánico.</Text>
           
           <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.min(tasks.length, 100)}%` }]} />
           </View>
           <Text style={styles.progressLabel}>{`${tasks.length} / 100 para el nivel "Jardinero Experto"`}</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function MetricBox({ icon, label, value, color }) {
  return (
    <View style={styles.metricBox}>
      <View style={[styles.iconCircle, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f7f2",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1b1b1b",
  },
  subtitle: {
    color: "#666",
    marginTop: 5,
  },
  healthCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 25,
    padding: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  healthInfo: {
    flex: 1,
  },
  healthTitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    fontWeight: "600",
  },
  healthScore: {
    color: "white",
    fontSize: 48,
    fontWeight: "bold",
    marginVertical: 5,
  },
  healthStatus: {
    color: "white",
    fontSize: 13,
    opacity: 0.9,
  },
  healthIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 15,
    marginBottom: 20,
  },
  metricBox: {
    backgroundColor: "white",
    width: (width - 55) / 2,
    padding: 20,
    borderRadius: 22,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1b1b1b",
  },
  metricLabel: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  favCard: {
    backgroundColor: "white",
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
  },
  favTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1b1b1b",
    marginBottom: 15,
  },
  favContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  favIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  favName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  favText: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
  },
  activityCard: {
    backgroundColor: "white",
    borderRadius: 22,
    padding: 20,
    elevation: 2,
  },
  activitySubtext: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 15,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: "#eee",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
  },
  progressLabel: {
    fontSize: 12,
    color: "#888",
    textAlign: "right",
  },
});

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../src/config/firebase";
import { generateFullSchedule } from "../../src/utils/calendarUtils";
import { COLORS } from "../../styles/colors";

const TASK_LABELS = {
  watering: "regar",
  fertilizing: "fertilizar",
  pruning: "podar",
  pest_control: "controlar plagas",
};

export default function AppHeader({ showBack = false }) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [plants, setPlants] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const plantsRef = collection(db, "users", user.uid, "plants");
    const tasksRef = collection(db, "users", user.uid, "tasks");

    const unsubscribePlants = onSnapshot(plantsRef, (snapshot) => {
      setPlants(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const unsubscribeTasks = onSnapshot(tasksRef, (snapshot) => {
      setCompletedTasks(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribePlants();
      unsubscribeTasks();
    };
  }, []);

  const today = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const todaysTasks = useMemo(() => {
    const schedule = generateFullSchedule(plants, completedTasks);
    return (schedule[today] || []).filter((task) => !task.completed);
  }, [plants, completedTasks, today]);

  const getPlantName = (task) => {
    const plant = plants.find((p) => p.id === task.plantId);
    return plant?.commonNames?.[0] || task.name;
  };

  const getTaskLabel = (task) => {
    const action = TASK_LABELS[task.type] || "cuidar";
    return `Hoy debes de ${action} ${getPlantName(task)}`;
  };

  const openCalendar = () => {
    setIsMenuOpen(false);
    router.push({ pathname: "/(tabs)/calendar", params: { date: today } });
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.header}>
        {/* IZQUIERDA */}
        <View style={styles.left}>
          {showBack && (
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.onSurface} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => router.replace("/(tabs)")}
            activeOpacity={0.7}
          >
            <Image
              source={require("../../assets/images/logo-header.png")}
              style={styles.logo}
            />
          </TouchableOpacity>
        </View>

        {/* DERECHA */}
        <TouchableOpacity
          onPress={() => setIsMenuOpen(true)}
          activeOpacity={0.7}
          style={styles.notifBtn}
        >
          <Ionicons
            name="notifications-outline"
            size={22}
            color={COLORS.onSurface}
          />
          {todaysTasks.length > 0 && (
            <View style={styles.badge} />
          )}
        </TouchableOpacity>
      </View>

      <Modal
        transparent
        visible={isMenuOpen}
        animationType="fade"
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsMenuOpen(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Tareas para hoy</Text>
          {todaysTasks.length === 0 ? (
            <Text style={styles.modalText}>No tienes tareas pendientes para hoy.</Text>
          ) : (
            <ScrollView style={styles.taskList}>
              {todaysTasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  onPress={openCalendar}
                  activeOpacity={0.7}
                  style={styles.taskItem}
                >
                  <Text style={styles.taskItemText}>{getTaskLabel(task)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: "#fff",
  },

  header: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#c2c9ba",
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d3ffd2",
  },

  logo: {
    width: 130,
    height: 150,
    resizeMode: "contain",
  },

  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d3ffd2",
  },

  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef5350",
  },

  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  modalCard: {
    position: "absolute",
    top: 80,
    right: 16,
    margin: 12,
    width: 280,
    maxHeight: 340,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    color: COLORS.onSurface,
  },

  modalText: {
    color: COLORS.onSurface,
    fontSize: 14,
    lineHeight: 20,
  },

  taskList: {
    marginTop: 4,
  },

  taskItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5ebdb",
  },

  taskItemText: {
    color: COLORS.onSurface,
    fontSize: 14,
    lineHeight: 20,
  },
});

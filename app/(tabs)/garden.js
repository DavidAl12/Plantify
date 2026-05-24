import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import AppHeader from "../../components/ui/AppHeader";
import { auth, db } from "../../src/config/firebase";

// Helpers
const getLatestActivityDate = (plantId, type, completedTasks, plantCreatedAt) => {
  const plantTasks = completedTasks.filter(
    (t) => t.plantId === plantId && t.type === type && t.completed
  );
  if (plantTasks.length === 0) {
    return plantCreatedAt; // Fallback to plant's createdAt
  }
  plantTasks.sort((a, b) => {
    if (a.date === b.date) {
      const timeA = a.completedAt?.toDate ? a.completedAt.toDate().getTime() : (a.completedAt ? new Date(a.completedAt).getTime() : 0);
      const timeB = b.completedAt?.toDate ? b.completedAt.toDate().getTime() : (b.completedAt ? new Date(b.completedAt).getTime() : 0);
      return timeB - timeA;
    }
    return b.date.localeCompare(a.date);
  });
  return plantTasks[0].date;
};

const diasDesdeStr = (dateVal) => {
  if (!dateVal) return null;
  let dateObj;
  if (typeof dateVal === "string") {
    const [year, month, day] = dateVal.split("-").map(Number);
    dateObj = new Date(year, month - 1, day);
  } else {
    dateObj = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dateObj.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffTime / 86400000);
  return diffDays >= 0 ? diffDays : 0;
};

const getActivityStatus = (lastDate, frequency) => {
  if (!lastDate || !frequency) return "gray"; // no data
  const days = diasDesdeStr(lastDate);
  const warningThreshold = Math.floor(frequency * 0.75);
  const overdueThreshold = frequency;

  if (days <= warningThreshold) return "#4CAF50"; // green - on track
  if (days < overdueThreshold) return "#FFC107"; // yellow - warning
  return "#F44336"; // red - overdue
};

const getActivityColors = (status) => {
  switch (status) {
    case "#4CAF50": // green
      return { bg: "#E8F5E9", text: "#2E7D32" };
    case "#FFC107": // yellow
      return { bg: "#FFF3E0", text: "#F57C00" };
    case "#F44336": // red
      return { bg: "#FFEBEE", text: "#C62828" };
    default: // gray
      return { bg: "#F5F5F5", text: "#999999" };
  }
};

const formatDaysAgo = (days) => {
  if (days === null) return "Nunca";
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  return `hace ${days}d`;
};

const getPlantStatus = (item, completedTasks) => {
  const latestWateredDate = getLatestActivityDate(item.id, "watering", completedTasks, item.lastWatered || item.createdAt);
  const wateringStatus = getActivityStatus(latestWateredDate, item.wateringFrequencyDays);

  const latestFertDate = getLatestActivityDate(item.id, "fertilizing", completedTasks, item.carePlan?.fertilizing?.lastDate || item.createdAt);
  const fertStatus = getActivityStatus(latestFertDate, item.carePlan?.fertilizing?.frequencyDays);

  const latestPruningDate = getLatestActivityDate(item.id, "pruning", completedTasks, item.carePlan?.pruning?.lastDate || item.createdAt);
  const pruningStatus = getActivityStatus(latestPruningDate, item.carePlan?.pruning?.frequencyDays);

  const latestPestDate = getLatestActivityDate(item.id, "pest_control", completedTasks, item.carePlan?.pest_control?.lastDate || item.createdAt);
  const pestStatus = getActivityStatus(latestPestDate, item.carePlan?.pest_control?.frequencyDays);

  const statuses = [wateringStatus, fertStatus, pruningStatus, pestStatus].filter(s => s !== "gray");

  if (statuses.includes("#F44336")) return { status: "Descuidada", color: "#ffebee", textColor: "#c62828" };
  if (statuses.includes("#FFC107")) return { status: "Atención", color: "#fff3e0", textColor: "#f57c00" };
  return { status: "Sana", color: "#e8f5e9", textColor: "#2e7d32" };
};


export default function Garden() {
  const router = useRouter();
  const [plants, setPlants] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "plants"),
      orderBy("createdAt", "desc"),
    );

    const unsubPlants = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPlants(data);
    });

    const tasksRef = collection(db, "users", user.uid, "tasks");
    const unsubTasks = onSnapshot(tasksRef, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCompletedTasks(data);
    });

    return () => {
      unsubPlants();
      unsubTasks();
    };
  }, []);

  // FILTRO
  const filteredPlants = plants.filter((p) => {
    const displayName = p.commonNames?.[0] || p.name || "";
    return displayName.toLowerCase().includes(search.toLowerCase());
  });

  // CARD
  const renderItem = ({ item }) => {
    const plantState = getPlantStatus(item, completedTasks);

    const latestWateredDate = getLatestActivityDate(item.id, "watering", completedTasks, item.lastWatered || item.createdAt);
    const wateringDays = diasDesdeStr(latestWateredDate);
    const wateringStatus = getActivityStatus(latestWateredDate, item.wateringFrequencyDays);

    const latestFertDate = getLatestActivityDate(item.id, "fertilizing", completedTasks, item.carePlan?.fertilizing?.lastDate || item.createdAt);
    const fertDays = diasDesdeStr(latestFertDate);
    const fertStatus = getActivityStatus(latestFertDate, item.carePlan?.fertilizing?.frequencyDays);

    const latestPruningDate = getLatestActivityDate(item.id, "pruning", completedTasks, item.carePlan?.pruning?.lastDate || item.createdAt);
    const pruningDays = diasDesdeStr(latestPruningDate);
    const pruningStatus = getActivityStatus(latestPruningDate, item.carePlan?.pruning?.frequencyDays);

    const latestPestDate = getLatestActivityDate(item.id, "pest_control", completedTasks, item.carePlan?.pest_control?.lastDate || item.createdAt);
    const pestDays = diasDesdeStr(latestPestDate);
    const pestStatus = getActivityStatus(latestPestDate, item.carePlan?.pest_control?.frequencyDays);

    const activities = [
      { label: "Riego", color: wateringStatus, days: wateringDays },
      { label: "Fert.", color: fertStatus, days: fertDays },
      { label: "Poda", color: pruningStatus, days: pruningDays },
      { label: "Plagas", color: pestStatus, days: pestDays },
    ];

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/plant/${item.id}`)}
        activeOpacity={0.9}
      >
        {/* Imagen */}
        <Image
          source={{
            uri:
              item.imageUrl ||
              "https://via.placeholder.com/300x200.png?text=Plant",
          }}
          style={styles.image}
        />

        {/* Estado */}
        <View
          style={[
            styles.badge,
            { backgroundColor: plantState.color },
          ]}
        >
          <Text
            style={{
              color: plantState.textColor,
              fontWeight: "600",
            }}
          >
            {plantState.status}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.cardContent}>
          <View style={styles.cardInfoTop}>
            <Text style={styles.name} numberOfLines={2}>
              {item.commonNames?.[0] || item.name}
            </Text>
            <Text style={styles.scientific} numberOfLines={1}>
              {item.name}
            </Text>
          </View>

          <View style={styles.cardInfoBottom}>
            {activities.map((activity, idx) => {
              const colors = getActivityColors(activity.color);
              return (
                <View 
                  key={idx} 
                  style={[
                    styles.activityIndicator,
                    { backgroundColor: colors.bg }
                  ]}
                >
                  <Text style={[styles.activityIndicatorTitle, { color: colors.text }]}>
                    {activity.label}
                  </Text>
                  <Text style={[styles.activityIndicatorTime, { color: colors.text }]}>
                    {formatDaysAgo(activity.days)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader />

      {/* BUSCADOR */}
      <View style={styles.headerControls}>
        <View style={styles.searchBarRow}>
          <TextInput
            placeholder="Busca en tu jardín..."
            value={search}
            onChangeText={setSearch}
            style={styles.search}
          />
          <View style={styles.searchIconContainer}>
            <Ionicons name="search" size={20} color="#2e7d32" />
          </View>
        </View>

        <TouchableOpacity
          style={styles.addPlantButton}
          onPress={() => router.push("/plant/add")}
        >
          <Ionicons name="add" size={18} color="white" />
          <Text style={styles.addPlantButtonText}>Añadir planta al jardín</Text>
        </TouchableOpacity>
      </View>

      {/* LISTA */}
      <FlatList
        data={filteredPlants}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8f5" },

  headerControls: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 10,
  },

  searchBarRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eee",
    borderRadius: 20,
    paddingRight: 14,
    height: 45,
  },

  search: {
    flex: 1,
    paddingHorizontal: 16,
    height: "100%",
    fontSize: 14,
    color: "#333",
  },

  searchIconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },

  addPlantButton: {
    backgroundColor: "#2e7d32",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    height: 40,
    gap: 6,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },

  addPlantButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },

  card: {
    backgroundColor: "white",
    borderRadius: 20,
    marginBottom: 16,
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: 180,
  },

  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  cardContent: {
    padding: 14,
    flexDirection: "column",
    gap: 12,
  },

  cardInfoTop: {
    marginBottom: 2,
  },

  cardInfoBottom: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },

  name: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1b1b1b",
  },

  scientific: {
    fontSize: 12,
    color: "#6d6d6d",
    marginTop: 4,
  },

  activityIndicator: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  activityIndicatorTitle: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },

  activityIndicatorTime: {
    fontSize: 10,
    marginTop: 2,
    textAlign: "center",
  },

  subtitle: {
    color: "#888",
    marginTop: 4,
  },
});

import { useLocalSearchParams, useRouter } from "expo-router";
import { deleteDoc, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../src/config/firebase";

const diasDesde = (timestamp) => {
  if (!timestamp) return null;
  const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return Math.floor((Date.now() - fecha.getTime()) / 86400000);
};

export default function PlantDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [plant, setPlant] = useState(null);

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
  }, []);

  if (!plant) return null;

  const dias = diasDesde(plant.lastWatered);

  const handleWater = async () => {
    const user = auth.currentUser;

    await updateDoc(
      doc(db, "users", user.uid, "plants", id),
      {
        lastWatered: serverTimestamp(),
      }
    );

    setPlant((prev) => ({
      ...prev,
      lastWatered: { toDate: () => new Date() },
    }));
  };

  return (
    <ScrollView style={styles.container}>
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
          <Text style={{ color: "white", fontSize: 20 }}>‹</Text>
        </TouchableOpacity>
      </View>

      {/* CARD FLOTANTE */}
      <View style={styles.infoCard}>
        <Text style={styles.tag}>Planta</Text>
        <Text style={styles.name}>
          {plant.commonNames?.[0] || plant.name}
        </Text>

        <Text style={{ color: "#666", marginTop: 4 }}>
          {plant.name}
        </Text>
        <Text style={styles.location}>Interior</Text>
      </View>

      {/* RUTINA */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rutina de Cuidado</Text>

        <View style={styles.grid}>
          {/* RIEGO */}
          <View style={styles.box}>
            <Text style={styles.icon}>💧</Text>
            <Text style={styles.label}>Riego</Text>
            <Text style={styles.value}>
              Cada {plant.wateringFrequencyDays || 0} días
            </Text>
          </View>

          {/* LUZ */}
          <View style={styles.box}>
            <Text style={styles.icon}>☀️</Text>
            <Text style={styles.label}>Luz</Text>
            <Text style={styles.value}>
              {plant.light || "Sombra parcial"}
            </Text>
          </View>
        </View>
      </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Información</Text>

              {plant.description ? (
                <View style={styles.infoBox}>
                  <Text style={styles.infoTitle}>📖 Descripción</Text>
                  <Text style={styles.infoText}>{plant.description}</Text>
                </View>
              ) : null}

              {plant.soilType ? (
                <View style={styles.infoBox}>
                  <Text style={styles.infoTitle}>🪴 Suelo</Text>
                  <Text style={styles.infoText}>{plant.soilType}</Text>
                </View>
              ) : null}

              {plant.toxicity ? (
                <View style={styles.infoBox}>
                  <Text style={styles.infoTitle}>⚠️ Toxicidad</Text>
                  <Text style={styles.infoText}>{plant.toxicity}</Text>
                </View>
              ) : null}

              {plant.propagation?.length ? (
                <View style={styles.infoBox}>
                  <Text style={styles.infoTitle}>🌱 Propagación</Text>
                  <Text style={styles.infoText}>
                    {plant.propagation.join(", ")}
                  </Text>
                </View>
              ) : null}
            </View>
      {/* BOTÓN REGAR */}
      <TouchableOpacity style={styles.waterBtn} onPress={handleWater}>
        <Text style={styles.waterText}>💧 Regar hoy</Text>
      </TouchableOpacity>

      {/* IA CARD */}
      <View style={styles.aiCard}>
        <Text style={styles.aiTitle}>
          ¿Algo va mal con {plant.name}?
        </Text>
        <Text style={styles.aiText}>
          Detecta plagas, enfermedades o deficiencias.
        </Text>

        <TouchableOpacity
          style={styles.aiButton}
          onPress={() => router.push("/camera")}
        >
          <Text style={styles.aiButtonText}>
            Detectar problemas
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteText}>Eliminar planta 🗑️</Text>
      </TouchableOpacity>
      
      <View style={{ height: 40 }} />
    </ScrollView>
    
  );
}




const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8f5" },

  hero: { height: 300 },
  image: { width: "100%", height: 300 },

  back: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  infoCard: {
    backgroundColor: "white",
    marginTop: -40,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
  },

  tag: {
    backgroundColor: "#dcedc8",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 5,
  },

  name: {
    fontSize: 22,
    fontWeight: "800",
  },

  location: {
    color: "#888",
    marginTop: 4,
  },

  section: {
    padding: 20,
  },

  sectionTitle: {
    fontWeight: "700",
    marginBottom: 10,
  },

  grid: {
    flexDirection: "row",
    gap: 10,
  },

  box: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },

  icon: { fontSize: 20 },

  label: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },

  value: {
    fontWeight: "700",
    marginTop: 4,
  },

  waterBtn: {
    marginHorizontal: 20,
    backgroundColor: "#2e7d32",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },

  waterText: {
    color: "white",
    fontWeight: "700",
  },

  aiCard: {
    backgroundColor: "#2e7d32",
    margin: 20,
    padding: 20,
    borderRadius: 20,
  },

  aiTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },

  aiText: {
    color: "#dcedc8",
    marginTop: 6,
  },

  aiButton: {
    backgroundColor: "white",
    marginTop: 15,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  aiButtonText: {
    color: "#2e7d32",
    fontWeight: "700",
  },

  infoBox: {
  backgroundColor: "white",
  padding: 14,
  borderRadius: 14,
  marginBottom: 10,
},

infoTitle: {
  fontWeight: "700",
  marginBottom: 4,
},

infoText: {
  color: "#444",
  lineHeight: 20,
},

deleteBtn: {
  marginHorizontal: 20,
  backgroundColor: "#e53935",
  padding: 14,
  borderRadius: 14,
  alignItems: "center",
  marginTop: 10,
},

deleteText: {
  color: "white",
  fontWeight: "700",
},
});
import { useRouter } from "expo-router";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth, db } from "../../src/config/firebase";

export default function Home() {
  const router = useRouter();
  const [plants, setPlants] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "plants"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plantList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPlants(plantList);
    });

    return unsubscribe;
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌿 Mis Plantas</Text>

      {plants.length === 0 ? (
        <Text style={styles.subtitle}>
          Aún no tienes plantas registradas
        </Text>
      ) : (
        plants.map((plant) => (
          <TouchableOpacity
            key={plant.id}
            style={styles.card}
            onPress={() => router.push(`/plant/${plant.id}`)}
          >
            <Text style={styles.cardText}>{plant.name}</Text>
          </TouchableOpacity>
        ))
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/plant/add")}
      >
        <Text style={styles.buttonText}>Agregar Planta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  subtitle: {
    marginBottom: 20,
    color: "gray",
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#e8f5e9",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  cardText: {
    fontWeight: "bold",
  },
});
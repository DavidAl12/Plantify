import { useLocalSearchParams, useRouter } from "expo-router";
import { deleteDoc, doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth, db } from "../../src/config/firebase";

export default function PlantDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [plant, setPlant] = useState(null);

  useEffect(() => {
    const fetchPlant = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const docRef = doc(db, "users", user.uid, "plants", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setPlant(docSnap.data());
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchPlant();
  }, [id]);

  const handleDelete = async () => {
    Alert.alert(
      "Eliminar planta",
      "¿Estás seguro?",
      [
        { text: "Cancelar" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const user = auth.currentUser;
            await deleteDoc(doc(db, "users", user.uid, "plants", id));
            router.replace("/(tabs)");
          },
        },
      ]
    );
  };

  if (!plant) {
    return (
      <View style={styles.container}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{plant.name}</Text>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteText}>Eliminar Planta</Text>
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
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  deleteButton: {
    backgroundColor: "#ff4d4d",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteText: {
    color: "white",
    fontWeight: "bold",
  },
});
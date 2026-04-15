import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../src/config/firebase";

export default function AddPlant() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("");

  const handleSave = async () => {
    if (!name) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      const watering = Number(frequency) || 3;

      await addDoc(collection(db, "users", user.uid, "plants"), {
        name,
        wateringFrequencyDays: watering,
        lastWatered: new Date(),

        carePlan: {
          fertilizing: {
            frequencyDays: 30,
            lastDate: new Date(),
          },
          pruning: {
            frequencyDays: 60,
            lastDate: new Date(),
          },
          pest_control: {
            frequencyDays: 15,
            lastDate: new Date(),
          },
        },

        createdAt: serverTimestamp(),
      });

      router.replace("/(tabs)/garden");
    } catch (error) {
      console.log(error);
    }
  };

  // ✅ FUNCIÓN GALERÍA CORRECTA
  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== "granted") {
        alert("Se necesita permiso para acceder a la galería");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // ✅ compatible con tu versión
        quality: 0.3,
        base64: true,
      });

      if (!result.canceled) {
        const asset = result.assets[0];

        // ✅ VALIDACIÓN
        if (!asset.base64 || asset.base64.length < 1000) {
          alert("Imagen no válida, intenta con otra");
          return;
        }

        // 🔍 DEBUG
        console.log("Base64 tamaño:", asset.base64.length);

        // 🚀 ENVÍO
        router.push({
          pathname: "/camera",
          params: {
            imageUri: asset.uri,
            imageBase64: asset.base64,
          },
        });
      }
    } catch (error) {
      console.log("Error seleccionando imagen:", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <Text style={styles.title}>Añadir Planta 🌱</Text>

      {/* CARD CÁMARA */}
      <TouchableOpacity
        style={styles.cameraCard}
        onPress={() => router.push("/camera")}
        activeOpacity={0.9}
      >
        <Text style={styles.cameraIcon}>📷</Text>
        <Text style={styles.cameraTitle}>Escanear planta</Text>
        <Text style={styles.cameraSubtitle}>
          Usa la cámara para identificar automáticamente
        </Text>
      </TouchableOpacity>

      {/* BOTÓN GALERÍA */}
      <TouchableOpacity
        style={[styles.cameraCard, { marginTop: 15 }]}
        onPress={pickImage}
      >
        <Text style={styles.cameraIcon}>🖼️</Text>
        <Text style={styles.cameraTitle}>Subir desde galería</Text>
        <Text style={styles.cameraSubtitle}>
          Selecciona una imagen desde tu dispositivo
        </Text>
      </TouchableOpacity>

      {/* FORM */}
      <View style={styles.form}>
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          placeholder="Ej: Monstera deliciosa"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <Text style={styles.label}>Frecuencia de riego (días)</Text>
        <TextInput
          placeholder="Ej: 7"
          value={frequency}
          onChangeText={setFrequency}
          keyboardType="numeric"
          style={styles.input}
        />

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Guardar planta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f8f5",
    padding: 20,
    paddingTop: 60,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 20,
    color: "#1a2e1a",
  },

  cameraCard: {
    backgroundColor: "#2e7d32",
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
  },

  cameraIcon: {
    fontSize: 32,
    marginBottom: 10,
  },

  cameraTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },

  cameraSubtitle: {
    color: "#dcedc8",
    textAlign: "center",
    marginTop: 6,
  },

  form: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 20,
    marginTop: 20,
  },

  label: {
    fontSize: 13,
    color: "#666",
    marginBottom: 5,
    marginTop: 10,
  },

  input: {
    backgroundColor: "#f1f1f1",
    borderRadius: 12,
    padding: 12,
  },

  button: {
    marginTop: 20,
    backgroundColor: "#2e7d32",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },

  buttonText: {
    color: "white",
    fontWeight: "700",
  },
});
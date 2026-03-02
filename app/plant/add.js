import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
export default function AddPlant() {
  const [name, setName] = useState("");
  return (
    <View style={styles.container}>
      {" "}
      <Text style={styles.title}>Agregar Nueva Planta 🌱</Text>{" "}
      <TextInput
        placeholder="Nombre de la planta"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />{" "}
      <TouchableOpacity style={styles.button}>
        {" "}
        <Text style={styles.buttonText}>Guardar Planta</Text>{" "}
      </TouchableOpacity>{" "}
      <TouchableOpacity style={styles.cameraButton}>
        {" "}
        <Text style={styles.cameraText}>Escanear con Cámara 📷</Text>{" "}
      </TouchableOpacity>{" "}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: { color: "white", fontWeight: "bold" },
  cameraButton: {
    borderWidth: 1,
    borderColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  cameraText: { color: "#4CAF50", fontWeight: "bold" },
});

import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../../../src/config/firebase";

export default function EditPlant() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados para los datos de la planta
  const [commonName, setCommonName] = useState("");
  const [wateringFreq, setWateringFreq] = useState("");
  const [fertilizingFreq, setFertilizingFreq] = useState("");
  const [pruningFreq, setPruningFreq] = useState("");
  const [pestFreq, setPestFreq] = useState("");

  useEffect(() => {
    const fetchPlant = async () => {
      try {
        const user = auth.currentUser;
        if (!user || !id) return;

        const plantRef = doc(db, "users", user.uid, "plants", id);
        const snap = await getDoc(plantRef);

        if (snap.exists()) {
          const data = snap.data();
          setCommonName(data.commonNames?.[0] || data.name || "");
          setWateringFreq(String(data.wateringFrequencyDays || ""));
          setFertilizingFreq(String(data.carePlan?.fertilizing?.frequencyDays || ""));
          setPruningFreq(String(data.carePlan?.pruning?.frequencyDays || ""));
          setPestFreq(String(data.carePlan?.pest_control?.frequencyDays || ""));
        }
      } catch (error) {
        console.error("Error al cargar planta:", error);
        Alert.alert("Error", "No se pudo cargar la información de la planta.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlant();
  }, [id]);

  const handleSave = async () => {
    if (!commonName) {
      Alert.alert("Campo requerido", "Por favor ingresa un nombre para la planta.");
      return;
    }

    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const plantRef = doc(db, "users", user.uid, "plants", id);
      
      await updateDoc(plantRef, {
        "commonNames": [commonName],
        "wateringFrequencyDays": Number(wateringFreq) || 0,
        "carePlan.fertilizing.frequencyDays": Number(fertilizingFreq) || 0,
        "carePlan.pruning.frequencyDays": Number(pruningFreq) || 0,
        "carePlan.pest_control.frequencyDays": Number(pestFreq) || 0,
      });

      Alert.alert("¡Éxito!", "Planta actualizada correctamente.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error("Error al guardar:", error);
      Alert.alert("Error", "Hubo un problema al guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1a2e1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Editar Planta 🌱</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <Text style={styles.label}>Nombre de la planta</Text>
          <TextInput
            style={styles.input}
            value={commonName}
            onChangeText={setCommonName}
            placeholder="Ej: Monstera deliciosa"
          />

          <View style={styles.divider} />
          <Text style={styles.sectionSubtitle}>Frecuencias de Cuidado (en días)</Text>

          <View style={styles.inputGroup}>
            <View style={styles.inputHalf}>
              <Text style={styles.label}>💧 Riego</Text>
              <TextInput
                style={styles.input}
                value={wateringFreq}
                onChangeText={setWateringFreq}
                keyboardType="numeric"
                placeholder="Ej: 7"
              />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.label}>🟤 Abono</Text>
              <TextInput
                style={styles.input}
                value={fertilizingFreq}
                onChangeText={setFertilizingFreq}
                keyboardType="numeric"
                placeholder="Ej: 30"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputHalf}>
              <Text style={styles.label}>🌿 Poda</Text>
              <TextInput
                style={styles.input}
                value={pruningFreq}
                onChangeText={setPruningFreq}
                keyboardType="numeric"
                placeholder="Ej: 60"
              />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.label}>🟠 Plagas</Text>
              <TextInput
                style={styles.input}
                value={pestFreq}
                onChangeText={setPestFreq}
                keyboardType="numeric"
                placeholder="Ej: 21"
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.saveBtn, saving && styles.disabledBtn]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveBtnText}>Guardar Cambios</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f8f5",
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backBtn: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1a2e1a",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  form: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 25,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#444",
    marginBottom: 8,
    marginTop: 15,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2e7d32",
    marginBottom: 10,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: "#333",
  },
  inputGroup: {
    flexDirection: "row",
    gap: 15,
  },
  inputHalf: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 20,
  },
  saveBtn: {
    marginTop: 30,
    backgroundColor: "#2e7d32",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
  },
  saveBtnText: {
    color: "white",
    fontWeight: "800",
    fontSize: 16,
  },
  disabledBtn: {
    opacity: 0.7,
  },
});

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
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
import { diagnoseFromDescription } from "../../src/services/diagnosisService";
import { COLORS } from "../../styles/colors";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#333",
    minHeight: 120,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    textAlign: "right",
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  resultContainer: {
    marginTop: 20,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
  },
  diagnosisItem: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  diagnosisName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  diagnosisProbability: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600",
    marginBottom: 8,
  },
  diagnosisDescription: {
    fontSize: 13,
    color: "#555",
    lineHeight: 20,
    marginBottom: 12,
  },
  treatmentTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  treatment: {
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#f44336",
  },
  errorText: {
    color: "#c62828",
    fontSize: 14,
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
});

export default function DiagnosisScreen() {
  const { plantName, plantId } = useLocalSearchParams();
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [diagnoses, setDiagnoses] = useState(null);
  const [error, setError] = useState(null);

  const handleDiagnose = async () => {
    if (!description.trim()) {
      Alert.alert(
        "Campo requerido",
        "Por favor describe los problemas de tu planta.",
      );
      return;
    }

    setLoading(true);
    setError(null);
    setDiagnoses(null);

    try {
      const result = await diagnoseFromDescription(
        description,
        plantName || "tu planta",
      );
      setDiagnoses(result);
    } catch (err) {
      console.error("Error en diagnóstico:", err);
      setError(
        err.message || "Ocurrió un error al diagnosticar. Intenta de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Diagnosticar Problemas</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* INPUT SECTION */}
        <View style={styles.section}>
          <Text style={styles.label}>🌱 Describe los Síntomas</Text>
          <Text style={styles.description}>
            Cuéntame qué ves en {plantName || "tu planta"}. ¿Tiene hojas amarillas, manchas, hojas caídas, plagas, etc.?
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Las hojas tienen manchas marrones, algunas están amarillentas y se caen fácilmente. También veo algunos insectos pequeños en el tallo."
            value={description}
            onChangeText={setDescription}
            multiline
            editable={!loading}
            placeholderTextColor="#999"
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>

        {/* BUTTON */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleDiagnose}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.buttonText}>Diagnosticar con IA ✨</Text>
          )}
        </TouchableOpacity>

        {/* LOADING STATE */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>
              Analizando síntomas...
            </Text>
          </View>
        )}

        {/* ERROR STATE */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* RESULTS */}
        {diagnoses && diagnoses.length > 0 && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>
              Posibles Problemas Detectados 🔍
            </Text>
            {diagnoses.map((diagnosis, index) => (
              <View key={index} style={styles.diagnosisItem}>
                <Text style={styles.diagnosisName}>{diagnosis.name}</Text>
                {diagnosis.confidence && (
                  <Text style={styles.diagnosisProbability}>
                    Probabilidad: {diagnosis.confidence}%
                  </Text>
                )}
                {diagnosis.description && (
                  <Text style={styles.diagnosisDescription}>
                    {diagnosis.description}
                  </Text>
                )}
                {diagnosis.solution && (
                  <>
                    <Text style={styles.treatmentTitle}>💡 Solución:</Text>
                    <Text style={styles.treatment}>
                      {diagnosis.solution}
                    </Text>
                  </>
                )}
              </View>
            ))}
          </View>
        )}

        {diagnoses === null && !loading && !error && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>🌿</Text>
            <Text style={styles.emptyStateText}>
              Describe los síntomas de tu planta para obtener un diagnóstico
            </Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

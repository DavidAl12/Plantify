import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

import ProgressBar from "../src/components/ProgressBar";
import { diagnosePlantHealthFromBase64 } from "../src/services/diseaseService";

const STEPS = [
  { label: "Preparando imagen...", emoji: "📷" },
  { label: "Analizando posible enfermedad...", emoji: "🧪" },
  { label: "Generando recomendaciones...", emoji: "✨" },
];

function LoadingScreen({ progress, stepIndex }) {
  const step = STEPS[Math.min(stepIndex, STEPS.length - 1)];
  return (
    <View style={styles.center}>
      <Text style={styles.loadingEmoji}>{step.emoji}</Text>
      <Text style={styles.loadingTitle}>Detectando problemas</Text>
      <Text style={styles.loadingStep}>{step.label}</Text>
      <ProgressBar progress={progress} />
      <Text style={styles.loadingPercent}>{Math.round(progress)}%</Text>
      <Text style={styles.loadingTip}>
        💡 Asegúrate de enfocar una hoja o área afectada para mejores resultados.
      </Text>
    </View>
  );
}

export default function DiseaseScreen() {
  const { imageUri, imageBase64, plantName } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [diagnoses, setDiagnoses] = useState([]);
  const [error, setError] = useState(null);

  const advanceTo = (target, newStep) => {
    if (newStep !== undefined) setStepIndex(newStep);
    setProgress(target);
  };

  useEffect(() => {
    if (imageBase64) runDiagnosis();
    else setError("No se encontró la imagen para diagnosticar.");
  }, [imageBase64]);

  const runDiagnosis = async () => {
    try {
      setError(null);
      advanceTo(20, 1);
      const result = await diagnosePlantHealthFromBase64(imageBase64);
      advanceTo(90, 2);
      setDiagnoses(result);
    } catch (err) {
      console.error("Error en diagnóstico de salud:", err);
      setError(
        err.message === "NO_ISSUE"
          ? "No se detectaron problemas visibles en la imagen."
          : "Ocurrió un error al analizar la salud de la planta"
      );
    } finally {
      setProgress(100);
      setTimeout(() => setLoading(false), 350);
    }
  };

  if (loading) {
    return <LoadingScreen progress={progress} stepIndex={stepIndex} />;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push({ pathname: "/camera", params: { mode: "disease", plantName } })}
        >
          <Text style={styles.actionButtonText}>Tomar otra foto</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => router.back()}
        >
          <Text style={[styles.actionButtonText, styles.secondaryText]}>
            Volver
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Image source={{ uri: imageUri }} style={styles.heroImage} />
      <View style={styles.content}>
        <Text style={styles.title}>Diagnóstico de salud</Text>
        <Text style={styles.subtitle}>
          {plantName
            ? `Revisando posibles problemas en ${plantName}`
            : "Este diagnóstico analiza si tu planta muestra señales de enfermedad."}
        </Text>

        {diagnoses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No se detectaron problemas claros en esta imagen.
            </Text>
          </View>
        ) : (
          diagnoses.map((item, index) => (
            <View key={`${item.name}-${index}`} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.probabilityText}>
                  {Math.round(item.probability * 100)}%
                </Text>
              </View>
              <Text style={styles.cardLabel}>Descripción</Text>
              <Text style={styles.cardText}>{item.description}</Text>
              {item.treatment ? (
                <>
                  <Text style={styles.cardLabel}>Qué hacer</Text>
                  <Text style={styles.cardText}>{item.treatment}</Text>
                </>
              ) : null}
            </View>
          ))
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push({ pathname: "/camera", params: { mode: "disease", plantName } })}
        >
          <Text style={styles.actionButtonText}>Escanear otra área</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => router.back()}
        >
          <Text style={[styles.actionButtonText, styles.secondaryText]}>
            Volver a la planta
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#06140e",
  },
  heroImage: {
    width: "100%",
    height: 260,
  },
  content: {
    padding: 20,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#06140e",
  },
  loadingEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  loadingTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  loadingStep: {
    color: "#a7b4ab",
    textAlign: "center",
    marginBottom: 20,
  },
  loadingPercent: {
    color: "white",
    fontWeight: "700",
    marginTop: 12,
  },
  loadingTip: {
    color: "#a7b4ab",
    marginTop: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: "#2c8b44",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 16,
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#18392b",
  },
  secondaryText: {
    color: "#b9d9c1",
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#c7d7cc",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#0f2b1c",
    padding: 18,
    borderRadius: 18,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  probabilityText: {
    color: "#8bdd8a",
    fontSize: 15,
    fontWeight: "700",
  },
  cardLabel: {
    color: "#9cb89f",
    fontWeight: "700",
    marginTop: 10,
  },
  cardText: {
    color: "#d8e8d7",
    marginTop: 6,
    lineHeight: 21,
  },
  emptyCard: {
    padding: 20,
    borderRadius: 18,
    backgroundColor: "#0f2b1c",
    marginBottom: 16,
  },
  emptyText: {
    color: "#c7d7cc",
    lineHeight: 22,
    textAlign: "center",
  },
});

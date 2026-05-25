import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../src/config/firebase";

// ─── Servicios ────────────────────────────────────────────────────────────────
import { uploadToCloudinary } from "../src/services/cloudinaryService";
import { identifyPlantFromBase64 } from "../src/services/plantService";
import { traducirDetalles } from "../src/services/translationService";
import { getWikipediaImage } from "../src/services/wikipediaService";

// ─── Componentes ──────────────────────────────────────────────────────────────
import ProgressBar from "../src/components/ProgressBar";
import SuggestionCard from "../src/components/SuggestionCard";

// ─── Pasos de la barra de progreso ────────────────────────────────────────────
const STEPS = [
  { label: "Preparando imagen...",         emoji: "📷" },
  { label: "Consultando base botánica...", emoji: "🌿" },
  { label: "Buscando opciones...",         emoji: "🔍" },
  { label: "¡Casi listo!",                emoji: "✨" },
];

// ─── Pantalla de carga ────────────────────────────────────────────────────────
function LoadingScreen({ progress, stepIndex }) {
  const step = STEPS[Math.min(stepIndex, STEPS.length - 1)];
  return (
    <View style={styles.center}>
      <Text style={styles.loadingEmoji}>{step.emoji}</Text>
      <Text style={styles.loadingTitle}>Identificando planta</Text>
      <Text style={styles.loadingStep}>{step.label}</Text>
      <ProgressBar progress={progress} />
      <Text style={styles.loadingPercent}>{Math.round(progress)}%</Text>
      <Text style={styles.loadingTip}>
        💡 Tip: Fotografía una sola hoja o flor para mejor precisión
      </Text>
    </View>
  );
}

// ─── Fila de cuidado ──────────────────────────────────────────────────────────
function TipRow({ icon, label, value }) {
  return (
    <View style={styles.tipRow}>
      <Text style={styles.tipIcon}>{icon}</Text>
      <View style={styles.tipContent}>
        <Text style={styles.tipLabel}>{label}</Text>
        <Text style={styles.tipValue}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function IdentifyScreen() {
  const { imageUri, imageBase64 } = useLocalSearchParams();
  const router = useRouter();

  const [suggestions, setSuggestions] = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState(null);
  const [progress,    setProgress]    = useState(0);
  const [stepIndex,   setStepIndex]   = useState(0);

  const advanceTo = (target, newStep) => {
    if (newStep !== undefined) setStepIndex(newStep);
    setProgress(target);
  };

  useEffect(() => { if (imageBase64) runIdentification(); }, [imageBase64]);

  const runIdentification = async () => {
    try {
      setError(null);

      // 1. Llamar a Plant.id
      advanceTo(20, 1);
      const rawSuggestions = await identifyPlantFromBase64(imageBase64);
      advanceTo(55, 1);

      // 2. Traducir detalles de las 3 sugerencias en paralelo
      advanceTo(60, 2);
      await Promise.all(
        rawSuggestions.map(async (s) => {
          s.details = await traducirDetalles(s.details);
        })
      );

      // 3. Buscar imágenes de Wikipedia en paralelo
      advanceTo(80, 2);
      await Promise.all(
        rawSuggestions.map(async (s) => {
          s.wikiImage = await getWikipediaImage(s.name);
        })
      );

      advanceTo(95, 3);
      setSuggestions(rawSuggestions);
      setSelected(rawSuggestions[0]);

    } catch (err) {
      console.error("Error identificando planta:", err);
      setError(
        err.message === "NO_MATCH"
          ? "No se pudo identificar la planta"
          : "Ocurrió un error al analizar la imagen"
      );
    } finally {
      setProgress(100);
      setTimeout(() => setLoading(false), 350);
    }
  };

  const savePlant = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      const user = auth.currentUser;
      if (!user) return;

      const imageUrl = await uploadToCloudinary(imageBase64);
      const details  = selected.details || {};

      await addDoc(collection(db, "users", user.uid, "plants"), {
        name: selected.name,
        commonNames: details.common_names || [],
        probability: selected.probability,
        description: details.description?.value || "",
        watering: details.best_watering || "",
        light: details.best_light_condition || "",
        soilType: details.best_soil_type || "",
        toxicity: details.toxicity || "",
        propagation: details.propagation_methods || [],
        imageUrl,
        wateringFrequencyDays: selected.carePlan?.watering || 5,
        createdAt: serverTimestamp(),
        lastWatered: serverTimestamp(),
        carePlan: {
          fertilizing: {
            frequencyDays: selected.carePlan?.fertilizing || 30,
            lastDate: serverTimestamp(),
          },
          pruning: {
            frequencyDays: selected.carePlan?.pruning || 60,
            lastDate: serverTimestamp(),
          },
          pest_control: {
            frequencyDays: selected.carePlan?.pest_control || 21,
            lastDate: serverTimestamp(),
          },
        },
      });


      router.replace("/(tabs)");
    } catch (err) {
      console.error("Error guardando planta:", err.message);
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) return <LoadingScreen progress={progress} stepIndex={stepIndex} />;

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorEmoji}>😢</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryText}>Intentar de nuevo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const details = selected?.details || {};

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Image source={{ uri: imageUri }} style={styles.heroImage} />

      {/* Selector de sugerencias */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>¿Cuál es tu planta?</Text>
        <Text style={styles.sectionSubtitle}>Toca la opción que más se parezca</Text>

        {suggestions.map((s, i) => (
          <SuggestionCard
            key={s.name + i}
            suggestion={s}
            index={i}
            isSelected={selected?.name === s.name}
            onSelect={setSelected}
          />
        ))}
      </View>

      {/* Detalles de la seleccionada */}
      {selected && (
        <>
          {details.description?.value ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📖 Sobre esta planta</Text>
              <Text style={styles.cardText}>{details.description.value}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>🌱 Cuidados</Text>
            {details.best_watering          && <TipRow icon="💧" label="Riego"      value={details.best_watering} />}
            {details.best_light_condition   && <TipRow icon="☀️" label="Luz"        value={details.best_light_condition} />}
            {details.best_soil_type         && <TipRow icon="🪴" label="Suelo"      value={details.best_soil_type} />}
            {details.toxicity               && <TipRow icon="⚠️" label="Toxicidad"  value={details.toxicity} />}
            {!details.best_watering && !details.best_light_condition && !details.best_soil_type && !details.toxicity && (
              <Text style={styles.cardText}>No hay información de cuidados disponible.</Text>
            )}
          </View>
        </>
      )}

      {/* Guardar */}
      <TouchableOpacity
        style={[styles.saveButton, (saving || !selected) && styles.saveButtonDisabled]}
        onPress={savePlant}
        disabled={saving || !selected}
      >
        {saving ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.saveButtonText}>{`Guardar "${details.common_names?.[0] || selected?.name}" 🌿`}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
        <Text style={styles.cancelText}>Descartar</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8faf7" },
  heroImage: { width: "100%", height: 220, resizeMode: "cover" },

  section: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#1a2e1a", marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: "#888", marginBottom: 16 },

  card: {
    backgroundColor: "white", margin: 16, marginBottom: 0, borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1a2e1a", marginBottom: 12 },
  cardText: { fontSize: 14, color: "#444", lineHeight: 22 },

  tipRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12, gap: 12 },
  tipIcon: { fontSize: 22, marginTop: 2 },
  tipContent: { flex: 1 },
  tipLabel: { fontSize: 11, color: "#888", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  tipValue: { fontSize: 14, color: "#333", marginTop: 2 },

  saveButton: { backgroundColor: "#2e7d32", marginHorizontal: 16, marginTop: 24, padding: 16, borderRadius: 14, alignItems: "center" },
  saveButtonDisabled: { backgroundColor: "#81c784" },
  saveButtonText: { color: "white", fontWeight: "bold", fontSize: 15 },
  cancelButton: { marginHorizontal: 16, marginTop: 10, padding: 14, borderRadius: 14, alignItems: "center", borderWidth: 1, borderColor: "#ddd" },
  cancelText: { color: "#888", fontSize: 15 },

  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 30, backgroundColor: "#1a2e1a" },
  loadingEmoji: { fontSize: 52, marginBottom: 8 },
  loadingTitle: { fontSize: 22, fontWeight: "bold", color: "white", marginBottom: 4 },
  loadingStep: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 4 },
  loadingPercent: { fontSize: 13, color: "#81c784", fontWeight: "700", alignSelf: "flex-end", marginTop: 6 },
  loadingTip: { marginTop: 32, fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 20, paddingHorizontal: 10 },

  errorEmoji: { fontSize: 48 },
  errorText: { fontSize: 16, color: "#555", textAlign: "center" },
  retryButton: { backgroundColor: "#4CAF50", paddingVertical: 12, paddingHorizontal: 28, borderRadius: 12, marginTop: 8 },
  retryText: { color: "white", fontWeight: "bold" },
});

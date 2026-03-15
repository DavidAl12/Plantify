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

const PLANT_ID_KEY = "zIMciTaQoPoHdut1rzXW5lEGIWK8y30OyibI05e9Ltanb6HhRU";
const CLOUDINARY_CLOUD_NAME = "dsmeua9up";
const CLOUDINARY_UPLOAD_PRESET = "plantify_uploads";

// ─── Traducción con MyMemory API (gratuita, sin API key) ──────────────────────

const traducirTexto = async (texto) => {
  if (!texto) return "";
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(texto)}&langpair=en|es`
    );
    const data = await res.json();
    return data?.responseData?.translatedText || texto;
  } catch {
    return texto; // si falla, devuelve el original
  }
};


// ─── Subir imagen a Cloudinary  ──────

const uploadToCloudinary = async (base64) => {
  const formData = new FormData();
  formData.append("file", `data:image/jpeg;base64,${base64}`);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", "plantify");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Cloudinary error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  return data.secure_url; // URL pública de la imagen
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function IdentifyScreen() {
  const { imageUri, imageBase64 } = useLocalSearchParams();
  const router = useRouter();
  const [plant, setPlant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (imageBase64) identifyPlant();
  }, [imageBase64]);

  const identifyPlant = async () => {
    try {
      setError(null);
      const base64WithPrefix = `data:image/jpeg;base64,${imageBase64}`;

      const response = await fetch(
        "https://plant.id/api/v3/identification?details=common_names,description,best_watering,best_light_condition,best_soil_type,toxicity,propagation_methods&language=es",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Api-Key": PLANT_ID_KEY,
          },
          body: JSON.stringify({ images: [base64WithPrefix] }),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("plant.id error:", response.status, errorBody);
        throw new Error(`Error de API: ${response.status}`);
      }

      const data = await response.json();
      const suggestion = data?.result?.classification?.suggestions?.[0];

      if (suggestion) {
        if (suggestion?.details) {
  const d = suggestion.details;
  // Traducir en paralelo para que sea más rápido
  const [watering, light, soil, toxicity] = await Promise.all([
    traducirTexto(d.best_watering || ""),
    traducirTexto(d.best_light_condition || ""),
    traducirTexto(d.best_soil_type || ""),
    traducirTexto(d.toxicity || ""),
  ]);
  d.best_watering = watering;
  d.best_light_condition = light;
  d.best_soil_type = soil;
  d.toxicity = toxicity;
}
        
        setPlant(suggestion);
      } else {
        setError("No se pudo identificar la planta");
      }
    } catch (err) {
      console.error("Error identificando planta:", err);
      setError("Ocurrió un error al analizar la imagen");
    } finally {
      setLoading(false);
    }
  };

  const savePlant = async () => {
    try {
      setSaving(true);
      const user = auth.currentUser;
      if (!user || !plant) return;

      // ✅ Subir imagen a Cloudinary — gratuito y funciona en Expo Go
      const imageUrl = await uploadToCloudinary(imageBase64);

      const details = plant.details || {};
      const wateringRaw = details.best_watering || "";

      await addDoc(collection(db, "users", user.uid, "plants"), {
        name: plant.name,
        commonNames: details.common_names || [],
        probability: plant.probability,
        description: details.description?.value || "",
        watering: details.best_watering || "",
        light: details.best_light_condition || "",
        soilType: details.best_soil_type || "",
        toxicity: details.toxicity || "",
        propagation: details.propagation_methods || [],
        imageUrl,
        wateringFrequencyDays: estimateWateringDays(wateringRaw),
        createdAt: serverTimestamp(),
        lastWatered: serverTimestamp(),
      });

      router.replace("/(tabs)");
    } catch (err) {
      console.error("Error guardando planta:", err.message);
    } finally {
      setSaving(false);
    }
  };

  // ─── Estados de UI ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Analizando tu planta...</Text>
        <Text style={styles.loadingSubtext}>Consultando base de datos botánica 🌿</Text>
      </View>
    );
  }

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

  const details = plant?.details || {};
  const commonNames = details.common_names || [];
  const description = details.description?.value || "";
  const watering = details.best_watering || "";
  const light = details.best_light_condition || "";
  const soil = details.best_soil_type || "";
  const toxicity = details.toxicity || "";

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Image source={{ uri: imageUri }} style={styles.image} />

      <View style={styles.header}>
        <Text style={styles.title}>{plant.name}</Text>
        {commonNames.length > 0 && (
          <Text style={styles.commonName}>
            También conocida como: {commonNames.slice(0, 2).join(", ")}
          </Text>
        )}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {(plant.probability * 100).toFixed(1)}% de coincidencia
          </Text>
        </View>
      </View>

      {description !== "" && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📖 Sobre esta planta</Text>
          <Text style={styles.cardText}>{description}</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🌱 Cuidados</Text>
        {watering !== "" && (
          <View style={styles.tipRow}>
            <Text style={styles.tipIcon}>💧</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipLabel}>Riego</Text>
              <Text style={styles.tipValue}>{watering}</Text>
            </View>
          </View>
        )}
        {light !== "" && (
          <View style={styles.tipRow}>
            <Text style={styles.tipIcon}>☀️</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipLabel}>Luz</Text>
              <Text style={styles.tipValue}>{light}</Text>
            </View>
          </View>
        )}
        {soil !== "" && (
          <View style={styles.tipRow}>
            <Text style={styles.tipIcon}>🪴</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipLabel}>Suelo</Text>
              <Text style={styles.tipValue}>{soil}</Text>
            </View>
          </View>
        )}
        {toxicity !== "" && (
          <View style={styles.tipRow}>
            <Text style={styles.tipIcon}>⚠️</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipLabel}>Toxicidad</Text>
              <Text style={styles.tipValue}>{toxicity}</Text>
            </View>
          </View>
        )}
        {watering === "" && light === "" && soil === "" && toxicity === "" && (
          <Text style={styles.cardText}>No hay información de cuidados disponible.</Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={savePlant}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.saveButtonText}>Guardar en mi colección 🌿</Text>
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
  image: { width: "100%", height: 300, resizeMode: "cover" },
  header: { padding: 20, paddingBottom: 0 },
  title: { fontSize: 26, fontWeight: "bold", color: "#1a2e1a", fontStyle: "italic" },
  commonName: { fontSize: 14, color: "#666", marginTop: 4 },
  badge: {
    backgroundColor: "#e8f5e9",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 10,
  },
  badgeText: { color: "#2e7d32", fontWeight: "600", fontSize: 13 },
  card: {
    backgroundColor: "white",
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1a2e1a", marginBottom: 12 },
  cardText: { fontSize: 14, color: "#444", lineHeight: 22 },
  tipRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12, gap: 12 },
  tipIcon: { fontSize: 22, marginTop: 2 },
  tipContent: { flex: 1 },
  tipLabel: {
    fontSize: 11,
    color: "#888",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tipValue: { fontSize: 14, color: "#333", marginTop: 2 },
  saveButton: {
    backgroundColor: "#2e7d32",
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  saveButtonDisabled: { backgroundColor: "#81c784" },
  saveButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  cancelButton: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelText: { color: "#888", fontSize: 15 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    gap: 12,
    backgroundColor: "#f8faf7",
  },
  loadingText: { fontSize: 18, fontWeight: "600", color: "#333", marginTop: 16 },
  loadingSubtext: { fontSize: 14, color: "#888" },
  errorEmoji: { fontSize: 48 },
  errorText: { fontSize: 16, color: "#555", textAlign: "center" },
  retryButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginTop: 8,
  },
  retryText: { color: "white", fontWeight: "bold" },
});
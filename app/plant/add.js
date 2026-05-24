import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AppHeader from "../../components/ui/AppHeader";
import { auth, db } from "../../src/config/firebase";
import * as NotificationUtils from "../../src/utils/notificationUtils";
import { COLORS } from "../../styles/colors";

const { width } = Dimensions.get("window");

export default function AddPlant() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("");
  const [fertilizing, setFertilizing] = useState("");
  const [pruning, setPruning] = useState("");
  const [pest, setPest] = useState("");
  const [description, setDescription] = useState("");
  const [manualImageUri, setManualImageUri] = useState(null);

  const handleSave = async () => {
    if (!name) {
      alert("Por favor ingresa el nombre de la planta");
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      const watering = Number(frequency) || 3;
      const fertilizingDays = Number(fertilizing) || 30;
      const pruningDays = Number(pruning) || 60;
      const pestDays = Number(pest) || 21;

      await addDoc(collection(db, "users", user.uid, "plants"), {
        name,
        commonNames: [name],
        wateringFrequencyDays: watering,
        lastWatered: new Date(),
        imageUrl: manualImageUri || null,
        image: manualImageUri || null,
        description: description.trim() || null,

        carePlan: {
          fertilizing: {
            frequencyDays: fertilizingDays,
            lastDate: new Date(),
          },
          pruning: {
            frequencyDays: pruningDays,
            lastDate: new Date(),
          },
          pest_control: {
            frequencyDays: pestDays,
            lastDate: new Date(),
          },
        },

        createdAt: serverTimestamp(),
      });

      // ✅ Reprogramar notificaciones después de agregar la planta
      try {
        await NotificationUtils.scheduleNextNotifications();
        console.log("Notificaciones reprogramadas después de agregar planta");
      } catch (error) {
        console.log("Error reprogramando notificaciones:", error);
      }

      setLoading(false);
      router.replace("/(tabs)/garden");
    } catch (error) {
      setLoading(false);
      console.log(error);
      alert("Error al guardar la planta");
    }
  };

  const takeManualPhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== "granted") {
        alert("Se necesita permiso para usar la cámara");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        setManualImageUri(asset.uri);
      }
    } catch (error) {
      console.log("Error tomando foto manual:", error);
    }
  };

  const pickManualImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== "granted") {
        alert("Se necesita permiso para acceder a la galería");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        setManualImageUri(asset.uri);
      }
    } catch (error) {
      console.log("Error seleccionando imagen manual:", error);
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.3,
        base64: true,
      });

      if (!result.canceled) {
        const asset = result.assets[0];

        if (!asset.base64 || asset.base64.length < 1000) {
          alert("Imagen no válida, intenta con otra");
          return;
        }

        console.log("Base64 tamaño:", asset.base64.length);

        router.push({
          pathname: "/identify",
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

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Añadir Planta 🌱</Text>
          <Text style={styles.subtitle}>
            Usa la cámara o galería para identificar automáticamente
          </Text>
        </View>

        {/* IMAGEN - MÉTODOS */}
        <Text style={styles.sectionTitle}>Identificar tu planta</Text>
        
        <TouchableOpacity
          style={styles.imageMethodCard}
          onPress={() => router.push("/camera")}
          activeOpacity={0.9}
        >
          <View
            style={[
              styles.methodIconContainer,
              { backgroundColor: COLORS.primary + "20" },
            ]}
          >
            <Ionicons name="camera" size={32} color={COLORS.primary} />
          </View>
          <View style={styles.methodContent}>
            <Text style={styles.methodTitle}>Tomar foto</Text>
            <Text style={styles.methodSubtitle}>
              Usa la cámara para identificar automáticamente
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={COLORS.outlineVariant} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.imageMethodCard}
          onPress={pickImage}
          activeOpacity={0.9}
        >
          <View
            style={[
              styles.methodIconContainer,
              { backgroundColor: COLORS.secondary + "20" },
            ]}
          >
            <Ionicons name="image" size={32} color={COLORS.secondary} />
          </View>
          <View style={styles.methodContent}>
            <Text style={styles.methodTitle}>Galería</Text>
            <Text style={styles.methodSubtitle}>
              Selecciona una imagen desde tu dispositivo
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={COLORS.outlineVariant} />
        </TouchableOpacity>

        {/* DATOS MANUALES */}
        <Text style={styles.sectionTitle}>O agrega manualmente</Text>
        <View style={styles.formCard}>
          <Text style={styles.formNote}>
            Opcional: agrega una foto para tu planta o llena los datos que conozcas.
          </Text>

          <View style={styles.imageActionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={takeManualPhoto}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={18} color={COLORS.primary} />
              <Text style={styles.actionButtonText}>Tomar foto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={pickManualImage}
              activeOpacity={0.8}
            >
              <Ionicons name="image" size={18} color={COLORS.secondary} />
              <Text style={styles.actionButtonText}>Galería</Text>
            </TouchableOpacity>
          </View>

          {manualImageUri ? (
            <View style={styles.previewCard}>
              <Image source={{ uri: manualImageUri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setManualImageUri(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.removeImageText}>Eliminar foto</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nombre de la planta</Text>
            <TextInput
              placeholder="Ej: Monstera deliciosa"
              placeholderTextColor={COLORS.onSurfaceVariant}
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Frecuencia de riego (días)</Text>
            <TextInput
              placeholder="Ej: 7"
              placeholderTextColor={COLORS.onSurfaceVariant}
              value={frequency}
              onChangeText={setFrequency}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          <View style={styles.formGroupRow}>
            <View style={styles.formHalf}>
              <Text style={styles.label}>Poda (días)</Text>
              <TextInput
                placeholder="Ej: 60"
                placeholderTextColor={COLORS.onSurfaceVariant}
                value={pruning}
                onChangeText={setPruning}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
            <View style={styles.formHalf}>
              <Text style={styles.label}>Abono (días)</Text>
              <TextInput
                placeholder="Ej: 30"
                placeholderTextColor={COLORS.onSurfaceVariant}
                value={fertilizing}
                onChangeText={setFertilizing}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Plagas (días)</Text>
            <TextInput
              placeholder="Ej: 21"
              placeholderTextColor={COLORS.onSurfaceVariant}
              value={pest}
              onChangeText={setPest}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              placeholder="Escribe una descripción o notas sobre tu planta"
              placeholderTextColor={COLORS.onSurfaceVariant}
              value={description}
              onChangeText={setDescription}
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: COLORS.primary },
            ]}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={COLORS.onPrimary}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.saveButtonText}>Guardar planta</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.onSurface,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.onSurface,
    marginBottom: 12,
    marginTop: 20,
  },
  imageMethodCard: {
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  methodIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  methodSubtitle: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    lineHeight: 16,
  },
  formCard: {
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: 24,
    padding: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 20,
  },
  formNote: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 20,
  },
  imageActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionButtonText: {
    color: COLORS.onSurface,
    fontWeight: "600",
    fontSize: 14,
  },
  previewCard: {
    marginBottom: 16,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: COLORS.surfaceContainerLow,
  },
  previewImage: {
    width: "100%",
    height: 180,
  },
  removeImageButton: {
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: COLORS.surfaceWhite,
  },
  removeImageText: {
    color: COLORS.error,
    fontWeight: "700",
  },
  formGroup: {
    marginBottom: 18,
  },
  formGroupRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  formHalf: {
    flex: 1,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.onSurface,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: COLORS.onSurface,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  saveButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  saveButtonText: {
    color: COLORS.onPrimary,
    fontWeight: "700",
    fontSize: 16,
  },
});
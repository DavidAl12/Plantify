import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef(null);
  const router = useRouter();

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>Necesitamos permiso para usar la cámara 📷</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Dar permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current || loading) return;
    setLoading(true);

    try {
      // quality: 0.15 — suficiente para identificación, base64 mucho más pequeño = más rápido
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.15,
        base64: true,
        skipProcessing: true,
      });

      router.push({
        pathname: "/identify",
        params: {
          imageUri: photo.uri,
          imageBase64: photo.base64,
        },
      });
    } catch (error) {
      console.error("Error tomando foto:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <CameraView style={{ flex: 1 }} ref={cameraRef} facing="back" />

      <View style={styles.overlay}>
        <View style={styles.frameGuide} />
        <Text style={styles.hint}>Centra la planta en el recuadro</Text>
      </View>

      <View style={styles.captureContainer}>
        {loading ? (
          <ActivityIndicator color="white" size="large" />
        ) : (
          <TouchableOpacity style={styles.captureButton} onPress={takePicture} activeOpacity={0.8}>
            <View style={styles.captureInner} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  captureContainer: {
    position: "absolute",
    bottom: 50,
    width: "100%",
    alignItems: "center",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "white",
  },
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  frameGuide: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.7)",
    borderRadius: 20,
    borderStyle: "dashed",
  },
  hint: {
    color: "rgba(255,255,255,0.9)",
    marginTop: 12,
    fontSize: 14,
    fontWeight: "500",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  permText: { fontSize: 16, textAlign: "center", color: "#333" },
  button: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 15 },
});
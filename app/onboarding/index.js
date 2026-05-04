// app/onboarding/index.js
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth } from "../../src/config/firebase";
import { COLORS } from "../../styles/colors";

export default function Onboarding() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/(tabs)");
      }
    });

    return unsubscribe;
  }, [router]);

  return (
    <View style={styles.container}>
      {/* Decorativo superior izquierdo */}
      <Text style={styles.decorTopLeft}>🌿</Text>

      {/* Decorativo inferior derecho */}
      <Text style={styles.decorBottomRight}>🌱</Text>

      {/* Contenido principal */}
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoRow}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Tarjeta central */}
        <View style={styles.card}>
          {/* Textos */}
          <View style={styles.textBlock}>
            <Text style={styles.welcomeTitle}>Bienvenido</Text>
            <Text style={styles.subtitle}>
              Cultiva tu propio Jardin en casa con confianza
            </Text>
            <Text style={styles.description}>
              Plantify te ayuda a gestionar y cuidar tus plantas con programas
              de riego personalizados y consejos botánicos expertos.
            </Text>
          </View>

          {/* Botones */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.buttonPrimary}
              onPress={() => router.push("/(auth)/login")}
              activeOpacity={0.85}
            >
              <Text style={styles.buttonPrimaryText}>Iniciar sesión</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buttonOutline}
              onPress={() => router.push("/(auth)/register")}
              activeOpacity={0.85}
            >
              <Text style={styles.buttonOutlineText}>Registrarse</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          SE PARTE DE LOS AMANTES Y APASIONADOS DE LAS PLANTAS QUE EXISTEN EN
          TODO EL MUNDO
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  decorTopLeft: {
    position: "absolute",
    top: -10,
    left: -10,
    fontSize: 120,
    opacity: 0.15,
    transform: [{ rotate: "12deg" }],
  },
  decorBottomRight: {
    position: "absolute",
    bottom: -20,
    right: -10,
    fontSize: 150,
    opacity: 0.12,
    transform: [{ rotate: "-45deg" }],
  },
  content: {
    width: "100%",
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 24,
    zIndex: 10,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  logoImage: {
    width: 150,
    height: 150,
  },
  appName: {
    fontSize: 34,
    fontWeight: "800",
    color: COLORS.onSurface,
    letterSpacing: -0.5,
  },
  card: {
    width: "100%",
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: 24,
    padding: 32,
    gap: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  textBlock: {
    width: "100%",
    alignItems: "center",
    gap: 10,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.onSurface,
    fontStyle: "italic",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.primary,
    textAlign: "center",
    opacity: 0.85,
  },
  description: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 22,
  },
  buttonContainer: {
    width: "100%",
    gap: 14,
  },
  buttonPrimary: {
    width: "100%",
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPrimaryText: {
    color: COLORS.onPrimary,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  buttonOutline: {
    width: "100%",
    backgroundColor: "transparent",
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.primary + "33",
  },
  buttonOutlineText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "700",
  },
  footerText: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
    letterSpacing: 1,
    opacity: 0.6,
    paddingTop: 8,
  },
});

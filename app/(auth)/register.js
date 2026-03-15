// app/(auth)/register.js
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { auth } from "../../src/config/firebase";
import { COLORS } from "../../styles/colors";

export default function Register() {
  const router = useRouter();

  // Estados del formulario
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Lógica de registro
  const handleRegister = async () => {
    // Validación campos vacíos
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Todos los campos son obligatorios");
      return;
    }

    // Validación contraseñas iguales
    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    // Validación longitud mínima
    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener mínimo 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      // Crea usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // Guarda el nombre en el perfil
      await updateProfile(userCredential.user, {
        displayName: name,
      });

      // Navega a la app principal
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Scroll principal
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Círculo decorativo top izquierda */}
      <View style={styles.decorTopLeft} />

      {/* Círculo decorativo mitad derecha */}
      <View style={styles.decorMidRight} />

      <View style={styles.inner}>
        {/* Sección de título y subtítulo */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>
            Únete hoy a nuestra comunidad de amantes de las plantas.
          </Text>
        </View>

        {/* Tarjeta del formulario */}
        <View style={styles.form}>
          {/* Campo nombre */}
          <Input
            label="Nombre de usuario"
            placeholder="NombreDeUsuario24"
            value={name}
            onChangeText={setName}
            icon={
              <Ionicons
                name="person-outline"
                size={20}
                color={COLORS.onSurfaceVariant}
              />
            }
            autoCapitalize="words"
          />

          {/* Campo email */}
          <Input
            label="Correo electrónico"
            placeholder="hola@jardin.com"
            value={email}
            onChangeText={setEmail}
            icon={
              <Ionicons
                name="mail-outline"
                size={20}
                color={COLORS.onSurfaceVariant}
              />
            }
            keyboardType="email-address"
          />

          {/* Campo contraseña */}
          <Input
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            icon={
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={COLORS.onSurfaceVariant}
              />
            }
            secureTextEntry
          />

          {/* Campo confirmar contraseña */}
          <Input
            label="Confirmar contraseña"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            icon={
              <Ionicons
                name="lock-open-outline"
                size={20}
                color={COLORS.onSurfaceVariant}
              />
            }
            secureTextEntry
          />

          {/* Botón principal de registro */}
          <Button
            title="Registrarse"
            onPress={handleRegister}
            loading={loading}
          />
        </View>

        {/* Línea divisora con texto */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>O REGÍSTRATE CON</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Botones de registro social */}
        <View style={styles.socialColumn}>
          {/* Botón Google */}
          <TouchableOpacity style={styles.socialButtonWide}>
            <Image
              source={require("../../assets/images/google-logo.png")}
              style={styles.socialLogo}
              resizeMode="contain"
            />
            <Text style={styles.socialButtonText}>Continuar con Google</Text>
          </TouchableOpacity>

          {/* Botón Microsoft */}
          <TouchableOpacity style={styles.socialButtonWide}>
            <Image
              source={require("../../assets/images/microsoft-logo.png")}
              style={styles.socialLogo}
              resizeMode="contain"
            />
            <Text style={styles.socialButtonText}>Continuar con Microsoft</Text>
          </TouchableOpacity>
        </View>

        {/* Link a login */}
        <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
          <Text style={styles.footerText}>
            ¿Ya tienes una cuenta?{" "}
            <Text style={styles.footerLink}>Iniciar sesión</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Scroll contenedor raíz
  scroll: {
    flex: 1,
    backgroundColor: "#f7f7f6",
  },

  // Contenido interno del scroll
  container: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  // Círculo decorativo top izquierda
  decorTopLeft: {
    position: "absolute",
    top: -80,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: COLORS.secondaryContainer,
    opacity: 0.2,
  },

  // Círculo decorativo mitad derecha
  decorMidRight: {
    position: "absolute",
    top: "40%",
    right: -120,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: COLORS.primaryContainer,
    opacity: 0.1,
  },

  // Contenedor del contenido principal
  inner: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 24,
  },

  // Sección título y subtítulo
  titleSection: {
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },

  // Título principal
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.onSurface,
    letterSpacing: -0.5,
    textAlign: "center",
  },

  // Subtítulo descriptivo
  subtitle: {
    fontSize: 15,
    color: COLORS.onSurfaceVariant,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 22,
  },

  // Tarjeta blanca del formulario
  form: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 20,
    padding: 24,
    gap: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // Contenedor del divisor
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  // Línea horizontal del divisor
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.outlineVariant + "50",
  },

  // Texto del divisor
  dividerText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.onSurfaceVariant,
    opacity: 0.6,
    letterSpacing: 1.5,
  },

  // Columna de botones sociales
  socialColumn: {
    width: "100%",
    gap: 12,
  },

  // Botón social ancho
  socialButtonWide: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 14,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + "40",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  // Logo del proveedor social
  socialLogo: {
    width: 22,
    height: 22,
  },

  // Texto del botón social
  socialButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.onSurface,
  },

  // Texto del footer
  footerText: {
    textAlign: "center",
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
  },

  // Link del footer
  footerLink: {
    color: COLORS.primary,
    fontWeight: "700",
  },
});

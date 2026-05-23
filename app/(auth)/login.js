// app/(auth)/login.js
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { useEffect, useState } from "react";
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
import { useSocialAuth } from "../../src/hooks/useSocialAuth";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const {
    loading: socialLoading,
    loginWithGoogle,
    loginWithMicrosoft,
  } = useSocialAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/(tabs)");
      }
    });

    return unsubscribe;
  }, [router]);

  const validateField = (name, value) => {
    if (name === "email") {
      if (!value) return "El correo es obligatorio";
      if (!/\S+@\S+\.\S+/.test(value)) return "Correo inválido";
    }

    if (name === "password") {
      if (!value) return "La contraseña es obligatoria";
    }

    return "";
  };

  const validate = () => {
    const emailError = validateField("email", email);
    const passwordError = validateField("password", password);

    setErrors({
      email: emailError,
      password: passwordError,
    });

    return !emailError && !passwordError;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/(tabs)");
    } catch (error) {
      console.log("Firebase error:", error.code);

      if (error.code === "auth/user-not-found") {
        setErrors((prev) => ({
          ...prev,
          email: "El usuario no existe",
        }));
      } else if (error.code === "auth/wrong-password") {
        setErrors((prev) => ({
          ...prev,
          password: "Contraseña incorrecta",
        }));
      } else if (error.code === "auth/invalid-email") {
        setErrors((prev) => ({
          ...prev,
          email: "Correo inválido",
        }));
      } else if (error.code === "auth/invalid-credential") {
        setErrors({
          email: "Correo o contraseña incorrectos",
          password: "Correo o contraseña incorrectos",
        });
      } else {
        // fallback
        setErrors((prev) => ({
          ...prev,
          password: "Error al iniciar sesión",
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const emailError = validateField("email", email);

    if (emailError) {
      setErrors((prev) => ({
        ...prev,
        email: emailError,
      }));
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);

      Alert.alert("Enviado", "Revisa tu correo para recuperar tu contraseña");
    } catch (error) {
      let message = "No se pudo enviar el correo";

      if (error.code === "auth/invalid-email") {
        message = "Correo inválido";
      } else if (error.code === "auth/user-not-found") {
        message = "El usuario no existe";
      }

      setErrors((prev) => ({
        ...prev,
        email: message,
      }));
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Decorativos */}
      <Text style={styles.decorTopLeft}>🌿</Text>
      <Text style={styles.decorBottomRight}>🌱</Text>

      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoBox}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Ingresa a tu cuenta</Text>
          <Text style={styles.subtitle}>Continúa tu viaje botánico</Text>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          <Input
            label="Usuario o Correo electrónico"
            placeholder="ejemplo@plantify.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);

              setErrors((prev) => ({
                ...prev,
                email: validateField("email", text),
              }));
            }}
            error={errors.email}
            icon={
              <Ionicons
                name="person-outline"
                size={20}
                color={COLORS.onSurfaceVariant}
              />
            }
            keyboardType="email-address"
          />

          {/* Contraseña + link olvidé */}
          <View style={styles.passwordBlock}>
            <View style={styles.passwordHeader}>
              <Text style={styles.passwordLabel}>Contraseña</Text>
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotLink}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            </View>
            <Input
              placeholder="••••••••"
              value={password}
              onChangeText={(text) => {
                setPassword(text);

                setErrors((prev) => ({
                  ...prev,
                  password: validateField("password", text),
                }));
              }}
              secureTextEntry
              error={errors.password}
            />
          </View>

          {/* Botón principal */}
          <Button
            title="Iniciar Sesión"
            onPress={handleLogin}
            loading={loading || socialLoading}
          />

          {/* Divisor */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>O CONÉCTATE CON</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Botones sociales */}
          <View style={styles.socialColumn}>
            {/* Botón Google */}
            <TouchableOpacity
              style={[
                styles.socialButtonWide,
                (loading || socialLoading) && { opacity: 0.6 }
              ]}
              onPress={loginWithGoogle}
              disabled={loading || socialLoading}
            >
              <Image
                source={require("../../assets/images/google-logo.png")}
                style={styles.socialLogo}
                resizeMode="contain"
              />
              <Text style={styles.socialButtonText}>
                {socialLoading ? "Cargando..." : "Continuar con Google"}
              </Text>
            </TouchableOpacity>

            {/* Botón Microsoft */}
            <TouchableOpacity
              style={[
                styles.socialButtonWide,
                (loading || socialLoading) && { opacity: 0.6 }
              ]}
              onPress={loginWithMicrosoft}
              disabled={loading || socialLoading}
            >
              <Image
                source={require("../../assets/images/microsoft-logo.png")}
                style={styles.socialLogo}
                resizeMode="contain"
              />
              <Text style={styles.socialButtonText}>
                {socialLoading ? "Cargando..." : "Continuar con Microsoft"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
          <Text style={styles.footerText}>
            ¿No tienes una cuenta?{" "}
            <Text style={styles.footerLink}>Únete al jardín</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#f7f7f6",
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    position: "relative",
  },
  decorTopLeft: {
    position: "absolute",
    top: -10,
    left: -10,
    fontSize: 100,
    opacity: 0.12,
    transform: [{ rotate: "45deg" }],
  },
  decorBottomRight: {
    position: "absolute",
    bottom: -20,
    right: -10,
    fontSize: 130,
    opacity: 0.15,
    transform: [{ rotate: "-12deg" }],
  },
  inner: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    gap: 24,
  },

  // Logo
  logoSection: {
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  logoImage: {
    width: 150,
    height: 150,
  },
  logoEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.onSurface,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.onSurfaceVariant,
    fontWeight: "500",
    textAlign: "center",
  },

  // Formulario
  form: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 20,
    padding: 24,
    gap: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // Contraseña
  passwordBlock: {
    gap: 6,
  },
  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginLeft: 4,
  },
  passwordLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.onSurfaceVariant,
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },

  // Divisor
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.outlineVariant + "50",
  },
  dividerText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.onSurfaceVariant,
    opacity: 0.6,
    letterSpacing: 1.5,
  },

  // Botones sociales
  socialColumn: {
    width: "100%",
    gap: 12,
  },
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
  socialButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.onSurface,
  },
  socialLogo: {
    width: 22,
    height: 22,
  },

  // Footer
  footerText: {
    textAlign: "center",
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
  },
  footerLink: {
    color: COLORS.primary,
    fontWeight: "700",
  },
});

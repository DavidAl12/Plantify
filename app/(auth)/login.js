import { useRouter } from "expo-router";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth } from "../../src/config/firebase";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Debes llenar todos los campos");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);

      // Si inicia sesión correctamente lo mandamos a tabs
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Error", "Correo o contraseña incorrectos");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Ingresa tu correo primero");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        "Recuperación enviada",
        "Revisa tu correo para cambiar la contraseña"
      );
    } catch (error) {
      Alert.alert("Error", "No se pudo enviar el correo");
    }
  };

  return (
  <View style={styles.container}>
    <Text style={styles.title}>Plantify</Text>

    <View style={styles.card}>
      <Text style={styles.label}>Email</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      <Text style={styles.label}>Contraseña</Text>
      <TextInput
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginText}>Iniciar Sesión</Text>
      </TouchableOpacity>

      <Text style={styles.or}>O</Text>

      <TouchableOpacity style={styles.googleButton}>
        <Text style={styles.googleText}>Continuar con Google</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
        <Text style={styles.register}>¿No tienes cuenta? Registrarse</Text>
      </TouchableOpacity>
    </View>
  </View>
);
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 20,
    elevation: 5,
  },
  label: {
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  loginButton: {
    backgroundColor: "#7a7a7a",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },
  loginText: {
    color: "white",
    fontWeight: "bold",
  },
  or: {
    textAlign: "center",
    marginBottom: 15,
  },
  googleButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },
  googleText: {
    fontWeight: "500",
  },
  register: {
    textAlign: "center",
    color: "#555",
  },
});
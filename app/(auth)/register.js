import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
import { auth } from "../../src/config/firebase";

export default function Register() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Todos los campos son obligatorios");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener mínimo 6 caracteres");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Guardamos el nombre en Firebase
      await updateProfile(userCredential.user, {
        displayName: name,
      });

      Alert.alert("Éxito", "Usuario creado correctamente");

      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Nombre</Text>
      <TextInput
        placeholder="Nombre"
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />

      <Text>Correo</Text>
      <TextInput
        placeholder="Correo"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />

      <Text>Contraseña</Text>
      <TextInput
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />

      <Text>Confirmar contraseña</Text>
      <TextInput
        placeholder="Confirmar contraseña"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />

      <Button title="Registrarse" onPress={handleRegister} />

      <View style={{ marginTop: 10 }}>
        <Button
          title="Ya tengo cuenta"
          onPress={() => router.push("/(auth)/login")}
        />
      </View>
    </View>
  );
}
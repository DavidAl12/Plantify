import { useRouter } from "expo-router";
import { Button, Text, View } from "react-native";

export default function Onboarding() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>
        Bienvenido a Plantify 🌿
      </Text>

      <Text style={{ textAlign: "center", marginBottom: 40 }}>
        Gestiona tus plantas, controla el riego y manténlas saludables fácilmente.
      </Text>

      <Button
        title="Continuar"
        onPress={() => router.replace("/(auth)/login")}
      />
    </View>
  );
}
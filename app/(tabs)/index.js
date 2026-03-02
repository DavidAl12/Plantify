import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
export default function Home() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      {" "}
      <Text style={styles.title}>🌿 Bienvenido a Plantify</Text>{" "}
      <Text style={styles.subtitle}> Aún no tienes plantas registradas </Text>{" "}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/plant/add")}
      >
        {" "}
        <Text style={styles.buttonText}>Agregar Planta</Text>{" "}
      </TouchableOpacity>{" "}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  subtitle: { marginBottom: 20, color: "gray" },
  button: { backgroundColor: "#4CAF50", padding: 15, borderRadius: 10 },
  buttonText: { color: "white", fontWeight: "bold" },
});

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../styles/colors";

export default function AppHeader({ showBack = false }) {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.header}>
        {/* IZQUIERDA */}
        <View style={styles.left}>
          {showBack && (
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.onSurface} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => router.replace("/(tabs)")}
            activeOpacity={0.7}
          >
            <Image
              source={require("../../assets/images/logo-header.png")}
              style={styles.logo}
            />
          </TouchableOpacity>
        </View>

        {/* DERECHA */}
        <TouchableOpacity
          onPress={() => router.push("/notifications")}
          activeOpacity={0.7}
          style={styles.notifBtn}
        >
          <Ionicons
            name="notifications-outline"
            size={22}
            color={COLORS.onSurface}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: "#fff",
  },

  header: {
    height: 70, // 🔥 CLAVE: altura fija
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#c2c9ba",
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceContainerLow ?? "#d3ffd2",
  },

  logo: {
    width: 130, // 🔥 un poquito más grande para consistencia visual
    height: 45,
  },

  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceContainerLow ?? "#d3ffd2",
  },
});

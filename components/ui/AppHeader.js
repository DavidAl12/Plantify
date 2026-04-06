import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../styles/colors";

export default function AppHeader({ showBack = true }) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      {/* IZQUIERDA */}
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={() => router.replace("/(tabs)")}>
            <Ionicons name="arrow-back" size={24} color={COLORS.onSurface} />
          </TouchableOpacity>
        )}

        <Image
          source={require("../../assets/images/logo-header.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* DERECHA */}
      <TouchableOpacity>
        <Ionicons
          name="notifications-outline"
          size={24}
          color={COLORS.onSurface}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: COLORS.background,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 5,
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  logo: {
    width: 120,
    height: 120,
  },
});

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../src/config/firebase";
import { COLORS } from "../../styles/colors";

export default function Profile() {
  const router = useRouter();

  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(auth.currentUser);
  }, []);

  // 🔥 LOGOUT
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/(auth)/login");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Plantify</Text>
        <Ionicons name="notifications-outline" size={24} />
      </View>

      {/* Perfil */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: user?.photoURL || "https://i.imgur.com/6VBx3io.png",
            }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="pencil" size={14} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.name}>{user?.displayName || "Usuario"}</Text>

        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Opciones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CONFIGURACIÓN</Text>

        <MenuItem
          icon="person-outline"
          title="Información Personal"
          subtitle="Nombre, correo y ubicación"
        />

        <MenuItem
          icon="shield-checkmark-outline"
          title="Seguridad"
          subtitle="Contraseña y autenticación"
        />

        <MenuItem
          icon="notifications-outline"
          title="Notificaciones"
          subtitle="Alertas de riego y cuidados"
        />
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.cardPrimary}>
          <Ionicons name="leaf-outline" size={28} style={styles.iconBg} />
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statText}>Plantas activas</Text>
        </View>

        <View style={styles.cardSecondary}>
          <Ionicons name="trophy-outline" size={28} style={styles.iconBg} />
          <Text style={styles.statNumber}>Calificanos</Text>
          <Text style={styles.statText}>Ayuda a mejorar</Text>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>

      <Text style={styles.version}>PLANTIFY APP VERSION 1.0.0</Text>
    </ScrollView>
  );
}

// 🔹 COMPONENTE REUTILIZABLE
function MenuItem({ icon, title, subtitle }) {
  return (
    <TouchableOpacity style={styles.menuItem}>
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={20} color={COLORS.onSecondary} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>

      <Ionicons name="chevron-forward" size={18} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.onSurface,
  },

  profileCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },

  avatarContainer: {
    position: "relative",
    marginBottom: 10,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 50,
  },

  editButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    padding: 6,
    borderRadius: 20,
  },

  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.onSurface,
  },

  email: {
    color: COLORS.onSurfaceVariant,
  },

  section: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.onSurfaceVariant,
    marginBottom: 10,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    marginBottom: 10,
  },

  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },

  menuTitle: {
    fontWeight: "600",
    color: COLORS.onSurface,
  },

  menuSubtitle: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },

  stats: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },

  cardPrimary: {
    flex: 1,
    backgroundColor: COLORS.primaryContainer,
    padding: 16,
    borderRadius: 16,
  },

  cardSecondary: {
    flex: 1,
    backgroundColor: COLORS.secondaryContainer,
    padding: 16,
    borderRadius: 16,
  },

  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
  },

  statText: {
    fontSize: 12,
  },

  iconBg: {
    position: "absolute",
    top: 10,
    left: 10,
    opacity: 0.3,
  },

  logoutBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    padding: 14,
  },

  logoutText: {
    color: COLORS.error,
    fontWeight: "bold",
  },

  version: {
    textAlign: "center",
    fontSize: 10,
    marginTop: 10,
    color: COLORS.onSurfaceVariant,
  },
});

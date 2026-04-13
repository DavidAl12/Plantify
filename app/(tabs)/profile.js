import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signOut, updatePassword, updateProfile } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import AppHeader from "../../components/ui/AppHeader";
import { auth, db } from "../../src/config/firebase";
import { COLORS } from "../../styles/colors";

export default function Profile() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [plantsCount, setPlantsCount] = useState(0);
  const [openSection, setOpenSection] = useState(null);

  // 🔥 Cargar usuario
  useEffect(() => {
    setUser(auth.currentUser);
  }, []);

  // 🌱 Contar plantas
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const ref = collection(db, "users", currentUser.uid, "plants");

    const unsubscribe = onSnapshot(ref, (snapshot) => {
      setPlantsCount(snapshot.size);
    });

    return unsubscribe;
  }, []);

  // 🔥 Logout
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
      <AppHeader />

      {/* PERFIL */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: user?.photoURL || "https://i.imgur.com/6VBx3io.png",
            }}
            style={styles.avatar}
          />
        </View>

        <Text style={styles.name}>{user?.displayName || "Usuario"}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* CONFIGURACIÓN */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CONFIGURACIÓN</Text>

        <MenuItem
          icon="person-outline"
          title="Información Personal"
          subtitle="Editar nombre"
          isOpen={openSection === "personal"}
          onPress={() =>
            setOpenSection(openSection === "personal" ? null : "personal")
          }
        >
          <PersonalInfo user={user} />
        </MenuItem>

        <MenuItem
          icon="shield-checkmark-outline"
          title="Seguridad"
          subtitle="Cambiar contraseña"
          isOpen={openSection === "security"}
          onPress={() =>
            setOpenSection(openSection === "security" ? null : "security")
          }
        >
          <SecuritySection />
        </MenuItem>

        <MenuItem
          icon="notifications-outline"
          title="Notificaciones"
          subtitle="Activar o desactivar"
          isOpen={openSection === "notifications"}
          onPress={() =>
            setOpenSection(
              openSection === "notifications" ? null : "notifications",
            )
          }
        >
          <NotificationsSection />
        </MenuItem>
      </View>

      {/* STATS */}
      <View style={styles.stats}>
        <View style={styles.cardPrimary}>
          <Ionicons name="leaf-outline" size={28} style={styles.iconBg} />
          <Text style={styles.statNumber}>{plantsCount}</Text>
          <Text style={styles.statText}>Plantas activas</Text>
        </View>

        <View style={styles.cardSecondary}>
          <Ionicons name="trophy-outline" size={28} style={styles.iconBg} />
          <Text style={styles.statNumber}>Califícanos</Text>
          <Text style={styles.statText}>Ayuda a mejorar</Text>
        </View>
      </View>

      {/* LOGOUT */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>

      <Text style={styles.version}>PLANTIFY APP VERSION 1.0.0</Text>
    </ScrollView>
  );
}

//////////////////// COMPONENTES ////////////////////

function MenuItem({ icon, title, subtitle, isOpen, onPress, children }) {
  return (
    <View>
      <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <View style={styles.menuIcon}>
          <Ionicons name={icon} size={20} color={COLORS.onSecondary} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.menuTitle}>{title}</Text>
          <Text style={styles.menuSubtitle}>{subtitle}</Text>
        </View>

        <Ionicons name={isOpen ? "chevron-up" : "chevron-forward"} size={18} />
      </TouchableOpacity>

      {isOpen && <View style={styles.dropdown}>{children}</View>}
    </View>
  );
}

function PersonalInfo({ user }) {
  const [name, setName] = useState(user?.displayName || "");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleSave = async () => {
    if (!auth.currentUser) return;

    try {
      await updateProfile(auth.currentUser, {
        displayName: name,
      });

      setIsError(false);
      setMessage("Nombre actualizado correctamente");
    } catch (error) {
      setIsError(true);
      setMessage("Error al actualizar el nombre");
    }
  };

  return (
    <View>
      <Text>Nombre</Text>
      <TextInput value={name} onChangeText={setName} style={styles.input} />

      <Text>Correo</Text>
      <TextInput value={user?.email} editable={false} style={styles.input} />

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={{ color: "white" }}>Guardar</Text>
      </TouchableOpacity>
      {message !== "" && (
        <Text style={{ color: isError ? "red" : "green", marginTop: 5 }}>
          {message}
        </Text>
      )}
    </View>
  );
}

function SecuritySection() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleChangePassword = async () => {
    if (!auth.currentUser) return;

    try {
      await updatePassword(auth.currentUser, password);

      setIsError(false);
      setMessage("Contraseña actualizada correctamente");
      setPassword("");
    } catch (error) {
      setIsError(true);

      let msg = "Error al actualizar la contraseña";

      if (error.code === "auth/weak-password") {
        msg = "Mínimo 6 caracteres";
      } else if (error.code === "auth/requires-recent-login") {
        msg = "Debes iniciar sesión otra vez";
      }

      setMessage(msg);
    }
  };

  return (
    <View>
      <Text>Nueva contraseña</Text>
      <TextInput
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword}>
        <Text style={{ color: "white" }}>Actualizar</Text>
      </TouchableOpacity>
      {message !== "" && (
        <Text style={{ color: isError ? "red" : "green", marginTop: 5 }}>
          {message}
        </Text>
      )}
    </View>
  );
}

function NotificationsSection() {
  const [enabled, setEnabled] = useState(true);

  return (
    <View>
      <Text>Recordatorios</Text>

      <TouchableOpacity
        style={styles.toggle}
        onPress={() => setEnabled(!enabled)}
      >
        <Text>{enabled ? "Activadas" : "Desactivadas"}</Text>
      </TouchableOpacity>
    </View>
  );
}

//////////////////// ESTILOS ////////////////////

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },

  profileCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 50,
  },

  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.onSurface,
  },

  email: {
    color: COLORS.onSurfaceVariant,
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

  dropdown: {
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 10,
  },

  input: {
    backgroundColor: "#f1f1f1",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },

  saveBtn: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  toggle: {
    padding: 10,
    backgroundColor: "#eee",
    borderRadius: 10,
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

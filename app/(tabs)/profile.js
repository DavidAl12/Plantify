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

      <View style={styles.content}>
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

        <Text style={styles.version}>PERFLORA APP VERSION 1.0.0</Text>
      </View>
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
  return <NotificationsSettings />;
}

function NotificationsSettings() {
  const [freq, setFreq] = useState(null); // null = default 300 (5 horas), 'off' = off, number = minutos
  const [saving, setSaving] = useState(false);
  const options = [
    { value: "off", label: "Desactivar notificaciones" },
    { value: 240, label: "4 horas" },
    { value: 360, label: "6 horas" },
    { value: 480, label: "8 horas" },
    { value: 600, label: "10 horas" },
  ];

  useEffect(() => {
    let mounted = true;
    (async () => {
      const NotificationUtils = (await import("../../src/utils/notificationUtils")).default;
      const current = await NotificationUtils.getSavedFrequency();
      if (!mounted) return;
      setFreq(current === null ? null : current);
    })();
    return () => (mounted = false);
  }, []);

  const handleSelect = (v) => setFreq(v);

  const handleSave = async () => {
    setSaving(true);
    const NotificationUtils = (await import("../../src/utils/notificationUtils")).default;
    await NotificationUtils.setSavedFrequency(freq);
    // Re-schedule notifications with new frequency
    await NotificationUtils.scheduleNextNotifications().catch(() => {});
    setSaving(false);
  };

  return (
    <View style={{ paddingVertical: 10 }}>
      <Text style={{ color: COLORS.onSurfaceVariant, fontSize: 13, marginBottom: 10 }}>
        Recordatorios periódicos (predeterminado: 5 horas)
      </Text>

      {options.map((opt) => (
        <TouchableOpacity
          key={String(opt.value)}
          style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8 }}
          onPress={() => handleSelect(opt.value)}
        >
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              borderWidth: 1,
              borderColor: COLORS.primary,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 10,
            }}
          >
            {((opt.value === "off" && freq === "off") || (opt.value !== "off" && freq === opt.value)) && (
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary }} />
            )}
          </View>

          <Text style={{ fontSize: 15 }}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={[styles.saveBtn, { marginTop: 12 }]} onPress={handleSave} disabled={saving}>
        <Text style={{ color: "white" }}>{saving ? "Guardando..." : "Guardar"}</Text>
      </TouchableOpacity>
    </View>
  );

}

//////////////////// ESTILOS ////////////////////

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f7f2",
  },

  content: {
    padding: 20,
  },

  profileCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  avatarContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 50,
  },

  section: {
    marginBottom: 20,
  },

  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1b1b1b",
    marginTop: 12,
  },

  email: {
    color: "#888",
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 12,
    marginTop: 8,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },

  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  dropdown: {
    padding: 14,
    backgroundColor: "#f9f9f9",
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
    gap: 12,
    marginBottom: 20,
  },

  cardPrimary: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },

  cardSecondary: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#ff9800",
  },

  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1b1b1b",
    marginTop: 8,
  },

  statText: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },

  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1b1b1b",
  },

  menuSubtitle: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
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
    backgroundColor: "white",
    borderRadius: 12,
    marginTop: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },

  logoutText: {
    color: COLORS.error,
    fontWeight: "bold",
    fontSize: 16,
  },

  version: {
    textAlign: "center",
    fontSize: 10,
    marginTop: 10,
    color: COLORS.onSurfaceVariant,
  },
});

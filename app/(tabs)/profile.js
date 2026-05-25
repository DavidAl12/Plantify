import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import AppHeader from "../../components/ui/AppHeader";
import { auth, db } from "../../src/config/firebase";
import * as NotificationUtils from "../../src/utils/notificationUtils";
import { COLORS } from "../../styles/colors";

const DEFAULT_AVATAR = "https://i.imgur.com/6VBx3io.png";

export default function Profile() {
  const router = useRouter();
  const scrollRef = useRef(null);
  const [user, setUser] = useState(auth.currentUser);
  const [plantsCount, setPlantsCount] = useState(0);
  const [openSection, setOpenSection] = useState(null);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      setOpenSection(null);
    }, []),
  );

  useEffect(() => {
    setUser(auth.currentUser);
  }, []);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return undefined;

    const ref = collection(db, "users", currentUser.uid, "plants");
    return onSnapshot(ref, (snapshot) => {
      setPlantsCount(snapshot.size);
    });
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/(auth)/login");
    } catch (error) {
      console.log(error);
    }
  };

  const handlePickProfileImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        alert("Se necesita permiso para acceder a la galeria");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
      });

      if (!result.canceled && auth.currentUser) {
        const uri = result.assets[0].uri;
        await updateProfile(auth.currentUser, { photoURL: uri });
        setUser({ ...auth.currentUser, photoURL: uri });
      }
    } catch (error) {
      console.log("Error actualizando foto:", error);
      alert("No se pudo actualizar la foto de perfil");
    }
  };

  const toggleSection = (section) => {
    setOpenSection((current) => (current === section ? null : section));
  };

  return (
    <View style={styles.screen}>
      <AppHeader />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHero}>
          <View style={styles.avatarShell}>
            <Image
              source={{ uri: user?.photoURL || DEFAULT_AVATAR }}
              style={styles.avatar}
            />
          </View>

          <View style={styles.heroText}>
            <Text style={styles.name} numberOfLines={1}>{user?.displayName || "Usuario"}</Text>
            <Text style={styles.email} numberOfLines={1}>{user?.email || "Sin correo"}</Text>
            <Text style={styles.plantsBadge}>{plantsCount} plantas activas</Text>
          </View>

          <View style={styles.heroIconBadge}>
            <Text style={styles.heroPlantEmoji}>🪴</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Configuracion</Text>

        <SettingsCard
          icon="person-outline"
          title="Informacion personal"
          subtitle="Edita tu nombre y datos personales"
          isOpen={openSection === "personal"}
          onPress={() => toggleSection("personal")}
        >
          <PersonalInfo user={user} onUserChange={setUser} onPickImage={handlePickProfileImage} />
        </SettingsCard>

        <SettingsCard
          icon="shield-checkmark-outline"
          title="Seguridad"
          subtitle="Cambia tu contrasena"
          isOpen={openSection === "security"}
          onPress={() => toggleSection("security")}
        >
          <SecuritySection />
        </SettingsCard>

        <SettingsCard
          icon="notifications-outline"
          title="Notificaciones"
          subtitle="Activa o desactiva alertas"
          isOpen={openSection === "notifications"}
          onPress={() => toggleSection("notifications")}
        >
          <NotificationsSection />
        </SettingsCard>

        <SettingsCard
          icon="document-text-outline"
          title="Politicas y terminos"
          subtitle="Consulta nuestras politicas y terminos de uso"
          isOpen={openSection === "terms"}
          onPress={() => toggleSection("terms")}
        >
          <PoliciesTermsSection />
        </SettingsCard>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Cerrar sesion</Text>
        </TouchableOpacity>

        <Text style={styles.version}>PERFLORA APP VERSION 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

function SettingsCard({ icon, title, subtitle, isOpen, onPress, children }) {
  return (
    <View style={[styles.settingsCard, isOpen && styles.settingsCardOpen]}>
      <TouchableOpacity style={styles.settingsHeader} onPress={onPress} activeOpacity={0.85}>
        <View style={styles.settingsIcon}>
          <Ionicons name={icon} size={24} color={COLORS.primary} />
        </View>

        <View style={styles.settingsCopy}>
          <Text style={styles.settingsTitle}>{title}</Text>
          <Text style={styles.settingsSubtitle}>{subtitle}</Text>
        </View>

        <Ionicons
          name={isOpen ? "chevron-down" : "chevron-forward"}
          size={22}
          color="#111827"
        />
      </TouchableOpacity>

      {isOpen ? <View style={styles.expandedContent}>{children}</View> : null}
    </View>
  );
}

function PersonalInfo({ user, onUserChange, onPickImage }) {
  const [name, setName] = useState(user?.displayName || "");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setName(user?.displayName || "");
  }, [user?.displayName]);

  const handleSave = async () => {
    if (!auth.currentUser) return;

    if (!name.trim()) {
      setIsError(true);
      setMessage("El nombre no puede estar vacio");
      return;
    }

    try {
      await updateProfile(auth.currentUser, { displayName: name.trim() });
      onUserChange({ ...auth.currentUser, displayName: name.trim() });
      setIsError(false);
      setMessage("Informacion actualizada correctamente");
    } catch (_error) {
      setIsError(true);
      setMessage("Error al actualizar la informacion");
    }
  };

  return (
    <View style={styles.form}>
      <TouchableOpacity style={styles.photoAction} onPress={onPickImage} activeOpacity={0.85}>
        <Ionicons name="image-outline" size={18} color={COLORS.primary} />
        <Text style={styles.photoActionText}>Cambiar imagen de perfil</Text>
      </TouchableOpacity>

      <Field label="Nombre completo">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Tu nombre"
          placeholderTextColor="#7b8577"
          style={styles.input}
        />
      </Field>

      <Field label="Correo electronico">
        <TextInput
          value={user?.email || ""}
          editable={false}
          style={[styles.input, styles.disabledInput]}
        />
      </Field>

      <SaveButton label="Guardar cambios" onPress={handleSave} />
      <StatusMessage message={message} isError={isError} />
    </View>
  );
}

function SecuritySection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser?.email) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setIsError(true);
      setMessage("Completa todos los campos");
      return;
    }

    if (newPassword.length < 6) {
      setIsError(true);
      setMessage("La nueva contrasena debe tener minimo 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setIsError(true);
      setMessage("La confirmacion no coincide con la nueva contrasena");
      return;
    }

    try {
      setSaving(true);
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsError(false);
      setMessage("Contrasena actualizada correctamente");
    } catch (error) {
      setIsError(true);

      if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        setMessage("La contrasena actual no es correcta");
      } else if (error.code === "auth/weak-password") {
        setMessage("La nueva contrasena es demasiado debil");
      } else if (error.code === "auth/requires-recent-login") {
        setMessage("Vuelve a iniciar sesion para confirmar este cambio");
      } else {
        setMessage("No se pudo actualizar la contrasena");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.form}>
      <Field label="Contrasena actual">
        <TextInput
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Ingresa tu contrasena actual"
          placeholderTextColor="#7b8577"
          style={styles.input}
        />
      </Field>

      <Field label="Nueva contrasena">
        <TextInput
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Minimo 6 caracteres"
          placeholderTextColor="#7b8577"
          style={styles.input}
        />
      </Field>

      <Field label="Confirmar nueva contrasena">
        <TextInput
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Repite la nueva contrasena"
          placeholderTextColor="#7b8577"
          style={styles.input}
        />
      </Field>

      <SaveButton
        label={saving ? "Actualizando..." : "Actualizar contrasena"}
        onPress={handleChangePassword}
        disabled={saving}
      />
      <StatusMessage message={message} isError={isError} />
    </View>
  );
}

function NotificationsSection() {
  const [freq, setFreq] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const enabled = freq !== "off";
  const options = [
    { value: null, label: "Cada 5 horas" },
    { value: 240, label: "Cada 4 horas" },
    { value: 360, label: "Cada 6 horas" },
    { value: 480, label: "Cada 8 horas" },
    { value: 600, label: "Cada 10 horas" },
  ];

  useEffect(() => {
    let mounted = true;
    (async () => {
      const current = await NotificationUtils.getSavedFrequency();
      if (mounted) setFreq(current);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await NotificationUtils.setSavedFrequency(freq);
    await NotificationUtils.scheduleNextNotifications().catch(() => {});
    setSaving(false);
  };

  const selectedOption = options.find((option) => option.value === freq) || options[0];

  return (
    <View style={styles.form}>
      <View style={styles.switchRow}>
        <View>
          <Text style={styles.switchTitle}>Recordatorios de cuidado</Text>
          <Text style={styles.switchSubtitle}>Alertas para actividades pendientes</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={(value) => setFreq(value ? null : "off")}
          trackColor={{ false: "#e5e7eb", true: "#dff2d2" }}
          thumbColor={enabled ? COLORS.primary : "#f4f4f5"}
        />
      </View>

      {enabled ? (
        <View style={styles.frequencyBox}>
          <TouchableOpacity
            style={styles.frequencyHeader}
            onPress={() => setShowOptions((current) => !current)}
            activeOpacity={0.85}
          >
            <View>
              <Text style={styles.frequencyTitle}>Frecuencia</Text>
              <Text style={styles.frequencyValue}>{selectedOption.label}</Text>
            </View>
            <Ionicons
              name={showOptions ? "chevron-up" : "chevron-down"}
              size={20}
              color={COLORS.primary}
            />
          </TouchableOpacity>

          {showOptions ? (
            <View style={styles.optionGroup}>
              {options.map((option) => (
                <TouchableOpacity
                  key={String(option.value)}
                  style={styles.radioRow}
                  onPress={() => {
                    setFreq(option.value);
                    setShowOptions(false);
                  }}
                  activeOpacity={0.85}
                >
                  <View style={styles.radioOuter}>
                    {freq === option.value ? <View style={styles.radioInner} /> : null}
                  </View>
                  <Text style={styles.radioLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <SaveButton label={saving ? "Guardando..." : "Guardar preferencias"} onPress={handleSave} disabled={saving} />
    </View>
  );
}

function PoliciesTermsSection() {
  return (
    <View style={styles.legalContent}>
      <Text style={styles.legalTitle}>Politica de privacidad</Text>
      <Text style={styles.legalText}>
        Perflora usa tu correo, nombre, foto de perfil y datos de tus plantas para
        crear tu cuenta, mostrar tu jardin, programar recordatorios y mejorar tu
        experiencia dentro de la app. Las imagenes que agregas se usan para
        identificar o registrar plantas y no se venden a terceros.
      </Text>
      <Text style={styles.legalText}>
        Puedes actualizar tu informacion desde este perfil. Si cierras sesion, tus
        datos siguen asociados a tu cuenta para que puedas recuperarlos al iniciar
        sesion de nuevo. Las notificaciones pueden desactivarse en cualquier momento.
      </Text>

      <Text style={styles.legalTitle}>Terminos de uso</Text>
      <Text style={styles.legalText}>
        Perflora ofrece recomendaciones y recordatorios de cuidado como apoyo
        informativo. Las necesidades reales de una planta pueden variar por clima,
        sustrato, luz, plagas y condiciones del hogar, asi que las sugerencias no
        sustituyen una revision profesional cuando la planta presenta danos severos.
      </Text>
      <Text style={styles.legalText}>
        Al usar la app aceptas mantener informacion veraz en tu cuenta, no subir
        contenido ofensivo o ilegal y usar las funciones de identificacion y
        calendario de forma responsable. Perflora puede ajustar funciones para
        mejorar seguridad, estabilidad y calidad del servicio.
      </Text>
    </View>
  );
}

function Field({ label, children }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function SaveButton({ label, onPress, disabled }) {
  return (
    <TouchableOpacity
      style={[styles.saveButton, disabled && styles.disabledButton]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <Text style={styles.saveButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatusMessage({ message, isError }) {
  if (!message) return null;
  return (
    <Text style={[styles.statusMessage, isError ? styles.errorText : styles.successText]}>
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8f9f4",
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  profileHero: {
    minHeight: 150,
    backgroundColor: "#fbfef6",
    borderRadius: 18,
    padding: 18,
    marginBottom: 26,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e7efd9",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  avatarShell: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  heroText: {
    flex: 1,
    zIndex: 2,
  },
  name: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1b1b1b",
  },
  email: {
    color: "#7b7f78",
    fontSize: 13,
    marginTop: 6,
  },
  plantsBadge: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(167, 201, 87, 0.16)",
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "800",
  },
  heroIconBadge: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    right: 14,
    top: 39,
    backgroundColor: "rgba(167, 201, 87, 0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroPlantEmoji: {
    fontSize: 40,
    lineHeight: 46,
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 12,
    marginLeft: 2,
  },
  settingsCard: {
    backgroundColor: "white",
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#edf1ea",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    overflow: "hidden",
  },
  settingsCardOpen: {
    borderColor: "#dfead6",
  },
  settingsHeader: {
    minHeight: 78,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingsIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#eaf7df",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsCopy: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1f2420",
  },
  settingsSubtitle: {
    color: "#7c8279",
    fontSize: 12,
    marginTop: 5,
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f3ed",
  },
  form: {
    paddingTop: 14,
  },
  field: {
    marginBottom: 13,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    color: "#324036",
    marginBottom: 7,
  },
  input: {
    minHeight: 46,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "rgba(167, 201, 87, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(52, 93, 37, 0.16)",
    color: COLORS.onSurface,
  },
  disabledInput: {
    color: "#6f766d",
    backgroundColor: "#f3f6ef",
  },
  photoAction: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#f3faed",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 14,
  },
  photoActionText: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 13,
  },
  saveButton: {
    minHeight: 46,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "900",
  },
  statusMessage: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  errorText: {
    color: COLORS.error,
  },
  successText: {
    color: COLORS.primary,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#243126",
  },
  switchSubtitle: {
    fontSize: 12,
    color: "#7c8279",
    marginTop: 4,
  },
  optionGroup: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 8,
    marginTop: 8,
  },
  frequencyBox: {
    backgroundColor: "#f8faf5",
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e7efe1",
  },
  frequencyHeader: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  frequencyTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#324036",
  },
  frequencyValue: {
    fontSize: 13,
    color: "#7c8279",
    marginTop: 3,
    fontWeight: "700",
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  radioLabel: {
    fontSize: 14,
    color: "#253025",
    fontWeight: "600",
  },
  legalContent: {
    paddingTop: 14,
  },
  legalTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.primary,
    marginBottom: 8,
  },
  legalText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#566052",
    marginBottom: 12,
  },
  logoutButton: {
    minHeight: 62,
    borderRadius: 14,
    backgroundColor: "#fff7f7",
    borderWidth: 1,
    borderColor: "#ffdede",
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: {
    color: COLORS.error,
    fontWeight: "900",
    fontSize: 15,
  },
  version: {
    textAlign: "center",
    fontSize: 10,
    marginTop: 14,
    color: "#8a9186",
    fontWeight: "700",
  },
});

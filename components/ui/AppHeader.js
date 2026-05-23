import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { hasUnviewedNotifications, markNotificationsAsViewed } from "../../src/utils/notificationUtils";
import { COLORS } from "../../styles/colors";

export default function AppHeader({ showBack = false }) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [hasUnviewed, setHasUnviewed] = useState(false);

  // Cargar historial de notificaciones
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await AsyncStorage.getItem("notificationHistory");
        if (data) {
          setNotificationHistory(JSON.parse(data));
        }
      } catch (e) {
        console.log("Error cargando historial:", e);
      }
    };

    loadHistory();
  }, []);

  // Verificar si hay notificaciones sin ver (periodicamente)
  useEffect(() => {
    const checkUnviewed = async () => {
      try {
        const hasUnviewed = await hasUnviewedNotifications();
        setHasUnviewed(hasUnviewed);
      } catch (e) {
        console.log("Error verificando notificaciones sin ver:", e);
      }
    };

    checkUnviewed();
    const interval = setInterval(checkUnviewed, 2000); // Verificar cada 2 segundos

    return () => clearInterval(interval);
  }, []);

  // Cuando se abre el modal, marcar como visto
  const handleOpenMenu = useCallback(async () => {
    setIsMenuOpen(true);
    await markNotificationsAsViewed();
    setHasUnviewed(false);
    
    // Recargar historial
    try {
      const data = await AsyncStorage.getItem("notificationHistory");
      if (data) {
        setNotificationHistory(JSON.parse(data));
      }
    } catch (e) {
      console.log("Error recargando historial:", e);
    }
  }, []);

  // Agrupar notificaciones por fecha - SOLO mostrar las que ya llegaron
  const notificationsByDate = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const grouped = {};
    
    notificationHistory
      .filter((n) => n.data?.type !== "periodic_summary") // Excluir recordatorios periódicos
      .filter((n) => n.date <= today) // Solo mostrar notificaciones que ya llegaron
      .forEach((notif) => {
        const date = notif.date || new Date(notif.timestamp).toISOString().slice(0, 10);
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(notif);
      });

    // Ordenar fechas en orden descendente (más recientes primero)
    return Object.entries(grouped)
      .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
      .reduce((acc, [date, notifs]) => {
        acc[date] = notifs;
        return acc;
      }, {});
  }, [notificationHistory]);

  const formatDate = (dateStr) => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    if (dateStr === today) return { label: "Hoy", type: "today" };
    if (dateStr === yesterday) return { label: "Ayer", type: "yesterday" };

    const date = new Date(dateStr);
    const formatted = date.toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
    });
    return { label: formatted, type: "other" };
  };

  // Determinar tipo de notificación
  const getNotificationType = (notif) => {
    if (notif.data?.type === "daily_summary" || notif.data?.type === "daily_summary_test") {
      return "today";
    }
    if (notif.data?.type === "advance_summary" || notif.data?.type === "advance_summary_test") {
      return "tomorrow";
    }
    return "other";
  };

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
          onPress={handleOpenMenu}
          activeOpacity={0.7}
          style={styles.notifBtn}
        >
          <Ionicons
            name="notifications-outline"
            size={22}
            color={COLORS.onSurface}
          />
          {hasUnviewed && (
            <View style={styles.badge} />
          )}
        </TouchableOpacity>
      </View>

      <Modal
        transparent
        visible={isMenuOpen}
        animationType="fade"
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsMenuOpen(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Notificaciones</Text>
          {Object.keys(notificationsByDate).length === 0 ? (
            <Text style={styles.modalText}>No tienes notificaciones.</Text>
          ) : (
            <ScrollView style={styles.taskList}>
              {Object.entries(notificationsByDate).map(([date, notifs]) => {
                const dateInfo = formatDate(date);
                return (
                  <View key={date} style={styles.dateGroup}>
                    <Text style={styles.dateLabel}>{dateInfo.label}</Text>
                    {notifs.map((notif) => {
                      const notifType = getNotificationType(notif);
                      return (
                        <View
                          key={notif.id}
                          style={[
                            styles.notificationItem,
                            notifType === "today" && styles.notifToday,
                            notifType === "tomorrow" && styles.notifTomorrow,
                            notifType === "other" && styles.notifOther,
                          ]}
                        >
                          <Text style={styles.notifTitle}>{notif.title}</Text>
                          <Text style={styles.notifBody}>{notif.body}</Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: "#fff",
  },

  header: {
    height: 70,
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
    backgroundColor: "#d3ffd2",
  },

  logo: {
    width: 130,
    height: 150,
    resizeMode: "contain",
  },

  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d3ffd2",
  },

  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef5350",
  },

  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  modalCard: {
    position: "absolute",
    top: 80,
    right: 16,
    margin: 12,
    width: 280,
    maxHeight: 340,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    color: COLORS.onSurface,
  },

  modalText: {
    color: COLORS.onSurface,
    fontSize: 14,
    lineHeight: 20,
  },

  taskList: {
    marginTop: 4,
  },

  dateGroup: {
    marginBottom: 12,
  },

  dateLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 8,
    marginTop: 8,
  },

  notificationItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 6,
    borderLeftWidth: 4,
  },

  notifToday: {
    backgroundColor: "#e8f5e9",
    borderLeftColor: "#2e7d32",
  },

  notifTomorrow: {
    backgroundColor: "#fff8e1",
    borderLeftColor: "#f57f17",
  },

  notifOther: {
    backgroundColor: "#f5f5f5",
    borderLeftColor: "#9e9e9e",
  },

  notifTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.onSurface,
    marginBottom: 4,
  },

  notifBody: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },

  taskItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5ebdb",
  },

  taskItemText: {
    color: COLORS.onSurface,
    fontSize: 14,
    lineHeight: 20,
  },
});

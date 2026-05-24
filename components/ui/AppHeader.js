import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  AppState,
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
import { COLORS } from "../../styles/colors";

const NOTIFICATION_INBOX_KEY = "perfloraNotificationInbox";
const MAX_STORED_NOTIFICATIONS = 60;

const toDateKey = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateKey = (dateKey) => {
  if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatSectionDate = (dateKey) => {
  const date = parseDateKey(dateKey);
  if (!date) return "Sin fecha";

  const todayKey = toDateKey(Date.now());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateKey === todayKey) return "Hoy";
  if (dateKey === toDateKey(yesterday)) return "Ayer";

  return date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatNotificationTime = (timestamp) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const normalizeNotification = (notification) => {
  const request = notification?.request;
  const content = request?.content;
  if (!request || !content) return null;

  const receivedAt = notification.date || Date.now();
  const dataDate = typeof content.data?.date === "string" ? content.data.date : null;
  const dateKey = dataDate || toDateKey(receivedAt);
  const title = content.title || "Perflora";
  const body = content.body || "";

  if (!title && !body) return null;

  return {
    id: `${request.identifier}-${receivedAt}`,
    requestId: request.identifier,
    title,
    body,
    dateKey,
    receivedAt,
    type: content.data?.type || "notification",
  };
};

const mergeNotificationLists = (items) => {
  const unique = new Map();

  items
    .filter(Boolean)
    .sort((a, b) => b.receivedAt - a.receivedAt)
    .forEach((item) => {
      if (!unique.has(item.id)) unique.set(item.id, item);
    });

  return Array.from(unique.values()).slice(0, MAX_STORED_NOTIFICATIONS);
};

export default function AppHeader({ showBack = false }) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [hasLoadedNotifications, setHasLoadedNotifications] = useState(false);

  useEffect(() => {
    const syncPresentedNotifications = async () => {
      try {
        const presented = await Notifications.getPresentedNotificationsAsync();
        const incoming = presented.map(normalizeNotification).filter(Boolean);
        if (incoming.length === 0) return;

        setNotifications((current) => mergeNotificationLists([...incoming, ...current]));
      } catch (error) {
        console.log("Error sincronizando notificaciones:", error);
      }
    };

    const initializeNotifications = async () => {
      try {
        const stored = await AsyncStorage.getItem(NOTIFICATION_INBOX_KEY);
        const storedItems = stored ? JSON.parse(stored) : [];
        const presented = await Notifications.getPresentedNotificationsAsync();
        const presentedItems = presented.map(normalizeNotification).filter(Boolean);

        setNotifications((current) => (
          mergeNotificationLists([...presentedItems, ...storedItems, ...current])
        ));
      } catch (error) {
        console.log("Error cargando notificaciones:", error);
      } finally {
        setHasLoadedNotifications(true);
      }
    };

    initializeNotifications();

    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      const item = normalizeNotification(notification);
      if (!item) return;

      setNotifications((current) => mergeNotificationLists([item, ...current]));
    });

    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") syncPresentedNotifications();
    });

    return () => {
      receivedSubscription.remove();
      appStateSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedNotifications) return;

    AsyncStorage.setItem(
      NOTIFICATION_INBOX_KEY,
      JSON.stringify(notifications),
    ).catch((error) => console.log("Error guardando notificaciones:", error));
  }, [hasLoadedNotifications, notifications]);

  const groupedNotifications = useMemo(() => {
    return notifications.reduce((groups, notification) => {
      const dateKey = notification.dateKey || toDateKey(notification.receivedAt);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(notification);
      return groups;
    }, {});
  }, [notifications]);

  const notificationDates = useMemo(() => {
    return Object.keys(groupedNotifications).sort((a, b) => {
      const first = parseDateKey(a)?.getTime() || 0;
      const second = parseDateKey(b)?.getTime() || 0;
      return second - first;
    });
  }, [groupedNotifications]);

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
          onPress={() => setIsMenuOpen(true)}
          activeOpacity={0.7}
          style={styles.notifBtn}
        >
          <Ionicons
            name="notifications-outline"
            size={22}
            color={COLORS.onSurface}
          />
          {notifications.length > 0 && (
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
          {notifications.length === 0 ? (
            <Text style={styles.modalText}>No tienes notificaciones.</Text>
          ) : (
            <ScrollView style={styles.notificationList} showsVerticalScrollIndicator={false}>
              {notificationDates.map((dateKey) => (
                <View key={dateKey} style={styles.notificationGroup}>
                  <Text style={styles.notificationDate}>{formatSectionDate(dateKey)}</Text>
                  {groupedNotifications[dateKey].map((notification) => (
                    <View key={notification.id} style={styles.notificationItem}>
                      <View style={styles.notificationDot} />
                      <View style={styles.notificationContent}>
                        <View style={styles.notificationTitleRow}>
                          <Text style={styles.notificationTitle} numberOfLines={2}>
                            {notification.title}
                          </Text>
                          <Text style={styles.notificationTime}>
                            {formatNotificationTime(notification.receivedAt)}
                          </Text>
                        </View>
                        {!!notification.body && (
                          <Text style={styles.notificationBody}>
                            {notification.body}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ))}
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

  notificationList: {
    marginTop: 4,
  },

  notificationGroup: {
    marginBottom: 14,
  },

  notificationDate: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },

  notificationItem: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5ebdb",
  },

  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 6,
    marginRight: 10,
  },

  notificationContent: {
    flex: 1,
  },

  notificationTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },

  notificationTitle: {
    flex: 1,
    color: COLORS.onSurface,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19,
  },

  notificationTime: {
    color: "#7d8778",
    fontSize: 11,
    marginTop: 2,
  },

  notificationBody: {
    color: COLORS.onSurface,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 3,
  },
});

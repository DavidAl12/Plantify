import { Ionicons } from "@expo/vector-icons";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../components/ui/AppHeader";
import { auth, db } from "../src/config/firebase";
import { COLORS } from "../styles/colors";

function NotifCard({ item }) {
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInMin = Math.floor((now - date) / 60000);

    if (diffInMin < 60) return `hace ${diffInMin} min`;
    if (diffInMin < 1440) return `hace ${Math.floor(diffInMin / 60)} h`;
    return `hace ${Math.floor(diffInMin / 1440)} d`;
  };

  return (
    <View style={[styles.card, item.urgent && styles.cardUrgent]}>
      {item.urgent && <View style={styles.urgentBar} />}

      <View style={[styles.iconCircle, { backgroundColor: item.iconBg || COLORS.primaryLight }]}>
        <Ionicons name={item.icon || "notifications"} size={20} color={item.iconColor || COLORS.primary} />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.cardTime}>{formatTime(item.createdAt)}</Text>
        </View>

        <Text style={styles.cardText}>{item.body}</Text>
      </View>
    </View>
  );
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(data);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const groupNotifications = (notifs) => {
    const today = [];
    const older = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    notifs.forEach(n => {
      const date = n.createdAt?.toDate ? n.createdAt.toDate() : new Date();
      date.setHours(0, 0, 0, 0);
      if (date >= now) {
        today.push(n);
      } else {
        older.push(n);
      }
    });

    return { today, older };
  };

  const { today, older } = groupNotifications(notifications);

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader showBack />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Notificaciones</Text>
        <Text style={styles.pageSubtitle}>
          Mantente al día con tu diario botánico
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No tienes notificaciones aún</Text>
          </View>
        ) : (
          <>
            {today.length > 0 && (
              <View style={styles.section}>
                {today.map((item) => (
                  <NotifCard key={item.id} item={item} />
                ))}
              </View>
            )}

            {older.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Anteriores</Text>
                <View style={styles.section}>
                  {older.map((item) => (
                    <NotifCard key={item.id} item={item} />
                  ))}
                </View>
              </>
            )}

            <View style={styles.emptyState}>
              <Ionicons name="leaf-outline" size={44} color="#c2c9ba" />
              <Text style={styles.emptyText}>
                Fin de las actualizaciones recientes
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.onSurface,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    marginTop: 4,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.onSurfaceVariant,
    opacity: 0.5,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 24,
    marginBottom: 12,
  },
  section: {
    gap: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardUrgent: {
    paddingLeft: 20,
  },
  urgentBar: {
    position: "absolute",
    left: 0,
    top: "20%",
    width: 4,
    height: "60%",
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.onSurface,
    flex: 1,
    lineHeight: 19,
  },
  cardTime: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    opacity: 0.6,
    flexShrink: 0,
  },
  cardText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 40,
    opacity: 0.3,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    marginTop: 8,
  },
});


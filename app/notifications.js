import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../components/ui/AppHeader";
import { COLORS } from "../styles/colors";

const NOTIFICATIONS_TODAY = [
  {
    id: "1",
    icon: "water",
    iconColor: COLORS.primary ?? "#345d25",
    iconBg: "#c0f0a8",
    title: "Recordatorio de riego para Sansevieria",
    body: "Tu Sansevieria tiene sed. Han pasado 14 días desde el último riego.",
    time: "hace 10 min",
    urgent: true,
    actions: true,
  },
  {
    id: "2",
    icon: "medkit",
    iconColor: "#4d662c",
    iconBg: "#cbeaa1",
    title: "Diagnóstico listo: Ficus Lyrata",
    body: "Las manchas marrones sugieren exceso de riego o baja humedad.",
    time: "hace 2 h",
    link: "VER INFORME COMPLETO",
  },
  {
    id: "3",
    icon: "bulb",
    iconColor: "#626100",
    iconBg: "#e9e87c",
    title: "El mejor sustrato para suculentas",
    body: "Aprende por qué el drenaje es el factor n.º 1 para la salud de tus suculentas.",
    time: "hace 5 h",
  },
];

const NOTIFICATIONS_YESTERDAY = [
  {
    id: "4",
    icon: "calendar",
    iconColor: "#42493e",
    iconBg: "#baf0bb",
    title: "Actualización del calendario de abonado",
    body: "¡Ya es primavera! Hemos ajustado la frecuencia de abonado de tu Monstera.",
    time: "hace 1 d",
  },
];

function NotifCard({ item }) {
  return (
    <View style={[styles.card, item.urgent && styles.cardUrgent]}>
      {item.urgent && <View style={styles.urgentBar} />}

      <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
        <Ionicons name={item.icon} size={20} color={item.iconColor} />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.cardTime}>{item.time}</Text>
        </View>

        <Text style={styles.cardText}>{item.body}</Text>

        {item.actions && (
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.btnPrimary}>
              <Text style={styles.btnPrimaryText}>Hecho</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSecondary}>
              <Text style={styles.btnSecondaryText}>Posponer</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.link && (
          <TouchableOpacity style={styles.linkRow}>
            <Text style={styles.linkText}>{item.link}</Text>
            <Ionicons
              name="chevron-forward"
              size={13}
              color={COLORS.primary ?? "#345d25"}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function Notifications() {
  const router = useRouter();

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

        {/* HOY */}
        <View style={styles.section}>
          {NOTIFICATIONS_TODAY.map((item) => (
            <NotifCard key={item.id} item={item} />
          ))}
        </View>

        {/* AYER */}
        <Text style={styles.sectionLabel}>Ayer</Text>
        <View style={styles.section}>
          {NOTIFICATIONS_YESTERDAY.map((item) => (
            <NotifCard key={item.id} item={item} />
          ))}
        </View>

        {/* Pie decorativo */}
        <View style={styles.emptyState}>
          <Ionicons name="leaf-outline" size={44} color="#c2c9ba" />
          <Text style={styles.emptyText}>
            Fin de las actualizaciones recientes
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background ?? "#fdf8f1",
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface ?? "#ebffe7",
    borderBottomWidth: 0.5,
    borderBottomColor: "#c2c9ba",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surfaceContainerLow ?? "#d3ffd2",
    alignItems: "center",
    justifyContent: "center",
  },
  headerBrand: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.onSurface ?? "#002108",
  },
  clearAll: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary ?? "#345d25",
  },

  /* Scroll */
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.onSurface ?? "#002108",
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant ?? "#42493e",
    marginTop: 4,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.onSurfaceVariant ?? "#42493e",
    opacity: 0.5,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 24,
    marginBottom: 12,
  },
  section: {
    gap: 12,
  },

  /* Tarjeta */
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    overflow: "hidden",
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
    backgroundColor: COLORS.primary ?? "#345d25",
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
    color: COLORS.onSurface ?? "#002108",
    flex: 1,
    lineHeight: 19,
  },
  cardTime: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant ?? "#42493e",
    opacity: 0.6,
    flexShrink: 0,
  },
  cardText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant ?? "#42493e",
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  btnPrimary: {
    backgroundColor: COLORS.primary ?? "#345d25",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
  },
  btnPrimaryText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  btnSecondary: {
    backgroundColor: "#cbeaa1",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
  },
  btnSecondaryText: {
    color: "#4d662c",
    fontSize: 12,
    fontWeight: "700",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 8,
  },
  linkText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary ?? "#345d25",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  /* Pie */
  emptyState: {
    alignItems: "center",
    marginTop: 40,
    opacity: 0.3,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant ?? "#42493e",
    marginTop: 8,
  },
});

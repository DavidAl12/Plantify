import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../../components/ui/AppHeader"; // tu header reutilizable
import { COLORS } from "../../styles/colors";

export default function History() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F5DC" }}>
      <AppHeader />

      <ScrollView>
        <View style={styles.container}>
          {/* TITULO */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Historial de Cuidados</Text>
            <Text style={styles.subtitle}>
              Seguimiento de tu viaje botánico 🌱
            </Text>
          </View>

          {/* HOY */}
          <Section title="HOY" primary>
            <TimelineItem
              icon="water-outline"
              title="Revisión de tierra"
              time="09:15 AM"
              description="Humedad del suelo al 40%. No necesita riego todavía."
            />

            <TimelineItem
              icon="flask-outline"
              title="Fertilización de Helecho"
              time="11:45 AM"
              description="Aplicación de fertilizante orgánico."
            />

            <TimelineItem
              icon="leaf-outline"
              title="Cuidado general"
              time="02:30 PM"
              description="Revisión de hojas y crecimiento."
            />
          </Section>

          {/* AYER */}
          <Section title="AYER">
            <TimelineItem
              icon="sparkles-outline"
              title="Limpieza de hojas"
              time="04:00 PM"
              description="Limpieza del Ficus para mejorar fotosíntesis."
              faded
            />
          </Section>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* 🔹 SECCIÓN (HOY / AYER) */
function Section({ title, children, primary }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View
          style={[
            styles.badge,
            primary ? styles.badgePrimary : styles.badgeSecondary,
          ]}
        >
          <Text style={styles.badgeText}>{title}</Text>
        </View>
        <View style={styles.line} />
      </View>

      <View style={styles.timeline}>{children}</View>
    </View>
  );
}

/* 🔹 ITEM DEL TIMELINE */
function TimelineItem({ icon, title, time, description, faded }) {
  return (
    <View style={[styles.itemContainer, faded && { opacity: 0.6 }]}>
      {/* Línea vertical */}
      <View style={styles.verticalLine} />

      {/* Punto */}
      <View style={styles.dot} />

      {/* Card */}
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={24} color={COLORS.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.itemTitle}>{title}</Text>
            <Text style={styles.time}>{time}</Text>
          </View>

          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
    </View>
  );
}

/* 🔹 ESTILOS */
const styles = {
  container: {
    padding: 20,
    paddingBottom: 100,
  },

  titleContainer: {
    marginBottom: 30,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1b1b1b",
  },

  subtitle: {
    color: "#555",
    marginTop: 5,
  },

  section: {
    marginBottom: 20,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },

  badgePrimary: {
    backgroundColor: COLORS.primary,
  },

  badgeSecondary: {
    backgroundColor: "#ddd",
  },

  badgeText: {
    fontWeight: "bold",
    fontSize: 12,
    color: "#fff",
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#ccc",
    marginLeft: 10,
  },

  timeline: {
    paddingLeft: 10,
  },

  itemContainer: {
    marginBottom: 25,
    paddingLeft: 20,
  },

  verticalLine: {
    position: "absolute",
    left: 7,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "#ccc",
  },

  dot: {
    position: "absolute",
    left: 0,
    top: 10,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
  },

  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  itemTitle: {
    fontWeight: "bold",
    fontSize: 16,
  },

  time: {
    fontSize: 12,
    color: "#777",
  },

  description: {
    fontSize: 13,
    color: "#555",
    marginTop: 5,
  },
};

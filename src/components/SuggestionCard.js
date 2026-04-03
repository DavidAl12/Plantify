import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];
const RANK_LABELS = ["1°", "2°", "3°"];

export default function SuggestionCard({ suggestion, index, isSelected, onSelect }) {
  const pct   = (suggestion.probability * 100).toFixed(1);
  const color = suggestion.probability >= 0.7 ? "#2e7d32"
              : suggestion.probability >= 0.4 ? "#f57c00"
              : "#c62828";

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={() => onSelect(suggestion)}
      activeOpacity={0.85}
    >
      {/* Imagen Wikipedia */}
      <View style={styles.imageWrapper}>
        {suggestion.wikiImage ? (
          <Image source={{ uri: suggestion.wikiImage }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={{ fontSize: 32 }}>🌿</Text>
          </View>
        )}
        <View style={[styles.rankBadge, { backgroundColor: RANK_COLORS[index] }]}>
          <Text style={styles.rankText}>{RANK_LABELS[index]}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{suggestion.name}</Text>
        {suggestion.details?.common_names?.length > 0 && (
          <Text style={styles.common} numberOfLines={1}>
            {suggestion.details.common_names[0]}
          </Text>
        )}
        <View style={[styles.badge, { backgroundColor: color + "18", borderColor: color + "55" }]}>
          <Text style={[styles.badgeText, { color }]}>{pct}% coincidencia</Text>
        </View>
      </View>

      {/* Check si está seleccionada */}
      {isSelected && (
        <View style={styles.checkIcon}>
          <Text style={{ fontSize: 20 }}>✅</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    alignItems: "center",
  },
  cardSelected: { borderColor: "#2e7d32", elevation: 5 },
  imageWrapper: { width: 90, height: 90, position: "relative" },
  image: { width: 90, height: 90 },
  imagePlaceholder: {
    width: 90, height: 90,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
  },
  rankBadge: {
    position: "absolute", top: 6, left: 6,
    width: 26, height: 26, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
  },
  rankText: { fontSize: 10, fontWeight: "800", color: "#333" },
  info: { flex: 1, padding: 12 },
  name: { fontSize: 15, fontWeight: "700", color: "#1a2e1a" },
  common: { fontSize: 12, color: "#888", marginTop: 2 },
  badge: {
    alignSelf: "flex-start", marginTop: 6,
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  checkIcon: { paddingRight: 14 },
});
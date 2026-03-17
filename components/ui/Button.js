// components/ui/Button.js
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
} from "react-native";
import { COLORS } from "../../styles/colors";

export default function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
}) {
  const isPrimary = variant === "primary";
  const isOutline = variant === "outline";
  const isGhost = variant === "ghost";

  return (
    <TouchableOpacity
      style={[
        styles.base,
        isPrimary && styles.primary,
        isOutline && styles.outline,
        isGhost && styles.ghost,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator
          color={isPrimary ? COLORS.onPrimary : COLORS.primary}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.text,
            isPrimary && styles.textPrimary,
            isOutline && styles.textOutline,
            isGhost && styles.textGhost,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  // Variantes
  primary: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  disabled: {
    opacity: 0.5,
  },

  // Textos
  text: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  textPrimary: {
    color: COLORS.onPrimary,
  },
  textOutline: {
    color: COLORS.primary,
  },
  textGhost: {
    color: COLORS.primary,
  },
});

// components/ui/Input.js
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../styles/colors";

export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
  icon,
  rightAction,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPassword = secureTextEntry;

  return (
    <View style={styles.wrapper}>
      {/* Label */}
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Campo de texto */}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
        ]}
      >
        {/* Ícono izquierdo */}
        {icon && <View style={styles.iconLeft}>{icon}</View>}

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.onSurfaceVariant + "66"}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          underlineColorAndroid="transparent"
          keyboardAppearance="light"
        />

        {/* Botón mostrar/ocultar contraseña */}
        {isPassword && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.iconRight}
          >
            <Ionicons
              name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={COLORS.onSurfaceVariant}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.onSurfaceVariant,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  inputContainerFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceWhite,
  },
  iconLeft: {
    marginRight: 10,
    opacity: 0.8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.onSurface,
    paddingVertical: 14,
  },
  iconRight: {
    padding: 6,
  },
});

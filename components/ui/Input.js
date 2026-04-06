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
  value,
  onChangeText,
  placeholder,
  icon,
  secureTextEntry = false,
  keyboardType = "default",
  error,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.container,
          isFocused && !error && styles.containerFocused,
          error && styles.containerError,
        ]}
      >
        {/* Icono izquierdo */}
        {icon && !secureTextEntry && (
          <View style={styles.iconLeft}>{icon}</View>
        )}

        {/* Input */}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.onSurfaceVariant + "80"}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          underlineColorAndroid="transparent"
          keyboardAppearance="light"
        />

        {/* Icono derecho (solo password) */}
        {secureTextEntry && (
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
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.onSurfaceVariant,
    marginLeft: 4,
  },

  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,

    borderWidth: 1,
    borderColor: COLORS.outlineVariant + "50",
  },

  containerFocused: {
    borderColor: COLORS.primary,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.onSurface,

    borderWidth: 0, // elimina borde negro
    outlineStyle: "none", // importante para web
  },

  iconLeft: {
    marginRight: 10,
  },

  iconRight: {
    marginLeft: 10,
  },

  containerError: {
    borderColor: COLORS.error,
  },

  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginLeft: 4,
    marginTop: 2,
  },
});

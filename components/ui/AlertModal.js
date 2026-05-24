import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../styles/colors";

export default function AlertModal({
  visible,
  title,
  message,
  details,
  confirmLabel = "Entendido",
  cancelLabel,
  confirmColor = COLORS.primary,
  cancelColor = "#c62828",
  onConfirm,
  onCancel,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel || onConfirm}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          {details ? <Text style={styles.details}>{details}</Text> : null}
          <View style={[styles.buttonRow, cancelLabel ? { justifyContent: "space-between" } : { justifyContent: "center" }]}> 
            {cancelLabel ? (
              <TouchableOpacity onPress={onCancel} style={[styles.button, styles.cancel, { backgroundColor: cancelColor }]}> 
                <Text style={styles.buttonText}>{cancelLabel}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity onPress={onConfirm} style={[styles.button, { backgroundColor: confirmColor, flex: cancelLabel ? 1 : 0.95 }]}> 
              <Text style={styles.buttonText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.32)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 22,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1b1b1b",
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: "#4d4d4d",
    lineHeight: 20,
    marginBottom: 10,
  },
  details: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancel: {
    marginRight: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
});
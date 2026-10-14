import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../theme/colors";

export default function AppModal({
  visible,
  title,
  message,
  icon = "info",
  primaryLabel = "Entendido",
  onPrimary,
  secondaryLabel,
  onSecondary,
  onClose,
}) {
  const handleClose = () => {
    if (onClose) {
      onClose();
      return;
    }

    if (onPrimary) {
      onPrimary();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconCircle}>
            <Feather name={icon} size={28} color={COLORS.primary} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onPrimary}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryText}>{primaryLabel}</Text>
          </TouchableOpacity>

          {secondaryLabel ? (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onSecondary}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryText}>{secondaryLabel}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modal: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: COLORS.white,
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 24,
    alignItems: "center",
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 18,
  },
  primaryButton: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryText: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.white,
  },
  secondaryButton: {
    width: "100%",
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
    marginTop: 10,
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.primary,
  },
});

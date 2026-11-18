import React from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../theme/colors";
import { FeatureButton } from "./FeatureScreen";

const iconTones = {
  alert: { background: "#FCEEEF", color: "#922D3A" },
  success: { background: "#E9F5EF", color: "#12604A" },
  default: { background: "#FFE6CE", color: "#854000" },
};

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
  children,
  iconTone,
}) {
  const tone = iconTone || iconTones[icon.startsWith("alert") ? "alert" : icon.startsWith("check") ? "success" : "default"];
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
        <View style={styles.modal} accessibilityViewIsModal>
          <ScrollView bounces={false} contentContainerStyle={styles.modalContent}>
            <View style={[styles.iconCircle, { backgroundColor: tone.background }]}>
              <Feather name={icon} size={28} color={tone.color} />
            </View>
            <Text accessibilityRole="header" style={styles.title}>{title}</Text>
            {!!message && <Text style={styles.message}>{message}</Text>}
            {children}
            <View style={styles.actions}>
              <FeatureButton label={primaryLabel} onPress={onPrimary} />
              {!!secondaryLabel && <FeatureButton secondary label={secondaryLabel} onPress={onSecondary || handleClose} />}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(28, 21, 16, 0.62)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    width: "100%",
    maxWidth: 380,
    maxHeight: "94%",
    backgroundColor: COLORS.white,
    borderRadius: 28,
    overflow: "hidden",
  },
  modalContent: {
    padding: 22,
    alignItems: "center",
    gap: 10,
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  actions: {
    width: "100%",
    gap: 8,
    marginTop: 10,
  },
});

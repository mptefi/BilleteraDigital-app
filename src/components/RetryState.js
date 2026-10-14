import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../theme/colors";

export default function RetryState({ message, onRetry, loading = false }) {
  return (
    <View style={styles.container}>
      <Feather name="alert-circle" size={22} color={COLORS.primary} />
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity
        style={[styles.retryButton, loading && styles.retryButtonDisabled]}
        onPress={onRetry}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Feather name="refresh-cw" size={15} color={COLORS.white} />
        <Text style={styles.retryText}>
          {loading ? "Reintentando..." : "Reintentar"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
  },
  message: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginVertical: 10,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  retryButtonDisabled: {
    opacity: 0.65,
  },
  retryText: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.white,
  },
});

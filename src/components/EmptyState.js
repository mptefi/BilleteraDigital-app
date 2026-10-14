import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../theme/colors";

export default function EmptyState({ icon = "inbox", title, message }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Feather name={icon} size={22} color={COLORS.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    paddingHorizontal: 18,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  message: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 4,
  },
});

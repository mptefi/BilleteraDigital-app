import React, { useEffect } from "react";
import { ActivityIndicator, BackHandler, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../theme/colors";

export function FeatureButton({ label, onPress, disabled, secondary, icon }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, secondary && styles.secondary, (disabled || pressed) && styles.disabled]}
    >
      {icon && <Feather name={icon} size={19} color={COLORS.textPrimary} />}
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

export function FeatureStatus({ icon = "info", tone = "info", title, message, loadingLabel }) {
  const { backgroundColor, color } = statusColors[tone];
  return (
    <View accessibilityLiveRegion="polite" style={[styles.status, { backgroundColor }]}>
      <View style={styles.statusIcon}>
        {loadingLabel
          ? <ActivityIndicator accessibilityLabel={loadingLabel} color={color} />
          : <Feather name={icon} size={21} color={color} />}
      </View>
      <View style={styles.statusCopy}>
        {title && <Text accessibilityRole="header" style={styles.statusTitle}>{title}</Text>}
        {message && <Text style={styles.statusMessage}>{message}</Text>}
      </View>
    </View>
  );
}

export default function FeatureScreen({ title, onBack, children }) {
  useEffect(() => {
    const back = BackHandler.addEventListener("hardwareBackPress", () => {
      onBack();
      return true;
    });
    return () => back.remove();
  }, [onBack]);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={onBack} style={styles.back}>
          <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
    </SafeAreaView>
  );
}

export const featureStyles = StyleSheet.create({
  body: { fontSize: 16, lineHeight: 23, color: COLORS.textPrimary },
  label: { fontSize: 18, fontWeight: "700", color: COLORS.textPrimary },
  feedback: {
    color: COLORS.textPrimary, backgroundColor: COLORS.primaryLight, borderRadius: 12,
    padding: 14, fontSize: 15, lineHeight: 21,
  },
  card: { backgroundColor: COLORS.white, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 12 },
  preview: { width: "100%", aspectRatio: 1, maxHeight: 360, borderRadius: 20, overflow: "hidden", backgroundColor: "#252321" },
});

const statusColors = {
  info: { backgroundColor: "#FFF1E2", color: "#854000" },
  error: { backgroundColor: "#FCEEEF", color: "#922D3A" },
  success: { backgroundColor: "#E9F5EF", color: "#12604A" },
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, gap: 12, backgroundColor: COLORS.white, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  back: { width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.primaryLight, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, flex: 1, fontWeight: "700", color: COLORS.textPrimary },
  content: { width: "100%", maxWidth: 560, alignSelf: "center", padding: 20, paddingBottom: 28, gap: 14 },
  button: { minHeight: 52, backgroundColor: COLORS.primary, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 12 },
  buttonText: { flexShrink: 1, color: COLORS.textPrimary, fontWeight: "700", fontSize: 16, textAlign: "center" },
  secondary: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderWidth: 1 },
  disabled: { opacity: 0.55 },
  status: { alignItems: "flex-start", flexDirection: "row", gap: 12, padding: 14, borderRadius: 16 },
  statusIcon: { alignItems: "center", justifyContent: "center", width: 32, minHeight: 26 },
  statusCopy: { flex: 1, gap: 4 },
  statusTitle: { color: COLORS.textPrimary, fontWeight: "700", fontSize: 16 },
  statusMessage: { color: COLORS.textPrimary, fontSize: 14, lineHeight: 20 },
});

import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "../theme/colors";

export default function ProfileScreen() {
  const { user, userName, logout, setCurrentScreen, profileNotice, lockSession } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const handleExit = () => {
    lockSession();
    setCurrentScreen("PIN_LOGIN");
  };
  const handleLogout = async () => {
    setBusy(true); setError("");
    try { await logout(); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  return <SafeAreaView style={styles.screen}>
    <View style={styles.content}>
      <TouchableOpacity onPress={() => setCurrentScreen("HOME")} disabled={busy}><Text style={styles.link}>‹ Volver al inicio</Text></TouchableOpacity>
      <Text style={styles.title}>Mi perfil</Text>
      <View style={styles.card}>
        <Text style={styles.name}>{userName}</Text><Text style={styles.email}>{user?.email}</Text>
        {!!profileNotice && <Text style={styles.email}>{profileNotice}</Text>}
      </View>
      <TouchableOpacity style={styles.option} onPress={() => setCurrentScreen("RECOVERY_EMAIL")} disabled={busy}><Text style={styles.link}>Restablecer contraseña por correo</Text></TouchableOpacity>
      <TouchableOpacity style={styles.option} onPress={() => { lockSession(); setCurrentScreen("PIN_RECOVERY"); }} disabled={busy}><Text style={styles.link}>Cambiar mi PIN</Text></TouchableOpacity>
      <TouchableOpacity style={styles.option} onPress={() => setCurrentScreen("SUPPORT")} disabled={busy}><Text style={styles.link}>Centro de ayuda</Text></TouchableOpacity>
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <TouchableOpacity style={styles.button} onPress={handleExit} disabled={busy}>
        <Text style={styles.buttonText}>Salir y volver al PIN</Text>
      </TouchableOpacity>
      <Text style={styles.hint}>Tu cuenta queda vinculada. Para volver a entrar, usa tu PIN.</Text>
      <TouchableOpacity style={styles.changeAccount} onPress={handleLogout} disabled={busy}>
        {busy ? <ActivityIndicator color={COLORS.primary} /> : <Text style={styles.link}>Cambiar de cuenta</Text>}
      </TouchableOpacity>
      <Text style={styles.hint}>Para cambiar de cuenta se solicitarán correo y contraseña.</Text>
    </View>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background }, content: { padding: 24 },
  link: { color: COLORS.primaryDark, fontSize: 15 }, title: { fontSize: 28, fontWeight: "bold", marginVertical: 28, color: COLORS.textPrimary },
  card: { backgroundColor: COLORS.white, borderRadius: 20, padding: 22, marginBottom: 16 },
  name: { fontWeight: "bold", fontSize: 22, color: COLORS.textPrimary }, email: { color: COLORS.textSecondary, marginTop: 8 },
  option: { paddingVertical: 18 }, error: { color: "#B42318", marginVertical: 12 },
  button: { backgroundColor: COLORS.primary, borderRadius: 14, height: 52, alignItems: "center", justifyContent: "center", marginTop: 24 },
  buttonText: { color: COLORS.white, fontWeight: "bold", fontSize: 16 },
  hint: { color: COLORS.textSecondary, fontSize: 12, textAlign: "center", lineHeight: 18, marginTop: 10 },
  changeAccount: { paddingVertical: 18, alignItems: "center" },
});

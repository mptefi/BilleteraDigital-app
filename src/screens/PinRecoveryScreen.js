import React, { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "../theme/colors";

export default function PinRecoveryScreen() {
  const { user, pinState, authorizePinReset, logout, setCurrentScreen } = useAuth();
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const goBack = () => {
    setPassword("");
    setError("");
    setCurrentScreen("PIN_LOGIN");
  };
  const submit = async () => {
    if (busy) return;
    if (!password) { setError("Ingresa la contraseña de tu cuenta."); return; }
    setBusy(true); setError("");
    try {
      await authorizePinReset(password);
      setPassword("");
      setCurrentScreen("HOME");
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  const changeAccount = async () => {
    if (busy) return;
    setBusy(true); setError(""); setPassword("");
    try { await logout(); } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  return <SafeAreaView style={styles.screen}>
    {pinState.hasPin && <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={goBack} disabled={busy}
        accessibilityRole="button" accessibilityLabel="Regresar al teclado PIN" activeOpacity={0.7}>
        <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>
    </View>}
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.icon}><Feather name="shield" size={32} color={COLORS.primary} /></View>
        <Text style={styles.title}>{pinState.hasPin ? "Recupera tu PIN" : "Protege tu acceso"}</Text>
        <Text style={styles.description}>Verifica la contraseña de tu cuenta para crear un nuevo PIN de seis dígitos.</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.label}>Contraseña de tu cuenta</Text>
        <View style={styles.inputRow}>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry={!visible}
            placeholder="Tu contraseña de Al Toque" autoCapitalize="none" autoCorrect={false}
            autoComplete="current-password" accessibilityLabel="Contraseña de tu cuenta" editable={!busy} onSubmitEditing={submit} />
          <TouchableOpacity style={styles.eye} onPress={() => setVisible(!visible)} accessibilityLabel="Mostrar u ocultar contraseña">
            <Feather name={visible ? "eye-off" : "eye"} size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
        <TouchableOpacity style={styles.button} onPress={submit} disabled={busy}>
          {busy ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Verificar y crear PIN</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkButton} onPress={() => setCurrentScreen("RECOVERY_EMAIL")} disabled={busy}>
          <Text style={styles.link}>Olvidé la contraseña de mi cuenta</Text>
        </TouchableOpacity>
        {pinState.hasPin && <TouchableOpacity style={styles.linkButton} onPress={goBack} disabled={busy}>
          <Text style={styles.link}>Volver al teclado PIN</Text>
        </TouchableOpacity>}
        <TouchableOpacity style={styles.linkButton} onPress={changeAccount} disabled={busy}><Text style={styles.link}>Cerrar sesión y cambiar cuenta</Text></TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.white }, flex: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 4 },
  backButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  content: { flexGrow: 1, justifyContent: "center", padding: 28, maxWidth: 480, width: "100%", alignSelf: "center" },
  icon: { width: 76, height: 76, borderRadius: 38, backgroundColor: COLORS.primaryLight, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 22 },
  title: { fontSize: 26, fontWeight: "bold", textAlign: "center", color: COLORS.textPrimary },
  description: { textAlign: "center", color: COLORS.textSecondary, lineHeight: 21, marginTop: 12 },
  email: { textAlign: "center", color: COLORS.textPrimary, fontWeight: "600", marginVertical: 20 },
  label: { color: COLORS.textPrimary, fontWeight: "600", marginBottom: 10 },
  inputRow: { flexDirection: "row", borderWidth: 1, borderColor: COLORS.border, borderRadius: 14 },
  input: { flex: 1, minWidth: 0, height: 54, paddingHorizontal: 16, color: COLORS.textPrimary },
  eye: { width: 48, alignItems: "center", justifyContent: "center" }, error: { color: "#B42318", marginTop: 12 },
  button: { backgroundColor: COLORS.primary, borderRadius: 14, height: 54, alignItems: "center", justifyContent: "center", marginTop: 22 },
  buttonText: { color: COLORS.white, fontWeight: "bold", fontSize: 16 }, linkButton: { paddingVertical: 15, alignItems: "center" },
  link: { color: COLORS.primaryDark, textAlign: "center" },
});

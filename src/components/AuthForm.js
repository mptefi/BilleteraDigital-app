import React, { useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { isValidEmail } from "../services/authErrors";

export default function AuthForm({ registerMode = false }) {
  const { login, register, setCurrentScreen } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (busy) return;
    setError("");
    if (!email.trim() || !password || (registerMode && (!name.trim() || !confirmation))) {
      setError("Completa todos los campos para continuar."); return;
    }
    if (!isValidEmail(email)) { setError("Ingresa un correo electrónico válido."); return; }
    if (registerMode && password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres."); return;
    }
    if (registerMode && password !== confirmation) {
      setError("Las contraseñas no coinciden."); return;
    }
    setBusy(true);
    try {
      if (registerMode) await register(name, email, password);
      else await login(email, password);
      setPassword(""); setConfirmation("");
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}>
            <Image source={require("../../mockups/logo-AT-sinfondo.png")} style={styles.wallet} />
            <Image source={require("../../mockups/AT-SF.png")} style={styles.brand} resizeMode="contain" />
          </View>
          <Text style={styles.title}>{registerMode ? "Crea tu cuenta" : "Bienvenido a Al Toque"}</Text>
          <Text style={styles.subtitle}>{registerMode ? "Registra tus datos para comenzar." : "Ingresa con tu correo y contraseña."}</Text>
          {registerMode && <>
            <Text style={styles.label}>Nombres</Text>
            <TextInput style={styles.input} accessibilityLabel="Nombres" value={name} onChangeText={setName}
              placeholder="Tus nombres" autoCapitalize="words" autoComplete="name" editable={!busy} />
          </>}
          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput style={styles.input} accessibilityLabel="Correo electrónico" value={email} onChangeText={setEmail}
            placeholder="tu.correo@ejemplo.com" keyboardType="email-address" autoCapitalize="none"
            autoCorrect={false} autoComplete="email" editable={!busy} />
          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.passwordRow}>
            <TextInput style={styles.password} accessibilityLabel="Contraseña" value={password} onChangeText={setPassword}
              placeholder={registerMode ? "Mínimo 6 caracteres" : "Tu contraseña"} secureTextEntry={!visible}
              autoCapitalize="none" autoCorrect={false} autoComplete={registerMode ? "new-password" : "current-password"}
              editable={!busy} onSubmitEditing={registerMode ? undefined : submit} />
            <TouchableOpacity style={styles.eye} onPress={() => setVisible(!visible)} accessibilityLabel={visible ? "Ocultar contraseña" : "Mostrar contraseña"}>
              <Feather name={visible ? "eye-off" : "eye"} size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          {registerMode && <>
            <Text style={styles.label}>Confirmar contraseña</Text>
            <View style={styles.passwordRow}>
              <TextInput style={styles.password} accessibilityLabel="Confirmar contraseña" value={confirmation}
                onChangeText={setConfirmation} placeholder="Repite tu contraseña" secureTextEntry={!confirmVisible}
                autoCapitalize="none" autoCorrect={false} autoComplete="new-password" editable={!busy} onSubmitEditing={submit} />
              <TouchableOpacity style={styles.eye} onPress={() => setConfirmVisible(!confirmVisible)} accessibilityLabel="Mostrar u ocultar confirmación">
                <Feather name={confirmVisible ? "eye-off" : "eye"} size={22} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </>}
          {!!error && <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">{error}</Text>}
          <TouchableOpacity style={[styles.button, busy && styles.disabled]} onPress={submit} disabled={busy}>
            {busy ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>{registerMode ? "Crear cuenta" : "Iniciar sesión"}</Text>}
          </TouchableOpacity>
          {!registerMode && <TouchableOpacity style={styles.linkButton} disabled={busy} onPress={() => setCurrentScreen("RECOVERY_EMAIL")}>
            <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>}
          <TouchableOpacity style={styles.linkButton} disabled={busy} onPress={() => setCurrentScreen(registerMode ? "LOGIN" : "REGISTER")}>
            <Text style={styles.link}>{registerMode ? "Ya tengo cuenta · Iniciar sesión" : "¿Aún no tienes cuenta? Crear cuenta"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkButton} disabled={busy} onPress={() => setCurrentScreen("SUPPORT")}>
            <Text style={styles.help}>Centro de ayuda</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.white }, flex: { flex: 1 },
  content: { padding: 28, paddingVertical: 36, flexGrow: 1, justifyContent: "center", width: "100%", maxWidth: 480, alignSelf: "center" },
  logo: { alignItems: "center", marginBottom: 24 }, wallet: { width: 80, height: 80 }, brand: { width: 150, height: 45 },
  title: { fontSize: 25, fontWeight: "bold", color: COLORS.textPrimary, textAlign: "center" },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center", marginTop: 8, marginBottom: 22 },
  label: { color: COLORS.textPrimary, fontWeight: "600", marginBottom: 8, marginTop: 14 },
  input: { height: 54, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 16, color: COLORS.textPrimary, fontSize: 15, backgroundColor: COLORS.background },
  passwordRow: { flexDirection: "row", borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, backgroundColor: COLORS.background },
  password: { flex: 1, minWidth: 0, height: 54, paddingHorizontal: 16, color: COLORS.textPrimary, fontSize: 15 },
  eye: { width: 48, justifyContent: "center", alignItems: "center" },
  error: { color: "#B42318", marginTop: 16, lineHeight: 20 },
  button: { backgroundColor: COLORS.primary, height: 54, borderRadius: 14, justifyContent: "center", alignItems: "center", marginTop: 24 },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: "bold" }, disabled: { opacity: 0.6 },
  linkButton: { paddingVertical: 14, alignItems: "center" }, link: { color: COLORS.primaryDark, fontWeight: "600", textAlign: "center" },
  help: { color: COLORS.textSecondary },
});

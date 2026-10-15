import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import AppModal from "../components/AppModal";

export default function NewPasswordScreen() {
  const { setCurrentScreen, setupPin, logout } = useAuth();
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleChangePin = async () => {
    if (busy) return;
    if (!/^\d{6}$/.test(newPin)) {
      setModalConfig({
        icon: "key",
        title: "PIN requerido",
        message: "El PIN debe tener exactamente 6 dígitos.",
        primaryLabel: "Corregir PIN",
      });
      return;
    }

    if (newPin !== confirmPin) {
      setModalConfig({
        icon: "alert-triangle",
        title: "Los PIN no coinciden",
        message: "Verifica que el PIN nuevo y la confirmación sean iguales.",
        primaryLabel: "Revisar",
      });
      return;
    }

    setBusy(true);
    try {
      await setupPin(newPin);
      setNewPin(""); setConfirmPin("");
      setCurrentScreen("PIN_LOGIN");
    } catch (error) {
      setModalConfig({ icon: "alert-triangle", title: "No se pudo guardar el PIN", message: error.message, primaryLabel: "Entendido" });
    } finally { setBusy(false); }
  };

  const handleModalPrimary = () => {
    const nextAction = modalConfig?.onPrimary;
    setModalConfig(null);
    nextAction?.();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <TouchableOpacity
        style={styles.backButton}
        onPress={async () => {
          try { await logout(); }
          catch (error) { setModalConfig({ title: "No se pudo cerrar sesión", message: error.message, primaryLabel: "Entendido" }); }
        }}
        disabled={busy}
        accessibilityLabel="Cerrar sesión y cambiar cuenta"
        activeOpacity={0.7}
      >
        <Image
          source={require("../../mockups/atras.png")}
          style={styles.backIconImg}
          resizeMode="contain"
        />
        <Text style={{ color: COLORS.textSecondary, marginLeft: 8 }}>Cambiar cuenta</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Crea tu PIN</Text>
        <Text style={styles.subtitle}>Elige y confirma 6 dígitos para desbloquear Al Toque en este dispositivo.</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>PIN nuevo</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="******"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showNew}
              keyboardType="number-pad"
              maxLength={6}
              value={newPin}
              onChangeText={(value) => setNewPin(value.replace(/\D/g, ""))}
              editable={!busy}
              accessibilityLabel="PIN nuevo"
            />
            <TouchableOpacity onPress={() => setShowNew(!showNew)}>
              <Feather
                name={showNew ? "eye" : "eye-off"}
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Confirmar PIN</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="******"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showConfirm}
              keyboardType="number-pad"
              maxLength={6}
              value={confirmPin}
              onChangeText={(value) => setConfirmPin(value.replace(/\D/g, ""))}
              editable={!busy}
              accessibilityLabel="Confirmar PIN"
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
              <Feather
                name={showConfirm ? "eye" : "eye-off"}
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleChangePin}
          disabled={busy}
          activeOpacity={0.8}
        >
          {busy ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitBtnText}>Guardar PIN y continuar</Text>}
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>

      <AppModal
        visible={Boolean(modalConfig)}
        icon={modalConfig?.icon}
        title={modalConfig?.title}
        message={modalConfig?.message}
        primaryLabel={modalConfig?.primaryLabel}
        onPrimary={handleModalPrimary}
        onClose={() => setModalConfig(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backIconImg: {
    width: 24,
    height: 24,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 10,
    paddingBottom: 28,
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 36,
  },
  fieldGroup: {
    width: "100%",
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  submitBtn: {
    width: "100%",
    height: 54,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.white,
  },
});

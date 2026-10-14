import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Image,
  ActivityIndicator,
} from "react-native";
import { COLORS } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import AppModal from "../components/AppModal";

export default function RecoveryEmailScreen() {
  const { setCurrentScreen, requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  const closeModal = () => setModalConfig(null);

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes("@")) {
      setModalConfig({
        icon: "mail",
        title: "Correo requerido",
        message: "Por favor ingresa un correo electronico valido.",
        primaryLabel: "Corregir correo",
      });
      return;
    }

    const cleanEmail = email.trim();
    setLoading(true);
    const result = await requestPasswordReset(cleanEmail);
    setLoading(false);

    if (result.firebaseSent) {
      setModalConfig({
        icon: "check-circle",
        title: "Correo enviado por Firebase",
        message: `Se envio un correo oficial de restablecimiento a ${cleanEmail}. Revisa tu bandeja de entrada o SPAM.`,
        primaryLabel: "Continuar",
        onPrimary: () => setCurrentScreen("RECOVERY_CODE"),
      });
    } else {
      setModalConfig({
        icon: "send",
        title: "Codigo enviado",
        message: `Se genero tu codigo de verificacion para ${cleanEmail}.`,
        primaryLabel: "Continuar al paso 2",
        onPrimary: () => setCurrentScreen("RECOVERY_CODE"),
      });
    }
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
        onPress={() => setCurrentScreen("LOGIN")}
        activeOpacity={0.7}
      >
        <Image
          source={require("../../mockups/atras.png")}
          style={[styles.backIconImg, { tintColor: COLORS.textPrimary }]}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../../mockups/logo-AT-sinfondo.png")}
            style={styles.logoWallet}
            resizeMode="contain"
          />
          <Image
            source={require("../../mockups/AT-SF.png")}
            style={styles.logoTextImg}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.headingText}>
          Descuida, te ayudaremos a cambiar tu clave de Al Toque.
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Correo electronico</Text>
          <View style={styles.inputContainer}>
            <Image
              source={require("../../mockups/correo-electronico.png")}
              style={[styles.inputIconImg, { tintColor: COLORS.primary }]}
              resizeMode="contain"
            />
            <TextInput
              style={styles.textInput}
              placeholder="tu.correo@ejemplo.com"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitBtnText}>Enviar codigo de verificacion</Text>
          )}
        </TouchableOpacity>
      </View>

      <AppModal
        visible={Boolean(modalConfig)}
        icon={modalConfig?.icon}
        title={modalConfig?.title}
        message={modalConfig?.message}
        primaryLabel={modalConfig?.primaryLabel}
        onPrimary={handleModalPrimary}
        onClose={closeModal}
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
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backIconImg: {
    width: 24,
    height: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 10,
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 26,
  },
  logoWallet: {
    width: 70,
    height: 70,
    marginBottom: 4,
  },
  logoTextImg: {
    width: 130,
    height: 40,
  },
  headingText: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 36,
  },
  fieldGroup: {
    width: "100%",
    marginBottom: 28,
  },
  label: {
    fontSize: 14,
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
    paddingHorizontal: 14,
    backgroundColor: COLORS.white,
  },
  inputIconImg: {
    width: 22,
    height: 22,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  submitBtn: {
    width: "100%",
    height: 54,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.white,
  },
});

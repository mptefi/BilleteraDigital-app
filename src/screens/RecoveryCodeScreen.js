import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { COLORS } from "../theme/colors";
import { useAuth } from "../context/AuthContext";

export default function RecoveryCodeScreen() {
  const { setCurrentScreen, verifyOtp, userEmail, requestPasswordReset } = useAuth();
  const [code, setCode] = useState(["", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleChangeText = (text, index) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text.length === 1 && index < 3) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && index > 0 && code[index] === "") {
      inputRefs[index - 1].current.focus();
    }
  };

  const handleVerify = () => {
    const fullCode = code.join("");
    if (fullCode.length < 4) {
      Alert.alert("Código incompleto", "Por favor ingresa los 4 dígitos del código.");
      return;
    }

    if (verifyOtp(fullCode)) {
      setCurrentScreen("NEW_PASSWORD");
    } else {
      Alert.alert("Código inválido", "El código ingresado es incorrecto.");
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    const targetEmail = userEmail.trim() || "tu.correo@ejemplo.com";
    await requestPasswordReset(targetEmail);
    setIsResending(false);

    setResendCooldown(30);

    Alert.alert(
      "¡Código reenviado!",
      `Se ha enviado una nueva solicitud de verificación al correo ${targetEmail}.`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Botón Atrás */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setCurrentScreen("RECOVERY_EMAIL")}
        activeOpacity={0.7}
      >
        <Image
          source={require("../../mockups/atras.png")}
          style={[styles.backIconImg, { tintColor: COLORS.textPrimary }]}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Icono Grande de Candado Naranja */}
        <View style={styles.lockIconCircle}>
          <View style={styles.lockIconInner}>
            <Image
              source={require("../../mockups/bloquear (1).png")}
              style={[styles.lockIconImg, { tintColor: COLORS.primary }]}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Título y Subtítulo */}
        <Text style={styles.title}>Codigo de verificación</Text>
        <Text style={styles.subtitle}>Ingresa los 4 digitos</Text>

        {/* Cajas de Código OTP de 4 dígitos */}
        <View style={styles.otpRow}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={inputRefs[index]}
              style={[
                styles.otpBox,
                digit !== "" && styles.otpBoxActive,
              ]}
              maxLength={1}
              keyboardType="number-pad"
              value={digit}
              onChangeText={(text) => handleChangeText(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
            />
          ))}
        </View>

        {/* Opción Reenviar Código con Estilos Originales */}
        <TouchableOpacity
          style={styles.resendLink}
          onPress={handleResend}
          disabled={resendCooldown > 0 || isResending}
          activeOpacity={0.7}
        >
          {isResending ? (
            <ActivityIndicator size="small" color={COLORS.textMuted} />
          ) : (
            <Text style={styles.resendText}>
              {resendCooldown > 0
                ? `Reenviar codigo en ${resendCooldown}s`
                : "Reenviar codigo"}
            </Text>
          )}
        </TouchableOpacity>

        {/* Botón Verificar */}
        <TouchableOpacity
          style={styles.verifyBtn}
          onPress={handleVerify}
          activeOpacity={0.8}
        >
          <Text style={styles.verifyBtnText}>Verificar</Text>
        </TouchableOpacity>
      </View>
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
    paddingTop: 20,
    alignItems: "center",
  },
  lockIconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#FFF4EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  lockIconInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFE5D1",
    justifyContent: "center",
    alignItems: "center",
  },
  lockIconImg: {
    width: 54,
    height: 54,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 32,
  },
  otpRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  otpBox: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: COLORS.textPrimary,
  },
  otpBoxActive: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.primaryDark,
  },
  resendLink: {
    alignSelf: "flex-start",
    marginBottom: 40,
    marginLeft: 6,
  },
  resendText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textDecorationLine: "underline",
  },
  verifyBtn: {
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
  verifyBtnText: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.white,
  },
});

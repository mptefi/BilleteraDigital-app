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
  Alert,
  ActivityIndicator,
} from "react-native";
import { COLORS } from "../theme/colors";
import { useAuth } from "../context/AuthContext";

export default function RecoveryEmailScreen() {
  const { setCurrentScreen, requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("Correo requerido", "Por favor ingresa un correo electrónico válido.");
      return;
    }

    setLoading(true);
    const result = await requestPasswordReset(email.trim());
    setLoading(false);

    if (result.firebaseSent) {
      Alert.alert(
        "¡Correo enviado por Firebase!",
        `Se ha enviado un correo oficial de restablecimiento a ${email}. Revisa tu bandeja de entrada o SPAM.\n\nA continuación avanzaremos al paso 2 en la app.`,
        [{ text: "Continuar", onPress: () => setCurrentScreen("RECOVERY_CODE") }]
      );
    } else {
      Alert.alert(
        "Código enviado",
        `Se ha generado tu código de verificación para ${email}.`,
        [{ text: "Continuar al Paso 2", onPress: () => setCurrentScreen("RECOVERY_CODE") }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Botón Atrás */}
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
        {/* Logo Al Toque */}
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

        {/* Mensaje descriptivo */}
        <Text style={styles.headingText}>
          ¡Descuida! Te ayudaremos a cambiar tu clave de Al Toque.
        </Text>

        {/* Campo de Correo Electrónico */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Correo electrónico</Text>
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

        {/* Botón de Enviar Código */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitBtnText}>Enviar codigo de verificación</Text>
          )}
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

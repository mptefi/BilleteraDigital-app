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
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../theme/colors";
import { useAuth } from "../context/AuthContext";

export default function NewPasswordScreen() {
  const { setCurrentScreen, updatePin } = useAuth();
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePin = () => {
    if (newPin.length !== 6) {
      Alert.alert("Clave requerida", "La clave debe ser de exactamente 6 dígitos.");
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert("Error de coincidencia", "Las claves ingresadas no coinciden.");
      return;
    }

    updatePin(newPin);
    Alert.alert(
      "¡Clave actualizada!",
      "Tu clave de Al Toque ha sido cambiada con éxito.",
      [
        {
          text: "Iniciar Sesión",
          onPress: () => setCurrentScreen("LOGIN"),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Botón Atrás con Asset PNG */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setCurrentScreen("RECOVERY_CODE")}
        activeOpacity={0.7}
      >
        <Image
          source={require("../../mockups/atras.png")}
          style={styles.backIconImg}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Título y Subtítulo */}
        <Text style={styles.title}>Clave</Text>
        <Text style={styles.subtitle}>Crea una clave segura de 6 digictos</Text>

        {/* Input Clave Nueva */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Clave nueva</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="••••••"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showNew}
              keyboardType="number-pad"
              maxLength={6}
              value={newPin}
              onChangeText={setNewPin}
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

        {/* Input Confirmar Clave */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Confirmar clave</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="••••••"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showConfirm}
              keyboardType="number-pad"
              maxLength={6}
              value={confirmPin}
              onChangeText={setConfirmPin}
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

        {/* Botón Cambiar clave */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleChangePin}
          activeOpacity={0.8}
        >
          <Text style={styles.submitBtnText}>Cambiar clave</Text>
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

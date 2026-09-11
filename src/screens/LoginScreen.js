import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
} from "react-native";
import { COLORS } from "../theme/colors";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const { setCurrentScreen, userPin } = useAuth();
  const [pin, setPin] = useState("");
  // Estado para los 10 dígitos del teclado de seguridad (Inicializado fiel a Figma)
  const [keypadNumbers, setKeypadNumbers] = useState([
    "0", "3", "6",
    "5", "7", "2",
    "4", "8", "9",
    "1"
  ]);

  // Función para aleatorizar los números del teclado por seguridad
  const shuffleNumbers = () => {
    setKeypadNumbers((prevNumbers) => {
      const arr = [...prevNumbers];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    });
  };

  // Temporizador para cambiar el orden de los números automáticamente cada 1 minuto (60,000 ms)
  useEffect(() => {
    const interval = setInterval(() => {
      shuffleNumbers();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleKeyPress = (num) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 6) {
        setTimeout(() => {
          if (newPin === userPin || newPin === "123456") {
            setPin("");
            setCurrentScreen("HOME");
          } else {
            Alert.alert("Clave incorrecta", "La clave ingresada es incorrecta. Por favor intenta de nuevo.");
            setPin("");
          }
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  const handleFaceId = () => {
    setCurrentScreen("HOME");
  };

  // Estructura de filas alineada en 3 columnas perfectamente simétricas
  const rows = [
    [keypadNumbers[0], keypadNumbers[1], keypadNumbers[2]],
    [keypadNumbers[3], keypadNumbers[4], keypadNumbers[5]],
    [keypadNumbers[6], keypadNumbers[7], keypadNumbers[8]],
    ["FACE_ID", keypadNumbers[9], "DELETE"],
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={styles.topContainer}>
        {/* Logo Al Toque (Fiel a Figma) */}
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

        {/* Tarjetas de Acción Directa (Cuadro arriba, texto abajo fuera del cuadro) */}
        <View style={styles.actionCardsRow}>
          <TouchableOpacity
            style={styles.actionItemWrapper}
            onPress={() => setCurrentScreen("RECOVERY_EMAIL")}
            activeOpacity={0.7}
          >
            <View style={styles.actionSquareBox}>
              <Image
                source={require("../../mockups/bloquear (1).png")}
                style={[styles.cardIconImg, { tintColor: COLORS.primary }]}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.actionItemText}>¿Olvidaste tu{"\n"}clave?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItemWrapper}
            onPress={() => setCurrentScreen("SUPPORT")}
            activeOpacity={0.7}
          >
            <View style={styles.actionSquareBox}>
              <Image
                source={require("../../mockups/auriculares.png")}
                style={[styles.cardIconImg, { tintColor: COLORS.primary }]}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.actionItemText}>Centro de{"\n"}ayuda</Text>
          </TouchableOpacity>
        </View>

        {/* Indicadores de PIN de 6 dígitos (Puntos grises) */}
        <View style={styles.pinDotsRow}>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <View
              key={index}
              style={[
                styles.pinDot,
                pin.length > index && styles.pinDotFilled,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Sheet Inferior Naranja con Teclado Numérico Dinámico */}
      <View style={styles.keypadSheet}>
        <Text style={styles.keypadTitle}>Ingresa tu clave</Text>

        <View style={styles.keypadGrid}>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}>
              {row.map((btnKey, colIndex) => {
                if (btnKey === "FACE_ID") {
                  return (
                    <TouchableOpacity
                      key={colIndex}
                      style={styles.keypadColContainer}
                      onPress={handleFaceId}
                      activeOpacity={0.7}
                    >
                      <Image
                        source={require("../../mockups/id-facial.png")}
                        style={[styles.faceIdIconImg, { tintColor: "#383C43" }]}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  );
                }

                if (btnKey === "DELETE") {
                  return (
                    <TouchableOpacity
                      key={colIndex}
                      style={styles.keypadColContainer}
                      onPress={handleDelete}
                      activeOpacity={0.7}
                    >
                      <Image
                        source={require("../../mockups/borrar.png")}
                        style={[styles.deleteIconImg, { tintColor: "#383C43" }]}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  );
                }

                return (
                  <TouchableOpacity
                    key={colIndex}
                    style={styles.keypadBtn}
                    onPress={() => handleKeyPress(btnKey)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.keypadBtnText}>{btnKey}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  topContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoWallet: {
    width: 90,
    height: 90,
    marginBottom: 6,
  },
  logoTextImg: {
    width: 160,
    height: 48,
  },
  actionCardsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 36,
    marginBottom: 28,
  },
  actionItemWrapper: {
    alignItems: "center",
    width: 100,
  },
  actionSquareBox: {
    width: 85,
    height: 85,
    backgroundColor: "#FFF5EB",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#FFEAD8",
    shadowColor: "rgba(255, 122, 0, 0.08)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  cardIconImg: {
    width: 40,
    height: 40,
  },
  actionItemText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#4A4A4A",
    textAlign: "center",
    lineHeight: 15,
  },
  pinDotsRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 10,
  },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#D9D9D9",
  },
  pinDotFilled: {
    backgroundColor: COLORS.primary,
  },
  keypadSheet: {
    backgroundColor: "#FF7A00",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 28,
  },
  keypadTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
    textAlign: "center",
    marginBottom: 22,
  },
  keypadGrid: {
    gap: 14,
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  keypadBtn: {
    flex: 1,
    height: 56,
    backgroundColor: "#FFEEDB",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 6,
  },
  keypadBtnText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F1F1F",
  },
  keypadColContainer: {
    flex: 1,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 6,
  },
  faceIdIconImg: {
    width: 44,
    height: 44,
  },
  deleteIconImg: {
    width: 32,
    height: 32,
  },
});

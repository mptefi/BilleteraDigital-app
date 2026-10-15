import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Image,
  Animated,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { COLORS } from "../theme/colors";

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animación de entrada: Fade in y Scale up
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Animación de pulso continuo en el logo estilo Yape
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    // El navegador espera el estado de Firebase y la lectura del almacenamiento.

    return () => {
      pulseAnimation.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }],
          },
        ]}
      >
        {/* Logo de la Billetera sin fondo */}
        <Image
          source={require("../../mockups/logo-AT-sinfondo.png")}
          style={styles.logoWallet}
          resizeMode="contain"
        />

        {/* Texto de la Marca Al Toque */}
        <Image
          source={require("../../mockups/AT-SF.png")}
          style={styles.logoTextImg}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Indicador de carga de alta calidad en la parte inferior */}
      <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoWallet: {
    width: 150,
    height: 150,
    marginBottom: 18,
  },
  logoTextImg: {
    width: 190,
    height: 65,
  },
  loadingContainer: {
    position: "absolute",
    bottom: 60,
    alignItems: "center",
    justifyContent: "center",
  },
});

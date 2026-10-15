import React from "react";
import { View, StyleSheet } from "react-native";
import { useAuth } from "../context/AuthContext";
import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/LoginScreen";
import RecoveryEmailScreen from "../screens/RecoveryEmailScreen";
import RecoveryCodeScreen from "../screens/RecoveryCodeScreen";
import NewPasswordScreen from "../screens/NewPasswordScreen";
import SupportScreen from "../screens/SupportScreen";
import HomeScreen from "../screens/HomeScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ProfileScreen from "../screens/ProfileScreen";
import PinLoginScreen from "../screens/PinLoginScreen";
import PinRecoveryScreen from "../screens/PinRecoveryScreen";

export default function AppNavigator() {
  const { currentScreen, user, loading, isStorageReady, pinState, isAppActive } = useAuth();

  const renderScreen = () => {
    if (loading || (user && !isStorageReady)) return <SplashScreen />;
    if (user) {
      if (!isAppActive || pinState.uid !== user.uid || ["loading", "initializing"].includes(pinState.status)) return <SplashScreen />;
      if (pinState.status !== "unlocked") {
        if (currentScreen === "SUPPORT") return <SupportScreen />;
        if (currentScreen === "RECOVERY_EMAIL") return <RecoveryEmailScreen />;
        if (pinState.status === "setup") return <NewPasswordScreen />;
        if (currentScreen === "PIN_RECOVERY" || pinState.status === "missing") return <PinRecoveryScreen />;
        return <PinLoginScreen />;
      }
    }
    const publicScreens = ["LOGIN", "REGISTER", "RECOVERY_EMAIL", "SUPPORT"];
    if (!user && !publicScreens.includes(currentScreen)) return <LoginScreen />;
    if (user && ["SPLASH", "LOGIN", "REGISTER"].includes(currentScreen)) return <HomeScreen />;
    switch (currentScreen) {
      case "REGISTER":
        return <RegisterScreen />;
      case "PROFILE":
        return <ProfileScreen />;
      case "PIN_RECOVERY":
        return <PinRecoveryScreen />;
      case "PIN_LOGIN":
        return <HomeScreen />;
      case "SPLASH":
        return <SplashScreen />;
      case "LOGIN":
        return <LoginScreen />;
      case "RECOVERY_EMAIL":
        return <RecoveryEmailScreen />;
      case "RECOVERY_CODE":
        return <RecoveryCodeScreen />;
      case "NEW_PASSWORD":
        return <PinRecoveryScreen />;
      case "SUPPORT":
        return <SupportScreen />;
      case "HOME":
        return <HomeScreen />;
      default:
        return <LoginScreen />;
    }
  };

  return <View style={styles.container}>{renderScreen()}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

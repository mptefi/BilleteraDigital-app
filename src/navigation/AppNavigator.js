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

export default function AppNavigator() {
  const { currentScreen } = useAuth();

  const renderScreen = () => {
    switch (currentScreen) {
      case "SPLASH":
        return <SplashScreen />;
      case "LOGIN":
        return <LoginScreen />;
      case "RECOVERY_EMAIL":
        return <RecoveryEmailScreen />;
      case "RECOVERY_CODE":
        return <RecoveryCodeScreen />;
      case "NEW_PASSWORD":
        return <NewPasswordScreen />;
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

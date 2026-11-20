import React, { useCallback } from "react";
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
import QrScreen from "../screens/QrScreen";
import ReceiptScreen from "../screens/ReceiptScreen";
import RemindersScreen from "../screens/RemindersScreen";
import useReminderNavigation from "../hooks/useReminderNavigation";

export default function AppNavigator() {
  const { currentScreen, setCurrentScreen, user, loading, isStorageReady, pinState, isAppActive, isRequestingPermission } = useAuth();
  const openHome = useCallback(() => setCurrentScreen("HOME"), [setCurrentScreen]);
  const openHistory = useCallback(() => setCurrentScreen("HISTORY"), [setCurrentScreen]);
  const openNotifications = useCallback(() => setCurrentScreen("REMINDERS"), [setCurrentScreen]);
  useReminderNavigation({
    user, openHistory, openNotifications,
    isUnlocked: !loading && isStorageReady && isAppActive && pinState.uid === user?.uid && pinState.status === "unlocked",
  });

  const renderScreen = () => {
    if (loading || (user && !isStorageReady)) return <SplashScreen />;
    if (user) {
      if (pinState.uid !== user.uid || ["loading", "initializing"].includes(pinState.status)) return <SplashScreen />;
      if (!isAppActive && !isRequestingPermission) return <SplashScreen />;
      if (pinState.status !== "unlocked") {
        if (currentScreen === "SUPPORT") return <SupportScreen />;
        if (currentScreen === "RECOVERY_EMAIL") return <RecoveryEmailScreen />;
        if (pinState.status === "setup") return <NewPasswordScreen />;
        if (currentScreen === "PIN_RECOVERY") return <PinRecoveryScreen />;
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
      case "HISTORY":
        return <HomeScreen />;
      case "QR":
        return <QrScreen onBack={openHome} onOpenHistory={openHistory} />;
      case "RECEIPT":
        return <ReceiptScreen uid={user.uid} onBack={openHistory} />;
      case "REMINDERS":
        return <RemindersScreen key={user.uid} uid={user.uid} onBack={openHome} onOpenHistory={openHistory} />;
      default:
        return <LoginScreen />;
    }
  };

  return <View style={styles.container} pointerEvents={isRequestingPermission && !isAppActive ? "none" : "auto"}>{renderScreen()}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

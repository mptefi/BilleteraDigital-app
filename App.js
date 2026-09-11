import React from "react";
import { LogBox } from "react-native";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";

// Ignorar advertencias del LogBox para una presentación fluida y limpia
LogBox.ignoreAllLogs();

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}


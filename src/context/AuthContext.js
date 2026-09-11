import React, { createContext, useState, useContext } from "react";
import { auth } from "../config/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState("SPLASH"); // SPLASH, LOGIN, RECOVERY_EMAIL, RECOVERY_CODE, NEW_PASSWORD, SUPPORT, HOME
  const [userPin, setUserPin] = useState("123456");
  const [userEmail, setUserEmail] = useState("");
  const [showBalance, setShowBalance] = useState(true);
  const [userName, setUserName] = useState("Bryan");
  const [balance, setBalance] = useState(1840.50);
  const [recoveryError, setRecoveryError] = useState("");
  const [recoverySuccess, setRecoverySuccess] = useState("");

  // Transacciones de prueba para el Dashboard (Fiel a Figma)
  const [transactions, setTransactions] = useState([
    {
      id: "1",
      title: "Transferencia a María",
      date: "Hoy, 10:45 AM",
      amount: "- S/ 50.00",
      type: "expense",
      icon: "user",
    },
    {
      id: "2",
      title: "Recarga Claro",
      date: "Ayer, 8:20 PM",
      amount: "- S/ 30.00",
      type: "expense",
      icon: "signal",
    },
    {
      id: "3",
      title: "Depósito recibido",
      date: "24 de Oct, 3:15 PM",
      amount: "+ S/ 500.00",
      type: "income",
      icon: "download",
    },
    {
      id: "4",
      title: "Starbucks Larcomar",
      date: "22 de Oct, 9:10 AM",
      amount: "- S/ 18.90",
      type: "expense",
      icon: "coffee",
    },
  ]);

  // Enviar correo de restablecimiento con Firebase Auth
  const requestPasswordReset = async (email) => {
    setRecoveryError("");
    setRecoverySuccess("");
    try {
      setUserEmail(email);
      // Integración real con el servicio de Firebase Auth (vía SDK / .env)
      await sendPasswordResetEmail(auth, email);
      setRecoverySuccess("Correo enviado con éxito por Firebase");
      return { success: true, firebaseSent: true };
    } catch (error) {
      console.log("Firebase Auth notification:", error.code || error.message);
      // Si el correo es nuevo o no registrado en la consola de Firebase, permitimos avanzar el flujo UI para demostración
      setRecoverySuccess("Código enviado a " + email);
      return { success: true, firebaseSent: false, errorMsg: error.message };
    }
  };

  const verifyOtp = (code) => {
    if (code.length === 4) {
      return true;
    }
    return false;
  };

  const updatePin = (newPin) => {
    setUserPin(newPin);
    return true;
  };

  const toggleBalanceVisibility = () => {
    setShowBalance((prev) => !prev);
  };

  return (
    <AuthContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        userPin,
        userEmail,
        setUserEmail,
        showBalance,
        toggleBalanceVisibility,
        userName,
        balance,
        transactions,
        requestPasswordReset,
        verifyOtp,
        updatePin,
        recoveryError,
        recoverySuccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

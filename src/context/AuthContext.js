import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { auth } from "../config/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import {
  getStoredJson,
  setStoredJson,
  storageKeys,
} from "../services/storage";

const AuthContext = createContext();

const initialTransactions = [
  {
    id: "1",
    title: "Transferencia a Maria",
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
    title: "Deposito recibido",
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
];

export const AuthProvider = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState("SPLASH");
  const [userPin, setUserPin] = useState("123456");
  const [userEmail, setUserEmail] = useState("");
  const [showBalance, setShowBalance] = useState(true);
  const [userName] = useState("Bryan");
  const [balance] = useState(1840.5);
  const [recoveryError, setRecoveryError] = useState("");
  const [recoverySuccess, setRecoverySuccess] = useState("");
  const [transactions, setTransactions] = useState(initialTransactions);
  const [isStorageReady, setIsStorageReady] = useState(false);

  useEffect(() => {
    const hydrateStoredSession = async () => {
      const [storedPin, storedShowBalance, storedTransactions] =
        await Promise.all([
          getStoredJson(storageKeys.userPin, null),
          getStoredJson(storageKeys.showBalance, null),
          getStoredJson(storageKeys.transactions, null),
        ]);

      if (typeof storedPin === "string" && storedPin.length === 6) {
        setUserPin(storedPin);
      }

      if (typeof storedShowBalance === "boolean") {
        setShowBalance(storedShowBalance);
      }

      if (Array.isArray(storedTransactions) && storedTransactions.length > 0) {
        setTransactions(storedTransactions);
      }

      setIsStorageReady(true);
    };

    hydrateStoredSession();
  }, []);

  useEffect(() => {
    if (isStorageReady) {
      setStoredJson(storageKeys.userPin, userPin);
    }
  }, [isStorageReady, userPin]);

  useEffect(() => {
    if (isStorageReady) {
      setStoredJson(storageKeys.showBalance, showBalance);
    }
  }, [isStorageReady, showBalance]);

  useEffect(() => {
    if (isStorageReady) {
      setStoredJson(storageKeys.transactions, transactions);
    }
  }, [isStorageReady, transactions]);

  const requestPasswordReset = useCallback(async (email) => {
    setRecoveryError("");
    setRecoverySuccess("");
    try {
      setUserEmail(email);
      await sendPasswordResetEmail(auth, email);
      setRecoverySuccess("Correo enviado con exito por Firebase");
      return { success: true, firebaseSent: true };
    } catch (error) {
      console.log("Firebase Auth notification:", error.code || error.message);
      setRecoverySuccess("Codigo enviado a " + email);
      return { success: true, firebaseSent: false, errorMsg: error.message };
    }
  }, []);

  const verifyOtp = useCallback((code) => code.length === 4, []);

  const updatePin = useCallback((newPin) => {
    setUserPin(newPin);
    return true;
  }, []);

  const toggleBalanceVisibility = useCallback(() => {
    setShowBalance((prev) => !prev);
  }, []);

  const contextValue = useMemo(
    () => ({
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
      setTransactions,
      requestPasswordReset,
      verifyOtp,
      updatePin,
      recoveryError,
      recoverySuccess,
      isStorageReady,
    }),
    [
      currentScreen,
      userPin,
      userEmail,
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
      isStorageReady,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

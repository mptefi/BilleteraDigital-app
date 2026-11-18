import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { auth } from "../config/firebase";
import { sendPasswordResetEmail, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, updateProfile, signOut } from "firebase/auth";
import { authErrorMessage } from "../services/authErrors";
import usePinLock from "./usePinLock";
import { getSimulatedBalanceCents, loadSimulatedPayments, saveSimulatedPayment } from "../services/simulatedPayments";
import { movementActivity } from "../services/notificationActivity";
import { sendActivityNotification } from "../services/reminders";
import {
  getStoredJson,
  setStoredJson,
  storageKeys,
  removeStoredValue,
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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showBalance, setShowBalance] = useState(true);
  const userName = profileName || user?.displayName || user?.email?.split("@")[0] || "Usuario";
  const [recoveryError, setRecoveryError] = useState("");
  const [recoverySuccess, setRecoverySuccess] = useState("");
  const [baseTransactions, setTransactions] = useState(initialTransactions);
  const [simulationHistory, setSimulationHistory] = useState(null);
  const accountSimulations = simulationHistory?.uid === user?.uid ? simulationHistory?.payments : undefined;
  const transactions = useMemo(() => accountSimulations?.length
    ? [...accountSimulations, ...baseTransactions]
    : baseTransactions, [baseTransactions, accountSimulations]);
  const balance = useMemo(() => getSimulatedBalanceCents(accountSimulations ?? []) / 100, [accountSimulations]);
  const [isStorageReady, setIsStorageReady] = useState(false);
  const pinLock = usePinLock(user);
  const { lockSession, allowPinSetupAfterRegistration } = pinLock;

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      lockSession();
      setUser(nextUser);
      setProfileName(nextUser?.displayName || "");
      setProfileNotice("");
      setUserEmail(nextUser?.email || "");
      setRecoveryError("");
      setRecoverySuccess("");
      setIsStorageReady(false);
      setShowBalance(true);
      setTransactions(initialTransactions);
      setSimulationHistory(null);
      setCurrentScreen(nextUser ? "HOME" : "LOGIN");
      setLoading(false);
    }, () => {
      setUser(null);
      setLoading(false);
      setCurrentScreen("LOGIN");
    });
  }, [lockSession]);

  // El PIN anterior era una demostración local, no una credencial de Firebase.
  useEffect(() => { removeStoredValue(storageKeys.userPin); }, []);

  useEffect(() => {
    let active = true;
    if (!user?.uid) return;
    const hydrateStoredSession = async () => {
      const [storedShowBalance, storedTransactions, storedSimulations] =
        await Promise.all([
          getStoredJson(`${storageKeys.showBalance}/${user.uid}`, null),
          getStoredJson(`${storageKeys.transactions}/${user.uid}`, null),
          loadSimulatedPayments(user.uid).catch(() => []),
        ]);
      if (!active) return;

      if (typeof storedShowBalance === "boolean") {
        setShowBalance(storedShowBalance);
      }

      if (Array.isArray(storedTransactions)) {
        setTransactions(storedTransactions);
      }
      setSimulationHistory({ uid: user.uid, payments: storedSimulations });

      setIsStorageReady(true);
    };

    hydrateStoredSession();
    return () => { active = false; };
  }, [user?.uid]);

  useEffect(() => {
    if (isStorageReady && user) {
      setStoredJson(`${storageKeys.showBalance}/${user.uid}`, showBalance);
    }
  }, [isStorageReady, showBalance, user?.uid]);

  useEffect(() => {
    if (isStorageReady && user) {
      setStoredJson(`${storageKeys.transactions}/${user.uid}`, baseTransactions);
    }
  }, [isStorageReady, baseTransactions, user?.uid]);

  const confirmQrPayment = useCallback(async (operationId, payment) => {
    const uid = user?.uid;
    if (!uid || auth.currentUser?.uid !== uid || pinLock.pinState.status !== "unlocked" ||
        pinLock.pinState.uid !== uid || !pinLock.isAppActive || payment.uid !== uid || !payment.simulation) {
      throw new Error("Desbloquea la sesión y vuelve a escanear el QR.");
    }

    const { receipt, payments, created } = await saveSimulatedPayment(uid, operationId, payment);
    if (auth.currentUser?.uid === uid) {
      setSimulationHistory({ uid, payments });
      if (created) sendActivityNotification(uid, movementActivity(receipt)).catch(() => {});
    }
    return receipt;
  }, [pinLock, user?.uid]);

  const login = useCallback(async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) { throw new Error(authErrorMessage(error)); }
  }, []);

  const register = useCallback(async (name, email, password) => {
    let result;
    try {
      result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      allowPinSetupAfterRegistration(result.user.uid);
    } catch (error) { throw new Error(authErrorMessage(error)); }
    try {
      await updateProfile(result.user, { displayName: name.trim() });
      if (auth.currentUser?.uid === result.user.uid) setProfileName(name.trim());
    } catch (error) {
      if (auth.currentUser?.uid === result.user.uid) {
        setProfileNotice("Tu cuenta se creó, pero no pudimos guardar tu nombre. Por ahora mostraremos tu correo.");
      }
    }
  }, [allowPinSetupAfterRegistration]);

  const logout = useCallback(async () => {
    lockSession();
    try {
      await signOut(auth);
      setUser(null);
      setProfileName("");
      setProfileNotice("");
      setUserEmail("");
      setShowBalance(true);
      setTransactions(initialTransactions);
      setSimulationHistory(null);
      setIsStorageReady(false);
      setCurrentScreen("LOGIN");
    } catch (error) { throw new Error(authErrorMessage(error)); }
  }, [lockSession]);

  const requestPasswordReset = useCallback(async (email) => {
    setRecoveryError("");
    setRecoverySuccess("");
    try {
      setUserEmail(email);
      await sendPasswordResetEmail(auth, email);
      setRecoverySuccess("Correo enviado con exito por Firebase");
      return { success: true, firebaseSent: true };
    } catch (error) {
      const message = authErrorMessage(error);
      setRecoveryError(message);
      return { success: false, firebaseSent: false, errorMsg: message };
    }
  }, []);

  // El OTP por correo queda pendiente; no aceptar códigos ficticios.
  const verifyOtp = useCallback(() => false, []);

  const toggleBalanceVisibility = useCallback(() => {
    setShowBalance((prev) => !prev);
  }, []);

  const contextValue = useMemo(
    () => ({
      currentScreen,
      user, loading, login, register, logout, profileNotice,
      resetPassword: requestPasswordReset,
      setCurrentScreen,
      ...pinLock,
      userEmail,
      setUserEmail,
      showBalance,
      toggleBalanceVisibility,
      userName,
      balance,
      transactions,
      setTransactions,
      confirmQrPayment,
      requestPasswordReset,
      verifyOtp,
      recoveryError,
      recoverySuccess,
      isStorageReady,
    }),
    [
      currentScreen,
      user, loading, login, register, logout, profileNotice,
      pinLock,
      userEmail,
      showBalance,
      toggleBalanceVisibility,
      userName,
      balance,
      transactions,
      confirmQrPayment,
      requestPasswordReset,
      verifyOtp,
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

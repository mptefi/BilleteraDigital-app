import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "../config/firebase";
import { authErrorMessage } from "../services/authErrors";
import { MAX_PIN_ATTEMPTS, readPinRecord, savePin, verifyPin } from "../services/pinVault";

export default function usePinLock(user) {
  const uid = user?.uid;
  const uidRef = useRef(uid);
  uidRef.current = uid;
  const epoch = useRef(0);
  const operation = useRef(false);
  const authorization = useRef(null);
  const readSequence = useRef(0);
  const mounted = useRef(true);
  const [isAppActive, setAppActive] = useState(AppState.currentState !== "background" && AppState.currentState !== "inactive");
  const [pinState, setPinState] = useState({ uid: null, status: "loading", hasPin: false, remainingAttempts: MAX_PIN_ATTEMPTS });
  const stateRef = useRef(pinState);
  stateRef.current = pinState;
  const validSession = useCallback((id, version) => mounted.current && id === uidRef.current && version === epoch.current && auth.currentUser?.uid === id && AppState.currentState === "active", []);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const lockSession = useCallback(() => {
    epoch.current += 1;
    authorization.current = null;
    setPinState((previous) => ({ ...previous, status: previous.status === "error" ? "error" : previous.hasPin ? (previous.remainingAttempts === 0 ? "blocked" : "locked") : "missing" }));
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      setAppActive(next === "active");
      if (next !== "active") lockSession();
    });
    return () => subscription.remove();
  }, [lockSession]);

  const reloadPin = useCallback(async () => {
    const id = uidRef.current;
    if (!id) return;
    const sequence = ++readSequence.current;
    setPinState({ uid: id, status: "loading", hasPin: false, remainingAttempts: MAX_PIN_ATTEMPTS });
    try {
      const record = await readPinRecord(id);
      if (!mounted.current || uidRef.current !== id || sequence !== readSequence.current) return;
      const authorized = authorization.current?.uid === id && authorization.current?.epoch === epoch.current;
      setPinState({ uid: id, hasPin: Boolean(record), remainingAttempts: MAX_PIN_ATTEMPTS - (record?.failedAttempts || 0),
        status: record ? (record.failedAttempts >= MAX_PIN_ATTEMPTS ? "blocked" : "locked") : authorized ? "setup" : "missing" });
    } catch {
      if (mounted.current && uidRef.current === id && sequence === readSequence.current) setPinState({ uid: id, status: "error", hasPin: false, remainingAttempts: 0 });
    }
  }, []);

  useEffect(() => {
    if (!uid) {
      authorization.current = null;
      epoch.current += 1;
      setPinState({ uid: null, status: "loading", hasPin: false, remainingAttempts: MAX_PIN_ATTEMPTS });
      return;
    }
    reloadPin();
    return () => { readSequence.current += 1; };
  }, [uid, reloadPin]);

  // Solo un acceso reciente al servidor puede autorizar la creación inicial del PIN.
  const allowPinSetupAfterLogin = useCallback((id) => {
    if (auth.currentUser?.uid !== id || AppState.currentState === "background" || AppState.currentState === "inactive") return;
    authorization.current = { uid: id, epoch: epoch.current };
    setPinState((previous) => previous.uid === id && previous.status === "missing" ? { ...previous, status: "setup" } : previous);
  }, []);

  useEffect(() => {
    if (pinState.status !== "initializing") return;
    const id = pinState.uid;
    const version = epoch.current;
    const timer = setTimeout(() => {
      if (!validSession(id, version)) return;
      setPinState((previous) => previous.uid === id && previous.status === "initializing"
        ? { ...previous, status: "locked" } : previous);
    }, 1500);
    return () => clearTimeout(timer);
  }, [pinState.status, pinState.uid, validSession]);

  const unlockWithPin = useCallback(async (pin) => {
    const id = uidRef.current;
    const version = epoch.current;
    if (!id || operation.current || stateRef.current.uid !== id || !["locked", "blocked"].includes(stateRef.current.status)) {
      throw new Error("Espera un momento e intenta nuevamente.");
    }
    operation.current = true;
    try {
      const result = await verifyPin(id, pin);
      if (!validSession(id, version)) return { success: false, interrupted: true };
      setPinState({ uid: id, hasPin: true, remainingAttempts: result.remainingAttempts,
        status: result.success ? "unlocked" : result.remainingAttempts === 0 ? "blocked" : "locked" });
      return result;
    } catch (error) {
      if (validSession(id, version)) setPinState((previous) => ({ ...previous, status: "error" }));
      throw new Error("No pudimos verificar tu PIN. Reintenta o verifica tu contraseña.");
    } finally { operation.current = false; }
  }, [validSession]);

  const authorizePinReset = useCallback(async (password) => {
    const id = uidRef.current;
    const version = epoch.current;
    const currentUser = auth.currentUser;
    if (!password || !currentUser || currentUser.uid !== id) throw new Error("Ingresa la contraseña de tu cuenta.");
    try {
      await reauthenticateWithCredential(currentUser, EmailAuthProvider.credential(currentUser.email, password));
    } catch (error) { throw new Error(authErrorMessage(error)); }
    if (!validSession(id, version)) throw new Error("La app se bloqueó. Verifica nuevamente tu contraseña.");
    authorization.current = { uid: id, epoch: version };
    setPinState((previous) => ({ ...previous, uid: id, status: "setup" }));
  }, [validSession]);

  const setupPin = useCallback(async (pin) => {
    const id = uidRef.current;
    const version = epoch.current;
    if (!id || operation.current || stateRef.current.status !== "setup" ||
        authorization.current?.uid !== id || authorization.current?.epoch !== version) {
      throw new Error("Verifica tu contraseña antes de crear un PIN.");
    }
    operation.current = true;
    try {
      await savePin(id, pin);
      if (!mounted.current || uidRef.current !== id) return;
      const canInitialize = validSession(id, version);
      authorization.current = null;
      setPinState({ uid: id, hasPin: true, remainingAttempts: MAX_PIN_ATTEMPTS, status: canInitialize ? "initializing" : "locked" });
    } finally { operation.current = false; }
  }, [validSession]);

  return useMemo(() => ({ pinState, isAppActive, lockSession, reloadPin, allowPinSetupAfterLogin, unlockWithPin, authorizePinReset, setupPin }),
    [pinState, isAppActive, lockSession, reloadPin, allowPinSetupAfterLogin, unlockWithPin, authorizePinReset, setupPin]);
}

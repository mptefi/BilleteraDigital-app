import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { Accelerometer } from "expo-sensors";
import { getStoredJson, setStoredJson, storageKeys } from "../services/storage";

const threshold = 1.8;
const cooldownMs = 1600;

export default function useShakeHistory(uid, inHome, openHistory) {
  const key = `${storageKeys.shakeHistory}/${uid}`;
  const [enabled, setEnabled] = useState(false);
  const [available, setAvailable] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState("");
  const saving = useRef(false);
  const lastShake = useRef(-Infinity);

  useEffect(() => {
    let live = true;
    getStoredJson(key, false).then((value) => {
      if (live) {
        setEnabled(value === true);
        setLoaded(true);
      }
    });
    Accelerometer.isAvailableAsync().then((result) => {
      if (live) setAvailable(result);
    }).catch(() => {
      if (live) setAvailable(false);
    });
    return () => { live = false; };
  }, [key]);

  useEffect(() => {
    if (!inHome || !available || !enabled || AppState.currentState !== "active") return;
    let active = true;
    Accelerometer.setUpdateInterval(100);
    const sensor = Accelerometer.addListener(({ x, y, z }) => {
      if (!active || AppState.currentState !== "active") return;
      const now = Date.now();
      if (Math.hypot(x, y, z) >= threshold && now - lastShake.current >= cooldownMs) {
        lastShake.current = now;
        openHistory();
      }
    });
    const stopSensor = () => {
      if (!active) return;
      active = false;
      sensor.remove();
    };
    const appState = AppState.addEventListener("change", (state) => {
      if (state !== "active") stopSensor();
    });
    return () => {
      stopSensor();
      appState.remove();
    };
  }, [available, enabled, inHome, openHistory]);

  const change = useCallback(async (value) => {
    if (saving.current) return;
    saving.current = true;
    setNotice("");
    if (await setStoredJson(key, value)) setEnabled(value);
    else setNotice("No pudimos guardar el ajuste del acelerómetro.");
    saving.current = false;
  }, [key]);

  return { enabled, available, loaded, change, notice };
}

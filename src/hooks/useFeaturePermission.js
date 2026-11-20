import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function useFeaturePermission(read, request) {
  const { rememberPermissionScreen, runNativePermission } = useAuth();
  const [permission, setPermission] = useState(null);
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const revision = useRef(0);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      if (pending.current) return;
      const version = ++revision.current;
      try {
        const result = await read();
        if (active && version === revision.current) {
          setPermission(result);
          if (result.granted) setAttempted(false);
          setError("");
        }
      } catch {
        if (active && version === revision.current) {
          setPermission(null);
          setError("No pudimos consultar el permiso.");
        }
      }
    };
    refresh();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, [read]);

  const allow = useCallback(async () => {
    if (pending.current) return;
    pending.current = true;
    revision.current++;
    setBusy(true);
    setError("");
    try {
      const current = await read();
      setPermission(current);
      if (current.granted) {
        setAttempted(false);
        return true;
      }
      await rememberPermissionScreen();
      const result = await runNativePermission(request);
      const latest = await read().catch(() => result);
      setPermission(latest);
      const alreadyBlocked = current.canAskAgain === false && latest.canAskAgain === false;
      setAttempted(!latest.granted && !alreadyBlocked);
      return latest.granted;
    } catch {
      setError("No pudimos solicitar el permiso.");
      return false;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }, [read, rememberPermissionScreen, request, runNativePermission]);

  const denied = attempted && !busy && !error && permission?.granted === false;
  return { permission, busy, allow, error, denied };
}

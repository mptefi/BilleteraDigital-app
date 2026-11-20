import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Linking } from "react-native";

export default function useFeaturePermission(read, request) {
  const [permission, setPermission] = useState(null);
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
          setError("");
        }
      } catch {
        if (active && version === revision.current) setError("No pudimos consultar el permiso.");
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
      if (permission?.canAskAgain === false) {
        await Linking.openSettings();
      } else {
        setPermission(await request());
      }
    } catch {
      setError("No pudimos abrir la solicitud de permiso o los Ajustes.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }, [permission, request]);

  return { permission, busy, allow, error };
}

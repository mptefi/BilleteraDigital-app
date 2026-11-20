import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import FeatureScreen, { FeatureButton, FeatureStatus, featureStyles } from "../components/FeatureScreen";
import FeaturePermission from "../components/FeaturePermission";
import NotificationInbox from "../components/NotificationInbox";
import { useAuth } from "../context/AuthContext";
import useFeaturePermission from "../hooks/useFeaturePermission";
import { COLORS } from "../theme/colors";
import { demoPromoActivity } from "../services/notificationActivity";
import { getStoredJson, setStoredJson, storageKeys } from "../services/storage";
import {
  cancelReminder, findReminder, getDemoPushToken, readNotificationPreference, readReminderPermission,
  remindersSupported, requestReminderPermission, scheduleReminder, sendActivityNotification, setNotificationPreference,
} from "../services/reminders";

export default function RemindersScreen({ uid, onBack, onOpenHistory }) {
  return (
    <FeatureScreen title="Notificaciones" onBack={onBack}>
      {remindersSupported
        ? <NotificationCenter uid={uid} onOpenHistory={onOpenHistory} />
        : <Text style={featureStyles.body}>Los recordatorios están disponibles en Android y iOS.</Text>}
    </FeatureScreen>
  );
}

function NotificationCenter({ uid, onOpenHistory }) {
  const { transactions } = useAuth();
  const access = useFeaturePermission(readReminderPermission, requestReminderPermission);
  const [toolsVisible, setToolsVisible] = useState(false);
  const [enabled, setEnabled] = useState(null);
  const [preferenceBusy, setPreferenceBusy] = useState(false);
  const [preferenceError, setPreferenceError] = useState("");
  const granted = access.permission?.granted;
  const blocked = granted === false && access.permission.canAskAgain === false;
  const promoReceivedAt = useDemoPromo(uid, granted && enabled);

  useEffect(() => {
    let mounted = true;
    readNotificationPreference(uid).then((saved) => {
      if (mounted) setEnabled(saved);
    });
    return () => { mounted = false; };
  }, [uid]);

  const changePreference = async (next) => {
    setPreferenceBusy(true);
    setPreferenceError("");
    try {
      if (next && !(await access.allow())) return;
      if (!(await setNotificationPreference(uid, next))) throw new Error();
      setEnabled(next);
      if (!next) setToolsVisible(false);
    } catch {
      setPreferenceError(next ? "No pudimos activar tus avisos." : "No pudimos desactivar tus avisos.");
    } finally {
      setPreferenceBusy(false);
    }
  };

  if (enabled === null || (!access.permission && !access.error)) {
    return <FeatureStatus title="Preparando tus avisos" loadingLabel="Consultando el permiso de notificaciones" />;
  }

  if (!granted || !enabled) {
    const feedback = access.error || preferenceError || (blocked && "El sistema ya no permite volver a solicitar este permiso.");
    return (
      <>
        <FeaturePermission
          value={{ busy: access.busy || preferenceBusy, allow: () => changePreference(true) }}
          icon="bell"
          title="Recibe tus avisos"
          reason="Entérate de los pagos, transferencias, promos y alertas de seguridad."
          buttonLabel="Permitir notificaciones"
          dialogTitle="Permite las notificaciones"
        />
        {!!feedback && <Text accessibilityLiveRegion="polite" style={styles.permissionNote}>{feedback}</Text>}
      </>
    );
  }

  return (
    <>
      <NotificationInbox uid={uid} transactions={transactions} promoReceivedAt={promoReceivedAt} onOpenHistory={onOpenHistory} />
      <View style={styles.tools}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: toolsVisible }}
          onPress={() => setToolsVisible((previous) => !previous)}
          style={styles.toolsToggle}
        >
          <View style={styles.toolIcon}><Feather name="clock" size={20} color="#854000" /></View>
          <Text style={styles.toolsTitle}>Recordatorios y pruebas</Text>
          <Feather name={toolsVisible ? "chevron-up" : "chevron-down"} size={18} color={COLORS.textSecondary} />
        </Pressable>
        {toolsVisible && <ReminderControls uid={uid} />}
        {toolsVisible && (
          <FeatureButton secondary label="Desactivar avisos de Al Toque" disabled={preferenceBusy} onPress={() => changePreference(false)} />
        )}
        {!!preferenceError && <FeatureStatus icon="alert-circle" tone="error" message={preferenceError} />}
      </View>
    </>
  );
}

function useDemoPromo(uid, ready) {
  const [receivedAt, setReceivedAt] = useState(null);
  const key = `${storageKeys.offers}/${uid}/bembos`;

  useEffect(() => {
    if (!ready) return;
    let mounted = true;
    let timer;
    getStoredJson(key).then((saved) => {
      if (!mounted) return;
      if (typeof saved === "number" && Number.isFinite(saved) && saved > 0) {
        setReceivedAt(saved);
      } else {
        timer = setTimeout(async () => {
          const now = Date.now();
          if (!(await setStoredJson(key, now)) || !mounted) return;
          setReceivedAt(now);
          sendActivityNotification(uid, demoPromoActivity(now)).catch(() => {});
        }, 3500);
      }
    });
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [key, ready, uid]);

  return receivedAt;
}

function ReminderControls({ uid }) {
  const [identifier, setIdentifier] = useState(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const operation = useRef(false);
  const generation = useRef(0);

  const refresh = useCallback(async () => {
    const version = ++generation.current;
    try {
      const result = await findReminder(uid);
      if (generation.current === version) setIdentifier(result);
    } catch {
      if (generation.current === version) setNotice("No pudimos consultar el recordatorio.");
    } finally {
      if (generation.current === version) setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    refresh();
    const received = Notifications.addNotificationReceivedListener((notification) => {
      const { data } = notification.request.content;
      if (data.uid === uid && data.route === "movements") {
        setNotice("Recibiste el aviso «Revisa tus movimientos».");
        if (!operation.current) refresh();
      }
    });
    const state = AppState.addEventListener("change", (next) => {
      if (next === "active" && !operation.current) refresh();
    });
    return () => {
      generation.current++;
      received.remove();
      state.remove();
    };
  }, [refresh, uid]);

  const run = async (action, success) => {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setNotice("");
    try {
      await action();
      setNotice(success);
    } catch (error) {
      setNotice(error.message || "No pudimos completar la operación.");
    } finally {
      operation.current = false;
      setBusy(false);
      refresh();
    }
  };

  return (
    <>
      <Text style={featureStyles.label}>Revisa tus movimientos</Text>
      <Text style={featureStyles.body}>Al tocar el recordatorio abrirás el historial después de desbloquear la app.</Text>
      {!!notice && <Text accessibilityLiveRegion="polite" style={featureStyles.feedback}>{notice}</Text>}
      {loading ? <ActivityIndicator accessibilityLabel="Consultando recordatorios" /> : (
        <>
          <FeatureButton label="Programar para dentro de 24 horas" disabled={busy} onPress={() => run(() => scheduleReminder(uid, 86400), "Recordatorio programado para dentro de 24 horas.")} />
          <FeatureButton secondary label="Probar en 5 segundos" disabled={busy} onPress={() => run(() => scheduleReminder(uid, 5), "Aviso de prueba programado para dentro de 5 segundos.")} />
          {!!identifier && (
            <>
              <Text style={featureStyles.body}>Hay un recordatorio programado.</Text>
              <FeatureButton secondary label="Cancelar recordatorio" disabled={busy} onPress={() => run(() => cancelReminder(uid), "Recordatorio cancelado.")} />
            </>
          )}
          <Text style={featureStyles.label}>Prueba push</Text>
          <FeatureButton secondary label="Obtener Expo Push Token" disabled={busy} onPress={() => run(async () => setToken(await getDemoPushToken()), "Expo Push Token obtenido.")} />
          {!!token && <Text selectable style={featureStyles.body}>{token}{"\n"}UID de prueba: {uid}</Text>}
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  permissionNote: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20 },
  toolIcon: {
    width: 40, height: 40, borderRadius: 14, backgroundColor: "#FFF0DF",
    alignItems: "center", justifyContent: "center",
  },
  tools: {
    backgroundColor: COLORS.white, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border,
    padding: 14, gap: 12,
  },
  toolsToggle: { flexDirection: "row", alignItems: "center", minHeight: 44, gap: 10 },
  toolsTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
});

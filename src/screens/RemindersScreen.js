import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import FeatureScreen, { FeatureButton, FeatureStatus, featureStyles } from "../components/FeatureScreen";
import NotificationInbox from "../components/NotificationInbox";
import AppModal from "../components/AppModal";
import { useAuth } from "../context/AuthContext";
import useFeaturePermission from "../hooks/useFeaturePermission";
import { COLORS } from "../theme/colors";
import {
  cancelReminder, findReminder, getDemoPushToken, readReminderPermission, remindersSupported,
  requestReminderPermission, scheduleReminder,
} from "../services/reminders";

const promptedAccounts = new Set();

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
  const [permissionModal, setPermissionModal] = useState(false);
  const [toolsVisible, setToolsVisible] = useState(false);
  const granted = access.permission?.granted;
  const needsSettings = access.permission?.canAskAgain === false;

  useEffect(() => {
    if (!access.permission || granted || promptedAccounts.has(uid)) return;
    promptedAccounts.add(uid);
    setPermissionModal(true);
  }, [access.permission, granted, uid]);

  if (!access.permission && !access.error) {
    return <FeatureStatus title="Preparando tus avisos" loadingLabel="Consultando el permiso de notificaciones" />;
  }

  if (!granted) {
    return (
      <View style={featureStyles.card}>
        <FeatureStatus icon="bell" title="Recibe tus avisos" message="Entérate de los pagos, transferencias, promos y alertas de seguridad." />
        {!!access.error && <FeatureStatus icon="alert-circle" tone="error" message={access.error} />}
        <FeatureButton icon="bell" label="Activar notificaciones" onPress={() => setPermissionModal(true)} disabled={access.busy} />
        <AppModal
          visible={permissionModal}
          icon="bell"
          title="Activa tus notificaciones"
          message={needsSettings
            ? "En Ajustes puedes activar los avisos de Al Toque."
            : "Recibe un aviso cuando haya novedades en tu cuenta."}
          primaryLabel={needsSettings ? "Abrir Ajustes" : "Permitir"}
          secondaryLabel="Ahora no"
          onPrimary={async () => {
            await access.allow();
            setPermissionModal(false);
          }}
          onSecondary={() => setPermissionModal(false)}
          onClose={() => setPermissionModal(false)}
        />
      </View>
    );
  }

  return (
    <>
      <NotificationInbox uid={uid} transactions={transactions} onOpenHistory={onOpenHistory} />
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
      </View>
    </>
  );
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

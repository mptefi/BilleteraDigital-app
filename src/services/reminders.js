import { PermissionsAndroid, Platform } from "react-native";
import { isRunningInExpoGo } from "expo";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { isDevice } from "expo-device";
import { getStoredJson, setStoredJson, storageKeys, removeStoredValue } from "./storage";
import { activityCategories } from "./notificationActivity";

export const remindersSupported = Platform.OS === "android" || Platform.OS === "ios";
export const movementChannel = "movements";
const isExpoGo = isRunningInExpoGo();
const usesCustomAndroidChannels = Platform.OS === "android" && !isExpoGo;
const usesAndroidRuntimePermission = isExpoGo && Platform.OS === "android" && Platform.Version >= 33;
const reminderKey = (uid) => `${storageKeys.movementReminder}/${uid}`;
const notificationPreferenceKey = (uid) => `${storageKeys.notificationPreference}/${uid}`;
let reminderWork = Promise.resolve();

function updateReminder(action) {
  const work = reminderWork.then(action);
  reminderWork = work.catch(() => {});
  return work;
}

if (remindersSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false,
    }),
  });
}

async function prepareChannel() {
  if (usesCustomAndroidChannels) {
    await Notifications.setNotificationChannelAsync(movementChannel, {
      name: "Recordatorios de movimientos",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

function normalizeReminderPermission(permission) {
  return {
    ...permission,
    granted: permission.granted || (Platform.OS === "ios" &&
      permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL),
  };
}

export async function readReminderPermission() {
  if (usesAndroidRuntimePermission) {
    // Android can report whether Expo Go has permission without consulting Expo's saved request history.
    const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    return { granted, status: granted ? "granted" : "undetermined" };
  }
  return normalizeReminderPermission(await Notifications.getPermissionsAsync());
}

export async function requestReminderPermission() {
  console.log("[NOTIFICACIONES] Iniciando solicitud", {
    isExpoGo,
    platform: Platform.OS,
    version: Platform.Version,
  });

  const existing = await readReminderPermission();

  if (existing.granted) {
    console.log("[NOTIFICACIONES] Ya autorizado");
    return existing;
  }

  if (Platform.OS === "android" && !isExpoGo) {
    await prepareChannel();
  }

  console.log("[NOTIFICACIONES] Solicitando mediante Expo...");

  try {
    const result = await Notifications.requestPermissionsAsync();

    console.log("[NOTIFICACIONES] Resultado Expo:", result);

    const latest = await readReminderPermission();

    return {
      ...result,
      granted: latest.granted || result.granted,
      status:
        latest.granted || result.granted
          ? "granted"
          : "denied",
      canAskAgain: result.canAskAgain,
    };
  } catch (error) {
    console.error("[NOTIFICACIONES] Error:", error);
    throw error;
  }
}

export async function readNotificationPreference(uid) {
  return (await getStoredJson(notificationPreferenceKey(uid), false)) === true;
}

export async function setNotificationPreference(uid, enabled) {
  if (!enabled) await cancelReminder(uid);
  return setStoredJson(notificationPreferenceKey(uid), enabled);
}

export async function sendActivityNotification(uid, activity) {
  if (!remindersSupported || !(await readNotificationPreference(uid)) || !(await readReminderPermission()).granted) return false;
  const channel = `altoque-${activity.category}`;
  const isMovement = !activity.example && ["payment", "transfer"].includes(activity.category);
  if (usesCustomAndroidChannels) {
    await Notifications.setNotificationChannelAsync(channel, {
      name: activityCategories[activity.category].label,
      importance: activity.category === "promo" ? Notifications.AndroidImportance.DEFAULT : Notifications.AndroidImportance.HIGH,
    });
  }
  const body = activity.category === "promo" ? activity.message : isMovement
    ? "Consulta el detalle de tu operación por QR en Al Toque."
    : "Abre Al Toque para ver los detalles.";
  await Notifications.scheduleNotificationAsync({
    content: {
      title: activity.category === "promo"
        ? activity.title
        : activity.example ? `Prueba · ${activity.title}` : `${activity.title} · Simulado`,
      body,
      data: {
        uid,
        route: isMovement ? "movements" : "notifications",
      },
    },
    trigger: usesCustomAndroidChannels ? { channelId: channel } : null,
  });
  return true;
}

export async function findReminder(uid) {
  await reminderWork;
  const identifier = await getStoredJson(reminderKey(uid));
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.find((request) => request.identifier === identifier)?.identifier ?? null;
}

async function removeReminder(uid) {
  const identifier = await getStoredJson(reminderKey(uid));
  if (typeof identifier === "string") await Notifications.cancelScheduledNotificationAsync(identifier);
  if (!(await removeStoredValue(reminderKey(uid)))) throw new Error("No se pudo actualizar el recordatorio guardado.");
}

export function cancelReminder(uid) {
  return updateReminder(() => removeReminder(uid));
}

export function scheduleReminder(uid, seconds) {
  return updateReminder(() => replaceReminder(uid, seconds));
}

async function replaceReminder(uid, seconds) {
  await prepareChannel();
  await removeReminder(uid);
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Revisa tus movimientos",
      body: "Toca para abrir el historial de Al Toque.",
      data: { route: "movements", uid },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      ...(usesCustomAndroidChannels && { channelId: movementChannel }),
    },
  });
  if (!(await setStoredJson(reminderKey(uid), identifier))) {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    throw new Error("No pudimos guardar el recordatorio.");
  }
  return identifier;
}

export async function getDemoPushToken() {
  if (isExpoGo) {
    throw new Error("Abre el development build de Al Toque para obtener un token push.");
  }
  const projectId = Constants.easConfig?.projectId || Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) throw new Error("Falta vincular el proyecto EAS y configurar su projectId.");
  await prepareChannel();
  try {
    return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch {
    const environment = isDevice ? "" : " Comprueba también que el emulador sea compatible con push.";
    throw new Error(`No pudimos obtener el token push. Comprueba la conexión y la configuración de FCM o APNs del build.${environment}`);
  }
}

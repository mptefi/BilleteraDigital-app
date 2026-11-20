import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { isDevice } from "expo-device";
import { getStoredJson, setStoredJson, storageKeys, removeStoredValue } from "./storage";
import { activityCategories } from "./notificationActivity";

export const remindersSupported = Platform.OS === "android" || Platform.OS === "ios";
export const movementChannel = "movements";
const reminderKey = (uid) => `${storageKeys.movementReminder}/${uid}`;
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
  if (Platform.OS === "android") {
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
  return normalizeReminderPermission(await Notifications.getPermissionsAsync());
}

export async function requestReminderPermission() {
  await prepareChannel();
  const existing = await readReminderPermission();
  if (existing.granted || existing.canAskAgain === false) return existing;

  const permission = await Notifications.requestPermissionsAsync({
    android: {},
    ios: { allowAlert: true, allowSound: true, allowBadge: true },
  });
  return normalizeReminderPermission(permission);
}

export async function sendActivityNotification(uid, activity) {
  if (!remindersSupported || !(await readReminderPermission()).granted) return false;
  const channel = `altoque-${activity.category}`;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(channel, {
      name: activityCategories[activity.category].label,
      importance: activity.category === "promo" ? Notifications.AndroidImportance.DEFAULT : Notifications.AndroidImportance.HIGH,
    });
  }
  await Notifications.scheduleNotificationAsync({
    content: {
      title: activity.example ? `Prueba · ${activity.title}` : `${activity.title} · Simulado`,
      body: "Abre Al Toque para ver los detalles.",
      data: {
        uid,
        route: !activity.example && ["payment", "transfer"].includes(activity.category) ? "movements" : "notifications",
      },
    },
    trigger: Platform.OS === "android" ? { channelId: channel } : null,
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
      channelId: movementChannel,
    },
  });
  if (!(await setStoredJson(reminderKey(uid), identifier))) {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    throw new Error("No pudimos guardar el recordatorio.");
  }
  return identifier;
}

export async function getDemoPushToken() {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
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

const { test } = require("node:test");
const assert = require("node:assert/strict");
const React = require("react");
const { act, create } = require("react-test-renderer");
const load = require("./load-module.cjs");
const { parseDemoQr } = require("../functions/qr");
const { qrHandler } = require("../functions/qrHandler");

global.IS_REACT_ACT_ENVIRONMENT = true;

const valid = { type: "altoque.demo", v: 1, recipient: "Cafetería Demo", amountCents: 1250, currency: "PEN" };

test("QR valida formato, límites de monto, moneda y destinatario", () => {
  assert.deepEqual(parseDemoQr(JSON.stringify(valid)), {
    recipient: "Cafetería Demo", amountCents: 1250, currency: "PEN",
  });
  assert.equal(parseDemoQr(JSON.stringify({ ...valid, direction: "credit" })).direction, "credit");
  for (const extra of [
    { v: 2 }, { type: "other" }, { amountCents: -1 }, { amountCents: 0 }, { amountCents: 100001 },
    { amountCents: 1.2 }, { amountCents: "5" }, { currency: "EUR" }, { recipient: "   " },
    { direction: "other" }, { direction: null },
  ]) {
    assert.equal(parseDemoQr(JSON.stringify({ ...valid, ...extra })), null);
  }
  assert.equal(parseDemoQr("https://example.test"), null);
  assert.equal(parseDemoQr("x".repeat(513)), null);
});

test("QR REST rechaza rutas y métodos ajenos y devuelve un 500 genérico ante errores internos", async () => {
  let reported;
  const verify = async () => { throw Object.assign(new Error("internal details"), { code: "auth/internal-error" }); };
  const response = {
    code: 200,
    set() { return this; },
    status(code) { this.code = code; return this; },
    json(body) { return [this.code, body]; },
  };
  const req = { path: "/qr/validate", method: "POST", get: () => "Bearer testing" };
  assert.deepEqual(await qrHandler({ ...req, path: "/" }, response, verify), [404, { code: "not_found" }]);
  assert.deepEqual(await qrHandler({ ...req, method: "GET" }, response, verify), [405, { code: "method_not_allowed" }]);
  assert.deepEqual(await qrHandler(req, response, verify, (message, data) => { reported = data; }), [500, { code: "server_error" }]);
  assert.deepEqual(reported, { code: "auth/internal-error" });
});

test("cliente REST adjunta el token de Firebase y traduce fallos de la API", async () => {
  let failure;
  let request;
  let payment = { uid: "A", simulation: true, ...parseDemoQr(JSON.stringify(valid)) };
  const env = { EXPO_PUBLIC_ALTOQUE_API_URL: "http://localhost:5001/api/" };
  const auth = { currentUser: { uid: "A", getIdToken: async () => "id-token" } };
  const api = load("src/services/qrApi.js", {
    "../../functions/qr": { parseDemoQr },
    "../config/firebase": { auth },
    "expo/internal/bundle-origin": { getBundleOrigin: () => "https://expo-tunnel.example.test" },
    axios: {
      isAxiosError: (error) => error === failure,
      post: async (...args) => {
        request = args;
        if (failure) throw failure;
        return { data: payment };
      },
    },
  }, { process: { env }, __DEV__: true });
  const raw = JSON.stringify(valid);
  await api.validateQrWithSession(raw);
  assert.equal(request[0], "http://localhost:5001/api/qr/validate");
  assert.equal(request[1].qr, raw);
  assert.equal(request[2].headers.Authorization, "Bearer id-token");

  env.EXPO_PUBLIC_ALTOQUE_API_URL = "http://localhost:5001/api/qr/validate/";
  await api.validateQrWithSession(raw);
  assert.equal(request[0], "http://localhost:5001/api/qr/validate");
  env.EXPO_PUBLIC_ALTOQUE_API_URL = "";
  env.EXPO_PUBLIC_ALTOQUE_METRO_API = "1";
  await api.validateQrWithSession(raw);
  assert.equal(request[0], "https://expo-tunnel.example.test/altoque-api/qr/validate");
  env.EXPO_PUBLIC_ALTOQUE_API_URL = "http://localhost:5001/api/";
  payment = { ...payment, amountCents: 100 };
  await assert.rejects(api.validateQrWithSession(raw), /no coinciden/);

  for (const [status, message] of [[400, /rechazó/], [401, /sesión/], [404, /ruta/], [500, /API no pudo/], [null, /API local/]]) {
    failure = status ? { response: { status } } : {};
    await assert.rejects(api.validateQrWithSession(raw), message);
  }
  auth.currentUser = null;
  await assert.rejects(api.validateQrWithSession(raw), /Inicia sesión/);
});

test("Android prepara el canal y solicita el permiso de avisos con opciones nativas explícitas", async () => {
  const calls = [];
  let current = { granted: false, canAskAgain: true };
  const { requestReminderPermission } = load("src/services/reminders.js", {
    "react-native": { Platform: { OS: "android" } },
    expo: { isRunningInExpoGo: () => false },
    "expo-constants": {},
    "expo-device": {},
    "./storage": {},
    "./notificationActivity": {},
    "expo-notifications": {
      setNotificationHandler() {},
      AndroidImportance: { HIGH: 4 },
      setNotificationChannelAsync: async (id) => { calls.push(id); },
      getPermissionsAsync: async () => current,
      requestPermissionsAsync: async (options) => {
        assert.ok(options.android);
        calls.push("request");
        current = { granted: true, canAskAgain: true };
        return current;
      },
    },
  });
  assert.equal((await requestReminderPermission()).granted, true);
  assert.deepEqual(calls, ["movements", "request"]);
  assert.equal((await requestReminderPermission()).granted, true);
  assert.deepEqual(calls, ["movements", "request"]);
  current = { granted: false, canAskAgain: false };
  assert.equal((await requestReminderPermission()).canAskAgain, false);
  assert.deepEqual(calls, ["movements", "request"]);
});

test("Expo Go usa el canal predeterminado para activar, enviar y programar avisos", async () => {
  let granted = false;
  const preferences = new Map();
  const requests = [];
  const read = async () => ({ granted, canAskAgain: true });
  const { requestReminderPermission, sendActivityNotification, scheduleReminder, setNotificationPreference } = load("src/services/reminders.js", {
    "react-native": { Platform: { OS: "android" } },
    expo: { isRunningInExpoGo: () => true },
    "expo-constants": {},
    "expo-device": {},
    "./storage": {
      storageKeys: { movementReminder: "reminder", notificationPreference: "notifications" },
      getStoredJson: async (key) => preferences.get(key),
      removeStoredValue: async () => true,
      setStoredJson: async (key, value) => Boolean(preferences.set(key, value)),
    },
    "./notificationActivity": load("src/services/notificationActivity.js"),
    "expo-notifications": {
      setNotificationHandler() {},
      setNotificationChannelAsync: () => assert.fail("Expo Go no puede crear el canal personalizado"),
      getPermissionsAsync: read,
      requestPermissionsAsync: async () => { granted = true; return read(); },
      SchedulableTriggerInputTypes: { TIME_INTERVAL: "timeInterval" },
      scheduleNotificationAsync: async (request) => { requests.push(request); return "avisos"; },
    },
  });
  assert.equal((await requestReminderPermission()).granted, true);
  assert.equal(await sendActivityNotification("A", { category: "payment", title: "Pago" }), false);
  await setNotificationPreference("A", true);
  assert.equal(await sendActivityNotification("A", { category: "payment", title: "Pago" }), true);
  assert.equal(await sendActivityNotification("B", { category: "payment", title: "Pago" }), false);
  assert.equal(requests[0].trigger, null);
  await scheduleReminder("A", 5);
  assert.equal(requests[1].trigger.seconds, 5);
  assert.equal(Object.hasOwn(requests[1].trigger, "channelId"), false);
});

test("Expo Go solicita con Expo Notifications y permite reintentar tras un rechazo anterior", async () => {
  let allowed = false;
  let expoRequests = 0;
  let nextPermission = { granted: false, canAskAgain: false, status: "denied" };
  const intents = [];
  const { readReminderPermission, requestReminderPermission, openNotificationSettings } = load("src/services/reminders.js", {
    "react-native": {
      Platform: { OS: "android", Version: 36 },
      Linking: { sendIntent: async (...args) => { intents.push(args); }, openSettings: async () => assert.fail() },
      PermissionsAndroid: {
        PERMISSIONS: { POST_NOTIFICATIONS: "android.permission.POST_NOTIFICATIONS" },
        check: async () => allowed,
        request: async () => assert.fail("La solicitud debe pasar por expo-notifications"),
      },
    },
    expo: { isRunningInExpoGo: () => true },
    "expo-constants": {},
    "expo-device": {},
    "./storage": {},
    "./notificationActivity": {},
    "expo-notifications": {
      setNotificationHandler() {},
      getPermissionsAsync: async () => ({ granted: false, canAskAgain: false, status: "denied" }),
      requestPermissionsAsync: async () => {
        expoRequests++;
        allowed = nextPermission.granted;
        return nextPermission;
      },
    },
  });
  assert.equal((await readReminderPermission()).canAskAgain, undefined);
  assert.equal(expoRequests, 0);
  assert.equal((await requestReminderPermission()).granted, false);
  assert.equal(expoRequests, 1);
  assert.equal((await readReminderPermission()).canAskAgain, undefined);
  nextPermission = { granted: true, canAskAgain: true, status: "granted" };
  assert.equal((await requestReminderPermission()).granted, true);
  assert.equal((await readReminderPermission()).granted, true);
  assert.equal((await requestReminderPermission()).granted, true);
  assert.equal(expoRequests, 2);
  assert.equal(intents.length, 0);
  await openNotificationSettings();
  assert.equal(intents[0][0], "android.settings.APP_NOTIFICATION_SETTINGS");
  assert.equal(intents[0][1][0].value, "host.exp.exponent");
});

test("pantalla QR rechaza datos inválidos, evita lecturas duplicadas y confirma la simulación", async () => {
  let attempts = 0;
  let resolveValidation;
  let confirmAttempts = 0;
  let resolveConfirmation;
  const { formatPaymentAmount } = load("src/services/simulatedPayments.js", { "./storage": {} });
  const cameraPanel = Object.assign(
    (props) => React.createElement("Camera", props),
    { useCameraAccess: () => ({ permission: { granted: true } }) }
  );
  const featureScreen = Object.assign(({ children }) => React.createElement("Screen", null, children), {
    FeatureButton: (props) => React.createElement("Button", props),
    FeatureStatus: ({ title, message }) => React.createElement("View", null,
      React.createElement("Text", null, title),
      React.createElement("Text", null, message)),
    featureStyles: { card: {} },
  });
  const { default: QrScreen } = load("src/screens/QrScreen.js", {
    "react-native": { Text: "Text", View: "View", StyleSheet: { create: (styles) => styles } },
    "@expo/vector-icons": { Feather: "Icon" },
    "../theme/colors": { COLORS: {} },
    "expo-crypto": { randomUUID: () => "operation-1" },
    "../context/AuthContext": { useAuth: () => ({
      showBalance: true,
      confirmQrPayment: (id) => {
        confirmAttempts++;
        return new Promise((resolve) => {
          resolveConfirmation = () => resolve({ id, title: valid.recipient, amount: "- S/ 12.50", currency: "PEN",
            date: "18/11/26, 10:00", balanceDeltaCents: -1250, balanceAfterCents: 182800 });
        });
      },
    }) },
    "../services/simulatedPayments": { formatPaymentAmount },
    "../components/FeatureScreen": featureScreen,
    "../components/CameraPanel": cameraPanel,
    "../services/qrApi": {
      parseDemoQr,
      validateQrWithSession: () => {
        attempts++;
        return new Promise((resolve) => { resolveValidation = resolve; });
      },
    },
  }, { AbortController });

  let root;
  await act(async () => { root = create(React.createElement(QrScreen, { onBack() {} })); });
  const scan = () => root.root.findByType("Camera").props.onScan;
  const press = (label) => root.root.findAllByType("Button").find((button) => button.props.label === label).props.onPress();
  const visible = (text) => root.root.findAllByType("Text").some((item) => item.children.join("").includes(text));
  await act(async () => scan()({ data: JSON.stringify({ ...valid, amountCents: -1250 }) }));
  assert.ok(visible("QR inválido"));
  assert.equal(attempts, 0);
  await act(async () => press("Volver a escanear"));
  await act(async () => {
    const onScan = scan();
    onScan({ data: JSON.stringify(valid) });
    onScan({ data: JSON.stringify(valid) });
  });
  assert.equal(attempts, 1);
  assert.ok(visible("Validando el QR"));
  await act(async () => resolveValidation({ ...valid, uid: "A", simulation: true }));
  assert.ok(visible("Cafetería Demo"));
  assert.ok(visible("S/ 12.50"));
  assert.ok(visible("PEN"));
  await act(async () => press("Cancelar"));
  assert.equal(confirmAttempts, 0);
  await act(async () => scan()({ data: JSON.stringify(valid) }));
  await act(async () => resolveValidation({ ...valid, uid: "A", simulation: true }));
  await act(async () => {
    press("Confirmar simulación");
    press("Confirmar simulación");
  });
  assert.equal(confirmAttempts, 1);
  await act(async () => resolveConfirmation());
  assert.ok(visible("Simulación completada"));
  assert.ok(visible("SIM-operation-1"));
  assert.ok(visible("18/11/26, 10:00"));
  assert.ok(visible("Saldo simulado"));
  assert.ok(visible("S/ 1828.00"));
  await act(async () => press("Volver a escanear"));
  assert.equal(typeof scan(), "function");
  await act(async () => root.unmount());
});

test("la cámara solicita el permiso desde el modal y permite descartarlo", async () => {
  const { default: Permission } = load("src/components/FeaturePermission.js", {
    "react-native": { View: "View" },
    "./FeatureScreen": { FeatureButton: "Button", FeatureStatus: "Status", featureStyles: {} },
    "./AppModal": (props) => props.visible ? React.createElement("Modal", props) : null,
  });
  let requests = 0;
  const allow = () => { requests++; };
  const screen = (canAskAgain) => React.createElement(Permission, {
    reason: "Lee el QR.",
    value: { permission: { canAskAgain }, allow },
  });
  let root;
  await act(async () => { root = create(screen(true)); });
  const open = () => root.root.findByType("Button").props.onPress();
  const modal = () => root.root.findByType("Modal").props;
  await act(async () => open());
  assert.equal(modal().primaryLabel, "Permitir");
  assert.equal(requests, 0);
  await act(async () => modal().onSecondary());
  assert.equal(root.root.findAllByType("Modal").length, 0);
  assert.equal(requests, 0);
  await act(async () => root.update(screen(false)));
  await act(async () => open());
  assert.equal(root.root.findByType("Button").props.label, "Permitir cámara");
  assert.equal(modal().primaryLabel, "Permitir");
  assert.equal(modal().secondaryLabel, "Ahora no");
  await act(async () => modal().onPrimary());
  assert.equal(requests, 1);
  await act(async () => root.unmount());
});

test("dos pagos simultáneos respetan el saldo; USD conserva el saldo en soles", async () => {
  const saved = new Map();
  const { saveSimulatedPayment, getSimulatedBalanceCents, loadSimulatedPayments } = load("src/services/simulatedPayments.js", {
    "./storage": {
      storageKeys: { simulatedPayments: "payments" },
      getStoredJson: async (key, fallback) => saved.get(key) ?? fallback,
      setStoredJson: async (key, value) => { saved.set(key, value); return true; },
    },
  });
  const payment = { ...valid, amountCents: 100000 };
  const results = await Promise.allSettled([
    saveSimulatedPayment("A", "SIM-1", payment),
    saveSimulatedPayment("A", "SIM-2", payment),
  ]);
  assert.equal(results[0].status, "fulfilled");
  assert.equal(results[1].status, "rejected");
  assert.match(results[1].reason.message, /Saldo simulado insuficiente/);
  await saveSimulatedPayment("A", "SIM-3", { ...valid, currency: "USD" });
  const history = await loadSimulatedPayments("A");
  assert.equal(history.length, 2);
  assert.equal(getSimulatedBalanceCents(history), 84050);
});

test("la bandeja muestra las cuatro categorías y reemplaza ejemplos con movimientos confirmados", () => {
  const { notificationActivity } = load("src/services/notificationActivity.js");
  const examples = notificationActivity([]);
  assert.equal(examples.length, 3);
  assert.ok(examples.every((item) => item.example));
  const activities = notificationActivity([
    { id: "credit", type: "income", simulation: true, title: "María Demo", amount: "+ S/ 12.50", date: "Hoy" },
    { id: "debit", type: "expense", simulation: true, title: "Cafetería Demo", amount: "- S/ 12.50", date: "Hoy" },
    { id: "previous", type: "expense" },
  ], Date.UTC(2026, 10, 20, 14));
  assert.equal(activities.length, 4);
  assert.equal(activities[0].category, "transfer");
  assert.equal(activities[1].category, "payment");
  assert.ok(activities.some((item) => item.category === "promo" && item.example && item.title.includes("Bembos")));
  assert.equal(activities.filter((item) => item.category === "payment" || item.category === "transfer").length, 2);
  assert.ok(activities.some((item) => item.category === "security" && item.example));
});

test("la bandeja y la promo esperan el permiso y el rechazo conserva Notificaciones", async () => {
  const saved = new Map();
  const timers = new Map();
  const sent = [];
  let devicePermission = { granted: false, status: "denied", canAskAgain: true };
  let nextPermission = { granted: false, status: "undetermined" };
  let requests = 0;
  let wentBack = 0;
  let settingsOpened = 0;
  let timerId = 0;
  let onAppStateChange;
  const { readReminderPermission, requestReminderPermission } = load("src/services/reminders.js", {
    "react-native": { Platform: { OS: "android" } },
    expo: { isRunningInExpoGo: () => false },
    "expo-constants": {},
    "expo-device": {},
    "./storage": {},
    "./notificationActivity": {},
    "expo-notifications": {
      setNotificationHandler() {},
      AndroidImportance: { HIGH: 4 },
      setNotificationChannelAsync: async () => {},
      getPermissionsAsync: async () => devicePermission,
      requestPermissionsAsync: async () => {
        requests++;
        devicePermission = nextPermission;
        return devicePermission;
      },
    },
  });
  const { default: FeaturePermission } = load("src/components/FeaturePermission.js", {
    "react-native": { View: "View" },
    "./AppModal": (props) => props.visible ? React.createElement("Modal", props) : null,
    "./FeatureScreen": { FeatureButton: "Button", FeatureStatus: "Status", featureStyles: {} },
  });
  const useAuth = () => ({
    transactions: [],
    rememberPermissionScreen: async () => {},
    runNativePermission: (request) => request(),
  });
  const { default: useFeaturePermission } = load("src/hooks/useFeaturePermission.js", {
    "react-native": { AppState: { addEventListener: (_, listener) => {
      onAppStateChange = listener;
      return { remove() {} };
    } } },
    "../context/AuthContext": { useAuth },
  });
  const { default: RemindersScreen } = load("src/screens/RemindersScreen.js", {
    "react-native": {
      StyleSheet: { create: (styles) => styles }, View: "View", Pressable: "Pressable", Text: "Text", ActivityIndicator: "Spinner",
      AppState: { addEventListener: () => ({ remove() {} }) },
    },
    "@expo/vector-icons": { Feather: "Icon" },
    "expo-notifications": { addNotificationReceivedListener: () => ({ remove() {} }) },
    "../components/FeatureScreen": { default: "Screen", __esModule: true, FeatureButton: "Button", FeatureStatus: "Status", featureStyles: {} },
    "../components/FeaturePermission": FeaturePermission,
    "../components/NotificationInbox": "Inbox",
    "../context/AuthContext": { useAuth },
    "../hooks/useFeaturePermission": useFeaturePermission,
    "../theme/colors": { COLORS: {} },
    "../services/notificationActivity": load("src/services/notificationActivity.js"),
    "../services/storage": {
      storageKeys: { offers: "offers" },
      getStoredJson: async (key) => saved.get(key),
      setStoredJson: async (key, value) => { saved.set(key, value); return true; },
    },
    "../services/reminders": {
      remindersSupported: true,
      findReminder: async () => null,
      readReminderPermission,
      requestReminderPermission,
      openNotificationSettings: async () => { settingsOpened++; },
      readNotificationPreference: async (uid) => saved.get(`notification/${uid}`) === true,
      setNotificationPreference: async (uid, enabled) => Boolean(saved.set(`notification/${uid}`, enabled)),
      sendActivityNotification: async (uid, item) => { sent.push([uid, item]); },
    },
  }, {
    setTimeout: (callback) => { timers.set(++timerId, callback); return timerId; },
    clearTimeout: (id) => timers.delete(id),
  });
  let root;
  const open = () => act(async () => {
    root = create(React.createElement(RemindersScreen, { uid: "A", onBack: () => { wentBack++; } }));
  });
  const permissionButton = () => root.root.findAllByType("Button").find((button) => button.props.label === "Permitir notificaciones");
  const openPermissionModal = () => act(async () => permissionButton().props.onPress());
  const confirmPermission = () => act(async () => root.root.findByType("Modal").props.onPrimary());
  await open();
  assert.equal(root.root.findAllByType("Inbox").length, 0);
  assert.equal(timers.size, 0);
  assert.equal(root.root.findByType("Status").props.title, "Recibe tus avisos");
  assert.equal(root.root.findByType("Button").props.label, "Permitir notificaciones");
  assert.equal(root.root.findAllByType("Status").length, 1);
  assert.equal(root.root.findAllByType("Modal").length, 0);
  await openPermissionModal();
  assert.equal(root.root.findByType("Modal").props.primaryLabel, "Permitir");
  assert.equal(requests, 0);
  await act(async () => root.root.findByType("Modal").props.onSecondary());
  assert.equal(root.root.findAllByType("Modal").length, 0);
  assert.equal(requests, 0);
  await openPermissionModal();
  await confirmPermission();
  assert.equal(requests, 1);
  assert.equal(root.root.findAllByType("Modal").length, 0);
  assert.equal(wentBack, 0);
  assert.equal(root.root.findAllByType("Status").length, 1);
  assert.equal(permissionButton().props.disabled, false);
  assert.ok(root.root.findAllByType("Button").some((button) => button.props.label === "Abrir Ajustes"));
  assert.equal(settingsOpened, 0);
  assert.equal(root.root.findByType("Text").props.children, "Permiso de notificaciones no concedido.");
  assert.equal(root.root.findAllByType("Inbox").length, 0);
  assert.equal(timers.size, 0);
  nextPermission = { granted: true, status: "granted", canAskAgain: true };
  await openPermissionModal();
  await confirmPermission();
  assert.equal(requests, 2);
  await act(async () => [...timers.values()][0]());
  assert.equal(root.root.findByType("Inbox").props.promoReceivedAt, saved.get("offers/A/bembos"));
  assert.equal(sent.length, 1);
  assert.match(sent[0][1].title, /Bembos/);
  await act(async () => root.unmount());
  await open();
  assert.equal(root.root.findByType("Inbox").props.promoReceivedAt, saved.get("offers/A/bembos"));
  assert.equal(timers.size, 0);
  await act(async () => root.root.findByType("Pressable").props.onPress());
  const disable = root.root.findAllByType("Button").find((button) => button.props.label === "Desactivar avisos de Al Toque");
  await act(async () => disable.props.onPress());
  assert.equal(root.root.findAllByType("Inbox").length, 0);
  assert.equal(devicePermission.granted, true);
  await openPermissionModal();
  await confirmPermission();
  assert.equal(requests, 2);
  assert.equal(root.root.findAllByType("Inbox").length, 1);
  await act(async () => root.unmount());
  devicePermission = { granted: false, status: "denied", canAskAgain: false };
  nextPermission = devicePermission;
  await open();
  assert.equal(root.root.findAllByType("Inbox").length, 0);
  const settingsButton = root.root.findByType("Button");
  assert.equal(settingsButton.props.label, "Abrir Ajustes");
  assert.equal(root.root.findAllByType("Status").length, 2);
  assert.equal(root.root.findAllByType("Pressable").length, 0);
  assert.equal(root.root.findAllByType("Text").length, 0);
  await act(async () => settingsButton.props.onPress());
  assert.equal(settingsOpened, 1);
  assert.equal(requests, 2);
  assert.equal(root.root.findAllByType("Modal").length, 0);
  assert.equal(root.root.findAllByType("Inbox").length, 0);
  devicePermission = { granted: true, status: "granted", canAskAgain: true };
  await act(async () => onAppStateChange("active"));
  assert.equal(root.root.findAllByType("Inbox").length, 1);
  await act(async () => root.unmount());
});

test("los avisos locales respetan el permiso, usan el canal correcto y ocultan el importe", async () => {
  let granted = false;
  const requests = [];
  const channels = [];
  const { sendActivityNotification } = load("src/services/reminders.js", {
    "react-native": { Platform: { OS: "android" } },
    expo: { isRunningInExpoGo: () => false },
    "expo-constants": {},
    "expo-device": {},
    "./storage": { storageKeys: { notificationPreference: "notifications" }, getStoredJson: async () => true },
    "./notificationActivity": load("src/services/notificationActivity.js"),
    "expo-notifications": {
      setNotificationHandler() {},
      getPermissionsAsync: async () => ({ granted }),
      IosAuthorizationStatus: {},
      AndroidImportance: { DEFAULT: 3, HIGH: 4 },
      setNotificationChannelAsync: async (id) => { channels.push(id); },
      scheduleNotificationAsync: async (request) => { requests.push(request); },
    },
  });
  const payment = { category: "payment", title: "Pago confirmado", message: "S/ 12.50" };
  assert.equal(await sendActivityNotification("A", payment), false);
  assert.equal(requests.length, 0);
  granted = true;
  assert.equal(await sendActivityNotification("A", payment), true);
  await sendActivityNotification("A", { category: "security", title: "Movimiento inusual", example: true });
  assert.equal(channels.join(), "altoque-payment,altoque-security");
  assert.equal(requests[0].content.data.route, "movements");
  assert.equal(requests[0].content.body.includes("12.50"), false);
  assert.equal(requests[1].content.data.route, "notifications");
  assert.match(requests[1].content.title, /^Prueba/);
});

test("historial por sacudida aplica umbral, pausa y libera el sensor en segundo plano", async () => {
  const appState = { currentState: "active" };
  let stateChange;
  let emit;
  let removed = 0;
  let opened = 0;
  let now = 5000;
  const { default: useShakeHistory } = load("src/hooks/useShakeHistory.js", {
    "react-native": { AppState: {
      get currentState() { return appState.currentState; },
      addEventListener: (_, listener) => { stateChange = listener; return { remove() {} }; },
    } },
    "expo-sensors": { Accelerometer: {
      isAvailableAsync: async () => true,
      setUpdateInterval: (ms) => assert.equal(ms, 100),
      addListener: (callback) => { emit = callback; return { remove: () => { removed++; } }; },
    } },
    "../services/storage": { getStoredJson: async () => true, storageKeys: { shakeHistory: "shake" } },
  }, { Date: { now: () => now } });
  const openHistory = () => { opened++; };
  function Probe({ home }) { useShakeHistory("A", home, openHistory); return null; }
  let root;
  await act(async () => { root = create(React.createElement(Probe, { home: true })); });
  emit({ x: 0, y: 0, z: 1 });
  assert.equal(opened, 0);
  emit({ x: 2, y: 0, z: 1 });
  emit({ x: 2, y: 0, z: 1 });
  assert.equal(opened, 1);
  now += 1700;
  emit({ x: 2, y: 0, z: 1 });
  assert.equal(opened, 2);
  appState.currentState = "background";
  stateChange("background");
  emit({ x: 2, y: 0, z: 1 });
  assert.equal(opened, 2);
  await act(async () => root.unmount());
  assert.equal(removed, 1);
});

test("tocar un recordatorio desde arranque en frío espera el PIN y respeta la cuenta", async () => {
  let received;
  let cleared = 0;
  let opened = 0;
  let openedInbox = 0;
  const response = (uid, route = "movements") => ({
    actionIdentifier: "tap",
    notification: { request: { content: { data: { route, uid } } } },
  });
  const { default: useReminderNavigation } = load("src/hooks/useReminderNavigation.js", {
    "../services/reminders": { remindersSupported: true },
    "expo-notifications": {
      DEFAULT_ACTION_IDENTIFIER: "tap",
      addNotificationResponseReceivedListener: (callback) => { received = callback; return { remove() {} }; },
      getLastNotificationResponse: () => response("A"),
      clearLastNotificationResponse: () => { cleared++; },
    },
  });
  const openHistory = () => { opened++; };
  const openNotifications = () => { openedInbox++; };
  function Probe(props) { useReminderNavigation({ ...props, openHistory, openNotifications }); return null; }
  let root;
  await act(async () => { root = create(React.createElement(Probe, { user: null, isUnlocked: false })); });
  await act(async () => root.update(React.createElement(Probe, { user: { uid: "A" }, isUnlocked: false })));
  assert.equal(cleared, 0);
  assert.equal(opened, 0);
  await act(async () => root.update(React.createElement(Probe, { user: { uid: "A" }, isUnlocked: true })));
  assert.equal(cleared, 1);
  assert.equal(opened, 1);
  await act(async () => received(response("A", "notifications")));
  assert.equal(openedInbox, 1);
  await act(async () => received(response("B")));
  assert.equal(cleared, 3);
  assert.equal(opened, 1);
  await act(async () => root.unmount());
});

test("comprobante persiste por cuenta y un guardado fallido conserva el archivo anterior", async () => {
  const files = new Map([["cache/capture.jpg", "photo A"], ["cache/other.jpg", "photo B"]]);
  const store = new Map();
  let failWrite = false;
  let seq = 0;
  class Directory {
    constructor(base, ...parts) { this.uri = [base, ...parts].join("/"); }
    create() {}
  }
  class File {
    constructor(base, name) { this.uri = name ? `${base.uri}/${name}` : base; }
    get exists() { return files.has(this.uri); }
    async copy(to) { files.set(to.uri, files.get(this.uri)); }
    delete() { files.delete(this.uri); }
  }
  const loadService = () => load("src/services/demoReceipt.js", {
    "expo-file-system": { Directory, File, Paths: { document: "private" } },
    "expo-crypto": { randomUUID: () => String(++seq).padStart(36, "0") },
    "./storage": {
      storageKeys: { demoReceipt: "receipt" },
      getStoredJson: async (key) => store.get(key),
      setStoredJson: async (key, value) => !failWrite && Boolean(store.set(key, value)),
    },
  });
  let service = loadService();
  const photo = await service.saveDemoReceipt("A", "cache/capture.jpg");
  service = loadService();
  assert.equal(await service.readDemoReceipt("A"), photo);
  assert.equal(await service.readDemoReceipt("B"), null);
  failWrite = true;
  await assert.rejects(service.saveDemoReceipt("A", "cache/other.jpg"), /referencia/);
  assert.equal(await service.readDemoReceipt("A"), photo);
  assert.equal(files.get(photo), "photo A");
  assert.equal(files.size, 3);
});

test("recordatorio crea el canal y reemplaza o cancela solo la programación de la cuenta", async () => {
  const scheduled = new Map();
  const stored = new Map();
  let sequence = 0;
  let channel;
  const { scheduleReminder, findReminder, setNotificationPreference } = load("src/services/reminders.js", {
    "react-native": { Platform: { OS: "android" } },
    expo: { isRunningInExpoGo: () => false },
    "expo-constants": {},
    "expo-device": {},
    "./notificationActivity": load("src/services/notificationActivity.js"),
    "expo-notifications": {
      setNotificationHandler() {},
      setNotificationChannelAsync: async (id) => { channel = id; },
      AndroidImportance: { HIGH: 4 },
      SchedulableTriggerInputTypes: { TIME_INTERVAL: "timeInterval" },
      scheduleNotificationAsync: async (request) => {
        const identifier = `reminder-${++sequence}`;
        scheduled.set(identifier, { identifier, ...request });
        return identifier;
      },
      getAllScheduledNotificationsAsync: async () => [...scheduled.values()],
      cancelScheduledNotificationAsync: async (id) => { scheduled.delete(id); },
    },
    "./storage": {
      storageKeys: { movementReminder: "reminders", notificationPreference: "notifications" },
      getStoredJson: async (key) => stored.get(key),
      setStoredJson: async (key, value) => Boolean(stored.set(key, value)),
      removeStoredValue: async (key) => { stored.delete(key); return true; },
    },
  });
  const day = await scheduleReminder("A", 86400);
  const other = await scheduleReminder("B", 86400);
  const demo = await scheduleReminder("A", 5);
  assert.equal(channel, "movements");
  assert.equal(scheduled.has(day), false);
  assert.equal(scheduled.get(demo).trigger.seconds, 5);
  assert.equal(scheduled.get(demo).content.data.uid, "A");
  assert.equal(await findReminder("A"), demo);
  await setNotificationPreference("A", false);
  assert.equal(stored.get("notifications/A"), false);
  assert.equal(await findReminder("A"), null);
  assert.equal(scheduled.has(demo), false);
  assert.equal(await findReminder("B"), other);
});

test("un permiso denegado vuelve a solicitarse por el mismo flujo y se consulta al regresar", async () => {
  let response = { granted: false, status: "denied", canAskAgain: true };
  let requests = 0;
  let resume;
  let access;
  const events = [];
  const read = async () => response;
  const request = async () => {
    events.push("request");
    requests++;
    response = { ...response, canAskAgain: false };
    return response;
  };
  const { default: useFeaturePermission } = load("src/hooks/useFeaturePermission.js", {
    "../context/AuthContext": {
      useAuth: () => ({
        rememberPermissionScreen: async () => { events.push("remember"); },
        runNativePermission: async (requestPermission) => requestPermission(),
      }),
    },
    "react-native": {
      AppState: { addEventListener: (_, handler) => { resume = handler; return { remove() {} }; } },
    },
  });
  function Probe() { access = useFeaturePermission(read, request); return null; }
  let root;
  await act(async () => { root = create(React.createElement(Probe)); });
  assert.equal(access.permission.canAskAgain, true);
  assert.equal(access.denied, false);
  await act(async () => access.allow());
  assert.equal(requests, 1);
  assert.equal(access.permission.canAskAgain, false);
  assert.equal(access.denied, true);
  await act(async () => root.unmount());
  await act(async () => { root = create(React.createElement(Probe)); });
  assert.equal(access.denied, false);
  await act(async () => access.allow());
  assert.equal(requests, 2);
  assert.equal(access.denied, false);
  assert.deepEqual(events, ["remember", "request", "remember", "request"]);
  response = { granted: true, status: "granted", canAskAgain: true };
  await act(async () => access.allow());
  assert.equal(access.permission.granted, true);
  assert.equal(requests, 2);
  response = { granted: false, status: "denied", canAskAgain: false };
  await act(async () => resume("active"));
  assert.equal(access.denied, false);
  response = { granted: true, status: "granted", canAskAgain: true };
  await act(async () => resume("active"));
  assert.equal(access.permission.granted, true);
  assert.equal(access.denied, false);
  await act(async () => root.unmount());
});

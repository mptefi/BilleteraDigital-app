const { test } = require("node:test");
const assert = require("node:assert/strict");
const load = require("./load-module.cjs");
const React = require("react");
const crypto = require("node:crypto");
const { create, act } = require("react-test-renderer");
global.IS_REACT_ACT_ENVIRONMENT = true;

const errors = load("src/services/authErrors.js");
const { notificationActivity } = load("src/services/notificationActivity.js");
const userA = { uid: "A", email: "ana@example.com", displayName: "Ana" };
const userB = { uid: "B", email: "bea@example.com", displayName: "Bea" };

async function harness(initialUser = null, saved = new Map(), secureSaved = new Map()) {
  const auth = { currentUser: initialUser };
  const calls = { writes: [], login: [], register: [], notices: [] };
  let observer;
  let failure;
  let appStateListener;
  let verificationDelay;
  const timers = new Map();
  let timerId = 0;
  const appState = { currentState: "active", addEventListener: (_, callback) => {
    appStateListener = callback; return { remove: () => { appStateListener = () => {}; } };
  } };
  const emit = (user) => { auth.currentUser = user; observer(user); };
  const sdk = {
    onAuthStateChanged: (_, next) => { observer = next; return () => { observer = () => {}; }; },
    signInWithEmailAndPassword: async (_, email, password) => {
      calls.login.push([email, password]);
      if (failure) throw failure;
      emit(userA);
      return { user: userA };
    },
    createUserWithEmailAndPassword: async (_, email, password) => {
      calls.register.push([email, password]);
      if (failure) throw failure;
      const user = { uid: "C", email, displayName: null };
      emit(user); return { user };
    },
    updateProfile: async (user, profile) => { Object.assign(user, profile); },
    signOut: async () => { if (failure) throw failure; emit(null); },
    sendPasswordResetEmail: async () => { if (failure) throw failure; },
    EmailAuthProvider: { credential: (email, password) => ({ email, password }) },
    reauthenticateWithCredential: async (_, credential) => {
      if (failure) throw failure;
      if (credential.password !== "account-password") throw { code: "auth/invalid-credential" };
    },
  };
  const storage = {
    storageKeys: { userPin: "pin", showBalance: "balance", transactions: "transactions", simulatedPayments: "simulations", permissionReturn: "notification-return" },
    getStoredJson: async (key, fallback) => saved.has(key) ? saved.get(key) : fallback,
    setStoredJson: async (key, value) => { calls.writes.push([key, value]); saved.set(key, value); return true; },
    removeStoredValue: async (key) => { saved.delete(key); },
  };
  const vault = load("src/services/pinVault.js", {
    "expo-secure-store": {
      WHEN_UNLOCKED_THIS_DEVICE_ONLY: "device-only",
      getItemAsync: async (key) => secureSaved.get(key) || null,
      setItemAsync: async (key, value) => { secureSaved.set(key, value); },
    },
    "expo-crypto": {
      getRandomBytesAsync: async (size) => crypto.randomBytes(size),
      CryptoDigestAlgorithm: { SHA256: "sha256" },
      digestStringAsync: async (_, text) => crypto.createHash("sha256").update(text).digest("hex"),
    },
    "react-native": { Platform: { OS: "android" } },
  });
  const pinLock = load("src/context/usePinLock.js", {
    "react-native": { AppState: appState },
    "../config/firebase": { auth }, "firebase/auth": sdk,
    "../services/authErrors": errors,
    "../services/pinVault": { ...vault, verifyPin: async (...args) => {
      const result = await vault.verifyPin(...args);
      if (verificationDelay) await verificationDelay;
      return result;
    } },
  }, {
    setTimeout: (callback) => { const id = ++timerId; timers.set(id, callback); return id; },
    clearTimeout: (id) => timers.delete(id),
  });
  const context = load("src/context/AuthContext.js", {
    "../config/firebase": { auth }, "firebase/auth": sdk,
    "../services/authErrors": errors, "../services/storage": storage,
    "../services/simulatedPayments": load("src/services/simulatedPayments.js", { "./storage": storage }),
    "../services/notificationActivity": load("src/services/notificationActivity.js"),
    "../services/reminders": { sendActivityNotification: async (uid, activity) => { calls.notices.push([uid, activity]); } },
    "./usePinLock": pinLock,
  });
  const screenNames = ["Splash", "Login", "RecoveryEmail", "RecoveryCode", "NewPassword", "Support", "Home", "Register", "Profile", "PinLogin", "PinRecovery", "Qr", "Receipt", "Reminders"];
  const screenMocks = Object.fromEntries(screenNames.map((name) => [
    `../screens/${name}Screen`, () => React.createElement(name),
  ]));
  const { default: Navigator } = load("src/navigation/AppNavigator.js", {
    ...screenMocks, "../context/AuthContext": context, "../hooks/useReminderNavigation": () => {},
    "react-native": { View: "View", StyleSheet: { create: (styles) => styles } },
  });
  let value;
  function Probe() { value = context.useAuth(); return React.createElement(Navigator); }
  let root;
  await act(async () => { root = create(React.createElement(context.AuthProvider, null, React.createElement(Probe))); });
  const screen = () => root.toJSON().children[0].type;
  return {
    get value() { return value; }, auth, calls, saved, screen, vault, secureSaved,
    emit: async (user) => act(async () => emit(user)),
    fail: (code) => { failure = { code }; },
    appState: async (next) => act(async () => { appState.currentState = next; appStateListener(next); }),
    delayVerification: (promise) => { verificationDelay = promise; },
    finishPinInitialization: async () => act(async () => {
      const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach((callback) => callback());
    }),
    close: async () => act(async () => root.unmount()),
  };
}

test("espera a Firebase y bloquea Home, Perfil y PIN sin sesión", async () => {
  const h = await harness();
  try {
    assert.equal(h.screen(), "Splash");
    await h.emit(null);
    assert.equal(h.screen(), "Login");
    for (const screen of ["HOME", "PROFILE", "PIN_LOGIN", "NEW_PASSWORD", "RECOVERY_CODE"]) {
      await act(async () => h.value.setCurrentScreen(screen));
      assert.equal(h.screen(), "Login");
    }
    await act(async () => h.value.setCurrentScreen("REGISTER"));
    assert.equal(h.screen(), "Register");
  } finally { await h.close(); }
});

test("restaura usuario observado y sus preferencias antes de mostrar Home", async () => {
  const h = await harness(userA, new Map([["balance/A", false], ["transactions/A", []]]));
  try {
    await h.emit(userA);
    assert.equal(h.screen(), "PinLogin");
    assert.equal(h.value.userName, "Ana");
    assert.equal(h.value.showBalance, false);
    assert.equal(h.value.transactions.length, 0);
    assert.equal(h.value.isStorageReady, true);
  } finally { await h.close(); }
});

test("login usa el SDK y no guarda la contraseña en almacenamiento propio", async () => {
  const h = await harness();
  try {
    await h.emit(null);
    await act(async () => h.value.login(" ana@example.com ", "secret-test"));
    assert.equal(h.screen(), "PinLogin");
    await assert.rejects(h.value.setupPin("123456"), /Verifica tu contraseña/);
    assert.deepEqual(h.calls.login[0], ["ana@example.com", "secret-test"]);
    assert.ok(h.calls.writes.every(([key, value]) => key !== "pin" && value !== "secret-test"));
  } finally { await h.close(); }
});

test("al volver de un permiso conserva Notificaciones después de desbloquear", async () => {
  const h = await harness(userA, new Map([["notification-return/A", Date.now() + 10_000]]));
  try {
    await h.vault.savePin("A", "654321");
    await h.emit(userA);
    assert.equal(h.screen(), "PinLogin");
    await act(async () => h.value.unlockWithPin("654321"));
    assert.equal(h.screen(), "Reminders");
    assert.equal(h.saved.has("notification-return/A"), false);
    await h.emit({ ...userA });
    assert.equal(h.screen(), "Reminders");
    await h.appState("background");
    await h.appState("active");
    assert.equal(h.screen(), "PinLogin");
    await act(async () => h.value.unlockWithPin("654321"));
    assert.equal(h.screen(), "Reminders");
  } finally { await h.close(); }
});

test("la app recupera la pantalla del permiso o de una interrupción del sistema", async () => {
  const saved = new Map();
  const secure = new Map();
  for (const [route, screen] of [["QR", "Qr"], ["RECEIPT", "Receipt"], ["REMINDERS", "Reminders"], ["PROFILE", "Profile"]]) {
    let h = await harness(userA, saved, secure);
    try {
      if (secure.size === 0) await h.vault.savePin("A", "654321");
      await h.emit(userA);
      await act(async () => h.value.unlockWithPin("654321"));
      await act(async () => h.value.setCurrentScreen(route));
      await act(async () => h.value.rememberPermissionScreen());
      assert.equal(saved.get("notification-return/A").screen, route);
    } finally { await h.close(); }

    h = await harness(userA, saved, secure);
    try {
      await h.emit(userA);
      assert.equal(h.screen(), "PinLogin");
      await act(async () => h.value.unlockWithPin("654321"));
      assert.equal(h.screen(), screen);
      assert.equal(saved.has("notification-return/A"), false);
      await h.appState("background");
      assert.equal(saved.get("notification-return/A").screen, route);
      await h.appState("active");
      await act(async () => h.value.unlockWithPin("654321"));
      assert.equal(h.screen(), screen);
      await act(async () => h.value.setCurrentScreen("HOME"));
      assert.equal(saved.has("notification-return/A"), false);
    } finally { await h.close(); }
  }
});

test("el diálogo nativo conserva la pantalla mientras Android cambia a segundo plano y regresa", async () => {
  const h = await harness(userA);
  try {
    await h.vault.savePin("A", "654321");
    await h.emit(userA);
    await act(async () => h.value.unlockWithPin("654321"));
    for (const [route, screen, granted] of [["REMINDERS", "Reminders", true], ["QR", "Qr", false]]) {
      await act(async () => h.value.setCurrentScreen(route));
      let resolveNative;
      const nativeResult = new Promise((resolve) => { resolveNative = resolve; });
      let result;
      await act(async () => { h.value.runNativePermission(() => nativeResult).then((value) => { result = value; }); });
      await h.appState("background");
      assert.equal(h.screen(), screen);
      await act(async () => { resolveNative({ granted }); });
      assert.equal(result, undefined);
      assert.equal(h.screen(), screen);
      await h.appState("active");
      assert.equal(result.granted, granted);
      assert.equal(h.screen(), screen);
      assert.equal(h.value.pinState.status, "unlocked");
    }
    let resolveAbandoned;
    const abandoned = new Promise((resolve) => { resolveAbandoned = resolve; });
    await act(async () => { h.value.runNativePermission(() => abandoned); });
    await h.appState("background");
    await act(async () => { resolveAbandoned({ granted: false }); });
    await h.finishPinInitialization();
    await h.appState("active");
    assert.equal(h.screen(), "PinLogin");
    await act(async () => h.value.unlockWithPin("654321"));
    await h.appState("background");
    await h.appState("active");
    assert.equal(h.screen(), "PinLogin");
  } finally { await h.close(); }
});

test("al volver a iniciar sesión muestra el teclado y conserva el PIN existente", async () => {
  const h = await harness();
  try {
    await h.vault.savePin("A", "654321");
    const original = [...h.secureSaved.values()][0];
    await h.emit(null);
    await act(async () => h.value.login("ana@example.com", "account-password"));
    assert.equal(h.screen(), "PinLogin");
    assert.equal(h.value.pinState.status, "locked");
    await act(async () => h.value.unlockWithPin("654321"));
    await act(async () => h.value.logout());
    assert.equal(h.screen(), "Login");
    await act(async () => h.value.login("ana@example.com", "account-password"));
    assert.equal(h.screen(), "PinLogin");
    assert.equal([...h.secureSaved.values()][0], original);
    await act(async () => h.value.unlockWithPin("654321"));
    assert.equal(h.screen(), "Home");
  } finally { await h.close(); }
});

test("aplica cada pago o ingreso una sola vez y restaura su saldo e historial por cuenta", async () => {
  const saved = new Map([
    ["transactions/A", [{ id: "previous" }]],
    ["simulations/A", [{ id: "legacy", amountCents: 1250, currency: "PEN", type: "expense", simulation: true }]],
  ]);
  const secure = new Map();
  const payment = { uid: "A", simulation: true, recipient: "Cafetería Demo", amountCents: 1250, currency: "PEN" };
  let h = await harness(null, saved, secure);
  try {
    await h.emit(null);
    await act(async () => h.value.login("ana@example.com", "account-password"));
    await act(async () => h.value.authorizePinReset("account-password"));
    await act(async () => h.value.setupPin("654321"));
    await h.finishPinInitialization();
    await assert.rejects(h.value.confirmQrPayment("SIM-1", payment), /Desbloquea/);
    await act(async () => h.value.unlockWithPin("654321"));
    await assert.rejects(h.value.confirmQrPayment("SIM-1", { ...payment, uid: "B" }), /Desbloquea/);
    assert.equal(h.value.balance, 1840.50);
    await act(async () => {
      const results = await Promise.all([
        h.value.confirmQrPayment("SIM-1", payment),
        h.value.confirmQrPayment("SIM-1", payment),
      ]);
      assert.equal(results[0].id, "SIM-1");
      assert.equal(results[0].confirmedAt, results[1].confirmedAt);
    });
    assert.equal(h.calls.writes.filter(([key]) => key === "simulations/A").length, 1);
    assert.equal(h.calls.notices.length, 1);
    assert.equal(h.calls.notices[0][0], "A");
    assert.equal(h.calls.notices[0][1].category, "payment");
    const paymentActivity = notificationActivity(h.value.transactions).filter((item) => item.category === "payment" && item.id === "SIM-1");
    assert.equal(paymentActivity.length, 1);
    assert.equal(paymentActivity[0].message, "Cafetería Demo · - S/ 12.50");
    assert.equal(paymentActivity[0].example, false);
    assert.equal(h.value.balance, 1828.00);
    assert.equal(h.value.transactions.length, 3);
    assert.equal(h.value.transactions[0].amount, "- S/ 12.50");
    assert.equal(h.value.transactions[0].simulation, true);
    assert.equal(h.value.transactions[2].id, "previous");
  } finally { await h.close(); }

  h = await harness(userA, saved, secure);
  try {
    await h.emit(userA);
    assert.equal(h.value.transactions[0].id, "SIM-1");
    assert.equal(h.value.balance, 1828.00);
    await act(async () => h.value.unlockWithPin("654321"));
    await act(async () => {
      const incoming = { ...payment, recipient: "María Demo", direction: "credit" };
      const results = await Promise.all([
        h.value.confirmQrPayment("SIM-2", incoming),
        h.value.confirmQrPayment("SIM-2", incoming),
      ]);
      assert.equal(results[0].balanceAfterCents, 184050);
      assert.equal(results[1].balanceAfterCents, 184050);
    });
    assert.equal(h.value.balance, 1840.50);
    assert.equal(h.value.transactions[0].amount, "+ S/ 12.50");
    assert.equal(h.value.transactions[0].type, "income");
    assert.equal(h.calls.writes.filter(([key]) => key === "simulations/A").length, 1);
    assert.equal(h.calls.notices.length, 1);
    assert.equal(h.calls.notices[0][1].category, "transfer");
    const transferActivity = notificationActivity(h.value.transactions).filter((item) => item.category === "transfer");
    assert.equal(transferActivity.length, 1);
    assert.equal(transferActivity[0].id, "SIM-2");
    assert.equal(transferActivity[0].message, "María Demo · + S/ 12.50");
    await h.emit(userB);
    assert.ok(h.value.transactions.every((item) => item.id !== "SIM-1"));
    assert.equal(h.value.balance, 1840.50);
  } finally { await h.close(); }
});

test("registro crea cuenta y actualiza el nombre del perfil", async () => {
  const h = await harness();
  try {
    await h.emit(null);
    await act(async () => h.value.register(" Carla ", " carla@example.com ", "password-test"));
    assert.equal(h.screen(), "NewPassword");
    assert.equal(h.value.userName, "Carla");
    assert.equal(h.auth.currentUser.displayName, "Carla");
    assert.deepEqual(h.calls.register[0], ["carla@example.com", "password-test"]);
  } finally { await h.close(); }
});

test("logout limpia datos en memoria y vuelve a Login", async () => {
  const h = await harness();
  try {
    await h.emit(userA);
    await act(async () => h.value.toggleBalanceVisibility());
    await act(async () => h.value.logout());
    assert.equal(h.value.user, null);
    assert.notEqual(h.value.pinState.status, "unlocked");
    assert.equal(h.value.userEmail, "");
    assert.equal(h.value.showBalance, true);
    assert.equal(h.screen(), "Login");
  } finally { await h.close(); }
});

test("cambiar de cuenta no mezcla preferencias ni movimientos", async () => {
  const h = await harness(null, new Map([["balance/A", false], ["transactions/A", [{ id: "private-A" }]]]));
  try {
    await h.emit(userA);
    assert.equal(h.value.transactions[0].id, "private-A");
    await h.emit(userB);
    assert.equal(h.value.showBalance, true);
    assert.notEqual(h.value.transactions[0].id, "private-A");
    assert.equal(h.saved.get("balance/A"), false);
    assert.equal(h.saved.get("balance/B"), true);
  } finally { await h.close(); }
});

test("credenciales rechazadas no autentican y muestran mensaje traducido", async () => {
  const h = await harness();
  try {
    await h.emit(null); h.fail("auth/invalid-credential");
    await assert.rejects(h.value.login("ana@example.com", "wrong"), /correo o la contraseña son incorrectos/);
    assert.equal(h.value.user, null);
    assert.equal(h.screen(), "Login");
  } finally { await h.close(); }
});

test("recuperación informa errores y no inventa un envío exitoso", async () => {
  const h = await harness();
  try {
    await h.emit(null);
    let result;
    await act(async () => { result = await h.value.resetPassword("ana@example.com"); });
    assert.equal(result.success, true);
    h.fail("auth/network-request-failed");
    await act(async () => { result = await h.value.resetPassword("ana@example.com"); });
    assert.equal(result.success, false);
    assert.match(result.errorMsg, /conexión/);
    assert.equal(h.value.recoverySuccess, "");
    assert.equal(h.value.verifyOtp("1234"), false);
  } finally { await h.close(); }
});

test("valida correo y traduce los errores comunes de Firebase", () => {
  assert.equal(errors.isValidEmail("ana@example.com"), true);
  for (const email of ["", "ana", "ana@", "ana@host", "a b@example.com"]) assert.equal(errors.isValidEmail(email), false);
  for (const code of ["invalid-credential", "invalid-email", "user-not-found", "wrong-password", "email-already-in-use", "weak-password", "network-request-failed"]) {
    const message = errors.authErrorMessage({ code: `auth/${code}` });
    assert.ok(message.length > 10);
    assert.ok(!message.includes("auth/"));
  }
});

test("el formulario valida campos, correo y confirmación antes de llamar a Firebase", async () => {
  let registered;
  const native = Object.fromEntries(["ActivityIndicator", "Image", "KeyboardAvoidingView", "SafeAreaView", "ScrollView", "Text", "TextInput", "TouchableOpacity", "View"].map((name) => [name, name]));
  native.Platform = { OS: "android" };
  native.StyleSheet = { create: (value) => value };
  const { default: Form } = load("src/components/AuthForm.js", {
    "react-native-safe-area-context": { SafeAreaView: "SafeAreaView" },
    "react-native": native, "@expo/vector-icons": { Feather: "Feather" },
    "../theme/colors": { COLORS: {} },
    "../services/authErrors": errors,
    "../context/AuthContext": { useAuth: () => ({
      register: async (...values) => { registered = values; },
      login: async () => { throw Error("No debería usarse login en registro"); },
      setCurrentScreen: () => {},
    }) },
    "../../mockups/logo-AT-sinfondo.png": 1, "../../mockups/AT-SF.png": 2,
  });
  let root;
  await act(async () => { root = create(React.createElement(Form, { registerMode: true })); });
  const input = (label) => root.root.findAllByType("TextInput").find((element) => element.props.accessibilityLabel === label);
  const submit = () => root.root.findAllByType("TouchableOpacity").find((element) => element.findAllByType("Text").some((text) => text.props.children === "Crear cuenta")).props.onPress();
  const message = () => root.root.findByProps({ accessibilityRole: "alert" }).props.children;
  try {
    await act(async () => submit());
    assert.match(message(), /Completa todos/);
    await act(async () => {
      input("Nombres").props.onChangeText("Carla"); input("Correo electrónico").props.onChangeText("correo-invalido");
      input("Contraseña").props.onChangeText("secret1"); input("Confirmar contraseña").props.onChangeText("secret2");
    });
    await act(async () => submit()); assert.match(message(), /correo electrónico válido/);
    await act(async () => input("Correo electrónico").props.onChangeText("carla@example.com"));
    await act(async () => submit()); assert.match(message(), /no coinciden/);
    assert.equal(registered, undefined);
    await act(async () => input("Confirmar contraseña").props.onChangeText("secret1"));
    await act(async () => submit());
    assert.deepEqual(registered, ["Carla", "carla@example.com", "secret1"]);
    assert.equal(input("Contraseña").props.value, "");
  } finally { await act(async () => root.unmount()); }
});

test("Firebase configura persistencia explícita con AsyncStorage en React Native", () => {
  const storage = {};
  let received;
  const app = {};
  const module = load("src/config/firebase.js", {
    "firebase/app": { initializeApp: () => app, getApps: () => [], getApp: () => app },
    "firebase/auth": {
      getAuth: () => { throw Error("No usar getAuth para la primera inicialización nativa"); },
      getReactNativePersistence: (value) => { assert.equal(value, storage); return "native-persistence"; },
      initializeAuth: (value, options) => { assert.equal(value, app); received = options; return "native-auth"; },
    },
    "@react-native-async-storage/async-storage": storage,
    "react-native": { Platform: { OS: "android" } },
  });
  assert.equal(module.auth, "native-auth");
  assert.equal(received.persistence, "native-persistence");
});

test("configurar el PIN desde el teclado almacena solo el verificador y al reiniciar exige el PIN", async () => {
  const secure = new Map();
  let h = await harness(null, new Map(), secure);
  try {
    await h.emit(null);
    await act(async () => h.value.login("ana@example.com", "account-password"));
    assert.equal(h.screen(), "PinLogin");
    await act(async () => h.value.setCurrentScreen("PIN_RECOVERY"));
    assert.equal(h.screen(), "PinRecovery");
    await act(async () => h.value.setCurrentScreen("PIN_LOGIN"));
    assert.equal(h.screen(), "PinLogin");
    await act(async () => h.value.authorizePinReset("account-password"));
    assert.equal(h.screen(), "NewPassword");
    await act(async () => h.value.setupPin("987654"));
    assert.equal(h.screen(), "Splash");
    await act(async () => h.value.setCurrentScreen("HOME"));
    assert.equal(h.screen(), "Splash");
    await h.finishPinInitialization();
    assert.equal(h.screen(), "PinLogin");
    await act(async () => h.value.unlockWithPin("987654"));
    assert.equal(h.screen(), "Home");
    const record = JSON.parse([...secure.values()][0]);
    assert.equal(record.digest.length, 64);
    assert.equal(record.salt.length, 64);
    assert.ok(!Object.values(record).includes("987654"));
    assert.ok(h.calls.writes.every(([, value]) => value !== "987654"));
    await h.close();
    h = await harness(userA, new Map(), secure);
    await h.emit(userA);
    assert.equal(h.screen(), "PinLogin");
    await act(async () => h.value.setCurrentScreen("PROFILE"));
    assert.equal(h.screen(), "PinLogin");
    let result;
    await act(async () => { result = await h.value.unlockWithPin("987654"); });
    assert.equal(result.success, true);
    assert.equal(h.screen(), "Profile");
  } finally { await h.close(); }
});

test("bloquea al ir a segundo plano y exige PIN al volver", async () => {
  const h = await harness();
  try {
    await h.vault.savePin("A", "654321"); await h.emit(userA);
    await act(async () => h.value.unlockWithPin("654321"));
    assert.equal(h.screen(), "Home");
    await h.appState("inactive"); assert.equal(h.screen(), "Splash");
    await h.appState("background");
    await h.appState("active"); assert.equal(h.screen(), "PinLogin");
    await act(async () => h.value.setCurrentScreen("HOME")); assert.equal(h.screen(), "PinLogin");
    await act(async () => h.value.unlockWithPin("654321")); assert.equal(h.screen(), "Home");
  } finally { await h.close(); }
});

test("los 3 intentos persisten al reiniciar y solo la contraseña permite cambiar el PIN", async () => {
  const secure = new Map();
  let h = await harness(null, new Map(), secure);
  try {
    await h.vault.savePin("A", "654321"); await h.emit(userA);
    await act(async () => h.value.unlockWithPin("111111"));
    assert.equal(h.value.pinState.remainingAttempts, 2);
    await h.close(); h = await harness(userA, new Map(), secure); await h.emit(userA);
    assert.equal(h.value.pinState.remainingAttempts, 2);
    await act(async () => h.value.unlockWithPin("111111"));
    await act(async () => h.value.unlockWithPin("111111"));
    assert.equal(h.value.pinState.status, "blocked");
    await act(async () => h.value.unlockWithPin("654321"));
    assert.equal(h.value.pinState.status, "blocked");
    await assert.rejects(h.value.setupPin("222222"), /Verifica tu contraseña/);
    await assert.rejects(h.value.authorizePinReset("wrong-password"), /incorrectos/);
    await act(async () => h.value.authorizePinReset("account-password"));
    assert.equal(h.screen(), "NewPassword");
    await act(async () => h.value.setupPin("222222"));
    assert.equal(h.screen(), "Splash");
    await h.finishPinInitialization();
    assert.equal(h.screen(), "PinLogin");
    assert.equal((await h.vault.readPinRecord("A")).failedAttempts, 0);
    await act(async () => h.value.lockSession());
    await act(async () => h.value.unlockWithPin("222222"));
    assert.equal(h.screen(), "Home");
  } finally { await h.close(); }
});

test("no se puede crear PIN con una sesión restaurada sin verificar la contraseña", async () => {
  const h = await harness();
  try {
    await h.emit(userA); assert.equal(h.screen(), "PinLogin");
    await act(async () => h.value.setCurrentScreen("NEW_PASSWORD"));
    assert.equal(h.screen(), "PinLogin");
    await assert.rejects(h.value.setupPin("123456"), /Verifica tu contraseña/);
    await act(async () => h.value.authorizePinReset("account-password"));
    await h.appState("background"); await h.appState("active");
    await assert.rejects(h.value.setupPin("123456"), /Verifica tu contraseña/);
    assert.equal(h.screen(), "PinLogin");
  } finally { await h.close(); }
});

test("una verificación que termina después de bloquear la app no abre Home", async () => {
  const h = await harness();
  try {
    await h.vault.savePin("A", "654321"); await h.emit(userA);
    let resolve;
    h.delayVerification(new Promise((done) => { resolve = done; }));
    let pending;
    await act(async () => { pending = h.value.unlockWithPin("654321"); });
    await h.appState("background"); await h.appState("active");
    let result;
    await act(async () => { resolve(); result = await pending; });
    assert.equal(result.interrupted, true);
    assert.equal(h.screen(), "PinLogin");
  } finally { await h.close(); }
});

test("los PIN son independientes por usuario y las comprobaciones simultáneas no eluden el límite", async () => {
  const h = await harness();
  try {
    await h.vault.savePin("A", "654321"); await h.vault.savePin("B", "987654");
    await h.emit(userB);
    await act(async () => h.value.unlockWithPin("654321"));
    assert.equal(h.value.pinState.status, "locked");
    assert.equal((await h.vault.readPinRecord("A")).failedAttempts, 0);
    const attempts = await Promise.all(Array.from({ length: 5 }, () => h.vault.verifyPin("A", "000000")));
    assert.equal((await h.vault.readPinRecord("A")).failedAttempts, 3);
    assert.equal(attempts[4].remainingAttempts, 0);
    await act(async () => h.value.unlockWithPin("987654"));
    assert.equal(h.screen(), "Home");
  } finally { await h.close(); }
});

test("un registro de PIN corrupto bloquea el acceso y permite recuperar con contraseña", async () => {
  const h = await harness();
  try {
    await h.vault.savePin("A", "654321");
    h.secureSaved.set([...h.secureSaved.keys()][0], "not-json");
    await h.emit(userA);
    assert.equal(h.value.pinState.status, "error");
    await act(async () => h.value.setCurrentScreen("HOME")); assert.equal(h.screen(), "PinLogin");
    await act(async () => h.value.authorizePinReset("account-password"));
    await act(async () => h.value.setupPin("987654"));
    assert.equal(h.screen(), "Splash");
    await h.finishPinInitialization();
    assert.equal(h.screen(), "PinLogin");
  } finally { await h.close(); }
});

test("rechaza PIN que no tenga exactamente seis dígitos", async () => {
  const h = await harness();
  try {
    for (const pin of ["", "12345", "1234567", "abcdef", "123 56"]) {
      await assert.rejects(h.vault.savePin("A", pin), /6 dígitos/);
    }
    assert.equal(h.secureSaved.size, 0);
  } finally { await h.close(); }
});

test("el formulario de creación exige confirmar el mismo PIN antes de guardarlo", async () => {
  let stored;
  let destination;
  const native = Object.fromEntries(["ActivityIndicator", "Image", "KeyboardAvoidingView", "ScrollView", "Text", "TextInput", "TouchableOpacity", "View", "StatusBar"].map((name) => [name, name]));
  native.Platform = { OS: "android" }; native.StyleSheet = { create: (styles) => styles };
  const { default: Screen } = load("src/screens/NewPasswordScreen.js", {
    "react-native": native, "react-native-safe-area-context": { SafeAreaView: "SafeAreaView" },
    "@expo/vector-icons": { Feather: "Feather" }, "../theme/colors": { COLORS: {} },
    "../context/AuthContext": { useAuth: () => ({
      setupPin: async (value) => { stored = value; },
      setCurrentScreen: (value) => { destination = value; }, logout: async () => {},
    }) },
    "../components/AppModal": (props) => props.visible ? React.createElement("Modal", props) : null,
    "../../mockups/atras.png": 1,
  });
  let root;
  await act(async () => { root = create(React.createElement(Screen)); });
  const input = (label) => root.root.findAllByType("TextInput").find((element) => element.props.accessibilityLabel === label);
  const submit = () => root.root.findAllByType("TouchableOpacity").find((element) => element.findAllByType("Text").some((text) => text.props.children === "Guardar PIN y continuar")).props.onPress();
  try {
    await act(async () => { input("PIN nuevo").props.onChangeText("12a3456"); input("Confirmar PIN").props.onChangeText("654321"); });
    assert.equal(input("PIN nuevo").props.value, "123456");
    await act(async () => submit());
    assert.equal(stored, undefined);
    assert.equal(root.root.findByType("Modal").props.title, "Los PIN no coinciden");
    await act(async () => root.root.findByType("Modal").props.onClose());
    await act(async () => input("Confirmar PIN").props.onChangeText("123456"));
    await act(async () => submit());
    assert.equal(stored, "123456"); assert.equal(destination, "PIN_LOGIN");
    assert.equal(input("PIN nuevo").props.value, "");
  } finally { await act(async () => root.unmount()); }
});

test("Salir de Perfil vuelve al PIN conservando Firebase; Cambiar de cuenta sí desconecta", async () => {
  const h = await harness();
  let root;
  try {
    await h.vault.savePin("A", "654321"); await h.emit(userA);
    await act(async () => { await h.value.unlockWithPin("654321"); h.value.setCurrentScreen("PROFILE"); });
    const native = Object.fromEntries(["ActivityIndicator", "Text", "TouchableOpacity", "View"].map((name) => [name, name]));
    native.StyleSheet = { create: (styles) => styles };
    const { default: Profile } = load("src/screens/ProfileScreen.js", {
      "react-native": native, "react-native-safe-area-context": { SafeAreaView: "SafeAreaView" },
      "../context/AuthContext": { useAuth: () => h.value }, "../theme/colors": { COLORS: {} },
    });
    await act(async () => { root = create(React.createElement(Profile)); });
    const press = (label) => root.root.findAllByType("TouchableOpacity").find((element) => element.findAllByType("Text").some((text) => text.props.children === label)).props.onPress();
    await act(async () => press("Salir y volver al PIN"));
    assert.equal(h.auth.currentUser.uid, "A");
    assert.equal(h.value.user.uid, "A");
    assert.equal(h.screen(), "PinLogin");
    await act(async () => { await h.value.unlockWithPin("654321"); h.value.setCurrentScreen("PROFILE"); });
    assert.equal(h.screen(), "Profile");
    await act(async () => press("Cambiar de cuenta"));
    assert.equal(h.auth.currentUser, null);
    assert.equal(h.screen(), "Login");
  } finally {
    if (root) await act(async () => root.unmount());
    await h.close();
  }
});

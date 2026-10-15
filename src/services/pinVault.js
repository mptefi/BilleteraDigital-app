import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";

export const MAX_PIN_ATTEMPTS = 3;
export const isValidPin = (pin) => /^\d{6}$/.test(pin);
const options = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
// Web no dispone de SecureStore: conserva el verificador solo durante esta pestaña.
const webRecords = new Map();
const pending = new Map();
const keyFor = (uid) => `altoque.pin.v1.${Array.from(uid, (char) => char.charCodeAt(0).toString(16).padStart(4, "0")).join("")}`;

async function read(uid) {
  const key = keyFor(uid);
  const raw = Platform.OS === "web" ? webRecords.get(key) : await SecureStore.getItemAsync(key, options);
  if (!raw) return null;
  const value = JSON.parse(raw);
  if (value.version !== 1 || !/^[a-f0-9]{64}$/.test(value.digest) ||
      !/^[a-f0-9]{64}$/.test(value.salt) || !Number.isInteger(value.failedAttempts) ||
      value.failedAttempts < 0 || value.failedAttempts > MAX_PIN_ATTEMPTS) {
    throw new Error("No pudimos leer tu PIN. Verifica tu contraseña para crear uno nuevo.");
  }
  return value;
}

async function write(uid, record) {
  const key = keyFor(uid);
  const value = JSON.stringify(record);
  if (Platform.OS === "web") webRecords.set(key, value);
  else await SecureStore.setItemAsync(key, value, options);
}

function serialize(uid, action) {
  const previous = pending.get(uid) || Promise.resolve();
  const next = previous.catch(() => {}).then(action);
  pending.set(uid, next);
  const clean = () => { if (pending.get(uid) === next) pending.delete(uid); };
  next.then(clean, clean);
  return next;
}

const digest = (salt, pin) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
function equalDigest(a, b) {
  let difference = a.length ^ b.length;
  for (let index = 0; index < a.length; index += 1) difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return difference === 0;
}

export const readPinRecord = (uid) => serialize(uid, () => read(uid));

export function savePin(uid, pin) {
  return serialize(uid, async () => {
    if (!uid || !isValidPin(pin)) throw new Error("El PIN debe tener exactamente 6 dígitos.");
    const bytes = await Crypto.getRandomBytesAsync(32);
    const salt = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    await write(uid, { version: 1, salt, digest: await digest(salt, pin), failedAttempts: 0 });
  });
}

export function verifyPin(uid, pin) {
  return serialize(uid, async () => {
    const record = await read(uid);
    if (!record) throw new Error("Primero debes configurar tu PIN.");
    if (record.failedAttempts >= MAX_PIN_ATTEMPTS) return { success: false, remainingAttempts: 0 };
    if (!isValidPin(pin)) throw new Error("Ingresa los 6 dígitos de tu PIN.");
    // Reserva el intento antes de comparar: cerrar la app no reinicia el contador.
    const failedAttempts = record.failedAttempts + 1;
    await write(uid, { ...record, failedAttempts });
    const success = equalDigest(await digest(record.salt, pin), record.digest);
    if (success) await write(uid, { ...record, failedAttempts: 0 });
    return { success, remainingAttempts: success ? MAX_PIN_ATTEMPTS : MAX_PIN_ATTEMPTS - failedAttempts };
  });
}

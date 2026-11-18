import { Directory, File, Paths } from "expo-file-system";
import { randomUUID } from "expo-crypto";
import { getStoredJson, setStoredJson, storageKeys } from "./storage";

export const demoMovement = { id: "apf3-demo", title: "Transferencia de prueba", amount: "25.50 PEN" };
let receiptWork = Promise.resolve();

const storageKey = (uid) => `${storageKeys.demoReceipt}/${uid}/${demoMovement.id}`;
const directory = (uid) => new Directory(Paths.document, "receipts", encodeURIComponent(uid));

function receiptFile(uid, name) {
  return typeof name === "string" && /^[a-f0-9-]{36}\.jpg$/.test(name)
    ? new File(directory(uid), name)
    : null;
}

export async function readDemoReceipt(uid) {
  await receiptWork;
  const file = receiptFile(uid, await getStoredJson(storageKey(uid)));
  return file?.exists ? file.uri : null;
}

function tryDelete(file) {
  try {
    if (file?.exists) file.delete();
  } catch (error) {
    console.warn("No se pudo limpiar una foto de comprobante", error.message);
  }
}

export function saveDemoReceipt(uid, sourceUri) {
  const work = receiptWork.then(() => copyReceipt(uid, sourceUri));
  receiptWork = work.catch(() => {});
  return work;
}

async function copyReceipt(uid, sourceUri) {
  const folder = directory(uid);
  folder.create({ intermediates: true, idempotent: true });
  const name = `${randomUUID()}.jpg`;
  const destination = new File(folder, name);
  const previous = receiptFile(uid, await getStoredJson(storageKey(uid)));
  try {
    await new File(sourceUri).copy(destination);
    if (!(await setStoredJson(storageKey(uid), name))) throw new Error("No se pudo guardar la referencia.");
  } catch (error) {
    tryDelete(destination);
    throw error;
  }
  tryDelete(previous);
  return destination.uri;
}

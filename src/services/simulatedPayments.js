import { getStoredJson, setStoredJson, storageKeys } from "./storage";

const keyFor = (uid) => `${storageKeys.simulatedPayments}/${uid}`;
let pendingWrite = Promise.resolve();
const initialBalanceCents = 184050;

export function formatPaymentAmount({ amountCents, currency }) {
  const symbol = currency === "PEN" ? "S/" : "US$";
  return `${symbol} ${(amountCents / 100).toFixed(2)}`;
}

export function getSimulatedBalanceCents(payments) {
  return payments.reduce((balance, payment) => balance +
    (Number.isSafeInteger(payment.balanceDeltaCents) ? payment.balanceDeltaCents : 0), initialBalanceCents);
}

async function readPayments(uid) {
  try {
    const payments = await getStoredJson(keyFor(uid), [], { throwOnError: true });
    if (Array.isArray(payments)) return payments;
  } catch {
    // Never overwrite the history when storage cannot be read.
  }
  throw new Error("No pudimos leer el historial de simulaciones. Puedes reintentar.");
}

export async function loadSimulatedPayments(uid) {
  await pendingWrite;
  return readPayments(uid);
}

export function saveSimulatedPayment(uid, operationId, payment) {
  const write = pendingWrite.then(async () => {
    const previous = await readPayments(uid);
    const existing = previous.find((item) => item.id === operationId);
    if (existing) return { receipt: existing, payments: previous, created: false };

    const isIncoming = payment.direction === "credit";
    const balanceBeforeCents = getSimulatedBalanceCents(previous);
    const balanceDeltaCents = payment.currency === "PEN"
      ? (isIncoming ? payment.amountCents : -payment.amountCents)
      : 0;
    const balanceAfterCents = balanceBeforeCents + balanceDeltaCents;
    if (balanceAfterCents < 0) throw new Error("Saldo simulado insuficiente para este pago.");

    const confirmedAt = new Date();
    const receipt = {
      id: operationId,
      title: payment.recipient,
      date: new Intl.DateTimeFormat("es-PE", {
        dateStyle: "short", timeStyle: "short", timeZone: "America/Lima",
      }).format(confirmedAt),
      confirmedAt: confirmedAt.toISOString(),
      amount: `${isIncoming ? "+" : "-"} ${formatPaymentAmount(payment)}`,
      amountCents: payment.amountCents,
      currency: payment.currency,
      type: isIncoming ? "income" : "expense",
      icon: isIncoming ? "download" : "file",
      simulation: true,
      balanceDeltaCents,
      balanceAfterCents,
    };
    const payments = [receipt, ...previous];
    if (!(await setStoredJson(keyFor(uid), payments))) {
      throw new Error("No pudimos guardar la simulación. Puedes reintentar.");
    }
    return { receipt, payments, created: true };
  });
  pendingWrite = write.catch(() => {});
  return write;
}

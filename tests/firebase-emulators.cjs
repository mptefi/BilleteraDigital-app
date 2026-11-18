const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { initializeApp, deleteApp } = require("firebase/app");
const { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, sendPasswordResetEmail } = require("firebase/auth");
const load = require("./load-module.cjs");

const projectId = "demo-altoque";
const app = initializeApp({ apiKey: "demo-api-key", projectId });
const auth = getAuth(app);
const authUrl = "http://127.0.0.1:9099";
connectAuthEmulator(auth, authUrl);
const endpoint = `http://127.0.0.1:5001/${projectId}/us-central1/api/qr/validate`;
const valid = { type: "altoque.demo", v: 1, recipient: "Cafetería Demo", amountCents: 1250, currency: "PEN" };

async function request(label, token, qr, expectedStatus, expectedBody) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
    body: JSON.stringify({ qr: JSON.stringify(qr), uid: "ignorar-uid-cliente" }),
    signal: AbortSignal.timeout(10000),
  });
  const body = await response.json();
  assert.equal(response.status, expectedStatus, label);
  assert.deepEqual(body, expectedBody, label);
  console.log(`${label}: HTTP ${response.status} ${body.code || "simulation=true, UID de Firebase verificado"}`);
}

async function main() {
  const email = `apf3-${randomUUID()}@example.test`;
  const { user } = await createUserWithEmailAndPassword(auth, email, "Demo-APF3-2026!");
  const token = await user.getIdToken();
  const { validateQrWithSession } = load("src/services/qrApi.js", {
    "../config/firebase": { auth },
    "../../functions/qr": require("../functions/qr"),
  }, {
    __DEV__: true,
    process: { env: { EXPO_PUBLIC_ALTOQUE_API_URL: endpoint.replace(/\/qr\/validate$/, "") } },
  });
  const fromApp = await validateQrWithSession(JSON.stringify(valid));
  assert.equal(fromApp.uid, user.uid);
  assert.equal(fromApp.simulation, true);
  console.log("Servicio móvil qrApi.js: respuesta 200 real con el token del usuario.");
  await request("Token válido", token, valid, 200, {
    recipient: valid.recipient, amountCents: 1250, currency: "PEN", uid: user.uid, simulation: true,
  });
  const incoming = { ...valid, recipient: "María Demo", direction: "credit" };
  await request("Transferencia entrante", token, incoming, 200, {
    recipient: incoming.recipient, amountCents: 1250, currency: "PEN", direction: "credit", uid: user.uid, simulation: true,
  });
  await request("Token ausente", null, valid, 401, { code: "token_required" });
  await request("Token inválido", "invalid-test-token", valid, 401, { code: "invalid_token" });
  await request("QR inválido", token, { ...valid, amountCents: -1250 }, 400, { code: "invalid_qr" });
  await sendPasswordResetEmail(auth, email);
  const emails = await fetch(`${authUrl}/emulator/v1/projects/${projectId}/oobCodes`, { signal: AbortSignal.timeout(10000) });
  assert.ok(emails.ok);
  const { oobCodes } = await emails.json();
  assert.ok(oobCodes.some((code) => code.email === email && code.requestType === "PASSWORD_RESET"));
  console.log("Recuperación: Firebase Auth Emulator generó un código PASSWORD_RESET.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => deleteApp(app));

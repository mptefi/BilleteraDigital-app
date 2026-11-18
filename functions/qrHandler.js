const { parseDemoQr } = require("./qr");

const tokenErrors = new Set([
  "auth/argument-error", "auth/invalid-argument", "auth/id-token-expired",
  "auth/id-token-revoked", "auth/invalid-id-token", "auth/user-disabled",
]);

async function qrHandler(req, res, verifyIdToken, reportError) {
  res.set("Cache-Control", "no-store");
  if (req.path !== "/qr/validate") return res.status(404).json({ code: "not_found" });
  if (req.method !== "POST") return res.set("Allow", "POST").status(405).json({ code: "method_not_allowed" });

  const match = /^Bearer (\S+)$/i.exec(req.get("Authorization") || "");
  if (!match) return res.status(401).json({ code: "token_required" });
  try {
    const { uid } = await verifyIdToken(match[1]);
    const qr = parseDemoQr(req.body?.qr);
    if (!qr) return res.status(400).json({ code: "invalid_qr" });
    return res.json({ ...qr, uid, simulation: true });
  } catch (error) {
    if (tokenErrors.has(error.code)) return res.status(401).json({ code: "invalid_token" });
    reportError("QR validation failed", { code: error.code });
    return res.status(500).json({ code: "server_error" });
  }
}

module.exports = { qrHandler };

const { getDefaultConfig } = require("expo/metro-config");
const { createRequire } = require("node:module");
const { resolve } = require("node:path");
const { qrHandler } = require("./functions/qrHandler");

const config = getDefaultConfig(__dirname);

if (process.env.EXPO_PUBLIC_ALTOQUE_METRO_API === "1") {
  const requireFunctions = createRequire(resolve(__dirname, "functions/package.json"));
  const { initializeApp } = requireFunctions("firebase-admin/app");
  const { getAuth } = requireFunctions("firebase-admin/auth");
  const admin = getAuth(initializeApp({ projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "al-toque-808de" }, "metro-qr"));
  const enhance = config.server.enhanceMiddleware;

  config.server.enhanceMiddleware = (middleware, server) => {
    const fallback = enhance ? enhance(middleware, server) : middleware;
    return (req, res, next) => {
      if (req.url?.split("?")[0] !== "/altoque-api/qr/validate") return fallback(req, res, next);
      validateQr(req, res, admin).catch((error) => {
        console.error("Error en la validación QR de Metro", error.code);
        if (!res.headersSent) writeJson(res, 500, { code: "server_error" });
      });
    };
  };
}

function writeJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function validateQr(req, res, admin) {
  let body;
  if (req.method === "POST") {
    const chunks = [];
    let bytes = 0;
    for await (const chunk of req) {
      bytes += chunk.length;
      if (bytes > 4096) {
        writeJson(res, 400, { code: "invalid_qr" });
        return;
      }
      chunks.push(chunk);
    }
    try {
      body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      writeJson(res, 400, { code: "invalid_qr" });
      return;
    }
  }

  const response = {
    set(name, value) { res.setHeader(name, value); return this; },
    status(status) { res.statusCode = status; return this; },
    json(payload) { writeJson(res, res.statusCode, payload); },
  };
  await qrHandler({ method: req.method, path: "/qr/validate", body, get: (name) => req.headers[name.toLowerCase()] },
    response, (token) => admin.verifyIdToken(token), console.error);
}

module.exports = config;

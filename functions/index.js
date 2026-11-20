const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { onRequest } = require("firebase-functions/v2/https");
const { error } = require("firebase-functions/logger");
const { qrHandler } = require("./qrHandler");

initializeApp();

exports.api = onRequest({ cors: true }, (req, res) =>
  qrHandler(req, res, (token) => getAuth().verifyIdToken(token), error)
);

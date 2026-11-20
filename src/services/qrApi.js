import axios from "axios";
import { getBundleOrigin } from "expo/internal/bundle-origin";
import { parseDemoQr } from "../../functions/qr";
import { auth } from "../config/firebase";

export { parseDemoQr };

export async function validateQrWithSession(raw, signal) {
  const user = auth.currentUser;
  if (!user) throw new Error("Inicia sesión para validar el QR.");
  const qr = parseDemoQr(raw);
  if (!qr) throw new Error("QR inválido. Usa un QR de prueba Al Toque.");

  const configuredUrl = process.env.EXPO_PUBLIC_ALTOQUE_API_URL?.trim().replace(/\/+$/, "");
  const metroOrigin = __DEV__ && process.env.EXPO_PUBLIC_ALTOQUE_METRO_API === "1"
    ? getBundleOrigin()
    : null;
  const baseUrl = configuredUrl || (metroOrigin && `${metroOrigin}/altoque-api`);
  if (!baseUrl || !/^https?:\/\/[^/\s?#]+(?:\/[^\s?#]*)?$/i.test(baseUrl) ||
      (!__DEV__ && !/^https:\/\//i.test(baseUrl))) {
    throw new Error("Falta una URL válida para la API de Al Toque.");
  }
  const endpoint = baseUrl.endsWith("/qr/validate") ? baseUrl : `${baseUrl}/qr/validate`;

  try {
    const token = await user.getIdToken();
    const { data } = await axios.post(
      endpoint,
      { qr: raw },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 8000, signal }
    );
    if (data?.simulation !== true || data.uid !== user.uid || auth.currentUser?.uid !== user.uid) {
      throw new Error("La sesión o la respuesta de validación cambió. Vuelve a escanear.");
    }
    if (data.recipient !== qr.recipient || data.amountCents !== qr.amountCents ||
        data.currency !== qr.currency || data.direction !== qr.direction) {
      throw new Error("Los datos de la API no coinciden con el QR escaneado.");
    }
    return { ...qr, uid: user.uid, simulation: true };
  } catch (error) {
    if (error.response?.status === 400) throw new Error("La API rechazó los datos del QR.");
    if (error.response?.status === 401 || error.code === "auth/user-token-expired") {
      throw new Error("Tu sesión no pudo validarse. Vuelve a iniciar sesión.");
    }
    if (error.response?.status === 404) throw new Error("La ruta de validación del QR no está disponible en la API.");
    if (error.code === "auth/network-request-failed" || (axios.isAxiosError(error) && !error.response)) {
      if (!configuredUrl && metroOrigin && axios.isAxiosError(error)) {
        throw new Error("No pudimos conectarnos con Expo para validar el QR. Comprueba que npm start siga abierto en la laptop.");
      }
      if (axios.isAxiosError(error) && __DEV__ && /^http:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2)(?=[:/]|$)/i.test(baseUrl)) {
        throw new Error("No pudimos conectarnos a la API local. Comprueba que Firebase Functions esté en ejecución y que Android tenga acceso al puerto.");
      }
      throw new Error("No pudimos conectarnos a la API. Comprueba la conexión y reintenta.");
    }
    if (error.response) throw new Error("La API no pudo validar el QR. Inténtalo de nuevo.");
    throw error;
  }
}

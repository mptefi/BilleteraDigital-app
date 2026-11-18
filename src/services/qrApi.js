import axios from "axios";
import { parseDemoQr } from "../../functions/qr";
import { auth } from "../config/firebase";

export { parseDemoQr };

export async function validateQrWithSession(raw, signal) {
  const user = auth.currentUser;
  if (!user) throw new Error("Inicia sesión para validar el QR.");
  const baseUrl = process.env.EXPO_PUBLIC_ALTOQUE_API_URL?.trim().replace(/\/$/, "");
  if (!baseUrl || (!__DEV__ && !baseUrl.startsWith("https://"))) {
    throw new Error("Configura la URL de la API de Al Toque para validar el QR.");
  }

  try {
    const token = await user.getIdToken();
    const { data } = await axios.post(
      `${baseUrl}/qr/validate`,
      { qr: raw },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 8000, signal }
    );
    if (data?.simulation !== true || data.uid !== user.uid || auth.currentUser?.uid !== user.uid) {
      throw new Error("La sesión o la respuesta de validación cambió. Vuelve a escanear.");
    }
    return data;
  } catch (error) {
    if (error.response?.status === 400) throw new Error("La API rechazó los datos del QR.");
    if (error.response?.status === 401 || error.code === "auth/user-token-expired") {
      throw new Error("Tu sesión no pudo validarse. Vuelve a iniciar sesión.");
    }
    if (error.code === "auth/network-request-failed" || (axios.isAxiosError(error) && !error.response)) {
      throw new Error("No pudimos conectarnos a la API. Comprueba la conexión y reintenta.");
    }
    if (error.response) throw new Error("La API no pudo validar el QR. Inténtalo de nuevo.");
    throw error;
  }
}

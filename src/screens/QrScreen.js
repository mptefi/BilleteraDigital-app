import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { randomUUID } from "expo-crypto";
import { useAuth } from "../context/AuthContext";
import FeatureScreen, { FeatureButton, FeatureStatus, featureStyles } from "../components/FeatureScreen";
import CameraPanel, { useCameraAccess } from "../components/CameraPanel";
import { parseDemoQr, validateQrWithSession } from "../services/qrApi";
import { formatPaymentAmount } from "../services/simulatedPayments";
import { COLORS } from "../theme/colors";

export default function QrScreen({ onBack, onOpenHistory }) {
  const { confirmQrPayment, showBalance } = useAuth();
  const access = useCameraAccess();
  const [scan, setScan] = useState(null);
  const [payment, setPayment] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const scanLocked = useRef(false);
  const confirmationLocked = useRef(false);
  const request = useRef(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      request.current?.abort();
    };
  }, []);

  const validate = async (raw) => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError("");
    try {
      const result = await validateQrWithSession(raw, controller.signal);
      if (!controller.signal.aborted) setPayment({ ...result, operationId: `SIM-${randomUUID()}` });
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure.message);
    } finally {
      request.current = null;
      if (!controller.signal.aborted) setBusy(false);
    }
  };

  const onScan = ({ data }) => {
    if (scanLocked.current) return;
    scanLocked.current = true;
    if (!parseDemoQr(data)) {
      setError("QR inválido. Usa un QR de prueba Al Toque con un monto y una moneda admitidos.");
      return;
    }
    setScan(data);
    validate(data);
  };

  const confirm = async () => {
    if (confirmationLocked.current) return;
    confirmationLocked.current = true;
    setSaving(true);
    setError("");
    try {
      const result = await confirmQrPayment(payment.operationId, payment);
      if (mounted.current) setReceipt(result);
    } catch (failure) {
      confirmationLocked.current = false;
      if (mounted.current) setError(failure.message);
    } finally {
      if (mounted.current) setSaving(false);
    }
  };

  const reset = () => {
    if (confirmationLocked.current && !receipt) return;
    setScan(null);
    setPayment(null);
    setReceipt(null);
    setError("");
    scanLocked.current = false;
    confirmationLocked.current = false;
  };

  return (
    <FeatureScreen title={receipt ? "Comprobante" : payment ? "Revisa la operación" : "Escanear QR"} onBack={onBack}>
      {!scan && !error && (
        <>
          <View style={styles.intro}>
            <Text accessibilityRole="header" style={styles.headline}>Paga o recibe con QR</Text>
            <Text style={styles.introText}>Usa un QR de prueba de Al Toque para simular un pago o recibir una transferencia.</Text>
          </View>
          <CameraPanel access={access} reason="Al Toque usa la cámara para leer el código QR." onScan={onScan} />
        </>
      )}
      {busy && (
        <FeatureStatus loadingLabel="Validando código QR" title="Validando el QR" message="Consultando la operación con el servidor." />
      )}
      {!!error && <FeatureStatus icon="alert-circle" tone="error" title={payment ? "Revisa la operación" : "No pudimos validar el QR"} message={error} />}
      {!!error && !payment && scan && <FeatureButton icon="refresh-cw" label="Reintentar validación" onPress={() => validate(scan)} />}
      {payment && !receipt && (
        <>
          <View style={styles.ticket}>
            <AmountHeader
              icon={payment.direction === "credit" ? "arrow-down-left" : "arrow-up-right"}
              title={payment.direction === "credit" ? "Transferencia recibida simulada" : "Resumen del pago simulado"}
              amount={formatPaymentAmount(payment)}
              currency={payment.currency}
            />
            <View style={styles.details}>
              <Detail label={payment.direction === "credit" ? "Enviado por" : "Comercio"} value={payment.recipient} />
            </View>
          </View>
          <FeatureButton icon="check" label={saving ? "Guardando…" : "Confirmar simulación"} onPress={confirm} disabled={saving} />
          <FeatureButton secondary label="Cancelar" onPress={reset} disabled={saving} />
        </>
      )}
      {receipt && (
        <>
          <View style={styles.ticket}>
            <AmountHeader icon="check" title="Simulación completada" amount={receipt.amount} currency={receipt.currency} success />
            <View style={styles.details}>
              <Detail label={receipt.type === "income" ? "Enviado por" : "Comercio"} value={receipt.title} />
              <Detail label="Fecha · Lima" value={receipt.date} />
              <Detail label="N.º de operación" value={receipt.id} selectable />
            </View>
          </View>
          {showBalance && receipt.balanceDeltaCents !== 0 && (
            <FeatureStatus icon="credit-card" title="Saldo simulado" message={formatPaymentAmount({ amountCents: receipt.balanceAfterCents, currency: "PEN" })} />
          )}
          <FeatureButton icon="list" label="Ver movimientos" onPress={onOpenHistory} />
        </>
      )}
      {((error && !payment) || receipt) && <FeatureButton secondary icon="camera" label="Volver a escanear" onPress={reset} />}
    </FeatureScreen>
  );
}

function AmountHeader({ icon, title, amount, currency, success }) {
  return (
    <View style={[styles.amountHeader, success && styles.amountHeaderSuccess]}>
      <View style={styles.amountIcon}>
        <Feather name={icon} size={24} color={success ? "#12604A" : "#854000"} />
      </View>
      <Text accessibilityRole="header" accessibilityLiveRegion={success ? "polite" : undefined} style={styles.amountTitle}>{title}</Text>
      <Text style={styles.amount}>{amount}</Text>
      <Text style={styles.currency}>{currency}</Text>
    </View>
  );
}

function Detail({ label, value, selectable }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text selectable={selectable} style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { paddingVertical: 4, gap: 8 },
  headline: { color: COLORS.textPrimary, fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  introText: { color: COLORS.textSecondary, fontSize: 15, lineHeight: 22 },
  ticket: { ...featureStyles.card, padding: 0, gap: 0, overflow: "hidden" },
  amountHeader: { alignItems: "center", backgroundColor: "#FFF0DF", padding: 20, gap: 6 },
  amountHeaderSuccess: { backgroundColor: "#E9F5EF" },
  amountIcon: { width: 48, height: 48, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.white, marginBottom: 4 },
  amountTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: "700", textAlign: "center" },
  amount: { color: COLORS.textPrimary, fontSize: 36, fontWeight: "800", fontVariant: ["tabular-nums"], textAlign: "center" },
  currency: { color: COLORS.textSecondary, fontSize: 13, fontWeight: "700", letterSpacing: 0.6 },
  details: { padding: 16, gap: 12 },
  detail: { gap: 4 },
  detailLabel: { color: COLORS.textSecondary, fontSize: 13 },
  detailValue: { color: COLORS.textPrimary, fontSize: 16, fontWeight: "600" },
});

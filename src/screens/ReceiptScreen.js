import React, { useEffect, useRef, useState } from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import CameraPanel, { useCameraAccess } from "../components/CameraPanel";
import FeatureScreen, { FeatureButton, FeatureStatus, featureStyles } from "../components/FeatureScreen";
import { demoMovement, readDemoReceipt, saveDemoReceipt } from "../services/demoReceipt";
import { COLORS } from "../theme/colors";

export default function ReceiptScreen({ uid, onBack }) {
  const access = useCameraAccess();
  const [saved, setSaved] = useState(null);
  const [loading, setLoading] = useState(Platform.OS !== "web");
  const [capturing, setCapturing] = useState(false);
  const [ready, setReady] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const camera = useRef(null);
  const pending = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    if (Platform.OS !== "web") {
      readDemoReceipt(uid).then((uri) => {
        if (mounted.current) setSaved(uri);
      }).catch(() => {
        if (mounted.current) setNotice({ text: "No pudimos abrir el comprobante guardado." });
      }).finally(() => {
        if (mounted.current) setLoading(false);
      });
    }
    return () => { mounted.current = false; };
  }, [uid]);

  const takePicture = async () => {
    if (!ready || !camera.current || pending.current) return;
    pending.current = true;
    setBusy(true);
    setNotice(null);
    try {
      const result = await camera.current.takePictureAsync({ quality: 0.7 });
      if (!result?.uri) throw new Error();
      if (mounted.current) setPhoto(result.uri);
    } catch {
      if (mounted.current) setNotice({ text: "No pudimos tomar la foto. Inténtalo de nuevo." });
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const save = async () => {
    if (!photo || pending.current) return;
    pending.current = true;
    setBusy(true);
    setNotice("");
    try {
      const uri = await saveDemoReceipt(uid, photo);
      if (mounted.current) {
        setSaved(uri);
        setPhoto(null);
        setCapturing(false);
        setNotice({ text: "Comprobante guardado en este dispositivo.", success: true });
      }
    } catch {
      if (mounted.current) setNotice({ text: "No pudimos guardar el comprobante. Puedes reintentar." });
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const openCamera = () => {
    setReady(false);
    setPhoto(null);
    setNotice(null);
    setCapturing(true);
  };

  return (
    <FeatureScreen title="Comprobante" onBack={onBack}>
      <View style={styles.movement}>
        <View style={styles.movementIcon}><Feather name="file-text" size={24} color="#854000" /></View>
        <View style={styles.movementText}>
          <Text style={styles.movementLabel}>Movimiento de demostración</Text>
          <Text accessibilityRole="header" style={featureStyles.label}>{demoMovement.title}</Text>
          <Text style={styles.amount}>{demoMovement.amount}</Text>
        </View>
      </View>
      {notice && <FeatureStatus icon={notice.success ? "check-circle" : "alert-circle"} tone={notice.success ? "success" : "error"} message={notice.text} />}
      {Platform.OS === "web" && <FeatureStatus icon="smartphone" message="Abre Al Toque en Android o iOS para adjuntar una foto." />}
      {loading && <FeatureStatus title="Buscando comprobante" loadingLabel="Buscando comprobante guardado" />}
      {capturing ? (
        photo ? (
          <>
            <ReceiptPhoto uri={photo} title="Vista previa del comprobante" />
            <FeatureButton icon="check" label={busy ? "Guardando…" : "Guardar comprobante"} onPress={save} disabled={busy} />
            <FeatureButton secondary icon="refresh-cw" label="Repetir foto" onPress={openCamera} disabled={busy} />
          </>
        ) : (
          <>
            <CameraPanel access={access} reason="Al Toque usa la cámara para fotografiar el comprobante." cameraRef={camera} onReady={setReady} />
            {access.permission?.granted && ready && <FeatureButton icon="camera" label={busy ? "Capturando…" : "Tomar foto"} onPress={takePicture} disabled={busy} />}
          </>
        )
      ) : !loading && Platform.OS !== "web" && (
        <>
          {saved
            ? <ReceiptPhoto uri={saved} title="Comprobante guardado" />
            : <FeatureStatus icon="image" title="Adjunta una foto" message="Toma una foto del comprobante para consultarlo desde este movimiento." />}
          <FeatureButton icon="camera" label={saved ? "Reemplazar foto" : "Abrir cámara"} onPress={openCamera} />
        </>
      )}
    </FeatureScreen>
  );
}

function ReceiptPhoto({ uri, title }) {
  return (
    <View style={featureStyles.card}>
      <Text accessibilityRole="header" style={featureStyles.label}>{title}</Text>
      <Image source={{ uri }} accessibilityLabel={title} style={featureStyles.preview} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  movement: { flexDirection: "row", alignItems: "flex-start", gap: 14, padding: 18, borderRadius: 22, backgroundColor: "#FFF0DF" },
  movementIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.white },
  movementText: { flex: 1, gap: 5 },
  movementLabel: { color: "#854000", fontSize: 13, fontWeight: "600" },
  amount: { color: COLORS.textPrimary, fontSize: 29, fontWeight: "800", fontVariant: ["tabular-nums"] },
});

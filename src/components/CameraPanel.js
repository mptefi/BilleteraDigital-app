import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { CameraView, Camera } from "expo-camera";
import useFeaturePermission from "../hooks/useFeaturePermission";
import FeaturePermission from "./FeaturePermission";
import { FeatureButton, FeatureStatus, featureStyles } from "./FeatureScreen";
import { COLORS } from "../theme/colors";

export function useCameraAccess() {
  return useFeaturePermission(Camera.getCameraPermissionsAsync, Camera.requestCameraPermissionsAsync);
}

export default function CameraPanel({ access, reason, cameraRef, onScan, onReady }) {
  const [failed, setFailed] = useState(false);
  if (!access.permission?.granted) {
    if (!access.permission && !access.error) return <FeatureStatus title="Preparando la cámara" loadingLabel="Consultando permiso de cámara" />;
    return <FeaturePermission value={access} reason={reason} />;
  }
  if (failed) {
    return (
      <>
        <FeatureStatus icon="alert-circle" tone="error" title="No pudimos iniciar la cámara." />
        <FeatureButton icon="refresh-cw" label="Reintentar cámara" onPress={() => setFailed(false)} />
      </>
    );
  }

  return (
    <View style={featureStyles.preview}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={onScan ? { barcodeTypes: ["qr"] } : undefined}
        onBarcodeScanned={onScan}
        onCameraReady={() => onReady?.(true)}
        onMountError={() => {
          onReady?.(false);
          setFailed(true);
        }}
      />
      <View pointerEvents="none" style={styles.overlay}>
        <View style={[styles.guide, !onScan && styles.photoGuide]}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <View style={styles.hint}>
          <Text style={styles.hintText}>{onScan ? "Coloca el QR dentro del marco" : "Centra el comprobante"}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", paddingBottom: 48 },
  guide: { width: "58%", maxWidth: 210, aspectRatio: 1 },
  photoGuide: { width: "74%", maxWidth: 245, aspectRatio: 1.3 },
  corner: { position: "absolute", width: 25, height: 25, borderColor: "#FFD19F" },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 10 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 10 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 10 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 10 },
  hint: { position: "absolute", bottom: 12, left: 12, right: 12, borderRadius: 12, padding: 8, backgroundColor: "rgba(28, 21, 16, 0.88)" },
  hintText: { fontSize: 14, fontWeight: "600", color: COLORS.white, textAlign: "center" },
});

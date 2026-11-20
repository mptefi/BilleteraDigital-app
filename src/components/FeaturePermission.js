import React, { useRef, useState } from "react";
import { View } from "react-native";
import AppModal from "./AppModal";
import { FeatureButton, FeatureStatus, featureStyles } from "./FeatureScreen";

export default function FeaturePermission({
  value,
  reason,
  icon = "camera",
  title = "Acceso a la cámara",
  buttonLabel = "Permitir cámara",
  dialogTitle = "Permite el acceso a la cámara",
  deniedMessage = "No se otorgó el permiso de cámara.",
  blockedMessage,
  onOpenSettings,
}) {
  const [visible, setVisible] = useState(false);
  const confirming = useRef(false);
  const { busy, allow, error, denied } = value;
  const close = () => setVisible(false);
  return (
    <View style={featureStyles.card}>
      <FeatureStatus icon={icon} title={title} message={reason} />
      {onOpenSettings
        ? <FeatureStatus icon="info" message={blockedMessage} />
        : denied && <FeatureStatus icon="alert-circle" tone="error" message={deniedMessage} />}
      {!!error && <FeatureStatus icon="alert-circle" tone="error" message={error} />}
      <FeatureButton
        label={onOpenSettings ? "Abrir Ajustes" : buttonLabel}
        icon={onOpenSettings ? "settings" : icon}
        disabled={busy}
        onPress={onOpenSettings || (() => setVisible(true))}
      />
      <AppModal
        visible={visible}
        icon={icon}
        title={dialogTitle}
        message={reason}
        primaryLabel="Permitir"
        secondaryLabel="Ahora no"
        onPrimary={async () => {
          if (confirming.current) return;
          confirming.current = true;
          try {
            await allow();
          } finally {
            confirming.current = false;
            close();
          }
        }}
        onSecondary={close}
        onClose={close}
      />
    </View>
  );
}

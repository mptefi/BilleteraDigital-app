import React, { useState } from "react";
import { View } from "react-native";
import AppModal from "./AppModal";
import { FeatureButton, FeatureStatus, featureStyles } from "./FeatureScreen";

export default function FeaturePermission({ value, reason }) {
  const [visible, setVisible] = useState(false);
  const { permission, busy, allow, error } = value;
  const needsSettings = permission?.canAskAgain === false;
  const close = () => setVisible(false);
  return (
    <View style={featureStyles.card}>
      <FeatureStatus icon="camera" title="Acceso a la cámara" message={reason} />
      {!!error && <FeatureStatus icon="alert-circle" tone="error" message={error} />}
      <FeatureButton label={needsSettings ? "Abrir Ajustes" : "Permitir cámara"} icon="camera" disabled={busy} onPress={() => setVisible(true)} />
      <AppModal
        visible={visible}
        icon="camera"
        title="Permite el acceso a la cámara"
        message={needsSettings ? "En Ajustes, activa Cámara para Al Toque." : reason}
        primaryLabel={needsSettings ? "Abrir Ajustes" : "Permitir"}
        secondaryLabel="Ahora no"
        onPrimary={() => { close(); allow(); }}
        onSecondary={close}
        onClose={close}
      />
    </View>
  );
}

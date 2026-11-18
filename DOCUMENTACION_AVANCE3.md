# Documentación del Avance 3 · Funciones nativas y API autenticada

## 1. Resumen

El Avance de Proyecto Final 3 integra la cámara, el acelerómetro y las notificaciones locales en Al Toque. La demostración principal escanea un QR, valida sus datos en una API protegida por Firebase Auth y permite confirmar un pago simulado. El historial incorpora un movimiento de prueba con comprobante fotográfico y se puede abrir mediante una sacudida o al tocar un recordatorio.

La app reutiliza el inicio de sesión, la recuperación y el bloqueo por PIN del APF2. También conserva las preferencias y movimientos de AsyncStorage, los filtros, el centro de ayuda, AppModal y la consulta de tipos de cambio desde PEN con caché, actualización y reintento.

## 2. Dependencias agregadas

La app usa Expo **58.0.26**, React Native **0.88.1** y React **19.3.0**. Se instalaron las dependencias nativas con `npx expo install`.

| Dependencia instalada | Versión | Uso |
| --- | --- | --- |
| `expo-camera` | 58.0.14 | `CameraView`, escaneo QR y captura |
| `expo-sensors` | 58.0.5 | Acelerómetro |
| `expo-notifications` | 58.1.9 | Permisos, canal Android, recordatorios y prueba push |
| `expo-file-system` | 58.0.14 | Copia de comprobantes a la carpeta privada de la app |
| `expo-constants` | 58.0.16 | Configuración de EAS y detección de Expo Go |
| `expo-device` | 58.0.5 | Diagnóstico de la prueba push en dispositivo o emulador |
| `expo-dev-client` | 58.0.21 | Compilación de desarrollo |
| `firebase-admin` / `firebase-functions` | 14.5.1 / 7.4.0 | Verificación del ID token y endpoint de Functions |

La implementación toma los conceptos de los laboratorios de cámara, sensores, permisos y notificaciones. Las versiones y APIs corresponden al SDK 58 del repositorio. [Referencia de Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/)

## 3. Archivos y pantallas nuevas

| Pantalla | Cómo entrar | Qué permite hacer |
| --- | --- | --- |
| **Escanear QR** · `src/screens/QrScreen.js` | Inicio → QR | Autorizar la cámara, escanear, revisar comercio, importe y moneda, confirmar la simulación o cancelar. Muestra un comprobante tras guardar el movimiento. |
| **Comprobante** · `src/screens/ReceiptScreen.js` | Movimientos → Transferencia de prueba · Comprobante | Abrir la cámara, tomar y previsualizar una foto, repetirla, guardarla y recuperar el comprobante al volver. |
| **Notificaciones** · `src/screens/RemindersScreen.js` | Inicio → campana | Autorizar avisos desde el modal de la app y consultar pagos, transferencias, promos y seguridad. **Recordatorios y pruebas** agrupa los avisos programados y la prueba push. |
| **Historial de movimientos** · vista de `src/screens/HomeScreen.js` | Barra inferior → Movimientos, Ver todo, sacudida o toque en un aviso | Consultar y filtrar los movimientos del APF2, cambiar el ajuste del acelerómetro y acceder al comprobante de prueba. |

El escáner guía el encuadre del QR y presenta la validación y los errores en tarjetas de estado. Antes de confirmar, el resumen destaca el importe, la moneda y el comercio o remitente. Al guardar la simulación, el comprobante muestra el número de operación, la fecha y el saldo actualizado cuando corresponde.

El comprobante fotográfico distingue la vista previa de la foto guardada. El historial muestra el acceso al comprobante y el ajuste del acelerómetro debajo del encabezado. Cámara y notificaciones usan modales de Al Toque con una explicación y una opción para posponer el permiso. Si el sistema ya requiere habilitarlo desde Ajustes, el modal ofrece el acceso directo.

- `FeatureScreen`, `CameraPanel` y `FeaturePermission` reutilizan los estilos de Al Toque y comparten la cabecera, los botones, la vista previa y los estados de permisos.
- `useFeaturePermission` solicita permisos tras una acción del usuario y consulta su estado al volver a la app. `useShakeHistory` administra la preferencia y la suscripción al sensor. `useReminderNavigation` conserva el destino de un aviso hasta que la cuenta correspondiente se desbloquea.
- `qrApi.js` consume la API autenticada. `demoReceipt.js` guarda la fotografía y su referencia. `reminders.js` administra el canal, el registro local del recordatorio y la solicitud del token push.
- `functions/` contiene el backend, sus dependencias y el contrato QR que comparten el cliente y el servidor. `firebase.json` configura Auth Emulator y Functions Emulator. `app.config.js` carga la configuración opcional de EAS/FCM.
- `tests/apf3.test.cjs` cubre los flujos del APF3. `tests/firebase-emulators.cjs` prueba Firebase y el endpoint con solicitudes HTTP reales.

## 4. Archivos modificados

| Archivo | Cambio |
| --- | --- |
| `HomeScreen.js` | La campana y el botón QR abren sus pantallas. Movimientos muestra el historial con sus filtros y el ajuste del acelerómetro. |
| `AppNavigator.js` y `PinLoginScreen.js` | Integran las rutas con Firebase Auth y el estado del PIN. Al volver de Ajustes se puede recuperar la pantalla en la que se pidió el permiso. |
| `src/config/firebase.js` | Permite conectar Firebase Auth al emulador cuando se configura la URL en desarrollo. |
| `storage.js` | Define claves por usuario para la preferencia de sacudida, los comprobantes y los identificadores de recordatorio. |
| `app.json`, `package.json` y `package-lock.json` | Registran la configuración nativa, las dependencias y los comandos de prueba. El paquete Android de la demo es `com.altoque.wallet`. |

## 5. Funcionalidades agregadas

### Pago QR simulado

El QR contiene JSON con `type: "altoque.demo"`, `v: 1`, `recipient`, `amountCents` y `currency`. El campo opcional `direction` contiene `debit` para un pago o `credit` para una transferencia recibida. Los QR originales se interpretan como pagos. Se admiten `PEN` y `USD`, y montos enteros de 1 a 100000 centavos. Cada escaneo validado recibe un número de operación. La app serializa la escritura y reutiliza el comprobante si ese número ya figura en el historial local.

`src/services/simulatedPayments.js` guarda las operaciones en AsyncStorage por cuenta y calcula el saldo en centavos desde **S/ 1,840.50**. Los pagos confirmados en soles se restan y las transferencias recibidas se suman. El comprobante muestra el importe y el saldo resultante cuando está visible. Los importes en USD y las simulaciones anteriores conservan su efecto original sobre el saldo en soles. Consulta los [pasos de la demo](README.md#qr-para-exposición) para comprobar los cambios de saldo y su persistencia.

| QR de exposición | Resultado |
| --- | --- |
| [QR válido](assets/apf3/qr-valido.png) | Cafetería Demo, S/ 12.50 (PEN) |
| [QR de transferencia](assets/apf3/qr-transferencia.png) | María Demo, abono de S/ 12.50 (PEN) |
| [QR inválido](assets/apf3/qr-invalido.png) | El importe es negativo y la pantalla lo rechaza. |

### API REST autenticada

La app obtiene el ID token de la sesión de Firebase y lo envía a `POST /api/qr/validate`. Firebase Admin verifica el token, deriva el UID y valida los datos del QR. El PIN controla el acceso a la app como una capa local. [Verificación de ID tokens](https://firebase.google.com/docs/auth/admin/verify-id-tokens)

| Caso | Respuesta |
| --- | --- |
| Token válido y QR válido | `200` con destinatario, monto, moneda, UID verificado y `simulation: true` |
| Falta el token | `401 token_required` |
| Token inválido | `401 invalid_token` |
| QR inválido con token válido | `400 invalid_qr` |
| Error interno | `500 server_error` |

### Comprobantes, sensor y recordatorios

- El comprobante se copia a `Paths.document`. AsyncStorage guarda el nombre bajo el UID y el identificador del movimiento de prueba. Al reemplazarlo, el comprobante anterior se limpia una vez guardada la nueva referencia.
- El acceso por sacudida comienza apagado. Al activarlo, Inicio escucha el acelerómetro cada 100 ms con un umbral de 1,8 g y un intervalo de 1,6 s entre activaciones. La suscripción se libera al salir de Inicio, bloquear o pasar al segundo plano.
- Los avisos se crean en el canal `movements` en Android. Se guarda el identificador por cuenta para consultarlos y cancelarlos. El toque abre el historial tras desbloquear cuando corresponde.
- La cámara y las notificaciones explican por qué se solicita el acceso. El usuario puede solicitar de nuevo cuando el sistema lo admite o abrir Ajustes. Android puede pedir que se desbloquee Al Toque tras un diálogo del sistema.

La bandeja de notificaciones muestra la actividad QR simulada guardada por cuenta. Cada operación nueva genera un aviso local si se concedió el permiso. Los avisos de promos y movimientos inusuales se presentan como ejemplos y pueden enviarse con **Probar aviso**. Al tocar un aviso local, se abre su destino después de autenticar a la cuenta correspondiente.

## 6. Verificaciones realizadas

La primera validación del APF3 se realizó en SDK 57. Los resultados específicos de la migración se registran al final de esta sección.

| Evidencia | Resultado |
| --- | --- |
| `npm test` | 30 pruebas aprobadas. Incluye Firebase Auth, PIN, preferencias, QR, conexión, permisos, sensor, persistencia del comprobante y recordatorios. |
| `npm run test:emulators` | El servicio móvil obtuvo `200` con un token de Auth Emulator. Se verificaron los dos casos `401`, el caso `400` y la generación del enlace de recuperación. |
| Bundle Android | Hermes generó el bundle con `npx expo export --platform android --output-dir dist/apf3-android`. |
| APK Android | Gradle compiló el APK de depuración y se instaló en el AVD Pixel 5, Android 13. |
| Regresiones en el AVD | Inicio de sesión, PIN, persistencia de saldo oculto, filtrado de movimientos y tipos de cambio desde PEN. |
| UI en el AVD | Se revisaron las etiquetas y la navegación de Historial y Notificaciones en 1080 × 2340 a 440 dpi y 720 × 1280 a 320 dpi. |
| Acelerómetro en el AVD | Una lectura de aceleración simulada abrió el historial desde Inicio con el ajuste activado. |
| Permiso de cámara en el AVD | Se verificaron el rechazo, el acceso a Ajustes y el retorno después del PIN. |
| QR | Vista previa de la cámara verificada en el AVD. Las pruebas automatizadas cubrieron los eventos de QR válido e inválido, el bloqueo de lecturas duplicadas y la confirmación. La lectura óptica de los dos QR queda pendiente en un teléfono. |
| Comprobante en el AVD | Tras arrancar en frío el emulador, se verificaron la captura, la vista previa, la repetición, el guardado y la recuperación de la foto al reabrir la app. |
| Recordatorios en el AVD | Se programó y canceló un aviso de 24 horas. Se recibió el aviso de 5 segundos en segundo plano. Tocar el aviso llevó al historial tras el PIN. |
| Obtención del Expo Push Token | La pantalla informó que falta el `projectId`. Pendiente de proyecto EAS vinculado y configuración FCM. |
| Entrega push remota | Pendiente de un token verificado y la credencial FCM v1 en EAS. |
| Bandeja de notificaciones en SDK 58 | En Android se verificaron el modal de Al Toque, el permiso del sistema, las cuatro categorías, el filtro de Seguridad y la entrega de un aviso de prueba al sistema. Pasaron las 35 pruebas automatizadas, que incluyen un solo aviso por operación QR confirmada. |

### Migración de SDK 57 a SDK 58

Se alinearon Expo, React Native, React, los módulos nativos y `react-test-renderer`. Se retiró la propiedad `backgroundColor` de `StatusBar` y se configuraron iconos oscuros desde el arranque. El APK de desarrollo de SDK 57 se conservó como respaldo local en `dist/altoque-sdk57-debug.apk`. [Guía de migración a SDK 58](https://expo.dev/blog/how-to-upgrade-to-sdk-58)

En Windows, `app.config.js` configura CMake para acortar las rutas a archivos objeto que superan el límite admitido por Ninja. Expo aplica el ajuste al regenerar el proyecto Android. [Referencia de CMake](https://cmake.org/cmake/help/latest/variable/CMAKE_OBJECT_PATH_MAX.html)

| Comprobación en SDK 58 | Resultado |
| --- | --- |
| `npx expo install --check` y Expo Doctor | Dependencias alineadas y 20 de 20 comprobaciones aprobadas. |
| `npm test` | 30 pruebas aprobadas. |
| `npm run test:emulators` | Respuestas reales `200`, `400` y `401`. Firebase Auth generó el enlace de recuperación. |
| Bundle Android | Hermes generó el bundle en `dist/apf3-android-sdk58`. |
| APK Android de desarrollo | Gradle compiló el APK x86_64 desde Windows. Se instaló encima del APK de SDK 57 en el Pixel 5 virtual con Android 13. |
| Datos locales tras actualizar | Se restauró la sesión y el PIN existente desbloqueó la app. Se conservaron el saldo oculto, el ajuste de sacudida y el comprobante anterior, cuyo archivo conservó el mismo SHA-256. |
| Funciones nativas en SDK 58 | La cámara volvió a capturar una foto, el acelerómetro abrió el historial y se verificaron programación y cancelación del recordatorio. El aviso de 5 segundos llegó en segundo plano y abrió el historial tras el PIN. |

### Cierre del pago QR simulado

Se decodificaron los tres PNG. Firebase Emulator validó el cobro y la transferencia con HTTP `200` y rechazó el importe negativo con HTTP `400`. Las 33 pruebas cubren la cancelación, el doble toque, el saldo insuficiente, la persistencia por cuenta y la secuencia **S/ 1,840.50 → S/ 1,828.00 → S/ 1,840.50**. La compilación Hermes del bundle Android aprobó. Queda pendiente probar el flujo de saldo actualizado con la cámara de un teléfono.

## 7. Conceptos del curso cubiertos

- `CameraView`, `onBarcodeScanned`, `onCameraReady` y `takePictureAsync`.
- Acelerómetro en tres ejes, magnitud de la aceleración, umbral, intervalo y limpieza de suscripciones.
- Permisos en tiempo de ejecución, posibilidad de reintento, Ajustes y `AppState`.
- Canales de Android, programación y cancelación, respuestas a notificaciones y Expo Push Token.
- Firebase Auth, encabezado Bearer, verificación de JWT con Firebase Admin y respuestas HTTP.
- `useState`, `useEffect`, `useRef` y `useCallback` para el estado, el ciclo de vida de las funciones y las acciones de pantalla.
- AsyncStorage para referencias y preferencias, y FileSystem para archivos privados.

## 8. Rúbrica y exposición

El [README](README.md) reúne la preparación del emulador, las variables, los pasos de la demo, la tabla de los seis criterios de evaluación y el guion de cuatro minutos. Para la exposición sigue esta secuencia: ingreso y saldo, QR inválido y válido, comprobante, historial por sacudida y recordatorio que reabre el historial tras el PIN.

La evidencia de Firebase y las pruebas locales está en el repositorio. La verificación en Android se hizo en un AVD porque no había un dispositivo físico conectado. Para probar la lectura óptica en la exposición, abre los QR impresos o en otra pantalla. Para repetir el ensayo de sacudida en el development build, desactiva el gesto del menú de desarrollo de Expo si se abre al agitar.

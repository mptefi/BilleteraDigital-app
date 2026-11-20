# Al Toque · Avance de Proyecto Final 3

Billetera académica en React Native 0.88 y Expo SDK 58. El APF3 añade pagos QR simulados con validación autenticada, comprobantes privados, un acceso opcional al historial mediante el acelerómetro y recordatorios que llevan al historial.

El inventario de pantallas, archivos y conceptos del curso está en la [documentación del Avance 3](DOCUMENTACION_AVANCE3.md).

## Ejecutar la demo

Requiere Node.js 22.13 o posterior dentro de la versión 22, npm y un dispositivo o emulador Android. Desde PowerShell, instala las dependencias y compila el development build de Al Toque la primera vez o cuando cambie la configuración nativa.

```powershell
npm ci
Remove-Item Env:EXPO_PUBLIC_ALTOQUE_QR_PRESENTATION -ErrorAction SilentlyContinue
npx expo run:android --no-bundler
npm start -- --android
```

Si ya tienes instalado el development build de `com.altoque.wallet` con SDK 58, inicia con `npm start -- --android`. Esa app permite probar el diálogo de notificaciones de Al Toque en Android 13 o superior. Metro sirve tanto el proyecto como la ruta de validación de QR. El primer arranque instala las dependencias de Firebase Admin si faltan. Para una red que aísla los dispositivos, usa `npm start -- --tunnel`. El inicio de sesión y la validación de tokens requieren internet.

### Pruebas con Firebase Emulator Suite

```sh
npm ci
npm --prefix functions ci
npx firebase-tools@15.36.0 emulators:start --project demo-altoque --only auth,functions
```

En otra terminal, copia `.env.example` a `.env.local` y conserva el `.env` existente. En PowerShell, usa `Copy-Item .env.example .env.local` si aún no existe. Para un AVD, las dos URL del ejemplo apuntan a `10.0.2.2`, que llega a los puertos del PC. Para un Android conectado por USB, cambia ese host a `127.0.0.1` en ambas URL y ejecuta lo siguiente.

```sh
adb reverse tcp:9099 tcp:9099
adb reverse tcp:5001 tcp:5001
```

Conecta el dispositivo y ejecuta `npx expo run:android` para compilar e instalar el development build. Después, inicia Metro con `npx expo start --dev-client`. También puedes usar `npx expo start --go` con Expo Go SDK 58 para la cámara, el sensor y recordatorios locales, sujeto al hardware y a los permisos del dispositivo. Las notificaciones remotas en Android requieren un development build. [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/) · [Expo Notifications SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/notifications/)

Si tienes el APK del Avance 3 compilado con SDK 57, recompila el development build con SDK 58. Mantén instalada la app anterior para que Android pueda actualizarla y conservar sus datos locales.

Registra una cuenta ficticia desde la app, por ejemplo `demo-apf3@example.test`. Usa una contraseña de prueba y elige un PIN de seis dígitos. Auth Emulator reinicia sus usuarios al detenerse si se ejecuta sin importación o exportación. Para probar la recuperación local, el enlace de cambio de contraseña se imprime en la terminal de Firebase. [Firebase Auth Emulator](https://firebase.google.com/docs/emulator-suite/connect_auth)

| Variable | Uso |
| --- | --- |
| `EXPO_PUBLIC_FIREBASE_*` | Configuración pública de Firebase. El ejemplo apunta a `demo-altoque`. |
| `EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL` | Conecta Auth al emulador en desarrollo. Para usar el proyecto Firebase real, deja este valor vacío. |
| `EXPO_PUBLIC_ALTOQUE_API_URL` | URL base de la función `api`, con el proyecto y la región cuando se usa el emulador. En un build de producción usa HTTPS y el mismo proyecto que Firebase Auth. |
| `EXPO_PUBLIC_EAS_PROJECT_ID` | UUID del proyecto EAS asociado al build para solicitar el token push. |
| `GOOGLE_SERVICES_JSON` | Ruta local a la configuración Android de Firebase para el build con FCM. |

Firebase Admin se ejecuta en Functions y obtiene su contexto del emulador o del entorno de ejecución de Firebase. Mantén las cuentas de servicio y claves de FCM fuera de las variables `EXPO_PUBLIC_*` y de Git.

### Entrar con una cuenta del proyecto Firebase real

Expo SDK 58 da prioridad a `.env.development.local` al iniciar Metro. Si ese archivo selecciona `demo-altoque`, la app consulta los usuarios de Auth Emulator. Para usar las cuentas creadas en Firebase Authentication de Al Toque, conserva la configuración real en `.env` y deja `EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL=` en `.env.development.local`. Retira de ese archivo las variables `EXPO_PUBLIC_FIREBASE_*` que seleccionan el proyecto de demostración y recarga la app. [Precedencia de variables en Expo](https://docs.expo.dev/guides/environment-variables/#using-multiple-env-files-to-define-separate-environments) · [Firebase Auth Emulator](https://firebase.google.com/docs/emulator-suite/connect_auth)

Para validar QR con esa cuenta mientras el endpoint se ejecuta localmente, inicia solo Functions para el proyecto real y conecta el Android por USB.

```sh
npm run api:local
adb reverse tcp:5011 tcp:5011
```

Configura `EXPO_PUBLIC_ALTOQUE_API_URL=http://127.0.0.1:5011/al-toque-808de/us-central1/api` en `.env.development.local`. Así la conexión a la API viaja por el túnel local de ADB. El inicio de sesión con Firebase real funciona por Internet desde la app.

Deja `npm run api:local` abierto mientras usas el escáner. Si desconectas el Android o reinicias el AVD, vuelve a ejecutar `adb reverse tcp:5011 tcp:5011`.

## Flujos y arquitectura

- **QR**. Inicio → QR. Escanea el código, revisa el importe y elige Confirmar simulación o Cancelar. Firebase Auth entrega un ID token al cliente y Axios lo envía como `Authorization: Bearer` a `POST /api/qr/validate`. Functions usa Firebase Admin para verificar el token y obtener el UID de la sesión. Responde con `200` si valida, `400` si los datos son inválidos, `401` si falta el token o es inválido y `500` ante un error interno. Al confirmar, el movimiento se guarda como **Simulado**. Los pagos restan del saldo simulado en soles y las transferencias recibidas suman. El saldo inicial por cuenta es **S/ 1,840.50** y los cambios se recuperan al reabrir la app. [Verificación de ID tokens con Firebase Admin](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- **Comprobante**. Movimientos → Transferencia de prueba → Comprobante. Abre la cámara, toma una foto, repítela o guárdala. Se copia a `Paths.document` y AsyncStorage conserva el nombre del archivo asociado al UID y al movimiento de prueba. Vuelve a desbloquear tras reiniciar y abre el mismo movimiento para recuperar la foto. [Expo Camera SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/camera/) · [Expo FileSystem SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/filesystem/)
- **Acelerómetro**. Movimientos → Agitar para ver mis movimientos. El ajuste empieza apagado y se guarda por cuenta. Vuelve a Inicio para probarlo. El sensor se consulta cada 100 ms y abre el historial a partir de 1,8 g, con un intervalo de 1,6 s entre activaciones. La suscripción se elimina al salir de Inicio o al bloquear o enviar la app al segundo plano. El acceso manual siempre está en la barra inferior y en Ver todo. [Expo Accelerometer SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/accelerometer/)
- **Notificaciones**. Inicio → campana. Al activar los avisos y conceder el permiso del sistema, se abre la bandeja con filtros de **Pagos, Transferencias, Promos y Seguridad**. Los pagos y transferencias QR confirmados generan avisos locales y aparecen en la actividad de esa cuenta. Los avisos de promos y seguridad se pueden enviar desde **Recibir aviso**. La bandeja del sistema muestra el tipo de aviso y reserva los detalles para la app.
- **Activación de avisos**. La activación se guarda por cuenta en Al Toque. Si Expo Go ya tiene permiso del sistema, el modal de Al Toque activa los avisos directamente. Para repetir la activación, usa **Notificaciones → Recordatorios y pruebas → Desactivar avisos de Al Toque**.
- **Recordatorios**. En Notificaciones, abre **Recordatorios y pruebas** para programar un aviso para dentro de 24 horas o probarlo en 5 segundos. Una nueva programación reemplaza la anterior para esa cuenta. En Android, Expo Go usa su canal predeterminado y el development build usa el canal `movements`. Al tocar el aviso se abre el historial después del PIN si la app está bloqueada.
- **Permisos**. Cámara y notificaciones usan una tarjeta con la explicación y un modal con **Permitir** y **Ahora no**. Al confirmar, Expo solicita el permiso del sistema y la pantalla consulta el resultado. En Android 12 o posterior, el disparo exacto depende del acceso especial a alarmas del sistema. Si está desactivado, Android puede retrasar la prueba de 5 segundos. [Permisos de Expo Notifications](https://docs.expo.dev/versions/v58.0.0/sdk/notifications/#permissions)

| Capa | Archivos principales |
| --- | --- |
| Navegación y sesión | `src/navigation/AppNavigator.js`, `src/context/AuthContext.js`, `src/context/usePinLock.js`, `src/config/firebase.js` |
| Pantallas y componentes | `HomeScreen`, `QrScreen`, `ReceiptScreen`, `RemindersScreen`, `FeatureScreen`, `CameraPanel` y `FeaturePermission` |
| Permisos, sensor y destino tras el PIN | `src/hooks/useFeaturePermission.js`, `useShakeHistory.js` y `useReminderNavigation.js` |
| Persistencia y APIs | `src/services/storage.js`, `demoReceipt.js`, `reminders.js`, `qrApi.js` y `api.js` |
| Backend | `functions/index.js` inicializa Firebase Admin, `qrHandler.js` implementa el endpoint y `qr.js` comparte el contrato de validación entre cliente y servidor. |

El PIN sigue protegiendo el acceso local. El APF2 mantiene Firebase Auth y su recuperación, AsyncStorage para saldo visible y movimientos, las listas y filtros, el centro de ayuda, AppModal y Axios para consultar tipos de cambio desde PEN con caché, reintento y pull-to-refresh.

## QR para exposición

En la laptop de la exposición, puedes iniciar Metro con `npm start -- --go` y escanear el QR de la terminal con [Expo Go compatible con SDK 58](https://expo.dev/go?sdkVersion=58&platform=android&device=true). Deja la terminal abierta durante la demo.

Abre estas imágenes desde otro dispositivo o imprímelas. El valor codificado es JSON UTF-8 de hasta 512 caracteres. Usa `type: "altoque.demo"`, `v: 1`, destinatario de 2 a 60 caracteres, monto entero de 1 a 100000 centavos y moneda `PEN` o `USD`.

| Prueba | Imagen | Datos |
| --- | --- | --- |
| Pago válido | [QR de pago](assets/apf3/qr-valido.png) | Cafetería Demo, − S/ 12.50 del saldo simulado |
| Transferencia recibida | [QR de transferencia](assets/apf3/qr-transferencia.png) | María Demo, + S/ 12.50 al saldo simulado |
| Inválida | [QR inválido](assets/apf3/qr-invalido.png) | Importe de −1250 centavos rechazado |

```json
{"type":"altoque.demo","v":1,"recipient":"Cafetería Demo","amountCents":1250,"currency":"PEN"}
```

El campo opcional `direction` admite `debit` para un pago y `credit` para una transferencia recibida. El QR de pago original se interpreta como `debit`. El importe del código siempre es positivo. Las operaciones en USD y las simulaciones guardadas antes de esta mejora aparecen en el historial sin ajuste al saldo simulado en soles.

1. Abre el proyecto en Expo Go, entra con una cuenta de prueba y desbloquea la app.
2. Abre `assets/apf3/qr-invalido.png` en la laptop. En Inicio → QR, escanéalo y verifica el mensaje **QR inválido**. Pulsa **Volver a escanear**.
3. Abre `assets/apf3/qr-valido.png` y escanéalo. El resumen debe mostrar **Cafetería Demo**, **S/ 12.50** y **PEN**. Pulsa **Cancelar** para volver al escáner y comprobar que esa acción no guarda un movimiento.
4. Escanea de nuevo el QR válido y pulsa **Confirmar simulación** dos veces seguidas. Debe aparecer un solo comprobante con número de operación, fecha de Lima e importe.
5. Vuelve a Inicio y comprueba que el **Saldo simulado** pasó de **S/ 1,840.50** a **S/ 1,828.00** si partiste del saldo inicial. En Movimientos debe aparecer una sola fila **Simulado** por **− S/ 12.50**.
6. Escanea `assets/apf3/qr-transferencia.png` y confirma la transferencia recibida de **María Demo**. El saldo vuelve a **S/ 1,840.50** y Movimientos muestra **+ S/ 12.50**. Cierra y reabre la app para comprobar que se conservan el saldo y ambas operaciones.
7. En **Inicio → campana → Actividad**, comprueba que **Pagos** muestre **Cafetería Demo · − S/ 12.50** y **Transferencias** muestre **María Demo · + S/ 12.50**. Si activaste las notificaciones antes de confirmar, revisa también los avisos de ambas operaciones en la bandeja de Android.

## Prueba push remota

Vincula un proyecto EAS y configura su UUID. Para Android, registra el paquete `com.altoque.wallet` en Firebase, configura `GOOGLE_SERVICES_JSON` y carga la credencial FCM v1 en el proyecto EAS. Reconstruye el development build con esa configuración. En una compilación local con el directorio Android ya generado, ejecuta primero `npx expo prebuild --platform android` para aplicar la configuración nativa. Después de conceder el permiso, abre **Notificaciones → Recordatorios y pruebas** y pulsa **Obtener Expo Push Token**. La pantalla muestra el token y el UID de la cuenta para la prueba. [Configuración oficial de Expo Push](https://docs.expo.dev/push-notifications/push-notifications-setup/)

1. **Obtención del token**. Comprueba que se muestre un `ExpoPushToken` real en el build con EAS/FCM configurados.
2. **Entrega remota**. Envía al token desde la herramienta de pruebas de Expo con canal `movements` y datos `{"route":"movements","uid":"UID_DE_LA_CUENTA"}`. Comprueba que el aviso llega y que al tocarlo se abre el historial tras desbloquear. [Herramienta de pruebas de Expo Push](https://expo.dev/notifications)

El repositorio no tenía un registro de dispositivos ni un servidor de envío push. La prueba está preparada para envío manual con Expo. En este entorno faltan un proyecto EAS vinculado, la configuración Android de Firebase para el paquete y la credencial FCM v1. La obtención del token y la entrega remota están pendientes por separado.

## Comprobaciones y rúbrica

```sh
npm test
npm run test:emulators
npx expo install --check
npx expo export --platform android --output-dir dist/apf3-android-sdk58
```

`test:emulators` registra un usuario ficticio, invoca el servicio móvil `qrApi.js` con un ID token real de Auth Emulator y verifica las respuestas HTTP del endpoint. El script también comprueba que Auth genera el enlace de recuperación. El [commit base en GitHub](https://github.com/mptefi/BilleteraDigital-app/commit/2597925504e596b474857de237831c710c02d527) corresponde a `origin/main` en la copia local. La evidencia del APF3 se entrega en el árbol de trabajo local.

| Criterio | Evidencia | Resultado |
| --- | --- | --- |
| Arquitectura · 15 % | Configuración reproducible, navegación existente, funciones y separación por pantalla, servicio y hook | Dependencias nativas instaladas con Expo SDK 58. Desarrollo local. |
| Backend · 20 % | `npm run test:emulators` y servicio móvil `qrApi.js` | HTTP real `200` con UID verificado, `401 token_required`, `401 invalid_token` y `400 invalid_qr`. |
| Funciones nativas · 25 % | Android 13 en AVD y pruebas automatizadas | Captura y persistencia del comprobante, sacudida, programación, cancelación, recepción y navegación tras el PIN verificadas en el AVD. |
| UI/UX · 25 % | Botones etiquetados, zonas seguras, estados y navegación | Historial y Notificaciones comprobados en dos resoluciones del AVD. Los estados del QR se probaron con eventos de escaneo simulados. |
| Innovación · 10 % | QR → validación → confirmación simulada, acceso por sacudida y aviso enlazado | Flujos integrados con el historial y la sesión de Al Toque. |
| Documentación · 5 % | README, ejemplos QR, configuración y guion | Material disponible en el repositorio. |

En SDK 58 se aprobaron 36 pruebas automatizadas. Durante la migración se aprobaron las 20 comprobaciones de Expo Doctor y el APK de desarrollo se instaló encima del APK de SDK 57 en el AVD. Hermes generó el bundle Android con el flujo QR y la bandeja de notificaciones. Consulta el [registro de pruebas](DOCUMENTACION_AVANCE3.md#6-verificaciones-realizadas) para los resultados por flujo.

## Guion de exposición · 4 minutos

| Tiempo | Demostración |
| --- | --- |
| 0:00–0:40 | Inicia sesión, desbloquea con el PIN y muestra saldo, historial y tipo de cambio del APF2. |
| 0:40–1:40 | En QR, rechaza y vuelve a solicitar el permiso si corresponde. Escanea el QR inválido, vuelve a escanear el válido y confirma la simulación. Muestra el resultado HTTP de las cuatro pruebas. |
| 1:40–2:30 | Abre la transferencia de prueba, toma y guarda una foto. Abre una foto ya guardada después de reiniciar para mostrar la persistencia. |
| 2:30–3:10 | Activa Agitar para ver mis movimientos, vuelve a Inicio y agita. Muestra el acceso manual desde la barra inferior. |
| 3:10–4:00 | Programa y cancela un recordatorio de 24 horas. Programa la prueba de 5 segundos, envía la app al fondo y vuelve tocando el aviso. Desbloquea para mostrar el historial. Explica la verificación separada del token y de la entrega remota. |

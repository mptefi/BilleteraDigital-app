# Al Toque: acceso inicial con PIN de seis dígitos

Se mantiene Firebase Authentication para identificar la cuenta y se agrega una barrera de desbloqueo local por PIN. La sesión de Firebase por sí sola ya no permite mostrar Home o Perfil.

## Flujos

| Situación | Pantallas |
| --- | --- |
| Primer registro o login en un dispositivo sin PIN | Splash → Registro/Login → Crear y confirmar PIN → Carga de inicialización → Ingresar PIN → Home. |
| Sesión ya iniciada y PIN configurado | Splash → Teclado PIN → Home. |
| Volver del segundo plano | Se oculta el contenido privado → Teclado PIN → Home al acertar. |
| Tres intentos fallidos | Teclado bloqueado → Verificar contraseña de la cuenta → Crear y confirmar PIN nuevo → Carga → Ingresar PIN. |
| Olvidar PIN o cambiarlo desde Perfil | Verificar contraseña de la cuenta → Crear y confirmar PIN nuevo → Carga → Ingresar PIN. |
| Sesión restaurada que todavía no tiene PIN | Verificar contraseña de la cuenta → Crear y confirmar PIN. |
| Salir y volver al PIN | Teclado PIN; la sesión de Firebase y la cuenta vinculada se conservan. |
| Cambiar de cuenta | Cierra la sesión de Firebase y muestra Login con correo y contraseña; se conserva el verificador local asociado a cada cuenta. |

La verificación de contraseña se realiza con reauthenticateWithCredential y EmailAuthProvider.credential contra Firebase. No se puede configurar un PIN nuevo a partir de una sesión restaurada sin comprobar antes la contraseña. Si se regresa al segundo plano durante la recuperación o la creación, se invalida la autorización en memoria y se vuelve a bloquear.

Al guardar el PIN se muestra el Splash animado durante aproximadamente 1.5 segundos. Después se presenta el teclado: crear el PIN no desbloquea automáticamente Home. Solo verificarlo correctamente permite entrar. Si se envía la app a segundo plano durante esa transición, se cancela el temporizador y la app continúa bloqueada.

## Protección de navegación

AppNavigator comprueba tres condiciones antes de mostrar pantallas privadas: usuario autenticado, preferencias cargadas y estado del PIN desbloqueado para el mismo UID. Cambiar currentScreen a HOME o PROFILE mientras la app está bloqueada no permite entrar.

Mientras está bloqueada, solo se puede acceder a la ayuda, a la recuperación de contraseña por enlace o a la verificación de contraseña para restablecer el PIN. Los botones para volver desde esas pantallas no omiten el control del PIN.

El acceso biométrico simulado anterior fue reemplazado por una opción para cerrar sesión/cambiar de cuenta; no hay un botón de Face ID que salte la verificación.

## Almacenamiento e intentos

- Android/iOS: se utiliza expo-secure-store, con accesibilidad WHEN_UNLOCKED_THIS_DEVICE_ONLY.
- Se guarda un registro por UID: versión, salt aleatorio de 32 bytes, digest SHA-256 del salt y del PIN, y contador de intentos fallidos. El PIN escrito no se guarda como texto ni se expone en AuthContext.
- Las operaciones de lectura, escritura y verificación se serializan por usuario para evitar comprobaciones simultáneas que eludan el límite.
- El intento se reserva y guarda antes de comprobar el digest. Cerrar o reiniciar la app no restablece el contador; un cierre durante la comprobación puede consumir un intento.
- Al acertar se reinicia el contador. Después de tres fallos, incluso el PIN correcto requiere recuperación con contraseña para crear uno nuevo.
- Un error de lectura o un registro corrupto mantiene el acceso bloqueado y ofrece reintento o recuperación por contraseña.
- El PIN anterior de demostración almacenado globalmente en AsyncStorage se elimina; no se reutiliza como PIN de una cuenta.
- El PIN es específico de la cuenta en este dispositivo; no cambia la contraseña de Firebase ni se sincroniza entre teléfonos.

## Archivos principales

| Archivo | Responsabilidad |
| --- | --- |
| src/services/pinVault.js | Generación del salt, digest, SecureStore, intentos persistentes y cola por UID. |
| src/context/usePinLock.js | Estado de bloqueo, AppState, autorización tras contraseña y descarte de resultados de operaciones anteriores al bloqueo. |
| src/context/AuthContext.js | Integra el bloqueo con login, registro, sesión observada y logout. |
| src/navigation/AppNavigator.js | Barrera de acceso para todas las pantallas privadas. |
| src/screens/PinLoginScreen.js | Teclado naranja, seis indicadores, mensajes de error, recuperación y cambio de cuenta. |
| src/screens/NewPasswordScreen.js | Crear y confirmar PIN, validación numérica y guardado. Se reutiliza la pantalla anterior. |
| src/screens/PinRecoveryScreen.js | Verificación de la contraseña de la cuenta antes de permitir crear un PIN nuevo. |
| src/screens/ProfileScreen.js | Opciones Cambiar mi PIN, Salir y volver al PIN y Cambiar de cuenta. |
| app.json | Plugin expo-secure-store para builds nativas. |
| package.json y package-lock.json | Dependencias expo-secure-store y expo-crypto compatibles con SDK 57. |
| tests/auth.test.cjs | Pruebas de autenticación y nuevos recorridos de PIN. |

## Cómo probarlo en tu celular

1. Reinicia Metro con npm start -- --clear. En Expo Go usa una versión compatible con SDK 57. Si utilizas un development build propio anterior, recompílalo para incorporar los módulos nativos nuevos.
2. Inicia sesión o crea una cuenta. Si ya había una sesión restaurada sin PIN, escribe la contraseña una vez para autorizar la configuración inicial.
3. Introduce un PIN nuevo de seis dígitos y repítelo. Si no coincide, la app debe mostrar el error y permanecer en esa pantalla.
4. Pulsa Guardar PIN y continuar. Debe aparecer la pantalla de carga y luego el teclado PIN. Introduce el PIN recién creado para abrir Home.
5. Cierra completamente la app y ábrela: después de Splash debe aparecer el teclado naranja. Escribe el PIN configurado para entrar.
6. Estando en Home, cambia a otra app y regresa. Debe volver a pedir el PIN.
7. Prueba un PIN incorrecto: debe indicar los intentos restantes. Reinicia la app y comprueba que ese fallo se conserva.
8. Completa tres intentos fallidos: el teclado numérico debe quedar deshabilitado.
9. Pulsa ¿Olvidaste tu PIN? y prueba primero una contraseña incorrecta. No debe permitir crear el PIN.
10. Escribe la contraseña correcta de la cuenta; configura y confirma un PIN distinto. Comprueba que puedes desbloquear con el nuevo.
11. En Perfil prueba Cambiar mi PIN y Salir y volver al PIN. Cambiar el PIN exige nuevamente la contraseña; Salir vuelve al teclado sin pedir correo.
12. Usa Cambiar de cuenta para desconectar Firebase y probar otra cuenta: su PIN y sus preferencias deben permanecer independientes. Si ya habías cerrado la sesión con la versión anterior, debes iniciar sesión una vez para volver a vincular tu cuenta.

## Validación y límites

- npm test: 21 pruebas aprobadas con Firebase, AppState y SecureStore simulados. Los tests del verificador usan SHA-256 y bytes aleatorios de Node como sustitutos de Expo Crypto. Se comprueba también la diferencia entre los dos botones de salida de Perfil.
- Se cubren creación, confirmación, verificador sin PIN en texto, reinicio con datos guardados, segundo plano, rutas privadas, intentos persistentes, recuperación por contraseña, cuentas independientes, registro corrupto y resultados asíncronos después de bloquear.
- Se generó el bundle Android con Expo y --no-bytecode. No se construyó un APK ni se probó físicamente SecureStore o Firebase en un celular durante esta implementación.
- En web, SecureStore no está disponible. El verificador se mantiene solo en memoria de la pestaña; al recargar se requiere nuevamente la contraseña para configurarlo. La persistencia del PIN descrita aquí corresponde a Android/iOS.
- La entrega del código OTP por correo sigue pendiente y no forma parte de este desbloqueo. La recuperación de la contraseña de la cuenta continúa mediante el enlace de Firebase.

Documentación consultada: [Expo SecureStore SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/securestore/), [Expo Crypto SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/crypto/) y [React Native AppState](https://reactnative.dev/docs/appstate).

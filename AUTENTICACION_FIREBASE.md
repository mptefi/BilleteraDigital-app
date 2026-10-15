# Al Toque: autenticación con correo y contraseña

> Actualización: se agregó desbloqueo persistente por PIN de seis dígitos. Consultar [ACCESO_PIN.md](ACCESO_PIN.md) para el flujo actual, archivos y pruebas.

> La salida habitual de Perfil ahora se llama «Salir y volver al PIN» y conserva Firebase. «Cambiar de cuenta» realiza el cierre de sesión completo descrito en esta guía. La suite actual incluye 21 pruebas aprobadas.

Se reutilizaron App.js, la configuración de Firebase, AuthContext y el navegador existentes. No se creó otro proyecto ni una segunda instancia de Firebase. Se conservaron los colores, logos, Home, soporte y componentes del avance 2.

## Comportamiento implementado

- Login con correo, contraseña, control de visibilidad, validaciones, indicador de carga y errores en español.
- Registro con nombres, correo, contraseña y confirmación; crea el usuario con Firebase Authentication y guarda su displayName.
- AuthContext expone user, loading, login, register, logout y resetPassword, además de los valores previos usados por la app.
- onAuthStateChanged determina si hay sesión. Sin ella se muestra Login; con ella se exige crear o verificar el PIN antes de entrar a Home.
- La pantalla Splash permanece mientras Firebase resuelve la sesión y se leen las preferencias del usuario.
- React Native utiliza initializeAuth y getReactNativePersistence con AsyncStorage. Web conserva getAuth y su comportamiento de persistencia del SDK.
- Sin usuario autenticado, el navegador impide abrir Home, Perfil, el teclado PIN y las pantallas de PIN/OTP anteriores.
- Home muestra el nombre del usuario; si no hay displayName usa la parte anterior a @ de su correo.
- La opción Perfil de la barra inferior permite ver nombre/correo y ejecutar Cerrar sesión con signOut.
- Cerrar sesión limpia datos del usuario en memoria y vuelve al Login. Las preferencias locales se conservan por UID para recuperarlas cuando ese mismo usuario regrese.
- Las contraseñas del formulario no se guardan mediante el servicio local ni se escriben a archivos. El SDK gestiona sus propios datos de sesión; no se almacena manualmente la contraseña.
- La visibilidad del saldo y los movimientos locales tienen claves separadas por UID. La caché de tipos de cambio sigue siendo común porque es información pública.

## Recuperación y PIN anterior

El envío de un OTP de cuatro dígitos por correo queda pendiente, según lo solicitado. La recuperación de contraseña de la cuenta utiliza sendPasswordResetEmail y el enlace de Firebase. La pantalla informa errores reales y ya no anuncia un código generado cuando falla el envío.

El teclado se reutiliza en PinLoginScreen como barrera real de desbloqueo local dentro de una sesión autenticada. El PIN tiene un verificador persistente por UID en SecureStore, tres intentos y recuperación mediante la contraseña de Firebase. Se eliminó la aceptación universal de 123456 y el acceso biométrico simulado. Perfil permite cambiar el PIN o bloquear la app. Ver ACCESO_PIN.md para los detalles.

RecoveryCodeScreen se conserva, pero no es parte del flujo de recuperación por enlace. verifyOtp devuelve false mientras no exista un servicio real de validación. No se aceptan códigos ficticios.

El PIN antiguo que estaba guardado globalmente en @altoque/user-pin se elimina al iniciar. Las preferencias y movimientos globales anteriores no se migran a una cuenta porque no tenían un propietario identificado; el esquema nuevo utiliza claves terminadas en /{uid}.

## Archivos modificados

| Archivo | Cambio |
| --- | --- |
| App.js | Se conserva AuthProvider y se retira el silenciamiento global de logs para que los problemas sean visibles durante el desarrollo. |
| src/config/firebase.js | Persistencia explícita de Firebase Auth en React Native y reutilización de la instancia durante recargas. Se conserva la configuración existente. |
| src/context/AuthContext.js | Funciones reales de autenticación, observador, datos por usuario, nombre del perfil y recuperación sin éxito simulado. |
| src/navigation/AppNavigator.js | Registro, Perfil, PIN interno y protección de rutas según sesión. |
| src/screens/LoginScreen.js | Reutiliza AuthForm para correo y contraseña. El teclado original se conserva en PinLoginScreen.js. |
| src/screens/SplashScreen.js | Conserva animaciones y espera al navegador; ya no fuerza Login con un temporizador. |
| src/screens/HomeScreen.js | Nombre del usuario y acceso a Perfil desde la barra inferior. |
| src/screens/RecoveryEmailScreen.js | Solicitud de enlace de recuperación, validación, carga y resultado real. |
| src/screens/NewPasswordScreen.js | Creación y confirmación del PIN persistente de desbloqueo, separado de la contraseña de Firebase. |
| src/screens/SupportScreen.js | Regreso a Home si hay sesión o a Login si no la hay. |
| package.json y package-lock.json | Dependencia de desarrollo para pruebas y script npm test. |
| PANTALLAS_AVANCE2_FIGMA.md y EXPOSICION_LABORATORIOS_AVANCE2.md | Aviso de que describen el avance 2 anterior a esta ampliación. |

## Archivos creados

- src/components/AuthForm.js: formulario compartido de login/registro.
- src/screens/RegisterScreen.js: pantalla de registro.
- src/screens/ProfileScreen.js: perfil y cierre de sesión.
- src/screens/PinLoginScreen.js: teclado de desbloqueo por PIN, con intentos persistentes y sin clave universal.
- src/services/authErrors.js: traducciones de errores y validación básica de correo.
- tests/auth.test.cjs: pruebas de contexto, navegador, formulario y configuración de persistencia.
- AUTENTICACION_FIREBASE.md: esta guía.
- src/context/usePinLock.js, src/services/pinVault.js y src/screens/PinRecoveryScreen.js: bloqueo, almacenamiento seguro y recuperación del PIN, incorporados en la ampliación posterior.
- ACCESO_PIN.md: guía de la ampliación de acceso por PIN.

## Dependencias

- Instalación nueva: react-test-renderer 19.2.3 como dependencia de desarrollo, compatible con la versión de React del proyecto.
- Se reutilizan firebase 12.19.0 y @react-native-async-storage/async-storage 2.2.0. Posteriormente se incorporaron react-native-safe-area-context para las áreas seguras y expo-secure-store/expo-crypto para el PIN.
- react-test-renderer muestra una advertencia de deprecación del propio paquete al ejecutar pruebas; las 20 pruebas terminan correctamente. No se incluye como dependencia de producción.

## Cómo probar con Firebase real

1. En la consola del proyecto Firebase existente, entra a Authentication → Sign-in method y verifica que Email/Password esté habilitado. Esta opción del servidor no fue modificada desde el workspace.
2. Conserva el archivo .env y sus variables EXPO_PUBLIC_FIREBASE_* del proyecto. No uses cuentas ni contraseñas de ejemplo de las pruebas.
3. Ejecuta npm start. Si ya tenías Expo abierto, reinícialo con npm start -- --clear para cargar la nueva inicialización de Firebase.
4. Abre la app en Expo Go o en tu build. Sin una sesión previa debe aparecer el formulario de correo y contraseña.
5. Pulsa Crear cuenta. Ingresa nombres, un correo tuyo, una contraseña de al menos seis caracteres y su confirmación. Si Firebase tiene una política más estricta, cumple también esa política.
6. Crea y confirma el PIN de seis dígitos. Debe aparecer la carga de inicialización y después el teclado PIN; ingresa la clave recién creada para abrir Home. Verifica en Authentication → Users que se creó la cuenta.
7. Ve a Perfil y comprueba nombre/correo. Pulsa Cerrar sesión: debes volver a Login.
8. Prueba una contraseña incorrecta: debe mostrar un error en español y mantenerte fuera de Home. Después ingresa la correcta y desbloquea con el PIN de esa cuenta.
9. Con la sesión abierta, cierra completamente la app y vuelve a abrirla. Tras Splash debe mostrar el teclado PIN sin pedir otra vez la contraseña de Firebase. Al ingresar el PIN correcto abre Home.
10. Oculta el saldo, reinicia la app y comprueba que esa preferencia se mantiene para tu usuario. Si pruebas otra cuenta, sus preferencias deben ser independientes.
11. Cierra sesión, termina la app y vuelve a abrirla: debe seguir en Login.
12. En ¿Olvidaste tu contraseña?, ingresa el correo de la cuenta creada. Comprueba la llegada del enlace en Gmail o SPAM, completa el cambio en la página de Firebase e inicia sesión con la nueva contraseña.
13. Desde Perfil puedes cambiar el PIN verificando tu contraseña o bloquear Al Toque inmediatamente. Sigue también los recorridos de intentos y segundo plano de ACCESO_PIN.md.

Si Firebase rechaza una operación, revisa el mensaje en español. No se muestran directamente códigos auth/... al usuario. La app tampoco confirma que exista una cuenta en el mensaje de recuperación exitoso.

## Validación realizada y límites

- npm test: 20 pruebas aprobadas tras incorporar el acceso por PIN.
- Se comprobaron espera de autenticación, rutas privadas sin sesión, usuario restaurado por el observador, login, registro y displayName, limpieza al cerrar sesión, datos por cuenta, errores de credenciales/red, validación del formulario y configuración nativa de persistencia.
- Estas pruebas simulan Firebase y almacenamiento. No crean usuarios en el proyecto remoto ni comprueban la entrega real de correos o la persistencia después de matar un proceso en Android.
- npx expo export --platform android --output-dir .tmp-export-auth --no-bytecode: bundle Android generado sin imports rotos. Esta comprobación genera JavaScript, sin compilar bytecode Hermes ni construir un APK.
- No se ejecutó una prueba en dispositivo, Gmail ni contra cuentas reales. Los pasos anteriores permiten comprobar esas partes con tu proyecto y tu correo.

## Documentación consultada

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/), según AGENTS.md.
- [Firebase Authentication: API JavaScript](https://firebase.google.com/docs/reference/js/auth), para initializeAuth, getReactNativePersistence, onAuthStateChanged, registro y acceso.
- Se revisó además la implementación getReactNativePersistence del SDK instalado en node_modules/@firebase/auth/dist/rn/index.js.

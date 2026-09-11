# Documentación del Avance 1: Billetera Digital "Al Toque"

## 1. Resumen del Proyecto

Este documento detalla la implementación técnica del **Avance 1** para la billetera digital **Al Toque**, desarrollada utilizando **React Native (Expo)** y **Firebase Auth**. El diseño de la interfaz ha sido implementado respetando los mockups de Figma proporcionados en la carpeta `mockups/`.

---

## 2. Arquitectura y Estructura del Código

Se ha organizado la aplicación siguiendo el patrón modular de componentes y contexto global:

```
my-app/
├── App.js                         # Punto de entrada principal con AuthProvider y LogBox ignore
├── mockups/                       # Assets e Iconos oficiales PNG (logo-AT-sinfondo, AT-SF, atras, bloquear, auriculares, borrar, etc.)
├── src/
│   ├── config/
│   │   └── firebase.js            # Inicialización de Firebase SDK con credenciales
│   ├── context/
│   │   └── AuthContext.js         # Estado global (sesión, PIN, saldo, Firebase reset, transacciones)
│   ├── navigation/
│   │   └── AppNavigator.js        # Gestor de rutas y renderizado de pantallas
│   ├── screens/
│   │   ├── SplashScreen.js        # Pantalla de carga animada con logo-AT-sinfondo.png y AT-SF.png
│   │   ├── LoginScreen.js         # Login con teclado PIN, biometría id-facial.png y borrar.png
│   │   ├── RecoveryEmailScreen.js # Paso 1: Solicitud por correo con atras.png y correo-electronico.png
│   │   ├── RecoveryCodeScreen.js  # Paso 2: Validación OTP 4 dígitos con atras.png y bloquear (1).png
│   │   ├── NewPasswordScreen.js   # Paso 3: Cambio de clave de 6 dígitos con atras.png
│   │   ├── SupportScreen.js       # Centro de Ayuda con auriculares.png y correo-electronico.png
│   │   └── HomeScreen.js          # Dashboard / Inicio con promociones.png y auriculares.png
│   └── theme/
│       └── colors.js              # Sistema de colores y tokens de diseño
```

---

## 3. Implementación de Pantallas y Funcionalidades

### A. Pantalla Inicial / Splash (`SplashScreen.js`)
- **Diseño**: Fondo blanco con logo animado central.
- **Lógica**: Transición automática de 2 segundos hacia la pantalla de inicio de sesión.

### B. Inicio de Sesión (`LoginScreen.js`)
- **Diseño**: Basado en `al-toque-login.png`.
- **Componentes**:
  - Tarjeta directa `¿Olvidaste tu clave?` -> Redirige al flujo de recuperación.
  - Tarjeta directa `Centro de ayuda` -> Redirige a soporte.
  - Indicadores visuales para el PIN de 6 dígitos.
  - **Teclado PIN Naranja**: Teclado en lámina inferior con ordenamiento de teclas, botón de borrado y simulación de biometría/Face ID.

### C. Flujo de Recuperación de Clave (Firebase Auth)
El flujo consta de 3 pantallas consecutivas integradas con Firebase:
1. **Identificación (`RecoveryEmailScreen.js`)**: Campo para correo electrónico con icono. Invoca `sendPasswordResetEmail(auth, email)` en Firebase Auth.
2. **Verificación de Código (`RecoveryCodeScreen.js`)**: 4 cajas OTP para ingreso de código de seguridad con reenvió.
3. **Nueva Clave (`NewPasswordScreen.js`)**: Validación de 6 dígitos e igualdad de contraseñas para actualizar la clave activa en la aplicación.

### D. Centro de Ayuda / Soporte (`SupportScreen.js`)
- **Diseño**: Basado en `al-toque-soporte.png`.
- **Funcionalidades**:
  - Barra de búsqueda interactiva para filtrar preguntas.
  - Botones de contacto directo (WhatsApp y Correo de soporte).
  - Acordeón desplegable de **Preguntas Frecuentes**.
  - Badge de seguridad 24/7.

### E. Dashboard Principal / Home (`HomeScreen.js`)
- **Diseño**: Basado en `al-toque-home.png`.
- **Componentes**:
  - Cabecera con avatar, saludo dinámico ("Bryan") e icono de notificaciones.
  - **Tarjeta de Saldo Naranja**: Muestra el saldo en Soles (`S/ 1,840.50`) con botón de ocultar/mostrar saldo (`eye` / `eye-off`).
  - **Acciones Rápidas**: Transferir, Promos, Aprobar compras y Servicios.
  - **Banner de Cashback 15%** exclusivo.
  - **Lista de Últimos Movimientos**: Historial detallado con depósitos en verde y consumos en tono oscuro.
  - **Barra de Navegación Inferior (Tab Bar)**: Con botón flotante central de escaneo QR.

---

## 4. Configuración de Firebase y Variables de Entorno (`.env`)

Por buenas prácticas de seguridad, las credenciales oficiales del proyecto Firebase `al-toque-808de` se han centralizado en un archivo **`.env`** en la raíz del proyecto usando el estándar `EXPO_PUBLIC_`:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyBcVpneB_1ma1ykRqmnSWDSpvfCGoEn0-s
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=al-toque-808de.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=al-toque-808de
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=al-toque-808de.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=548124731916
EXPO_PUBLIC_FIREBASE_APP_ID=1:548124731916:web:f123eff8249022c7701c29
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-YWWPS2Y1YZ
```

En [`src/config/firebase.js`](file:///d:/DESCARGAS/ProyApp/my-app/src/config/firebase.js), la app lee automáticamente estas variables a través de `process.env.EXPO_PUBLIC_...` y el archivo `.env` ha sido incluido en `.gitignore` para proteger las credenciales.

---

## 5. Guía de Ejecución

Para iniciar y probar la aplicación en modo desarrollo con Expo:

1. Entra a la carpeta del proyecto:
   ```bash
   cd d:\DESCARGAS\ProyApp\my-app
   ```
2. Ejecuta el servidor de desarrollo de Expo:
   ```bash
   npm run start
   ```
   o para versión web:
   ```bash
   npm run web
   ```

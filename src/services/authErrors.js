export function authErrorMessage(error) {
  const messages = {
    "auth/invalid-credential": "El correo o la contraseña son incorrectos.",
    "auth/user-not-found": "No encontramos una cuenta con ese correo.",
    "auth/wrong-password": "La contraseña es incorrecta.",
    "auth/invalid-email": "Ingresa un correo electrónico válido.",
    "auth/email-already-in-use": "Este correo ya tiene una cuenta. Inicia sesión.",
    "auth/weak-password": "Usa una contraseña de al menos 6 caracteres.",
    "auth/password-does-not-meet-requirements": "La contraseña no cumple los requisitos de seguridad del proyecto.",
    "auth/network-request-failed": "No pudimos conectarnos. Revisa tu conexión e intenta nuevamente.",
    "auth/too-many-requests": "Demasiados intentos. Espera unos minutos antes de volver a intentar.",
    "auth/user-disabled": "Esta cuenta está deshabilitada. Contacta con soporte.",
    "auth/operation-not-allowed": "El acceso por correo y contraseña aún no está habilitado en Firebase.",
    "auth/requires-recent-login": "Vuelve a iniciar sesión para realizar esta acción.",
  };
  return messages[error?.code] || "No pudimos completar la operación. Intenta nuevamente.";
}

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

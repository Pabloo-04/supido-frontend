export function validateUsername(username: string): string | null {
  if (!username.trim()) return "El usuario es obligatorio.";
  if (username.trim().length < 3) return "El usuario debe tener al menos 3 caracteres.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "La contraseña es obligatoria.";
  if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
  return null;
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) return "El correo es obligatorio.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "El correo no es válido.";
  return null;
}

export function validatePhone(phone: string): string | null {
  if (!phone.trim()) return "El teléfono es obligatorio.";
  if (!/^\+?[0-9\s-]{7,15}$/.test(phone)) return "El teléfono no es válido.";
  return null;
}

import React, { createContext, useContext, useState } from "react";
import { registerUser, loginUser, fetchProfile } from "../firebase/firebaseApi";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Helpers de validación (mismos criterios que en el front)
const isValidEmail = (email) => {
  const trimmed = email.trim();
  const regex = /^\S+@\S+\.\S+$/;
  return regex.test(trimmed);
};

const isValidName = (name) => {
  const trimmed = name.trim();
  const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
  return regex.test(trimmed);
};

const isValidPassword = (password) => {
  // Mínimo 6 caracteres, 1 mayúscula, 1 número
  const regex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
  return regex.test(password);
};

// Roles permitidos (mantener en sync con ROLES del front)
const ALLOWED_ROLES = ["Enfermero", "CEyE"];

// 🔁 Función para traducir códigos de Firebase a mensajes bonitos
const mapFirebaseErrorToMessage = (code, context = "register") => {
  // context: "register" o "login"
  if (!code) return "Ocurrió un error inesperado. Intenta de nuevo.";

  // Errores comunes de Firebase Auth
  switch (code) {
    case "auth/email-already-in-use":
      return "Este correo ya está registrado.";

    case "auth/invalid-email":
      return "El correo no es válido.";

    case "auth/weak-password":
      return "La contraseña es demasiado débil.";

    case "auth/user-not-found":
      // Esto casi no se usará en login con la REST API nueva,
      // pero lo dejamos por si acaso en otros flujos.
      return "El correo no se encuentra registrado.";

    case "auth/wrong-password":
      return "La contraseña es incorrecta.";

    // INVALID_LOGIN_CREDENTIALS → auth/invalid-credential
    // No podemos saber si es correo o contraseña, así que lo dejamos general
    case "auth/invalid-credential":
      return "Correo o contraseña incorrectos, o el usuario no está registrado.";

    case "auth/too-many-requests":
      return "Demasiados intentos fallidos. Intenta de nuevo más tarde.";

    case "auth/network-request-failed":
      return "Error de conexión. Revisa tu internet e intenta de nuevo.";

    default:
      // Mensaje genérico según contexto
      if (context === "login") {
        return "No se pudo iniciar sesión. Intenta de nuevo.";
      } else {
        return "No se pudo crear la cuenta. Intenta de nuevo.";
      }
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const register = async ({ name, email, password, role }) => {
    if (loading) return;

    setLoading(true);
    try {
      const trimmedName = name.trim();
      const trimmedEmail = email.trim().toLowerCase();

      // ✅ Validaciones adicionales del lado "seguro"
      if (!trimmedName) {
        throw new Error("El nombre es obligatorio.");
      }
      if (!isValidName(trimmedName)) {
        throw new Error("El nombre solo debe contener letras y espacios.");
      }

      if (!trimmedEmail) {
        throw new Error("El correo es obligatorio.");
      }
      if (!isValidEmail(trimmedEmail)) {
        throw new Error("El correo no es válido.");
      }

      if (!password) {
        throw new Error("La contraseña es obligatoria.");
      }
      if (!isValidPassword(password)) {
        throw new Error(
          "La contraseña debe tener mínimo 6 caracteres, 1 mayúscula y 1 número."
        );
      }

      if (!role || !ALLOWED_ROLES.includes(role)) {
        throw new Error("El rol seleccionado no es válido.");
      }

      // 👇 registerUser usa la firma: (name, email, password, role)
      const { uid, token } = await registerUser(
        trimmedName,
        trimmedEmail,
        password,
        role
      );

      const profile = await fetchProfile(uid, token);

      setUser({ uid, email: trimmedEmail, token, profile });
      return {
        user: { uid, email: trimmedEmail, token, profile },
        role: profile.role,
      };
    } catch (e) {
      console.log("Error en register:", e);

      // Si viene de Firebase, normalmente trae e.code
      if (e.code) {
        const msg = mapFirebaseErrorToMessage(e.code, "register");
        throw new Error(msg);
      }

      // Si es un Error que lanzamos nosotros arriba (validación), respetamos su mensaje
      if (e.message) {
        throw new Error(e.message);
      }

      throw new Error("No se pudo crear la cuenta. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const login = async ({ email, password }) => {
    if (loading) return;

    setLoading(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();

      if (!trimmedEmail || !password) {
        throw new Error("Correo y contraseña son obligatorios.");
      }

      if (!isValidEmail(trimmedEmail)) {
        throw new Error("El correo no es válido.");
      }

      const { uid, token } = await loginUser(trimmedEmail, password);
      const profile = await fetchProfile(uid, token);

      setUser({ uid, email: trimmedEmail, token, profile });
      return {
        user: { uid, email: trimmedEmail, token, profile },
        role: profile.role,
      };
    } catch (e) {
      console.log("Error en login:", e);

      if (e.code) {
        const msg = mapFirebaseErrorToMessage(e.code, "login");
        throw new Error(msg);
      }

      if (e.message) {
        throw new Error(e.message);
      }

      throw new Error("No se pudo iniciar sesión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

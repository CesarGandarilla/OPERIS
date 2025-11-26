import { FIREBASE_API_KEY, FIREBASE_DB_URL } from "@env";

const AUTH_URL = "https://identitytoolkit.googleapis.com/v1/accounts";

/* ----------------------- HELPERS DE ERRORES AUTH ----------------------- */

/**
 * Firebase REST devuelve errores con .error.message tipo:
 * - "EMAIL_EXISTS"
 * - "INVALID_EMAIL"
 * - "WEAK_PASSWORD : Password should be at least 6 characters"
 * - "EMAIL_NOT_FOUND"
 * - "INVALID_PASSWORD"
 * - "INVALID_LOGIN_CREDENTIALS"
 * - "TOO_MANY_ATTEMPTS_TRY_LATER"
 *
 * Aquí los convertimos a códigos estilo SDK: "auth/..."
 * para que el AuthContext los pueda mapear bonito a mensajes en español.
 */
const mapFirebaseRestErrorToAuthCode = (restMessage = "") => {
  if (!restMessage) return "auth/unknown";

  // Nos aseguramos de trabajar con el string tal cual
  const msg = String(restMessage).toUpperCase();

  if (msg === "EMAIL_EXISTS") return "auth/email-already-in-use";
  if (msg === "INVALID_EMAIL") return "auth/invalid-email";
  if (msg.startsWith("WEAK_PASSWORD")) return "auth/weak-password";
  if (msg === "EMAIL_NOT_FOUND") return "auth/user-not-found";

  // Contraseña incorrecta (forma vieja)
  if (msg === "INVALID_PASSWORD") return "auth/wrong-password";

  // Este es el que estás recibiendo al fallar login
  // (correo o contraseña incorrectos)
  if (msg === "INVALID_LOGIN_CREDENTIALS") return "auth/invalid-credential";

  if (msg === "TOO_MANY_ATTEMPTS_TRY_LATER")
    return "auth/too-many-requests";

  return "auth/unknown";
};

/* 🔎 Nuevo: checar si un correo EXISTE en Firebase Auth */
export const emailExists = async (email) => {
  const res = await fetch(`${AUTH_URL}:lookup?key=${FIREBASE_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: [email] }), // API espera un array de emails
  });

  const data = await res.json();

  // Si Firebase responde con EMAIL_NOT_FOUND, lo tomamos como "no existe"
  if (!res.ok || data.error) {
    const restMessage = data?.error?.message || "UNKNOWN_ERROR";

    if (restMessage === "EMAIL_NOT_FOUND") {
      return false;
    }

    const err = new Error(restMessage);
    err.code = mapFirebaseRestErrorToAuthCode(restMessage);
    throw err;
  }

  const users = data.users;
  return Array.isArray(users) && users.length > 0;
};

/* ----------------------- AUTH ----------------------- */

export const registerUser = async (name, email, password, role) => {
  const res = await fetch(`${AUTH_URL}:signUp?key=${FIREBASE_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });

  const data = await res.json();

  // Si Firebase retorna error en el body
  if (!res.ok || data.error) {
    const restMessage = data?.error?.message || "UNKNOWN_ERROR";
    const err = new Error(restMessage);
    err.code = mapFirebaseRestErrorToAuthCode(restMessage);
    throw err;
  }

  const uid = data.localId;
  const token = data.idToken;

  // 🔹 Perfil SIN department ( ya no lo usamos)
  const profile = {
    name,
    email,
    role,
    createdAt: Date.now(),
  };

  const saveRes = await fetch(
    `${FIREBASE_DB_URL}/users/${uid}.json?auth=${token}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    }
  );

  if (!saveRes.ok) {
    const err = new Error("Error guardando perfil");
    // Esto no es de Firebase Auth, pero por si quieres distinguirlo
    err.code = "profile/save-error";
    throw err;
  }

  return { uid, token };
};

export const loginUser = async (email, password) => {
  const res = await fetch(
    `${AUTH_URL}:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    }
  );

  const data = await res.json();

  if (!res.ok || data.error) {
    const restMessage = data?.error?.message || "UNKNOWN_ERROR";
    const err = new Error(restMessage);
    err.code = mapFirebaseRestErrorToAuthCode(restMessage);
    throw err;
  }

  return {
    uid: data.localId,
    token: data.idToken,
    email: data.email,
  };
};

export const fetchProfile = async (uid, idToken) => {
  const res = await fetch(
    `${FIREBASE_DB_URL}/users/${uid}.json?auth=${idToken}`
  );

  if (!res.ok) {
    const err = new Error("No se pudo leer el perfil");
    err.code = "profile/fetch-error";
    throw err;
  }

  return await res.json();
};

/* ----------------------- SOLICITUDES ----------------------- */

import {
  getDatabase,
  ref,
  push,
  update,
  onValue,
  query,
  orderByChild,
} from "firebase/database";

/**
 * Crea una solicitud en la Realtime Database.
 * Convierte automáticamente fechas Date → timestamp (ms)
 */
export const createSolicitud = async (solicitud) => {
  try {
    const db = getDatabase();
    const solicitudesRef = ref(db, "solicitudes");

    // Convertir fechaNecesaria → timestamp (ms)
    const fechaNecesariaMs =
      solicitud.fechaNecesaria instanceof Date
        ? solicitud.fechaNecesaria.getTime()
        : solicitud.fechaNecesaria ?? null;

    // Convertir creadoEn → timestamp (ms)
    const creadoEnMs =
      solicitud.creadoEn instanceof Date
        ? solicitud.creadoEn.getTime()
        : typeof solicitud.creadoEn === "number"
        ? solicitud.creadoEn
        : Date.now();

    const solicitudLista = {
      ...solicitud,
      fechaNecesaria: fechaNecesariaMs,
      creadoEn: creadoEnMs,
    };

    console.log(" GUARDANDO SOLICITUD EN RTDB:", solicitudLista);

    await push(solicitudesRef, solicitudLista);

    return { ok: true };
  } catch (err) {
    console.error("Error creando solicitud:", err);
    return { ok: false };
  }
};

/**
 * Actualiza el estado u otros campos de una solicitud por ID.
 */
export const updateSolicitud = async (id, data) => {
  try {
    const db = getDatabase();
    const solicitudRef = ref(db, `solicitudes/${id}`);

    await update(solicitudRef, data);

    return { ok: true };
  } catch (err) {
    console.error(" Error actualizando solicitud:", err);
    return { ok: false };
  }
};

/**
 * Escucha todas las solicitudes en tiempo real.
 * Las convierte en un arreglo [{ id, ...data }]
 */
export const listenSolicitudes = (callback) => {
  const db = getDatabase();
  const solicitudesRef = query(ref(db, "solicitudes"), orderByChild("usuario"));

  const unsubscribe = onValue(solicitudesRef, (snap) => {
    const data = snap.val() || {};
    const lista = Object.keys(data).map((id) => ({
      id,
      ...data[id],
    }));

    callback(lista);
  });

  return unsubscribe;
};

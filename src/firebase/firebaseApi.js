import { FIREBASE_API_KEY, FIREBASE_DB_URL } from '@env';
const AUTH_URL = "https://identitytoolkit.googleapis.com/v1/accounts";

export const registerUser = async (name, email, password, department, role) => {
  const res = await fetch(`${AUTH_URL}:signUp?key=${FIREBASE_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  const uid = data.localId;
  const token = data.idToken;
  const profile = { name, email, department, role, createdAt: Date.now() };

  const saveRes = await fetch(`${FIREBASE_DB_URL}/users/${uid}.json?auth=${token}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  if (!saveRes.ok) throw new Error("Error guardando perfil");

  return { uid, token };
};

export const loginUser = async (email, password) => {
  const res = await fetch(`${AUTH_URL}:signInWithPassword?key=${FIREBASE_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return { uid: data.localId, token: data.idToken, email: data.email };
};

export const fetchProfile = async (uid, idToken) => {
  const res = await fetch(`${FIREBASE_DB_URL}/users/${uid}.json?auth=${idToken}`);
  if (!res.ok) throw new Error("No se pudo leer el perfil");
  return await res.json();
};

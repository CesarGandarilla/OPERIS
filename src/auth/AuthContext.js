import React, { createContext, useContext, useState } from "react";
import { registerUser, loginUser, fetchProfile } from "../firebase/firebaseApi";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const register = async ({ name, email, password, department, role }) => {
    setLoading(true);
    try {
      const { uid, token } = await registerUser(name, email, password, department, role);
      const profile = await fetchProfile(uid, token);
      setUser({ uid, email, token, profile });
      return { user: { uid, email, token, profile }, role: profile.role };
    } finally {
      setLoading(false);
    }
  };

  const login = async ({ email, password }) => {
    setLoading(true);
    try {
      const { uid, token } = await loginUser(email, password);
      const profile = await fetchProfile(uid, token);
      setUser({ uid, email, token, profile });
      return { user: { uid, email, token, profile }, role: profile.role };
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

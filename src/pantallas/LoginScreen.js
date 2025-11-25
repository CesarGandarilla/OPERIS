// src/pantallas/LoginScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../auth/AuthContext";

const isValidEmail = (email) => {
  const trimmed = email.trim();
  const regex = /^\S+@\S+\.\S+$/;
  return regex.test(trimmed);
};

export default function LoginScreen({ navigation }) {
  const { login, loading } = useAuth() || {};
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const onLogin = async () => {
    if (loading) return;

    const trimmedEmail = email.trim().toLowerCase();
    const newErrors = { email: "", password: "" };

    // Validar correo
    if (!trimmedEmail) {
      newErrors.email = "El correo es obligatorio.";
    } else if (!isValidEmail(trimmedEmail)) {
      newErrors.email = "Ingresa un correo electrónico válido.";
    }

    // Validar contraseña
    if (!password) {
      newErrors.password = "La contraseña es obligatoria.";
    }

    if (newErrors.email || newErrors.password) {
      setErrors(newErrors);
      return;
    }

    setErrors({ email: "", password: "" });

    try {
      await login({ email: trimmedEmail, password });
    } catch (e) {
      // Aquí ya llega algo como:
      // "El correo no se encuentra registrado."
      // o "La contraseña es incorrecta."
      Alert.alert("Error", e.message || "No se pudo iniciar sesión.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          {/* Header igual que registro */}
          <LinearGradient
            colors={["#00c6a7", "#02a4b3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerBackground}
          >
            <Text style={styles.headerTitle}>¡Hola de nuevo!</Text>
            <Text style={styles.headerSubtitle}>
              Inicia sesión para continuar
            </Text>
          </LinearGradient>

          {/* Formulario */}
          <View className="form" style={styles.form}>
            {/* CORREO */}
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: "" }));
                }
              }}
              placeholderTextColor="#999"
            />
            {errors.email ? (
              <Text style={styles.errorText}>{errors.email}</Text>
            ) : null}

            {/* CONTRASEÑA */}
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                placeholder="Contraseña"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) {
                    setErrors((prev) => ({ ...prev, password: "" }));
                  }
                }}
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={styles.showPasswordButton}
                onPress={() => setShowPassword((prev) => !prev)}
              >
                <Text style={styles.showPasswordText}>
                  {showPassword ? "Ocultar" : "Ver"}
                </Text>
              </TouchableOpacity>
            </View>
            {errors.password ? (
              <Text style={styles.errorText}>{errors.password}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.6 }]}
              onPress={onLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Entrando..." : "Entrar"}
              </Text>
            </TouchableOpacity>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                marginTop: 15,
              }}
            >
              <Text style={styles.register}>¿No tienes cuenta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.link}>Regístrate aquí</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f9fc" },

  /* HEADER IGUAL QUE REGISTRO */
  headerBackground: {
    height: 230,
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: 50,
  },
  headerTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "white",
    fontSize: 16,
    opacity: 0.9,
    marginTop: 6,
  },

  /* FORM */
  form: {
    backgroundColor: "white",
    marginHorizontal: 20,
    padding: 25,
    borderRadius: 25,
    marginTop: -30,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    fontSize: 15,
    color: "#333",
  },

  errorText: {
    color: "#e53935",
    fontSize: 12,
    marginBottom: 7,
  },

  passwordWrapper: {
    position: "relative",
    marginBottom: 4,
  },

  inputWithIcon: {
    paddingRight: 60, // espacio para el botón "Ver/Ocultar"
  },

  showPasswordButton: {
    position: "absolute",
    right: 15,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },

  showPasswordText: {
    color: "#00c6a7",
    fontSize: 12,
    fontWeight: "600",
  },

  button: {
    backgroundColor: "#00c6a7",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },

  register: {
    textAlign: "center",
    color: "#666",
  },
  link: {
    color: "#00c6a7",
    fontWeight: "600",
  },
});

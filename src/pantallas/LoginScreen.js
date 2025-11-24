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

export default function LoginScreen({ navigation }) {
  const { login, loading } = useAuth() || {};
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onLogin = async () => {
    if (!email || !password) {
      Alert.alert("Datos faltantes", "Ingresa correo y contraseña.");
      return;
    }
    try {
      await login({ email, password });
    } catch (e) {
      Alert.alert("Error", e.message);
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
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

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
    marginBottom: 15,
    fontSize: 15,
    color: "#333",
  },

  button: {
    backgroundColor: "#00bfa5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
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
    color: "#00bfa5",
    fontWeight: "600",
  },
});

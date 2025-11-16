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
import Svg, { Path } from "react-native-svg";
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
      const datos = await login({ email, password });

      navigation.replace("PanelDeControlScreen", {
      usuario: datos.user,      
      rol: datos.role,          
      });
       
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          {/* Fondo superior con degradado */}
          <LinearGradient
            colors={["#00c6a7", "#02a4b3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerBackground}
          >
            <Text style={styles.title}>¡Hola de nuevo!</Text>
            <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

            <Svg height="120" width="100%" viewBox="0 0 1440 320" style={styles.wave}>
              <Path
                fill="#00c6a7"
                d="M0,288L60,272C120,256,240,224,360,197.3C480,171,600,149,720,154.7C840,160,960,192,1080,197.3C1200,203,1320,181,1380,170.7L1440,160V320H0Z"
              />
            </Svg>
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
              style={[styles.button, loading && { opacity: 0.7 }]}
              onPress={onLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? "Entrando..." : "Entrar"}</Text>
            </TouchableOpacity>

            {/* Texto de registro con navegación */}
            <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 15 }}>
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
  headerBackground: { height: 260, justifyContent: "center", alignItems: "center", position: "relative" },
  wave: { position: "absolute", bottom: -1 },
  title: { color: "white", fontSize: 28, fontWeight: "bold", marginTop: 50 },
  subtitle: { color: "white", fontSize: 16, opacity: 0.9, marginTop: 6 },
  form: {
    backgroundColor: "white",
    marginHorizontal: 20,
    padding: 25,
    borderRadius: 25,
    marginTop: -30,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  input: { borderWidth: 1, borderColor: "#e5e5e5", borderRadius: 12, padding: 13, marginBottom: 15, fontSize: 15 },
  button: { backgroundColor: "#00bfa5", borderRadius: 12, paddingVertical: 13, alignItems: "center", marginTop: 5 },
  buttonText: { color: "white", fontWeight: "600", fontSize: 16 },
  register: { color: "#666" },
  link: { color: "#00bfa5", fontWeight: "600" },
});

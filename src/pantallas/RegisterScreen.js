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
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { useAuth } from "../auth/AuthContext";
import { ROLES, DEPARTAMENTOS } from "../constants/catalogos";

export default function RegisterScreen({ navigation }) {
  const { register, loading } = useAuth() || {};
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");

  const roles = Array.isArray(ROLES) ? ROLES : [];
  const departamentos = Array.isArray(DEPARTAMENTOS) ? DEPARTAMENTOS : [];

  const onRegister = async () => {
    if (!name || !email || !password || !role || !department) {
      Alert.alert(
        "Faltan datos",
        "Completa todos los campos y selecciona Rol y Departamento."
      );
      return;
    }
    try {
      await register({ name, email, password, department, role });
      // navigation.replace("Login");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {/* Fondo con degradado */}
          <LinearGradient
            colors={["#00c6a7", "#02a4b3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerBackground}
          >
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>Regístrate para comenzar</Text>

            {/* Onda inferior */}
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
              placeholder="Nombre completo"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />

            <TextInput
              placeholder="Correo"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />

            {/* Departamento */}
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={department}
                onValueChange={setDepartment}
                style={styles.picker}
              >
                <Picker.Item label="Selecciona un departamento" value="" />
                {departamentos.map((opt) => (
                  <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                ))}
              </Picker>
            </View>

            {/* Rol */}
            <View style={styles.pickerContainer}>
              <Picker selectedValue={role} onValueChange={setRole} style={styles.picker}>
                <Picker.Item label="Selecciona un rol" value="" />
                {roles.map((opt) => (
                  <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                ))}
              </Picker>
            </View>

            <TextInput
              placeholder="Contraseña (mín. 6)"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />

            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.7 }]}
              onPress={onRegister}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Creando..." : "Registrar"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.register}>
              ¿Ya tienes cuenta?{" "}
              <Text style={styles.link} onPress={() => navigation.navigate("Login")}>
                Inicia sesión
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// 🌊 Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f9fc",
  },
  headerBackground: {
    height: 260,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  wave: {
    position: "absolute",
    bottom: -1,
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 50,
  },
  subtitle: {
    color: "white",
    fontSize: 16,
    opacity: 0.9,
    marginTop: 6,
  },
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
  input: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    padding: 13,
    marginBottom: 15,
    fontSize: 15,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    marginBottom: 15,
    overflow: "hidden",
  },
  picker: {
    color: "#444",
  },
  button: {
    backgroundColor: "#00bfa5",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  register: {
    textAlign: "center",
    marginTop: 15,
    color: "#666",
  },
  link: {
    color: "#00bfa5",
    fontWeight: "600",
  },
});

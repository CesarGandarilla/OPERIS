// src/pantallas/RegisterScreen.js
import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useAuth } from "../auth/AuthContext";
import { ROLES, DEPARTAMENTOS } from "../constants/catalogos";

export default function RegisterScreen({ navigation }) {
  const { register, loading } = useAuth() || {};
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");

  // defensas por si algo se importa mal
  const roles = Array.isArray(ROLES) ? ROLES : [];
  const departamentos = Array.isArray(DEPARTAMENTOS) ? DEPARTAMENTOS : [];

  const onRegister = async () => {
    if (!name || !email || !password || !role || !department) {
      Alert.alert("Faltan datos", "Completa todos los campos y selecciona Rol y Departamento.");
      return;
    }
    try {
      await register({ name, email, password, department, role });
      // Si despues lo queremos campiar para volver a Login en lugar de ir a Tabs automáticamente:
      // navigation.replace("Login");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <View style={{ padding: 20, flex:1, justifyContent:"center" }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 12 }}>Crear cuenta</Text>

      <TextInput
        placeholder="Nombre completo"
        value={name}
        onChangeText={setName}
        style={{borderWidth:1, padding:10, marginBottom:10, borderRadius:8}}
      />

      <TextInput
        placeholder="Correo"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{borderWidth:1, padding:10, marginBottom:10, borderRadius:8}}
      />

      {/* Departamento */}
      <View style={{borderWidth:1, borderRadius:8, marginBottom:10, overflow:"hidden"}}>
        <Picker selectedValue={department} onValueChange={setDepartment}>
          {departamentos.map(opt => (
            <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
          ))}
        </Picker>
      </View>

      {/* Rol */}
      <View style={{borderWidth:1, borderRadius:8, marginBottom:10, overflow:"hidden"}}>
        <Picker selectedValue={role} onValueChange={setRole}>
          {roles.map(opt => (
            <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
          ))}
        </Picker>
      </View>

      <TextInput
        placeholder="Contraseña (mín. 6)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{borderWidth:1, padding:10, marginBottom:16, borderRadius:8}}
      />

      <Button title={loading ? "Creando..." : "Registrar"} onPress={onRegister} disabled={loading} />
    </View>
  );
}

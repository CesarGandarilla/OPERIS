import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, TouchableOpacity } from "react-native";
import { useAuth } from "../auth/AuthContext";

export default function LoginScreen({ navigation }) {
  const { login, loading } = useAuth() || {};
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onLogin = async () => {
    try {
      await login({ email, password });
      // Si login es correcto, RootNavigator cambiará a Tabs automáticamente
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <View style={{ padding: 20, flex:1, justifyContent:"center" }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 12 }}>Iniciar sesión</Text>

      <TextInput placeholder="Correo" autoCapitalize="none" value={email} onChangeText={setEmail}
        style={{borderWidth:1, padding:10, marginBottom:10}} />
      <TextInput placeholder="Contraseña" secureTextEntry value={password} onChangeText={setPassword}
        style={{borderWidth:1, padding:10, marginBottom:16}} />

      <Button title={loading ? "Entrando..." : "Entrar"} onPress={onLogin} />

      {/* LINK PARA REGISTRO */}
      <TouchableOpacity onPress={() => navigation.navigate("Register")} style={{ marginTop: 16 }}>
        <Text style={{ color: "#0a7", textAlign: "center" }}>
          ¿No tienes cuenta? Regístrate aquí
        </Text>
      </TouchableOpacity>
    </View>
  );
}

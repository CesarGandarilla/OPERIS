// src/pantallas/AjustesScreen.js
import React from 'react';
import { View, Text, Button } from 'react-native';
import { useAuth } from '../auth/AuthContext';

export default function AjustesScreen() {
  const { user, logout } = useAuth() || {};
  const p = user?.profile;

  return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding:16 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12 }}>Ajustes</Text>
      {p ? (
        <>
          <Text>Nombre: {p.name}</Text>
          <Text>Correo: {p.email}</Text>
          <Text>Departamento: {p.department}</Text>
          <Text>Rol: {p.role}</Text>
          <View style={{ height: 12 }} />
          <Button title="Cerrar sesión" onPress={logout} />
        </>
      ) : (
        <Text>No hay perfil cargado.</Text>
      )}
    </View>
  );
}

// src/componentes/EstadoBadge.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";

// Paleta de estados para TODA la app
const estadoColores = {
  // Solicitudes
  Pendiente: "#9CA3AF",
  Aceptada: "#3B82F6",
  Rechazada: "#EF4444",
  Lista: "#10B981",
  Verificada: "#22C55E",
  Problema: "#F59E0B",

  // Inventario
  Disponible: "#4CAF50",
  Bajo: "#FBC02D",
  Crítico: "#E53935",
  Agotado: "#9E9E9E",
  Desconocido: "#6B7280",
};

export default function EstadoBadge({ estado }) {
  const color = estadoColores[estado] || "#6B7280";

  return (
    <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{estado}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: "600",
  },
});
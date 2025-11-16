// FiltrosEstado.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { tema } from "../tema";

export default function FiltrosEstado({ estado, setEstado }) {
  const opciones = [
    "Todos",
    "Agotado",
    "Crítico",
    "Bajo",
  ];

  return (
    <View style={styles.container}>
      {opciones.map((op) => {
        const activo = estado === op;
        return (
          <TouchableOpacity
            key={op}
            style={[
              styles.chip,
              activo && styles.chipActivo,
            ]}
            onPress={() => setEstado(op)}
          >
            <Text
              style={[
                styles.texto,
                activo && styles.textoActivo,
              ]}
            >
              {op}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 5,
    marginBottom: 12,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: tema.colores.borde || "#00bfa5",
    backgroundColor: "#fff",
  },
  chipActivo: {
    backgroundColor: tema.colores.acento || "#00bfa5",
    borderColor: tema.colores.acento || "#00bfa5",
  },
  texto: {
    color: tema.colores.ink || "#333",
    fontSize: 13,
    fontWeight: "500",
  },
  textoActivo: {
    color: "#fff",
    fontWeight: "700",
  },
});

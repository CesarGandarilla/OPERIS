import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

export default function FiltroChips({ opciones, valorSeleccionado, onChange }) {  return (
    <View style={styles.contenedor}>
      {opciones.map((op) => {
        const activo = valorSeleccionado === op.id;

        return (
          <TouchableOpacity
            key={op.id}
            style={[styles.chip, activo && styles.chipActivo]}
            onPress={() => onChange(op.id)}
          >
            <Text style={[styles.texto, activo && styles.textoActivo]}>
              {op.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  chipActivo: {
    backgroundColor: "#00BFA5",
  },
  texto: {
    color: "#374151",
    fontSize: 13,
  },
  textoActivo: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
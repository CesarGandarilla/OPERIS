//HeaderInventario
HeaderInventario.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { tema } from "../tema";

export default function HeaderInventario({ agregarInsumo }) {
  return (
    <View style={styles.header}>
      <Text style={[styles.title, { color: INK }]}>Inventario</Text>

      {/* ⭐ SOLO mostrar botón si agregarInsumo existe */}
      {agregarInsumo && (
        <TouchableOpacity style={styles.addButton} onPress={agregarInsumo}>
          <Ionicons name="add" size={22} color="white" />
          <Text style={styles.addButtonText}>Agregar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const INK = tema?.colores?.ink || "#111827";

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00bfa5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 12,
  },
  addButtonText: { color: "white", fontWeight: "bold", marginLeft: 5 },
});

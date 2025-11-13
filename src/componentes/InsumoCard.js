//InsumoCard
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function InsumoCard({ item, onEdit }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.iconContainer}></View>
      </View>

      <View style={styles.cardCenter}>
        <Text style={styles.nombre}>{item.nombre}</Text>
        <Text style={styles.categoria}>{item.categoria}</Text>
        <View style={styles.estadoContainer}>
          <View
            style={[
              styles.estadoBadge,
              { backgroundColor: item.stock === 0 ? "#e53935" : item.stock > 50 ? "#4caf50" : "#e5b935ff" },
            ]}
          >
            <Text style={styles.estadoTexto}>
              {item.stock === 0 ? "Agotado" : item.stock > 50 ? "Disponible" : "Crítico !"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardRight}>
        <Text style={styles.stock}>Stock: {item.stock}</Text>
        <Text style={styles.codigo}>Código: {item.codigo}</Text>

        {/* Botón Editar */}
        <TouchableOpacity style={styles.editButton} onPress={() => onEdit(item)}>
          <Text style={styles.editText}>Editar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardLeft: { justifyContent: "center", alignItems: "center", marginRight: 10 },
  iconContainer: { backgroundColor: "#f1f1f1", padding: 10, borderRadius: 10 },
  cardCenter: { flex: 1, justifyContent: "center" },
  nombre: { fontWeight: "bold", fontSize: 15 },
  categoria: { color: "#888", marginVertical: 2 },
  estadoContainer: { marginTop: 4 },
  estadoBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: "flex-start" },
  estadoTexto: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  cardRight: { justifyContent: "center", alignItems: "flex-end" },
  stock: { fontWeight: "bold", fontSize: 14 },
  codigo: { color: "#888", fontSize: 12 },
  editButton: {
    marginTop: 6,
    backgroundColor: "#00bfa5",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  editText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
});
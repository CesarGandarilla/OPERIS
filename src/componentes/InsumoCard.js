// InsumoCard.jsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function InsumoCard({ item, onEdit }) {
  const stock = item.stock ?? 0;
  const stockCritico = item.stockCritico ?? 0;

  // Calcular stock bajo automáticamente
  const stockBajo = stockCritico * 2;

  // ----- Lógica de estado -----
  let estadoTexto = "";
  let estadoColor = "";

  if (stock === 0) {
    // AGOTADO
    estadoTexto = "Agotado";
    estadoColor = "#9e9e9e"; // gris
  } else if (stockCritico > 0 && stock > 0 && stock <= stockCritico) {
    // CRÍTICO
    estadoTexto = "Crítico";
    estadoColor = "#e53935"; // rojo
  } else if (stockCritico > 0 && stock > stockCritico && stock <= stockBajo) {
    // BAJO
    estadoTexto = "Bajo";
    estadoColor = "#fbc02d"; // amarillo
  } else {
    // DISPONIBLE
    estadoTexto = "Disponible";
    estadoColor = "#4caf50"; // verde
  }

  return (
    <View style={styles.card}>
      {/* Icono / inicial */}
      <View style={styles.cardLeft}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>
            {item.nombre?.charAt(0)?.toUpperCase() || "I"}
          </Text>
        </View>
      </View>

      {/* Centro: info */}
      <View style={styles.cardCenter}>
        <Text style={styles.nombre}>{item.nombre}</Text>
        <Text style={styles.categoria}>{item.categoria}</Text>

        <View style={styles.estadoContainer}>
          <View style={[styles.estadoBadge, { backgroundColor: estadoColor }]}>
            <Text style={styles.estadoTexto}>{estadoTexto}</Text>
          </View>
        </View>
      </View>

      {/* Derecha: stock, código, botón */}
      <View style={styles.cardRight}>
        <Text style={styles.stock}>Stock: {stock}</Text>
        <Text style={styles.codigo}>Código: {item.codigo}</Text>

        <TouchableOpacity style={styles.editButton} onPress={() => onEdit(item)}>
          <Text style={styles.editText}>Editar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ----------- ESTILOS -----------
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
  cardLeft: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  iconContainer: {
    backgroundColor: "#f1f1f1",
    padding: 10,
    borderRadius: 10,
    minWidth: 36,
    minHeight: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  cardCenter: {
    flex: 1,
    justifyContent: "center",
  },
  nombre: {
    fontWeight: "bold",
    fontSize: 15,
  },
  categoria: {
    color: "#888",
    marginVertical: 2,
    fontSize: 12,
  },
  estadoContainer: {
    marginTop: 4,
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  estadoTexto: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  cardRight: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  stock: {
    fontWeight: "bold",
    fontSize: 14,
  },
  codigo: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
  },
  editButton: {
    marginTop: 6,
    backgroundColor: "#00bfa5",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  editText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
});

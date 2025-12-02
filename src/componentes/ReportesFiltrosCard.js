// src/componentes/ReportesFiltrosCard.js
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const ReportesFiltrosCard = ({
  filtroRango,
  setFiltroRango,
  filtroDestino,
  setFiltroDestino,
  RANGOS,
  LUGARES_ENTREGA,
  accentColor,
}) => {
  return (
    <View style={[styles.card, styles.cardElevated]}>
      <Text style={styles.cardTitle}>Filtros</Text>

      <Text style={styles.filterLabel}>Rango de fechas</Text>
      <View style={styles.chipRow}>
        {RANGOS.map((r) => (
          <TouchableOpacity
            key={r.id}
            style={[
              styles.chip,
              filtroRango === r.id && {
                backgroundColor: accentColor,
              },
            ]}
            onPress={() => setFiltroRango(r.id)}
          >
            <Text
              style={[
                styles.chipText,
                filtroRango === r.id && styles.chipTextActive,
              ]}
            >
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.filterLabel, { marginTop: 12 }]}>Destino</Text>
      <View style={styles.chipRow}>
        <TouchableOpacity
          style={[
            styles.chip,
            filtroDestino === "todos" && {
              backgroundColor: accentColor,
            },
          ]}
          onPress={() => setFiltroDestino("todos")}
        >
          <Text
            style={[
              styles.chipText,
              filtroDestino === "todos" && styles.chipTextActive,
            ]}
          >
            Todos
          </Text>
        </TouchableOpacity>

        {LUGARES_ENTREGA.map((lugar) => (
          <TouchableOpacity
            key={lugar.id}
            style={[
              styles.chip,
              filtroDestino === lugar.id && {
                backgroundColor: accentColor,
              },
            ]}
            onPress={() => setFiltroDestino(lugar.id)}
          >
            <Text
              style={[
                styles.chipText,
                filtroDestino === lugar.id && styles.chipTextActive,
              ]}
            >
              {lugar.nombre}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default ReportesFiltrosCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  cardElevated: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginTop: 4,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  chipText: {
    fontSize: 13,
    color: "#374151",
  },
  chipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});

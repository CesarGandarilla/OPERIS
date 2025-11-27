import React from "react";
import { View, Text, StyleSheet } from "react-native";

const TopInsumosCard = ({ topInsumos, ACCENT }) => {
  return (
    <View style={[styles.card, styles.cardElevated]}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>Insumos más solicitados</Text>
        <Text style={styles.cardSubtitle}>Top 5</Text>
      </View>

      {topInsumos.map((i, idx) => (
        <View key={i.id} style={styles.rowItem}>
          <View style={styles.rowLeft}>
            <View
              style={[styles.indexCircle, { backgroundColor: "#F1F8F7" }]}
            >
              <Text style={[styles.indexCircleText, { color: ACCENT }]}>
                {idx + 1}
              </Text>
            </View>
            <Text style={styles.rowTitle}>{i.nombre}</Text>
          </View>
          <Text style={[styles.rowBadge, { color: ACCENT }]}>
            {i.totalCantidad} unid.
          </Text>
        </View>
      ))}
    </View>
  );
};

export default TopInsumosCard;

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
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
  rowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    alignItems: "center",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  indexCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  indexCircleText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  rowTitle: {
    fontSize: 14,
    color: "#111827",
    flexShrink: 1,
  },
  rowBadge: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
});

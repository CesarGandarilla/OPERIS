// src/componentes/KitCard.js
import React from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function KitCard({ kit, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.iconBox}>
        <MaterialIcons name="medical-services" size={28} color="#00BFA5" />
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {kit.nombre}
      </Text>

      <Text style={styles.itemsText}>
        {kit.items.length} ítems
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    height: 120,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    justifyContent: "space-between",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
  },

  iconBox: {
    width: 42,
    height: 42,
    backgroundColor: "#E8FFFB",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },

  itemsText: {
    fontSize: 12,
    color: "#777",
  },
});

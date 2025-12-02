//KitSelector.js
import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import KitCard from "./KitCard";
import { kits } from "../constants/kits";

export default function KitSelector({ onSelectKit }) {
  return (
    <View>
      <Text style={styles.titulo}>Seleccionar Kit</Text>

      <FlatList
        data={kits}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <KitCard
            kit={item}
            onPress={() => onSelectKit(item)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  titulo: {
    fontSize: 18,
    fontWeight: "700",
    height: 130 ,
    marginBottom: 5,
  },
});

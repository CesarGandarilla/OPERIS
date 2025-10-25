// src/componentes/StatCard.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { tema } from "../tema";

const StatCard = ({ icon, titulo, valor, subtitulo, iconBackgroundColor }) => {
  return (
    <View style={[styles.card, tema.sombraLg]}>
      <View style={[styles.iconWrap, iconBackgroundColor && { backgroundColor: iconBackgroundColor }]}>
        {icon}
      </View>
      <View>
        <Text style={styles.titulo}>{titulo}</Text>
        <Text style={styles.valor}>{valor}</Text>
        {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
      </View>
    </View>
  );
};

export default StatCard;

const styles = StyleSheet.create({
  card: {
    width: "48%",
    minHeight: 110,
    backgroundColor: tema.colores.card,
    borderRadius: tema.radios.md,
    borderWidth: 1,
    borderColor: tema.colores.border,
    padding: 14,
    justifyContent: "space-between",
    marginBottom: 13,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F1F5F9", // valor por defecto
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  titulo: { color: tema.colores.sub, fontSize: 14 },
  valor: { color: tema.colores.ink, fontSize: 22, fontWeight: "700" },
  subtitulo: { color: tema.colores.sub, fontSize: 12 },
});

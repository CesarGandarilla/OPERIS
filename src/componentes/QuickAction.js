import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { tema } from "../tema";
import { ArrowIcon } from "./icons";

const QuickAction = ({ icono, titulo, subtitulo, onPress }) => {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
      <View style={styles.left}>
        <View style={styles.iconWrap}>{icono}</View>
        <View>
          <Text style={styles.titulo}>{titulo}</Text>
          {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
        </View>
      </View>
      <ArrowIcon />
    </Pressable>
  );
};

export default QuickAction;

const styles = StyleSheet.create({
  card: {
    backgroundColor: tema.colores.card,
    borderRadius: tema.radios.md,
    borderWidth: 1,
    borderColor: tema.colores.border,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...tema.sombraLg,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#E7F7F6",
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: { color: tema.colores.ink, fontSize: 15, fontWeight: "600" },
  subtitulo: { color: tema.colores.sub, fontSize: 12 },
});

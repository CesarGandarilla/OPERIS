// componentes/SelectorCategoria.js
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import ModalSelector from "react-native-modal-selector";

export default function SelectorCategoria({ categoria, setCategoria }) {
  const categorias = [
    { key: "Anestesiología", label: "Anestesiología" },
    { key: "Cardiología", label: "Cardiología" },
    { key: "Cirugía general", label: "Cirugía general" },
    { key: "Maxilofacial", label: "Maxilofacial" },
    { key: "Reconstructiva", label: "Reconstructiva" },
    { key: "Pulmonar", label: "Pulmonar" },
    { key: "Ginecología", label: "Ginecología" },
    { key: "Preventiva", label: "Preventiva" },
    { key: "Nefrología", label: "Nefrología" },
    { key: "Neurología", label: "Neurología" },
    { key: "Traumatología y Ortopedia", label: "Traumatología y Ortopedia" },
    { key: "Generales", label: "Generales" },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Selecciona una categoría</Text>

      <ModalSelector
        data={categorias}
        initValue="Selecciona una categoría"
        onChange={(option) => setCategoria(option.key)}
        cancelText="Cancelar"
        optionTextStyle={{ fontSize: 16 }}
        cancelTextStyle={{ color: "red" }}
        style={styles.selector}
      >
        <TouchableOpacity style={styles.input}>
          <Text style={categoria ? styles.value : styles.placeholder}>
            {categoria || "Selecciona una categoría"}
          </Text>
        </TouchableOpacity>
      </ModalSelector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },

  label: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },

  selector: {
    width: "100%",
  },

  input: {
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  placeholder: {
    color: "#999",
  },
  value: {
    color: "#333",
    fontWeight: "500",
  },
});

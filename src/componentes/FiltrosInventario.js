// FiltrosInventario.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  FlatList,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function FiltrosInventario({ filtro, setFiltro }) {
  const [visible, setVisible] = useState(false);
  const animHeight = useRef(new Animated.Value(0)).current;

  const categorias = [
    "Todos",
    "Anestesiología",
    "Cardiología",
    "Cirugía general",
    "Maxilofacial",
    "Reconstructiva",
    "Pulmonar",
    "Ginecología",
    "Preventiva",
    "Nefrología",
    "Neurología",
    "Traumatología y Ortopedia",
    "Generales",
  ];

  const toggleMenu = () => setVisible(!visible);

  useEffect(() => {
    Animated.timing(animHeight, {
      toValue: visible ? categorias.length * 41 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [visible]);

  const seleccionar = (cat) => {
    setFiltro(cat);
    setVisible(false);
  };

  return (
    <View style={styles.wrapper}>
      {/* Botón principal */}
      <TouchableOpacity style={styles.button} onPress={toggleMenu}>
        <Ionicons name="filter-outline" size={20} color="#00bfa5" />
        <Text style={styles.buttonText}>
          {filtro || "Seleccionar categoría"}
        </Text>
        <Ionicons
          name={visible ? "chevron-up" : "chevron-down"}
          size={18}
          color="#00bfa5"
          style={{ marginLeft: 4 }}
        />
      </TouchableOpacity>

      {/* Fondo transparente para cerrar el menú al tocar fuera */}
      {visible && (
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      {/* Menú desplegable animado */}
      <Animated.View style={[styles.dropdown, { height: animHeight }]}>
        {visible && (
          <FlatList
            data={categorias}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.item,
                  filtro === item && styles.itemSeleccionado,
                ]}
                onPress={() => seleccionar(item)}
              >
                <Text
                  style={[
                    styles.itemText,
                    filtro === item && styles.itemTextSeleccionado,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 15,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#00bfa5",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    zIndex: 10,
  },
  buttonText: {
    flex: 1,
    marginLeft: 8,
    color: "#00bfa5",
    fontWeight: "bold",
  },
  dropdown: {
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginTop: 5,
    elevation: 3,
    zIndex: 20,
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  itemSeleccionado: {
    backgroundColor: "#e0f2f1",
  },
  itemText: {
    fontSize: 15,
    color: "#333",
  },
  itemTextSeleccionado: {
    color: "#00bfa5",
    fontWeight: "bold",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 5,
  },
});

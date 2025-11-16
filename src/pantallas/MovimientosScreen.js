// src/pantallas/MovimientosScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";

import { listenSolicitudes } from "../firebase/firebaseApi";
import { useAuth } from "../auth/AuthContext";

export default function MovimientosScreen() {
  const { user } = useAuth();

  const usuario = user?.profile?.email;
  const rol = user?.profile?.role?.toLowerCase();

  const [solicitudes, setSolicitudes] = useState([]);
  const [filtro, setFiltro] = useState("Todos");

  useEffect(() => {
    const unsubscribe = listenSolicitudes((data) => {
      setSolicitudes(data);
    });
    return () => unsubscribe();
  }, []);

  // FILTRADO POR USUARIO
  const movimientosUser =
    rol === "ceye"
      ? solicitudes
      : solicitudes.filter((s) => s.usuario === usuario);

  // FILTRADO POR ESTADO
  const movimientosFiltrados =
    filtro === "Todos"
      ? movimientosUser
      : movimientosUser.filter((s) => s.estado === filtro);

  // COLORES POR ESTADO
  const getColor = (estado) => {
    switch (estado) {
      case "Pendiente":
        return "#757575";
      case "Aceptada":
        return "#1976D2";
      case "Rechazada":
        return "#E53935";
      case "Lista":
        return "#00897B";
      case "Verificada":
        return "#4CAF50";
      case "Problema":
        return "#FB8C00";
      default:
        return "#000";
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, { borderLeftColor: getColor(item.estado) }]}>
      <Text style={styles.titulo}>Solicitud de {item.usuario}</Text>

      {item.items?.map((i, idx) => (
        <Text key={idx} style={styles.item}>
          - {i.nombre} x {i.cantidad}
        </Text>
      ))}

      <Text style={[styles.estado, { color: getColor(item.estado) }]}>
        Estado: {item.estado}
      </Text>

      <Text style={styles.fecha}>
        Fecha: {new Date(item.creadoEn).toLocaleDateString()}
      </Text>
    </View>
  );

  const estados = [
    "Todos",
    "Pendiente",
    "Aceptada",
    "Rechazada",
    "Lista",
    "Verificada",
    "Problema",
  ];

  return (
    <View style={styles.container}>
      {/* Filtros */}
      <View style={styles.filtrosContainer}>
        {estados.map((e) => (
          <TouchableOpacity
            key={e}
            style={[
              styles.filtroBtn,
              filtro === e && styles.filtroBtnActivo,
            ]}
            onPress={() => setFiltro(e)}
          >
            <Text style={styles.filtroText}>{e}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista */}
      <FlatList
        data={movimientosFiltrados}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: "#f2f2f2" },

  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginVertical: 8,
    elevation: 2,
    borderLeftWidth: 6,
  },
  titulo: { fontWeight: "bold", fontSize: 16 },
  item: { marginLeft: 10 },
  estado: { marginTop: 6, fontWeight: "bold" },
  fecha: { marginTop: 4, color: "#555" },

  filtrosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
    gap: 8,
  },

  filtroBtn: {
    backgroundColor: "#b0bec5",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  filtroBtnActivo: {
    backgroundColor: "#0277bd",
  },
  filtroText: {
    color: "white",
    fontWeight: "bold",
  },
});
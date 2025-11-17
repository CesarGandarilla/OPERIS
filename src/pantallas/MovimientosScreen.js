// src/pantallas/MovimientosScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
    rol === "ceye" ? solicitudes : solicitudes.filter((s) => s.usuario === usuario);

  // FILTRADO POR ESTADO
  const movimientosFiltrados =
    filtro === "Todos"
      ? movimientosUser
      : movimientosUser.filter((s) => s.estado === filtro);

  // COLORES POR ESTADO
  const getColor = (estado) => {
    switch (estado) {
      case "Pendiente": return "#9E9E9E";
      case "Aceptada": return "#2196F3";
      case "Rechazada": return "#F44336";
      case "Lista": return "#00BFA5";
      case "Verificada": return "#4CAF50";
      case "Problema": return "#FF9800";
      default: return "#000";
    }
  };

  const getInitial = (usuario) => {
    return usuario?.charAt(0).toUpperCase() || "U";
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        {/* Avatar con inicial */}
        <View style={[styles.avatar, { backgroundColor: "#f0f0f0" }]}>
          <Text style={styles.avatarText}>
            {getInitial(item.usuario)}
          </Text>
        </View>

        {/* Información principal */}
        <View style={styles.infoContainer}>
          <Text style={styles.titulo}>{item.usuario}</Text>
          <Text style={styles.subtitle}>
            {item.items?.length || 0} {item.items?.length === 1 ? "artículo" : "artículos"}
          </Text>
          
          {/* Badge de estado */}
          <View style={[styles.badge, { backgroundColor: getColor(item.estado) }]}>
            <Text style={styles.badgeText}>{item.estado}</Text>
          </View>

          {/* Items */}
          {item.items && item.items.length > 0 && (
            <View style={styles.itemsContainer}>
              {item.items.slice(0, 2).map((i, idx) => (
                <Text key={idx} style={styles.itemText}>
                  • {i.nombre} × {i.cantidad}
                </Text>
              ))}
              {item.items.length > 2 && (
                <Text style={styles.moreItems}>
                  +{item.items.length - 2} más
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Lado derecho */}
        <View style={styles.rightContainer}>
          <Text style={styles.stockText}>
            {new Date(item.creadoEn).toLocaleDateString('es-MX', { 
              day: '2-digit', 
              month: 'short' 
            })}
          </Text>
        </View>
      </View>
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
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Movimientos</Text>
        </View>

        {/* Filtros con estilo píldora */}
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
              <Text
                style={[
                  styles.filtroText,
                  filtro === e && styles.filtroTextActivo,
                ]}
              >
                {e}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Lista */}
        <FlatList
          data={movimientosFiltrados}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { 
    flex: 1, 
    backgroundColor: "#f8f8f8" 
  },
  container: { 
    flex: 1, 
    padding: 10 
  },
  header: {
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    marginVertical: 6,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#555",
  },
  infoContainer: {
    flex: 1,
  },
  titulo: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  subtitle: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  badgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
  },
  itemsContainer: {
    marginTop: 8,
  },
  itemText: {
    fontSize: 13,
    color: "#555",
    marginVertical: 1,
  },
  moreItems: {
    fontSize: 12,
    color: "#00BFA5",
    fontWeight: "600",
    marginTop: 2,
  },
  rightContainer: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  stockText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
  },
  filtrosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  filtroBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#00BFA5",
    backgroundColor: "white",
  },
  filtroBtnActivo: {
    backgroundColor: "#00BFA5",
    borderColor: "#00BFA5",
  },
  filtroText: {
    fontSize: 14,
    color: "#00BFA5",
    fontWeight: "500",
  },
  filtroTextActivo: {
    color: "white",
    fontWeight: "600",
  },
});
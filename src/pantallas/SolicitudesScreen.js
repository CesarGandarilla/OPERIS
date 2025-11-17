// src/pantallas/SolicitudesScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AgregarSolicitudModal from "../componentes/AgregarSolicitudModal";
import {
  listenSolicitudes,
  updateSolicitud,
  createSolicitud,
} from "../firebase/firebaseApi";

import { useAuth } from "../auth/AuthContext";

export default function SolicitudesScreen() {
  const { user } = useAuth();

  const usuario = user?.profile?.email;
  const rol = user?.profile?.role?.toLowerCase();

  const [solicitudes, setSolicitudes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  // Crear nueva solicitud
  const crearSolicitud = async (items) => {
    await createSolicitud({
      usuario,
      rol,
      items,
      estado: "Pendiente",
      creadoEn: Date.now(),
    });

    Alert.alert("Solicitud creada", "Tu solicitud se envió correctamente.");
    setModalVisible(false);
  };

  // Solicitudes
  useEffect(() => {
    const unsubscribe = listenSolicitudes((data) => {
      setSolicitudes(data);
    });

    return () => unsubscribe();
  }, []);

  // SOLO CEYE
  const solicitudesMostradas =
    rol === "ceye"
      ? solicitudes 
      : solicitudes.filter((s) => s.usuario === usuario);

  //CEyE
  const aceptar = (id) => updateSolicitud(id, { estado: "Aceptada" });
  const rechazar = (id) => updateSolicitud(id, { estado: "Rechazada" });
  const marcarLista = (id) =>
    updateSolicitud(id, { estado: "Lista" }).then(() =>
      Alert.alert("Listo", "Se notificará al solicitante")
    );

  // ESTÁ LISTA O NO ESTÁ LISTA
  const verificarOk = (id) => updateSolicitud(id, { estado: "Verificada" });
  const verificarNo = (id) => updateSolicitud(id, { estado: "Problema" });

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

  // Tarjeta
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
              {item.items.map((i, idx) => (
                <Text key={idx} style={styles.itemText}>
                  • {i.nombre} × {i.cantidad}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Fecha derecha */}
        <View style={styles.rightContainer}>
          <Text style={styles.fechaText}>
            {new Date(item.creadoEn).toLocaleDateString('es-MX', { 
              day: '2-digit', 
              month: 'short' 
            })}
          </Text>
        </View>
      </View>

      {/* Botones de acción */}
      {/* CEyE */}
      {rol === "ceye" && (
        <View style={styles.actionsContainer}>
          {item.estado === "Pendiente" && (
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.btnAceptar}
                onPress={() => aceptar(item.id)}
              >
                <Text style={styles.btnText}>Aceptar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnRechazar}
                onPress={() => rechazar(item.id)}
              >
                <Text style={styles.btnText}>Rechazar</Text>
              </TouchableOpacity>
            </View>
          )}

          {item.estado === "Aceptada" && (
            <TouchableOpacity
              style={styles.btnLista}
              onPress={() => marcarLista(item.id)}
            >
              <Text style={styles.btnText}>Marcar como Lista</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Solicitante verifica */}
      {rol !== "ceye" &&
        item.usuario === usuario &&
        item.estado === "Lista" && (
          <View style={styles.actionsContainer}>
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.btnOk}
                onPress={() => verificarOk(item.id)}
              >
                <Text style={styles.btnText}>✔️ Todo bien</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnNo}
                onPress={() => verificarNo(item.id)}
              >
                <Text style={styles.btnText}>✖️ Hay problema</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        {/* Header con botón agregar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Solicitudes</Text>
            <Text style={styles.headerSubtitle}>
              {solicitudesMostradas.length} {solicitudesMostradas.length === 1 ? "solicitud" : "solicitudes"}
            </Text>
          </View>

          {/* Botón crear solicitud */}
          {rol !== "ceye" && (
            <TouchableOpacity
              style={styles.btnAgregar}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.btnAgregarText}>+ Agregar</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={solicitudesMostradas}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
        />

        <AgregarSolicitudModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          usuario={usuario}
          rol={rol}
          onEnviar={crearSolicitud}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#888",
    marginTop: 2,
  },
  btnAgregar: {
    backgroundColor: "#00BFA5",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  btnAgregarText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
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
  rightContainer: {
    alignItems: "flex-end",
  },
  fechaText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
  },
  actionsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  row: { 
    flexDirection: "row", 
    gap: 10 
  },
  btnAceptar: {
    flex: 1,
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnRechazar: {
    flex: 1,
    backgroundColor: "#F44336",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnLista: {
    backgroundColor: "#00BFA5",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnOk: {
    flex: 1,
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnNo: {
    flex: 1,
    backgroundColor: "#F44336",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { 
    color: "white", 
    fontWeight: "600",
    fontSize: 14,
  },
});
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
  const rol = user?.profile?.role?.toLowerCase(); // ← NORMALIZADO

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

  // Tarjeton
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.titulo}>Solicitud de {item.usuario}</Text>

      {item.items?.map((i, idx) => (
        <Text key={idx} style={styles.item}>
          - {i.nombre} x {i.cantidad}
        </Text>
      ))}

      <Text style={styles.estado}>Estado: {item.estado}</Text>

      {/* CEyE */}
      {rol === "ceye" && (
        <View style={styles.row}>
          {item.estado === "Pendiente" && (
            <>
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
            </>
          )}

          {item.estado === "Aceptada" && (
            <TouchableOpacity
              style={styles.btnLista}
              onPress={() => marcarLista(item.id)}
            >
              <Text style={styles.btnText}>Solicitud Lista</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Solicitante verifica */}
      {rol !== "ceye" &&
        item.usuario === usuario &&
        item.estado === "Lista" && (
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.btnOk}
              onPress={() => verificarOk(item.id)}
            >
              <Text style={styles.btnText}>✔️</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnNo}
              onPress={() => verificarNo(item.id)}
            >
              <Text style={styles.btnText}>✖️</Text>
            </TouchableOpacity>
          </View>
        )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Botón crear solicitud */}
      {rol !== "ceye" && (
        <TouchableOpacity
          style={styles.btnCrear}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.btnCrearText}>Crear Solicitud</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={solicitudesMostradas}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />

      <AgregarSolicitudModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        usuario={usuario}
        rol={rol}
        onEnviar={crearSolicitud}
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
  },
  titulo: { fontWeight: "bold", fontSize: 16 },
  item: { marginLeft: 10 },
  estado: { marginTop: 6, fontWeight: "bold" },

  row: { flexDirection: "row", marginTop: 10, gap: 10 },

  btnCrear: {
    backgroundColor: "#0277bd",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  btnCrearText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },

  btnAceptar: {
    flex: 1,
    backgroundColor: "#4caf50",
    padding: 10,
    borderRadius: 10,
  },
  btnRechazar: {
    flex: 1,
    backgroundColor: "#e53935",
    padding: 10,
    borderRadius: 10,
  },
  btnLista: {
    flex: 1,
    backgroundColor: "#00897b",
    padding: 10,
    borderRadius: 10,
  },

  btnOk: {
    flex: 1,
    backgroundColor: "#4caf50",
    padding: 12,
    borderRadius: 10,
  },
  btnNo: {
    flex: 1,
    backgroundColor: "#e53935",
    padding: 12,
    borderRadius: 10,
  },

  btnText: { color: "white", textAlign: "center", fontWeight: "bold" },
});

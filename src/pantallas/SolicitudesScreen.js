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
import { tema } from "../tema";

import AgregarSolicitudModal from "../componentes/AgregarSolicitudModal";
import SolicitudCard from "../componentes/SolicitudCard";
import {
  listenSolicitudes,
  updateSolicitud,
  createSolicitud,
} from "../firebase/firebaseApi";

import { useAuth } from "../auth/AuthContext";
import { getDateFromField } from "../utils/fechaUtils";

export default function SolicitudesScreen() {
  const { user } = useAuth();

  const usuario = user?.profile?.email;
  const rol = user?.profile?.role?.toLowerCase();

  const [solicitudes, setSolicitudes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  // Crear nueva solicitud (recibe items, fechaNecesaria, destino, cirugia)
  const crearSolicitud = async (solicitudData) => {
    try {
      await createSolicitud({
        usuario,
        rol,
        estado: "Pendiente",
        creadoEn: Date.now(), // timestamp en ms
        ...solicitudData,
      });

      Alert.alert("Solicitud creada", "Tu solicitud se envió correctamente.");
      setModalVisible(false);
    } catch (error) {
      console.error("Error creando solicitud", error);
      Alert.alert("Error", "No se pudo crear la solicitud.");
    }
  };
  const INK = tema?.colores?.ink || "#111827";

  // Escuchar solicitudes
  useEffect(() => {
    const unsubscribe = listenSolicitudes((data) => {
      setSolicitudes(data);
    });

    return () => unsubscribe();
  }, []);

  // SOLO CEYE ve todo, el resto solo las suyas
  const solicitudesMostradas =
    rol === "ceye"
      ? solicitudes
      : solicitudes.filter((s) => s.usuario === usuario);

  // Ordenar por urgencia (fechaNecesaria), luego por fecha de creación
  const solicitudesOrdenadas = [...solicitudesMostradas].sort((a, b) => {
    const da = getDateFromField(a.fechaNecesaria);
    const db = getDateFromField(b.fechaNecesaria);

    if (da && db) return da - db; // la más próxima primero
    if (da && !db) return -1;
    if (!da && db) return 1;

    const ca = getDateFromField(a.creadoEn) || 0;
    const cb = getDateFromField(b.creadoEn) || 0;
    return cb - ca; // más reciente primero
  });

  // Acciones CEyE
  const aceptar = (id) => updateSolicitud(id, { estado: "Aceptada" });
  const rechazar = (id) => updateSolicitud(id, { estado: "Rechazada" });
  const marcarLista = (id) =>
    updateSolicitud(id, { estado: "Lista" }).then(() =>
      Alert.alert("Listo", "Se notificará al solicitante")
    );

  // Verificación del solicitante
  const verificarOk = (id) => updateSolicitud(id, { estado: "Verificada" });
  const verificarNo = (id) => updateSolicitud(id, { estado: "Problema" });

  const renderItem = ({ item }) => (
    <SolicitudCard
      item={item}
      rol={rol}
      usuarioActual={usuario}
      onAceptar={aceptar}
      onRechazar={rechazar}
      onMarcarLista={marcarLista}
      onVerificarOk={verificarOk}
      onVerificarNo={verificarNo}
    />
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        {/* Header con botón agregar */}
        <View className="header" style={styles.header}>
          <View>
<           Text style={[styles.title, { color: INK }]}>Solicitudes</Text>
            <Text style={styles.headerSubtitle}>
              {solicitudesOrdenadas.length}{" "}
              {solicitudesOrdenadas.length === 1
                ? "solicitud"
                : "solicitudes"}
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
          data={solicitudesOrdenadas}
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
    backgroundColor: "#f8f8f8",
  },
  container: {
    flex: 1,
    padding: 10,
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
      title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 12,
  },
});
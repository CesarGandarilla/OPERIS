// src/pantallas/SolicitudesScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { tema } from "../tema";

import AgregarSolicitudModal from "../componentes/AgregarSolicitudModal";
import AgregarSolicitudRapidaModal from "../componentes/AgregarSolicitudRapidaModal";
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
  const [modalElaboradaVisible, setModalElaboradaVisible] = useState(false);
  const [modalRapidaVisible, setModalRapidaVisible] = useState(false);
  const [selectorVisible, setSelectorVisible] = useState(false);

  const INK = tema?.colores?.ink || "#111827";

  // Crear solicitud elaborada
  const crearSolicitud = async (solicitudData) => {
    try {
      await createSolicitud({
        usuario,
        rol,
        estado: "Pendiente",
        creadoEn: Date.now(),
        tipo: "elaborada",
        ...solicitudData,
      });

      Alert.alert("Solicitud creada", "Tu solicitud elaborada se envió.");
      setModalElaboradaVisible(false);
    } catch (error) {
      console.error("Error creando solicitud elaborada", error);
      Alert.alert("Error", "No se pudo crear la solicitud.");
    }
  };

  // Crear solicitud rápida
  const crearSolicitudRapida = async (item) => {
    try {
      await createSolicitud({
        usuario,
        rol,
        estado: "Pendiente",
        creadoEn: Date.now(),
        tipo: "rapida",
        items: [item], // ← SOLO 1 ITEM
      });

      Alert.alert("Solicitud rápida enviada");
      setModalRapidaVisible(false);
    } catch (error) {
      console.error("Error creando solicitud rápida", error);
      Alert.alert("Error", "No se pudo enviar la solicitud rápida.");
    }
  };

  // Escuchar solicitudes
  useEffect(() => {
    const unsub = listenSolicitudes((data) => setSolicitudes(data));
    return () => unsub();
  }, []);

  // CEyE ve todo, los demás solo las suyas
  const solicitudesMostradas =
    rol === "ceye"
      ? solicitudes
      : solicitudes.filter((s) => s.usuario === usuario);

  // Ordenar por urgencia → fecha necesaria → fecha creación
  const solicitudesOrdenadas = [...solicitudesMostradas].sort((a, b) => {
    const da = getDateFromField(a.fechaNecesaria);
    const db = getDateFromField(b.fechaNecesaria);

    if (da && db) return da - db;
    if (da && !db) return -1;
    if (!da && db) return 1;

    return (b.creadoEn || 0) - (a.creadoEn || 0);
  });

  // Acciones CEyE
  const aceptar = (id) => updateSolicitud(id, { estado: "Aceptada" });
  const rechazar = (id) => updateSolicitud(id, { estado: "Rechazada" });
  const marcarLista = (id) =>
    updateSolicitud(id, { estado: "Lista" }).then(() =>
      Alert.alert("Listo", "El solicitante ha sido notificado.")
    );

  // Acciones de verificación
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
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: INK }]}>Solicitudes</Text>
            <Text style={styles.headerSubtitle}>
              {solicitudesOrdenadas.length}{" "}
              {solicitudesOrdenadas.length === 1
                ? "solicitud"
                : "solicitudes"}
            </Text>
          </View>

          {/* Botón agregar → solo para roles ≠ CEYE */}
          {rol !== "ceye" && (
            <TouchableOpacity
              style={styles.btnAgregar}
              onPress={() => setSelectorVisible(true)}
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

        {/* MODAL SELECTOR */}
        <Modal transparent visible={selectorVisible} animationType="fade">
          <View style={styles.selectorOverlay}>
            <View style={styles.selectorBox}>
              <Text style={styles.selectorTitle}>Tipo de solicitud</Text>

              <TouchableOpacity
                style={styles.selectorBtn}
                onPress={() => {
                  setSelectorVisible(false);
                  setModalElaboradaVisible(true);
                }}
              >
                <Text style={styles.selectorBtnText}>Solicitud elaborada</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.selectorBtn}
                onPress={() => {
                  setSelectorVisible(false);
                  setModalRapidaVisible(true);
                }}
              >
                <Text style={styles.selectorBtnText}>Solicitud rápida</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectorVisible(false)}
                style={styles.selectorCancel}
              >
                <Text style={styles.selectorCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL ELABORADA */}
        <AgregarSolicitudModal
          visible={modalElaboradaVisible}
          onClose={() => setModalElaboradaVisible(false)}
          usuario={usuario}
          rol={rol}
          onEnviar={crearSolicitud}
        />

        {/* MODAL RÁPIDA */}
        <AgregarSolicitudRapidaModal
          visible={modalRapidaVisible}
          onClose={() => setModalRapidaVisible(false)}
          usuario={usuario}
          rol={rol}
          onEnviar={crearSolicitudRapida}
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
  container: { flex: 1, padding: 10 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 12 },
  headerSubtitle: { fontSize: 14, color: "#888" },
  btnAgregar: {
    backgroundColor: "#00BFA5",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  btnAgregarText: { color: "#fff", fontWeight: "600" },

  // Selector de tipo de solicitud
  selectorOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  selectorBox: {
    backgroundColor: "#fff",
    padding: 20,
    width: "80%",
    borderRadius: 16,
  },
  selectorTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  selectorBtn: {
    backgroundColor: "#00BFA5",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  selectorBtnText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  selectorCancel: { marginTop: 8, padding: 8 },
  selectorCancelText: { textAlign: "center", color: "red" },
});

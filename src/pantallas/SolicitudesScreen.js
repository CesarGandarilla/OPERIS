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
import { descontarStock } from "../firebase/descontarStock";
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
  const crearSolicitudRapida = async (solicitud) => {
    try {
      await createSolicitud(solicitud);

      Alert.alert("Solicitud rápida enviada");
      setModalRapidaVisible(false);
    } catch (error) {
      console.error("Error creando solicitud rápida", error);
      Alert.alert("Error", "No se pudo enviar la solicitud rápida.");
    }
  };

  // Listener solicitudes
  useEffect(() => {
    const unsub = listenSolicitudes((data) => setSolicitudes(data));
    return () => unsub();
  }, []);

  // CEyE ve todo
  const solicitudesActivas = solicitudes.filter((s) => {
    if (rol === "ceye") {
      return ["Pendiente", "Aceptada"].includes(s.estado);
    }

    // Enfermería ve solo las suyas
    return (
      s.usuario === usuario &&
      ["Pendiente", "Aceptada", "Lista"].includes(s.estado)
    );
  });

  // Ordenar por fecha necesaria o fecha de creación
  const solicitudesOrdenadas = [...solicitudesActivas].sort((a, b) => {
    const da = getDateFromField(a.fechaNecesaria);
    const db = getDateFromField(b.fechaNecesaria);

    if (da && db) return da - db;
    if (da && !db) return -1;
    if (!da && db) return 1;

    return (b.creadoEn || 0) - (a.creadoEn || 0);
  });

  // ================================
  // ACCIONES CEYE
  // ================================
  const aceptar = (id) =>
    updateSolicitud(id, { estado: "Aceptada" });

  const rechazar = async (id) => {
    try {
      const solicitud = solicitudes.find((s) => s.id === id);

      await updateSolicitud(id, {
        estadoAnterior: solicitud.estado || "Pendiente",
        fechaRechazo: Date.now(),
        rechazoConfirmado: false,
        estado: "Rechazada",
      });
    } catch (e) {
      console.error("Error al rechazar:", e);
    }
  };

  const deshacerRechazo = async (id) => {
    try {
      const sol = solicitudes.find((s) => s.id === id);

      if (!sol?.estadoAnterior) {
        Alert.alert("Error", "No hay estado previo para restaurar.");
        return;
      }

      await updateSolicitud(id, {
        estado: sol.estadoAnterior,
        estadoAnterior: null,
        fechaRechazo: null,
        rechazoConfirmado: false,
      });

      Alert.alert("Revertido", "Se deshizo el rechazo.");
    } catch (e) {
      console.error("Error deshacer rechazo:", e);
    }
  };

  const confirmarRechazo = async (id) => {
    try {
      await updateSolicitud(id, {
        rechazoConfirmado: true,
        estadoAnterior: null,
        fechaRechazo: null,
        estado: "Rechazada",
      });

      Alert.alert("Confirmado", "El rechazo fue confirmado.");
    } catch (e) {
      console.error("Error confirmando rechazo:", e);
    }
  };

  const marcarLista = async (id) => {
    try {
      await updateSolicitud(id, { estado: "Lista" });
    } catch (e) {
      console.error("Error marcar lista:", e);
    }
  };

  // ================================
  // ACCIONES ENFERMERÍA
  // ================================
  const verificarOk = async (id) => {
    try {
      const sol = solicitudes.find((s) => s.id === id);

      if (sol?.items?.length > 0) {
        const resultado = await descontarStock(sol.items);

        if (!resultado.ok) {
          const fallos = resultado.details
            .filter((d) => d.error)
            .map((d) => `${d.item?.nombre}: ${d.error}`)
            .join("\n");

          Alert.alert("Advertencia", `Algunos items no se actualizaron:\n${fallos}`);
        }
      }

      await updateSolicitud(id, { estado: "Verificada" });
      Alert.alert("Correcto", "La solicitud fue verificada.");
    } catch (error) {
      console.error("Error verificar OK:", error);
    }
  };

  const verificarNo = (id) =>
    updateSolicitud(id, { estado: "Problema" });

  // Render card
  const renderItem = ({ item }) => (
    <SolicitudCard
      item={item}
      rol={rol}
      usuarioActual={usuario}
      onAceptar={aceptar}
      onRechazar={rechazar}
      onRevertirRechazo={deshacerRechazo}
      onConfirmarRechazo={confirmarRechazo}
      onMarcarLista={marcarLista}
      onVerificarOk={verificarOk}
      onVerificarNo={verificarNo}
    />
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: INK }]}>Solicitudes</Text>
            <Text style={styles.headerSubtitle}>
              {solicitudesOrdenadas.length}{" "}
              {solicitudesOrdenadas.length === 1 ? "solicitud" : "solicitudes"}
            </Text>
          </View>

          {rol !== "ceye" && (
            <TouchableOpacity
              style={styles.btnAgregar}
              onPress={() => setSelectorVisible(true)}
            >
              <Text style={styles.btnAgregarText}>+ Agregar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* LISTA */}
        <FlatList
          data={solicitudesOrdenadas}
          renderItem={renderItem}
          keyExtractor={(i) => i.id}
        />

        {/* MODAL SELECTOR */}
        <Modal transparent visible={selectorVisible}>
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

        {/* MODALES */}
        <AgregarSolicitudModal
          visible={modalElaboradaVisible}
          onClose={() => setModalElaboradaVisible(false)}
          usuario={usuario}
          rol={rol}
          onEnviar={crearSolicitud}
        />

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
  safeContainer: { flex: 1, backgroundColor: "#f8f8f8" },
  container: { flex: 1, padding: 10 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    alignItems: "center",
  },

  title: { fontSize: 26, fontWeight: "800" },
  headerSubtitle: { fontSize: 14, color: "#777" },

  btnAgregar: {
    backgroundColor: "#00BFA5",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  btnAgregarText: { color: "white", fontWeight: "700" },

  selectorOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  selectorBox: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 16,
    width: "80%",
  },
  selectorTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 15,
  },
  selectorBtn: {
    backgroundColor: "#00BFA5",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  selectorBtnText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  selectorCancel: { marginTop: 8 },
  selectorCancelText: { textAlign: "center", color: "red" },
});

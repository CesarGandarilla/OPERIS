// src/pantallas/SolicitudesScreen.js
import React, { useEffect, useState, useCallback } from "react";
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
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import { tema } from "../tema";
import { descontarStock } from "../firebase/descontarStock";
import AgregarSolicitudModal from "../componentes/AgregarSolicitudModal";
import AgregarSolicitudRapidaModal from "../componentes/AgregarSolicitudRapidaModal";
import SolicitudCard from "../componentes/SolicitudCard";
import { getInventario } from "../firebase/firebaseApi";
import { listenSolicitudes, updateSolicitud, createSolicitud } from "../firebase/firebaseApi";
import { useAuth } from "../auth/AuthContext";
import { getDateFromField } from "../utils/fechaUtils";

//KITS IMPORTADOS
import { kits } from "../constants/kits";
import { MaterialIcons } from "@expo/vector-icons";

export default function SolicitudesScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const usuario = user?.profile?.email;
  const rol = user?.profile?.role?.toLowerCase();

  const [solicitudes, setSolicitudes] = useState([]);
  const [modalElaboradaVisible, setModalElaboradaVisible] = useState(false);
  const [modalRapidaVisible, setModalRapidaVisible] = useState(false);
  const [selectorVisible, setSelectorVisible] = useState(false);

  const INK = tema?.colores?.ink || "#111827";

  const filtroInicial = route.params?.filtroInicial || "Activas";
  const [modoFiltro, setModoFiltro] = useState(filtroInicial);

  useEffect(() => {
    setModoFiltro(filtroInicial);
  }, [filtroInicial]);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.abrirSelector && rol !== "ceye") {
        setSelectorVisible(true);
        navigation.setParams({
          ...route.params,
          abrirSelector: false,
        });
      }
    }, [route.params?.abrirSelector, rol, navigation])
  );

  // Crear solicitud elaborada
  const crearSolicitud = async (solicitudData) => {
    try {
      const inventario = await getInventario();

      for (const item of solicitudData.items) {
        const itemInv = inventario.find((i) => i.nombre === item.nombre);

        if (!itemInv) {
          Alert.alert("Error", `El item ${item.nombre} no existe en inventario.`);
          return;
        }

        if (item.cantidad > itemInv.stock) {
          Alert.alert(
            "Cantidad inválida",
            `Solo hay ${itemInv.stock} unidades de ${item.nombre} en inventario.`
          );
          return;
        }
      }

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
      const inventario = await getInventario();

      for (const item of solicitud.items) {
        const itemInv = inventario.find((i) => i.nombre === item.nombre);

        if (!itemInv) {
          Alert.alert("Error", `El item ${item.nombre} no existe en inventario.`);
          return;
        }

        if (item.cantidad > itemInv.stock) {
          Alert.alert(
            "Cantidad inválida",
            `Solo hay ${itemInv.stock} unidades de ${item.nombre} en inventario.`
          );
          return;
        }
      }

      await createSolicitud(solicitud);

      Alert.alert("Solicitud rápida enviada");
      setModalRapidaVisible(false);
    } catch (error) {
      console.error("Error creando solicitud rápida", error);
      Alert.alert("Error", "No se pudo enviar la solicitud rápida.");
    }
  };

  // CREAR SOLICITUD DESDE KIT
  const crearSolicitudDesdeKit = async (kit) => {
    try {
      const solicitudData = {
        usuario,
        rol,
        estado: "Pendiente",
        creadoEn: Date.now(),
        tipo: "elaborada",
        items: kit.items.map((i) => ({
          nombre: i.nombre,
          cantidad: i.cantidad,
        })),
        nota: `Solicitud generada desde kit: ${kit.nombre}`,
      };

      const inventario = await getInventario();

      for (const item of solicitudData.items) {
        const itemInv = inventario.find((i) => i.nombre === item.nombre);

        if (!itemInv) {
          Alert.alert("Error", `El item ${item.nombre} no existe en inventario.`);
          return;
        }

        if (item.cantidad > itemInv.stock) {
          Alert.alert(
            "Stock insuficiente",
            `Solo hay ${itemInv.stock} unidades de ${item.nombre}.`
          );
          return;
        }
      }

      await createSolicitud(solicitudData);
      Alert.alert("Kit agregado", `Se generó una solicitud para ${kit.nombre}`);
    } catch (e) {
      console.error("Error creando solicitud desde kit", e);
      Alert.alert("Error", "No se pudo crear la solicitud del kit.");
    }
  };

  // Listener
  useEffect(() => {
    const unsub = listenSolicitudes((data) => setSolicitudes(data));
    return () => unsub();
  }, []);

  const solicitudesActivas = solicitudes.filter((s) => {
    if (rol === "ceye") {
      return ["Pendiente", "Aceptada"].includes(s.estado);
    }
    return (
      s.usuario === usuario &&
      ["Pendiente", "Aceptada", "Lista"].includes(s.estado)
    );
  });

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const mañana = new Date(hoy);
  mañana.setDate(mañana.getDate() + 1);

  let solicitudesFiltradas = solicitudesActivas;

  if (rol !== "ceye" && modoFiltro === "Hoy") {
    solicitudesFiltradas = solicitudesActivas.filter((s) => {
      const fecha = getDateFromField(s.fechaNecesaria) || getDateFromField(s.creadoEn);
      if (!fecha) return false;
      return fecha >= hoy && fecha < mañana;
    });
  }

  const solicitudesOrdenadas = [...solicitudesFiltradas].sort((a, b) => {
    const da = getDateFromField(a.fechaNecesaria);
    const db = getDateFromField(b.fechaNecesaria);

    if (da && db) return da - db;
    if (da && !db) return -1;
    if (!da && db) return 1;

    return (b.creadoEn || 0) - (a.creadoEn || 0);
  });

  // Acciones CEYE
  const aceptar = (id) => updateSolicitud(id, { estado: "Aceptada" });

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

  const verificarNo = (id) => updateSolicitud(id, { estado: "Problema" });

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
              {rol !== "ceye" && modoFiltro === "Hoy" ? " para hoy" : ""}
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

        {/* SCROLL HORIZONTAL DE KITS */}
        {rol === "enfermero" && (
            <View style={{ height: 120, marginBottom: 10 }}>
              <FlatList
                data={kits}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingRight: 10 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => crearSolicitudDesdeKit(item)}
                    style={styles.kitCard}
                  >
                    <View style={styles.kitIcon}>
                      <MaterialIcons
                        name="medical-services"
                        size={24}
                        color="#00BFA5"
                      />
                    </View>

                    <Text style={styles.kitTitle} numberOfLines={1}>
                      {item.nombre}
                    </Text>

                    <Text style={styles.kitSubtitle}>
                      {item.items.length} items
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

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

  // ESTILOS DE LOS KITS
  kitCard: {
    width: 160,
    height: 100,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginRight: 10,
    padding: 12,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  kitIcon: {
    backgroundColor: "#E8FFFB",
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    marginBottom: 5,
  },

  kitTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },

  kitSubtitle: {
    fontSize: 12,
    color: "#777",
  },
});

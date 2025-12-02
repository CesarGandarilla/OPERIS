// src/pantallas/MovimientosScreen.js
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useAuth } from "../auth/AuthContext";
import { listenSolicitudes } from "../firebase/firebaseApi";
import { updateSolicitudEstado } from "../firebase/firebaseApi";
import { getDateFromField, formatFechaNecesaria } from "../utils/fechaUtils";
import { tema } from "../tema";

const INK = tema?.colores?.ink || "#111827";

// Badge color por estado
const getColor = (estado) => {
  switch (estado) {
    case "Pendiente":
      return "#9CA3AF";
    case "Aceptada":
      return "#3B82F6";
    case "Rechazada":
      return "#EF4444";
    case "Lista":
      return "#10B981";
    case "Verificada":
      return "#22C55E";
    case "Problema":
      return "#F59E0B";
    default:
      return "#6B7280";
  }
};

/** Dropdown genérico para filtros mejorado */
function DropdownFiltro({ label, value, options = [], onChange, isOpen, onToggle }) {
  const animHeight = useRef(new Animated.Value(0)).current;
  const ITEM_HEIGHT = 41;

  useEffect(() => {
    Animated.timing(animHeight, {
      toValue: isOpen ? options.length * ITEM_HEIGHT : 0,
      duration: 240,
      useNativeDriver: false,
    }).start();
  }, [isOpen, options.length, animHeight]);

  const seleccionar = (op) => {
    onChange(op);
    onToggle();
  };

  return (
    <View style={styles.filtroWrapper}>
      <Text style={styles.filtroLabel}>{label}</Text>

      <TouchableOpacity 
        style={[
          styles.filtroButton,
          isOpen && styles.filtroButtonActive
        ]} 
        onPress={onToggle} 
        activeOpacity={0.7}
      >
        <Ionicons name="filter-outline" size={18} color="#00bfa5" />
        <Text style={styles.filtroButtonText}>{value || "Selecciona..."}</Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={18}
          color="#00bfa5"
          style={{ marginLeft: 6 }}
        />
      </TouchableOpacity>

      {/* Menú desplegable animado */}
      <Animated.View style={[styles.filtroDropdown, { height: animHeight }]}>
        {isOpen && (
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filtroItem,
                  value === item && styles.filtroItemSeleccionado,
                ]}
                onPress={() => seleccionar(item)}
              >
                <Text
                  style={[
                    styles.filtroItemText,
                    value === item && styles.filtroItemTextSeleccionado,
                  ]}
                >
                  {item}
                </Text>
                {value === item && (
                  <Ionicons name="checkmark" size={16} color="#00bfa5" />
                )}
              </TouchableOpacity>
            )}
          />
        )}
      </Animated.View>
    </View>
  );
}

export default function MovimientosScreen() {
  const route = useRoute();
  const { user } = useAuth();
  const usuario = user?.profile?.email;
  const rol = user?.profile?.role?.toLowerCase();

  const estadoInicial = route.params?.estadoInicial || "Todos";

  const [solicitudes, setSolicitudes] = useState([]);
  const [filtro, setFiltro] = useState(estadoInicial);
  const [filtroFecha, setFiltroFecha] = useState("Todos");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Control de dropdowns abiertos
  const [dropdownAbierto, setDropdownAbierto] = useState(null);

  useEffect(() => {
    setFiltro(estadoInicial);
  }, [estadoInicial]);

  const estados = [
    "Todos",
    "Pendiente",
    "Aceptada",
    "Rechazada",
    "Lista",
    "Verificada",
    "Problema",
  ];

  const filtrosFecha = [
    "Todos",
    "Hoy",
    "Últimos 3 días",
    "Última semana",
    "Último mes",
  ];

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenSolicitudes((data) => {
      setSolicitudes(data);
      setLoading(false);
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  // Filtrar por usuario (si no es CEYE)
  const movimientosUser =
    rol === "ceye"
      ? solicitudes
      : solicitudes.filter((s) => s.usuario === usuario);

  const movimientosEstado =
    filtro === "Todos"
      ? movimientosUser
      : movimientosUser.filter((s) => s.estado === filtro);

  const inicioDeHoy = new Date();
  inicioDeHoy.setHours(0, 0, 0, 0);

  const movimientosFecha = movimientosEstado.filter((s) => {
    if (filtroFecha === "Todos") return true;

    const fecha = getDateFromField(s.creadoEn);
    if (!fecha) return false;

    const fechaDia = new Date(fecha);
    fechaDia.setHours(0, 0, 0, 0);

    const limite = new Date();
    limite.setHours(0, 0, 0, 0);

    switch (filtroFecha) {
      case "Hoy":
        return fechaDia.getTime() === inicioDeHoy.getTime();
      case "Últimos 3 días":
        limite.setDate(limite.getDate() - 2);
        return fechaDia >= limite && fechaDia <= inicioDeHoy;
      case "Última semana":
        limite.setDate(limite.getDate() - 6);
        return fechaDia >= limite && fechaDia <= inicioDeHoy;
      case "Último mes":
        limite.setDate(limite.getDate() - 29);
        return fechaDia >= limite && fechaDia <= inicioDeHoy;
      default:
        return true;
    }
  });

  const searchLower = search.toLowerCase();
  const movimientosFiltrados = movimientosFecha.filter((s) => {
    const usuarioStr = (s.usuario || "").toLowerCase();
    const itemsStr = (s.items || [])
      .map((i) => i.nombre?.toLowerCase() || "")
      .join(" ");
    const destinoStr = (s.destino || "").toLowerCase();
    const cirugiaStr = (s.cirugia || "").toLowerCase();

    return (
      usuarioStr.includes(searchLower) ||
      itemsStr.includes(searchLower) ||
      destinoStr.includes(searchLower) ||
      cirugiaStr.includes(searchLower)
    );
  });

  // Cambiar estado de solicitud
  async function cambiarEstado(id, nuevoEstado) {
    try {
      await updateSolicitudEstado(id, nuevoEstado);
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      // Aquí podrías mostrar una alerta al usuario
    }
  }

  const toggleDropdown = (nombre) => {
    setDropdownAbierto(dropdownAbierto === nombre ? null : nombre);
  };

  const renderItem = ({ item }) => {
    const fechaNecesariaTexto = formatFechaNecesaria(item.fechaNecesaria);
    const fechaCreacionDate = getDateFromField(item.creadoEn);
    const fechaCreacionTexto = fechaCreacionDate
      ? fechaCreacionDate.toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "Sin fecha";

    return (
      <View style={[styles.card, { borderLeftColor: getColor(item.estado) }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            Solicitud de {item.usuario || "Desconocido"}
          </Text>

          <View
            style={[
              styles.estadoBadge,
              { backgroundColor: `${getColor(item.estado)}20` },
            ]}
          >
            <View
              style={[styles.estadoDot, { backgroundColor: getColor(item.estado) }]}
            />
            <Text style={[styles.estadoText, { color: getColor(item.estado) }]}>
              {item.estado}
            </Text>
          </View>
        </View>

        {(item.destino || item.cirugia) && (
          <View style={{ marginTop: 4 }}>
            {item.destino && <Text style={styles.destinoText}>{item.destino}</Text>}
            {item.cirugia && <Text style={styles.cirugiaText}>{item.cirugia}</Text>}
          </View>
        )}

        {fechaNecesariaTexto && (
          <Text style={styles.fechaNecesaria}>Necesario: {fechaNecesariaTexto}</Text>
        )}

        <View style={styles.itemsContainer}>
          {item.items?.map((i, idx) => (
            <Text key={idx} style={styles.item}>
              • {i.nombre} × {i.cantidad}
            </Text>
          ))}
        </View>

        <Text style={styles.fechaCreacion}>Creado: {fechaCreacionTexto}</Text>

        {/* BOTONES DE CAMBIO DE ESTADO */}
        {rol === "enfermero" && item.estado === "Problema" && (
          <View style={styles.botonesRow}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#F59E0B" }]}
              onPress={() => cambiarEstado(item.id, "Lista")}
            >
              <Ionicons name="refresh" size={14} color="white" style={{ marginRight: 4 }} />
              <Text style={styles.btnText}>Reabrir</Text>
            </TouchableOpacity>
          </View>
        )}

        {rol === "ceye" && item.estado === "Rechazada" && (
          <View style={styles.botonesRow}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#EF4444" }]}
              onPress={() => cambiarEstado(item.id, "Pendiente")}
            >
              <Ionicons name="refresh" size={14} color="white" style={{ marginRight: 4 }} />
              <Text style={styles.btnText}>Reabrir</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Overlay para cerrar dropdowns */}
      {dropdownAbierto && (
        <TouchableWithoutFeedback onPress={() => setDropdownAbierto(null)}>
          <View style={styles.overlayGlobal} />
        </TouchableWithoutFeedback>
      )}

      <View style={styles.container}>
        <Text style={styles.title}>Movimientos</Text>

        <TextInput
          placeholder="Buscar usuario, insumo, destino o cirugía..."
          style={styles.searchBar}
          value={search}
          onChangeText={setSearch}
        />

        {/* FILTRO: ESTADO */}
        <DropdownFiltro
          label="Estado"
          value={filtro}
          options={estados}
          onChange={setFiltro}
          isOpen={dropdownAbierto === "estado"}
          onToggle={() => toggleDropdown("estado")}
        />

        {/* FILTRO: FECHA */}
        <DropdownFiltro
          label="Fecha"
          value={filtroFecha}
          options={filtrosFecha}
          onChange={setFiltroFecha}
          isOpen={dropdownAbierto === "fecha"}
          onToggle={() => toggleDropdown("fecha")}
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00bfa5" />
            <Text style={styles.loadingText}>Cargando movimientos...</Text>
          </View>
        ) : (
          <FlatList
            data={movimientosFiltrados}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingBottom: 30,
              paddingTop: 4,
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>
                  No hay movimientos con este filtro
                </Text>
                <Text style={styles.emptySubtext}>
                  Intenta cambiar los filtros o la búsqueda
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#F8F9FB" },
  container: { flex: 1, padding: 14 },

  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 8,
    color: INK,
  },

  searchBar: {
    backgroundColor: "#F2F2F6",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontSize: 14,
  },

  /* --- Overlay global --- */
  overlayGlobal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    zIndex: 100,
  },

  /* --- Dropdown styles --- */
  filtroWrapper: {
    marginBottom: 12,
    zIndex: 200,
  },
  
  filtroLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 6,
    marginLeft: 2,
  },

  filtroButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#00bfa5",
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
  },

  filtroButtonActive: {
    backgroundColor: "#F0FDFA",
    borderColor: "#00bfa5",
  },

  filtroButtonText: {
    flex: 1,
    marginLeft: 8,
    color: "#00bfa5",
    fontWeight: "600",
    fontSize: 14,
  },

  filtroDropdown: {
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    marginTop: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  filtroItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  filtroItemSeleccionado: {
    backgroundColor: "#F0FDFA",
  },

  filtroItemText: {
    fontSize: 14,
    color: "#374151",
  },

  filtroItemTextSeleccionado: {
    color: "#00bfa5",
    fontWeight: "600",
  },

  /* --- Cards --- */
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: INK,
    flex: 1,
    marginRight: 12,
  },

  estadoBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },

  estadoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  estadoText: {
    fontSize: 12,
    fontWeight: "700",
  },

  destinoText: {
    fontSize: 13,
    fontWeight: "600",
    color: INK,
  },

  cirugiaText: {
    fontSize: 12,
    color: "#4B5563",
  },

  fechaNecesaria: {
    marginTop: 6,
    fontSize: 12,
    color: "#6B7280",
  },

  itemsContainer: { 
    marginTop: 6,
    gap: 2,
  },

  item: {
    fontSize: 12,
    color: "#4B5563",
    marginVertical: 1,
  },

  fechaCreacion: {
    marginTop: 8,
    fontSize: 11,
    color: "#9CA3AF",
  },

  /* --- Botones de acción --- */
  botonesRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },

  btn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },

  btnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 12,
  },

  /* --- Loading y Empty --- */
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },

  emptyContainer: {
    marginTop: 60,
    alignItems: "center",
    paddingHorizontal: 40,
  },

  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
    textAlign: "center",
  },

  emptySubtext: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
    textAlign: "center",
  },
});
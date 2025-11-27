// src/pantallas/MovimientosScreen.js
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../auth/AuthContext";
import { listenSolicitudes } from "../firebase/firebaseApi";
import { getDateFromField, formatFechaNecesaria } from "../utils/fechaUtils";
import FiltroChips from "../componentes/FiltroChips";
import { tema } from "../tema";
import DateTimePicker from "@react-native-community/datetimepicker";

const INK = tema?.colores?.ink || "#111827";

// Badge color por estado
const getColor = (estado) => {
  const colores = {
    Pendiente: "#9CA3AF",
    Aceptada: "#3B82F6",
    Rechazada: "#EF4444",
    Lista: "#10B981",
    Verificada: "#22C55E",
    Problema: "#F59E0B",
  };
  return colores[estado] || "#6B7280";
};

// Estados del filtro
const ESTADOS = [
  "Todos",
  "Pendiente",
  "Aceptada",
  "Rechazada",
  "Lista",
  "Verificada",
  "Problema",
];

export default function MovimientosScreen() {
  const { user } = useAuth();
  const usuario = user?.profile?.email;
  const rol = user?.profile?.role?.toLowerCase();

  const [solicitudes, setSolicitudes] = useState([]);
  const [filtro, setFiltro] = useState("Todos");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [showInicioPicker, setShowInicioPicker] = useState(false);
  const [showFinPicker, setShowFinPicker] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenSolicitudes((data) => {
      setSolicitudes(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Normalizar fecha a medianoche
  const normalizarFecha = useCallback((fecha) => {
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  }, []);

  // Filtrar movimientos con useMemo para optimizar
  const movimientosFiltrados = useMemo(() => {
    // 1. Filtrar por usuario (si no es CEYE)
    let resultado =
      rol === "ceye"
        ? solicitudes
        : solicitudes.filter((s) => s.usuario === usuario);

    // 2. Filtrar por estado
    if (filtro !== "Todos") {
      resultado = resultado.filter((s) => s.estado === filtro);
    }

    // 3. Filtrar por texto de búsqueda
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      resultado = resultado.filter((s) => {
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
    }

    // 4. Filtrar por rango de fechas
    if (fechaInicio || fechaFin) {
      resultado = resultado.filter((s) => {
        const fecha = getDateFromField(s.creadoEn);
        if (!fecha) return false;

        const fechaMid = normalizarFecha(fecha);

        if (fechaInicio) {
          const inicioMid = normalizarFecha(fechaInicio);
          if (fechaMid < inicioMid) return false;
        }

        if (fechaFin) {
          const finMid = new Date(
            fechaFin.getFullYear(),
            fechaFin.getMonth(),
            fechaFin.getDate(),
            23,
            59,
            59,
            999
          );
          if (fechaMid > finMid) return false;
        }

        return true;
      });
    }

    return resultado;
  }, [solicitudes, rol, usuario, filtro, search, fechaInicio, fechaFin, normalizarFecha]);

  const handleFechaInicioChange = useCallback((event, selected) => {
    setShowInicioPicker(false);
    if (selected) setFechaInicio(selected);
  }, []);

  const handleFechaFinChange = useCallback((event, selected) => {
    setShowFinPicker(false);
    if (selected) setFechaFin(selected);
  }, []);

  const limpiarFiltrosFecha = useCallback(() => {
    setFechaInicio(null);
    setFechaFin(null);
  }, []);

  const renderItem = useCallback(({ item }) => {
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
      <View
        style={[styles.card, { borderLeftColor: getColor(item.estado) }]}
        accessibilityLabel={`Solicitud de ${item.usuario || "Desconocido"}, estado ${item.estado}`}
      >
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
              style={[
                styles.estadoDot,
                { backgroundColor: getColor(item.estado) },
              ]}
            />
            <Text style={[styles.estadoText, { color: getColor(item.estado) }]}>
              {item.estado}
            </Text>
          </View>
        </View>

        {(item.destino || item.cirugia) && (
          <View style={styles.infoContainer}>
            {item.destino && (
              <Text style={styles.destinoText}>{item.destino}</Text>
            )}
            {item.cirugia && (
              <Text style={styles.cirugiaText}>{item.cirugia}</Text>
            )}
          </View>
        )}

        {fechaNecesariaTexto && (
          <Text style={styles.fechaNecesaria}>
            Necesario: {fechaNecesariaTexto}
          </Text>
        )}

        <View style={styles.itemsContainer}>
          {item.items?.map((i, idx) => (
            <Text key={idx} style={styles.item}>
              • {i.nombre} × {i.cantidad}
            </Text>
          ))}
        </View>

        <Text style={styles.fechaCreacion}>Creado: {fechaCreacionTexto}</Text>
      </View>
    );
  }, []);

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Movimientos</Text>

        <TextInput
          placeholder="Buscar usuario, insumo, destino o cirugía..."
          style={styles.searchBar}
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Campo de búsqueda"
        />

        <View style={styles.filtroChipsContainer}>
          <FiltroChips
            opciones={ESTADOS.map((e) => ({ id: e, label: e }))}
            valorSeleccionado={filtro}
            onChange={setFiltro}
          />
        </View>

        <View style={styles.fechaFiltroContainer}>
          <View style={styles.fechaHeader}>
            <Text style={styles.fechaLabel}>Filtrar por fecha:</Text>
            {(fechaInicio || fechaFin) && (
              <TouchableOpacity onPress={limpiarFiltrosFecha}>
                <Text style={styles.limpiarText}>Limpiar</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.fechaButton}
            onPress={() => setShowInicioPicker(true)}
            accessibilityLabel="Seleccionar fecha de inicio"
          >
            <Text style={styles.fechaButtonText}>
              {fechaInicio
                ? fechaInicio.toLocaleDateString("es-MX")
                : "Seleccionar fecha inicio"}
            </Text>
          </TouchableOpacity>

          {showInicioPicker && (
            <DateTimePicker
              mode="date"
              value={fechaInicio || new Date()}
              onChange={handleFechaInicioChange}
            />
          )}

          <TouchableOpacity
            style={styles.fechaButton}
            onPress={() => setShowFinPicker(true)}
            accessibilityLabel="Seleccionar fecha de fin"
          >
            <Text style={styles.fechaButtonText}>
              {fechaFin
                ? fechaFin.toLocaleDateString("es-MX")
                : "Seleccionar fecha fin"}
            </Text>
          </TouchableOpacity>

          {showFinPicker && (
            <DateTimePicker
              mode="date"
              value={fechaFin || new Date()}
              onChange={handleFechaFinChange}
            />
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={INK} />
            <Text style={styles.loadingText}>Cargando...</Text>
          </View>
        ) : (
          <FlatList
            data={movimientosFiltrados}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No hay movimientos con este filtro.
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
    marginBottom: 10,
    color: INK,
  },
  searchBar: {
    backgroundColor: "#F2F2F6",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filtroChipsContainer: { marginBottom: 6 },
  fechaFiltroContainer: { marginTop: 10, marginBottom: 10 },
  fechaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  fechaLabel: { color: INK },
  limpiarText: { color: "#EF4444", fontWeight: "600", fontSize: 14 },
  fechaButton: {
    backgroundColor: "#F2F2F6",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  fechaButtonText: { color: INK },
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
  infoContainer: { marginTop: 4 },
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
  itemsContainer: { marginTop: 6 },
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#6B7280",
  },
  listContent: {
    paddingBottom: 30,
    paddingTop: 4,
  },
  emptyContainer: {
    marginTop: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
});
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import EstadoBadge from "./EstadoBadge";

const toDate = (valor) => {
  if (!valor) return null;
  if (valor instanceof Date) return valor;
  if (typeof valor?.toDate === "function") return valor.toDate();
  if (typeof valor === "number") return new Date(valor);
  if (typeof valor === "string") {
    const d = new Date(valor);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof valor === "object" && valor.seconds) {
    return new Date(valor.seconds * 1000);
  }
  if (typeof valor === "object" && valor._seconds) {
    return new Date(valor._seconds * 1000);
  }
  return null;
};

const SolicitudesFiltradasCard = ({
  ACCENT,
  solicitudesFiltradasPorEstado,
  filtroEstado,
  setFiltroEstado,
  busquedaSolicitud,
  setBusquedaSolicitud,
  onSeleccionarSolicitud,
  LUGARES_ENTREGA,
}) => {
  return (
    <View style={[styles.card, styles.cardElevated]}>
      <Text style={styles.cardTitle}>Solicitudes filtradas</Text>
      <Text style={styles.cardSubtitleSmall}>
        {solicitudesFiltradasPorEstado.length} solicitudes en el periodo elegido
      </Text>

      {/* BUSCADOR */}
      <View
        style={[
          styles.searchRow,
          { backgroundColor: "#F6F9F8", marginTop: 6, marginBottom: 8 },
        ]}
      >
        <Feather name="search" size={16} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por usuario, insumo, destino, cirugía o fecha"
          placeholderTextColor="#9CA3AF"
          value={busquedaSolicitud}
          onChangeText={setBusquedaSolicitud}
          selectionColor={ACCENT}
        />
        {busquedaSolicitud.length > 0 && (
          <TouchableOpacity onPress={() => setBusquedaSolicitud("")}>
            <Ionicons name="close-circle-outline" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* CHIPS ESTADO */}
      <View style={[styles.chipRow, { marginTop: 4 }]}>
        {[
          { id: "todas", label: "Todas" },
          { id: "completadas", label: "Completadas" },
          { id: "rechazadas", label: "Rechazadas" },
        ].map((op) => (
          <TouchableOpacity
            key={op.id}
            style={[
              styles.chip,
              filtroEstado === op.id && {
                ...styles.chipActive,
                backgroundColor: ACCENT,
              },
            ]}
            onPress={() => setFiltroEstado(op.id)}
          >
            <Text
              style={[
                styles.chipText,
                filtroEstado === op.id && styles.chipTextActive,
              ]}
            >
              {op.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* LISTA DE SOLICITUDES */}
      {solicitudesFiltradasPorEstado.length === 0 ? (
        <Text style={styles.emptyText}>
          No se encontraron solicitudes con los filtros actuales.
        </Text>
      ) : (
        solicitudesFiltradasPorEstado.map((s) => {
          const fecha = toDate(s.fechaNecesaria ?? s.creadoEn);
          const fechaTexto = fecha
            ? `${fecha.toLocaleDateString("es-MX", {
                day: "2-digit",
                month: "short",
              })} · ${fecha.toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : "Sin fecha";

          const destinoNombre =
            s.destino ||
            LUGARES_ENTREGA.find((d) => d.id === s.destinoId)?.nombre ||
            "Solicitud rápida";

          const items = s.items || [];

          return (
            <TouchableOpacity
              key={s.id}
              style={styles.solicitudItem}
              activeOpacity={0.8}
              onPress={() => onSeleccionarSolicitud(s)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.solicitudFecha}>{fechaTexto}</Text>
                <Text style={styles.solicitudDestino}>{destinoNombre}</Text>

                <Text style={styles.solicitudUsuario}>
                  Solicitó: {s.usuario || "Desconocido"}
                </Text>

                {items.length > 0 ? (
                  items.map((item, idx) => (
                    <Text key={idx} style={styles.solicitudInsumo}>
                      • {item.nombre || "Insumo"} × {item.cantidad ?? 0}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.solicitudInsumo}>Sin insumos</Text>
                )}

                {s.cirugia ? (
                  <Text style={styles.solicitudCirugia}>
                    Cirugía: {s.cirugia}
                  </Text>
                ) : null}

                <View style={{ marginTop: 4 }}>
                  <EstadoBadge estado={s.estado} />
                </View>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
};

export default SolicitudesFiltradasCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  cardElevated: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  cardSubtitleSmall: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    paddingVertical: 0,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  chipActive: {},
  chipText: {
    fontSize: 13,
    color: "#374151",
  },
  chipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 8,
  },
  solicitudItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#EEF2F5",
  },
  solicitudFecha: {
    fontSize: 12,
    color: "#6B7280",
  },
  solicitudDestino: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  solicitudUsuario: {
    fontSize: 13,
    color: "#4B5563",
    marginTop: 2,
  },
  solicitudInsumo: {
    fontSize: 13,
    color: "#4B5563",
    marginTop: 2,
  },
  solicitudCirugia: {
    fontSize: 13,
    color: "#4B5563",
    marginTop: 2,
  },
});

// src/componentes/ReportesSolicitudesCard.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import EstadoBadge from "./EstadoBadge";

const ReportesSolicitudesCard = ({
  solicitudesFiltradasPorEstado,
  busquedaSolicitud,
  setBusquedaSolicitud,
  filtroEstado,
  setFiltroEstado,
  accentColor,
  onExportCSV,
  onSelectSolicitud,
  toDate,
  LUGARES_ENTREGA,
}) => {
  return (
    <View style={[styles.card, styles.cardElevated]}>
      <Text style={styles.cardTitle}>Solicitudes filtradas</Text>
      <Text style={styles.cardSubtitleSmall}>
        {solicitudesFiltradasPorEstado.length} solicitudes en el periodo elegido
      </Text>

      {/* BOTÓN EXPORTAR CSV */}
      <TouchableOpacity style={styles.exportButton} onPress={onExportCSV}>
        <Ionicons
          name="download-outline"
          size={16}
          color="#FFFFFF"
          style={{ marginRight: 6 }}
        />
        <Text style={styles.exportButtonText}>Exportar a Excel (CSV)</Text>
      </TouchableOpacity>

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
        />
        {busquedaSolicitud.length > 0 && (
          <TouchableOpacity onPress={() => setBusquedaSolicitud("")}>
            <Ionicons
              name="close-circle-outline"
              size={18}
              color="#9CA3AF"
            />
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
                backgroundColor: accentColor,
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

      {/* LISTA SOLICITUDES */}
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
              onPress={() => onSelectSolicitud(s)}
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

                <Text style={styles.solicitudCirugia}>
                  Cirugía: {s.cirugia ? s.cirugia : "No aplica"}
                </Text>

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

export default ReportesSolicitudesCard;

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
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#00BFA5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 8,
    marginTop: 4,
  },
  exportButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});

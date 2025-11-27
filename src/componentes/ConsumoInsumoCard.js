import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";

const ConsumoInsumoCard = ({
  filtroDestino,
  ACCENT,
  insumoBusqueda,
  setInsumoBusqueda,
  insumoSeleccionadoId,
  setInsumoSeleccionadoId,
  insumosParaBusqueda,
  insumoSeleccionadoDetalle,
  formatearFechaCorta,
  formatearPromedio,
}) => {
  return (
    <View style={[styles.card, styles.cardElevated]}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>Consumo por insumo</Text>
        <Feather name="search" size={18} color="#6B7280" />
      </View>

      <Text style={styles.helperText}>
        Busca un insumo para ver su consumo en el periodo filtrado
        {filtroDestino !== "todos" ? " para este destino." : "."}
      </Text>

      {/* BUSCADOR */}
      <View style={[styles.searchRow, { backgroundColor: "#F6F9F8" }]}>
        <Feather name="search" size={16} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Escribe el nombre del insumo"
          placeholderTextColor="#9CA3AF"
          value={insumoBusqueda}
          onChangeText={(texto) => {
            setInsumoBusqueda(texto);
            if (!texto) setInsumoSeleccionadoId(null);
          }}
          selectionColor={ACCENT}
        />
        {insumoBusqueda.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setInsumoBusqueda("");
              setInsumoSeleccionadoId(null);
            }}
          >
            <Ionicons
              name="close-circle-outline"
              size={18}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* LISTA INSUMOS CON SCROLL LIMITADO */}
      {insumosParaBusqueda.length > 0 && (
        <View style={styles.insumosListaContainer}>
          <ScrollView
            style={styles.insumosScroll}
            nestedScrollEnabled
            showsVerticalScrollIndicator={true}
          >
            {insumosParaBusqueda.map((i) => {
              const isSelected = insumoSeleccionadoId === i.id;

              return (
                <TouchableOpacity
                  key={i.id}
                  style={[
                    styles.insumoChip,
                    isSelected && styles.insumoChipActive,
                  ]}
                  onPress={() => {
                    if (isSelected) {
                      setInsumoSeleccionadoId(null);
                      setInsumoBusqueda("");
                    } else {
                      setInsumoSeleccionadoId(i.id);
                      setInsumoBusqueda(i.nombre);
                    }
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        backgroundColor: "#E0F2F1",
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 10,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: "#00BFA5",
                        }}
                      >
                        {i.totalCantidad}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.insumoChipText,
                        isSelected && styles.insumoChipTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {i.nombre}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* DETALLES DEL INSUMO */}
      {insumoSeleccionadoId && insumoSeleccionadoDetalle && (
        <View style={styles.consumoCard}>
          <Text style={styles.consumoTitle}>
            {insumoBusqueda || "Insumo seleccionado"}
          </Text>

          <View style={styles.consumoRow}>
            <Text style={styles.consumoLabel}>Total solicitado:</Text>
            <Text style={styles.consumoValue}>
              {insumoSeleccionadoDetalle.totalCantidad} unidades
            </Text>
          </View>

          <View style={styles.consumoRow}>
            <Text style={styles.consumoLabel}>Número de solicitudes:</Text>
            <Text style={styles.consumoValue}>
              {insumoSeleccionadoDetalle.totalSolicitudes}
            </Text>
          </View>

          <View style={styles.consumoRow}>
            <Text style={styles.consumoLabel}>Promedio por día:</Text>
            <Text style={styles.consumoValue}>
              {formatearPromedio(insumoSeleccionadoDetalle.promedioPorDia)}
            </Text>
          </View>

          <View style={styles.consumoRow}>
            <Text style={styles.consumoLabel}>Última solicitud:</Text>
            <Text style={styles.consumoValue}>
              {formatearFechaCorta(insumoSeleccionadoDetalle.fechaUltima)}
            </Text>
          </View>

          {insumoSeleccionadoDetalle.destinos.length > 0 && (
            <>
              <Text style={[styles.consumoLabel, { marginTop: 8 }]}>
                Destinos que más lo solicitan:
              </Text>

              {insumoSeleccionadoDetalle.destinos.slice(0, 3).map((d, idx) => (
                <Text key={idx} style={styles.consumoDestinoItem}>
                  • {d.nombre} ({d.count} solicitudes)
                </Text>
              ))}
            </>
          )}
        </View>
      )}
    </View>
  );
};

export default ConsumoInsumoCard;

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
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  helperText: {
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
  insumosListaContainer: {
    marginTop: 6,
    borderRadius: 12,
    backgroundColor: "#FAFBFC",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  insumosScroll: {
    maxHeight: 140,
  },
  insumoChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  insumoChipActive: {},
  insumoChipText: {
    fontSize: 13,
    color: "#111827",
  },
  insumoChipTextActive: {
    fontWeight: "700",
    color: "#00695C",
  },
  consumoCard: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: "#F7F8F9",
    padding: 12,
  },
  consumoTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111827",
  },
  consumoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  consumoLabel: {
    fontSize: 13,
    color: "#4B5563",
  },
  consumoValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  consumoDestinoItem: {
    fontSize: 13,
    color: "#374151",
  },
});

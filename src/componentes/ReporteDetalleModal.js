// src/componentes/ReporteDetalleModal.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ReporteDetalleModal = ({
  visible,
  onClose,
  solicitudSeleccionadaDetalle,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalle de solicitud</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {solicitudSeleccionadaDetalle && (
            <ScrollView
              style={{ maxHeight: 400 }}
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.modalLabel}>
                Fecha y hora:
                <Text style={styles.modalValue}>
                  {" "}
                  {solicitudSeleccionadaDetalle.fechaTexto}
                </Text>
              </Text>

              <Text style={styles.modalLabel}>
                Destino:
                <Text style={styles.modalValue}>
                  {" "}
                  {solicitudSeleccionadaDetalle.destinoNombre}
                </Text>
              </Text>

              <Text style={styles.modalLabel}>
                Usuario:
                <Text style={styles.modalValue}>
                  {" "}
                  {solicitudSeleccionadaDetalle.usuario}
                </Text>
              </Text>

              <Text style={styles.modalLabel}>
                Cirugía:
                <Text style={styles.modalValue}>
                  {" "}
                  {solicitudSeleccionadaDetalle.cirugia
                    ? solicitudSeleccionadaDetalle.cirugia
                    : "No aplica"}
                </Text>
              </Text>

              <Text style={[styles.modalSectionTitle, { marginTop: 12 }]}>
                Insumos solicitados
              </Text>

              {solicitudSeleccionadaDetalle.items.length > 0 ? (
                solicitudSeleccionadaDetalle.items.map((item, idx) => (
                  <View key={idx} style={styles.modalItemRow}>
                    <Text style={styles.modalItemName}>
                      • {item.nombre || "Insumo"}
                    </Text>
                    <Text style={styles.modalItemQty}>
                      × {item.cantidad ?? 0}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.modalValue}>Sin insumos</Text>
              )}

              <View style={{ marginTop: 16 }}>
                <Text style={styles.modalLabel}>
                  Estado:
                  <Text style={styles.modalValue}>
                    {" "}
                    {solicitudSeleccionadaDetalle.estado || "-"}
                  </Text>
                </Text>
              </View>
            </ScrollView>
          )}

          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Text style={styles.modalCloseButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ReporteDetalleModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  modalCard: {
    width: "100%",
    maxHeight: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  modalLabel: {
    fontSize: 13,
    color: "#4B5563",
    marginTop: 4,
  },
  modalValue: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "500",
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginTop: 4,
    marginBottom: 4,
  },
  modalItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  modalItemName: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
    paddingRight: 8,
  },
  modalItemQty: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "600",
  },
  modalCloseButton: {
    marginTop: 10,
    borderRadius: 999,
    backgroundColor: "#111827",
    paddingVertical: 10,
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});

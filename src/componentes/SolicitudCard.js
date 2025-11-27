// src/componentes/SolicitudCard.js
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  formatearFechaCreacion,
  formatFechaNecesaria,
} from "../utils/fechaUtils";
import EstadoBadge from "./EstadoBadge";

const getInitial = (usuario) =>
  usuario?.charAt(0)?.toUpperCase() || "U";

export default function SolicitudCard({
  item,
  rol,
  usuarioActual,
  onAceptar,
  onRechazar,
  onConfirmarRechazo,
  onRevertirRechazo,
  onMarcarLista,
  onVerificarOk,
  onVerificarNo,
}) {
  const [confirmandoRechazo, setConfirmandoRechazo] = useState(false);

  const fechaNecesariaTexto = formatFechaNecesaria(item.fechaNecesaria);
  const fechaCreacionTexto = formatearFechaCreacion(item.creadoEn);

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitial(item.usuario)}</Text>
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          {item.destino && <Text style={styles.destinoText}>{item.destino}</Text>}
          {item.cirugia && <Text style={styles.cirugiaText}>{item.cirugia}</Text>}
          {fechaNecesariaTexto && (
            <Text style={styles.fechaNecesariaText}>{fechaNecesariaTexto}</Text>
          )}

          <EstadoBadge estado={item.estado} />

          {/* Items */}
          {item.items?.length > 0 && (
            <View style={styles.itemsContainer}>
              {item.items.slice(0, 2).map((i, idx) => (
                <Text key={idx} style={styles.itemText}>
                  • {i.nombre} × {i.cantidad}
                </Text>
              ))}

              {item.items.length > 2 && (
                <Text style={styles.masText}>
                  + {item.items.length - 2} insumos más
                </Text>
              )}
            </View>
          )}

          <Text style={styles.solicitanteText}>
            Solicitante: {item.usuario}
          </Text>
        </View>

        <View style={styles.rightContainer}>
          <Text style={styles.fechaText}>{fechaCreacionTexto}</Text>
        </View>
      </View>

      {/* =========================
          ACCIONES CEYE
      ========================== */}
      {rol === "ceye" && (
        <View style={styles.actionsContainer}>
          {/* Pendiente */}
          {item.estado === "Pendiente" && (
            <>
              {!confirmandoRechazo ? (
                <View style={styles.row}>
                  <TouchableOpacity
                    style={styles.btnAceptar}
                    onPress={() => onAceptar(item.id)}
                  >
                    <Text style={styles.btnText}>Aceptar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnRechazar}
                    onPress={() => setConfirmandoRechazo(true)}
                  >
                    <Text style={styles.btnText}>Rechazar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.row}>
                  <TouchableOpacity
                    style={styles.btnConfirmarRechazo}
                    onPress={() => {
                      onRechazar(item.id);
                      setConfirmandoRechazo(false);
                    }}
                  >
                    <Text style={styles.btnText}>Confirmar rechazo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnUndo}
                    onPress={() => setConfirmandoRechazo(false)}
                  >
                    <Text style={styles.btnText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {/* Aceptada */}
          {item.estado === "Aceptada" && (
            <TouchableOpacity
              style={styles.btnLista}
              onPress={() => onMarcarLista(item.id)}
            >
              <Text style={styles.btnText}>Marcar como Lista</Text>
            </TouchableOpacity>
          )}

          {/* Rechazada */}
          {item.estado === "Rechazada" && (
            <TouchableOpacity
              style={styles.btnUndo}
              onPress={() => onRevertirRechazo(item.id)}
            >
              <Text style={styles.btnText}>↩️ Deshacer rechazo</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* =========================
          ACCIONES ENFERMERÍA
      ========================== */}
      {rol !== "ceye" &&
        usuarioActual === item.usuario &&
        item.estado === "Lista" && (
          <View style={styles.actionsContainer}>
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.btnOk}
                onPress={() => onVerificarOk(item.id)}
              >
                <Text style={styles.btnText}>✔️ Todo bien</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnNo}
                onPress={() => onVerificarNo(item.id)}
              >
                <Text style={styles.btnText}>✖️ Hay problema</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    marginVertical: 6,
    elevation: 3,
  },

  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#555",
  },

  infoContainer: { flex: 1 },

  destinoText: { fontSize: 15, fontWeight: "700", color: "#000" },
  cirugiaText: { fontSize: 13, color: "#555", marginTop: 2 },
  fechaNecesariaText: { fontSize: 13, color: "#666", marginTop: 4 },

  itemsContainer: { marginTop: 8 },
  itemText: { fontSize: 13, color: "#555" },
  masText: { fontSize: 12, color: "#888" },

  solicitanteText: { fontSize: 12, color: "#777", marginTop: 8 },

  rightContainer: { alignItems: "flex-end" },
  fechaText: { fontSize: 12, color: "#666" },

  actionsContainer: { marginTop: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  // Botones
  btnAceptar: {
    flex: 1,
    backgroundColor: "#00BFA5",
    padding: 10,
    borderRadius: 8,
    marginRight: 6,
  },
  btnRechazar: {
    flex: 1,
    backgroundColor: "red",
    padding: 10,
    borderRadius: 8,
    marginLeft: 6,
  },
  btnConfirmarRechazo: {
    flex: 1,
    backgroundColor: "#d9534f",
    padding: 10,
    borderRadius: 8,
    marginRight: 6,
  },
  btnUndo: {
    flex: 1,
    backgroundColor: "#888",
    padding: 10,
    borderRadius: 8,
    marginLeft: 6,
  },
  btnLista: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  btnOk: {
    flex: 1,
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 8,
    marginRight: 6,
  },
  btnNo: {
    flex: 1,
    backgroundColor: "#E53935",
    padding: 10,
    borderRadius: 8,
    marginLeft: 6,
  },

  btnText: { color: "white", textAlign: "center", fontWeight: "700" },
});

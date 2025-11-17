// src/componentes/SolicitudCard.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  formatearFechaCreacion,
  formatFechaNecesaria,
} from "../utils/fechaUtils";

const getColor = (estado) => {
  switch (estado) {
    case "Pendiente":
      return "#9E9E9E";
    case "Aceptada":
      return "#2196F3";
    case "Rechazada":
      return "#F44336";
    case "Lista":
      return "#00BFA5";
    case "Verificada":
      return "#4CAF50";
    case "Problema":
      return "#FF9800";
    default:
      return "#000";
  }
};

const getInitial = (usuario) =>
  usuario?.charAt(0).toUpperCase() || "U";

export default function SolicitudCard({
  item,
  rol,
  usuarioActual,
  onAceptar,
  onRechazar,
  onMarcarLista,
  onVerificarOk,
  onVerificarNo,
}) {
  const fechaNecesariaTexto = formatFechaNecesaria(item.fechaNecesaria);
  const fechaCreacionTexto = formatearFechaCreacion(item.creadoEn);

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        {/* Avatar con inicial */}
        <View style={[styles.avatar, { backgroundColor: "#f0f0f0" }]}>
          <Text style={styles.avatarText}>{getInitial(item.usuario)}</Text>
        </View>

        {/* Información principal */}
        <View style={styles.infoContainer}>
          {/* Destino y cirugía */}
          {item.destino && (
            <Text style={styles.destinoText}>{item.destino}</Text>
          )}
          {item.cirugia && (
            <Text style={styles.cirugiaText}>{item.cirugia}</Text>
          )}

          {/* Fecha y hora requerida */}
          {fechaNecesariaTexto && (
            <Text style={styles.fechaNecesariaText}>
              {fechaNecesariaTexto}
            </Text>
          )}

          {/* Badge de estado */}
          <View
            style={[styles.badge, { backgroundColor: getColor(item.estado) }]}
          >
            <Text style={styles.badgeText}>{item.estado}</Text>
          </View>

          {/* Items */}
          {item.items && item.items.length > 0 && (
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

          {/* Solicitante */}
          <Text style={styles.solicitanteText}>
            Solicitante: {item.usuario}
          </Text>
        </View>

        {/* Fecha de creación derecha */}
        <View style={styles.rightContainer}>
          <Text style={styles.fechaText}>{fechaCreacionTexto}</Text>
        </View>
      </View>

      {/* Botones de acción */}
      {rol === "ceye" && (
        <View style={styles.actionsContainer}>
          {item.estado === "Pendiente" && (
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.btnAceptar}
                onPress={() => onAceptar(item.id)}
              >
                <Text style={styles.btnText}>Aceptar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnRechazar}
                onPress={() => onRechazar(item.id)}
              >
                <Text style={styles.btnText}>Rechazar</Text>
              </TouchableOpacity>
            </View>
          )}

          {item.estado === "Aceptada" && (
            <TouchableOpacity
              style={styles.btnLista}
              onPress={() => onMarcarLista(item.id)}
            >
              <Text style={styles.btnText}>Marcar como Lista</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Solicitante verifica */}
      {rol !== "ceye" &&
        item.usuario === usuarioActual &&
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
    marginVertical: 6,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
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
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#555",
  },
  infoContainer: {
    flex: 1,
  },
  destinoText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#000",
  },
  cirugiaText: {
    fontSize: 13,
    color: "#555",
    marginTop: 2,
  },
  fechaNecesariaText: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  badgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
  },
  itemsContainer: {
    marginTop: 8,
  },
  itemText: {
    fontSize: 13,
    color: "#555",
    marginVertical: 1,
  },
  masText: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  solicitanteText: {
    fontSize: 12,
    color: "#777",
    marginTop: 8,
  },
  rightContainer: {
    alignItems: "flex-end",
  },
  fechaText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
  },
  actionsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  btnAceptar: {
    flex: 1,
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnRechazar: {
    flex: 1,
    backgroundColor: "#F44336",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnLista: {
    backgroundColor: "#00BFA5",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnOk: {
    flex: 1,
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnNo: {
    flex: 1,
    backgroundColor: "#F44336",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
});

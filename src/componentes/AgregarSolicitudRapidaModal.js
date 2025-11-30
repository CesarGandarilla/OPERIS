import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import FechaHoraPicker from "./FechaHoraPicker";

export default function AgregarSolicitudRapidaModal({
  visible,
  onClose,
  usuario,
  rol,
  onEnviar,
}) {
  const [nombre, setNombre] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [fecha, setFecha] = useState(null);
  const [hora, setHora] = useState(null);

  const enviar = () => {
    if (!nombre.trim() || !cantidad.trim()) {
      alert("Completa todos los campos.");
      return;
    }
    if (!fecha || !hora) {
      alert("Selecciona una fecha y hora.");
      return;
    }

    const fechaFinal = new Date(fecha);
    fechaFinal.setHours(hora.getHours(), hora.getMinutes(), 0, 0);

    onEnviar({
      usuario,
      rol,
      items: [
        {
          nombre: nombre.trim(),
          cantidad: Number(cantidad),
        },
      ],
      fechaNecesaria: fechaFinal.getTime(),
      tipo: "rapida",
      estado: "Pendiente",
      creadoEn: Date.now(),
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>Solicitud Rápida</Text>

          {/* FECHA */}
          <FechaHoraPicker
            label="Fecha necesaria"
            mode="date"
            value={fecha}
            onChange={setFecha}
          />

          {/* HORA */}
          <FechaHoraPicker
            label="Hora necesaria"
            mode="time"
            value={hora}
            onChange={setHora}
          />

          <Text style={styles.label}>Insumo</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre del insumo"
            value={nombre}
            onChangeText={setNombre}
          />

          <TextInput
            style={styles.input}
            placeholder="Cantidad"
            value={cantidad}
            onChangeText={setCantidad}
            keyboardType="numeric"
          />

          <View style={styles.row}>
            <TouchableOpacity style={styles.btnCancelar} onPress={onClose}>
              <Text style={styles.btnCancelarText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnEnviar} onPress={enviar}>
              <Text style={styles.btnEnviarText}>Enviar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  box: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 18,
  },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 15, textAlign: "center" },
  label: { marginTop: 10, fontSize: 15, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 10,
    marginTop: 6,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  btnCancelar: {
    width: "45%",
    backgroundColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnCancelarText: { fontWeight: "600" },
  btnEnviar: {
    width: "45%",
    backgroundColor: "#00BFA5",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnEnviarText: { fontWeight: "700", color: "white" },
});

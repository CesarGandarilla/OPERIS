import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
} from "react-native";
import FechaHoraPicker from "./FechaHoraPicker";

export default function AgregarSolicitudModal({
  visible,
  onClose,
  usuario,
  rol,
  onEnviar,
}) {
  const [items, setItems] = useState([]);
  const [nombre, setNombre] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [fecha, setFecha] = useState(null);
  const [hora, setHora] = useState(null);

  const agregarItem = () => {
    if (!nombre.trim() || !cantidad.trim()) return;

    setItems((prev) => [
      ...prev,
      {
        nombre: nombre.trim(),
        cantidad: Number(cantidad),
      },
    ]);

    setNombre("");
    setCantidad("");
  };

  const enviar = () => {
    if (!fecha || !hora) {
      alert("Selecciona una fecha y una hora.");
      return;
    }

    const fechaFinal = new Date(fecha);
    fechaFinal.setHours(hora.getHours(), hora.getMinutes(), 0, 0);

    onEnviar({
      usuario,
      rol,
      items,
      fechaNecesaria: fechaFinal.getTime(),
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>Nueva Solicitud Elaborada</Text>

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

          {/* INPUTS DE INSUMOS */}
          <Text style={styles.label}>Añadir insumo</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre del insumo"
            value={nombre}
            onChangeText={setNombre}
          />

          <TextInput
            style={styles.input}
            placeholder="Cantidad"
            keyboardType="numeric"
            value={cantidad}
            onChangeText={setCantidad}
          />

          <TouchableOpacity style={styles.btnAddItem} onPress={agregarItem}>
            <Text style={styles.btnAddItemText}>Agregar insumo</Text>
          </TouchableOpacity>

          {/* LISTA DE INSUMOS */}
          <FlatList
            style={{ maxHeight: 150, marginTop: 10 }}
            data={items}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => (
              <View style={styles.itemRow}>
                <Text style={styles.itemText}>
                  • {item.nombre} ({item.cantidad})
                </Text>
              </View>
            )}
          />

          {/* BOTONES */}
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
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
  },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 15, textAlign: "center" },
  label: { fontSize: 15, fontWeight: "600", marginBottom: 5, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  btnAddItem: {
    backgroundColor: "#00BFA5",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  btnAddItemText: { color: "#fff", fontWeight: "600" },

  itemRow: { paddingVertical: 5 },
  itemText: { fontSize: 15 },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  btnCancelar: {
    padding: 12,
    backgroundColor: "#ddd",
    borderRadius: 10,
    width: "45%",
    alignItems: "center",
  },
  btnCancelarText: { fontWeight: "600" },
  btnEnviar: {
    padding: 12,
    backgroundColor: "#00BFA5",
    borderRadius: 10,
    width: "45%",
    alignItems: "center",
  },
  btnEnviarText: { color: "#fff", fontWeight: "700" },
});

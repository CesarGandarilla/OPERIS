import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/inventarios";

export default function AgregarSolicitudModal({
  visible,
  onClose,
  usuario,
  rol,
  onEnviar,
}) {
  const [insumos, setInsumos] = useState([]);
  const [seleccion, setSeleccion] = useState([]);
  const [cantidad, setCantidad] = useState("");
  const [insumoSeleccionado, setInsumoSeleccionado] = useState(null);

  useEffect(() => {
    const cargarInsumos = async () => {
      const snap = await getDocs(collection(db, "insumos"));
      setInsumos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    cargarInsumos();
  }, []);

  const agregarItem = () => {
    if (!insumoSeleccionado || !cantidad) {
      Alert.alert("Error", "Selecciona un insumo y cantidad");
      return;
    }

    setSeleccion(prev => [
      ...prev,
      {
        insumoId: insumoSeleccionado.id,
        nombre: insumoSeleccionado.nombre,
        cantidad: parseInt(cantidad),
      }
    ]);

    setCantidad("");
    setInsumoSeleccionado(null);
  };

  const enviarSolicitud = () => {
    if (seleccion.length === 0) {
      Alert.alert("Error", "Agrega al menos un insumo");
      return;
    }

    onEnviar(seleccion);

    setSeleccion([]);
    setCantidad("");
    setInsumoSeleccionado(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          
          <Text style={styles.title}>Nueva Solicitud</Text>

          <FlatList
            data={insumos}
            style={{ maxHeight: 150 }}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.item,
                  insumoSeleccionado?.id === item.id && styles.itemSelected
                ]}
                onPress={() => setInsumoSeleccionado(item)}
              >
                <Text>{item.nombre}</Text>
              </TouchableOpacity>
            )}
          />

          <TextInput
            placeholder="Cantidad"
            style={styles.input}
            keyboardType="numeric"
            value={cantidad}
            onChangeText={setCantidad}
          />

          <TouchableOpacity style={styles.addButton} onPress={agregarItem}>
            <Text style={styles.addButtonText}>Agregar insumo</Text>
          </TouchableOpacity>

          <FlatList
            data={seleccion}
            style={{ maxHeight: 120, marginTop: 10 }}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.previewItem}>
                <Text>{item.nombre} x {item.cantidad}</Text>
              </View>
            )}
          />

          <TouchableOpacity style={styles.saveButton} onPress={enviarSolicitud}>
            <Text style={styles.saveText}>Enviar Solicitud</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContainer: { width: "90%", backgroundColor: "#fff", padding: 20, borderRadius: 12 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  item: { padding: 10, borderBottomWidth: 1, borderColor: "#ddd" },
  itemSelected: { backgroundColor: "#e0f2f1" },
  input: { backgroundColor: "#f2f2f2", padding: 10, borderRadius: 10, marginTop: 8 },
  previewItem: { padding: 8, backgroundColor: "#f5f5f5", borderRadius: 6, marginVertical: 4 },
  addButton: { backgroundColor: "#00bfa5", marginTop: 10, padding: 10, borderRadius: 10, alignItems: "center" },
  addButtonText: { color: "#fff", fontWeight: "bold" },
  saveButton: { backgroundColor: "#00897b", marginTop: 15, padding: 12, borderRadius: 10, alignItems: "center" },
  saveText: { color: "#fff", fontWeight: "bold" },
  cancelButton: { marginTop: 10, padding: 10, alignItems: "center" },
  cancelText: { color: "red" }
});

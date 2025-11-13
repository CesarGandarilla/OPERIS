import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { doc, updateDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../firebase/inventarios";

export default function EditarInsumoModal({ visible, onClose, insumo }) {
  const [nombre, setNombre] = useState(insumo?.nombre || "");
  const [stock, setStock] = useState(insumo?.stock?.toString() || "");
  const [categoria, setCategoria] = useState(insumo?.categoria || "");

  const categorias = [
    { nombre: "Anestesiología", prefijo: "ANS" },
    { nombre: "Cardiología", prefijo: "CAR" },
    { nombre: "Cirugía general", prefijo: "CIR" },
    { nombre: "Maxilofacial", prefijo: "MAX" },
    { nombre: "Reconstructiva", prefijo: "REC" },
    { nombre: "Pulmonar", prefijo: "PUL" },
    { nombre: "Ginecología", prefijo: "GIN" },
    { nombre: "Preventiva", prefijo: "PRE" },
    { nombre: "Nefrología", prefijo: "NEF" },
    { nombre: "Neurología", prefijo: "NEU" },
    { nombre: "Traumatología y Ortopedia", prefijo: "TRA" },
    { nombre: "Generales", prefijo: "GEN" },
  ];

  useEffect(() => {
    // Actualizar estados si cambia el insumo seleccionado
    if (insumo) {
      setNombre(insumo.nombre);
      setStock(insumo.stock?.toString());
      setCategoria(insumo.categoria);
    }
  }, [insumo]);

  const guardarCambios = async () => {
    if (!nombre || !stock || !categoria) {
      Alert.alert("Error", "Por favor llena todos los campos");
      return;
    }

    try {
      const docRef = doc(db, "insumos", insumo.id);
      const stockNuevo = parseInt(stock);

      // Guardar cambios
      await updateDoc(docRef, {
        nombre,
        stock: stockNuevo,
        categoria,
      });

      // Registrar movimiento si el stock cambió
      if (stockNuevo !== insumo.stock) {
        await addDoc(collection(db, "insumos", insumo.id, "movimientos"), {
          tipo: stockNuevo > insumo.stock ? "Entrada" : "Salida",
          cantidad: Math.abs(stockNuevo - insumo.stock),
          fecha: new Date(),
          usuario: "Sistema",
          descripcion: "Modificación de stock",
        });
      }

      Alert.alert("Éxito", "Insumo actualizado correctamente");
      onClose();
    } catch (error) {
      console.error("Error actualizando insumo:", error);
      Alert.alert("Error", "No se pudo actualizar el insumo");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Editar insumo</Text>

          <TextInput
            placeholder="Nombre del insumo"
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
          />
          <TextInput
            placeholder="Stock"
            style={styles.input}
            keyboardType="numeric"
            value={stock}
            onChangeText={setStock}
          />

          <View style={[styles.input, { paddingHorizontal: 0 }]}>
            <Picker
              selectedValue={categoria}
              onValueChange={(itemValue) => setCategoria(itemValue)}
            >
              <Picker.Item label="Selecciona una categoría" value="" />
              {categorias.map((c) => (
                <Picker.Item key={c.prefijo} label={c.nombre} value={c.nombre} />
              ))}
            </Picker>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={guardarCambios}>
              <Text style={styles.saveText}>Guardar</Text>
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
    backgroundColor: "#ccc",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButton: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: "#00bfa5",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelText: { color: "#000", fontWeight: "bold" },
  saveText: { color: "#fff", fontWeight: "bold" },
});
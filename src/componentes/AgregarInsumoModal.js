// AgregarInsumoModal.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker"; // npm install @react-native-picker/picker
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/inventarios";

export default function AgregarInsumoModal({ visible, onClose }) {
  const [nombre, setNombre] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [categoria, setCategoria] = useState("");

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

  const generarCodigo = async (categoriaSeleccionada) => {
    try {
      const prefijo =
        categorias.find((c) => c.nombre === categoriaSeleccionada)?.prefijo ||
        "GEN";
      const q = query(
        collection(db, "insumos"),
        where("categoria", "==", categoriaSeleccionada)
      );
      const snapshot = await getDocs(q);
      const siguienteNumero = snapshot.size + 1;
      return `${prefijo}-${siguienteNumero}`;
    } catch (error) {
      console.error("Error generando código:", error);
      return "GEN-0";
    }
  };

  const guardarInsumo = async () => {
  if (!nombre || !cantidad || !categoria) {
    Alert.alert("Error", "Por favor llena todos los campos");
    return;
  }

  try {
    const codigo = await generarCodigo(categoria);
    const stockInicial = parseInt(cantidad);

    // Guardar el insumo principal
    const docRef = await addDoc(collection(db, "insumos"), {
      nombre,
      stock: stockInicial, // <-- ahora es stock
      codigo,
      categoria,
      estado: "Normal",
      fechaIngreso: new Date(),
    });

    // Guardar movimiento inicial en subcolección "movimientos"
    await addDoc(collection(db, "insumos", docRef.id, "movimientos"), {
      tipo: "Entrada",
      cantidad: stockInicial,
      fecha: new Date(),
      usuario: "Sistema", // puedes reemplazarlo por el usuario que esté logueado
      descripcion: "Ingreso inicial de insumo",
    });

    Alert.alert("Éxito", `Insumo agregado con código: ${codigo}`);
    onClose();
    setNombre("");
    setCantidad("");
    setCategoria("");
  } catch (error) {
    console.error("Error al agregar insumo:", error);
    Alert.alert("Error", "No se pudo guardar el insumo");
  }
};

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Agregar nuevo insumo</Text>

          <TextInput
            placeholder="Nombre del insumo"
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
          />
          <TextInput
            placeholder="Cantidad"
            style={styles.input}
            keyboardType="numeric"
            value={cantidad}
            onChangeText={setCantidad}
          />

          {/* Picker de categorías */}
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
            <TouchableOpacity style={styles.saveButton} onPress={guardarInsumo}>
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

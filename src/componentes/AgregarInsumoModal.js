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
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/inventarios";

export default function AgregarInsumoModal({ visible, onClose }) {
  const [nombre, setNombre] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [stockCritico, setStockCritico] = useState("");
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

  const limpiarCampos = () => {
    setNombre("");
    setCantidad("");
    setCategoria("");
    setStockCritico("");
  };

  const guardarInsumo = async () => {
    if (!nombre || !cantidad || !categoria || !stockCritico) {
      Alert.alert("Error", "Por favor llena todos los campos");
      return;
    }

    const stockInicial = parseInt(cantidad);
    const stockCriticoNum = parseInt(stockCritico);

    if (isNaN(stockInicial) || isNaN(stockCriticoNum)) {
      Alert.alert("Error", "Cantidad y stock crítico deben ser números");
      return;
    }

    if (stockCriticoNum <= 0) {
      Alert.alert(
        "Error",
        "El stock crítico debe ser un número mayor a cero"
      );
      return;
    }

    try {
      const codigo = await generarCodigo(categoria);

      // Guardar el insumo principal
      const docRef = await addDoc(collection(db, "insumos"), {
        nombre,
        stock: stockInicial,
        stockCritico: stockCriticoNum,
        codigo,
        categoria,
        estado: "Normal",
        fechaIngreso: new Date(),
      });

      // Movimiento inicial
      await addDoc(collection(db, "insumos", docRef.id, "movimientos"), {
        tipo: "Entrada",
        cantidad: stockInicial,
        fecha: new Date(),
        usuario: "Sistema",
        descripcion: "Ingreso inicial de insumo",
      });

      Alert.alert("Éxito", `Insumo agregado con código: ${codigo}`);
      limpiarCampos();
      onClose();
    } catch (error) {
      console.error("Error al agregar insumo:", error);
      Alert.alert("Error", "No se pudo guardar el insumo");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
          >
            <View style={styles.modalContainer}>
              <Text style={styles.title}>Agregar nuevo insumo</Text>

              {/* Nombre */}
              <Text style={styles.label}>Nombre del insumo</Text>
              <TextInput
                placeholder="Ej. Gasa estéril 10x10"
                placeholderTextColor="#666"
                style={styles.input}
                value={nombre}
                onChangeText={setNombre}
              />

              {/* Cantidad inicial */}
              <Text style={styles.label}>Stock inicial</Text>
              <TextInput
                placeholder="Ej. 150"
                placeholderTextColor="#666"
                style={styles.input}
                keyboardType="numeric"
                value={cantidad}
                onChangeText={setCantidad}
              />

              {/* Stock crítico */}
              <Text style={styles.label}>Stock crítico (mínimo de seguridad)</Text>
              <TextInput
                placeholder="Ej. 30"
                placeholderTextColor="#666"
                style={styles.input}
                keyboardType="numeric"
                value={stockCritico}
                onChangeText={setStockCritico}
              />

              {/* Categoría */}
              <Text style={styles.label}>Departamento / categoría</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={categoria}
                  onValueChange={(itemValue) => setCategoria(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item
                    label="Selecciona una categoría"
                    value=""
                    color="#666"
                  />
                  {categorias.map((c) => (
                    <Picker.Item
                      key={c.prefijo}
                      label={c.nombre}
                      value={c.nombre}
                      color="#000"
                    />
                  ))}
                </Picker>
              </View>

              {/* Botones */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    limpiarCampos();
                    onClose();
                  }}
                >
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={guardarInsumo}
                >
                  <Text style={styles.saveText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
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
  keyboardView: {
    flex: 1,
    width: "100%",
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
    color: "#222",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
    marginBottom: 4,
    marginTop: 6,
  },
  input: {
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    color: "#000", // texto negro visible
  },
  pickerContainer: {
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
  },
  picker: {
    width: "100%",
    color: "#000",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
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

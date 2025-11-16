import React, { useState, useEffect } from "react";
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
import { doc, updateDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../firebase/inventarios";

export default function EditarInsumoModal({ visible, onClose, insumo }) {
  const [nombre, setNombre] = useState(insumo?.nombre || "");
  const [stock, setStock] = useState(insumo?.stock?.toString() || "");
  const [categoria, setCategoria] = useState(insumo?.categoria || "");
  const [stockCritico, setStockCritico] = useState(
    insumo?.stockCritico?.toString() || ""
  );

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
    if (insumo) {
      setNombre(insumo.nombre || "");
      setStock(
        insumo.stock !== undefined && insumo.stock !== null
          ? insumo.stock.toString()
          : ""
      );
      setCategoria(insumo.categoria || "");
      setStockCritico(
        insumo.stockCritico !== undefined && insumo.stockCritico !== null
          ? insumo.stockCritico.toString()
          : ""
      );
    }
  }, [insumo]);

  const guardarCambios = async () => {
    if (!insumo) {
      Alert.alert("Error", "No hay insumo seleccionado");
      return;
    }

    if (!nombre || !stock || !categoria || !stockCritico) {
      Alert.alert("Error", "Por favor llena todos los campos");
      return;
    }

    const stockNuevo = parseInt(stock);
    const stockCriticoNum = parseInt(stockCritico);

    if (isNaN(stockNuevo) || isNaN(stockCriticoNum)) {
      Alert.alert("Error", "Stock y stock crítico deben ser números");
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
      const docRef = doc(db, "insumos", insumo.id);

      await updateDoc(docRef, {
        nombre,
        stock: stockNuevo,
        categoria,
        stockCritico: stockCriticoNum,
      });

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
              <Text style={styles.title}>Editar insumo</Text>

              {/* Nombre */}
              <Text style={styles.label}>Nombre del insumo</Text>
              <TextInput
                placeholder="Ej. Gasa estéril 10x10"
                placeholderTextColor="#666"
                style={styles.input}
                value={nombre}
                onChangeText={setNombre}
              />

              {/* Stock actual */}
              <Text style={styles.label}>Stock actual</Text>
              <TextInput
                placeholder="Ej. 150"
                placeholderTextColor="#666"
                style={styles.input}
                keyboardType="numeric"
                value={stock}
                onChangeText={setStock}
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
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={guardarCambios}
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

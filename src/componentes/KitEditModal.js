// src/modals/KitEditModal.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/inventarios";

export default function KitEditModal({
  visible,
  onClose,
  kit,
  usuario,
  rol,
  onEnviar,
}) {
  const [items, setItems] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [cantidadExtra, setCantidadExtra] = useState("");

  useEffect(() => {
    if (!visible) return;

    const cargarInsumos = async () => {
      try {
        const q = query(
          collection(db, "insumos"),
          orderBy("fechaIngreso", "desc")
        );

        const snap = await getDocs(q);
        const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        setInsumos(lista);
      } catch (err) {
        console.error("Error cargando insumos:", err);
        Alert.alert("Error", "No se pudieron cargar los insumos.");
      }
    };

    cargarInsumos();

    if (kit?.items) {
      const convertidos = kit.items.map((it) => ({
        insumoId: it.id || null,
        nombre: it.nombre,
        cantidad: it.cantidad || 1,
        urgente: false,
        comentario: "",
      }));

      setItems(convertidos);
    }
  }, [visible]);

  useEffect(() => {
    if (busqueda.trim() === "") {
      setResultados([]);
      return;
    }

    const text = busqueda.toLowerCase();

    const filtered = insumos.filter(
      (ins) =>
        (ins.nombre || "").toLowerCase().includes(text) ||
        (ins.codigo || "").toLowerCase().includes(text)
    );

    setResultados(filtered);
  }, [busqueda, insumos]);

  const agregarExtra = (insumo) => {
  const cantidad = parseInt(cantidadExtra);

  if (!cantidadExtra || isNaN(cantidad)) {
    Alert.alert("Error", "Ingresa una cantidad válida.");
    return;
  }

  if (cantidad > 50) {
    Alert.alert("Error", "No puedes agregar más de 50 unidades por insumo.");
    return;
  }

  if (cantidad > insumo.stock) {
    Alert.alert(
      "Error",
      `No puedes agregar más de ${insumo.stock} unidades de ${insumo.nombre}.`
    );
    return;
  }

  const nuevo = {
    insumoId: insumo.id,
    nombre: insumo.nombre,
    cantidad,
    urgente: false,
    comentario: "",
  };

  setItems((prev) => [...prev, nuevo]);
  setBusqueda("");
  setResultados([]);
  setCantidadExtra("");
};


  const crearSolicitud = () => {
    if (!items || items.length === 0) {
      Alert.alert("Error", "El kit no tiene artículos.");
      return;
    }

    const solicitud = {
      tipo: "kit",
      usuario,
      rol,
      estado: "Pendiente",
      creadoEn: Date.now(),
      items,
      fechaNecesaria: null,
      destino: "",
      cirugia: "",
    };

    onEnviar(solicitud);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <Text style={styles.titulo}>Editar Kit</Text>

          <ScrollView style={{ maxHeight: 600 }} keyboardShouldPersistTaps="handled">
            <Text style={styles.subtitulo}>Artículos del kit</Text>

            {items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={{ flex: 1 }}>
                  {item.nombre} — {item.cantidad}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    setItems((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  <Text style={styles.eliminar}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            ))}

            <Text style={styles.subtitulo}>Agregar artículos extra</Text>

            <TextInput
              placeholder="Buscar por nombre o código"
              style={styles.input}
              value={busqueda}
              onChangeText={setBusqueda}
            />

            {resultados.length > 0 && (
              <View style={[styles.listaResultados, { maxHeight: 300 }]}>
                <ScrollView keyboardShouldPersistTaps="handled">
                  {resultados.map((ins) => (
                    <TouchableOpacity
                      key={ins.id}
                      style={styles.resultadoItem}
                      onPress={() => setBusqueda(ins.nombre)}
                    >
                      <Text>
                        {ins.nombre} ({ins.codigo})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {busqueda.trim() !== "" &&
              resultados.length > 0 &&
              (() => {
                const seleccionado = resultados.find(
                  (i) => i.nombre === busqueda
                );
                if (!seleccionado) return null;

                return (
                  <>
                    <Text style={styles.label}>Cantidad</Text>
                    <TextInput
                      placeholder="Ej. 2"
                      style={styles.input}
                      keyboardType="numeric"
                      value={cantidadExtra}
                      onChangeText={(t) =>
                        setCantidadExtra(t.replace(/[^0-9]/g, ""))
                      }
                    />

                    <TouchableOpacity
                      style={styles.botonAgregar}
                      onPress={() => agregarExtra(seleccionado)}
                    >
                      <Text style={styles.botonAgregarTexto}>
                        Agregar al kit
                      </Text>
                    </TouchableOpacity>
                  </>
                );
              })()}
          </ScrollView>

          <TouchableOpacity style={styles.botonEnviar} onPress={crearSolicitud}>
            <Text style={styles.textoEnviar}>Crear solicitud</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelar} onPress={onClose}>
            <Text style={styles.cancelarTexto}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    maxHeight: "95%",
  },
  titulo: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  subtitulo: { fontSize: 16, fontWeight: "600", marginTop: 15 },
  itemRow: {
    flexDirection: "row",
    paddingVertical: 4,
  },
  eliminar: { color: "red", paddingHorizontal: 6 },
  input: {
    backgroundColor: "#F1F1F1",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  listaResultados: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#DDD",
    marginTop: 4,
    borderRadius: 8,
  },
  resultadoItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderColor: "#EEE",
  },
  label: { marginTop: 8, fontWeight: "600" },
  botonAgregar: {
    backgroundColor: "#00BFA5",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  botonAgregarTexto: { color: "white", textAlign: "center" },
  botonEnviar: {
    backgroundColor: "#00BFA5",
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
  },
  textoEnviar: { color: "white", textAlign: "center", fontWeight: "600" },
  cancelar: { marginTop: 10, alignItems: "center" },
  cancelarTexto: { color: "red" },
});

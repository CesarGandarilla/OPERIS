import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Switch,
} from "react-native";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/inventarios";
import { tema } from "../tema"

export default function AgregarSolicitudRapidaModal({
  visible,
  onClose,
  usuario,
  rol,
  onEnviar,
}) {
  const [insumoSeleccionado, setInsumoSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState("");
  const [insumos, setInsumos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [itemsSeleccionados, setItemsSeleccionados] = useState([]);
  const [urgente, setUrgente] = useState(false);
  const [comentario, setComentario] = useState("");
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [errores, setErrores] = useState({ cantidad: "", insumo: "" });
  

  useEffect(() => {
    const cargar = async () => {
      try {
        const q = query(
          collection(db, "insumos"),
          orderBy("fechaIngreso", "desc")
        );
        const snap = await getDocs(q);
        setInsumos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error cargando insumos (rápida):", err);
        Alert.alert("Error", "No se pudieron cargar los insumos.");
      }
    };

    if (visible) cargar();
  }, [visible]);

  const insumosFiltrados =
    busqueda.trim() === ""
      ? []
      : insumos.filter((i) =>
          (i.nombre || "").toLowerCase().includes(busqueda.toLowerCase())
        );

  const resetFormulario = () => {
    setBusqueda("");
    setInsumoSeleccionado(null);
    setCantidad("");
    setUrgente(false);
    setComentario("");
    setMostrarResultados(false);
    setItemsSeleccionados([])
    setErrores({ cantidad: "", insumo: "" });
  };

  

  const agregarItem = () => {
    let huboError = false;
    const nuevos = { cantidad: "", insumo: "" };

    if (!insumoSeleccionado) {
      nuevos.insumo = "Selecciona un insumo.";
      huboError = true;
    }

    const cantidadNum = parseInt(cantidad, 10);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      nuevos.cantidad = "Ingresa una cantidad válida.";
      huboError = true;
    }

    if (huboError) {
      setErrores(nuevos);
      return;
    }

    const nuevo = {
      insumoId: insumoSeleccionado.id,
      nombre: insumoSeleccionado.nombre,
      cantidad: cantidadNum,
      urgente,
      comentario: comentario?.trim() || "",
    };

    setItemsSeleccionados((p) => [...p, nuevo]);

    // limpiar campos para agregar otro
    setInsumoSeleccionado(null);
    setCantidad("");
    setBusqueda("");
    setUrgente(false);
    setComentario("");
    setErrores({ cantidad: "", insumo: "" });
  };
  
  const enviarSolicitud = () => {
    if (itemsSeleccionados.length === 0) {
      Alert.alert("Error", "Agrega al menos un insumo.");
      return;
    }

    const solicitud = {
      tipo: "rapida",
      usuario,
      rol,
      estado: "Pendiente",
      creadoEn: Date.now(),
      items: itemsSeleccionados,
      fechaNecesaria: null,
      destino: "",
      cirugia: "",
    };

    onEnviar(solicitud);

    resetFormulario();
    onClose();
  };


  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.overlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.title}>Solicitud Rápida</Text>

              <ScrollView keyboardShouldPersistTaps="handled">
                {/* Buscar */}
                <Text style={styles.label}>Artículo</Text>
                <TextInput
                  placeholder="Escribe para buscar"
                  value={busqueda}
                  onChangeText={(t) => {
                    setBusqueda(t);
                    setMostrarResultados(t.trim() !== "");
                    setInsumoSeleccionado(null);
                    setErrores((p) => ({ ...p, insumo: "" }));
                  }}
                  style={styles.input}
                  placeholderTextColor="#999"
                />

                {mostrarResultados && (
                  <View style={styles.smallListContainer}>
                    <ScrollView>
                      {insumosFiltrados.length === 0 ? (
                        <View style={styles.item}>
                          <Text>No se encontraron insumos</Text>
                        </View>
                      ) : (
                        insumosFiltrados.map((ins) => (
                          <TouchableOpacity
                            key={ins.id}
                            style={[
                              styles.item,
                              insumoSeleccionado?.id === ins.id &&
                                styles.itemSelected,
                            ]}
                            onPress={() => {
                              setInsumoSeleccionado(ins);
                              setBusqueda(ins.nombre);
                              setMostrarResultados(false);
                            }}
                          >
                            <Text>{ins.nombre}</Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </View>
                )}

                {!!errores.insumo && (
                  <Text style={styles.errorText}>{errores.insumo}</Text>
                )}

                {/* Cantidad */}
                <Text style={styles.label}>Cantidad</Text>
                <TextInput
                  placeholder="Ej. 3"
                  style={styles.input}
                  value={cantidad}
                  keyboardType="numeric"
                  onChangeText={(t) => {
                    const onlyNum = t.replace(/[^0-9]/g, "");
                    setCantidad(onlyNum);
                    setErrores((p) => ({ ...p, cantidad: "" }));
                  }}
                  placeholderTextColor="#999"
                />
                {!!errores.cantidad && (
                  <Text style={styles.errorText}>{errores.cantidad}</Text>
                )}

                {/* Urgente */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 8,
                  }}
                >
                  <Text style={{ fontWeight: "600", marginRight: 8 }}>
                    Urgente
                  </Text>
                  <Switch value={urgente} onValueChange={setUrgente} />
                </View>

                {/* Comentario */}
                <Text style={[styles.label, { marginTop: 10 }]}>
                  Comentario (opcional)
                </Text>
                <TextInput
                  placeholder="Detalle breve"
                  style={[
                    styles.input,
                    { minHeight: 60, textAlignVertical: "top" },
                  ]}
                  value={comentario}
                  onChangeText={setComentario}
                  multiline
                  placeholderTextColor="#999"
                />
              </ScrollView>
              {/*Botón de agregar más shet */}
                   <TouchableOpacity
                      style={{
                        backgroundColor: "#00bfa5",
                        padding: 12,
                        borderRadius: 8,
                        marginTop: 10,
                      }}
                      onPress={agregarItem}
                    >
                      <Text style={{ color: "white", fontWeight: "600", textAlign: "center" }}>
                        Agregar insumo
                      </Text>
                    </TouchableOpacity>

                    {/* Mostrar lista de los insumos agregados */}
                    {itemsSeleccionados.length > 0 && (
                      <View style={{ marginTop: 15 }}>
                        <Text style={{ fontWeight: "700", marginBottom: 5 }}>
                          Insumos agregados:
                        </Text>

                        {itemsSeleccionados.map((item, index) => (
                          <Text key={index}>• {item.nombre} — {item.cantidad}</Text>
                        ))}
                      </View>
                    )}

                    {/* Botón final para enviar la solicitud */}
                    <TouchableOpacity
                      style={{
                        backgroundColor: tema.colorPrincipal,
                        padding: 15,
                        borderRadius: 8,
                        marginTop: 20,
                      }}
                      onPress={enviarSolicitud}
                    >
                      <Text style={{ color: "white", fontWeight: "600", textAlign: "center" }}>
                        Enviar solicitud
                      </Text>
                    </TouchableOpacity>
              

              {/* Cancelar */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  resetFormulario();
                  onClose();
                }}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContainer: {
    width: "94%",
    maxWidth: 480,
    backgroundColor: "#fff",
    maxHeight: "95%",
    padding: 20,
    borderRadius: 16,
    elevation: 6,
    alignSelf: "center",
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 5 },
  label: { fontWeight: "600", marginTop: 8, marginBottom: 4 },
  input: {
    backgroundColor: "#F1F1F1",
    borderRadius: 12,
    padding: 10,
  },
  smallListContainer: {
    maxHeight: 160,
    borderWidth: 1,
    borderColor: "#EEE",
    marginTop: 4,
    borderRadius: 12,
  },
  item: { padding: 8, borderBottomWidth: 1, borderColor: "#EEE" },
  itemSelected: { backgroundColor: "#E0F2F1" },
  navRow: { flexDirection: "row", marginTop: 10 },
  navButton: {
    flex: 1,
    backgroundColor: "#00BFA5",
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: "center",
  },
  navButtonText: { color: "#fff", fontWeight: "600" },
  cancelButton: { padding: 10, alignItems: "center", marginTop: 4 },
  cancelText: { color: "red" },
  errorText: { color: "#C62828", fontSize: 12, marginTop: 2 },
});

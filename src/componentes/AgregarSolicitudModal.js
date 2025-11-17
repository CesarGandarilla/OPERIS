import React, { useState, useEffect } from "react";
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
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
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

  const [busqueda, setBusqueda] = useState("");

  // Paso del formulario: 1 = insumos, 2 = datos solicitud
  const [paso, setPaso] = useState(1);

  // Fecha y hora necesarias (en un solo Date)
  const [fechaNecesaria, setFechaNecesaria] = useState(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);

  const [destino, setDestino] = useState("");
  const [cirugia, setCirugia] = useState("");

  useEffect(() => {
    const cargarInsumos = async () => {
      try {
        const snap = await getDocs(collection(db, "insumos"));
        setInsumos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Error cargando insumos", error);
        Alert.alert("Error", "No se pudieron cargar los insumos.");
      }
    };
    cargarInsumos();
  }, []);

  const insumosFiltrados = insumos.filter((i) =>
    i.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const resetFormulario = () => {
    setSeleccion([]);
    setCantidad("");
    setInsumoSeleccionado(null);
    setBusqueda("");
    setFechaNecesaria(null);
    setDestino("");
    setCirugia("");
    setDatePickerVisibility(false);
    setTimePickerVisibility(false);
    setPaso(1);
  };

  const handleCerrar = () => {
    resetFormulario();
    onClose();
  };

  const agregarItem = () => {
    if (!insumoSeleccionado || !cantidad) {
      Alert.alert("Error", "Selecciona un insumo y una cantidad.");
      return;
    }

    const cantidadNumero = parseInt(cantidad, 10);
    if (isNaN(cantidadNumero) || cantidadNumero <= 0) {
      Alert.alert("Error", "La cantidad debe ser un número mayor a cero.");
      return;
    }

    setSeleccion((prev) => {
      const idx = prev.findIndex(
        (p) => p.insumoId === insumoSeleccionado.id
      );
      if (idx !== -1) {
        const copia = [...prev];
        copia[idx] = {
          ...copia[idx],
          cantidad: copia[idx].cantidad + cantidadNumero,
        };
        return copia;
      }

      return [
        ...prev,
        {
          insumoId: insumoSeleccionado.id,
          nombre: insumoSeleccionado.nombre,
          cantidad: cantidadNumero,
        },
      ];
    });

    setCantidad("");
    // Dejamos el nombre en el input para que se vea qué insumo fue
    setInsumoSeleccionado(null);
  };

  const eliminarSeleccion = (index) => {
    setSeleccion((prev) => prev.filter((_, i) => i !== index));
  };

  // --- DateTimePickerModal lógica ---

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  const showTimePicker = () => setTimePickerVisibility(true);
  const hideTimePicker = () => setTimePickerVisibility(false);

  const handleConfirmDate = (date) => {
    const base = fechaNecesaria ? new Date(fechaNecesaria) : new Date();
    const nueva = new Date(base);
    nueva.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    setFechaNecesaria(nueva);
    hideDatePicker();
  };

  const handleConfirmTime = (time) => {
    const base = fechaNecesaria ? new Date(fechaNecesaria) : new Date();
    const nueva = new Date(base);
    nueva.setHours(time.getHours(), time.getMinutes(), 0, 0);
    setFechaNecesaria(nueva);
    hideTimePicker();
  };

  const mostrarTextoFechaHora = () => {
    if (!fechaNecesaria) return "Sin seleccionar";
    const d = new Date(fechaNecesaria);
    return `${d.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })} • ${d.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const enviarSolicitud = () => {
    if (seleccion.length === 0) {
      Alert.alert("Error", "Agrega al menos un insumo.");
      return;
    }

    if (!fechaNecesaria) {
      Alert.alert(
        "Faltan datos",
        "Selecciona la fecha y hora en que se necesitan los insumos."
      );
      return;
    }

    if (!destino) {
      Alert.alert("Faltan datos", "El destino es obligatorio.");
      return;
    }

    const payload = {
      items: seleccion,
      fechaNecesaria, // Date → Firestore la guarda como Timestamp
      destino,
      cirugia,
    };

    onEnviar(payload);
    resetFormulario();
    onClose();
  };

  const irASiguientePaso = () => {
    if (seleccion.length === 0) {
      Alert.alert("Faltan insumos", "Agrega al menos un insumo para continuar.");
      return;
    }
    setPaso(2);
  };

  const irAPasoAnterior = () => setPaso(1);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          {/* overlay SIN fondo gris/negro */}
          <View style={styles.overlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.title}>Nueva Solicitud</Text>

              {/* Indicador simple de pasos */}
              <View style={styles.stepsRow}>
                <View style={[styles.stepDot, paso === 1 && styles.stepDotActive]}>
                  <Text style={styles.stepDotText}>1</Text>
                </View>
                <View style={styles.stepLine} />
                <View style={[styles.stepDot, paso === 2 && styles.stepDotActive]}>
                  <Text style={styles.stepDotText}>2</Text>
                </View>
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {paso === 1 && (
                  <>
                    {/* SECCIÓN 1: SELECCIONAR INSUMOS */}
                    <Text style={styles.sectionTitle}>
                      1. Selecciona los insumos
                    </Text>

                    <Text style={styles.label}>
                      Buscar insumo en el inventario
                    </Text>
                    <TextInput
                      placeholder="Ej. Gasas estériles, sutura, bata..."
                      value={busqueda}
                      onChangeText={setBusqueda}
                      style={styles.searchInput}
                      placeholderTextColor="#999"
                      returnKeyType="done"
                    />

                    {/* Lista de insumos con altura limitada */}
                    <View style={styles.smallListContainer}>
                      <ScrollView keyboardShouldPersistTaps="handled">
                        {insumosFiltrados.map((item) => (
                          <TouchableOpacity
                            key={item.id}
                            style={[
                              styles.item,
                              insumoSeleccionado?.id === item.id &&
                                styles.itemSelected,
                            ]}
                            onPress={() => {
                              setInsumoSeleccionado(item);
                              // se rellena el campo de texto con lo que seleccionaste
                              setBusqueda(item.nombre || "");
                            }}
                          >
                            <Text style={styles.itemText}>{item.nombre}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    <Text style={styles.label}>
                      Cantidad del insumo seleccionado
                    </Text>
                    <TextInput
                      placeholder="Ej. 5"
                      style={styles.input}
                      keyboardType="numeric"
                      value={cantidad}
                      onChangeText={setCantidad}
                      placeholderTextColor="#999"
                      returnKeyType="done"
                    />

                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={agregarItem}
                    >
                      <Text style={styles.addButtonText}>Agregar insumo</Text>
                    </TouchableOpacity>

                    <Text style={[styles.label, { marginTop: 12 }]}>
                      Insumos añadidos a la solicitud
                    </Text>

                    {/* Lista de selección también con altura limitada */}
                    <View style={styles.smallListContainer}>
                      <ScrollView keyboardShouldPersistTaps="handled">
                        {seleccion.map((item, index) => (
                          <View key={index} style={styles.previewItem}>
                            <Text style={styles.previewText}>
                              {item.nombre} × {item.cantidad}
                            </Text>
                            <TouchableOpacity
                              onPress={() => eliminarSeleccion(index)}
                              style={styles.removeButton}
                            >
                              <Text style={styles.removeText}>Eliminar</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  </>
                )}

                {paso === 2 && (
                  <>
                    {/* SECCIÓN 2: DATOS DE LA SOLICITUD */}
                    <Text style={styles.sectionTitle}>
                      2. Datos de la solicitud
                    </Text>

                    <Text style={styles.label}>Fecha y hora requeridas</Text>
                    <View style={styles.rowInline}>
                      <TouchableOpacity
                        style={styles.selectorButton}
                        onPress={showDatePicker}
                      >
                        <Text style={styles.selectorText}>Seleccionar fecha</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.selectorButton}
                        onPress={showTimePicker}
                      >
                        <Text style={styles.selectorText}>Seleccionar hora</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Texto de fecha/hora seleccionado → grande y fuerte */}
                    <Text style={styles.selectedDateText}>
                      {mostrarTextoFechaHora()}
                    </Text>

                    <Text style={styles.label}>Destino</Text>
                    <TextInput
                      placeholder="Ej. Quirófano 3, Urgencias, Gineco, etc."
                      value={destino}
                      onChangeText={setDestino}
                      style={styles.input}
                      placeholderTextColor="#999"
                      returnKeyType="done"
                    />

                    <Text style={styles.label}>
                      Cirugía / procedimiento (opcional)
                    </Text>
                    <TextInput
                      placeholder="Ej. Colecistectomía laparoscópica"
                      value={cirugia}
                      onChangeText={setCirugia}
                      style={styles.input}
                      placeholderTextColor="#999"
                      returnKeyType="done"
                    />
                  </>
                )}
              </ScrollView>

              {/* Date/Time picker modals */}
              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleConfirmDate}
                onCancel={hideDatePicker}
                isDarkModeEnabled={true}
              />

              <DateTimePickerModal
                isVisible={isTimePickerVisible}
                mode="time"
                onConfirm={handleConfirmTime}
                onCancel={hideTimePicker}
                isDarkModeEnabled={true}
              />

              {/* Navegación entre pasos */}
              <View style={styles.navRow}>
                {paso === 2 && (
                  <TouchableOpacity
                    style={[styles.navButton, styles.navBackButton]}
                    onPress={irAPasoAnterior}
                  >
                    <Text style={styles.navBackText}>← Atrás</Text>
                  </TouchableOpacity>
                )}

                {paso === 1 && (
                  <TouchableOpacity
                    style={[
                      styles.navButton,
                      seleccion.length === 0 && styles.navButtonDisabled,
                    ]}
                    onPress={irASiguientePaso}
                    disabled={seleccion.length === 0}
                  >
                    <Text style={styles.navNextText}>Continuar</Text>
                  </TouchableOpacity>
                )}

                {paso === 2 && (
                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={enviarSolicitud}
                  >
                    <Text style={styles.navNextText}>Enviar solicitud</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Cancelar general */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCerrar}
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
    backgroundColor: "transparent", // sin gris/negro
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "96%",          // más ancho
    maxHeight: "95%",      // más alto
    backgroundColor: "#fff",
    padding: 20,           // más padding
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  stepDotActive: {
    borderColor: "#00bfa5",
    backgroundColor: "#e0f2f1",
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#555",
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333",
    marginTop: 12,
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginTop: 8,
    marginBottom: 4,
  },
  searchInput: {
    backgroundColor: "#f2f2f2",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    fontSize: 14,
  },
  smallListContainer: {
    maxHeight: 120,
    marginTop: 4,
    borderRadius: 8,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#eee",
  },
  item: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  itemSelected: {
    backgroundColor: "#e0f2f1",
  },
  itemText: {
    fontSize: 13,
  },
  input: {
    backgroundColor: "#f2f2f2",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    fontSize: 14,
  },
  previewItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  previewText: {
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  removeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeText: {
    color: "#F44336",
    fontSize: 11,
    fontWeight: "600",
  },
  addButton: {
    backgroundColor: "#00bfa5",
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  rowInline: {
    flexDirection: "row",
    marginTop: 4,
    gap: 8,
  },
  selectorButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#e0f2f1",
    alignItems: "center",
  },
  selectorText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#00695c",
  },
  selectedDateText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#00897b",
    alignItems: "center",
    marginHorizontal: 4,
  },
  navBackButton: {
    backgroundColor: "#e0e0e0",
  },
  navBackText: {
    color: "#333",
    fontWeight: "600",
    fontSize: 13,
  },
  navNextText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  navButtonDisabled: {
    backgroundColor: "#c8e6c9",
  },
  cancelButton: {
    marginTop: 6,
    paddingVertical: 8,
    alignItems: "center",
  },
  cancelText: {
    color: "red",
    fontSize: 13,
  },
});

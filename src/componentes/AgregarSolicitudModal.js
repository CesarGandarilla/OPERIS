// AgregarSolicitudModal.js
import React, { useState, useEffect, useMemo } from "react";
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

//  IMPORTAMOS LISTAS EXTERNAS
import { LUGARES_ENTREGA } from "../constants/lugaresEntrega";
import { CIRUGIAS } from "../constants/cirugias";
import { kits } from "../constants/kits";

const MAX_CANTIDAD_POR_ITEM = 100;

export default function AgregarSolicitudModal({
  visible,
  onClose,
  usuario,
  rol,
  onEnviar,
  itemsIniciales = null,
  kitSeleccionado = null,
}) {
  // Datos de inventario
  const [insumos, setInsumos] = useState([]);
  // Form
  const [seleccion, setSeleccion] = useState([]); // [{ insumoId|null, nombre, cantidad }]
  const [cantidad, setCantidad] = useState("");
  const [insumoSeleccionado, setInsumoSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  // pasos
  const [paso, setPaso] = useState(1);
  // fecha / hora
  const [fechaNecesaria, setFechaNecesaria] = useState(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
  // destino
  const [lugarEntrega, setLugarEntrega] = useState(null);
  const [destinoBusqueda, setDestinoBusqueda] = useState("");
  // cirugia
  const [cirugia, setCirugia] = useState("");
  // mensajes / errores / UI
  const [errores, setErrores] = useState({
    cantidad: "",
    fecha: "",
    destino: "",
    cirugia: "",
  });
  const [mensajeInsumo, setMensajeInsumo] = useState("");
  const [mostrarResultadosInsumos, setMostrarResultadosInsumos] =
    useState(false);
  const [mostrarResultadosCirugia, setMostrarResultadosCirugia] =
    useState(false);

  // Cargar insumos desde Firestore (una vez)
  useEffect(() => {
    let mounted = true;
    const cargarInsumos = async () => {
      try {
        const snap = await getDocs(collection(db, "insumos"));
        if (!mounted) return;
        setInsumos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Error cargando insumos", error);
        Alert.alert("Error", "No se pudieron cargar los insumos.");
      }
    };
    cargarInsumos();
    return () => {
      mounted = false;
    };
  }, []);

  // Mapeos útiles: nombre -> insumo (buscar por igualdad en minúsculas)
  const insumoPorNombre = useMemo(() => {
    const map = new Map();
    insumos.forEach((i) => {
      if (i.nombre) map.set(i.nombre.trim().toLowerCase(), i);
    });
    return map;
  }, [insumos]);

  // Cuando se abre el modal y vienen items iniciales / kit -> precargar selección
  useEffect(() => {
    if (!visible) return;
    const inicial = kitSeleccionado?.items || itemsIniciales || null;
    if (inicial && Array.isArray(inicial)) {
      // Mapear: si existe nombre en inventario, traer su id; si no, dejar null.
      const itemsMapeados = inicial.map((it) => {
        const nombre = (it.nombre || "").trim();
        const encontrado = insumoPorNombre.get(nombre.toLowerCase());
        return {
          insumoId: encontrado?.id || null,
          nombre,
          cantidad: Number(it.cantidad) || 0,
        };
      });
      setSeleccion(itemsMapeados);
      setPaso(1);
      setMensajeInsumo(
        itemsMapeados.length ? "Kit cargado en la selección." : ""
      );
    }
    // Si no hay iniciales, no tocamos la selección
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, kitSeleccionado, itemsIniciales, insumoPorNombre]);

  // Filtrado dinámico de insumos por búsqueda
  const insumosFiltrados =
    busqueda.trim() === ""
      ? []
      : insumos.filter((i) =>
          i.nombre?.toLowerCase().includes(busqueda.toLowerCase())
        );

  // Filtrar cirugías (constante)
  const cirugiasFiltradas =
    cirugia.trim() === ""
      ? []
      : CIRUGIAS.filter((c) =>
          c.nombre.toLowerCase().includes(cirugia.toLowerCase())
        );

  // Reset completo del formulario
  const resetFormulario = () => {
    setSeleccion([]);
    setCantidad("");
    setInsumoSeleccionado(null);
    setBusqueda("");
    setFechaNecesaria(null);
    setLugarEntrega(null);
    setDestinoBusqueda("");
    setCirugia("");
    setDatePickerVisibility(false);
    setTimePickerVisibility(false);
    setPaso(1);
    setErrores({
      cantidad: "",
      fecha: "",
      destino: "",
      cirugia: "",
    });
    setMensajeInsumo("");
    setMostrarResultadosInsumos(false);
    setMostrarResultadosCirugia(false);
  };

  // Handle cerrar
  const handleCerrar = () => {
    resetFormulario();
    onClose();
  };

  // Agregar item a seleccion (mantiene lógica original, pero robusta)
  const agregarItem = () => {
    setErrores((prev) => ({ ...prev, cantidad: "" }));
    setMensajeInsumo("");

    if (!insumoSeleccionado || !cantidad) {
      setErrores((prev) => ({
        ...prev,
        cantidad: "Selecciona un insumo y una cantidad válida.",
      }));
      return;
    }

    const cantidadNumero = parseInt(cantidad, 10);

    if (isNaN(cantidadNumero) || cantidadNumero <= 0) {
      setErrores((prev) => ({ ...prev, cantidad: "La cantidad debe ser mayor a cero." }));
      return;
    }

    if (cantidadNumero > MAX_CANTIDAD_POR_ITEM) {
      setErrores((prev) => ({ ...prev, cantidad: `Máximo permitido: ${MAX_CANTIDAD_POR_ITEM}.` }));
      return;
    }

    setSeleccion((prev) => {
      const idx = prev.findIndex(
        (p) =>
          (p.insumoId && p.insumoId === insumoSeleccionado.id) ||
          (p.insumoId == null && p.nombre === insumoSeleccionado.nombre)
      );

      if (idx !== -1) {
        const copia = [...prev];
        const nuevaCantidad = copia[idx].cantidad + cantidadNumero;

        if (nuevaCantidad > MAX_CANTIDAD_POR_ITEM) {
          setErrores((prev) => ({
            ...prev,
            cantidad: `Total excede el máximo permitido (${MAX_CANTIDAD_POR_ITEM}).`,
          }));
          return prev;
        }

        copia[idx].cantidad = nuevaCantidad;
        return copia;
      }

      return [
        ...prev,
        {
          insumoId: insumoSeleccionado.id || null,
          nombre: insumoSeleccionado.nombre,
          cantidad: cantidadNumero,
        },
      ];
    });

    // limpiar campos
    setCantidad("");
    setInsumoSeleccionado(null);
    setBusqueda("");
    setMensajeInsumo("Insumo añadido a la solicitud.");
    setMostrarResultadosInsumos(false);
  };

  const eliminarSeleccion = (index) => {
    setSeleccion((prev) => prev.filter((_, i) => i !== index));
    setMensajeInsumo("");
  };

  // Date/time handlers
  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  const showTimePicker = () => setTimePickerVisibility(true);
  const hideTimePicker = () => setTimePickerVisibility(false);

  const handleConfirmDate = (date) => {
    const base = fechaNecesaria ? new Date(fechaNecesaria) : new Date();
    const nueva = new Date(base);
    nueva.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    setFechaNecesaria(nueva);
    setErrores((prev) => ({ ...prev, fecha: "" }));
    hideDatePicker();
  };

  const handleConfirmTime = (time) => {
    const base = fechaNecesaria ? new Date(fechaNecesaria) : new Date();
    const nueva = new Date(base);
    nueva.setHours(time.getHours(), time.getMinutes());
    setFechaNecesaria(nueva);
    setErrores((prev) => ({ ...prev, fecha: "" }));
    hideTimePicker();
  };

  const mostrarTextoFechaHora = () => {
    if (!fechaNecesaria) return "Sin seleccionar";
    const d = new Date(fechaNecesaria);
    return `${d.toLocaleDateString()} • ${d
      .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      .replace("a. m.", "AM")
      .replace("p. m.", "PM")}`;
  };

  // Validación y envío (preserva tu payload original)
  const enviarSolicitud = () => {
    let huboError = false;
    const nuevosErrores = {
      cantidad: "",
      fecha: "",
      destino: "",
      cirugia: "",
    };

    if (!fechaNecesaria) {
      nuevosErrores.fecha = "Selecciona fecha y hora.";
      huboError = true;
    } else {
      const hoy = new Date();
      const manana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
      const maxDate = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 30);

      const fechaSolo = new Date(
        fechaNecesaria.getFullYear(),
        fechaNecesaria.getMonth(),
        fechaNecesaria.getDate()
      );

      if (fechaSolo < manana || fechaSolo > maxDate) {
        nuevosErrores.fecha = "La fecha debe ser desde mañana y máximo en 30 días.";
        huboError = true;
      }
    }

    if (!lugarEntrega) {
      nuevosErrores.destino = "Selecciona un destino válido.";
      huboError = true;
    }

    if (!cirugia.trim()) {
      nuevosErrores.cirugia = "Describe la cirugía o procedimiento.";
      huboError = true;
    } else if (cirugia.length > 50) {
      nuevosErrores.cirugia = "Máximo 50 caracteres.";
      huboError = true;
    }

    if (seleccion.length === 0) {
      Alert.alert("Faltan insumos", "Agrega al menos un insumo.");
      huboError = true;
    }

    if (huboError) {
      setErrores((prev) => ({ ...prev, ...nuevosErrores }));
      return;
    }

    const destinoObj = LUGARES_ENTREGA.find((l) => l.id === lugarEntrega);

    onEnviar({
      items: seleccion,
      fechaNecesaria,
      destinoId: lugarEntrega,
      destino: destinoObj?.nombre || "",
      cirugia,
    });

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

  // Subcomponent: lista de insumos añadidos (render)
  const RenderSeleccion = () => (
    <View style={styles.smallListContainer}>
      <ScrollView>
        {seleccion.map((item, index) => (
          <View key={index} style={styles.previewItem}>
            <Text>{item.nombre} × {item.cantidad}</Text>
            <TouchableOpacity onPress={() => eliminarSeleccion(index)}>
              <Text style={styles.removeText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        ))}
        {seleccion.length === 0 && (
          <View style={styles.item}>
            <Text>Aún no has añadido insumos.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.overlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.title}>Nueva Solicitud</Text>

              {/* Pasos */}
              <View style={styles.stepsRow}>
                <View style={[styles.stepDot, paso === 1 && styles.stepDotActive]}>
                  <Text style={styles.stepDotText}>1</Text>
                </View>
                <View style={styles.stepLine} />
                <View style={[styles.stepDot, paso === 2 && styles.stepDotActive]}>
                  <Text style={styles.stepDotText}>2</Text>
                </View>
              </View>

              {/* Banner */}
              {paso === 1 && !!mensajeInsumo && !errores.cantidad && (
                <View style={styles.successBox}>
                  <Text style={styles.successText}>✓ {mensajeInsumo}</Text>
                </View>
              )}

              <ScrollView keyboardShouldPersistTaps="handled">
                {paso === 1 && (
                  <>
                    <Text style={styles.sectionTitle}>1. Selecciona los insumos</Text>

                    {/* Buscar insumo */}
                    <Text style={styles.label}>Buscar insumo</Text>
                    <TextInput
                      placeholder="Escribe para buscar"
                      value={busqueda}
                      onChangeText={(text) => {
                        setBusqueda(text);
                        setInsumoSeleccionado(null);
                        setMensajeInsumo("");
                        setMostrarResultadosInsumos(text.trim() !== "");
                      }}
                      style={styles.searchInput}
                      placeholderTextColor="#999"
                      color="#000"
                    />

                    {/* Resultados */}
                    {mostrarResultadosInsumos && busqueda.trim() !== "" && (
                      <View style={styles.smallListContainer}>
                        <ScrollView keyboardShouldPersistTaps="handled">
                          {insumosFiltrados.length === 0 ? (
                            <View style={styles.item}>
                              <Text>No se encontraron insumos</Text>
                              {/* Permitir crear item "libre" usando el texto de búsqueda */}
                              <TouchableOpacity
                                style={{ padding: 8 }}
                                onPress={() => {
                                  const nombreLibre = busqueda.trim();
                                  if (!nombreLibre) return;
                                  const fake = { id: null, nombre: nombreLibre };
                                  setInsumoSeleccionado(fake);
                                  setBusqueda(nombreLibre);
                                  setMostrarResultadosInsumos(false);
                                }}
                              >
                                <Text style={{ color: "#00695C" }}>
                                  Usar "{busqueda.trim()}"
                                </Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            insumosFiltrados.map((item) => (
                              <TouchableOpacity
                                key={item.id}
                                style={[
                                  styles.item,
                                  insumoSeleccionado?.id === item.id && styles.itemSelected,
                                ]}
                                onPress={() => {
                                  setInsumoSeleccionado(item);
                                  setBusqueda(item.nombre);
                                  setMostrarResultadosInsumos(false);
                                }}
                              >
                                <Text>{item.nombre}</Text>
                              </TouchableOpacity>
                            ))
                          )}
                        </ScrollView>
                      </View>
                    )}

                    {/* Cantidad */}
                    <Text style={styles.label}>Cantidad</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      maxLength={3}
                      placeholder="Ej. 5"
                      value={cantidad}
                      onChangeText={(t) => {
                        const soloNum = t.replace(/[^0-9]/g, "");
                        setCantidad(soloNum);
                        setErrores((p) => ({ ...p, cantidad: "" }));
                      }}
                      placeholderTextColor="#999"
                      color="#000"
                    />
                    <View style={styles.errorContainer}>
                      {!!errores.cantidad && (
                        <Text style={styles.errorText} numberOfLines={2} ellipsizeMode="tail">
                          {errores.cantidad}
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity style={styles.addButton} onPress={agregarItem}>
                      <Text style={styles.addButtonText}>Agregar insumo</Text>
                    </TouchableOpacity>

                    <Text style={[styles.label, { marginTop: 10 }]}>Insumos añadidos</Text>
                    <RenderSeleccion />
                  </>
                )}

                {paso === 2 && (
                  <>
                    <Text style={styles.sectionTitle}>2. Datos de la solicitud</Text>

                    {/* Fecha y hora */}
                    <Text style={styles.label}>Fecha y hora</Text>
                    <View style={styles.rowInline}>
                      <TouchableOpacity style={styles.selectorButton} onPress={showDatePicker}>
                        <Text style={styles.selectorText}>Seleccionar fecha</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.selectorButton} onPress={showTimePicker}>
                        <Text style={styles.selectorText}>Seleccionar hora</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.selectedDateText}>{mostrarTextoFechaHora()}</Text>
                    <View style={styles.errorContainer}>
                      {!!errores.fecha && (
                        <Text style={styles.errorText} numberOfLines={2} ellipsizeMode="tail">
                          {errores.fecha}
                        </Text>
                      )}
                    </View>

                    {/* Destino */}
                    <Text style={styles.label}>Destino</Text>
                    <View style={styles.destinosContainer}>
                      {LUGARES_ENTREGA.map((lugar) => (
                        <TouchableOpacity
                          key={lugar.id}
                          style={[
                            styles.destinoPill,
                            lugarEntrega === lugar.id && styles.destinoPillSelected,
                          ]}
                          onPress={() => {
                            setLugarEntrega(lugar.id);
                            setDestinoBusqueda(lugar.nombre);
                            setErrores((p) => ({ ...p, destino: "" }));
                          }}
                        >
                          <Text
                            style={[
                              styles.destinoPillText,
                              lugarEntrega === lugar.id && styles.destinoPillTextSelected,
                            ]}
                          >
                            {lugar.nombre}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={styles.destinoSeleccionadoText}>
                      {lugarEntrega ? `Destino seleccionado: ${destinoBusqueda}` : "Ningún destino seleccionado"}
                    </Text>
                    <View style={styles.errorContainer}>
                      {!!errores.destino && (
                        <Text style={styles.errorText} numberOfLines={2} ellipsizeMode="tail">
                          {errores.destino}
                        </Text>
                      )}
                    </View>

                    {/* Cirugía */}
                    <Text style={styles.label}>Cirugía / procedimiento</Text>
                    <TextInput
                      placeholder="Ej. Colecistectomía laparoscópica"
                      style={styles.input}
                      value={cirugia}
                      onChangeText={(t) => {
                        setCirugia(t);
                        setErrores((p) => ({ ...p, cirugia: "" }));
                        setMostrarResultadosCirugia(t.trim() !== "");
                      }}
                      placeholderTextColor="#999"
                      color="#000"
                    />
                    <View style={styles.errorContainer}>
                      {!!errores.cirugia && (
                        <Text style={styles.errorText} numberOfLines={2} ellipsizeMode="tail">
                          {errores.cirugia}
                        </Text>
                      )}
                    </View>

                    {mostrarResultadosCirugia && cirugia.trim() !== "" && (
                      <View style={styles.smallListContainer}>
                        <ScrollView>
                          {cirugiasFiltradas.length === 0 ? (
                            <View style={styles.item}>
                              <Text>No hay coincidencias</Text>
                            </View>
                          ) : (
                            cirugiasFiltradas.map((c) => (
                              <TouchableOpacity
                                key={c.id}
                                style={styles.item}
                                onPress={() => {
                                  setCirugia(c.nombre);
                                  setMostrarResultadosCirugia(false);
                                }}
                              >
                                <Text>{c.nombre}</Text>
                              </TouchableOpacity>
                            ))
                          )}
                        </ScrollView>
                      </View>
                    )}
                  </>
                )}
              </ScrollView>

              {/* DatePickers */}
              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleConfirmDate}
                onCancel={hideDatePicker}
                textColor="#000"
                isDarkModeEnabled={false}
              />
              <DateTimePickerModal
                isVisible={isTimePickerVisible}
                mode="time"
                onConfirm={handleConfirmTime}
                onCancel={hideTimePicker}
                textColor="#000"
                isDarkModeEnabled={false}
              />

              {/* Navegación */}
              <View style={styles.navRow}>
                {paso === 2 && (
                  <TouchableOpacity style={[styles.navButton, styles.navBackButton]} onPress={irAPasoAnterior}>
                    <Text style={styles.navBackButtonText}>← Atrás</Text>
                  </TouchableOpacity>
                )}

                {paso === 1 && (
                  <TouchableOpacity
                    style={[styles.navButton, seleccion.length === 0 && styles.navButtonDisabled]}
                    disabled={seleccion.length === 0}
                    onPress={irASiguientePaso}
                  >
                    <Text style={styles.navButtonText}>Continuar</Text>
                  </TouchableOpacity>
                )}

                {paso === 2 && (
                  <TouchableOpacity style={styles.navButton} onPress={enviarSolicitud}>
                    <Text style={styles.navButtonText}>Enviar solicitud</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity style={styles.cancelButton} onPress={handleCerrar}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ===========================
   ESTILOS (preservados con mejoras)
   =========================== */
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
  stepsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  stepDotActive: {
    borderColor: "#00BFA5",
    backgroundColor: "#E0F2F1",
  },
  stepDotText: { fontWeight: "bold", fontSize: 12 },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    marginTop: 5,
    marginBottom: 4,
  },
  label: {
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 3,
  },
  searchInput: {
    backgroundColor: "#F1F1F1",
    borderRadius: 12,
    padding: 10,
  },
  smallListContainer: {
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#EEE",
    marginTop: 4,
    borderRadius: 12,
  },
  item: {
    padding: 8,
    borderBottomWidth: 1,
    borderColor: "#EEE",
  },
  itemSelected: {
    backgroundColor: "#E0F2F1",
  },
  input: {
    backgroundColor: "#F1F1F1",
    borderRadius: 12,
    padding: 10,
  },
  previewItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 6,
    borderBottomWidth: 1,
    borderColor: "#EEE",
  },
  removeText: { color: "#D32F2F" },
  addButton: {
    backgroundColor: "#00BFA5",
    padding: 10,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  addButtonText: { color: "#fff", fontWeight: "bold" },
  rowInline: { flexDirection: "row" },
  selectorButton: {
    flex: 1,
    backgroundColor: "#E0F2F1",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    marginRight: 8,
  },
  selectorText: {
    color: "#00695C",
    fontWeight: "600",
  },
  selectedDateText: {
    marginTop: 5,
    fontWeight: "600",
    color: "#222",
  },
  navRow: { flexDirection: "row", marginTop: 10 },
  navButton: {
    flex: 1,
    backgroundColor: "#00BFA5",
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: "center",
  },
  navBackButton: {
    backgroundColor: "#E0E0E0",
  },
  navButtonDisabled: { backgroundColor: "#B0C9C4" },
  navButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  navBackButtonText: {
    color: "#333",
    fontWeight: "600",
  },
  cancelButton: {
    padding: 10,
    alignItems: "center",
    marginTop: 4,
  },
  cancelText: { color: "red" },
  errorText: { color: "#C62828", fontSize: 12 },
  errorContainer: {
    minHeight: 18,
    justifyContent: "flex-start",
    alignSelf: "stretch",
  },
  successBox: {
    backgroundColor: "#E8F5E9",
    padding: 8,
    borderRadius: 12,
    borderColor: "#A5D6A7",
    borderWidth: 1,
    marginBottom: 8,
  },
  successText: {
    color: "#2E7D32",
    textAlign: "center",
    fontWeight: "600",
  },
  destinosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  destinoPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#B0BEC5",
    backgroundColor: "#FFFFFF",
    marginRight: 8,
    marginBottom: 6,
  },
  destinoPillSelected: {
    backgroundColor: "#00BFA5",
    borderColor: "#00BFA5",
  },
  destinoPillText: {
    fontSize: 13,
    color: "#37474F",
  },
  destinoPillTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  destinoSeleccionadoText: {
    marginTop: 6,
    fontSize: 13,
    color: "#555",
  },
});

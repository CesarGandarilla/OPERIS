import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Platform,
  StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function FechaHoraPicker({ label, mode, value, onChange }) {
  const [visible, setVisible] = useState(false);

  const mostrarPicker = () => setVisible(true);

  const cerrarPicker = () => setVisible(false);

  const onChangeInterno = (event, selectedDate) => {
    if (Platform.OS === "android") {
      cerrarPicker();
    }
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>

      {/* Botón que muestra la fecha/hora seleccionada */}
      <TouchableOpacity style={styles.selector} onPress={mostrarPicker}>
        <Text style={styles.selectorText}>
          {value
            ? mode === "date"
              ? value.toLocaleDateString()
              : value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : mode === "date"
            ? "Seleccionar fecha"
            : "Seleccionar hora"}
        </Text>
      </TouchableOpacity>

      {/* Modal iOS + Android uniforme */}
      {visible && (
        <Modal transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              {/* Picker */}
              <DateTimePicker
                value={value || new Date()}
                mode={mode}
                display={Platform.OS === "android" ? "spinner" : "spinner"}
                onChange={onChangeInterno}
                themeVariant="light" // fuerza texto oscuro en modo oscuro
                textColor="#000" // iOS
                locale="es-ES"
              />

              {/* Botón cerrar */}
              {Platform.OS === "ios" && (
                <TouchableOpacity style={styles.btnListo} onPress={cerrarPicker}>
                  <Text style={styles.btnListoText}>Listo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 5,
  },
  selector: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#fafafa",
  },
  selectorText: {
    fontSize: 16,
    color: "#111",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 18,
    width: "85%",
  },

  btnListo: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#00BFA5",
    alignItems: "center",
  },

  btnListoText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});

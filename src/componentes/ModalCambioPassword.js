// src/componentes/ModalCambioPassword.js
import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { useAuth } from "../auth/AuthContext";

export default function ModalCambioPassword({ visible, onClose }) {
  const { user } = useAuth();

  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCambiar = async () => {
    if (!actual || !nueva || !confirmar) {
      Alert.alert("Error", "Completa todos los campos.");
      return;
    }
    if (nueva !== confirmar) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }
    if (nueva.length < 6) {
      Alert.alert("Error", "Tu contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      setLoading(true);

      // 1) Reautenticar usuario
      const cred = EmailAuthProvider.credential(user.email, actual);
      await reauthenticateWithCredential(user, cred);

      // 2) Cambiar contraseña
      await updatePassword(user, nueva);

      Alert.alert("Éxito", "Tu contraseña ha sido actualizada.");
      onClose();

      // Limpia campos
      setActual("");
      setNueva("");
      setConfirmar("");
    } catch (e) {
      console.log("Error cambiando contraseña:", e);

      if (e.code === "auth/wrong-password") {
        Alert.alert("Error", "Tu contraseña actual es incorrecta.");
      } else if (e.code === "auth/weak-password") {
        Alert.alert("Error", "La nueva contraseña es demasiado débil.");
      } else if (e.code === "auth/requires-recent-login") {
        Alert.alert("Sesión expirada", "Vuelve a iniciar sesión para poder cambiar la contraseña.");
      } else {
        Alert.alert("Error", "No se pudo cambiar la contraseña.");
      }
    }

    setLoading(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Cambiar contraseña</Text>

          <TextInput
            placeholder="Contraseña actual"
            secureTextEntry
            style={styles.input}
            value={actual}
            onChangeText={setActual}
          />

          <TextInput
            placeholder="Nueva contraseña"
            secureTextEntry
            style={styles.input}
            value={nueva}
            onChangeText={setNueva}
          />

          <TextInput
            placeholder="Confirmar nueva contraseña"
            secureTextEntry
            style={styles.input}
            value={confirmar}
            onChangeText={setConfirmar}
          />

          <View style={styles.row}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleCambiar} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveText}>Guardar</Text>
              )}
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
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 18,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#f2f2f2",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  cancelText: {
    color: "#555",
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: "#00BFA5",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

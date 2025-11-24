import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../auth/AuthContext";
import { ROLES, DEPARTAMENTOS } from "../constants/catalogos";

export default function RegisterScreen({ navigation }) {
  const { register, loading } = useAuth() || {};

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [modalOptions, setModalOptions] = useState([]);
  const [modalTitle, setModalTitle] = useState("");
  const [modalSetter, setModalSetter] = useState(() => {});

  const openSelect = (title, options, setter) => {
    setModalTitle(title);
    setModalOptions(options);
    setModalSetter(() => setter);
    setOpenModal(true);
  };

  const onRegister = async () => {
    if (!name || !email || !password || !role || !department) {
      Alert.alert("Faltan datos", "Completa todos los campos correctamente.");
      return;
    }
    try {
      await register({ name, email, password, department, role });
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <>
      {/* SELECT MODAL */}
      <Modal visible={openModal} transparent animationType="slide">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setOpenModal(false)}
        />
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{modalTitle}</Text>

          {modalOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={styles.modalOption}
              onPress={() => {
                modalSetter(opt.value);
                setOpenModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{opt.label}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.modalCancel}
            onPress={() => setOpenModal(false)}
          >
            <Text style={styles.modalCancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* MAIN */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : -200}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.container}>

            {/* NUEVO HEADER IGUAL A AJUSTES */}
            <LinearGradient
              colors={["#00c6a7", "#02a4b3"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerBackground}
            >
              <Text style={styles.headerTitle}>Crear cuenta</Text>
              <Text style={styles.headerSubtitle}>Regístrate para comenzar</Text>
            </LinearGradient>

            {/* FORM CARD */}
            <View style={styles.form}>
              <TextInput
                placeholder="Nombre completo"
                value={name}
                onChangeText={setName}
                style={styles.input}
                placeholderTextColor="#999"
              />

              <TextInput
                placeholder="Correo electrónico"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                placeholderTextColor="#999"
              />

              {/* SELECT DEPARTAMENTO */}
              <TouchableOpacity
                style={styles.inputSelect}
                onPress={() =>
                  openSelect(
                    "Selecciona un departamento",
                    DEPARTAMENTOS,
                    setDepartment
                  )
                }
              >
                <Text style={{ color: department ? "#333" : "#999" }}>
                  {department
                    ? DEPARTAMENTOS.find((d) => d.value === department)?.label
                    : "Seleccionar departamento"}
                </Text>
              </TouchableOpacity>

              {/* SELECT ROL */}
              <TouchableOpacity
                style={styles.inputSelect}
                onPress={() =>
                  openSelect("Selecciona un rol", ROLES, setRole)
                }
              >
                <Text style={{ color: role ? "#333" : "#999" }}>
                  {role
                    ? ROLES.find((r) => r.value === role)?.label
                    : "Seleccionar rol"}
                </Text>
              </TouchableOpacity>

              <TextInput
                placeholder="Contraseña (mín. 6 caracteres)"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                placeholderTextColor="#999"
              />

              <TouchableOpacity
                style={[styles.button, loading && { opacity: 0.6 }]}
                onPress={onRegister}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Creando..." : "Registrar"}
                </Text>
              </TouchableOpacity>

              <Text style={styles.register}>
                ¿Ya tienes cuenta?{" "}
                <Text
                  style={styles.link}
                  onPress={() => navigation.navigate("Login")}
                >
                  Inicia sesión
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f9fc",
  },

  /* HEADER IGUAL A AJUSTES */
  headerBackground: {
    height: 230,
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: 50,
  },
  headerTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "white",
    fontSize: 16,
    opacity: 0.9,
    marginTop: 6,
  },

  /* FORM */
  form: {
    backgroundColor: "white",
    marginHorizontal: 20,
    padding: 25,
    borderRadius: 25,
    marginTop: -30,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    padding: 14,
    marginBottom: 15,
    fontSize: 15,
    color: "#333",
  },

  inputSelect: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    padding: 14,
    marginBottom: 15,
    justifyContent: "center",
  },

  button: {
    backgroundColor: "#00bfa5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },

  register: {
    textAlign: "center",
    marginTop: 15,
    color: "#666",
  },
  link: {
    color: "#00bfa5",
    fontWeight: "600",
  },

  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000044",
  },
  modalContent: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "white",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },
  modalOption: {
    paddingVertical: 14,
  },
  modalOptionText: {
    fontSize: 16,
  },
  modalCancel: {
    paddingVertical: 14,
    marginTop: 10,
    alignItems: "center",
  },
  modalCancelText: {
    color: "#00bfa5",
    fontSize: 16,
    fontWeight: "600",
  },
});

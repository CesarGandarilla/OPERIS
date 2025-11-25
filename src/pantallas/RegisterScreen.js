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
import { ROLES } from "../constants/catalogos";

const isValidEmail = (email) => {
  const trimmed = email.trim();
  const regex = /^\S+@\S+\.\S+$/;
  return regex.test(trimmed);
};

const isValidName = (name) => {
  const trimmed = name.trim();
  // Solo letras (incluye acentos) y espacios
  const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
  return regex.test(trimmed);
};

const isValidPassword = (password) => {
  // Mínimo 6 caracteres, 1 mayúscula, 1 número
  const regex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
  return regex.test(password);
};

export default function RegisterScreen({ navigation }) {
  const { register, loading } = useAuth() || {};

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    role: "",
    password: "",
    confirmPassword: "",
  });

  const [openModal, setOpenModal] = useState(false);
  const [modalOptions, setModalOptions] = useState([]);
  const [modalTitle, setModalTitle] = useState("");
  const [modalSetter, setModalSetter] = useState(() => {});

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const openSelect = (title, options, setter) => {
    setModalTitle(title);
    setModalOptions(options);
    setModalSetter(() => setter);
    setOpenModal(true);
  };

  const onRegister = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    const newErrors = {
      name: "",
      email: "",
      role: "",
      password: "",
      confirmPassword: "",
    };

    // Nombre
    if (!trimmedName) {
      newErrors.name = "El nombre es obligatorio.";
    } else if (!isValidName(trimmedName)) {
      newErrors.name = "El nombre solo debe contener letras y espacios.";
    }

    // Email
    if (!trimmedEmail) {
      newErrors.email = "El correo es obligatorio.";
    } else if (!isValidEmail(trimmedEmail)) {
      newErrors.email = "Ingresa un correo electrónico válido.";
    }

    // Rol
    if (!role) {
      newErrors.role = "Selecciona un rol.";
    }

    // Password
    if (!password) {
      newErrors.password = "La contraseña es obligatoria.";
    } else if (!isValidPassword(password)) {
      newErrors.password = "La contraseña no cumple con los requisitos.";
    }

    // Confirmar contraseña
    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirma tu contraseña.";
    } else if (password && password !== confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden.";
    }

    // Si hay algún error, no mandamos aún al backend
    if (
      newErrors.name ||
      newErrors.email ||
      newErrors.role ||
      newErrors.password ||
      newErrors.confirmPassword
    ) {
      setErrors(newErrors);
      return;
    }

    // Si todo bien, limpiamos errores y registramos
    setErrors({
      name: "",
      email: "",
      role: "",
      password: "",
      confirmPassword: "",
    });

    try {
      await register({
        name: trimmedName,
        email: trimmedEmail.toLowerCase(),
        password,
        role,
      });
    } catch (e) {
      Alert.alert("Error", e.message || "Ocurrió un error al crear la cuenta.");
    }
  };

  // ✅ Checklist dinámico de contraseña
  const hasMinLength = password.length >= 6;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const showPasswordFeedback = password.length > 0 || !!errors.password;

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
                setErrors((prev) => ({ ...prev, role: "" })); // limpiar error de rol
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
              <Text style={styles.headerSubtitle}>
                Regístrate para comenzar
              </Text>
            </LinearGradient>

            {/* FORM CARD */}
            <View style={styles.form}>
              {/* NOMBRE */}
              <TextInput
                placeholder="Nombre completo"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) {
                    setErrors((prev) => ({ ...prev, name: "" }));
                  }
                }}
                style={styles.input}
                placeholderTextColor="#999"
              />
              {errors.name ? (
                <Text style={styles.errorText}>{errors.name}</Text>
              ) : null}

              {/* EMAIL */}
              <TextInput
                placeholder="Correo electrónico"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: "" }));
                  }
                }}
                style={styles.input}
                placeholderTextColor="#999"
              />
              {errors.email ? (
                <Text style={styles.errorText}>{errors.email}</Text>
              ) : null}

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
              {errors.role ? (
                <Text style={styles.errorText}>{errors.role}</Text>
              ) : null}

              {/* CONTRASEÑA */}
              <View style={styles.passwordWrapper}>
                <TextInput
                  placeholder="Contraseña"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors((prev) => ({ ...prev, password: "" }));
                    }
                    if (errors.confirmPassword && confirmPassword) {
                      if (text === confirmPassword) {
                        setErrors((prev) => ({
                          ...prev,
                          confirmPassword: "",
                        }));
                      }
                    }
                  }}
                  style={[styles.input, styles.inputWithIcon]}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  style={styles.showPasswordButton}
                  onPress={() => setShowPassword((prev) => !prev)}
                >
                  <Text style={styles.showPasswordText}>
                    {showPassword ? "Ocultar" : "Ver"}
                  </Text>
                </TouchableOpacity>
              </View>

              {showPasswordFeedback && (
                <View style={styles.passwordRequirements}>
                  <Text style={styles.errorText}>
                    La contraseña debe cumplir con:
                  </Text>
                  <Text
                    style={[
                      styles.requirementText,
                      hasMinLength
                        ? styles.requirementOk
                        : styles.requirementError,
                    ]}
                  >
                    {hasMinLength ? "✔" : "•"} Mínimo 6 caracteres
                  </Text>
                  <Text
                    style={[
                      styles.requirementText,
                      hasUppercase
                        ? styles.requirementOk
                        : styles.requirementError,
                    ]}
                  >
                    {hasUppercase ? "✔" : "•"} Al menos 1 mayúscula
                  </Text>
                  <Text
                    style={[
                      styles.requirementText,
                      hasNumber
                        ? styles.requirementOk
                        : styles.requirementError,
                    ]}
                  >
                    {hasNumber ? "✔" : "•"} Al menos 1 número
                  </Text>
                  {errors.password ? (
                    <Text style={styles.errorText}>{errors.password}</Text>
                  ) : null}
                </View>
              )}

              {/* CONFIRMAR CONTRASEÑA */}
              <View style={styles.passwordWrapper}>
                <TextInput
                  placeholder="Confirmar contraseña"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) {
                      setErrors((prev) => ({
                        ...prev,
                        confirmPassword: "",
                      }));
                    }
                  }}
                  style={[styles.input, styles.inputWithIcon]}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  style={styles.showPasswordButton}
                  onPress={() =>
                    setShowConfirmPassword((prev) => !prev)
                  }
                >
                  <Text style={styles.showPasswordText}>
                    {showConfirmPassword ? "Ocultar" : "Ver"}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              ) : null}

              {/* BOTÓN REGISTRAR */}
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
    marginBottom: 8,
    fontSize: 15,
    color: "#333",
  },

  inputSelect: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    justifyContent: "center",
  },

  errorText: {
    color: "#e53935",
    fontSize: 12,
    marginBottom: 4,
  },

  passwordWrapper: {
    position: "relative",
    marginBottom: 4,
  },

  inputWithIcon: {
    paddingRight: 60, // espacio para el botón "Ver/Ocultar"
  },

  showPasswordButton: {
    position: "absolute",
    right: 15,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },

  showPasswordText: {
    color: "#00bfa5",
    fontSize: 12,
    fontWeight: "600",
  },

  passwordRequirements: {
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 12,
    marginBottom: 2,
  },
  requirementOk: {
    color: "#4CAF50",
  },
  requirementError: {
    color: "#e53935",
  },

  button: {
    backgroundColor: "#00bfa5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 5,
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

//AjustesScreen
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../auth/AuthContext";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getDatabase, ref as dbRef, update } from "firebase/database";

export default function AjustesScreen() {
  const { user, logout } = useAuth() || {};
  const p = user?.profile;

  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Necesitamos acceso a tu galería para seleccionar una foto.");
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        return result.assets[0].uri;
      }
    } catch (err) {
      console.log("Error al seleccionar imagen:", err);
      Alert.alert("Error", "No se pudo abrir la galería.");
    }
    return null;
  };

  const uploadImageAndSave = async () => {
    try {
      if (!user?.uid) {
        Alert.alert("Error", "No se encontró UID del usuario. Inicia sesión de nuevo.");
        return;
      }

      const uri = await pickImage();
      if (!uri) return;

      setUploading(true);

      const fileUri = Platform.OS === "ios" && !uri.startsWith("file://") ? "file://" + uri : uri;

      const storage = getStorage();
      const storageReference = ref(storage, `profilePictures/${user.uid}.jpg`);
      const response = await fetch(fileUri);
      const blob = await response.blob();

      await uploadBytes(storageReference, blob);
      const downloadURL = await getDownloadURL(storageReference);

      const db = getDatabase();
      await update(dbRef(db, `users/${user.uid}`), {
        profilePhoto: downloadURL,
      });

      Alert.alert("¡Listo!", "Foto de perfil actualizada correctamente 🎉");
    } catch (err) {
      console.log("Error subiendo foto:", err);
      Alert.alert("Error", "Hubo un error subiendo la foto.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.container}>
        <LinearGradient
          colors={["#00c6a7", "#02a4b3"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Ajustes</Text>

          <View style={styles.photoContainer}>
            {p?.profilePhoto ? (
              <Image source={{ uri: p.profilePhoto }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImage, styles.noImage]}>
                <Text style={{ color: "#fff", fontSize: 16 }}>Sin foto</Text>
              </View>
            )}

            <TouchableOpacity style={styles.cameraButton} onPress={uploadImageAndSave}>
              {uploading ? (
                <ActivityIndicator color="#fff" size={20} />
              ) : (
                <Text style={{ color: "#fff", fontSize: 20 }}>📷</Text>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {p ? (
          <View style={styles.profileCard}>
            <Text style={styles.label}>Nombre completo</Text>
            <Text style={styles.value}>{p.name}</Text>

            <Text style={styles.label}>Correo</Text>
            <Text style={styles.value}>{p.email}</Text>

            <Text style={styles.label}>Rol</Text>
            <Text style={styles.value}>{p.role}</Text>

            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.profileCard}>
            <Text style={styles.noProfileText}>No hay perfil cargado.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f9fc",
  },
  header: {
    height: 280,
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: 40,
  },
  headerTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 5,
  },

  photoContainer: {
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "white",
  },
  noImage: {
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },

  cameraButton: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: "#00bfa5",
    padding: 10,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "white",
    elevation: 5,
  },

  profileCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: -30,
    padding: 25,
    borderRadius: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  label: {
    fontSize: 14,
    color: "#888",
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  logoutButton: {
    marginTop: 25,
    backgroundColor: "#00bfa5",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  noProfileText: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
  },
});

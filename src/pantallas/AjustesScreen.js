// AjustesScreen (sin foto de perfil)
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../auth/AuthContext";

export default function AjustesScreen() {
  const { user, logout } = useAuth() || {};
  const p = user?.profile;

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
    height: 180,
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

  profileCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: -20,
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

// src/pantallas/PanelDeControlScreen.js
import React, { useState, useEffect } from "react";
import { ScrollView, StyleSheet, View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { tema } from "../tema";

import StatCard from "../componentes/StatCard";
import QuickAction from "../componentes/QuickAction";

import { AntDesign } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../auth/AuthContext";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/inventarios";
import { listenSolicitudes } from "../firebase/firebaseApi";

export default function PanelDeControlScreen({ navigation }) {
  const { user } = useAuth();

  // Nombre bonito
  const nombreUsuario =
    user?.profile?.displayName ||
    user?.profile?.name ||
    user?.profile?.fullName ||
    (user?.profile?.email
      ? user.profile.email.split("@")[0]
      : "Usuario");

  const [insumosCriticos, setInsumosCriticos] = useState(0);
  const [insumosBajos, setInsumosBajos] = useState(0);
  const [insumosAgotados, setInsumosAgotados] = useState(0);
  const [solicitudesHoy, setSolicitudesHoy] = useState(0);

  // ---- INSUMOS ----
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "insumos"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      let crit = 0, bajo = 0, agot = 0;

      data.forEach((item) => {
        const stock = item.stock ?? 0;
        const critico = item.stockCritico ?? 0;
        const bajoLim = critico * 2;

        if (stock <= 0) {
          agot++;
        } else if (stock > 0 && stock <= critico) {
          crit++;
        } else if (stock > critico && stock <= bajoLim) {
          bajo++;
        }
      });

      setInsumosCriticos(crit);
      setInsumosBajos(bajo);
      setInsumosAgotados(agot);
    });

    return unsub;
  }, []);

  // ---- SOLICITUDES HOY ----
  useEffect(() => {
    const unsubSolicitudes = listenSolicitudes((lista) => {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const mañana = new Date(hoy);
      mañana.setDate(mañana.getDate() + 1);

      const count = lista.filter((s) => {
        const raw = s.fechaNecesaria ?? s.creadoEn;
        if (!raw) return false;

        let fecha = raw;
        if (raw?.toDate) fecha = raw.toDate();
        if (raw?._seconds) fecha = new Date(raw._seconds * 1000);

        return fecha >= hoy && fecha < mañana;
      }).length;

      setSolicitudesHoy(count);
    });

    return () => typeof unsubSolicitudes === "function" && unsubSolicitudes();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {/* HEADER ESTILO AJUSTES */}
      <LinearGradient
        colors={["#00c6a7", "#02a4b3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerSaludo}>Hola, {nombreUsuario}</Text>
        <Text style={styles.headerTitulo}>Panel de Control</Text>
      </LinearGradient>

      {/* CARD BLANCA FLOTANTE */}
      <View style={styles.card}>
        <View style={styles.grid}>
          {/* STOCK CRÍTICO */}
          <StatCard
            icon={<Feather name="alert-octagon" size={24} color="#EF4444" />}
            iconBackgroundColor="#FEF2F2"
            titulo="Stock Crítico"
            valor={insumosCriticos.toString()}
            subtitulo="ítems críticos"
            onPress={() =>
              navigation.navigate("Inventario", { estadoInicial: "Crítico" })
            }
          />

          {/* STOCK BAJO */}
          <StatCard
            icon={<Feather name="alert-triangle" size={24} color="#F59E0B" />}
            iconBackgroundColor="#FFFBEB"
            titulo="Stock Bajo"
            valor={insumosBajos.toString()}
            subtitulo="ítems en riesgo"
            onPress={() =>
              navigation.navigate("Inventario", { estadoInicial: "Bajo" })
            }
          />

          {/* STOCK AGOTADO */}
          <StatCard
            icon={<Feather name="x-circle" size={24} color="#6B7280" />}
            iconBackgroundColor="#F3F4F6"
            titulo="Stock Agotado"
            valor={insumosAgotados.toString()}
            subtitulo="sin existencias"
            onPress={() =>
              navigation.navigate("Inventario", { estadoInicial: "Agotado" })
            }
          />

          {/* SOLICITUDES HOY */}
          <StatCard
            icon={<AntDesign name="shopping-cart" size={24} color="#60A5FA" />}
            iconBackgroundColor="#E7F7F6"
            titulo="Solicitudes Hoy"
            valor={solicitudesHoy.toString()}
            subtitulo="programadas para hoy"
            onPress={() => navigation.navigate("Solicitudes")}
          />
        </View>

        <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
        <QuickAction
          icono={
            <Ionicons
              name="add-circle-outline"
              size={24}
              color="#00BFA5"
            />
          }
          titulo="Solicitudes de Insumos"
          onPress={() => navigation.navigate("Solicitudes")}
        />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: "#f7f9fc",
  },

  /* HEADER DEGRADADO */
  header: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingTop: 40,
  },
  headerSaludo: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
  },
  headerTitulo: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 5,
  },

  /* CARD BLANCA */
  card: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: -40,
    padding: 20,
    borderRadius: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
});

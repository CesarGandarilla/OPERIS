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

// helper para convertir Firestore Timestamp / number a Date
const getJSDate = (raw) => {
  if (!raw) return null;
  if (raw.toDate) return raw.toDate();
  if (raw._seconds) return new Date(raw._seconds * 1000);
  if (typeof raw === "number") return new Date(raw);
  if (raw instanceof Date) return raw;
  return null;
};

export default function PanelDeControlScreen({ navigation }) {
  const { user } = useAuth();

  const rol = user?.profile?.role?.toLowerCase();
  const emailUsuario = user?.profile?.email;

  // Nombre bonito
  const nombreUsuario =
    user?.profile?.displayName ||
    user?.profile?.name ||
    user?.profile?.fullName ||
    (emailUsuario ? emailUsuario.split("@")[0] : "Usuario");

  // ---- INSUMOS (para CEyE) ----
  const [insumosCriticos, setInsumosCriticos] = useState(0);
  const [insumosBajos, setInsumosBajos] = useState(0);
  const [insumosAgotados, setInsumosAgotados] = useState(0);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "insumos"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      let crit = 0,
        bajo = 0,
        agot = 0;

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

  // ---- SOLICITUDES (para métricas de CEyE y Enfermería) ----
  const [solicitudes, setSolicitudes] = useState([]);

  useEffect(() => {
    const unsubSolicitudes = listenSolicitudes((lista) => {
      setSolicitudes(lista);
    });
    return () =>
      typeof unsubSolicitudes === "function" && unsubSolicitudes();
  }, []);

  // Fechas base
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const mañana = new Date(hoy);
  mañana.setDate(mañana.getDate() + 1);

  const haceSieteDias = new Date(hoy);
  haceSieteDias.setDate(hoy.getDate() - 7);

  // ---- MÉTRICAS CEyE (visión global) ----
  const solicitudesActivasGlobal = solicitudes.filter((s) =>
    ["Pendiente", "Aceptada", "Lista"].includes(s.estado)
  );

  const solicitudesParaHoyGlobal = solicitudesActivasGlobal.filter((s) => {
    const fecha = getJSDate(s.fechaNecesaria || s.creadoEn);
    if (!fecha) return false;
    return fecha >= hoy && fecha < mañana;
  }).length;

  const solicitudesPendientesGlobal = solicitudes.filter((s) =>
    ["Pendiente", "Aceptada"].includes(s.estado)
  ).length;

  const solicitudesProblemaGlobal = solicitudes.filter(
    (s) => s.estado === "Problema"
  ).length;

  // ---- MÉTRICAS ENFERMERÍA (visión "mis solicitudes") ----
  const solicitudesUsuario = solicitudes.filter(
    (s) => s.usuario === emailUsuario
  );

  const solicitudesActivasUsuario = solicitudesUsuario.filter((s) =>
    ["Pendiente", "Aceptada", "Lista"].includes(s.estado)
  );

  const solicitudesHoyUsuario = solicitudesActivasUsuario.filter((s) => {
    const fecha = getJSDate(s.fechaNecesaria || s.creadoEn);
    if (!fecha) return false;
    return fecha >= hoy && fecha < mañana;
  }).length;

  const solicitudesProblemaUsuario = solicitudesUsuario.filter(
    (s) => s.estado === "Problema"
  ).length;

  const solicitudesCompletadasSemanaUsuario = solicitudesUsuario.filter(
    (s) => {
      if (s.estado !== "Verificada") return false;
      const fecha = getJSDate(s.creadoEn);
      if (!fecha) return false;
      return fecha >= haceSieteDias && fecha < mañana;
    }
  ).length;

  // ---- RENDER SEGÚN ROL ----
  const esCeye = rol === "ceye";

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
        {esCeye ? (
          <>
            {/* --- PANEL CEyE --- */}
            <Text style={styles.sectionTitle}>Resumen de CEyE</Text>

            <View style={styles.grid}>
              {/* STOCK CRÍTICO */}
              <StatCard
                icon={
                  <Feather name="alert-octagon" size={24} color="#EF4444" />
                }
                iconBackgroundColor="#FEF2F2"
                titulo="Stock crítico"
                valor={insumosCriticos.toString()}
                subtitulo="ítems críticos"
                onPress={() =>
                  navigation.navigate("Inventario", {
                    estadoInicial: "Crítico",
                  })
                }
              />

              {/* STOCK BAJO */}
              <StatCard
                icon={
                  <Feather name="alert-triangle" size={24} color="#F59E0B" />
                }
                iconBackgroundColor="#FFFBEB"
                titulo="Stock bajo"
                valor={insumosBajos.toString()}
                subtitulo="ítems en riesgo"
                onPress={() =>
                  navigation.navigate("Inventario", {
                    estadoInicial: "Bajo",
                  })
                }
              />

              {/* STOCK AGOTADO */}
              <StatCard
                icon={<Feather name="x-circle" size={24} color="#6B7280" />}
                iconBackgroundColor="#F3F4F6"
                titulo="Stock agotado"
                valor={insumosAgotados.toString()}
                subtitulo="sin existencias"
                onPress={() =>
                  navigation.navigate("Inventario", {
                    estadoInicial: "Agotado",
                  })
                }
              />

              {/* SOLICITUDES PARA HOY (GLOBAL) */}
              <StatCard
                icon={
                  <AntDesign
                    name="shopping-cart"
                    size={24}
                    color="#60A5FA"
                  />
                }
                iconBackgroundColor="#E7F7F6"
                titulo="Solicitudes hoy"
                valor={solicitudesParaHoyGlobal.toString()}
                subtitulo="por preparar hoy"
                onPress={() => navigation.navigate("Solicitudes")}
              />
            </View>

            <Text style={styles.sectionTitle}>Accesos rápidos</Text>

            <QuickAction
              icono={
                <Ionicons
                  name="list-circle-outline"
                  size={24}
                  color="#00BFA5"
                />
              }
              titulo="Ver solicitudes"
              onPress={() => navigation.navigate("Solicitudes")}
            />

            <QuickAction
              icono={
                <Ionicons
                  name="swap-horizontal-outline"
                  size={24}
                  color="#3B82F6"
                />
              }
              titulo="Movimientos"
              onPress={() => navigation.navigate("Movimientos")}
            />

            {/* 👇 CAMBIO: antes "Inventario crítico", ahora va a Reportes */}
            <QuickAction
              icono={
                <Ionicons
                  name="document-text-outline"
                  size={24}
                  color="#F59E0B"
                />
              }
              titulo="Reportes"
              onPress={() => navigation.navigate("Reportes")}
            />
          </>
        ) : (
          <>
            {/* --- PANEL ENFERMERÍA / OTROS ROLES --- */}
            <Text style={styles.sectionTitle}>Mis solicitudes</Text>

            <View style={styles.grid}>
              {/* SOLICITUDES ACTIVAS */}
              <StatCard
                icon={
                  <AntDesign
                    name="clockcircleo"
                    size={24}
                    color="#6366F1"
                  />
                }
                iconBackgroundColor="#EEF2FF"
                titulo="Activas"
                valor={solicitudesActivasUsuario.length.toString()}
                subtitulo="pendientes de surtir"
                onPress={() => navigation.navigate("Solicitudes")}
              />

              {/* PARA HOY */}
              <StatCard
                icon={
                  <AntDesign
                    name="calendar"
                    size={24}
                    color="#10B981"
                  />
                }
                iconBackgroundColor="#ECFDF3"
                titulo="Para hoy"
                valor={solicitudesHoyUsuario.toString()}
                subtitulo="necesarias hoy"
                onPress={() => navigation.navigate("Solicitudes")}
              />

              {/* PROBLEMAS */}
              <StatCard
                icon={
                  <Feather name="alert-triangle" size={24} color="#F97316" />
                }
                iconBackgroundColor="#FFF7ED"
                titulo="Con problema"
                valor={solicitudesProblemaUsuario.toString()}
                subtitulo="requieren revisión"
                onPress={() => navigation.navigate("Movimientos")}
              />

              {/* COMPLETADAS 7 DÍAS */}
              <StatCard
                icon={
                  <AntDesign
                    name="checkcircleo"
                    size={24}
                    color="#22C55E"
                  />
                }
                iconBackgroundColor="#DCFCE7"
                titulo="Completadas"
                valor={solicitudesCompletadasSemanaUsuario.toString()}
                subtitulo="últimos 7 días"
                onPress={() => navigation.navigate("Movimientos")}
              />
            </View>

            <Text style={styles.sectionTitle}>Accesos rápidos</Text>

            <QuickAction
              icono={
                <Ionicons
                  name="add-circle-outline"
                  size={24}
                  color="#00BFA5"
                />
              }
              titulo="Hacer solicitud de insumos"
              onPress={() => navigation.navigate("Solicitudes")}
            />

            <QuickAction
              icono={
                <Ionicons
                  name="swap-horizontal-outline"
                  size={24}
                  color="#3B82F6"
                />
              }
              titulo="Mis movimientos"
              onPress={() => navigation.navigate("Movimientos")}
            />
          </>
        )}
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
    marginTop: 4,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
});

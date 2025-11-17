// src/pantallas/PanelDeControlScreen.js
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View, Text } from "react-native";
import { tema } from "../tema";
import HeaderTop from "../componentes/HeaderTop";
import StatCard from "../componentes/StatCard";
import QuickAction from "../componentes/QuickAction";
import { AntDesign } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../auth/AuthContext";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/inventarios";
import { listenSolicitudes } from "../firebase/firebaseApi";

const PanelDeControlScreen = ({ navigation }) => {
  const { user } = useAuth();

  const [insumosCriticos, setInsumosCriticos] = useState(0);
  const [insumosBajos, setInsumosBajos] = useState(0);
  const [insumosAgotados, setInsumosAgotados] = useState(0);
  const [solicitudesHoy, setSolicitudesHoy] = useState(0);

  // ---- INSUMOS (stock crítico / bajo / agotado) ----
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "insumos"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      let countCriticos = 0;
      let countBajos = 0;
      let countAgotados = 0;

      data.forEach((item) => {
        const stock = item.stock ?? 0;
        const stockCritico = item.stockCritico ?? 0;

        // Agotado: stock <= 0
        if (stock <= 0) {
          countAgotados += 1;
          return; // ya no lo contamos como bajo/critico
        }

        if (stockCritico <= 0) return; // si no definieron crítico, lo saltamos

        const stockBajo = stockCritico * 2;

        // 0 < stock <= stockCritico → Crítico
        if (stock > 0 && stock <= stockCritico) {
          countCriticos += 1;
        }
        // stockCritico < stock <= stockBajo → Bajo
        else if (stock > stockCritico && stock <= stockBajo) {
          countBajos += 1;
        }
      });

      setInsumosCriticos(countCriticos);
      setInsumosBajos(countBajos);
      setInsumosAgotados(countAgotados);
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

      const contarHoy = (valorFecha) => {
        if (!valorFecha) return false;

        let fecha = valorFecha;

        if (typeof valorFecha?.toDate === "function") {
          fecha = valorFecha.toDate();
        } else if (typeof valorFecha === "number") {
          fecha = new Date(valorFecha);
        } else if (typeof valorFecha === "string") {
          fecha = new Date(valorFecha);
        } else if (typeof valorFecha === "object" && valorFecha.seconds) {
          fecha = new Date(valorFecha.seconds * 1000);
        } else if (typeof valorFecha === "object" && valorFecha._seconds) {
          fecha = new Date(valorFecha._seconds * 1000);
        } else if (!(valorFecha instanceof Date)) {
          return false;
        }

        if (isNaN(fecha.getTime())) return false;
        return fecha >= hoy && fecha < mañana;
      };

      const count = lista.filter((s) => {
        // prioridad: fechaNecesaria, si no, creadoEn
        const base = s.fechaNecesaria ?? s.creadoEn;
        return contarHoy(base);
      }).length;

      setSolicitudesHoy(count);
    });

    return () => {
      if (typeof unsubSolicitudes === "function") unsubSolicitudes();
    };
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <HeaderTop saludo="Hola, CEyE" titulo="Panel de Control" />

      <View style={styles.gridWrapper}>
        <View style={styles.grid}>
          {/* ---- STOCK CRÍTICO ----- */}
          <StatCard
            icon={<Feather name="alert-octagon" size={24} color="#EF4444" />}
            iconBackgroundColor="#FEF2F2"
            titulo="Stock Crítico"
            valor={insumosCriticos.toString()}
            subtitulo="ítems críticos"
            onPress={() =>
              navigation.navigate("Inventario", {
                estadoInicial: "Crítico",
              })
            }
          />

          {/* ---- STOCK BAJO ----- */}
          <StatCard
            icon={<Feather name="alert-triangle" size={24} color="#F59E0B" />}
            iconBackgroundColor="#FFFBEB"
            titulo="Stock Bajo"
            valor={insumosBajos.toString()}
            subtitulo="ítems en riesgo"
            onPress={() =>
              navigation.navigate("Inventario", {
                estadoInicial: "Bajo",
              })
            }
          />

          {/* ---- STOCK AGOTADO ----- */}
          <StatCard
            icon={<Feather name="x-circle" size={24} color="#6B7280" />}
            iconBackgroundColor="#F3F4F6"
            titulo="Stock Agotado"
            valor={insumosAgotados.toString()}
            subtitulo="sin existencias"
            onPress={() =>
              navigation.navigate("Inventario", {
                estadoInicial: "Agotado",
              })
            }
          />

          {/* ---- SOLICITUDES HOY ----- */}
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
              color={tema.colores.primario || "#00BFA5"}
            />
          }
          titulo="Nueva solicitud"
          onPress={() => navigation.navigate("Solicitudes")}
        />
      </View>

      <View style={{ height: tema.espacio(12) }} />
    </SafeAreaView>
  );
};

export default PanelDeControlScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tema.colores.bg,
    paddingTop: 12,
    paddingBottom: 12,
  },
  gridWrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
    color: tema.colores.ink,
    fontSize: 16,
    fontWeight: "700",
  },
});

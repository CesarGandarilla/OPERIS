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

const PanelDeControlScreen = ({ navigation }) => {
  const { user } = useAuth();

  const [insumosCriticos, setInsumosCriticos] = useState(0);
  const [insumosBajos, setInsumosBajos] = useState(0);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "insumos"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      let countCriticos = 0;
      let countBajos = 0;

      data.forEach((item) => {
        const stock = item.stock ?? 0;
        const stockCritico = item.stockCritico ?? 0;

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
    });

    return unsub;
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
            subtitulo="items críticos"
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
            subtitulo="items en riesgo"
            onPress={() =>
              navigation.navigate("Inventario", {
                estadoInicial: "Bajo",
              })
            }
          />

          <StatCard
            icon={<AntDesign name="shopping-cart" size={24} color="#60A5FA" />}
            iconBackgroundColor="#E7F7F6"
            titulo="Solicitudes Hoy"
            valor={"x"}
            subtitulo="recibidas"
          />

          <StatCard
            icon={<AntDesign name="history" size={24} color="#60A5FA" />}
            iconBackgroundColor="#EAF2FF"
            titulo="Movimientos Hoy"
            valor={"x"}
            subtitulo="registrados"
          />
        </View>

        <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
        <QuickAction
          icono={
            <Ionicons
              name="document-text-outline"
              size={24}
              color="grey"
            />
          }
          titulo="Luego vemos que va aquí"
          onPress={() => {}}
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

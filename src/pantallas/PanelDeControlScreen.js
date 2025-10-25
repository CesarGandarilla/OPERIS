// src/pantallas/PanelDeControlScreen.js
import React from "react";
import { SafeAreaView, StyleSheet, View, Text } from "react-native";
import { tema } from "../tema";
import HeaderTop from "../componentes/HeaderTop";
import StatCard from "../componentes/StatCard";
import QuickAction from "../componentes/QuickAction";
import { AntDesign } from "@expo/vector-icons";
import { Feather } from '@expo/vector-icons';
import {Ionicons} from '@expo/vector-icons';


const PanelDeControlScreen = () => {
  return (
    <SafeAreaView style={styles.screen}>
      <HeaderTop saludo="Hola, CEyE" titulo="Panel de Control" />

      <View style={styles.gridWrapper}>
        <View style={styles.grid}>
          <StatCard
            icon={<Feather name="alert-circle" size={24} color="#F59E0B" />}
            iconBackgroundColor="#FFFBEB"
            titulo="Stock Bajo"
            valor={"x"}
            subtitulo="items críticos"
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

          <StatCard
            icon={<AntDesign name="bar-chart" size={20} color="#A78BFA" />}
            iconBackgroundColor="#F4EAFE"
            titulo="Consumo Mensual"
            valor="x"
            subtitulo="unidades"
          />
        </View>

        <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
        <QuickAction
          icono={<Ionicons name="document-text-outline" size={24} color="grey" />}
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

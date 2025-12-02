// src/pantallas/PanelDeControlScreen.js

// importamos react y los hooks usestate y useeffect para manejar estado y efectos secundarios
import React, { useState, useEffect } from "react";
// importamos componentes básicos de interfaz de react native
import { ScrollView, StyleSheet, View, Text } from "react-native";
// importamos el componente de degradado para el encabezado
import { LinearGradient } from "expo-linear-gradient";
// importamos el tema de colores y fuentes de la app
import { tema } from "../tema";

// importamos tarjetas de estadísticas y botones de acción rápida personalizados
import StatCard from "../componentes/StatCard";
import QuickAction from "../componentes/QuickAction";

// importamos iconos que usaremos en las tarjetas y accesos rápidos
import { AntDesign } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";

// importamos el contexto de autenticación para obtener los datos del usuario logueado
import { useAuth } from "../auth/AuthContext";
// importamos funciones de firestore para escuchar cambios en tiempo real
import { collection, onSnapshot } from "firebase/firestore";
// importamos la referencia a la base de datos de inventarios
import { db } from "../firebase/inventarios";
// importamos la función que escucha las solicitudes desde firebase
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

// componente principal del panel de control
export default function PanelDeControlScreen({ navigation }) {
  // obtenemos el usuario actual desde el contexto de autenticación
  const { user } = useAuth();

  // sacamos el rol del usuario en minúsculas para comparar más fácil
  const rol = user?.profile?.role?.toLowerCase();
  // guardamos el correo del usuario para filtrar sus solicitudes
  const emailUsuario = user?.profile?.email;

  // preparamos un "nombre bonito" para mostrar en el saludo del header
  const nombreUsuario =
    user?.profile?.displayName ||
    user?.profile?.name ||
    user?.profile?.fullName ||
    (emailUsuario ? emailUsuario.split("@")[0] : "Usuario");

  // ---- INSUMOS (para CEyE) ----
  // estados para contar cuántos insumos están en cada nivel de alerta
  const [insumosCriticos, setInsumosCriticos] = useState(0);
  const [insumosBajos, setInsumosBajos] = useState(0);
  const [insumosAgotados, setInsumosAgotados] = useState(0);

  // useeffect que escucha cambios en la colección "insumos" en firestore
  useEffect(() => {
    // nos suscribimos a la colección de insumos
    const unsub = onSnapshot(collection(db, "insumos"), (snapshot) => {
      // convertimos los documentos del snapshot a un arreglo de objetos
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // contadores para cada categoría de stock
      let crit = 0,
        bajo = 0,
        agot = 0;

      // recorremos cada insumo para clasificarlo según su stock
      data.forEach((item) => {
        const stock = item.stock ?? 0;
        const critico = item.stockCritico ?? 0;
        const bajoLim = critico * 2;

        // si no hay stock, lo contamos como agotado
        if (stock <= 0) {
          agot++;
        // si hay stock pero está por debajo o igual al crítico, lo marcamos como crítico
        } else if (stock > 0 && stock <= critico) {
          crit++;
        // si está entre el crítico y el límite bajo, lo marcamos como stock bajo
        } else if (stock > critico && stock <= bajoLim) {
          bajo++;
        }
      });

      // actualizamos los estados con los valores calculados
      setInsumosCriticos(crit);
      setInsumosBajos(bajo);
      setInsumosAgotados(agot);
    });

    // devolvemos la función de desuscripción para limpiar el listener cuando se desmonte el componente
    return unsub;
  }, []);

  // ---- SOLICITUDES (para métricas de CEyE y Enfermería) ----
  // aquí guardamos todas las solicitudes que vienen de firebase
  const [solicitudes, setSolicitudes] = useState([]);

  // useeffect que escucha las solicitudes en tiempo real usando nuestra función helper
  useEffect(() => {
    const unsubSolicitudes = listenSolicitudes((lista) => {
      // cada vez que cambian las solicitudes, actualizamos el estado
      setSolicitudes(lista);
    });
    // limpiamos el listener cuando se desmonta el componente
    return () =>
      typeof unsubSolicitudes === "function" && unsubSolicitudes();
  }, []);

  // Fechas base
  // creamos la fecha de hoy a las 00:00 para comparar por día
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  // calculamos la fecha de mañana (también a las 00:00) para usar como tope superior
  const mañana = new Date(hoy);
  mañana.setDate(mañana.getDate() + 1);

  // calculamos la fecha de hace siete días para métricas de la última semana
  const haceSieteDias = new Date(hoy);
  haceSieteDias.setDate(hoy.getDate() - 7);

  // ---- MÉTRICAS CEyE (visión global) ----
  // filtramos las solicitudes que siguen activas para la vista global de ceye
  const solicitudesActivasGlobal = solicitudes.filter((s) =>
    ["Pendiente", "Aceptada", "Lista"].includes(s.estado)
  );

  // contamos cuántas solicitudes activas son para hoy (entre hoy y mañana)
  const solicitudesParaHoyGlobal = solicitudesActivasGlobal.filter((s) => {
    const fecha = getJSDate(s.fechaNecesaria || s.creadoEn);
    if (!fecha) return false;
    return fecha >= hoy && fecha < mañana;
  }).length;

  // contamos cuántas solicitudes globales siguen en estado pendiente o aceptada
  const solicitudesPendientesGlobal = solicitudes.filter((s) =>
    ["Pendiente", "Aceptada"].includes(s.estado)
  ).length;

  // contamos cuántas solicitudes globales están marcadas con problema
  const solicitudesProblemaGlobal = solicitudes.filter(
    (s) => s.estado === "Problema"
  ).length;

  // ---- MÉTRICAS ENFERMERÍA (visión "mis solicitudes") ----
  // filtramos solo las solicitudes que pertenecen al usuario logueado
  const solicitudesUsuario = solicitudes.filter(
    (s) => s.usuario === emailUsuario
  );

  // nuevo: solicitudes pendientes por ceye (estado pendiente) para este usuario
  const solicitudesPendientesCeyeUsuario = solicitudesUsuario.filter(
    (s) => s.estado === "Pendiente"
  ).length;

  // nuevo: solicitudes aceptadas o listas que todavía no se verifican por enfermería
  const solicitudesPorVerificarUsuario = solicitudesUsuario.filter((s) =>
    ["Aceptada", "Lista"].includes(s.estado)
  ).length;

  // solicitudes del usuario que tienen estado problema
  const solicitudesProblemaUsuario = solicitudesUsuario.filter(
    (s) => s.estado === "Problema"
  ).length;

  // solicitudes verificadas del usuario en los últimos siete días
  const solicitudesCompletadasSemanaUsuario = solicitudesUsuario.filter(
    (s) => {
      if (s.estado !== "Verificada") return false;
      const fecha = getJSDate(s.creadoEn);
      if (!fecha) return false;
      return fecha >= haceSieteDias && fecha < mañana;
    }
  ).length;

  // ---- RENDER SEGÚN ROL ----
  // verificamos si el rol del usuario es ceye para decidir qué panel mostrar
  const esCeye = rol === "ceye";

  return (
    // usamos un scrollview por si el contenido no cabe en la pantalla
    <ScrollView contentContainerStyle={styles.scroll}>
      {/* header con degradado que muestra el saludo y el título del panel */}
      <LinearGradient
        colors={["#00c6a7", "#02a4b3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* saludo personalizado con el nombre del usuario */}
        <Text style={styles.headerSaludo}>Hola, {nombreUsuario}</Text>
        {/* título principal del panel de control */}
        <Text style={styles.headerTitulo}>Panel de Control</Text>
      </LinearGradient>

      {/* tarjeta blanca flotante donde van las métricas y accesos rápidos */}
      <View style={styles.card}>
        {esCeye ? (
          <>
            {/* panel de métricas y accesos rápidos específico para ceye */}
            <Text style={styles.sectionTitle}>Resumen de CEyE</Text>

            {/* grid de tarjetas de estadísticas para ceye */}
            <View style={styles.grid}>
              {/* tarjeta de insumos en stock crítico */}
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

              {/* tarjeta de insumos con stock bajo */}
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

              {/* tarjeta de insumos agotados */}
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

              {/* tarjeta que muestra cuántas solicitudes globales siguen pendientes por atender */}
              <StatCard
                icon={
                  <AntDesign
                    name="shopping-cart"
                    size={24}
                    color="#60A5FA"
                  />
                }
                iconBackgroundColor="#E7F7F6"
                titulo="Solicitudes pendientes"
                valor={solicitudesPendientesGlobal.toString()}
                subtitulo="por atender"
                onPress={() => navigation.navigate("Solicitudes")}
              />
            </View>

            {/* sección de accesos rápidos para el personal de ceye */}
            <Text style={styles.sectionTitle}>Accesos rápidos</Text>

            {/* acceso rápido para ver todas las solicitudes */}
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

            {/* acceso rápido a la pantalla de movimientos */}
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

            {/* acceso rápido a la sección de reportes */}
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
            {/* panel de métricas para enfermería u otros roles que no son ceye */}
            <Text style={styles.sectionTitle}>Mis solicitudes</Text>

            {/* grid de tarjetas de estadísticas específicas del usuario */}
            <View style={styles.grid}>
              {/* tarjeta de solicitudes del usuario que aún están pendientes por ceye */}
              <StatCard
                icon={
                  <AntDesign
                    name="question-circle"
                    size={24}
                    color="#F59E0B"
                  />
                }
                iconBackgroundColor="#FFFBEB"
                titulo="Pendientes por CEyE"
                valor={solicitudesPendientesCeyeUsuario.toString()}
                subtitulo="aún sin aceptar"
                onPress={() => navigation.navigate("Solicitudes")}
              />

              {/* tarjeta de solicitudes activas del usuario (aceptadas o listas, pendientes de verificar) */}
              <StatCard
                icon={
                  <AntDesign
                    name="clock-circle"
                    size={24}
                    color="#6366F1"
                  />
                }
                iconBackgroundColor="#EEF2FF"
                titulo="Activas"
                valor={solicitudesPorVerificarUsuario.toString()}
                subtitulo="pendientes de verificar"
                onPress={() =>
                  navigation.navigate("Solicitudes", {
                    filtroInicial: "Activas",
                  })
                }
              />

              {/* tarjeta de solicitudes del usuario que tienen algún problema reportado */}
              <StatCard
                icon={
                  <Feather name="alert-triangle" size={24} color="#F97316" />
                }
                iconBackgroundColor="#FFF7ED"
                titulo="Con problema"
                valor={solicitudesProblemaUsuario.toString()}
                subtitulo="requieren revisión"
                onPress={() =>
                  navigation.navigate("Movimientos", {
                    estadoInicial: "Problema",
                  })
                }
              />

              {/* tarjeta de solicitudes completadas (verificadas) en la última semana */}
              <StatCard
                icon={
                  <AntDesign
                    name="check-circle"
                    size={24}
                    color="#22C55E"
                  />
                }
                iconBackgroundColor="#DCFCE7"
                titulo="Completadas"
                valor={solicitudesCompletadasSemanaUsuario.toString()}
                subtitulo="últimos 7 días"
                onPress={() =>
                  navigation.navigate("Movimientos", {
                    estadoInicial: "Verificada",
                  })
                }
              />
            </View>

            {/* accesos rápidos para que enfermería pueda trabajar más rápido con sus solicitudes */}
            <Text style={styles.sectionTitle}>Accesos rápidos</Text>

            {/* acceso rápido para crear una nueva solicitud de insumos */}
            <QuickAction
              icono={
                <Ionicons
                  name="add-circle-outline"
                  size={24}
                  color="#00BFA5"
                />
              }
              titulo="Hacer solicitud de insumos"
              onPress={() =>
                navigation.navigate("Solicitudes", {
                  abrirSelector: true,
                })
              }
            />

            {/* acceso rápido para ver los movimientos relacionados al usuario */}
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

      {/* espacio al final para que el contenido no quede pegado al borde inferior */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// estilos para el panel de control
const styles = StyleSheet.create({
  // estilo del scroll principal, con fondo claro y crecimiento flexible
  scroll: {
    flexGrow: 1,
    backgroundColor: "#f7f9fc",
  },

  /* HEADER DEGRADADO */
  // estilo del header con degradado y bordes redondeados abajo
  header: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingTop: 40,
  },
  // estilo del texto de saludo
  headerSaludo: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
  },
  // estilo del título "panel de control"
  headerTitulo: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 5,
  },

  /* CARD BLANCA */
  // estilo de la tarjeta blanca flotante donde van las cards de estadísticas
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

  // estilo del contenedor de grid para acomodar las statcards
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  // estilo de los títulos de sección como "resumen de ceye" o "mis solicitudes"
  sectionTitle: {
    marginTop: 4,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
});

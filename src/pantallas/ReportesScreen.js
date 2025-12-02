// src/pantallas/ReportesScreen.js

// importamos react y los hooks que usaremos para estado, efectos y memoización
import React, { useEffect, useMemo, useState } from "react";
// import envoltura segura para respetar las áreas seguras de la pantalla
import { SafeAreaView } from "react-native-safe-area-context";
// importamos componentes básicos de interfaz
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Dimensions,
  Modal,
  Alert,
} from "react-native";
// iconos que usaremos en algunas tarjetas (aunque aquí casi todo se delega a componentes hijos)
import { Feather, Ionicons } from "@expo/vector-icons";
// tema global de la app (colores, etc.)
import { tema } from "../tema";
// función que escucha cambios en las solicitudes desde firebase
import { listenSolicitudes } from "../firebase/firebaseApi";
// catálogo de lugares de entrega para poder mostrar y filtrar destinos
import { LUGARES_ENTREGA } from "../constants/lugaresEntrega";

// exportar CSV
// librerías para escribir archivos y compartirlos (para el reporte en csv)
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

// componentes nuevos
// estas cards son componentes separados para mantener esta pantalla más limpia
import ReportesFiltrosCard from "../componentes/ReportesFiltrosCard";
import ReportesTopInsumosCard from "../componentes/ReportesTopInsumosCard";
import ReportesConsumoInsumoCard from "../componentes/ReportesConsumoInsumoCard";
import ReportesSolicitudesCard from "../componentes/ReportesSolicitudesCard";
import ReporteDetalleModal from "../componentes/ReporteDetalleModal";

// rangos de fechas que el usuario puede elegir para filtrar (7 días, 30 días, todo)
const RANGOS = [
  { id: "7d", label: "Últimos 7 días", dias: 7 },
  { id: "30d", label: "Últimos 30 días", dias: 30 },
  { id: "todo", label: "Todo", dias: null },
];

// ancho de pantalla para usar si se necesita en algún layout
const screenWidth = Dimensions.get("window").width;

// helper quitar acentos
// esta función normaliza texto: pasa a minúsculas y quita acentos para comparar búsquedas sin problemas
const normalizeText = (str) =>
  (str ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

// helper fechas
// esta función convierte diferentes formatos (timestamp, número, string, etc.) a un objeto date usable
const toDate = (valor) => {
  if (!valor) return null;
  if (valor instanceof Date) return valor;
  if (typeof valor?.toDate === "function") return valor.toDate();
  if (typeof valor === "number") return new Date(valor);
  if (typeof valor === "string") {
    const d = new Date(valor);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof valor === "object" && valor.seconds) {
    return new Date(valor.seconds * 1000);
  }
  if (typeof valor === "object" && valor._seconds) {
    return new Date(valor._seconds * 1000);
  }
  return null;
};

// componente principal de la pantalla de reportes
const ReportesScreen = () => {
  // aquí guardamos todas las solicitudes que vienen de firebase
  const [solicitudes, setSolicitudes] = useState([]);

  // filtros principales: rango de fechas y destino (servicio)
  const [filtroRango, setFiltroRango] = useState("7d");
  const [filtroDestino, setFiltroDestino] = useState("todos");

  // búsqueda y selección de insumo para la parte de consumo por insumo
  const [insumoBusqueda, setInsumoBusqueda] = useState("");
  const [insumoSeleccionadoId, setInsumoSeleccionadoId] = useState(null);

  // filtros para la lista de solicitudes (estado y búsqueda de texto)
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [busquedaSolicitud, setBusquedaSolicitud] = useState("");

  // estados para manejar el modal de detalle de solicitud
  const [modalVisible, setModalVisible] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);

  // efecto que se suscribe en tiempo real a las solicitudes de firebase
  useEffect(() => {
    const unsub = listenSolicitudes((lista) => {
      // si por cualquier cosa viene null/undefined, caemos en arreglo vacío
      setSolicitudes(lista || []);
    });
    // al desmontar el componente limpiamos el listener
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  // ================== FILTRO PRINCIPAL (rango + destino) ==================
  // usamos usememo para recalcular las solicitudes filtradas solo cuando cambien sus dependencias
  const solicitudesFiltradas = useMemo(() => {
    if (!Array.isArray(solicitudes)) return [];

    const ahora = new Date();
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    let fechaDesde = null;

    // buscamos en la constante rangos la configuración del rango actual
    const rangoConf = RANGOS.find((r) => r.id === filtroRango);

    // si el rango tiene valor en días, calculamos la fecha desde donde se cuentan las solicitudes
    if (rangoConf && rangoConf.dias != null) {
      fechaDesde = new Date(
        hoy.getFullYear(),
        hoy.getMonth(),
        hoy.getDate() - rangoConf.dias
      );
    }

    // filtramos por fecha y por destino
    return solicitudes.filter((s) => {
      const base = s.fechaNecesaria ?? s.creadoEn;
      const fecha = toDate(base);
      if (!fecha) return false;

      // si hay fecha desde, y la solicitud es anterior, la excluimos
      if (fechaDesde && fecha < fechaDesde) return false;

      // filtramos por destino si no se seleccionó "todos"
      if (filtroDestino !== "todos") {
        if (s.destinoId) {
          // si la solicitud tiene destinoId, comparamos contra el filtro
          if (s.destinoId !== filtroDestino) return false;
        } else if (s.destino) {
          // si solo tiene el nombre del destino, buscamos el objeto en el catálogo
          const destinoObj = LUGARES_ENTREGA.find(
            (d) => d.id === filtroDestino
          );
          if (!destinoObj || destinoObj.nombre !== s.destino) return false;
        }
      }
      return true;
    });
  }, [solicitudes, filtroRango, filtroDestino]);

  // ================== TOP INSUMOS ==================
  // aquí generamos el top de insumos más solicitados en el rango y destino seleccionados
  // AGRUPANDO por nombre normalizado para evitar duplicados visuales
  const topInsumos = useMemo(() => {
    const conteoPorNombre = {};

    solicitudesFiltradas.forEach((s) => {
      (s.items || []).forEach((item) => {
        const nombreOriginal = (item.nombre || "Sin nombre").trim();
        const nombreClave = normalizeText(nombreOriginal) || "sin-nombre";
        const cantidad = item.cantidad ?? 0;

        if (!conteoPorNombre[nombreClave]) {
          conteoPorNombre[nombreClave] = {
            id: nombreClave, // usamos la clave normalizada como id local
            nombre: nombreOriginal,
            totalCantidad: 0,
            totalSolicitudes: 0,
          };
        }

        conteoPorNombre[nombreClave].totalCantidad += cantidad;
        conteoPorNombre[nombreClave].totalSolicitudes += 1;
      });
    });

    const listado = Object.values(conteoPorNombre);
    listado.sort((a, b) => b.totalCantidad - a.totalCantidad);
    return listado.slice(0, 5);
  }, [solicitudesFiltradas]);

  // ================== AGREGADOS POR INSUMO ==================
  // este mapa guarda los totales por insumo para usarlo tanto en lista como en detalle
  // también agrupamos por nombre normalizado
  const insumosAggregados = useMemo(() => {
    const mapa = {};
    solicitudesFiltradas.forEach((s) => {
      (s.items || []).forEach((item) => {
        const nombreOriginal = (item.nombre || "Sin nombre").trim();
        const clave = normalizeText(nombreOriginal) || "sin-nombre";
        const cantidad = item.cantidad ?? 0;

        // si no existe el insumo en el mapa, lo creamos
        if (!mapa[clave]) {
          mapa[clave] = {
            id: clave, // id = nombre normalizado, sirve como key estable
            nombre: nombreOriginal,
            totalCantidad: 0,
            totalSolicitudes: 0,
          };
        }
        // sumamos cantidad y número de solicitudes donde aparece
        mapa[clave].totalCantidad += cantidad;
        mapa[clave].totalSolicitudes += 1;
      });
    });
    return mapa;
  }, [solicitudesFiltradas]);

  // lista de insumos para el buscador (se usa en la card de consumo por insumo)
  const insumosParaBusqueda = useMemo(() => {
    const lista = Object.values(insumosAggregados);
    // si no hay texto de búsqueda, mostramos los 10 con más consumo
    if (!insumoBusqueda.trim()) {
      return lista
        .sort((a, b) => b.totalCantidad - a.totalCantidad)
        .slice(0, 10);
    }

    // si hay texto, normalizamos y filtramos por nombre
    const texto = normalizeText(insumoBusqueda);
    return lista
      .filter((i) => normalizeText(i.nombre).includes(texto))
      .sort((a, b) => b.totalCantidad - a.totalCantidad)
      .slice(0, 10);
  }, [insumosAggregados, insumoBusqueda]);

  // ================== DETALLE INSUMO ==================
  // aquí calculamos datos detallados del insumo seleccionado (total, destinos, fechas, promedio por día)
  // usando también la clave de nombre normalizado
  const insumoSeleccionadoDetalle = useMemo(() => {
    if (!insumoSeleccionadoId) return null;

    let totalCantidad = 0;
    let totalSolicitudes = 0;
    const destinosConteo = {};
    let fechaPrimera = null;
    let fechaUltima = null;

    // recorremos las solicitudes filtradas para ver en cuáles aparece el insumo
    solicitudesFiltradas.forEach((s) => {
      const items = s.items || [];

      const contiene = items.some((it) => {
        const nombreOriginal = (it.nombre || "").trim();
        const clave = normalizeText(nombreOriginal) || "sin-nombre";
        return clave === insumoSeleccionadoId;
      });

      if (!contiene) return;

      // sumamos la cantidad del insumo en esa solicitud
      items.forEach((it) => {
        const nombreOriginal = (it.nombre || "").trim();
        const clave = normalizeText(nombreOriginal) || "sin-nombre";
        if (clave === insumoSeleccionadoId) {
          totalCantidad += it.cantidad ?? 0;
        }
      });

      // aumentamos el contador de solicitudes donde aparece
      totalSolicitudes += 1;

      // obtenemos el nombre amigable del destino
      const destinoNombre =
        s.destino ||
        LUGARES_ENTREGA.find((d) => d.id === s.destinoId)?.nombre ||
        "Solicitud rápida";

      // contamos cuántas veces se pide en cada destino
      if (!destinosConteo[destinoNombre]) {
        destinosConteo[destinoNombre] = 0;
      }
      destinosConteo[destinoNombre] += 1;

      // actualizamos primera y última fecha en que se pidió ese insumo
      const fecha = toDate(s.fechaNecesaria ?? s.creadoEn);
      if (!fecha) return;

      if (!fechaPrimera || fecha < fechaPrimera) fechaPrimera = fecha;
      if (!fechaUltima || fecha > fechaUltima) fechaUltima = fecha;
    });

    // convertimos el conteo de destinos a arreglo y lo ordenamos
    const destinosArray = Object.entries(destinosConteo).map(
      ([nombre, count]) => ({ nombre, count })
    );
    destinosArray.sort((a, b) => b.count - a.count);

    // calculamos promedio de consumo por día dentro de las fechas donde se pidió el insumo
    let promedioPorDia = null;
    if (fechaPrimera && fechaUltima) {
      const ms = fechaUltima.getTime() - fechaPrimera.getTime();
      const dias = Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
      promedioPorDia = totalCantidad / dias;
    }

    return {
      totalCantidad,
      totalSolicitudes,
      destinos: destinosArray,
      fechaUltima,
      promedioPorDia,
    };
  }, [insumoSeleccionadoId, solicitudesFiltradas]);

  // formateador de fecha corta para mostrar en tarjetas
  const formatearFechaCorta = (fecha) => {
    if (!fecha) return "-";
    const d = new Date(fecha);
    return d.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // formateador para el promedio por día, con un decimal
  const formatearPromedio = (valor) => {
    if (valor == null || isNaN(valor)) return "-";
    return valor.toFixed(1);
  };

  // ================== FILTRO POR ESTADO + BÚSQUEDA ==================
  // aquí filtramos las solicitudes por estado (problema, verificadas, rechazadas) y por texto
  const solicitudesFiltradasPorEstado = useMemo(() => {
    if (!Array.isArray(solicitudesFiltradas)) return [];

    const texto = normalizeText(busquedaSolicitud.trim());

    return solicitudesFiltradas.filter((s) => {
      const estado = (s.estado || "").toLowerCase();

      // excluimos de reportes las solicitudes que siguen activas (pendiente, lista, aceptada)
      if (
        estado === "pendiente" ||
        estado === "lista" ||
        estado === "aceptada"
      ) {
        return false;
      }

      // validamos si el estado de la solicitud pasa el filtro seleccionado
      let pasaEstado = false;
      if (filtroEstado === "todas") {
        pasaEstado =
          estado === "problema" ||
          estado === "verificada" ||
          estado === "rechazada";
      } else if (filtroEstado === "completadas") {
        pasaEstado = estado === "verificada";
      } else if (filtroEstado === "rechazadas") {
        pasaEstado = estado === "rechazada";
      }

      if (!pasaEstado) return false;

      // si no hay texto de búsqueda, con pasar el estado es suficiente
      if (!texto) return true;

      // armamos varias cadenas para buscar: usuario, destino, cirugía, nombres de insumos y fecha
      const usuarioStr = normalizeText(s.usuario);
      const destinoStr = normalizeText(
        s.destino ||
          LUGARES_ENTREGA.find((d) => d.id === s.destinoId)?.nombre ||
          ""
      );
      const cirugiaStr = normalizeText(s.cirugia);
      const itemsStr = normalizeText(
        (s.items || [])
          .map((it) => it.nombre || "")
          .join(" ")
      );

      const fecha = toDate(s.fechaNecesaria ?? s.creadoEn);
      const fechaStr = normalizeText(
        fecha
          ? fecha.toLocaleDateString("es-MX", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : ""
      );

      // la solicitud pasa si alguna de estas cadenas contiene el texto buscado
      return (
        usuarioStr.includes(texto) ||
        destinoStr.includes(texto) ||
        cirugiaStr.includes(texto) ||
        itemsStr.includes(texto) ||
        fechaStr.includes(texto)
      );
    });
  }, [solicitudesFiltradas, filtroEstado, busquedaSolicitud]);

  // ================== DETALLE SOLICITUD PARA MODAL ==================
  // aquí preparamos la info que se muestra en el modal cuando el usuario toca una solicitud
  const solicitudSeleccionadaDetalle = useMemo(() => {
    if (!solicitudSeleccionada) return null;

    const fecha = toDate(
      solicitudSeleccionada.fechaNecesaria ?? solicitudSeleccionada.creadoEn
    );
    const fechaTexto = fecha
      ? `${fecha.toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })} · ${fecha.toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
        })}`
      : "Sin fecha";

    const destinoNombre =
      solicitudSeleccionada.destino ||
      LUGARES_ENTREGA.find((d) => d.id === solicitudSeleccionada.destinoId)
        ?.nombre ||
      "Solicitud rápida";

    const items = solicitudSeleccionada.items || [];

    return {
      fechaTexto,
      destinoNombre,
      items,
      usuario: solicitudSeleccionada.usuario || "Desconocido",
      cirugia: solicitudSeleccionada.cirugia || null,
      estado: solicitudSeleccionada.estado || "",
    };
  }, [solicitudSeleccionada]);

  // colores base que tomamos del tema para que la pantalla respete el diseño general
  const ACCENT = tema?.colores?.accent || "#00BFA5";
  const BG = tema?.colores?.bg || "#F7F8FA";
  const INK = tema?.colores?.ink || "#111827";

  // función para cerrar el modal y limpiar la solicitud seleccionada
  const cerrarModal = () => {
    setModalVisible(false);
    setSolicitudSeleccionada(null);
  };

  // ================== EXPORTAR CSV ==================
  // esta función arma un archivo csv con las solicitudes filtradas y lo comparte
  const exportarCSV = async () => {
    try {
      // si no hay solicitudes después de los filtros, avisamos que no hay nada para exportar
      if (!solicitudesFiltradasPorEstado.length) {
        Alert.alert(
          "Sin datos",
          "No hay solicitudes para exportar con los filtros actuales."
        );
        return;
      }

      // máximo número de insumos en cualquier solicitud
      // esto nos sirve para generar suficientes columnas insumo_x / cantidad_x
      const maxInsumos = Math.max(
        0,
        ...solicitudesFiltradasPorEstado.map((s) => (s.items || []).length)
      );

      // encabezados fijos del csv
      const headers = [
        "Fecha de pedido",
        "Usuario",
        "Destino",
        "Cirugia",
        "Estado",
      ];

      // agregamos pares de columnas por cada posible insumo
      for (let i = 1; i <= maxInsumos; i++) {
        headers.push(`Insumo_${i}`);
        headers.push(`Cantidad_${i}`);
      }

      // construimos las filas a partir de cada solicitud
      const filas = solicitudesFiltradasPorEstado.map((s) => {
        const fecha = toDate(s.fechaNecesaria ?? s.creadoEn);
        const fechaStr = fecha
          ? fecha.toLocaleString("es-MX", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";

        const destinoNombre =
          s.destino ||
          LUGARES_ENTREGA.find((d) => d.id === s.destinoId)?.nombre ||
          "Solicitud rápida";

        const cirugiaTexto =
          s.cirugia && String(s.cirugia).trim() !== ""
            ? s.cirugia
            : "No aplica";

        // base de cada fila: datos generales de la solicitud
        const base = [
          fechaStr,
          s.usuario || "",
          destinoNombre,
          cirugiaTexto,
          s.estado || "",
        ];

        const row = [...base];
        const items = s.items || [];

        // por cada posición hasta el máximo de insumos, agregamos nombre y cantidad
        for (let i = 0; i < maxInsumos; i++) {
          if (items[i]) {
            row.push(items[i].nombre || "");
            row.push(
              items[i].cantidad === 0 || items[i].cantidad
                ? items[i].cantidad
                : ""
            );
          } else {
            // si esta solicitud no tiene insumo en esa posición, metemos campos vacíos
            row.push("");
            row.push("");
          }
        }

        return row;
      });

      // helper para escapar comillas y envolver cada campo entre comillas
      const escapeCampo = (campo) => {
        const c = String(campo ?? "").replace(/"/g, '""');
        return `"${c}"`;
      };

      // armamos todas las líneas del csv: primero encabezados, luego filas
      const lineas = [
        headers.map(escapeCampo).join(","),
        ...filas.map((fila) => fila.map(escapeCampo).join(",")),
      ];

      const contenido = lineas.join("\n");

      // ruta donde se va a guardar el archivo en el dispositivo
      const fileUri =
        FileSystem.documentDirectory + "reporte_solicitudes.csv";

      // escribimos el contenido y luego abrimos el diálogo para compartir
      await FileSystem.writeAsStringAsync(fileUri, contenido);
      await Sharing.shareAsync(fileUri);
    } catch (e) {
      console.error("Error exportando CSV:", e);
      Alert.alert(
        "Error",
        "Ocurrió un problema al exportar el archivo. Intenta de nuevo."
      );
    }
  };

  return (
    // usamos safeareaview para respetar notch y barras, y le aplicamos el color de fondo del tema
    <SafeAreaView style={[styles.screen, { backgroundColor: BG }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* título principal de la pantalla de reportes */}
        <Text style={[styles.title, { color: INK }]}>
          Resumen de solicitudes
        </Text>

        {/* filtros de rango y destino */}
        <ReportesFiltrosCard
          filtroRango={filtroRango}
          setFiltroRango={setFiltroRango}
          filtroDestino={filtroDestino}
          setFiltroDestino={setFiltroDestino}
          RANGOS={RANGOS}
          LUGARES_ENTREGA={LUGARES_ENTREGA}
          accentColor={ACCENT}
        />

        {/* top de insumos más consumidos */}
        <ReportesTopInsumosCard topInsumos={topInsumos} accentColor={ACCENT} />

        {/* bloque para analizar consumo detallado de un insumo específico */}
        <ReportesConsumoInsumoCard
          insumoBusqueda={insumoBusqueda}
          setInsumoBusqueda={setInsumoBusqueda}
          insumoSeleccionadoId={insumoSeleccionadoId}
          setInsumoSeleccionadoId={setInsumoSeleccionadoId}
          insumosParaBusqueda={insumosParaBusqueda}
          insumoSeleccionadoDetalle={insumoSeleccionadoDetalle}
          formatearFechaCorta={formatearFechaCorta}
          formatearPromedio={formatearPromedio}
          accentColor={ACCENT}
        />

        {/* lista de solicitudes filtradas por estado/búsqueda y botón para exportar a csv */}
        <ReportesSolicitudesCard
          solicitudesFiltradasPorEstado={solicitudesFiltradasPorEstado}
          busquedaSolicitud={busquedaSolicitud}
          setBusquedaSolicitud={setBusquedaSolicitud}
          filtroEstado={filtroEstado}
          setFiltroEstado={setFiltroEstado}
          accentColor={ACCENT}
          onExportCSV={exportarCSV}
          onSelectSolicitud={(s) => {
            setSolicitudSeleccionada(s);
            setModalVisible(true);
          }}
          toDate={toDate}
          LUGARES_ENTREGA={LUGARES_ENTREGA}
        />

        {/* espacio al final para que no quede nada pegado al borde inferior */}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* modal que muestra el detalle de una solicitud seleccionada */}
      <ReporteDetalleModal
        visible={modalVisible}
        onClose={cerrarModal}
        solicitudSeleccionadaDetalle={solicitudSeleccionadaDetalle}
      />
    </SafeAreaView>
  );
};

export default ReportesScreen;

const styles = StyleSheet.create({
  // estilo base de la pantalla
  screen: {
    flex: 1,
  },
  // padding del contenido scrollable
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
  },
  // estilo del título principal
  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 12,
  },
});

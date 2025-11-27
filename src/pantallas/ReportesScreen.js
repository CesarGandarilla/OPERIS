// src/pantallas/ReportesScreen.js
import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
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
import { Feather, Ionicons } from "@expo/vector-icons";
import { tema } from "../tema";
import { listenSolicitudes } from "../firebase/firebaseApi";
import { LUGARES_ENTREGA } from "../constants/lugaresEntrega";

// exportar CSV
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

// componentes nuevos
import ReportesFiltrosCard from "../componentes/ReportesFiltrosCard";
import ReportesTopInsumosCard from "../componentes/ReportesTopInsumosCard";
import ReportesConsumoInsumoCard from "../componentes/ReportesConsumoInsumoCard";
import ReportesSolicitudesCard from "../componentes/ReportesSolicitudesCard";
import ReporteDetalleModal from "../componentes/ReporteDetalleModal";

const RANGOS = [
  { id: "7d", label: "Últimos 7 días", dias: 7 },
  { id: "30d", label: "Últimos 30 días", dias: 30 },
  { id: "todo", label: "Todo", dias: null },
];

const screenWidth = Dimensions.get("window").width;

// helper quitar acentos
const normalizeText = (str) =>
  (str ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

// helper fechas
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

const ReportesScreen = () => {
  const [solicitudes, setSolicitudes] = useState([]);

  const [filtroRango, setFiltroRango] = useState("7d");
  const [filtroDestino, setFiltroDestino] = useState("todos");

  const [insumoBusqueda, setInsumoBusqueda] = useState("");
  const [insumoSeleccionadoId, setInsumoSeleccionadoId] = useState(null);

  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [busquedaSolicitud, setBusquedaSolicitud] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);

  useEffect(() => {
    const unsub = listenSolicitudes((lista) => {
      setSolicitudes(lista || []);
    });
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  // ================== FILTRO PRINCIPAL (rango + destino) ==================
  const solicitudesFiltradas = useMemo(() => {
    if (!Array.isArray(solicitudes)) return [];

    const ahora = new Date();
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    let fechaDesde = null;

    const rangoConf = RANGOS.find((r) => r.id === filtroRango);

    if (rangoConf && rangoConf.dias != null) {
      fechaDesde = new Date(
        hoy.getFullYear(),
        hoy.getMonth(),
        hoy.getDate() - rangoConf.dias
      );
    }

    return solicitudes.filter((s) => {
      const base = s.fechaNecesaria ?? s.creadoEn;
      const fecha = toDate(base);
      if (!fecha) return false;

      if (fechaDesde && fecha < fechaDesde) return false;

      if (filtroDestino !== "todos") {
        if (s.destinoId) {
          if (s.destinoId !== filtroDestino) return false;
        } else if (s.destino) {
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
  const topInsumos = useMemo(() => {
    const conteo = {};
    solicitudesFiltradas.forEach((s) => {
      (s.items || []).forEach((item) => {
        const id = item.insumoId || item.nombre || "sin-id";
        const nombre = item.nombre || "Sin nombre";
        const cantidad = item.cantidad ?? 0;

        if (!conteo[id]) {
          conteo[id] = { id, nombre, totalCantidad: 0, totalSolicitudes: 0 };
        }
        conteo[id].totalCantidad += cantidad;
        conteo[id].totalSolicitudes += 1;
      });
    });

    const listado = Object.values(conteo);
    listado.sort((a, b) => b.totalCantidad - a.totalCantidad);
    return listado.slice(0, 5);
  }, [solicitudesFiltradas]);

  // ================== AGREGADOS POR INSUMO ==================
  const insumosAggregados = useMemo(() => {
    const mapa = {};
    solicitudesFiltradas.forEach((s) => {
      (s.items || []).forEach((item) => {
        const id = item.insumoId || item.nombre || "sin-id";
        const nombre = item.nombre || "Sin nombre";
        const cantidad = item.cantidad ?? 0;

        if (!mapa[id]) {
          mapa[id] = {
            id,
            nombre,
            totalCantidad: 0,
            totalSolicitudes: 0,
          };
        }
        mapa[id].totalCantidad += cantidad;
        mapa[id].totalSolicitudes += 1;
      });
    });
    return mapa;
  }, [solicitudesFiltradas]);

  const insumosParaBusqueda = useMemo(() => {
    const lista = Object.values(insumosAggregados);
    if (!insumoBusqueda.trim()) {
      return lista
        .sort((a, b) => b.totalCantidad - a.totalCantidad)
        .slice(0, 10);
    }

    const texto = normalizeText(insumoBusqueda);
    return lista
      .filter((i) => normalizeText(i.nombre).includes(texto))
      .sort((a, b) => b.totalCantidad - a.totalCantidad)
      .slice(0, 10);
  }, [insumosAggregados, insumoBusqueda]);

  // ================== DETALLE INSUMO ==================
  const insumoSeleccionadoDetalle = useMemo(() => {
    if (!insumoSeleccionadoId) return null;

    let totalCantidad = 0;
    let totalSolicitudes = 0;
    const destinosConteo = {};
    let fechaPrimera = null;
    let fechaUltima = null;

    solicitudesFiltradas.forEach((s) => {
      const items = s.items || [];
      const contiene = items.some(
        (it) =>
          (it.insumoId || it.nombre || "sin-id") === insumoSeleccionadoId
      );

      if (!contiene) return;

      items.forEach((it) => {
        const id = it.insumoId || it.nombre || "sin-id";
        if (id === insumoSeleccionadoId) {
          totalCantidad += it.cantidad ?? 0;
        }
      });

      totalSolicitudes += 1;

      const destinoNombre =
        s.destino ||
        LUGARES_ENTREGA.find((d) => d.id === s.destinoId)?.nombre ||
        "Solicitud rápida";

      if (!destinosConteo[destinoNombre]) {
        destinosConteo[destinoNombre] = 0;
      }
      destinosConteo[destinoNombre] += 1;

      const fecha = toDate(s.fechaNecesaria ?? s.creadoEn);
      if (!fecha) return;

      if (!fechaPrimera || fecha < fechaPrimera) fechaPrimera = fecha;
      if (!fechaUltima || fecha > fechaUltima) fechaUltima = fecha;
    });

    const destinosArray = Object.entries(destinosConteo).map(
      ([nombre, count]) => ({ nombre, count })
    );
    destinosArray.sort((a, b) => b.count - a.count);

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

  const formatearFechaCorta = (fecha) => {
    if (!fecha) return "-";
    const d = new Date(fecha);
    return d.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatearPromedio = (valor) => {
    if (valor == null || isNaN(valor)) return "-";
    return valor.toFixed(1);
  };

  // ================== FILTRO POR ESTADO + BÚSQUEDA ==================
  const solicitudesFiltradasPorEstado = useMemo(() => {
    if (!Array.isArray(solicitudesFiltradas)) return [];

    const texto = normalizeText(busquedaSolicitud.trim());

    return solicitudesFiltradas.filter((s) => {
      const estado = (s.estado || "").toLowerCase();

      if (
        estado === "pendiente" ||
        estado === "lista" ||
        estado === "aceptada"
      ) {
        return false;
      }

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

      if (!texto) return true;

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

  const ACCENT = tema?.colores?.accent || "#00BFA5";
  const BG = tema?.colores?.bg || "#F7F8FA";
  const INK = tema?.colores?.ink || "#111827";

  const cerrarModal = () => {
    setModalVisible(false);
    setSolicitudSeleccionada(null);
  };

  // ================== EXPORTAR CSV ==================
  const exportarCSV = async () => {
    try {
      if (!solicitudesFiltradasPorEstado.length) {
        Alert.alert(
          "Sin datos",
          "No hay solicitudes para exportar con los filtros actuales."
        );
        return;
      }

      // máximo número de insumos en cualquier solicitud
      const maxInsumos = Math.max(
        0,
        ...solicitudesFiltradasPorEstado.map((s) => (s.items || []).length)
      );

      const headers = [
        "Fecha de pedido",
        "Usuario",
        "Destino",
        "Cirugia",
        "Estado",
      ];

      for (let i = 1; i <= maxInsumos; i++) {
        headers.push(`Insumo_${i}`);
        headers.push(`Cantidad_${i}`);
      }

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

        const base = [
          fechaStr,
          s.usuario || "",
          destinoNombre,
          cirugiaTexto,
          s.estado || "",
        ];

        const row = [...base];
        const items = s.items || [];

        for (let i = 0; i < maxInsumos; i++) {
          if (items[i]) {
            row.push(items[i].nombre || "");
            row.push(
              items[i].cantidad === 0 || items[i].cantidad
                ? items[i].cantidad
                : ""
            );
          } else {
            row.push("");
            row.push("");
          }
        }

        return row;
      });

      const escapeCampo = (campo) => {
        const c = String(campo ?? "").replace(/"/g, '""');
        return `"${c}"`;
      };

      const lineas = [
        headers.map(escapeCampo).join(","),
        ...filas.map((fila) => fila.map(escapeCampo).join(",")),
      ];

      const contenido = lineas.join("\n");

      const fileUri =
        FileSystem.documentDirectory + "reporte_solicitudes.csv";

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
    <SafeAreaView style={[styles.screen, { backgroundColor: BG }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: INK }]}>
          Resumen de solicitudes
        </Text>

        {/* FILTROS */}
        <ReportesFiltrosCard
          filtroRango={filtroRango}
          setFiltroRango={setFiltroRango}
          filtroDestino={filtroDestino}
          setFiltroDestino={setFiltroDestino}
          RANGOS={RANGOS}
          LUGARES_ENTREGA={LUGARES_ENTREGA}
          accentColor={ACCENT}
        />

        {/* TOP INSUMOS */}
        <ReportesTopInsumosCard topInsumos={topInsumos} accentColor={ACCENT} />

        {/* CONSUMO POR INSUMO */}
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

        {/* SOLICITUDES FILTRADAS + EXPORT */}
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

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* MODAL DETALLE */}
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
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 12,
  },
});

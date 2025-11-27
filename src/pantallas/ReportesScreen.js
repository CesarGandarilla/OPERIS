import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { tema } from "../tema";
import { listenSolicitudes } from "../firebase/firebaseApi";
import { LUGARES_ENTREGA } from "../constants/lugaresEntrega";

import FiltrosReportes from "../componentes/FiltrosReportes";
import TopInsumosCard from "../componentes/TopInsumosCard";
import ConsumoInsumoCard from "../componentes/ConsumoInsumoCard";
import SolicitudesFiltradasCard from "../componentes/SolicitudesFiltradasCard";
import DetalleSolicitudModal from "../componentes/DetalleSolicitudModal";

const RANGOS = [
  { id: "7d", label: "Últimos 7 días", dias: 7 },
  { id: "30d", label: "Últimos 30 días", dias: 30 },
  { id: "todo", label: "Todo", dias: null },
];

const normalizeText = (str) =>
  (str ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

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

  // filtro por rango de fechas + destino
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
          const destinoObj = LUGARES_ENTREGA.find((d) => d.id === filtroDestino);
          if (!destinoObj || destinoObj.nombre !== s.destino) return false;
        }
      }
      return true;
    });
  }, [solicitudes, filtroRango, filtroDestino]);

  // top insumos
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

  // agregados por insumo
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

  // lista de insumos para buscador
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

  // detalle de insumo seleccionado
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

  // filtro de estados + búsqueda
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

  // detalle para el modal
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

  const handleSeleccionarSolicitud = (s) => {
    setSolicitudSeleccionada(s);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setSolicitudSeleccionada(null);
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

        <FiltrosReportes
          RANGOS={RANGOS}
          filtroRango={filtroRango}
          setFiltroRango={setFiltroRango}
          filtroDestino={filtroDestino}
          setFiltroDestino={setFiltroDestino}
          LUGARES_ENTREGA={LUGARES_ENTREGA}
          ACCENT={ACCENT}
        />

        {topInsumos.length > 0 && (
          <TopInsumosCard topInsumos={topInsumos} ACCENT={ACCENT} />
        )}

        <ConsumoInsumoCard
          filtroDestino={filtroDestino}
          ACCENT={ACCENT}
          insumoBusqueda={insumoBusqueda}
          setInsumoBusqueda={setInsumoBusqueda}
          insumoSeleccionadoId={insumoSeleccionadoId}
          setInsumoSeleccionadoId={setInsumoSeleccionadoId}
          insumosParaBusqueda={insumosParaBusqueda}
          insumoSeleccionadoDetalle={insumoSeleccionadoDetalle}
          formatearFechaCorta={formatearFechaCorta}
          formatearPromedio={formatearPromedio}
        />

        <SolicitudesFiltradasCard
          ACCENT={ACCENT}
          solicitudesFiltradasPorEstado={solicitudesFiltradasPorEstado}
          filtroEstado={filtroEstado}
          setFiltroEstado={setFiltroEstado}
          busquedaSolicitud={busquedaSolicitud}
          setBusquedaSolicitud={setBusquedaSolicitud}
          onSeleccionarSolicitud={handleSeleccionarSolicitud}
          LUGARES_ENTREGA={LUGARES_ENTREGA}
        />

        <View style={{ height: 24 }} />
      </ScrollView>

      <DetalleSolicitudModal
        visible={modalVisible}
        onClose={cerrarModal}
        detalle={solicitudSeleccionadaDetalle}
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

// src/pantallas/ReportesScreen.js
import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from "react-native";
import { AntDesign, Feather } from "@expo/vector-icons";
import { PieChart } from "react-native-chart-kit";
import { tema } from "../tema";
import { listenSolicitudes } from "../firebase/firebaseApi";
import { LUGARES_ENTREGA } from "../constants/lugaresEntrega";

const RANGOS = [
  { id: "7d", label: "Últimos 7 días", dias: 7 },
  { id: "30d", label: "Últimos 30 días", dias: 30 },
  { id: "todo", label: "Todo", dias: null },
];

const screenWidth = Dimensions.get("window").width;

const PIE_COLORS = ["#00BFA5", "#60A5FA", "#F59E0B", "#EF4444", "#6B7280"];

// 🎨 ESTILOS PARA ESTADOS (con dot de color)
const getEstadoStyle = (estado) => {
  const est = estado?.toLowerCase();

  if (est === "lista" || est === "verificada") {
    return {
      dot: "#00BFA5",
      backgroundColor: "rgba(0, 191, 165, 0.15)",
      color: "#00BFA5",
    };
  }

  if (est === "aceptada") {
    return {
      dot: "#3B82F6",
      backgroundColor: "rgba(96, 165, 250, 0.18)",
      color: "#3B82F6",
    };
  }

  if (est === "rechazada") {
    return {
      dot: "#EF4444",
      backgroundColor: "rgba(239, 68, 68, 0.18)",
      color: "#EF4444",
    };
  }

  return {
    dot: "#6B7280",
    backgroundColor: "#E5E7EB",
    color: "#374151",
  };
};

const ReportesScreen = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [filtroRango, setFiltroRango] = useState("7d");
  const [filtroDestino, setFiltroDestino] = useState("todos");

  const [insumoBusqueda, setInsumoBusqueda] = useState("");
  const [insumoSeleccionadoId, setInsumoSeleccionadoId] = useState(null);

  const [filtroEstado, setFiltroEstado] = useState("todas");

  useEffect(() => {
    const unsub = listenSolicitudes((lista) => {
      setSolicitudes(lista || []);
    });
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

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
  const solicitudesFiltradas = useMemo(() => {
    if (!Array.isArray(solicitudes)) return [];

    const ahora = new Date();
    let fechaDesde = null;

    const rangoConf = RANGOS.find((r) => r.id === filtroRango);

    if (rangoConf && rangoConf.dias != null) {
      fechaDesde = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate() - rangoConf.dias
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

  const topDestinos = useMemo(() => {
    if (filtroDestino !== "todos") return [];
    const conteo = {};

    solicitudesFiltradas.forEach((s) => {
      const id = s.destinoId || s.destino || "sin-destino";
      const nombre =
        s.destino ||
        LUGARES_ENTREGA.find((d) => d.id === s.destinoId)?.nombre ||
        "Sin destino";

      if (!conteo[id]) {
        conteo[id] = { id, nombre, count: 0 };
      }
      conteo[id].count += 1;
    });

    const listado = Object.values(conteo);
    listado.sort((a, b) => b.count - a.count);
    return listado.slice(0, 5);
  }, [solicitudesFiltradas, filtroDestino]);

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

    const texto = insumoBusqueda.toLowerCase();
    return lista
      .filter((i) => i.nombre.toLowerCase().includes(texto))
      .sort((a, b) => b.totalCantidad - a.totalCantidad)
      .slice(0, 10);
  }, [insumosAggregados, insumoBusqueda]);

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
        "Sin destino";

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

  const solicitudesFiltradasPorEstado = useMemo(() => {
    if (!Array.isArray(solicitudesFiltradas)) return [];

    return solicitudesFiltradas.filter((s) => {
      const estado = (s.estado || "").toLowerCase();

      if (filtroEstado === "todas") return true;
      if (filtroEstado === "completadas") {
        return estado === "lista" || estado === "verificada";
      }
      if (filtroEstado === "rechazadas") {
        return estado === "rechazada";
      }

      return true;
    });
  }, [solicitudesFiltradas, filtroEstado]);

  const pieDataDestinos = useMemo(() => {
    if (!topDestinos || topDestinos.length === 0) return [];

    return topDestinos.map((d, idx) => ({
      name: d.nombre || "Sin destino",
      count: d.count,
      color: PIE_COLORS[idx % PIE_COLORS.length],
      legendFontColor: "#374151",
      legendFontSize: 12,
    }));
  }, [topDestinos]);

  const ACCENT = tema?.colores?.accent || "#00BFA5";
  const BG = tema?.colores?.bg || "#F7F8FA";
  const INK = tema?.colores?.ink || "#111827";

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: BG }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: INK }]}>Resumen de solicitudes</Text>

        {/* FILTROS */}
        <View style={[styles.card, styles.cardElevated]}>
          <Text style={styles.cardTitle}>Filtros</Text>

          <Text style={styles.filterLabel}>Rango de fechas</Text>
          <View style={styles.chipRow}>
            {RANGOS.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={[
                  styles.chip,
                  filtroRango === r.id && { ...styles.chipActive, backgroundColor: ACCENT },
                ]}
                onPress={() => setFiltroRango(r.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    filtroRango === r.id && styles.chipTextActive,
                  ]}
                >
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.filterLabel, { marginTop: 12 }]}>Destino</Text>
          <View style={styles.chipRow}>
            <TouchableOpacity
              style={[
                styles.chip,
                filtroDestino === "todos" && { ...styles.chipActive, backgroundColor: ACCENT },
              ]}
              onPress={() => setFiltroDestino("todos")}
            >
              <Text
                style={[
                  styles.chipText,
                  filtroDestino === "todos" && styles.chipTextActive,
                ]}
              >
                Todos
              </Text>
            </TouchableOpacity>

            {LUGARES_ENTREGA.map((lugar) => (
              <TouchableOpacity
                key={lugar.id}
                style={[
                  styles.chip,
                  filtroDestino === lugar.id && { ...styles.chipActive, backgroundColor: ACCENT },
                ]}
                onPress={() => setFiltroDestino(lugar.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    filtroDestino === lugar.id && styles.chipTextActive,
                  ]}
                >
                  {lugar.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Destinos TOP  */}
        {filtroDestino === "todos" && topDestinos.length > 0 && (
          <View style={[styles.card, styles.cardElevated]}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Destinos con más solicitudes</Text>
              <Text style={styles.cardSubtitle}>Top 5</Text>
            </View>

            {pieDataDestinos.length > 0 && (
              <PieChart
                data={pieDataDestinos}
                width={screenWidth - 32}
                height={220}
                accessor="count"
                backgroundColor="transparent"
                paddingLeft="10"
                chartConfig={{
                  backgroundGradientFrom: "#FFFFFF",
                  backgroundGradientTo: "#FFFFFF",
                  color: () => ACCENT,
                  labelColor: () => "#374151",
                }}
                absolute
                hasLegend={false}
                style={styles.chart}
              />
            )}

            <View style={styles.legendContainer}>
              {pieDataDestinos.map((d, idx) => (
                <View key={idx} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendColorDot,
                      { backgroundColor: d.color },
                    ]}
                  />
                  <Text style={styles.legendText}>
                    {d.name} · <Text style={{ fontWeight: "700" }}>{d.count}</Text>
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* TOP INSUMOS */}
        {topInsumos.length > 0 && (
          <View style={[styles.card, styles.cardElevated]}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Insumos más solicitados</Text>
              <Text style={styles.cardSubtitle}>Top 5</Text>
            </View>

            {topInsumos.map((i, idx) => (
              <View key={i.id} style={styles.rowItem}>
                <View style={styles.rowLeft}>
                  <View style={[styles.indexCircle, { backgroundColor: "#F1F8F7" }]}>
                    <Text style={[styles.indexCircleText, { color: ACCENT }]}>
                      {idx + 1}
                    </Text>
                  </View>
                  <Text style={styles.rowTitle}>{i.nombre}</Text>
                </View>
                <Text style={[styles.rowBadge, { color: ACCENT }]}>
                  {i.totalCantidad} unid.
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* CONSUMO POR INSUMO */}
        <View style={[styles.card, styles.cardElevated]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Consumo por insumo</Text>
            <Feather name="search" size={18} color="#6B7280" />
          </View>
          <Text style={styles.helperText}>
            Busca un insumo para ver su consumo en el periodo filtrado
            {filtroDestino !== "todos" ? " para este destino." : "."}
          </Text>

          <View style={[styles.searchRow, { backgroundColor: "#F6F9F8" }]}>
            <AntDesign name="search" size={16} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Escribe el nombre del insumo"
              placeholderTextColor="#9CA3AF"
              value={insumoBusqueda}
              onChangeText={(texto) => {
                setInsumoBusqueda(texto);
                if (!texto) setInsumoSeleccionadoId(null);
              }}
              selectionColor={ACCENT}
            />
            {insumoBusqueda.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setInsumoBusqueda("");
                  setInsumoSeleccionadoId(null);
                }}
              >
                <AntDesign name="closecircle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

{insumosParaBusqueda.length > 0 && (
  <View style={styles.insumosListaContainer}>
    {insumosParaBusqueda.map((i) => (
      <TouchableOpacity
        key={i.id}
        style={[
          styles.insumoChip,
          insumoSeleccionadoId === i.id && styles.insumoChipActive,
        ]}
        onPress={() => {
          setInsumoSeleccionadoId(i.id);
          setInsumoBusqueda(i.nombre);
        }}
      >
        
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {/* CÍRCULO DEL NÚMERO */}
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: "#E0F2F1",
              justifyContent: "center",
              alignItems: "center",
              marginRight: 10,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: "#00BFA5",
              }}
            >
              {i.totalCantidad}
            </Text>
          </View>

          {/* TEXTO DEL INSUMO */}
          <Text
            style={[
              styles.insumoChipText,
              insumoSeleccionadoId === i.id && styles.insumoChipTextActive,
            ]}
            numberOfLines={1}
          >
            {i.nombre}
          </Text>
        </View>

      </TouchableOpacity>
    ))}
  </View>
)}



          {insumoSeleccionadoId && insumoSeleccionadoDetalle && (
            <View style={styles.consumoCard}>
              <Text style={styles.consumoTitle}>
                {insumoBusqueda || "Insumo seleccionado"}
              </Text>

              <View style={styles.consumoRow}>
                <Text style={styles.consumoLabel}>Total solicitado:</Text>
                <Text style={styles.consumoValue}>
                  {insumoSeleccionadoDetalle.totalCantidad} unidades
                </Text>
              </View>

              <View style={styles.consumoRow}>
                <Text style={styles.consumoLabel}>Número de solicitudes:</Text>
                <Text style={styles.consumoValue}>
                  {insumoSeleccionadoDetalle.totalSolicitudes}
                </Text>
              </View>

              <View style={styles.consumoRow}>
                <Text style={styles.consumoLabel}>Promedio por día:</Text>
                <Text style={styles.consumoValue}>
                  {formatearPromedio(insumoSeleccionadoDetalle.promedioPorDia)}
                </Text>
              </View>

              <View style={styles.consumoRow}>
                <Text style={styles.consumoLabel}>Última solicitud:</Text>
                <Text style={styles.consumoValue}>
                  {formatearFechaCorta(insumoSeleccionadoDetalle.fechaUltima)}
                </Text>
              </View>

              {insumoSeleccionadoDetalle.destinos.length > 0 && (
                <>
                  <Text style={[styles.consumoLabel, { marginTop: 8 }]}>
                    Destinos que más lo solicitan:
                  </Text>
                  {insumoSeleccionadoDetalle.destinos.slice(0, 3).map((d, idx) => (
                    <Text key={idx} style={styles.consumoDestinoItem}>
                      • {d.nombre} ({d.count} solicitudes)
                    </Text>
                  ))}
                </>
              )}
            </View>
          )}
        </View>

        {/* SOLICITUDES FILTRADAS */}
        <View style={[styles.card, styles.cardElevated]}>
          <Text style={styles.cardTitle}>Solicitudes filtradas</Text>
          <Text style={styles.cardSubtitleSmall}>
            {solicitudesFiltradasPorEstado.length} solicitudes en el periodo elegido
          </Text>

          <View style={[styles.chipRow, { marginTop: 4 }]}>
            {[
              { id: "todas", label: "Todas" },
              { id: "completadas", label: "Completadas" },
              { id: "rechazadas", label: "Rechazadas" },
            ].map((op) => (
              <TouchableOpacity
                key={op.id}
                style={[
                  styles.chip,
                  filtroEstado === op.id && {
                    ...styles.chipActive,
                    backgroundColor: ACCENT,
                  },
                ]}
                onPress={() => setFiltroEstado(op.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    filtroEstado === op.id && styles.chipTextActive,
                  ]}
                >
                  {op.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {solicitudesFiltradasPorEstado.length === 0 ? (
            <Text style={styles.emptyText}>
              No se encontraron solicitudes con los filtros actuales.
            </Text>
          ) : (
            solicitudesFiltradasPorEstado.map((s) => {
              const fecha = toDate(s.fechaNecesaria ?? s.creadoEn);
              const fechaTexto = fecha
                ? `${fecha.toLocaleDateString("es-MX", {
                    day: "2-digit",
                    month: "short",
                  })} · ${fecha.toLocaleTimeString("es-MX", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "Sin fecha";

              const destinoNombre =
                s.destino ||
                LUGARES_ENTREGA.find((d) => d.id === s.destinoId)?.nombre ||
                "Sin destino";

              const numItems = (s.items || []).length;

              const est = getEstadoStyle(s.estado);

              return (
                <View key={s.id} style={styles.solicitudItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.solicitudFecha}>{fechaTexto}</Text>
                    <Text style={styles.solicitudDestino}>{destinoNombre}</Text>
                    <Text style={styles.solicitudDetalle}>
                      {numItems} insumo{s.items?.length === 1 ? "" : "s"} ·{" "}
                      
                      {/* BADGE DE ESTADO CON DOT */}
                      <Text
                        style={[
                          styles.estadoBadge,
                          { backgroundColor: est.backgroundColor, color: est.color },
                        ]}
                      >
                        <Text style={{ color: est.dot }}>● </Text>
                        {s.estado || "Sin estado"}
                      </Text>
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  cardElevated: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
  cardSubtitleSmall: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginTop: 4,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  chipActive: {},
  chipText: {
    fontSize: 13,
    color: "#374151",
  },
  chipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  rowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    alignItems: "center",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  indexCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  indexCircleText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  rowTitle: {
    fontSize: 14,
    color: "#111827",
    flexShrink: 1,
  },
  rowBadge: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  helperText: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    paddingVertical: 0,
  },
  insumosListaContainer: {
    marginTop: 6,
    borderRadius: 12,
    backgroundColor: "#FAFBFC",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  insumoChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  insumoChipActive: {},
  insumoChipText: {
    fontSize: 13,
    color: "#111827",
  },
  insumoChipTextActive: {
    fontWeight: "700",
    color: "#00695C",
  },
  consumoCard: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: "#F7F8F9",
    padding: 12,
  },
  consumoTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111827",
  },
  consumoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  consumoLabel: {
    fontSize: 13,
    color: "#4B5563",
  },
  consumoValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  consumoDestinoItem: {
    fontSize: 13,
    color: "#374151",
  },
  emptyText: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 8,
  },
  solicitudItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#EEF2F5",
  },
  solicitudFecha: {
    fontSize: 12,
    color: "#6B7280",
  },
  solicitudDestino: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  solicitudDetalle: {
    fontSize: 13,
    color: "#4B5563",
  },
  solicitudEstado: {
    fontWeight: "700",
    color: "#111827",
  },

  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
    fontSize: 12,
    fontWeight: "700",
  },

  chart: {
    marginVertical: 10,
    borderRadius: 14,
  },
  legendContainer: {
    marginTop: 8,
    alignItems: "flex-start",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  legendColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  legendText: {
    fontSize: 13,
    color: "#374151",
  },
});

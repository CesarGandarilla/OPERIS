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

// paleta simple para el pastel
const PIE_COLORS = ["#00BFA5", "#60A5FA", "#F59E0B", "#EF4444", "#6B7280"];

const ReportesScreen = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [filtroRango, setFiltroRango] = useState("7d");
  const [filtroDestino, setFiltroDestino] = useState("todos");

  const [insumoBusqueda, setInsumoBusqueda] = useState("");
  const [insumoSeleccionadoId, setInsumoSeleccionadoId] = useState(null);

  // filtro por estado para "Solicitudes filtradas"
  const [filtroEstado, setFiltroEstado] = useState("todas"); // todas | completadas | rechazadas

  useEffect(() => {
    const unsub = listenSolicitudes((lista) => {
      setSolicitudes(lista || []);
    });
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  // Normalizar fechas
  const toDate = (valor) => {
    if (!valor) return null;

    if (valor instanceof Date) return valor;

    if (typeof valor?.toDate === "function") {
      return valor.toDate();
    }
    if (typeof valor === "number") {
      return new Date(valor);
    }
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

  // ---- Filtros rango + destino (para todo el análisis general) ----
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

  // ---- Top destinos (solo filtroDestino = todos) ----
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

  // ---- Top insumos más solicitados (LISTA, como antes) ----
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

  // ---- Agregado de insumos para sección "Consumo por insumo" ----
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

  // Detalle del insumo seleccionado
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

    // promedio por día
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

  // Filtro por ESTADO solo para la lista de "Solicitudes filtradas"
  const solicitudesFiltradasPorEstado = useMemo(() => {
    if (!Array.isArray(solicitudesFiltradas)) return [];

    return solicitudesFiltradas.filter((s) => {
      const estado = (s.estado || "").toLowerCase();

      if (filtroEstado === "todas") return true;

      if (filtroEstado === "completadas") {
        // lista o verificada
        return estado === "lista" || estado === "verificada";
      }

      if (filtroEstado === "rechazadas") {
        return estado === "rechazada";
      }

      return true;
    });
  }, [solicitudesFiltradas, filtroEstado]);

  // Datos para el PieChart de destinos
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

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Título */}
        <Text style={styles.title}>Resumen de solicitudes</Text>

        {/* FILTROS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Filtros</Text>

          <Text style={styles.filterLabel}>Rango de fechas</Text>
          <View style={styles.chipRow}>
            {RANGOS.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={[
                  styles.chip,
                  filtroRango === r.id && styles.chipActive,
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

          <Text style={[styles.filterLabel, { marginTop: 10 }]}>
            Destino
          </Text>
          <View style={styles.chipRow}>
            <TouchableOpacity
              style={[
                styles.chip,
                filtroDestino === "todos" && styles.chipActive,
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
                  filtroDestino === lugar.id && styles.chipActive,
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

        {/* DESTINOS CON MÁS SOLICITUDES (solo cuando destino = todos) */}
        {filtroDestino === "todos" && topDestinos.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Destinos con más solicitudes</Text>
              <Text style={styles.cardSubtitle}>Top 5</Text>
            </View>

            {/* PieChart */}
            {pieDataDestinos.length > 0 && (
              <PieChart
                data={pieDataDestinos}
                width={screenWidth - 32} // 16 de padding lateral del scroll
                height={220}
                accessor="count"
                backgroundColor="transparent"
                paddingLeft="10"
                chartConfig={{
                  backgroundGradientFrom: "#FFFFFF",
                  backgroundGradientTo: "#FFFFFF",
                  color: (opacity = 1) =>
                    `rgba(0, 191, 165, ${opacity})`,
                  labelColor: (opacity = 1) =>
                    `rgba(55, 65, 81, ${opacity})`,
                }}
                absolute
                hasLegend={false} // quitamos la leyenda automática
                style={styles.chart}
              />
            )}

            {/* Leyenda personalizada sin número al inicio */}
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
                    {d.name} · {d.count}{" "}
                    {d.count === 1 ? "solicitud" : "solicitudes"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* INSUMOS MÁS SOLICITADOS (LISTA) */}
        {topInsumos.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Insumos más solicitados</Text>
              <Text style={styles.cardSubtitle}>Top 5</Text>
            </View>

            {topInsumos.map((i, idx) => (
              <View key={i.id} style={styles.rowItem}>
                <View style={styles.rowLeft}>
                  <View style={styles.indexCircle}>
                    <Text style={styles.indexCircleText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.rowTitle}>{i.nombre}</Text>
                </View>
                <Text style={styles.rowBadge}>
                  {i.totalCantidad} unid.
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* CONSUMO POR INSUMO */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Consumo por insumo</Text>
            <Feather name="search" size={18} color="#6B7280" />
          </View>
          <Text style={styles.helperText}>
            Busca un insumo para ver su consumo en el periodo filtrado
            {filtroDestino !== "todos" ? " para este destino." : "."}
          </Text>

          {/* Barra de búsqueda REAL */}
          <View style={styles.searchRow}>
            {/* 👇 aquí ya está corregido */}
            <AntDesign name="search" size={16} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Escribe el nombre del insumo"
              placeholderTextColor="#9CA3AF"
              value={insumoBusqueda}
              onChangeText={(texto) => {
                setInsumoBusqueda(texto);
                if (!texto) {
                  setInsumoSeleccionadoId(null);
                }
              }}
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

          {/* Lista compacta de insumos para seleccionar */}
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
                  <Text
                    style={[
                      styles.insumoChipText,
                      insumoSeleccionadoId === i.id &&
                        styles.insumoChipTextActive,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {i.nombre} · {i.totalCantidad} unid.
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Tarjeta de detalle del insumo seleccionado */}
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
                <Text style={styles.consumoLabel}>
                  Número de solicitudes:
                </Text>
                <Text style={styles.consumoValue}>
                  {insumoSeleccionadoDetalle.totalSolicitudes}
                </Text>
              </View>

              <View style={styles.consumoRow}>
                <Text style={styles.consumoLabel}>
                  Promedio por día (unid./día):
                </Text>
                <Text style={styles.consumoValue}>
                  {formatearPromedio(
                    insumoSeleccionadoDetalle.promedioPorDia
                  )}
                </Text>
              </View>

              <View style={styles.consumoRow}>
                <Text style={styles.consumoLabel}>Última solicitud:</Text>
                <Text style={styles.consumoValue}>
                  {formatearFechaCorta(
                    insumoSeleccionadoDetalle.fechaUltima
                  )}
                </Text>
              </View>

              {insumoSeleccionadoDetalle.destinos.length > 0 && (
                <>
                  <Text style={[styles.consumoLabel, { marginTop: 8 }]}>
                    Destinos que más lo solicitan:
                  </Text>
                  {insumoSeleccionadoDetalle.destinos
                    .slice(0, 3)
                    .map((d, idx) => (
                      <Text key={idx} style={styles.consumoDestinoItem}>
                        • {d.nombre} ({d.count} solicitudes)
                      </Text>
                    ))}
                </>
              )}
            </View>
          )}
        </View>

        {/* SOLICITUDES FILTRADAS (SIEMPRE VISIBLE) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Solicitudes filtradas</Text>
          </View>

          <Text style={styles.cardSubtitleSmall}>
            {solicitudesFiltradasPorEstado.length} solicitudes en el periodo
            elegido
          </Text>

          {/* Chips de estado */}
          <View style={[styles.chipRow, { marginTop: 4, marginBottom: 4 }]}>
            {[
              { id: "todas", label: "Todas" },
              { id: "completadas", label: "Completadas" },
              { id: "rechazadas", label: "Rechazadas" },
            ].map((op) => (
              <TouchableOpacity
                key={op.id}
                style={[
                  styles.chip,
                  filtroEstado === op.id && styles.chipActive,
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

              return (
                <View key={s.id} style={styles.solicitudItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.solicitudFecha}>{fechaTexto}</Text>
                    <Text style={styles.solicitudDestino}>
                      {destinoNombre}
                    </Text>
                    <Text style={styles.solicitudDetalle}>
                      {numItems} insumo
                      {numItems === 1 ? "" : "s"} · Estado:{" "}
                      <Text style={styles.solicitudEstado}>
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
    backgroundColor: tema?.colores?.bg || "#F3F4F6",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: tema?.colores?.ink || "#111827",
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
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
    marginBottom: 6,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginTop: 4,
    marginBottom: 4,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  chipActive: {
    backgroundColor: "#00BFA5",
  },
  chipText: {
    fontSize: 12,
    color: "#374151",
  },
  chipTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  rowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    alignItems: "center",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  indexCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  indexCircleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  rowTitle: {
    fontSize: 13,
    color: "#111827",
  },
  rowBadge: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  helperText: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 6,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#111827",
    paddingVertical: 0,
  },
  insumosListaContainer: {
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    paddingVertical: 4,
  },
  insumoChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  insumoChipActive: {
    backgroundColor: "#E0F2F1",
  },
  insumoChipText: {
    fontSize: 13,
    color: "#111827",
  },
  insumoChipTextActive: {
    fontWeight: "600",
    color: "#00695C",
  },
  consumoCard: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    padding: 10,
  },
  consumoTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
    color: "#111827",
  },
  consumoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  consumoLabel: {
    fontSize: 12,
    color: "#4B5563",
  },
  consumoValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  consumoDestinoItem: {
    fontSize: 12,
    color: "#374151",
  },
  emptyText: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 6,
  },
  solicitudItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  solicitudFecha: {
    fontSize: 12,
    color: "#4B5563",
  },
  solicitudDestino: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  solicitudDetalle: {
    fontSize: 12,
    color: "#4B5563",
  },
  solicitudEstado: {
    fontWeight: "600",
    color: "#111827",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 12,
  },
  legendContainer: {
    marginTop: 4,
    alignItems: "center", // centramos el bloque de leyenda
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // centramos cada fila
    marginBottom: 2,
  },
  legendColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#374151",
  },
});

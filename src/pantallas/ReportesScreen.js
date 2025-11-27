// src/pantallas/ReportesScreen.js
import React, { useEffect, useMemo, useState } from "react";
import EstadoBadge from "../componentes/EstadoBadge"; // ajusta la ruta si es diferente
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Modal,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons"; // 👈 ya no usamos AntDesign
import { tema } from "../tema";
import { listenSolicitudes } from "../firebase/firebaseApi";
import { LUGARES_ENTREGA } from "../constants/lugaresEntrega";

const RANGOS = [
  { id: "7d", label: "Últimos 7 días", dias: 7 },
  { id: "30d", label: "Últimos 30 días", dias: 30 },
  { id: "todo", label: "Todo", dias: null }, // 👈 "ver todo"
];

const screenWidth = Dimensions.get("window").width; // no se usa ahorita pero no estorba

// helper para quitar acentos y unificar búsqueda
const normalizeText = (str) =>
  (str ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

// (opcional) helper para estilos de estado si lo usas más adelante
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

const ReportesScreen = ({ navigation }) => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [filtroRango, setFiltroRango] = useState("7d");
  const [filtroDestino, setFiltroDestino] = useState("todos");

  const [insumoBusqueda, setInsumoBusqueda] = useState("");
  const [insumoSeleccionadoId, setInsumoSeleccionadoId] = useState(null);

  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [busquedaSolicitud, setBusquedaSolicitud] = useState(""); // 🔍 búsqueda de solicitudes

  // 🔹 modal de detalle de solicitud
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

  // 🔹 filtro por rango de fechas + destino
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
            (d) => d.id === filtroDestino // 👈 corregido: antes estaba filtroRango
          );
          if (!destinoObj || destinoObj.nombre !== s.destino) return false;
        }
      }
      return true;
    });
  }, [solicitudes, filtroRango, filtroDestino]);

  // 🔹 top insumos
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

  // 🔹 agregados por insumo (para búsqueda de consumo)
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

  // 🔹 lista de insumos para el buscador de consumo
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

  // 🔹 detalle de insumo seleccionado (consumo)
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

  // 🔹 filtro de estados SOLO problema, verificada y rechazada + búsqueda
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

  // 🔹 detalle para el modal de solicitud
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
        <View style={[styles.card, styles.cardElevated]}>
          <Text style={styles.cardTitle}>Filtros</Text>

          <Text style={styles.filterLabel}>Rango de fechas</Text>
          <View style={styles.chipRow}>
            {RANGOS.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={[
                  styles.chip,
                  filtroRango === r.id && {
                    ...styles.chipActive,
                    backgroundColor: ACCENT,
                  },
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
                filtroDestino === "todos" && {
                  ...styles.chipActive,
                  backgroundColor: ACCENT,
                },
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
                  filtroDestino === lugar.id && {
                    ...styles.chipActive,
                    backgroundColor: ACCENT,
                  },
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
                  <View
                    style={[styles.indexCircle, { backgroundColor: "#F1F8F7" }]}
                  >
                    <Text
                      style={[styles.indexCircleText, { color: ACCENT }]}
                    >
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

          {/* BUSCADOR */}
          <View style={[styles.searchRow, { backgroundColor: "#F6F9F8" }]}>
            <Feather name="search" size={16} color="#9CA3AF" />
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
                <Ionicons
                  name="close-circle-outline"
                  size={18}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            )}
          </View>

          {/* LISTA DE INSUMOS - CON SCROLL */}
          {insumosParaBusqueda.length > 0 && (
            <View style={styles.insumosListaContainer}>
              <ScrollView
                style={styles.insumosScroll}
                nestedScrollEnabled
                showsVerticalScrollIndicator={true}
              >
                {insumosParaBusqueda.map((i) => {
                  const isSelected = insumoSeleccionadoId === i.id;

                  return (
                    <TouchableOpacity
                      key={i.id}
                      style={[
                        styles.insumoChip,
                        isSelected && styles.insumoChipActive,
                      ]}
                      onPress={() => {
                        if (isSelected) {
                          setInsumoSeleccionadoId(null);
                          setInsumoBusqueda("");
                        } else {
                          setInsumoSeleccionadoId(i.id);
                          setInsumoBusqueda(i.nombre);
                        }
                      }}
                    >
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
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

                        <Text
                          style={[
                            styles.insumoChipText,
                            isSelected && styles.insumoChipTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {i.nombre}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* DETALLES DEL INSUMO */}
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

        {/* SOLICITUDES FILTRADAS */}
        <View style={[styles.card, styles.cardElevated]}>
          <Text style={styles.cardTitle}>Solicitudes filtradas</Text>
          <Text style={styles.cardSubtitleSmall}>
            {solicitudesFiltradasPorEstado.length} solicitudes en el periodo
            elegido
          </Text>

          {/* BUSCADOR DE SOLICITUDES */}
          <View
            style={[
              styles.searchRow,
              { backgroundColor: "#F6F9F8", marginTop: 6, marginBottom: 8 },
            ]}
          >
            <Feather name="search" size={16} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por usuario, insumo, destino, cirugía o fecha"
              placeholderTextColor="#9CA3AF"
              value={busquedaSolicitud}
              onChangeText={setBusquedaSolicitud}
              selectionColor={ACCENT}
            />
            {busquedaSolicitud.length > 0 && (
              <TouchableOpacity onPress={() => setBusquedaSolicitud("")}>
                <Ionicons
                  name="close-circle-outline"
                  size={18}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            )}
          </View>

          {/* CHIPS ESTADO */}
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

          {/* LISTA DE SOLICITUDES */}
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
                "Solicitud rápida";

              const items = s.items || [];

              return (
                <TouchableOpacity
                  key={s.id}
                  style={styles.solicitudItem}
                  activeOpacity={0.8}
                  onPress={() => {
                    setSolicitudSeleccionada(s);
                    setModalVisible(true);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.solicitudFecha}>{fechaTexto}</Text>
                    <Text style={styles.solicitudDestino}>
                      {destinoNombre}
                    </Text>

                    <Text style={styles.solicitudUsuario}>
                      Solicitó: {s.usuario || "Desconocido"}
                    </Text>

                    {/* todos los insumos */}
                    {items.length > 0 ? (
                      items.map((item, idx) => (
                        <Text key={idx} style={styles.solicitudInsumo}>
                          • {item.nombre || "Insumo"} × {item.cantidad ?? 0}
                        </Text>
                      ))
                    ) : (
                      <Text style={styles.solicitudInsumo}>Sin insumos</Text>
                    )}

                    {s.cirugia ? (
                      <Text style={styles.solicitudCirugia}>
                        Cirugía: {s.cirugia}
                      </Text>
                    ) : null}

                    <View style={{ marginTop: 4 }}>
                      <EstadoBadge estado={s.estado} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* MODAL DETALLE DE SOLICITUD */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={cerrarModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalle de solicitud</Text>
              <TouchableOpacity onPress={cerrarModal}>
                <Ionicons name="close" size={22} color="#4B5563" />
              </TouchableOpacity>
            </View>

            {solicitudSeleccionadaDetalle && (
              <ScrollView
                style={{ maxHeight: 400 }}
                showsVerticalScrollIndicator={true}
              >
                <Text style={styles.modalLabel}>
                  Fecha y hora:
                  <Text style={styles.modalValue}>
                    {" "}
                    {solicitudSeleccionadaDetalle.fechaTexto}
                  </Text>
                </Text>

                <Text style={styles.modalLabel}>
                  Destino:
                  <Text style={styles.modalValue}>
                    {" "}
                    {solicitudSeleccionadaDetalle.destinoNombre}
                  </Text>
                </Text>

                <Text style={styles.modalLabel}>
                  Usuario:
                  <Text style={styles.modalValue}>
                    {" "}
                    {solicitudSeleccionadaDetalle.usuario}
                  </Text>
                </Text>

                {solicitudSeleccionadaDetalle.cirugia && (
                  <Text style={styles.modalLabel}>
                    Cirugía:
                    <Text style={styles.modalValue}>
                      {" "}
                      {solicitudSeleccionadaDetalle.cirugia}
                    </Text>
                  </Text>
                )}

                <Text style={[styles.modalSectionTitle, { marginTop: 12 }]}>
                  Insumos solicitados
                </Text>

                {solicitudSeleccionadaDetalle.items.length > 0 ? (
                  solicitudSeleccionadaDetalle.items.map((item, idx) => (
                    <View key={idx} style={styles.modalItemRow}>
                      <Text style={styles.modalItemName}>
                        • {item.nombre || "Insumo"}
                      </Text>
                      <Text style={styles.modalItemQty}>
                        × {item.cantidad ?? 0}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.modalValue}>Sin insumos</Text>
                )}

                <View style={{ marginTop: 16 }}>
                  <Text style={styles.modalLabel}>
                    Estado:
                    <Text style={styles.modalValue}>
                      {" "}
                      {solicitudSeleccionadaDetalle.estado || "-"}
                    </Text>
                  </Text>
                </View>
              </ScrollView>
            )}

            <TouchableOpacity style={styles.modalCloseButton} onPress={cerrarModal}>
              <Text style={styles.modalCloseButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  // 👇 altura limitada para que se vean ~3 ítems y luego haya scroll
  insumosScroll: {
    maxHeight: 140,
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
  solicitudUsuario: {
    fontSize: 13,
    color: "#4B5563",
    marginTop: 2,
  },
  solicitudInsumo: {
    fontSize: 13,
    color: "#4B5563",
    marginTop: 2,
  },
  solicitudCirugia: {
    fontSize: 13,
    color: "#4B5563",
    marginTop: 2,
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

  // 🔹 estilos modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  modalCard: {
    width: "100%",
    maxHeight: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  modalLabel: {
    fontSize: 13,
    color: "#4B5563",
    marginTop: 4,
  },
  modalValue: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "500",
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginTop: 4,
    marginBottom: 4,
  },
  modalItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  modalItemName: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
    paddingRight: 8,
  },
  modalItemQty: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "600",
  },
  modalCloseButton: {
    marginTop: 10,
    borderRadius: 999,
    backgroundColor: "#111827",
    paddingVertical: 10,
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});

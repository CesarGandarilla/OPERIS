// src/pantallas/MovimientosScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../auth/AuthContext";
import { listenSolicitudes } from "../firebase/firebaseApi";
import { getDateFromField, formatFechaNecesaria } from "../utils/fechaUtils";
import { tema } from "../tema";

// Colores limpios e iOS
const INK = tema?.colores?.ink || "#111827";

// Badge color por estado
const getColor = (estado) => {
  switch (estado) {
    case "Pendiente":
      return "#9CA3AF";
    case "Aceptada":
      return "#3B82F6";
    case "Rechazada":
      return "#EF4444";
    case "Lista":
      return "#10B981";
    case "Verificada":
      return "#22C55E";
    case "Problema":
      return "#F59E0B";
    default:
      return "#6B7280";
  }
};

/** Dropdown genérico para filtros */
function DropdownFiltro({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.filtrosSection}>
      <Text style={styles.filtroLabel}>{label}</Text>

      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setOpen((prev) => !prev)}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.dropdownValue,
            !value && styles.dropdownPlaceholder,
          ]}
          numberOfLines={1}
        >
          {value || "Selecciona..."}
        </Text>
        <Feather
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color="#6B7280"
        />
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdownOptions}>
          {options.map((op) => (
            <TouchableOpacity
              key={op}
              style={styles.dropdownOption}
              onPress={() => {
                onChange(op);
                setOpen(false);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.dropdownOptionText,
                  op === value && styles.dropdownOptionTextActivo,
                ]}
              >
                {op}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function MovimientosScreen() {
  const route = useRoute();
  const { user } = useAuth();
  const usuario = user?.profile?.email;
  const rol = user?.profile?.role?.toLowerCase();

  // estado inicial que viene del panel (ej. "Problema", "Verificada")
  const estadoInicial = route.params?.estadoInicial || "Todos";

  const [solicitudes, setSolicitudes] = useState([]);
  const [filtro, setFiltro] = useState(estadoInicial);      // filtro por estado
  const [filtroFecha, setFiltroFecha] = useState("Todos");  // filtro por fecha
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // si cambian los params (por ejemplo, vienes del panel con otro estado) actualizamos el filtro
  useEffect(() => {
    setFiltro(estadoInicial);
  }, [estadoInicial]);

  // ESTADOS DEL FILTRO
  const estados = [
    "Todos",
    "Pendiente",
    "Aceptada",
    "Rechazada",
    "Lista",
    "Verificada",
    "Problema",
  ];

  // OPCIONES DE FECHA
  const filtrosFecha = [
    "Todos",
    "Hoy",
    "Últimos 3 días",
    "Última semana",
    "Último mes",
  ];

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenSolicitudes((data) => {
      setSolicitudes(data);
      setLoading(false);
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  // Filtrar por usuario (si no es CEYE)
  const movimientosUser =
    rol === "ceye"
      ? solicitudes
      : solicitudes.filter((s) => s.usuario === usuario);

  // Filtrar por estado
  const movimientosEstado =
    filtro === "Todos"
      ? movimientosUser
      : movimientosUser.filter((s) => s.estado === filtro);

  // Filtrar por fecha de creación
  const inicioDeHoy = new Date();
  inicioDeHoy.setHours(0, 0, 0, 0);

  const movimientosFecha = movimientosEstado.filter((s) => {
    if (filtroFecha === "Todos") return true;

    const fecha = getDateFromField(s.creadoEn);
    if (!fecha) return false; // si no tiene fecha, no entra en filtros específicos

    // normalizamos la fecha del movimiento al inicio del día
    const fechaDia = new Date(fecha);
    fechaDia.setHours(0, 0, 0, 0);

    const limite = new Date();
    limite.setHours(0, 0, 0, 0);

    switch (filtroFecha) {
      case "Hoy":
        return fechaDia.getTime() === inicioDeHoy.getTime();

      case "Últimos 3 días":
        limite.setDate(limite.getDate() - 2); // hoy + 2 días atrás = 3 días contando hoy
        return fechaDia >= limite && fechaDia <= inicioDeHoy;

      case "Última semana":
        limite.setDate(limite.getDate() - 6); // 7 días contando hoy
        return fechaDia >= limite && fechaDia <= inicioDeHoy;

      case "Último mes":
        limite.setDate(limite.getDate() - 29); // 30 días contando hoy
        return fechaDia >= limite && fechaDia <= inicioDeHoy;

      default:
        return true;
    }
  });

  // Filtrar por texto (sobre lo ya filtrado por estado + fecha)
  const searchLower = search.toLowerCase();
  const movimientosFiltrados = movimientosFecha.filter((s) => {
    const usuarioStr = (s.usuario || "").toLowerCase();
    const itemsStr = (s.items || [])
      .map((i) => i.nombre?.toLowerCase() || "")
      .join(" ");
    const destinoStr = (s.destino || "").toLowerCase();
    const cirugiaStr = (s.cirugia || "").toLowerCase();

    return (
      usuarioStr.includes(searchLower) ||
      itemsStr.includes(searchLower) ||
      destinoStr.includes(searchLower) ||
      cirugiaStr.includes(searchLower)
    );
  });

  const renderItem = ({ item }) => {
    const fechaNecesariaTexto = formatFechaNecesaria(item.fechaNecesaria);
    const fechaCreacionDate = getDateFromField(item.creadoEn);
    const fechaCreacionTexto = fechaCreacionDate
      ? fechaCreacionDate.toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "Sin fecha";

    return (
      <View
        style={[
          styles.card,
          { borderLeftColor: getColor(item.estado) },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            Solicitud de {item.usuario || "Desconocido"}
          </Text>

          {/* Badge de estado estilo iOS */}
          <View
            style={[
              styles.estadoBadge,
              { backgroundColor: `${getColor(item.estado)}20` },
            ]}
          >
            <View
              style={[
                styles.estadoDot,
                { backgroundColor: getColor(item.estado) },
              ]}
            />
            <Text
              style={[
                styles.estadoText,
                { color: getColor(item.estado) },
              ]}
            >
              {item.estado}
            </Text>
          </View>
        </View>

        {/* Destino y cirugía */}
        {(item.destino || item.cirugia) && (
          <View style={{ marginTop: 4 }}>
            {item.destino && (
              <Text style={styles.destinoText}>{item.destino}</Text>
            )}
            {item.cirugia && (
              <Text style={styles.cirugiaText}>{item.cirugia}</Text>
            )}
          </View>
        )}

        {/* Fecha necesaria */}
        {fechaNecesariaTexto && (
          <Text style={styles.fechaNecesaria}>
            Necesario: {fechaNecesariaTexto}
          </Text>
        )}

        {/* Items */}
        <View style={styles.itemsContainer}>
          {item.items?.map((i, idx) => (
            <Text key={idx} style={styles.item}>
              • {i.nombre} × {i.cantidad}
            </Text>
          ))}
        </View>

        {/* Fecha */}
        <Text style={styles.fechaCreacion}>
          Creado: {fechaCreacionTexto}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        {/* Título */}
        <Text style={styles.title}>Movimientos</Text>

        {/* Búsqueda */}
        <TextInput
          placeholder="Buscar usuario, insumo, destino o cirugía..."
          style={styles.searchBar}
          value={search}
          onChangeText={setSearch}
        />

        {/* Filtro de estados */}
        <DropdownFiltro
          label="Estado"
          value={filtro}
          options={estados}
          onChange={setFiltro}
        />

        {/* Filtro por fecha */}
        <DropdownFiltro
          label="Fecha"
          value={filtroFecha}
          options={filtrosFecha}
          onChange={setFiltroFecha}
        />

        {loading ? (
          <Text style={styles.loadingText}>Cargando...</Text>
        ) : (
          <FlatList
            data={movimientosFiltrados}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingBottom: 30,
              paddingTop: 4,
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No hay movimientos con este filtro.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#F8F9FB" },
  container: { flex: 1, padding: 14 },

  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 8,
    color: INK,
  },

  searchBar: {
    backgroundColor: "#F2F2F6",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  // sección de filtros
  filtrosSection: {
    marginBottom: 8,
  },

  filtroLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
    marginLeft: 2,
  },

  // dropdown
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dropdownValue: {
    fontSize: 13,
    color: INK,
    flex: 1,
    marginRight: 6,
  },
  dropdownPlaceholder: {
    color: "#9CA3AF",
  },
  dropdownOptions: {
    marginTop: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  dropdownOption: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dropdownOptionText: {
    fontSize: 13,
    color: "#4B5563",
  },
  dropdownOptionTextActivo: {
    fontWeight: "600",
    color: INK,
  },

  /* TARJETAS iOS */
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: INK,
    flex: 1,
    marginRight: 12,
  },

  estadoBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },

  estadoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  estadoText: {
    fontSize: 12,
    fontWeight: "700",
  },

  destinoText: {
    fontSize: 13,
    fontWeight: "600",
    color: INK,
  },
  cirugiaText: {
    fontSize: 12,
    color: "#4B5563",
  },

  fechaNecesaria: {
    marginTop: 6,
    fontSize: 12,
    color: "#6B7280",
  },

  itemsContainer: { marginTop: 6 },
  item: {
    fontSize: 12,
    color: "#4B5563",
    marginVertical: 1,
  },

  fechaCreacion: {
    marginTop: 8,
    fontSize: 11,
    color: "#9CA3AF",
  },

  emptyContainer: {
    marginTop: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
  },

  loadingText: {
    textAlign: "center",
    marginTop: 20,
    color: "#6B7280",
  },
});

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
import { useAuth } from "../auth/AuthContext";
import { listenSolicitudes } from "../firebase/firebaseApi";
import {
  getDateFromField,
  formatFechaNecesaria,
} from "../utils/fechaUtils";

// Colores por estado de la solicitud
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

export default function MovimientosScreen() {
  const { user } = useAuth();

  const usuario = user?.profile?.email;
  const rol = user?.profile?.role?.toLowerCase();

  const [solicitudes, setSolicitudes] = useState([]);
  const [filtro, setFiltro] = useState("Todos");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenSolicitudes((data) => {
      setSolicitudes(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 1) Filtrar por usuario
  const movimientosUser =
    rol === "ceye"
      ? solicitudes
      : solicitudes.filter((s) => s.usuario === usuario);

  // 2) Filtrar por estado
  const movimientosEstado =
    filtro === "Todos"
      ? movimientosUser
      : movimientosUser.filter((s) => s.estado === filtro);

  // 3) Filtrar por búsqueda (usuario, insumos, destino, cirugía)
  const searchLower = search.toLowerCase();
  const movimientosFiltrados = movimientosEstado.filter((s) => {
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

  const estados = [
    "Todos",
    "Pendiente",
    "Aceptada",
    "Rechazada",
    "Lista",
    "Verificada",
    "Problema",
  ];

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
      <View style={[styles.card, { borderLeftColor: getColor(item.estado) }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.titulo}>
            Solicitud de {item.usuario || "Desconocido"}
          </Text>
          <Text style={[styles.estado, { color: getColor(item.estado) }]}>
            {item.estado}
          </Text>
        </View>

        {/* Destino y cirugía, igual que en Solicitudes */}
        {(item.destino || item.cirugia) && (
          <View style={{ marginTop: 2 }}>
            {item.destino && (
              <Text style={styles.destinoText}>{item.destino}</Text>
            )}
            {item.cirugia && (
              <Text style={styles.cirugiaText}>{item.cirugia}</Text>
            )}
          </View>
        )}

        {/* Fecha necesaria si existe */}
        {fechaNecesariaTexto && (
          <Text style={styles.fechaNecesariaText}>
            Necesario: {fechaNecesariaTexto}
          </Text>
        )}

        <View style={styles.itemsContainer}>
          {item.items?.map((i, idx) => (
            <Text key={idx} style={styles.item}>
              • {i.nombre} × {i.cantidad}
            </Text>
          ))}
        </View>

        <Text style={styles.fecha}>
          Creado: {fechaCreacionTexto}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        {/* 🔹 Encabezado simple, como Inventario */}
        <Text style={styles.title}>Movimientos</Text>

        {/* Barra de búsqueda */}
        <TextInput
          placeholder="Buscar por usuario, insumo, destino o cirugía..."
          style={styles.searchBar}
          value={search}
          onChangeText={setSearch}
        />

        {/* Filtros por estado */}
        <View style={styles.filtrosContainer}>
          {estados.map((e) => {
            const activo = filtro === e;
            return (
              <TouchableOpacity
                key={e}
                style={[
                  styles.filtroBtn,
                  activo && styles.filtroBtnActivo,
                ]}
                onPress={() => setFiltro(e)}
              >
                <Text
                  style={[
                    styles.filtroText,
                    activo && styles.filtroTextActivo,
                  ]}
                >
                  {e}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Cargando...</Text>
        ) : (
          <FlatList
            data={movimientosFiltrados}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingBottom: 20,
              flexGrow: movimientosFiltrados.length === 0 ? 1 : 0,
              justifyContent:
                movimientosFiltrados.length === 0 ? "center" : "flex-start",
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
  safeContainer: { flex: 1, backgroundColor: "#f8f8f8" },
  container: { flex: 1, padding: 10 },

  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
    color: "#111",
  },

  searchBar: {
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  filtrosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  filtroBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#fff",
    marginRight: 8,
    marginBottom: 8,
  },
  filtroBtnActivo: {
    backgroundColor: "#00bfa5",
    borderColor: "#00bfa5",
  },
  filtroText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
  filtroTextActivo: {
    color: "#fff",
    fontWeight: "700",
  },

  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginVertical: 6,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  titulo: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  estado: {
    fontSize: 12,
    fontWeight: "700",
  },

  destinoText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  cirugiaText: {
    fontSize: 12,
    color: "#4B5563",
  },
  fechaNecesariaText: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
  },

  itemsContainer: {
    marginTop: 4,
  },
  item: {
    fontSize: 12,
    color: "#4B5563",
    marginVertical: 1,
  },
  fecha: {
    marginTop: 6,
    fontSize: 11,
    color: "#9CA3AF",
  },

  loadingText: {
    textAlign: "center",
    marginTop: 20,
    color: "#666",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    color: "#888",
    fontSize: 14,
  },
});

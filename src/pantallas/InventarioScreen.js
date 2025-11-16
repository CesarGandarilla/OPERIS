// InventarioScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/inventarios";
import HeaderInventario from "../componentes/HeaderInventario";
import FiltrosInventario from "../componentes/FiltrosInventario";
import FiltrosEstado from "../componentes/FiltrosEstado";   // 👈 nuevo
import InsumoCard from "../componentes/InsumoCard";
import AgregarInsumoModal from "../componentes/AgregarInsumoModal";
import EditarInsumoModal from "../componentes/EditarInsumoModal";

// 🔹 función auxiliar para clasificar el estado de stock
const getEstadoStock = (item) => {
  const stock = item.stock ?? 0;
  const stockCritico = item.stockCritico ?? 0;

  if (stock === 0) return "AGOTADO";
  if (stockCritico <= 0) return "DESCONOCIDO";

  const stockBajo = stockCritico * 2;

  if (stock > 0 && stock <= stockCritico) return "CRITICO";
  if (stock > stockCritico && stock <= stockBajo) return "BAJO";
  return "DISPONIBLE";
};

export default function InventarioScreen() {
  const [filtro, setFiltro] = useState("Todos");            // categoría
  const [estadoFiltro, setEstadoFiltro] = useState("Todos"); // estado de stock
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [insumos, setInsumos] = useState([]);

  const [mostrarModalAgregar, setMostrarModalAgregar] = useState(false);
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [insumoSeleccionado, setInsumoSeleccionado] = useState(null);

  // Tiempo real de Firebase
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "insumos"), orderBy("fechaIngreso", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setInsumos(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error al cargar insumos:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  // Filtrado y búsqueda
  const searchLower = search.toLowerCase();

  const insumosFiltrados = insumos.filter((item) => {
    const nombre = (item.nombre || "").toLowerCase();
    const categoria = item.categoria || "";
    const estado = getEstadoStock(item);

    const coincideBusqueda = nombre.includes(searchLower);

    // filtro por categoría
    const coincideCategoria =
      filtro === "Todos" || categoria === filtro;

    // filtro por estado de stock (usa lo que viene de FiltrosEstado)
    const coincideEstado =
      estadoFiltro === "Todos" ||
      (estadoFiltro === "Agotado" && estado === "AGOTADO") ||
      (estadoFiltro === "Crítico" && estado === "CRITICO") ||
      (estadoFiltro === "Bajo" && estado === "BAJO") ||
      (estadoFiltro === "Crítico+Bajo" &&
        (estado === "CRITICO" || estado === "BAJO"));

    return coincideBusqueda && coincideCategoria && coincideEstado;
  });

  // Abrir modal de edición
  const handleEdit = (insumo) => {
    setInsumoSeleccionado(insumo);
    setModalEditarVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        {/* Botón agregar */}
        <HeaderInventario agregarInsumo={() => setMostrarModalAgregar(true)} />

        {/* Barra de búsqueda */}
        <TextInput
          placeholder="Buscar insumos..."
          style={styles.searchBar}
          value={search}
          onChangeText={setSearch}
        />

        {/* Filtro por categoría */}
        <View style={{ marginBottom: 6 }}>
          <FiltrosInventario filtro={filtro} setFiltro={setFiltro} />
        </View>

        {/* Filtro por estado de stock */}
        <FiltrosEstado estado={estadoFiltro} setEstado={setEstadoFiltro} />

        {loading ? (
          <Text style={styles.loadingText}>Cargando...</Text>
        ) : (
          <FlatList
            data={insumosFiltrados}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <InsumoCard item={item} onEdit={handleEdit} />
            )}
            contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No se encontraron insumos.
                </Text>
              </View>
            }
          />
        )}

        {/* Modal para agregar insumo */}
        <AgregarInsumoModal
          visible={mostrarModalAgregar}
          onClose={() => setMostrarModalAgregar(false)}
        />

        {/* Modal para editar insumo */}
        <EditarInsumoModal
          visible={modalEditarVisible}
          onClose={() => setModalEditarVisible(false)}
          insumo={insumoSeleccionado}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#f8f8f8" },
  container: { flex: 1, padding: 10 },
  searchBar: {
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  loadingText: {
    textAlign: "center",
    marginTop: 20,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    color: "#888",
    fontSize: 14,
  },
});

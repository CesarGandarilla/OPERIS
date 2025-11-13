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
import InsumoCard from "../componentes/InsumoCard";
import AgregarInsumoModal from "../componentes/AgregarInsumoModal";
import EditarInsumoModal from "../componentes/EditarInsumoModal";

export default function InventarioScreen() {
  const [filtro, setFiltro] = useState("Todos");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [insumos, setInsumos] = useState([]);

  const [mostrarModalAgregar, setMostrarModalAgregar] = useState(false);
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [insumoSeleccionado, setInsumoSeleccionado] = useState(null);

  // Tiempo real de Firebase
  useEffect(() => {
    const q = query(collection(db, "insumos"), orderBy("fechaIngreso", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setInsumos(data);
    });
    return unsubscribe;
  }, []);

  // Filtrado y búsqueda
  const insumosFiltrados = insumos.filter((item) => {
    const coincideBusqueda = item.nombre
      .toLowerCase()
      .includes(search.toLowerCase());
    const coincideFiltro = filtro === "Todos" || item.categoria === filtro;
    return coincideBusqueda && coincideFiltro;
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

        {/* Menú de filtros */}
        <View style={{ marginBottom: 10 }}>
          <FiltrosInventario filtro={filtro} setFiltro={setFiltro} />
        </View>

        {loading ? (
          <Text style={{ textAlign: "center", marginTop: 20 }}>Cargando...</Text>
        ) : (
          <FlatList
            data={insumosFiltrados}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <InsumoCard item={item} onEdit={handleEdit} />
            )}
            contentContainerStyle={{ paddingBottom: 20 }}
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
});

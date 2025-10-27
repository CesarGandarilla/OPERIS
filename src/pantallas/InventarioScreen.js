// src/pantallas/InventarioScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { db } from '../firebase/inventarios';
import { collection, getDocs, updateDoc, doc, deleteDoc, addDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function InventarioScreen() {
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState('Todos');

  const insumoCollection = collection(db, 'insumos');

  const fetchInsumos = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(insumoCollection);
      const lista = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setInsumos(lista);
    } catch (error) {
      console.error('Error al obtener insumos:', error);
      Alert.alert('Error', 'No se pudieron cargar los insumos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // console.log("Firestore projectId:", db.app.options.projectId);
    fetchInsumos();
  }, []);

  const agregarInsumo = async () => {
    const nuevo = {
      nombre: 'Nuevo insumo',
      categoria: 'General',   // coincide con filtros
      stock: 0,
      codigo: 'X-00',
      estado: 'Normal',
    };
    try {
      const ref = await addDoc(insumoCollection, nuevo);
      // console.log('✅ Creado con id:', ref.id);
      await fetchInsumos();
      Alert.alert('Listo', 'Insumo agregado.');
    } catch (e) {
      console.error('Error agregando insumo:', e);
      Alert.alert('Error', 'No se pudo agregar el insumo.');
    }
  };

  const actualizarStock = async (id, stock) => {
    const docRef = doc(db, 'insumos', id);
    try {
      await updateDoc(docRef, { stock: Number(stock) });
      await fetchInsumos();
    } catch (e) {
      console.error('Error actualizando stock:', e);
      Alert.alert('Error', 'No se pudo actualizar el stock.');
    }
  };

  const eliminarInsumo = (id) => {
    Alert.alert('Eliminar insumo', '¿Seguro que deseas eliminar este insumo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'insumos', id));
            await fetchInsumos();
          } catch (e) {
            console.error('Error eliminando insumo:', e);
            Alert.alert('Error', 'No se pudo eliminar el insumo.');
          }
        },
      },
    ]);
  };

  const coloresEstado = {
    Normal: '#4CAF50',
    Bajo: '#FFC107',
    Crítico: '#F44336',
  };

  const insumosFiltrados = insumos.filter((i) => {
    const coincideTexto = (i.nombre || '').toLowerCase().includes(search.toLowerCase());
    const coincideCategoria =
      filtro === 'Todos' || (i.categoria || '').toLowerCase() === filtro.toLowerCase();
    return coincideTexto && coincideCategoria;
  });

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name="cube-outline" size={32} color="#bbb" />
        </View>
      </View>
      <View style={styles.cardCenter}>
        <Text style={styles.nombre}>{item.nombre}</Text>
        <Text style={styles.categoria}>{item.categoria}</Text>
        <View style={styles.estadoContainer}>
          <View
            style={[
              styles.estadoBadge,
              { backgroundColor: coloresEstado[item.estado] || '#999' },
            ]}
          >
            <Text style={styles.estadoTexto}>{item.estado}</Text>
          </View>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.stock}>Stock: {item.stock}</Text>
        <Text style={styles.codigo}>{item.codigo}</Text>
        <View style={styles.botones}>
          <TouchableOpacity onPress={() => actualizarStock(item.id, item.stock + 1)}>
            <Ionicons name="add-circle-outline" size={22} color="#0a84ff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => actualizarStock(item.id, Math.max(0, item.stock - 1))}>
            <Ionicons name="remove-circle-outline" size={22} color="#0a84ff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => eliminarInsumo(item.id)}>
            <Ionicons name="trash-outline" size={22} color="#f44336" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Encabezado (solo título) */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventario</Text>
      </View>

      {/* Barra de búsqueda */}
      <TextInput
        placeholder="Buscar insumos..."
        style={styles.searchBar}
        value={search}
        onChangeText={setSearch}
      />

      {/* Filtros */}
      <View style={styles.filterContainer}>
        {['Todos', 'General', 'Quirúrgico', 'Protección'].map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterButton, filtro === cat && styles.filterButtonActive]}
            onPress={() => setFiltro(cat)}
          >
            <Text style={[styles.filterText, filtro === cat && styles.filterTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista */}
      {loading ? (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>Cargando...</Text>
      ) : (
        <FlatList
          data={insumosFiltrados}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 120 }}  // espacio para el FAB
        />
      )}

      {/* FAB: Botón flotante abajo-derecha */}
      <TouchableOpacity
        style={styles.fab}
        onPress={agregarInsumo}
        activeOpacity={0.9}
      >
        <Ionicons name="add" size={28} color="#fff" />
        <Text style={styles.fabText}>Agregar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', padding: 15 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },

  searchBar: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  filterContainer: { flexDirection: 'row', marginBottom: 10 },
  filterButton: {
    backgroundColor: '#eee',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  filterButtonActive: { backgroundColor: '#0a84ff' },
  filterText: { color: '#333', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardLeft: { justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  iconContainer: {
    backgroundColor: '#f1f1f1',
    padding: 10,
    borderRadius: 10,
  },
  cardCenter: { flex: 1, justifyContent: 'center' },
  nombre: { fontWeight: 'bold', fontSize: 15 },
  categoria: { color: '#888', marginVertical: 2 },
  estadoContainer: { marginTop: 4 },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  estadoTexto: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  cardRight: { justifyContent: 'center', alignItems: 'flex-end' },
  stock: { fontWeight: 'bold', fontSize: 14 },
  codigo: { color: '#888', fontSize: 12 },
  botones: { flexDirection: 'row', marginTop: 5 },

  // FAB
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    backgroundColor: '#0a84ff',
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  fabText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
});

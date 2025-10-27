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
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { db } from '../firebase/inventarios';
import { collection, getDocs, updateDoc, doc, deleteDoc, addDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

const CATS = ['General', 'Quirúrgico', 'Protección'];
const ESTADOS = ['Normal', 'Bajo', 'Crítico'];

export default function InventarioScreen() {
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState('Todos');

  // Modal + formulario para crear
  const [modalVisible, setModalVisible] = useState(false);
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('General');
  const [codigo, setCodigo] = useState('');
  const [stock, setStock] = useState('0');
  const [estado, setEstado] = useState('Normal');

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
    fetchInsumos();
  }, []);

  // Abre el modal con valores “base” pero editables
  const abrirCrear = () => {
    setNombre('');
    setCategoria('General');
    setCodigo('');
    setStock('0');
    setEstado('Normal');
    setModalVisible(true);
  };

  // Guardar (crear) con los valores del formulario
  const crearInsumo = async () => {
    if (!nombre.trim()) return Alert.alert('Faltan datos', 'Escribe el nombre del insumo.');
    if (!codigo.trim()) return Alert.alert('Faltan datos', 'Escribe el código.');
    const stockNum = Number(stock);
    if (Number.isNaN(stockNum) || stockNum < 0) {
      return Alert.alert('Dato inválido', 'El stock debe ser un número mayor o igual a 0.');
    }

    const nuevo = {
      nombre: nombre.trim(),
      categoria,
      stock: stockNum,
      codigo: codigo.trim(),
      estado,
    };

    try {
      await addDoc(insumoCollection, nuevo);
      setModalVisible(false);
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
          <TouchableOpacity onPress={() => actualizarStock(item.id, (item.stock || 0) + 1)}>
            <Ionicons name="add-circle-outline" size={22} color="#0a84ff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => actualizarStock(item.id, Math.max(0, (item.stock || 0) - 1))}>
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
      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventario</Text>
      </View>

      {/* Búsqueda */}
      <TextInput
        placeholder="Buscar insumos..."
        style={styles.searchBar}
        value={search}
        onChangeText={setSearch}
      />

      {/* Filtros */}
      <View style={styles.filterContainer}>
        {['Todos', ...CATS].map((cat) => (
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
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}

      {/* FAB -> abre modal de creación */}
      <TouchableOpacity style={styles.fab} onPress={abrirCrear} activeOpacity={0.9}>
        <Ionicons name="add" size={28} color="#fff" />
        <Text style={styles.fabText}>Agregar</Text>
      </TouchableOpacity>

      {/* MODAL: Formulario para crear antes de guardar */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalRoot}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nuevo insumo</Text>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej. Bata estéril"
              style={styles.input}
            />

            <Text style={styles.label}>Categoría</Text>
            <View style={styles.rowWrap}>
              {CATS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, categoria === c && styles.chipActive]}
                  onPress={() => setCategoria(c)}
                >
                  <Text style={[styles.chipText, categoria === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Código</Text>
            <TextInput
              value={codigo}
              onChangeText={setCodigo}
              placeholder="Ej. BQ-01"
              style={styles.input}
              autoCapitalize="characters"
            />

            <Text style={styles.label}>Stock</Text>
            <TextInput
              value={stock}
              onChangeText={setStock}
              placeholder="0"
              style={styles.input}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Estado</Text>
            <View style={styles.rowWrap}>
              {ESTADOS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.chip, estado === e && styles.chipActive]}
                  onPress={() => setEstado(e)}
                >
                  <Text style={[styles.chipText, estado === e && styles.chipTextActive]}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => setModalVisible(false)}>
              <Text style={styles.btnTextSecondary}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={crearInsumo}>
              <Text style={styles.btnTextPrimary}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  filterContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  filterButton: {
    backgroundColor: '#eee',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 6,
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
  iconContainer: { backgroundColor: '#f1f1f1', padding: 10, borderRadius: 10 },
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
  botones: { flexDirection: 'row', marginTop: 5, alignItems: 'center', gap: 6 },

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
  fabText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },

  // Modal
  modalRoot: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalBody: { padding: 16, paddingBottom: 24 },
  label: { fontSize: 12, color: '#666', marginTop: 8, marginBottom: 4 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#0a84ff',
    borderColor: '#0a84ff',
  },
  chipText: { color: '#333', fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  btnPrimary: { backgroundColor: '#0a84ff' },
  btnSecondary: { backgroundColor: '#eee' },
  btnTextPrimary: { color: '#fff', fontWeight: 'bold' },
  btnTextSecondary: { color: '#333', fontWeight: 'bold' },
});

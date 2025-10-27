// src/pantallas/InventarioScreen.js
import React, { useEffect, useState, useCallback } from 'react';
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
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { tema } from '../tema';

import { db } from '../firebase/inventarios';
import { collection, getDocs, updateDoc, doc, deleteDoc, addDoc } from 'firebase/firestore';

const CATS = ['General', 'Quirúrgico', 'Protección'];
const ESTADOS = ['Normal', 'Bajo', 'Crítico'];

export default function InventarioScreen() {
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInsumos();
    setRefreshing(false);
  }, []);

  const abrirCrear = () => {
    setNombre('');
    setCategoria('General');
    setCodigo('');
    setStock('0');
    setEstado('Normal');
    setModalVisible(true);
  };

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
    Normal: tema.colores?.ok || '#4CAF50',
    Bajo: tema.colores?.warning || '#FFC107',
    Crítico: tema.colores?.danger || '#F44336',
  };

  const insumosFiltrados = insumos.filter((i) => {
    const coincideTexto = (i.nombre || '').toLowerCase().includes(search.toLowerCase());
    const coincideCategoria =
      filtro === 'Todos' || (i.categoria || '').toLowerCase() === filtro.toLowerCase();
    return coincideTexto && coincideCategoria;
  });

  const EmptyState = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIcon}>
        <Ionicons name="cube-outline" size={36} color={tema.colores.sub} />
      </View>
      <Text style={styles.emptyTitle}>Sin resultados</Text>
      <Text style={styles.emptyText}>
        {search ? 'No hay insumos que coincidan con tu búsqueda.' : 'Aún no has agregado insumos.'}
      </Text>
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name="cube-outline" size={28} color={tema.colores.sub} />
        </View>
      </View>

      <View style={styles.cardCenter}>
        <View style={styles.nameRow}>
          <Text style={styles.nombre} numberOfLines={1}>{item.nombre}</Text>
          <View style={[styles.dot, { backgroundColor: coloresEstado[item.estado] || '#999' }]} />
        </View>
        <Text style={styles.categoria}>{item.categoria}</Text>
        <View style={styles.badgesRow}>
          <View style={[styles.badge, { backgroundColor: (coloresEstado[item.estado] + '22') || '#eee' }]}>
            <Ionicons name="pulse-outline" size={14} color={coloresEstado[item.estado]} />
            <Text style={[styles.badgeText, { color: coloresEstado[item.estado] }]}>{item.estado}</Text>
          </View>
          <View style={styles.badgeLight}>
            <Ionicons name="pricetag-outline" size={14} color={tema.colores.sub} />
            <Text style={[styles.badgeText, { color: tema.colores.sub }]}>{item.codigo}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardRight}>
        <Text style={styles.stockLabel}>Stock</Text>
        <Text style={styles.stockValue}>{item.stock}</Text>
        <View style={styles.botones}>
          <TouchableOpacity onPress={() => actualizarStock(item.id, (item.stock || 0) + 1)}>
            <Ionicons name="add-circle" size={22} color={tema.colores.teal} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => actualizarStock(item.id, Math.max(0, (item.stock || 0) - 1))}>
            <Ionicons name="remove-circle" size={22} color={tema.colores.teal} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => eliminarInsumo(item.id)}>
            <Ionicons name="trash-outline" size={22} color={tema.colores.danger || '#f44336'} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tema.colores.fondo || '#f7f9fb' }]}>
      <View style={[styles.container]}>
        {/* Header (más padding top para que se vea siempre) */}
        <View style={[styles.header, { borderBottomColor: tema.colores.border, marginTop: 8 }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: tema.colores.teal }]}>Inventario</Text>
            <View style={[styles.counterPill, { backgroundColor: tema.colores.teal + '22' }]}>
              <Ionicons name="list-outline" size={14} color={tema.colores.teal} />
              <Text style={[styles.counterText, { color: tema.colores.teal }]}>
                {insumos.length}
              </Text>
            </View>
          </View>
          {/* Botón superior de agregar removido como pediste */}
          <View style={{ width: 1 }} />
        </View>

        {/* Search */}
        <View style={[styles.searchWrap, { borderColor: tema.colores.border, backgroundColor: '#fff' }]}>
          <Ionicons name="search-outline" size={18} color={tema.colores.sub} />
          <TextInput
            placeholder="Buscar insumos..."
            placeholderTextColor={tema.colores.sub}
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close" size={18} color={tema.colores.sub} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filtros */}
        <View style={styles.filterContainer}>
          {['Todos', ...CATS].map((cat) => {
            const active = filtro === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterButton,
                  { borderColor: tema.colores.border },
                  active && { backgroundColor: tema.colores.teal, borderColor: tema.colores.teal },
                ]}
                onPress={() => setFiltro(cat)}
              >
                <Text style={[styles.filterText, active ? { color: '#fff' } : { color: tema.colores.texto || '#333' }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Lista */}
        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 20, color: tema.colores.sub }}>Cargando...</Text>
        ) : (
          <FlatList
            data={insumosFiltrados}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListEmptyComponent={<EmptyState />}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tema.colores.teal} />}
            contentContainerStyle={{ paddingBottom: 120 }}
          />
        )}

        {/* FAB (único botón de agregar) */}
        <TouchableOpacity style={[styles.fab, { backgroundColor: tema.colores.teal }]} onPress={abrirCrear} activeOpacity={0.92}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.fabText}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.modalRoot, { backgroundColor: '#fff' }]}
        >
          {/* Header modal */}
          <View style={[styles.modalHeader, { borderBottomColor: tema.colores.border }]}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setModalVisible(false)}>
              <Ionicons name="chevron-back" size={22} color={tema.colores.sub} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: tema.colores.teal }]}>Nuevo insumo</Text>
            <View style={{ width: 32 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej. Bata estéril"
              placeholderTextColor={tema.colores.sub}
              style={[styles.input, { borderColor: tema.colores.border }]}
            />

            <Text style={styles.label}>Categoría</Text>
            <View style={styles.rowWrap}>
              {CATS.map((c) => {
                const active = categoria === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.chip,
                      { borderColor: tema.colores.border },
                      active && { backgroundColor: tema.colores.teal, borderColor: tema.colores.teal },
                    ]}
                    onPress={() => setCategoria(c)}
                  >
                    <Text style={[styles.chipText, active ? { color: '#fff' } : { color: tema.colores.texto || '#333' }]}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Código</Text>
            <TextInput
              value={codigo}
              onChangeText={setCodigo}
              placeholder="Ej. BQ-01"
              placeholderTextColor={tema.colores.sub}
              style={[styles.input, { borderColor: tema.colores.border }]}
              autoCapitalize="characters"
            />

            <Text style={styles.label}>Stock</Text>
            <TextInput
              value={stock}
              onChangeText={setStock}
              placeholder="0"
              placeholderTextColor={tema.colores.sub}
              style={[styles.input, { borderColor: tema.colores.border }]}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Estado</Text>
            <View style={styles.rowWrap}>
              {ESTADOS.map((e) => {
                const active = estado === e;
                return (
                  <TouchableOpacity
                    key={e}
                    style={[
                      styles.chip,
                      { borderColor: tema.colores.border },
                      active && { backgroundColor: tema.colores.teal, borderColor: tema.colores.teal },
                    ]}
                    onPress={() => setEstado(e)}
                  >
                    <Text style={[styles.chipText, active ? { color: '#fff' } : { color: tema.colores.texto || '#333' }]}>{e}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={[styles.modalActions, { borderTopColor: tema.colores.border }]}>
            <TouchableOpacity style={[styles.btn, styles.btnSecondary, { backgroundColor: '#fff', borderColor: tema.colores.border }]} onPress={() => setModalVisible(false)}>
              <Text style={[styles.btnTextSecondary, { color: tema.colores.texto || '#333' }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary, { backgroundColor: tema.colores.teal }]} onPress={crearInsumo}>
              <Text style={styles.btnTextPrimary}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0, // asegura espacio bajo el status bar
  },
  container: { flex: 1, paddingHorizontal: 14, paddingBottom: 0 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    marginBottom: 10,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: 0.3 },
  counterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  counterText: { fontSize: 12, fontWeight: '700' },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 16 },

  filterContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: '#fff',
  },
  filterText: { fontWeight: '700' },

  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardLeft: { justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  iconContainer: { backgroundColor: '#f3f6f8', padding: 10, borderRadius: 12 },
  cardCenter: { flex: 1, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 999, opacity: 0.9 },
  nombre: { fontWeight: '800', fontSize: 16 },
  categoria: { color: '#8b8b8b', marginTop: 2 },
  badgesRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeLight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#f3f6f8',
  },
  badgeText: { fontSize: 12, fontWeight: '700' },

  cardRight: { justifyContent: 'center', alignItems: 'flex-end', gap: 2, minWidth: 86 },
  stockLabel: { fontSize: 11, color: '#9aa0a6' },
  stockValue: { fontWeight: '900', fontSize: 18 },
  botones: { flexDirection: 'row', marginTop: 8, alignItems: 'center', gap: 10 },

  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    gap: 8,
  },
  fabText: { color: '#fff', fontWeight: '800' },

  // Modal
  modalRoot: { flex: 1 },
  modalHeader: {
    height: 56,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  iconBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalBody: { padding: 16, paddingBottom: 24 },
  label: { fontSize: 12, color: '#666', marginTop: 12, marginBottom: 6, fontWeight: '700' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: '#fff',
  },
  chipText: { fontWeight: '700' },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
  },
  btn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  btnPrimary: {},
  btnSecondary: { borderWidth: 1 },
  btnTextPrimary: { color: '#fff', fontWeight: '800' },
  btnTextSecondary: { fontWeight: '800' },
});

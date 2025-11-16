// src/pantallas/MovimientosScreen.js
import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput } from 'react-native';

export default function InventarioApp() {
  const [movimientos, setMovimientos] = useState([
    { id: '1', tipo: 'entrada', descripcion: 'Guantes quirúrgicos', cantidad: 50, fecha: '2025-11-05' },
    { id: '2', tipo: 'salida', descripcion: 'Mascarillas N95', cantidad: 30, fecha: '2025-11-06' },
    { id: '3', tipo: 'entrada', descripcion: 'Batas estériles', cantidad: 20, fecha: '2025-11-06' },
  ]);

  const [filtro, setFiltro] = useState('todos');
  const [descripcion, setDescripcion] = useState('');
  const [cantidad, setCantidad] = useState('');

  const agregarMovimiento = (tipo) => {
    if (!descripcion || !cantidad) return;
    const nuevo = {
      id: (movimientos.length + 1).toString(),
      tipo,
      descripcion,
      cantidad: parseInt(cantidad),
      fecha: new Date().toISOString().split('T')[0],
    };
    setMovimientos([nuevo, ...movimientos]);
    setDescripcion('');
    setCantidad('');
  };

  const filtrarMovimientos = () => {
    if (filtro === 'todos') return movimientos;
    return movimientos.filter((m) => m.tipo === filtro);
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#F7F9FB' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>📦 Inventario</Text>

      {/* Formulario */}
      <View style={{ marginBottom: 20 }}>
        <TextInput
          placeholder="Descripción del insumo"
          value={descripcion}
          onChangeText={setDescripcion}
          style={{ backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 10 }}
        />
        <TextInput
          placeholder="Cantidad"
          value={cantidad}
          onChangeText={setCantidad}
          keyboardType="numeric"
          style={{ backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 10 }}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <TouchableOpacity
            style={{ backgroundColor: '#4CAF50', padding: 10, borderRadius: 8 }}
            onPress={() => agregarMovimiento('entrada')}
          >
            <Text style={{ color: '#fff' }}>➕ Entrada</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ backgroundColor: '#E53935', padding: 10, borderRadius: 8 }}
            onPress={() => agregarMovimiento('salida')}
          >
            <Text style={{ color: '#fff' }}>➖ Salida</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtros */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 }}>
        {['todos', 'entrada', 'salida'].map((tipo) => (
          <TouchableOpacity
            key={tipo}
            onPress={() => setFiltro(tipo)}
            style={{
              backgroundColor: filtro === tipo ? '#1976D2' : '#B0BEC5',
              padding: 8,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: '#fff', textTransform: 'capitalize' }}>{tipo}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista de movimientos */}
      <FlatList
        data={filtrarMovimientos()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: '#fff',
              marginBottom: 10,
              padding: 10,
              borderRadius: 8,
              borderLeftWidth: 6,
              borderLeftColor: item.tipo === 'entrada' ? '#4CAF50' : '#E53935',
            }}
          >
            <Text style={{ fontWeight: 'bold' }}>{item.descripcion}</Text>
            <Text>Cantidad: {item.cantidad}</Text>
            <Text>Fecha: {item.fecha}</Text>
            <Text style={{ color: item.tipo === 'entrada' ? '#4CAF50' : '#E53935' }}>
              {item.tipo.toUpperCase()}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
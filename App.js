// App.js
import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { tema } from './src/tema';
import { AntDesign } from "@expo/vector-icons";
import { Feather } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';

import PanelDeControlScreen from './src/pantallas/PanelDeControlScreen';
import InventarioScreen from './src/pantallas/InventarioScreen';
import SolicitudesScreen from './src/pantallas/SolicitudesScreen';
import MovimientosScreen from './src/pantallas/MovimientosScreen';
import ReportesScreen from './src/pantallas/ReportesScreen';
import AjustesScreen from './src/pantallas/AjustesScreen';

import LoginScreen from './src/pantallas/LoginScreen';
import RegisterScreen from './src/pantallas/RegisterScreen';
import { AuthProvider, useAuth } from './src/auth/AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tema.colores.teal,
        tabBarInactiveTintColor: tema.colores.sub,
        tabBarStyle: {
          height: 80,
          backgroundColor: '#fff',
          borderTopColor: tema.colores.border,
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tab.Screen
        name="Panel"
        component={PanelDeControlScreen}
        options={{ tabBarLabel: 'Panel', tabBarIcon: ({ color }) => <Feather name="activity" size={20} color={color} /> }}
      />
      <Tab.Screen name="Inventario" component={InventarioScreen} options={{ tabBarIcon: ({ color }) => <Ionicons name="document-text-outline" size={23} color={color} /> }} />
      <Tab.Screen name="Solicitudes" component={SolicitudesScreen} options={{ tabBarIcon: ({ color }) => <AntDesign name="shopping-cart" size={22} color={color} /> }} />
      <Tab.Screen name="Movimientos" component={MovimientosScreen} options={{ tabBarIcon: ({ color }) => <AntDesign name="history" size={20} color={color} /> }} />
      <Tab.Screen name="Reportes" component={ReportesScreen} options={{ tabBarIcon: ({ color }) => <AntDesign name="bar-chart" size={22} color={color} /> }} />
      <Tab.Screen name="Ajustes" component={AjustesScreen} options={{ tabBarIcon: ({ color }) => <AntDesign name="setting" size={20} color={color} /> }} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Iniciar sesión" }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Crear cuenta" }} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const auth = useAuth();               // podría ser defaultValue si hay duplicado
  if (!auth) return null;               // defensa extra, por si acaso

  const { user, logout } = useAuth() || {};
  console.log("[RootNavigator] user:", user?.uid || null);

  return user ? <Tabs /> : <AuthStack />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
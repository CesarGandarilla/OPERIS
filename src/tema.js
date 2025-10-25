import { Platform } from "react-native";

export const tema = {
  colores: {
    bg: "#F7F8FA",
    card: "#FFFFFF",
    ink: "#0F172A",
    sub: "#64748B",
    border: "#E5E7EB",
    teal: "#0EA5A4",
    alerta: "#F59E0B",   // color del ícono
    alertaFondo: "#FFFBEB", // fondo muy suave
  },
  radios: { sm: 10, md: 14, lg: 18, xl: 22 },
  espacio: (n) => 4 * n,
  sombraLg: Platform.select({
    ios: {
      shadowColor: "#0F172A",
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
    },
    android: { elevation: 3 },
    default: {},
  }),
};

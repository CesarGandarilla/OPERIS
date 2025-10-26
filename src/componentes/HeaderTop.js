// src/componentes/HeaderTop.js
import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import Svg, { Rect, Defs, LinearGradient, Stop, Path, Circle } from "react-native-svg";
import { tema } from "../tema";

const HeaderTop = ({
  saludo = "Hola, CEyE",
  titulo = "Panel de Control",
  subtitulo = "Resumen de hoy",
  badgeText = "En línea",
  onPressBadge,
  avatarUri,            // url de foto
  height = 150,        
}) => {
  return (
    <View style={[styles.wrapper, { height }, tema.sombraLg]}>
      {/* Fondo con degradado y ornamentos */}
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={tema.colores.teal} />
            <Stop offset="100%" stopColor="#0A8E8B" />
          </LinearGradient>
        </Defs>

        {/* Lienzo base */}
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#g)" />

        {/* Burbujas suaves */}
        <Circle cx="12%" cy="20%" r="36" fill="rgba(255,255,255,0.08)" />
        <Circle cx="85%" cy="18%" r="22" fill="rgba(255,255,255,0.10)" />

        {/* Ondas decorativas en la parte inferior */}
        <Path
          d="M0,70 C80,110 140,40 220,80 C300,120 360,70 420,95 L420,200 L0,200 Z"
          fill="url(#wave)"
          opacity={0.6}
        />
        <Path
          d="M0,95 C80,135 140,65 220,105 C300,145 360,95 420,120 L420,200 L0,200 Z"
          fill="rgba(255,255,255,0.12)"
          opacity={0.5}
        />
      </Svg>

      {/* Contenido */}
      <View style={styles.content}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={styles.kicker}>{saludo}</Text>
          <Text style={styles.title}>{titulo}</Text>
          {!!subtitulo && <Text style={styles.subtitle}>{subtitulo}</Text>}

          {!!badgeText && (
            <Pressable onPress={onPressBadge} style={({ pressed }) => [styles.badge, pressed && { opacity: 0.8 }]}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>{badgeText}</Text>
            </Pressable>
          )}
        </View>

        {/* Avatar / placeholder */}
        <View style={styles.avatarWrap}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarInitials}>CE</Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default HeaderTop;

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    overflow: "hidden",
    marginBottom: tema.espacio(4),
    backgroundColor: tema.colores.teal,
  },
  content: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  kicker: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 14,
    marginBottom: 2,
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  subtitle: {
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
    fontSize: 13,
  },
  badge: {
    alignSelf: "flex-start",
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#BAF2E9",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  avatarWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  avatarInitials: {
    color: "#fff",
    fontWeight: "800",
  },
});

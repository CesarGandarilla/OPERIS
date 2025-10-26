import React from "react";
import Svg, { Path } from "react-native-svg";
import { tema } from "../tema";


export const ArrowIcon = ({ size = 18, color = tema.colores.sub }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="m9 18 6-6-6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);


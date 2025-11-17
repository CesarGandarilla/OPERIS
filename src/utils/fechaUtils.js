// src/utils/fechaUtils.js

// Normaliza varios formatos posibles a un Date
export const getDateFromField = (valor) => {
  if (!valor) return null;

  // Firestore Timestamp con .toDate()
  if (typeof valor?.toDate === "function") {
    return valor.toDate();
  }

  // Objeto tipo { seconds, nanoseconds }
  if (typeof valor === "object" && valor.seconds) {
    return new Date(valor.seconds * 1000);
  }

  // Objeto tipo { _seconds, _nanoseconds }
  if (typeof valor === "object" && valor._seconds) {
    return new Date(valor._seconds * 1000);
  }

  // Ya es instancia de Date
  if (valor instanceof Date) {
    return valor;
  }

  // Número (milisegundos)
  if (typeof valor === "number") {
    const d = new Date(valor);
    return isNaN(d.getTime()) ? null : d;
  }

  // String (fecha en texto)
  if (typeof valor === "string") {
    const d = new Date(valor);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
};

export const formatearFechaCreacion = (valor) => {
  const fecha = getDateFromField(valor);
  if (!fecha || isNaN(fecha.getTime())) return "";
  return fecha.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
  });
};

export const formatFechaNecesaria = (valor) => {
  const fecha = getDateFromField(valor);
  if (!fecha || isNaN(fecha.getTime())) return null;

  const fechaStr = fecha.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const horaStr = fecha.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${fechaStr} • ${horaStr}`;
};

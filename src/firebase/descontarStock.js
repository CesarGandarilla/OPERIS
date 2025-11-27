// descontarStock.js
import { doc, getDoc, writeBatch } from "firebase/firestore";
import { db } from "./inventarios";

export const descontarStock = async (items) => {
  try {
    const batch = writeBatch(db);
    const details = []; // ← Reporte por insumo

    for (const item of items) {
      const ref = doc(db, "insumos", item.insumoId);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        console.warn(`❌ No existe insumo: ${item.nombre || item.insumoId}`);

        details.push({
          item,
          error: "No existe el insumo en base de datos",
          stockAnterior: null,
          stockNuevo: null,
        });

        continue;
      }

      const data = snap.data();
      const stockActual = data.stock ?? 0;

      if (stockActual < item.cantidad) {
        console.warn(
          `❌ Stock insuficiente para ${item.nombre}. Tiene ${stockActual}, requiere ${item.cantidad}`
        );

        details.push({
          item,
          error: "Stock insuficiente",
          stockAnterior: stockActual,
          stockNuevo: stockActual,
        });

        continue;
      }

      const stockNuevo = stockActual - item.cantidad;

      batch.update(ref, { stock: stockNuevo });

      // Registro exitoso
      details.push({
        item,
        error: null,
        stockAnterior: stockActual,
        stockNuevo,
      });
    }

    await batch.commit();

    // Regreso final
    const ok = details.every((d) => d.error === null);
    return { ok, details };
  } catch (error) {
    console.error("❌ Error global en descontarStock:", error);
    return {
      ok: false,
      details: [{ item: null, error: "Error global al actualizar stock" }],
    };
  }
};

import Product from '../models/Product.js';
import Season from '../models/Season.js';
import HistoricalData from '../models/HistoricalData.js';
import CurrentMovement from '../models/CurrentMovement.js';
import Prediction from '../models/Prediction.js';

class PrediccionService {
  /**
   * Obtiene la temporada correspondiente a un mes
   */
  getSeasonName(month, seasons) {
    const season = seasons.find(sea => {
      if (sea.mesInicio <= sea.mesFin) {
        return month >= sea.mesInicio && month <= sea.mesFin;
      } else {
        return month >= sea.mesInicio || month <= sea.mesFin;
      }
    });
    return season ? season.nombre : 'Fuera de Temporada';
  }

  /**
   * Consolida en memoria las entradas y salidas de la Tabla 2 (CurrentMovement) para 2026
   */
  async getConsolidatedCurrentMovements(productoId) {
    const movements = await CurrentMovement.find({
      productoId,
      fecha: { $gte: new Date(2026, 0, 1), $lte: new Date(2026, 11, 31, 23, 59, 59) }
    }).lean().exec();

    const monthlyData = {};
    for (let m = 1; m <= 12; m++) {
      monthlyData[m] = { entradas: 0, salidas: 0 };
    }

    movements.forEach(mv => {
      const month = new Date(mv.fecha).getMonth() + 1;
      if (mv.tipo === 'Entrada') {
        monthlyData[month].entradas += mv.cantidad;
      } else {
        monthlyData[month].salidas += mv.cantidad;
      }
    });

    return monthlyData;
  }

  /**
   * Ejecuta el cruce manual y copia de datos físicos entre las tablas 1, 2 y 3.
   */
  async calcularCruceManual({ yearBase, yearObjetivo }) {
    const base = Number(yearBase);
    const objetivo = Number(yearObjetivo);

    // 1. Limpiar predicciones previas para este par
    await Prediction.deleteMany({ yearBase: base, yearObjetivo: objetivo });

    const products = await Product.find().lean().exec();
    const seasons = await Season.find().lean().exec();
    const predictionsInserted = [];

    // Determinar dinámicamente el año y mes actuales
    const ahora = new Date();
    const currentMonth = ahora.getMonth() + 1; // 6 para Junio en 2026

    for (const prod of products) {
      // Cargar datos del año base histórico (Tabla 1)
      const histRecords = await HistoricalData.find({ productoId: prod._id, year: base }).lean().exec();
      const baseHistData = {};
      for (let m = 1; m <= 12; m++) {
        const rec = histRecords.find(r => r.month === m);
        baseHistData[m] = {
          entradas: rec ? rec.entradas : 0,
          salidas: rec ? rec.salidas : 0
        };
      }

      // Cargar y consolidar datos de la Tabla 2 (Actualidad - 2026)
      const actualidadData = await this.getConsolidatedCurrentMovements(prod._id);

      // Generar predicciones para la Tabla 3 según las reglas mixtas
      for (let m = 1; m <= 12; m++) {
        const seasonName = this.getSeasonName(m, seasons);
        let entradasProyectadas = 0;
        let salidasProyectadas = 0;
        let status = 'Calculado';

        if (objetivo === 2026) {
          if (m <= currentMonth) {
            // Meses actuales/pasados: Usar Tabla 2 (Actualidad)
            entradasProyectadas = actualidadData[m].entradas;
            salidasProyectadas = actualidadData[m].salidas;
          } else {
            // Meses futuros sin datos: Copiar de Tabla 1 (Histórico)
            entradasProyectadas = baseHistData[m].entradas;
            salidasProyectadas = baseHistData[m].salidas;
          }
        } else if (objetivo === 2027) {
          if (m <= currentMonth) {
            // Meses con datos reales en 2026: Usar Tabla 2 (Actualidad 2026) como base
            entradasProyectadas = actualidadData[m].entradas;
            salidasProyectadas = actualidadData[m].salidas;
          } else {
            // Meses futuros sin datos en 2026: Usar Tabla 1 (Histórico) como base
            entradasProyectadas = baseHistData[m].entradas;
            salidasProyectadas = baseHistData[m].salidas;
          }
        }

        const pred = await Prediction.create({
          productoId: prod._id,
          nombreProducto: prod.nombreProducto,
          yearBase: base,
          yearObjetivo: objetivo,
          month: m,
          entradasProyectadas,
          salidasProyectadas,
          temporada: seasonName,
          status
        });
        predictionsInserted.push(pred);
      }
    }

    return predictionsInserted;
  }

  /**
   * Obtiene la comparativa mensual combinando las tres tablas físicas según las selecciones del usuario.
   */
  async obtenerComparacion({ yearBase, yearObjetivo }) {
    const base = Number(yearBase);
    const objetivo = Number(yearObjetivo);

    const products = await Product.find().lean().exec();
    const seasons = await Season.find().lean().exec();
    const predictions = await Prediction.find({ yearBase: base, yearObjetivo: objetivo }).lean().exec();

    const ahora = new Date();
    const currentMonth = ahora.getMonth() + 1; // 6 para Junio en 2026

    const result = [];

    for (const prod of products) {
      // 1. Tabla 1: Histórico (base: 2024, 2025, o fallback a 2026)
      const baseData = {};
      if (base === 2026) {
        const consolidated = await this.getConsolidatedCurrentMovements(prod._id);
        for (let m = 1; m <= 12; m++) {
          baseData[m] = {
            entradas: consolidated[m].entradas,
            salidas: consolidated[m].salidas,
            origen: `Tabla 2 - Real Bodega (2026)`
          };
        }
      } else {
        const histRecords = await HistoricalData.find({ productoId: prod._id, year: base }).lean().exec();
        for (let m = 1; m <= 12; m++) {
          const rec = histRecords.find(r => r.month === m);
          baseData[m] = {
            entradas: rec ? rec.entradas : 0,
            salidas: rec ? rec.salidas : 0,
            origen: `Tabla 1 - Histórico (${base})`
          };
        }
      }

      // 2. Tabla 2: Actualidad (2026) - siempre se carga para la columna 2
      const current2026Data = await this.getConsolidatedCurrentMovements(prod._id);

      for (let m = 1; m <= 12; m++) {
        const seasonName = this.getSeasonName(m, seasons);
        let prediccionVal = { entradas: 0, salidas: 0, origen: '', status: 'Calculado' };

        // 3. Tabla 3: Predicción / Proyección para el año objetivo
        const pred = predictions.find(p => p.productoId.toString() === prod._id.toString() && p.month === m);

        if (pred) {
          prediccionVal.entradas = pred.entradasProyectadas;
          prediccionVal.salidas = pred.salidasProyectadas;
          prediccionVal.status = pred.status;
          
          if (pred.yearObjetivo === 2026) {
            prediccionVal.origen = m <= currentMonth 
              ? 'Tabla 3 - Real (Mezcla T2)' 
              : `Tabla 3 - Proyectado (Mezcla T1 ${base})`;
          } else {
            prediccionVal.origen = m <= currentMonth 
              ? `Tabla 3 - Proyectado (Mezcla T2 2026)` 
              : `Tabla 3 - Proyectado (Mezcla T1 ${base})`;
          }
        } else {
          prediccionVal.entradas = 0;
          prediccionVal.salidas = 0;
          prediccionVal.status = 'Calculado';
          prediccionVal.origen = 'Sin Predicción (Ejecute el Cruce)';
        }

        result.push({
          month: m,
          productoId: prod._id,
          nombreProducto: prod.nombreProducto,
          temporada: seasonName,
          tabla1: {
            entradas: baseData[m].entradas,
            salidas: baseData[m].salidas,
            origen: baseData[m].origen
          },
          tabla2: {
            entradas: current2026Data[m].entradas,
            salidas: current2026Data[m].salidas,
            origen: m <= currentMonth ? `Tabla 2 - Real Bodega (2026)` : 'Sin datos real'
          },
          tabla3: {
            entradas: prediccionVal.entradas,
            salidas: prediccionVal.salidas,
            origen: prediccionVal.origen,
            status: prediccionVal.status
          }
        });
      }
    }

    return result;
  }
}

export default new PrediccionService();

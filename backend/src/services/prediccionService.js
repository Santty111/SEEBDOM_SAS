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

    for (const prod of products) {
      // Obtener datos del año base
      let baseData = {};

      if (base === 2024 || base === 2025) {
        // Cargar de la Tabla 1 (Históricos)
        const histRecords = await HistoricalData.find({ productoId: prod._id, year: base }).lean().exec();
        for (let m = 1; m <= 12; m++) {
          const rec = histRecords.find(r => r.month === m);
          baseData[m] = {
            entradas: rec ? rec.entradas : 0,
            salidas: rec ? rec.salidas : 0
          };
        }
      } else if (base === 2026) {
        // Cargar y consolidar de la Tabla 2 (Actual)
        baseData = await this.getConsolidatedCurrentMovements(prod._id);
      }

      // Generar predicciones para la Tabla 3 según las reglas
      if (objetivo === 2026) {
        // Caso A: Objetivo es 2026. Data real va de 1 a 5 (Tabla 2).
        // Se calcula proyección únicamente para meses 6 a 12 (Tabla 3)
        for (let m = 6; m <= 12; m++) {
          const dataMes = baseData[m] || { entradas: 0, salidas: 0 };
          const seasonName = this.getSeasonName(m, seasons);

          const pred = await Prediction.create({
            productoId: prod._id,
            nombreProducto: prod.nombreProducto,
            yearBase: base,
            yearObjetivo: objetivo,
            month: m,
            entradasProyectadas: dataMes.entradas,
            salidasProyectadas: dataMes.salidas,
            temporada: seasonName,
            status: 'Calculado'
          });
          predictionsInserted.push(pred);
        }
      } else if (objetivo === 2027) {
        if (base === 2024 || base === 2025) {
          // Caso B: Objetivo 2027, Base Histórico (2024/2025) -> Genera los 12 meses completos
          for (let m = 1; m <= 12; m++) {
            const dataMes = baseData[m] || { entradas: 0, salidas: 0 };
            const seasonName = this.getSeasonName(m, seasons);

            const pred = await Prediction.create({
              productoId: prod._id,
              nombreProducto: prod.nombreProducto,
              yearBase: base,
              yearObjetivo: objetivo,
              month: m,
              entradasProyectadas: dataMes.entradas,
              salidasProyectadas: dataMes.salidas,
              temporada: seasonName,
              status: 'Calculado'
            });
            predictionsInserted.push(pred);
          }
        } else if (base === 2026) {
          // Caso C: Objetivo 2027, Base Actual (2026) -> Limitar Ene-May y bloquear Jun-Dic
          for (let m = 1; m <= 12; m++) {
            const seasonName = this.getSeasonName(m, seasons);
            const dataMes = baseData[m] || { entradas: 0, salidas: 0 };

            if (m <= 5) {
              const pred = await Prediction.create({
                productoId: prod._id,
                nombreProducto: prod.nombreProducto,
                yearBase: base,
                yearObjetivo: objetivo,
                month: m,
                entradasProyectadas: dataMes.entradas,
                salidasProyectadas: dataMes.salidas,
                temporada: seasonName,
                status: 'Calculado'
              });
              predictionsInserted.push(pred);
            } else {
              // Bloqueo explícito
              const pred = await Prediction.create({
                productoId: prod._id,
                nombreProducto: prod.nombreProducto,
                yearBase: base,
                yearObjetivo: objetivo,
                month: m,
                entradasProyectadas: 0,
                salidasProyectadas: 0,
                temporada: seasonName,
                status: 'Bloqueado'
              });
              predictionsInserted.push(pred);
            }
          }
        }
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

    const result = [];

    for (const prod of products) {
      let baseData = {};
      let current2026Data = {};

      // Cargar datos de año base
      if (base === 2024 || base === 2025) {
        const histRecords = await HistoricalData.find({ productoId: prod._id, year: base }).lean().exec();
        for (let m = 1; m <= 12; m++) {
          const rec = histRecords.find(r => r.month === m);
          baseData[m] = {
            entradas: rec ? rec.entradas : 0,
            salidas: rec ? rec.salidas : 0,
            origen: `Tabla 1 - Histórico (${base})`
          };
        }
      } else if (base === 2026) {
        const consolidated = await this.getConsolidatedCurrentMovements(prod._id);
        for (let m = 1; m <= 12; m++) {
          baseData[m] = {
            entradas: consolidated[m].entradas,
            salidas: consolidated[m].salidas,
            // Los meses 1 a 5 de 2026 son reales en Tabla 2, del 6 al 12 no tienen base
            origen: m <= 5 ? `Tabla 2 - Real Bodega (${base})` : 'Sin datos base'
          };
        }
      }

      // Cargar data real de 2026 si el objetivo es 2026
      if (objetivo === 2026) {
        current2026Data = await this.getConsolidatedCurrentMovements(prod._id);
      }

      for (let m = 1; m <= 12; m++) {
        const seasonName = this.getSeasonName(m, seasons);
        let objetivoVal = { entradas: 0, salidas: 0, origen: '', status: 'Calculado' };

        if (objetivo === 2026) {
          if (m <= 5) {
            // Data real de la Tabla 2
            objetivoVal.entradas = current2026Data[m].entradas;
            objetivoVal.salidas = current2026Data[m].salidas;
            objetivoVal.origen = 'Tabla 2 - Real Bodega (2026)';
          } else {
            // Predicción de la Tabla 3
            const pred = predictions.find(p => p.productoId.toString() === prod._id.toString() && p.month === m);
            objetivoVal.entradas = pred ? pred.entradasProyectadas : 0;
            objetivoVal.salidas = pred ? pred.salidasProyectadas : 0;
            objetivoVal.origen = pred ? `Tabla 3 - Predicción (${objetivo} desde ${base})` : 'Sin Predicción';
          }
        } else if (objetivo === 2027) {
          // Todo proviene de la Tabla 3 de Predicciones
          const pred = predictions.find(p => p.productoId.toString() === prod._id.toString() && p.month === m);
          objetivoVal.entradas = pred ? pred.entradasProyectadas : 0;
          objetivoVal.salidas = pred ? pred.salidasProyectadas : 0;
          objetivoVal.status = pred ? pred.status : 'Calculado';
          objetivoVal.origen = pred 
            ? (pred.status === 'Bloqueado' ? 'Tabla 3 - Bloqueado (Sin Base)' : `Tabla 3 - Predicción (${objetivo} desde ${base})`)
            : 'Sin Predicción';
        }

        result.push({
          month: m,
          productoId: prod._id,
          nombreProducto: prod.nombreProducto,
          temporada: seasonName,
          base: {
            entradas: baseData[m] ? baseData[m].entradas : 0,
            salidas: baseData[m] ? baseData[m].salidas : 0,
            origen: baseData[m] ? baseData[m].origen : 'Sin datos'
          },
          objetivo: {
            entradas: objetivoVal.entradas,
            salidas: objetivoVal.salidas,
            origen: objetivoVal.origen,
            status: objetivoVal.status
          }
        });
      }
    }

    return result;
  }
}

export default new PrediccionService();

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PrediccionService from '../src/services/prediccionService.js';

dotenv.config();

const verify = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a la base de datos para verificación.');

    // 1. Ejecutar el cruce manual de 2024 a 2026
    console.log('Calculando cruce manual para 2024 -> 2026...');
    const resultCalculado2026 = await PrediccionService.calcularCruceManual({ yearBase: 2024, yearObjetivo: 2026 });
    console.log(`Se insertaron ${resultCalculado2026.length} registros de predicciones en Tabla 3 para 2026.`);

    // 2. Obtener la comparativa 2026
    console.log('Obteniendo comparativa de 2024 vs 2026...');
    const comparativa2026 = await PrediccionService.obtenerComparacion({ yearBase: 2024, yearObjetivo: 2026 });

    // Filtrar por el primer producto para ver la distribución de meses
    const primerProducto = comparativa2026[0]?.nombreProducto;
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    let allChecksPassed = true;

    console.log(`\nComparativa para el producto: ${primerProducto} (Objetivo 2026)`);
    for (const item of comparativa2026.filter(item => item.nombreProducto === primerProducto)) {
      const month = item.month;
      const t3Entradas = item.tabla3.entradas;
      const t3Salidas = item.tabla3.salidas;
      
      let expectedEntradas = 0;
      let expectedSalidas = 0;
      let testResult = 'PASS';

      if (month <= 6) {
        expectedEntradas = item.tabla2.entradas;
        expectedSalidas = item.tabla2.salidas;
        if (t3Entradas !== expectedEntradas || t3Salidas !== expectedSalidas) {
          testResult = `FAIL (Esperaba T2: 📥 ${expectedEntradas} / 📤 ${expectedSalidas}, obtuvo: 📥 ${t3Entradas} / 📤 ${t3Salidas})`;
          allChecksPassed = false;
        }
      } else {
        expectedEntradas = item.tabla1.entradas;
        expectedSalidas = item.tabla1.salidas;
        if (t3Entradas !== expectedEntradas || t3Salidas !== expectedSalidas) {
          testResult = `FAIL (Esperaba T1: 📥 ${expectedEntradas} / 📤 ${expectedSalidas}, obtuvo: 📥 ${t3Entradas} / 📤 ${t3Salidas})`;
          allChecksPassed = false;
        }
      }

      console.log(
        `${meses[month - 1].padEnd(5)} | ` +
        `T1 (2024): 📥 ${String(item.tabla1.entradas).padStart(4)} / 📤 ${String(item.tabla1.salidas).padStart(4)} | ` +
        `T2 (2026): 📥 ${String(item.tabla2.entradas).padStart(4)} / 📤 ${String(item.tabla2.salidas).padStart(4)} | ` +
        `T3 (2026): 📥 ${String(item.tabla3.entradas).padStart(4)} / 📤 ${String(item.tabla3.salidas).padStart(4)} | ` +
        `Verificación BD: [${testResult}]`
      );
    }

    // 3. Ejecutar el cruce manual de 2024 a 2027
    console.log('\nCalculando cruce manual para 2024 -> 2027...');
    const resultCalculado2027 = await PrediccionService.calcularCruceManual({ yearBase: 2024, yearObjetivo: 2027 });
    console.log(`Se insertaron ${resultCalculado2027.length} registros de predicciones en Tabla 3 para 2027.`);

    // 4. Obtener la comparativa 2027
    console.log('Obteniendo comparativa de 2024 vs 2027...');
    const comparativa2027 = await PrediccionService.obtenerComparacion({ yearBase: 2024, yearObjetivo: 2027 });

    console.log(`\nComparativa para el producto: ${primerProducto} (Objetivo 2027)`);
    for (const item of comparativa2027.filter(item => item.nombreProducto === primerProducto)) {
      const month = item.month;
      const t3Entradas = item.tabla3.entradas;
      const t3Salidas = item.tabla3.salidas;
      
      let expectedEntradas = 0;
      let expectedSalidas = 0;
      let testResult = 'PASS';

      if (month <= 6) {
        // En 2027, meses 1-6 usan los datos consolidados reales de 2026 (T2)
        expectedEntradas = item.tabla2.entradas;
        expectedSalidas = item.tabla2.salidas;
        if (t3Entradas !== expectedEntradas || t3Salidas !== expectedSalidas) {
          testResult = `FAIL (Esperaba T2: 📥 ${expectedEntradas} / 📤 ${expectedSalidas}, obtuvo: 📥 ${t3Entradas} / 📤 ${t3Salidas})`;
          allChecksPassed = false;
        }
      } else {
        // En 2027, meses 7-12 usan los datos de T1 (Histórico 2024)
        expectedEntradas = item.tabla1.entradas;
        expectedSalidas = item.tabla1.salidas;
        if (t3Entradas !== expectedEntradas || t3Salidas !== expectedSalidas) {
          testResult = `FAIL (Esperaba T1: 📥 ${expectedEntradas} / 📤 ${expectedSalidas}, obtuvo: 📥 ${t3Entradas} / 📤 ${t3Salidas})`;
          allChecksPassed = false;
        }
      }

      console.log(
        `${meses[month - 1].padEnd(5)} | ` +
        `T1 (2024): 📥 ${String(item.tabla1.entradas).padStart(4)} / 📤 ${String(item.tabla1.salidas).padStart(4)} | ` +
        `T2 (2026): 📥 ${String(item.tabla2.entradas).padStart(4)} / 📤 ${String(item.tabla2.salidas).padStart(4)} | ` +
        `T3 (2027): 📥 ${String(item.tabla3.entradas).padStart(4)} / 📤 ${String(item.tabla3.salidas).padStart(4)} | ` +
        `Verificación BD: [${testResult}]`
      );
    }

    console.log('\n-----------------------------------------------------------');
    if (allChecksPassed) {
      console.log('✅ VERIFICACIÓN DE BASE DE DATOS COMPLETADA: Todos los cruces y predicciones (2026 y 2027) coinciden con las fuentes físicas.');
    } else {
      console.log('❌ ERROR EN VERIFICACIÓN DE BASE DE DATOS: Algunas predicciones no coinciden.');
    }
    console.log('-----------------------------------------------------------');

    await mongoose.disconnect();
    console.log('Verificación finalizada con éxito.');
    process.exit(0);
  } catch (err) {
    console.error('Error durante la verificación:', err);
    process.exit(1);
  }
};

verify();

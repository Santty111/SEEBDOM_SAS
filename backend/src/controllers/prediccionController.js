import PrediccionService from '../services/prediccionService.js';

const prediccionController = {
  calcularCruce: async (req, res) => {
    try {
      const { yearBase, yearObjetivo } = req.body;
      
      if (!yearBase || !yearObjetivo) {
        return res.status(400).json({ success: false, message: 'Año base y año objetivo son obligatorios.' });
      }

      const predictions = await PrediccionService.calcularCruceManual({ yearBase, yearObjetivo });
      res.json({ success: true, message: 'Cruce manual ejecutado con éxito y guardado en Tabla 3.', data: predictions });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  obtenerComparacion: async (req, res) => {
    try {
      const { yearBase, yearObjetivo } = req.query;

      if (!yearBase || !yearObjetivo) {
        return res.status(400).json({ success: false, message: 'Año base y año objetivo son requeridos en la consulta.' });
      }

      const comparativa = await PrediccionService.obtenerComparacion({ yearBase, yearObjetivo });
      res.json({ success: true, data: comparativa });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

export default prediccionController;

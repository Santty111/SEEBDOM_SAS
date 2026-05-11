import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const adminApi = {
  // Categorías para el primer dropdown
  getCategories: async () => {
    const response = await axios.get(`${API_URL}/admin/categorias`);
    return response.data;
  },

  // Productos por categoría para el segundo dropdown (asíncrono)
  getProductsByCategory: async (categoryId) => {
    const response = await axios.get(`${API_URL}/admin/productos/categoria/${categoryId}`);
    return response.data;
  },

  // Crear Lote (Validación Backend en fechaPesca)
  createLote: async (loteData) => {
    const response = await axios.post(`${API_URL}/admin/lotes`, loteData);
    return response.data;
  },

  // Crear Producto (Validación Backend en costoBase)
  createProduct: async (productData) => {
    const response = await axios.post(`${API_URL}/admin/productos`, productData);
    return response.data;
  }
};

export default adminApi;

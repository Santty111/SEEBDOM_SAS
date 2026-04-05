import api from '../api/axiosConfig.js';
import { getApiErrorMessage } from '../utils/apiErrors.js';

export { getApiErrorMessage };

/**
 * Capa de acceso a datos de productos (separada de la UI).
 * @returns {Promise<object[]>}
 */
export async function fetchProducts() {
  const { data } = await api.get('/api/products');
  return data?.data?.products ?? [];
}

/**
 * @param {string} id
 */
export async function fetchProductById(id) {
  const { data } = await api.get(`/api/products/${id}`);
  return data?.data?.product ?? null;
}

/**
 * @param {{ nombreProducto: string }} payload
 */
export async function createProduct(payload) {
  const { data } = await api.post('/api/products', payload);
  return data?.data?.product;
}

/**
 * @param {string} id
 * @param {{ nombreProducto: string }} payload
 */
export async function updateProductName(id, payload) {
  const { data } = await api.patch(`/api/products/${id}`, payload);
  return data?.data?.product;
}

/**
 * @param {string} id
 * @param {{ unidadMedida: string; entrada?: number; salida?: number }} payload
 */
export async function updateInventory(id, payload) {
  const { data } = await api.patch(`/api/products/${id}/inventory`, payload);
  return data?.data?.product;
}

/**
 * @param {string} id
 */
export async function deleteProduct(id) {
  const { data } = await api.delete(`/api/products/${id}`);
  return data?.data?.product;
}

import { useCallback, useState } from 'react';
import { updateInventory } from '../services/productApi.js';
import { getApiErrorMessage } from '../utils/apiErrors.js';

/**
 * Orquesta actualizaciones de inventario (entrada / salida) vía API.
 */
export function useInventory() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => setError(null), []);

  /**
   * @param {string} productId
   * @param {{
   *   unidadMedida: string;
   *   entrada?: number | null;
   *   salida?: number | null;
   * }} payload
   */
  const applyMovement = useCallback(async (productId, payload) => {
    setPending(true);
    setError(null);
    try {
      const body = {
        unidadMedida: payload.unidadMedida,
        ...(payload.entrada != null && payload.entrada > 0
          ? { entrada: payload.entrada }
          : {}),
        ...(payload.salida != null && payload.salida > 0
          ? { salida: payload.salida }
          : {}),
      };
      const product = await updateInventory(productId, body);
      return product;
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setError(msg);
      throw err;
    } finally {
      setPending(false);
    }
  }, []);

  return {
    applyMovement,
    pending,
    error,
    clearError,
  };
}

/**
 * @param {unknown} error
 */
export function getApiErrorMessage(error) {
  const res = error?.response?.data;
  if (typeof res?.message === 'string') return res.message;
  if (Array.isArray(res?.message)) return res.message.join('. ');
  if (error?.message) return error.message;
  return 'Error desconocido';
}

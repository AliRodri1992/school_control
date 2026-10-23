let csrf = '';
export async function api(path: string, method = 'GET', data?: unknown) {
  const multipart = data instanceof FormData;
  const response = await fetch(`/api/${path}`, {
    method, credentials: 'same-origin',
    headers: {Accept: 'application/json', ...(multipart ? {} : {'Content-Type': 'application/json'}), 'X-CSRF-Token': csrf},
    body: data ? (multipart ? data : JSON.stringify(data)) : undefined
  });
  if (response.status === 204) return null;
  const result = await response.json();
  if (result.csrf_token) csrf = result.csrf_token;
  if (!response.ok) {
    const error = new Error(result.error || 'No se pudo completar la operación.') as Error & { fieldErrors?: Record<string, string[]> };
    if (result.errors && typeof result.errors === 'object') error.fieldErrors = result.errors;
    throw error;
  }
  return result;
}
export const timeLabel = (minute: number) => `${Math.floor(minute / 60).toString().padStart(2, '0')}:${(minute % 60).toString().padStart(2, '0')}`;
export const mean = (values: number[]) => values.length ? (values.reduce((a,b) => a+b,0)/values.length).toFixed(1) : '—';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Adresa completă a unui fișier încărcat, servit de API din `/uploads`.
 *
 * Serverul întoarce căi relative (`/uploads/companies/x.png`), fiindcă originea API-ului nu e
 * treaba lui. Puse direct într-un `<img src>`, ele se rezolvă însă față de originea **paginii**,
 * nu a API-ului — adică fișierul e cerut de la frontend, unde nu există, și imaginea rămâne
 * ruptă fără nicio eroare vizibilă. De aici veneau logo-urile de firmă care „nu se încărcau":
 * uploadul reușea, doar afișarea cerea fișierul de la adresa greșită.
 */
export function uploadUrl(path: string | null | undefined): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
}

/**
 * A simple wrapper around fetch that automatically prepends the API base URL.
 * You can enhance this later to automatically inject JWT tokens from localStorage.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  // Example: Inject token if you have one saved
  // const token = localStorage.getItem('token');
  // const headers = {
  //   'Content-Type': 'application/json',
  //   ...(token ? { Authorization: `Bearer ${token}` } : {}),
  //   ...options.headers,
  // };

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  // Handle empty responses (like 204 No Content)
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

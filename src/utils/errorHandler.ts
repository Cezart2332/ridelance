/**
 * Extracts a user-friendly error message from an API response or generic error.
 * Uses the RFC7807 'detail' property returned by our backend ProblemDetails.
 */
export function getErrorMessage(err: any, fallbackMessage: string = 'A apărut o eroare neașteptată.'): string {
  // Check if it's an Axios error with response data
  if (err?.response?.data) {
    const data = err.response.data;
    
    // Priority 1: Our backend puts the friendly description in `detail`
    if (typeof data.detail === 'string' && data.detail.trim() !== '') {
      return data.detail;
    }
    
    // Priority 2: Sometimes Minimal APIs use 'title' or 'error' 
    if (typeof data.error === 'string' && data.error.trim() !== '') {
      return data.error;
    }

    if (typeof data.title === 'string' && data.title.trim() !== '' && !data.title.includes('.')) {
      return data.title;
    }
  }

  // Network or timeout errors
  if (err?.message === 'Network Error') {
    return 'Eroare de conexiune. Te rugăm să îți verifici conexiunea la internet.';
  }
  
  if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
    return 'Conexiunea a expirat. Te rugăm să încerci din nou.';
  }

  return fallbackMessage;
}

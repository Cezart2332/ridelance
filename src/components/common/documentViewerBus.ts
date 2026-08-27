/**
 * Canalul prin care orice pagină cere deschiderea unui document.
 *
 * Separat de componentă pentru că un fișier care exportă și componente, și funcții, rupe
 * reîncărcarea la cald — aceeași regulă care a scos helperele calendarului din `DateField`.
 */

export interface ViewerTarget {
  id: string
  fileName: string
}

let listener: ((target: ViewerTarget | null) => void) | null = null

/** Deschide un document în aplicație. Fără gazdă montată nu se întâmplă nimic. */
export function openDocument(id: string, fileName: string): void {
  listener?.({ id, fileName })
}

/** Doar pentru gazdă. Întoarce funcția de dezabonare. */
export function subscribeToDocumentViewer(next: (target: ViewerTarget | null) => void): () => void {
  listener = next
  return () => {
    listener = null
  }
}

import { useEffect, useState } from 'react'

import { DocumentViewer } from './DocumentViewer'
import { subscribeToDocumentViewer, type ViewerTarget } from './documentViewerBus'

/**
 * Vizualizatorul de documente, ca suprapunere unică peste aplicație.
 *
 * E singleton pentru că apelurile vin din handlere async, departe de JSX: „vezi documentul" se
 * cheamă din butoane, din liste, din pagini de administrare. Cerând fiecăruia să-și țină propria
 * stare de dialog, ar fi însemnat nouă locuri în care starea asta poate fi ținută altfel — și nouă
 * dialoguri care se pot deschide unul peste altul.
 *
 * Tiparul e cel al notificărilor: o gazdă montată o dată, o funcție apelabilă de oriunde.
 */
export function DocumentViewerHost() {
  const [target, setTarget] = useState<ViewerTarget | null>(null)

  useEffect(() => subscribeToDocumentViewer(setTarget), [])

  return <DocumentViewer document={target} onClose={() => setTarget(null)} />
}

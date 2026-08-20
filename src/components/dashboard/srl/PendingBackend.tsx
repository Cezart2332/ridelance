import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { Alert, Snackbar } from '@mui/material'

import { PendingBackendContext } from './pendingBackendContext'

/**
 * Confirmarea că o acțiune a fost înregistrată, dar nu s-a întâmplat încă nimic.
 *
 * În FAZA 1 niciun buton nu are backend (spec §6.2), iar alternativele sunt mai proaste decât
 * pare: un buton dezactivat nu poate fi testat și ascunde greșelile de layout, iar unul care nu
 * face nimic la click se citește ca bug. Un mesaj explicit spune adevărul.
 *
 * În FAZA 2 dispare odată cu ultimul apel — nu rămâne ca „util și mai încolo".
 */

export function PendingBackendProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)

  const notify = useCallback((action?: string) => {
    setMessage(action ? `${action} — disponibil după conectarea backendului.` : 'Disponibil după conectarea backendului.')
  }, [])

  const value = useMemo(() => notify, [notify])

  return (
    <PendingBackendContext.Provider value={value}>
      {children}
      <Snackbar
        open={message !== null}
        autoHideDuration={3500}
        onClose={() => setMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" sx={{ width: '100%', borderRadius: 2, fontWeight: 600 }}>
          {message}
        </Alert>
      </Snackbar>
    </PendingBackendContext.Provider>
  )
}

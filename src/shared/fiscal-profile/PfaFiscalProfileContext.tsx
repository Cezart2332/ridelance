import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Alert, Snackbar } from '@mui/material'

import { currentTaxYear, fiscalProfileService, type FiscalProfile } from '../../services/fiscalProfile.service'
import { FiscalProfileForm } from './FiscalProfileForm'
import { FiscalProfileHistoryDialog } from './FiscalProfileHistoryDialog'
import { PfaFiscalProfileContext, type PfaFiscalProfileValue } from './pfaFiscalProfileStore'

/**
 * Profilul fiscal al anului curent pentru PFA-ul autentificat: un singur formular și un singur
 * istoric pentru tot dashboardul, deschise de oriunde (Acasă, Taxe, Profil fiscal).
 */
export function PfaFiscalProfileProvider({ children }: { children: ReactNode }) {
  const taxYear = currentTaxYear()
  const [profile, setProfile] = useState<FiscalProfile | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [toast, setToast] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  // Modalul automat: „Acasă” îl cere, iar el se deschide când profilul e cunoscut. Refurile țin
  // cererea și profilul între cele două momente, fără alt render.
  const promptRequested = useRef(false)
  const prompted = useRef(false)
  const latest = useRef<FiscalProfile | null>(null)

  const maybePrompt = useCallback(() => {
    const current = latest.current
    if (!current || prompted.current || !promptRequested.current) return
    if (current.status === 'COMPLETED' || current.firstPromptShownAtUtc) return
    prompted.current = true
    setFormOpen(true)
    fiscalProfileService
      .markPromptShown(taxYear)
      .then((saved) => {
        latest.current = saved
        setProfile(saved)
      })
      .catch(() => undefined)
  }, [taxYear])

  useEffect(() => {
    let cancelled = false
    fiscalProfileService
      .get('pfa', taxYear)
      .then((loaded) => {
        // Un răspuns fără status (endpoint lipsă, proxy) nu e un profil: nu deschidem nimic pe el.
        if (cancelled || typeof loaded?.status !== 'string') return
        latest.current = loaded
        setProfile(loaded)
        maybePrompt()
      })
      // Profilul e opțional: fără el, dashboardul merge normal și estimările rămân ascunse.
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [taxYear, reloadToken, maybePrompt])

  const promptIfFirstVisit = useCallback(() => {
    promptRequested.current = true
    maybePrompt()
  }, [maybePrompt])

  const value = useMemo<PfaFiscalProfileValue>(
    () => ({
      taxYear,
      profile,
      status: profile?.status ?? null,
      openForm: () => setFormOpen(true),
      openHistory: () => setHistoryOpen(true),
      promptIfFirstVisit,
    }),
    [taxYear, profile, promptIfFirstVisit],
  )

  return (
    <PfaFiscalProfileContext.Provider value={value}>
      {children}
      <FiscalProfileForm
        open={formOpen}
        mode="pfa"
        taxYear={taxYear}
        onClose={() => {
          setFormOpen(false)
          // Ciorna salvată la închidere schimbă statusul (Necompletat → Ciornă).
          setReloadToken((token) => token + 1)
        }}
        onSaved={(saved, event) => {
          latest.current = saved
          setProfile(saved)
          if (event === 'completed') setToast(true)
        }}
      />
      <FiscalProfileHistoryDialog open={historyOpen} mode="pfa" taxYear={taxYear} onClose={() => setHistoryOpen(false)} />
      <Snackbar
        open={toast}
        autoHideDuration={6000}
        onClose={() => setToast(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setToast(false)} sx={{ fontWeight: 600 }}>
          Profil fiscal completat. Estimările de taxe sunt acum disponibile.
        </Alert>
      </Snackbar>
    </PfaFiscalProfileContext.Provider>
  )
}

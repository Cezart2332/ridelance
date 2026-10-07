import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { isAxiosError } from 'axios'

import {
  announceFiscalProfileChanged,
  fiscalProfileService,
  type FiscalProfile,
  type FiscalProfileKey,
  type FiscalProfileMode,
} from '../../services/fiscalProfile.service'
import { getErrorMessage } from '../../utils/errorHandler'
import { SituationPicker } from './SituationPicker'
import { answersFrom, isAnswered, selectedSituations } from './schema'

export interface FiscalProfileFormProps {
  open: boolean
  mode: FiscalProfileMode
  taxYear: number
  /** Dosarul PFA, pentru admin și contabilitate. PFA-ul nu-l trimite: backendul îl știe. */
  pfaId?: string
  onClose: () => void
  /** După salvare; primește profilul întors de server. */
  onSaved?: (profile: FiscalProfile, event: 'completed' | 'edited') => void
}

const CONFLICT_MESSAGE = 'Profilul a fost modificat de altcineva. Închide și deschide din nou.'

/** Motivul din istoric când situația o alege echipa (backendul cere un motiv la orice editare de staff). */
export const STAFF_REASON = 'Situație aleasă de echipa RIDElance'

/**
 * Profilul fiscal pe un singur ecran: pensionar, student, angajat full-time sau niciuna. Același
 * dialog în cele trei dashboarduri; PFA-ul confirmă, staff-ul salvează.
 */
export function FiscalProfileForm(props: FiscalProfileFormProps) {
  // Montat doar cât e deschis: fiecare deschidere pornește de la profilul proaspăt.
  return props.open ? <FiscalProfileDialog {...props} /> : null
}

function FiscalProfileDialog({ mode, taxYear, pfaId, onClose, onSaved }: FiscalProfileFormProps) {
  const [profile, setProfile] = useState<FiscalProfile | null>(null)
  const [selected, setSelected] = useState<FiscalProfileKey[]>([])
  const [none, setNone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fiscalProfileService
      .get(mode, taxYear, pfaId)
      .then((loaded) => {
        if (cancelled) return
        setProfile(loaded)
        const chosen = selectedSituations(loaded.answers ?? {})
        setSelected(chosen)
        setNone(chosen.length === 0 && isAnswered(loaded.answers ?? {}))
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getErrorMessage(err, 'Nu am putut încărca profilul fiscal.'))
      })
    return () => {
      cancelled = true
    }
  }, [mode, taxYear, pfaId])

  const ready = selected.length > 0 || none

  const save = async () => {
    if (!profile || !ready) return
    setSaving(true)
    setError(null)
    const answers = answersFrom(selected)
    try {
      let saved: FiscalProfile
      let event: 'completed' | 'edited' = 'edited'
      if (mode === 'pfa' && profile.status !== 'COMPLETED') {
        saved = await fiscalProfileService.complete(taxYear, answers, profile.revision)
        event = 'completed'
      } else {
        saved = await fiscalProfileService.edit(mode, taxYear, answers, profile.revision, mode === 'pfa' ? undefined : STAFF_REASON, pfaId)
      }
      announceFiscalProfileChanged()
      onSaved?.(saved, event)
      onClose()
    } catch (err) {
      setError(isAxiosError(err) && err.response?.status === 409 ? CONFLICT_MESSAGE : getErrorMessage(err, 'Nu am putut salva profilul.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="fiscal-profile-title">
      <DialogTitle id="fiscal-profile-title" sx={{ pr: 6, fontWeight: 700 }}>
        {mode === 'pfa' ? 'Situația ta fiscală' : 'Situația fiscală'} {taxYear}
        <IconButton aria-label="Închide" onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {!profile && !error && (
          <Stack sx={{ alignItems: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Stack>
        )}
        {profile && (
          <SituationPicker
            selected={selected}
            none={none}
            disabled={saving}
            onChange={(next, nextNone) => {
              setSelected(next)
              setNone(nextNone)
            }}
          />
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Renunță
        </Button>
        <Button variant="contained" onClick={() => void save()} disabled={!profile || !ready || saving}>
          {mode === 'pfa' && profile?.status !== 'COMPLETED' ? 'Confirmă' : 'Salvează'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

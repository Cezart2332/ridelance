import { useEffect, useState } from 'react'
import { Alert, Box, Button, Chip, CircularProgress, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import {
  FISCAL_PROFILE_CHANGED,
  currentTaxYear,
  fiscalProfileService,
  type DataCorrection,
  type FiscalProfile,
  type FiscalProfileMode,
  type FiscalProfileStatus,
} from '../../services/fiscalProfile.service'
import { getErrorMessage } from '../../utils/errorHandler'
import { FiscalProfileForm } from './FiscalProfileForm'
import { FiscalProfileHistoryDialog } from './FiscalProfileHistoryDialog'
import { ROLE_LABEL, STATUS_LABEL } from './schema'

export function FiscalProfileStatusChip({ status }: { status: FiscalProfileStatus }) {
  return (
    <Chip
      size="small"
      label={STATUS_LABEL[status]}
      color={status === 'COMPLETED' ? 'primary' : 'default'}
      variant={status === 'COMPLETED' ? 'filled' : 'outlined'}
      sx={{ fontWeight: 700 }}
    />
  )
}

interface Props {
  mode: FiscalProfileMode
  pfaId?: string
  /** PFA-ul folosește formularul comun al dashboardului, nu unul propriu. */
  onOpenForm?: () => void
  onOpenHistory?: () => void
  /** Profilul deja încărcat (PFA). Fără el, panoul îl încarcă singur. */
  profile?: FiscalProfile | null
}

/**
 * Starea profilului fiscal și acțiunile lui: completează / continuă / editează și istoricul. Aceeași
 * fișă în Contabilitate → Profil fiscal (PFA), în fișa PFA din admin și în fișa clientului la contabil.
 */
export function FiscalProfilePanel({ mode, pfaId, onOpenForm, onOpenHistory, profile: external }: Props) {
  const taxYear = currentTaxYear()
  const isStaff = mode !== 'pfa'
  const [own, setOwn] = useState<FiscalProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [resolving, setResolving] = useState<string | null>(null)

  const [reloadToken, setReloadToken] = useState(0)
  const selfLoading = external === undefined

  useEffect(() => {
    if (!selfLoading) return undefined
    let cancelled = false
    fiscalProfileService
      .get(mode, taxYear, pfaId)
      .then((loaded) => {
        if (cancelled) return
        setOwn(loaded)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getErrorMessage(err, 'Nu am putut încărca profilul fiscal.'))
      })
    return () => {
      cancelled = true
    }
  }, [selfLoading, mode, taxYear, pfaId, reloadToken])

  // Profilul salvat din altă parte (formular, datele contabilului): revizia e nouă, se recitește.
  useEffect(() => {
    if (!selfLoading) return undefined
    const reload = () => setReloadToken((t) => t + 1)
    window.addEventListener(FISCAL_PROFILE_CHANGED, reload)
    return () => window.removeEventListener(FISCAL_PROFILE_CHANGED, reload)
  }, [selfLoading])

  const profile = external !== undefined ? external : own

  const resolve = async (correction: DataCorrection) => {
    if (mode === 'pfa') return
    setResolving(correction.id)
    try {
      await fiscalProfileService.resolveCorrection(mode, correction.id)
      setReloadToken((token) => token + 1)
    } catch (err) {
      setError(getErrorMessage(err, 'Nu am putut închide cererea.'))
    } finally {
      setResolving(null)
    }
  }

  const openForm = onOpenForm ?? (() => setFormOpen(true))
  const openHistory = onOpenHistory ?? (() => setHistoryOpen(true))

  const primaryLabel = isStaff
    ? 'Editează profilul'
    : profile?.status === 'COMPLETED'
      ? 'Editează profilul'
      : profile?.status === 'DRAFT'
        ? 'Continuă completarea'
        : 'Completează profilul'

  const openCorrections = profile?.corrections.filter((c) => c.state === 'Open') ?? []

  return (
    <Box
      component="section"
      aria-labelledby="fp-panel-title"
      data-testid="fiscal-profile-panel"
      sx={(theme) => ({ bgcolor: 'background.paper', borderRadius: 2, boxShadow: theme.shadows[1], p: { xs: 2, sm: 3 } })}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}>
            <Typography id="fp-panel-title" variant="h6" component="h2" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
              Profil fiscal {taxYear}
            </Typography>
            {profile && <FiscalProfileStatusChip status={profile.status} />}
          </Stack>
          {profile && (
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              {profile.status === 'NOT_STARTED'
                ? isStaff
                  ? 'PFA-ul nu a început încă profilul. Estimările de taxe sunt ascunse până îl confirmă.'
                  : 'Completează profilul ca să vezi estimările de taxe. Durează câteva minute.'
                : `Ultima modificare: ${new Date(profile.updatedAtUtc).toLocaleString('ro-RO', { dateStyle: 'medium', timeStyle: 'short' })}${
                    profile.lastChangedBy ? ` · ${profile.lastChangedBy.name} (${ROLE_LABEL[profile.lastChangedBy.role]})` : ''
                  }`}
            </Typography>
          )}
          {isStaff && profile && profile.status !== 'COMPLETED' && (
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Doar PFA-ul poate confirma profilul; modificările tale rămân în ciornă până atunci.
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          <Button variant="outlined" onClick={openHistory} disabled={!profile}>
            Istoric
          </Button>
          <Button variant="contained" onClick={openForm} disabled={!profile}>
            {primaryLabel}
          </Button>
        </Stack>
      </Stack>

      {!profile && !error && (
        <Stack sx={{ alignItems: 'center', py: 2 }}>
          <CircularProgress size={22} />
        </Stack>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {isStaff && openCorrections.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Cereri de corectare deschise
          </Typography>
          <Stack spacing={1}>
            {openCorrections.map((correction) => (
              <Stack
                key={correction.id}
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                sx={(theme) => ({
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.warning.main, 0.08),
                  justifyContent: 'space-between',
                  alignItems: { sm: 'center' },
                })}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
                    {correction.details}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {correction.fields} · {new Date(correction.createdAtUtc).toLocaleDateString('ro-RO')}
                  </Typography>
                </Box>
                <Button size="small" onClick={() => void resolve(correction)} disabled={resolving === correction.id}>
                  Marchează rezolvată
                </Button>
              </Stack>
            ))}
          </Stack>
        </Box>
      )}

      {!onOpenForm && (
        <FiscalProfileForm
          open={formOpen}
          mode={mode}
          taxYear={taxYear}
          pfaId={pfaId}
          onClose={() => setFormOpen(false)}
          onSaved={(saved) => setOwn(saved)}
        />
      )}
      {!onOpenHistory && (
        <FiscalProfileHistoryDialog
          open={historyOpen}
          mode={mode}
          taxYear={taxYear}
          pfaId={pfaId}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </Box>
  )
}

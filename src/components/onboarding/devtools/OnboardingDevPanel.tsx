import BugReportRoundedIcon from '@mui/icons-material/BugReportRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  Fab,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { microStepsOf } from '../config'
import { onboardingService } from '../../../services/onboarding.service'
import { getErrorMessage } from '../../../utils/errorHandler'
import { TOKENS } from '../onboardingTheme'
import { useOnboarding } from '../useOnboarding'

/**
 * Panoul de dezvoltare pentru onboarding (spec fix-uri §13.3).
 *
 * Arborele complet: secțiunile (cei 6 pași mari) cu micro-pașii lor dedesubt, pasul curent
 * evidențiat. Click pe orice micro-pas duce direct la el — testarea unui bug de la pasul 06 nu
 * mai cere reparcurgerea întregului flux.
 *
 * Se randează doar când serverul spune `devToolsEnabled` — vezi `OnboardingDevToolsGate`.
 * Nu există un al doilea comutator la build: oricum endpoint-urile sunt cele care decid, iar
 * două flaguri însemnau două lucruri de pornit ca să meargă unul.
 */

/** Scurtătura de deschidere. Ctrl+Shift+D nu se bate cu nimic din browser pe Linux/Windows. */
const SHORTCUT = { key: 'd', ctrl: true, shift: true }

/** Deep link: `?devStep=<idMicroPas>` aterizează direct pe ecranul cerut, după un salt. */
const DEEP_LINK_PARAM = 'devStep'

export default function OnboardingDevPanel() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { state, steps, refresh } = useOnboarding()

  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Ctrl+Shift+D: panoul se deschide fără să existe un buton mereu pe ecran.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey !== SHORTCUT.ctrl || event.shiftKey !== SHORTCUT.shift) return
      if (event.key.toLowerCase() !== SHORTCUT.key) return
      event.preventDefault()
      setOpen((current) => !current)
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const registrationId = state?.pfaRegistrationId ?? null

  const run = async (action: () => Promise<void>) => {
    if (!registrationId) return
    setBusy(true)
    setError(null)
    try {
      await action()
      await refresh()
    } catch (err) {
      setError(getErrorMessage(err, 'Comanda dev a eșuat.'))
    } finally {
      setBusy(false)
    }
  }

  /** Salt la un micro-pas: fixtures pe pașii anteriori, apoi navigare pe ecranul cerut. */
  const jumpTo = async (macroKey: string, microId: string, path: string) => {
    await run(() => onboardingService.devJumpToStep(registrationId!, macroKey))
    navigate(`${path}?pas=${microId}`)
    setOpen(false)
  }

  /**
   * `?devStep=<idMicroPas>` la reîncărcarea paginii: găsim pasul mare căruia îi aparține,
   * sărim acolo cu fixtures și aterizăm pe ecran. Parametrul se consumă, ca un refresh ulterior
   * să nu reia saltul.
   */
  useEffect(() => {
    const requested = searchParams.get(DEEP_LINK_PARAM)
    if (!requested || !registrationId || !state?.devToolsEnabled) return

    const owner = steps.find((step) =>
      microStepsOf(step.key).some((def) => def.id === requested),
    )

    const next = new URLSearchParams(searchParams)
    next.delete(DEEP_LINK_PARAM)
    setSearchParams(next, { replace: true })

    // Amânat un tick: saltul e o cerere de rețea plus o navigare, nu o sincronizare de stare,
    // deci n-are ce căuta în corpul efectului.
    if (owner) {
      const timer = window.setTimeout(() => void jumpTo(owner.key, requested, owner.path), 0)
      return () => window.clearTimeout(timer)
    }

    return undefined
    // Se execută o singură dată pe parametru; restul dependențelor sunt citite la execuție.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, registrationId, state?.devToolsEnabled, steps])

  if (!state?.devToolsEnabled) return null

  return (
    <>
      <Fab
        size="small"
        aria-label="Unelte de dezvoltare"
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          zIndex: 1200,
          bgcolor: TOKENS.pendingBase,
          color: '#fff',
          '&:hover': { bgcolor: TOKENS.pending },
        }}
      >
        <BugReportRoundedIcon fontSize="small" />
      </Fab>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: { xs: '100vw', sm: 420 }, p: 2.5 }}>
          <Stack spacing={2}>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: TOKENS.ink }}>
                Unelte de dezvoltare
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: TOKENS.textMuted }}>
                Ctrl+Shift+D deschide și închide panoul. Sesiunea intră în sandbox la prima
                comandă: fără plăți, fără emailuri, dosare cu filigran „TEST".
              </Typography>
            </Box>

            {error && (
              <Typography sx={{ fontSize: '0.82rem', color: TOKENS.danger }}>{error}</Typography>
            )}

            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<RestartAltRoundedIcon />}
                disabled={busy || !registrationId}
                onClick={() => void run(() => onboardingService.devReset(registrationId!, 'all'))}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Resetează tot
              </Button>
              <Button
                size="small"
                variant="outlined"
                disabled={busy || !registrationId || !state.currentStep}
                onClick={() =>
                  void run(() =>
                    onboardingService.devCompleteStep(registrationId!, state.currentStep!),
                  )
                }
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Completează secțiunea
              </Button>
            </Stack>

            <Divider />

            {steps.map((step) => {
              const micro = microStepsOf(step.key)
              const isCurrent = state.currentStep === step.key

              return (
                <Box key={step.key}>
                  <Stack
                    direction="row"
                    sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        color: isCurrent ? TOKENS.primaryStrong : TOKENS.ink,
                      }}
                    >
                      {step.label}
                    </Typography>
                    <Chip
                      size="small"
                      label={isCurrent ? 'curent' : step.state}
                      sx={{ fontSize: '0.68rem', fontWeight: 700 }}
                    />
                  </Stack>

                  <Stack spacing={0.25} sx={{ mt: 0.75, pl: 1 }}>
                    {micro.length === 0 && (
                      <Typography sx={{ fontSize: '0.78rem', color: TOKENS.textSubtle }}>
                        Pas fără micro-pași configurați.
                      </Typography>
                    )}
                    {micro.map((def) => (
                      <Button
                        key={def.id}
                        size="small"
                        disabled={busy || !registrationId}
                        onClick={() => void jumpTo(step.key, def.id, step.path)}
                        sx={{
                          justifyContent: 'flex-start',
                          textTransform: 'none',
                          color: TOKENS.textMuted,
                          fontSize: '0.8rem',
                          py: 0.25,
                        }}
                      >
                        {def.railLabel}
                      </Button>
                    ))}
                  </Stack>

                  <Stack direction="row" spacing={1} sx={{ mt: 0.75, pl: 1 }}>
                    <Button
                      size="small"
                      disabled={busy || !registrationId}
                      onClick={() =>
                        void run(() => onboardingService.devCompleteStep(registrationId!, step.key))
                      }
                      sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                    >
                      Completează cu date de test
                    </Button>
                    <Button
                      size="small"
                      disabled={busy || !registrationId}
                      onClick={() =>
                        void run(() =>
                          onboardingService.devReset(registrationId!, 'step', step.key),
                        )
                      }
                      sx={{ textTransform: 'none', fontSize: '0.75rem', color: TOKENS.danger }}
                    >
                      Resetează
                    </Button>
                  </Stack>
                </Box>
              )
            })}
          </Stack>
        </Box>
      </Drawer>
    </>
  )
}

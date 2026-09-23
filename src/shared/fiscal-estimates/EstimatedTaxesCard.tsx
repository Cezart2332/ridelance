import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded'

import {
  estimatedTaxesService,
  type EstimatedTaxComponent,
  type EstimatedTaxes,
  type TaxStatus,
} from '../../services/estimatedTaxes.service'
import { FISCAL_PROFILE_CHANGED, currentTaxYear, type FiscalProfileMode } from '../../services/fiscalProfile.service'
import { getErrorMessage } from '../../utils/errorHandler'
import { TaxPaymentsPanel } from './TaxPaymentsPanel'
import { COMPONENT_LABEL, accountantCompletes, coverageGapText, formatLei, reasonText } from './texts'

interface Props {
  mode: FiscalProfileMode
  pfaId?: string
  /** Deschide profilul fiscal (PFA) — CTA-ul pentru „Avem nevoie de o informație”. */
  onEditProfile?: () => void
  /** Duce la chatul cu contabilul — CTA-ul pentru date lipsă. */
  onContactAccountant?: () => void
}

const POLL_MS = 5000

/**
 * „Cât să pui deoparte” (spec taxe §11.2): recomandarea săptămânală, totalul, componentele cu
 * statusul lor. Aceeași componentă pe Acasă, în Taxe estimate și, cu
 * detaliile de calcul, în fișa PFA din admin și contabilitate (§11.3).
 */
export function EstimatedTaxesCard({ mode, pfaId, onEditProfile, onContactAccountant }: Props) {
  const taxYear = currentTaxYear()
  const isStaff = mode !== 'pfa'
  const [data, setData] = useState<EstimatedTaxes | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    estimatedTaxesService
      .get(mode, taxYear, pfaId)
      .then((loaded) => {
        if (cancelled) return
        setData(loaded)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getErrorMessage(err, 'Nu am putut încărca taxele estimate.'))
      })
    return () => {
      cancelled = true
    }
  }, [mode, taxYear, pfaId, reloadToken])

  // Cât motorul calculează, citim din nou: rezultatul apare fără refresh.
  const calculating = data?.status === 'CALCULATING' || data?.stale === true
  useEffect(() => {
    if (!calculating) return undefined
    const timer = window.setTimeout(() => setReloadToken((t) => t + 1), POLL_MS)
    return () => window.clearTimeout(timer)
  }, [calculating, data])

  // Profilul editat în formular: rezultatele vechi nu mai sunt actuale.
  useEffect(() => {
    const reload = () => setReloadToken((t) => t + 1)
    window.addEventListener(FISCAL_PROFILE_CHANGED, reload)
    return () => window.removeEventListener(FISCAL_PROFILE_CHANGED, reload)
  }, [])

  const run = async (action: () => Promise<EstimatedTaxes>) => {
    setBusy(true)
    try {
      setData(await action())
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err, 'Nu am putut salva.'))
    } finally {
      setBusy(false)
    }
  }

  const recalculate = () => run(() => estimatedTaxesService.recalculate(mode, taxYear, pfaId))

  if (!data && !error) {
    return (
      <CardShell>
        <Skeleton variant="text" width="45%" height={32} />
        <Skeleton variant="rounded" height={64} sx={{ my: 1.5 }} />
        <Skeleton variant="text" />
        <Skeleton variant="text" />
      </CardShell>
    )
  }

  if (data?.locked) {
    return isStaff ? (
      <CardShell>
        <Title />
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
          Estimările apar după ce PFA-ul își confirmă profilul fiscal.
        </Typography>
      </CardShell>
    ) : null
  }

  const reserve = data?.reserve ?? null
  const components = data?.components ?? []
  const partial = reserve?.status === 'PARTIAL'
  const hasAmount = reserve && (reserve.status === 'ESTIMATED' || reserve.status === 'PARTIAL') && reserve.total != null

  return (
    <CardShell>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}>
        <Title />
        {partial && <Chip size="small" label="Parțial" color="warning" variant="outlined" sx={{ fontWeight: 700 }} />}
        <Box sx={{ flex: 1 }} />
        {isStaff && (
          <Button size="small" variant="outlined" onClick={() => void recalculate()} disabled={busy || calculating}>
            Recalculează
          </Button>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {error}
        </Alert>
      )}

      {/* ── Recomandarea ── */}
      <Box sx={{ mt: 1.5 }} aria-live="polite">
        {calculating ? (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', py: 1 }}>
            <CircularProgress size={18} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Calculăm estimările cu datele cele mai noi…
            </Typography>
          </Stack>
        ) : hasAmount ? (
          <>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Pune deoparte săptămâna aceasta
            </Typography>
            <Typography data-testid="weekly-amount" sx={{ fontSize: { xs: '2rem', sm: '2.4rem' }, fontWeight: 800, lineHeight: 1.15 }}>
              {formatLei(reserve!.weekly ?? 0)}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Total de pus deoparte: <strong>{formatLei(reserve!.total ?? 0)}</strong>
            </Typography>
            {partial && reserve!.missing.length > 0 && (
              <Typography variant="body2" sx={{ color: 'warning.dark', mt: 0.5, fontWeight: 600 }}>
                Lipsește: {reserve!.missing.map((m) => COMPONENT_LABEL[m] ?? m).join(', ')}. Suma nu e completă.
              </Typography>
            )}
          </>
        ) : (
          <StatusBlock
            status={reserve?.status ?? 'ERROR'}
            reasonCode={reserve?.reasonCode ?? components.find((c) => c.reasonCode)?.reasonCode ?? null}
            missing={components.find((c) => c.missingInputs.length > 0)?.missingInputs ?? []}
            taxYear={taxYear}
            onEditProfile={isStaff ? undefined : onEditProfile}
            onContactAccountant={isStaff ? undefined : onContactAccountant}
            onRetry={() => void recalculate()}
          />
        )}
      </Box>

      {!calculating && data?.warnings?.includes('COVERAGE_GAP') && data.projection?.uncoveredPeriod && (
        <Alert
          severity="info"
          sx={{ mt: 1.5 }}
          action={
            !isStaff && onContactAccountant ? (
              <Button color="inherit" size="small" onClick={onContactAccountant}>
                Scrie contabilului
              </Button>
            ) : undefined
          }
        >
          {coverageGapText(data.projection.uncoveredPeriod, mode)}
        </Alert>
      )}

      {!calculating && data?.warnings?.includes('CAS_THRESHOLD_NEAR') && (
        <Alert severity="warning" sx={{ mt: 1.5 }}>
          Venitul tău se apropie de un plafon CAS. Suma de pus deoparte poate crește.
        </Alert>
      )}

      {/* ── Componentele ── */}
      <Stack component="ul" sx={{ listStyle: 'none', p: 0, m: 0, mt: 2 }} divider={<Divider component="li" aria-hidden />}>
        {components.map((component) => (
          <ComponentRow
            key={component.component}
            component={component}
            calculating={calculating}
            taxYear={taxYear}
            showBreakdown={isStaff}
            onEditProfile={isStaff ? undefined : onEditProfile}
          />
        ))}
      </Stack>

      {/* Plățile înregistrate de contabil se scad din total — spunem asta doar când există. */}
      {!calculating && reserve && reserve.recordedTaxPayments > 0 && (
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>
          Am scăzut ce ai plătit deja în {taxYear}: {formatLei(reserve.recordedTaxPayments)}.
        </Typography>
      )}

      {isStaff && data && <StaffDetails data={data} />}
      {isStaff && pfaId && <TaxPaymentsPanel pfaId={pfaId} taxYear={taxYear} onChanged={() => setReloadToken((t) => t + 1)} />}
    </CardShell>
  )
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <Box
      component="section"
      aria-labelledby="estimated-taxes-title"
      data-testid="estimated-taxes-card"
      sx={(theme) => ({
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: theme.shadows[1],
        p: { xs: 2, sm: 3 },
        height: '100%',
        minWidth: 0,
      })}
    >
      {children}
    </Box>
  )
}

function Title() {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Box
        aria-hidden
        sx={(theme) => ({
          width: 32,
          height: 32,
          borderRadius: 1,
          display: 'grid',
          placeItems: 'center',
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          color: 'primary.main',
        })}
      >
        <SavingsRoundedIcon sx={{ fontSize: 18 }} />
      </Box>
      <Typography id="estimated-taxes-title" variant="h6" component="h2" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
        Cât să pui deoparte
      </Typography>
    </Stack>
  )
}

function StatusBlock({
  status,
  reasonCode,
  missing,
  taxYear,
  onEditProfile,
  onContactAccountant,
  onRetry,
}: {
  status: TaxStatus
  reasonCode: string | null
  missing: string[]
  taxYear: number
  onEditProfile?: () => void
  onContactAccountant?: () => void
  onRetry: () => void
}) {
  if (status === 'ERROR') {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={onRetry}>Reîncearcă</Button>}>
        Nu am putut calcula estimările.
      </Alert>
    )
  }

  if (status === 'RULE_UNAVAILABLE') {
    return <Alert severity="info">Estimările nu sunt încă disponibile pentru {taxYear}.</Alert>
  }

  const clarification = status === 'REQUIRES_CLARIFICATION'
  // Ce completează contabilul nu se rezolvă din profil: PFA-ul îi scrie contabilului.
  const byAccountant = clarification && accountantCompletes(reasonCode, missing)
  return (
    <Alert
      severity={clarification ? 'info' : 'warning'}
      action={
        byAccountant && onContactAccountant ? (
          <Button color="inherit" size="small" onClick={onContactAccountant}>
            Scrie contabilului
          </Button>
        ) : clarification && !byAccountant && onEditProfile ? (
          <Button color="inherit" size="small" onClick={onEditProfile}>
            Actualizează profilul
          </Button>
        ) : !clarification && onContactAccountant ? (
          <Button color="inherit" size="small" onClick={onContactAccountant}>
            Scrie contabilului
          </Button>
        ) : undefined
      }
    >
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        {byAccountant ? 'Așteptăm datele de la contabil' : clarification ? 'Avem nevoie de o informație' : 'Date insuficiente'}
      </Typography>
      <Typography variant="body2">{reasonText(reasonCode, missing, taxYear)}</Typography>
    </Alert>
  )
}

function ComponentRow({
  component,
  calculating,
  taxYear,
  showBreakdown,
  onEditProfile,
}: {
  component: EstimatedTaxComponent
  calculating: boolean
  taxYear: number
  showBreakdown: boolean
  onEditProfile?: () => void
}) {
  const [open, setOpen] = useState(false)
  const label = COMPONENT_LABEL[component.component] ?? component.component
  const platform = component.component === 'PLATFORM_TAXES'

  let value: React.ReactNode
  if (platform || component.status === 'NOT_CONFIGURED') {
    value = <Typography variant="body2" sx={{ color: 'text.secondary' }}>În curs de configurare</Typography>
  } else if (calculating || component.status === 'CALCULATING') {
    value = <Skeleton variant="text" width={72} />
  } else if (component.status === 'ESTIMATED') {
    value = <Typography variant="body2" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatLei(component.amount ?? 0)}</Typography>
  } else if (component.status === 'REQUIRES_CLARIFICATION') {
    value = onEditProfile && !accountantCompletes(component.reasonCode, component.missingInputs) ? (
      <Button size="small" onClick={onEditProfile} sx={{ p: 0, minWidth: 0 }}>
        Avem nevoie de o informație
      </Button>
    ) : (
      <Typography variant="body2" sx={{ color: 'info.main', fontWeight: 600 }}>De clarificat</Typography>
    )
  } else if (component.status === 'RULE_UNAVAILABLE') {
    value = <Typography variant="body2" sx={{ color: 'text.secondary' }}>Indisponibil pentru acest an</Typography>
  } else if (component.status === 'ERROR') {
    value = <Typography variant="body2" sx={{ color: 'error.main' }}>Nu am putut calcula</Typography>
  } else {
    value = <Typography variant="body2" sx={{ color: 'warning.dark', fontWeight: 600 }}>Date insuficiente</Typography>
  }

  const detail =
    !calculating && component.reasonCode && component.status !== 'ESTIMATED'
      ? reasonText(component.reasonCode, component.missingInputs, taxYear)
      : null
  const expandable = showBreakdown && component.breakdown && Object.keys(component.breakdown).length > 0

  return (
    <Box component="li" sx={{ py: 1 }} data-component={component.component}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {label}
            {!platform && (
              <Box component="span" sx={{ color: 'text.disabled', ml: 0.5 }}>
                · anual
              </Box>
            )}
          </Typography>
          {expandable && (
            <IconButton size="small" aria-label={`Calculul pentru ${label}`} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
              <ExpandMoreRoundedIcon fontSize="small" sx={{ transform: open ? 'rotate(180deg)' : 'none' }} />
            </IconButton>
          )}
        </Stack>
        <Box sx={{ flexShrink: 0, textAlign: 'right' }}>{value}</Box>
      </Stack>
      {detail && (
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
          {detail}
        </Typography>
      )}
      {expandable && (
        <Collapse in={open}>
          <Box
            component="dl"
            sx={(theme) => ({
              m: 0,
              mt: 1,
              p: 1.5,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.text.primary, 0.03),
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              columnGap: 2,
              rowGap: 0.5,
              fontSize: '0.8rem',
            })}
          >
            {Object.entries(component.breakdown!).map(([key, raw]) => (
              <Box key={key} sx={{ display: 'contents' }}>
                <Box component="dt" sx={{ color: 'text.secondary' }}>{key}</Box>
                <Box component="dd" sx={{ m: 0, fontVariantNumeric: 'tabular-nums', overflowWrap: 'anywhere' }}>
                  {raw == null ? '—' : String(raw)}
                </Box>
              </Box>
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  )
}

/** Pentru admin și contabilitate: pe ce s-a calculat și istoricul rulărilor (§11.3). */
function StaffDetails({ data }: { data: EstimatedTaxes }) {
  const projection = data.projection
  return (
    <Box sx={{ mt: 2 }}>
      <Divider sx={{ mb: 1.5 }} />
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        Detalii calcul
      </Typography>
      <Box
        sx={{
          mt: 1,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          gap: 1,
          fontSize: '0.85rem',
        }}
      >
        <Detail label="Versiune reguli" value={data.ruleVersion ?? '—'} />
        <Detail label="Revizie profil" value={data.profileRevision != null ? String(data.profileRevision) : '—'} />
        <Detail label="Date la" value={data.asOf ? new Date(data.asOf).toLocaleDateString('ro-RO') : '—'} />
        <Detail label="Snapshot" value={data.financialSnapshotId?.slice(0, 8) ?? '—'} />
        {projection && (
          <>
            <Detail label="Net realizat" value={formatLei(projection.netRealized)} />
            <Detail label="Net anual estimat" value={projection.netAnnualEstimated != null ? formatLei(projection.netAnnualEstimated) : '—'} />
            <Detail label="Medie săptămânală" value={projection.weeklyAverage != null ? formatLei(projection.weeklyAverage) : '—'} />
            <Detail label="Săptămâni folosite / rămase" value={`${projection.weeksUsed} / ${projection.weeksRemaining}`} />
          </>
        )}
      </Box>

      {!!data.runs?.length && (
        <>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 2 }}>
            Istoric rulări
          </Typography>
          <Stack component="ul" spacing={0.5} sx={{ listStyle: 'none', p: 0, m: 0, mt: 0.5 }}>
            {data.runs.map((run) => (
              <Typography key={run.id} component="li" variant="body2" sx={{ color: 'text.secondary' }}>
                {new Date(run.createdAtUtc).toLocaleString('ro-RO', { dateStyle: 'short', timeStyle: 'short' })} · {run.status}
                {run.stale ? ' · expirată' : ''} · rev. {run.profileRevision} · {run.ruleVersion ?? '—'}
              </Typography>
            ))}
          </Stack>
        </>
      )}
    </Box>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
        {value}
      </Typography>
    </Box>
  )
}

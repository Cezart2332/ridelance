import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import { Alert, Box, Button, Chip, Divider, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'

import { documentService } from '../../services/document.service'
import { onboardingService, type ArrState, type ArrSubmissionMethod } from '../../services/onboarding.service'
import { getErrorMessage } from '../../utils/errorHandler'
import { requirementsOf } from './documentRequirements'
import { StepDocument } from './StepDocument'
import { TOKENS, inputSx } from './onboardingTheme'
import { useOnboarding, useOnboardingResource } from './useOnboarding'
import { PanelCard, PanelHeading } from './PanelCard'

const STATUS_LABELS: Record<string, string> = {
  Draft: 'Inițiată',
  DossierGenerated: 'Dosar generat',
  Submitted: 'Depusă la ARR',
  Issued: 'Autorizație emisă',
  Rejected: 'Respinsă',
}

/**
 * Documentele dosarului ARR — userul doar le încarcă, datele se citesc automat (OCR). Autorizația
 * emisă se cere separat, abia după depunere.
 */
const ARR_DOCUMENTS = requirementsOf('arr').filter((req) => req.category !== 'AutorizatieTransportAlternativ')

export default function OnboardingArrPage() {
  const { refresh } = useOnboarding()
  const { data: loaded } = useOnboardingResource('arr', () => onboardingService.getArrState())

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<ArrState | null>(null)
  const arr = saved ?? loaded

  // Câmpurile urmăresc serverul până când userul le atinge — apoi rămân ale lui.
  const [form, setForm] = useState<{ agencyName: string; method: ArrSubmissionMethod } | null>(null)
  const agencyName = form?.agencyName ?? arr?.agencyName ?? ''
  const method = form?.method ?? arr?.submissionMethod ?? 'InPersonByClient'
  const setAgencyName = (value: string) => setForm({ agencyName: value, method })
  const setMethod = (value: ArrSubmissionMethod) => setForm({ agencyName, method: value })

  const applyArr = (next: ArrState | null) => {
    setSaved(next)
    setForm(null)
    void refresh()
  }

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const saveRequest = () =>
    run(async () => applyArr(await onboardingService.submitArrRequest(agencyName || null, method)))
  const generate = () => run(async () => applyArr(await onboardingService.generateArrDossier()))
  const markSubmitted = () =>
    run(async () => {
      await onboardingService.markArrSubmitted()
      applyArr(await onboardingService.getArrState())
    })

  const fee = ((arr?.feeSnapshotBani ?? 30000) / 100).toLocaleString('ro-RO', { minimumFractionDigits: 2 })

  return (
    <Stack spacing={3}>
      <PanelHeading title="Autorizație de transport alternativ (ARR)" />

      {error && (
        <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
          {error}
        </Alert>
      )}

      <PanelCard
        title="Documentele pentru autorizație"
        action={<Chip label={`Taxă ARR ${fee} lei`} size="small" sx={{ fontWeight: 700 }} />}
      >
        <Stack spacing={2.5}>
          {ARR_DOCUMENTS.map((d) => (
            <StepDocument key={d.category} step="arr" category={d.category} />
          ))}
        </Stack>
      </PanelCard>

      {arr && (
        <Chip
          label={STATUS_LABELS[arr.status] ?? arr.status}
          sx={{ alignSelf: 'flex-start', fontWeight: 700 }}
          color={arr.status === 'Issued' ? 'success' : 'default'}
        />
      )}

      <PanelCard title="Unde depui dosarul">
        <Stack spacing={2}>
          <TextField
            label="Agenție ARR (județ)"
            value={agencyName}
            onChange={(e) => setAgencyName(e.target.value)}
            sx={inputSx}
            fullWidth
          />
          <TextField
            select
            label="Metodă de depunere"
            value={method}
            onChange={(e) => setMethod(e.target.value as ArrSubmissionMethod)}
            sx={inputSx}
            fullWidth
          >
            <MenuItem value="InPersonByClient">Depun personal la ARR</MenuItem>
            <MenuItem value="OnlineByRidelance">Depunere online prin RIDElance</MenuItem>
          </TextField>
          <Box>
            <Button
              variant="outlined"
              onClick={saveRequest}
              disabled={busy}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderColor: TOKENS.primary,
                color: TOKENS.primaryStrong,
              }}
            >
              Salvează cererea
            </Button>
          </Box>
        </Stack>
      </PanelCard>

      <PanelCard title="Dosarul ARR">
        {arr?.hasDossier && arr.dossierDocumentId ? (
          <Stack spacing={1.5}>
            <Alert
              icon={<CheckCircleOutlineRoundedIcon />}
              severity="success"
              sx={{ borderRadius: `${TOKENS.radius.md}px` }}
            >
              Dosarul a fost generat.
            </Alert>
            <Button
              startIcon={<DescriptionRoundedIcon />}
              onClick={() => documentService.openInNewTab(arr.dossierDocumentId!, 'Dosar_ARR.pdf')}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                color: TOKENS.primaryStrong,
                alignSelf: 'flex-start',
              }}
            >
              Vezi dosarul
            </Button>
            <Button
              onClick={generate}
              disabled={busy}
              sx={{ textTransform: 'none', color: TOKENS.textMuted, alignSelf: 'flex-start' }}
            >
              Regenerează
            </Button>
          </Stack>
        ) : (
          <Button
            variant="contained"
            onClick={generate}
            disabled={busy || !arr}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              backgroundColor: TOKENS.primary,
              '&:hover': { backgroundColor: TOKENS.primaryStrong },
            }}
          >
            {busy ? 'Se generează...' : 'Generează dosarul'}
          </Button>
        )}

        {arr?.hasDossier && (
          <>
            <Divider sx={{ my: 2 }} />
            {arr.submittedAtUtc ? (
              <Typography sx={{ color: TOKENS.success, fontWeight: 700 }}>
                Ai marcat dosarul ca depus la ARR.
              </Typography>
            ) : (
              <Button
                variant="contained"
                onClick={markSubmitted}
                disabled={busy}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  backgroundColor: TOKENS.primary,
                  '&:hover': { backgroundColor: TOKENS.primaryStrong },
                }}
              >
                Am depus dosarul la ARR
              </Button>
            )}
          </>
        )}
      </PanelCard>

      {/* Autorizația primită de la ARR — datele ei (număr, expirare) se citesc automat. */}
      {arr?.submittedAtUtc && (
        <PanelCard title="Autorizația primită de la ARR">
          <StepDocument step="arr" category="AutorizatieTransportAlternativ" />
        </PanelCard>
      )}

      {arr?.status === 'Issued' && (
        <Alert severity="success" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
          Autorizație emisă{arr.authorizationNumber ? ` (nr. ${arr.authorizationNumber})` : ''}
          {arr.authorizationExpiresOn ? `, valabilă până la ${arr.authorizationExpiresOn}` : ''}.
        </Alert>
      )}
    </Stack>
  )
}

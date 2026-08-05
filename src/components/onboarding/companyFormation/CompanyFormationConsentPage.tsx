import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  companyFormationService,
  type LegalConsentFlow,
} from '../../../services/companyFormation.service'
import { PanelCard, PanelHeading } from '../PanelCard'
import { TOKENS, displaySx } from '../onboardingTheme'
import { useOnboardingResource } from '../useOnboarding'
import { ConsentWizard } from './ConsentWizard'
import { SignaturePad, type SignatureResult } from './SignaturePad'
import { useCompanyFormation } from './useCompanyFormation'

/** Momentul semnării, pe fusul României — ora vine de la server. */
function formatSignedAt(iso: string): string {
  return new Date(iso).toLocaleString('ro-RO', {
    timeZone: 'Europe/Bucharest',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/** Etapa 3: cele cinci declarații, apoi specimenul de semnătură. */
export default function CompanyFormationConsentPage() {
  const navigate = useNavigate()
  const { state, save, saving, error } = useCompanyFormation()
  const { data: flow } = useOnboardingResource<LegalConsentFlow>('consentFlow', () =>
    companyFormationService.getConsentFlow(),
  )

  const [consentDone, setConsentDone] = useState(false)
  const [signature, setSignature] = useState<SignatureResult | null>(null)
  const [cannotSign, setCannotSign] = useState(false)

  // Cheia se generează o dată per pagină: un dublu-click trimite aceeași cheie, deci
  // serverul întoarce rezultatul primei cereri în loc să semneze a doua oară.
  const idempotencyKey = useRef(newIdempotencyKey())

  const signedAt = state?.signature?.signedAtUtc ?? null

  const steps = useMemo(() => flow?.steps ?? [], [flow])

  if (!state) return null

  // --- Ecranul de succes ---
  if (signedAt) {
    return (
      <Stack spacing={3}>
        <PanelHeading title="Cerere trimisă cu succes" />
        <PanelCard>
          <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center', py: 2 }}>
            <CheckCircleRoundedIcon sx={{ fontSize: 48, color: TOKENS.success }} />
            <Typography sx={{ ...displaySx, fontWeight: 700, color: TOKENS.ink }}>
              Ai semnat la data de {formatSignedAt(signedAt)}
            </Typography>
            <Typography sx={{ color: TOKENS.textMuted, maxWidth: 460 }}>
              O copie a documentelor semnate îți va fi trimisă pe e-mail în maximum 24 de ore.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/onboarding')}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                backgroundColor: TOKENS.primary,
                '&:hover': { backgroundColor: TOKENS.primaryStrong },
              }}
            >
              Înapoi la contul meu
            </Button>
          </Stack>
        </PanelCard>
      </Stack>
    )
  }

  if (!state.registeredOfficeComplete) {
    return (
      <Stack spacing={3}>
        <PanelHeading title="Acord de consimțământ" />
        <Alert
          severity="info"
          sx={{ borderRadius: `${TOKENS.radius.md}px` }}
          action={
            <Button
              onClick={() => navigate('/onboarding/pfa/sediu')}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Mergi la sediu
            </Button>
          }
        >
          Completează întâi sediul social.
        </Alert>
      </Stack>
    )
  }

  const submit = async () => {
    if (!signature) return

    await save(() =>
      companyFormationService.sign(
        {
          signatureImage: signature.image,
          signatureVector: JSON.stringify(signature.strokes),
          canvasWidth: signature.canvasWidth,
          canvasHeight: signature.canvasHeight,
          consents: steps.map((s) => ({ stepKey: s.key })),
        },
        idempotencyKey.current,
      ),
    )
  }

  return (
    <Stack spacing={3}>
      <PanelHeading title="Acord de consimțământ" />

      {error && (
        <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
          {error}
        </Alert>
      )}

      {steps.length === 0 ? (
        <Stack spacing={2} sx={{ alignItems: 'center', py: 6 }}>
          <CircularProgress sx={{ color: TOKENS.primary }} />
        </Stack>
      ) : !consentDone ? (
        <ConsentWizard steps={steps} onComplete={() => setConsentDone(true)} disabled={saving} />
      ) : (
        <>
          <PanelCard title="Semnătură de consimțământ">
            <Stack spacing={2}>
              <Typography sx={{ color: TOKENS.ink, lineHeight: 1.65 }}>
                Prin această semnătură confirmi că ai citit, înțeles și acceptat toate declarațiile
                de mai sus și că semnătura aplicată are valoare juridică.
              </Typography>

              <SignaturePad onChange={setSignature} disabled={saving} />
            </Stack>
          </PanelCard>

          {cannotSign && (
            <Alert severity="info" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
              Scrie-ne la contact@ridelance.ro și îți trimitem o alternativă la semnarea pe ecran.
            </Alert>
          )}

          <Stack
            direction={{ xs: 'column-reverse', sm: 'row' }}
            spacing={1.5}
            sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
          >
            <Button
              onClick={() => setCannotSign(true)}
              sx={{ textTransform: 'none', fontWeight: 700, color: TOKENS.textMuted }}
            >
              Nu pot semna pe ecran
            </Button>

            <Button
              variant="contained"
              onClick={() => void submit()}
              disabled={saving || signature === null}
              startIcon={
                saving ? <CircularProgress size={16} sx={{ color: alpha('#fff', 0.9) }} /> : undefined
              }
              sx={{
                ...displaySx,
                textTransform: 'none',
                fontWeight: 700,
                backgroundColor: TOKENS.primary,
                '&:hover': { backgroundColor: TOKENS.primaryStrong },
              }}
            >
              Confirmă semnătura
            </Button>
          </Stack>

          <Box sx={{ height: 8 }} />
        </>
      )}
    </Stack>
  )
}

import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import { Alert, Box, LinearProgress, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useState } from 'react'

import { documentService, isAiPending, type DocumentSummary } from '../../services/document.service'
import { pfaService, type PfaCompanyInfo } from '../../services/pfa.service'
import { TOKENS } from './onboardingTheme'

const FIELD_LABELS: Record<string, string> = {
  cui: 'CUI',
  legal_name: 'Denumire',
  caen_codes: 'CAEN',
}

/**
 * Ce am citit din certificatul de înregistrare — strict informativ, fără pas de confirmare:
 * fluxul rămâne document-first, userul doar încarcă, iar adminul verifică la aprobare.
 *
 * În plus confruntăm CUI-ul citit cu registrul ANAF, ca o citire greșită sau un PFA radiat să se
 * vadă aici, nu abia la aprobare.
 */
export function CertificateReadout({ document }: { document: DocumentSummary }) {
  const [fields, setFields] = useState<{ key: string; value: string }[] | null>(null)
  const [company, setCompany] = useState<PfaCompanyInfo | null>(null)

  const pending = isAiPending(document)

  useEffect(() => {
    if (pending) return

    let cancelled = false

    const run = async () => {
      try {
        const response = await documentService.getExtractedFields(document.id)
        if (cancelled) return

        const read = response.fields
          .filter((f) => f.effectiveValue !== null && FIELD_LABELS[f.fieldKey] !== undefined)
          .map((f) => ({ key: f.fieldKey, value: f.effectiveValue! }))
        setFields(read)

        // ANAF e o verificare în plus peste OCR, nu o condiție: dacă pică, nu arătăm nimic.
        const cui = read.find((f) => f.key === 'cui')?.value
        if (!cui) return
        const info = await pfaService.getCompanyInfo(cui)
        if (!cancelled) setCompany(info)
      } catch {
        // Citirea e informativă — o eroare aici nu are ce să blocheze.
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [document.id, pending])

  if (pending) {
    return (
      <Box>
        <Typography sx={{ fontSize: '0.85rem', color: TOKENS.pending, fontWeight: 600, mb: 0.6 }}>
          Citim certificatul — CUI-ul, denumirea și codurile CAEN apar aici în câteva secunde.
        </Typography>
        <LinearProgress
          sx={{
            height: 3,
            borderRadius: TOKENS.radius.full,
            backgroundColor: alpha(TOKENS.pendingBase, 0.15),
            '& .MuiLinearProgress-bar': { backgroundColor: TOKENS.pending },
          }}
        />
      </Box>
    )
  }

  if (fields === null || fields.length === 0) {
    return null
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: `${TOKENS.radius.lg}px`,
        border: `1px solid ${alpha(TOKENS.success, 0.3)}`,
        backgroundColor: alpha(TOKENS.success, 0.05),
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.8 }}>
        <CheckCircleOutlineRoundedIcon sx={{ fontSize: 18, color: TOKENS.success }} />
        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: TOKENS.success }}>
          Am citit din certificat
        </Typography>
      </Stack>

      <Stack spacing={0.3}>
        {fields.map((field) => (
          <Typography key={field.key} sx={{ color: TOKENS.textMuted, fontSize: '0.82rem' }}>
            {FIELD_LABELS[field.key]}: <strong>{field.value}</strong>
          </Typography>
        ))}
      </Stack>

      {company && (
        <Typography sx={{ mt: 0.8, color: TOKENS.textMuted, fontSize: '0.82rem' }}>
          Confirmat la ANAF: {company.name}
          {company.address ? ` · ${company.address}` : ''}
        </Typography>
      )}

      {company && !company.isActive && (
        <Alert severity="warning" sx={{ mt: 1, borderRadius: `${TOKENS.radius.md}px` }}>
          Atenție: acest CUI figurează ca radiat sau inactiv la ANAF. Scrie-ne dacă e o greșeală.
        </Alert>
      )}
    </Paper>
  )
}

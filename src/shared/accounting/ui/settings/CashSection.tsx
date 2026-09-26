import { useState } from 'react'
import { Alert, Box, Button, Paper, Stack, Step, StepLabel, Stepper, Typography } from '@mui/material'

import { accountingApi } from '../../api/accountingApi'
import type { CashRegisterState, CashRegisterStatus, PfaAccountingSummary } from '../../api/types'
import { canTransitionCash } from '../../cashWorkflow'
import { formatDate } from '../../format'
import { CASH_REGISTER_STATUS } from '../../statusLabels'
import { AccountingBadge, Fact, ReasonDialog } from '../components'
import { useNotify } from '../notify'

/** Traseul afișat: INACTIV → ÎN VERIFICARE → ACTIV (cererea clientului, `PENDING`, stă pe primul pas). */
const STEPS: { status: CashRegisterStatus; label: string }[] = [
  { status: 'NOT_REQUIRED_CURRENT_CONFIGURATION', label: 'Inactiv' },
  { status: 'IN_VERIFICATION', label: 'În verificare' },
  { status: 'ACTIVE', label: 'Activ' },
]

function stepOf(status: CashRegisterStatus): number {
  if (status === 'PENDING') return 0
  return STEPS.findIndex((step) => step.status === status)
}

interface Transition {
  to: CashRegisterStatus
  title: string
  confirmLabel: string
  description: string
}

const TRANSITIONS: Transition[] = [
  {
    to: 'IN_VERIFICATION',
    title: 'Pornește verificarea',
    confirmLabel: 'Trece în verificare',
    description: 'Clientul trimite dovada de fiscalizare a casei de marcat; numerarul rămâne inactiv până la verificare.',
  },
  {
    to: 'ACTIVE',
    title: 'Activează numerarul',
    confirmLabel: 'Activează',
    description: 'Dovada de fiscalizare e obligatorie. Se înregistrează cine a verificat și data activării.',
  },
  {
    to: 'NOT_REQUIRED_CURRENT_CONFIGURATION',
    title: 'Dezactivează numerarul',
    confirmLabel: 'Dezactivează',
    description: 'Rapoartele Z nu se mai pot încărca după dezactivare. Istoricul rămâne.',
  },
]

/** F7: activarea plăților în numerar, cu verificare obligatorie și dovada de fiscalizare. */
export function CashSection({ summary, cash, onChanged }: { summary: PfaAccountingSummary; cash: CashRegisterState; onChanged: () => void }) {
  const notify = useNotify()
  const [transition, setTransition] = useState<Transition | null>(null)
  const [evidence, setEvidence] = useState<File | null>(null)
  const available = summary.readOnly ? [] : TRANSITIONS.filter((item) => canTransitionCash(cash.status, item.to))
  const needsEvidence = transition?.to === 'ACTIVE'

  const close = () => {
    setTransition(null)
    setEvidence(null)
  }

  const submit = async (note: string) => {
    if (!transition) return
    let evidenceDocumentId: string | undefined
    if (needsEvidence) {
      if (!evidence) throw new Error('Încarcă dovada de fiscalizare.')
      evidenceDocumentId = (await accountingApi.pfas.uploadCashEvidence(summary.id, evidence)).documentId
    }
    await accountingApi.pfas.transitionCash(summary.id, { to: transition.to, note, evidenceDocumentId })
    notify(`Numerar: ${CASH_REGISTER_STATUS[transition.to].label}.`, 'success')
    setEvidence(null)
    onChanged()
  }

  return (
    <Paper sx={{ p: 2.5 }}>
      <Stack spacing={2}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h2">Numerar și casa de marcat</Typography>
          <AccountingBadge descriptor={CASH_REGISTER_STATUS[cash.status]} />
        </Stack>

        <Stepper activeStep={stepOf(cash.status)} alternativeLabel>
          {STEPS.map((step, index) => (
            <Step key={step.status} completed={index < stepOf(cash.status) || (cash.status === 'ACTIVE' && step.status === 'ACTIVE')}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {cash.status === 'PENDING' && (
          <Alert severity="info">Clientul a cerut în onboarding să accepte și numerar. Pornește verificarea când trimite dovada de fiscalizare.</Alert>
        )}

        <Stack direction="row" sx={{ gap: 4, flexWrap: 'wrap' }}>
          <Fact label="Cerut de client">{cash.cashRequested ? 'Da' : 'Nu'}</Fact>
          <Fact label="Data activării">{formatDate(cash.activationDate)}</Fact>
          <Fact label="Verificat de">{cash.verifiedBy?.name ?? '—'}</Fact>
          <Fact label="Dovada de fiscalizare">{cash.evidenceFile?.fileName ?? '—'}</Fact>
        </Stack>

        <Alert severity="warning">Activează cash în conturile Fleet doar după verificare.</Alert>

        {available.length > 0 && (
          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
            {available.map((item, index) => (
              <Button key={item.to} variant={index === 0 ? 'contained' : 'outlined'} onClick={() => setTransition(item)}>
                {item.title}
              </Button>
            ))}
          </Stack>
        )}
      </Stack>

      <ReasonDialog
        open={transition !== null}
        title={transition?.title ?? ''}
        description={transition?.description}
        reasonLabel="Notă"
        confirmLabel={transition?.confirmLabel}
        canSubmit={!needsEvidence || evidence !== null}
        onClose={close}
        onSubmit={submit}
      >
        {needsEvidence && (
          <Box>
            <Button variant="outlined" component="label">
              {evidence ? evidence.name : 'Încarcă dovada de fiscalizare (obligatoriu)'}
              <input hidden type="file" accept="application/pdf,.pdf,image/*" onChange={(event) => setEvidence(event.target.files?.[0] ?? null)} />
            </Button>
          </Box>
        )}
      </ReasonDialog>
    </Paper>
  )
}

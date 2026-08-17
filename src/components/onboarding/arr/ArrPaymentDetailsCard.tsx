import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import { Alert, Box, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { useState } from 'react'

import { onboardingService, type ArrAccount } from '../../../services/onboarding.service'
import { TOKENS, tabularSx } from '../onboardingTheme'
import { useOnboardingResource } from '../useOnboarding'

/**
 * Contul în care se plătește tariful ARR, pentru județul ales.
 *
 * O singură componentă, folosită pe toate ramurile (cu PFA / fără PFA / proprietate / leasing /
 * comodat). Înainte era scrisă separat pe câteva dintre ele și lipsea de pe restul — exact
 * mecanismul prin care un fix prindea o ramură și rata două.
 */

/** IBAN-ul se citește în grupuri de patru. Se copiază fără spații — așa îl vrea banca. */
const groupIban = (iban: string) => iban.replace(/(.{4})/g, '$1 ').trim()

function CopyableRow({ label, value, copyValue }: { label: string; value: string; copyValue?: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(copyValue ?? value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: TOKENS.textMuted }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: '0.95rem', color: TOKENS.ink, wordBreak: 'break-all', ...tabularSx }}>
          {value}
        </Typography>
      </Box>
      <Tooltip title={copied ? 'Copiat' : `Copiază ${label.toLowerCase()}`}>
        <IconButton
          size="small"
          onClick={() => void copy()}
          aria-label={`Copiază ${label.toLowerCase()}`}
          sx={{ flexShrink: 0, color: copied ? TOKENS.success : TOKENS.textMuted }}
        >
          {copied ? (
            <CheckRoundedIcon fontSize="small" />
          ) : (
            <ContentCopyRoundedIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
    </Stack>
  )
}

function PlainRow({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: TOKENS.textMuted }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '0.95rem', color: TOKENS.ink }}>{value}</Typography>
    </Box>
  )
}

interface ArrPaymentDetailsCardProps {
  county: string | null
  /**
   * Suma de plată, în bani — doar pe pasul de vehicul (copie conformă și ecusoane). Pe pasul ARR
   * nu afișăm tariful de autorizație: suma variază și o confirmăm separat înainte de depunere.
   *
   * `0` sau `null` înseamnă „încă nu o știm" și se afișează ca atare.
   */
  amountBani?: number | null
  /** Ce se plătește, pe scurt. Absent = nu se afișează câmpul de sumă. */
  amountLabel?: string
}

export function ArrPaymentDetailsCard({
  county,
  amountBani,
  amountLabel,
}: ArrPaymentDetailsCardProps) {
  const { data: accounts } = useOnboardingResource('arrAccounts', () =>
    onboardingService.getArrAccounts(),
  )

  const account = findAccount(accounts ?? [], county)

  if (!county) {
    return (
      <Alert severity="info" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
        Alege județul agenției ca să-ți arătăm contul în care se plătește tariful ARR.
      </Alert>
    )
  }

  if (!account) {
    return (
      <Alert severity="warning" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
        Nu avem încă datele de plată pentru județul {county}. Scrie-ne din butonul „Suport" și ți
        le trimitem.
      </Alert>
    )
  }

  return (
    <Stack
      spacing={2}
      sx={{
        p: 2.5,
        borderRadius: `${TOKENS.radius.lg}px`,
        border: `1px solid ${TOKENS.border}`,
        backgroundColor: TOKENS.surface,
      }}
    >
      <PlainRow label="Beneficiar" value={account.beneficiaryName} />
      <CopyableRow label="Cod fiscal" value={account.fiscalCode} />
      <CopyableRow label="IBAN" value={groupIban(account.iban)} copyValue={account.iban} />
      <PlainRow label="Trezoreria" value={account.treasury} />

      {amountLabel &&
        (amountBani != null && amountBani > 0 ? (
          <PlainRow
            label={`Sumă de plată — ${amountLabel}`}
            value={`${(amountBani / 100).toLocaleString('ro-RO', { minimumFractionDigits: 2 })} lei`}
          />
        ) : (
          <Box>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: TOKENS.textMuted }}>
              Sumă de plată — {amountLabel}
            </Typography>
            <Typography sx={{ fontSize: '0.95rem', color: TOKENS.pending }}>
              Tariful nu e încă înregistrat în sistem — îl confirmăm înainte de depunere.
            </Typography>
          </Box>
        ))}

      <Typography sx={{ fontSize: '0.85rem', color: TOKENS.textMuted, lineHeight: 1.6 }}>
        Plata se face prin transfer bancar în contul de mai sus. Păstrează chitanța sau ordinul de
        plată: dovada se atașează la dosarul depus la agenție.
      </Typography>
    </Stack>
  )
}

/**
 * Județul ales poate veni cu diacritice, fără ele sau cu prefixul „ARR". Comparăm pe forma
 * fără diacritice, ca „Bistrita-Nasaud" să găsească „Bistrița-Năsăud".
 */
function findAccount(accounts: ArrAccount[], county: string | null): ArrAccount | null {
  if (!county) return null
  const wanted = fold(county)
  return accounts.find((a) => fold(a.countyName) === wanted) ?? null
}

const fold = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

import { Alert, Box, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import { useEffect, useState, type ReactNode } from 'react'

import type { ArrFleetState } from '../../../services/onboarding.service'
import { stripeService } from '../../../services/stripe.service'
import { bankService, type BankConnectionDto, type BankTransactionDto } from '../../../services/bank.service'
import { getErrorMessage } from '../../../utils/errorHandler'
import { BankAccountCta } from '../../common/BankAccountCta'
import { BankConnectPanel } from '../../banking/BankConnectPanel'
import { InsuranceLinksGrid } from '../../insurance/InsuranceLinksGrid'
import { CompanyFormationSummary } from '../companyFormation/CompanyFormationSummary'
import { PfaPendingCard } from '../pfa/PfaPendingCard'
import type { MicroStepContext, MicroStepSlot } from '../microStepTypes'
import { TOKENS } from '../onboardingTheme'
import { useOnboarding } from '../useOnboarding'

/**
 * Blocurile bogate pe care le poate cere un micro-pas, într-un singur loc.
 *
 * De ce un registru și nu JSX în config: fișierele din `config/` sunt date — se citesc ca o
 * listă de ecrane, nu ca o componentă. Iar faptul că fiecare bloc are exact o implementare e
 * chiar fix-ul cerut: „conturi ARR" și „generare dosar" apar pe patru ramuri, iar înainte
 * fiecare avea propria copie, deci fix-urile prindeau doar una.
 */
export function MicroStepSlotContent({
  slot,
  context,
  category,
}: {
  slot: MicroStepSlot
  context: MicroStepContext
  /** Categoria documentului de pe ecran: plata a cărei dovadă se încarcă acolo. */
  category?: string
}): ReactNode {
  switch (slot) {
    case 'bankAccountCta':
      return <BankAccountCta />
    case 'bankConnect':
      return <BankConnectSlot context={context} />
    case 'arrFleetPayment':
      return <ArrFleetPaymentSlot context={context} category={category} />
    case 'arrFleetStatus':
      return <ArrFleetStatusSlot context={context} />
    case 'onboardingAdvance':
      return <OnboardingAdvanceSlot />
    case 'pfaPending':
      return <PfaPendingSlot />
    case 'insuranceOffer':
      return (
        <InsuranceOffer
          note="RCA-ul, asigurarea de călători și bagaje și CASCO le poți face pe asigurari.ro."
          slugs={['rca', 'accidents_traveler', 'casco']}
        />
      )
  }
}

/**
 * Plata avansului, ca ecran de onboarding.
 *
 * Înainte, ecranul înlocuia tot runnerul din pagina pasului PFA, deci putea sta doar DUPĂ
 * întrebarea „ai deja PFA?" — adică plata venea după alegere. Ca slot, e un micro-pas ca oricare
 * altul și poate sta primul, între eligibilitate și PFA: cerem banii înainte, indiferent de ce
 * urmează să aleagă.
 */
/**
 * Conectarea băncii, în interiorul unui micro-pas.
 *
 * Conexiunea o citește `MICRO_RESOURCES.fiscal`, ca și restul stării pasului, deci `refresh()`-ul
 * global e și cel care aduce vestea că omul s-a întors de la bancă. Panoul își face oricum
 * pollingul lui cât timp așteaptă — de aici primește doar cum se reîmprospătează contextul.
 */
function BankConnectSlot({ context }: { context: MicroStepContext }) {
  const { refresh } = useOnboarding()
  const connection = (context.resources.bank as BankConnectionDto | null | undefined) ?? null

  // Conectat: banca, contul și mișcările. Panoul de conectare nu mai are ce face aici — pentru
  // o conexiune legată arăta din nou lista de bănci, de parcă nu s-ar fi întâmplat nimic.
  if (connection?.status === 'Linked') {
    return (
      <>
        <BankConnectedCard connection={connection} />
        <BankFirstTransactions />
      </>
    )
  }

  return <BankConnectPanel connection={connection} onRefresh={refresh} hideHeader />
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON', maximumFractionDigits: 2 }).format(value)

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'

/** Banca la care e conectat omul, cu contul citit de la ea. */
function BankConnectedCard({ connection }: { connection: BankConnectionDto }) {
  const rows: { label: string; value: string }[] = [
    ...connection.accounts.flatMap((account, index) => {
      const suffix = connection.accounts.length > 1 ? ` ${index + 1}` : ''
      return [
        { label: `IBAN${suffix}`, value: account.iban ?? '—' },
        { label: `Titular${suffix}`, value: account.ownerName ?? '—' },
        { label: `Monedă${suffix}`, value: account.currency ?? '—' },
      ]
    }),
    { label: 'Conectat la', value: formatDate(connection.linkedAtUtc) },
    { label: 'Ultima sincronizare', value: formatDate(connection.lastSyncedAtUtc) },
    { label: 'Acordul expiră la', value: formatDate(connection.consentExpiresAtUtc) },
  ]

  return (
    <Box
      sx={{
        borderRadius: `${TOKENS.radius.md}px`,
        border: `1px solid ${TOKENS.border}`,
        overflow: 'hidden',
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: 'center', px: 2, py: 1.5, borderBottom: `1px solid ${TOKENS.border}` }}
      >
        {connection.institutionLogo ? (
          <Box
            component="img"
            src={connection.institutionLogo}
            alt=""
            sx={{ width: 40, height: 40, objectFit: 'contain', borderRadius: `${TOKENS.radius.sm}px`, flexShrink: 0 }}
          />
        ) : (
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: `${TOKENS.radius.sm}px`,
              display: 'grid',
              placeItems: 'center',
              bgcolor: TOKENS.surface,
              fontWeight: 800,
              color: TOKENS.ink,
              flexShrink: 0,
            }}
          >
            {connection.institutionName.slice(0, 2).toUpperCase()}
          </Box>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, color: TOKENS.ink }}>{connection.institutionName}</Typography>
          <Typography sx={{ fontSize: '0.8rem', color: TOKENS.success, fontWeight: 700 }}>
            Cont conectat prin open banking
          </Typography>
        </Box>
      </Stack>

      {rows.map((row) => (
        <Stack
          key={row.label}
          direction="row"
          spacing={2}
          sx={{
            justifyContent: 'space-between',
            px: 2,
            py: 1,
            borderBottom: `1px solid ${TOKENS.border}`,
            '&:last-of-type': { borderBottom: 'none' },
          }}
        >
          <Typography sx={{ fontSize: '0.85rem', color: TOKENS.textMuted }}>{row.label}</Typography>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: TOKENS.ink, textAlign: 'right', wordBreak: 'break-word' }}>
            {row.value}
          </Typography>
        </Stack>
      ))}
    </Box>
  )
}

/**
 * Primele tranzacții citite de la bancă, imediat după autorizare.
 *
 * E dovada, nu decorul: „conectat" e un cuvânt, iar omul tocmai a fost pe pagina băncii și s-a
 * întors fără să vadă nimic schimbat. Câteva mișcări din contul lui, cu sume și date reale, spun
 * fără dubiu că legătura chiar funcționează — și, de când extrasul de cont a ieșit din flux, exact
 * astea sunt datele pe care le va vedea contabilul.
 *
 * Lista goală nu e o eroare: prima sincronizare durează câteva momente, iar un cont nou chiar
 * poate să n-aibă nimic.
 */
function BankFirstTransactions() {
  const [transactions, setTransactions] = useState<BankTransactionDto[] | null>(null)
  const [totals, setTotals] = useState<{ in: number; out: number; count: number } | null>(null)

  useEffect(() => {
    let cancelled = false

    bankService
      .getTransactions({ page: 1, pageSize: 5 })
      .then((page) => {
        if (cancelled) return
        setTransactions(page.items)
        setTotals({ in: page.totalIn, out: page.totalOut, count: page.totalCount })
      })
      .catch(() => {
        if (!cancelled) setTransactions([])
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (transactions === null) {
    return null
  }

  return (
    <Box
      sx={{
        mt: 2.5,
        borderRadius: `${TOKENS.radius.md}px`,
        border: `1px solid ${TOKENS.border}`,
        overflow: 'hidden',
      }}
    >
      <Typography
        sx={{
          px: 2,
          py: 1.25,
          fontSize: '0.78rem',
          fontWeight: 800,
          color: TOKENS.textMuted,
          borderBottom: `1px solid ${TOKENS.border}`,
        }}
      >
        {transactions.length > 0
          ? 'ULTIMELE MIȘCĂRI CITITE DIN CONT'
          : 'CONT CONECTAT'}
      </Typography>

      {totals && totals.count > 0 && (
        <Stack
          direction="row"
          spacing={3}
          sx={{ px: 2, py: 1.25, borderBottom: `1px solid ${TOKENS.border}`, flexWrap: 'wrap', rowGap: 0.5 }}
        >
          <Typography sx={{ fontSize: '0.8rem', color: TOKENS.textMuted }}>
            {totals.count} {totals.count === 1 ? 'tranzacție citită' : 'tranzacții citite'}
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: TOKENS.textMuted }}>
            Intrări{' '}
            <Box component="span" sx={{ fontWeight: 800, color: TOKENS.success }}>
              {formatMoney(totals.in)}
            </Box>
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: TOKENS.textMuted }}>
            Ieșiri{' '}
            <Box component="span" sx={{ fontWeight: 800, color: TOKENS.ink }}>
              {formatMoney(Math.abs(totals.out))}
            </Box>
          </Typography>
        </Stack>
      )}

      {transactions.length === 0 ? (
        <Typography sx={{ px: 2, py: 1.5, fontSize: '0.85rem', color: TOKENS.textMuted }}>
          Încă nu s-a citit nicio tranzacție. Prima sincronizare durează câteva momente.
        </Typography>
      ) : (
        transactions.map((transaction) => (
          <Stack
            key={transaction.id}
            direction="row"
            spacing={1.5}
            sx={{
              alignItems: 'center',
              px: 2,
              py: 1.1,
              borderBottom: `1px solid ${TOKENS.border}`,
              '&:last-of-type': { borderBottom: 'none' },
            }}
          >
            <Typography sx={{ fontSize: '0.78rem', color: TOKENS.textMuted, width: 74, flexShrink: 0 }}>
              {transaction.bookingDate
                ? new Date(transaction.bookingDate).toLocaleDateString('ro-RO', {
                    day: '2-digit',
                    month: '2-digit',
                  })
                : '—'}
            </Typography>
            <Typography
              sx={{
                flex: 1,
                minWidth: 0,
                fontSize: '0.85rem',
                fontWeight: 600,
                color: TOKENS.ink,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {transaction.counterpartyName || transaction.remittanceInfo || 'Tranzacție'}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.85rem',
                fontWeight: 800,
                flexShrink: 0,
                color: transaction.amount >= 0 ? TOKENS.success : TOKENS.ink,
              }}
            >
              {transaction.amount >= 0 ? '+' : ''}
              {new Intl.NumberFormat('ro-RO', {
                style: 'currency',
                currency: transaction.currency || 'RON',
                maximumFractionDigits: 2,
              }).format(transaction.amount)}
            </Typography>
          </Stack>
        ))
      )}
    </Box>
  )
}

/**
 * Dosarul PFA e la noi, ca ecran al pasului — nu ca pagină care înlocuiește pasul.
 *
 * Cât timp înlocuia pagina, apărea de îndată ce dosarul exista, adică imediat după numărul de
 * telefon: certificatele și rezumatul rămâneau în listă, dar nu se mai putea ajunge la ele. Ca
 * micro-pas, stă unde îi e locul — după rezumat — și lasă rail-ul să ducă înapoi la certificate
 * cât timp validarea nu s-a încheiat.
 *
 * Fără `onContinue`: butonul „mai departe" e al runnerului, ca la orice alt ecran.
 */
function PfaPendingSlot() {
  const { state, documents, refresh } = useOnboarding()

  return (
    <PfaPendingCard
      documents={documents}
      pfaRegistrationId={state?.pfaRegistrationId}
      onRefresh={refresh}
    />
  )
}

function OnboardingAdvanceSlot() {
  const { state } = useOnboarding()
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!state) return null

  const startPayment = async () => {
    setError(null)
    setPaying(true)
    try {
      const origin = window.location.origin
      // Eticheta de preț se formatează din starea serverului, nu se scrie în cod.
      await stripeService.redirectToInfiintarePfa(
        `${origin}/onboarding?pfa_setup_paid=1&session_id={{CHECKOUT_SESSION_ID}}`,
        `${origin}/onboarding/pfa`,
        `${(state.onboardingAdvanceBani / 100).toLocaleString('ro-RO')} lei`,
      )
    } catch (err) {
      // 422 = plata nu poate fi deschisă acum. Mesajul serverului spune exact de ce.
      setError(getErrorMessage(err, 'Nu am putut deschide plata. Încearcă din nou.'))
      setPaying(false)
    }
  }

  return (
    <Stack spacing={2}>
      {error && (
        <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
          {error}
        </Alert>
      )}
      <CompanyFormationSummary state={state} onPay={() => void startPayment()} paying={paying} />
    </Stack>
  )
}

/**
 * Oferta partenerului, deasupra uploadului.
 *
 * Ecranele astea cereau o poliță pe care șoferul o are „de undeva", fără să spună de unde — deși
 * avem un partener și tarife negociate, ascunse într-un tab din Dashboard la care se ajunge abia
 * după înrolare. Linkurile vin din catalogul unic (`InsuranceLinksGrid`), ca URL-ul de afiliere
 * să nu ajungă scris în două locuri.
 */
function InsuranceOffer({ note, slugs }: { note: string; slugs: readonly string[] }) {
  return (
    <Box>
      <Typography sx={{ fontSize: '0.85rem', color: TOKENS.textMuted, mb: 1.5 }}>{note}</Typography>
      <InsuranceLinksGrid compact only={slugs} />
    </Box>
  )
}

const arrFleetOf = (c: MicroStepContext) => (c.resources.arrFleet as ArrFleetState | undefined) ?? null

const lei = (bani: number) => `${(bani / 100).toLocaleString('ro-RO')} lei`

/** IBAN-ul se citește în grupuri de patru; se copiază fără spații, cum îl vrea banca. */
const groupIban = (iban: string) => iban.replace(/(.{4})/g, '$1 ').trim()

function CopyableRow({ label, value, copyValue }: { label: string; value: string; copyValue?: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(copyValue ?? value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1,
        borderBottom: `1px solid ${TOKENS.border}`,
        '&:last-of-type': { borderBottom: 'none' },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: TOKENS.textMuted }}>{label}</Typography>
        <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: TOKENS.ink, wordBreak: 'break-word' }}>{value}</Typography>
      </Box>
      <Tooltip title={copied ? 'Copiat' : `Copiază ${label.toLowerCase()}`}>
        <IconButton
          size="small"
          onClick={() => void copy()}
          aria-label={`Copiază ${label.toLowerCase()}`}
          sx={{ flexShrink: 0, color: copied ? TOKENS.success : TOKENS.textMuted }}
        >
          {copied ? <CheckRoundedIcon fontSize="small" /> : <ContentCopyRoundedIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
    </Stack>
  )
}

/**
 * O plată către ARR: suma exactă, ce acoperă și contul de trezorerie al agenției din județul
 * sediului social. ARR cere plăți separate, deci fiecare ecran de dovadă are plata lui.
 */
function ArrFleetPaymentSlot({ context, category }: { context: MicroStepContext; category?: string }) {
  const state = arrFleetOf(context)
  const payment = state?.payments.find((p) => p.proofCategory === category)
  if (!state || !payment) return null

  const agency = state.agency

  return (
    <Stack spacing={1.5}>
      <Box
        sx={{
          p: 2.5,
          borderRadius: `${TOKENS.radius.lg}px`,
          border: `1px solid ${TOKENS.primaryTint}`,
          backgroundColor: TOKENS.primarySoft,
        }}
      >
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: TOKENS.textMuted }}>
          {payment.label.toUpperCase()}
        </Typography>
        <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: TOKENS.ink, lineHeight: 1.2 }}>
          {lei(payment.amountBani)}
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: '0.85rem', color: TOKENS.textMuted }}>
          {payment.explanation} Plătește exact suma asta, separat de celelalte.
        </Typography>
      </Box>

      {agency ? (
        <Box sx={{ borderRadius: `${TOKENS.radius.md}px`, border: `1px solid ${TOKENS.border}`, overflow: 'hidden' }}>
          <CopyableRow label="Beneficiar" value={agency.beneficiaryName} />
          <CopyableRow label="CIF" value={agency.fiscalCode} />
          <CopyableRow label="IBAN" value={groupIban(agency.iban)} copyValue={agency.iban} />
          <CopyableRow label="Trezoreria" value={agency.treasury} />
        </Box>
      ) : (
        <Alert severity="error">{state.agencyError ?? 'Nu știm agenția ARR la care plătești. Scrie-ne la suport.'}</Alert>
      )}

      {payment.kind === 'Badges' && state.paymentProofOutdated && (
        <Alert severity="warning">
          Ai schimbat platformele după ce ai încărcat dovada. Suma pentru ecusoane e acum {lei(payment.amountBani)}:
          încarcă dovada pentru suma nouă.
        </Alert>
      )}
    </Stack>
  )
}

/** Statusul procedurii după trimitere, cum îl setează agentul RIDElance. */
function ArrFleetStatusSlot({ context }: { context: MicroStepContext }) {
  const state = arrFleetOf(context)
  // Înainte de trimitere pasul n-are încă un status de procedură.
  if (!state?.submittedAtUtc) return null

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: `${TOKENS.radius.lg}px`,
        border: `1px solid ${TOKENS.border}`,
        backgroundColor: TOKENS.surface,
      }}
    >
      <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: TOKENS.textMuted }}>STATUS</Typography>
      <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, color: TOKENS.ink }}>{state.statusLabel}</Typography>
    </Box>
  )
}

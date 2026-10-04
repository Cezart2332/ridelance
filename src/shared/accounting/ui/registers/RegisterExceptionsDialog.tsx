import { useState, type MouseEvent } from 'react'
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  ListSubheader,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material'

import { accountingApi } from '../../api/accountingApi'
import type { BankClassification, RegisterExceptionItem, RegisterExceptionKind, RegisterExceptions } from '../../api/types'
import { formatAmount, formatDate } from '../../format'
import { EmptyText, ErrorBlock, LoadingBlock } from '../components'
import { useAccountingNav } from '../navigation'
import { useAction } from '../notify'
import { useApi } from '../useApi'

/** Rândurile se scot din listă imediat; contorul scade fără reîncărcare. */
function without(data: RegisterExceptions, ids: Set<string>): RegisterExceptions {
  const groups = data.groups
    .map((group) => ({ ...group, items: group.items.filter((item) => !ids.has(item.ledgerEntryId)) }))
    .filter((group) => group.items.length > 0)
  return { ...data, groups, total: groups.reduce((sum, group) => sum + group.items.length, 0) }
}

function ExceptionRow({
  item,
  kind,
  busy,
  onClassify,
  onDocument,
}: {
  item: RegisterExceptionItem
  kind: RegisterExceptionKind
  busy: boolean
  onClassify: (item: RegisterExceptionItem, classification: BankClassification, applyToSimilar: boolean) => void
  onDocument: (item: RegisterExceptionItem) => void
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [similar, setSimilar] = useState(false)
  const open = (event: MouseEvent<HTMLElement>) => setAnchor(event.currentTarget)
  const choose = (classification: BankClassification) => {
    setAnchor(null)
    onClassify(item, classification, similar)
  }

  return (
    <Stack sx={{ py: 1.25, gap: 0.75 }}>
      <Stack direction="row" sx={{ gap: 2, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <Typography variant="body2" sx={{ minWidth: 84, fontVariantNumeric: 'tabular-nums' }}>
          {formatDate(item.date)}
        </Typography>
        <Typography variant="body2" sx={{ minWidth: 96, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: item.amount > 0 ? 'success.main' : 'text.primary' }}>
          {item.amount > 0 ? '+' : '−'}
          {formatAmount(Math.abs(item.amount))}
        </Typography>
        <Typography variant="body2" sx={{ flex: 1, minWidth: 160, wordBreak: 'break-word' }}>
          {item.bankDetails}
        </Typography>
      </Stack>
      <Stack direction="row" sx={{ gap: 1, alignItems: 'center', flexWrap: 'wrap', pl: { sm: '196px' } }}>
        {kind !== 'UNRECONCILED_PAYOUT' && kind !== 'MISSING_DOCUMENT' && (
          <Typography variant="body2" color={item.proposal ? 'text.primary' : 'text.secondary'} sx={{ mr: 1 }}>
            {item.proposal ? `Propunere: ${item.proposal.label}` : 'Fără propunere'}
          </Typography>
        )}
        {item.proposal && (
          <Button size="small" variant="contained" disabled={busy} onClick={() => onClassify(item, item.proposal!.classification, false)}>
            Confirmă
          </Button>
        )}
        {item.proposal && item.canApplyToSimilar && (
          <Button size="small" variant="outlined" disabled={busy} onClick={() => onClassify(item, item.proposal!.classification, true)}>
            Aplică la toate similare
          </Button>
        )}
        {item.options.length > 0 && (
          <Button size="small" variant={item.proposal ? 'text' : 'outlined'} disabled={busy} onClick={open}>
            {item.proposal ? 'Schimbă' : 'Clasifică'}
          </Button>
        )}
        {kind === 'MISSING_DOCUMENT' && (
          <Button size="small" variant="contained" disabled={busy} onClick={() => onDocument(item)}>
            Asociază document
          </Button>
        )}
      </Stack>
      <Menu anchorEl={anchor} open={anchor !== null} onClose={() => setAnchor(null)}>
        {item.canApplyToSimilar && (
          <MenuItem dense onClick={() => setSimilar((value) => !value)}>
            <Checkbox size="small" checked={similar} sx={{ p: 0, mr: 1 }} />
            Aplică la toate similare
          </MenuItem>
        )}
        {item.canApplyToSimilar && <Divider />}
        <ListSubheader sx={{ lineHeight: '32px' }}>Clasificare</ListSubheader>
        {item.options.map((option) => (
          <MenuItem key={option.classification} onClick={() => choose(option.classification)}>
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </Stack>
  )
}

/**
 * „RJIP: N de rezolvat” (spec registre §8): excepțiile anului grupate pe tip, fiecare cu propunerea de
 * clasificare și acțiunile ei. După fiecare rezolvare rândul dispare și contorul scade imediat.
 */
export function RegisterExceptionsDialog({
  pfaId,
  year,
  open,
  readOnly,
  onClose,
  onChanged,
}: {
  pfaId: string
  year: number
  open: boolean
  readOnly: boolean
  onClose: () => void
  onChanged: () => void
}) {
  const nav = useAccountingNav()
  const { busy, run } = useAction()
  const exceptions = useApi(() => (open ? accountingApi.registers.exceptions(pfaId, year) : Promise.resolve(null)), [pfaId, year, open])
  const [resolved, setResolved] = useState<Set<string>>(new Set())
  const data = exceptions.data ? without(exceptions.data, resolved) : null

  const classify = (item: RegisterExceptionItem, classification: BankClassification, applyToSimilar: boolean) =>
    run(
      item.ledgerEntryId,
      async () => {
        const result = await accountingApi.registers.classify(item.ledgerEntryId, { classification, applyToSimilar })
        setResolved((current) => new Set([...current, item.ledgerEntryId]))
        onChanged()
        // Regula a reclasificat și alte luni: lista se reîncarcă pentru rândurile similare.
        if (result.classified > 1) exceptions.reload()
      },
      applyToSimilar ? 'Clasificarea s-a aplicat tranzacțiilor similare.' : 'Tranzacția a fost clasificată.',
    )

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{data ? `RJIP ${year}: ${data.total} de rezolvat` : `RJIP ${year}`}</DialogTitle>
      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 2 }}>Clasifici aceleași tranzacții din „Încasări și plăți”. Încadrarea stabilește ce reprezintă banii și efectul în REF; pentru dată, sumă, categorie sau document folosește „Modifică”. Pentru TVA nerecuperabil achitat, folosește „Asociază D301” la plata bancară.</Alert>
        {exceptions.error && <ErrorBlock message={exceptions.error} onRetry={exceptions.reload} />}
        {!data && !exceptions.error && <LoadingBlock />}
        {data && data.total === 0 && <EmptyText>Nimic de rezolvat.</EmptyText>}
        {data && readOnly && data.total > 0 && <Alert severity="info">Dosar inactiv: doar consultare.</Alert>}
        {data?.groups.map((group) => (
          <Stack key={group.kind} component="section" aria-label={group.label} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {group.label} ({group.items.length})
            </Typography>
            <Stack divider={<Divider flexItem />}>
              {group.items.map((item) => (
                <ExceptionRow
                  key={item.ledgerEntryId}
                  item={readOnly ? { ...item, proposal: item.proposal, options: [], canApplyToSimilar: false } : item}
                  kind={group.kind}
                  busy={busy !== null || readOnly}
                  onClassify={classify}
                  onDocument={() => {
                    onClose()
                    nav.openPfa(pfaId, 'banca')
                  }}
                />
              ))}
            </Stack>
          </Stack>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Închide</Button>
      </DialogActions>
    </Dialog>
  )
}

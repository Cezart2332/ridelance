import { Alert, Paper, Stack, Tab, Tabs } from '@mui/material'

import { PageHeader } from '../../../../components/admin'
import { accountingApi } from '../../api/accountingApi'
import type { PfaAccountingSummary } from '../../api/types'
import { formatDate, formatPeriod } from '../../format'
import { ENGAGEMENT_STATUS, PFA_MONTH_STATUS } from '../../statusLabels'
import { AccountingBadge, ErrorBlock, LoadingBlock } from '../components'
import { DeclarationsTab } from '../declarations/DeclarationsTab'
import { PlatformDocumentsTab } from '../documents/PlatformDocumentsTab'
import { TransactionsTab } from '../ledger/TransactionsTab'
import { DOSSIER_SECTIONS, DOSSIER_SECTION_LABEL, useAccountingNav, type DossierSection } from '../navigation'
import { RegistersTab } from '../registers/RegistersTab'
import { SettingsTab } from '../settings/SettingsTab'
import { useApi } from '../useApi'
import { AuditTab } from './AuditTab'
import { useDossierMenu } from './useDossierMenu'

export interface DossierTabProps {
  summary: PfaAccountingSummary
  /** Reîncarcă antetul (statusul lunii, cash-ul, starea dosarului) după o acțiune din tab. */
  onSummaryChanged: () => void
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function SectionContent({ section, props }: { section: DossierSection; props: DossierTabProps }) {
  switch (section) {
    case 'declaratii':
      return <DeclarationsTab {...props} />
    case 'documente':
      return <PlatformDocumentsTab {...props} />
    case 'tranzactii':
      return <TransactionsTab {...props} />
    case 'registre':
      return <RegistersTab {...props} />
    case 'setari':
      return <SettingsTab {...props} />
    case 'istoric':
      return <AuditTab pfaId={props.summary.id} />
  }
}

/** F1: dosarul contabil al unui PFA (`?pfa={id}&sectiune=…`). */
export function PfaDossierView({ pfaId }: { pfaId: string }) {
  const nav = useAccountingNav()
  const summary = useApi(() => accountingApi.pfas.getSummary(pfaId), [pfaId])
  const menu = useDossierMenu(summary.data, summary.reload)

  if (summary.error && !summary.data) return <ErrorBlock message={summary.error} onRetry={summary.reload} />
  if (!summary.data) return <LoadingBlock />
  const pfa = summary.data

  const art317 = pfa.art317 ? `Cod TVA art. 317 din ${formatDate(pfa.art317ActivationDate)}` : 'Fără cod TVA art. 317'

  return (
    <Stack spacing={3}>
      <PageHeader
        backLabel="PFA"
        onBack={() => nav.openPfaList(pfa.readOnly ? 'inactive' : 'active')}
        avatarText={initials(pfa.name)}
        title={pfa.name}
        subtitle={`CUI ${pfa.cui} · ${art317} · Sistem real${pfa.vatPayer ? '' : ', neplătitor de TVA'}`}
        status={
          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
            <AccountingBadge descriptor={ENGAGEMENT_STATUS[pfa.engagement.status]} />
            {!pfa.readOnly && <AccountingBadge descriptor={PFA_MONTH_STATUS[pfa.currentMonthStatus]} suffix={`· ${formatPeriod(pfa.currentPeriod)}`} />}
          </Stack>
        }
        menuItems={menu.items}
      />

      {pfa.readOnly && (
        <Alert severity="info">
          Dosar inactiv din {formatDate(pfa.engagement.endDate)}: datele pot fi doar consultate.
          {pfa.retentionUntil && ` Păstrare obligatorie până la ${formatDate(pfa.retentionUntil)}.`}
        </Alert>
      )}

      <Paper sx={{ px: 1 }}>
        <Tabs
          value={nav.section}
          onChange={(_, section: DossierSection) => nav.openPfa(pfa.id, section)}
          variant="scrollable"
          allowScrollButtonsMobile
        >
          {DOSSIER_SECTIONS.map((section) => (
            <Tab key={section} value={section} label={DOSSIER_SECTION_LABEL[section]} />
          ))}
        </Tabs>
      </Paper>

      <SectionContent section={nav.section} props={{ summary: pfa, onSummaryChanged: summary.reload }} />
      {menu.dialogs}
    </Stack>
  )
}

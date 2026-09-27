import { useState } from 'react'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { Alert, Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material'

import { ActionMenu } from '../../../../components/admin'
import { ClientNotificationDialog } from '../../../../components/contabil/ClientNotificationDialog'
import { BankActivityPanel } from '../../../../components/banking/BankActivityPanel'
import { DeductibleExpensesPanel } from '../../../../components/dashboard/sections/DeductibleExpensesPanel'
import { ProfessionalChatBox } from '../../../../components/dashboard/sections/ProfessionalChatBox'
import { RecurringDocumentationPanel } from '../../../../components/dashboard/sections/RecurringDocumentationPanel'
import { PfaFiscalSettingsPanel } from '../../../../components/pfa/PfaFiscalSettingsPanel'
import { EstimatedTaxesCard, StaffTaxInputsPanel } from '../../../fiscal-estimates'
import { FiscalProfilePanel } from '../../../fiscal-profile'
import { accountingApi } from '../../api/accountingApi'
import type { Period } from '../../api/types'
import { formatDate, formatPeriod } from '../../format'
import { ENGAGEMENT_STATUS, PFA_MONTH_STATUS } from '../../statusLabels'
import { AccountingBadge, ErrorBlock, LoadingBlock } from '../components'
import { DeclarationsTab } from '../declarations/DeclarationsTab'
import { PlatformDocumentsTab } from '../documents/PlatformDocumentsTab'
import { TransactionsTab } from '../ledger/TransactionsTab'
import { CLIENT_SECTIONS, CLIENT_SECTION_LABEL, useAccountingNav, type ClientSection } from '../navigation'
import { useNotify } from '../notify'
import type { DossierTabProps } from '../pfa/PfaDossierView'
import { useDossierMenu } from '../pfa/useDossierMenu'
import { RegistersTab } from '../registers/RegistersTab'
import { SettingsTab } from '../settings/SettingsTab'
import { useApi } from '../useApi'
import { ClientHistorySection } from './ClientHistorySection'
import { ClientIncomeSection } from './ClientIncomeSection'
import { ClientOverview } from './ClientOverview'
import { ClientAvatar, PillTabs } from './ui'

/** Ultimele 12 luni până la luna fiscală curentă, plus luna cerută dacă e mai veche. */
function periodOptions(current: Period, selected: Period): Period[] {
  const [year, month] = current.split('-').map(Number)
  const options = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(year, month - 1 - index, 1)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  })
  return options.includes(selected) ? options : [selected, ...options]
}

const TAB_OPTIONS = CLIENT_SECTIONS.map((value) => ({ value, label: CLIENT_SECTION_LABEL[value] }))

/** Profilul unui client din „Clienți PFA”: dosarul contabil și spațiul de lucru al contabilului. */
export function ClientProfileView({ pfaId }: { pfaId: string }) {
  const nav = useAccountingNav()
  const notify = useNotify()
  const summary = useApi(() => accountingApi.pfas.getSummary(pfaId), [pfaId])
  const menu = useDossierMenu(summary.data, summary.reload)
  const [notifying, setNotifying] = useState(false)
  const [historyKey, setHistoryKey] = useState(0)

  if (summary.error && !summary.data) return <ErrorBlock message={summary.error} onRetry={summary.reload} />
  if (!summary.data) return <LoadingBlock />
  const pfa = summary.data

  const section: ClientSection = (CLIENT_SECTIONS as readonly string[]).includes(nav.rawSection ?? '')
    ? (nav.rawSection as ClientSection)
    : 'prezentare'
  const period = nav.period ?? pfa.currentPeriod
  const [year, month] = period.split('-').map(Number)
  const tabProps: DossierTabProps = { summary: pfa, onSummaryChanged: summary.reload, periodInHeader: true }
  const openSection = (next: ClientSection) => nav.setParam('sectiune', next)
  const monthScoped = !['registre', 'setari', 'banca', 'mesaje', 'tranzactii'].includes(section)
  const notifySnackbar = (message: string, severity: 'success' | 'error') => notify(message, severity)
  const legacyContext = { userId: pfa.client.userId, pfaRegistrationId: pfa.id }

  const menuItems = [
    { key: 'notify', label: 'Trimite notificare', onClick: () => setNotifying(true) },
    ...menu.items.map((item, index) => (index === 0 ? { ...item, dividerBefore: true } : item)),
  ]

  return (
    <Stack spacing={3} sx={{ minWidth: 0 }}>
      <Box>
        <Button
          size="small"
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => nav.openPfaList(pfa.readOnly ? 'inactive' : 'active')}
          sx={{ color: 'text.secondary', ml: -1 }}
        >
          Clienți PFA
        </Button>
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 2, alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
        <Stack direction="row" sx={{ gap: 2, alignItems: 'center', minWidth: 0 }}>
          <ClientAvatar name={pfa.name} size={48} />
          <Stack spacing={0.75} sx={{ minWidth: 0 }}>
            <Typography variant="h1" sx={{ fontSize: { xs: 22, md: 28 }, overflowWrap: 'anywhere' }}>
              {pfa.name}
            </Typography>
            <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <AccountingBadge descriptor={ENGAGEMENT_STATUS[pfa.engagement.status]} />
              {!pfa.readOnly && (
                <AccountingBadge descriptor={PFA_MONTH_STATUS[pfa.currentMonthStatus]} suffix={`· ${formatPeriod(pfa.currentPeriod)}`} />
              )}
            </Stack>
          </Stack>
        </Stack>
        <Stack direction="row" sx={{ gap: 1, alignItems: 'center', flexShrink: 0 }}>
          {monthScoped && (
            <TextField
              select
              label="Luna"
              value={period}
              onChange={(event) => nav.setParam('luna', event.target.value)}
              sx={{ minWidth: 180 }}
            >
              {periodOptions(pfa.currentPeriod, period).map((option) => (
                <MenuItem key={option} value={option}>
                  {formatPeriod(option)}
                </MenuItem>
              ))}
            </TextField>
          )}
          <Button variant="outlined" onClick={() => setNotifying(true)} sx={{ display: { xs: 'none', sm: 'inline-flex' }, whiteSpace: 'nowrap' }}>
            Trimite notificare
          </Button>
          <ActionMenu items={menuItems} size="medium" />
        </Stack>
      </Stack>

      {pfa.readOnly && (
        <Alert severity="info">
          Inactiv din {formatDate(pfa.engagement.endDate)}.
          {pfa.retentionUntil && ` Păstrare obligatorie până la ${formatDate(pfa.retentionUntil)}.`}
        </Alert>
      )}

      <PillTabs value={section} options={TAB_OPTIONS} onChange={openSection} label="Secțiuni client" />

      <Box sx={{ minWidth: 0 }}>
        {section === 'prezentare' && <ClientOverview summary={pfa} period={period} onOpen={openSection} />}
        {section === 'declaratii' && <DeclarationsTab {...tabProps} />}
        {section === 'documente' && (
          <Stack spacing={3}>
            <PlatformDocumentsTab {...tabProps} />
            <RecurringDocumentationPanel year={year} month={month} contabilContext={legacyContext} onSnackbar={notifySnackbar} />
          </Stack>
        )}
        {section === 'venituri' && <ClientIncomeSection key={period} pfaId={pfa.id} year={year} month={month} />}
        {section === 'taxe' && (
          <Stack spacing={3}>
            <EstimatedTaxesCard mode="accounting" pfaId={pfa.id} />
            <FiscalProfilePanel mode="accounting" pfaId={pfa.id} />
            <StaffTaxInputsPanel mode="accounting" pfaId={pfa.id} />
            <PfaFiscalSettingsPanel pfaId={pfa.id} editable clientUserId={pfa.client.userId} />
          </Stack>
        )}
        {section === 'banca' && <BankActivityPanel userId={pfa.client.userId} />}
        {section === 'tranzactii' && <TransactionsTab {...tabProps} />}
        {section === 'cheltuieli' && (
          <DeductibleExpensesPanel year={year} month={month} pfaRegistrationId={pfa.id} contabilContext={legacyContext} onSnackbar={notifySnackbar} />
        )}
        {section === 'registre' && <RegistersTab {...tabProps} />}
        {section === 'setari' && <SettingsTab {...tabProps} />}
        {section === 'istoric' && <ClientHistorySection pfaId={pfa.id} year={year} month={month} refreshKey={historyKey} />}
        {section === 'mesaje' && <ProfessionalChatBox clientUserId={pfa.client.userId} clientName={pfa.name} />}
      </Box>

      {menu.dialogs}
      <ClientNotificationDialog
        open={notifying}
        pfaId={pfa.id}
        clientName={pfa.name}
        onClose={() => setNotifying(false)}
        onSent={(pushSent) => {
          setNotifying(false)
          setHistoryKey((key) => key + 1)
          notify(pushSent > 0 ? 'Notificarea a fost trimisă, inclusiv pe telefon.' : 'Notificarea a fost trimisă în aplicație.', 'success')
        }}
      />
    </Stack>
  )
}

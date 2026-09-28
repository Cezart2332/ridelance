import { useState } from 'react'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { Alert, Box, Button, Stack, Tab, Tabs, Typography } from '@mui/material'

import { ActionMenu } from '../../../../components/admin'
import { BankActivityPanel } from '../../../../components/banking/BankActivityPanel'
import { ClientNotificationDialog } from '../../../../components/contabil/ClientNotificationDialog'
import { DeductibleExpensesPanel } from '../../../../components/dashboard/sections/DeductibleExpensesPanel'
import { ProfessionalChatBox } from '../../../../components/dashboard/sections/ProfessionalChatBox'
import { PfaFiscalSettingsPanel } from '../../../../components/pfa/PfaFiscalSettingsPanel'
import { EstimatedTaxesCard, StaffTaxInputsPanel } from '../../../fiscal-estimates'
import { FiscalProfilePanel } from '../../../fiscal-profile'
import { accountingApi } from '../../api/accountingApi'
import { formatDate } from '../../format'
import { ClientHistorySection } from '../clients/ClientHistorySection'
import { ClientIncomeSection } from '../clients/ClientIncomeSection'
import { ErrorBlock, LoadingBlock } from '../components'
import { TransactionsTab } from '../ledger/TransactionsTab'
import { CLIENT_SECTION_ALIASES, CLIENT_SECTION_LABEL, CLIENT_SECTIONS, useAccountingNav, type ClientSection } from '../navigation'
import { useNotify } from '../notify'
import type { DossierTabProps } from '../pfa/PfaDossierView'
import { useDossierMenu } from '../pfa/useDossierMenu'
import { RegistersTab } from '../registers/RegistersTab'
import { SettingsTab } from '../settings/SettingsTab'
import { useApi } from '../useApi'
import { MonthTab } from './MonthTab'
import { Avatar, MonthSelect, PageTitle } from './parts'
import { currentFiscalPeriod, INK } from './status'

/** Fișa clientului: luna aceasta în față, restul în tab-uri. */
export function ClientPageView({ pfaId }: { pfaId: string }) {
  const nav = useAccountingNav()
  const notify = useNotify()
  const summary = useApi(() => accountingApi.pfas.getSummary(pfaId), [pfaId])
  const menu = useDossierMenu(summary.data, summary.reload)
  const [notifying, setNotifying] = useState(false)
  const [historyKey, setHistoryKey] = useState(0)

  if (summary.error && !summary.data) return <ErrorBlock message={summary.error} onRetry={summary.reload} />
  if (!summary.data) return <LoadingBlock />
  const pfa = summary.data

  const raw = nav.rawSection ?? ''
  const section: ClientSection = (CLIENT_SECTIONS as readonly string[]).includes(raw) ? (raw as ClientSection) : (CLIENT_SECTION_ALIASES[raw] ?? 'luna')
  const current = currentFiscalPeriod()
  const period = nav.period ?? pfa.currentPeriod ?? current
  const [year, month] = period.split('-').map(Number)
  const tabProps: DossierTabProps = { summary: pfa, onSummaryChanged: summary.reload, periodInHeader: true }
  const openSection = (next: ClientSection) => nav.setParam('sectiune', next)
  const userId = pfa.client?.userId ?? ''
  const legacyContext = { userId, pfaRegistrationId: pfa.id }
  const notifySnackbar = (message: string, severity: 'success' | 'error') => notify(message, severity)

  const menuItems = [
    { key: 'notify', label: 'Trimite notificare', onClick: () => setNotifying(true) },
    ...menu.items.map((item, index) => (index === 0 ? { ...item, dividerBefore: true } : item)),
  ]

  return (
    <Stack spacing={2.25} sx={{ minWidth: 0 }}>
      <Box>
        <Button size="small" startIcon={<ArrowBackRoundedIcon />} onClick={() => nav.openPfaList(pfa.readOnly ? 'inactive' : 'active')} sx={{ color: '#6B6B7B', ml: -1 }}>
          Clienți PFA
        </Button>
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ alignItems: { md: 'center' }, gap: 2 }}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 2, flexGrow: 1, minWidth: 0 }}>
          <Avatar name={pfa.name} size={56} />
          <PageTitle>{pfa.name}</PageTitle>
        </Stack>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <MonthSelect value={period} current={pfa.currentPeriod ?? current} onChange={(value) => nav.setParam('luna', value)} />
          <Button variant="outlined" onClick={() => openSection('mesaje')} sx={{ whiteSpace: 'nowrap', display: { xs: 'none', sm: 'inline-flex' } }}>
            Trimite mesaj
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

      <Box sx={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <Tabs
          value={section}
          onChange={(_, next: ClientSection) => openSection(next)}
          variant="scrollable"
          allowScrollButtonsMobile
          aria-label="Secțiuni client"
          textColor="inherit"
          sx={{
            minHeight: 44,
            '& .MuiTab-root': { minHeight: 44, color: '#6B6B7B', fontWeight: 500 },
            '& .Mui-selected': { color: INK, fontWeight: 600 },
            '& .MuiTabs-indicator': { bgcolor: '#5CCBF5', height: 3 },
          }}
        >
          {CLIENT_SECTIONS.map((value) => (
            <Tab key={value} value={value} label={CLIENT_SECTION_LABEL[value]} />
          ))}
        </Tabs>
      </Box>

      <Box sx={{ minWidth: 0 }}>
        {section === 'luna' && <MonthTab key={period} summary={pfa} period={period} onSummaryChanged={summary.reload} onOpenSection={openSection} />}
        {section === 'banca' && (
          <Stack spacing={3}>
            {userId && <BankActivityPanel userId={userId} />}
            <Typography component="h2" sx={{ fontSize: 16, fontWeight: 700, color: INK }}>
              Tranzacții contabile
            </Typography>
            <TransactionsTab {...tabProps} />
          </Stack>
        )}
        {section === 'venituri' && (
          <Stack spacing={3}>
            <ClientIncomeSection key={period} pfaId={pfa.id} year={year} month={month} />
            <EstimatedTaxesCard mode="accounting" pfaId={pfa.id} />
            <FiscalProfilePanel mode="accounting" pfaId={pfa.id} />
            <StaffTaxInputsPanel mode="accounting" pfaId={pfa.id} />
            <PfaFiscalSettingsPanel pfaId={pfa.id} editable clientUserId={userId} />
          </Stack>
        )}
        {section === 'cheltuieli' && (
          <DeductibleExpensesPanel year={year} month={month} pfaRegistrationId={pfa.id} contabilContext={legacyContext} onSnackbar={notifySnackbar} />
        )}
        {section === 'registre' && <RegistersTab {...tabProps} />}
        {section === 'mesaje' && userId && <ProfessionalChatBox clientUserId={userId} clientName={pfa.name} />}
        {section === 'setari' && <SettingsTab {...tabProps} />}
        {section === 'istoric' && <ClientHistorySection pfaId={pfa.id} year={year} month={month} refreshKey={historyKey} />}
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

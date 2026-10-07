import { useState } from 'react'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { Alert, Box, IconButton, Stack, Tab, Tabs, Tooltip, Typography } from '@mui/material'

import { ActionMenu } from '../../../../components/admin'
import { usePanelTrail } from '../../../../components/panel/panelTrail'
import { Badge, SideSheet } from '../../../../components/panel/ui'
import { ClientNotificationDialog } from '../../../../components/contabil/ClientNotificationDialog'
import { DeductibleExpensesPanel } from '../../../../components/dashboard/sections/DeductibleExpensesPanel'
import { ProfessionalChatBox } from '../../../../components/dashboard/sections/ProfessionalChatBox'
import { EstimatedTaxesCard } from '../../../fiscal-estimates'
import { FiscalProfilePanel } from '../../../fiscal-profile'
import { accountingApi } from '../../api/accountingApi'
import { formatDate } from '../../format'
import { ClientHistorySection } from '../clients/ClientHistorySection'
import { ErrorBlock, LoadingBlock } from '../components'
import { TransactionsTab } from '../ledger/TransactionsTab'
import { CLIENT_SECTION_ALIASES, CLIENT_SECTION_LABEL, CLIENT_SECTIONS, useAccountingNav, type ClientSection } from '../navigation'
import { useNotify } from '../notify'
import type { DossierTabProps } from '../pfa/PfaDossierView'
import { useDossierMenu } from '../pfa/useDossierMenu'
import { RegistersTab } from '../registers/RegistersTab'
import { AnnualTab } from '../annual/AnnualTab'
import { SettingsTab } from '../settings/SettingsTab'
import { useApi } from '../useApi'
import { AnafTab } from './AnafTab'
import { MonthTab } from './MonthTab'
import { MonthSelect } from './parts'
import { currentFiscalPeriod } from './status'

/** Fișa clientului: un rând de antet, un rând de tab-uri, apoi secțiunea aleasă. */
export function ClientPageView({ pfaId }: { pfaId: string }) {
  const nav = useAccountingNav()
  // Rutele fiscale au prefix diferit pe rol (`admin/pfas` vs `accounting/pfas`).
  const staffMode = nav.role === 'Admin' ? 'admin' : 'accounting'
  const notify = useNotify()
  const summary = useApi(() => accountingApi.pfas.getSummary(pfaId), [pfaId])
  const menu = useDossierMenu(summary.data, summary.reload)
  const [notifying, setNotifying] = useState(false)
  const [historyKey, setHistoryKey] = useState(0)
  const [profileOpen, setProfileOpen] = useState(false)
  const current = currentFiscalPeriod()
  const period = nav.period ?? summary.data?.currentPeriod ?? current
  const [year, month] = period.split('-').map(Number)
  usePanelTrail(summary.data ? [summary.data.name] : [])

  if (summary.error && !summary.data) return <ErrorBlock message={summary.error} onRetry={summary.reload} />
  if (!summary.data) return <LoadingBlock />
  const pfa = summary.data

  const raw = nav.rawSection ?? ''
  const section: ClientSection = (CLIENT_SECTIONS as readonly string[]).includes(raw) ? (raw as ClientSection) : (CLIENT_SECTION_ALIASES[raw] ?? 'luna')
  const tabProps: DossierTabProps = { summary: pfa, onSummaryChanged: summary.reload, periodInHeader: true }
  const openSection = (next: ClientSection) => nav.setParam('sectiune', next)
  const userId = pfa.client?.userId ?? ''
  const contact = [pfa.cui && `CUI ${pfa.cui}`, pfa.client?.email, pfa.client?.phone].filter(Boolean).join(' · ')

  const menuItems = [
    { key: 'profile', label: 'Profil fiscal', onClick: () => setProfileOpen(true) },
    { key: 'notify', label: 'Trimite notificare', onClick: () => setNotifying(true) },
    ...menu.items.map((item, index) => (index === 0 ? { ...item, dividerBefore: true } : item)),
  ]

  return (
    <Stack spacing={1.5} sx={{ minWidth: 0 }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Tooltip title="Înapoi la clienți">
          <IconButton aria-label="Înapoi la clienți" size="small" onClick={() => nav.openPfaList(pfa.readOnly ? 'inactive' : 'active')}>
            <ArrowBackRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <Typography component="h1" noWrap sx={{ m: 0, fontSize: 18, fontWeight: 650, color: 'var(--rl-fg)' }}>
              {pfa.name}
            </Typography>
            {pfa.readOnly && <Badge>Inactiv</Badge>}
          </Stack>
          {contact && (
            <Typography noWrap sx={{ fontSize: 12, color: 'var(--rl-text-muted)' }}>
              {contact}
            </Typography>
          )}
        </Box>
        <MonthSelect value={period} current={pfa.currentPeriod ?? current} onChange={(value) => nav.setParam('luna', value)} />
        <ActionMenu items={menuItems} size="medium" />
      </Stack>

      {pfa.readOnly && (
        <Alert severity="info" sx={{ py: 0 }}>
          Inactiv din {formatDate(pfa.engagement.endDate)}
          {pfa.retentionUntil && ` · păstrare până la ${formatDate(pfa.retentionUntil)}`}
        </Alert>
      )}

      <Tabs
        value={section}
        onChange={(_, next: ClientSection) => openSection(next)}
        variant="scrollable"
        allowScrollButtonsMobile
        aria-label="Secțiuni client"
        sx={{ minHeight: 36, borderBottom: '1px solid var(--rl-border)', '& .MuiTab-root': { minHeight: 36, px: 1.5, minWidth: 0 } }}
      >
        {CLIENT_SECTIONS.map((value) => (
          <Tab key={value} value={value} label={CLIENT_SECTION_LABEL[value]} />
        ))}
      </Tabs>

      <Box sx={{ minWidth: 0 }}>
        {section === 'luna' && <MonthTab key={period} summary={pfa} period={period} onSummaryChanged={summary.reload} />}
        {section === 'banca' && <TransactionsTab key={period} {...tabProps} period={period} />}
        {section === 'cheltuieli' && (
          <DeductibleExpensesPanel
            year={year}
            month={month}
            pfaRegistrationId={pfa.id}
            contabilContext={{ userId, pfaRegistrationId: pfa.id }}
            onSnackbar={(message, severity) => notify(message, severity)}
          />
        )}
        {section === 'registre' && <RegistersTab {...tabProps} />}
        {section === 'anual' && <AnnualTab {...tabProps} />}
        {section === 'anaf' && <AnafTab pfaId={pfa.id} />}
        {section === 'mesaje' && userId && <ProfessionalChatBox clientUserId={userId} clientName={pfa.name} />}
        {section === 'setari' && <SettingsTab {...tabProps} />}
        {section === 'istoric' && <ClientHistorySection pfaId={pfa.id} year={year} month={month} refreshKey={historyKey} />}
      </Box>

      <SideSheet open={profileOpen} title="Profil fiscal" onClose={() => setProfileOpen(false)} width={640}>
        <Stack spacing={2}>
          <FiscalProfilePanel mode={staffMode} pfaId={pfa.id} />
          <EstimatedTaxesCard mode={staffMode} pfaId={pfa.id} onPlatformTaxes={() => openSection('luna')} />
        </Stack>
      </SideSheet>

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

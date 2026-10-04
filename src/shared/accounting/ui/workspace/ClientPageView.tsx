import { useState } from 'react'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import { Alert, Box, Button, Stack, Tab, Tabs, Typography } from '@mui/material'

import { ActionMenu } from '../../../../components/admin'
import { usePanelTrail } from '../../../../components/panel/panelTrail'
import { segmentedTabsSx } from '../../../../components/panel/panelUtils'
import { BackLink, Badge, Initials, SideSheet } from '../../../../components/panel/ui'
import { ClientNotificationDialog } from '../../../../components/contabil/ClientNotificationDialog'
import { DeductibleExpensesPanel } from '../../../../components/dashboard/sections/DeductibleExpensesPanel'
import { ProfessionalChatBox } from '../../../../components/dashboard/sections/ProfessionalChatBox'
import { EstimatedTaxesCard, StaffTaxInputsPanel } from '../../../fiscal-estimates'
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
import { ClientFiscalSummary } from './ClientFiscalSummary'
import { profileBadge } from './fiscal'
import { MonthTab } from './MonthTab'
import { MonthSelect } from './parts'
import { currentFiscalPeriod } from './status'

const SECTION_GROUPS: { label: string; sections: ClientSection[] }[] = [
  { label: 'Activitate lunară', sections: ['luna', 'banca', 'cheltuieli'] },
  { label: 'Fiscalitate și registre', sections: ['fiscal', 'venituri', 'registre', 'anual', 'setari'] },
  { label: 'Comunicare și istoric', sections: ['anaf', 'mesaje', 'istoric'] },
]

/** Fișa clientului: luna aceasta în față, restul în tab-uri. */
export function ClientPageView({ pfaId }: { pfaId: string }) {
  const nav = useAccountingNav()
  // Aceeași pagină servește adminul și contabilul; rutele fiscale au prefix diferit pe rol
  // (`admin/pfas` vs `accounting/pfas`, doar pentru clienții alocați contabilului).
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
  const fiscal = useApi(() => accountingApi.fiscal.overview(year), [year])
  usePanelTrail(summary.data ? [summary.data.name] : [])

  if (summary.error && !summary.data) return <ErrorBlock message={summary.error} onRetry={summary.reload} />
  if (!summary.data) return <LoadingBlock />
  const pfa = summary.data
  const profile = fiscal.data ? profileBadge(fiscal.data.rows.find((row) => row.pfaId === pfa.id)) : { tone: 'gray' as const, label: fiscal.loading ? 'Profil fiscal: se încarcă' : 'Profil fiscal indisponibil' }

  const raw = nav.rawSection ?? ''
  const section: ClientSection = (CLIENT_SECTIONS as readonly string[]).includes(raw) ? (raw as ClientSection) : (CLIENT_SECTION_ALIASES[raw] ?? 'luna')
  const tabProps: DossierTabProps = { summary: pfa, onSummaryChanged: summary.reload, periodInHeader: true }
  const openSection = (next: ClientSection) => nav.setParam('sectiune', next)
  const group = SECTION_GROUPS.findIndex(item => item.sections.includes(section))
  const userId = pfa.client?.userId ?? ''
  const legacyContext = { userId, pfaRegistrationId: pfa.id }
  const notifySnackbar = (message: string, severity: 'success' | 'error') => notify(message, severity)

  const menuItems = [
    { key: 'notify', label: 'Trimite notificare', onClick: () => setNotifying(true) },
    ...menu.items.map((item, index) => (index === 0 ? { ...item, dividerBefore: true } : item)),
  ]

  return (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      <Box>
        <BackLink onClick={() => nav.openPfaList(pfa.readOnly ? 'inactive' : 'active')}>Înapoi la Clienți PFA</BackLink>
        <Stack direction={{ xs: 'column', md: 'row' }} sx={{ alignItems: { md: 'center' }, gap: 2 }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, flexGrow: 1, minWidth: 0 }}>
            <Initials name={pfa.name} size={44} />
            <Box sx={{ minWidth: 0 }}>
              <Typography component="h1" sx={{ m: 0, fontSize: 20, fontWeight: 650, letterSpacing: '-0.025em', color: 'var(--rl-fg)' }}>
                {pfa.name}
              </Typography>
              <Stack direction="row" sx={{ mt: 0.75, gap: 0.625, flexWrap: 'wrap' }}>
                <Badge toneName={pfa.readOnly ? 'gray' : 'green'}>{pfa.readOnly ? 'Inactiv' : 'PFA activ'}</Badge>
                {pfa.realSystem && <Badge>Sistem real</Badge>}
                <Badge toneName={profile.tone}>{profile.label}</Badge>
                {pfa.art317 && <Badge toneName="blue">TVA art. 317</Badge>}
                {pfa.cui && <Badge>CUI {pfa.cui}</Badge>}
              </Stack>
            </Box>
          </Stack>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexShrink: 0, flexWrap: 'wrap' }}>
            <MonthSelect value={period} current={pfa.currentPeriod ?? current} onChange={(value) => nav.setParam('luna', value)} />
            <Button variant="outlined" startIcon={<TuneRoundedIcon />} onClick={() => setProfileOpen(true)} sx={{ whiteSpace: 'nowrap' }}>
              Profil fiscal și taxe
            </Button>
            <Button variant="outlined" onClick={() => openSection('mesaje')} sx={{ whiteSpace: 'nowrap', display: { xs: 'none', sm: 'inline-flex' } }}>
              Trimite mesaj
            </Button>
            <ActionMenu items={menuItems} size="medium" />
          </Stack>
        </Stack>
      </Box>

      {pfa.readOnly && (
        <Alert severity="info">
          Inactiv din {formatDate(pfa.engagement.endDate)}.
          {pfa.retentionUntil && ` Păstrare obligatorie până la ${formatDate(pfa.retentionUntil)}.`}
        </Alert>
      )}

      <Tabs
        value={group}
        onChange={(_, next: number) => openSection(SECTION_GROUPS[next].sections[0])}
        variant="scrollable"
        allowScrollButtonsMobile
        aria-label="Categorii dosar client"
        textColor="inherit"
        sx={segmentedTabsSx}
      >
        {SECTION_GROUPS.map((item, index) => <Tab key={item.label} value={index} label={item.label} />)}
      </Tabs>
      <Tabs
        value={section}
        onChange={(_, next: ClientSection) => openSection(next)}
        variant="scrollable"
        allowScrollButtonsMobile
        aria-label="Secțiuni client"
        textColor="inherit"
        sx={segmentedTabsSx}
      >
        {SECTION_GROUPS[group].sections.map((value) => (
          <Tab key={value} value={value} label={CLIENT_SECTION_LABEL[value]} />
        ))}
      </Tabs>

      <Box sx={{ minWidth: 0 }}>
        {section === 'luna' && <MonthTab key={period} summary={pfa} period={period} onSummaryChanged={summary.reload} onOpenSection={openSection} />}
        {section === 'fiscal' && (
          <Stack spacing={2}>
            {fiscal.error && <ErrorBlock message={fiscal.error} onRetry={fiscal.reload} />}
            {!fiscal.data && fiscal.loading ? <LoadingBlock /> : <ClientFiscalSummary pfa={pfa} overview={fiscal.data} year={year} />}
          </Stack>
        )}
        {section === 'banca' && (
          <Stack spacing={3}>
            <Typography color="text.secondary">Încasările și plățile PFA-ului, prin bancă sau numerar. Importurile, documentele și operațiunile manuale sunt verificate aici înainte de închiderea lunii.</Typography>
            <TransactionsTab key={period} {...tabProps} period={period} />
          </Stack>
        )}
        {section === 'venituri' && (
          <Stack spacing={3}>
            <Typography color="text.secondary">Estimarea anuală folosește profilul fiscal și datele contabile disponibile. Profilul și ajustările se completează din „Profil fiscal și taxe”; declarațiile lunare se verifică în „Luna aceasta”.</Typography>
            <EstimatedTaxesCard mode={staffMode} pfaId={pfa.id} onPlatformTaxes={() => openSection('luna')} />
          </Stack>
        )}
        {section === 'cheltuieli' && (
          <DeductibleExpensesPanel year={year} month={month} pfaRegistrationId={pfa.id} contabilContext={legacyContext} onSnackbar={notifySnackbar} />
        )}
        {section === 'registre' && <RegistersTab {...tabProps} />}
        {section === 'anual' && <AnnualTab {...tabProps} />}
        {section === 'mesaje' && userId && <ProfessionalChatBox clientUserId={userId} clientName={pfa.name} />}
        {section === 'anaf' && <AnafTab pfaId={pfa.id} />}
        {section === 'setari' && <SettingsTab {...tabProps} />}
        {section === 'istoric' && <ClientHistorySection pfaId={pfa.id} year={year} month={month} refreshKey={historyKey} />}
      </Box>

      <SideSheet
        open={profileOpen}
        title="Profil fiscal și taxe"
        onClose={() => setProfileOpen(false)}
        width={640}
        actions={
          <Button variant="contained" onClick={() => setProfileOpen(false)}>
            Gata
          </Button>
        }
      >
        <Stack spacing={2}>
          <FiscalProfilePanel mode={staffMode} pfaId={pfa.id} />
          <StaffTaxInputsPanel mode={staffMode} pfaId={pfa.id} />
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

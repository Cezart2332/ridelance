import { Alert, Box, Button, Divider, LinearProgress, Paper, Stack, ThemeProvider, Typography } from '@mui/material'
import { useEffect, useState } from 'react'

import {
  EmptyState,
  FieldGrid,
  MetaBar,
  PageHeader,
  Section,
  SectionSkeleton,
  StatusBadge,
  usePageTabs,
  type ActionMenuItem,
  type FieldSpec,
} from '../../components/admin'
import { CompanyFormationAdminPanel } from '../../components/pfa/CompanyFormationAdminPanel'
import { PfaFiscalSettingsPanel } from '../../components/pfa/PfaFiscalSettingsPanel'
import { FiscalProfilePanel } from '../../shared/fiscal-profile'
import { OnboardingSectionsPanel } from '../../components/dashboard/sections/admin/OnboardingSectionsPanel'
import { UberImportAdminPanel } from '../../components/dashboard/sections/admin/UberImportAdminPanel'
import { DocumentRejectDialog } from '../../components/dashboard/sections/admin/DocumentRejectDialog'
import type { DocumentSummary } from '../../services/document.service'
import { onboardingService, type OnboardingState } from '../../services/onboarding.service'
import type { AdminPfaDetail } from '../../services/adminOverview.service'
import { adminTheme } from '../../theme/adminTheme'
import { DocumentLibrary } from '../../components/admin/DocumentLibrary'

export interface PfaDetailSubject {
  id: string
  /** Fals cât clientul n-are încă dosar PFA; `id` e atunci id-ul contului. */
  hasRegistration?: boolean
  userId: string
  userEmail: string
  userName: string
  fullName: string | null
  phone: string | null
  status: string
  accountStatus: string
  registrationType: string
  cui: string | null
  contractDuration: number | null
  street: string | null
  number: string | null
  city: string | null
  county: string | null
  isOwner: boolean
  documentCount: number
  createdAtUtc: string
}

export interface PfaDetailViewProps {
  pfa: PfaDetailSubject
  detail: AdminPfaDetail | null
  detailLoading: boolean
  detailError: string | null
  documents: DocumentSummary[]
  docsLoading: boolean
  docsError: string | null
  /** Etichetele deja formatate în pagina-gazdă, ca să nu dublăm regulile de afișare. */
  meta: { plan: string; subscription: string; registration: string; month: string; activity: string }
  payments: [string, string][]
  accounting: [string, string][]
  onBack: () => void
  onImpersonate: () => void
  onOpenAction: (action: 'plan' | 'discount' | 'suspend' | 'reactivate' | 'note') => void
  onOpenChat: () => void
  onApprove: () => void
  onReject: () => void
  onUpdateDocStatus: (id: string, status: 'Verified' | 'Rejected', note?: string) => Promise<boolean>
  onOpenDocument: (doc: DocumentSummary) => void
  onDownload: (doc: DocumentSummary) => void
  onSnackbar: (message: string, severity: 'success' | 'error') => void
  /** Reîncarcă documentele clientului — după un act încărcat din admin. */
  onDocumentsChanged: () => Promise<void>
  onboardingRefreshKey: number
  /** Id-urile operațiunilor în curs, pentru indicatorii per document din panoul de secțiuni. */
  statusUpdatingDocId: string | null
  openingId: string | null
  downloadingId: string | null
}

const TABS = [
  { value: 'onboarding', label: 'Verificare dosar' },
  { value: 'documente', label: 'Documente' },
  { value: 'client', label: 'Date client' },
  { value: 'plati', label: 'Abonament și plăți' },
  { value: 'contabilitate', label: 'Contabilitate' },
  { value: 'dosar', label: 'Dosar înființare' },
  { value: 'rapoarte', label: 'Rapoarte Uber' },
  { value: 'activitate', label: 'Activitate' },
]

/**
 * Fișa unui client din admin.
 *
 * Structura urmează „resource details": antet cu o singură acțiune primară, o bară de metadate,
 * taburi pentru sub-view-uri, apoi două coloane — conținut la stânga, context și acțiuni la
 * dreapta. Înainte totul era stivuit vertical, fiecare bloc într-un Paper cu bordură proprie,
 * iar dosarul de înființare ajungea sub al treilea fold.
 *
 * Componenta e strict prezentațională: aceleași date, aceleași acțiuni, altă ierarhie.
 */
export function PfaDetailView(props: PfaDetailViewProps) {
  const {
    pfa,
    detail,
    detailLoading,
    detailError,
    documents,
    docsLoading,
    docsError,
    meta,
    payments,
    accounting,
    onBack,
    onImpersonate,
    onOpenAction,
    onOpenChat,
    onApprove,
    onReject,
    onUpdateDocStatus,
    onOpenDocument,
    onDownload,
    onSnackbar,
    onDocumentsChanged,
    onboardingRefreshKey,
    statusUpdatingDocId,
    openingId,
    downloadingId,
  } = props

  const [tab, tabsElement] = usePageTabs({ tabs: TABS, paramName: 'section' })
  const [docRejectTarget, setDocRejectTarget] = useState<DocumentSummary | null>(null)

  const isPending = pfa.status.toLowerCase() === 'pending'
  // Cont fără dosar PFA încă: e la pasul de eligibilitate. Rămân doar acțiunile de cont.
  const hasRegistration = pfa.hasRegistration !== false
  const isSuspended = (detail?.accountStatus ?? pfa.accountStatus).toLowerCase().includes('suspend')

  // Progresul de onboarding pentru coloana din dreapta. Aceeași sursă pe care o citește și
  // panoul de secțiuni; se reîncarcă odată cu el, după fiecare validare.
  const [onboarding, setOnboarding] = useState<OnboardingState | null>(null)
  useEffect(() => {
    let cancelled = false
    onboardingService
      .getForRegistration(pfa.id)
      .then((state) => {
        if (!cancelled) setOnboarding(state)
      })
      .catch(() => {
        // Progresul e context, nu conținut: dacă nu se încarcă, bara lipsește și atât.
      })
    return () => {
      cancelled = true
    }
  }, [pfa.id, onboardingRefreshKey])

  const steps = onboarding?.steps ?? []
  const completed = steps.filter((s) => s.status === 'Completed').length

  const identity = [
    detail?.email ?? pfa.userEmail,
    detail?.phone || pfa.phone || null,
    pfa.cui ? `CUI ${pfa.cui}` : null,
  ]

  const clientFields: FieldSpec[] = [
    { label: 'Nume formular', value: pfa.fullName || pfa.userName },
    { label: 'Telefon', value: detail?.phone || pfa.phone },
    { label: 'CUI', value: pfa.cui, numeric: true },
    { label: 'Durată comodat', value: pfa.contractDuration ? `${pfa.contractDuration} ani` : null },
    { label: 'Adresă', value: [pfa.street, pfa.number].filter(Boolean).join(' ') || null },
    { label: 'Localitate', value: [pfa.city, pfa.county].filter(Boolean).join(', ') || null },
    { label: 'Proprietar sediu', value: pfa.isOwner ? 'Da' : 'Nu' },
  ]

  // Acțiunea primară e cea contextuală: un dosar în așteptare se aprobă, un cont activ se
  // folosește. Restul intră în „⋯", inclusiv cea distructivă.
  const primaryAction = isPending
    ? { label: 'Aprobă dosarul', onClick: onApprove }
    : { label: 'Autentificare ca utilizator', onClick: onImpersonate }

  const headerMenu: ActionMenuItem[] = !hasRegistration
    ? [{ key: 'chat', label: 'Deschide chat', onClick: onOpenChat }]
    : [
        ...(isPending ? [{ key: 'reject', label: 'Respinge dosarul', onClick: onReject, destructive: true }] : []),
        { key: 'plan', label: 'Schimbă plan', onClick: () => onOpenAction('plan') },
        { key: 'discount', label: 'Aplică discount', onClick: () => onOpenAction('discount') },
        { key: 'chat', label: 'Deschide chat', onClick: onOpenChat },
        { key: 'note', label: 'Note interne', onClick: () => onOpenAction('note') },
        isSuspended
          ? {
              key: 'reactivate',
              label: 'Reactivează cont',
              onClick: () => onOpenAction('reactivate'),
              dividerBefore: true,
            }
          : {
              key: 'suspend',
              label: 'Suspendă cont',
              onClick: () => onOpenAction('suspend'),
              destructive: true,
              dividerBefore: true,
            },
      ]

  return (
    <ThemeProvider theme={adminTheme}>
      <Box sx={{ bgcolor: 'background.default', color: 'text.primary' }}>
        <Stack spacing={2} sx={{ maxWidth: 1400, mx: 'auto' }}>
          <PageHeader
            backLabel="Înapoi la clienți"
            onBack={onBack}
            avatarText={pfa.userName.charAt(0)}
            title={detail?.companyName ?? pfa.userName}
            subtitle={
              <>
                {identity[0]}
                {' · '}
                {identity[1] ?? (
                  <Box component="span" sx={{ color: 'text.disabled' }}>
                    Telefon necompletat
                  </Box>
                )}
                {identity[2] ? ` · ${identity[2]}` : ''}
              </>
            }
            status={
              <StatusBadge
                label={detail?.accountStatus ?? pfa.accountStatus}
                tone={isPending || !hasRegistration ? 'warning' : isSuspended ? 'error' : 'success'}
              />
            }
            primaryAction={primaryAction}
            menuItems={headerMenu}
          />

          <Box>
            <MetaBar
              items={[
                { label: 'Plan', value: meta.plan },
                { label: 'Abonament', value: meta.subscription },
                { label: 'Tip', value: meta.registration },
                { label: 'Luna curentă', value: meta.month },
                { label: 'Ultima activitate', value: meta.activity },
              ]}
            />
          </Box>

          {detailError && <Alert severity="warning">{detailError}</Alert>}

          {tabsElement}

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 264px' },
              gap: 2,
              alignItems: 'start',
            }}
          >
            {/* ── Coloana primară ── */}
            <Stack spacing={2} sx={{ minWidth: 0 }}>
              {tab === 'onboarding' && docsError && <Alert severity="error">{docsError}</Alert>}
              {tab === 'onboarding' && docsLoading && <SectionSkeleton rows={4} />}
              {tab === 'onboarding' && !docsLoading && (
                <OnboardingSectionsPanel
                  pfaId={pfa.id}
                  pfaStatus={pfa.status}
                  hasRegistration={hasRegistration}
                  clientUserId={pfa.userId}
                  documents={documents}
                  statusUpdatingDocId={statusUpdatingDocId}
                  openingId={openingId}
                  downloadingId={downloadingId}
                  onUpdateDocStatus={onUpdateDocStatus}
                  onOpenDocument={onOpenDocument}
                  onDownload={onDownload}
                  onOpenPfaApproveDialog={onApprove}
                  onSnackbar={onSnackbar}
                  onDocumentsChanged={onDocumentsChanged}
                  refreshKey={onboardingRefreshKey}
                  onStateChange={setOnboarding}
                />
              )}

              {tab === 'documente' && (
                <DocumentLibrary documents={documents} loading={docsLoading} error={docsError}
                  busy={statusUpdatingDocId !== null} openingId={openingId} downloadingId={downloadingId}
                  onApprove={(doc) => { void onUpdateDocStatus(doc.id, 'Verified') }} onReject={setDocRejectTarget}
                  onOpen={onOpenDocument} onDownload={onDownload} />
              )}

              {tab === 'client' && (
                <>
                  <Section title="Date completate în formular">
                    {detailLoading ? <SectionSkeleton rows={2} /> : <FieldGrid fields={clientFields} />}
                  </Section>

                </>
              )}
              {tab === 'plati' && (
                <>
                  <Stack direction="row" spacing={1}><Button variant="outlined" onClick={() => onOpenAction('plan')}>Schimbă planul</Button><Button variant="text" onClick={() => onOpenAction('discount')}>Aplică discount</Button></Stack>
                  <Section title="Abonament și plăți">
                    {detailLoading ? (
                      <SectionSkeleton rows={3} />
                    ) : (
                      <FieldGrid
                        columns={2}
                        fields={payments.map(([label, value]) => ({ label, value }))}
                      />
                    )}
                  </Section>

                </>
              )}
              {tab === 'contabilitate' && (
                <>
                  <Section title="Situație contabilă">
                    {detailLoading ? (
                      <SectionSkeleton rows={2} />
                    ) : (
                      <FieldGrid
                        columns={2}
                        fields={accounting.map(([label, value]) => ({ label, value }))}
                      />
                    )}
                  </Section>

                  {hasRegistration && <FiscalProfilePanel mode="admin" pfaId={pfa.id} />}

                  <PfaFiscalSettingsPanel pfaId={pfa.id} editable clientUserId={pfa.userId} />
                </>
              )}

              {tab === 'activitate' && (
                <Section title="Istoricul activității">
                  {detailLoading ? <SectionSkeleton rows={4} /> : detail?.activityLog?.length ? (
                    <Stack spacing={2.5} divider={<Divider />}>
                      {detail.activityLog.map((event) => (
                        <Box key={event.id}>
                          <Typography variant="body1">{event.description}</Typography>
                          <Typography variant="caption" color="text.secondary">{event.performedBy} · {new Date(event.createdAtUtc).toLocaleString('ro-RO')}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  ) : <EmptyState title="Nu există activitate înregistrată." />}
                </Section>
              )}

              {tab === 'dosar' && <CompanyFormationAdminPanel key={pfa.id} pfaId={pfa.id} />}

              {tab === 'rapoarte' &&
                (isPending ? (
                  <Section title="Rapoarte Uber">
                    <EmptyState title="Rapoartele devin disponibile după aprobarea dosarului." />
                  </Section>
                ) : (
                  <UberImportAdminPanel
                    pfaRegistrationId={pfa.id}
                    clientName={pfa.fullName || pfa.userName || pfa.userEmail}
                  />
                ))}
            </Stack>

            {/* ── Coloana secundară ── */}
            <Paper component="aside" sx={{ position: { lg: 'sticky' }, top: 96, alignSelf: 'start' }}>
              <Box sx={{ p: 2.5 }}>
                <Typography variant="h2" sx={{ mb: 1.5 }}>
                  Progres onboarding
                </Typography>
                {steps.length === 0 ? (
                  <Typography variant="body2" color="text.disabled">
                    Indisponibil
                  </Typography>
                ) : (
                  <>
                    <LinearProgress
                      variant="determinate"
                      value={(completed / steps.length) * 100}
                      sx={{ height: 4, borderRadius: 2 }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {completed} din {steps.length} pași validați
                    </Typography>
                  </>
                )}
              </Box>

              <Divider />

              <Box sx={{ p: 2.5 }}>
                <Typography variant="h2" sx={{ mb: 1 }}>Contact și suport</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, overflowWrap: 'anywhere' }}>{pfa.userEmail}</Typography>
                <Button variant="outlined" fullWidth onClick={onOpenChat}>Deschide conversația</Button>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>Ultima activitate: {meta.activity}</Typography>
              </Box>
              <Divider />

              <Box sx={{ p: 2.5 }}>
                <Stack
                  direction="row"
                  sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}
                >
                  <Typography variant="h2">Note interne</Typography>
                  <Button size="small" variant="text" onClick={() => onOpenAction('note')}>
                    Editează
                  </Button>
                </Stack>
                <Typography
                  variant="body2"
                  color={detail?.internalNote ? 'text.primary' : 'text.disabled'}
                  sx={{ whiteSpace: 'pre-wrap' }}
                >
                  {detail?.internalNote || 'Fără note.'}
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Stack>
      </Box>

      <DocumentRejectDialog
        key={docRejectTarget?.id ?? 'none'}
        document={docRejectTarget}
        onClose={() => setDocRejectTarget(null)}
        onConfirm={(doc, note) => onUpdateDocStatus(doc.id, 'Rejected', note)}
      />
    </ThemeProvider>
  )
}

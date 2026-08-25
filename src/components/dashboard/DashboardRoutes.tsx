import { Navigate, Route, Routes } from 'react-router-dom'

import { AbonamenteTab } from './sections/AbonamenteTab'
import { AccountantChatTab } from './sections/AccountantChatTab'
import { BankTab } from './sections/BankTab'
import { BeneficiiTab } from './sections/BeneficiiTab'
import { ExpensesPage } from './sections/accounting/ExpensesPage'
import { FinancialOverviewPage } from './sections/accounting/FinancialOverviewPage'
import { TaxesPage } from './sections/accounting/TaxesPage'
import { BoltConnectionPage } from './sections/connections/BoltConnectionPage'
import { OblioConnectionPage } from './sections/connections/OblioConnectionPage'
import { UberConnectionPage } from './sections/connections/UberConnectionPage'
import { CarsView } from './sections/CarsView'
import { DocumentsGroupPage } from './sections/documents/DocumentsGroupPage'
import { ExpensesRecurringTab } from './sections/ExpensesRecurringTab'
import { HomeDashboardView } from './sections/HomeDashboardView'
import { InsuranceTab } from './sections/InsuranceTab'
import { ProfileSection } from './sections/ProfileSection'
import { ServiciiTab } from './sections/ServiciiTab'
import { SupportChatTab } from './sections/SupportChatTab'
import { InvoicesPage } from './invoices/InvoicesPage'
import { useSectionNavigate } from './useSectionNavigate'
import { PFA_PATHS } from '../../config/pfaNavigation'

type DashboardRoutesProps = {
  pfaRegistrationId: string | null
  onSnackbar: (message: string, severity: 'success' | 'error') => void
}

/**
 * Tabelul de rute al dashboard-ului PFA. Căile vin exclusiv din `PFA_PATHS`, ca sidebar-ul
 * și rutarea să nu poată diverge — un slug schimbat într-un singur loc mută și meniul, și ruta.
 *
 * Rutele de categorie nu au pagină proprie: trimit la primul copil, cum cere spec-ul §5.2.
 */
export function DashboardRoutes({ pfaRegistrationId, onSnackbar }: DashboardRoutesProps) {
  const navigateToSection = useSectionNavigate()

  // Rutele se declară relativ la `/app/dashboard/*`, splat-ul din App.tsx.
  const rel = (path: string) => path.slice(`${PFA_PATHS.home}/`.length)

  return (
    <Routes>
      <Route index element={<HomeDashboardView onNavigate={navigateToSection} />} />

      {/* ── Contabilitate ── */}
      <Route path={rel(PFA_PATHS.accounting)} element={<Navigate to={PFA_PATHS.financialOverview} replace />} />
      <Route path={rel(PFA_PATHS.financialOverview)} element={<FinancialOverviewPage />} />
      <Route path={rel(PFA_PATHS.expenses)} element={<ExpensesPage pfaRegistrationId={pfaRegistrationId} />} />
      <Route path={rel(PFA_PATHS.taxes)} element={<TaxesPage />} />
      <Route path={rel(PFA_PATHS.bankAccount)} element={<BankTab onNavigate={navigateToSection} />} />
      {/* Construită o singură dată, folosită de ambele dashboard-uri (spec §3.3.1). */}
      <Route path={rel(PFA_PATHS.invoices)} element={<InvoicesPage />} />
      <Route path={rel(PFA_PATHS.accountantChat)} element={<AccountantChatTab />} />

      {/* ── Documente ── */}
      <Route path={rel(PFA_PATHS.documents)} element={<Navigate to={PFA_PATHS.docsPersonal} replace />} />
      <Route path={rel(PFA_PATHS.docsPersonal)} element={<DocumentsGroupPage group="personal" />} />
      <Route path={rel(PFA_PATHS.docsPfa)} element={<DocumentsGroupPage group="pfa" />} />
      <Route path={rel(PFA_PATHS.docsVehicle)} element={<DocumentsGroupPage group="vehicle" />} />
      <Route
        path={rel(PFA_PATHS.docsRecurring)}
        element={
          <ExpensesRecurringTab
            pfaRegistrationId={pfaRegistrationId}
            viewMode="doc_recurring"
            onSnackbar={onSnackbar}
          />
        }
      />

      {/* ── Conexiuni ── */}
      <Route path={rel(PFA_PATHS.connections)} element={<Navigate to={PFA_PATHS.connBolt} replace />} />
      <Route path={rel(PFA_PATHS.connBolt)} element={<BoltConnectionPage />} />
      <Route path={rel(PFA_PATHS.connUber)} element={<UberConnectionPage />} />
      <Route path={rel(PFA_PATHS.connOblio)} element={<OblioConnectionPage />} />
      {/* Banca e o singură pagină; sub Conexiuni apare doar ca punct de intrare. */}
      <Route path={rel(PFA_PATHS.connBank)} element={<Navigate to={PFA_PATHS.bankAccount} replace />} />

      {/* ── Beneficii ── */}
      <Route path={rel(PFA_PATHS.benefits)} element={<BeneficiiTab onNavigate={navigateToSection} />} />

      {/* ── Servicii ── */}
      <Route path={rel(PFA_PATHS.services)} element={<Navigate to={PFA_PATHS.svcCars} replace />} />
      <Route path={rel(PFA_PATHS.svcCars)} element={<CarsView />} />
      <Route path={rel(PFA_PATHS.svcSubscriptions)} element={<AbonamenteTab />} />
      <Route path={rel(PFA_PATHS.svcIndividual)} element={<ServiciiTab />} />
      <Route path={rel(PFA_PATHS.svcInsurance)} element={<InsuranceTab />} />

      {/* ── Suport, Profil ── */}
      <Route path={rel(PFA_PATHS.support)} element={<SupportChatTab accountantChatPath={PFA_PATHS.accountantChat} />} />
      <Route path={rel(PFA_PATHS.profile)} element={<ProfileSection />} />
      {/* Istoricul plăților e o secțiune în Profil; calea proprie rămâne doar ca punct de
          aterizare pentru notificările deja trimise. */}
      <Route
        path={rel(PFA_PATHS.paymentHistory)}
        element={<Navigate to={PFA_PATHS.paymentHistoryAnchor} replace />}
      />

      <Route path="*" element={<Navigate to={PFA_PATHS.home} replace />} />
    </Routes>
  )
}

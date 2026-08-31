import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'

import { SRL_LEGACY_ACCOUNTING_SEGMENT, SRL_PATHS } from '../../../config/srlNavigation'
import { BankTab } from '../sections/BankTab'
import { BeneficiiTab } from '../sections/BeneficiiTab'
import { SupportChatTab } from '../sections/SupportChatTab'
import { InvoicesPage } from '../invoices/InvoicesPage'
import { AddCarWizard } from '../addCar/AddCarWizard'
import { SrlCompanyDocumentsPage } from './pages/SrlCompanyDocumentsPage'
import { SrlCompanyPagePage } from './pages/SrlCompanyPagePage'
import { SrlConnectionsPage } from './pages/SrlConnectionsPage'
import { SrlHomePage } from './pages/SrlHomePage'
import { SrlMaintenancePage } from './pages/SrlMaintenancePage'
import { SrlRentalsPage } from './pages/SrlRentalsPage'
import { SrlProfilePage } from './pages/SrlProfilePage'
import { SrlServicesPage } from './pages/SrlServicesPage'
import { SrlCarPage } from './pages/SrlCarPage'
import { SrlCarsPage } from './pages/SrlCarsPage'
import { SrlSettingsPage } from './pages/SrlSettingsPage'

/**
 * Tabelul de rute al dashboard-ului SRL. Ca la PFA: căile vin exclusiv din `SRL_PATHS`, ca
 * meniul și rutarea să nu poată diverge.
 *
 * Paginile marcate `ComingSoon` sunt cele pe care spec-ul le presupunea deja construite
 * (`NOTES-srl-restructure.md` §6.1). Ruta există și e navigabilă, item-ul rămâne în meniu cu
 * badge, iar pagina spune deschis că nu e gata — în loc să pară stricată.
 */
/** Wizardul are nevoie de navigare la ieșire; ruta o furnizează, componenta rămâne pură. */
function AddCarRoute() {
  const navigate = useNavigate()
  const toCars = () => navigate(SRL_PATHS.cars)

  return <AddCarWizard onCancel={toCars} onSaved={toCars} />
}

export function SrlRoutes() {
  // Rutele se declară relativ la `/app/dashboard-srl/*`, splat-ul din App.tsx.
  const rel = (path: string) => path.slice(`${SRL_PATHS.home}/`.length)

  return (
    <Routes>
      <Route index element={<SrlHomePage />} />

      {/* ── Flotă ── */}
      <Route path={rel(SRL_PATHS.cars)} element={<SrlCarsPage />} />
      {/* Adăugarea are rută proprie, nu dialog: șase pași într-un modal n-ar avea unde încăpea,
          iar un refresh la jumătatea completării ar fi pierdut tot. */}
      <Route path={rel(SRL_PATHS.addCar)} element={<AddCarRoute />} />
      {/* După `masini/adauga`: altfel `:carId` ar revendica și segmentul „adauga". */}
      <Route path={rel(SRL_PATHS.car)} element={<SrlCarPage />} />
      <Route path={rel(SRL_PATHS.rentals)} element={<SrlRentalsPage />} />
      <Route path={rel(SRL_PATHS.maintenance)} element={<SrlMaintenancePage />} />

      {/* ── Firmă ── */}
      <Route path={rel(SRL_PATHS.profile)} element={<SrlProfilePage />} />
      <Route path={rel(SRL_PATHS.companyPage)} element={<SrlCompanyPagePage />} />
      <Route path={rel(SRL_PATHS.companyDocuments)} element={<SrlCompanyDocumentsPage />} />
      <Route path={rel(SRL_PATHS.services)} element={<SrlServicesPage />} />

      {/* ── Financiar ── */}
      {/* Fără pagină de fiscal și fără chat de contabil: SRL-ul nu are contabil în platformă, iar
          declarațiile și regimul fiscal le ține contabilul firmei. Ce rămâne aici sunt unelte pe
          care firma le folosește singură. */}
      <Route path={rel(SRL_PATHS.finance)} element={<Navigate to={SRL_PATHS.bankAccount} replace />} />
      {/* Aceeași componentă ca la PFA, fără nicio ramificație pe tip de cont (spec §3.3). */}
      <Route path={rel(SRL_PATHS.bankAccount)} element={<BankTab />} />
      {/* Aceeași pagină ca la PFA — spec §3.3.1 cere una singură, nu două. */}
      <Route path={rel(SRL_PATHS.invoices)} element={<InvoicesPage />} />
      {/* Segmentul vechi, de dinainte de redenumire. Paginile care au supraviețuit își păstrează
          destinația — un link către facturi trebuie să ajungă la facturi, nu în capul grupului.
          Restul, `contabilitate/fiscal` inclusiv, n-are unde ajunge și cade pe contul bancar. */}
      <Route
        path={`${SRL_LEGACY_ACCOUNTING_SEGMENT}/cont-bancar`}
        element={<Navigate to={SRL_PATHS.bankAccount} replace />}
      />
      <Route
        path={`${SRL_LEGACY_ACCOUNTING_SEGMENT}/facturi`}
        element={<Navigate to={SRL_PATHS.invoices} replace />}
      />
      <Route
        path={`${SRL_LEGACY_ACCOUNTING_SEGMENT}/*`}
        element={<Navigate to={SRL_PATHS.bankAccount} replace />}
      />

      {/* ── Platformă ── */}
      <Route path={rel(SRL_PATHS.connections)} element={<SrlConnectionsPage />} />
      <Route path={rel(SRL_PATHS.benefits)} element={<BeneficiiTab />} />
      {/* SRL-ul nu are contabil în platformă, deci trimiterea către chatul lui nu se afișează. */}
      <Route path={rel(SRL_PATHS.support)} element={<SupportChatTab />} />

      <Route path={rel(SRL_PATHS.settings)} element={<SrlSettingsPage />} />

      <Route path="*" element={<Navigate to={SRL_PATHS.home} replace />} />
    </Routes>
  )
}

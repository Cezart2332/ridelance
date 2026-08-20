import { Navigate, Route, Routes } from 'react-router-dom'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import BuildRoundedIcon from '@mui/icons-material/BuildRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import PublicRoundedIcon from '@mui/icons-material/PublicRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'

import { SRL_PATHS } from '../../../config/srlNavigation'
import { BankTab } from '../sections/BankTab'
import { BeneficiiTab } from '../sections/BeneficiiTab'
import { CarsAdminView } from '../sections/admin/CarsAdminView'
import { SupportChatTab } from '../sections/SupportChatTab'
import { ComingSoon } from '../ui'
import { SrlConnectionsPage } from './pages/SrlConnectionsPage'
import { SrlFiscalPage } from './pages/SrlFiscalPage'
import { SrlProfilePage } from './pages/SrlProfilePage'
import { SrlServicesPage } from './pages/SrlServicesPage'
import { SrlSettingsPage } from './pages/SrlSettingsPage'

/**
 * Tabelul de rute al dashboard-ului SRL. Ca la PFA: căile vin exclusiv din `SRL_PATHS`, ca
 * meniul și rutarea să nu poată diverge.
 *
 * Paginile marcate `ComingSoon` sunt cele pe care spec-ul le presupunea deja construite
 * (`NOTES-srl-restructure.md` §6.1). Ruta există și e navigabilă, item-ul rămâne în meniu cu
 * badge, iar pagina spune deschis că nu e gata — în loc să pară stricată.
 */
export function SrlRoutes() {
  // Rutele se declară relativ la `/app/dashboard-srl/*`, splat-ul din App.tsx.
  const rel = (path: string) => path.slice(`${SRL_PATHS.home}/`.length)

  return (
    <Routes>
      <Route index element={<CarsAdminView variant="poster" posterSection="overview" />} />

      {/* ── Flotă ── */}
      <Route path={rel(SRL_PATHS.cars)} element={<CarsAdminView variant="poster" posterSection="manage" />} />
      <Route
        path={rel(SRL_PATHS.rentals)}
        element={
          <ComingSoon
            icon={<ReceiptLongRoundedIcon />}
            title="Închirierile, cu contracte și procese verbale"
            description="Vei putea porni o închiriere din dosarul mașinii, cu documentele generate din datele deja cunoscute."
            upcoming={['Contract și proces verbal generate automat', 'Check-in și check-out cu fotografii', 'Istoric per mașină și per chiriaș']}
          />
        }
      />
      <Route
        path={rel(SRL_PATHS.maintenance)}
        element={
          <ComingSoon
            icon={<BuildRoundedIcon />}
            title="Mentenanța flotei, într-un singur loc"
            description="Istoric de service, costuri și remindere bazate pe dată sau pe kilometraj."
            upcoming={['Intervenții cu facturi atașate', 'Remindere la km sau la dată', 'Costuri pe mașină și pe flotă']}
          />
        }
      />

      {/* ── Firmă ── */}
      <Route path={rel(SRL_PATHS.profile)} element={<SrlProfilePage />} />
      <Route
        path={rel(SRL_PATHS.companyPage)}
        element={
          <ComingSoon
            icon={<PublicRoundedIcon />}
            title="Mini-site-ul public al firmei"
            description="Pagina pe care o pot vedea clienții, cu mașinile tale și datele de contact pe care le alegi în Profil."
            upcoming={['Link public propriu', 'Mașinile listate cu identitatea firmei', 'Contact filtrat de setările din Profil']}
          />
        }
      />
      <Route
        path={rel(SRL_PATHS.companyDocuments)}
        element={
          <ComingSoon
            icon={<DescriptionRoundedIcon />}
            title="Documentele societății"
            description="Certificat de înregistrare, certificat constatator, autorizații — stocate și cu alerte de expirare."
            upcoming={['Preview fără descărcare', 'Alerte înainte de expirare', 'Acces rapid la generarea contractelor']}
          />
        }
      />
      <Route path={rel(SRL_PATHS.services)} element={<SrlServicesPage />} />

      {/* ── Contabilitate ── */}
      <Route path={rel(SRL_PATHS.accounting)} element={<Navigate to={SRL_PATHS.bankAccount} replace />} />
      {/* Aceeași componentă ca la PFA, fără nicio ramificație pe tip de cont (spec §3.3). */}
      <Route path={rel(SRL_PATHS.bankAccount)} element={<BankTab />} />
      <Route
        path={rel(SRL_PATHS.invoices)}
        element={
          <ComingSoon
            icon={<AccountBalanceRoundedIcon />}
            title="Facturile tale, într-un singur loc"
            description="Emise prin RIDElance sau sincronizate din Oblio, cu filtre, PDF și status de încasare."
            upcoming={['Emitere și stornare', 'Sincronizare cu Oblio', 'Trimitere pe email către client']}
          />
        }
      />
      <Route path={rel(SRL_PATHS.fiscal)} element={<SrlFiscalPage />} />

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

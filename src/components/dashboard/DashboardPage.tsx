import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { DocumentsTab } from './sections/DocumentsTab'
import { ExpensesRecurringTab } from './sections/ExpensesRecurringTab'
import { HomeDashboardView } from './sections/HomeDashboardView'
import { ProfileTab } from './sections/ProfileTab'
import { SupportChatTab } from './sections/SupportChatTab'
import { CarsView } from './sections/CarsView'
import { AbonamenteTab } from './sections/AbonamenteTab'
import { ServiciiTab } from './sections/ServiciiTab'
import { InsuranceTab } from './sections/InsuranceTab'
import { IstoricPlatiTab } from './sections/IstoricPlatiTab'
import { MenuHubView } from './sections/MenuHubView'
import { PlatformsView } from './sections/PlatformsView'
import { BankTab } from './sections/BankTab'

import AppLayout from './layout/AppLayout'

import { authService } from '../../services/auth.service'
import { userService } from '../../services/user.service'
import { stripeService } from '../../services/stripe.service'
import { canAccessDashboard, resolveClientPath } from '../../utils/clientOnboarding'
import { useRecurringDocumentationReminder } from '../../hooks/useRecurringDocumentationReminder'

import { Box, CircularProgress, Snackbar, Alert } from '@mui/material'

import iconHome from '../../assets/SVG/2- Regular/home.svg'
import iconProfile from '../../assets/SVG/2- Regular/user.svg'
import iconDocs from '../../assets/SVG/2- Regular/folder.svg'
import iconSupport from '../../assets/SVG/2- Regular/headphones.svg'
import iconWallet from '../../assets/SVG/2- Regular/credit-card.svg'

const mainSectionConfig = [
  { id: 'home', label: 'Acasă', icon: iconHome },
  { id: 'platforms', label: 'Platforme', icon: 'MUI:ElectricCarRounded' },
  { id: 'banca', label: 'Banca', icon: 'MUI:AccountBalanceRounded' },
  { id: 'profile', label: 'Profil', icon: iconProfile },
  { id: 'documents', label: 'Documente', icon: iconDocs },
  { id: 'support', label: 'Chat & Suport', icon: iconSupport },
  {
    id: 'accordion_group',
    label: 'Cheltuieli & Documentatie recurenta',
    icon: iconWallet,
    subItems: [
      { id: 'expenses', label: 'Cheltuieli' },
      { id: 'doc_recurring', label: 'Documentatie recurenta' },
    ],
  },
] as const

const bottomSectionConfig = [
  { id: 'cars', label: 'Mașini', icon: 'MUI:DirectionsCarFilledRounded' },
  { id: 'abonamente', label: 'Abonamente', icon: 'MUI:WorkspacePremiumRounded' },
  { id: 'servicii', label: 'Servicii', icon: 'MUI:ShoppingCartRounded' },
  { id: 'asigurari', label: 'Asigurări', icon: 'MUI:ShieldRounded' },
  { id: 'istoric_plati', label: 'Istoric Plăți', icon: 'MUI:ReceiptLongRounded' },
] as const

type SectionId = 'home' | 'cars' | 'profile' | 'documents' | 'support' | 'expenses' | 'doc_recurring' | 'abonamente' | 'servicii' | 'istoric_plati' | string

export default function DashboardPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeSection, setActiveSection] = useState<SectionId>('home')
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'error' })
  const [pfaRegistrationId, setPfaRegistrationId] = useState<string | null>(null)

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  // PFA approval gate
  const [pfaStatus, setPfaStatus] = useState<string | null | 'loading'>('loading')

  useRecurringDocumentationReminder(pfaStatus === 'Approved')

  useEffect(() => {
    const section = searchParams.get('section')
    if (section) {
      if (section === 'bolt_integration') {
        setActiveSection('platforms')
        return
      }
      setActiveSection(section)
      return
    }

    // Callback de la conectarea bancară: redirect-ul whitelistat la provider nu poate
    // conține query, așa că banca ne întoarce pe /app/dashboard cu ?ref= (GoCardless)
    // sau ?state=&code=/&error= (Enable Banking) — deschidem direct tabul Banca.
    if (searchParams.get('ref') || (searchParams.get('state') && (searchParams.get('code') || searchParams.get('error')))) {
      setActiveSection('banca')
    }
  }, [searchParams])

  useEffect(() => {
    // Dashboardul este accesibil doar după onboarding complet + abonament activ;
    // altfel userul e trimis înapoi în fluxul de onboarding/plată.
    // Excepție: întoarcerea din checkout (?subscribed=1) — webhookul Stripe poate întârzia.
    const justSubscribed = new URLSearchParams(window.location.search).get('subscribed') === '1'
    const boot = async () => {
      try {
        const [summary, sub] = await Promise.all([
          userService.getDashboardSummary(),
          stripeService.getSubscriptionStatus(),
        ])
        // Fail-closed: panelul se arată DOAR cu PFA aprobat + secțiunile de onboarding
        // validate + abonament activ. ?subscribed=1 (întoarcerea din checkout) tolerează
        // doar webhookul Stripe întârziat al abonamentului — nu și onboardingul nevalidat.
        const allowed =
          summary.pfaStatus === 'Approved' &&
          sub?.onboardingSectionsValidated === true &&
          (justSubscribed || canAccessDashboard(sub))
        if (!allowed) {
          navigate(resolveClientPath(sub), { replace: true })
          return
        }
        setPfaStatus(summary.pfaStatus)
        setPfaRegistrationId(summary.pfaRegistrationId ?? null)
      } catch {
        // Fail-closed: dacă nu putem verifica dreptul de acces, nu arătăm panelul.
        navigate('/onboarding', { replace: true })
      }
    }
    void boot()
  }, [navigate])

  const handleLogout = async () => {
    await authService.logout()
    navigate('/auth', { replace: true })
  }

  const renderSection = () => {
    if (activeSection === 'home') return <HomeDashboardView onNavigate={setActiveSection} />
    if (activeSection === 'platforms') return <PlatformsView />
    if (activeSection === 'banca') return <BankTab onNavigate={setActiveSection} />
    if (activeSection === 'cars') return <CarsView />
    if (activeSection === 'profile') return <ProfileTab />
    if (activeSection === 'documents') return <DocumentsTab onNavigate={setActiveSection} />
    if (activeSection === 'support') return <SupportChatTab />
    if (activeSection === 'abonamente') return <AbonamenteTab />
    if (activeSection === 'servicii') return <ServiciiTab />
    if (activeSection === 'asigurari') return <InsuranceTab />
    if (activeSection === 'istoric_plati') return <IstoricPlatiTab />
    if (activeSection === 'more') return <MenuHubView onNavigate={setActiveSection} onLogout={handleLogout} />

    return (
      <ExpensesRecurringTab
        pfaRegistrationId={pfaRegistrationId}
        viewMode={activeSection as 'expenses' | 'doc_recurring'}
        onSnackbar={showSnackbar}
      />
    )
  }

  // Show spinner while checking PFA status
  if (pfaStatus === 'loading') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <AppLayout
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      sectionConfig={mainSectionConfig}
      bottomSectionConfig={bottomSectionConfig}
      onLogout={handleLogout}
      showNotifications
      onOpenRecurringDocumentation={() => setActiveSection('doc_recurring')}
    >
      {renderSection()}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2, fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AppLayout>
  )
}

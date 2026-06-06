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
import { IstoricPlatiTab } from './sections/IstoricPlatiTab'
import { BoltIntegrationTab } from './sections/BoltIntegrationTab'
import { MenuHubView } from './sections/MenuHubView'

import AppLayout from './layout/AppLayout'

import { authService } from '../../services/auth.service'
import { userService } from '../../services/user.service'
import PendingApprovalPage from '../auth/PendingApprovalPage'
import { useRecurringDocumentationReminder } from '../../hooks/useRecurringDocumentationReminder'

import { Box, CircularProgress, Snackbar, Alert } from '@mui/material'

import iconHome from '../../assets/SVG/2- Regular/home.svg'
import iconProfile from '../../assets/SVG/2- Regular/user.svg'
import iconDocs from '../../assets/SVG/2- Regular/folder.svg'
import iconSupport from '../../assets/SVG/2- Regular/headphones.svg'
import iconWallet from '../../assets/SVG/2- Regular/credit-card.svg'

const mainSectionConfig = [
  { id: 'home', label: 'Acasa', icon: iconHome },
  { id: 'profile', label: 'Profil', icon: iconProfile },
  { id: 'documents', label: 'Documente', icon: iconDocs },
  { id: 'support', label: 'Suport / Contabilitate', icon: iconSupport },
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
  { id: 'istoric_plati', label: 'Istoric Plăți', icon: 'MUI:ReceiptLongRounded' },
  { id: 'bolt_integration', label: 'Integrare Bolt', icon: 'MUI:ElectricCarRounded' },
] as const

type SectionId = 'home' | 'cars' | 'profile' | 'documents' | 'support' | 'expenses' | 'doc_recurring' | 'abonamente' | 'servicii' | 'istoric_plati' | 'bolt_integration' | string

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
      setActiveSection(section)
    }
  }, [searchParams])

  useEffect(() => {
    userService.getDashboardSummary()
      .then((summary) => {
        if (!summary.pfaStatus) {
          // No PFA registration at all → redirect to registration
          navigate('/inregistrare/pfa', { replace: true })
        } else {
          setPfaStatus(summary.pfaStatus)
          setPfaRegistrationId(summary.pfaRegistrationId ?? null)
        }
      })
      .catch(() => {
        // If API fails, just show the dashboard anyway to not block the user
        setPfaStatus('Approved')
      })

  }, [navigate])

  const handleLogout = async () => {
    await authService.logout()
    navigate('/auth', { replace: true })
  }

  const renderSection = () => {
    if (activeSection === 'home') return <HomeDashboardView />
    if (activeSection === 'cars') return <CarsView />
    if (activeSection === 'profile') return <ProfileTab />
    if (activeSection === 'documents') return <DocumentsTab onNavigate={setActiveSection} />
    if (activeSection === 'support') return <SupportChatTab />
    if (activeSection === 'abonamente') return <AbonamenteTab />
    if (activeSection === 'servicii') return <ServiciiTab />
    if (activeSection === 'istoric_plati') return <IstoricPlatiTab />
    if (activeSection === 'bolt_integration') return <BoltIntegrationTab />
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

  // Show pending/rejected gate instead of the dashboard
  if (pfaStatus === 'Pending' || pfaStatus === 'Rejected') {
    return <PendingApprovalPage status={pfaStatus} onLogout={handleLogout} />
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

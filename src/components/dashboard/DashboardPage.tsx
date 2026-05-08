import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { DocumentsTab } from './sections/DocumentsTab'
import { ExpensesRecurringTab } from './sections/ExpensesRecurringTab'
import { HomeDashboardView } from './sections/HomeDashboardView'
import { ProfileTab } from './sections/ProfileTab'
import { SupportChatTab } from './sections/SupportChatTab'
import { CarsView } from './sections/CarsView'

import AppLayout from './layout/AppLayout'

import { documentService, type DocumentSummary } from '../../services/document.service'
import { authService } from '../../services/auth.service'
import { userService } from '../../services/user.service'
import PendingApprovalPage from '../auth/PendingApprovalPage'

import { Box, CircularProgress, Snackbar, Alert } from '@mui/material'

import iconHome from '../../assets/SVG/2- Regular/home.svg'
import iconProfile from '../../assets/SVG/2- Regular/user.svg'
import iconDocs from '../../assets/SVG/2- Regular/folder.svg'
import iconSupport from '../../assets/SVG/2- Regular/headphones.svg'
import iconWallet from '../../assets/SVG/2- Regular/credit-card.svg'

const sectionConfig = [
  { id: 'home', label: 'Acasa', icon: iconHome },
  { id: 'cars', label: 'Mașini', icon: 'MUI:DirectionsCarFilledRounded' },
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
]

type SectionId = 'home' | 'cars' | 'profile' | 'documents' | 'support' | 'expenses' | 'doc_recurring' | string

export default function DashboardPage() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<SectionId>('home')
  const [expenseInput, setExpenseInput] = useState('')
  const [expenses, setExpenses] = useState<DocumentSummary[]>([])
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'error' })

  // PFA approval gate
  const [pfaStatus, setPfaStatus] = useState<string | null | 'loading'>('loading')

  useEffect(() => {
    userService.getDashboardSummary()
      .then((summary) => {
        if (!summary.pfaStatus) {
          // No PFA registration at all → redirect to registration
          navigate('/inregistrare/pfa', { replace: true })
        } else {
          setPfaStatus(summary.pfaStatus)
        }
      })
      .catch(() => {
        // If API fails, just show the dashboard anyway to not block the user
        setPfaStatus('Approved')
      })

    // Load existing expenses
    documentService.getByUser()
      .then((docs) => {
        const cheltuieli = docs.filter(d => d.category === 'Cheltuiala')
        setExpenses(cheltuieli)
      })
      .catch((err) => {
        console.error('Eroare incarcare cheltuieli', err)
        setSnackbar({ open: true, message: 'Nu s-au putut încărca cheltuielile.', severity: 'error' })
      })
  }, [navigate])

  const handleLogout = async () => {
    await authService.logout()
    navigate('/auth', { replace: true })
  }

  const addExpense = async (file: File) => {
    if (!expenseInput.trim()) return

    const ext = file.name.split('.').pop()
    const customName = `${expenseInput.trim()}.${ext}`
    const customFile = new File([file], customName, { type: file.type })

    try {
      await documentService.upload(customFile, 'Cheltuiala')
      setExpenseInput('')
      
      // Refresh expenses
      const docs = await documentService.getByUser()
      setExpenses(docs.filter(d => d.category === 'Cheltuiala'))
      setSnackbar({ open: true, message: 'Cheltuiala a fost adăugată cu succes!', severity: 'success' })
    } catch (err: any) {
      console.error('Eroare incarcare cheltuiala', err)
      setSnackbar({ open: true, message: 'Adăugarea cheltuielii a eșuat. Încearcă din nou.', severity: 'error' })
    }
  }

  const renderSection = () => {
    if (activeSection === 'home') return <HomeDashboardView />
    if (activeSection === 'cars') return <CarsView />
    if (activeSection === 'profile') return <ProfileTab />
    if (activeSection === 'documents') return <DocumentsTab />
    if (activeSection === 'support') return <SupportChatTab />

    return (
      <ExpensesRecurringTab
        expenses={expenses}
        expenseInput={expenseInput}
        onExpenseChange={setExpenseInput}
        onAddExpense={addExpense}
        viewMode={activeSection as 'expenses' | 'doc_recurring'}
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
      sectionConfig={sectionConfig}
      onLogout={handleLogout}
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

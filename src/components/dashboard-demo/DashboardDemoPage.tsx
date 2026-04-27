import { useState } from 'react'
import { defaultExpenses, dashboardInitialChat } from './dashboardData'
import type { ChatMessage } from './types'
import { DocumentsTab } from './sections/DocumentsTab'
import { ExpensesRecurringTab } from './sections/ExpensesRecurringTab'
import { HomeDashboardView } from './sections/HomeDashboardView'
import { ProfileTab } from './sections/ProfileTab'
import { SupportChatTab } from './sections/SupportChatTab'

import { DashboardLayout } from '../layout/DashboardLayout'

import iconHome from '../../assets/SVG/2- Regular/home.svg'
import iconProfile from '../../assets/SVG/2- Regular/user.svg'
import iconDocs from '../../assets/SVG/2- Regular/folder.svg'
import iconSupport from '../../assets/SVG/2- Regular/headphones.svg'
import iconWallet from '../../assets/SVG/2- Regular/credit-card.svg'

const sectionConfig = [
  { id: 'home', label: 'Acasa', icon: iconHome },
  { id: 'profile', label: 'Profil', icon: iconProfile },
  { id: 'documents', label: 'Documente', icon: iconDocs },
  { id: 'support', label: 'Suport', icon: iconSupport },
  {
    id: 'accordion_group',
    label: 'Cheltuieli & Documentatie',
    icon: iconWallet,
    subItems: [
      { id: 'expenses', label: 'Cheltuieli' },
      { id: 'doc_recurring', label: 'Documentatie recurenta' },
    ],
  },
]

type SectionId = 'home' | 'profile' | 'documents' | 'support' | 'expenses' | 'doc_recurring' | string

export default function DashboardDemoPage() {
  const [activeSection, setActiveSection] = useState<SectionId>('home')
  
  const [chatMessage, setChatMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(dashboardInitialChat)
  const [expenseInput, setExpenseInput] = useState('')
  const [expenses, setExpenses] = useState(defaultExpenses)

  const sendChatMessage = () => {
    if (!chatMessage.trim()) {
      return
    }

    setChatMessages((prev) => [
      ...prev,
      {
        sender: 'Tu',
        text: chatMessage.trim(),
        time: new Date().toLocaleTimeString('ro-RO', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ])
    setChatMessage('')
  }

  const addExpense = () => {
    if (!expenseInput.trim()) {
      return
    }

    setExpenses((prev) => [expenseInput.trim(), ...prev])
    setExpenseInput('')
  }

  const renderSection = () => {
    if (activeSection === 'home') {
      return <HomeDashboardView />
    }

    if (activeSection === 'profile') {
      return <ProfileTab />
    }

    if (activeSection === 'documents') {
      return <DocumentsTab />
    }

    if (activeSection === 'support') {
      return (
        <SupportChatTab
          chatMessage={chatMessage}
          chatMessages={chatMessages}
          onChatChange={setChatMessage}
          onSend={sendChatMessage}
        />
      )
    }

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

  return (
    <DashboardLayout
      activeId={activeSection}
      onNavClick={setActiveSection}
      navItems={sectionConfig}
      userName="Șofer Demo"
      userRole="Utilizator PFA"
    >
      {renderSection()}
    </DashboardLayout>
  )
}

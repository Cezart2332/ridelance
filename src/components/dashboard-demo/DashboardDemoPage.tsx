import { useState } from 'react'

import { defaultExpenses } from './dashboardData'
import type { ChatMessage } from './types'
import { DocumentsTab } from './sections/DocumentsTab'
import { ExpensesRecurringTab } from './sections/ExpensesRecurringTab'
import { HomeDashboardView } from './sections/HomeDashboardView'
import { ProfileTab } from './sections/ProfileTab'
import { RecurringDocumentationTab } from './sections/RecurringDocumentationTab'
import { SupportChatTab } from './sections/SupportChatTab'

import AppLayout from './layout/AppLayout'

const sectionConfig = [
  { id: 'home', label: 'Acasa' },
  { id: 'profile', label: 'Profil' },
  { id: 'documents', label: 'Documente' },
  { id: 'support', label: 'Suport' },
  { id: 'expenses', label: 'Cheltuieli' },
  { id: 'recurring-docs', label: 'Documentatie recurenta' },
] as const

type SectionId = (typeof sectionConfig)[number]['id']

export default function DashboardDemoPage() {
  const [activeSection, setActiveSection] = useState<SectionId>('home')
  
  const [chatMessage, setChatMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [expenseSelection, setExpenseSelection] = useState('')
  const [expenseFileName, setExpenseFileName] = useState('')
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
    if (!expenseSelection.trim() || !expenseFileName.trim()) {
      return
    }

    setExpenses((prev) => [`${expenseSelection.trim()} - ${expenseFileName.trim()}`, ...prev])
    setExpenseSelection('')
    setExpenseFileName('')
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

    if (activeSection === 'recurring-docs') {
      return <RecurringDocumentationTab />
    }

    return (
      <ExpensesRecurringTab
        expenses={expenses}
        expenseSelection={expenseSelection}
        expenseFileName={expenseFileName}
        onExpenseSelectionChange={setExpenseSelection}
        onExpenseFileChange={setExpenseFileName}
        onAddExpense={addExpense}
      />
    )
  }

  return (
    <AppLayout
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      sectionConfig={sectionConfig}
    >
      {renderSection()}
    </AppLayout>
  )
}


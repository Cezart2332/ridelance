import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Chip,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'

import { TOKENS } from '../../constants/tokens'
import { documentService, type DocumentSummary } from '../../services/document.service'
import { RECURRING_DOCUMENTATION_CATEGORIES } from '../../constants/recurringDocumentationItems'
import { PfaMonthlyIncomeForm } from './PfaMonthlyIncomeForm'
import { RecurringDocumentationPanel } from '../dashboard/sections/RecurringDocumentationPanel'
import { DeductibleExpensesPanel } from '../dashboard/sections/DeductibleExpensesPanel'
import { ContabilDocumentReviewList } from './ContabilDocumentReviewList'

export interface ContabilClientInfo {
  id: string
  userId: string
  userName: string
  userEmail: string
  status: string
}

interface ContabilClientWorkspaceProps {
  client: ContabilClientInfo
  onBack: () => void
  chatSlot: React.ReactNode
}

export function ContabilClientWorkspace({ client, onBack, chatSlot }: ContabilClientWorkspaceProps) {
  const [tab, setTab] = useState(0)
  const [documents, setDocuments] = useState<DocumentSummary[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({ open: false, message: '', severity: 'success' })

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  const loadDocuments = useCallback(async () => {
    setDocsLoading(true)
    try {
      const docs = await documentService.getByUser(client.userId)
      setDocuments(docs)
    } catch {
      showSnackbar('Nu s-au putut încărca documentele.', 'error')
    } finally {
      setDocsLoading(false)
    }
  }, [client.userId])

  useEffect(() => {
    void loadDocuments()
  }, [loadDocuments])

  const identityDocs = useMemo(
    () =>
      documents.filter(
        (d) =>
          !RECURRING_DOCUMENTATION_CATEGORIES.includes(
            d.category as (typeof RECURRING_DOCUMENTATION_CATEGORIES)[number],
          ),
      ),
    [documents],
  )

  const pendingCount = documents.filter((d) => d.status.toLowerCase() === 'pending').length

  const statusChipColor =
    client.status.toLowerCase() === 'approved'
      ? '#10b981'
      : client.status.toLowerCase() === 'rejected'
        ? '#ef4444'
        : '#f59e0b'

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
        <IconButton
          onClick={onBack}
          size="small"
          sx={{
            bgcolor: alpha(TOKENS.paper, 0.9),
            border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
            '&:hover': { bgcolor: alpha(TOKENS.primary, 0.08) },
          }}
        >
          <ArrowBackRoundedIcon fontSize="small" />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {client.userName}
            </Typography>
            <Chip
              label={client.status}
              size="small"
              sx={{
                fontWeight: 700,
                bgcolor: alpha(statusChipColor, 0.1),
                color: statusChipColor,
              }}
            />
            {pendingCount > 0 && (
              <Chip
                label={`${pendingCount} de verificat`}
                size="small"
                sx={{
                  fontWeight: 700,
                  bgcolor: alpha('#f59e0b', 0.12),
                  color: '#b45309',
                }}
              />
            )}
          </Stack>
          <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>
            {client.userEmail}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.65fr) minmax(320px, 1fr)' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <Stack spacing={2}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: TOKENS.radius.xl,
              border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
              overflow: 'hidden',
              boxShadow: TOKENS.shadow.sm,
            }}
          >
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                px: 1,
                bgcolor: alpha(TOKENS.surfaceAlt, 0.6),
                borderBottom: `1px solid ${alpha(TOKENS.ink, 0.06)}`,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  minHeight: 52,
                },
                '& .Mui-selected': { color: TOKENS.primaryStrong },
                '& .MuiTabs-indicator': { bgcolor: TOKENS.primary, height: 3 },
              }}
            >
              <Tab icon={<TrendingUpRoundedIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Venituri" />
              <Tab icon={<DescriptionRoundedIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Documente PFA" />
              <Tab icon={<EventNoteRoundedIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Doc. lunară" />
              <Tab icon={<ReceiptLongRoundedIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Cheltuieli" />
            </Tabs>

            <Box sx={{ p: { xs: 2, md: 2.5 } }}>
              {tab === 0 && <PfaMonthlyIncomeForm pfaRegistrationId={client.id} />}
              {tab === 1 && (
                <ContabilDocumentReviewList
                  title="Documente de verificat"
                  subtitle="Acte de identitate, atestate, asigurări și alte documente PFA"
                  documents={identityDocs}
                  loading={docsLoading}
                  onRefresh={loadDocuments}
                  onSnackbar={showSnackbar}
                />
              )}
              {tab === 2 && (
                <RecurringDocumentationPanel
                  contabilContext={{
                    userId: client.userId,
                    pfaRegistrationId: client.id,
                    onDocumentsChange: loadDocuments,
                  }}
                  onSnackbar={showSnackbar}
                />
              )}
              {tab === 3 && (
                <DeductibleExpensesPanel
                  pfaRegistrationId={client.id}
                  contabilContext={{
                    userId: client.userId,
                    pfaRegistrationId: client.id,
                  }}
                  onSnackbar={showSnackbar}
                  onChanged={loadDocuments}
                />
              )}
            </Box>
          </Paper>
        </Stack>

        <Box sx={{ position: { lg: 'sticky' }, top: { lg: 24 } }}>{chatSlot}</Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ borderRadius: TOKENS.radius.md, fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  )
}

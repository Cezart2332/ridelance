import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import RateReviewRoundedIcon from '@mui/icons-material/RateReviewRounded'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'

import { TOKENS } from '../../constants/tokens'
import { documentService, type DocumentSummary } from '../../services/document.service'
import { pfaService, type PfaInternalNote, type PfaActivityLog } from '../../services/pfa.service'
import { PfaMonthlyIncomeForm } from './PfaMonthlyIncomeForm'
import { RecurringDocumentationPanel } from '../dashboard/sections/RecurringDocumentationPanel'
import { DeductibleExpensesPanel } from '../dashboard/sections/DeductibleExpensesPanel'
import { PfaFiscalSettingsPanel } from '../pfa/PfaFiscalSettingsPanel'

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

const ROMANIAN_MONTHS = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
]

export function ContabilClientWorkspace({ client, onBack, chatSlot }: ContabilClientWorkspaceProps) {
  const [tab, setTab] = useState(0)
  const [documents, setDocuments] = useState<DocumentSummary[]>([])
  
  // Unified period state
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  
  const [isProcessed, setIsProcessed] = useState(false)
  const [processingStatus, setProcessingStatus] = useState(false)
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false)

  // Internal Notes & Activity Logs state
  const [internalNotes, setInternalNotes] = useState<PfaInternalNote[]>([])
  const [activityLogs, setActivityLogs] = useState<PfaActivityLog[]>([])
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')

  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({ open: false, message: '', severity: 'success' })

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  const loadDocuments = useCallback(async () => {
    try {
      const docs = await documentService.getByUser(client.userId)
      setDocuments(docs)
    } catch {
      showSnackbar('Nu s-au putut încărca documentele.', 'error')
    }
  }, [client.userId])

  const loadProcessedStatus = useCallback(async () => {
    try {
      const data = await pfaService.getMonthlyIncome(client.id, selectedYear, selectedMonth)
      setIsProcessed(data.isProcessed)
    } catch {
      // Ignore fallback
    }
  }, [client.id, selectedYear, selectedMonth])

  const loadNotesAndLogs = useCallback(async () => {
    setLoadingNotes(true)
    try {
      const notes = await pfaService.getInternalNotes(client.id, selectedYear, selectedMonth)
      setInternalNotes(notes)
      const logs = await pfaService.getActivityLogs(client.id)
      setActivityLogs(logs)
    } catch {
      // Ignore
    } finally {
      setLoadingNotes(false)
    }
  }, [client.id, selectedYear, selectedMonth])

  useEffect(() => {
    void loadDocuments()
  }, [loadDocuments])

  useEffect(() => {
    void loadProcessedStatus()
    void loadNotesAndLogs()
  }, [loadProcessedStatus, loadNotesAndLogs])

  const handleToggleProcess = () => {
    if (isProcessed) {
      void performProcess(false)
    } else {
      setOpenConfirmDialog(true)
    }
  }

  const handleConfirmProcess = () => {
    setOpenConfirmDialog(false)
    void performProcess(true)
  }

  const performProcess = async (targetProcessed: boolean) => {
    setProcessingStatus(true)
    try {
      const updated = await pfaService.processMonthlyIncome(client.id, selectedYear, selectedMonth, targetProcessed)
      setIsProcessed(updated.isProcessed)
      showSnackbar(
        updated.isProcessed ? 'Luna a fost marcată ca procesată.' : 'Procesarea lunii a fost anulată.',
        'success'
      )
      void loadNotesAndLogs()
    } catch {
      showSnackbar('Modificarea statusului de procesare a eșuat.', 'error')
    } finally {
      setProcessingStatus(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return
    try {
      const newNote = await pfaService.createInternalNote(
        client.id,
        selectedYear,
        selectedMonth,
        newNoteContent.trim()
      )
      setInternalNotes((prev) => [newNote, ...prev])
      setNewNoteContent('')
      showSnackbar('Nota a fost adăugată.', 'success')
      void loadNotesAndLogs()
    } catch {
      showSnackbar('Adăugarea notei a eșuat.', 'error')
    }
  }

  const handleUpdateNote = async (noteId: string) => {
    if (!editingContent.trim()) return
    try {
      const updated = await pfaService.updateInternalNote(noteId, editingContent.trim())
      setInternalNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)))
      setEditingNoteId(null)
      setEditingContent('')
      showSnackbar('Nota a fost modificată.', 'success')
      void loadNotesAndLogs()
    } catch {
      showSnackbar('Modificarea notei a eșuat.', 'error')
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      await pfaService.deleteInternalNote(noteId)
      setInternalNotes((prev) => prev.filter((n) => n.id !== noteId))
      showSnackbar('Nota a fost ștearsă.', 'success')
      void loadNotesAndLogs()
    } catch {
      showSnackbar('Ștergerea notei a eșuat.', 'error')
    }
  }

  const pendingCount = documents.filter((d) => d.status.toLowerCase() === 'pending').length

  const statusChipColor =
    client.status.toLowerCase() === 'approved'
      ? '#10b981'
      : client.status.toLowerCase() === 'rejected'
        ? '#ef4444'
        : '#f59e0b'

  const currentYearOptions = [selectedYear - 1, selectedYear, selectedYear + 1]

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
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

        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <FormControl size="small" sx={{ width: 140 }}>
            <InputLabel>Lună</InputLabel>
            <Select
              label="Lună"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              sx={{ borderRadius: TOKENS.radius.md, bgcolor: TOKENS.paper }}
            >
              {ROMANIAN_MONTHS.map((m, idx) => (
                <MenuItem key={m} value={idx + 1}>{m}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ width: 100 }}>
            <InputLabel>An</InputLabel>
            <Select
              label="An"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              sx={{ borderRadius: TOKENS.radius.md, bgcolor: TOKENS.paper }}
            >
              {currentYearOptions.map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Chip
            label={isProcessed ? 'Procesat' : 'În așteptare'}
            color={isProcessed ? 'success' : 'default'}
            sx={{ fontWeight: 800, borderRadius: TOKENS.radius.md }}
          />

          <Button
            variant="contained"
            color={isProcessed ? 'warning' : 'primary'}
            size="small"
            disabled={processingStatus}
            onClick={handleToggleProcess}
            sx={{
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: TOKENS.radius.md,
            }}
          >
            {isProcessed ? 'Anulează procesarea' : 'Marchează ca procesat'}
          </Button>
        </Stack>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.65fr) minmax(0, 1fr)' },
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
              <Tab icon={<AccountBalanceRoundedIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Profil fiscal" />
              <Tab icon={<EventNoteRoundedIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Doc. lunară" />
              <Tab icon={<ReceiptLongRoundedIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Cheltuieli" />
              <Tab icon={<HistoryRoundedIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Note & Istoric" />
            </Tabs>

            <Box sx={{ p: { xs: 2, md: 2.5 } }}>
              {tab === 0 && <PfaMonthlyIncomeForm pfaRegistrationId={client.id} year={selectedYear} month={selectedMonth} readOnly={true} />}
              {tab === 1 && <PfaFiscalSettingsPanel pfaId={client.id} />}
              {tab === 2 && (
                <RecurringDocumentationPanel
                  year={selectedYear}
                  month={selectedMonth}
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
                  year={selectedYear}
                  month={selectedMonth}
                  pfaRegistrationId={client.id}
                  contabilContext={{
                    userId: client.userId,
                    pfaRegistrationId: client.id,
                  }}
                  onSnackbar={showSnackbar}
                  onChanged={loadDocuments}
                />
              )}
              {tab === 4 && (
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr' }, gap: 3 }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <RateReviewRoundedIcon sx={{ color: TOKENS.primary, fontSize: 18 }} />
                        Note interne PFA ({ROMANIAN_MONTHS[selectedMonth - 1]} {selectedYear})
                      </Typography>

                      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: TOKENS.radius.lg, border: `1px dashed ${alpha(TOKENS.ink, 0.15)}`, bgcolor: alpha(TOKENS.primary, 0.01) }}>
                        <Typography variant="caption" sx={{ color: TOKENS.textMuted, fontWeight: 700, display: 'block', mb: 1 }}>
                          Adaugă o notă internă pentru această lună (invizibilă clientului):
                        </Typography>
                        <Stack spacing={1.5}>
                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Exemplu: Clientul nu a încărcat raportul Uber..."
                            value={newNoteContent}
                            onChange={(e) => setNewNoteContent(e.target.value)}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                bgcolor: TOKENS.paper,
                                borderRadius: TOKENS.radius.md,
                              }
                            }}
                          />
                          <Button
                            variant="contained"
                            size="small"
                            onClick={handleAddNote}
                            disabled={!newNoteContent.trim()}
                            sx={{ alignSelf: 'flex-start', fontWeight: 700, textTransform: 'none', borderRadius: TOKENS.radius.md }}
                          >
                            Adaugă notă
                          </Button>
                        </Stack>
                      </Paper>

                      {loadingNotes ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                          <CircularProgress size={24} sx={{ color: TOKENS.primary }} />
                        </Box>
                      ) : internalNotes.length === 0 ? (
                        <Typography variant="body2" sx={{ color: TOKENS.textMuted, textAlign: 'center', py: 4 }}>
                          Nu există note pentru această lună.
                        </Typography>
                      ) : (
                        <Stack spacing={2}>
                          {internalNotes.map((note) => (
                            <Paper key={note.id} variant="outlined" sx={{ p: 2, borderRadius: TOKENS.radius.lg, borderColor: alpha(TOKENS.ink, 0.08) }}>
                              {editingNoteId === note.id ? (
                                <Stack spacing={1.5}>
                                  <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    value={editingContent}
                                    onChange={(e) => setEditingContent(e.target.value)}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: TOKENS.radius.md } }}
                                  />
                                  <Stack direction="row" spacing={1}>
                                    <Button size="small" variant="contained" onClick={() => handleUpdateNote(note.id)}>
                                      Salvează
                                    </Button>
                                    <Button size="small" variant="text" color="inherit" onClick={() => setEditingNoteId(null)}>
                                      Anulează
                                    </Button>
                                  </Stack>
                                </Stack>
                              ) : (
                                <>
                                  <Typography variant="body2" sx={{ color: TOKENS.ink, whiteSpace: 'pre-wrap', mb: 1.5 }}>
                                    {note.content}
                                  </Typography>
                                  <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                    <Typography variant="caption" sx={{ color: TOKENS.textMuted, fontWeight: 600 }}>
                                      {new Date(note.createdAtUtc).toLocaleString('ro-RO')} — <span style={{ color: TOKENS.primaryStrong, fontWeight: 700 }}>{note.createdByUserName}</span>
                                    </Typography>
                                    <Stack direction="row" spacing={0.5}>
                                      <Button
                                        size="small"
                                        variant="text"
                                        color="primary"
                                        sx={{ minWidth: 'auto', p: '2px 8px', fontSize: '0.7rem', fontWeight: 700 }}
                                        onClick={() => {
                                          setEditingNoteId(note.id)
                                          setEditingContent(note.content)
                                        }}
                                      >
                                        Editează
                                      </Button>
                                      <Button
                                        size="small"
                                        variant="text"
                                        color="error"
                                        sx={{ minWidth: 'auto', p: '2px 8px', fontSize: '0.7rem', fontWeight: 700 }}
                                        onClick={() => handleDeleteNote(note.id)}
                                      >
                                        Șterge
                                      </Button>
                                    </Stack>
                                  </Box>
                                </>
                              )}
                            </Paper>
                          ))}
                        </Stack>
                      )}
                    </Box>

                    <Box sx={{ borderLeft: { md: `1px solid ${alpha(TOKENS.ink, 0.08)}` }, pl: { md: 3 } }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HistoryRoundedIcon sx={{ color: TOKENS.primary, fontSize: 18 }} />
                        Istoric activitate client
                      </Typography>

                      {loadingNotes ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                          <CircularProgress size={24} sx={{ color: TOKENS.primary }} />
                        </Box>
                      ) : activityLogs.length === 0 ? (
                        <Typography variant="body2" sx={{ color: TOKENS.textMuted, textAlign: 'center', py: 4 }}>
                          Nu există înregistrări în istoric.
                        </Typography>
                      ) : (
                        <Stack spacing={1.5} sx={{ maxHeight: 500, overflowY: 'auto', pr: 1 }}>
                          {activityLogs.map((log) => (
                            <Box key={log.id} sx={{ p: 1.5, borderRadius: TOKENS.radius.md, bgcolor: alpha(TOKENS.ink, 0.01), borderLeft: `3px solid ${log.activityType === 'MonthProcessed' ? '#10b981' : TOKENS.primary}` }}>
                              <Typography variant="body2" sx={{ color: TOKENS.ink, fontSize: '0.85rem' }}>
                                {log.description}
                              </Typography>
                              <Typography variant="caption" sx={{ color: TOKENS.textMuted, display: 'block', mt: 0.5 }}>
                                {new Date(log.createdAtUtc).toLocaleString('ro-RO')}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>
        </Stack>

        <Box sx={{ position: { lg: 'sticky' }, top: { lg: 24 } }}>{chatSlot}</Box>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: TOKENS.radius.xl,
              p: 1,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Confirmare procesare</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: TOKENS.ink }}>
            Ești sigur că vrei să marchezi luna {ROMANIAN_MONTHS[selectedMonth - 1]} {selectedYear} ca procesată?
          </DialogContentText>
          <DialogContentText sx={{ color: TOKENS.textMuted, mt: 1.5, fontSize: '0.9rem' }}>
            După procesare, luna va fi procesată oficial ca lună lucrată, iar clientul va primi notificare.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setOpenConfirmDialog(false)}
            variant="outlined"
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: TOKENS.radius.md }}
          >
            Anulează
          </Button>
          <Button
            onClick={handleConfirmProcess}
            variant="contained"
            color="primary"
            autoFocus
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: TOKENS.radius.md }}
          >
            Confirmă procesarea
          </Button>
        </DialogActions>
      </Dialog>

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

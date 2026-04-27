import { useState } from 'react'
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
  Avatar,
  IconButton,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { TOKENS } from '../constants/tokens'

// Icons
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import FolderRoundedIcon from '@mui/icons-material/FolderRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded'

export function ContabilDashboard() {
  const [activeTab, setActiveTab] = useState('clients')
  const [selectedPfaId, setSelectedPfaId] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState('Aprilie')
  
  const [clients] = useState([
    { id: '1', name: 'Lorem Ipsum PFA', email: 'lorem@pfa.ro', lastUpdate: 'Acum 2 ore' },
    { id: '2', name: 'Dolor Sit Amet PFA', email: 'dolor@pfa.ro', lastUpdate: 'Ieri' },
    { id: '3', name: 'Consectetur Adipiscing PFA', email: 'consectetur@pfa.ro', lastUpdate: '3 zile' },
  ])

  const [notifications] = useState([
    { id: '1', text: 'Lorem ipsum dolor sit amet 10', time: 'Acum 5 minute' },
    { id: '2', text: 'Consectetur adipiscing elit 10', time: 'Acum 1 oră' },
    { id: '3', text: 'Sed do eiusmod tempor 10', time: 'Azi la 09:15' },
  ])

  const navItems = [
    { id: 'clients', label: 'Clienți PFA', icon: <GroupsRoundedIcon /> },
    { id: 'notificari', label: 'Notificări', icon: <NotificationsActiveRoundedIcon /> },
  ]

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: alpha(TOKENS.paper, 0.9),
      borderRadius: TOKENS.radius.md,
      '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.ink, 0.08) },
      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.ink, 0.16) },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: alpha(TOKENS.primary, 0.6),
        borderWidth: 2,
      },
    },
  }

  const renderClientList = () => (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SearchRoundedIcon sx={{ color: TOKENS.textSubtle, mr: 1, fontSize: 20 }} />
        <TextField
          variant="outlined"
          size="small"
          placeholder="Caută client..."
          sx={{ width: 300, ...inputSx }}
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 24 }}>
        {clients.map((client) => (
          <Box key={client.id}>
            <Paper
              elevation={0}
              onClick={() => setSelectedPfaId(client.id)}
              sx={{
                p: 3,
                cursor: 'pointer',
                borderRadius: TOKENS.radius.lg,
                border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
                boxShadow: TOKENS.shadow.sm,
                background: `linear-gradient(160deg, ${alpha(TOKENS.primary, 0.05)} 0%, ${TOKENS.paper} 32%)`,
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: alpha(TOKENS.primary, 0.4),
                  boxShadow: TOKENS.shadow.md,
                },
              }}
            >
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: alpha(TOKENS.primary, 0.1), color: TOKENS.primaryStrong, fontWeight: 700 }}>
                  {client.name[0]}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{client.name}</Typography>
                  <Typography variant="caption" sx={{ color: TOKENS.textMuted }}>{client.email}</Typography>
                </Box>
              </Stack>
              
              <Stack direction="row" sx={{ justifyContent: 'flex-end', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: TOKENS.textSubtle }}>
                  Update: {client.lastUpdate}
                </Typography>
              </Stack>
            </Paper>
          </Box>
        ))}
      </Box>
    </Stack>
  )

  const renderClientDetail = () => {
    const client = clients.find(c => c.id === selectedPfaId)
    return (
      <Stack spacing={4}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={() => setSelectedPfaId(null)}
            size="small"
            sx={{
              bgcolor: alpha(TOKENS.paper, 0.9),
              border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
              '&:hover': { bgcolor: alpha(TOKENS.primary, 0.08) },
            }}
          >
            <ArrowBackRoundedIcon fontSize="small" />
          </IconButton>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{client?.name}</Typography>
            <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>{client?.email}</Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 24 }}>
          <Box>
            <Stack spacing={4}>
              {/* Incomes Section */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: TOKENS.radius.xl,
                  border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
                  boxShadow: TOKENS.shadow.sm,
                  background: `linear-gradient(165deg, ${alpha(TOKENS.primary, 0.05)} 0%, ${TOKENS.paper} 35%)`,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Venituri Client</Typography>
                  <Select
                    size="small"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    sx={{ width: 140, borderRadius: TOKENS.radius.md, bgcolor: TOKENS.paper }}
                  >
                    {['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'].map(m => (
                      <MenuItem key={m} value={m}>{m}</MenuItem>
                    ))}
                  </Select>
                </Box>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, color: TOKENS.textMuted }}>Sursă Venit</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: TOKENS.textMuted }}>Suma (RON)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Venit Uber</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: '#10b981' }}>+2,450.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Venit Bolt</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: '#10b981' }}>+1,820.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Venit Cash</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: '#10b981' }}>+850.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Venit Card</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: '#10b981' }}>+3,100.00</TableCell>
                      </TableRow>
                      <TableRow sx={{ bgcolor: alpha(TOKENS.primary, 0.05) }}>
                        <TableCell sx={{ fontWeight: 800 }}>Total Venituri</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 900, color: TOKENS.primaryStrong }}>+8,220.00</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              <Paper elevation={0} sx={{ p: 3, borderRadius: TOKENS.radius.xl, border: `1px solid ${alpha(TOKENS.ink, 0.08)}`, boxShadow: TOKENS.shadow.sm }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Extras bancar PFA</Typography>
                  <Button size="small" startIcon={<FileDownloadRoundedIcon />}>Descarcă Toate</Button>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 16 }}>
                  {['Extras - ' + selectedMonth].map((doc) => (
                    <Box key={doc}>
                      <Box sx={{ p: 2, border: `1px solid ${alpha(TOKENS.ink, 0.08)}`, borderRadius: TOKENS.radius.md, display: 'flex', alignItems: 'center', gap: 2, bgcolor: alpha(TOKENS.surface, 0.7) }}>
                        <Box sx={{ width: 40, height: 40, borderRadius: TOKENS.radius.sm, bgcolor: alpha(TOKENS.primary, 0.1), color: TOKENS.primaryStrong, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FolderRoundedIcon fontSize="small" />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{doc}</Typography>
                          <Typography variant="caption" sx={{ color: TOKENS.textMuted }}>PDF • 1.2 MB</Typography>
                        </Box>
                        <IconButton size="small"><FileDownloadRoundedIcon fontSize="small" /></IconButton>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Stack>
          </Box>

          <Box>
            {/* Chat Section */}
            <Paper elevation={0} sx={{ p: 3, height: 600, display: 'flex', flexDirection: 'column', borderRadius: TOKENS.radius.xl, border: `1px solid ${alpha(TOKENS.ink, 0.08)}`, boxShadow: TOKENS.shadow.sm }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Mesaje Client</Typography>
              <Box sx={{ flex: 1, overflowY: 'auto', mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ alignSelf: 'flex-start', maxWidth: '80%', p: 1.5, bgcolor: TOKENS.surface, borderRadius: '0 12px 12px 12px', border: `1px solid ${alpha(TOKENS.ink, 0.08)}` }}>
                  <Typography variant="body2">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</Typography>
                  <Typography variant="caption" sx={{ color: TOKENS.textSubtle, mt: 0.5, display: 'block' }}>10:30 AM</Typography>
                </Box>
                <Box sx={{ alignSelf: 'flex-end', maxWidth: '80%', p: 1.5, bgcolor: alpha(TOKENS.primary, 0.1), color: TOKENS.primaryStrong, borderRadius: '12px 0 12px 12px', border: `1px solid ${alpha(TOKENS.primary, 0.2)}` }}>
                  <Typography variant="body2">Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</Typography>
                  <Typography variant="caption" sx={{ color: alpha(TOKENS.primaryStrong, 0.7), mt: 0.5, display: 'block' }}>10:45 AM</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Scrie un mesaj..."
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: TOKENS.radius.md, bgcolor: alpha(TOKENS.surface, 0.9), '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.ink, 0.08) } } }}
                />
                <IconButton sx={{ color: TOKENS.primary }}>
                  <SendRoundedIcon />
                </IconButton>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Stack>
    )
  }

  const renderNotifications = () => (
    <Stack spacing={1.5} sx={{ maxWidth: 600 }}>
      {notifications.map((n) => (
        <Paper
          key={n.id}
          elevation={0}
          sx={{
            p: 2,
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            borderRadius: TOKENS.radius.md,
            border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
            bgcolor: alpha(TOKENS.paper, 0.86),
            boxShadow: TOKENS.shadow.sm,
            '&:hover': { borderColor: alpha(TOKENS.primary, 0.28), bgcolor: TOKENS.paper }
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: TOKENS.radius.sm,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(TOKENS.primary, 0.08),
              color: TOKENS.primaryStrong,
            }}
          >
            <NotificationsActiveRoundedIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: TOKENS.ink, fontSize: '0.85rem' }}>
              {n.text}
            </Typography>
            <Typography variant="caption" sx={{ color: TOKENS.textSubtle, fontSize: '0.75rem' }}>
              {n.time}
            </Typography>
          </Box>
        </Paper>
      ))}
    </Stack>
  )

  return (
    <DashboardLayout
      navItems={navItems}
      activeId={activeTab}
      onNavClick={(id) => {
        setActiveTab(id)
        if (id !== 'clients') setSelectedPfaId(null)
      }}
      userName="Lorem Ipsum"
      userRole=""
    >
      {selectedPfaId ? renderClientDetail() : (activeTab === 'notificari' ? renderNotifications() : renderClientList())}
    </DashboardLayout>
  )
}

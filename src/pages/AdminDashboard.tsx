import { useState } from 'react'
import {
  Box,
  Paper,
  Stack,
  TextField,
  Typography,
  Card,
  CardContent,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import { TOKENS } from '../constants/tokens'
import { DashboardLayout } from '../components/layout/DashboardLayout'

// Icons
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded'
import SupervisedUserCircleRoundedIcon from '@mui/icons-material/SupervisedUserCircleRounded'
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded'
import { Button } from '@mui/material'

export function AdminDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('pfa')
  const [pfas] = useState([
    { id: '1', name: 'Lorem Ipsum PFA', email: 'lorem@pfa.ro' },
    { id: '2', name: 'Dolor Sit Amet PFA', email: 'dolor@pfa.ro' },
    { id: '3', name: 'Consectetur Adipiscing PFA', email: 'consectetur@pfa.ro' },
    { id: '4', name: 'Eiusmod Tempor PFA', email: 'eiusmod@pfa.ro' },
  ])
  const [notifications] = useState([
    { id: '1', text: 'Lorem ipsum dolor sit amet 10', time: 'Acum 10 minute', type: 'info' },
    { id: '2', text: 'Consectetur adipiscing elit 10', time: 'Ieri la 14:00', type: 'success' },
    { id: '3', text: 'Eiusmod tempor incididunt 10', time: 'Acum 2 ore', type: 'warning' },
  ])

  const navItems = [
    { id: 'pfa', label: 'Gestionare PFA', icon: <PeopleAltRoundedIcon /> },
    { id: 'contabili', label: 'Înrolare Contabili', icon: <SupervisedUserCircleRoundedIcon /> },
    { id: 'notificari', label: 'Notificări', icon: <NotificationsActiveRoundedIcon /> },
  ]

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: alpha(TOKENS.paper, 0.92),
      borderRadius: TOKENS.radius.md,
      '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.ink, 0.08) },
      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.ink, 0.16) },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: alpha(TOKENS.primary, 0.6),
        borderWidth: 2,
      },
    },
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'pfa':
        return (
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
              <SearchRoundedIcon sx={{ color: TOKENS.textSubtle, mr: 1, fontSize: 20 }} />
              <TextField
                variant="outlined"
                size="small"
                placeholder="Caută PFA..."
                sx={{ width: 300, ...inputSx }}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 24 }}>
              {pfas.map((pfa) => (
                <Box key={pfa.id}>
                  <Card
                    elevation={0}
                    sx={{
                      border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
                      borderRadius: TOKENS.radius.lg,
                      boxShadow: TOKENS.shadow.sm,
                      background: `linear-gradient(160deg, ${alpha(TOKENS.primary, 0.05)} 0%, ${TOKENS.paper} 32%)`,
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: alpha(TOKENS.primary, 0.42),
                        boxShadow: TOKENS.shadow.md,
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: TOKENS.ink }}>
                            {pfa.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: TOKENS.textMuted }}>
                            {pfa.email}
                          </Typography>
                        </Box>
                      </Box>

                      <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        endIcon={<ArrowForwardIosRoundedIcon sx={{ fontSize: '10px !important' }} />}
                        onClick={() => navigate('/demo')}
                        sx={{
                          borderColor: alpha(TOKENS.ink, 0.14),
                          color: TOKENS.ink,
                          fontWeight: 700,
                          '&:hover': { bgcolor: alpha(TOKENS.primary, 0.08), borderColor: alpha(TOKENS.primary, 0.42) },
                        }}
                      >
                        Vezi detalii
                      </Button>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          </Stack>
        )
      case 'contabili':
        return (
          <Box sx={{ maxWidth: 600, py: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: TOKENS.radius.xl,
                border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
                boxShadow: TOKENS.shadow.sm,
                background: `linear-gradient(165deg, ${alpha(TOKENS.primary, 0.06)} 0%, ${TOKENS.paper} 35%)`,
              }}
            >
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>Înrolează Contabil Nou</Typography>
              <Typography variant="body2" sx={{ mb: 4, color: TOKENS.textMuted }}>
                Trimite o invitație pe email unui contabil pentru a-i oferi acces la platformă.
              </Typography>
              <Stack spacing={3}>
                <TextField fullWidth label="Nume complet" placeholder="Ex: Lorem Ipsum" sx={inputSx} />
                <TextField fullWidth label="Adresă email" placeholder="nume@contabil.ro" sx={inputSx} />
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    py: 1.5,
                    fontWeight: 700,
                    bgcolor: TOKENS.primary,
                    boxShadow: 'none',
                    '&:hover': { bgcolor: TOKENS.primaryStrong, boxShadow: 'none' },
                  }}
                >
                  Trimite Invitația
                </Button>
              </Stack>
            </Paper>
          </Box>
        )
      case 'notificari':
        return (
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
                  transition: '0.2s',
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
                    bgcolor: n.type === 'warning' ? alpha('#f59e0b', 0.08) : n.type === 'success' ? alpha('#10b981', 0.08) : alpha(TOKENS.primary, 0.08),
                    color: n.type === 'warning' ? '#f59e0b' : n.type === 'success' ? '#10b981' : TOKENS.primaryStrong,
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
      default:
        return null
    }
  }

  return (
    <DashboardLayout
      navItems={navItems}
      activeId={activeTab}
      onNavClick={setActiveTab}
      userName="Lorem Ipsum"
      userRole=""
    >
      {renderContent()}
    </DashboardLayout>
  )
}

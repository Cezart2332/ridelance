import { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  Alert
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import { pfaService } from '../../services/pfa.service'
import { documentService } from '../../services/document.service'
import { getErrorMessage } from '../../utils/errorHandler'
import { stripeService } from '../../services/stripe.service'

import logo from '../../assets/logo.svg'
import iconUpload from '../../assets/SVG/2- Regular/upload.svg'

const TOKENS = {
  ink: '#1a1a2e',
  primary: '#5CCBF5',
  primaryStrong: '#45B8E2',
  paper: '#FFFFFF',
  surface: '#F8F9FC',
  border: 'rgba(0, 0, 0, 0.06)',
  borderHover: 'rgba(0, 0, 0, 0.12)',
  textMuted: 'rgba(26, 26, 46, 0.55)',
  radius: { md: 4, lg: 6, xl: 8, full: 50 },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.04)',
    md: '0 2px 8px rgba(0,0,0,0.06)',
    glow: '0 2px 8px rgba(92,203,245,0.12)',
  },
}

const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#fff',
    color: TOKENS.ink,
    borderRadius: TOKENS.radius.md,
    fontWeight: 500,
    '& .MuiOutlinedInput-notchedOutline': { borderColor: TOKENS.border },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: alpha(TOKENS.ink, 0.18),
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: TOKENS.primary,
      borderWidth: 2,
    },
  },
  '& .MuiInputBase-input::placeholder': {
    color: alpha(TOKENS.ink, 0.45),
    opacity: 1,
  },
}

function UploadField({ label, file, onFileChange }: { label: string; file: File | null; onFileChange: (file: File | null) => void }) {
  return (
    <Box>
      <Typography sx={{ mb: 0.8, fontWeight: 650, fontSize: '0.9rem', color: TOKENS.ink }}>
        {label}
      </Typography>
      <Box
        component="label"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 2.5,
          py: 1.8,
          borderRadius: TOKENS.radius.md,
          border: `1.5px dashed ${file ? TOKENS.primary : TOKENS.borderHover}`,
          backgroundColor: file ? alpha(TOKENS.primary, 0.03) : '#fff',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: TOKENS.primary,
            backgroundColor: alpha(TOKENS.primary, 0.02),
          },
        }}
      >
        {file ? (
          <CheckCircleOutlineRoundedIcon sx={{ color: TOKENS.primary, fontSize: 22 }} />
        ) : (
          <img
            src={iconUpload}
            alt="upload"
            style={{
              width: 22,
              height: 22,
              filter: 'invert(84%) sepia(21%) saturate(1450%) hue-rotate(167deg) brightness(98%) contrast(98%)',
              opacity: 0.7,
            }}
          />
        )}
        <Typography sx={{ color: file ? TOKENS.ink : TOKENS.textMuted, fontWeight: file ? 600 : 500, fontSize: '0.92rem' }}>
          {file ? file.name : `Incarca ${label.toLowerCase()}`}
        </Typography>
        <input
          type="file"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onFileChange(f)
          }}
        />
      </Box>
    </Box>
  )
}

type Locality = { nume: string }
type County = { auto: string; nume: string; localitati: Locality[] }

export default function RegisterPfaPage() {
  const [tab, setTab] = useState(0) // 0 = Am PFA, 1 = Nu am PFA
  const navigate = useNavigate()

  // Location data
  const [countiesData, setCountiesData] = useState<County[]>([])

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/virgil-av/judet-oras-localitati-romania/master/judete.json')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.judete) {
          setCountiesData(data.judete)
        }
      })
      .catch((err) => console.error('Failed to load counties:', err))
  }, [])

  // "Am PFA" form state
  const [amPfaName, setAmPfaName] = useState('')
  const [amPfaPhone, setAmPfaPhone] = useState('')

  // "Nu am PFA" form state
  const [buletinFile, setBuletinFile] = useState<File | null>(null)
  const [atestatFile, setAtestatFile] = useState<File | null>(null)
  const [durataContract, setDurataContract] = useState('3')
  const [strada, setStrada] = useState('')
  const [numar, setNumar] = useState('')
  const [oras, setOras] = useState('')
  const [judet, setJudet] = useState('')
  const [suntProprietar, setSuntProprietar] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const availableCities = useMemo(() => {
    if (!judet || countiesData.length === 0) return []
    const selectedCounty = countiesData.find((c) => c.nume === judet)
    return selectedCounty ? selectedCounty.localitati.map((loc) => loc.nume).sort() : []
  }, [judet, countiesData])

  const handleSubmitNuAmPfa = async () => {
    setError(null)
    if (!buletinFile || !strada || !numar || !oras || !judet) {
      setError('Te rugam sa completezi adresa si sa incarci macar buletinul.')
      return
    }

    try {
      setIsLoading(true)

      // 1. Create PFA record
      const pfaId = await pfaService.create({
        registrationType: 'NuAmPfa',
        contractDuration: parseInt(durataContract, 10),
        street: strada,
        number: numar,
        city: oras,
        county: judet,
        isOwner: suntProprietar
      });

      // 2. Upload Documents
      if (buletinFile) {
        await documentService.upload(buletinFile, 'Buletin', pfaId);
      }
      if (atestatFile) {
        await documentService.upload(atestatFile, 'AtestatSofer', pfaId);
      }

      // 3. Redirect to Stripe for Înființare PFA payment (450 lei)
      // After payment, user returns to /inregistrare/abonament
      sessionStorage.setItem('pfa_registered', 'NuAmPfa')
      stripeService.redirectToInfiintarePfa()
    } catch (err: any) {
      console.error(err)
      setError(getErrorMessage(err, 'A aparut o eroare la inregistrare. Te rugam sa incerci din nou.'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitAmPfa = async () => {
    setError(null)
    if (!amPfaName || !amPfaPhone) {
      setError('Te rugam sa completezi toate campurile.')
      return
    }

    setIsLoading(true)
    try {
      await pfaService.create({
        registrationType: 'AmPfa',
        fullName: amPfaName,
        phone: amPfaPhone,
        isOwner: false // default
      });
      // AmPfa users already have PFA — skip the 450 lei payment, go to subscription
      sessionStorage.setItem('pfa_registered', 'AmPfa')
      navigate('/inregistrare/abonament')
    } catch (err: any) {
      setError(getErrorMessage(err, 'A aparut o eroare. Te rugam sa incerci din nou.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: TOKENS.surface,
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Stack sx={{ alignItems: 'center' }} spacing={4}>
          {/* Logo */}
          <Box
            component="img"
            src={logo}
            alt="Ridelance"
            sx={{ height: 50, width: 'auto', cursor: 'pointer' }}
            onClick={() => navigate('/')}
          />

          <Paper
            elevation={0}
            sx={{
              width: '100%',
              p: { xs: 3, sm: 5 },
              borderRadius: TOKENS.radius.xl,
              border: `1px solid ${TOKENS.border}`,
              boxShadow: TOKENS.shadow.md,
              backgroundColor: TOKENS.paper,
            }}
          >
            <Typography
              sx={{ fontWeight: 800, fontSize: '1.3rem', color: TOKENS.ink, mb: 1, textAlign: 'center' }}
            >
              Inregistrare cont
            </Typography>
            <Typography
              sx={{ color: TOKENS.textMuted, fontSize: '0.92rem', mb: 3, textAlign: 'center' }}
            >
              Selecteaza situatia ta actuala pentru a continua
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: TOKENS.radius.md }}>
                {error}
              </Alert>
            )}

            <Tabs
              value={tab}
              onChange={(_, v) => { setTab(v); setError(null); }}
              variant="fullWidth"
              sx={{
                mb: 4,
                backgroundColor: alpha(TOKENS.ink, 0.03),
                borderRadius: TOKENS.radius.md,
                p: 0.5,
                '& .MuiTabs-indicator': {
                  backgroundColor: TOKENS.primary,
                  height: 3,
                  borderRadius: 2,
                },
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: TOKENS.textMuted,
                  '&.Mui-selected': { color: TOKENS.primary },
                },
              }}
            >
              <Tab label="Am PFA" />
              <Tab label="Nu am PFA" />
            </Tabs>

            {tab === 0 ? (
              /* ── AM PFA ── */
              <Stack spacing={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: TOKENS.radius.lg,
                    backgroundColor: alpha(TOKENS.primary, 0.04),
                    border: `1px solid ${alpha(TOKENS.primary, 0.1)}`,
                  }}
                >
                  <Typography sx={{ color: TOKENS.ink, fontWeight: 650, fontSize: '0.95rem', lineHeight: 1.7, textAlign: 'center' }}>
                    Daca ai deja PFA inregistrat, completeaza formularul de mai jos sau contacteaza-ne la:{' '}
                    <Box component="a" href="mailto:contact@ridelance.ro" sx={{ color: TOKENS.primary, fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                      contact@ridelance.ro
                    </Box>
                  </Typography>
                </Paper>

                <Stack spacing={2.5}>
                  <Box>
                    <Typography sx={{ mb: 0.8, fontWeight: 650, fontSize: '0.9rem', color: TOKENS.ink }}>Nume complet</Typography>
                    <TextField fullWidth placeholder="Numele tau" value={amPfaName} onChange={(e) => setAmPfaName(e.target.value)} sx={inputSx} />
                  </Box>
                  <Box>
                    <Typography sx={{ mb: 0.8, fontWeight: 650, fontSize: '0.9rem', color: TOKENS.ink }}>Telefon</Typography>
                    <TextField fullWidth placeholder="07XX XXX XXX" type="tel" value={amPfaPhone} onChange={(e) => setAmPfaPhone(e.target.value)} sx={inputSx} />
                  </Box>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={isLoading}
                    endIcon={<ArrowForwardRoundedIcon />}
                    onClick={handleSubmitAmPfa}
                    sx={{
                      mt: 1,
                      py: 1.4,
                      fontWeight: 700,
                      fontSize: '1rem',
                      borderRadius: TOKENS.radius.full,
                      color: '#fff',
                      backgroundColor: TOKENS.primary,
                      boxShadow: TOKENS.shadow.glow,
                      '&:hover': {
                        backgroundColor: TOKENS.primaryStrong,
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    {isLoading ? 'Se incarca...' : 'Trimite datele'}
                  </Button>
                </Stack>
              </Stack>
            ) : (
              /* ── NU AM PFA ── */
              <Stack spacing={2.5}>
                <UploadField
                  label="Buletin"
                  file={buletinFile}
                  onFileChange={setBuletinFile}
                />

                <UploadField
                  label="Atestat Sofer"
                  file={atestatFile}
                  onFileChange={setAtestatFile}
                />

                <Box>
                  <Typography sx={{ mb: 0.8, fontWeight: 650, fontSize: '0.9rem', color: TOKENS.ink }}>
                    Durata Contract de comodat
                  </Typography>
                  <Select
                    fullWidth
                    value={durataContract}
                    onChange={(e) => setDurataContract(e.target.value)}
                    sx={{
                      backgroundColor: '#fff',
                      borderRadius: TOKENS.radius.md,
                      fontWeight: 500,
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: TOKENS.border },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(TOKENS.ink, 0.18),
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: TOKENS.primary,
                        borderWidth: 2,
                      },
                    }}
                  >
                    <MenuItem value="1">1 an</MenuItem>
                    <MenuItem value="2">2 ani</MenuItem>
                    <MenuItem value="3">
                      3 ani
                      <Box
                        component="span"
                        sx={{
                          ml: 1,
                          px: 1.2,
                          py: 0.2,
                          borderRadius: 50,
                          backgroundColor: alpha(TOKENS.primary, 0.1),
                          color: TOKENS.primary,
                          fontWeight: 700,
                          fontSize: '0.75rem',
                        }}
                      >
                        Recomandat
                      </Box>
                    </MenuItem>
                    <MenuItem value="4">4 ani</MenuItem>
                    <MenuItem value="5">5 ani</MenuItem>
                  </Select>
                </Box>

                <Box>
                  <Typography sx={{ mb: 0.8, fontWeight: 650, fontSize: '0.9rem', color: TOKENS.ink }}>
                    Adresa sediu
                  </Typography>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 1.5 }}>
                      <TextField fullWidth placeholder="Strada" value={strada} onChange={(e) => setStrada(e.target.value)} sx={inputSx} />
                      <TextField fullWidth placeholder="Numar" value={numar} onChange={(e) => setNumar(e.target.value)} sx={inputSx} />
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                      <Select
                        fullWidth
                        displayEmpty
                        value={oras}
                        onChange={(e) => setOras(e.target.value)}
                        disabled={!judet || availableCities.length === 0}
                        MenuProps={{ sx: { '& .MuiPaper-root': { maxHeight: 250 } } }}
                        sx={{
                          backgroundColor: '#fff',
                          borderRadius: TOKENS.radius.md,
                          fontWeight: 500,
                          color: oras ? TOKENS.ink : alpha(TOKENS.ink, 0.45),
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: TOKENS.border },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.ink, 0.18) },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: TOKENS.primary, borderWidth: 2 },
                        }}
                      >
                        <MenuItem value="" disabled>
                          {judet ? 'Oras/Localitate' : 'Selecteaza Judet intai'}
                        </MenuItem>
                        {availableCities.map((city, index) => (
                          <MenuItem key={`${city}-${index}`} value={city}>
                            {city}
                          </MenuItem>
                        ))}
                      </Select>

                      <Select
                        fullWidth
                        displayEmpty
                        value={judet}
                        onChange={(e) => {
                          setJudet(e.target.value)
                          setOras('') // reset city when county changes
                        }}
                        MenuProps={{ sx: { '& .MuiPaper-root': { maxHeight: 250 } } }}
                        sx={{
                          backgroundColor: '#fff',
                          borderRadius: TOKENS.radius.md,
                          fontWeight: 500,
                          color: judet ? TOKENS.ink : alpha(TOKENS.ink, 0.45),
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: TOKENS.border },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.ink, 0.18) },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: TOKENS.primary, borderWidth: 2 },
                        }}
                      >
                        <MenuItem value="" disabled>
                          {countiesData.length === 0 ? 'Se incarca...' : 'Judet'}
                        </MenuItem>
                        {countiesData.map((c) => (
                          <MenuItem key={c.auto} value={c.nume}>
                            {c.nume}
                          </MenuItem>
                        ))}
                      </Select>
                    </Box>
                  </Stack>
                </Box>

                <Box>
                  <Typography sx={{ mb: 0.8, fontWeight: 650, fontSize: '0.9rem', color: TOKENS.ink }}>
                    Proprietar Sediu
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={suntProprietar}
                        onChange={(e) => setSuntProprietar(e.target.checked)}
                        sx={{
                          color: TOKENS.borderHover,
                          '&.Mui-checked': { color: TOKENS.primary },
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ fontWeight: 600, fontSize: '0.92rem', color: TOKENS.ink }}>
                        Sunt proprietar
                      </Typography>
                    }
                  />
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={isLoading}
                  endIcon={<ArrowForwardRoundedIcon />}
                  onClick={handleSubmitNuAmPfa}
                  sx={{
                    mt: 1,
                    py: 1.4,
                    fontWeight: 700,
                    fontSize: '1rem',
                    borderRadius: TOKENS.radius.full,
                    color: '#fff',
                    backgroundColor: TOKENS.primary,
                    boxShadow: TOKENS.shadow.glow,
                    '&:hover': {
                      backgroundColor: TOKENS.primaryStrong,
                      transform: 'translateY(-1px)',
                    },
                    '&.Mui-disabled': {
                      backgroundColor: alpha(TOKENS.primary, 0.6),
                      color: '#fff',
                    }
                  }}
                >
                  {isLoading ? 'Se proceseaza...' : 'Trimite documentele'}
                </Button>
              </Stack>
            )}
          </Paper>

          <Button
            onClick={() => navigate('/auth')}
            sx={{
              textTransform: 'none',
              color: TOKENS.textMuted,
              fontWeight: 600,
              '&:hover': { color: TOKENS.ink, backgroundColor: 'transparent' },
            }}
          >
            ← Inapoi la autentificare
          </Button>
        </Stack>
      </Container>
    </Box>
  )
}

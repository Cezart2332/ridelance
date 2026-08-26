import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded'
import {
  Alert,
  Backdrop,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Drawer,
  Fade,
  FormControlLabel,
  IconButton,
  MenuItem,
  Modal,
  Link as MuiLink,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useState, type ReactNode } from 'react'

import { TOKENS } from '../../constants/tokens'
import { carsService, getCarImageUrl, type Car, type CarLeadIntent } from '../../services/cars.service'
import { isValidRoPhone, normalizePhone } from '../../utils/phone'
import { VDP } from './vdp/vdpLayout'
import { DateField } from '../common/DateField'

/**
 * Formularul de cerere, deschis din pagina de detaliu.
 *
 * Nu se cere și nu se afișează nimic legat de plată — cererea deschide o discuție, nu o tranzacție.
 * Acordul de prelucrare a datelor e obligatoriu și nebifat implicit: fără el, backendul refuză
 * cererea, deci n-are rost trimisă.
 *
 * Pe mobil e bottom sheet, pe desktop fereastră centrată (spec §11). E același conținut: doar
 * ambalajul se schimbă, fiindcă un formular de opt câmpuri centrat pe un ecran de 390px ajunge
 * lipit de marginile lui.
 */

interface RentFormModalProps {
  open: boolean
  onClose: () => void
  car: Car | null
  /** `Waitlist` când mașina nu e disponibilă — aceleași câmpuri, alt titlu și alt buton. */
  intent?: CarLeadIntent
}

const DURATIONS = [
  { value: 1, label: 'O săptămână' },
  { value: 4, label: '4 săptămâni' },
  { value: 12, label: '12 săptămâni' },
]

/** Verdele de confirmare, același cu cel al statusului „Disponibil" din listă. */
const SUCCESS = '#10b981'

const EMPTY_FORM = {
  name: '',
  phone: '',
  email: '',
  city: '',
  interest: 'Închiriere săptămânală',
  startDate: '',
  weeks: 4,
  hasPlatformAccount: '',
  message: '',
}

export default function RentFormModal({ open, onClose, car, intent = 'Request' }: RentFormModalProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)

  const waitlist = intent === 'Waitlist'
  const phoneInvalid = phoneTouched && formData.phone.length > 0 && !isValidRoPhone(formData.phone)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!car) return

    if (!isValidRoPhone(formData.phone)) {
      setPhoneTouched(true)
      setError('Numărul de telefon nu pare valid. Exemplu: 0722 123 456.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await carsService.submitLead(car.id, {
        userName: formData.name,
        userEmail: formData.email,
        userPhone: normalizePhone(formData.phone),
        city: formData.city,
        interestType: formData.interest,
        consentAccepted: consent,
        intent,
        preferredStartDate: formData.startDate || null,
        weeks: formData.weeks,
        hasPlatformAccount:
          formData.hasPlatformAccount === '' ? null : formData.hasPlatformAccount === 'yes',
        message: formData.message || null,
      })
      setSubmitted(true)
    } catch {
      // Datele rămân în formular: cine a completat opt câmpuri nu le retastează pentru o eroare
      // de rețea.
      setError('Nu am putut trimite cererea. Verifică datele și încearcă din nou.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setSubmitted(false)
      setError(null)
      setConsent(false)
      setPhoneTouched(false)
      setFormData(EMPTY_FORM)
    }, 300)
  }

  const cover = car?.images?.[0]

  const content = (
    <>
      {/* Header: ce mașină și la ce preț — altfel nu se vede pentru ce se trimite cererea. */}
      <Box
        sx={{
          p: 2.5,
          borderBottom: `1px solid ${TOKENS.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 48,
            flexShrink: 0,
            borderRadius: `${VDP.radius.image}px`,
            overflow: 'hidden',
            display: 'grid',
            placeItems: 'center',
            bgcolor: TOKENS.surfaceAlt,
          }}
        >
          {cover ? (
            <Box
              component="img"
              src={getCarImageUrl(cover.imageUrl)}
              alt=""
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <DirectionsCarFilledRoundedIcon sx={{ color: TOKENS.textSubtle }} />
          )}
        </Box>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography noWrap sx={{ fontWeight: 800, color: TOKENS.ink }}>
            {car ? `${car.brand} ${car.model} ${car.year}` : 'Alege un vehicul din listă'}
          </Typography>
          {car && (
            <Typography sx={{ fontSize: '0.85rem', color: TOKENS.textSubtle }}>
              {car.pricePerWeek.toLocaleString('ro-RO')} lei / săptămână
            </Typography>
          )}
        </Box>

        <IconButton onClick={handleClose} aria-label="Închide" sx={{ color: TOKENS.textSubtle }}>
          <CloseRoundedIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5} component="div">
              <Typography sx={{ fontWeight: 700, color: TOKENS.ink }} component="p">
                {waitlist ? 'Te anunțăm când se eliberează' : 'Spune-ne cum te găsim'}
              </Typography>

              <TextField
                fullWidth
                label="Nume complet"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} component="div">
                <TextField
                  fullWidth
                  label="Telefon"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  onBlur={() => setPhoneTouched(true)}
                  error={phoneInvalid}
                  helperText={phoneInvalid ? 'Exemplu: 0722 123 456' : ' '}
                />
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  helperText=" "
                />
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} component="div">
                <TextField
                  fullWidth
                  label="Oraș"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
                <DateField
                  fullWidth
                  size="medium"
                  label="De când ai nevoie de mașină"
                  value={formData.startDate}
                  onChange={(startDate) => setFormData({ ...formData, startDate })}
                />
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} component="div">
                <TextField
                  fullWidth
                  select
                  label="Pe ce perioadă"
                  value={formData.weeks}
                  onChange={(e) => setFormData({ ...formData, weeks: Number(e.target.value) })}
                >
                  {DURATIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  fullWidth
                  select
                  label="Tip interes"
                  value={formData.interest}
                  onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                >
                  <MenuItem value="Închiriere săptămânală">Închiriere săptămânală</MenuItem>
                  <MenuItem value="La rămânere">La rămânere</MenuItem>
                </TextField>
              </Stack>

              <TextField
                fullWidth
                select
                label="Ai deja cont pe Uber sau Bolt?"
                value={formData.hasPlatformAccount}
                onChange={(e) => setFormData({ ...formData, hasPlatformAccount: e.target.value })}
              >
                <MenuItem value="yes">Da, lucrez deja pe platforme</MenuItem>
                <MenuItem value="no">Nu, sunt la început</MenuItem>
              </TextField>

              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Mesaj (opțional)"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    required
                  />
                }
                label={
                  <Typography sx={{ fontSize: '0.85rem', color: TOKENS.textMuted }}>
                    Sunt de acord cu prelucrarea datelor pentru a fi contactat, conform{' '}
                    <MuiLink href="/privacy-policy" target="_blank" rel="noopener">
                      politicii de confidențialitate
                    </MuiLink>
                    .
                  </Typography>
                }
              />

              {error && <Alert severity="error">{error}</Alert>}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={submitting || !consent}
                sx={{
                  height: 48,
                  borderRadius: `${VDP.radius.image}px`,
                  fontWeight: 800,
                  fontSize: '1rem',
                  textTransform: 'none',
                  boxShadow: 'none',
                  backgroundColor: TOKENS.primaryStrong,
                  '&:hover': { backgroundColor: TOKENS.primaryStrong, boxShadow: TOKENS.shadow.glow },
                }}
              >
                {submitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : waitlist ? (
                  'Anunță-mă când e liberă'
                ) : (
                  'Trimite cererea'
                )}
              </Button>

              <Typography
                sx={{ fontSize: '0.78rem', color: TOKENS.textSubtle, textAlign: 'center' }}
                component="p"
              >
                Fără plată online. Te contactăm pentru confirmare și programare.
              </Typography>
            </Stack>
          </form>
        ) : (
          // Confirmarea nu se închide singură: e singurul loc unde scrie ce urmează.
          <Stack spacing={3} sx={{ py: 4, alignItems: 'center', textAlign: 'center' }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: alpha(SUCCESS, 0.1),
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <CheckCircleRoundedIcon sx={{ fontSize: 48, color: SUCCESS }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: TOKENS.ink, mb: 1 }}>
                Cererea a fost trimisă
              </Typography>
              <Typography sx={{ color: TOKENS.textMuted }} component="p">
                Te contactăm în maximum 24 de ore lucrătoare pentru detalii și programare.
              </Typography>
            </Box>
            <Button
              onClick={handleClose}
              variant="outlined"
              sx={{
                mt: 2,
                px: 4,
                height: 48,
                borderRadius: `${VDP.radius.image}px`,
                borderColor: TOKENS.borderHover,
                color: TOKENS.ink,
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': { borderColor: TOKENS.ink, bgcolor: alpha(TOKENS.ink, 0.02) },
              }}
            >
              Închide
            </Button>
          </Stack>
        )}
      </Box>
    </>
  )

  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              borderTopLeftRadius: VDP.radius.card,
              borderTopRightRadius: VDP.radius.card,
              pb: 'env(safe-area-inset-bottom)',
            },
          },
        }}
      >
        <SheetHandle />
        {content}
      </Drawer>
    )
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 500,
          sx: { backgroundColor: alpha(TOKENS.ink, 0.4), backdropFilter: 'blur(8px)' },
        },
      }}
    >
      <Fade in={open}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 520,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: TOKENS.paper,
            borderRadius: `${VDP.radius.card}px`,
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            outline: 'none',
          }}
        >
          {content}
        </Box>
      </Fade>
    </Modal>
  )
}

/** Mânerul de bottom sheet: semnalează că foaia se trage în jos. */
function SheetHandle(): ReactNode {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', pt: 1.5, pb: 0.5 }}>
      <Box sx={{ width: 36, height: 4, borderRadius: 2, backgroundColor: TOKENS.borderHover }} />
    </Box>
  )
}

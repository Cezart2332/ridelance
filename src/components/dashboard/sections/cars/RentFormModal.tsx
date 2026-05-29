import { useState } from 'react';
import { 
  Box, 
  Modal, 
  Typography, 
  IconButton, 
  Stack, 
  TextField, 
  Button, 
  MenuItem, 
  Fade, 
  Backdrop,
  CircularProgress
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { alpha } from '@mui/material/styles';
import { DASHBOARD_TOKENS } from '../../dashboardTheme';
import { carsService, type Car } from '../../../../services/cars.service';
import CarPriceDisplay from './CarPriceDisplay';

interface RentFormModalProps {
  open: boolean;
  onClose: () => void;
  car: Car | null;
}

export default function RentFormModal({ open, onClose, car }: RentFormModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    interest: 'Închiriere săptămânală'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!car) return;
    
    setSubmitting(true);
    try {
      await carsService.submitLead(car.id, {
        userName: formData.name,
        userEmail: formData.email,
        userPhone: formData.phone,
        interestType: formData.interest
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting lead:', error);
      alert('Eroare la trimiterea cererii. Te rugăm să încerci din nou.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        city: '',
        interest: 'Închiriere săptămânală'
      });
    }, 300);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 500,
          sx: { backgroundColor: alpha(DASHBOARD_TOKENS.ink, 0.4), backdropFilter: 'blur(8px)' }
        },
      }}
    >
      <Fade in={open}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 500 },
          maxHeight: '90vh',
          bgcolor: DASHBOARD_TOKENS.paper,
          borderRadius: DASHBOARD_TOKENS.radius.xl,
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          p: 0,
          overflow: 'hidden',
          outline: 'none'
        }}>
          {/* Header */}
          <Box sx={{ 
            p: 3, 
            borderBottom: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.06)}`,
            background: `linear-gradient(135deg, ${alpha(DASHBOARD_TOKENS.primary, 0.05)} 0%, transparent 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: DASHBOARD_TOKENS.ink }}>
              Închiriază acum
            </Typography>
            <IconButton onClick={handleClose} sx={{ color: alpha(DASHBOARD_TOKENS.ink, 0.4) }}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>

          <Box sx={{ p: 3, overflowY: 'auto', maxHeight: 'calc(90vh - 80px)' }}>
            {!submitted ? (
              <form onSubmit={handleSubmit}>
                <Stack spacing={2.5} component="div">
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: DASHBOARD_TOKENS.radius.md, 
                    bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.04),
                    border: `1px dashed ${alpha(DASHBOARD_TOKENS.primary, 0.2)}`
                  }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: DASHBOARD_TOKENS.primary, textTransform: 'uppercase', mb: 0.5 }} component="p">
                      Vehicul selectat
                    </Typography>
                    <Typography sx={{ fontWeight: 700, color: DASHBOARD_TOKENS.ink }} component="p">
                      {car ? `${car.brand} ${car.model} (${car.year})` : 'Alege un vehicul din listă'}
                    </Typography>
                    {car?.description && (
                      <Typography sx={{ fontSize: '0.82rem', color: alpha(DASHBOARD_TOKENS.ink, 0.6), mt: 1, lineHeight: 1.4 }} component="p">
                        {car.description}
                      </Typography>
                    )}
                    {car && (
                      <Box sx={{ mt: 1.5 }}>
                        <CarPriceDisplay
                          car={car}
                          primaryColor={DASHBOARD_TOKENS.primary}
                          mutedColor={DASHBOARD_TOKENS.textSubtle}
                          size="compact"
                        />
                      </Box>
                    )}
                  </Box>

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
                    />
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  </Stack>

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

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={submitting}
                    sx={{
                      py: 1.8,
                      borderRadius: DASHBOARD_TOKENS.radius.md,
                      fontWeight: 700,
                      fontSize: '1rem',
                      textTransform: 'none',
                      boxShadow: `0 8px 16px ${alpha(DASHBOARD_TOKENS.primary, 0.25)}`,
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 12px 20px ${alpha(DASHBOARD_TOKENS.primary, 0.35)}`,
                      }
                    }}
                  >
                    {submitting ? <CircularProgress size={24} color="inherit" /> : 'Trimite cererea de închiriere'}
                  </Button>
                </Stack>
              </form>
            ) : (
              <Stack spacing={3} sx={{ py: 4, alignItems: 'center', textAlign: 'center' }}>
                <Box sx={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%', 
                  bgcolor: alpha('#10b981', 0.1), 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mb: 1
                }}>
                  <CheckCircleRoundedIcon sx={{ fontSize: 48, color: '#10b981' }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: DASHBOARD_TOKENS.ink, mb: 1 }}>
                    Cererea a fost trimisă!
                  </Typography>
                  <Typography sx={{ color: DASHBOARD_TOKENS.textSubtle }} component="p">
                    Echipa RIDElance te va contacta în cel mai scurt timp pentru a stabili detaliile contractului.
                  </Typography>
                </Box>
                <Button
                  onClick={handleClose}
                  variant="outlined"
                  sx={{ 
                    mt: 2, 
                    px: 4, 
                    borderRadius: DASHBOARD_TOKENS.radius.md, 
                    borderColor: alpha(DASHBOARD_TOKENS.ink, 0.1),
                    color: DASHBOARD_TOKENS.ink,
                    fontWeight: 600,
                    '&:hover': { borderColor: alpha(DASHBOARD_TOKENS.ink, 0.2), bgcolor: alpha(DASHBOARD_TOKENS.ink, 0.02) }
                  }}
                >
                  Închide fereastra
                </Button>
              </Stack>
            )}
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}

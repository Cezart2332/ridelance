import { Box, Button, Container, Paper, Stack, TextField, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { TOKENS } from '../constants/tokens'
import { SectionHeader } from '../components/common/SectionHeader'
import { pageFrameSx } from '../constants/layout'

const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: TOKENS.surface,
    color: TOKENS.ink,
    borderRadius: TOKENS.radius.md,
    fontWeight: 500,
    transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
    '& .MuiOutlinedInput-notchedOutline': { borderColor: TOKENS.border },
    '&:hover': { backgroundColor: alpha(TOKENS.surface, 0.8) },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: TOKENS.borderHover,
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: TOKENS.primary,
      borderWidth: 2,
    },
  },
  '& .MuiInputBase-input::placeholder': {
    color: alpha(TOKENS.ink, 0.4),
    opacity: 1,
  },
  '& .MuiInputLabel-root': { color: TOKENS.textMuted, fontWeight: 600 },
}

export function ContactPage() {
  return (
    <Box sx={pageFrameSx}>
      <Container maxWidth="sm">
        <Stack spacing={4}>
          <SectionHeader
            title="Contact"
            subtitle="Dacă ai întrebări despre platformă, abonamente, zona fiscală sau o posibilă colaborare, ne poți trimite un mesaj prin formularul de mai jos. Revenim către tine cât mai curând posibil."
          />

          <Paper
            elevation={0}
            sx={{
              backgroundColor: TOKENS.paper,
              border: `1px solid ${TOKENS.border}`,
              boxShadow: TOKENS.shadow.lg,
              p: { xs: 3, md: 5 },
              borderRadius: TOKENS.radius.xl,
              transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
              '&:hover': {
                boxShadow: TOKENS.shadow.xl,
                borderColor: TOKENS.borderHover,
              },
            }}
          >
            <Stack component="form" spacing={3}>
              <TextField
                fullWidth
                size="medium"
                label="Nume complet"
                placeholder="Nume complet"
                sx={inputSx}
              />
              <TextField
                type="email"
                fullWidth
                size="medium"
                label="Adresă de email"
                placeholder="Adresă de email"
                sx={inputSx}
              />
              <TextField
                fullWidth
                multiline
                minRows={5}
                label="Mesajul tău"
                placeholder="Mesajul tău"
                sx={inputSx}
              />
              <Button
                variant="contained"
                size="large"
                sx={{
                  mt: 1,
                  px: 5,
                  py: 1.4,
                  fontSize: '1.05rem',
                  color: '#FFFFFF',
                  backgroundColor: TOKENS.primary,
                  borderRadius: TOKENS.radius.full,
                  fontWeight: 700,
                  boxShadow: TOKENS.shadow.glow,
                  alignSelf: { xs: 'stretch', sm: 'flex-start' },
                  '&:hover': {
                    backgroundColor: TOKENS.primaryStrong,
                    boxShadow: '0 12px 40px rgba(26,100,237,0.3)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Trimite mesajul
              </Button>
            </Stack>
          </Paper>

          {/* Info Emails Section */}
          <Stack spacing={2.5}>
            <Box
              sx={{
                p: 3,
                borderRadius: TOKENS.radius.lg,
                border: `1px solid ${TOKENS.border}`,
                backgroundColor: alpha(TOKENS.primary, 0.03),
                transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
                '&:hover': {
                  borderColor: TOKENS.primary,
                  backgroundColor: alpha(TOKENS.primary, 0.05),
                  transform: 'translateY(-2px)',
                  boxShadow: TOKENS.shadow.sm,
                },
              }}
            >
              <Typography
                component="a"
                href="mailto:contact@ridelance.ro"
                sx={{
                  fontWeight: 800,
                  color: TOKENS.primary,
                  textDecoration: 'none',
                  fontSize: '1.1rem',
                  display: 'block',
                  mb: 0.8,
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                contact@ridelance.ro
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: TOKENS.textMuted,
                  lineHeight: 1.7,
                  fontSize: '0.92rem',
                }}
              >
                Pentru întrebări generale despre platformă, suport, informații
                administrative sau alte solicitări legate de utilizarea
                Ridelance.
              </Typography>
            </Box>

            <Box
              sx={{
                p: 3,
                borderRadius: TOKENS.radius.lg,
                border: `1px solid ${TOKENS.border}`,
                backgroundColor: alpha(TOKENS.primary, 0.03),
                transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
                '&:hover': {
                  borderColor: TOKENS.primary,
                  backgroundColor: alpha(TOKENS.primary, 0.05),
                  transform: 'translateY(-2px)',
                  boxShadow: TOKENS.shadow.sm,
                },
              }}
            >
              <Typography
                component="a"
                href="mailto:sales@ridelance.ro"
                sx={{
                  fontWeight: 800,
                  color: TOKENS.primary,
                  textDecoration: 'none',
                  fontSize: '1.1rem',
                  display: 'block',
                  mb: 0.8,
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                sales@ridelance.ro
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: TOKENS.textMuted,
                  lineHeight: 1.7,
                  fontSize: '0.92rem',
                }}
              >
                Pentru întrebări despre abonamente, oferte, activarea
                serviciilor, colaborări și oportunități comerciale.
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}

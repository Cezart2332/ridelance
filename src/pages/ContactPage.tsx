import { Box, Button, Container, Paper, Stack, TextField, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { TOKENS } from '../constants/tokens'
import { SectionHeader } from '../components/common/SectionHeader'
import { OfficeBookingCalendar, OFFICE_ADDRESS } from '../components/office/OfficeBookingCalendar'
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

const contactEmails = [
  {
    email: 'contact@ridelance.ro',
    text: 'Pentru întrebări generale despre platformă, suport, informații administrative sau alte solicitări legate de utilizarea Ridelance.',
  },
  {
    email: 'sales@ridelance.ro',
    text: 'Pentru întrebări despre abonamente, oferte, activarea serviciilor, colaborări și oportunități comerciale.',
  },
]

function ColumnHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Box>
      <Typography
        component="h2"
        sx={{ fontWeight: 850, fontSize: '1.2rem', color: TOKENS.ink }}
      >
        {title}
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: TOKENS.textMuted, mt: 0.5, lineHeight: 1.6 }}
      >
        {subtitle}
      </Typography>
    </Box>
  )
}

export function ContactPage() {
  return (
    <Box sx={pageFrameSx}>
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <SectionHeader
            title="Contact"
            subtitle="Dacă ai întrebări despre platformă, abonamente, zona fiscală sau o posibilă colaborare, trimite-ne un mesaj sau programează direct o vizită la biroul nostru. Revenim către tine cât mai curând posibil."
          />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: { xs: 4, md: 5 },
              alignItems: 'start',
            }}
          >
            {/* ── Contact form ── */}
            <Stack spacing={2.5}>
              <ColumnHeading
                title="Trimite-ne un mesaj"
                subtitle="Completează formularul și îți răspundem pe email."
              />
              <Paper
                elevation={0}
                sx={{
                  backgroundColor: TOKENS.paper,
                  border: `1px solid ${TOKENS.border}`,
                  boxShadow: TOKENS.shadow.lg,
                  p: { xs: 3, md: 4 },
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
                      boxShadow: 'none',
                      alignSelf: { xs: 'stretch', sm: 'flex-start' },
                      '&:hover': {
                        backgroundColor: TOKENS.primaryStrong,
                        boxShadow: 'none',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    Trimite mesajul
                  </Button>
                </Stack>
              </Paper>
            </Stack>

            {/* ── Office booking calendar ── */}
            <Stack spacing={2.5}>
              <ColumnHeading
                title="Programează o vizită la birou"
                subtitle={`Luni – Vineri, 09:00 – 17:00 · vizite de 30 de minute · ${OFFICE_ADDRESS}.`}
              />
              <OfficeBookingCalendar embedded />
            </Stack>
          </Box>

          {/* ── Info Emails Section ── */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: { xs: 2.5, md: 5 },
            }}
          >
            {contactEmails.map((item) => (
              <Box
                key={item.email}
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
                  href={`mailto:${item.email}`}
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
                  {item.email}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: TOKENS.textMuted,
                    lineHeight: 1.7,
                    fontSize: '0.92rem',
                  }}
                >
                  {item.text}
                </Typography>
              </Box>
            ))}
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}

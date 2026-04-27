import { Box, Container, Paper, Typography } from '@mui/material'
import { TOKENS } from '../constants/tokens'
import { SectionHeader } from '../components/common/SectionHeader'
import { loremLongText } from '../data/constants'
import { pageFrameSx } from '../constants/layout'

export function PrivacyPolicyPage() {
  return (
    <Box sx={pageFrameSx}>
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: TOKENS.radius.xl,
            border: `1px solid ${TOKENS.border}`,
            boxShadow: TOKENS.shadow.md,
            backgroundColor: TOKENS.paper,
          }}
        >
          <SectionHeader title="Privacy Policy" />
          <Typography
            sx={{
              lineHeight: 1.8,
              color: TOKENS.textMuted,
              textAlign: 'center',
              mt: 2,
            }}
          >
            {loremLongText}
          </Typography>
        </Paper>
      </Container>
    </Box>
  )
}

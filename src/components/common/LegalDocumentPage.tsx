import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Container, Paper, Skeleton, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { TOKENS } from '../../constants/tokens'

interface LegalDocumentPageProps {
  title: string
  updatedAt: string
  documentPath: string
  errorMessage: string
}

function isSectionTitle(line: string) {
  return /^\d+(?:\.\d+)?\.\s/.test(line)
}

function isLetteredItem(line: string) {
  return /^[a-z]\)\s/i.test(line)
}

export function LegalDocumentPage({
  title,
  updatedAt,
  documentPath,
  errorMessage,
}: LegalDocumentPageProps) {
  const [documentText, setDocumentText] = useState('')
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetch(documentPath)
      .then((response) => {
        if (!response.ok) throw new Error('Legal document unavailable')
        return response.text()
      })
      .then((text) => {
        if (!cancelled) setDocumentText(text)
      })
      .catch(() => {
        if (!cancelled) setHasError(true)
      })

    return () => {
      cancelled = true
    }
  }, [documentPath])

  const lines = useMemo(
    () =>
      documentText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !/^_+$/.test(line)),
    [documentText],
  )

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 84px)', md: 'calc(100vh - 100px)' },
        py: { xs: 5, md: 8 },
      }}
    >
      <Container maxWidth="lg">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 6 },
            borderRadius: TOKENS.radius.xl,
            border: `1px solid ${TOKENS.border}`,
            boxShadow: TOKENS.shadow.md,
            backgroundColor: TOKENS.paper,
          }}
        >
          <Box
            sx={{
              pb: { xs: 3, md: 4 },
              mb: { xs: 3, md: 4 },
              borderBottom: `1px solid ${TOKENS.border}`,
            }}
          >
            <Typography
              variant="h1"
              sx={{
                color: TOKENS.ink,
                fontSize: { xs: '1.8rem', md: '2.5rem' },
                fontWeight: 850,
                lineHeight: 1.15,
                mb: 1,
              }}
            >
              {title}
            </Typography>
            <Typography sx={{ color: TOKENS.textMuted, fontSize: '1rem', fontWeight: 600 }}>
              Ultima actualizare: {updatedAt}
            </Typography>
          </Box>

          {hasError && (
            <Alert severity="error" sx={{ borderRadius: TOKENS.radius.md }}>
              {errorMessage}
            </Alert>
          )}

          {!documentText && !hasError && (
            <Stack spacing={1.5}>
              {Array.from({ length: 10 }).map((_, index) => (
                <Skeleton
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  variant="text"
                  height={index % 4 === 0 ? 34 : 22}
                  width={index % 4 === 0 ? '55%' : '100%'}
                />
              ))}
            </Stack>
          )}

          {lines.length > 0 && (
            <Box component="article" sx={{ maxWidth: 920, mx: 'auto' }}>
              {lines.map((line, index) => {
                if (index === 0 || /^Ultima actualizare:/i.test(line)) return null

                if (isSectionTitle(line)) {
                  return (
                    <Typography
                      // eslint-disable-next-line react/no-array-index-key
                      key={index}
                      component="h2"
                      sx={{
                        mt: { xs: 4, md: 5 },
                        mb: 1.4,
                        color: TOKENS.ink,
                        fontSize: { xs: '1.15rem', md: '1.35rem' },
                        fontWeight: 800,
                        lineHeight: 1.35,
                      }}
                    >
                      {line}
                    </Typography>
                  )
                }

                return (
                  <Typography
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    component="p"
                    sx={{
                      color: alpha(TOKENS.ink, 0.78),
                      fontSize: { xs: '0.95rem', md: '1rem' },
                      lineHeight: 1.8,
                      mb: 1.1,
                      ml: isLetteredItem(line) ? 2.5 : 0,
                      pl: isLetteredItem(line) ? 0.5 : 0,
                    }}
                  >
                    {line}
                  </Typography>
                )
              })}
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  )
}

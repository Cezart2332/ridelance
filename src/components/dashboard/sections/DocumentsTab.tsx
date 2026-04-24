import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { useState } from 'react'
import { Button, Chip, Paper, Stack, Tooltip, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { personalPfaDocuments, vehicleDocuments } from '../dashboardData'
import { DASHBOARD_TOKENS } from '../dashboardTheme'

function statusSx(status: string) {
  if (status === 'Valid') {
    return {
      borderColor: alpha('#2e7d32', 0.2),
      color: '#2e7d32',
      backgroundColor: alpha('#2e7d32', 0.08),
    }
  }

  if (status === 'In verificare') {
    return {
      borderColor: alpha('#ed6c02', 0.2),
      color: '#b54708',
      backgroundColor: alpha('#ed6c02', 0.1),
    }
  }

  return {
    borderColor: alpha('#d32f2f', 0.2),
    color: '#b71c1c',
    backgroundColor: alpha('#d32f2f', 0.08),
  }
}

export function DocumentsTab() {
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({})

  const handleFileChange = (docTitle: string, file: File | null) => {
    if (!file) {
      return
    }

    setUploadedFiles((prev) => ({
      ...prev,
      [docTitle]: file.name,
    }))
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 16,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: DASHBOARD_TOKENS.radius.lg,
          border: `1px solid ${DASHBOARD_TOKENS.border}`,
          boxShadow: DASHBOARD_TOKENS.shadow.sm,
        }}
      >
        <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, mb: 2 }}>
          Documente personale / PFA
        </Typography>
        <Stack spacing={1.4}>
          {personalPfaDocuments.map((doc) => (
            <Paper
              key={doc.title}
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: DASHBOARD_TOKENS.radius.md,
                border: `1px solid ${DASHBOARD_TOKENS.border}`,
                backgroundColor: DASHBOARD_TOKENS.surface,
              }}
            >
              <Stack
                direction="row"
                sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1.2 }}
              >
                <Tooltip title={doc.tooltip}>
                  <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 700 }}>{doc.title}</Typography>
                </Tooltip>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Chip
                    label={doc.status}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      borderRadius: DASHBOARD_TOKENS.radius.full,
                      ...statusSx(doc.status),
                    }}
                  />
                  <Button
                    component="label"
                    size="small"
                    startIcon={<AddRoundedIcon fontSize="small" />}
                    sx={{
                      minWidth: 'unset',
                      borderRadius: DASHBOARD_TOKENS.radius.full,
                      textTransform: 'none',
                      fontWeight: 700,
                      color: DASHBOARD_TOKENS.primaryStrong,
                      backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.08),
                      '&:hover': {
                        backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.16),
                      },
                    }}
                  >
                    Incarca
                    <input
                      hidden
                      type="file"
                      onChange={(event) =>
                        handleFileChange(doc.title, event.target.files?.[0] ?? null)
                      }
                    />
                  </Button>
                </Stack>
              </Stack>
              {uploadedFiles[doc.title] && (
                <Typography sx={{ mt: 1, color: DASHBOARD_TOKENS.textMuted, fontSize: '0.8rem' }}>
                  Fisier selectat: {uploadedFiles[doc.title]}
                </Typography>
              )}
            </Paper>
          ))}
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: DASHBOARD_TOKENS.radius.lg,
          border: `1px solid ${DASHBOARD_TOKENS.border}`,
          boxShadow: DASHBOARD_TOKENS.shadow.sm,
        }}
      >
        <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, mb: 2 }}>
          Documente vehicul
        </Typography>
        <Stack spacing={1.4}>
          {vehicleDocuments.map((doc) => (
            <Paper
              key={doc.title}
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: DASHBOARD_TOKENS.radius.md,
                border: `1px solid ${DASHBOARD_TOKENS.border}`,
                backgroundColor: DASHBOARD_TOKENS.surface,
              }}
            >
              <Stack spacing={1}>
                <Stack
                  direction="row"
                  sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1.2 }}
                >
                  <Tooltip title={doc.tooltip}>
                    <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 700 }}>{doc.title}</Typography>
                  </Tooltip>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Chip
                      label={doc.status}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        borderRadius: DASHBOARD_TOKENS.radius.full,
                        ...statusSx(doc.status),
                      }}
                    />
                    <Button
                      component="label"
                      size="small"
                      startIcon={<AddRoundedIcon fontSize="small" />}
                      sx={{
                        minWidth: 'unset',
                        borderRadius: DASHBOARD_TOKENS.radius.full,
                        textTransform: 'none',
                        fontWeight: 700,
                        color: DASHBOARD_TOKENS.primaryStrong,
                        backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.08),
                        '&:hover': {
                          backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.16),
                        },
                      }}
                    >
                      Incarca
                      <input
                        hidden
                        type="file"
                        onChange={(event) =>
                          handleFileChange(doc.title, event.target.files?.[0] ?? null)
                        }
                      />
                    </Button>
                  </Stack>
                </Stack>

                {uploadedFiles[doc.title] && (
                  <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.8rem' }}>
                    Fisier selectat: {uploadedFiles[doc.title]}
                  </Typography>
                )}

                {doc.complianceNote && (
                  <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.82rem' }}>
                    {doc.complianceNote}
                  </Typography>
                )}

                {doc.purchaseLink && (
                  <Button
                    component="a"
                    href={doc.purchaseLink}
                    sx={{
                      alignSelf: 'flex-start',
                      px: 0,
                      minWidth: 'unset',
                      textTransform: 'none',
                      color: DASHBOARD_TOKENS.primaryStrong,
                      fontWeight: 700,
                    }}
                  >
                    Solicită detalii
                  </Button>
                )}
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Paper>
    </div>
  )
}

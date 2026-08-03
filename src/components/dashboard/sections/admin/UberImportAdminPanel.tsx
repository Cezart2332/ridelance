import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import LocalTaxiRoundedIcon from '@mui/icons-material/LocalTaxiRounded'

import { DASHBOARD_TOKENS } from '../../dashboardTheme'
import { uberService, type UberDashboardDto } from '../../../../services/uber.service'

interface UberImportAdminPanelProps {
  pfaRegistrationId: string
  clientName: string
}

const MAX_FILES = 3

function formatLei(value: number) {
  return `${value.toLocaleString('ro-RO', { maximumFractionDigits: 0 })} lei`
}

/**
 * Importul raportului Uber în contul unui client. Rapoartele CSV vin pe e-mailul biroului,
 * nu la șofer, așa că încărcarea stă aici, în fișa PFA-ului, nu în profilul clientului.
 * Clientul vede doar rezultatul, pe dashboardul lui.
 */
export function UberImportAdminPanel({ pfaRegistrationId, clientName }: UberImportAdminPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dashboard, setDashboard] = useState<UberDashboardDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadedCount, setUploadedCount] = useState(0)

  useEffect(() => {
    let active = true

    // Perioada „total" arată tot istoricul, nu doar luna curentă: operatorul are nevoie
    // să vadă ce s-a încărcat deja, ca să nu dubleze un raport.
    uberService
      .getImportsForPfa(pfaRegistrationId, 'total')
      .then((data) => {
        if (active) setDashboard(data)
      })
      .catch((cause) => {
        console.error(cause)
        if (active) setLoadError('Nu s-a putut încărca istoricul importurilor Uber.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [pfaRegistrationId])

  const handleUpload = () => {
    if (selectedFiles.length === 0) return
    setUploading(true)
    setUploadError(null)

    uberService
      .importCsvForPfa(pfaRegistrationId, selectedFiles)
      .then(() => {
        setUploadedCount(selectedFiles.length)
        setSelectedFiles([])
        if (inputRef.current) inputRef.current.value = ''
        // Răspunsul acoperă doar luna importată; reîncărcăm tot istoricul.
        return uberService.getImportsForPfa(pfaRegistrationId, 'total').then(setDashboard)
      })
      .catch((cause: { response?: { data?: { detail?: string } } }) => {
        setUploadError(cause?.response?.data?.detail || 'CSV-ul Uber nu a putut fi importat.')
      })
      .finally(() => setUploading(false))
  }

  const imports = dashboard?.imports ?? []
  const stats = dashboard?.stats

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: DASHBOARD_TOKENS.radius.lg,
        border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`,
        boxShadow: DASHBOARD_TOKENS.shadow.sm,
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'flex-start' }, mb: 2 }}
      >
        <Stack direction="row" spacing={1.4} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              flexShrink: 0,
              borderRadius: DASHBOARD_TOKENS.radius.md,
              display: 'grid',
              placeItems: 'center',
              color: DASHBOARD_TOKENS.accent,
              bgcolor: alpha(DASHBOARD_TOKENS.accent, 0.1),
            }}
          >
            <LocalTaxiRoundedIcon />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 850, color: DASHBOARD_TOKENS.ink }}>
              Import raport Uber
            </Typography>
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem' }}>
              CSV-uri de câștiguri, ore și curse pentru {clientName}. Maximum {MAX_FILES} fișiere odată.
            </Typography>
          </Box>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flexShrink: 0 }}>
          <input
            ref={inputRef}
            hidden
            multiple
            accept=".csv,text/csv"
            type="file"
            onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []).slice(0, MAX_FILES))}
          />
          <Button
            variant="outlined"
            startIcon={<CloudUploadRoundedIcon />}
            onClick={() => inputRef.current?.click()}
            sx={{ borderRadius: DASHBOARD_TOKENS.radius.md, fontWeight: 800, textTransform: 'none' }}
          >
            Alege CSV
          </Button>
          <Button
            variant="contained"
            disabled={selectedFiles.length === 0 || uploading}
            onClick={handleUpload}
            sx={{
              borderRadius: DASHBOARD_TOKENS.radius.md,
              fontWeight: 800,
              textTransform: 'none',
              bgcolor: DASHBOARD_TOKENS.primary,
              boxShadow: 'none',
              '&:hover': { bgcolor: DASHBOARD_TOKENS.primaryStrong },
            }}
          >
            {uploading ? 'Se importă…' : `Importă${selectedFiles.length ? ` (${selectedFiles.length})` : ''}`}
          </Button>
        </Stack>
      </Stack>

      {selectedFiles.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1, mb: 2 }}>
          {selectedFiles.map((file) => (
            <Chip key={file.name} label={file.name} size="small" sx={{ fontWeight: 700 }} />
          ))}
        </Stack>
      )}

      {uploadError && <Alert severity="error" sx={{ mb: 2 }}>{uploadError}</Alert>}
      {uploadedCount > 0 && !uploadError && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setUploadedCount(0)}>
          {uploadedCount === 1 ? 'Raportul a fost importat' : `${uploadedCount} rapoarte au fost importate`} și
          venitul lunar al clientului a fost recalculat.
        </Alert>
      )}
      {loadError && <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={22} sx={{ color: DASHBOARD_TOKENS.primary }} />
        </Box>
      ) : (
        <>
          {stats && imports.length > 0 && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
                gap: 1.5,
                mb: 2,
              }}
            >
              {[
                { label: 'Net total', value: formatLei(stats.netEarnings) },
                { label: 'Comision', value: formatLei(stats.commission) },
                { label: 'Curse', value: stats.trips.toLocaleString('ro-RO') },
                { label: 'Ore online', value: `${stats.onlineHours.toLocaleString('ro-RO')} h` },
              ].map((item) => (
                <Box
                  key={item.label}
                  sx={{
                    p: 1.5,
                    borderRadius: DASHBOARD_TOKENS.radius.md,
                    bgcolor: DASHBOARD_TOKENS.surface,
                    border: `1px solid ${DASHBOARD_TOKENS.border}`,
                  }}
                >
                  <Typography sx={{ color: DASHBOARD_TOKENS.textSubtle, fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {item.label}
                  </Typography>
                  <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 850, fontVariantNumeric: 'tabular-nums', mt: 0.3 }}>
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {imports.length > 0 ? (
            <Stack spacing={1}>
              {imports.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr auto', md: 'minmax(180px, 1fr) 90px 110px 120px' },
                    gap: 1.5,
                    alignItems: 'center',
                    p: 1.2,
                    borderRadius: DASHBOARD_TOKENS.radius.md,
                    border: `1px solid ${DASHBOARD_TOKENS.border}`,
                  }}
                >
                  <Typography
                    sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {item.fileName}
                  </Typography>
                  <Chip label={item.fileType} size="small" sx={{ fontWeight: 800, justifySelf: 'start' }} />
                  <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontWeight: 700, display: { xs: 'none', md: 'block' } }}>
                    {item.month}/{item.year}
                  </Typography>
                  <Typography
                    sx={{ color: DASHBOARD_TOKENS.textMuted, fontWeight: 700, textAlign: 'right', display: { xs: 'none', md: 'block' } }}
                  >
                    {new Date(item.importedAtUtc).toLocaleDateString('ro-RO')}
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem' }}>
              Niciun raport Uber importat pentru acest client.
            </Typography>
          )}
        </>
      )}
    </Paper>
  )
}

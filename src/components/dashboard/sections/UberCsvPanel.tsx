import { useRef, useState, type ReactNode } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import LocalTaxiRoundedIcon from '@mui/icons-material/LocalTaxiRounded';
import RouteRoundedIcon from '@mui/icons-material/RouteRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';

import { DASHBOARD_TOKENS } from '../dashboardTheme';
import { uberService, type UberDashboardDto, type UberDashboardPeriod } from '../../../services/uber.service';

interface UberCsvPanelProps {
  dashboard: UberDashboardDto | null;
  period: UberDashboardPeriod;
  loading: boolean;
  error: string | null;
  onImported: (dashboard: UberDashboardDto) => void;
}

function formatLei(value: number) {
  return `${value.toLocaleString('ro-RO', { maximumFractionDigits: 0 })} lei`;
}

function formatNumber(value: number, suffix = '') {
  return `${value.toLocaleString('ro-RO', { maximumFractionDigits: 1 })}${suffix}`;
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.8,
        borderRadius: DASHBOARD_TOKENS.radius.lg,
        border: `1px solid ${DASHBOARD_TOKENS.border}`,
        bgcolor: DASHBOARD_TOKENS.paper,
        minWidth: 0,
      }}
    >
      <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center', mb: 1 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: DASHBOARD_TOKENS.radius.md,
            display: 'grid',
            placeItems: 'center',
            color: DASHBOARD_TOKENS.primaryStrong,
            bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.12),
            '& svg': { fontSize: 18 },
          }}
        >
          {icon}
        </Box>
        <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontWeight: 800, fontSize: '0.78rem' }}>
          {label}
        </Typography>
      </Stack>
      <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 950, fontSize: '1.2rem', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
    </Paper>
  );
}

export function UberCsvPanel({
  dashboard,
  period,
  loading,
  error,
  onImported,
}: UberCsvPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const stats = dashboard?.stats;

  const handleUpload = () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setUploadError(null);

    uberService.importCsv(selectedFiles, dashboard?.year, dashboard?.month)
      .then((data) => {
        setSelectedFiles([]);
        if (inputRef.current) inputRef.current.value = '';
        onImported(data);
      })
      .catch((err) => {
        setUploadError(err?.response?.data?.detail || 'CSV-ul Uber nu a putut fi importat.');
      })
      .finally(() => setUploading(false));
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.8 },
        borderRadius: DASHBOARD_TOKENS.radius.xl,
        border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`,
        bgcolor: DASHBOARD_TOKENS.surfaceAlt,
        boxShadow: DASHBOARD_TOKENS.shadow.sm,
        overflow: 'hidden',
      }}
    >
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' } }}>
          <Box>
            <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 950, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
              Uber
            </Typography>
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem', mt: 0.35 }}>
              CSV-uri de câștiguri, ore și curse pentru perioada {period === 'year' ? 'anuală' : 'lunară'}.
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}>
            <input
              ref={inputRef}
              hidden
              multiple
              accept=".csv,text/csv"
              type="file"
              onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []).slice(0, 3))}
            />
            <Button
              variant="outlined"
              startIcon={<CloudUploadRoundedIcon />}
              onClick={() => inputRef.current?.click()}
              sx={{ borderRadius: DASHBOARD_TOKENS.radius.md, fontWeight: 900, textTransform: 'none' }}
            >
              Alege CSV
            </Button>
            <Button
              variant="contained"
              disabled={selectedFiles.length === 0 || uploading}
              onClick={handleUpload}
              sx={{
                borderRadius: DASHBOARD_TOKENS.radius.md,
                bgcolor: DASHBOARD_TOKENS.primary,
                color: DASHBOARD_TOKENS.ink,
                fontWeight: 900,
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': { bgcolor: DASHBOARD_TOKENS.primaryStrong, boxShadow: 'none' },
              }}
            >
              {uploading ? 'Se importă' : 'Importă'}
            </Button>
          </Stack>
        </Stack>

        {selectedFiles.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            {selectedFiles.map((file) => (
              <Chip key={file.name} label={file.name} size="small" sx={{ maxWidth: '100%' }} />
            ))}
          </Stack>
        )}

        {(error || uploadError) && (
          <Alert severity="error" sx={{ borderRadius: DASHBOARD_TOKENS.radius.md, fontWeight: 700 }}>
            {uploadError || error}
          </Alert>
        )}

        {loading && !stats ? (
          <Box sx={{ height: 120, display: 'grid', placeItems: 'center' }}>
            <CircularProgress size={28} sx={{ color: DASHBOARD_TOKENS.primary }} />
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' }, gap: 1.5 }}>
            <StatCard label="Venit net" value={formatLei(stats?.netEarnings ?? 0)} icon={<LocalTaxiRoundedIcon />} />
            <StatCard label="Cash încasat" value={formatLei(stats?.cashCollected ?? 0)} icon={<CloudUploadRoundedIcon />} />
            <StatCard label="Comision" value={formatLei(stats?.commission ?? 0)} icon={<CloudUploadRoundedIcon />} />
            <StatCard label="Curse" value={formatNumber(stats?.trips ?? 0)} icon={<LocalTaxiRoundedIcon />} />
            <StatCard label="Km" value={formatNumber(stats?.kilometers ?? 0, ' km')} icon={<RouteRoundedIcon />} />
            <StatCard label="Ore online" value={formatNumber(stats?.onlineHours ?? 0, ' h')} icon={<ScheduleRoundedIcon />} />
            <StatCard label="Ore în cursă" value={formatNumber(stats?.rideHours ?? 0, ' h')} icon={<ScheduleRoundedIcon />} />
            <StatCard label="Brut" value={formatLei(stats?.grossEarnings ?? 0)} icon={<CloudUploadRoundedIcon />} />
          </Box>
        )}

        {dashboard?.imports?.length ? (
          <Box sx={{ overflowX: 'auto' }}>
            <Stack spacing={1} sx={{ minWidth: { xs: 560, md: 0 } }}>
              {dashboard.imports.slice(0, 8).map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    p: 1.25,
                    borderRadius: DASHBOARD_TOKENS.radius.md,
                    bgcolor: DASHBOARD_TOKENS.paper,
                    border: `1px solid ${DASHBOARD_TOKENS.border}`,
                    display: 'grid',
                    gridTemplateColumns: 'minmax(180px, 1fr) 90px 110px 120px',
                    gap: 1.5,
                    alignItems: 'center',
                  }}
                >
                  <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.fileName}
                  </Typography>
                  <Chip label={item.fileType} size="small" sx={{ fontWeight: 800 }} />
                  <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontWeight: 700 }}>
                    {item.month}/{item.year}
                  </Typography>
                  <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontWeight: 700, textAlign: 'right' }}>
                    {new Date(item.importedAtUtc).toLocaleDateString('ro-RO')}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        ) : (
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem' }}>
            Nu există importuri Uber pentru perioada selectată.
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}

import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

import { DASHBOARD_TOKENS } from '../dashboardTheme';
import { PageHeader, pillToggleSx } from '../ui';
import {
  boltService,
  type BoltDashboardDto,
  type BoltDashboardPeriod,
} from '../../../services/bolt.service';
import { uberService, type UberDashboardDto, type UberDashboardPeriod } from '../../../services/uber.service';
import { BoltDashboardPanel } from './BoltDashboardPanel';
import { BoltIntegrationTab } from './BoltIntegrationTab';
import { UberCsvPanel } from './UberCsvPanel';

type PlatformTab = 'bolt' | 'uber';
type PlatformPeriod = 'month' | 'year';

export function PlatformsView() {
  const [tab, setTab] = useState<PlatformTab>('bolt');
  const [period, setPeriod] = useState<PlatformPeriod>('month');

  const [boltDashboard, setBoltDashboard] = useState<BoltDashboardDto | null>(null);
  const [boltLoading, setBoltLoading] = useState(true);
  const [boltError, setBoltError] = useState<string | null>(null);
  const [uberDashboard, setUberDashboard] = useState<UberDashboardDto | null>(null);
  const [uberLoading, setUberLoading] = useState(true);
  const [uberError, setUberError] = useState<string | null>(null);
  const [boltModalOpen, setBoltModalOpen] = useState(false);

  const fetchDashboards = (nextPeriod: PlatformPeriod) =>
    Promise.allSettled([
      boltService.getDashboard(nextPeriod),
      uberService.getDashboard(nextPeriod),
    ]).then(([boltResult, uberResult]) => {
      if (boltResult.status === 'fulfilled') setBoltDashboard(boltResult.value);
      else {
        console.error(boltResult.reason);
        setBoltError('Nu s-au putut încărca datele Bolt.');
      }

      if (uberResult.status === 'fulfilled') setUberDashboard(uberResult.value);
      else {
        console.error(uberResult.reason);
        setUberError('Nu s-au putut încărca datele Uber.');
      }
    }).finally(() => {
      setBoltLoading(false);
      setUberLoading(false);
    });

  const loadDashboards = (nextPeriod: PlatformPeriod) => {
    setBoltLoading(true);
    setUberLoading(true);
    setBoltError(null);
    setUberError(null);
    fetchDashboards(nextPeriod);
  };

  useEffect(() => {
    // Loading flags start as true, so no synchronous state updates are needed here.
    fetchDashboards('month');
  }, []);

  const handlePeriodChange = (nextPeriod: PlatformPeriod) => {
    setPeriod(nextPeriod);
    loadDashboards(nextPeriod);
  };

  const refreshBoltDashboard = () => {
    setBoltLoading(true);
    setBoltError(null);

    boltService.getDashboard(period)
      .then(setBoltDashboard)
      .catch((err) => {
        console.error(err);
        setBoltError('Nu s-au putut încărca datele Bolt după conectare.');
      })
      .finally(() => setBoltLoading(false));
  };

  const handleBoltConnected = () => {
    setBoltModalOpen(false);
    refreshBoltDashboard();
  };

  const handleUberImported = (dashboard: UberDashboardDto) => {
    setUberDashboard(dashboard);
  };

  return (
    <>
      <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <PageHeader
          title="Platforme"
          subtitle="Conectare, import CSV și istoricul detaliat pentru Bolt și Uber."
          actions={
            <ToggleButtonGroup
              exclusive
              value={tab}
              onChange={(_: MouseEvent<HTMLElement>, v: PlatformTab | null) => {
                if (v) setTab(v);
              }}
              size="small"
              sx={pillToggleSx}
            >
              <ToggleButton value="bolt">Bolt</ToggleButton>
              <ToggleButton value="uber">Uber</ToggleButton>
            </ToggleButtonGroup>
          }
        />

        {tab === 'bolt' ? (
          <BoltDashboardPanel
            dashboard={boltDashboard}
            loading={boltLoading}
            error={boltError}
            period={period as BoltDashboardPeriod}
            onPeriodChange={(nextPeriod) => {
              if (nextPeriod === 'month' || nextPeriod === 'year') handlePeriodChange(nextPeriod);
            }}
            onOpenBoltIntegration={() => setBoltModalOpen(true)}
          />
        ) : (
          <UberCsvPanel
            dashboard={uberDashboard}
            loading={uberLoading}
            error={uberError}
            period={period as UberDashboardPeriod}
            onImported={handleUberImported}
          />
        )}
      </Stack>

      <Dialog
        open={boltModalOpen}
        onClose={() => setBoltModalOpen(false)}
        fullWidth
        maxWidth="md"
        slotProps={{
          paper: {
            sx: {
              borderRadius: DASHBOARD_TOKENS.radius.xl,
              overflow: 'hidden',
              bgcolor: DASHBOARD_TOKENS.paper,
            },
          },
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 2, sm: 3 },
            py: 2,
            borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 950, fontSize: '1.15rem' }}>
              Conectare Bolt
            </Typography>
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.86rem', mt: 0.35 }}>
              Conectează contul pentru încasări și curse sincronizate automat.
            </Typography>
          </Box>
          <IconButton
            aria-label="Închide"
            onClick={() => setBoltModalOpen(false)}
            sx={{
              flexShrink: 0,
              color: DASHBOARD_TOKENS.textMuted,
              bgcolor: DASHBOARD_TOKENS.surface,
              '&:hover': { bgcolor: alpha(DASHBOARD_TOKENS.ink, 0.06) },
            }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
        <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: DASHBOARD_TOKENS.surface, overflowX: 'hidden' }}>
          <BoltIntegrationTab embedded onConnected={handleBoltConnected} />
        </DialogContent>
      </Dialog>
    </>
  );
}

import { Box, Paper, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { DASHBOARD_TOKENS } from '../dashboardTheme';
import { monthNumberToLabel } from '../../../utils/monthLabels';

interface PfaIncomeSummaryProps {
  venitCash: number;
  venitCard: number;
  venitBolt: number;
  venitUber: number;
  taxeEstimate: number;
  venitTotal: number;
  incomeYear?: number | null;
  incomeMonth?: number | null;
}

function IncomeRow({ label, value }: { label: string; value: number }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography sx={{ fontSize: '0.85rem', color: DASHBOARD_TOKENS.textMuted, fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 800, color: DASHBOARD_TOKENS.ink, fontSize: '0.95rem' }}>
        {value.toLocaleString('ro-RO')} lei
      </Typography>
    </Stack>
  );
}

export function PfaIncomeSummary({
  venitCash,
  venitCard,
  venitBolt,
  venitUber,
  taxeEstimate,
  venitTotal,
  incomeYear,
  incomeMonth,
}: PfaIncomeSummaryProps) {
  const hasAnyIncome =
    venitCash > 0 || venitCard > 0 || venitBolt > 0 || venitUber > 0 || taxeEstimate > 0;

  const periodLabel =
    incomeMonth && incomeYear
      ? `${monthNumberToLabel(incomeMonth)} ${incomeYear}`
      : 'Luna curentă';

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: DASHBOARD_TOKENS.radius.lg,
        border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`,
        boxShadow: DASHBOARD_TOKENS.shadow.sm,
        background: `linear-gradient(160deg, ${alpha(DASHBOARD_TOKENS.primary, 0.06)} 0%, ${DASHBOARD_TOKENS.paper} 40%)`,
      }}
    >
      <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, mb: 0.5 }}>
        Venituri {periodLabel}
      </Typography>
      <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem', mb: 2 }}>
        Date introduse de contabilul tău
      </Typography>

      {!hasAnyIncome ? (
        <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem' }}>
          Nu există încă date de venituri pentru această lună.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          <IncomeRow label="Venit cash" value={venitCash} />
          <IncomeRow label="Venit card" value={venitCard} />
          <IncomeRow label="Venit Bolt" value={venitBolt} />
          <IncomeRow label="Venit Uber" value={venitUber} />
          <IncomeRow label="Taxe estimate" value={taxeEstimate} />
          <Box
            sx={{
              mt: 1,
              pt: 1.5,
              borderTop: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`,
            }}
          >
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 800, color: DASHBOARD_TOKENS.primaryStrong }}>
                Venit total
              </Typography>
              <Typography sx={{ fontWeight: 900, fontSize: '1.35rem', color: DASHBOARD_TOKENS.primaryStrong }}>
                {venitTotal.toLocaleString('ro-RO')} lei
              </Typography>
            </Stack>
          </Box>
        </Stack>
      )}
    </Paper>
  );
}

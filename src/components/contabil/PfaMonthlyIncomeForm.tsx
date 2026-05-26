import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { TOKENS } from '../../constants/tokens';
import { pfaService, type PfaMonthlyIncome } from '../../services/pfa.service';
import {
  ROMANIAN_MONTHS,
  currentMonthYear,
  monthLabelToNumber,
} from '../../utils/monthLabels';

interface PfaMonthlyIncomeFormProps {
  pfaRegistrationId: string;
}

const emptyIncome = (pfaRegistrationId: string, year: number, month: number): PfaMonthlyIncome => ({
  id: null,
  pfaRegistrationId,
  year,
  month,
  venitCash: 0,
  venitCard: 0,
  venitBolt: 0,
  venitUber: 0,
  taxeEstimate: 0,
  venitTotal: 0,
  updatedAtUtc: null,
});

export function PfaMonthlyIncomeForm({ pfaRegistrationId }: PfaMonthlyIncomeFormProps) {
  const initial = currentMonthYear();
  const [selectedYear, setSelectedYear] = useState(initial.year);
  const [selectedMonth, setSelectedMonth] = useState(initial.label);
  const [income, setIncome] = useState<PfaMonthlyIncome>(() =>
    emptyIncome(pfaRegistrationId, initial.year, initial.month)
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const year = selectedYear;
  const month = monthLabelToNumber(selectedMonth);

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return [current - 1, current, current + 1];
  }, []);

  const venitTotal = useMemo(
    () =>
      income.venitCash + income.venitCard + income.venitBolt + income.venitUber,
    [income.venitCash, income.venitCard, income.venitBolt, income.venitUber]
  );

  const loadIncome = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const data = await pfaService.getMonthlyIncome(pfaRegistrationId, year, month);
      setIncome(data);
    } catch {
      setError('Nu s-au putut încărca veniturile.');
      setIncome(emptyIncome(pfaRegistrationId, year, month));
    } finally {
      setLoading(false);
    }
  }, [pfaRegistrationId, year, month]);

  useEffect(() => {
    loadIncome();
  }, [loadIncome]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const data = await pfaService.upsertMonthlyIncome(pfaRegistrationId, {
        year,
        month,
        venitCash: income.venitCash,
        venitCard: income.venitCard,
        venitBolt: income.venitBolt,
        venitUber: income.venitUber,
        taxeEstimate: income.taxeEstimate,
      });
      setIncome(data);
      setSaved(true);
    } catch {
      setError('Salvarea veniturilor a eșuat.');
    } finally {
      setSaving(false);
    }
  };

  const setField = (field: keyof Pick<PfaMonthlyIncome, 'venitCash' | 'venitCard' | 'venitBolt' | 'venitUber' | 'taxeEstimate'>, value: string) => {
    const num = parseFloat(value) || 0;
    setIncome((prev) => ({ ...prev, [field]: num }));
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: alpha(TOKENS.paper, 0.9),
      borderRadius: TOKENS.radius.md,
    },
  };

  const fields: { key: keyof Pick<PfaMonthlyIncome, 'venitCash' | 'venitCard' | 'venitBolt' | 'venitUber' | 'taxeEstimate'>; label: string }[] = [
    { key: 'venitCash', label: 'Venit cash' },
    { key: 'venitCard', label: 'Venit card' },
    { key: 'venitBolt', label: 'Venit Bolt' },
    { key: 'venitUber', label: 'Venit Uber' },
    { key: 'taxeEstimate', label: 'Taxe estimate' },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: TOKENS.radius.xl,
        border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
        boxShadow: TOKENS.shadow.sm,
        background: `linear-gradient(165deg, ${alpha(TOKENS.primary, 0.05)} 0%, ${TOKENS.paper} 35%)`,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Venituri client</Typography>
        <Stack direction="row" spacing={1}>
          <Select
            size="small"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            sx={{ width: 100, borderRadius: TOKENS.radius.md, bgcolor: TOKENS.paper }}
          >
            {yearOptions.map((y) => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </Select>
          <Select
            size="small"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            sx={{ width: 160, borderRadius: TOKENS.radius.md, bgcolor: TOKENS.paper }}
          >
            {ROMANIAN_MONTHS.map((m) => (
              <MenuItem key={m} value={m}>{m}</MenuItem>
            ))}
          </Select>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {saved && <Alert severity="success" sx={{ mb: 2 }}>Veniturile au fost salvate.</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={28} sx={{ color: TOKENS.primary }} />
        </Box>
      ) : (
        <Stack spacing={2}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            {fields.map(({ key, label }) => (
              <TextField
                key={key}
                fullWidth
                type="number"
                label={`${label} (RON)`}
                value={income[key] === 0 ? '' : income[key]}
                onChange={(e) => setField(key, e.target.value)}
                slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
                sx={inputSx}
              />
            ))}
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: TOKENS.radius.md,
              bgcolor: alpha(TOKENS.primary, 0.06),
              border: `1px solid ${alpha(TOKENS.primary, 0.15)}`,
            }}
          >
            <Typography sx={{ fontSize: '0.8rem', color: TOKENS.textMuted, fontWeight: 700, mb: 0.5 }}>
              Venit total (calculat)
            </Typography>
            <Typography sx={{ fontWeight: 900, fontSize: '1.5rem', color: TOKENS.primaryStrong }}>
              {venitTotal.toLocaleString('ro-RO')} lei
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: TOKENS.textSubtle, mt: 0.5 }}>
              Cash + Card + Bolt + Uber
            </Typography>
          </Paper>

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{ alignSelf: 'flex-start', fontWeight: 700, textTransform: 'none', borderRadius: TOKENS.radius.md }}
          >
            {saving ? <CircularProgress size={22} color="inherit" /> : 'Salvează veniturile'}
          </Button>
        </Stack>
      )}
    </Paper>
  );
}

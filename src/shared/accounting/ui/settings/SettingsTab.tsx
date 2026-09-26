import { useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import { accountingApi } from '../../api/accountingApi'
import { PLATFORMS, type Platform, type SettingHistoryEntry, type SettingKey, type SettingsChange, type VehicleDeductibility } from '../../api/types'
import { formatDate, formatDateTime, formatValidity } from '../../format'
import { CASH_REGISTER_STATUS, PLATFORM_LABEL } from '../../statusLabels'
import { AccountingBadge, ErrorBlock, Fact, LoadingBlock, ReasonDialog } from '../components'
import { useNotify } from '../notify'
import type { DossierTabProps } from '../pfa/PfaDossierView'
import { useApi } from '../useApi'
import { CashSection } from './CashSection'

const SETTING_LABEL: Record<SettingKey, string> = {
  art317: 'Cod TVA art. 317',
  platforms: 'Platforme',
  vehicle_deductibility: 'Deductibilitate cheltuieli auto',
}

const DEDUCTIBILITY_LABEL: Record<VehicleDeductibility, string> = { '50_PERCENT': '50%', '100_PERCENT': '100%' }

function settingValueLabel(entry: SettingHistoryEntry): string {
  switch (entry.key) {
    case 'art317':
      return entry.value ? 'Da' : 'Nu'
    case 'platforms':
      return (entry.value as Platform[]).map((platform) => PLATFORM_LABEL[platform]).join(', ')
    case 'vehicle_deductibility':
      return DEDUCTIBILITY_LABEL[entry.value as VehicleDeductibility]
  }
}

const todayIso = () => new Date().toISOString().slice(0, 10)

/** Timeline-ul unei setări: fiecare valoare cu intervalul ei, cea curentă ultima. */
function Timeline({ entries }: { entries: SettingHistoryEntry[] }) {
  return (
    <Stack spacing={1} sx={{ borderLeft: 2, borderColor: 'divider', pl: 2 }}>
      {entries.map((entry) => (
        <Box key={entry.id}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {formatValidity(entry.validFrom, entry.validTo)}: {settingValueLabel(entry)}
          </Typography>
          <Typography variant="caption" color="text.secondary" component="div">
            {entry.note}
          </Typography>
          <Typography variant="caption" color="text.secondary" component="div">
            {entry.changedBy.name} · {formatDateTime(entry.changedAt)}
          </Typography>
        </Box>
      ))}
    </Stack>
  )
}

/**
 * F5: setările contabile ale PFA-ului. Fiecare modificare adaugă o intrare cu „Valabil de la” și
 * observație; istoricul nu se suprascrie.
 */
export function SettingsTab({ summary, onSummaryChanged }: DossierTabProps) {
  const notify = useNotify()
  const settings = useApi(() => accountingApi.pfas.getSettings(summary.id), [summary.id])
  const [editing, setEditing] = useState<SettingKey | null>(null)
  const [validFrom, setValidFrom] = useState(todayIso())
  const [art317, setArt317] = useState(true)
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [deductibility, setDeductibility] = useState<VehicleDeductibility>('50_PERCENT')

  if (settings.error && !settings.data) return <ErrorBlock message={settings.error} onRetry={settings.reload} />
  if (!settings.data) return <LoadingBlock />
  const data = settings.data
  const readOnly = summary.readOnly
  const historyOf = (key: SettingKey) => data.history.filter((entry) => entry.key === key)

  const open = (key: SettingKey) => {
    setValidFrom(todayIso())
    setArt317(data.art317.enabled)
    setPlatforms(data.platforms)
    setDeductibility(data.vehicleDeductibility)
    setEditing(key)
  }

  const change = (note: string): SettingsChange => {
    switch (editing) {
      case 'art317':
        return { field: 'art317', value: art317, validFrom, note }
      case 'platforms':
        return { field: 'platforms', value: platforms, validFrom, note }
      default:
        return { field: 'vehicle_deductibility', value: deductibility, validFrom, note }
    }
  }

  const section = (key: SettingKey, current: string) => (
    <Stack spacing={1.5}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Fact label={SETTING_LABEL[key]}>{current}</Fact>
        {!readOnly && (
          <Button size="small" variant="outlined" onClick={() => open(key)}>
            Modifică
          </Button>
        )}
      </Stack>
      <Timeline entries={historyOf(key)} />
    </Stack>
  )

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={2.5}>
          <Typography variant="h2">Setări contabilitate</Typography>
          <Stack direction="row" sx={{ gap: 4, flexWrap: 'wrap' }}>
            <Fact label="Sistem real">{data.realSystem ? 'Da' : 'Nu'}</Fact>
            <Fact label="TVA normal">{data.vatPayer ? 'Da' : 'Nu'}</Fact>
            <Fact label="Cash">
              <AccountingBadge descriptor={CASH_REGISTER_STATUS[data.cash.status]} />
            </Fact>
          </Stack>
          <Divider />
          {section('art317', data.art317.enabled ? `Da, din ${formatDate(data.art317.activationDate)}` : 'Nu')}
          <Divider />
          {section('platforms', data.platforms.map((platform) => PLATFORM_LABEL[platform]).join(', ') || '—')}
          <Divider />
          {section('vehicle_deductibility', DEDUCTIBILITY_LABEL[data.vehicleDeductibility])}
        </Stack>
      </Paper>

      <CashSection
        summary={summary}
        cash={data.cash}
        onChanged={() => {
          settings.reload()
          onSummaryChanged()
        }}
      />

      <ReasonDialog
        open={editing !== null}
        title={editing ? `Modifică: ${SETTING_LABEL[editing]}` : ''}
        description="Valoarea nouă se adaugă în istoric de la data aleasă; cea veche rămâne valabilă până în ziua dinainte."
        reasonLabel="Observație / justificare"
        canSubmit={Boolean(validFrom) && (editing !== 'platforms' || platforms.length > 0)}
        onClose={() => setEditing(null)}
        onSubmit={async (note) => {
          await accountingApi.pfas.updateSettings(summary.id, change(note))
          notify('Setarea a fost adăugată în istoric.', 'success')
          settings.reload()
          onSummaryChanged()
        }}
      >
        {editing === 'art317' && (
          <TextField select label="Cod TVA art. 317" value={art317 ? 'da' : 'nu'} onChange={(event) => setArt317(event.target.value === 'da')}>
            <MenuItem value="da">Da</MenuItem>
            <MenuItem value="nu">Nu</MenuItem>
          </TextField>
        )}
        {editing === 'platforms' && (
          <FormGroup row>
            {PLATFORMS.map((platform) => (
              <FormControlLabel
                key={platform}
                label={PLATFORM_LABEL[platform]}
                control={
                  <Checkbox
                    checked={platforms.includes(platform)}
                    onChange={(event) =>
                      setPlatforms((current) => (event.target.checked ? [...current, platform] : current.filter((item) => item !== platform)))
                    }
                  />
                }
              />
            ))}
          </FormGroup>
        )}
        {editing === 'vehicle_deductibility' && (
          <TextField
            select
            label="Deductibilitate cheltuieli auto"
            value={deductibility}
            onChange={(event) => setDeductibility(event.target.value as VehicleDeductibility)}
          >
            <MenuItem value="50_PERCENT">50%</MenuItem>
            <MenuItem value="100_PERCENT">100%</MenuItem>
          </TextField>
        )}
        <TextField
          type="date"
          label="Valabil de la"
          value={validFrom}
          onChange={(event) => setValidFrom(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </ReasonDialog>
    </Stack>
  )
}

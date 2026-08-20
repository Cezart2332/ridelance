import { useState } from 'react'
import { Alert, Box, Button, Skeleton, Stack, Switch, TextField, Typography } from '@mui/material'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'

import { NotificationPreferencesPanel } from '../../sections/profile/NotificationPreferencesPanel'
import { PrivacyPanel } from '../../sections/profile/PrivacyPanel'
import { SecurityPanel } from '../../sections/profile/SecurityPanel'
import { DASHBOARD_TOKENS, dashboardInputSx } from '../../dashboardTheme'
import { PageHeader, Panel, StatusChip } from '../../ui'
import { companyProfileMock } from '../mocks/srl.mock'
import { usePendingBackend } from '../pendingBackendContext'
import type { CompanyProfile, PublicVisibility } from '../types'
import { useSrlMock } from '../useSrlMock'
import { CompanyLogoPanel } from './CompanyLogoPanel'

/**
 * Profilul SRL (spec §3.1).
 *
 * Reia din Profilul PFA exact ce e despre cont și nu despre entitate — securitate, preferințe de
 * notificări, confidențialitate — și înlocuiește blocul de identitate. Acolo diferența e totală:
 * PFA-ul arată certificatul și CUI-ul persoanei, firma are denumire juridică, Reg. Com.,
 * reprezentant legal și sediu.
 *
 * Datele de identitate trăiesc aici, nu în Setări: §3.1 cere ca Setările să rămână doar
 * preferințe operaționale, ca să nu existe două locuri de unde se editează același CUI.
 */

/** Doar cheile cu valoare text — restul profilului (vizibilitate, flag-uri) nu e câmp de formular. */
type TextField_ = {
  [K in keyof CompanyProfile]: CompanyProfile[K] extends string ? K : never
}[keyof CompanyProfile]

const IDENTITY_FIELDS: { key: TextField_; label: string }[] = [
  { key: 'legalName', label: 'Denumire' },
  { key: 'cui', label: 'CUI' },
  { key: 'regCom', label: 'Nr. Reg. Com.' },
  { key: 'legalRepresentative', label: 'Reprezentant legal' },
  { key: 'registeredOffice', label: 'Sediu social' },
  { key: 'phone', label: 'Telefon' },
  { key: 'email', label: 'Email' },
  { key: 'website', label: 'Website' },
]

const VISIBILITY_ROWS: { key: keyof PublicVisibility; label: string; hint: string }[] = [
  { key: 'phone', label: 'Afișează telefonul', hint: 'Apare pe mini-site și pe anunțurile mașinilor.' },
  { key: 'email', label: 'Afișează emailul', hint: 'Pentru cererile scrise.' },
  { key: 'whatsapp', label: 'Buton WhatsApp', hint: 'Deschide conversația direct pe numărul de mai sus.' },
  { key: 'location', label: 'Afișează locația', hint: 'Pinul de preluare de pe hartă.' },
]

export function SrlProfilePage() {
  const notifyPending = usePendingBackend()
  const { data, loading, error } = useSrlMock(companyProfileMock)
  const [draft, setDraft] = useState<CompanyProfile | null>(null)

  const profile = draft ?? data

  if (loading) {
    return (
      <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Skeleton variant="rounded" height={72} />
        <Skeleton variant="rounded" height={280} />
        <Skeleton variant="rounded" height={320} />
      </Stack>
    )
  }

  if (error || !profile) {
    return (
      <Box sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}>
          {error ?? 'Nu am putut încărca profilul firmei.'}
        </Alert>
      </Box>
    )
  }

  const update = <K extends keyof CompanyProfile>(key: K, value: CompanyProfile[K]) => {
    setDraft({ ...profile, [key]: value })
  }

  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <PageHeader
        title="Profil firmă"
        subtitle="Datele de identitate ale societății și ce anume din ele e public."
        actions={
          profile.isVerified ? (
            <StatusChip
              label="Flotă verificată"
              tone="active"
              outlined
              icon={<VerifiedRoundedIcon sx={{ fontSize: 16 }} />}
            />
          ) : (
            <StatusChip label="Neverificată" tone="neutral" outlined />
          )
        }
      />

      <CompanyLogoPanel
        companyName={profile.legalName}
        logoUrl={profile.logoUrl}
        verified={profile.isVerified}
        onLogoChange={(url) => update('logoUrl', url)}
      />

      <Panel
        title="Date societate"
        subtitle="Intră automat în contracte, procese verbale și facturi."
        action={
          <Button
            variant="contained"
            disableElevation
            onClick={() => notifyPending('Salvarea datelor firmei')}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
          >
            Salvează
          </Button>
        }
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 2,
          }}
        >
          {IDENTITY_FIELDS.map((field) => (
            <TextField
              key={field.key}
              label={field.label}
              value={profile[field.key]}
              onChange={(event) => update(field.key, event.target.value)}
              fullWidth
              size="small"
              sx={dashboardInputSx}
            />
          ))}
          <TextField
            label="Descriere publică"
            value={profile.publicDescription}
            onChange={(event) => update('publicDescription', event.target.value)}
            fullWidth
            multiline
            minRows={3}
            size="small"
            sx={{ ...dashboardInputSx, gridColumn: { xs: 'auto', md: '1 / -1' } }}
            helperText="Textul de pe mini-site și de pe anunțurile mașinilor."
          />
        </Box>
      </Panel>

      <Panel
        title="Vizibilitate publică"
        subtitle="Controlezi exact ce date de contact apar pe mini-site și pe anunțuri."
      >
        <Stack divider={<Box sx={{ height: '1px', bgcolor: DASHBOARD_TOKENS.border }} />}>
          {VISIBILITY_ROWS.map((row) => (
            <Stack
              key={row.key}
              direction="row"
              spacing={2}
              sx={{ alignItems: 'center', justifyContent: 'space-between', py: 1.4 }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: DASHBOARD_TOKENS.ink }}>
                  {row.label}
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: DASHBOARD_TOKENS.textMuted, mt: 0.2 }}>
                  {row.hint}
                </Typography>
              </Box>
              <Switch
                checked={profile.visibility[row.key]}
                onChange={(event) =>
                  update('visibility', { ...profile.visibility, [row.key]: event.target.checked })
                }
                slotProps={{ input: { "aria-label": row.label } }}
              />
            </Stack>
          ))}
        </Stack>
      </Panel>

      <SecurityPanel />
      <NotificationPreferencesPanel />
      {/* Confidențialitatea stă la final, ca în Profilul PFA. */}
      <PrivacyPanel />
    </Stack>
  )
}

import { useState } from 'react'
import { Alert, Box, Button, InputAdornment, Skeleton, Stack, Switch, TextField, Typography } from '@mui/material'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'

import { NotificationPreferencesPanel } from '../../sections/profile/NotificationPreferencesPanel'
import { PrivacyPanel } from '../../sections/profile/PrivacyPanel'
import { SecurityPanel } from '../../sections/profile/SecurityPanel'
import { PhoneVerificationPanel } from '../../sections/profile/PhoneVerificationPanel'
import { DASHBOARD_TOKENS, dashboardInputSx } from '../../dashboardTheme'
import { PageHeader, Panel, StatusChip } from '../../ui'
import { companyService, type CompanyProfile, type PublicVisibility } from '../../../../services/company.service'
import { useCompanyProfile } from '../useCompanyProfile'
import { CompanyLogoPanel } from './CompanyLogoPanel'
import { CompanySignaturePanel } from './CompanySignaturePanel'

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

/**
 * Doar cheile cu valoare text — restul profilului (vizibilitate, flag-uri) nu e câmp de formular.
 * `string | null` fiindcă serverul întoarce `null` pentru ce nu s-a completat încă.
 */
type TextField_ = {
  [K in keyof CompanyProfile]: CompanyProfile[K] extends string | null ? K : never
}[keyof CompanyProfile]

const IDENTITY_FIELDS: { key: TextField_; label: string }[] = [
  { key: 'legalName', label: 'Denumire' },
  { key: 'cui', label: 'CUI' },
  { key: 'regCom', label: 'Nr. Reg. Com.' },
  { key: 'legalRepresentative', label: 'Reprezentant legal' },
  { key: 'registeredOffice', label: 'Sediu social' },
  { key: 'iban', label: 'IBAN' },
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

/** Profilul gol al unui cont care încă nu a salvat nimic. */
const EMPTY_PROFILE: CompanyProfile = {
  id: '',
  ownerType: 'Srl',
  legalName: '',
  cui: null,
  regCom: null,
  legalRepresentative: null,
  registeredOffice: null,
  iban: null,
  phone: null,
  email: null,
  website: null,
  publicDescription: null,
  logoUrl: null,
  signatureDocumentId: null,
  slug: '',
  isVerified: false,
  visibility: { phone: true, email: true, whatsapp: true, location: true },
}

export function SrlProfilePage() {
  const { data, loading, error, setProfile } = useCompanyProfile()
  const [draft, setDraft] = useState<CompanyProfile | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)
  const [lookupNote, setLookupNote] = useState<string | null>(null)

  // Un cont nou nu are încă profil (204). Atunci se editează unul gol, nu se afișează eroare.
  const profile = draft ?? data ?? (loading ? null : EMPTY_PROFILE)

  if (loading) {
    return (
      <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Skeleton variant="rounded" height={72} />
        <Skeleton variant="rounded" height={280} />
        <Skeleton variant="rounded" height={320} />
      </Stack>
    )
  }

  if (error && !profile) {
    return (
      <Box sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}>
          {error}
        </Alert>
      </Box>
    )
  }

  if (!profile) {
    return null
  }

  const update = <K extends keyof CompanyProfile>(key: K, value: CompanyProfile[K]) => {
    setSaved(false)
    setDraft({ ...profile, [key]: value })
  }

  /**
   * Umple denumirea, numărul de la Registrul Comerțului și sediul din registrul ANAF.
   *
   * Nu suprascrie orbește: câmpurile deja completate rămân cum le-a scris omul. Registrul e o
   * sursă bună pentru ce lipsește, dar nu are dreptate peste cineva care tocmai a corectat ceva.
   */
  const fillFromAnaf = async (current: CompanyProfile) => {
    const cui = (current.cui ?? '').trim()
    if (!cui) return

    setLookingUp(true)
    setLookupNote(null)
    try {
      const found = await companyService.lookupByCui(cui)
      if (!found) {
        setLookupNote('Registrul ANAF nu are acest CUI. Verifică cifrele.')
        return
      }

      const address = [found.address, found.city, found.county].filter(Boolean).join(', ')
      setSaved(false)
      setDraft({
        ...current,
        legalName: current.legalName || found.name,
        regCom: current.regCom ?? found.registrationNumber,
        registeredOffice: current.registeredOffice ?? (address || null),
      })
      setLookupNote(`Preluat din ANAF: ${found.name}`)
    } catch {
      setLookupNote('Registrul ANAF nu răspunde acum. Completează manual sau încearcă mai târziu.')
    } finally {
      setLookingUp(false)
    }
  }

  const save = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const updated = await companyService.saveProfile({
        legalName: profile.legalName,
        cui: profile.cui,
        regCom: profile.regCom,
        legalRepresentative: profile.legalRepresentative,
        registeredOffice: profile.registeredOffice,
        iban: profile.iban,
        phone: profile.phone,
        email: profile.email,
        website: profile.website,
        publicDescription: profile.publicDescription,
        showPhone: profile.visibility.phone,
        showEmail: profile.visibility.email,
        showWhatsApp: profile.visibility.whatsapp,
        showLocation: profile.visibility.location,
      })
      // Serverul întoarce profilul salvat, inclusiv slug-ul generat la prima salvare.
      setProfile(updated)
      setDraft(null)
      setSaved(true)
    } catch {
      setSaveError('Nu am putut salva datele firmei. Încearcă din nou.')
    } finally {
      setSaving(false)
    }
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

      {saveError && (
        <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}>
          {saveError}
        </Alert>
      )}
      {saved && (
        <Alert severity="success" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}>
          Datele firmei au fost salvate.
        </Alert>
      )}

      <CompanyLogoPanel
        companyName={profile.legalName || 'Firma ta'}
        logoUrl={profile.logoUrl}
        verified={profile.isVerified}
        hasProfile={profile.id !== ''}
        onLogoChange={(url) => setProfile({ ...profile, logoUrl: url })}
      />

      <CompanySignaturePanel
        signatureDocumentId={profile.signatureDocumentId}
        hasProfile={profile.id !== ''}
        onSignatureChange={(id) => setProfile({ ...profile, signatureDocumentId: id })}
      />

      <Panel
        title="Date societate"
        subtitle="Intră automat în contracte, procese verbale și facturi."
        action={
          <Button
            variant="contained"
            disableElevation
            disabled={saving || draft === null}
            onClick={() => void save()}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
          >
            {saving ? 'Se salvează…' : 'Salvează'}
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
              value={profile[field.key] ?? ''}
              // Câmpul golit se trimite ca `null`, nu ca șir gol: „necompletat" și „completat cu
              // nimic" ar ajunge altfel două stări diferite în baza de date.
              onChange={(event) => update(field.key, event.target.value || null)}
              fullWidth
              size="small"
              sx={dashboardInputSx}
              helperText={field.key === 'cui' ? lookupNote ?? ' ' : undefined}
              slotProps={
                field.key === 'cui'
                  ? {
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <Button
                              size="small"
                              onClick={() => void fillFromAnaf(profile)}
                              disabled={lookingUp || !(profile.cui ?? '').trim()}
                              sx={{
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                minWidth: 0,
                                px: 1,
                              }}
                            >
                              {lookingUp ? 'Caut…' : 'Din ANAF'}
                            </Button>
                          </InputAdornment>
                        ),
                      },
                    }
                  : undefined
              }
            />
          ))}
          <TextField
            label="Descriere publică"
            value={profile.publicDescription ?? ''}
            onChange={(event) => update('publicDescription', event.target.value || null)}
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
      <PhoneVerificationPanel />
      <NotificationPreferencesPanel />
      {/* Confidențialitatea stă la final, ca în Profilul PFA. */}
      <PrivacyPanel />
    </Stack>
  )
}

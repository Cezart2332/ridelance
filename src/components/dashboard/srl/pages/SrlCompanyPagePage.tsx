import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'

import { SRL_PATHS } from '../../../../config/srlNavigation'
import {
  companyService,
  EMPTY_PICKUP,
  type CompanyPageContent,
  type CompanyPageTheme,
  type CompanyProfile,
  type PickupLocation,
  type PublicCompany,
} from '../../../../services/company.service'
import { CompanySite } from '../../../company/CompanySite'
import {
  contrastRatio,
  isHex,
  normalizeContent,
  normalizeTheme,
  THEME_PRESETS,
} from '../../../company/companyTheme'
import { BLOCKABLE_SECTIONS, withoutBlockedSections } from '../../../company/sections'
import { DASHBOARD_TOKENS, dashboardInputSx } from '../../dashboardTheme'
import { PageHeader, Panel, StatusChip } from '../../ui'
import { useCompanyProfile } from '../useCompanyProfile'
import { AiDescriptionDialog } from './companyPage/AiDescriptionDialog'
import { ColorField } from './companyPage/ColorField'
import { CompanyCoverPanel } from './companyPage/CompanyCoverPanel'
import { PageLocationPanel } from './companyPage/PageLocationPanel'
import { PageModerationBanner } from './companyPage/PageModerationBanner'
import { PageSectionsPanel } from './companyPage/PageSectionsPanel'

/**
 * Pagina firmei — editorul mini-site-ului public.
 *
 * Era o pagină de citit: linkul, un buton de copiat, un antet de previzualizare. Tot ce se putea
 * personaliza se edita în Profil, adică în alt ecran decât cel unde se vedea rezultatul.
 *
 * Acum se editează aici, cu previzualizarea alături — și previzualizarea e chiar
 * <c>CompanySite</c>, componenta pe care o vede vizitatorul. Ce se vede în panou e literalmente
 * pagina, nu o aproximare a ei.
 *
 * Identitatea juridică rămâne în Profil, iar comutatoarele de vizibilitate a contactelor tot
 * acolo: sunt despre ce date are voie lumea să vadă, nu despre cum arată pagina.
 */

type TabId = 'identitate' | 'aspect' | 'sectiuni' | 'locatie'

const TABS: { id: TabId; label: string }[] = [
  { id: 'identitate', label: 'Text' },
  { id: 'aspect', label: 'Aspect' },
  { id: 'sectiuni', label: 'Secțiuni' },
  { id: 'locatie', label: 'Locație' },
]

/** Sub raportul ăsta, textul devine greu de citit (pragul AA din WCAG pentru text normal). */
const MIN_CONTRAST = 4.5

/** Peste pragul ăsta încape și formularul, și previzualizarea, una lângă alta. */
const SPLIT_ROW = 1400

interface Draft {
  tagline: string
  publicDescription: string
  theme: CompanyPageTheme
  content: CompanyPageContent
  pickup: PickupLocation
}

export function SrlCompanyPagePage() {
  const { data: profile, loading, error, setProfile } = useCompanyProfile()

  if (loading) {
    return (
      <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Skeleton variant="rounded" height={72} />
        <Skeleton variant="rounded" height={420} />
      </Stack>
    )
  }

  if (error) {
    return (
      <Box sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}>
          {error}
        </Alert>
      </Box>
    )
  }

  // Fără profil salvat nu există slug, deci nici pagină publică de personalizat.
  if (!profile) {
    return (
      <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <PageHeader title="Pagina firmei" subtitle="Mini-site-ul public al firmei tale." />
        <Panel>
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, mb: 2 }}>
            Pagina publică apare după ce completezi datele firmei. Adresa ei se generează atunci și
            rămâne aceeași chiar dacă schimbi denumirea.
          </Typography>
          <Button
            component={RouterLink}
            to={SRL_PATHS.profile}
            variant="contained"
            disableElevation
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
          >
            Completează profilul
          </Button>
        </Panel>
      </Stack>
    )
  }

  // Cheia forțează remontarea când se schimbă profilul din altă parte (upload de logo, de pildă),
  // ca editorul să pornească de la starea salvată, fără efect de sincronizare.
  return <CompanyPageEditor key={profile.id} profile={profile} onProfileChange={setProfile} />
}

function CompanyPageEditor({
  profile,
  onProfileChange,
}: {
  profile: CompanyProfile
  onProfileChange: (profile: CompanyProfile) => void
}) {
  const [tab, setTab] = useState<TabId>('identitate')
  const [draft, setDraft] = useState<Draft>(() => ({
    tagline: profile.tagline ?? '',
    publicDescription: profile.publicDescription ?? '',
    theme: normalizeTheme(profile.pageTheme),
    content: normalizeContent(profile.pageContent),
    pickup: profile.pickup ?? EMPTY_PICKUP,
  }))
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)

  const splitLayout = useMediaQuery(`(min-width:${SPLIT_ROW}px)`)

  // Adresa scurtă, cea care se dă mai departe. `/f/{slug}` rămâne valabilă pentru linkurile vechi.
  const path = `/${profile.slug}`
  const publicUrl = `${window.location.origin}${path}`

  const update = (partial: Partial<Draft>) => {
    setDraft((previous) => ({ ...previous, ...partial }))
    setDirty(true)
    setSaved(false)
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      // Clipboard-ul e blocat în unele contexte; linkul rămâne vizibil și selectabil oricum.
      setCopied(false)
    }
  }

  const save = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const updated = await companyService.savePage({
        tagline: draft.tagline.trim() || null,
        publicDescription: draft.publicDescription.trim() || null,
        theme: draft.theme,
        content: draft.content,
        pickup: draft.pickup,
      })
      onProfileChange(updated)
      setDirty(false)
      setSaved(true)
    } catch (requestError) {
      setSaveError(problemDetail(requestError) ?? 'Nu am putut salva pagina. Încearcă din nou.')
    } finally {
      setSaving(false)
    }
  }

  const invalidColor = Object.entries(draft.theme).some(
    ([key, value]) => key !== 'heroOverlayOpacity' && !isHex(value as string),
  )

  const blocked = profile.pageModeration.blockedSections

  const draftPreview: PublicCompany = {
    legalName: profile.legalName,
    slug: profile.slug,
    logoUrl: profile.logoUrl,
    coverImageUrl: profile.coverImageUrl,
    tagline: draft.tagline.trim() || null,
    publicDescription: draft.publicDescription.trim() || null,
    isVerified: profile.isVerified,
    // Previzualizarea respectă aceleași comutatoare de vizibilitate ca pagina reală, ca să nu
    // arate un telefon pe care publicul nu-l vede.
    phone: profile.visibility.phone ? profile.phone : null,
    email: profile.visibility.email ? profile.email : null,
    website: profile.website,
    whatsAppEnabled: profile.visibility.whatsapp && profile.visibility.phone && Boolean(profile.phone),
    location: profile.visibility.location ? profile.registeredOffice : null,
    theme: draft.theme,
    content: draft.content,
    pickup: draft.pickup,
    // Mașinile nu se aduc în editor: pagina reală le are, iar aici întrebarea e cum arată
    // secțiunile pe care le scrii, nu câte mașini ai.
    cars: [],
  }

  // Secțiunile oprite de RIDElance lipsesc și din previzualizare. Altfel panoul ar fi arătat un
  // „De ce noi" pe care vizitatorul nu-l vede — adică exact minciuna pe care previzualizarea
  // trebuie s-o excludă. Banda de deasupra spune care sunt și de ce.
  const preview = withoutBlockedSections(draftPreview, blocked)

  const editor = (
    <Stack spacing={2.5}>
      <Panel
        title="Adresa publică"
        subtitle="Rămâne aceeași chiar dacă schimbi denumirea firmei."
        action={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<ContentCopyRoundedIcon />}
              onClick={() => void copyLink()}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
            >
              {copied ? 'Link copiat' : 'Copiază link'}
            </Button>
            <Button
              variant="outlined"
              endIcon={<OpenInNewRoundedIcon />}
              href={path}
              target="_blank"
              rel="noopener"
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
            >
              Deschide
            </Button>
          </Stack>
        }
      >
        <Typography
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.95rem',
            fontWeight: 700,
            color: DASHBOARD_TOKENS.accent,
            wordBreak: 'break-all',
          }}
        >
          {publicUrl}
        </Typography>
      </Panel>

      <Panel dense>
        <Tabs
          value={tab}
          onChange={(_, next: TabId) => setTab(next)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`,
            mb: 2.5,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              color: DASHBOARD_TOKENS.textMuted,
              '&.Mui-selected': { color: DASHBOARD_TOKENS.accent },
            },
          }}
        >
          {TABS.map((entry) => (
            <Tab key={entry.id} value={entry.id} label={entry.label} />
          ))}
        </Tabs>

        {tab === 'identitate' && (
          <Stack spacing={2.5}>
            <TextField
              label="Slogan"
              placeholder="Mașini pregătite pentru ridesharing, predate în aceeași zi."
              value={draft.tagline}
              onChange={(event) => update({ tagline: event.target.value.slice(0, 160) })}
              fullWidth
              size="small"
              sx={dashboardInputSx}
              helperText={`${draft.tagline.length}/160 — apare sub denumire, în antet.`}
            />

            <TextField
              label="Descriere publică"
              value={draft.publicDescription}
              onChange={(event) => update({ publicDescription: event.target.value.slice(0, 2048) })}
              fullWidth
              multiline
              minRows={7}
              size="small"
              sx={dashboardInputSx}
              helperText={`${draft.publicDescription.length}/2048 — secțiunea „Despre noi”. Golește-o și secțiunea dispare.`}
            />

            <Box>
              <Button
                variant="outlined"
                startIcon={<AutoAwesomeRoundedIcon />}
                onClick={() => setAiOpen(true)}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
              >
                Scrie cu AI
              </Button>
              <Typography sx={{ mt: 1, fontSize: '0.82rem', color: DASHBOARD_TOKENS.textMuted }}>
                Pornește de la datele flotei tale și de la ce îi spui tu. Alegi varianta, o
                corectezi, apoi salvezi.
              </Typography>
            </Box>
          </Stack>
        )}

        {tab === 'aspect' && (
          <Stack spacing={3}>
            <Box>
              <SubTitle>Fotografia de fundal</SubTitle>
              <CompanyCoverPanel
                coverUrl={profile.coverImageUrl}
                hasProfile={profile.id !== ''}
                onCoverChange={(url) => onProfileChange({ ...profile, coverImageUrl: url })}
              />
            </Box>

            <Box>
              <SubTitle>Pornește de la</SubTitle>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                {THEME_PRESETS.map((preset) => (
                  <Button
                    key={preset.id}
                    onClick={() => update({ theme: preset.theme })}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      borderRadius: `${DASHBOARD_TOKENS.radius.md}px`,
                      border: `1px solid ${DASHBOARD_TOKENS.border}`,
                      color: DASHBOARD_TOKENS.ink,
                      px: 1.4,
                      gap: 0.8,
                    }}
                  >
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        bgcolor: preset.theme.accent,
                        border: `2px solid ${preset.theme.background}`,
                        boxShadow: `0 0 0 1px ${DASHBOARD_TOKENS.border}`,
                      }}
                    />
                    {preset.label}
                  </Button>
                ))}
              </Stack>
              <Typography sx={{ mt: 1, fontSize: '0.82rem', color: DASHBOARD_TOKENS.textMuted }}>
                Sunt puncte de pornire. După ce alegi una, fiecare culoare rămâne editabilă.
              </Typography>
            </Box>

            <Box>
              <SubTitle>Culorile</SubTitle>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                  gap: 2,
                }}
              >
                <ColorField
                  label="Accent"
                  hint="Butoane, linkuri, etichete."
                  value={draft.theme.accent}
                  onChange={(accent) => update({ theme: { ...draft.theme, accent } })}
                  warning={warnContrast(draft.theme.accent, draft.theme.background, 'Accentul')}
                />
                <ColorField
                  label="Fundal"
                  hint="Fundalul paginii."
                  value={draft.theme.background}
                  onChange={(background) => update({ theme: { ...draft.theme, background } })}
                />
                <ColorField
                  label="Text"
                  hint="Titluri și paragrafe."
                  value={draft.theme.text}
                  onChange={(text) => update({ theme: { ...draft.theme, text } })}
                  warning={warnContrast(draft.theme.text, draft.theme.background, 'Textul')}
                />
                <ColorField
                  label="Suprafață"
                  hint="Cartonașele și benzile."
                  value={draft.theme.surface}
                  onChange={(surface) => update({ theme: { ...draft.theme, surface } })}
                />
                <ColorField
                  label="Text pe butoane"
                  value={draft.theme.buttonText}
                  onChange={(buttonText) => update({ theme: { ...draft.theme, buttonText } })}
                  warning={warnContrast(draft.theme.buttonText, draft.theme.accent, 'Textul de pe butoane')}
                />
                <ColorField
                  label="Văl peste fotografie"
                  hint="Ce se pune peste cover, ca titlul să rămână lizibil."
                  value={draft.theme.heroOverlay}
                  onChange={(heroOverlay) => update({ theme: { ...draft.theme, heroOverlay } })}
                />
              </Box>

              <Box sx={{ mt: 2.5, maxWidth: 360 }}>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: DASHBOARD_TOKENS.ink, mb: 0.5 }}>
                  Intensitatea vălului: {draft.theme.heroOverlayOpacity}%
                </Typography>
                <Box
                  component="input"
                  type="range"
                  min={0}
                  max={90}
                  value={draft.theme.heroOverlayOpacity}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    update({
                      theme: { ...draft.theme, heroOverlayOpacity: Number(event.target.value) },
                    })
                  }
                  aria-label="Intensitatea vălului peste fotografie"
                  sx={{ width: '100%', accentColor: DASHBOARD_TOKENS.accent }}
                />
              </Box>
            </Box>
          </Stack>
        )}

        {tab === 'sectiuni' && (
          <PageSectionsPanel content={draft.content} onChange={(content) => update({ content })} />
        )}

        {tab === 'locatie' && (
          <PageLocationPanel pickup={draft.pickup} onChange={(pickup) => update({ pickup })} />
        )}

        <Stack
          direction="row"
          spacing={1.5}
          sx={{ mt: 3, pt: 2.5, borderTop: `1px solid ${DASHBOARD_TOKENS.border}`, alignItems: 'center' }}
        >
          <Button
            variant="contained"
            disableElevation
            disabled={saving || !dirty || invalidColor}
            onClick={() => void save()}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
          >
            {/* Nu „Publică": butonul ăsta trimite o ciornă. A-l numi altfel ar fi promis ceva ce
                nu se întâmplă până când nu se uită cineva peste pagină. */}
            {saving ? 'Se salvează…' : 'Salvează și trimite la verificare'}
          </Button>
          {invalidColor && (
            <StatusChip label="O culoare nu e validă" tone="warning" size="sm" outlined />
          )}
          {saved && !dirty && (
            <StatusChip
              label={
                profile.pageModeration.status === 'Pending' ? 'Trimis la verificare' : 'Salvat'
              }
              tone="active"
              size="sm"
              outlined
            />
          )}
        </Stack>

        {saveError && (
          <Alert
            severity="error"
            sx={{ mt: 2, borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}
          >
            {saveError}
          </Alert>
        )}
      </Panel>
    </Stack>
  )

  const previewPanel = (
    <Panel
      title="Cum arată"
      subtitle="Exact componenta pe care o vede vizitatorul, cu modificările nesalvate."
    >
      <Box
        sx={{
          borderRadius: `${DASHBOARD_TOKENS.radius.md}px`,
          border: `1px solid ${DASHBOARD_TOKENS.border}`,
          overflow: 'hidden',
          // Previzualizarea are propriul scroll: pagina firmei e lungă, iar panoul n-are voie să
          // împingă butonul de salvare în afara ecranului.
          maxHeight: splitLayout ? 'calc(100vh - 220px)' : 620,
          overflowY: 'auto',
        }}
      >
        <CompanySite company={preview} preview />
      </Box>
      <Typography sx={{ mt: 1.5, fontSize: '0.8rem', color: DASHBOARD_TOKENS.textMuted }}>
        Mașinile lipsesc din previzualizare — pe pagina reală apar sub „Flota”.
        {blocked.length > 0 &&
          ` Secțiunile oprite de RIDElance (${blocked
            .map((id) => BLOCKABLE_SECTIONS.find((section) => section.id === id)?.label ?? id)
            .join(', ')}) lipsesc și ele, ca aici.`}
      </Typography>
    </Panel>
  )

  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1600, mx: 'auto' }}>
      <PageHeader
        title="Pagina firmei"
        subtitle="Mini-site-ul public al flotei. Datele de identitate și ce contacte se văd rămân în Profil."
      />

      {/* Deasupra tuturor taburilor, nu într-unul: e valabilă pentru tot ce se editează dedesubt,
          iar cine intră să schimbe o culoare trebuie să afle din prima că salvarea nu publică. */}
      <PageModerationBanner moderation={profile.pageModeration} dirty={dirty} />

      {splitLayout ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 2.5, alignItems: 'start' }}>
          {editor}
          {previewPanel}
        </Box>
      ) : (
        <Stack spacing={2.5}>
          {editor}
          {previewPanel}
        </Stack>
      )}

      <AiDescriptionDialog
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onPick={(choice) =>
          update({
            publicDescription: choice.description,
            // Sloganul și avantajele se completează doar dacă n-ai scris deja ceva acolo: o
            // propunere n-are voie să șteargă textul cuiva.
            tagline: draft.tagline.trim() || (choice.tagline ?? ''),
            content:
              draft.content.highlights.length > 0
                ? draft.content
                : { ...draft.content, highlights: choice.highlights.slice(0, 6) },
          })
        }
      />
    </Stack>
  )
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: DASHBOARD_TOKENS.ink, mb: 1.4 }}>
      {children}
    </Typography>
  )
}

/**
 * Avertisment, nu blocaj.
 *
 * Firma are control complet pe culori — asta a fost decizia. Contrastul slab se semnalează, dar
 * cine îl acceptă rămâne cu alegerea lui; o culoare interzisă ar fi fost alegerea noastră.
 */
function warnContrast(foreground: string, background: string, subject: string): string | null {
  if (!isHex(foreground) || !isHex(background)) return null
  return contrastRatio(foreground, background) < MIN_CONTRAST
    ? `${subject} se citește greu pe fundalul ales.`
    : null
}

/** Mesajul serverului, când există. `detail` poartă textul scris pentru om. */
function problemDetail(error: unknown): string | null {
  const data = (error as { response?: { data?: { detail?: unknown } } })?.response?.data
  return typeof data?.detail === 'string' ? data.detail : null
}

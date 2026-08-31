import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import BlockRoundedIcon from '@mui/icons-material/BlockRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'

import { TOKENS } from '../../../../../constants/tokens'
import { getErrorMessage } from '../../../../../utils/errorHandler'
import {
  adminCompanyPageService,
  type AdminCompanyPageDetail,
} from '../../../../../services/adminCompanyPage.service'
import type { BlockableSectionId, CompanyPageContent } from '../../../../../services/company.service'
import { BLOCKABLE_SECTIONS } from '../../../../company/sections'
import { PageSectionsPanel } from '../../../srl/pages/companyPage/PageSectionsPanel'
import { CompanyPagePreview } from './CompanyPagePreview'
import { statusChip } from './statusChip'

/**
 * Verificarea unui mini-site: ce a scris firma, ce se vede acum, și ce facem cu asta.
 *
 * Trei unelte, în ordinea în care se folosesc. Se **citește** pagina în previzualizare; dacă e
 * bună, se aprobă. Dacă are o singură secțiune problematică, se blochează secțiunea, nu pagina.
 * Dacă e recuperabilă printr-o corectură, se corectează aici și abia apoi se aprobă.
 *
 * Corectura nu publică singură, dinadins. Cine taie un rând trebuie să se uite după aceea la
 * pagina întreagă și să apese explicit „Aprobă" — altfel fiecare tăiere de virgulă ar fi devenit
 * o publicare nevăzută.
 */

interface CompanyPageReviewPanelProps {
  detail: AdminCompanyPageDetail
  onBack: () => void
  onChanged: (detail: AdminCompanyPageDetail) => void
}

type ViewId = 'draft' | 'published'

export function CompanyPageReviewPanel({ detail, onBack, onChanged }: CompanyPageReviewPanelProps) {
  const [view, setView] = useState<ViewId>('draft')
  const [blocked, setBlocked] = useState<BlockableSectionId[]>(detail.moderation.blockedSections)
  const [note, setNote] = useState('')
  const [tagline, setTagline] = useState(detail.draft.tagline ?? '')
  const [description, setDescription] = useState(detail.draft.publicDescription ?? '')
  const [content, setContent] = useState<CompanyPageContent>(detail.draft.content)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectNote, setRejectNote] = useState('')

  /**
   * Fiecare acțiune întoarce detaliul complet, deci starea locală se rescrie din răspuns.
   * Reîncărcarea separată ar fi lăsat panoul o clipă pe starea dinainte de apăsare.
   */
  const run = async (action: () => Promise<AdminCompanyPageDetail>) => {
    setBusy(true)
    setError(null)
    try {
      const next = await action()
      onChanged(next)
      setBlocked(next.moderation.blockedSections)
      setTagline(next.draft.tagline ?? '')
      setDescription(next.draft.publicDescription ?? '')
      setContent(next.draft.content)
      setNote('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setBusy(false)
    }
  }

  const toggleSection = (id: BlockableSectionId) =>
    setBlocked((previous) =>
      previous.includes(id) ? previous.filter((entry) => entry !== id) : [...previous, id],
    )

  const version = view === 'published' ? detail.published : detail.draft
  const live = Boolean(detail.moderation.publishedAtUtc)

  return (
    <Stack spacing={2.5}>
      <Button
        startIcon={<ArrowBackRoundedIcon />}
        onClick={onBack}
        sx={{ textTransform: 'none', fontWeight: 700, alignSelf: 'flex-start' }}
      >
        Înapoi la listă
      </Button>

      <Card>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
        >
          <Box>
            <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: TOKENS.ink }}>
                {detail.legalName}
              </Typography>
              {statusChip(detail.moderation.status)}
              <Chip
                label={detail.ownerType === 'Srl' ? 'SRL' : 'PFA'}
                size="small"
                sx={{ fontWeight: 700, fontSize: '0.68rem' }}
              />
            </Stack>
            <Typography sx={{ mt: 0.6, fontSize: '0.85rem', color: alpha(TOKENS.ink, 0.62) }}>
              {detail.ownerEmail}
              {detail.cui && ` · CUI ${detail.cui}`}
              {` · ${detail.publicCarCount} ${detail.publicCarCount === 1 ? 'mașină publică' : 'mașini publice'}`}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            endIcon={<OpenInNewRoundedIcon />}
            href={`/${detail.slug}`}
            target="_blank"
            rel="noopener"
            sx={{ textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}
          >
            Vezi pagina publică
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Ce se întâmplă acum pe internet, în cuvinte. Statutul singur nu spune asta: „în
            așteptare" înseamnă altceva pe o firmă publicată cândva decât pe una nouă. */}
        <Alert
          severity={live ? 'info' : 'warning'}
          sx={{ borderRadius: TOKENS.radius.md, fontWeight: 600 }}
        >
          {live
            ? 'Pagina e online acum, cu versiunea aprobată anterior. O aprobare o înlocuiește cu ciorna de mai jos; un refuz o scoate de tot.'
            : 'Pagina nu e online. Vizitatorii văd doar denumirea firmei, mașinile aprobate și datele de contact marcate publice.'}
        </Alert>

        {detail.moderation.note && (
          <Typography sx={{ mt: 1.5, fontSize: '0.85rem', color: alpha(TOKENS.ink, 0.7) }}>
            <strong>Ultimul mesaj trimis firmei:</strong> {detail.moderation.note}
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2, borderRadius: TOKENS.radius.md, fontWeight: 600 }}>
            {error}
          </Alert>
        )}
      </Card>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1fr)' },
          gap: 2.5,
          alignItems: 'start',
        }}
      >
        <Stack spacing={2.5}>
          <Card>
            <SectionTitle>Verdict</SectionTitle>
            <TextField
              label="Mesaj pentru firmă (opțional la aprobare)"
              value={note}
              onChange={(event) => setNote(event.target.value.slice(0, 600))}
              fullWidth
              multiline
              minRows={2}
              size="small"
              helperText="Apare în editorul proprietarului, sub starea paginii."
            />

            <Stack direction="row" spacing={1.5} sx={{ mt: 2, flexWrap: 'wrap', rowGap: 1.5 }}>
              <Button
                variant="contained"
                disableElevation
                disabled={busy}
                startIcon={<CheckCircleRoundedIcon />}
                onClick={() =>
                  void run(() =>
                    adminCompanyPageService.approve(detail.profileId, {
                      note: note.trim() || null,
                      blockedSections: blocked,
                    }),
                  )
                }
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Aprobă și publică
              </Button>

              <Button
                variant="outlined"
                color="error"
                disabled={busy}
                startIcon={<BlockRoundedIcon />}
                onClick={() => {
                  setRejectNote(note)
                  setRejectOpen(true)
                }}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Refuză și scoate de pe internet
              </Button>
            </Stack>

            <Typography sx={{ mt: 1.4, fontSize: '0.8rem', color: alpha(TOKENS.ink, 0.6) }}>
              Aprobarea publică versiunea din ciornă, cu secțiunile bifate mai jos oprite.
            </Typography>
          </Card>

          <Card>
            <SectionTitle>Secțiuni oprite</SectionTitle>
            <Typography sx={{ mb: 1.2, fontSize: '0.85rem', color: alpha(TOKENS.ink, 0.62) }}>
              O secțiune oprită nu apare public și nu poate fi reactivată de proprietar. Flota și
              contactul lipsesc din listă: acolo nu se scrie text liber.
            </Typography>

            <Stack>
              {BLOCKABLE_SECTIONS.map((section) => (
                <FormControlLabel
                  key={section.id}
                  control={
                    <Checkbox
                      checked={blocked.includes(section.id)}
                      onChange={() => toggleSection(section.id)}
                    />
                  }
                  label={section.label}
                />
              ))}
            </Stack>

            <Button
              variant="outlined"
              disabled={busy}
              onClick={() =>
                void run(() =>
                  adminCompanyPageService.setSections(detail.profileId, blocked, note.trim() || null),
                )
              }
              sx={{ mt: 1, textTransform: 'none', fontWeight: 700 }}
            >
              Salvează secțiunile
            </Button>
            <Typography sx={{ mt: 1, fontSize: '0.8rem', color: alpha(TOKENS.ink, 0.6) }}>
              Se aplică imediat, și pe versiunea deja publicată. Verdictul rămâne neschimbat.
            </Typography>
          </Card>

          <Card>
            <SectionTitle>Imagini</SectionTitle>

            <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', mb: 1 }}>Logo</Typography>
            {detail.logoUrl ? (
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2.5 }}>
                <Box
                  component="img"
                  src={detail.logoUrl}
                  alt="Logo-ul firmei"
                  sx={{
                    width: 72,
                    height: 72,
                    objectFit: 'contain',
                    borderRadius: TOKENS.radius.md,
                    border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
                  }}
                />
                <Box>
                  <Button
                    variant="outlined"
                    color="error"
                    disabled={busy}
                    startIcon={<DeleteOutlineRoundedIcon />}
                    onClick={() => void run(() => adminCompanyPageService.removeLogo(detail.profileId))}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    Scoate logo-ul
                  </Button>
                  <Typography sx={{ mt: 0.8, fontSize: '0.8rem', color: alpha(TOKENS.ink, 0.6) }}>
                    Se aplică imediat, fără aprobare: logo-ul apare și pe cardurile de anunț din
                    marketplace. Fără el se afișează inițialele firmei.
                  </Typography>
                </Box>
              </Stack>
            ) : (
              <Typography sx={{ mb: 2.5, fontSize: '0.85rem', color: alpha(TOKENS.ink, 0.62) }}>
                Firma n-a încărcat niciun logo.
              </Typography>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', mb: 1 }}>
              Fotografia de fundal
            </Typography>
            {detail.draft.coverImageUrl ? (
              <Stack spacing={1.5}>
                <Box
                  component="img"
                  src={detail.draft.coverImageUrl}
                  alt="Fotografia de fundal a paginii"
                  sx={{
                    width: '100%',
                    maxHeight: 180,
                    objectFit: 'cover',
                    borderRadius: TOKENS.radius.md,
                    border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
                  }}
                />
                <Button
                  variant="outlined"
                  color="error"
                  disabled={busy}
                  startIcon={<DeleteOutlineRoundedIcon />}
                  onClick={() => void run(() => adminCompanyPageService.removeCover(detail.profileId))}
                  sx={{ textTransform: 'none', fontWeight: 700, alignSelf: 'flex-start' }}
                >
                  Scoate fotografia
                </Button>
                <Typography sx={{ fontSize: '0.8rem', color: alpha(TOKENS.ink, 0.6) }}>
                  Dispare acum și de pe versiunea publicată, nu la următoarea aprobare.
                </Typography>
              </Stack>
            ) : (
              <Typography sx={{ fontSize: '0.85rem', color: alpha(TOKENS.ink, 0.62) }}>
                Firma n-a încărcat nicio fotografie.
              </Typography>
            )}
          </Card>

          <Card>
            <SectionTitle>Corectează textul</SectionTitle>
            <Typography sx={{ mb: 2, fontSize: '0.85rem', color: alpha(TOKENS.ink, 0.62) }}>
              Modifică ciorna firmei. Nu publică nimic — după corectură, apasă „Aprobă și publică”.
            </Typography>

            <Stack spacing={2}>
              <TextField
                label="Slogan"
                value={tagline}
                onChange={(event) => setTagline(event.target.value.slice(0, 160))}
                fullWidth
                size="small"
                helperText={`${tagline.length}/160`}
              />
              <TextField
                label="Descriere publică"
                value={description}
                onChange={(event) => setDescription(event.target.value.slice(0, 2048))}
                fullWidth
                multiline
                minRows={5}
                size="small"
                helperText={`${description.length}/2048`}
              />
            </Stack>

            <Divider sx={{ my: 2.5 }} />

            {/* Același panou pe care îl folosește proprietarul. Un al doilea editor pentru aceleași
                câmpuri s-ar fi desincronizat la prima secțiune nouă. */}
            <PageSectionsPanel content={content} onChange={setContent} />

            <Button
              variant="contained"
              disableElevation
              disabled={busy}
              onClick={() =>
                void run(() =>
                  adminCompanyPageService.edit(detail.profileId, {
                    tagline: tagline.trim() || null,
                    publicDescription: description.trim() || null,
                    theme: detail.draft.theme,
                    content,
                    pickup: detail.draft.pickup,
                  }),
                )
              }
              sx={{ mt: 3, textTransform: 'none', fontWeight: 700 }}
            >
              Salvează corecturile
            </Button>
          </Card>
        </Stack>

        <Card>
          <Tabs
            value={view}
            onChange={(_, next: ViewId) => setView(next)}
            sx={{ mb: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 700 } }}
          >
            <Tab value="draft" label="Ciorna firmei" />
            <Tab value="published" label={live ? 'Ce e online acum' : 'Nimic online'} disabled={!live} />
          </Tabs>

          {version ? (
            <CompanyPagePreview
              detail={detail}
              version={version}
              blockedSections={blocked}
              maxHeight="calc(100vh - 260px)"
            />
          ) : (
            <Alert severity="info" sx={{ borderRadius: TOKENS.radius.md, fontWeight: 600 }}>
              Pagina n-a fost publicată niciodată.
            </Alert>
          )}

          <Typography sx={{ mt: 1.5, fontSize: '0.8rem', color: alpha(TOKENS.ink, 0.6) }}>
            Mașinile lipsesc din previzualizare — au propriul flux de aprobare. Secțiunile bifate
            mai sus sunt deja scoase din ce vezi aici.
          </Typography>
        </Card>
      </Box>

      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Refuză pagina</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, fontSize: '0.88rem', color: alpha(TOKENS.ink, 0.7) }}>
            Pagina iese de pe internet imediat. Motivul e obligatoriu: proprietarul îl citește în
            editorul lui și fără el ar retrimite exact aceeași pagină.
          </Typography>
          <TextField
            label="Motivul refuzului"
            value={rejectNote}
            onChange={(event) => setRejectNote(event.target.value.slice(0, 600))}
            fullWidth
            multiline
            minRows={3}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setRejectOpen(false)} sx={{ textTransform: 'none', fontWeight: 700 }}>
            Renunță
          </Button>
          <Button
            variant="contained"
            color="error"
            disableElevation
            disabled={busy || rejectNote.trim().length === 0}
            onClick={() => {
              setRejectOpen(false)
              void run(() => adminCompanyPageService.reject(detail.profileId, rejectNote.trim()))
            }}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Refuză
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: TOKENS.radius.lg,
        border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
      }}
    >
      {children}
    </Paper>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: TOKENS.ink, mb: 1.5 }}>
      {children}
    </Typography>
  )
}

import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'

import {
  companyService,
  type CompanyDescriptionSuggestion,
  type CompanyPageHighlight,
} from '../../../../../services/company.service'
import { DASHBOARD_TOKENS, dashboardInputSx } from '../../../dashboardTheme'
import { highlightIcon } from '../../../../company/highlightIcons'

/**
 * Propunerile modelului pentru textul paginii.
 *
 * Modelul primește datele reale ale flotei — câte mașini, ce mărci, ce prețuri, ce oraș — plus ce
 * scrie proprietarul în căsuța de aici. Nimic altceva: promptul îi interzice explicit să inventeze
 * asigurări incluse, vechime pe piață sau livrare gratuită, fiindcă textul ăsta ajunge pe o pagină
 * publică și devine o promisiune făcută în numele firmei.
 *
 * Nimic nu se salvează de aici. Alegerea unei variante o pune în formular, iar omul o citește și
 * o corectează înainte să apese Salvează — un text despre firma ta, publicat fără să-l fi citit,
 * e exact felul de ajutor pe care nu-l vrea nimeni.
 */

interface AiDescriptionDialogProps {
  open: boolean
  onClose: () => void
  onPick: (choice: { description: string; tagline: string | null; highlights: CompanyPageHighlight[] }) => void
}

export function AiDescriptionDialog({ open, onClose, onPick }: AiDescriptionDialogProps) {
  if (!open) return null
  return <AiDescriptionForm onClose={onClose} onPick={onPick} />
}

function AiDescriptionForm({ onClose, onPick }: Omit<AiDescriptionDialogProps, 'open'>) {
  const [hints, setHints] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState<CompanyDescriptionSuggestion | null>(null)

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      setSuggestion(await companyService.suggestDescription(hints.trim() || null))
    } catch (requestError) {
      setError(problemDetail(requestError) ?? 'N-am putut genera textul. Mai încearcă o dată.')
    } finally {
      setLoading(false)
    }
  }

  const pick = (description: string) => {
    onPick({
      description,
      tagline: suggestion?.tagline ?? null,
      highlights:
        suggestion?.highlights.map((highlight) => ({
          iconKey: highlight.iconKey,
          title: highlight.title,
          text: highlight.text,
        })) ?? [],
    })
    onClose()
  }

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: `${DASHBOARD_TOKENS.radius.lg}px` } } }}
    >
      <DialogTitle sx={{ fontWeight: 800 }}>Scrie descrierea cu AI</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem', lineHeight: 1.65 }}>
            Pornim de la datele flotei tale — mașinile publicate, mărcile, prețurile, orașul.
            Scrie mai jos ce vrei neapărat să se spună; ce nu apare nici în date, nici aici, nu
            ajunge în text.
          </Typography>

          <TextField
            label="Ce vrei să se spună despre firmă"
            placeholder="predăm în 24 de ore, fără avans, mașini sub 5 ani"
            value={hints}
            onChange={(event) => setHints(event.target.value.slice(0, 600))}
            multiline
            minRows={3}
            fullWidth
            size="small"
            sx={dashboardInputSx}
            helperText={`${hints.length}/600 — opțional`}
          />

          <Box>
            <Button
              variant="contained"
              disableElevation
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeRoundedIcon />}
              onClick={() => void generate()}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
            >
              {loading ? 'Se scrie…' : suggestion ? 'Mai generează o dată' : 'Generează'}
            </Button>
          </Box>

          {error && (
            <Alert severity="warning" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}>
              {error}
            </Alert>
          )}

          {suggestion && (
            <Stack spacing={2}>
              {suggestion.tagline && (
                <Box
                  sx={{
                    p: 1.6,
                    borderRadius: `${DASHBOARD_TOKENS.radius.md}px`,
                    bgcolor: DASHBOARD_TOKENS.accentWash,
                  }}
                >
                  <Typography sx={{ fontSize: '0.74rem', fontWeight: 800, color: DASHBOARD_TOKENS.textSubtle, mb: 0.4 }}>
                    SLOGAN PROPUS
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }}>{suggestion.tagline}</Typography>
                </Box>
              )}

              {suggestion.highlights.length > 0 && (
                <Box>
                  <Typography sx={{ fontSize: '0.74rem', fontWeight: 800, color: DASHBOARD_TOKENS.textSubtle, mb: 0.8 }}>
                    AVANTAJE PROPUSE
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                    {suggestion.highlights.map((highlight) => {
                      const Icon = highlightIcon(highlight.iconKey)
                      return (
                        <Stack
                          key={highlight.title}
                          direction="row"
                          spacing={0.8}
                          sx={{
                            alignItems: 'center',
                            px: 1.2,
                            py: 0.6,
                            borderRadius: `${DASHBOARD_TOKENS.radius.full}px`,
                            border: `1px solid ${DASHBOARD_TOKENS.border}`,
                          }}
                        >
                          <Icon sx={{ fontSize: 16, color: DASHBOARD_TOKENS.accent }} />
                          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>
                            {highlight.title}
                          </Typography>
                        </Stack>
                      )
                    })}
                  </Stack>
                </Box>
              )}

              {suggestion.descriptions.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}>
                  Modelul n-a întors nicio variantă. Mai încearcă o dată.
                </Alert>
              ) : (
                <Stack spacing={1.6}>
                  {suggestion.descriptions.map((description, index) => (
                    <Box
                      key={description.slice(0, 40) + index}
                      sx={{
                        p: 2,
                        borderRadius: `${DASHBOARD_TOKENS.radius.md}px`,
                        border: `1px solid ${DASHBOARD_TOKENS.border}`,
                      }}
                    >
                      <Typography sx={{ fontSize: '0.9rem', lineHeight: 1.7, color: DASHBOARD_TOKENS.ink }}>
                        {description}
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={1.5}
                        sx={{ mt: 1.4, alignItems: 'center', justifyContent: 'space-between' }}
                      >
                        <Typography sx={{ fontSize: '0.76rem', color: DASHBOARD_TOKENS.textSubtle }}>
                          {description.length} caractere
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => pick(description)}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: `${DASHBOARD_TOKENS.radius.md}px`,
                          }}
                        >
                          Folosește varianta
                        </Button>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}

              <Typography sx={{ fontSize: '0.8rem', color: DASHBOARD_TOKENS.textMuted }}>
                Varianta aleasă intră în formular. Citește-o și corecteaz-o înainte de salvare —
                nimic nu se publică până nu apeși Salvează.
              </Typography>
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 700 }}>
          Închide
        </Button>
      </DialogActions>
    </Dialog>
  )
}

/**
 * Mesajul de la server, când există.
 *
 * Doar `detail` — acolo stă textul scris pe înțelesul omului. `title` poartă codul erorii
 * („CompanyDescription.Failed"), care n-are ce căuta într-o alertă.
 */
function problemDetail(error: unknown): string | null {
  const data = (error as { response?: { data?: { detail?: unknown } } })?.response?.data
  return typeof data?.detail === 'string' ? data.detail : null
}

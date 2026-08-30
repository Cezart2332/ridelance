import type { ReactNode } from 'react'
import { Box, Button, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'

import type { CompanyPageContent, HighlightIconKey } from '../../../../../services/company.service'
import { DASHBOARD_TOKENS, dashboardInputSx } from '../../../dashboardTheme'
import { HIGHLIGHT_ICON_KEYS, highlightIcon } from '../../../../company/highlightIcons'

/**
 * Conținutul secțiunilor proprii ale mini-site-ului.
 *
 * Nicio secțiune nu are comutator de pornit/oprit: apare pe pagină dacă are conținut, dispare
 * când se golește. De aceea starea goală de aici spune ce se întâmplă dacă o lași așa — altfel
 * proprietarul ar căuta un buton „ascunde" care nu există.
 */

const LIMITS = { highlights: 6, schedule: 7, coverage: 12, faq: 8 }

/** Zilele obișnuite, ca prim rând să fie un click, nu o tastare. */
const DEFAULT_DAYS = ['Luni – Vineri', 'Sâmbătă', 'Duminică']

interface PageSectionsPanelProps {
  content: CompanyPageContent
  onChange: (content: CompanyPageContent) => void
}

export function PageSectionsPanel({ content, onChange }: PageSectionsPanelProps) {
  const patch = (partial: Partial<CompanyPageContent>) => onChange({ ...content, ...partial })

  return (
    <Stack spacing={4}>
      <ListSection
        title="De ce noi"
        hint="Trei-șase motive concrete. Apar ca șiruri de cartonașe sub descriere."
        count={content.highlights.length}
        max={LIMITS.highlights}
        emptyNote="Fără niciun avantaj, secțiunea nu apare pe pagină."
        onAdd={() =>
          patch({ highlights: [...content.highlights, { iconKey: 'check', title: '', text: '' }] })
        }
      >
        {content.highlights.map((highlight, index) => (
          <Row
            key={index}
            onRemove={() => patch({ highlights: content.highlights.filter((_, i) => i !== index) })}
          >
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
              <TextField
                select
                label="Iconiță"
                value={highlight.iconKey}
                onChange={(event) =>
                  patch({
                    highlights: replaceAt(content.highlights, index, {
                      ...highlight,
                      iconKey: event.target.value as HighlightIconKey,
                    }),
                  })
                }
                size="small"
                sx={{ ...dashboardInputSx, minWidth: 118 }}
              >
                {HIGHLIGHT_ICON_KEYS.map((key) => {
                  const Icon = highlightIcon(key)
                  return (
                    <MenuItem key={key} value={key}>
                      <Icon sx={{ fontSize: 20, color: DASHBOARD_TOKENS.accent }} />
                    </MenuItem>
                  )
                })}
              </TextField>
              <TextField
                label="Titlu"
                value={highlight.title}
                onChange={(event) =>
                  patch({
                    highlights: replaceAt(content.highlights, index, {
                      ...highlight,
                      title: event.target.value.slice(0, 60),
                    }),
                  })
                }
                size="small"
                sx={{ ...dashboardInputSx, flex: 1 }}
              />
              <TextField
                label="Explicație"
                value={highlight.text}
                onChange={(event) =>
                  patch({
                    highlights: replaceAt(content.highlights, index, {
                      ...highlight,
                      text: event.target.value.slice(0, 200),
                    }),
                  })
                }
                size="small"
                sx={{ ...dashboardInputSx, flex: 2 }}
              />
            </Stack>
          </Row>
        ))}
      </ListSection>

      <ListSection
        title="Program"
        hint="Când răspundeți și când se poate ridica o mașină."
        count={content.schedule.length}
        max={LIMITS.schedule}
        emptyNote="Fără niciun rând, secțiunea „Program și zone” apare doar dacă ai completat zonele."
        onAdd={() =>
          patch({
            schedule: [
              ...content.schedule,
              { day: DEFAULT_DAYS[content.schedule.length] ?? '', hours: '' },
            ],
          })
        }
      >
        {content.schedule.map((row, index) => (
          <Row key={index} onRemove={() => patch({ schedule: content.schedule.filter((_, i) => i !== index) })}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
              <TextField
                label="Zile"
                placeholder="Luni – Vineri"
                value={row.day}
                onChange={(event) =>
                  patch({ schedule: replaceAt(content.schedule, index, { ...row, day: event.target.value.slice(0, 40) }) })
                }
                size="small"
                sx={{ ...dashboardInputSx, flex: 1 }}
              />
              <TextField
                label="Interval"
                placeholder="09:00 – 18:00"
                value={row.hours}
                onChange={(event) =>
                  patch({ schedule: replaceAt(content.schedule, index, { ...row, hours: event.target.value.slice(0, 60) }) })
                }
                size="small"
                sx={{ ...dashboardInputSx, flex: 1 }}
              />
            </Stack>
          </Row>
        ))}
      </ListSection>

      <ListSection
        title="Zone de predare"
        hint="Orașele sau zonele în care predați mașina."
        count={content.coverageAreas.length}
        max={LIMITS.coverage}
        emptyNote="Zonele apar ca etichete lângă program."
        onAdd={() => patch({ coverageAreas: [...content.coverageAreas, ''] })}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: 1.5,
          }}
        >
          {content.coverageAreas.map((area, index) => (
            <Stack key={index} direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <TextField
                label={`Zona ${index + 1}`}
                value={area}
                onChange={(event) =>
                  patch({ coverageAreas: replaceAt(content.coverageAreas, index, event.target.value.slice(0, 60)) })
                }
                size="small"
                fullWidth
                sx={dashboardInputSx}
              />
              <RemoveButton onClick={() => patch({ coverageAreas: content.coverageAreas.filter((_, i) => i !== index) })} />
            </Stack>
          ))}
        </Box>

        <TextField
          label="Precizare (opțional)"
          placeholder="Predare gratuită în București, în rest cu tarif."
          value={content.coverageNote ?? ''}
          onChange={(event) => patch({ coverageNote: event.target.value.slice(0, 400) || null })}
          multiline
          minRows={2}
          fullWidth
          size="small"
          sx={{ ...dashboardInputSx, mt: 2 }}
        />
      </ListSection>

      <ListSection
        title="Întrebări frecvente"
        hint="Ce te întreabă șoferii la telefon, scris o dată."
        count={content.faq.length}
        max={LIMITS.faq}
        emptyNote="Fără nicio întrebare, secțiunea nu apare pe pagină."
        onAdd={() => patch({ faq: [...content.faq, { question: '', answer: '' }] })}
      >
        {content.faq.map((entry, index) => (
          <Row key={index} onRemove={() => patch({ faq: content.faq.filter((_, i) => i !== index) })}>
            <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
              <TextField
                label="Întrebare"
                value={entry.question}
                onChange={(event) =>
                  patch({ faq: replaceAt(content.faq, index, { ...entry, question: event.target.value.slice(0, 160) }) })
                }
                size="small"
                fullWidth
                sx={dashboardInputSx}
              />
              <TextField
                label="Răspuns"
                value={entry.answer}
                onChange={(event) =>
                  patch({ faq: replaceAt(content.faq, index, { ...entry, answer: event.target.value.slice(0, 800) }) })
                }
                multiline
                minRows={2}
                size="small"
                fullWidth
                sx={dashboardInputSx}
                // Un răspuns gol nu se salvează: o întrebare fără răspuns arată ca o pagină ruptă.
                helperText={entry.question.trim() && !entry.answer.trim() ? 'Fără răspuns, întrebarea nu se salvează.' : ' '}
              />
            </Stack>
          </Row>
        ))}
      </ListSection>
    </Stack>
  )
}

function ListSection({
  title,
  hint,
  count,
  max,
  emptyNote,
  onAdd,
  children,
}: {
  title: string
  hint: string
  count: number
  max: number
  emptyNote: string
  onAdd: () => void
  children: ReactNode
}) {
  return (
    <Box>
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.6 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: DASHBOARD_TOKENS.ink }}>
            {title}
          </Typography>
          <Typography sx={{ fontSize: '0.82rem', color: DASHBOARD_TOKENS.textMuted, mt: 0.2 }}>
            {hint}
          </Typography>
        </Box>
        <Button
          size="small"
          startIcon={<AddRoundedIcon />}
          disabled={count >= max}
          onClick={onAdd}
          sx={{ textTransform: 'none', fontWeight: 700, flexShrink: 0 }}
        >
          {count >= max ? `Maximum ${max}` : 'Adaugă'}
        </Button>
      </Stack>

      {count === 0 ? (
        <Typography sx={{ fontSize: '0.85rem', color: DASHBOARD_TOKENS.textSubtle, mb: 1 }}>
          {emptyNote}
        </Typography>
      ) : null}

      <Stack spacing={1.5}>{children}</Stack>
    </Box>
  )
}

function Row({ onRemove, children }: { onRemove: () => void; children: ReactNode }) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'flex-start' }}>
      {children}
      <RemoveButton onClick={onRemove} />
    </Stack>
  )
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <IconButton
      size="small"
      aria-label="Șterge rândul"
      onClick={onClick}
      sx={{ mt: 0.6, color: DASHBOARD_TOKENS.textSubtle, '&:hover': { color: DASHBOARD_TOKENS.stateError } }}
    >
      <DeleteOutlineRoundedIcon fontSize="small" />
    </IconButton>
  )
}

function replaceAt<T>(list: T[], index: number, value: T): T[] {
  return list.map((item, i) => (i === index ? value : item))
}

import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded'
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded'
import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

import { displaySx, stateColors, TOKENS } from '../onboardingTheme'
import type { ReviewDocument, ReviewMode } from './reviewModel'

/**
 * Ce vede omul după ce a predat un pas: unde e verificarea, ce acte au ajuns și ce are de refăcut.
 *
 * Un singur card, trei stări. Fără paragrafe de liniștire: titlul spune starea, traseul spune unde
 * e, iar lista spune pe ce act. Singurul rând de text e cel care schimbă ce face omul mai departe —
 * motivul unei respingeri.
 */

type Tone = 'success' | 'pending' | 'danger' | 'accent' | 'neutral'

const MODE: Record<ReviewMode, { tone: Tone; pill: string }> = {
  pending: { tone: 'pending', pill: 'În verificare' },
  approved: { tone: 'success', pill: 'Aprobat' },
  correction: { tone: 'danger', pill: 'Corecturi necesare' },
}

const DOC_STATUS: Record<ReviewDocument['status'], { label: string; tone: Tone }> = {
  received: { label: 'Primit', tone: 'neutral' },
  verified: { label: 'Verificat', tone: 'success' },
  rejected: { label: 'De reîncărcat', tone: 'danger' },
}

export interface StepReviewCardProps {
  mode: ReviewMode
  /** „Pasul 1 din 4 · Eligibilitate" — aceeași numărătoare ca în rail. */
  position: number
  total: number
  label: string
  documents: ReviewDocument[]
  /** Observația echipei, când pasul e întors fără ca un act anume să fie respins. */
  reason: string | null
  /** Ce urmează după verificare: pasul următor, sau abonamentul după ultimul pas. */
  followingLabel: string
  /** Pasul următor e deja deschis. `null` cât timp îl ține închis verificarea. */
  continueLabel: string | null
  onContinue: () => void
  /** Deschide ecranele pasului: răspunsurile date, sau corectura cerută. */
  onOpenStep: () => void
  /** Deschide direct ecranul de încărcare al unui act respins. */
  onReupload: (category: string) => void
}

export function StepReviewCard({
  mode,
  position,
  total,
  label,
  documents,
  reason,
  followingLabel,
  continueLabel,
  onContinue,
  onOpenStep,
  onReupload,
}: StepReviewCardProps) {
  const rejected = documents.filter((doc) => doc.status === 'rejected')
  const hasDocuments = documents.length > 0
  const pill = stateColors(MODE[mode].tone)

  const title =
    mode === 'approved'
      ? `Pasul ${position} a fost aprobat`
      : mode === 'pending'
        ? hasDocuments
          ? 'Am primit documentele tale'
          : 'Am primit datele tale'
        : rejected.length === 1
          ? 'Un document trebuie reîncărcat'
          : rejected.length > 1
            ? `${rejected.length} documente trebuie reîncărcate`
            : 'Pasul are observații'

  const trail: { label: string; node: ReactNode }[] = [
    {
      label: hasDocuments ? 'Documente primite' : 'Date primite',
      node: <TrailNode tone="success" icon={<CheckRoundedIcon sx={{ fontSize: 16 }} />} />,
    },
    {
      label: 'Verificare RIDElance',
      node:
        mode === 'approved' ? (
          <TrailNode tone="success" icon={<CheckRoundedIcon sx={{ fontSize: 16 }} />} />
        ) : mode === 'correction' ? (
          <TrailNode tone="danger" icon={<PriorityHighRoundedIcon sx={{ fontSize: 16 }} />} />
        ) : (
          <TrailNode tone="pending" icon={<HourglassTopRoundedIcon sx={{ fontSize: 15 }} />} />
        ),
    },
    {
      label: followingLabel,
      node: <TrailNode tone={mode === 'approved' ? 'accent' : 'neutral'} icon={3} />,
    },
  ]

  return (
    <Paper
      elevation={1}
      sx={{
        width: '100%',
        maxWidth: 720,
        mx: 'auto',
        borderRadius: `${TOKENS.radius.card}px`,
        border: `1px solid ${TOKENS.border}`,
        backgroundColor: TOKENS.paper,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
        <Stack
          direction="row"
          sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap', mb: 1.5 }}
        >
          <Typography variant="overline" component="p" sx={{ color: TOKENS.textMuted, lineHeight: 1.4 }}>
            Pasul {position} din {total} · {label}
          </Typography>

          <Box
            role="status"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              px: 1.25,
              py: 0.5,
              borderRadius: `${TOKENS.radius.full}px`,
              backgroundColor: pill.bg,
              color: pill.fg,
              fontSize: '0.78rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'currentColor' }} />
            {MODE[mode].pill}
          </Box>
        </Stack>

        <Typography variant="h5" component="h1" sx={{ ...displaySx, color: TOKENS.ink }}>
          {title}
        </Typography>

        {mode === 'correction' && rejected.length === 0 && reason && (
          <Typography sx={{ mt: 1.25, color: TOKENS.ink, fontSize: '0.95rem', lineHeight: 1.6 }}>{reason}</Typography>
        )}

        {/* Fără buton de continuat, cardul n-ar spune ce are omul de făcut: nimic. */}
        {mode === 'pending' && !continueLabel && (
          <Typography sx={{ mt: 1.25, color: TOKENS.textMuted, fontSize: '0.95rem', lineHeight: 1.6 }}>
            Pasul următor se deschide singur după aprobare.
          </Typography>
        )}

        <Stack
          component="ol"
          direction={{ xs: 'column', sm: 'row' }}
          aria-label="Etapele verificării"
          sx={{ listStyle: 'none', p: 0, m: 0, mt: 3.5, gap: { xs: 1.5, sm: 1.25 }, alignItems: { sm: 'center' } }}
        >
          {trail.map((item, index) => (
            <Stack
              key={item.label}
              component="li"
              direction="row"
              sx={{ alignItems: 'center', gap: 1.25, minWidth: 0, flex: index < trail.length - 1 ? { sm: 1 } : 'none' }}
            >
              {item.node}
              <Typography sx={{ fontSize: '0.86rem', fontWeight: 600, color: TOKENS.ink, whiteSpace: 'nowrap' }}>
                {item.label}
              </Typography>
              {index < trail.length - 1 && (
                <Box
                  aria-hidden
                  sx={{ display: { xs: 'none', sm: 'block' }, flex: 1, minWidth: 12, height: '1px', backgroundColor: TOKENS.border }}
                />
              )}
            </Stack>
          ))}
        </Stack>
      </Box>

      {hasDocuments && (
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, borderTop: `1px solid ${TOKENS.border}` }}>
          {documents.map((doc, index) => (
            <DocumentRow
              key={doc.category}
              doc={doc}
              first={index === 0}
              onReupload={() => onReupload(doc.category)}
            />
          ))}
        </Box>
      )}

      {(continueLabel || mode !== 'correction' || rejected.length === 0) && (
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
            px: { xs: 2.5, sm: 4 },
            py: 2,
            borderTop: `1px solid ${TOKENS.border}`,
          }}
        >
          {mode === 'correction' && rejected.length === 0 && (
            <Button variant="contained" onClick={onOpenStep} sx={{ fontWeight: 700 }}>
              Corectează
            </Button>
          )}
          {mode !== 'correction' && continueLabel && (
            <Button
              variant="contained"
              onClick={onContinue}
              endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />}
              sx={{ fontWeight: 700 }}
            >
              {continueLabel}
            </Button>
          )}
          {mode !== 'correction' && (
            <Button onClick={onOpenStep} sx={{ color: TOKENS.textMuted, fontWeight: 600 }}>
              Vezi răspunsurile
            </Button>
          )}
        </Stack>
      )}
    </Paper>
  )
}

/** Un punct de pe traseu. Starea se citește din iconiță, nu doar din culoare. */
function TrailNode({ tone, icon }: { tone: Tone; icon: ReactNode }) {
  const colors = stateColors(tone)

  return (
    <Box
      aria-hidden
      sx={{
        width: 28,
        height: 28,
        flexShrink: 0,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        color: colors.fg,
        backgroundColor: tone === 'neutral' ? 'transparent' : colors.bg,
        border: `1px solid ${tone === 'neutral' ? TOKENS.border : 'transparent'}`,
        fontSize: '0.78rem',
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {icon}
    </Box>
  )
}

function DocumentRow({ doc, first, onReupload }: { doc: ReviewDocument; first: boolean; onReupload: () => void }) {
  const status = DOC_STATUS[doc.status]
  const colors = stateColors(status.tone)
  const isRejected = doc.status === 'rejected'

  return (
    <Box
      component="li"
      sx={{
        px: { xs: 2.5, sm: 4 },
        py: 1.75,
        borderTop: first ? 'none' : `1px solid ${TOKENS.border}`,
        backgroundColor: isRejected ? colors.bg : 'transparent',
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
        <DescriptionOutlinedIcon sx={{ fontSize: 20, flexShrink: 0, color: isRejected ? colors.fg : TOKENS.textMuted }} />
        <Typography sx={{ flex: 1, minWidth: 0, fontSize: '0.92rem', fontWeight: 600, color: TOKENS.ink }}>
          {doc.label}
        </Typography>
        <Typography sx={{ flexShrink: 0, fontSize: '0.82rem', fontWeight: 700, color: colors.fg, whiteSpace: 'nowrap' }}>
          {status.label}
        </Typography>
      </Stack>

      {isRejected && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          sx={{ alignItems: { sm: 'center' }, gap: 1.5, mt: 1.25, pl: { sm: 4.25 } }}
        >
          <Typography sx={{ flex: 1, minWidth: 0, fontSize: '0.88rem', lineHeight: 1.55, color: TOKENS.ink }}>
            {doc.note ?? 'Încarcă din nou documentul.'}
          </Typography>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={onReupload}
            sx={{ flexShrink: 0, alignSelf: { xs: 'flex-start', sm: 'center' }, fontWeight: 700 }}
          >
            Reîncarcă
          </Button>
        </Stack>
      )}
    </Box>
  )
}

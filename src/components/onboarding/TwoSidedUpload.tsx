import { Box, Stack, Typography } from '@mui/material'
import { useState } from 'react'

import { TOKENS } from './onboardingTheme'
import { UploadField } from './UploadField'

const isPdf = (file: File) => file.type === 'application/pdf'

/**
 * Documentele care au date pe ambele fețe: CIV, permis, atestat.
 *
 * Înainte exista o singură zonă de upload care cerea două poze *deodată* și refuza o singură
 * imagine cu mesajul „alege două poze deodată". Selecția multiplă dintr-un file picker nu e
 * evidentă pentru nimeni — pe telefon, unde se fac de fapt pozele, de multe ori nici nu e
 * posibilă. Rezultatul: oameni blocați pe un ecran care le spunea că greșesc.
 *
 * Aici sunt două casete, față și verso, fiecare cu o singură poză. Cine are deja un PDF cu ambele
 * fețe îl pune în oricare dintre ele și gata — PDF-ul ține loc de document întreg, a doua casetă
 * nu se mai cere.
 *
 * Fluxul rămâne neatins: încărcarea pornește singură când documentul e complet, exact ca înainte,
 * iar ecranul avansează automat. Nu apare niciun buton în plus.
 */
export function TwoSidedUpload({
  label,
  hint,
  disabled,
  onComplete,
}: {
  label: string
  /** Ce trebuie să se vadă în document — se repetă pe ambele casete. */
  hint?: string
  disabled?: boolean
  /** Documentul e complet: o singură imagine per față, sau un PDF cu ambele. */
  onComplete: (files: File[]) => void
}) {
  const [front, setFront] = useState<File | null>(null)
  const [back, setBack] = useState<File | null>(null)

  /**
   * Se apelează pentru fiecare casetă. Trei cazuri, în ordinea în care contează:
   *
   * 1. un PDF — documentul e întreg, pleacă imediat;
   * 2. două sau mai multe imagini deodată — selecția multiplă continuă să funcționeze pentru
   *    cine o știe, se împart pe cele două casete;
   * 3. o imagine — se așază pe caseta ei și așteaptă cealaltă față.
   */
  const pick = (side: 'front' | 'back') => (picked: File[]) => {
    if (picked.length === 0) return

    const pdf = picked.find(isPdf)
    if (pdf) {
      setFront(pdf)
      setBack(null)
      onComplete([pdf])
      return
    }

    const [first, second] = picked
    const nextFront = side === 'front' || second !== undefined ? first : front
    const nextBack = side === 'back' ? (second !== undefined ? second : first) : (second ?? back)

    setFront(nextFront)
    setBack(nextBack)

    if (nextFront && nextBack) onComplete([nextFront, nextBack])
  }

  /** Ștergerea din previzualizare: caseta rămâne goală, documentul nu mai e complet. */
  const clear = (side: 'front' | 'back') => (remaining: File[]) => {
    const kept = remaining[0] ?? null
    if (side === 'front') setFront(kept)
    else setBack(kept)
  }

  // Un PDF acoperă ambele fețe: a doua casetă n-ar mai avea ce cere.
  const pdfCoversBothSides = front !== null && isPdf(front)

  return (
    <Stack spacing={1.5}>
      <Stack spacing={0.5}>
        {hint && (
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: TOKENS.ink }}>
            {hint}
          </Typography>
        )}
        <Typography sx={{ fontSize: '0.85rem', color: TOKENS.textMuted }}>
          {label} are date pe ambele fețe: încarcă-le separat, câte una în fiecare casetă. Dacă ai
          deja un PDF cu ambele fețe, pune-l în prima casetă și e de ajuns.
        </Typography>
        <Typography sx={{ fontSize: '0.78rem', color: TOKENS.textMuted }}>
          JPG, PNG sau PDF · maximum 10 MB
        </Typography>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: { xs: '1fr', sm: pdfCoversBothSides ? '1fr' : '1fr 1fr' },
        }}
      >
        <UploadField
          label={pdfCoversBothSides ? 'PDF cu ambele fețe' : 'Față'}
          files={front ? [front] : []}
          onFilesChange={clear('front')}
          onPick={pick('front')}
          disabled={disabled}
        />

        {!pdfCoversBothSides && (
          <UploadField
            label="Verso"
            files={back ? [back] : []}
            onFilesChange={clear('back')}
            onPick={pick('back')}
            disabled={disabled}
          />
        )}
      </Box>

      {/* Starea documentului, în cuvinte: altfel nu se vede de ce încă nu s-a întâmplat nimic. */}
      {!pdfCoversBothSides && (front === null) !== (back === null) && (
        <Typography role="status" aria-live="polite" sx={{ fontSize: '0.82rem', color: TOKENS.pending }}>
          Mai lipsește {front === null ? 'fața' : 'versoul'}. Încărcarea pornește singură când ai
          ambele.
        </Typography>
      )}
    </Stack>
  )
}

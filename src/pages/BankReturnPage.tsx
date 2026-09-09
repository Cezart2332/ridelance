import { useEffect, useState } from 'react'
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'

import { bankService } from '../services/bank.service'
import { TOKENS } from '../constants/tokens'

/**
 * Unde aterizează utilizatorul după ce autorizează la bancă.
 *
 * Autorizarea se deschide într-o filă nouă, deci pagina asta apare de obicei acolo, nu peste
 * ecranul din care a plecat. Rolul ei e mic și fix: să confirme că s-a întors și să întrebe
 * serverul o dată — întrebarea e chiar cea care finalizează conexiunea, așa că fila care a rămas
 * în urmă găsește treaba făcută la următorul ei ciclu de verificare.
 *
 * Nu redirecționează nicăieri: ecranul din care a pornit conectarea (dashboard sau înrolare) e în
 * cealaltă filă și își continuă singur firul. O navigare de aici ar deschide un al doilea exemplar
 * al aplicației, într-o filă pe care oricum o închide.
 */
export default function BankReturnPage() {
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false

    bankService
      .getConnection()
      .then(() => {
        if (!cancelled) setDone(true)
      })
      .catch(() => {
        // Chiar dacă întrebarea eșuează, fila cealaltă reîntreabă din patru în patru secunde.
        if (!cancelled) setDone(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Stack
      spacing={2.5}
      sx={{
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
        textAlign: 'center',
        backgroundColor: TOKENS.surface,
      }}
    >
      {done ? (
        <Box sx={{ color: '#10b981' }}>
          <CheckCircleRoundedIcon sx={{ fontSize: 56 }} />
        </Box>
      ) : (
        <CircularProgress sx={{ color: TOKENS.primary }} />
      )}

      <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: TOKENS.ink }}>
        {done ? 'Gata, am primit confirmarea' : 'Verificăm confirmarea băncii…'}
      </Typography>

      <Typography sx={{ color: TOKENS.textMuted, maxWidth: 420 }}>
        {done
          ? 'Poți închide fila asta și continua în RIDElance — fereastra din care ai plecat se actualizează singură.'
          : 'Durează câteva secunde.'}
      </Typography>

      {done && (
        <Button
          onClick={() => window.close()}
          variant="outlined"
          sx={{
            borderRadius: `${TOKENS.radius.full}px`,
            textTransform: 'none',
            fontWeight: 700,
            color: TOKENS.ink,
            borderColor: TOKENS.borderHover,
          }}
        >
          Închide fila
        </Button>
      )}
    </Stack>
  )
}

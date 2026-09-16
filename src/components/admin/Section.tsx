import { Box, Divider, Paper, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

/**
 * Un bloc de conținut: titlu, o acțiune opțională, conținut.
 *
 * `flush` scoate padding-ul de pe conținut, pentru liste care merg cap la cap (rândurile își
 * pun singure padding-ul). `bare` scoate cu totul Paper-ul, ca să nu ajungem cu Paper în Paper
 * atunci când secțiunea stă deja într-o suprafață.
 */
export function Section({
  title,
  action,
  children,
  flush = false,
  bare = false,
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
  flush?: boolean
  bare?: boolean
}) {
  const header = title && (
    <>
      <Stack
        direction="row"
        sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, px: 2.5, pt: 2.5, pb: 2 }}
      >
        <Typography variant="h2">{title}</Typography>
        {action}
      </Stack>
      {flush && <Divider />}
    </>
  )

  const body = (
    <>
      {header}
      <Box sx={{ px: flush ? 0 : 2.5, pb: flush ? 0 : 2.5, pt: title ? 0 : flush ? 0 : 2.5 }}>
        {children}
      </Box>
    </>
  )

  return bare ? <Box component="section">{body}</Box> : <Paper component="section">{body}</Paper>
}

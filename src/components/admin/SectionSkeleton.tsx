import { Skeleton, Stack } from '@mui/material'

/**
 * Ocupă exact înălțimea conținutului final, ca layout-ul să nu sară când sosesc datele
 * (CLS 0). Nu folosim un spinner centrat pe toată pagina — nu spune ce se încarcă.
 */
export function SectionSkeleton({ rows = 3, rowHeight = 44 }: { rows?: number; rowHeight?: number }) {
  return (
    <Stack spacing={1} sx={{ p: 2.5 }}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} variant="rounded" height={rowHeight} />
      ))}
    </Stack>
  )
}

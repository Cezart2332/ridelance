import { Box, Container, Stack } from '@mui/material'
import { SectionHeader } from '../components/common/SectionHeader'
import { OfficeBookingCalendar } from '../components/office/OfficeBookingCalendar'
import { pageFrameSx } from '../constants/layout'

export function ProgramarePage() {
  return (
    <Box sx={pageFrameSx}>
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <SectionHeader
            title="Programează o vizită la biroul RIDElance"
            subtitle="Vino să ne cunoaștem: alege ziua și ora care ți se potrivesc, completează datele tale, iar noi te așteptăm la birou cu răspunsuri la toate întrebările."
          />
          <OfficeBookingCalendar />
        </Stack>
      </Container>
    </Box>
  )
}

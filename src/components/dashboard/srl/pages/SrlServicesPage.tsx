import { useState } from 'react'
import { Box, Tab, Tabs } from '@mui/material'

import { InsuranceTab } from '../../sections/InsuranceTab'
import { ServiciiTab } from '../../sections/ServiciiTab'
import { DASHBOARD_TOKENS } from '../../dashboardTheme'

/**
 * Serviciile disponibile unui SRL (spec §3.2).
 *
 * La PFA, Servicii e o categorie cu patru pagini. Aici sunt două, iar două pagini nu justifică o
 * categorie în meniu: ar fi însemnat un grup care se deschide ca să arate două linii. Tab-uri
 * peste un panou lat spun același lucru cu un click mai puțin.
 *
 * Ambele tab-uri sunt componentele PFA, nu copii: `ServiciiTab` filtrează catalogul după tipul
 * de cont, `InsuranceTab` e identică.
 */

const TABS = [
  { id: 'individuale', label: 'Servicii individuale' },
  { id: 'asigurari', label: 'Asigurări' },
] as const

export function SrlServicesPage() {
  const [active, setActive] = useState<(typeof TABS)[number]['id']>('individuale')

  return (
    <Box sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <Tabs
        value={active}
        onChange={(_, value: (typeof TABS)[number]['id']) => setActive(value)}
        sx={{
          mb: 3,
          minHeight: 0,
          borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`,
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '0.9rem',
            minHeight: 44,
            color: DASHBOARD_TOKENS.textMuted,
            '&.Mui-selected': { color: DASHBOARD_TOKENS.primaryStrong },
          },
        }}
      >
        {TABS.map((tab) => (
          <Tab key={tab.id} value={tab.id} label={tab.label} />
        ))}
      </Tabs>

      {active === 'individuale' ? <ServiciiTab ownerType="Srl" /> : <InsuranceTab />}
    </Box>
  )
}

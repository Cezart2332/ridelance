import { Box, Tab, Tabs } from '@mui/material'
import { useSearchParams } from 'react-router-dom'

export interface PageTab {
  /** Apare în URL (`?tab=documente`), deci se păstrează la refresh și se poate trimite pe chat. */
  value: string
  label: string
}

/**
 * Sub-view-urile paginii. Fără pilule și fără fundal: tabul activ se distinge prin culoarea
 * textului și indicatorul de 2px, atât.
 *
 * E hook, nu componentă, fiindcă apelantul are nevoie și de tabul activ, nu doar de bara de
 * taburi. Numele contează: cu React Compiler pornit, o funcție `PascalCase` care cheamă hook-uri
 * e compilată ca o componentă (primește propriul `useMemoCache`), iar apelul ei direct din corpul
 * altei componente rupe ordinea hook-urilor — exact eroarea React #311.
 */
export function usePageTabs({
  tabs,
  paramName = 'tab',
}: {
  tabs: PageTab[]
  paramName?: string
}): [string, React.ReactElement] {
  const [searchParams, setSearchParams] = useSearchParams()

  const fromUrl = searchParams.get(paramName)
  const active = tabs.some((t) => t.value === fromUrl) ? fromUrl! : tabs[0].value

  const element = (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs
        value={active}
        onChange={(_, next: string) => {
          const params = new URLSearchParams(searchParams)
          params.set(paramName, next)
          setSearchParams(params, { replace: true })
        }}
        textColor="inherit"
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{
          '& .MuiTab-root': { color: 'text.secondary' },
          '& .Mui-selected': { color: 'text.primary' },
        }}
      >
        {tabs.map((tab) => (
          <Tab key={tab.value} value={tab.value} label={tab.label} />
        ))}
      </Tabs>
    </Box>
  )

  return [active, element]
}

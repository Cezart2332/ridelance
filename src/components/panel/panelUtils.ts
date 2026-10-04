import { useState } from 'react'

/** Tonurile insignelor și barelor: aceleași cinci peste tot. */
export type PanelTone = 'green' | 'yellow' | 'red' | 'blue' | 'gray'

export const tone = (name: PanelTone) => ({
  bg: `var(--rl-${name}-bg)`,
  border: `var(--rl-${name}-border)`,
  text: `var(--rl-${name}-text)`,
  dot: `var(--rl-${name}-dot)`,
})

export const PAGE_SIZES = [12, 24, 48]

export function usePaged<T>(rows: T[], initialSize = PAGE_SIZES[0]) {
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(initialSize)
  const pages = Math.max(1, Math.ceil(rows.length / size))
  const current = Math.min(page, pages - 1)
  return {
    rows: rows.slice(current * size, current * size + size),
    pager: {
      page: current,
      pages,
      size,
      total: rows.length,
      setPage,
      setSize: (next: number) => {
        setSize(next)
        setPage(0)
      },
    },
  }
}

export type Pager = ReturnType<typeof usePaged>['pager']

/** Stilul tabelelor din panou: antet discret, rânduri de 52 px. */
export const panelTableSx = {
  '& .MuiTableCell-root': { borderColor: 'var(--rl-border)', py: 1, px: 1.5, fontSize: 13 },
  '& .MuiTableCell-head': { height: 40, py: 0, bgcolor: 'var(--rl-card)', color: 'var(--rl-text-muted)', fontWeight: 600, fontSize: 12 },
  '& .MuiTableBody-root .MuiTableRow-root': { height: 52 },
  '& .MuiTableBody-root .MuiTableRow-root:hover': { bgcolor: 'var(--rl-hover)' },
} as const

/** Tab-urile ca în shadcn/ui: o bandă discretă, tab-ul ales ridicat ca o pastilă. */
export const segmentedTabsSx = {
  minHeight: 38,
  p: '4px',
  borderRadius: '9px',
  bgcolor: 'var(--rl-muted)',
  border: '1px solid var(--rl-border)',
  width: 'fit-content',
  maxWidth: '100%',
  '& .MuiTabs-indicator': { display: 'none' },
  '& .MuiTab-root': { minHeight: 30, height: 30, px: 1.5, borderRadius: '6px', fontSize: 13, fontWeight: 500, color: 'var(--rl-text-muted)' },
  '& .MuiTab-root.Mui-selected': { bgcolor: 'var(--rl-card)', color: 'var(--rl-fg)', fontWeight: 600, boxShadow: '0 1px 2px rgba(0,0,0,0.25)' },
  '& .MuiTabs-scrollButtons': { width: 28 },
} as const

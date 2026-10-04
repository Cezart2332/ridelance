import { useId, useState, type MouseEvent, type ReactNode } from 'react'
import { Box, ButtonBase, Drawer, IconButton, InputAdornment, Menu, MenuItem, Stack, TextField, Typography } from '@mui/material'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import WestRoundedIcon from '@mui/icons-material/WestRounded'

import { PAGE_SIZES, tone, type Pager, type PanelTone } from './panelUtils'

// ─── Titlu și cifre ──────────────────────────────────────────────────────────────────────────

export function PageHeading({ title, status, actions }: { title: ReactNode; status?: ReactNode; actions?: ReactNode }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ mb: 2.5, gap: 1.5, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.25, minWidth: 0, flexWrap: 'wrap' }}>
        <Typography component="h1" sx={{ m: 0, fontSize: 20, fontWeight: 650, letterSpacing: '-0.025em', color: 'var(--rl-fg)' }}>
          {title}
        </Typography>
        {status}
      </Stack>
      {actions && <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>{actions}</Stack>}
    </Stack>
  )
}

export function StatGrid({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(4, minmax(0, 1fr))' }, gap: 1.5, mb: 2 }}>
      {children}
    </Box>
  )
}

/** O cifră cu eticheta ei; cu `onClick` devine filtru. */
export function StatCard({ label, value, toneName, active, onClick }: { label: string; value: ReactNode; toneName?: PanelTone; active?: boolean; onClick?: () => void }) {
  const content = (
    <>
      <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'var(--rl-text-muted)' }}>{label}</Typography>
      <Typography sx={{ fontSize: 24, fontWeight: 650, lineHeight: 1.1, letterSpacing: '-0.035em', color: toneName && toneName !== 'gray' ? tone(toneName).text : 'var(--rl-fg)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
    </>
  )
  const sx = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: 2,
    minHeight: 96,
    p: 2,
    textAlign: 'left',
    borderRadius: '10px',
    border: '1px solid',
    borderColor: active ? 'var(--rl-border-strong)' : 'var(--rl-border)',
    bgcolor: active ? 'var(--rl-card)' : 'var(--rl-card-alt)',
    fontFamily: 'inherit',
  } as const
  return onClick ? (
    <ButtonBase onClick={onClick} aria-pressed={active} sx={{ ...sx, '&:hover': { bgcolor: 'var(--rl-card)' } }}>
      {content}
    </ButtonBase>
  ) : (
    <Box sx={sx}>{content}</Box>
  )
}

// ─── Panoul cu tabel ─────────────────────────────────────────────────────────────────────────

export function DataPanel({ toolbar, children, footer }: { toolbar?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <Box sx={{ bgcolor: 'var(--rl-card)', border: '1px solid var(--rl-border)', borderRadius: '10px', minWidth: 0, overflow: 'hidden' }}>
      {toolbar && (
        <Stack direction={{ xs: 'column', md: 'row' }} sx={{ minHeight: 52, minWidth: 0, px: 1.5, py: 1.25, gap: 1, flexWrap: { xs: 'nowrap', md: 'wrap' }, alignItems: { md: 'center' }, borderBottom: '1px solid var(--rl-border)' }}>
          {toolbar}
        </Stack>
      )}
      {children}
      {footer && (
        <Stack direction="row" sx={{ minHeight: 44, px: 1.5, gap: 1, alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--rl-border)', color: 'var(--rl-text-muted)', fontSize: 12, flexWrap: 'wrap' }}>
          {footer}
        </Stack>
      )}
    </Box>
  )
}

export function SearchField({ value, onChange, placeholder, label }: { value: string; onChange: (value: string) => void; placeholder: string; label?: string }) {
  return (
    <TextField
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      sx={{ width: { xs: '100%', md: 300 }, maxWidth: '100%', minWidth: 0, flexShrink: 0, '& .MuiOutlinedInput-root': { height: 34 } }}
      slotProps={{
        htmlInput: { 'aria-label': label ?? placeholder },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon sx={{ fontSize: 16, color: 'var(--rl-text-subtle)' }} />
            </InputAdornment>
          ),
        },
      }}
    />
  )
}

export interface FilterTab<T extends string> {
  value: T
  label: string
  count?: number
  toneName?: PanelTone
}

/** Filtrele de deasupra tabelului, cu numărul de rânduri din fiecare. */
export function FilterTabs<T extends string>({ items, value, onChange, label = 'Filtru' }: { items: FilterTab<T>[]; value: T; onChange: (value: T) => void; label?: string }) {
  return (
    <Stack direction="row" role="group" aria-label={label} sx={{ gap: 0.5, overflowX: 'auto', minWidth: 0, flexShrink: 0, maxWidth: '100%' }}>
      {items.map((item) => {
        const selected = item.value === value
        return (
          <ButtonBase
            key={item.value}
            aria-label={item.count === undefined ? item.label : `${item.label} (${item.count})`}
            aria-pressed={selected}
            onClick={() => onChange(item.value)}
            sx={{
              height: 32,
              px: 1.25,
              gap: 0.75,
              borderRadius: '7px',
              border: '1px solid',
              borderColor: selected ? 'var(--rl-border-strong)' : 'transparent',
              bgcolor: selected ? 'var(--rl-muted)' : 'transparent',
              color: selected ? 'var(--rl-fg)' : 'var(--rl-text-subtle)',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              '&:hover': { color: 'var(--rl-fg-soft)', bgcolor: selected ? 'var(--rl-muted)' : 'var(--rl-input)' },
            }}
          >
            {item.toneName && <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: tone(item.toneName).dot }} />}
            {item.label}
            {item.count !== undefined && (
              <Box component="span" sx={{ color: selected ? 'var(--rl-text-muted)' : 'var(--rl-text-subtle)', fontVariantNumeric: 'tabular-nums' }}>
                {item.count}
              </Box>
            )}
          </ButtonBase>
        )
      })}
    </Stack>
  )
}

/** Insignă: bulină și un cuvânt, pe tonul stării. */
export function Badge({ toneName = 'gray', children, title }: { toneName?: PanelTone; children: ReactNode; title?: string }) {
  const colors = tone(toneName)
  return (
    <Box
      component="span"
      title={title}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.625,
        px: 1,
        py: '3px',
        borderRadius: 999,
        border: '1px solid',
        borderColor: colors.border,
        bgcolor: colors.bg,
        color: colors.text,
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1.3,
        whiteSpace: 'nowrap',
      }}
    >
      <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: colors.dot, flexShrink: 0 }} />
      {children}
    </Box>
  )
}

export function Initials({ name, size = 28 }: { name: string; size?: number }) {
  const letters = name
    .replace(/\bPFA\b/gi, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
        borderRadius: '50%',
        border: '1px solid var(--rl-border-strong)',
        background: 'linear-gradient(135deg, var(--rl-muted), var(--rl-card-alt))',
        color: 'var(--rl-fg)',
        fontSize: size * 0.34,
        fontWeight: 700,
      }}
    >
      {letters || '?'}
    </Box>
  )
}

/** Celula cu numele: inițiale, numele și o linie scurtă (CUI · email). */
export function PersonCell({ name, meta }: { name: string; meta?: ReactNode }) {
  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 1.25, minWidth: 200 }}>
      <Initials name={name} />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'var(--rl-fg)', lineHeight: 1.3 }}>{name}</Typography>
        {meta && <Typography sx={{ fontSize: 11, color: 'var(--rl-text-subtle)', lineHeight: 1.4 }}>{meta}</Typography>}
      </Box>
    </Stack>
  )
}

export interface RowAction {
  label: string
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}

/** Butonul „•••” de la capătul rândului, cu acțiunile lui. */
export function RowActions({ actions, label = 'Acțiuni' }: { actions: RowAction[]; label?: string }) {
  const menuId = useId()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const open = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setAnchor(event.currentTarget)
  }
  return (
    <>
      <IconButton size="small" aria-label={label} aria-haspopup="menu" aria-expanded={anchor !== null} aria-controls={anchor ? menuId : undefined} onClick={open} onKeyDown={(event) => event.stopPropagation()}>
        <MoreHorizRoundedIcon sx={{ fontSize: 18 }} />
      </IconButton>
      <Menu
        id={menuId}
        anchorEl={anchor}
        open={anchor !== null}
        onClose={() => setAnchor(null)}
        onClick={(event) => event.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 200 } } }}
      >
        {actions.map((action) => (
          <MenuItem
            key={action.label}
            disabled={action.disabled}
            onClick={() => {
              setAnchor(null)
              action.onClick()
            }}
            sx={action.danger ? { color: 'var(--rl-red-text)' } : undefined}
          >
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

// ─── Paginare ────────────────────────────────────────────────────────────────────────────────

function pageNumbers(page: number, pages: number): (number | null)[] {
  if (pages <= 5) return Array.from({ length: pages }, (_, index) => index)
  const around = [page - 1, page, page + 1].filter((index) => index > 0 && index < pages - 1)
  const list: (number | null)[] = [0]
  if (around[0] > 1) list.push(null)
  list.push(...around)
  if (around[around.length - 1] < pages - 2) list.push(null)
  list.push(pages - 1)
  return list
}

const pageButton = {
  minWidth: 28,
  height: 28,
  px: 0.75,
  borderRadius: '6px',
  border: '1px solid transparent',
  color: 'var(--rl-fg-soft)',
  fontFamily: 'inherit',
  fontSize: 12,
  fontVariantNumeric: 'tabular-nums',
  '&:hover': { bgcolor: 'var(--rl-muted)' },
  '&.Mui-disabled': { color: 'var(--rl-text-subtle)', opacity: 0.5 },
} as const

export function TablePager({ pager, label = 'rânduri' }: { pager: Pager; label?: string }) {
  const sizeId = useId()
  if (pager.total === 0) return null
  const from = pager.page * pager.size + 1
  const to = Math.min(pager.total, from + pager.size - 1)
  return (
    <>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
        <Box component="label" htmlFor={sizeId} sx={{ display: { xs: 'none', sm: 'inline' } }}>
          Rânduri pe pagină
        </Box>
        <Box
          component="select"
          id={sizeId}
          aria-label="Rânduri pe pagină"
          value={pager.size}
          onChange={(event) => pager.setSize(Number((event.target as HTMLSelectElement).value))}
          sx={{ height: 28, px: 1, borderRadius: '6px', border: '1px solid var(--rl-border-strong)', bgcolor: 'var(--rl-input)', color: 'var(--rl-fg-soft)', fontFamily: 'inherit', fontSize: 12 }}
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Box>
      </Stack>
      <Stack direction="row" component="nav" aria-label="Paginare" sx={{ alignItems: 'center', gap: 0.5 }}>
        <Box component="span" sx={{ mr: 1, fontVariantNumeric: 'tabular-nums' }}>
          {from} – {to} din {pager.total} {label}
        </Box>
        <ButtonBase aria-label="Pagina anterioară" disabled={pager.page === 0} onClick={() => pager.setPage(pager.page - 1)} sx={{ ...pageButton, borderColor: 'var(--rl-border)', bgcolor: 'var(--rl-input)' }}>
          <ChevronLeftRoundedIcon sx={{ fontSize: 16 }} />
        </ButtonBase>
        {pageNumbers(pager.page, pager.pages).map((index, position) =>
          index === null ? (
            <Box key={`gap-${position}`} component="span" sx={{ px: 0.5 }}>
              …
            </Box>
          ) : (
            <ButtonBase
              key={index}
              aria-current={index === pager.page ? 'page' : undefined}
              onClick={() => pager.setPage(index)}
              sx={{ ...pageButton, display: { xs: index === pager.page ? 'inline-flex' : 'none', sm: 'inline-flex' }, ...(index === pager.page ? { bgcolor: 'var(--rl-muted)', borderColor: 'var(--rl-border-strong)', color: 'var(--rl-fg)' } : {}) }}
            >
              {index + 1}
            </ButtonBase>
          ),
        )}
        <ButtonBase aria-label="Pagina următoare" disabled={pager.page >= pager.pages - 1} onClick={() => pager.setPage(pager.page + 1)} sx={{ ...pageButton, borderColor: 'var(--rl-border)', bgcolor: 'var(--rl-input)' }}>
          <ChevronRightRoundedIcon sx={{ fontSize: 16 }} />
        </ButtonBase>
      </Stack>
    </>
  )
}

// ─── Fișa unui client ────────────────────────────────────────────────────────────────────────

export function BackLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <ButtonBase onClick={onClick} sx={{ gap: 0.75, mb: 1.75, color: 'var(--rl-text-muted)', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, '&:hover': { color: 'var(--rl-fg)' } }}>
      <WestRoundedIcon sx={{ fontSize: 14 }} />
      {children}
    </ButtonBase>
  )
}

export function PanelCard({ title, actions, children, sx }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; sx?: object }) {
  return (
    <Box component="section" sx={{ bgcolor: 'var(--rl-card)', border: '1px solid var(--rl-border)', borderRadius: '10px', p: 2, minWidth: 0, ...sx }}>
      {(title || actions) && (
        <Stack direction="row" sx={{ mb: 1.5, gap: 1, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', minHeight: 24 }}>
          {title && (
            <Typography component="h2" sx={{ m: 0, fontSize: 14, fontWeight: 600, color: 'var(--rl-fg)' }}>
              {title}
            </Typography>
          )}
          {actions}
        </Stack>
      )}
      {children}
    </Box>
  )
}

export function Metric({ label, value, toneName }: { label: string; value: ReactNode; toneName?: PanelTone }) {
  return (
    <Box sx={{ p: 1.5, borderRadius: '8px', border: '1px solid var(--rl-border)', bgcolor: 'var(--rl-card-alt)', minWidth: 0 }}>
      <Typography sx={{ fontSize: 11, color: 'var(--rl-text-muted)' }}>{label}</Typography>
      <Typography sx={{ mt: 0.5, fontSize: 18, fontWeight: 650, letterSpacing: '-0.025em', color: toneName ? tone(toneName).text : 'var(--rl-fg)', fontVariantNumeric: 'tabular-nums', overflowWrap: 'anywhere' }}>
        {value}
      </Typography>
    </Box>
  )
}

export function MetricGrid({ children }: { children: ReactNode }) {
  return <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 1 }}>{children}</Box>
}

/** Bara unui plafon: eticheta, o linie scurtă, suma și cât s-a umplut. */
export function MeterRow({ label, meta, value, ratio, toneName }: { label: string; meta?: ReactNode; value: ReactNode; ratio: number; toneName?: PanelTone }) {
  const width = `${Math.max(0, Math.min(1, ratio)) * 100}%`
  const fill = toneName === 'red' ? 'var(--rl-red-dot)' : toneName === 'yellow' ? 'var(--rl-yellow-dot)' : 'var(--rl-fg-soft)'
  return (
    <Box sx={{ py: 1.5, '& + &': { borderTop: '1px solid var(--rl-border)' } }}>
      <Stack direction="row" sx={{ mb: 1, gap: 1.5, justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'var(--rl-fg)' }}>{label}</Typography>
          {meta && <Typography sx={{ fontSize: 11, color: 'var(--rl-text-subtle)' }}>{meta}</Typography>}
        </Box>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'var(--rl-fg)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{value}</Typography>
      </Stack>
      <Box role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.max(0, Math.min(1, ratio)) * 100)} sx={{ height: 5, borderRadius: 999, bgcolor: 'var(--rl-muted)', overflow: 'hidden' }}>
        <Box sx={{ width, height: '100%', borderRadius: 999, bgcolor: fill, transition: 'width 300ms' }} />
      </Box>
    </Box>
  )
}

/** Rândurile unui calcul: etichetă la stânga, sumă la dreapta, totalul îngroșat. */
export function CalcRows({ rows }: { rows: { label: ReactNode; value: ReactNode; total?: boolean; strong?: boolean }[] }) {
  return (
    <Box component="dl" sx={{ m: 0 }}>
      {rows.map((row, index) => (
        <Stack
          key={index}
          direction="row"
          sx={{
            py: row.total ? 1.25 : 1,
            gap: 2,
            justifyContent: 'space-between',
            borderBottom: row.total ? 0 : '1px solid var(--rl-border)',
            borderTop: row.total ? '1px solid var(--rl-border-strong)' : 0,
            fontSize: row.total ? 14 : 13,
          }}
        >
          <Box component="dt" sx={{ color: row.total || row.strong ? 'var(--rl-fg)' : 'var(--rl-fg-soft)', fontWeight: row.total || row.strong ? 600 : 400 }}>
            {row.label}
          </Box>
          <Box component="dd" sx={{ m: 0, fontWeight: 650, color: 'var(--rl-fg)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            {row.value}
          </Box>
        </Stack>
      ))}
    </Box>
  )
}

/** Sertarul din dreapta (profil fiscal, detalii), cu antet, conținut și butoane jos. */
export function SideSheet({ open, title, onClose, children, actions, width = 560 }: { open: boolean; title: ReactNode; onClose: () => void; children: ReactNode; actions?: ReactNode; width?: number }) {
  const titleId = useId()
  return (
    <Drawer anchor="right" open={open} onClose={onClose} slotProps={{ paper: { role: 'dialog', 'aria-modal': true, 'aria-labelledby': titleId, sx: { width: `min(${width}px, 96vw)`, borderLeft: '1px solid var(--rl-border)', display: 'flex', flexDirection: 'column' } } }}>
      <Stack direction="row" sx={{ px: 2.25, py: 2, gap: 2, alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--rl-border)' }}>
        <Typography id={titleId} component="h2" sx={{ m: 0, fontSize: 16, fontWeight: 650, color: 'var(--rl-fg)' }}>
          {title}
        </Typography>
        <IconButton aria-label="Închide" size="small" onClick={onClose} sx={{ border: '1px solid var(--rl-border-strong)', bgcolor: 'var(--rl-input)' }}>
          <CloseRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Stack>
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2.25, py: 2 }}>{children}</Box>
      {actions && (
        <Stack direction="row" sx={{ px: 2.25, py: 1.5, gap: 1, justifyContent: 'flex-end', borderTop: '1px solid var(--rl-border)' }}>
          {actions}
        </Stack>
      )}
    </Drawer>
  )
}

/** O notă scurtă sub o bară sau un calcul. */
export function Callout({ toneName, children }: { toneName?: PanelTone; children: ReactNode }) {
  const colors = toneName ? tone(toneName) : null
  return (
    <Box sx={{ mt: 1, px: 1.25, py: 1, borderRadius: '8px', border: '1px solid', borderColor: colors?.border ?? 'var(--rl-border)', bgcolor: colors?.bg ?? 'var(--rl-card-alt)', color: colors?.text ?? 'var(--rl-text-muted)', fontSize: 12 }}>
      {children}
    </Box>
  )
}

/** Un rând din „Stare fiscală”: eticheta și valoarea, una sub alta. */
export function FactItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box sx={{ px: 1.25, py: 1, borderRadius: '8px', border: '1px solid var(--rl-border)', bgcolor: 'var(--rl-card-alt)' }}>
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'var(--rl-fg)' }}>{label}</Typography>
      <Typography sx={{ fontSize: 12, color: 'var(--rl-text-muted)' }}>{value}</Typography>
    </Box>
  )
}

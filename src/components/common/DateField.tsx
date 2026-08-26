import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { Box, IconButton, InputAdornment, Popover, Stack, TextField, Typography } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { alpha } from '@mui/material/styles'
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'

import { TOKENS } from '../../constants/tokens'
import { MONTH_CHART_LABELS, ROMANIAN_MONTHS } from '../../utils/monthLabels'
import {
  buildMonthGrid,
  compareParts,
  formatRo,
  parseIso,
  parseRo,
  shiftDay,
  shiftMonth,
  startOfToday,
  toIso,
  yearWindow,
  type DateParts,
} from '../../utils/dateValue'

/**
 * Câmpul de dată al platformei.
 *
 * Înlocuiește `<input type="date">`, care are trei probleme pe care nu le poate rezolva nimeni
 * din CSS: arată complet diferit în fiecare browser, ordinea câmpurilor urmează limba sistemului
 * (un utilizator cu Windows în engleză vede `mm/dd/yyyy` pe un formular românesc), iar pentru o
 * dată depărtată — data nașterii, prima înmatriculare — te obligă să dai lună cu lună.
 *
 * De aici: format românesc fix (`zz.ll.aaaa`), tastare directă pentru cine știe data, calendar
 * pentru cine o caută, și un salt la an/lună pentru cine o caută departe.
 *
 * Valoarea rămâne ISO (`aaaa-ll-zz`), aceeași cu a inputului nativ, ca înlocuirea să nu atingă
 * niciun apel de API și nicio stare de formular.
 */

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'] as const

export interface DateFieldProps {
  /** Data curentă, ISO `aaaa-ll-zz`. Șir gol = necompletat. */
  value: string
  /** Primește tot ISO, sau șir gol la ștergere. */
  onChange: (value: string) => void
  label?: string
  helperText?: ReactNode
  error?: boolean
  required?: boolean
  disabled?: boolean
  fullWidth?: boolean
  size?: 'small' | 'medium'
  sx?: SxProps<Theme>
  /** Limite inclusive, tot ISO. Zilele din afara lor nu se pot alege. */
  minDate?: string
  maxDate?: string
  /** Când câmpul n-are etichetă vizibilă (filtre inline). */
  ariaLabel?: string
  name?: string
  /** Rulează după ce câmpul își normalizează textul — pentru formularele care salvează la blur. */
  onBlur?: () => void
}

export function DateField({
  value,
  onChange,
  label,
  helperText,
  error = false,
  required = false,
  disabled = false,
  fullWidth = false,
  size = 'small',
  sx,
  minDate,
  maxDate,
  ariaLabel,
  name,
  onBlur,
}: DateFieldProps) {
  /**
   * Elementul sub care se deschide calendarul, ținut în stare, nu într-un ref.
   *
   * `Popover` are nevoie de el la randare, iar un ref citit acolo rupe randarea concurentă:
   * React poate abandona un rezultat pe jumătate calculat, iar reful ar fi deja scris.
   */
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)

  /**
   * Ce se vede cât timp se tastează.
   *
   * `null` înseamnă „arată valoarea reală". Un draft separat e singurul mod de a lăsa pe ecran
   * „12.0" — o dată incompletă, deci imposibil de reprezentat în `value`, dar exact ce tocmai a
   * scris omul. Fără el, orice tastă care nu completează o dată validă ar fi ștearsă sub degete.
   */
  const [draft, setDraft] = useState<string | null>(null)

  const selected = parseIso(value)
  const today = startOfToday()

  /** Luna deschisă în popover. Se așază la deschidere, nu printr-un efect care ar urmări `value`. */
  const [view, setView] = useState<{ year: number; month: number }>(
    () => selected ?? { year: today.year, month: today.month },
  )
  const [picking, setPicking] = useState<'day' | 'month' | 'year'>('day')

  /** Ziua pe care stă tastatura. Enter o alege; săgețile o mută. */
  const [focused, setFocused] = useState<DateParts>(() => selected ?? today)

  const min = parseIso(minDate)
  const max = parseIso(maxDate)

  const isBlocked = (parts: DateParts) =>
    (min !== null && compareParts(parts, min) < 0) || (max !== null && compareParts(parts, max) > 0)

  /**
   * Aduce anul ales în dreptul ochiului când se deschide lista.
   *
   * Ref de callback, nu efect: se declanșează la montarea celulei — adică exact la intrarea în
   * modul „an" — și identitatea lui e stabilă, deci nu se re-execută la fiecare randare și nu
   * smulge lista de sub degetul care derulează.
   */
  const revealSelectedYear = useCallback((element: HTMLElement | null) => {
    element?.scrollIntoView({ block: 'center' })
  }, [])

  const grid = useMemo(() => buildMonthGrid(view.year, view.month), [view.year, view.month])

  const openPicker = () => {
    if (disabled) return
    const anchorDate = selected ?? today
    setView({ year: anchorDate.year, month: anchorDate.month })
    setFocused(anchorDate)
    setPicking('day')
    setOpen(true)
  }

  const commit = (parts: DateParts) => {
    if (isBlocked(parts)) return
    setDraft(null)
    onChange(toIso(parts))
    setOpen(false)
  }

  const handleTyping = (text: string) => {
    setDraft(text)

    if (text.trim() === '') {
      onChange('')
      return
    }

    const iso = parseRo(text)
    if (iso && !isBlocked(parseIso(iso)!)) onChange(iso)
  }

  /**
   * La ieșirea din câmp, ce s-a tastat sau se transformă în dată, sau dispare.
   *
   * Un „12.0" rămas pe ecran ar arăta ca o valoare completată, iar formularul s-ar trimite cu
   * altceva decât se vede.
   */
  const handleBlur = () => {
    setDraft(null)
    onBlur?.()
  }

  const moveFocus = (next: DateParts) => {
    setFocused(next)
    if (next.year !== view.year || next.month !== view.month) {
      setView({ year: next.year, month: next.month })
    }
  }

  const handleGridKeys = (event: React.KeyboardEvent) => {
    const keyed: Record<string, () => DateParts> = {
      ArrowLeft: () => shiftDay(focused, -1),
      ArrowRight: () => shiftDay(focused, 1),
      ArrowUp: () => shiftDay(focused, -7),
      ArrowDown: () => shiftDay(focused, 7),
      PageUp: () => shiftMonth(focused, -1),
      PageDown: () => shiftMonth(focused, 1),
      Home: () => ({ ...focused, day: 1 }),
      End: () => ({ ...focused, day: new Date(focused.year, focused.month + 1, 0).getDate() }),
    }

    const move = keyed[event.key]
    if (move) {
      event.preventDefault()
      moveFocus(move())
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      commit(focused)
    }
  }

  const monthShift = (delta: number) => {
    const next = new Date(view.year, view.month + delta, 1)
    setView({ year: next.getFullYear(), month: next.getMonth() })
  }

  const displayed = draft ?? formatRo(value)

  return (
    <>
      <TextField
        ref={setAnchorEl}
        name={name}
        label={label}
        value={displayed}
        onChange={(event) => handleTyping(event.target.value)}
        onBlur={handleBlur}
        placeholder="zz.ll.aaaa"
        helperText={helperText}
        error={error}
        required={required}
        disabled={disabled}
        fullWidth={fullWidth}
        size={size}
        sx={sx}
        slotProps={{
          inputLabel: { shrink: true },
          htmlInput: {
            'aria-label': ariaLabel ?? label,
            inputMode: 'numeric',
            maxLength: 10,
          },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  size="small"
                  disabled={disabled}
                  onClick={openPicker}
                  aria-label={open ? 'Închide calendarul' : 'Deschide calendarul'}
                  sx={{ color: open ? TOKENS.primaryStrong : TOKENS.textMuted }}
                >
                  <CalendarTodayRoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.75,
              p: 1.5,
              width: 300,
              borderRadius: `${TOKENS.radius.lg}px`,
              border: `1px solid ${TOKENS.border}`,
              boxShadow: TOKENS.shadow.xl,
              backgroundColor: TOKENS.paper,
            },
          },
        }}
      >
        {/* ── Cap: luna curentă, cu salt la lună sau an ── */}
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <IconButton
            size="small"
            onClick={() => monthShift(-1)}
            aria-label="Luna anterioară"
            sx={{ color: TOKENS.textMuted }}
          >
            <ChevronLeftRoundedIcon fontSize="small" />
          </IconButton>

          <Stack direction="row" spacing={0.5}>
            <HeaderButton
              active={picking === 'month'}
              onClick={() => setPicking(picking === 'month' ? 'day' : 'month')}
            >
              {ROMANIAN_MONTHS[view.month]}
            </HeaderButton>
            <HeaderButton
              active={picking === 'year'}
              onClick={() => setPicking(picking === 'year' ? 'day' : 'year')}
            >
              {view.year}
            </HeaderButton>
          </Stack>

          <IconButton
            size="small"
            onClick={() => monthShift(1)}
            aria-label="Luna următoare"
            sx={{ color: TOKENS.textMuted }}
          >
            <ChevronRightRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>

        {picking === 'day' && (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.5 }}>
              {WEEKDAYS.map((day) => (
                <Typography
                  key={day}
                  sx={{
                    textAlign: 'center',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    color: TOKENS.textSubtle,
                    textTransform: 'uppercase',
                  }}
                >
                  {day}
                </Typography>
              ))}
            </Box>

            {/*
              Un singur `tabindex` pe grilă, pe ziua focalizată: tastatura intră o dată și se
              plimbă cu săgețile, în loc să treacă prin 42 de opriri de Tab.
            */}
            <Box
              role="grid"
              aria-label="Alege ziua"
              onKeyDown={handleGridKeys}
              sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}
            >
              {grid.map((cell) => {
                const iso = toIso(cell)
                const outside = cell.month !== view.month
                const isSelected = selected !== null && compareParts(cell, selected) === 0
                const isToday = compareParts(cell, today) === 0
                const blocked = isBlocked(cell)
                const hasFocus = compareParts(cell, focused) === 0

                return (
                  <Box
                    key={iso}
                    component="button"
                    type="button"
                    role="gridcell"
                    tabIndex={hasFocus ? 0 : -1}
                    disabled={blocked}
                    aria-selected={isSelected}
                    aria-label={`${cell.day} ${ROMANIAN_MONTHS[cell.month]} ${cell.year}`}
                    onClick={() => commit(cell)}
                    onFocus={() => setFocused(cell)}
                    sx={{
                      aspectRatio: '1',
                      border: 'none',
                      borderRadius: `${TOKENS.radius.md}px`,
                      cursor: blocked ? 'not-allowed' : 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: isSelected || isToday ? 800 : 600,
                      fontVariantNumeric: 'tabular-nums',
                      transition: `background-color 120ms ${TOKENS.easing}`,
                      backgroundColor: isSelected ? TOKENS.primary : 'transparent',
                      color: blocked
                        ? TOKENS.textSubtle
                        : isSelected
                          ? '#FFFFFF'
                          : outside
                            ? TOKENS.textSubtle
                            : TOKENS.ink,
                      opacity: blocked ? 0.45 : 1,
                      // Ziua de azi poartă un inel, nu o umplere: umplerea înseamnă „ales", iar
                      // două zile umplute diferit pe aceeași grilă se citesc ca două selecții.
                      boxShadow:
                        isToday && !isSelected ? `inset 0 0 0 1.5px ${TOKENS.primary}` : 'none',
                      '&:hover': {
                        backgroundColor: isSelected
                          ? TOKENS.primaryStrong
                          : blocked
                            ? 'transparent'
                            : alpha(TOKENS.primary, 0.14),
                      },
                      '&:focus-visible': {
                        outline: `2px solid ${TOKENS.primaryStrong}`,
                        outlineOffset: 1,
                      },
                    }}
                  >
                    {cell.day}
                  </Box>
                )
              })}
            </Box>
          </>
        )}

        {picking === 'month' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.75 }}>
            {MONTH_CHART_LABELS.map((label, index) => (
              <GridChoice
                key={label}
                selected={index === view.month}
                onClick={() => {
                  setView((current) => ({ ...current, month: index }))
                  setPicking('day')
                }}
              >
                {label}
              </GridChoice>
            ))}
          </Box>
        )}

        {picking === 'year' && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 0.75,
              maxHeight: 236,
              overflowY: 'auto',
            }}
          >
            {yearWindow(view.year, min?.year, max?.year).map((year) => (
              <GridChoice
                key={year}
                selected={year === view.year}
                ref={year === view.year ? revealSelectedYear : undefined}
                onClick={() => {
                  setView((current) => ({ ...current, year }))
                  setPicking('day')
                }}
              >
                {year}
              </GridChoice>
            ))}
          </Box>
        )}

        {/* ── Subsol: cele două acțiuni care scurtează drumul cel mai des ── */}
        <Stack
          direction="row"
          sx={{
            mt: 1.25,
            pt: 1.25,
            borderTop: `1px solid ${TOKENS.border}`,
            justifyContent: 'space-between',
          }}
        >
          <FooterButton onClick={() => commit(today)} disabled={isBlocked(today)}>
            Azi
          </FooterButton>
          <FooterButton
            onClick={() => {
              setDraft(null)
              onChange('')
              setOpen(false)
            }}
          >
            Șterge
          </FooterButton>
        </Stack>
      </Popover>
    </>
  )
}

/** Luna și anul din cap, ca butoane: se apasă ca să sari, nu doar ca să citești. */
function HeaderButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        border: 'none',
        px: 1.1,
        py: 0.5,
        borderRadius: `${TOKENS.radius.sm}px`,
        cursor: 'pointer',
        fontSize: '0.88rem',
        fontWeight: 800,
        color: active ? TOKENS.primaryStrong : TOKENS.ink,
        backgroundColor: active ? alpha(TOKENS.primary, 0.14) : 'transparent',
        '&:hover': { backgroundColor: alpha(TOKENS.primary, 0.1) },
      }}
    >
      {children}
    </Box>
  )
}

/** O celulă din grila de luni sau de ani. */
function GridChoice({
  selected,
  onClick,
  children,
  ref,
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
  ref?: (element: HTMLElement | null) => void
}) {
  return (
    <Box
      component="button"
      type="button"
      ref={ref}
      onClick={onClick}
      sx={{
        border: 'none',
        py: 1,
        borderRadius: `${TOKENS.radius.md}px`,
        cursor: 'pointer',
        fontSize: '0.82rem',
        fontWeight: selected ? 800 : 600,
        fontVariantNumeric: 'tabular-nums',
        color: selected ? '#FFFFFF' : TOKENS.ink,
        backgroundColor: selected ? TOKENS.primary : 'transparent',
        '&:hover': {
          backgroundColor: selected ? TOKENS.primaryStrong : alpha(TOKENS.primary, 0.14),
        },
      }}
    >
      {children}
    </Box>
  )
}

function FooterButton({
  onClick,
  disabled = false,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      disabled={disabled}
      sx={{
        border: 'none',
        backgroundColor: 'transparent',
        px: 0.5,
        py: 0.25,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '0.8rem',
        fontWeight: 800,
        color: disabled ? TOKENS.textSubtle : TOKENS.primaryStrong,
        '&:hover': { color: disabled ? TOKENS.textSubtle : TOKENS.ink },
      }}
    >
      {children}
    </Box>
  )
}

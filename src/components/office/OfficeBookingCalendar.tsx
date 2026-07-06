import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { TOKENS } from '../../constants/tokens';
import { ROMANIAN_MONTHS } from '../../utils/monthLabels';
import { getErrorMessage } from '../../utils/errorHandler';
import {
  officeService,
  type OfficeDayAvailability,
  type OfficeDaySlots,
} from '../../services/office.service';

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'];

export const OFFICE_ADDRESS = 'Biroul RIDElance, București';
const VISIT_MINUTES = 30;

function toDateKey(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatSelectedDate(dateKey: string) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return `${d} ${ROMANIAN_MONTHS[m - 1]} ${y}`;
}

interface OfficeBookingCalendarProps {
  /** Prefill for logged-in users (PFA dashboard). */
  defaultName?: string;
  defaultEmail?: string;
  defaultPhone?: string;
  /** Compact paddings for embedding inside dashboard tabs. */
  compact?: boolean;
}

export function OfficeBookingCalendar({
  defaultName = '',
  defaultEmail = '',
  defaultPhone = '',
  compact = false,
}: OfficeBookingCalendarProps) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-based
  const [availability, setAvailability] = useState<Map<string, OfficeDayAvailability>>(new Map());
  const [availabilityLoading, setAvailabilityLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [daySlots, setDaySlots] = useState<OfficeDaySlots | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [step, setStep] = useState<'pick' | 'form' | 'done'>('pick');
  const [fullName, setFullName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState(defaultPhone);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // NB: no synchronous setState here — this runs inside an effect.
  const loadAvailability = useCallback((year: number, monthIndex: number) => {
    officeService
      .getAvailability(year, monthIndex + 1)
      .then((data) => {
        setAvailability(new Map(data.days.map((d) => [d.date, d])));
      })
      .catch(() => setAvailability(new Map()))
      .finally(() => setAvailabilityLoading(false));
  }, []);

  useEffect(() => {
    loadAvailability(viewYear, viewMonth);
  }, [loadAvailability, viewYear, viewMonth]);

  const handleSelectDay = (dateKey: string) => {
    setSelectedDate(dateKey);
    setSelectedTime(null);
    setError(null);
    setSlotsLoading(true);
    officeService
      .getDaySlots(dateKey)
      .then(setDaySlots)
      .catch((err) => setError(getErrorMessage(err, 'Nu am putut încărca orele disponibile.')))
      .finally(() => setSlotsLoading(false));
  };

  const handlePrevMonth = () => {
    const prev = new Date(viewYear, viewMonth - 1, 1);
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    if (prev < startOfCurrentMonth) return;
    setAvailabilityLoading(true);
    setViewYear(prev.getFullYear());
    setViewMonth(prev.getMonth());
    setSelectedDate(null);
    setDaySlots(null);
  };

  const handleNextMonth = () => {
    const next = new Date(viewYear, viewMonth + 1, 1);
    setAvailabilityLoading(true);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
    setSelectedDate(null);
    setDaySlots(null);
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) return;
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setError('Completează numele, emailul și numărul de telefon.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await officeService.bookVisit({
        date: selectedDate,
        time: selectedTime,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        reason: reason.trim(),
      });
      setStep('done');
    } catch (err) {
      setError(getErrorMessage(err, 'Nu am putut înregistra programarea. Încearcă din nou.'));
      // The slot may have just been taken — refresh the day.
      if (selectedDate) handleSelectDay(selectedDate);
      setStep('pick');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setStep('pick');
    setSelectedDate(null);
    setSelectedTime(null);
    setDaySlots(null);
    setReason('');
    setError(null);
    loadAvailability(viewYear, viewMonth);
  };

  // ── Month grid (Monday-first) ──
  const weeks = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const leadingBlanks = (firstDay.getDay() + 6) % 7; // Monday = 0
    const cells: (number | null)[] = [
      ...Array.from({ length: leadingBlanks }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [viewYear, viewMonth]);

  const freeSlotTimes = (daySlots?.slots ?? []).filter((s) => s.status === 'free');

  // ── Success state ──
  if (step === 'done' && selectedDate && selectedTime) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: TOKENS.radius.xl,
          border: `1px solid ${TOKENS.border}`,
          textAlign: 'center',
        }}
      >
        <CheckCircleRoundedIcon sx={{ fontSize: 52, color: '#059669', mb: 1.5 }} />
        <Typography sx={{ fontWeight: 850, fontSize: '1.25rem', color: TOKENS.ink }}>
          Programare confirmată
        </Typography>
        <Typography sx={{ color: TOKENS.textMuted, mt: 1, maxWidth: 420, mx: 'auto', lineHeight: 1.6 }}>
          Te așteptăm {formatSelectedDate(selectedDate)}, la ora {selectedTime}, la {OFFICE_ADDRESS}.
          Ți-am rezervat {VISIT_MINUTES} de minute.
        </Typography>
        <Button variant="outlined" onClick={resetAll} sx={{ mt: 3, fontWeight: 700 }}>
          Fă o altă programare
        </Button>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: TOKENS.radius.xl,
        border: `1px solid ${TOKENS.border}`,
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: step === 'form' ? 'minmax(0, 0.9fr) minmax(0, 1.4fr)' : 'minmax(0, 0.9fr) minmax(0, 1.4fr) minmax(0, 0.9fr)',
        },
      }}
    >
      {/* ── Info panel ── */}
      <Box
        sx={{
          p: compact ? 2.5 : { xs: 2.5, md: 3.5 },
          borderRight: { md: `1px solid ${TOKENS.border}` },
          borderBottom: { xs: `1px solid ${TOKENS.border}`, md: 'none' },
          bgcolor: alpha(TOKENS.primary, 0.03),
        }}
      >
        <Chip
          label="Vizită la birou"
          size="small"
          sx={{
            fontWeight: 800,
            bgcolor: alpha(TOKENS.primary, 0.14),
            color: TOKENS.ink,
            borderRadius: TOKENS.radius.full,
            mb: 1.5,
          }}
        />
        <Typography sx={{ fontWeight: 900, fontSize: '1.15rem', color: TOKENS.ink, lineHeight: 1.3 }}>
          Programează o vizită la biroul RIDElance
        </Typography>
        <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.88rem', mt: 1, lineHeight: 1.6 }}>
          Alege ziua și ora care ți se potrivesc, iar un coleg te va aștepta la birou.
        </Typography>

        <Stack spacing={1.4} sx={{ mt: 2.5 }}>
          <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center' }}>
            <AccessTimeRoundedIcon sx={{ fontSize: 19, color: TOKENS.textMuted }} />
            <Typography sx={{ fontSize: '0.86rem', fontWeight: 650, color: TOKENS.ink }}>
              {VISIT_MINUTES} de minute
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center' }}>
            <PlaceRoundedIcon sx={{ fontSize: 19, color: TOKENS.textMuted }} />
            <Typography sx={{ fontSize: '0.86rem', fontWeight: 650, color: TOKENS.ink }}>
              {OFFICE_ADDRESS}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1.2} sx={{ alignItems: 'flex-start' }}>
            <ScheduleRoundedIcon sx={{ fontSize: 19, color: TOKENS.textMuted, mt: 0.2 }} />
            <Box>
              <Typography sx={{ fontSize: '0.86rem', fontWeight: 650, color: TOKENS.ink }}>
                Luni – Vineri, 09:00 – 17:00
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: TOKENS.textMuted }}>
                Intervale din 30 în 30 de minute
              </Typography>
            </Box>
          </Stack>
        </Stack>

        {step === 'form' && selectedDate && selectedTime && (
          <Box
            sx={{
              mt: 3,
              p: 1.8,
              borderRadius: TOKENS.radius.md,
              border: `1px solid ${alpha(TOKENS.primary, 0.35)}`,
              bgcolor: alpha(TOKENS.primary, 0.08),
            }}
          >
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: TOKENS.textMuted }}>
              Intervalul ales
            </Typography>
            <Typography sx={{ fontWeight: 850, color: TOKENS.ink, mt: 0.3 }}>
              {formatSelectedDate(selectedDate)} · {selectedTime}
            </Typography>
          </Box>
        )}
      </Box>

      {step === 'form' ? (
        /* ── Booking form ── */
        <Box sx={{ p: compact ? 2.5 : { xs: 2.5, md: 3.5 } }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
            <IconButton size="small" onClick={() => { setStep('pick'); setError(null); }}>
              <ArrowBackRoundedIcon fontSize="small" />
            </IconButton>
            <Typography sx={{ fontWeight: 850, color: TOKENS.ink }}>Datele tale</Typography>
          </Stack>

          <Stack spacing={2} sx={{ maxWidth: 460 }}>
            <TextField
              label="Nume și prenume"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              size="small"
              required
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              size="small"
              required
              fullWidth
            />
            <TextField
              label="Număr de telefon"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              size="small"
              required
              fullWidth
            />
            <TextField
              label="Motivul programării"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              size="small"
              fullWidth
              multiline
              minRows={3}
              placeholder="Scrie pe scurt cu ce te putem ajuta…"
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
              sx={{ fontWeight: 800, py: 1.1, bgcolor: TOKENS.primary, color: '#fff' }}
            >
              {submitting ? 'Se trimite…' : 'Confirmă programarea'}
            </Button>
          </Stack>
        </Box>
      ) : (
        <>
          {/* ── Month calendar ── */}
          <Box
            sx={{
              p: compact ? 2.5 : { xs: 2.5, md: 3.5 },
              borderRight: { md: `1px solid ${TOKENS.border}` },
              borderBottom: { xs: `1px solid ${TOKENS.border}`, md: 'none' },
            }}
          >
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography sx={{ fontWeight: 850, color: TOKENS.ink }}>
                {ROMANIAN_MONTHS[viewMonth]} {viewYear}
              </Typography>
              <Stack direction="row" spacing={0.5}>
                <IconButton size="small" onClick={handlePrevMonth} aria-label="Luna anterioară">
                  <ChevronLeftRoundedIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={handleNextMonth} aria-label="Luna următoare">
                  <ChevronRightRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 0.5 }}>
              {WEEKDAYS.map((d) => (
                <Typography
                  key={d}
                  sx={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 800, color: TOKENS.textSubtle }}
                >
                  {d}
                </Typography>
              ))}
            </Box>

            {availabilityLoading ? (
              <Stack sx={{ alignItems: 'center', py: 6 }}>
                <CircularProgress size={26} sx={{ color: TOKENS.primary }} />
              </Stack>
            ) : (
              <Stack spacing={0.5}>
                {weeks.map((week, wi) => (
                  <Box key={wi} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                    {week.map((day, di) => {
                      if (day === null) return <Box key={di} />;
                      const dateKey = toDateKey(viewYear, viewMonth, day);
                      const info = availability.get(dateKey);
                      const status = info?.status ?? 'closed';
                      const selectable = status === 'available';
                      const isSelected = selectedDate === dateKey;
                      return (
                        <Box
                          key={di}
                          component="button"
                          type="button"
                          onClick={() => selectable && handleSelectDay(dateKey)}
                          disabled={!selectable}
                          title={
                            status === 'available'
                              ? `${info?.freeSlots} intervale libere`
                              : status === 'full'
                                ? 'Zi ocupată complet'
                                : status === 'past'
                                  ? undefined
                                  : 'Biroul este închis'
                          }
                          sx={{
                            aspectRatio: '1',
                            display: 'grid',
                            placeItems: 'center',
                            borderRadius: TOKENS.radius.md,
                            fontSize: '0.85rem',
                            fontFamily: 'inherit',
                            fontWeight: isSelected ? 850 : 650,
                            cursor: selectable ? 'pointer' : 'default',
                            border: `1px solid ${isSelected ? TOKENS.primaryStrong : 'transparent'}`,
                            bgcolor: isSelected
                              ? alpha(TOKENS.primary, 0.2)
                              : selectable
                                ? alpha(TOKENS.primary, 0.07)
                                : 'transparent',
                            color: selectable || isSelected
                              ? TOKENS.ink
                              : status === 'full'
                                ? alpha('#b45309', 0.75)
                                : TOKENS.textSubtle,
                            textDecoration: status === 'full' ? 'line-through' : 'none',
                            transition: 'background-color 150ms ease, border-color 150ms ease',
                            '&:hover': selectable ? { bgcolor: alpha(TOKENS.primary, 0.16) } : undefined,
                          }}
                        >
                          {day}
                        </Box>
                      );
                    })}
                  </Box>
                ))}
              </Stack>
            )}

            <Stack direction="row" spacing={2} sx={{ mt: 2, flexWrap: 'wrap', rowGap: 0.5 }}>
              {[
                { color: alpha(TOKENS.primary, 0.5), label: 'Zile libere' },
                { color: alpha('#b45309', 0.55), label: 'Ocupat complet' },
                { color: alpha(TOKENS.ink, 0.18), label: 'Închis' },
              ].map((item) => (
                <Stack key={item.label} direction="row" spacing={0.7} sx={{ alignItems: 'center' }}>
                  <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: item.color }} />
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 650, color: TOKENS.textMuted }}>
                    {item.label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* ── Slots ── */}
          <Box sx={{ p: compact ? 2.5 : { xs: 2.5, md: 3.5 }, minHeight: { md: 380 } }}>
            {!selectedDate ? (
              <Stack sx={{ height: '100%', alignItems: 'center', justifyContent: 'center', textAlign: 'center', py: 6 }}>
                <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.9rem', maxWidth: 220 }}>
                  Alege o zi din calendar ca să vezi orele disponibile.
                </Typography>
              </Stack>
            ) : slotsLoading ? (
              <Stack sx={{ alignItems: 'center', py: 6 }}>
                <CircularProgress size={26} sx={{ color: TOKENS.primary }} />
              </Stack>
            ) : (
              <>
                <Typography sx={{ fontWeight: 850, color: TOKENS.ink, mb: 0.5 }}>
                  {formatSelectedDate(selectedDate)}
                </Typography>
                {daySlots?.openTime && (
                  <Typography sx={{ fontSize: '0.78rem', color: TOKENS.textMuted, mb: 1.5 }}>
                    Program: {daySlots.openTime} – {daySlots.closeTime}
                  </Typography>
                )}
                {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
                {freeSlotTimes.length === 0 ? (
                  <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.88rem' }}>
                    Nu mai sunt intervale libere în această zi.
                  </Typography>
                ) : (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(4, 1fr)', md: 'repeat(2, 1fr)' },
                      gap: 1,
                      maxHeight: { md: 340 },
                      overflowY: 'auto',
                      pr: 0.5,
                    }}
                  >
                    {freeSlotTimes.map((slot) => (
                      <Button
                        key={slot.time}
                        variant={selectedTime === slot.time ? 'contained' : 'outlined'}
                        onClick={() => {
                          setSelectedTime(slot.time);
                          setStep('form');
                          setError(null);
                        }}
                        sx={{
                          fontWeight: 750,
                          fontVariantNumeric: 'tabular-nums',
                          borderColor: alpha(TOKENS.primary, 0.5),
                          color: selectedTime === slot.time ? '#fff' : TOKENS.ink,
                          bgcolor: selectedTime === slot.time ? TOKENS.primary : 'transparent',
                        }}
                      >
                        {slot.time}
                      </Button>
                    ))}
                  </Box>
                )}
              </>
            )}
          </Box>
        </>
      )}
    </Paper>
  );
}

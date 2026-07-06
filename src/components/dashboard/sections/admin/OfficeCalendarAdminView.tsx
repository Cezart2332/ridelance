import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { TOKENS } from '../../../../constants/tokens';
import { ROMANIAN_MONTHS } from '../../../../utils/monthLabels';
import { getErrorMessage } from '../../../../utils/errorHandler';
import {
  officeService,
  type OfficeAppointment,
  type OfficeDayAvailability,
  type OfficeDaySlots,
  type OfficeScheduleDay,
} from '../../../../services/office.service';

const WEEKDAYS_SHORT = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'];
const WEEKDAYS_FULL = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];
/** Maps Monday-first UI order to .NET DayOfWeek values (0 = Sunday). */
const DOTNET_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const HOUR_OPTIONS = Array.from({ length: 29 }, (_, i) => {
  const minutes = 7 * 60 + i * 30; // 07:00 – 21:00
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}:${m}`;
});

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateRo(dateKey: string) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return `${d} ${ROMANIAN_MONTHS[m - 1]} ${y}`;
}

const SLOT_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  free: { label: 'Liber', color: '#047857', bg: alpha('#10b981', 0.08) },
  booked: { label: 'Rezervat', color: '#1d4ed8', bg: alpha('#3b82f6', 0.08) },
  blocked: { label: 'Blocat', color: '#b91c1c', bg: alpha('#ef4444', 0.08) },
  past: { label: 'Trecut', color: 'rgba(26,26,46,0.4)', bg: alpha(TOKENS.ink, 0.03) },
};

export function OfficeCalendarAdminView() {
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const notify = (message: string, severity: 'success' | 'error' = 'success') =>
    setSnackbar({ open: true, message, severity });

  // ── Day management state ──
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [availability, setAvailability] = useState<Map<string, OfficeDayAvailability>>(new Map());
  const [selectedDate, setSelectedDate] = useState<string>(todayKey());
  const [day, setDay] = useState<OfficeDaySlots | null>(null);
  const [dayLoading, setDayLoading] = useState(true);

  // ── Appointments list state ──
  const [appointments, setAppointments] = useState<OfficeAppointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);

  // ── Schedule editor state ──
  const [schedule, setSchedule] = useState<OfficeScheduleDay[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleSaving, setScheduleSaving] = useState(false);

  const loadAvailability = useCallback((year: number, monthIndex: number) => {
    officeService
      .getAvailability(year, monthIndex + 1)
      .then((data) => setAvailability(new Map(data.days.map((d) => [d.date, d]))))
      .catch(() => setAvailability(new Map()));
  }, []);

  // NB: no synchronous setState in the two loaders below — they run inside effects.
  const loadDay = useCallback((dateKey: string) => {
    officeService
      .getAdminDay(dateKey)
      .then(setDay)
      .catch((err) => notify(getErrorMessage(err, 'Nu am putut încărca ziua.'), 'error'))
      .finally(() => setDayLoading(false));
  }, []);

  const loadAppointments = useCallback(() => {
    officeService
      .getAppointments(todayKey())
      .then(setAppointments)
      .catch(() => setAppointments([]))
      .finally(() => setAppointmentsLoading(false));
  }, []);

  useEffect(() => {
    loadAvailability(viewYear, viewMonth);
  }, [loadAvailability, viewYear, viewMonth]);

  useEffect(() => {
    loadDay(selectedDate);
  }, [loadDay, selectedDate]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    officeService
      .getSchedule()
      .then(setSchedule)
      .catch(() => notify('Nu am putut încărca programul.', 'error'))
      .finally(() => setScheduleLoading(false));
  }, []);

  const refreshDayAndMonth = () => {
    loadDay(selectedDate);
    loadAvailability(viewYear, viewMonth);
    loadAppointments();
  };

  // ── Actions ──
  const handleBlockSlot = async (time: string | null) => {
    try {
      await officeService.blockSlot(selectedDate, time);
      notify(time ? `Intervalul ${time} a fost blocat.` : 'Ziua a fost blocată complet.');
      refreshDayAndMonth();
    } catch (err) {
      notify(getErrorMessage(err, 'Nu am putut bloca intervalul.'), 'error');
    }
  };

  const handleUnblock = async (blockId: string) => {
    try {
      await officeService.unblock(blockId);
      notify('Intervalul a fost eliberat.');
      refreshDayAndMonth();
    } catch (err) {
      notify(getErrorMessage(err, 'Nu am putut elibera intervalul.'), 'error');
    }
  };

  const handleCancelAppointment = async (id: string) => {
    if (!window.confirm('Sigur anulezi această programare?')) return;
    try {
      await officeService.cancelAppointment(id);
      notify('Programarea a fost anulată.');
      refreshDayAndMonth();
    } catch (err) {
      notify(getErrorMessage(err, 'Nu am putut anula programarea.'), 'error');
    }
  };

  const handleSaveSchedule = async () => {
    setScheduleSaving(true);
    try {
      await officeService.saveSchedule(schedule);
      notify('Programul biroului a fost salvat.');
      refreshDayAndMonth();
    } catch (err) {
      notify(getErrorMessage(err, 'Nu am putut salva programul.'), 'error');
    } finally {
      setScheduleSaving(false);
    }
  };

  // ── Month grid ──
  const weeks = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const leadingBlanks = (firstDay.getDay() + 6) % 7;
    const cells: (number | null)[] = [
      ...Array.from({ length: leadingBlanks }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [viewYear, viewMonth]);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, color: TOKENS.ink }}>
          Calendar birou
        </Typography>
        <Typography variant="body2" sx={{ color: TOKENS.textMuted, fontWeight: 600, mt: 0.5 }}>
          Programările vizitelor, blocarea intervalelor și programul de lucru
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{ mb: 3, borderRadius: TOKENS.radius.lg, border: `1px solid ${TOKENS.border}`, overflow: 'hidden' }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, v: number) => setActiveTab(v)}
          sx={{ px: 2, borderBottom: `1px solid ${TOKENS.border}`, '& .MuiTab-root': { fontWeight: 700, py: 2 } }}
        >
          <Tab label="Calendar" />
          <Tab label={`Programări (${appointments.filter((a) => a.status === 'Confirmed').length})`} />
          <Tab label="Program de lucru" />
        </Tabs>

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {/* ── Tab 0: day management ── */}
          {activeTab === 0 && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1.4fr)' },
                gap: 3,
              }}
            >
              <Box>
                <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography sx={{ fontWeight: 850, color: TOKENS.ink }}>
                    {ROMANIAN_MONTHS[viewMonth]} {viewYear}
                  </Typography>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      size="small"
                      aria-label="Luna anterioară"
                      onClick={() => {
                        const prev = new Date(viewYear, viewMonth - 1, 1);
                        setViewYear(prev.getFullYear());
                        setViewMonth(prev.getMonth());
                      }}
                    >
                      <ChevronLeftRoundedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label="Luna următoare"
                      onClick={() => {
                        const next = new Date(viewYear, viewMonth + 1, 1);
                        setViewYear(next.getFullYear());
                        setViewMonth(next.getMonth());
                      }}
                    >
                      <ChevronRightRoundedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 0.5 }}>
                  {WEEKDAYS_SHORT.map((d) => (
                    <Typography key={d} sx={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 800, color: TOKENS.textSubtle }}>
                      {d}
                    </Typography>
                  ))}
                </Box>
                <Stack spacing={0.5}>
                  {weeks.map((week, wi) => (
                    <Box key={wi} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                      {week.map((dayNum, di) => {
                        if (dayNum === null) return <Box key={di} />;
                        const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                        const info = availability.get(dateKey);
                        const isSelected = selectedDate === dateKey;
                        const dotColor =
                          info?.status === 'available' ? '#059669'
                          : info?.status === 'full' ? '#b45309'
                          : info?.status === 'closed' ? '#b91c1c'
                          : 'transparent';
                        return (
                          <Box
                            key={di}
                            component="button"
                            type="button"
                            onClick={() => {
                              if (dateKey !== selectedDate) setDayLoading(true);
                              setSelectedDate(dateKey);
                            }}
                            sx={{
                              aspectRatio: '1',
                              display: 'grid',
                              placeItems: 'center',
                              position: 'relative',
                              borderRadius: TOKENS.radius.md,
                              fontSize: '0.85rem',
                              fontFamily: 'inherit',
                              fontWeight: isSelected ? 850 : 650,
                              cursor: 'pointer',
                              border: `1px solid ${isSelected ? TOKENS.primaryStrong : 'transparent'}`,
                              bgcolor: isSelected ? alpha(TOKENS.primary, 0.18) : 'transparent',
                              color: info?.status === 'past' ? TOKENS.textSubtle : TOKENS.ink,
                              '&:hover': { bgcolor: alpha(TOKENS.primary, 0.1) },
                            }}
                          >
                            {dayNum}
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: 4,
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                bgcolor: dotColor,
                              }}
                            />
                          </Box>
                        );
                      })}
                    </Box>
                  ))}
                </Stack>

                <Stack direction="row" spacing={2} sx={{ mt: 2, flexWrap: 'wrap', rowGap: 0.5 }}>
                  {[
                    { color: '#059669', label: 'Are intervale libere' },
                    { color: '#b45309', label: 'Ocupat complet' },
                    { color: '#b91c1c', label: 'Închis / blocat' },
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

              {/* Day detail */}
              <Box>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', mb: 2 }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 850, color: TOKENS.ink }}>
                      {formatDateRo(selectedDate)}
                    </Typography>
                    {day?.isOpen && day.openTime && (
                      <Typography sx={{ fontSize: '0.78rem', color: TOKENS.textMuted }}>
                        Program: {day.openTime} – {day.closeTime}
                      </Typography>
                    )}
                  </Box>
                  {day?.isOpen && !day.wholeDayBlocked && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<EventBusyRoundedIcon />}
                      onClick={() => handleBlockSlot(null)}
                      sx={{ fontWeight: 750, flexShrink: 0 }}
                    >
                      Blochează toată ziua
                    </Button>
                  )}
                </Stack>

                {dayLoading ? (
                  <Stack sx={{ alignItems: 'center', py: 5 }}>
                    <CircularProgress size={26} sx={{ color: TOKENS.primary }} />
                  </Stack>
                ) : !day?.isOpen ? (
                  <Alert severity="info">
                    Biroul este închis în această zi (conform programului de lucru).
                  </Alert>
                ) : day.wholeDayBlocked ? (
                  <Alert
                    severity="warning"
                    action={
                      day.wholeDayBlockId && (
                        <Button
                          color="inherit"
                          size="small"
                          onClick={() => handleUnblock(day.wholeDayBlockId!)}
                          sx={{ fontWeight: 750 }}
                        >
                          Deblochează ziua
                        </Button>
                      )
                    }
                  >
                    Ziua este blocată complet — clienții nu pot face programări.
                  </Alert>
                ) : (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                      gap: 1,
                    }}
                  >
                    {day.slots.map((slot) => {
                      const style = SLOT_STYLES[slot.status] ?? SLOT_STYLES.free;
                      return (
                        <Stack
                          key={slot.time}
                          direction="row"
                          spacing={1}
                          sx={{
                            alignItems: 'center',
                            p: 1.2,
                            borderRadius: TOKENS.radius.md,
                            border: `1px solid ${TOKENS.border}`,
                            bgcolor: style.bg,
                            minWidth: 0,
                          }}
                        >
                          <Typography sx={{ fontWeight: 850, fontVariantNumeric: 'tabular-nums', color: TOKENS.ink }}>
                            {slot.time}
                          </Typography>
                          <Chip
                            label={style.label}
                            size="small"
                            sx={{ height: 20, fontSize: '0.66rem', fontWeight: 800, color: style.color, bgcolor: '#fff' }}
                          />
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            {slot.status === 'booked' && (
                              <Typography noWrap sx={{ fontSize: '0.78rem', fontWeight: 650, color: TOKENS.textMuted }}>
                                {slot.visitorName} · {slot.visitorPhone}
                              </Typography>
                            )}
                            {slot.status === 'blocked' && slot.blockNote && (
                              <Typography noWrap sx={{ fontSize: '0.78rem', color: TOKENS.textMuted }}>
                                {slot.blockNote}
                              </Typography>
                            )}
                          </Box>
                          {slot.status === 'free' && (
                            <IconButton
                              size="small"
                              title="Blochează intervalul"
                              onClick={() => handleBlockSlot(slot.time)}
                            >
                              <BlockRoundedIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          )}
                          {slot.status === 'blocked' && slot.blockedSlotId && (
                            <IconButton
                              size="small"
                              title="Eliberează intervalul"
                              onClick={() => handleUnblock(slot.blockedSlotId!)}
                            >
                              <LockOpenRoundedIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          )}
                          {slot.status === 'booked' && slot.appointmentId && (
                            <IconButton
                              size="small"
                              color="error"
                              title="Anulează programarea"
                              onClick={() => handleCancelAppointment(slot.appointmentId!)}
                            >
                              <DeleteOutlineRoundedIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          )}
                        </Stack>
                      );
                    })}
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* ── Tab 1: appointments list ── */}
          {activeTab === 1 && (
            appointmentsLoading ? (
              <Stack sx={{ alignItems: 'center', py: 5 }}>
                <CircularProgress size={26} sx={{ color: TOKENS.primary }} />
              </Stack>
            ) : appointments.length === 0 ? (
              <Typography sx={{ color: TOKENS.textMuted, py: 3, textAlign: 'center' }}>
                Nu există programări viitoare.
              </Typography>
            ) : (
              <Stack spacing={1.2}>
                {appointments.map((a) => (
                  <Stack
                    key={a.id}
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={1.5}
                    sx={{
                      alignItems: { md: 'center' },
                      p: 2,
                      borderRadius: TOKENS.radius.md,
                      border: `1px solid ${TOKENS.border}`,
                      opacity: a.status === 'Cancelled' ? 0.55 : 1,
                    }}
                  >
                    <Box sx={{ minWidth: 150 }}>
                      <Typography sx={{ fontWeight: 850, color: TOKENS.ink, fontVariantNumeric: 'tabular-nums' }}>
                        {formatDateRo(a.date)}
                      </Typography>
                      <Typography sx={{ fontSize: '0.82rem', color: TOKENS.textMuted, fontWeight: 700 }}>
                        {a.time} · {a.durationMinutes} min
                      </Typography>
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography sx={{ fontWeight: 800, color: TOKENS.ink }}>{a.fullName}</Typography>
                      <Typography noWrap sx={{ fontSize: '0.82rem', color: TOKENS.textMuted }}>
                        {a.email} · {a.phone}
                      </Typography>
                      {a.reason && (
                        <Typography sx={{ fontSize: '0.84rem', color: TOKENS.textMuted, mt: 0.5, fontStyle: 'italic' }}>
                          „{a.reason}"
                        </Typography>
                      )}
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexShrink: 0 }}>
                      <Chip
                        label={a.status === 'Confirmed' ? 'Confirmată' : 'Anulată'}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          color: a.status === 'Confirmed' ? '#047857' : '#b91c1c',
                          bgcolor: a.status === 'Confirmed' ? alpha('#10b981', 0.1) : alpha('#ef4444', 0.08),
                        }}
                      />
                      {a.status === 'Confirmed' && (
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleCancelAppointment(a.id)}
                          sx={{ fontWeight: 750 }}
                        >
                          Anulează
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            )
          )}

          {/* ── Tab 2: weekly schedule ── */}
          {activeTab === 2 && (
            scheduleLoading ? (
              <Stack sx={{ alignItems: 'center', py: 5 }}>
                <CircularProgress size={26} sx={{ color: TOKENS.primary }} />
              </Stack>
            ) : (
              <Box sx={{ maxWidth: 620 }}>
                <Stack spacing={1.2}>
                  {DOTNET_DAY_ORDER.map((dotnetDay, uiIndex) => {
                    const row = schedule.find((s) => s.day === dotnetDay);
                    if (!row) return null;
                    const update = (patch: Partial<OfficeScheduleDay>) =>
                      setSchedule((prev) => prev.map((s) => (s.day === dotnetDay ? { ...s, ...patch } : s)));
                    return (
                      <Stack
                        key={dotnetDay}
                        direction="row"
                        spacing={1.5}
                        sx={{
                          alignItems: 'center',
                          p: 1.5,
                          borderRadius: TOKENS.radius.md,
                          border: `1px solid ${TOKENS.border}`,
                          bgcolor: row.isOpen ? 'transparent' : alpha(TOKENS.ink, 0.025),
                        }}
                      >
                        <Typography sx={{ fontWeight: 800, color: TOKENS.ink, width: 92, flexShrink: 0 }}>
                          {WEEKDAYS_FULL[uiIndex]}
                        </Typography>
                        <Switch
                          size="small"
                          checked={row.isOpen}
                          onChange={(e) => update({ isOpen: e.target.checked })}
                        />
                        {row.isOpen ? (
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flex: 1 }}>
                            <TextField
                              select
                              size="small"
                              value={row.openTime}
                              onChange={(e) => update({ openTime: e.target.value })}
                              sx={{ width: 110 }}
                            >
                              {HOUR_OPTIONS.map((h) => (
                                <MenuItem key={h} value={h}>{h}</MenuItem>
                              ))}
                            </TextField>
                            <Typography sx={{ color: TOKENS.textMuted }}>–</Typography>
                            <TextField
                              select
                              size="small"
                              value={row.closeTime}
                              onChange={(e) => update({ closeTime: e.target.value })}
                              sx={{ width: 110 }}
                            >
                              {HOUR_OPTIONS.map((h) => (
                                <MenuItem key={h} value={h}>{h}</MenuItem>
                              ))}
                            </TextField>
                          </Stack>
                        ) : (
                          <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.88rem' }}>Închis</Typography>
                        )}
                      </Stack>
                    );
                  })}
                </Stack>
                <Button
                  variant="contained"
                  onClick={handleSaveSchedule}
                  disabled={scheduleSaving}
                  sx={{ mt: 2.5, fontWeight: 800, bgcolor: TOKENS.primary, color: '#fff' }}
                >
                  {scheduleSaving ? 'Se salvează…' : 'Salvează programul'}
                </Button>
              </Box>
            )
          )}
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ borderRadius: TOKENS.radius.md, fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}


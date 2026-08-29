import { useState, useCallback, useEffect } from 'react';
import {
  Box, Stack, Typography, Button, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip,
  IconButton, Tabs, Tab, Avatar, TextField,
  InputAdornment, MenuItem, Switch,
  Grid, Card, CardContent, LinearProgress
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded';
import AssignmentIndRoundedIcon from '@mui/icons-material/AssignmentIndRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import TouchAppRoundedIcon from '@mui/icons-material/TouchAppRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import { carsService, getCarImageUrl, type Car, type CarLead } from '../../../../services/cars.service';
import {
  formatCarStatus,
  getCarStatusColor,
  LISTING_SOURCE_FROM_API,
  formatApprovalStatus,
  getApprovalStatusColor,
} from '../../../../utils/carLabels';
import { DASHBOARD_TOKENS, responsiveTableContainerSx } from '../../dashboardTheme';
import { AddCarWizard } from '../../addCar/AddCarWizard'
import { CarEditDialog } from '../../srl/CarEditDialog'

/**
 * Ce scrie sub comutator. „Publicat" nu înseamnă „se vede": pentru asta se colorează eticheta,
 * după `car.active`, care ține cont și de aprobare, și de plată.
 */
const LISTING_STATE_LABELS: Record<string, string> = {
  Draft: 'Nepublicat',
  Published: 'Publicat',
  Paused: 'Pe pauză',
  Archived: 'Arhivat',
};

const PAYMENT_LABELS: Record<string, string> = {
  NotRequired: 'Nu necesită',
  Pending: 'Necesită plată',
  Paid: 'Plătit',
  PastDue: 'Plată eșuată',
  Cancelled: 'Anulat',
};

const PAYMENT_COLORS: Record<string, string> = {
  NotRequired: '#64748b',
  Pending: '#b45309',
  Paid: '#047857',
  PastDue: '#dc2626',
  Cancelled: '#64748b',
};


export function CarsAdminView() {
  const [activeTab, setActiveTab] = useState(0);
  const [cars, setCars] = useState<Car[]>([]);
  const [leads, setLeads] = useState<CarLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCarModalOpen, setIsCarModalOpen] = useState(false);
  const [isAddingCar, setIsAddingCar] = useState(false);
  /** Mașina editată. `null` = adăugare rapidă din dialog. */
  const [editingCar, setEditingCar] = useState<Car | null>(null);


  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const carsData = await carsService.getAllAdmin();
      const leadsData = await carsService.getLeads();
      setCars(carsData);
      setLeads(leadsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTabChange = (_: React.SyntheticEvent, v: number) => setActiveTab(v);

  const handleDeleteCar = async (id: string) => {
    if (window.confirm('Ești sigur că vrei să ștergi această mașină? Toate datele asociate vor fi pierdute.')) {
      try {
        await carsService.delete(id);
        setCars(prev => prev.filter(c => c.id !== id));
      } catch (error) {
        alert('Eroare la ștergerea mașinii.');
      }
    }
  };

  const handleToggleCarActive = async (id: string) => {
    try {
      const next = await carsService.toggleActive(id);
      setCars(prev => prev.map(c => c.id === id ? { ...c, ...next } : c));
    } catch (error) {
      alert('Eroare la modificarea vizibilității.');
    }
  };


  const handleUpdateLeadStatus = async (id: string, label: string, adminNote?: string) => {
    const statusMap: Record<string, string> = {
      'Nou': 'New',
      'Contactat': 'Contacted',
      'În discuție': 'InDiscussion',
      'Acceptat': 'Accepted',
      'Respins': 'Rejected'
    };
    const backendStatus = statusMap[label] || label;
    try {
      await carsService.updateLeadStatus(id, backendStatus, adminNote);
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status: label, adminNote: adminNote ?? l.adminNote } : l));
    } catch (error) {
      alert('Eroare la actualizarea statusului.');
    }
  };

  const openCarModal = (car: Car) => {
    setEditingCar(car);
    setIsCarModalOpen(true);
  };

  const analyticsTotals = cars.reduce(
    (acc, car) => ({
      views: acc.views + (car.stats?.views ?? 0),
      clicks: acc.clicks + (car.stats?.clicks ?? 0),
      forms: acc.forms + (car.stats?.forms ?? 0),
    }),
    { views: 0, clicks: 0, forms: 0 },
  );


  const leadStatusColors: Record<string, string> = {
    'Nou': '#6366f1', 'Contactat': '#f59e0b', 'În discuție': '#3b82f6',
    'Acceptat': '#10b981', 'Respins': '#ef4444'
  };

  const handleApproveCar = async (id: string, approve: boolean) => {
    try {
      await carsService.approveListing(id, approve);
      await fetchData();
    } catch {
      alert(approve ? 'Eroare la aprobare.' : 'Eroare la respingere.');
    }
  };


  const filteredCars = cars.filter(c => {
    const matchesSearch =
      c.brand.toLowerCase().includes(search.toLowerCase()) ||
      c.model.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (activeTab === 0) return c.approvalStatus === 'Approved';
    if (activeTab === 3) return c.approvalStatus !== 'Approved';
    return true;
  });

  /*
   * Adăugarea trece prin wizard și la admin, nu doar la SRL. Dialogul rapid rămâne pentru
   * editare: acolo se schimbă un câmp-două pe o mașină care există deja, iar șase pași ar fi
   * doar drum în plus. Wizardul ia locul listei în loc să se deschidă ca rută, pentru că
   * dashboard-ul de admin comută secțiuni pe stare, nu pe adrese.
   */
  if (isAddingCar) {
    return (
      <AddCarWizard
        mode="admin"
        onCancel={() => setIsAddingCar(false)}
        onSaved={() => {
          setIsAddingCar(false);
          void fetchData();
        }}
      />
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 900, color: DASHBOARD_TOKENS.ink }}>
          Gestiune Fleet
        </Typography>
        {activeTab === 0 && (
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => setIsAddingCar(true)}
            sx={{ bgcolor: DASHBOARD_TOKENS.primary, fontWeight: 700, borderRadius: 2 }}
          >
            Adaugă mașină
          </Button>
        )}
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}


      <Paper elevation={0} sx={{ mb: 4, borderRadius: DASHBOARD_TOKENS.radius.lg, border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`, overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ px: 2, borderBottom: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.05)}`, '& .MuiTab-root': { fontWeight: 700, py: 2 } }}
        >
          <Tab icon={<DirectionsCarFilledRoundedIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Parc Auto" />
          <Tab icon={<AssignmentIndRoundedIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Solicitări" />
          <Tab icon={<BarChartRoundedIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Analytics" />
          <Tab icon={<AssignmentIndRoundedIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Validare" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {(activeTab === 0 || activeTab === 3) && (
            <Stack spacing={3}>
              <TextField placeholder="Caută după brand sau model..." size="small" value={search}
                onChange={(e) => setSearch(e.target.value)} sx={{ maxWidth: 400 }}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ color: alpha(DASHBOARD_TOKENS.ink, 0.4) }} /></InputAdornment> } }} />
              <TableContainer sx={responsiveTableContainerSx}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>Mașină</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Preț săptămână</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Media</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Sursă</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Validare</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Plată</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Vizibilă</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>Acțiuni</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCars.map((car) => (
                      <TableRow key={car.id} sx={{ '&:hover': { bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.02) } }}>
                        <TableCell>
                          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                            <Avatar src={getCarImageUrl(car.images[0]?.imageUrl)} variant="rounded"
                              sx={{ width: 56, height: 56, border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.1)}` }}>
                              <DirectionsCarFilledRoundedIcon />
                            </Avatar>
                            <Box>
                              {/* Adminul administrează anunțuri, nu operează o flotă: numele nu
                                  duce nicăieri, iar scorul e al proprietarului, nu al lui. */}
                              <Typography sx={{ fontWeight: 800, color: DASHBOARD_TOKENS.ink }}>{car.brand} {car.model}</Typography>
                              <Typography variant="caption" sx={{ color: DASHBOARD_TOKENS.textSubtle }}>{car.year} • {car.engine} • {car.transmission}</Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 700, color: DASHBOARD_TOKENS.primaryStrong }}>{car.pricePerWeek} RON</Typography>
                          {car.discountActive && <Typography variant="caption" sx={{ textDecoration: 'line-through', color: DASHBOARD_TOKENS.textSubtle }}>{car.oldPrice} RON</Typography>}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
                            {car.images.slice(0, 3).map((img) => (
                              <Avatar key={img.id} src={getCarImageUrl(img.imageUrl)} variant="rounded" sx={{ width: 32, height: 32 }} />
                            ))}
                            {car.images.length > 3 && (
                              <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: alpha(DASHBOARD_TOKENS.ink, 0.06), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.6rem' }}>+{car.images.length - 3}</Typography>
                              </Box>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip label={formatCarStatus(car.status)} size="small"
                            sx={{ fontWeight: 800, fontSize: '0.65rem', bgcolor: alpha(getCarStatusColor(car.status), 0.1), color: getCarStatusColor(car.status), border: `1px solid ${alpha(getCarStatusColor(car.status), 0.2)}` }} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {LISTING_SOURCE_FROM_API[car.listingSource] ?? car.listingSource}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={formatApprovalStatus(car.approvalStatus)} size="small"
                            sx={{ fontWeight: 800, fontSize: '0.65rem', bgcolor: alpha(getApprovalStatusColor(car.approvalStatus), 0.1), color: getApprovalStatusColor(car.approvalStatus) }} />
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.8} sx={{ alignItems: 'flex-start' }}>
                            <Chip
                              label={PAYMENT_LABELS[car.paymentStatus] ?? car.paymentStatus}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: '0.65rem',
                                bgcolor: alpha(PAYMENT_COLORS[car.paymentStatus] ?? '#64748b', 0.1),
                                color: PAYMENT_COLORS[car.paymentStatus] ?? '#64748b',
                              }}
                            />
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {/* Comutatorul arată intenția, eticheta de dedesubt arată realitatea.
                              Un anunț publicat dar neaprobat sau neplătit nu se vede — iar dacă
                              bifa ar reflecta vizibilitatea, ar părea că se stinge singură. */}
                          <Stack spacing={0.5} sx={{ alignItems: 'flex-start' }}>
                            <Switch
                              checked={car.listingStatus === 'Published'}
                              onChange={() => handleToggleCarActive(car.id)}
                              color="primary"
                              disabled={car.listingStatus === 'Archived'}
                            />
                            <Chip
                              size="small"
                              label={LISTING_STATE_LABELS[car.listingStatus] ?? car.listingStatus}
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                bgcolor: car.active ? '#dcfce7' : '#f1f5f9',
                                color: car.active ? '#166534' : '#475569',
                              }}
                            />
                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                            {car.approvalStatus === 'Pending' && (
                              <>
                                <Button size="small" variant="contained" onClick={() => handleApproveCar(car.id, true)}
                                  sx={{ fontWeight: 700, bgcolor: '#10b981', fontSize: '0.7rem', minWidth: 0, px: 1.5 }}>Aprobă</Button>
                                <Button size="small" variant="outlined" color="error" onClick={() => handleApproveCar(car.id, false)}
                                  sx={{ fontWeight: 700, fontSize: '0.7rem', minWidth: 0, px: 1.5 }}>Respinge</Button>
                              </>
                            )}
                            <IconButton size="small" onClick={() => openCarModal(car)}><EditRoundedIcon fontSize="small" /></IconButton>
                            {/* Proprietarul își scoate mașina din flotă, din dashboardul lui.
                                Adminul o șterge: o mașină ștearsă ia cu ea închirierile, dosarul
                                și mentenanța. */}
                            <IconButton size="small" color="error" onClick={() => handleDeleteCar(car.id)}><DeleteRoundedIcon fontSize="small" /></IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          )}

          {activeTab === 1 && (
            <TableContainer sx={responsiveTableContainerSx}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Client</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Mașină Solicitată</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Data</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>Acțiuni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <Typography sx={{ fontWeight: 800 }}>{lead.userName}</Typography>
                        <Typography variant="caption" sx={{ color: DASHBOARD_TOKENS.textSubtle, display: 'block' }}>{lead.userEmail} • {lead.userPhone}</Typography>
                        <Typography variant="caption" sx={{ color: DASHBOARD_TOKENS.primaryStrong, fontWeight: 700, display: 'block', mt: 0.5 }}>
                          Oraș: {lead.city} • Opțiune: {lead.interestType}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{lead.carName}</Typography>
                          {/* Lista de așteptare e altă discuție decât o cerere obișnuită. */}
                          {lead.intent === 'Waitlist' && (
                            <Chip label="Listă de așteptare" size="small"
                              sx={{ height: 20, fontSize: '0.62rem', fontWeight: 800, bgcolor: alpha('#f59e0b', 0.12), color: '#B54708' }} />
                          )}
                        </Stack>
                        <Typography variant="caption" sx={{ color: DASHBOARD_TOKENS.textSubtle, display: 'block' }}>
                          {[
                            lead.weeks ? `${lead.weeks} săpt.` : null,
                            lead.preferredStartDate
                              ? `de la ${new Date(lead.preferredStartDate).toLocaleDateString('ro-RO')}`
                              : null,
                            lead.hasPlatformAccount === true ? 'are cont pe platforme' : null,
                            lead.hasPlatformAccount === false ? 'fără cont pe platforme' : null,
                          ].filter(Boolean).join(' • ')}
                        </Typography>
                        {lead.message && (
                          <Typography variant="caption" sx={{ color: DASHBOARD_TOKENS.ink, display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                            „{lead.message}”
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{new Date(lead.createdAtUtc).toLocaleDateString('ro-RO')}</Typography>
                        {/* Sursa apare doar când chiar spune ceva: „direct" e valoarea tuturor. */}
                        {lead.source && lead.source !== 'vdp' && (
                          <Typography variant="caption" sx={{ color: DASHBOARD_TOKENS.textSubtle, display: 'block' }}>
                            din {lead.source}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={lead.status} size="small"
                          sx={{ fontWeight: 800, fontSize: '0.65rem', bgcolor: alpha(leadStatusColors[lead.status] ?? '#999', 0.1), color: leadStatusColors[lead.status] ?? '#999', border: `1px solid ${alpha(leadStatusColors[lead.status] ?? '#999', 0.2)}` }} />
                      </TableCell>
                      <TableCell align="right">
                        <TextField select size="small" value={lead.status}
                          onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value)}
                          sx={{ width: 130 }}>
                          {['Nou', 'Contactat', 'În discuție', 'Acceptat', 'Respins'].map(opt => (
                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {activeTab === 2 && (
            <Stack spacing={3}>
              <Grid container spacing={2} component="div">
                {[
                  { label: 'Vizualizări totale', value: analyticsTotals.views },
                  { label: 'Click-uri închiriere', value: analyticsTotals.clicks },
                  { label: 'Cereri trimise', value: analyticsTotals.forms },
                ].map((item) => (
                  <Grid size={{ xs: 12, sm: 4 }} key={item.label} component="div">
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: DASHBOARD_TOKENS.radius.lg,
                        border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`,
                        bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.04),
                      }}
                    >
                      <Typography variant="caption" sx={{ color: DASHBOARD_TOKENS.textSubtle, fontWeight: 700 }}>
                        {item.label}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 900, color: DASHBOARD_TOKENS.ink, mt: 0.5 }}>
                        {item.value.toLocaleString('ro-RO')}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            <Grid container spacing={3} component="div">
              {cars.map((car) => (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={car.id} component="div">
                  <Card elevation={0} sx={{ border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`, borderRadius: DASHBOARD_TOKENS.radius.lg }}>
                    <CardContent>
                      <Stack direction="row" spacing={2} sx={{ mb: 3, alignItems: 'center' }}>
                        <Avatar src={getCarImageUrl(car.images[0]?.imageUrl)} variant="rounded" />
                        <Box>
                          <Typography sx={{ fontWeight: 800 }}>{car.brand} {car.model}</Typography>
                          <Typography variant="caption" sx={{ color: DASHBOARD_TOKENS.textSubtle }}>{car.images.length} media files</Typography>
                        </Box>
                      </Stack>
                      <Grid container spacing={2} component="div">
                        {[
                          { icon: <VisibilityRoundedIcon />, value: car.stats?.views ?? 0, label: 'Vizualizări' },
                          { icon: <TouchAppRoundedIcon />, value: car.stats?.clicks ?? 0, label: 'Click-uri' },
                          { icon: <DescriptionRoundedIcon />, value: car.stats?.forms ?? 0, label: 'Cereri' },
                        ].map(stat => (
                          <Grid size={4} key={stat.label} component="div">
                            <Stack sx={{ alignItems: 'center' }}>
                              <Box sx={{ color: alpha(DASHBOARD_TOKENS.ink, 0.4), mb: 0.5 }}>{stat.icon}</Box>
                              <Typography variant="h6" sx={{ fontWeight: 800 }}>{stat.value}</Typography>
                              <Typography variant="caption" sx={{ color: DASHBOARD_TOKENS.textSubtle }}>{stat.label}</Typography>
                            </Stack>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            </Stack>
          )}
        </Box>
      </Paper>

      <CarEditDialog
        open={isCarModalOpen}
        car={editingCar}
        mode="admin"
        onClose={() => setIsCarModalOpen(false)}
        onSaved={() => {
          setIsCarModalOpen(false);
          void fetchData();
        }}
      />
    </Box>
  );
}

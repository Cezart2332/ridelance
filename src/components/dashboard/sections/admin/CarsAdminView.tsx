import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box, Stack, Typography, Button, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip,
  IconButton, Tabs, Tab, Avatar, TextField,
  InputAdornment, Dialog, DialogTitle, DialogContent,
  DialogActions, MenuItem, Switch, FormControlLabel,
  Grid, Card, CardContent, LinearProgress, Autocomplete
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
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { carsService, getCarImageUrl, type Car, type CarLead } from '../../../../services/cars.service';
import {
  formatCarStatus,
  getCarStatusColor,
  OFFER_TYPE_FROM_API,
  OFFER_TYPE_TO_API,
  STATUS_FROM_API,
  STATUS_TO_API,
  LISTING_SOURCE_FROM_API,
  LISTING_SOURCE_TO_API,
  formatApprovalStatus,
  getApprovalStatusColor,
} from '../../../../utils/carLabels';
import { DASHBOARD_TOKENS } from '../../dashboardTheme';

interface LocalImage {
  id: string;
  previewUrl: string;
  file?: File;
  isExisting?: boolean;
}

const UBER_CATEGORIES = ['UberX', 'Uber Comfort', 'Uber Green', 'Uber Black', 'Uber Kids'];
const BOLT_CATEGORIES = ['Bolt', 'Bolt Comfort', 'Bolt Green', 'Bolt Premium', 'Bolt Economy'];
const BADGES = ['Consum Mic', 'Hybrid', 'GPL', 'Top Rated', 'Nou', 'Reducere'];

interface CarsAdminViewProps {
  variant?: 'admin' | 'poster';
}

export function CarsAdminView({ variant = 'admin' }: CarsAdminViewProps) {
  const isPoster = variant === 'poster';
  const [activeTab, setActiveTab] = useState(0);
  const [cars, setCars] = useState<Car[]>([]);
  const [leads, setLeads] = useState<CarLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCarModalOpen, setIsCarModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Partial<Car> | null>(null);
  const [localImages, setLocalImages] = useState<LocalImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const carsData = isPoster
        ? await carsService.getMyCars()
        : await carsService.getAllAdmin();
      const leadsData = isPoster ? [] : await carsService.getLeads();
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
  }, [fetchData, isPoster]);

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
      const newState = await carsService.toggleActive(id);
      setCars(prev => prev.map(c => c.id === id ? { ...c, active: newState } : c));
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

  const handleOpenCarModal = (car?: Car) => {
    if (car) {
      setEditingCar({
        ...car,
        offerType: OFFER_TYPE_FROM_API[car.offerType] ?? car.offerType,
        status: STATUS_FROM_API[car.status] ?? car.status,
        listingSource: LISTING_SOURCE_FROM_API[car.listingSource] ?? car.listingSource,
      });
      setLocalImages(car.images.map((img) => ({
        id: img.id,
        previewUrl: getCarImageUrl(img.imageUrl),
        isExisting: true
      })));
    } else {
      setEditingCar({
        brand: '', model: '', year: new Date().getFullYear(),
        pricePerWeek: 0, oldPrice: undefined,
        discountActive: false, garantie: undefined,
        offerType: 'Închiriere săptămânală',
        status: 'Disponibilă acum', engine: 'GPL', transmission: 'Manuală',
        location: 'București', uberCategories: [], boltCategories: [],
        badges: [], description: '',
        listingSource: 'Închiriat de RIDElance',
        active: !isPoster,
      });
      setLocalImages([]);
    }
    setIsCarModalOpen(true);
  };

  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArr = Array.from(files);
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const valid = fileArr.filter(f => allowed.includes(f.type) && f.size <= 10 * 1024 * 1024);
    const newImgs: LocalImage[] = valid.map(f => ({
      id: Math.random().toString(36).slice(2),
      previewUrl: URL.createObjectURL(f),
      file: f
    }));
    setLocalImages(prev => [...prev, ...newImgs]);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) processFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
  };

  const removeImage = async (id: string) => {
    const img = localImages.find(i => i.id === id);
    if (!img) return;

    if (img.isExisting && editingCar?.id) {
      if (window.confirm('Ștergi definitiv această imagine de pe server?')) {
        try {
          await carsService.deleteImage(editingCar.id, id);
        } catch (error: any) {
          console.error('Error deleting image:', error);
          const errorMessage = error.response?.data?.detail || error.response?.data?.title || 'Eroare la ștergerea imaginii de pe server.';
          alert(errorMessage);
          return;
        }
      } else {
        return;
      }
    } else if (img.file) {
      URL.revokeObjectURL(img.previewUrl);
    }

    setLocalImages(prev => prev.filter(i => i.id !== id));
  };

  const handleSaveCar = async () => {
    if (!editingCar) return;

    if (
      editingCar.discountActive &&
      (editingCar.oldPrice == null || editingCar.oldPrice <= (editingCar.pricePerWeek ?? 0))
    ) {
      alert('Pentru reducere activă, prețul vechi trebuie să fie mai mare decât prețul actual.');
      return;
    }

    setUploading(true);

    try {
      let carId = editingCar.id;
      const payload = {
        brand: editingCar.brand!,
        model: editingCar.model!,
        year: editingCar.year!,
        engine: editingCar.engine!,
        transmission: editingCar.transmission!,
        location: editingCar.location!,
        pricePerWeek: editingCar.pricePerWeek!,
        oldPrice: editingCar.oldPrice,
        discountActive: editingCar.discountActive ?? false,
        garantie: editingCar.garantie,
        offerType: OFFER_TYPE_TO_API[editingCar.offerType!] || editingCar.offerType!,
        status: STATUS_TO_API[editingCar.status!] || editingCar.status!,
        uberCategories: editingCar.uberCategories ?? [],
        boltCategories: editingCar.boltCategories ?? [],
        badges: editingCar.badges ?? [],
        description: editingCar.description ?? '',
        active: editingCar.active ?? !isPoster,
        listingSource: LISTING_SOURCE_TO_API[editingCar.listingSource as string]
          ?? editingCar.listingSource
          ?? 'Ridelance',
      };

      if (carId) {
        await carsService.update(carId, payload);
      } else {
        carId = await carsService.create(payload);
      }

      // Handle new image uploads
      const newImages = localImages.filter(img => !img.isExisting && img.file);
      for (const img of newImages) {
        await carsService.uploadImage(carId, img.file!);
      }

      await fetchData();
      setIsCarModalOpen(false);
    } catch (error: any) {
      console.error('Error saving car:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.title || 'Eroare la salvarea mașinii.';
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

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
    if (!isPoster && activeTab === 3) return c.approvalStatus === 'Pending';
    return true;
  });

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 900, color: DASHBOARD_TOKENS.ink }}>
          {isPoster ? 'Anunțurile mele' : 'Gestiune Fleet'}
        </Typography>
        {activeTab === 0 && (
          <Button variant="contained" startIcon={<AddRoundedIcon />}
            onClick={() => handleOpenCarModal()}
            sx={{ bgcolor: DASHBOARD_TOKENS.primary, fontWeight: 700, borderRadius: 2 }}>
            Adaugă Mașină
          </Button>
        )}
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      <Paper elevation={0} sx={{ mb: 4, borderRadius: DASHBOARD_TOKENS.radius.lg, border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`, overflow: 'hidden' }}>
        <Tabs value={activeTab} onChange={handleTabChange}
          sx={{ px: 2, borderBottom: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.05)}`, '& .MuiTab-root': { fontWeight: 700, py: 2 } }}>
          <Tab icon={<DirectionsCarFilledRoundedIcon sx={{ fontSize: 20 }} />} iconPosition="start" label={isPoster ? 'Mașini' : 'Parc Auto'} />
          {!isPoster && (
            <>
              <Tab icon={<AssignmentIndRoundedIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Solicitări" />
              <Tab icon={<BarChartRoundedIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Analytics" />
              <Tab icon={<AssignmentIndRoundedIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Validare" />
            </>
          )}
        </Tabs>

        <Box sx={{ p: 3 }}>
          {(activeTab === 0 || activeTab === 3) && (
            <Stack spacing={3}>
              <TextField placeholder="Caută după brand sau model..." size="small" value={search}
                onChange={(e) => setSearch(e.target.value)} sx={{ maxWidth: 400 }}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ color: alpha(DASHBOARD_TOKENS.ink, 0.4) }} /></InputAdornment> } }} />
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>Mașină</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Preț săptămână</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Media</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                      {!isPoster && <TableCell sx={{ fontWeight: 800 }}>Sursă</TableCell>}
                      <TableCell sx={{ fontWeight: 800 }}>Validare</TableCell>
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
                        {!isPoster && (
                          <TableCell>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              {LISTING_SOURCE_FROM_API[car.listingSource] ?? car.listingSource}
                            </Typography>
                          </TableCell>
                        )}
                        <TableCell>
                          <Chip label={formatApprovalStatus(car.approvalStatus)} size="small"
                            sx={{ fontWeight: 800, fontSize: '0.65rem', bgcolor: alpha(getApprovalStatusColor(car.approvalStatus), 0.1), color: getApprovalStatusColor(car.approvalStatus) }} />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={car.active}
                            onChange={() => handleToggleCarActive(car.id)}
                            color="primary"
                            disabled={isPoster && car.approvalStatus !== 'Approved'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                            {!isPoster && car.approvalStatus === 'Pending' && (
                              <>
                                <Button size="small" variant="contained" onClick={() => handleApproveCar(car.id, true)}
                                  sx={{ fontWeight: 700, bgcolor: '#10b981', fontSize: '0.7rem', minWidth: 0, px: 1.5 }}>Aprobă</Button>
                                <Button size="small" variant="outlined" color="error" onClick={() => handleApproveCar(car.id, false)}
                                  sx={{ fontWeight: 700, fontSize: '0.7rem', minWidth: 0, px: 1.5 }}>Respinge</Button>
                              </>
                            )}
                            <IconButton size="small" onClick={() => handleOpenCarModal(car)}><EditRoundedIcon fontSize="small" /></IconButton>
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
            <TableContainer>
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
                        <Typography variant="caption" sx={{ color: DASHBOARD_TOKENS.textSubtle }}>{lead.userEmail} • {lead.userPhone}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{lead.carName}</Typography>
                      </TableCell>
                      <TableCell><Typography variant="caption">{new Date(lead.createdAtUtc).toLocaleDateString('ro-RO')}</Typography></TableCell>
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
                          { icon: <VisibilityRoundedIcon />, value: car.stats?.views ?? 0, label: 'Views' },
                          { icon: <TouchAppRoundedIcon />, value: car.stats?.clicks ?? 0, label: 'Clicks' },
                          { icon: <DescriptionRoundedIcon />, value: car.stats?.forms ?? 0, label: 'Leads' },
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
          )}
        </Box>
      </Paper>

      {/* Car Edit/Add Modal — Rearranged Layout */}
      <Dialog open={isCarModalOpen} onClose={() => setIsCarModalOpen(false)} maxWidth="lg" fullWidth
        slotProps={{ paper: { sx: { borderRadius: DASHBOARD_TOKENS.radius.xl, p: 1 } } }}>
        <DialogTitle sx={{ fontWeight: 900, px: 3, pt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editingCar?.id ? 'Editează Specificații Vehicul' : 'Adaugă Vehicul Nou'}
          <IconButton onClick={() => setIsCarModalOpen(false)} size="small"><CloseRoundedIcon /></IconButton>
        </DialogTitle>

        {uploading && <LinearProgress sx={{ mx: 3 }} />}

        <DialogContent sx={{ px: 3 }}>
          <Stack spacing={4} sx={{ mt: 1 }}>
            {/* 1. Core Info */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: DASHBOARD_TOKENS.primaryStrong, textTransform: 'uppercase', letterSpacing: 1 }}>
                1. Informații de Bază
              </Typography>
              <Grid container spacing={2.5} component="div">
                <Grid size={{ xs: 12, sm: 6, md: 6 }} component="div"><TextField fullWidth label="Brand" value={editingCar?.brand ?? ''} onChange={(e) => setEditingCar({ ...editingCar, brand: e.target.value })} variant="outlined" /></Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6 }} component="div"><TextField fullWidth label="Model" value={editingCar?.model ?? ''} onChange={(e) => setEditingCar({ ...editingCar, model: e.target.value })} /></Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }} component="div"><TextField fullWidth label="An Fabricație" type="number" value={editingCar?.year ?? ''} onChange={(e) => setEditingCar({ ...editingCar, year: parseInt(e.target.value) })} /></Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }} component="div"><TextField fullWidth label="Oraș / Locație" value={editingCar?.location ?? ''} onChange={(e) => setEditingCar({ ...editingCar, location: e.target.value })} /></Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }} component="div">
                  <TextField select fullWidth label="Motorizare" value={editingCar?.engine ?? 'GPL'} onChange={(e) => setEditingCar({ ...editingCar, engine: e.target.value })}>
                    {['Electric', 'Hybrid', 'GPL', 'Benzină', 'Diesel'].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }} component="div">
                  <TextField select fullWidth label="Cutie Viteze" value={editingCar?.transmission ?? 'Manuală'} onChange={(e) => setEditingCar({ ...editingCar, transmission: e.target.value })}>
                    {['Automată', 'Manuală'].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6 }} component="div">
                  <TextField select fullWidth label="Tip Ofertă" value={editingCar?.offerType ?? 'Închiriere săptămânală'} onChange={(e) => setEditingCar({ ...editingCar, offerType: e.target.value })}>
                    {['Închiriere săptămânală', 'La rămânere'].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6 }} component="div">
                  <TextField select fullWidth label="Status Disponibilitate" value={editingCar?.status ?? 'Disponibilă acum'} onChange={(e) => setEditingCar({ ...editingCar, status: e.target.value })}>
                    {['Disponibilă acum', 'În curând', 'Indisponibilă', 'În service'].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6 }} component="div">
                  <TextField
                    select
                    fullWidth
                    label="Sursă închiriere"
                    value={editingCar?.listingSource ?? 'Închiriat de RIDElance'}
                    onChange={(e) => setEditingCar({ ...editingCar, listingSource: e.target.value })}
                  >
                    {Object.keys(LISTING_SOURCE_TO_API).map((o) => (
                      <MenuItem key={o} value={o}>{o}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
              {isPoster && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: DASHBOARD_TOKENS.textSubtle }}>
                  Anunțul va fi publicat după validarea echipei RIDElance.
                </Typography>
              )}
            </Box>

            {/* 2. Pricing & Visibility */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: DASHBOARD_TOKENS.primaryStrong, textTransform: 'uppercase', letterSpacing: 1 }}>
                2. Prețuri și Vizibilitate
              </Typography>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.02) }}>
                <Grid container spacing={3} sx={{ alignItems: 'center' }} component="div">
                  <Grid size={{ xs: 12, md: 4 }} component="div">
                    <TextField 
                      fullWidth 
                      label="Preț săptămână actual (RON)" 
                      type="number" 
                      slotProps={{ input: { startAdornment: <InputAdornment position="start">RON</InputAdornment> } }}
                      value={editingCar?.pricePerWeek ?? ''} 
                      onChange={(e) => setEditingCar({ ...editingCar, pricePerWeek: parseFloat(e.target.value) })} 
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }} component="div">
                    <TextField 
                      fullWidth 
                      label="Preț Vechi / Pre-reducere" 
                      type="number"
                      slotProps={{ input: { startAdornment: <InputAdornment position="start">RON</InputAdornment> } }}
                      value={editingCar?.oldPrice ?? ''} 
                      onChange={(e) => setEditingCar({ ...editingCar, oldPrice: parseFloat(e.target.value) || undefined })} 
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }} component="div">
                    <Stack direction="row" spacing={3} sx={{ justifyContent: { xs: 'flex-start', md: 'center' } }} component="div">
                      <FormControlLabel 
                        control={<Switch checked={editingCar?.discountActive ?? false} onChange={(e) => setEditingCar({ ...editingCar, discountActive: e.target.checked })} />} 
                        label={<Typography sx={{ fontWeight: 700 }}>Reducere</Typography>} 
                      />
                      {!isPoster && (
                        <FormControlLabel 
                          control={<Switch checked={editingCar?.active ?? true} onChange={(e) => setEditingCar({ ...editingCar, active: e.target.checked })} />} 
                          label={<Typography sx={{ fontWeight: 700 }}>Public</Typography>} 
                        />
                      )}
                    </Stack>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }} component="div">
                    <TextField
                      fullWidth
                      label="Garanție (RON)"
                      type="number"
                      slotProps={{ input: { startAdornment: <InputAdornment position="start">RON</InputAdornment> } }}
                      value={editingCar?.garantie ?? ''}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setEditingCar({
                          ...editingCar,
                          garantie: Number.isNaN(v) ? undefined : v,
                        });
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Box>

            {/* 3. Detailed Config */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: DASHBOARD_TOKENS.primaryStrong, textTransform: 'uppercase', letterSpacing: 1 }}>
                3. Configurații Detaliate
              </Typography>
              <Grid container spacing={3} component="div">
                <Grid size={{ xs: 12, md: 6 }} component="div">
                  <Autocomplete 
                    multiple 
                    options={UBER_CATEGORIES} 
                    value={editingCar?.uberCategories ?? []}
                    onChange={(_, v) => setEditingCar({ ...editingCar, uberCategories: v })}
                    renderInput={(params) => <TextField {...params} label="Categorii Uber" placeholder="Selectează..." />}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }} component="div">
                  <Autocomplete 
                    multiple 
                    options={BOLT_CATEGORIES} 
                    value={editingCar?.boltCategories ?? []}
                    onChange={(_, v) => setEditingCar({ ...editingCar, boltCategories: v })}
                    renderInput={(params) => <TextField {...params} label="Categorii Bolt" placeholder="Selectează..." />}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }} component="div">
                  <Autocomplete 
                    multiple 
                    options={BADGES} 
                    value={editingCar?.badges ?? []}
                    onChange={(_, v) => setEditingCar({ ...editingCar, badges: v })}
                    renderInput={(params) => <TextField {...params} label="Insigne (Badges)" />}
                  />
                </Grid>
                <Grid size={12} component="div">
                  <TextField 
                    fullWidth 
                    multiline 
                    rows={3} 
                    label="Descriere Publică" 
                    placeholder="Adaugă detalii despre dotări, istoric, etc..."
                    value={editingCar?.description ?? ''} 
                    onChange={(e) => setEditingCar({ ...editingCar, description: e.target.value })} 
                  />
                </Grid>
              </Grid>
            </Box>

            {/* 4. Media Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: DASHBOARD_TOKENS.primaryStrong, textTransform: 'uppercase', letterSpacing: 1 }}>
                4. Galerie Foto ({localImages.length})
              </Typography>
              
              <Grid container spacing={2} component="div">
                <Grid size={{ xs: 12, sm: 4 }} component="div">
                  <Box
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      height: '100%', minHeight: 180,
                      border: `2px dashed ${dragOver ? DASHBOARD_TOKENS.primary : alpha(DASHBOARD_TOKENS.ink, 0.15)}`,
                      borderRadius: 3, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      bgcolor: dragOver ? alpha(DASHBOARD_TOKENS.primary, 0.04) : alpha(DASHBOARD_TOKENS.ink, 0.01),
                      transition: 'all 0.2s', '&:hover': { borderColor: DASHBOARD_TOKENS.primary, bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.04) }
                    }}
                  >
                    <CloudUploadRoundedIcon sx={{ fontSize: 40, color: alpha(DASHBOARD_TOKENS.ink, 0.2), mb: 1 }} />
                    <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', px: 2, textAlign: 'center' }} component="p">Upload Photos</Typography>
                    <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 8 }} component="div">
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', minHeight: 180 }}>
                    {localImages.map((img, idx) => (
                      <Box key={img.id} sx={{ position: 'relative', width: 120, height: 90, borderRadius: 2, overflow: 'hidden', border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.1)}` }}>
                        <Box component="img" src={img.previewUrl} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <Box sx={{ position: 'absolute', top: 4, left: 4, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', px: 0.6, borderRadius: 1, fontSize: '0.6rem', fontWeight: 900 }}>{idx + 1}</Box>
                        <IconButton size="small" onClick={() => removeImage(img.id)}
                          sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(255,255,255,0.8)', color: '#ef4444', p: 0.2, '&:hover': { bgcolor: '#fff' } }}>
                          <CloseRoundedIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                    ))}
                    {localImages.length === 0 && (
                      <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(DASHBOARD_TOKENS.ink, 0.02), borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ color: DASHBOARD_TOKENS.textSubtle }}>Nicio imagine selectată</Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 3, borderTop: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.05)}` }}>
          <Button onClick={() => setIsCarModalOpen(false)} sx={{ fontWeight: 700, color: DASHBOARD_TOKENS.textSubtle }}>Anulează</Button>
          <Button variant="contained" onClick={handleSaveCar} disabled={uploading}
            sx={{ bgcolor: DASHBOARD_TOKENS.primary, fontWeight: 700, px: 4, borderRadius: 2 }}>
            {uploading ? 'Se salvează...' : 'Salvează Modificările'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

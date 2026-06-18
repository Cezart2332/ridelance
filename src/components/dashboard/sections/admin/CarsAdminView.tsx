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
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { carsService, getCarImageUrl, type Car, type CarLead } from '../../../../services/cars.service';
import carListJson from '../../../../data/car-list.json';
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
import { DASHBOARD_TOKENS, responsiveTableContainerSx } from '../../dashboardTheme';

interface LocalImage {
  id: string;
  previewUrl: string;
  file?: File;
  isExisting?: boolean;
}

const UBER_CATEGORIES = ['UberX', 'Uber Comfort', 'Uber Green', 'Uber Black', 'Uber Kids'];
const BOLT_CATEGORIES = ['Bolt', 'Bolt Comfort', 'Bolt Green', 'Bolt Premium', 'Bolt Economy'];
const BADGES = ['Consum Mic', 'Hybrid', 'GPL', 'Top Rated', 'Nou', 'Reducere'];

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

interface CarBrandData {
  brand: string;
  models: string[];
}

const curatedBrands: CarBrandData[] = [
  {
    brand: 'Tesla',
    models: ['Model 3', 'Model Y', 'Model S', 'Model X']
  },
  {
    brand: 'Dacia',
    models: ['Logan', 'Sandero', 'Jogger', 'Spring', 'Duster', 'Lodgy', 'Dokker', 'Solenza']
  },
  {
    brand: 'Toyota',
    models: ['Prius', 'Corolla', 'Camry', 'Auris', 'Yaris', 'RAV4', 'C-HR', 'Avensis']
  },
  {
    brand: 'Hyundai',
    models: ['Ioniq', 'Ioniq 5', 'Ioniq 6', 'Elantra', 'Accent', 'Tucson', 'Kona', 'i30', 'i20']
  },
  {
    brand: 'Kia',
    models: ['Ceed', 'Niro', 'Stonic', 'Sportage', 'Rio', 'Optima', 'XCeed']
  }
];

const allBrandsData: CarBrandData[] = (() => {
  const list = [...(carListJson as CarBrandData[])];
  
  curatedBrands.forEach(curated => {
    const existing = list.find(item => item.brand.toLowerCase() === curated.brand.toLowerCase());
    if (existing) {
      existing.models = Array.from(new Set([...existing.models, ...curated.models])).sort();
    } else {
      list.push(curated);
    }
  });
  
  return list.sort((a, b) => a.brand.localeCompare(b.brand));
})();

const brandsList = allBrandsData.map(item => item.brand);

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

  const modelsListForSelectedBrand = (() => {
    if (!editingCar?.brand) return [];
    const brandData = allBrandsData.find(
      item => item.brand.toLowerCase() === editingCar.brand!.toLowerCase()
    );
    return brandData ? brandData.models : [];
  })();

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
        listingSource: 'Oferit de RIDElance',
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
      const isNewCar = !carId;
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

      if (isPoster && isNewCar) {
        await carsService.redirectToListingPayment(carId);
        return;
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

  const analyticsTotals = cars.reduce(
    (acc, car) => ({
      views: acc.views + (car.stats?.views ?? 0),
      clicks: acc.clicks + (car.stats?.clicks ?? 0),
      forms: acc.forms + (car.stats?.forms ?? 0),
    }),
    { views: 0, clicks: 0, forms: 0 },
  );

  const posterStats = {
    totalCars: cars.length,
    activeCars: cars.filter(car => car.active).length,
    approvedCars: cars.filter(car => car.approvalStatus === 'Approved').length,
    pendingApproval: cars.filter(car => car.approvalStatus === 'Pending').length,
    pendingPayment: cars.filter(car => car.paymentStatus === 'Pending' || car.paymentStatus === 'PastDue').length,
    paidCars: cars.filter(car => car.paymentStatus === 'Paid').length,
    weeklyPotential: cars
      .filter(car => car.paymentStatus === 'Paid' && car.approvalStatus === 'Approved')
      .reduce((sum, car) => sum + (car.pricePerWeek ?? 0), 0),
  };

  const posterConversionRate = analyticsTotals.views > 0
    ? Math.round((analyticsTotals.forms / analyticsTotals.views) * 1000) / 10
    : 0;

  const topPosterCars = [...cars]
    .sort((a, b) => {
      const aScore = (a.stats?.forms ?? 0) * 5 + (a.stats?.clicks ?? 0) * 2 + (a.stats?.views ?? 0);
      const bScore = (b.stats?.forms ?? 0) * 5 + (b.stats?.clicks ?? 0) * 2 + (b.stats?.views ?? 0);
      return bScore - aScore;
    })
    .slice(0, 3);

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

  const handlePayListing = async (id: string) => {
    try {
      await carsService.redirectToListingPayment(id);
    } catch (error: any) {
      console.error('Error creating car listing checkout:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.title || 'Nu am putut porni plata pentru anunț.';
      alert(errorMessage);
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

      {isPoster && (
        <Stack spacing={2.5} sx={{ mb: 4 }}>
          <Grid container spacing={2} component="div">
            {[
              {
                label: 'Mașini publicate',
                value: posterStats.totalCars,
                sub: `${posterStats.activeCars} vizibile acum`,
                icon: <DirectionsCarFilledRoundedIcon />,
                color: DASHBOARD_TOKENS.primary,
              },
              {
                label: 'Aprobate',
                value: posterStats.approvedCars,
                sub: `${posterStats.pendingApproval} în validare`,
                icon: <CheckCircleRoundedIcon />,
                color: '#047857',
              },
              {
                label: 'Necesită plată',
                value: posterStats.pendingPayment,
                sub: `${posterStats.paidCars} plătite`,
                icon: <PendingActionsRoundedIcon />,
                color: posterStats.pendingPayment > 0 ? '#b45309' : '#047857',
              },
              {
                label: 'Potențial / săptămână',
                value: `${posterStats.weeklyPotential.toLocaleString('ro-RO')} RON`,
                sub: 'din mașini aprobate și plătite',
                icon: <PaymentsRoundedIcon />,
                color: '#0f766e',
              },
            ].map((item) => (
              <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={item.label} component="div">
                <Paper
                  elevation={0}
                  sx={{
                    height: '100%',
                    p: 2.5,
                    borderRadius: DASHBOARD_TOKENS.radius.lg,
                    border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`,
                    bgcolor: '#fff',
                  }}
                >
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: DASHBOARD_TOKENS.textSubtle, fontWeight: 800 }}>
                        {item.label}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 950, color: DASHBOARD_TOKENS.ink, mt: 0.5 }}>
                        {item.value}
                      </Typography>
                      <Typography variant="caption" sx={{ color: DASHBOARD_TOKENS.textSubtle, fontWeight: 650 }}>
                        {item.sub}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 2,
                        display: 'grid',
                        placeItems: 'center',
                        color: item.color,
                        bgcolor: alpha(item.color, 0.1),
                      }}
                    >
                      {item.icon}
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2} component="div">
            <Grid size={{ xs: 12, lg: 5 }} component="div">
              <Paper
                elevation={0}
                sx={{
                  height: '100%',
                  p: 2.5,
                  borderRadius: DASHBOARD_TOKENS.radius.lg,
                  border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`,
                  bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.035),
                }}
              >
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      color: DASHBOARD_TOKENS.primaryStrong,
                      bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.12),
                    }}
                  >
                    <TrendingUpRoundedIcon />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 900, color: DASHBOARD_TOKENS.ink }}>Performanță anunțuri</Typography>
                    <Typography variant="caption" sx={{ color: DASHBOARD_TOKENS.textSubtle, fontWeight: 650 }}>
                      Din traficul și cererile primite în platformă
                    </Typography>
                  </Box>
                </Stack>
                <Grid container spacing={1.5} component="div">
                  {[
                    { label: 'Vizualizări', value: analyticsTotals.views },
                    { label: 'Click-uri', value: analyticsTotals.clicks },
                    { label: 'Cereri', value: analyticsTotals.forms },
                    { label: 'Conversie', value: `${posterConversionRate}%` },
                  ].map((item) => (
                    <Grid size={{ xs: 6, sm: 3, lg: 6 }} key={item.label} component="div">
                      <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#fff', border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.06)}` }}>
                        <Typography variant="caption" sx={{ color: DASHBOARD_TOKENS.textSubtle, fontWeight: 800 }}>
                          {item.label}
                        </Typography>
                        <Typography sx={{ fontWeight: 950, color: DASHBOARD_TOKENS.ink, fontSize: '1.2rem' }}>
                          {typeof item.value === 'number' ? item.value.toLocaleString('ro-RO') : item.value}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, lg: 7 }} component="div">
              <Paper
                elevation={0}
                sx={{
                  height: '100%',
                  p: 2.5,
                  borderRadius: DASHBOARD_TOKENS.radius.lg,
                  border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`,
                  bgcolor: '#fff',
                }}
              >
                <Typography sx={{ fontWeight: 900, color: DASHBOARD_TOKENS.ink, mb: 2 }}>Top anunțuri</Typography>
                <Stack spacing={1.5}>
                  {topPosterCars.length === 0 && (
                    <Typography variant="body2" sx={{ color: DASHBOARD_TOKENS.textSubtle }}>
                      Adaugă prima mașină ca să apară statisticile aici.
                    </Typography>
                  )}
                  {topPosterCars.map((car) => (
                    <Stack
                      key={car.id}
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1.5}
                      sx={{
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        justifyContent: 'space-between',
                        p: 1.5,
                        borderRadius: 2,
                        border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.06)}`,
                      }}
                    >
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
                        <Avatar src={getCarImageUrl(car.images[0]?.imageUrl)} variant="rounded" sx={{ width: 44, height: 44 }}>
                          <DirectionsCarFilledRoundedIcon />
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 850, color: DASHBOARD_TOKENS.ink }} noWrap>
                            {car.brand} {car.model}
                          </Typography>
                          <Typography variant="caption" sx={{ color: DASHBOARD_TOKENS.textSubtle, fontWeight: 650 }}>
                            {car.pricePerWeek.toLocaleString('ro-RO')} RON / săptămână
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                        <Chip icon={<VisibilityRoundedIcon />} label={(car.stats?.views ?? 0).toLocaleString('ro-RO')} size="small" sx={{ fontWeight: 800 }} />
                        <Chip icon={<TouchAppRoundedIcon />} label={(car.stats?.clicks ?? 0).toLocaleString('ro-RO')} size="small" sx={{ fontWeight: 800 }} />
                        <Chip icon={<DescriptionRoundedIcon />} label={(car.stats?.forms ?? 0).toLocaleString('ro-RO')} size="small" sx={{ fontWeight: 800 }} />
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      )}

      <Paper elevation={0} sx={{ mb: 4, borderRadius: DASHBOARD_TOKENS.radius.lg, border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`, overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ px: 2, borderBottom: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.05)}`, '& .MuiTab-root': { fontWeight: 700, py: 2 } }}
        >
          <Tab icon={<DirectionsCarFilledRoundedIcon sx={{ fontSize: 20 }} />} iconPosition="start" label={isPoster ? 'Mașini' : 'Parc Auto'} />
          {!isPoster && <Tab icon={<AssignmentIndRoundedIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Solicitări" />}
          {!isPoster && <Tab icon={<BarChartRoundedIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Analytics" />}
          {!isPoster && <Tab icon={<AssignmentIndRoundedIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Validare" />}
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
                      {!isPoster && <TableCell sx={{ fontWeight: 800 }}>Sursă</TableCell>}
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
                            {isPoster && car.paymentStatus !== 'Paid' && car.paymentStatus !== 'NotRequired' && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handlePayListing(car.id)}
                                sx={{ fontWeight: 800, fontSize: '0.68rem', borderRadius: 2, textTransform: 'none' }}
                              >
                                Plătește 30 lei/lună
                              </Button>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={car.active}
                            onChange={() => handleToggleCarActive(car.id)}
                            color="primary"
                            disabled={isPoster && (car.approvalStatus !== 'Approved' || car.paymentStatus !== 'Paid')}
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
                <Grid size={{ xs: 12, sm: 6, md: 6 }} component="div">
                  <Autocomplete
                    freeSolo
                    options={brandsList}
                    value={editingCar?.brand ?? ''}
                    onChange={(_, newValue) => {
                      setEditingCar(prev => prev ? {
                        ...prev,
                        brand: newValue ?? '',
                        model: ''
                      } : null);
                    }}
                    onInputChange={(_, newInputValue) => {
                      setEditingCar(prev => prev ? {
                        ...prev,
                        brand: newInputValue,
                        model: ''
                      } : null);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Brand"
                        variant="outlined"
                        fullWidth
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6 }} component="div">
                  <Autocomplete
                    freeSolo
                    options={modelsListForSelectedBrand}
                    value={editingCar?.model ?? ''}
                    onChange={(_, newValue) => {
                      setEditingCar(prev => prev ? {
                        ...prev,
                        model: newValue ?? ''
                      } : null);
                    }}
                    onInputChange={(_, newInputValue) => {
                      setEditingCar(prev => prev ? {
                        ...prev,
                        model: newInputValue
                      } : null);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Model"
                        variant="outlined"
                        fullWidth
                      />
                    )}
                  />
                </Grid>
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
              </Grid>
              {isPoster && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: DASHBOARD_TOKENS.textSubtle }}>
                  După salvare vei fi redirecționat către plata lunară de 30 lei pentru publicarea mașinii. Anunțul intră apoi în validarea echipei RIDElance.
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

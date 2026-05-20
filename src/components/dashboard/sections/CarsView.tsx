import { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Stack, 
  TextField, 
  MenuItem,
  InputAdornment,
  LinearProgress,
  Paper,
  Button,
  Grid,
  Collapse
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded';

import { DASHBOARD_TOKENS } from '../dashboardTheme';
import { carsService, type Car } from '../../../services/cars.service';
import CarCard from './cars/CarCard';
import { matchesOfferTypeFilter, matchesStatusFilter } from '../../../utils/carLabels';
import RentFormModal from './cars/RentFormModal';

export function CarsView() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter States
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('Toate');
  const [offerType, setOfferType] = useState('Toate');
  const [engine, setEngine] = useState('Toate');
  const [transmission, setTransmission] = useState('Toate');
  const [status, setStatus] = useState('Toate');
  const [platform, setPlatform] = useState('Toate');
  const [sort, setSort] = useState('Preț: Mic la Mare');

  const fetchCars = useCallback(async () => {
    setLoading(true);
    try {
      const data = await carsService.getAll();
      setCars(data);
    } catch (error) {
      console.error('Error fetching cars:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  const handleRentClick = (car: Car) => {
    setSelectedCar(car);
    setModalOpen(true);
  };

  const filteredCars = useMemo(() => {
    let result = [...cars];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c => c.brand.toLowerCase().includes(q) || c.model.toLowerCase().includes(q));
    }

    if (city !== 'Toate') result = result.filter(c => c.location.includes(city));
    if (offerType !== 'Toate') result = result.filter(c => matchesOfferTypeFilter(c.offerType, offerType));
    if (engine !== 'Toate') result = result.filter(c => c.engine === engine);
    if (transmission !== 'Toate') result = result.filter(c => c.transmission === transmission);
    if (status !== 'Toate') {
      result = result.filter(c => matchesStatusFilter(c.status, status));
    }
    if (platform !== 'Toate') {
      result = result.filter(c => 
        [...c.uberCategories, ...c.boltCategories].some(cat => cat.toLowerCase().includes(platform.toLowerCase()))
      );
    }

    // Sort
    if (sort === 'Preț: Mic la Mare') result.sort((a, b) => a.pricePerWeek - b.pricePerWeek);
    if (sort === 'Preț: Mare la Mic') result.sort((a, b) => b.pricePerWeek - a.pricePerWeek);

    return result;
  }, [cars, search, city, offerType, engine, transmission, status, platform, sort]);

  const activeFiltersCount = [city, offerType, engine, transmission, status, platform].filter(f => f !== 'Toate').length;

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header & Filter Controls */}
      <Stack spacing={3} sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 2, 
          alignItems: 'center', 
          justifyContent: 'space-between'
        }}>
          <Typography variant="h4" sx={{ fontWeight: 900, color: DASHBOARD_TOKENS.ink }}>
            Parcul Auto
          </Typography>
          
          <Stack direction="row" spacing={2} sx={{ flex: { xs: 1, md: 'none' }, minWidth: { xs: '100%', md: 400 } }}>
            <TextField
              fullWidth
              placeholder="Caută mașină..."
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  borderRadius: DASHBOARD_TOKENS.radius.md,
                  bgcolor: DASHBOARD_TOKENS.paper 
                } 
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon sx={{ color: alpha(DASHBOARD_TOKENS.ink, 0.4) }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button
              variant={showFilters ? "contained" : "outlined"}
              startIcon={<FilterListRoundedIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ 
                borderRadius: DASHBOARD_TOKENS.radius.md,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                px: 3,
                borderColor: alpha(DASHBOARD_TOKENS.ink, 0.1),
                color: showFilters ? '#fff' : DASHBOARD_TOKENS.ink,
                bgcolor: showFilters ? DASHBOARD_TOKENS.ink : 'transparent',
                '&:hover': {
                  bgcolor: showFilters ? alpha(DASHBOARD_TOKENS.ink, 0.9) : alpha(DASHBOARD_TOKENS.ink, 0.04),
                  borderColor: alpha(DASHBOARD_TOKENS.ink, 0.2)
                }
              }}
            >
              Filtre {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>
          </Stack>
        </Box>

        <Collapse in={showFilters}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: DASHBOARD_TOKENS.radius.lg, 
              border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`,
              bgcolor: alpha(DASHBOARD_TOKENS.surface, 0.4)
            }}
          >
            <Grid container spacing={2} component="div">
              {[
                { label: 'Oraș', value: city, setter: setCity, options: ['Toate', 'București', 'Cluj-Napoca', 'Brașov', 'Timișoara', 'Iași', 'Constanța'] },
                { label: 'Tip ofertă', value: offerType, setter: setOfferType, options: ['Toate', 'Închiriere săptămânală', 'La rămânere'] },
                { label: 'Motorizare', value: engine, setter: setEngine, options: ['Toate', 'Electric', 'Hybrid', 'GPL', 'Benzină', 'Diesel'] },
                { label: 'Cutie', value: transmission, setter: setTransmission, options: ['Toate', 'Automată', 'Manuală'] },
                { label: 'Status', value: status, setter: setStatus, options: ['Toate', 'Disponibilă', 'În curând'] },
                { label: 'Platformă', value: platform, setter: setPlatform, options: ['Toate', 'Uber', 'Bolt'] },
              ].map((f) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={f.label} component="div">
                  <Typography variant="caption" sx={{ fontWeight: 800, color: alpha(DASHBOARD_TOKENS.ink, 0.5), mb: 0.5, display: 'block' }} component="p">
                    {f.label}
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={f.value}
                    onChange={(e) => f.setter(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: DASHBOARD_TOKENS.radius.md, bgcolor: '#fff' } }}
                  >
                    {f.options.map(opt => (
                      <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Collapse>
      </Stack>

      {/* Sorting & Stats Info */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ color: DASHBOARD_TOKENS.textSubtle, fontWeight: 600 }}>
          {filteredCars.length} {filteredCars.length === 1 ? 'mașină găsită' : 'mașini găsite'}
        </Typography>
        
        <TextField
          select
          size="small"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          sx={{ 
            minWidth: 180,
            '& .MuiOutlinedInput-root': { 
              borderRadius: DASHBOARD_TOKENS.radius.md,
              bgcolor: DASHBOARD_TOKENS.paper 
            } 
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SortRoundedIcon sx={{ color: alpha(DASHBOARD_TOKENS.ink, 0.4), fontSize: 18 }} />
                </InputAdornment>
              ),
            },
          }}
        >
          {['Preț: Mic la Mare', 'Preț: Mare la Mic'].map(opt => (
            <MenuItem key={opt} value={opt} sx={{ fontWeight: 600 }}>{opt}</MenuItem>
          ))}
        </TextField>
      </Box>

      {loading && <LinearProgress sx={{ mb: 4, borderRadius: 1 }} />}

      {/* Cars Grid */}
      {filteredCars.length > 0 ? (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, 
          gap: 3 
        }}>
          {filteredCars.map((car) => (
            <CarCard key={car.id} car={car} onRentClick={handleRentClick} />
          ))}
        </Box>
      ) : !loading && (
        <Paper sx={{ py: 8, textAlign: 'center', borderRadius: DASHBOARD_TOKENS.radius.xl, border: `1px dashed ${alpha(DASHBOARD_TOKENS.ink, 0.1)}` }} elevation={0}>
          <DirectionsCarFilledRoundedIcon sx={{ fontSize: 48, color: alpha(DASHBOARD_TOKENS.ink, 0.1), mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: DASHBOARD_TOKENS.ink }}>
            Nicio mașină găsită
          </Typography>
          <Typography sx={{ color: DASHBOARD_TOKENS.textSubtle }}>
            Încearcă să schimbi filtrele.
          </Typography>
        </Paper>
      )}

      <RentFormModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        car={selectedCar} 
      />
    </Box>
  );
}

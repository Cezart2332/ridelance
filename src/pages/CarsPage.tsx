import { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Stack, 
  Container, 
  Button,
  TextField,
  MenuItem,
  InputAdornment,
  LinearProgress,
  Paper,
  Grid,
  Collapse
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import FlashOnRoundedIcon from '@mui/icons-material/FlashOnRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded';

import { TOKENS } from '../constants/tokens';
import { carsService, type Car } from '../services/cars.service';
import CarCard from '../components/dashboard/sections/cars/CarCard';
import RentFormModal from '../components/dashboard/sections/cars/RentFormModal';

export function CarsPage() {
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
    if (offerType !== 'Toate') result = result.filter(c => c.offerType === offerType);
    if (engine !== 'Toate') result = result.filter(c => c.engine === engine);
    if (transmission !== 'Toate') result = result.filter(c => c.transmission === transmission);
    if (status !== 'Toate') {
      if (status === 'Disponibilă') result = result.filter(c => c.status === 'Disponibilă acum');
      else result = result.filter(c => c.status === 'În curând');
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

  const benefits = [
    {
      title: 'Mașini verificate',
      description: 'Vehicule listate cu poze, detalii clare și condiții transparente.',
      icon: <CheckCircleRoundedIcon sx={{ fontSize: 32, color: '#10b981' }} />,
      color: '#10b981'
    },
    {
      title: 'Preț săptămânal clar',
      description: 'Vezi din start costul de utilizare, fără discuții inutile.',
      icon: <AccountBalanceWalletRoundedIcon sx={{ fontSize: 32, color: '#6366f1' }} />,
      color: '#6366f1'
    },
    {
      title: 'Aplicare rapidă',
      description: 'Completezi formularul, iar echipa RIDElance te contactează pentru detalii.',
      icon: <FlashOnRoundedIcon sx={{ fontSize: 32, color: '#f59e0b' }} />,
      color: '#f59e0b'
    }
  ];

  return (
    <Box sx={{ pb: 10, bgcolor: TOKENS.surface }}>
      {/* Hero Section */}
      <Box sx={{ 
        pt: { xs: 8, md: 12 }, 
        pb: { xs: 8, md: 14 },
        background: `linear-gradient(180deg, ${alpha(TOKENS.primary, 0.08)} 0%, transparent 100%)`,
        borderBottom: `1px solid ${TOKENS.border}`
      }}>
        <Container maxWidth="lg">
          <Stack spacing={4} sx={{ maxWidth: 900 }} component="div">
            <Box>
              <Typography variant="h2" sx={{ 
                fontWeight: 900, 
                color: TOKENS.ink, 
                letterSpacing: '-0.03em',
                mb: 2,
                fontSize: { xs: '2.5rem', md: '4rem' },
                lineHeight: 1.1
              }}>
                Alege o mașină pregătită pentru <Box component="span" sx={{ color: TOKENS.primaryStrong }}>Ridesharing</Box>
              </Typography>
              <Typography variant="h5" sx={{ 
                color: TOKENS.textMuted, 
                fontWeight: 500,
                lineHeight: 1.6,
                fontSize: { xs: '1.1rem', md: '1.4rem' },
                maxWidth: 700
              }}>
                Găsește vehiculul ideal pentru Uber sau Bolt. Închiriere săptămânală sau opțiuni de tip „la rămânere”, cu proces de aplicare 100% online.
              </Typography>
            </Box>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} component="div">
              <Button 
                variant="contained" 
                size="large"
                href="#cars-grid"
                sx={{ 
                  px: 5,
                  py: 2.2,
                  borderRadius: TOKENS.radius.full,
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  textTransform: 'none',
                  boxShadow: TOKENS.shadow.glow,
                  '&:hover': {
                    backgroundColor: TOKENS.primaryStrong,
                    transform: 'translateY(-2px)',
                    boxShadow: TOKENS.shadow.xl,
                  }
                }}
              >
                Explorează flota
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Benefits Section */}
      <Container maxWidth="lg" sx={{ mt: -8 }}>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, 
          gap: 4 
        }}>
          {benefits.map((benefit, i) => (
            <Box key={i} sx={{ 
              p: 4, 
              bgcolor: TOKENS.paper, 
              borderRadius: TOKENS.radius.xl,
              boxShadow: TOKENS.shadow.lg,
              border: `1px solid ${TOKENS.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-6px)', boxShadow: TOKENS.shadow.xl }
            }}>
              <Box sx={{ 
                width: 64, 
                height: 64, 
                borderRadius: TOKENS.radius.lg, 
                bgcolor: alpha(benefit.color, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {benefit.icon}
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: TOKENS.ink, mb: 1 }}>
                  {benefit.title}
                </Typography>
                <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.95rem', lineHeight: 1.7 }}>
                  {benefit.description}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>

      {/* Filter & Search Bar */}
      <Container maxWidth="lg" sx={{ mt: 10 }}>
        <Stack spacing={4} component="div">
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 2.5, 
            alignItems: 'center', 
            justifyContent: 'space-between'
          }}>
            <Stack direction="row" spacing={2} sx={{ flex: 1, minWidth: { xs: '100%', md: 450 } }} component="div">
              <TextField
                fullWidth
                placeholder="Caută model sau brand (ex: Logan, Tesla...)"
                size="medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: TOKENS.radius.lg,
                    bgcolor: TOKENS.paper,
                    boxShadow: TOKENS.shadow.sm
                  } 
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon sx={{ color: TOKENS.textSubtle }} />
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
                  borderRadius: TOKENS.radius.lg,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  px: 3.5,
                  borderColor: TOKENS.border,
                  color: showFilters ? '#fff' : TOKENS.ink,
                  bgcolor: showFilters ? TOKENS.ink : 'transparent',
                  '&:hover': {
                    bgcolor: showFilters ? alpha(TOKENS.ink, 0.9) : alpha(TOKENS.ink, 0.04),
                    borderColor: TOKENS.borderHover
                  }
                }}
              >
                Filtre {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </Button>
            </Stack>

            <TextField
              select
              size="medium"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              sx={{ 
                minWidth: 220,
                '& .MuiOutlinedInput-root': { 
                  borderRadius: TOKENS.radius.lg,
                  bgcolor: TOKENS.paper,
                  boxShadow: TOKENS.shadow.sm
                } 
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SortRoundedIcon sx={{ color: TOKENS.textSubtle, fontSize: 20 }} />
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

          <Collapse in={showFilters}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 4, 
                borderRadius: TOKENS.radius.xl, 
                border: `1px solid ${TOKENS.border}`,
                bgcolor: TOKENS.surfaceAlt,
                boxShadow: TOKENS.shadow.md
              }}
            >
              <Grid container spacing={3} component="div">
                {[
                  { label: 'Oraș', value: city, setter: setCity, options: ['Toate', 'București', 'Cluj-Napoca', 'Brașov', 'Timișoara', 'Iași', 'Constanța'] },
                  { label: 'Tip ofertă', value: offerType, setter: setOfferType, options: ['Toate', 'Închiriere săptămânală', 'La rămânere'] },
                  { label: 'Motorizare', value: engine, setter: setEngine, options: ['Toate', 'Electric', 'Hybrid', 'GPL', 'Benzină', 'Diesel'] },
                  { label: 'Cutie', value: transmission, setter: setTransmission, options: ['Toate', 'Automată', 'Manuală'] },
                  { label: 'Status', value: status, setter: setStatus, options: ['Toate', 'Disponibilă', 'În curând'] },
                  { label: 'Platformă', value: platform, setter: setPlatform, options: ['Toate', 'Uber', 'Bolt'] },
                ].map((f) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={f.label} component="div">
                    <Typography variant="caption" sx={{ fontWeight: 800, color: TOKENS.textMuted, mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }} component="p">
                      {f.label}
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={f.value}
                      onChange={(e) => f.setter(e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: TOKENS.radius.md, bgcolor: '#fff' } }}
                    >
                      {f.options.map(opt => (
                        <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                ))}
              </Grid>
              
              {activeFiltersCount > 0 && (
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    size="small" 
                    variant="text"
                    startIcon={<CloseRoundedIcon />}
                    onClick={() => {
                      setCity('Toate'); setOfferType('Toate'); setEngine('Toate'); 
                      setTransmission('Toate'); setStatus('Toate'); setPlatform('Toate');
                    }}
                    sx={{ color: TOKENS.textMuted, fontWeight: 700, '&:hover': { color: TOKENS.primaryStrong } }}
                  >
                    Resetează toate filtrele
                  </Button>
                </Box>
              )}
            </Paper>
          </Collapse>
        </Stack>
      </Container>

      {/* Cars Grid */}
      <Container maxWidth="lg" id="cars-grid" sx={{ mt: 8 }}>
        <Box sx={{ mb: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: TOKENS.ink, mb: 1 }}>
              {activeFiltersCount > 0 || search ? 'Rezultate căutare' : 'Flota noastră'}
            </Typography>
            <Typography sx={{ color: TOKENS.textMuted, fontWeight: 500 }}>
              {filteredCars.length} {filteredCars.length === 1 ? 'mașină disponibilă' : 'mașini disponibile'} pentru tine
            </Typography>
          </Box>
        </Box>

        {loading && <LinearProgress sx={{ mb: 6, borderRadius: 2, height: 6, bgcolor: alpha(TOKENS.primary, 0.1) }} />}

        {filteredCars.length > 0 ? (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, 
            gap: { xs: 3, md: 5 } 
          }}>
            {filteredCars.map((car) => (
              <CarCard key={car.id} car={car} onRentClick={handleRentClick} />
            ))}
          </Box>
        ) : !loading && (
          <Paper sx={{ py: 12, textAlign: 'center', borderRadius: TOKENS.radius.xl, border: `2px dashed ${TOKENS.border}`, bgcolor: 'transparent' }} elevation={0}>
            <DirectionsCarFilledRoundedIcon sx={{ fontSize: 64, color: TOKENS.textSubtle, mb: 3 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: TOKENS.ink, mb: 1.5 }}>
              Nu am găsit nimic care să corespundă
            </Typography>
            <Typography sx={{ color: TOKENS.textMuted, maxWidth: 400, mx: 'auto' }}>
              Încearcă să resetezi filtrele sau să folosești termeni de căutare mai generali.
            </Typography>
          </Paper>
        )}

      </Container>

      <RentFormModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        car={selectedCar} 
      />
    </Box>
  );
}

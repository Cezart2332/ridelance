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
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import { useFavoriteCarIds } from '../services/carFavorites';

import { TOKENS } from '../constants/tokens';
import { FleetMap } from '../components/cars/map/LazyMaps';
import type { FleetMapPoint } from '../components/cars/map/FleetMap';
import { formatCarStatus } from '../utils/carLabels';
import { hasActiveDiscount } from '../utils/carPricing';

/** Cum se împarte ecranul între listă și hartă. */
type FleetView = 'list' | 'split' | 'map';

const VIEW_OPTIONS: { id: FleetView; label: string }[] = [
  { id: 'list', label: 'Listă' },
  { id: 'split', label: 'Split' },
  { id: 'map', label: 'Hartă' },
];

/** Marginile hărții la momentul apăsării pe „Caută în această zonă". */
interface MapBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}
import { carsService, type Car } from '../services/cars.service';
import CarListCard from '../components/cars/CarListCard';
import { matchesOfferTypeFilter, matchesStatusFilter } from '../utils/carLabels';
import { DEFAULT_SORT, SORT_OPTIONS, sortKeyFor, type SortOption } from '../utils/carSorting';

export function CarsPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter States
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('Toate');
  const [offerType, setOfferType] = useState('Toate');
  const [engine, setEngine] = useState('Toate');
  const [transmission, setTransmission] = useState('Toate');
  const [status, setStatus] = useState('Toate');
  const [platform, setPlatform] = useState('Toate');
  const [sort, setSort] = useState<SortOption>(DEFAULT_SORT);
  /** Doar mașinile salvate la favorite. Merge și fără cont — favoritele din browser. */
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const favoriteIds = useFavoriteCarIds();

  /**
   * Cum se împarte ecranul între listă și hartă. „Split" e implicit pe desktop: harta răspunde
   * la „unde e mașina", lista la „ce e mașina", iar ambele întrebări se pun în același timp.
   */
  const [view, setView] = useState<FleetView>('split');
  const [activeCarId, setActiveCarId] = useState<string | null>(null);
  /** Marginile alese prin „Caută în această zonă". `null` = fără restricție geografică. */
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);

  // Refetch la schimbarea sortării: ordinea vine de la server, care e singurul care știe scorul.
  const fetchCars = useCallback(async () => {
    setLoading(true);
    try {
      const data = await carsService.getAll(sortKeyFor(sort));
      setCars(data);
    } catch (error) {
      console.error('Error fetching cars:', error);
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  const filteredCars = useMemo(() => {
    let result = [...cars];

    if (onlyFavorites) {
      const saved = new Set(favoriteIds);
      result = result.filter(c => saved.has(c.id));
    }

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

    // „Caută în această zonă": mașinile fără coordonate ies din listă cât timp filtrul e activ,
    // fiindcă despre ele nu putem spune dacă sunt înăuntru sau afară.
    if (mapBounds) {
      result = result.filter((c) => {
        const lat = c.details?.latitude;
        const lng = c.details?.longitude;
        if (lat == null || lng == null) return false;
        return lng >= mapBounds.west && lng <= mapBounds.east && lat >= mapBounds.south && lat <= mapBounds.north;
      });
    }

    // Filtrarea păstrează ordinea primită de la server; nu se re-sortează local.
    return result;
  }, [cars, search, city, offerType, engine, transmission, status, platform, mapBounds, onlyFavorites, favoriteIds]);

  // Favoritele care chiar sunt în listă: o mașină salvată, retrasă între timp, nu se numără.
  const favoriteCount = useMemo(() => {
    const saved = new Set(favoriteIds);
    return cars.filter(c => saved.has(c.id)).length;
  }, [cars, favoriteIds]);

  /**
   * Punctele hărții. Mașinile fără coordonate nu apar — anunțurile de dinaintea fluxului cu pin
   * n-au locație, iar plasarea lor în centrul orașului ar fi fost o informație inventată.
   */
  const mapPoints = useMemo<FleetMapPoint[]>(
    () =>
      filteredCars
        .filter((c) => c.details?.latitude != null && c.details?.longitude != null)
        .map((c) => ({
          id: c.id,
          slug: c.slug,
          latitude: c.details!.latitude!,
          longitude: c.details!.longitude!,
          title: `${c.brand} ${c.model}, ${c.year}`,
          pricePerWeek: c.pricePerWeek,
          oldPrice: hasActiveDiscount(c) ? c.oldPrice : undefined,
          imageUrl: c.images[0]?.imageUrl,
          // Trei cel mult: cardul are 268px, iar al patrulea chip ar trece pe rândul următor
          // și ar împinge prețul în afara primei priviri.
          specs: [c.location, c.engine, c.transmission].filter(Boolean).slice(0, 3),
          statusLabel: formatCarStatus(c.status),
          available: c.status === 'Available',
        })),
    [filteredCars],
  );

  const activeFiltersCount = [city, offerType, engine, transmission, status, platform].filter(f => f !== 'Toate').length;

  // Ce primești, pe scurt. Erau trei carduri mari sub hero, care împingeau mașinile sub ecran:
  // cine intră pe pagină vine să vadă mașini, nu să citească despre ele.
  const benefits = [
    { label: 'Mașini verificate', icon: CheckCircleRoundedIcon, color: '#10b981' },
    { label: 'Preț săptămânal clar', icon: AccountBalanceWalletRoundedIcon, color: '#6366f1' },
    { label: 'Aplicare rapidă, online', icon: FlashOnRoundedIcon, color: '#f59e0b' },
  ];

  return (
    <Box sx={{ pb: 8, bgcolor: TOKENS.surface }}>
      {/* Hero: titlu scurt și beneficiile pe un rând, ca grila să înceapă din primul ecran */}
      <Box sx={{
        pt: { xs: 2, md: 4.5 },
        pb: { xs: 1.5, md: 3 },
        background: `linear-gradient(180deg, ${alpha(TOKENS.primary, 0.08)} 0%, transparent 100%)`,
      }}>
        <Container maxWidth="lg">
          <Typography component="h1" sx={{
            fontWeight: 900,
            color: TOKENS.ink,
            letterSpacing: '-0.02em',
            fontSize: { xs: '1.35rem', md: '2.2rem' },
            lineHeight: 1.15,
          }}>
            Alege o mașină pregătită pentru <Box component="span" sx={{ color: TOKENS.primaryStrong }}>Ridesharing</Box>
          </Typography>
          <Typography sx={{ display: { xs: 'none', sm: 'block' }, color: TOKENS.textMuted, fontSize: { xs: '0.9rem', md: '0.98rem' }, mt: 0.75, maxWidth: 680, lineHeight: 1.5 }}>
            Pentru Uber sau Bolt, cu închiriere săptămânală sau la rămânere și aplicare 100% online.
          </Typography>
          <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', columnGap: { xs: 1.5, md: 2.5 }, rowGap: 0.5, mt: { xs: 1, md: 1.5 } }}>
            {benefits.map(({ label, icon: Icon, color }) => (
              <Stack key={label} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                <Icon sx={{ fontSize: { xs: 15, md: 17 }, color }} />
                <Typography sx={{ fontSize: { xs: '0.74rem', md: '0.82rem' }, fontWeight: 700, color: TOKENS.ink }}>{label}</Typography>
              </Stack>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* Filter & Search Bar */}
      <Container maxWidth="lg" sx={{ mt: { xs: 1, md: 1.5 } }}>
        <Stack spacing={1.5} component="div">
          <Stack
            direction="row"
            useFlexGap
            // Pe telefon: căutarea pe tot rândul, iar Filtre, Favorite și sortarea pe rândul de sub
            // ea — nu patru rânduri stivuite, care împingeau prima mașină sub ecran.
            sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' }, gap: 1.25, alignItems: 'center', justifyContent: 'space-between' }}
            component="div"
          >
            <Stack
              direction="row"
              useFlexGap
              sx={{ display: { xs: 'contents', md: 'flex' }, gap: 1.25, flex: 1, minWidth: 0 }}
              component="div"
            >
              <TextField
                fullWidth
                placeholder="Caută model sau brand (ex: Logan, Tesla...)"
                size="small"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ 
                  flex: { xs: '1 1 100%', md: '1 1 auto' },
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: `${TOKENS.radius.lg}px`,
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
                  borderRadius: `${TOKENS.radius.lg}px`,
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  whiteSpace: 'nowrap',
                  px: { xs: 1, sm: 2.5 },
                  flex: { xs: '1 1 0', md: '0 0 auto' },
                  minWidth: 0,
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
              <Button
                variant={onlyFavorites ? "contained" : "outlined"}
                startIcon={onlyFavorites ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
                onClick={() => setOnlyFavorites(!onlyFavorites)}
                aria-pressed={onlyFavorites}
                sx={{
                  borderRadius: `${TOKENS.radius.lg}px`,
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  whiteSpace: 'nowrap',
                  px: { xs: 1, sm: 2.25 },
                  flex: { xs: '1 1 0', md: '0 0 auto' },
                  minWidth: 0,
                  borderColor: onlyFavorites ? '#e11d48' : TOKENS.border,
                  color: onlyFavorites ? '#fff' : TOKENS.ink,
                  bgcolor: onlyFavorites ? '#e11d48' : 'transparent',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: onlyFavorites ? '#be123c' : alpha(TOKENS.ink, 0.04),
                    borderColor: onlyFavorites ? '#be123c' : TOKENS.borderHover,
                    boxShadow: 'none',
                  }
                }}
              >
                Favorite {favoriteCount > 0 && `(${favoriteCount})`}
              </Button>
            </Stack>

            <TextField
              select
              size="small"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              sx={{ 
                flex: { xs: '1 1 0', md: '0 0 auto' },
                minWidth: { xs: 0, md: 200 },
                '& .MuiSelect-select': { fontSize: '0.85rem' },
                '& .MuiOutlinedInput-root': { 
                  borderRadius: `${TOKENS.radius.lg}px`,
                  bgcolor: TOKENS.paper,
                  boxShadow: TOKENS.shadow.sm
                } 
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start" sx={{ display: { xs: 'none', sm: 'flex' } }}>
                      <SortRoundedIcon sx={{ color: TOKENS.textSubtle, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
              }}
            >
              {SORT_OPTIONS.map(opt => (
                <MenuItem key={opt} value={opt} sx={{ fontWeight: 600 }}>{opt}</MenuItem>
              ))}
            </TextField>
          </Stack>

          <Collapse in={showFilters}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: { xs: 2, md: 2.5 }, borderRadius: `${TOKENS.radius.md}px`, 
                border: `1px solid ${TOKENS.border}`,
                bgcolor: TOKENS.surfaceAlt,
                boxShadow: 'none'
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
                    <Typography variant="caption" sx={{ fontWeight: 800, color: TOKENS.textMuted, mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }} component="p">
                      {f.label}
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={f.value}
                      onChange={(e) => f.setter(e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${TOKENS.radius.md}px`, bgcolor: '#fff' } }}
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
                      // Ștergerea filtrelor readuce și sortarea implicită (spec §5.1).
                      setSort(DEFAULT_SORT);
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
      <Container maxWidth="lg" id="cars-grid" sx={{ mt: { xs: 2, md: 2.5 } }}>
        <Box sx={{ mb: 1.75, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', minWidth: 0 }}>
            <Typography component="h2" sx={{ fontWeight: 850, color: TOKENS.ink, fontSize: { xs: '1.02rem', md: '1.12rem' } }}>
              {onlyFavorites ? 'Mașinile tale favorite' : activeFiltersCount > 0 || search ? 'Rezultate căutare' : 'Mașini disponibile'}
            </Typography>
            <Typography sx={{ color: TOKENS.textMuted, fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
              {filteredCars.length} {filteredCars.length === 1 ? 'mașină' : 'mașini'}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            {mapBounds && (
              <Button
                size="small"
                startIcon={<CloseRoundedIcon />}
                onClick={() => setMapBounds(null)}
                sx={{ textTransform: 'none', fontWeight: 700, color: TOKENS.textMuted }}
              >
                Toată zona
              </Button>
            )}

            <Box
              role="group"
              aria-label="Mod de afișare"
              sx={{
                display: { xs: 'none', md: 'inline-flex' },
                p: 0.4,
                gap: 0.4,
                borderRadius: `${TOKENS.radius.full}px`,
                border: `1px solid ${TOKENS.border}`,
                bgcolor: TOKENS.paper,
              }}
            >
              {VIEW_OPTIONS.map((option) => (
                <Button
                  key={option.id}
                  size="small"
                  onClick={() => setView(option.id)}
                  aria-pressed={view === option.id}
                  sx={{
                    minWidth: 0,
                    px: 1.6,
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: `${TOKENS.radius.full}px`,
                    color: view === option.id ? TOKENS.paper : TOKENS.textMuted,
                    bgcolor: view === option.id ? TOKENS.ink : 'transparent',
                    '&:hover': { bgcolor: view === option.id ? TOKENS.ink : alpha(TOKENS.ink, 0.05) },
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </Box>
          </Stack>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2, borderRadius: 2, height: 6, bgcolor: alpha(TOKENS.primary, 0.1) }} />}

        {filteredCars.length > 0 ? (
          <Box
            sx={{
              display: 'grid',
              alignItems: 'start',
              gridTemplateColumns: {
                xs: '1fr',
                lg: view === 'split' ? 'minmax(0, 1fr) minmax(0, 1fr)' : '1fr',
              },
              gap: { xs: 2, md: 2.5 },
            }}
          >
            {view !== 'map' && (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: view === 'split' ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                    lg: view === 'split' ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                  },
                  gap: { xs: 2, md: 2.25 },
                }}
              >
                {filteredCars.map((car) => (
                  <Box
                    key={car.id}
                    // Trecerea peste card ridică pinul corespunzător: legătura dintre listă și
                    // hartă e ce face vederea împărțită utilă, nu simpla lor alăturare.
                    onMouseEnter={() => setActiveCarId(car.id)}
                    onMouseLeave={() => setActiveCarId(null)}
                  >
                    <CarListCard car={car} />
                  </Box>
                ))}
              </Box>
            )}

            {view !== 'list' && (
              <Box
                sx={{
                  position: { lg: 'sticky' },
                  top: { lg: 96 },
                  height: { xs: 420, lg: view === 'map' ? 640 : 'calc(100vh - 140px)' },
                }}
              >
                <FleetMap
                  points={mapPoints}
                  activeId={activeCarId}
                  onSelect={setActiveCarId}
                  onBoundsSearch={setMapBounds}
                />
              </Box>
            )}
          </Box>
        ) : !loading && (
          <Paper sx={{ py: 7, textAlign: 'center', borderRadius: `${TOKENS.radius.lg}px`, border: `2px dashed ${TOKENS.border}`, bgcolor: 'transparent' }} elevation={0}>
            <DirectionsCarFilledRoundedIcon sx={{ fontSize: 64, color: TOKENS.textSubtle, mb: 3 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: TOKENS.ink, mb: 1.5 }}>
              {onlyFavorites && favoriteCount === 0 ? 'Nicio mașină la favorite' : 'Nu am găsit nimic care să corespundă'}
            </Typography>
            <Typography sx={{ color: TOKENS.textMuted, maxWidth: 400, mx: 'auto' }}>
              {onlyFavorites && favoriteCount === 0
                ? 'Apasă pe inima de pe o mașină ca s-o salvezi aici.'
                : 'Încearcă să resetezi filtrele sau să folosești termeni de căutare mai generali.'}
            </Typography>
          </Paper>
        )}

      </Container>
    </Box>
  );
}

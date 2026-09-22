import { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Button, Container, alpha, Stack, Skeleton, IconButton } from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { useNavigate } from 'react-router-dom';
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded';
import { TOKENS } from '../../constants/tokens';
import { carsService, type Car } from '../../services/cars.service';
import CarListCard from '../cars/CarListCard';

export function CarCarousel() {
  const navigate = useNavigate();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);
  /** Unde se poate derula: săgeata spre capătul atins se stinge. */
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setEdges({
      atStart: track.scrollLeft <= 4,
      atEnd: track.scrollLeft + track.clientWidth >= track.scrollWidth - 4,
    });
  }, []);

  // Se remăsoară când sosesc mașinile și la redimensionare: câte încap depinde de lățime.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [measure, loading]);

  /**
   * Un ecran de carduri la un click, nu un card: pe desktop încap trei-patru, iar pas cu pas
   * derularea ar fi obositoare. Snap-ul din CSS aliniază apoi primul card vizibil.
   */
  const scrollByPage = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: 'smooth' });
  };

  const arrowSx = (side: 'left' | 'right') => ({
    position: 'absolute' as const,
    top: '50%',
    [side]: { xs: 4, md: -8 },
    transform: 'translateY(-50%)',
    zIndex: 2,
    width: { xs: 40, md: 48 },
    height: { xs: 40, md: 48 },
    color: TOKENS.ink,
    backgroundColor: TOKENS.paper,
    border: `1px solid ${TOKENS.border}`,
    boxShadow: TOKENS.shadow.md,
    transition: 'opacity .2s ease, background-color .2s ease',
    '&:hover': { backgroundColor: alpha(TOKENS.primary, 0.12) },
    '&.Mui-disabled': { opacity: 0, pointerEvents: 'none' },
  });

  useEffect(() => {
    carsService.getAll()
      .then((data) => {
        // Take only active cars and limit to 10
        setCars(data.filter(c => c.active).slice(0, 10));
      })
      .catch((err) => console.error('Error fetching cars:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box id="masini" sx={{ py: { xs: 8, md: 12 }, backgroundColor: '#fff' }}>
      <Container maxWidth="xl">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'center', alignItems: 'center', mb: 2 }} component="div">
            <Box sx={{ p: 1, borderRadius: '50%', bgcolor: alpha(TOKENS.primary, 0.1), color: TOKENS.primaryStrong, display: 'flex' }}>
              <DirectionsCarFilledRoundedIcon sx={{ fontSize: 20 }} />
            </Box>
            <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1.5, color: TOKENS.primaryStrong }}>
              FLOTA NOASTRĂ
            </Typography>
          </Stack>
          <Typography variant="h2" sx={{ fontWeight: 900, mb: 2, color: TOKENS.ink }}>
            Mașini Disponibile
          </Typography>
          <Typography sx={{ color: TOKENS.textMuted, maxWidth: 600, mx: 'auto', fontSize: '1.1rem' }}>
            Alege dintr-o gamă variată de mașini verificate, pregătite special pentru Uber și Bolt.
          </Typography>
        </Box>

        {/* Săgețile din margini înlocuiesc bara de derulare de jos, greu de prins cu mouse-ul. Pe
            telefon rămâne și glisarea cu degetul. */}
        <Box sx={{ position: 'relative' }}>
        {!loading && cars.length > 0 && (
          <>
            <IconButton aria-label="Mașinile anterioare" onClick={() => scrollByPage(-1)} disabled={edges.atStart} sx={arrowSx('left')}>
              <ChevronLeftRoundedIcon />
            </IconButton>
            <IconButton aria-label="Mașinile următoare" onClick={() => scrollByPage(1)} disabled={edges.atEnd} sx={arrowSx('right')}>
              <ChevronRightRoundedIcon />
            </IconButton>
          </>
        )}
        <Box
          ref={trackRef}
          onScroll={measure}
          sx={{
            display: 'flex',
            alignItems: 'stretch',
            gap: 3,
            overflowX: 'auto',
            // Loc pentru umbra și ridicarea cardului la hover. Fără el, containerul derulabil le
            // taie: cardul se ridică 4px într-o zonă care nu există.
            pt: 1.5,
            pb: 4,
            px: 1.5,
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            scrollSnapType: 'x mandatory',
            // Snap-ul aliniază cardul la marginea cu padding, nu la marginea goală: altfel lista
            // se mută singură 12px la încărcare, iar săgeata din stânga pare activă de la început.
            scrollPaddingInline: 12,
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {loading ? (
            // Skeletons for loading state
            [1, 2, 3, 4].map((i) => (
              // Aceeași formă ca un card încărcat — chenar, colțuri, poza până în margine. Un
              // schelet de altă formă face ca lista să sară în momentul în care sosesc datele.
              <Box
                key={i}
                sx={{
                  minWidth: { xs: 260, sm: 300, md: 320 },
                  backgroundColor: TOKENS.paper,
                  border: `1px solid ${TOKENS.border}`,
                  borderRadius: `${TOKENS.radius.xl}px`,
                  overflow: 'hidden',
                  boxShadow: TOKENS.shadow.sm,
                }}
              >
                <Skeleton variant="rectangular" sx={{ aspectRatio: '4 / 3' }} />
                <Box sx={{ p: 2 }}>
                  <Skeleton width="65%" height={28} />
                  <Skeleton width="45%" />
                  <Skeleton width="40%" height={30} sx={{ mt: 1 }} />
                  <Skeleton variant="rectangular" height={44} sx={{ borderRadius: '8px', mt: 1.5 }} />
                </Box>
              </Box>
            ))
          ) : cars.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center', width: '100%' }}>
              <Typography sx={{ color: TOKENS.textMuted }}>Momentan nu există mașini disponibile.</Typography>
            </Box>
          ) : (
            cars.map((car) => (
              <Box
                key={car.id}
                sx={{ minWidth: { xs: 260, sm: 300, md: 320 }, scrollSnapAlign: 'start' }}
              >
                <CarListCard car={car} />
              </Box>
            ))
          )}
        </Box>
        </Box>

        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/masini')}
            sx={{
              px: 4,
              py: 1.4,
              fontSize: '1.05rem',
              fontWeight: 700,
              borderRadius: '14px',
              textTransform: 'none',
              color: TOKENS.ink,
              backgroundColor: TOKENS.primary,
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: TOKENS.primaryStrong,
                boxShadow: 'none',
              },
            }}
          >
            Vezi toată flota disponibilă
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

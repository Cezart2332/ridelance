import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  Image,
  Link,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react'
import { FiArrowRight, FiCheckCircle, FiMoon, FiSun } from 'react-icons/fi'
import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import logo from './assets/logo.svg'
import TaxCalculator from './components/TaxCalculator'
import { getPalette, type ThemeMode } from './lib/palette'

const THEME_MODE_STORAGE_KEY = 'ridelance-theme-mode'

const beneficii = [
  {
    titlu: 'Înrolare ghidată cap-coadă',
    text: 'Primești suport pas cu pas pentru documentele PFA și activarea rapidă în sistem.',
  },
  {
    titlu: 'Contabil dedicat pentru fiecare PFA',
    text: 'Fiecare PFA va avea un contabil care te ajută cu partea fiscală și administrativă.',
  },
  {
    titlu: 'Management simplificat',
    text: 'Ții evidența actelor și taskurilor într-un singur loc, fără foi împrăștiate.',
  },
  {
    titlu: 'Comunicare clară',
    text: 'Știi mereu ce ai de făcut și când, prin notificări și statusuri ușor de urmărit.',
  },
  {
    titlu: 'Făcut pentru ridesharing',
    text: 'Proces gândit special pentru colaborarea cu Uber și Bolt în România.',
  },
]

const ceEste = [
  {
    titlu: 'Pregătire documente',
    text: 'Ai checklist-ul necesar și știi exact ce trebuie completat, în ordinea corectă.',
  },
  {
    titlu: 'Înrolare rapidă',
    text: 'Elimini pașii confuzi și reduci timpul pierdut între acte, întrebări și confirmări.',
  },
  {
    titlu: 'Management lunar',
    text: 'Rămâi organizat după activare, cu un loc unic pentru responsabilitățile curente.',
  },
]

const pasi = [
  {
    pas: '01',
    titlu: 'Completezi formularul inițial',
    text: 'Ne trimiți rapid datele de bază și îți validăm eligibilitatea pentru înrolare.',
  },
  {
    pas: '02',
    titlu: 'Primești checklist personalizat',
    text: 'Vezi clar ce documente sunt necesare și în ce stadiu se află fiecare.',
  },
  {
    pas: '03',
    titlu: 'Pornești la drum cu PFA-ul organizat',
    text: 'După activare, ai în continuare un spațiu unic pentru managementul administrativ.',
  },
]

const intrebariFrecvente = [
  {
    intrebare: 'Pentru cine este Ridelance?',
    raspuns:
      'Ridelance este pentru șoferii Uber/Bolt din România care vor să lucreze legal ca PFA și să își reducă timpul petrecut cu partea administrativă.',
  },
  {
    intrebare: 'Trebuie să mă pricep la contabilitate?',
    raspuns:
      'Nu. Platforma este construită pentru claritate: ai pași concreți, statusuri și suport, astfel încât să știi exact ce ai de făcut.',
  },
  {
    intrebare: 'Cât durează înrolarea?',
    raspuns:
      'Durata depinde de completitudinea documentelor, dar fluxul este optimizat pentru activare rapidă și fără blocaje.',
  },
  {
    intrebare: 'Pot folosi platforma și după activare?',
    raspuns:
      'Da. Ridelance este gândit și pentru managementul continuu al activității PFA, nu doar pentru început.',
  },
]

const subtleCardMotion = {
  transition: 'transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
  willChange: 'transform',
  _hover: {
    transform: 'translateY(-2px)',
    borderColor: 'rgba(220, 247, 99, 0.34)',
    boxShadow: '0 10px 22px rgba(0, 0, 0, 0.2)',
  },
} as const

function getInitialThemeMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  const storedMode = window.localStorage.getItem(THEME_MODE_STORAGE_KEY)
  return storedMode === 'light' ? 'light' : 'dark'
}

function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode)
  const palette = useMemo(() => getPalette(themeMode), [themeMode])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, themeMode)
  }, [themeMode])

  const panelStyle = {
    borderRadius: '28px',
    borderWidth: '1px',
    borderColor: palette.border,
    bg: palette.surface,
    p: { base: '6', md: '9' },
    boxShadow: '0 18px 38px rgba(0, 0, 0, 0.22)',
  } as const

  const handleAnchorNavigation = (event: MouseEvent<HTMLElement>) => {
    const href = event.currentTarget.getAttribute('href')
    if (!href || !href.startsWith('#')) {
      return
    }

    const section = document.querySelector(href)
    if (!(section instanceof HTMLElement)) {
      return
    }

    event.preventDefault()
    const top = section.getBoundingClientRect().top + window.scrollY - 88
    window.scrollTo({ top: Math.max(0, top), behavior: 'auto' })
  }

  return (
    <Box
      minH="100vh"
      bg={palette.bg}
      color={palette.text}
      fontFamily="'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif"
    >
      <Container maxW="7xl" px={{ base: '4', md: '6' }} py={{ base: '4', md: '6' }}>
        <Flex
          as="header"
          position="sticky"
          top="12px"
          zIndex="20"
          align="center"
          justify="space-between"
          gap="4"
          borderRadius="20px"
          px={{ base: '4', md: '5' }}
          py="3"
          bg={palette.headerBg}
          borderWidth="1px"
          borderColor="rgba(220, 247, 99, 0.25)"
          backdropFilter="blur(8px)"
        >
          <Link href="#acasa" onClick={handleAnchorNavigation} _hover={{ textDecoration: 'none' }}>
              <Image src={logo} alt="Logo Ridelance" width="150px" height="45px" fit="contain" />
          </Link>

          <HStack as="nav" aria-label="Navigație principală" gap={{ base: '3', md: '5' }} display={{ base: 'none', md: 'flex' }}>
            <Link href="#ce-este" onClick={handleAnchorNavigation} color={palette.textSoft} _hover={{ color: palette.lime }}>
              Ce este
            </Link>
            <Link href="#de-ce-noi" onClick={handleAnchorNavigation} color={palette.textSoft} _hover={{ color: palette.lime }}>
              De ce noi
            </Link>
            <Link href="#faq" onClick={handleAnchorNavigation} color={palette.textSoft} _hover={{ color: palette.lime }}>
              FAQ
            </Link>
          </HStack>

          <HStack gap="2">
            <Button
              type="button"
              onClick={() => setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              borderRadius="full"
              variant="outline"
              borderColor={palette.border}
              color={palette.text}
              bg={palette.surfaceAlt}
              _hover={{ bg: palette.chipBg }}
              size={{ base: 'sm', md: 'md' }}
            >
              <HStack gap="1.5">
                <Icon as={themeMode === 'dark' ? FiSun : FiMoon} boxSize="4" />
                <Text as="span">{themeMode === 'dark' ? 'Light' : 'Dark'}</Text>
              </HStack>
            </Button>
            <Link href="#contact" onClick={handleAnchorNavigation} _hover={{ textDecoration: 'none' }}>
              <Button
                borderRadius="full"
                bg={palette.lime}
                color={palette.base}
                fontWeight="700"
                _hover={{ bg: '#E4FA85' }}
                size={{ base: 'sm', md: 'md' }}
              >
                <HStack gap="1.5">
                  <Text as="span">Demo</Text>
                  <Icon as={FiArrowRight} boxSize="4" />
                </HStack>
              </Button>
            </Link>
          </HStack>
        </Flex>

        <Stack as="main" mt="6" gap="6">
          <Stack
            as="section"
            id="acasa"
            aria-labelledby="hero-title"
            borderRadius="32px"
            px={{ base: '6', md: '10' }}
            py={{ base: '8', md: '14' }}
            bg={palette.heroBg}
            borderWidth="1px"
            borderColor={palette.border}
            gap="5"
          >
            <Text
              w="fit-content"
              px="4"
              py="1.5"
              borderRadius="full"
              borderWidth="1px"
              borderColor="rgba(220, 247, 99, 0.3)"
              bg={palette.badgeBg}
              fontSize="sm"
            >
              Înrolare & management PFA pentru șoferi Uber/Bolt
            </Text>

            <HStack align="center" gap="4" flexWrap="wrap">
              <Image src={logo} alt="" aria-hidden="true" w={{ base: '20', md: '24' }}/>
              <Heading id="hero-title" size={{ base: '2xl', md: '4xl' }} lineHeight="1.05" maxW="16ch">
                Condu liniștit. Restul îl organizăm împreună.
              </Heading>
            </HStack>

            <Text maxW="58ch" color={palette.textSoft} fontSize={{ base: 'md', md: 'lg' }} lineHeight="1.65">
              Ridelance este platforma care simplifică înrolarea și administrarea PFA pentru ridesharing în
              România, cu un proces clar, rapid și ușor de urmărit.
            </Text>

            <HStack gap="3" flexWrap="wrap">
              <Link href="#contact" onClick={handleAnchorNavigation} _hover={{ textDecoration: 'none' }}>
                <Button
                  borderRadius="full"
                  bg={palette.lime}
                  color={palette.base}
                  fontWeight="700"
                  _hover={{ bg: '#E4FA85' }}
                >
                  <HStack gap="1.5">
                    <Text as="span">Începe înrolarea</Text>
                    <Icon as={FiArrowRight} boxSize="4" />
                  </HStack>
                </Button>
              </Link>
              <Link href="#faq" onClick={handleAnchorNavigation} _hover={{ textDecoration: 'none' }}>
                <Button
                  borderRadius="full"
                  variant="outline"
                  borderColor="rgba(220, 247, 99, 0.45)"
                  color={palette.text}
                  _hover={{ bg: palette.ghostHoverBg }}
                >
                  Vezi întrebările frecvente
                </Button>
              </Link>
            </HStack>

            <HStack as="ul" listStyleType="none" gap="2" flexWrap="wrap" m="0" p="0">
              {[
                'Flux simplu pentru documente',
                'Statut clar pentru fiecare pas',
                'Fiecare PFA va avea un contabil',
                'Gândit special pentru piața din România',
              ].map((item) => (
                <Box
                  as="li"
                  key={item}
                  px="3"
                  py="1.5"
                  borderRadius="full"
                  borderWidth="1px"
                  borderColor="rgba(220, 247, 99, 0.24)"
                  bg={palette.chipBg}
                  fontSize="sm"
                >
                  <HStack gap="1.5">
                    <Icon as={FiCheckCircle} boxSize="4" color={palette.lime} />
                    <Text as="span">{item}</Text>
                  </HStack>
                </Box>
              ))}
            </HStack>
          </Stack>

          <Box as="section" id="ce-este" aria-labelledby="ce-este-title" {...panelStyle}>
            <Text textTransform="uppercase" fontWeight="700" letterSpacing="0.12em" fontSize="xs" color={palette.lime}>
              Ce este
            </Text>
            <Heading id="ce-este-title" mt="2" size="xl" maxW="28ch">
              O bază digitală clară pentru activitatea ta ca PFA
            </Heading>
            <SimpleGrid mt="6" columns={{ base: 1, md: 3 }} gap="4">
              {ceEste.map((item) => (
                <Box
                  key={item.titlu}
                  borderRadius="20px"
                  borderWidth="1px"
                  borderColor={palette.border}
                  bg={palette.surfaceAlt}
                  p="5"
                  {...subtleCardMotion}
                >
                  <Heading size="md">{item.titlu}</Heading>
                  <Text mt="3" color={palette.textSoft} lineHeight="1.65">
                    {item.text}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </Box>

          <Box
            as="section"
            id="de-ce-noi"
            aria-labelledby="de-ce-noi-title"
            {...panelStyle}
            bg={palette.contrastBg}
          >
            <Text textTransform="uppercase" fontWeight="700" letterSpacing="0.12em" fontSize="xs" color={palette.lime}>
              De ce noi
            </Text>
            <Heading id="de-ce-noi-title" mt="2" size="xl" maxW="28ch">
              Reducem stresul administrativ, nu doar pașii din checklist
            </Heading>
            <SimpleGrid mt="6" columns={{ base: 1, md: 2 }} gap="4">
              {beneficii.map((item) => (
                <Box
                  key={item.titlu}
                  borderRadius="20px"
                  borderWidth="1px"
                  borderColor={palette.border}
                  bg={palette.surfaceAlt}
                  p="5"
                  {...subtleCardMotion}
                >
                  <Heading size="md">{item.titlu}</Heading>
                  <Text mt="3" color={palette.textSoft} lineHeight="1.65">
                    {item.text}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </Box>

          <Box as="section" aria-labelledby="cum-functioneaza-title" {...panelStyle}>
            <Text textTransform="uppercase" fontWeight="700" letterSpacing="0.12em" fontSize="xs" color={palette.lime}>
              Cum funcționează
            </Text>
            <Heading id="cum-functioneaza-title" mt="2" size="xl">
              3 pași și ești gata de drum
            </Heading>
            <SimpleGrid mt="6" as="ol" columns={{ base: 1, md: 3 }} gap="4" listStyleType="none" p="0" m="0">
              {pasi.map((item) => (
                <Box
                  as="li"
                  key={item.pas}
                  borderRadius="20px"
                  borderWidth="1px"
                  borderColor={palette.border}
                  bg={palette.surfaceAlt}
                  p="5"
                  {...subtleCardMotion}
                >
                  <Text color={palette.lime} fontWeight="700" fontSize="sm">
                    {item.pas}
                  </Text>
                  <Heading size="md" mt="2">
                    {item.titlu}
                  </Heading>
                  <Text mt="3" color={palette.textSoft} lineHeight="1.65">
                    {item.text}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </Box>

          <Box as="section" id="faq" aria-labelledby="faq-title" {...panelStyle}>
            <Text textTransform="uppercase" fontWeight="700" letterSpacing="0.12em" fontSize="xs" color={palette.lime}>
              FAQ
            </Text>
            <Heading id="faq-title" mt="2" size="xl">
              Întrebări frecvente
            </Heading>
            <Stack mt="6" gap="3">
              {intrebariFrecvente.map((item) => (
                <Box
                  as="details"
                  key={item.intrebare}
                  borderRadius="16px"
                  borderWidth="1px"
                  borderColor={palette.border}
                  bg={palette.surfaceAlt}
                  p="4"
                  transition="transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease"
                  _hover={{
                    transform: 'translateY(-1px)',
                    borderColor: 'rgba(220, 247, 99, 0.34)',
                    boxShadow: '0 8px 18px rgba(0, 0, 0, 0.18)',
                  }}
                >
                  <Box as="summary" cursor="pointer" fontWeight="600">
                    {item.intrebare}
                  </Box>
                  <Text mt="3" color={palette.textSoft} lineHeight="1.65">
                    {item.raspuns}
                  </Text>
                </Box>
              ))}
            </Stack>
          </Box>

          <Box
            as="section"
            id="contact"
            aria-labelledby="cta-title"
            borderRadius="28px"
            borderWidth="1px"
            borderColor="rgba(220, 247, 99, 0.38)"
            bg={palette.surfaceAlt}
            p={{ base: '6', md: '9' }}
          >
            <Heading id="cta-title" size="xl" maxW="24ch">
              Vrei să începi fără bătăi de cap?
            </Heading>
            <Text mt="3" color={palette.textSoft} maxW="62ch" lineHeight="1.65">
              Programează o discuție scurtă cu echipa Ridelance și vezi cum îți poți organiza înrolarea PFA
              într-un flux simplu și previzibil.
            </Text>
            <Link href="#acasa" onClick={handleAnchorNavigation} _hover={{ textDecoration: 'none' }}>
              <Button
                mt="5"
                borderRadius="full"
                bg={palette.lime}
                color={palette.base}
                fontWeight="700"
                _hover={{ bg: '#E4FA85' }}
              >
                <HStack gap="1.5">
                  <Text as="span">Programează consultanța</Text>
                  <Icon as={FiArrowRight} boxSize="4" />
                </HStack>
              </Button>
            </Link>
          </Box>

          <Box as="section" id="calculator" aria-labelledby="calculator-title" {...panelStyle}>
            <Text textTransform="uppercase" fontWeight="700" letterSpacing="0.12em" fontSize="xs" color={palette.lime}>
              Calculator taxe
            </Text>
            <Heading id="calculator-title" mt="2" size="xl" maxW="28ch">
              Calculează instant ce sistem fiscal este mai avantajos
            </Heading>
            <Box mt="6">
              <TaxCalculator themeMode={themeMode} />
            </Box>
          </Box>
        </Stack>

        <Text as="footer" mt="8" textAlign="center" color={palette.textSoft} fontSize="sm">
          Ridelance • soluție dedicată șoferilor de ridesharing din România
        </Text>
      </Container>
    </Box>
  )
}

export default App

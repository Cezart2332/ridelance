import { useState } from "react"
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material"
import { alpha } from "@mui/material/styles"
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded"
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded"
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded"
import logo from "./assets/logo.svg"
import car from "./assets/car.svg"
import chill from "./assets/chill.svg"
import docs from "./assets/docs.svg"
import renteaza from "./assets/renteaza.svg"
import silso from "./assets/silso.png"
import works from "./assets/works.svg"

const palette = {
  ink: "#152447",
  primary: "#1A64ED",
  primaryStrong: "#0E47BC",
  sky: "#EAF4FF",
  paper: "#FFFFFF",
  lime: "#D8FF2E",
}

const borderSoft = `1px solid ${alpha(palette.primary, 0.2)}`

const glassPanelSx = {
  border: borderSoft,
  backdropFilter: "blur(10px)",
  background: `linear-gradient(145deg, ${alpha(palette.paper, 0.9)} 0%, ${alpha("#EEF6FF", 0.9)} 100%)`,
}

const sectionTitleSx = {
  color: palette.ink,
  fontWeight: 700,
  letterSpacing: "-0.015em",
  textAlign: "center",
}

const inputSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: alpha("#FFFFFF", 0.92),
    color: palette.ink,
    borderRadius: 2.5,
    fontWeight: 600,
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: alpha(palette.primary, 0.24),
  },
  "& .MuiInputBase-input::placeholder": {
    color: alpha(palette.ink, 0.5),
    opacity: 1,
  },
}

const loremText =
  "Lorem ipsum dolor sit amet consectetur adipisicing elit. Distinctio ipsa ducimus, ipsam pariatur hic possimus aliquam eaque similique nostrum."
const loremLongText =
  "Lorem ipsum dolor sit amet consectetur adipisicing elit. Distinctio ipsa ducimus, ipsam pariatur hic possimus aliquam eaque similique nostrum! Vero veniam earum sint sapiente ut. Quae aspernatur assumenda aliquam pariatur suscipit in porro ipsam."

const navItems = [
  { label: "Despre Noi", id: "despre-noi" },
  { label: "Intrebari Frecvente", id: "intrebari-frecvente" },
  { label: "Calculator Taxe", id: "calculator-taxe" },
  { label: "Abonamente/Preturi", id: "abonamente-preturi" },
  { label: "Parteneri", id: "parteneri" },
  { label: "Contact", id: "contact" },
]

const faqItems = [
  {
    title: "De ce as avea nevoie de o platforma ca aceasta",
    text: loremLongText,
  },
  {
    title: "Daca am deja PFA, pot sa folosesc platforma?",
    text: loremLongText,
  },
  { title: "De ce documente am nevoie?", text: loremLongText },
]

const featureCards = [
  {
    title: "Cum functioneaza",
    text: loremText,
    image: works,
    alt: "Cum functioneaza",
  },
  {
    title: "Doar trimite documentele necesare",
    text: loremText,
    image: docs,
    alt: "Documente",
  },
  {
    title: "Fara stres, fara batai de cap",
    text: loremText,
    image: chill,
    alt: "Fara stres",
  },
]

const pricingCards = [
  { title: "Lorem ipsum", text: loremLongText },
  { title: "Lorem ipsum", text: loremLongText },
  { title: "Lorem ipsum", text: loremLongText },
]

const partnerLogos = [
  { name: "Silso", image: silso, href: "https://silso.ro" },
  { name: "Renteaza", image: renteaza, href: "https://renteaza.ro" },
]

function App() {
  const GROSS_SALARY = 4050
  const UBER_BOLT_ANNUAL_INCOME_NORM = 49005

  const sectionScrollMargin = { xs: "138px", md: "120px" } as const

  const roundToInt = (value: number) => Math.round(value)
  const toNumber = (value: string) => {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }

  const [anualIncome, setAnualIncome] = useState(0)
  const [deductibleExpenses, setDeductibleExpenses] = useState(0)
  const [realIncomeTax, setRealIncomeTax] = useState(0)
  const [realCAS, setRealCAS] = useState(0)
  const [realCASS, setRealCASS] = useState(0)
  const [normIncomeTax, setNormIncomeTax] = useState(0)
  const [normCAS, setNormCAS] = useState(0)
  const [normCASS, setNormCASS] = useState(0)
  const [netIncomeRealSystem, setNetIncomeRealSystem] = useState(0)
  const [netIncomeNormaSystem, setNetIncomeNormaSystem] = useState(0)

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id)
    if (section) {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      section.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      })
    }
  }

  const computeTaxes = () => {
    const netIncome = anualIncome - deductibleExpenses
    let CAS = 0
    let CASS = 0
    let incomeTax = 0
    let netIncomeAfterTaxes = 0

    if (netIncome < GROSS_SALARY * 12) {
      CAS = 0
    } else if (netIncome >= GROSS_SALARY * 12 && netIncome < GROSS_SALARY * 24) {
      CAS = 0.25 * (GROSS_SALARY * 12)
    } else if (netIncome >= GROSS_SALARY * 24) {
      CAS = 0.25 * (GROSS_SALARY * 24)
    }

    if (netIncome <= 0) {
      CASS = 0
    } else if (netIncome > 0 && netIncome < GROSS_SALARY * 6) {
      CASS = 0.1 * (GROSS_SALARY * 6)
    } else if (netIncome >= GROSS_SALARY * 6 && netIncome < GROSS_SALARY * 72) {
      CASS = 0.1 * netIncome
    } else if (netIncome >= GROSS_SALARY * 72) {
      CASS = 0.1 * GROSS_SALARY * 72
    }

    incomeTax = 0.1 * Math.max(0, netIncome - CAS - CASS)
    netIncomeAfterTaxes = netIncome - CAS - CASS - incomeTax

    setRealCAS(roundToInt(CAS))
    setRealCASS(roundToInt(CASS))
    setRealIncomeTax(roundToInt(incomeTax))
    setNetIncomeRealSystem(roundToInt(netIncomeAfterTaxes))

    if (UBER_BOLT_ANNUAL_INCOME_NORM < GROSS_SALARY * 12) {
      CAS = 0
    } else if (
      UBER_BOLT_ANNUAL_INCOME_NORM >= GROSS_SALARY * 12 &&
      UBER_BOLT_ANNUAL_INCOME_NORM < GROSS_SALARY * 24
    ) {
      CAS = 0.25 * (GROSS_SALARY * 12)
    } else if (UBER_BOLT_ANNUAL_INCOME_NORM >= GROSS_SALARY * 24) {
      CAS = 0.25 * (GROSS_SALARY * 24)
    }

    if (UBER_BOLT_ANNUAL_INCOME_NORM <= 0) {
      CASS = 0
    } else if (
      UBER_BOLT_ANNUAL_INCOME_NORM > 0 &&
      UBER_BOLT_ANNUAL_INCOME_NORM < GROSS_SALARY * 6
    ) {
      CASS = 0.1 * (GROSS_SALARY * 6)
    } else if (
      UBER_BOLT_ANNUAL_INCOME_NORM >= GROSS_SALARY * 6 &&
      UBER_BOLT_ANNUAL_INCOME_NORM < GROSS_SALARY * 72
    ) {
      CASS = 0.1 * UBER_BOLT_ANNUAL_INCOME_NORM
    } else if (UBER_BOLT_ANNUAL_INCOME_NORM >= GROSS_SALARY * 72) {
      CASS = 0.1 * GROSS_SALARY * 72
    }

    incomeTax = 0.1 * Math.max(0, UBER_BOLT_ANNUAL_INCOME_NORM - CAS - CASS)
    netIncomeAfterTaxes = anualIncome - CAS - CASS - incomeTax

    setNormCAS(roundToInt(CAS))
    setNormCASS(roundToInt(CASS))
    setNormIncomeTax(roundToInt(incomeTax))
    setNetIncomeNormaSystem(roundToInt(netIncomeAfterTaxes))
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        overflowX: "clip",
        color: palette.ink,
        background: "linear-gradient(180deg, #DDF0FF 0%, #ECF6FF 42%, #F8FBFF 100%)",
        fontFamily: '"Space Grotesk", "SF Compact Display", "SF Pro Display", "Segoe UI", sans-serif',
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `radial-gradient(circle at 10% 18%, ${alpha("#7DB5FF", 0.16)} 0%, transparent 34%), radial-gradient(circle at 92% 6%, ${alpha("#97C8FF", 0.14)} 0%, transparent 30%)`,
        },
        "&::after": {
          content: '""',
          display: "none",
        },
        "& .reveal": {
          opacity: 0,
          transform: "translateY(24px)",
          animation: "revealUp 760ms cubic-bezier(0.2, 0.7, 0.25, 1) forwards",
        },
        "@keyframes revealUp": {
          from: {
            opacity: 0,
            transform: "translateY(24px)",
          },
          to: {
            opacity: 1,
            transform: "translateY(0)",
          },
        },
        "@media (prefers-reduced-motion: reduce)": {
          "& .reveal": {
            opacity: 1,
            transform: "none",
            animation: "none",
          },
          "& *": {
            transition: "none !important",
          },
        },
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          top: 12,
          backgroundColor: "transparent",
          color: palette.ink,
          boxShadow: "none",
          zIndex: (theme) => theme.zIndex.appBar,
        }}
      >
        <Container maxWidth="xl" sx={{ py: { xs: 1.2, md: 1.6 } }}>
          <Toolbar disableGutters sx={{ minHeight: "unset" }}>
            <Paper
              className="reveal"
              elevation={0}
              sx={{
                ...glassPanelSx,
                width: "100%",
                px: { xs: 1.2, sm: 1.7, md: 2.1 },
                py: { xs: 1.1, md: 1.15 },
                borderRadius: { xs: 4, md: 999 },
                display: "flex",
                alignItems: "center",
                gap: { xs: 0.8, md: 1.8 },
                flexWrap: { xs: "wrap", md: "nowrap" },
                animationDelay: "30ms",
                boxShadow: `0 14px 28px ${alpha("#154AC5", 0.12)}`,
              }}
            >
              <Box
                component="button"
                onClick={() => scrollToSection("despre-noi")}
                sx={{
                  border: "none",
                  backgroundColor: "transparent",
                  p: 0,
                  m: 0,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                <Box
                  component="img"
                  src={logo}
                  alt="Ridelance Logo"
                  sx={{ height: { xs: 46, md: 58 }, width: "auto", display: "block" }}
                />
              </Box>

              <Stack
                direction="row"
                spacing={{ xs: 0.3, md: 0.65 }}
                sx={{
                  flex: { xs: "0 0 100%", md: 1 },
                  justifyContent: "center",
                  flexWrap: "wrap",
                  rowGap: 0.5,
                }}
              >
                {navItems.map((item) => (
                  <Button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    sx={{
                      color: alpha(palette.ink, 0.9),
                      minWidth: "auto",
                      px: { xs: 1, md: 1.35 },
                      py: 0.75,
                      borderRadius: 2.5,
                      fontSize: { xs: "0.78rem", md: "0.87rem" },
                      fontWeight: 620,
                      backgroundColor: "transparent",
                      "&:hover": {
                        color: palette.primaryStrong,
                        backgroundColor: alpha(palette.primary, 0.12),
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Stack>

              <Button
                variant="contained"
                endIcon={<ArrowForwardRoundedIcon />}
                onClick={() => scrollToSection("contact")}
                sx={{
                  px: { xs: 2, md: 2.8 },
                  py: { xs: 1, md: 1.1 },
                  color: palette.ink,
                  backgroundColor: palette.primary,
                  borderRadius: 999,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  "&:hover": {
                    backgroundColor: palette.primary,
                  },
                }}
              >
                Demo
              </Button>
            </Paper>
          </Toolbar>
        </Container>
      </AppBar>

      <Box
        id="despre-noi"
        sx={{
          position: "relative",
          zIndex: 1,
          scrollMarginTop: sectionScrollMargin,
          pt: { xs: 5, md: 7 },
          pb: { xs: 5.5, md: 8 },
        }}
      >
        <Container maxWidth="xl">
          <Paper
            className="reveal"
            elevation={0}
            sx={{
              ...glassPanelSx,
              p: { xs: 2.8, sm: 3.4, md: 5.2 },
              borderRadius: { xs: 4, md: 7 },
              position: "relative",
              overflow: "hidden",
              animationDelay: "90ms",
              boxShadow: `0 20px 44px ${alpha("#0D44BA", 0.14)}`,
              "&::before": {
                content: '""',
                position: "absolute",
                top: -110,
                right: -90,
                width: 260,
                height: 260,
                borderRadius: "50%",
                background: `radial-gradient(circle at 40% 40%, ${alpha("#81B8FF", 0.28)} 0%, transparent 70%)`,
              },
              "&::after": {
                content: '""',
                display: "none",
              },
            }}
          >
            <Box
              sx={{
                position: "relative",
                zIndex: 1,
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1.06fr 0.94fr" },
                alignItems: "center",
                gap: { xs: 4.5, md: 6.5 },
              }}
            >
              <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
                <Typography
                  variant="h2"
                  gutterBottom
                  sx={{
                    color: palette.ink,
                    fontWeight: 720,
                    lineHeight: 1.06,
                    letterSpacing: "-0.03em",
                    fontSize: { xs: "2.1rem", md: "3.25rem" },
                  }}
                >
                  Despre Noi
                </Typography>
                <Typography
                  sx={{
                    color: alpha(palette.ink, 0.82),
                    lineHeight: 1.8,
                    fontSize: { xs: "0.99rem", md: "1.06rem" },
                    maxWidth: { xs: "100%", md: 620 },
                    mx: { xs: "auto", md: 0 },
                  }}
                >
                  {loremLongText}
                </Typography>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  sx={{
                    mt: 3.2,
                    justifyContent: { xs: "center", md: "flex-start" },
                  }}
                >
                  <Button
                    variant="contained"
                    sx={{
                      px: 2.6,
                      py: 1.05,
                      color: "#FFFFFF",
                      backgroundColor: palette.primary,
                      borderRadius: 999,
                      "&:hover": {
                        backgroundColor: palette.primary,
                      },
                    }}
                  >
                    Inregistreaza-te
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{
                      px: 2.4,
                      py: 1.05,
                      color: palette.primary,
                      borderColor: alpha(palette.primary, 0.45),
                      backgroundColor: alpha("#FFFFFF", 0.65),
                      borderRadius: 999,
                      "&:hover": {
                        borderColor: palette.primary,
                        backgroundColor: alpha(palette.primary, 0.1),
                      },
                    }}
                  >
                    Afla mai multe
                  </Button>
                </Stack>
              </Box>

              <Box
                sx={{
                  position: "relative",
                  display: "grid",
                  placeItems: "center",
                  minHeight: { xs: 280, md: 390 },
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    width: "100%",
                    maxWidth: 520,
                    px: { xs: 2, md: 2.6 },
                    py: { xs: 2.4, md: 2.8 },
                    borderRadius: { xs: 4, md: 5 },
                    border: `1px solid ${alpha(palette.primary, 0.24)}`,
                    background: `linear-gradient(155deg, ${alpha("#FFFFFF", 0.96)} 0%, ${alpha("#EAF3FF", 0.96)} 100%)`,
                    boxShadow: `0 18px 36px ${alpha("#0E44BB", 0.14)}`,
                  }}
                >
                  <Box
                    component="img"
                    src={car}
                    alt="Car Image"
                    sx={{
                      width: { xs: "96%", md: "88%" },
                      maxWidth: 470,
                      display: "block",
                      mx: "auto",
                    }}
                  />
                </Paper>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>

      <Box sx={{ position: "relative", zIndex: 1, py: { xs: 3, md: 6 } }}>
        <Container maxWidth="xl">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              gap: { xs: 2.2, md: 2.8 },
            }}
          >
            {featureCards.map((card, index) => (
              <Card
                key={card.title}
                className="reveal"
                sx={{
                  ...glassPanelSx,
                  height: "100%",
                  borderRadius: 4,
                  position: "relative",
                  overflow: "hidden",
                  animationDelay: `${150 + index * 85}ms`,
                  boxShadow: `0 14px 30px ${alpha("#0F46BE", 0.12)}`,
                  "&::before": {
                    content: '""',
                    display: "none",
                  },
                  "&:hover": {
                    borderColor: alpha(palette.primary, 0.34),
                    transform: "translateY(-4px)",
                  },
                }}
              >
                <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2.2, position: "relative" }}>
                  <Typography
                    variant="h6"
                    sx={{
                      textAlign: "center",
                      color: palette.ink,
                      fontWeight: 680,
                      minHeight: { xs: "unset", md: 58 },
                    }}
                  >
                    {card.title}
                  </Typography>
                  <Typography sx={{ color: alpha(palette.ink, 0.8), lineHeight: 1.74 }}>{card.text}</Typography>
                  <Box
                    component="img"
                    src={card.image}
                    alt={card.alt}
                    sx={{ width: { xs: 126, md: 154 }, height: "auto", mx: "auto", mt: 0.6 }}
                  />
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      <Box sx={{ position: "relative", zIndex: 1, pb: { xs: 5.5, md: 8.5 } }}>
        <Container maxWidth="xl">
          <Paper
            className="reveal"
            elevation={0}
            sx={{
              p: { xs: 3, md: 4.8 },
              borderRadius: { xs: 4, md: 6 },
              border: `1px solid ${alpha("#9EC6FF", 0.3)}`,
              background: "linear-gradient(145deg, #0F4ACA 0%, #1B6EF0 54%, #3A86FF 100%)",
              position: "relative",
              overflow: "hidden",
              animationDelay: "260ms",
              boxShadow: `0 28px 62px ${alpha("#0B3BA3", 0.3)}`,
              "&::before": {
                content: '""',
                position: "absolute",
                width: 380,
                height: 380,
                borderRadius: "50%",
                top: -210,
                right: -120,
                background: alpha("#9DD0FF", 0.25),
              },
              "&::after": {
                content: '""',
                position: "absolute",
                left: -70,
                bottom: -170,
                width: 420,
                height: 260,
                borderRadius: "50%",
                background: alpha("#A8D4FF", 0.25),
              },
            }}
          >
            <Typography
              variant="h3"
              gutterBottom
              sx={{
                color: "#FFFFFF",
                fontWeight: 700,
                textAlign: "center",
                letterSpacing: "-0.02em",
                position: "relative",
                zIndex: 1,
              }}
            >
              Ce primesti daca alegi sa lucrezi cu noi
            </Typography>
            <Box
              sx={{
                mt: 3.2,
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: { xs: 2, md: 3.2 },
                position: "relative",
                zIndex: 1,
              }}
            >
              {[0, 1].map((column) => (
                <Stack spacing={1.8} key={column}>
                  {[0, 1, 2].map((row) => (
                    <Paper
                      key={`${column}-${row}`}
                      elevation={0}
                      sx={{
                        p: 1.35,
                        borderRadius: 2.8,
                        border: `1px solid ${alpha("#FFFFFF", 0.24)}`,
                        backgroundColor: alpha("#FFFFFF", 0.12),
                        backdropFilter: "blur(6px)",
                      }}
                    >
                      <Stack direction="row" spacing={1.1} sx={{ alignItems: "flex-start" }}>
                        <CheckCircleOutlineRoundedIcon sx={{ mt: 0.15, color: "#34C759" }} />
                        <Typography sx={{ lineHeight: 1.62, color: alpha("#FFFFFF", 0.94) }}>{loremText}</Typography>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              ))}
            </Box>
          </Paper>
        </Container>
      </Box>

      <Box
        id="intrebari-frecvente"
        sx={{
          position: "relative",
          zIndex: 1,
          scrollMarginTop: sectionScrollMargin,
          py: { xs: 5.5, md: 8.5 },
        }}
      >
        <Container maxWidth="lg">
          <Paper
            className="reveal"
            elevation={0}
            sx={{
              ...glassPanelSx,
              p: { xs: 3, md: 4.5 },
              borderRadius: { xs: 4, md: 5 },
              animationDelay: "340ms",
              boxShadow: `0 22px 52px ${alpha("#1147BD", 0.14)}`,
            }}
          >
            <Typography variant="h3" sx={sectionTitleSx}>
              Intrebari Frecvente
            </Typography>
            <Box sx={{ mt: 3.5 }}>
              {faqItems.map((item, index) => (
                <Accordion
                  key={item.title}
                  disableGutters
                  elevation={0}
                  sx={{
                    backgroundColor: alpha("#FFFFFF", 0.78),
                    border: `1px solid ${alpha(palette.primary, 0.2)}`,
                    borderRadius: 3,
                    overflow: "hidden",
                    mb: index === faqItems.length - 1 ? 0 : 1.25,
                    "&:before": {
                      display: "none",
                    },
                    "& .MuiAccordionSummary-root": {
                      minHeight: 58,
                      px: { xs: 1.9, md: 2.4 },
                    },
                    "& .MuiAccordionSummary-content": {
                      my: 1.2,
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreRoundedIcon sx={{ color: palette.primary }} />}
                    sx={{
                      color: palette.ink,
                      "&.Mui-expanded": {
                        backgroundColor: alpha(palette.primary, 0.11),
                      },
                    }}
                  >
                    <Typography sx={{ fontWeight: 650 }}>{item.title}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography sx={{ lineHeight: 1.75, color: alpha(palette.ink, 0.8) }}>{item.text}</Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </Paper>
        </Container>
      </Box>

      <Box
        id="calculator-taxe"
        sx={{
          position: "relative",
          zIndex: 1,
          scrollMarginTop: sectionScrollMargin,
          py: { xs: 5.5, md: 8.8 },
        }}
      >
        <Container maxWidth="lg">
          <Paper
            className="reveal"
            elevation={0}
            sx={{
              ...glassPanelSx,
              p: { xs: 2.8, md: 4.2 },
              borderRadius: { xs: 4, md: 5 },
              animationDelay: "410ms",
              boxShadow: `0 24px 54px ${alpha("#1248BE", 0.15)}`,
            }}
          >
            <Typography variant="h3" sx={sectionTitleSx}>
              Calculator Taxe
            </Typography>
            <Typography sx={{ mt: 1.4, color: alpha(palette.ink, 0.82), lineHeight: 1.7, textAlign: "center" }}>
              Estimeaza ce taxe vei plati ca PFA in functie de venitul tau anual si cheltuielile deductibile
            </Typography>

            <Stack spacing={2.2} sx={{ mt: 3.5 }}>
              <TextField
                type="number"
                fullWidth
                size="small"
                label="Venit anual estimat (RON)"
                placeholder="Introdu venitul anual estimat"
                onChange={(event) => setAnualIncome(toNumber(event.target.value))}
                slotProps={{ inputLabel: { sx: { color: alpha(palette.ink, 0.8), fontWeight: 620 } } }}
                sx={inputSx}
              />

              <TextField
                type="number"
                fullWidth
                size="small"
                label="Cheltuieli deductibile (RON)"
                placeholder="Introdu cheltuielile deductibile"
                onChange={(event) => setDeductibleExpenses(toNumber(event.target.value))}
                slotProps={{ inputLabel: { sx: { color: alpha(palette.ink, 0.8), fontWeight: 620 } } }}
                sx={inputSx}
              />

              <Button
                variant="contained"
                onClick={computeTaxes}
                sx={{
                  width: { xs: "100%", sm: "auto" },
                  alignSelf: { xs: "stretch", sm: "center" },
                  px: 3,
                  py: 1,
                  color: "#FFFFFF",
                  backgroundColor: palette.primary,
                  borderRadius: 999,
                  "&:hover": {
                    backgroundColor: palette.primary,
                  },
                }}
              >
                Calculeaza
              </Button>

              <Box sx={{ borderTop: `1px solid ${alpha(palette.primary, 0.22)}`, pt: 2.8 }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 2,
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.25,
                      borderRadius: 3,
                      border: `1px solid ${alpha(palette.primary, 0.2)}`,
                      backgroundColor: alpha("#FFFFFF", 0.82),
                    }}
                  >
                    <Stack spacing={1.25}>
                      <Typography sx={{ color: alpha(palette.ink, 0.66), fontSize: "0.8rem", letterSpacing: "0.06em" }}>
                        SISTEM REAL
                      </Typography>
                      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                        <Typography variant="body2">Venit brut</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 630 }}>
                          {roundToInt(anualIncome)} RON
                        </Typography>
                      </Stack>
                      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                        <Typography variant="body2">Venit impozabil</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 630 }}>
                          {roundToInt(anualIncome - deductibleExpenses)} RON
                        </Typography>
                      </Stack>
                      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                        <Typography variant="body2">Impozit pe venit (10%)</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 630 }}>
                          -{realIncomeTax} RON
                        </Typography>
                      </Stack>
                      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                        <Typography variant="body2">Contributie CAS (25%)</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 630 }}>
                          -{realCAS} RON
                        </Typography>
                      </Stack>
                      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                        <Typography variant="body2">Contributie CASS (10%)</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 630 }}>
                          -{realCASS} RON
                        </Typography>
                      </Stack>
                      <Stack
                        direction="row"
                        sx={{
                          justifyContent: "space-between",
                          mt: 1,
                          pt: 1.5,
                          borderTop: `1px dashed ${alpha(palette.primary, 0.34)}`,
                        }}
                      >
                        <Typography sx={{ color: palette.ink, fontWeight: 660 }}>Venit net PFA real</Typography>
                        <Typography sx={{ color: palette.ink, fontWeight: 710 }}>{netIncomeRealSystem} RON</Typography>
                      </Stack>
                    </Stack>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.25,
                      borderRadius: 3,
                      border: `1px solid ${alpha(palette.primary, 0.2)}`,
                      backgroundColor: alpha("#FFFFFF", 0.82),
                    }}
                  >
                    <Stack spacing={1.25}>
                      <Typography sx={{ color: alpha(palette.ink, 0.66), fontSize: "0.8rem", letterSpacing: "0.06em" }}>
                        NORMA PE VENIT
                      </Typography>
                      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                        <Typography variant="body2">Norma anuala</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 630 }}>
                          {UBER_BOLT_ANNUAL_INCOME_NORM} RON
                        </Typography>
                      </Stack>
                      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                        <Typography variant="body2">Impozit pe venit (10%)</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 630 }}>
                          -{normIncomeTax} RON
                        </Typography>
                      </Stack>
                      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                        <Typography variant="body2">Contributie CAS (25%)</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 630 }}>
                          -{normCAS} RON
                        </Typography>
                      </Stack>
                      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                        <Typography variant="body2">Contributie CASS (10%)</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 630 }}>
                          -{normCASS} RON
                        </Typography>
                      </Stack>
                      <Stack
                        direction="row"
                        sx={{
                          justifyContent: "space-between",
                          mt: 1,
                          pt: 1.5,
                          borderTop: `1px dashed ${alpha(palette.primary, 0.34)}`,
                        }}
                      >
                        <Typography sx={{ color: palette.ink, fontWeight: 660 }}>Venit net PFA norma</Typography>
                        <Typography sx={{ color: palette.ink, fontWeight: 710 }}>{netIncomeNormaSystem} RON</Typography>
                      </Stack>
                    </Stack>
                  </Paper>
                </Box>
              </Box>
            </Stack>
          </Paper>
        </Container>
      </Box>

      <Box
        id="abonamente-preturi"
        sx={{
          position: "relative",
          zIndex: 1,
          scrollMarginTop: sectionScrollMargin,
          py: { xs: 5.5, md: 8.8 },
        }}
      >
        <Container maxWidth="xl">
          <Paper
            className="reveal"
            elevation={0}
            sx={{
              ...glassPanelSx,
              p: { xs: 3, md: 4.5 },
              borderRadius: { xs: 4, md: 5 },
              animationDelay: "480ms",
              boxShadow: `0 22px 50px ${alpha("#1247BF", 0.14)}`,
            }}
          >
            <Typography variant="h3" gutterBottom sx={sectionTitleSx}>
              Abonamente/Preturi
            </Typography>
            <Typography
              sx={{
                maxWidth: 800,
                mx: "auto",
                lineHeight: 1.72,
                color: alpha(palette.ink, 0.8),
                textAlign: "center",
              }}
            >
              {loremLongText}
            </Typography>

            <Box
              sx={{
                mt: 3.8,
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                gap: 2.3,
              }}
            >
              {pricingCards.map((item, index) => (
                <Card
                  key={`${item.title}-${index}`}
                  sx={{
                    ...glassPanelSx,
                    height: "100%",
                    borderRadius: 4,
                    background:
                      index === 1
                        ? `linear-gradient(155deg, ${alpha("#E4F1FF", 0.96)} 0%, ${alpha("#CFE5FF", 0.92)} 100%)`
                        : `linear-gradient(155deg, ${alpha("#FFFFFF", 0.95)} 0%, ${alpha("#F1F7FF", 0.92)} 100%)`,
                    boxShadow:
                      index === 1
                        ? `0 24px 54px ${alpha("#0D44B9", 0.18)}`
                        : `0 16px 36px ${alpha("#0D44B9", 0.12)}`,
                    transform: index === 1 ? { xs: "none", md: "translateY(-8px)" } : "none",
                    "&:hover": {
                      borderColor: alpha(palette.primary, 0.34),
                      transform: { xs: "translateY(-4px)", md: index === 1 ? "translateY(-12px)" : "translateY(-8px)" },
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ color: palette.ink, fontWeight: 680 }}>
                      {item.title}
                    </Typography>
                    <Typography sx={{ lineHeight: 1.72, color: alpha(palette.ink, 0.82) }}>{item.text}</Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Paper>
        </Container>
      </Box>

      <Box
        id="parteneri"
        sx={{
          position: "relative",
          zIndex: 1,
          scrollMarginTop: sectionScrollMargin,
          py: { xs: 5.5, md: 8.5 },
        }}
      >
        <Container maxWidth="lg">
          <Paper
            className="reveal"
            elevation={0}
            sx={{
              ...glassPanelSx,
              p: { xs: 3, md: 4.5 },
              borderRadius: { xs: 4, md: 5 },
              animationDelay: "560ms",
              boxShadow: `0 20px 48px ${alpha("#1047BD", 0.13)}`,
            }}
          >
            <Typography variant="h3" gutterBottom sx={sectionTitleSx}>
              Parteneri
            </Typography>

            <Box
              sx={{
                mt: 4,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexWrap: "wrap",
                gap: { xs: 2.4, md: 3.2 },
              }}
            >
              {partnerLogos.map((partner) => (
                <Box
                  key={partner.name}
                  component="a"
                  href={partner.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={partner.name}
                  sx={{
                    px: { xs: 2.4, md: 3 },
                    py: { xs: 1.6, md: 1.8 },
                    borderRadius: 3,
                    border: `1px solid ${alpha(palette.primary, 0.22)}`,
                    backgroundColor: alpha("#FFFFFF", 0.78),
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: { xs: 74, md: 86 },
                    minWidth: { xs: 180, md: 210 },
                    boxShadow: `0 12px 26px ${alpha("#1148C1", 0.1)}`,
                    "&:hover": {
                      transform: "translateY(-3px)",
                    },
                    "&:hover img": {
                      transform: "translateY(-2px)",
                    },
                    "@media (prefers-reduced-motion: reduce)": {
                      "&:hover": {
                        transform: "none",
                      },
                      "&:hover img": {
                        transform: "none",
                      },
                    },
                    "&:focus-visible": {
                      outline: `2px solid ${alpha(palette.primary, 0.44)}`,
                      outlineOffset: 4,
                      borderRadius: 3,
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={partner.image}
                    alt={partner.name}
                    sx={{
                      width: { xs: 132, md: 170 },
                      height: "auto",
                      display: "block",
                      transition: "transform 180ms ease",
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Container>
      </Box>

      <Box
        id="contact"
        sx={{
          position: "relative",
          zIndex: 1,
          scrollMarginTop: sectionScrollMargin,
          py: { xs: 5.8, md: 8.5 },
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          <Paper
            className="reveal"
            elevation={0}
            sx={{
              ...glassPanelSx,
              p: { xs: 3, md: 4.5 },
              borderRadius: { xs: 4, md: 5 },
              animationDelay: "620ms",
              boxShadow: `0 24px 54px ${alpha("#1046BE", 0.15)}`,
            }}
          >
            <Typography variant="h3" gutterBottom sx={sectionTitleSx}>
              Contact
            </Typography>
            <Typography sx={{ lineHeight: 1.75, color: alpha(palette.ink, 0.82), mb: 3 }}>{loremLongText}</Typography>
            <Button
              variant="contained"
              sx={{
                px: 3,
                py: 1.05,
                color: palette.ink,
                backgroundColor: palette.primary,
                borderRadius: 999,
                fontWeight: 700,
                "&:hover": {
                  backgroundColor: palette.primary,
                },
              }}
            >
              Lorem ipsum
            </Button>
          </Paper>
        </Container>
      </Box>
    </Box>
  )
}

export default App

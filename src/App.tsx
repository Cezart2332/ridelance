import { useEffect, useState } from "react"
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
  Drawer,
  IconButton,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material"
import { alpha } from "@mui/material/styles"
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded"
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded"
import MenuRoundedIcon from "@mui/icons-material/MenuRounded"
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom"
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
  paper: "#FFFFFF",
}

const borderSoft = "1px solid transparent"
const motionEase = "cubic-bezier(0.22, 1, 0.36, 1)"
const hoverMotionDuration = "200ms"
const layoutMotionDuration = "200ms"

const glassPanelSx = {
  border: borderSoft,
  backdropFilter: "blur(10px)",
  backgroundColor: alpha(palette.paper, 0.92),
  transition: `transform ${hoverMotionDuration} ${motionEase}, border-color ${hoverMotionDuration} ${motionEase}, background-color ${hoverMotionDuration} ${motionEase}`,
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
    borderRadius: 3,
    fontWeight: 600,
    transition: `background-color ${hoverMotionDuration} ${motionEase}, border-color ${hoverMotionDuration} ${motionEase}`,
    "& .MuiOutlinedInput-notchedOutline": {
      transition: `border-color ${hoverMotionDuration} ${motionEase}`,
    },
    "&:hover": {
      backgroundColor: alpha("#FFFFFF", 0.98),
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: alpha(palette.ink, 0.28),
    },
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: alpha(palette.ink, 0.16),
  },
  "& .MuiInputBase-input::placeholder": {
    color: alpha(palette.ink, 0.5),
    opacity: 1,
  },
}

const pageFrameSx = {
  minHeight: { xs: "calc(100vh - 84px)", md: "calc(100vh - 112px)" },
  display: "flex",
  alignItems: "center",
  py: { xs: 4.5, md: 7.5 },
}

const loremText =
  "Lorem ipsum dolor sit amet consectetur adipisicing elit. Distinctio ipsa ducimus, ipsam pariatur hic possimus aliquam eaque similique nostrum."
const loremLongText =
  "Lorem ipsum dolor sit amet consectetur adipisicing elit. Distinctio ipsa ducimus, ipsam pariatur hic possimus aliquam eaque similique nostrum! Vero veniam earum sint sapiente ut. Quae aspernatur assumenda aliquam pariatur suscipit in porro ipsam."

const navItems = [
  { label: "Despre Noi", path: "/" },
  { label: "Intrebari Frecvente", path: "/intrebari-frecvente" },
  { label: "Calculator Taxe", path: "/calculator-taxe" },
  { label: "Abonamente/Prețuri", path: "/abonamente-preturi" },
  { label: "Parteneri", path: "/parteneri" },
  { label: "Contact", path: "/contact" },
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
  {
    title: "RIDElance Start - 399 lei / lună",
    summary: "Tot ce ai nevoie ca să începi și să lucrezi legal pe cont propriu.",
    cta: "Începe cu Start",
    list: [
      "Deschidere PFA cu cost rambursabil + bonus 100 lei",
      "Asistență și consultanță constantă pe tot parcursul colaborării",
      "Acces complet în dashboardul RIDElance",
      "Contabilitate completă pentru PFA",
      "Reduceri și beneficii prin partenerii RIDElance (case de marcat, cont bancar business și alte servicii utile)",
    ],
  },
  {
    title: "RIDElance Pro - 599 lei/lună",
    summary:
      "Mai multă flexibilitate, mai mult suport și avantaje exclusive pentru șoferii care vor un nivel superior.",
    cta: "Alege RIDElance Pro",
    intro: "Include tot ce ai în RIDElance Start, plus:",
    list: [
      "Găzduire sediu social gratuit în București / Ilfov",
      "Reducere la chiria mașinilor RIDElance",
      "Oferte, campanii și promoții exclusive PRO",
      "Suport prioritar",
    ],
  },
]

const partnerLogos = [
  { name: "Silso", image: silso, href: "https://silso.ro" },
  { name: "Renteaza", image: renteaza, href: "https://renteaza.ro" },
]

function HomePage() {
  return (
    <Box sx={{ ...pageFrameSx, pb: 0 }}>
      <Container maxWidth="xl">
        <Box
          className="reveal"
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.06fr 0.94fr" },
            alignItems: "center",
            gap: { xs: 4.5, md: 6.5 },
            p: { xs: 2.2, md: 3.2 },
            borderRadius: { xs: 4.5, md: 5.5 },
            backgroundColor: alpha("#7DB5FF", 0.08),
            animationDelay: "70ms",
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
                  borderColor: alpha(palette.ink, 0.24),
                  backgroundColor: alpha("#FFFFFF", 0.65),
                  borderRadius: 999,
                  "&:hover": {
                    borderColor: alpha(palette.ink, 0.36),
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
                borderRadius: { xs: 4.5, md: 5.5 },
                backgroundColor: alpha("#FFFFFF", 0.96),
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

        <Box
          sx={{
            mt: { xs: 4.2, md: 5 },
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
                borderRadius: 4.5,
                position: "relative",
                overflow: "hidden",
                animationDelay: `${120 + index * 85}ms`,
                "&::before": {
                  content: '""',
                  display: "none",
                },
                "&:hover": {
                  borderColor: alpha(palette.ink, 0.24),
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

        <Box
          className="reveal"
          sx={{
            mt: { xs: 4, md: 5.6 },
            py: { xs: 3.8, md: 4.8 },
            px: 0,
            width: "100vw",
            position: "relative",
            overflow: "hidden",
            left: "50%",
            right: "50%",
            ml: "-50vw",
            mr: "-50vw",
            borderRadius: 0,
            backgroundColor: "#1B6EF0",
            animationDelay: "350ms",
            "&::before": {
              content: '""',
              position: "absolute",
              width: 380,
              height: 380,
              borderRadius: "50%",
              top: -210,
              right: -120,
              backgroundColor: "rgba(157, 208, 255, 0.25)",
              pointerEvents: "none",
            },
            "&::after": {
              content: '""',
              position: "absolute",
              left: -70,
              bottom: -170,
              width: 420,
              height: 260,
              borderRadius: "50%",
              backgroundColor: "rgba(168, 212, 255, 0.25)",
              pointerEvents: "none",
            },
          }}
        >
          <Container maxWidth="xl" sx={{ px: { xs: 2, md: 3 }, position: "relative", zIndex: 1 }}>
            <Typography
              variant="h3"
              gutterBottom
              sx={{
                color: "#FFFFFF",
                fontWeight: 700,
                textAlign: "center",
                letterSpacing: "-0.02em",
                fontSize: { xs: "1.5rem", sm: "2rem", md: "2.45rem" },
                lineHeight: 1.2,
                maxWidth: 860,
                mx: "auto",
              }}
            >
              Ce primesti daca alegi sa lucrezi cu noi
            </Typography>
            <Box
              sx={{
                mt: 3,
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: { xs: 2, md: 3.2 },
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
                        borderRadius: 3.2,
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
          </Container>
        </Box>
      </Container>
    </Box>
  )
}

function FaqPage() {
  return (
    <Box sx={pageFrameSx}>
      <Container maxWidth="lg">
        <Stack spacing={3.2}>
          <Typography variant="h2" sx={sectionTitleSx}>
            Intrebari Frecvente
          </Typography>
          <Box>
            {faqItems.map((item, index) => (
              <Accordion
                key={item.title}
                disableGutters
                elevation={0}
                sx={{
                  backgroundColor: alpha("#FFFFFF", 0.78),
                  border: `1px solid ${alpha(palette.ink, 0.12)}`,
                  borderRadius: 3.5,
                  overflow: "hidden",
                  mb: index === faqItems.length - 1 ? 0 : 1.25,
                  transition: `background-color ${hoverMotionDuration} ${motionEase}, border-color ${hoverMotionDuration} ${motionEase}`,
                  "&:hover": {
                    borderColor: alpha(palette.ink, 0.22),
                  },
                  "&.Mui-expanded": {
                    borderColor: alpha(palette.ink, 0.24),
                  },
                  "&:before": {
                    display: "none",
                  },
                  "& .MuiAccordionSummary-root": {
                    minHeight: 58,
                    px: { xs: 1.9, md: 2.4 },
                    transition: `background-color ${hoverMotionDuration} ${motionEase}, color ${hoverMotionDuration} ${motionEase}`,
                    "&:hover": {
                      backgroundColor: alpha(palette.primary, 0.08),
                    },
                  },
                  "& .MuiAccordionSummary-content": {
                    my: 1.2,
                    transition: `margin ${hoverMotionDuration} ${motionEase}`,
                  },
                  "& .MuiAccordionSummary-expandIconWrapper": {
                    transition: `transform ${hoverMotionDuration} ${motionEase}`,
                  },
                  "& .MuiAccordionDetails-root": {
                    opacity: 0,
                    transform: "translateY(-6px)",
                    transition: `opacity ${hoverMotionDuration} ${motionEase}, transform ${hoverMotionDuration} ${motionEase}`,
                  },
                  "&.Mui-expanded .MuiAccordionDetails-root": {
                    opacity: 1,
                    transform: "translateY(0)",
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
        </Stack>
      </Container>
    </Box>
  )
}

function CalculatorPage() {
  const GROSS_SALARY = 4050
  const UBER_BOLT_ANNUAL_INCOME_NORM = 49005

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
    <Box sx={pageFrameSx}>
      <Container maxWidth="lg">
        <Stack spacing={3.2}>
          <Typography variant="h2" sx={sectionTitleSx}>
            Calculator Taxe
          </Typography>

          <Typography sx={{ mt: 1.4, color: alpha(palette.ink, 0.82), lineHeight: 1.7, textAlign: "center" }}>
            Estimeaza ce taxe vei plati ca PFA in functie de venitul tau anual si cheltuielile deductibile
          </Typography>

          <Stack spacing={2.2}>
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
                    borderRadius: 3.5,
                    border: `1px solid ${alpha(palette.ink, 0.12)}`,
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
                        borderTop: `1px dashed ${alpha(palette.ink, 0.24)}`,
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
                    borderRadius: 3.5,
                    border: `1px solid ${alpha(palette.ink, 0.12)}`,
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
                        borderTop: `1px dashed ${alpha(palette.primary, 0.5)}`,
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
        </Stack>
      </Container>
    </Box>
  )
}

function PricingPage() {
  return (
    <Box sx={pageFrameSx}>
      <Container maxWidth="xl">
        <Stack spacing={3.2}>
          <Typography
            variant="h2"
            sx={{
              ...sectionTitleSx,
              fontSize: { xs: "1.85rem", sm: "2.2rem", md: "3rem" },
              lineHeight: 1.2,
            }}
          >
            Abonamente/Prețuri
          </Typography>

          <Typography
            sx={{
              width: "100%",
              mx: "auto",
              lineHeight: 1.72,
              color: alpha(palette.ink, 0.86),
              textAlign: "center !important",
            }}
          >
            Planuri simple. Beneficii reale. Sprijin complet.
          </Typography>

          <Typography
            sx={{
              width: "100%",
              mx: "auto",
              lineHeight: 1.76,
              color: alpha(palette.ink, 0.76),
              textAlign: "center !important",
              fontSize: { xs: "0.96rem", md: "1.03rem" },
            }}
          >
            Alege varianta care ți se potrivește și concentrează-te pe drum, nu pe birocrație.
          </Typography>

          <Box
            sx={{
              mt: 3.8,
              display: "flex",
              justifyContent: "center",
              justifyItems: "center",
              width: "100%",
              mx: "auto",
              gap: { xs: 2.2, md: 2.8 },
            }}
          >
            {pricingCards.map((item, index) => (
              <Card
                key={`${item.title}-${index}`}
                sx={{
                  ...glassPanelSx,
                  position: "relative",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2.2,
                  p: { xs: 2.4, md: 3 },
                  width: "100%",
                  maxWidth: { xs: "100%", sm: 760, lg: "100%" },
                  mx: "auto",
                  minHeight: { xs: "auto", md: 560 },
                  borderRadius: 4,
                  border: `1px solid ${alpha(palette.primary, 0.16)}`,
                  backgroundColor: "#FFFFFF",
                  background:
                    `radial-gradient(circle at 88% 40%, ${alpha("#FFFFFF", 0.99)} 0%, ${alpha("#FFFFFF", 0)} 58%), radial-gradient(circle at 8% 72%, ${alpha("#1A64ED", 0.22)} 0%, ${alpha("#1A64ED", 0)} 64%), radial-gradient(circle at 98% 100%, ${alpha("#7DB5FF", 0.42)} 0%, ${alpha("#7DB5FF", 0)} 62%), linear-gradient(180deg, ${alpha("#FFFFFF", 1)} 0%, ${alpha("#F2F9FF", 1)} 100%)`,
                  boxShadow: `0px -16px 24px 0px ${alpha("#FFFFFF", 0.52)} inset, 0 14px 26px ${alpha("#1A64ED", 0.1)}`,
                  "&:hover": {
                    transform: "translateY(-3px)",
                    borderColor: alpha(palette.primary, 0.24),
                    boxShadow: `0 18px 30px ${alpha("#1A64ED", 0.1)}, inset 0 1px 0 ${alpha("#FFFFFF", 0.92)}`,
                  },
                }}
              >
                <CardContent
                  sx={{
                    p: 0,
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    height: "100%",
                    gap: 2.2,
                  }}
                >
                  <Box sx={{ width: "100%", maxWidth: 540, mx: "auto" }}>
                    <Typography sx={{ fontSize: { xs: "1.04rem", md: "1.18rem" }, color: palette.ink, fontWeight: 760, lineHeight: 1.45 }}>
                      {item.title}
                    </Typography>
                    <Typography sx={{ mt: 0.65, fontSize: { xs: "0.86rem", md: "0.95rem" }, color: alpha(palette.ink, 0.76), lineHeight: 1.62 }}>
                      {item.summary}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      width: "100%",
                      height: "0.12rem",
                      backgroundColor: alpha(palette.primary, 0.18),
                      border: "none",
                    }}
                  />

                  <Box
                    component="ul"
                    sx={{
                      p: 0,
                      m: 0,
                      alignSelf: "stretch",
                      width: "100%",
                      maxWidth: "100%",
                      listStyle: "none",
                      display: "flex",
                      flexDirection: "column",
                      textAlign: "left",
                      gap: 1,
                    }}
                  >
                    {item.intro && (
                      <Typography
                        sx={{
                          fontSize: { xs: "0.86rem", md: "0.92rem" },
                          color: alpha(palette.ink, 0.72),
                          lineHeight: 1.58,
                          pr: 1.2,
                          textAlign: "left",
                        }}
                      >
                        {item.intro}
                      </Typography>
                    )}

                    {item.list.map((point) => (
                      <Box
                        component="li"
                        key={point}
                        sx={{ display: "flex", alignItems: "flex-start", justifyContent: "flex-start", textAlign: "left", gap: 1 }}
                      >
                        <CheckCircleOutlineRoundedIcon
                          sx={{
                            fontSize: 18,
                            minWidth: 18,
                            mt: 0.22,
                            color: alpha(palette.primary, 0.82),
                          }}
                        />
                        <Typography sx={{ fontSize: { xs: "0.86rem", md: "0.94rem" }, color: alpha(palette.ink, 0.88), lineHeight: 1.6 }}>{point}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Button
                    variant="contained"
                    sx={{
                      mt: "auto",
                      px: 1.5,
                      py: 0.95,
                      width: "100%",
                      border: 0,
                      borderRadius: "9999px",
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: { xs: "0.86rem", md: "0.92rem" },
                      alignSelf: "stretch",
                      color: palette.ink,
                      backgroundColor: alpha(palette.primary, 0.9),
                      boxShadow: `inset 0 -2px 18px -5px ${alpha("#FFFFFF", 0.7)}`,
                      "&:hover": {
                        backgroundColor: palette.primaryStrong,
                      },
                    }}
                  >
                    {item.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}

function PartnersPage() {
  return (
    <Box sx={pageFrameSx}>
      <Container maxWidth="lg">
        <Stack spacing={3.2}>
          <Typography variant="h2" sx={sectionTitleSx}>
            Parteneri
          </Typography>

          <Stack spacing={2}>
            {partnerLogos.map((partner) => (
              <Box
                key={partner.name}
                sx={{
                  py: { xs: 1.2, md: 1.6 },
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "170px 1fr" },
                    alignItems: "center",

                    gap: { xs: 1.8, sm: 2.2 },
                  }}
                >
                  <Box
                    component="a"
                    href={partner.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={partner.name}
                    sx={{
                      lineHeight: 0,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: { xs: "flex-start", sm: "center" },
                      "& img": {
                        transition: `transform ${hoverMotionDuration} ${motionEase}`,
                      },
                      "&:hover img": {
                        transform: "translateY(-2px) scale(1.02)",
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
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="h6" sx={{ color: palette.ink, fontWeight: 680 }}>
                      {partner.name}
                    </Typography>
                    <Typography sx={{ mt: 0.8, lineHeight: 1.72, color: alpha(palette.ink, 0.82) }}>
                      {loremText}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}

function ContactPage() {
  return (
    <Box sx={pageFrameSx}>
      <Container maxWidth="md">
        <Stack spacing={3.2}>
          <Typography variant="h2" sx={sectionTitleSx}>
            Contact
          </Typography>

          <Typography sx={{ lineHeight: 1.75, color: alpha(palette.ink, 0.82), textAlign: "center" }}>
            {loremLongText}
          </Typography>

          <Paper
            elevation={0}
            sx={{
              ...glassPanelSx,
              p: { xs: 2.5, md: 3.2 },
              borderRadius: 3.5,
              "&:hover": {
                borderColor: alpha(palette.ink, 0.24),
                transform: "translateY(-2px)",
              },
            }}
          >
            <Stack component="form" spacing={1.5}>
              <TextField fullWidth size="small" label="Nume" placeholder="Nume" sx={inputSx} />
              <TextField type="email" fullWidth size="small" label="Email" placeholder="Email" sx={inputSx} />
              <TextField
                fullWidth
                multiline
                minRows={4}
                label="Intrebare"
                placeholder="Intrebare"
                sx={inputSx}
              />
              <Button
                variant="contained"
                sx={{
                  mt: 0.6,
                  px: 3,
                  py: 1.05,
                  color: palette.ink,
                  backgroundColor: palette.primary,
                  borderRadius: 999,
                  fontWeight: 700,
                  alignSelf: { xs: "stretch", sm: "flex-start" },
                  "&:hover": {
                    backgroundColor: palette.primary,
                  },
                }}
              >
                Lorem ipsum
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  )
}

function TermsPage() {
  return (
    <Box sx={pageFrameSx}>
      <Container maxWidth="lg">
        <Stack spacing={3.2}>
          <Typography variant="h2" sx={sectionTitleSx}>
            Termeni si conditii
          </Typography>

          <Typography sx={{ lineHeight: 1.78, color: alpha(palette.ink, 0.82), textAlign: "center" }}>
            {loremLongText}
          </Typography>
        </Stack>
      </Container>
    </Box>
  )
}

function PrivacyPolicyPage() {
  return (
    <Box sx={pageFrameSx}>
      <Container maxWidth="lg">
        <Stack spacing={3.2}>
          <Typography variant="h2" sx={sectionTitleSx}>
            Privacy Policy
          </Typography>

          <Typography sx={{ lineHeight: 1.78, color: alpha(palette.ink, 0.82), textAlign: "center" }}>
            {loremLongText}
          </Typography>
        </Stack>
      </Container>
    </Box>
  )
}

function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isNavPinned, setIsNavPinned] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setIsNavPinned(window.scrollY > 10)
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", onScroll)
    }
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [location.pathname])

  const goTo = (path: string) => {
    setIsMobileMenuOpen(false)
    navigate(path)
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        overflowX: "clip",
        scrollBehavior: "smooth",
        color: palette.ink,
        backgroundColor: "#ECF6FF",
        fontFamily: '"Space Grotesk", "SF Compact Display", "SF Pro Display", "Segoe UI", sans-serif',
        "& .MuiButton-root, & .MuiIconButton-root, & .MuiPaper-root, & .MuiCard-root, & .MuiAccordion-root, & .MuiAccordionSummary-root, & .MuiAccordionDetails-root, & .MuiAccordionSummary-expandIconWrapper, & .MuiOutlinedInput-root, & .MuiOutlinedInput-notchedOutline, & a, & img": {
          transitionDuration: `${hoverMotionDuration} !important`,
          transitionTimingFunction: `${motionEase} !important`,
        },
        "& .MuiCollapse-root": {
          transitionDuration: `${layoutMotionDuration} !important`,
          transitionTimingFunction: `${motionEase} !important`,
        },
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: "none",
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
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          top: { xs: 0, md: isNavPinned ? 0 : 12 },
          backgroundColor: isNavPinned ? alpha("#EAF4FF", 0.92) : "transparent",
          color: palette.ink,
          zIndex: (theme) => theme.zIndex.appBar,
          backdropFilter: isNavPinned ? "blur(6px)" : "none",
          transition: `top ${layoutMotionDuration} ${motionEase}, background-color ${layoutMotionDuration} ${motionEase}, backdrop-filter ${layoutMotionDuration} ${motionEase}`,
        }}
      >
        <Box
          sx={{
            width: "100%",
            py: { xs: 0.45, md: isNavPinned ? 0 : 1.6 },
            transition: `padding ${layoutMotionDuration} ${motionEase}`,
          }}
        >
          <Box
            sx={{
              width: {
                xs: "100%",
                md: isNavPinned ? "100%" : "min(1536px, calc(100% - 32px))",
              },
              mx: "auto",
              transition: `width ${layoutMotionDuration} ${motionEase}`,
            }}
          >
            <Toolbar disableGutters sx={{ minHeight: "unset", px: { xs: 1, md: 0 } }}>
              <Paper
                className="reveal"
                elevation={0}
                sx={{
                  ...glassPanelSx,
                  width: "100%",
                  px: { xs: 1.1, sm: 1.6, md: 2.1 },
                  py: { xs: 0.85, md: 1.15 },
                  borderRadius: { xs: 3, md: isNavPinned ? 0 : 999 },
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: 0.65, md: 1.8 },
                  flexWrap: "nowrap",
                  animationDelay: "30ms",
                  border: "1px solid transparent",
                  background: isNavPinned
                    ? alpha("#F4FAFF", 0.98)
                    : glassPanelSx.backgroundColor,
                  backdropFilter: isNavPinned ? "none" : "blur(10px)",
                  transition:
                    `border-radius ${layoutMotionDuration} ${motionEase}, background ${layoutMotionDuration} ${motionEase}, backdrop-filter ${layoutMotionDuration} ${motionEase}`,
                }}
              >
                <Box
                  component="button"
                  onClick={() => goTo("/")}
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
                    sx={{ height: { xs: 36, md: 58 }, width: "auto", display: "block" }}
                  />
                </Box>

                <Stack
                  direction="row"
                  spacing={{ md: 0.65 }}
                  sx={{
                    display: { xs: "none", md: "flex" },
                    flex: 1,
                    justifyContent: "center",
                    flexWrap: "wrap",
                    rowGap: 0.5,
                  }}
                >
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path

                    return (
                      <Button
                        key={item.path}
                        onClick={() => goTo(item.path)}
                        sx={{
                          color: isActive ? palette.primaryStrong : alpha(palette.ink, 0.9),
                          minWidth: "auto",
                          px: { md: 1.35 },
                          py: 0.75,
                          borderRadius: 3,
                          fontSize: { md: "0.87rem" },
                          fontWeight: 620,
                          backgroundColor: isActive ? alpha(palette.primary, 0.16) : "transparent",
                          "&:hover": {
                            color: palette.primaryStrong,
                            backgroundColor: alpha(palette.primary, 0.12),
                          },
                        }}
                      >
                        {item.label}
                      </Button>
                    )
                  })}
                </Stack>

                <Button
                  variant="contained"
                  endIcon={<ArrowForwardRoundedIcon />}
                  onClick={() => goTo("/contact")}
                  sx={{
                    display: { xs: "none", md: "inline-flex" },
                    px: { md: 2.8 },
                    py: { md: 1.1 },
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

                <Stack
                  direction="row"
                  spacing={0.6}
                  sx={{
                    ml: "auto",
                    display: { xs: "flex", md: "none" },
                    alignItems: "center",
                  }}
                >
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => goTo("/contact")}
                    sx={{
                      px: 1.45,
                      py: 0.62,
                      minWidth: "unset",
                      color: palette.ink,
                      backgroundColor: palette.primary,
                      borderRadius: 999,
                      fontWeight: 700,
                      fontSize: "0.74rem",
                    }}
                  >
                    Demo
                  </Button>
                  <IconButton
                    size="small"
                    aria-label="Deschide meniul"
                    onClick={() => setIsMobileMenuOpen(true)}
                    sx={{
                      border: `1px solid ${alpha(palette.ink, 0.2)}`,
                      color: palette.primaryStrong,
                      backgroundColor: alpha("#FFFFFF", 0.8),
                    }}
                  >
                    <MenuRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Paper>
            </Toolbar>
          </Box>
        </Box>
      </AppBar>

      <Drawer
        anchor="right"
        open={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "86vw", sm: 360 },
              p: 2,
              backgroundColor: alpha("#FFFFFF", 0.98),
            },
          },
        }}
      >
        <Stack spacing={1.4} sx={{ height: "100%" }}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Box component="img" src={logo} alt="Ridelance Logo" sx={{ height: 40, width: "auto", display: "block" }} />
            <IconButton aria-label="Inchide meniul" onClick={() => setIsMobileMenuOpen(false)}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>

          <Stack spacing={0.55} sx={{ mt: 0.6 }}>
            {navItems.map((item) => (
              <Button
                key={`mobile-${item.path}`}
                onClick={() => goTo(item.path)}
                sx={{
                  justifyContent: "flex-start",
                  px: 1.2,
                  py: 0.95,
                  borderRadius: 2.5,
                  color: location.pathname === item.path ? palette.primaryStrong : alpha(palette.ink, 0.9),
                  backgroundColor:
                    location.pathname === item.path ? alpha(palette.primary, 0.14) : "transparent",
                  fontWeight: 620,
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: alpha(palette.primary, 0.1),
                    color: palette.primaryStrong,
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
            onClick={() => goTo("/contact")}
            sx={{
              mt: "auto",
              color: palette.ink,
              backgroundColor: palette.primary,
              borderRadius: 999,
              py: 1,
              fontWeight: 700,
              "&:hover": {
                backgroundColor: palette.primary,
              },
            }}
          >
            Demo
          </Button>
        </Stack>
      </Drawer>

      <Box component="main" sx={{ position: "relative", zIndex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/intrebari-frecvente" element={<FaqPage />} />
          <Route path="/calculator-taxe" element={<CalculatorPage />} />
          <Route path="/abonamente-preturi" element={<PricingPage />} />
          <Route path="/parteneri" element={<PartnersPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/termeni-si-conditii" element={<TermsPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>

      <Box
        component="footer"
        sx={{
          mt: 0,
          py: { xs: 6.1, md: 7.8 },
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#0F4AAE",
          color: "#FFFFFF",
          "&::before": {
            content: '""',
            position: "absolute",
            width: 520,
            height: 280,
            borderRadius: "56% 44% 62% 38% / 45% 58% 42% 55%",
            top: -170,
            right: -180,
            transform: "rotate(-11deg)",
            backgroundColor: "rgba(135, 195, 255, 0.2)",
            pointerEvents: "none",
          },
          "&::after": {
            content: '""',
            position: "absolute",
            left: -190,
            bottom: -245,
            width: 460,
            height: 460,
            borderRadius: "60% 40% 48% 52% / 52% 38% 62% 48%",
            transform: "rotate(16deg)",
            backgroundColor: "rgba(97, 167, 247, 0.2)",
            pointerEvents: "none",
          },
          "& .footer-shell": {
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              width: 190,
              height: 190,
              borderRadius: "44% 56% 60% 40% / 48% 45% 55% 52%",
              top: -94,
              left: "42%",
              transform: "translateX(-50%) rotate(19deg)",
              backgroundColor: "rgba(154, 209, 255, 0.14)",
              pointerEvents: "none",
            },
            "&::after": {
              content: '""',
              position: "absolute",
              width: 300,
              height: 130,
              borderRadius: "42% 58% 54% 46% / 58% 40% 60% 42%",
              top: 18,
              right: "8%",
              transform: "rotate(-8deg)",
              backgroundColor: "rgba(173, 220, 255, 0.12)",
              pointerEvents: "none",
            },
          },
          "& .footer-shell .footer-grid": {
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              width: 136,
              height: 136,
              borderRadius: "58% 42% 47% 53% / 50% 61% 39% 50%",
              top: -48,
              left: "33%",
              transform: "translateX(-50%) rotate(24deg)",
              backgroundColor: "rgba(188, 228, 255, 0.12)",
              pointerEvents: "none",
            },
            "&::after": {
              content: '""',
              position: "absolute",
              width: 118,
              height: 118,
              borderRadius: "39% 61% 56% 44% / 41% 57% 43% 59%",
              bottom: -58,
              right: "31%",
              transform: "rotate(-18deg)",
              backgroundColor: "rgba(169, 218, 255, 0.1)",
              pointerEvents: "none",
            },
          },
        }}
      >
        <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1 }}>
          <Box className="footer-shell">
            <Box
              className="footer-grid"
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: { xs: 2.8, md: 4.4 },
                pb: { xs: 2.6, md: 3.1 },
                borderBottom: `1px solid ${alpha("#FFFFFF", 0.24)}`,
                position: "relative",
                zIndex: 1,
              }}
            >
              <Stack spacing={0.85} sx={{ alignItems: "flex-start", position: "relative", zIndex: 1 }}>
                <Box
                  component="a"
                  href="mailto:contact@ridelance.ro"
                  sx={{
                    color: alpha("#FFFFFF", 0.95),
                    textDecoration: "none",
                    fontWeight: 770,
                    letterSpacing: "0.01em",
                    lineHeight: 1.32,
                    fontSize: { xs: "1.16rem", md: "1.32rem" },
                    "&:hover": {
                      color: "#FFFFFF",
                    },
                  }}
                >
                  contact@ridelance.ro
                </Box>

                <Box
                  component="a"
                  href="tel:+40070000000"
                  sx={{
                    color: alpha("#FFFFFF", 0.95),
                    textDecoration: "none",
                    fontWeight: 770,
                    letterSpacing: "0.01em",
                    lineHeight: 1.32,
                    fontSize: { xs: "1.16rem", md: "1.32rem" },
                    "&:hover": {
                      color: "#FFFFFF",
                    },
                  }}
                >
                  +40 700 000 000
                </Box>
              </Stack>

              <Stack spacing={0.85} sx={{ alignItems: { xs: "flex-start", md: "flex-end" }, position: "relative", zIndex: 1 }}>

                <Button
                  onClick={() => goTo("/termeni-si-conditii")}
                  sx={{
                    p: 0,
                    minWidth: "unset",
                    color: alpha("#FFFFFF", 0.95),
                    textTransform: "none",
                    fontWeight: 770,
                    letterSpacing: "0.01em",
                    lineHeight: 1.32,
                    fontSize: { xs: "1.12rem", md: "1.28rem" },
                    justifyContent: "flex-start",
                    "&:hover": {
                      color: "#FFFFFF",
                      backgroundColor: "transparent",
                    },
                  }}
                >
                  Termeni si conditii
                </Button>

                <Button
                  onClick={() => goTo("/privacy-policy")}
                  sx={{
                    p: 0,
                    minWidth: "unset",
                    color: alpha("#FFFFFF", 0.95),
                    textTransform: "none",
                    fontWeight: 770,
                    letterSpacing: "0.01em",
                    lineHeight: 1.32,
                    fontSize: { xs: "1.12rem", md: "1.28rem" },
                    justifyContent: "flex-start",
                    "&:hover": {
                      color: "#FFFFFF",
                      backgroundColor: "transparent",
                    },
                  }}
                >
                  Privacy Policy
                </Button>
              </Stack>
            </Box>

            <Typography
              sx={{
                pt: { xs: 2.4, md: 2.9 },
                textAlign: "center",
                color: alpha("#FFFFFF", 0.92),
                fontWeight: 680,
                letterSpacing: "0.01em",
                fontSize: { xs: "1.02rem", md: "1.1rem" },
              }}
            >
              © Copyright 2026 by ridelance.ro
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default App

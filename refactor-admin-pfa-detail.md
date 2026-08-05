# Spec: refactor UI pagina admin „PFA-uri înrolate → detaliu client"

**Stack:** React + Material UI. Fără Tailwind, fără CSS modules noi. Stilizarea se face prin `theme` (global) + `sx` (one-off) + `styled()` (repetat).

**Scope:** strict prezentațional. Nu schimba API-uri, DTO-uri, rute sau logică de business. Aceleași date, altă ierarhie.

---

## 1. Problema

Pagina actuală are date corecte dar zero ierarhie vizuală:

- **Paper în Paper în Paper.** Fiecare bloc are border/elevation + padding propriu, imbricate pe 2-3 niveluri. Nimic nu iese în evidență pentru că totul iese în evidență.
- **KPI cards false.** Cele 5 boxe de sus (Plan abonament, Status abonament, Tip înregistrare, Status lună curentă, Ultima activitate) sunt metadate text, nu metrici. Nu merită tratament de card.
- **Câmpuri goale ca boxe full-size.** „Nu se aplică" / „Nu este completat" ocupă exact aceeași suprafață ca o valoare reală. 4 din 6 câmpuri din „Date completate în formular" sunt goale.
- **Bară de 6 butoane cu greutate identică.** „Autentificare ca utilizator", „Schimbă plan", „Aplică discount", „Suspendă cont", „Reactivează cont", „Chat" — toate cu `startIcon`, toate aceeași culoare. O acțiune distructivă stă lângă una banală.
- **Prea multe culori.** Verde, portocaliu, roșu, albastru, gri — toate saturate (paleta semantică default MUI), toate simultan pe ecran.
- **Scroll infinit pe o coloană.** Totul e stivuit vertical; „Dosar de înființare" e sub al treilea fold.
- **`IconButton` fără label sau tooltip** pe rândurile de documente (check verde / X roșu / open / download).

## 2. Direcție

Model: **Shopify Polaris „Resource details layout"** + densitatea Linear/Stripe.

- Header full-width cu acțiunile paginii → conținut pe două coloane, primar 2/3 stânga, secundar 1/3 dreapta sticky.
- Paletă acromatică. Un singur accent, folosit **doar** pentru linkuri și acțiunea primară.
- Progressive disclosure: `Tabs` pentru sub-view-uri, `Collapse` pentru secțiuni, detaliu la cerere.
- Regula: **fiecare element trebuie să-și merite pixelii** — ori ajută la o decizie, ori la o acțiune, ori dispare.

## 3. Tema

Un singur fișier `src/theme/index.ts`, montat cu `<ThemeProvider>` + `<CssBaseline />` în root. **Zero culori hardcodate în componente** — totul prin `theme.palette` / `theme.spacing`.

### 3.1 Paletă

Înlocuiește complet default-ul MUI. `#1976d2` este cel mai recognoscibil semn de „temă neatinsă".

```ts
palette: {
  mode: 'light',
  primary:   { main: '#2563EB', dark: '#1D4ED8', light: '#EFF6FF', contrastText: '#FFFFFF' },
  background:{ default: '#FAFAFA', paper: '#FFFFFF' },
  text:      { primary: '#18181B', secondary: '#52525B', disabled: '#A1A1AA' },
  divider:   '#E7E7E9',
  grey: { 50:'#FAFAFA', 100:'#F4F4F5', 200:'#E4E4E7', 300:'#D4D4D8', 500:'#71717A', 700:'#3F3F46', 900:'#18181B' },
  success: { main:'#15803D', light:'#F0FDF4', dark:'#BBF7D0' },
  warning: { main:'#A16207', light:'#FEFCE8', dark:'#FEF08A' },
  error:   { main:'#B91C1C', light:'#FEF2F2', dark:'#FECACA' },
}
```

`success/warning/error` se folosesc **exclusiv** pe `StatusBadge` și pe textul acțiunilor distructive. Niciodată pe butoane `contained`, niciodată ca fundal de icon.

### 3.2 Umbre

MUI aplică `elevation` implicit pe aproape tot. Anulează nivelurile joase, păstrează doar ce are nevoie de detașare reală (Menu, Popover, Dialog):

```ts
import { createTheme } from '@mui/material/styles';
const base = createTheme();
const shadows = [...base.shadows] as typeof base.shadows;
for (let i = 1; i <= 7; i++) shadows[i] = 'none';
shadows[8]  = '0 4px 16px rgba(24,24,27,0.08)';  // Menu / Popover
shadows[16] = '0 12px 32px rgba(24,24,27,0.12)'; // Dialog / Drawer
```

Detașarea se face cu **border 1px `divider`**, nu cu umbră.

### 3.3 Tipografie

Un singur font family. Scală strictă — nu inventa mărimi intermediare, nu folosi `h1`–`h4` default (sunt uriașe).

```ts
typography: {
  fontFamily: '"Inter", system-ui, sans-serif',
  h1:        { fontSize: 24, fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.01em' },
  h2:        { fontSize: 16, fontWeight: 600, lineHeight: 1.4 },   // titlu secțiune
  subtitle2: { fontSize: 14, fontWeight: 500, lineHeight: 1.4 },   // nume document, titlu rând
  body1:     { fontSize: 14, fontWeight: 400, lineHeight: 1.5 },   // valori
  body2:     { fontSize: 13, fontWeight: 400, lineHeight: 1.5 },   // meta, text secundar
  caption:   { fontSize: 13, fontWeight: 400, lineHeight: 1.4 },   // label câmp
  button:    { fontSize: 14, fontWeight: 500, textTransform: 'none' },
}
```

`textTransform: 'none'` e obligatoriu — UPPERCASE-ul default de pe `Button` e al doilea mare tell MUI. Elimină și UPPERCASE-ul manual din labelurile actuale („NUME FORMULAR", „TELEFON").

Maxim 2 greutăți vizibile simultan într-o zonă.

Pentru identificatori numerici (CUI, CNP, CAEN, nr. document): `sx={{ fontVariantNumeric: 'tabular-nums' }}`.

### 3.4 Formă și spațiere

```ts
shape: { borderRadius: 8 },
spacing: 8,   // rămâne default; folosește theme.spacing(2.5) = 20px
```

```
padding container    20px  (theme.spacing(2.5)) — acum e ~32px
gap între secțiuni   16px  (2)
gap intra-secțiune   12px  (1.5)
înălțime rând        44px  (listă documente, listă secțiuni)
max-width conținut   1200px, centrat
```

Ținta: **prima secțiune de conținut vizibilă fără scroll**, iar înălțimea totală a paginii redusă cu minim 35%.

### 3.5 Override-uri de componente

```ts
components: {
  MuiPaper: {
    defaultProps: { elevation: 0, variant: 'outlined' },
    styleOverrides: { root: { backgroundImage: 'none' } },
  },
  MuiCard: { defaultProps: { elevation: 0, variant: 'outlined' } },
  MuiButton: {
    defaultProps: { disableElevation: true },
    styleOverrides: { sizeMedium: { paddingBlock: 6, paddingInline: 12 } },
  },
  MuiTab: { styleOverrides: { root: { minHeight: 44, padding: '0 12px', fontSize: 14 } } },
  MuiTabs: { styleOverrides: { indicator: { height: 2 } } },
  MuiListItemButton: { styleOverrides: { root: { minHeight: 44 } } },
  MuiChip: { styleOverrides: { root: { borderRadius: 6, height: 22, fontSize: 12 } } },
  MuiTooltip: { defaultProps: { arrow: false }, styleOverrides: { tooltip: { fontSize: 12 } } },
  MuiDivider: { styleOverrides: { root: { borderColor: '#E7E7E9' } } },
}
```

⚠ `MuiPaper.defaultProps.elevation = 0` afectează și `Menu`/`Dialog` (sunt Paper-based). Repară punctual: `<Menu slotProps={{ paper: { elevation: 8, variant: 'elevation' } }}>`.

## 4. Structura nouă

```
┌──────────────────────────────────────────────────────────────┐
│ ← PFA-uri înrolate                                           │  ← Link text, nu IconButton rotund
│                                                              │
│ Veritatis quo repreh Enim labore exceptur      [Activează] ⋯ │  ← h1 + 1 primary + Menu
│ dejarohy@mailinator.com · Telefon necompletat · CUI 52486060 │
│                                                              │
│ Plan Fără plan  ·  Abonament Fără  ·  Tip NuAmPfa  ·  ...    │  ← meta bar, o linie, fără carduri
├──────────────────────────────────────────────────────────────┤
│ Onboarding   Documente   Date client   Dosar   Rapoarte      │  ← Tabs
├──────────────────────────────────────────────────────────────┤
│                                          │                   │
│  COLOANĂ PRIMARĂ (2fr)                   │  SECUNDARĂ (1fr)  │
│  ────────────────────                    │  sticky           │
│  Conținutul tabului activ                │                   │
│                                          │  Status onboarding│
│                                          │  Acțiuni          │
│                                          │  Activitate       │
└──────────────────────────────────────────────────────────────┘
```

Layout-ul pe coloane se face cu CSS Grid prin `sx`, nu cu `<Grid container>` — evită drama `Grid` vs `Grid2` între versiuni MUI și e mai puțin markup:

```tsx
<Box sx={{
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(0, 1fr)' },
  gap: 2,
  maxWidth: 1200,
  mx: 'auto',
}}>
```

Coloana secundară: `sx={{ position: 'sticky', top: 96, alignSelf: 'start' }}` (dezactivat sub `lg`).

### Header

- Breadcrumb: `<Link underline="hover" variant="body2" color="text.secondary">← PFA-uri înrolate</Link>`. Elimină `IconButton` circular cu săgeată.
- `<Avatar sx={{ width: 40, height: 40, bgcolor: 'grey.100', color: 'text.secondary' }}>` — inițială, fără culoare de brand.
- `<Typography variant="h1">` pentru nume. Sub el, **o singură** linie `body2 / text.secondary` cu identificatorii, separați prin `·`. Valorile lipsă: `Telefon necompletat` în `text.disabled` — nu ca box separat.
- Dreapta: **un singur** `Button variant="contained"` (acțiunea contextuală — „Gata de activare" devine `Activează contul`, verb activ) + `IconButton` cu `⋯` care deschide `<Menu>` cu restul.

### Meta bar (înlocuiește cele 5 KPI cards)

Un singur `<Paper>` full-width sub header, `sx={{ px: 2.5, py: 1.5, borderRadius: 0, borderInline: 0 }}`. Înăuntru `<Stack direction="row" spacing={2.5} divider={<Divider orientation="vertical" flexItem />} flexWrap="wrap">`, cu perechi `caption text.secondary` + `body2 fontWeight 500`.

Fără carduri, fără borduri individuale, fără iconuri. Pe mobil: wrap pe 2 coloane, nu scroll orizontal.

### Tabs

`Onboarding` · `Documente` · `Date client` · `Dosar înființare` · `Rapoarte Uber`

`<Tabs textColor="inherit" variant="scrollable" allowScrollButtonsMobile>`, tab activ `text.primary` + indicator 2px `primary.main`, inactiv `text.secondary`. Fără pill-uri, fără background. Starea tabului în URL (`?tab=documente`) ca să fie linkabilă și să supraviețuiască refresh-ului.

### Tab „Onboarding" (coloana primară)

Un singur `<Paper>` cu `<List disablePadding>` și `divider` pe rânduri — nu 6 carduri separate:

```
┌────────────────────────────────────────────────────┐
│ ✓  Eligibilitate                  3 doc   Validat ⌄│
│ ✓  PFA                            1 doc   Validat ⌄│
│ ○  Fiscal, bancă & semnături      —  În completare ⌄│
│ ○  Autorizație transport (ARR)    —  În completare ⌄│
│ ○  Uber & Bolt                    —  În completare ⌄│
│ ⊘  Vehicul, copie conformă        —        Blocat  │
└────────────────────────────────────────────────────┘
```

- `ListItemIcon` cu cerc 20px + iconiță 12px. Validat = `success`, în completare = neutru, blocat = `text.disabled` + `opacity: 0.6` pe tot rândul, respins = `error`.
- Elimină cifrele 0-5 în cerc colorat. Ordinea e implicită din poziția în listă; numerotarea nu adaugă informație aici.
- Expandare cu `<Collapse timeout={150}>`, `prefers-reduced-motion` respectat (`useMediaQuery('(prefers-reduced-motion: reduce)')` → `timeout={0}`).
- Conținut expandat: documentele + textul explicativ, `pl: 5.5`, `bgcolor: 'grey.50'` ca să se distingă fără border nou.
- Rândurile blocate: `disabled` pe `ListItemButton`, iar motivul („Finalizează întâi pasul PFA") într-un `<Tooltip>` pe hover, nu ca text permanent. (`Tooltip` pe element disabled are nevoie de un `<span>` wrapper.)

### Rând de document (component reutilizabil)

```
📄  specimen-semnatura.png                    În verificare   ⋯
    Specimen de semnătură · 240 KB · 05.08.2026
```

- Iconiță de tip fișier 16px, `text.disabled`, monocromă.
- `subtitle2` pentru nume, `body2 / text.secondary` pentru meta pe rândul doi.
- `StatusBadge` la dreapta.
- Acțiunile (Aprobă / Respinge / Deschide / Descarcă) intră într-un `<Menu>` deschis din `⋯` — **nu** 4 `IconButton` mereu vizibile. `Respinge` ca `MenuItem` cu `sx={{ color: 'error.main' }}`.
- Revelare pe hover: `sx={{ '&:hover .row-actions': { opacity: 1 } }}` + `.row-actions { opacity: 0 }`, dar `opacity: 1` permanent la `:focus-within` și pe touch (`@media (hover: none)`).

### Tab „Date client" — perechi label/valoare

Nu boxe. `<Box sx={{ display:'grid', gridTemplateColumns:{ xs:'1fr', sm:'repeat(2,1fr)', md:'repeat(3,1fr)' }, columnGap: 2.5, rowGap: 2 }}>`, fiecare celulă:

```
Nume formular
Veritatis quo repreh Enim labore exceptur
```

`caption / text.secondary` deasupra, `body1 / text.primary` dedesubt, fără border, fără background.

**Câmpurile goale:** valoarea devine `—` în `text.disabled`. Deasupra grid-ului, `<FormControlLabel control={<Switch size="small" />} label="Ascunde câmpurile necompletate" />`, default pornit. Dacă toate câmpurile unei grupe sunt goale, colapsează grupa cu un rând sumar: `6 câmpuri necompletate — Arată`.

### Coloana secundară (sticky)

Trei blocuri într-un singur `<Paper>`, separate cu `<Divider>`. **Nu** trei carduri.

1. **Progres onboarding** — `<LinearProgress variant="determinate" sx={{ height: 4, borderRadius: 2 }} />` + `2 din 6 secțiuni validate`. O singură bară, fără procente duplicate.
2. **Acțiuni** — `<Stack>` de `<Button variant="text" fullWidth sx={{ justifyContent: 'flex-start' }}>`:
   - `Autentificare ca utilizator` (cel mai folosit → sus)
   - `Schimbă plan`
   - `Aplică discount`
   - `Deschide chat`
   - `<Divider />`
   - `Suspendă cont` / `Reactivează cont` — `color="error"`, mutual exclusive (afișează doar cea aplicabilă stării contului, nu ambele)
3. **Activitate** — `Ultima activitate: acum 17 minute` + ultimele 3 evenimente dacă există endpoint. Dacă nu, doar linia.

### Date sensibile (CNP)

Păstrează masking-ul. „Dezvăluie" devine `IconButton size="small"` cu `VisibilityOutlined` + `aria-label="Dezvăluie CNP"`, învelit în `Tooltip`. La click loghează accesul dacă backendul suportă. Valoarea revine mascată automat la schimbarea tabului.

## 5. Componente de extras

În `src/components/admin/`, ca să le refolosești pe restul paginilor de admin. Fiecare e un wrapper subțire peste primitive MUI — **nu** reimplementa ce există deja.

| Component | Construit din | Rol |
|---|---|---|
| `PageHeader` | `Stack`, `Typography`, `Link`, `Avatar`, `Button`, `Menu` | breadcrumb + titlu + subtitlu + acțiuni |
| `MetaBar` | `Paper`, `Stack`, `Divider` | perechi label/valoare inline |
| `PageTabs` | `Tabs`, `Tab` + sincronizare URL | sub-view-uri |
| `Section` | `Paper`, `Typography`, `Divider` | titlu + acțiune opțională + conținut, fără imbricare |
| `Field` | `Stack`, `Typography` | pereche label/valoare, gestionează starea goală („—") |
| `FieldGrid` | `Box` grid, `Switch` | grid de `Field` + toggle „ascunde necompletate" |
| `StatusBadge` | `Chip` | variantele: success \| warning \| error \| neutral |
| `DocumentRow` | `ListItem`, `ListItemIcon`, `Menu` | rând document cu meniu de acțiuni |
| `ActionMenu` | `IconButton`, `Menu`, `MenuItem` | dropdown `⋯` |
| `EmptyState` | `Stack`, `Typography`, `Button` | text + o acțiune, fără ilustrații |
| `SectionSkeleton` | `Skeleton` | loading cu aceeași înălțime ca finalul |

**`StatusBadge`** — nu folosi `color="success"` default (verde saturat, tell MUI). Definește variantele explicit:

```tsx
const tones = {
  success: { color: 'success.main', bgcolor: 'success.light', borderColor: 'success.dark' },
  warning: { color: 'warning.main', bgcolor: 'warning.light', borderColor: 'warning.dark' },
  error:   { color: 'error.main',   bgcolor: 'error.light',   borderColor: 'error.dark'   },
  neutral: { color: 'text.secondary', bgcolor: 'grey.100', borderColor: 'grey.200' },
};
<Chip size="small" variant="outlined" label={label} sx={{ ...tones[tone], fontWeight: 500 }} />
```

Fundal subtil + text colorat, atât. **Nu** dot colorat + text + border simultan.

## 6. Anti-checklist MUI

Verifică la final că **niciuna** din astea nu e în cod:

- [ ] `elevation` > 0 pe `Paper`/`Card` în conținutul paginii
- [ ] Culoarea `#1976d2` sau `primary` default nemodificat
- [ ] Stiva completă `Card → CardHeader → CardContent → CardActions` (folosește `Paper` + `Stack`)
- [ ] `Paper` direct în alt `Paper`, ambele cu border
- [ ] `Button` cu `textTransform: uppercase` (default-ul MUI)
- [ ] Mai mult de un `variant="contained"` vizibil pe ecran
- [ ] `Chip color="success|error"` filled default
- [ ] `Typography variant="h6"` folosit ca titlu generic peste tot
- [ ] `Grid container spacing={3}` ca layout principal
- [ ] `Alert` cu severity colorat acolo unde ajunge un `Typography` gri
- [ ] `startIcon` pe fiecare `Button`
- [ ] `IconButton` fără `aria-label` sau fără `Tooltip`
- [ ] `TextField variant="filled"` sau `standard` (folosește `outlined`, `size="small"`)
- [ ] `sx` cu 15 proprietăți repetat în 5 locuri (extrage în `styled()` sau în temă)
- [ ] Orice culoare hardcodată în afara fișierului de temă
- [ ] Gradiente, emoji, iconițe în cerc colorat ca decor
- [ ] Animații peste 200ms sau hover care mișcă layout-ul
- [ ] Mai mult de 6 elemente într-un rând de acțiuni

## 7. Stări obligatorii

Pentru fiecare zonă care încarcă date: **loading** (`Skeleton` cu aceeași înălțime ca finalul, ca să nu sară layout-ul — CLS 0), **empty** (`EmptyState`: text + acțiune, fără ilustrație), **error** (ce s-a întâmplat + cum se rezolvă + retry). Fără `CircularProgress` centrat pe toată pagina.

## 8. Accesibilitate

- Contrast minim WCAG AA (4.5:1) — verifică `text.disabled` pe `background.default`.
- Focus vizibil: nu dezactiva `:focus-visible`; dacă folosești `disableRipple`, adaugă `outline: 2px solid` pe `primary.main` cu offset 2px.
- `Tabs` navigabile cu săgeți (nativ în MUI), `Menu` se închide cu Escape (nativ) — nu le sabota.
- `Tooltip` pe orice `IconButton` rămas + `aria-label`.
- `Collapse` cu `timeout={0}` când `prefers-reduced-motion: reduce`.

## 9. Responsive

- `lg+`: două coloane 2fr/1fr, secundara sticky.
- `md`: două coloane, secundara ne-sticky.
- `xs–sm`: o coloană, secundara **sub** conținutul primar; blocul de acțiuni devine bară sticky jos (`Paper` cu `position: fixed; bottom: 0`) cu acțiunea primară + `⋯`.
- `Tabs` cu `variant="scrollable"`, fără wrap.

## 10. Criterii de acceptare

1. Zero `Paper`/`Card` imbricat în alt `Paper`/`Card` cu border.
2. Înălțimea totală a paginii scăzută cu ≥35%.
3. Primul viewport conține: identitate, status onboarding, acțiunea primară.
4. Maxim 3 culori non-neutre pe ecran simultan (accent + max 2 semantice).
5. Toate câmpurile goale colapsate by default.
6. Un singur `variant="contained"` vizibil; restul `text`/`outlined` sau în `Menu`.
7. Componentele din §5 sunt generice și reutilizabile pe alte pagini de admin.
8. Zero culoare hardcodată în afara `src/theme/`.
9. Nicio regresie funcțională: toate acțiunile existente rămân accesibile.

---

## Cum să lucrezi

1. Verifică versiunea MUI din `package.json` și adaptează API-urile (`Grid` vs `Grid2`, `slotProps` vs `componentsProps`) — nu presupune.
2. Citește codul actual al paginii și inventariază fiecare câmp/acțiune într-o listă — nimic nu se pierde la refactor.
3. Scrie tema (§3) și componentele din §5 **înainte** să atingi pagina.
4. Refactorizează pagina consumând componentele noi.
5. Screenshot înainte/după și compară cu §10 + anti-checklist-ul §6. Dacă un criteriu pică, corectează înainte să raportezi.
6. Nu adăuga dependențe noi. MUI acoperă tot ce cere spec-ul ăsta.

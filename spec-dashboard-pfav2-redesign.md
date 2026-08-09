# SPEC — Refactor vizual Dashboard PFA (RIDElance)

> **Pentru Claude Code.** Refactorizăm **doar prezentarea** dashboard-ului PFA: header, bara de filtre (inclusiv bug-ul de sticky), tipografia cifrelor, stilul cardurilor și paleta de culori (UI + grafice).
>
> **NU** schimbăm: calculele fiscale, contractele de date, logica de sincronizare Bolt/Uber, componentele de business. Dacă un fișier conține și logică, și stil — atingem doar stilul.
>
> **Referință vizuală:** `exemplu-dashboard.png` (dashboard-ul „Reports"). Ne apropiem de el ca **densitate, ierarhie tipografică, tratament al cardurilor și disciplină cromatică** — nu îl copiem 1:1.

---

## 1. Probleme identificate

| # | Problemă | Unde |
|---|---|---|
| P1 | Zona „Dashboard PFA" + „3–9 august 2026" arată neterminată — două rânduri de text pe verticală, cu spațiu mort între ele, fără aliniere cu nimic | header pagină |
| P2 | Buton `Exportă` nefolosit, preluat din exemplul de design, fără funcționalitate cerută | header pagină |
| P3 | Bara de filtre e sticky, dar **transparentă** — la scroll conținutul trece vizibil prin ea; cardurile și barele de progres se suprapun peste pill-urile de filtru | bara de filtre |
| P4 | Titlul rămâne fix la scroll dar rupt de context; data selectată dispare — utilizatorul pierde referința perioadei exact când se uită la grafice | header pagină |
| P5 | Fontul cifrelor: cifre proporționale, prea light, fără `tabular-nums` — coloanele de sume nu se aliniază, valorile mari arată slab | toate KPI-urile și tabelele |
| P6 | Cardurile arată „plate" — border prea vizibil, fără umbră, radius mic, padding inconsistent | toate cardurile |
| P7 | Paleta e o combinație nearmonizată: verde crud, roșu, portocaliu, galben și albastru pe același grafic; verdele din donut-ul „De unde vin banii" e fluorescent și nu are legătură cu brandul | grafice + chips |
| P8 | Banner-ul galben „Datele afișate pot fi în urmă" e prea greu vizual pentru un avertisment de rutină și împinge KPI-urile sub fold | sub filtre |

---

## 2. Header-ul paginii (rezolvă P1, P2, P4)

### 2.1 Decizie: păstrăm titlul, dar îl restructurăm

Nu îl scoatem de tot — utilizatorul are nevoie de ancora perioadei. Îl reorganizăm într-un **singur bloc header**, cu titlu și perioadă pe **aceeași linie de bază** ca în referință, nu stivuite cu gol între ele.

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Dashboard PFA                        ● Bolt sincronizat azi · Uber 15.07  │
│  3–9 august 2026 · 7 zile                                              🔔  │
├────────────────────────────────────────────────────────────────────────────┤
│  [Săpt. curentă][Luna curentă][Luna anterioară][An curent][Interval]       │
│  [Toate ● Bolt ● Uber]        [Toate  Card  Cash]        ↺ Resetează       │
└────────────────────────────────────────────────────────────────────────────┘
```

- **Titlu:** `Dashboard PFA` — 24px / weight 600 / `text.primary` / `letterSpacing: -0.01em`.
- **Subtitlu:** `3–9 august 2026 · 7 zile` — 14px / `text.secondary`, la **4px** sub titlu (nu 24px, cum e acum). Adaugă numărul de zile — dă context și umple linia.
- **Dreapta, aliniat pe linia titlului:** chip-ul de sincronizare (§2.3) + clopoțelul de notificări.
- **`Exportă` — se elimină complet.** Șterge butonul, handler-ul și importurile aferente. Dacă apare cerința ulterior, revine ca item în `ActionMenu` (⋯), nu ca buton primar.
- Divider `1px solid divider` între blocul de titlu și bara de filtre. `marginTop: 20px`, `marginBottom: 16px`.

### 2.2 Comportament la scroll — header colapsabil

Aici e cheia lui P4. Header-ul devine un singur container sticky, cu două stări:

**Starea `expanded`** (`scrollY < 8px`):
- Înălțime `auto`, titlu 24px, subtitlu vizibil, fundal `background.default` (**opac**), fără border-bottom, fără umbră.

**Starea `condensed`** (`scrollY ≥ 8px`):
- Titlu scade la 16px / weight 600, pe **aceeași linie** cu perioada, care devine un chip discret: `Dashboard PFA` · `3–9 aug 2026`.
- Subtitlul separat dispare.
- Bara de filtre rămâne vizibilă integral (e principalul motiv pentru care header-ul e sticky).
- Apare `borderBottom: 1px solid divider` + `boxShadow: 0 1px 3px rgba(16,24,40,0.06)`.
- Tranziție: `height`, `font-size`, `box-shadow` — `180ms ease-out`. Respectă `prefers-reduced-motion`.

Implementare: un `useScrollTrigger`-like hook cu `threshold: 8` și `disableHysteresis: false`, aplicat pe containerul de scroll al zonei de conținut (nu pe `window`, dacă layout-ul are scroll intern — **verifică asta întâi**).

### 2.3 Chip-ul de sincronizare

Actualmente e un pill portocaliu lat, cu două informații înghesuite. Refă-l:
- `Chip` size small, variant `outlined`, `borderColor: divider`, fundal `background.paper`.
- Punct colorat 6px: verde `success.main` dacă toate sursele sunt sincronizate azi; ambru `warning.main` dacă cea mai veche sursă e mai veche de 48h.
- Label: `Sincronizat azi` sau `Uber: 15.07`. Detaliul complet pe hover, în `Tooltip`.
- Click → deschide panoul de surse (înlocuiește link-ul „Deschide sursele" din banner).

### 2.4 Banner-ul de date vechi (P8)

Se elimină ca banner full-width. Informația migrează în chip-ul de la §2.3 (punct ambru + tooltip). Dacă o sursă e mai veche de **7 zile**, atunci — și doar atunci — afișăm un `Alert` inline, `severity: warning`, `variant: standard`, fără fundal saturat: `background: warning.50`, `border: 1px solid warning.100`, text 13px. Nu full-width peste toată grila: îl punem **doar peste coloana de KPI-uri**, ca să nu împingă tot conținutul.

---

## 3. Bara de filtre — fix sticky (rezolvă P3)

Cauza probabilă: `position: sticky` fără `background` explicit și fără `z-index` peste conținutul din grilă. Verifică și dacă un părinte are `overflow: hidden` sau `transform` — ambele rup sticky-ul.

Cerințe:

```
position: sticky
top: 0                        // sau înălțimea topbar-ului aplicației, dacă există
z-index: 20                   // strict peste carduri (care stau pe 1) și sub dialoguri (1300)
background: background.default   // OPAC, nu 'transparent', nu rgba < 1
```

- Dacă vrei efectul de „frosted": `backdropFilter: 'blur(8px)'` **plus** `backgroundColor: alpha(background.default, 0.85)` — niciodată blur singur, pentru că fără fundal semi-opac conținutul rămâne lizibil prin el.
- Padding lateral egal cu al conținutului, ca pill-urile să se alinieze cu marginea stângă a cardurilor.
- **Nu** face sticky doar rândul de filtre: fă sticky **întreg blocul header** (§2.2). Altfel titlul rămâne fix separat de filtre și apare exact ruptura din video.
- Zona de conținut primește `scroll-margin-top` egal cu înălțimea header-ului condensat, ca ancorele să nu ajungă sub bară.

**Test de acceptanță:** scroll până la graficul „Comisioane și taxe estimate" — nimic din conținut nu trebuie să fie vizibil prin bara de filtre, în niciun punct al scroll-ului.

### 3.1 Stilul pill-urilor de filtru

Referința folosește dropdown-uri cu border subtil. Noi păstrăm `ToggleButtonGroup` (e mai rapid pentru perioade), dar îl curățăm:

- Grup: `background: background.paper`, `border: 1px solid divider`, `borderRadius: 10px`, `padding: 3px`.
- Buton: `borderRadius: 8px`, `padding: 6px 14px`, 13px / weight 500, `border: none`, `text.secondary`.
- Selectat: `background: background.default`, `color: text.primary`, weight 600, `boxShadow: 0 1px 2px rgba(16,24,40,0.06)` — efect de „pastilă ridicată", nu fundal albastru plin.
- Hover neselectat: `color: text.primary`, fără fundal.
- Cele trei grupuri (perioadă / platformă / metodă plată) separate prin `gap: 12px`, aliniate pe un singur rând cu `flexWrap: wrap`.
- `Resetează filtrele`: buton `text`, size small, `text.secondary`, apare **doar când există filtre active** (altfel e zgomot permanent).

---

## 4. Tipografie (rezolvă P5)

### 4.1 Alegerea fontului

Fontul curent face cifrele să pară subțiri și dezaliniate. Ne trebuie un grotesc cu **cifre tabulare** reale.

**Recomandare: `Geist`** (gratuit, OFL) — geometric-grotesc, cifre tabulare excelente, foarte apropiat de senzația din referință. Alternative la fel de bune, dacă vrei ceva mai puțin folosit: **`General Sans`** sau **`Satoshi`** (Fontshare, gratuite).

```css
/* self-hosted, woff2, subset latin + latin-ext (ă â î ș ț!) */
--font-ui: 'Geist', -apple-system, 'Segoe UI', sans-serif;
--font-num: 'Geist', var(--font-ui);   /* aceeași familie, alt tratament */
```

> **Obligatoriu `latin-ext`** în subset. Cu `latin` simplu, ș/ț/ă/â/î cad pe fallback și se vede imediat în „Încasări", „Comisioane", „Cheltuieli".

### 4.2 Tratamentul cifrelor — partea care schimbă cel mai mult percepția

Toate valorile numerice primesc:

```css
font-variant-numeric: tabular-nums lining-nums;
font-feature-settings: 'tnum' 1, 'lnum' 1;
letter-spacing: -0.02em;   /* doar pe valorile ≥24px */
```

Fără `tabular-nums`, `3.625 lei` și `1.172 lei` au lățimi diferite pe caracter și coloana din tabelul „De unde vin banii" pare strâmbă. E cauza principală a senzației de „neterminat".

### 4.3 Componenta `Amount`

Creează o componentă unică pentru **orice** sumă din dashboard. Rezolvă simultan alinierea, formatarea și ierarhia:

```tsx
<Amount value={3625.00} currency="lei" size="kpi" />
// randează: 3.625,00 lei
//          ^^^^^ 30px/600/text.primary   ^^^ 18px/500/text.secondary   ^^^ 15px/500/text.secondary
```

Reguli:
- Formatare cu `Intl.NumberFormat('ro-RO', { minimumFractionDigits: 2 })` — separator mii `.`, zecimale `,`.
- **Zecimalele se randează la 60% din dimensiunea părții întregi, în `text.secondary`.** Ochiul citește ordinul de mărime instant, iar cardul respiră. E singurul detaliu care apropie cel mai mult de referință.
- Unitatea (`lei`, `h`, `km`, `lei/h`) — 50% din dimensiune, weight 500, `text.secondary`, `marginLeft: 4px`.
- Valorile negative: semnul minus real `−` (U+2212), nu hyphen — se aliniază pe grilă cu cifrele.
- Variante `size`: `kpi` (30px) · `hero` (36px, pentru „Profit real estimat") · `row` (14px, în tabele/liste) · `axis` (11px, pe axele graficelor).

### 4.4 Scala tipografică

| Rol | Size/LH | Weight | Culoare |
|---|---|---|---|
| Titlu pagină (expanded) | 24 / 1.25 | 600 | `text.primary` |
| Titlu pagină (condensed) | 16 / 1.4 | 600 | `text.primary` |
| Titlu card / secțiune | 15 / 1.4 | 600 | `text.primary` |
| Label KPI | 13 / 1.4 | 500 | `text.secondary` |
| Valoare KPI | 30 / 1.15 | 600 | `text.primary` |
| Caption sub valoare | 12 / 1.4 | 400 | `text.disabled` |
| Rând tabel | 14 / 1.5 | 400/500 | `text.primary` |
| Label axă grafic | 11 / 1 | 400 | `text.disabled` |
| Overline secțiune sidebar | 11 / 1.2 | 600, `0.06em`, uppercase | `text.disabled` |

---

## 5. Culori (rezolvă P7)

### 5.1 Principiul

În referință există **un singur accent** (albastru), iar restul e neutru. Culoarea apare doar când **codifică informație**. Acum avem verde, roșu, portocaliu, galben și albastru pe același ecran, fără ca vreuna să însemne ceva consistent — de acolo vine senzația de „basic și urât".

**Trei reguli, aplicate fără excepție:**
1. **Albastrul** = metrica principală / brand / elemente interactive.
2. **Verde / roșu** = exclusiv semantic (creștere / scădere, încasare / cheltuială). Niciodată decorativ.
3. **Ambru** = exclusiv fiscalitate și avertismente. Niciodată o a patra serie într-un grafic.

### 5.2 Tokens

```
/* Neutre — baza */
background.default   #F6F7F9
background.paper     #FFFFFF
divider              #E9EBEF
text.primary         #0F172A
text.secondary       #64748B
text.disabled        #94A3B8

/* Accent */
primary.main         #2F6BFF
primary.dark         #1D4ED8
primary.100          #DBE6FF
primary.50           #EFF4FF

/* Semantic */
success.main         #12A150   success.50  #ECFDF3
error.main           #E5484D   error.50    #FEF2F2
warning.main         #C77700   warning.50  #FFF8EB   warning.100 #FDECCB
```

Elimină verdele fluorescent din donut și galbenul saturat din banner — niciunul nu există în paleta de mai sus.

### 5.3 Paleta pentru grafice

Serii din **aceeași familie de date** → rampă monocromă albastră. Categorii **cu adevărat diferite** → hue-uri distincte, dar desaturate la aceeași luminozitate percepută:

```
chart.1  #2F6BFF   albastru      — metrica principală (încasări nete, profit)
chart.2  #7DA4FF   albastru 400  — serie secundară
chart.3  #C3D5FF   albastru 200  — serie terțiară / fundal arie
chart.4  #4F46E5   indigo        — a doua categorie reală
chart.5  #0E9F8F   teal          — a treia categorie reală
chart.6  #C77700   ambru         — taxe și obligații fiscale
chart.7  #E5484D   roșu          — doar valori negative / cheltuieli
```

**Excepția platformelor:** în „De unde vin banii" și în orice defalcare pe platformă, folosim culorile de brand — Bolt `#34D186`, Uber `#0F172A`. E singurul loc unde verdele are voie să apară, pentru că acolo **înseamnă ceva**. În rest, platformele se disting prin poziție și label, nu prin culoare.

### 5.4 Aplicări punctuale

- **`Comisioane și taxe estimate`** (bare stivuite): în loc de roșu+verde+portocaliu+galben, folosește `chart.1` / `chart.2` / `chart.3` pentru comisioane și `chart.6` pentru TVA + taxa nerezident. Astfel graficul spune vizual „albastru = ce rețin platformele, ambru = ce reține statul" — asta e informația reală.
- **`Cât trebuie să pui deoparte`** (bara segmentată): toate cele 4 segmente în rampă ambru (`#C77700`, `#E09A2B`, `#EFC16B`, `#F7DFAF`) — sunt toate obligații fiscale, deci aceeași familie. Legenda de sub bară păstrează punctele colorate, aliniate cu segmentele.
- **`De unde vin banii`** (donut): inelul devine 12px grosime (acum e prea gros și prea saturat), segmente în culori de brand platformă, centrul cu `Amount size="hero"` și label `Net total` deasupra, 11px uppercase `text.disabled`.
- **`Încasări nete`** (arie): linie `chart.1` 2px + fill `linear-gradient(180deg, alpha(chart.1, 0.14) 0%, alpha(chart.1, 0) 100%)`. Fără grid vertical; grid orizontal `1px dashed divider`. Ca în referință.
- **Chips de variație** (`↑ 0,7%`): fără fundal plin. Doar `▲`/`▼` 8px + procentul, 12px weight 600, în `success.main` / `error.main`. Pill-urile colorate pline aglomerează inutil colțul cardului.

---

## 6. Carduri (rezolvă P6)

### 6.1 Stil de bază — `DashboardCard`

```
background:    background.paper
border:        1px solid divider
borderRadius:  14px
boxShadow:     0 1px 2px rgba(15,23,42,0.04), 0 2px 6px rgba(15,23,42,0.04)
padding:       20px
```

Secretul din referință: **umbra e dublă și foarte subtilă** — un strat de 1px pentru definire și unul difuz pentru ridicare. O singură umbră mare arată bălos; nicio umbră arată plat. Asta e ce simți ca lipsă.

- Hover pe carduri interactive: `boxShadow: 0 1px 2px rgba(15,23,42,0.05), 0 8px 20px rgba(15,23,42,0.07)`, `transition: 160ms`. Fără `translateY` — dashboard, nu landing page.
- Titlu card: sus-stânga, 15px/600. Acțiunea cardului (ex. `Împarte pe platforme`, `Cash / Card`): sus-dreapta, buton `text` 13px `text.secondary`. Sub ele, `marginTop: 16px`, conținutul.

### 6.2 Cardul KPI — `KpiCard`

**Scoatem pătratul cu iconiță din colțul stânga-sus.** Referința nu are iconițe pe KPI-uri, și de aceea cifrele au aer. Iconițele acelea consumă 40px pe verticală ca să repete o informație care e deja în label.

```
┌──────────────────────────────────┐
│ Încasări nete            ▲ 0,7%  │   ← 13px/500 secondary  ·  12px/600 success
│                                  │
│ 3.625,00 lei                     │   ← Amount size="kpi"
│ după comisioane platforme        │   ← 12px/400 disabled
└──────────────────────────────────┘
```

- `padding: 20px`, `minHeight: 118px`.
- Ordinea verticală: label → valoare (`marginTop: 12px`) → caption (`marginTop: 6px`).
- Delta chip aliniat pe **linia de bază a label-ului**, nu centrat pe card.
- Skeleton la loading: două bare gri (`text.disabled` la 12% opacitate), nu spinner.

### 6.3 Grila — asimetria din referință

Referința nu pune 6 carduri egale unul lângă altul; pune un bloc de KPI-uri mici lângă un card mare de grafic. Asta o face să arate „designed". Propunere pentru rândul de sus:

```
┌───────────┬───────────┬───────────┬─────────────────────────┐
│ Încasări  │ Comision  │ Ore       │                         │
│ nete      │ platforme │ online    │   Încasări nete         │
├───────────┼───────────┼───────────┤   (grafic arie)         │
│ Km în     │ Net / oră │ Net / km  │   span 2 rânduri        │
│ cursă     │           │           │                         │
└───────────┴───────────┴───────────┴─────────────────────────┘
        12 coloane: KPI-uri span 7  ·  grafic span 5
```

Sub el, rândul `Cât trebuie să pui deoparte` (span 7) + `Profit real estimat` (span 5), apoi `De unde vin banii` + `Comisioane și taxe` + `Evoluție profit`.

- `gap: 16px` uniform, orizontal și vertical. Acum spacing-ul e inconsistent între rânduri.
- Breakpoints: `<1200px` → KPI-uri 2 pe rând, graficul trece dedesubt full-width. `<900px` → totul pe o coloană, KPI-urile rămân 2 pe rând. `<600px` → 1 pe rând.

---

## 7. Fișiere

```
src/features/dashboard/
├── DashboardPage.tsx                  // grila, §6.3
├── components/
│   ├── header/
│   │   ├── DashboardHeader.tsx        // §2 — sticky + condensed
│   │   ├── SyncStatusChip.tsx         // §2.3
│   │   └── FilterBar.tsx              // §3
│   ├── cards/
│   │   ├── DashboardCard.tsx          // §6.1 — wrapper unic
│   │   ├── KpiCard.tsx                // §6.2
│   │   └── DeltaChip.tsx              // §5.4
│   └── charts/
│       ├── chartTheme.ts              // paleta §5.3 + axe/grid/tooltip Recharts
│       ├── NetIncomeAreaChart.tsx
│       ├── TaxReserveBar.tsx
│       ├── PlatformDonut.tsx
│       └── CommissionsStackedBar.tsx
├── components/Amount.tsx              // §4.3 — folosit peste tot
└── hooks/useCondensedHeader.ts        // §2.2
```

`chartTheme.ts` exportă un obiect unic cu paleta, stilul axelor, al grid-ului și al tooltip-ului. **Niciun `fill` sau `stroke` hardcodat în componentele de grafic** — toate vin de acolo. Altfel, peste două luni suntem înapoi la P7.

Tokens de culoare și tipografie: în theme-ul MUI existent (`src/theme/`), nu inline. Extinde `palette` cu cheia `chart`, tipizată prin module augmentation.

---

## 8. Criterii de acceptare

- [ ] `Exportă` eliminat complet (buton, handler, importuri).
- [ ] Titlul și perioada formează un bloc coerent; perioada afișează și numărul de zile.
- [ ] La `scrollY ≥ 8px` header-ul se condensează; perioada rămâne vizibilă ca chip; apare border + umbră.
- [ ] **La niciun punct din scroll nu se vede conținut prin bara de filtre.** Verificat pe tot parcursul paginii, inclusiv peste graficele cu fundal deschis.
- [ ] Toate cifrele folosesc `tabular-nums`; coloanele din tabelul de platforme se aliniază perfect pe verticală.
- [ ] Zecimalele și unitățile sunt randate la dimensiune redusă, prin componenta `Amount`; niciun `toFixed(2)` direct în JSX.
- [ ] Subsetul de font include `latin-ext`; diacriticele nu cad pe fallback (verifică „Încasări", „Cheltuieli", „Comisioane și taxe").
- [ ] Nicio culoare din afara tokens-urilor §5.2/§5.3 nu apare în UI. Verdele fluorescent din donut a dispărut; verdele de brand rămâne doar la defalcarea pe platforme.
- [ ] KPI-urile nu mai au pătratul cu iconiță; delta e text colorat, nu pill plin.
- [ ] Toate cardurile folosesc `DashboardCard`; umbra dublă e aplicată uniform.
- [ ] Banner-ul galben full-width a dispărut; informația e în chip-ul de sincronizare, cu escaladare la `Alert` doar peste 7 zile vechime.
- [ ] Grilă verificată la 1440 / 1200 / 900 / 390px.
- [ ] `prefers-reduced-motion` respectat pe tranziția de header.

---

## 9. Ordine de lucru sugerată

1. Tokens (culori + font + `chartTheme.ts`) — schimbă percepția cel mai mult, cu cel mai mic risc.
2. `Amount` + înlocuire în toate KPI-urile și tabelele.
3. `DashboardCard` + `KpiCard` + `DeltaChip`.
4. `DashboardHeader` + fix sticky. *(Ultimul, pentru că depinde de înălțimile stabilite mai sus.)*
5. Recolorarea graficelor prin `chartTheme`.
6. Grila asimetrică §6.3.

---

## 10. De confirmat cu clientul

1. Păstrăm titlul „Dashboard PFA" sau îl scoatem de tot și lăsăm doar perioada + filtre? *(Spec-ul de mai sus presupune că îl păstrăm, restructurat.)*
2. Fontul: `Geist` (neutru, apropiat de referință) sau ceva mai caracteristic — `General Sans` / `Satoshi`?
3. Culorile de brand ale platformelor (Bolt verde, Uber negru) — le păstrăm ca excepție, sau uniformizăm tot pe paleta albastră?
4. Banner-ul de date vechi: pragul de escaladare la `Alert` — 7 zile e potrivit sau prea permisiv?
5. Exportul revine ulterior ca funcționalitate reală (CSV/PDF), sau îl scoatem definitiv din roadmap-ul dashboard-ului?

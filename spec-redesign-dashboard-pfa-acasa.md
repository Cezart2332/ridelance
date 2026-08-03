# Spec redesign — Dashboard PFA, pagina „Acasă"

**Referință vizuală:** Figma Community — *Analytics Dashboard* by Lindsay (lho)
`https://www.figma.com/community/file/1152266255337829742/analytics-dashboard`

**Notă:** fișierul Figma nu e accesibil programatic (necesită login pentru inspect). Spec-ul de mai jos reproduce pattern-ul acelui model — *sidebar fix + topbar + bară de filtre + grid de tiles cu shadow soft + widgets de grafice + tabel paginat*, light theme, carduri albe pe fundal neutru. Dacă ai acces la layer-e și vrei valori exacte (spacing/hex), înlocuiește tokenii din §1 și restul spec-ului rămâne valid.

---

## 0. Ce se schimbă față de varianta actuală

| Acum | După |
| --- | --- |
| Pagină construită pe surse de date (secțiune Bolt, secțiune Uber) | Pagină construită pe realitatea financiară a șoferului |
| Carduri duplicate, grafice redundante | 6 KPI tiles + 2 module financiare + 3 grafice + 1 tabel |
| Upload CSV Uber / status API Bolt în centrul paginii | Mutate în **Profil → tab Uber Fleet / tab Bolt Fleet**; pe „Acasă" rămâne doar un pill discret de status în topbar |
| Date brute API afișate | Doar date agregate, normalizate |
| Tabele Bolt și Uber separate | Un singur „Istoric curse" combinat |

---

## 1. Design tokens

Definite ca CSS variables în `:root`, consumate prin Tailwind theme extend. Zero valori hardcodate în componente.

### Culori

```css
:root {
  /* surfaces */
  --bg-app:        #F5F6F8;   /* fundal pagină */
  --bg-surface:    #FFFFFF;   /* carduri */
  --bg-surface-2:  #FAFBFC;   /* rânduri alternate tabel, headere */
  --bg-sidebar:    #FFFFFF;

  /* text */
  --text-primary:   #101828;
  --text-secondary: #667085;
  --text-tertiary:  #98A2B3;

  /* borders */
  --border-subtle: #EAECF0;
  --border-strong: #D0D5DD;

  /* brand — se înlocuiește cu accentul RIDElance */
  --brand-600: #2563EB;
  --brand-500: #3B82F6;
  --brand-50:  #EFF6FF;

  /* semantice — folosite consecvent, nu decorativ */
  --pos-600: #067647;  --pos-50: #ECFDF3;   /* profit, încasări, delta pozitiv */
  --warn-600:#B54708;  --warn-50:#FFFAEB;   /* rezervă taxe, atenționări */
  --neg-600: #B42318;  --neg-50: #FEF3F2;   /* costuri, comisioane, delta negativ */

  /* platforme — o singură pereche, folosită doar în charts/badges */
  --bolt:  #34D186;
  --uber:  #111827;
}
```

**Regulă de culoare:** fundal neutru, carduri albe, **un** accent brand. Verde/ambră/roșu apar exclusiv cu sens semantic (profit / rezervă / cost). Fără gradient-uri decorative, fără carduri colorate integral. Singura excepție permisă: cardul „Cât trebuie să pui deoparte" are un accent border-left sau un halo `--warn-50` foarte subtil, ca să iasă din grid.

### Tipografie

- **UI + headings:** `Plus Jakarta Sans` (fallback: `Geist`, `system-ui`)
- **Cifre:** același font, obligatoriu `font-variant-numeric: tabular-nums` pe orice valoare monetară, în tiles și în tabel. Fără asta coloanele de sume „dansează".

| Rol | Size / Line | Weight | Culoare |
| --- | --- | --- | --- |
| Page title | 24 / 32 | 600 | primary |
| Section title | 16 / 24 | 600 | primary |
| Card label (KPI) | 13 / 20 | 500 | secondary |
| KPI value | 30 / 38 | 600 | primary |
| KPI subtext | 12 / 18 | 400 | tertiary |
| Table header | 12 / 18 | 500, uppercase, ls .04em | tertiary |
| Table cell | 14 / 20 | 400 | primary |
| Badge | 12 / 16 | 500 | contextual |

### Spacing, radius, shadow

- Scală spacing: `4 / 8 / 12 / 16 / 20 / 24 / 32 / 40`
- Radius: card `16px`, tile `14px`, input/select `10px`, badge/pill `999px`
- Shadow (soft, ca în model — asta dă senzația de „tiles"):
  ```css
  --shadow-card:  0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06);
  --shadow-hover: 0 4px 8px rgba(16,24,40,.06), 0 12px 24px rgba(16,24,40,.08);
  ```
- Border card: `1px solid var(--border-subtle)` + shadow-card. Hover pe carduri interactive: tranziție `180ms ease-out` la `--shadow-hover` + `translateY(-1px)`.

### Iconografie

`lucide-react`, stroke 1.75, size 18 în tiles / 16 în tabel. Fiecare KPI tile are un icon într-un pătrat `36×36`, radius 10, fundal `--brand-50` (sau `--warn-50` / `--pos-50` unde e semantic).

---

## 2. Shell-ul aplicației

```
┌──────────┬──────────────────────────────────────────────────────┐
│          │  TOPBAR  (h 64)                                      │
│ SIDEBAR  ├──────────────────────────────────────────────────────┤
│  248px   │  FILTER BAR (sticky, h 64)                           │
│          ├──────────────────────────────────────────────────────┤
│          │  CONTENT (max-w 1440, padding 32, grid 12 col, gap 24)│
└──────────┴──────────────────────────────────────────────────────┘
```

### Sidebar (`248px`, colapsabil la `72px`)

- Logo RIDElance sus, apoi grupuri de nav.
- Item activ: fundal `--brand-50`, text `--brand-600`, bară stânga `3px` `--brand-600`, radius 10.
- Grupuri: **Principal** (Acasă, Curse, Venituri, Cheltuieli), **Fiscal** (Declarații, Calculator taxe, Documente), **Cont** (Profil, Setări).
- Jos: card mic „Perioadă fiscală curentă" + user chip cu avatar, nume, „PFA".

### Topbar

Stânga: page title „Acasă" + subtitlu cu perioada activă („1–30 iunie 2026").
Dreapta, în ordine:
1. **Pill status surse** — `● Bolt sincronizat • Uber 17.06` — click → navighează la Profil. Verde dacă ambele OK, ambră dacă raportul Uber e mai vechi de 10 zile sau Bolt API a eșuat. Ăsta e singurul rest al modulelor de import pe homepage.
2. Buton icon notificări.
3. Buton `Exportă` (secondary, icon download).

### Filter bar (sticky, `top: 64px`, `z-30`, blur backdrop + border-bottom)

Trei control-uri, aliniate stânga; dreapta: buton text „Resetează filtrele" (apare doar când ≠ default).

| Filtru | Tip | Opțiuni |
| --- | --- | --- |
| Perioadă | Segmented control + dropdown | Săpt. curentă · Luna curentă · Luna anterioară · An curent · **Interval personalizat** (deschide selector lună/an sau date range) |
| Platformă | Segmented control cu dot colorat | Toate · Bolt · Uber |
| Tip plată | Segmented control | Toate · Card · Cash |

**Contract funcțional:** starea filtrelor trăiește în URL (`?period=month&from=…&to=…&platform=all&payment=all`) → shareable, refresh-safe, back-button-safe. Un singur hook `useDashboardFilters()`. Orice card/grafic/tabel citește din același state; **nimic** nu are filtru local.

**Excepția fiscală:** când `period` ≠ lună calendaristică, cardurile fiscale afișează valoarea pe perioada selectată, dar sub ea apare o linie de context: *„Raportare lunară: iunie 2026 — 1.250 lei"*, cu tooltip explicativ. Backend-ul returnează ambele (`periodTaxes` și `fiscalMonthTaxes`).

---

## 3. Compoziția paginii (grid 12 coloane)

```
Rând A  │ 6 × KpiTile                                    (2 col fiecare)
Rând B  │ TaxReserveCard (5)          │ RealProfitCard (7)
Rând C  │ NetEarningsChart (8)        │ PlatformBreakdown (4)
Rând D  │ FeesAndTaxesChart (6)       │ RealProfitTrendChart (6)
Rând E  │ RidesHistoryTable (12)
```

Ordine intenționată: *cât am făcut → ce e al meu / ce nu e al meu → cum a evoluat → de unde a venit → ce am făcut concret*.

---

### Rând A — KPI tiles

Componentă unică `<KpiTile>`, 6 instanțe. Toate respectă filtrele globale (dacă e selectat „Doar Bolt", tile-urile arată doar Bolt).

```tsx
<KpiTile
  icon={Wallet}
  label="Încasări nete"
  value={10652}
  format="currency"          // currency | number | duration | rate
  unit="lei"
  subtext="după comisioane platforme"
  delta={{ value: 8.4, direction: "up", label: "vs perioada anterioară" }}
  tone="brand"               // brand | positive | warning | negative | neutral
/>
```

| # | Label | Valoare | Subtext | Icon | Tone |
| --- | --- | --- | --- | --- | --- |
| 1 | Încasări nete | `10.652 lei` | după comisioane platforme | `wallet` | positive |
| 2 | Comision platforme | `1.240 lei` | reținut de Bolt și Uber | `percent` | negative |
| 3 | Ore online | `184 h` | timp total activ în platforme | `clock` | neutral |
| 4 | Km în cursă | `2.140 km` | doar km cu pasager | `route` | neutral |
| 5 | Net / oră | `57,89 lei/h` | încasări nete ÷ ore online | `trending-up` | brand |
| 6 | Net / km | `4,98 lei/km` | încasări nete ÷ km în cursă | `gauge` | brand |

Structură internă tile: `icon-box` sus-stânga · `delta badge` sus-dreapta · label · value (30px, tabular) · subtext. Înălțime fixă `140px` pentru aliniere perfectă a grid-ului.

**Delta badge:** săgeată + procent, fundal `--pos-50`/`--neg-50`. Comparație cu perioada anterioară echivalentă (săpt. trecută / luna trecută / anul trecut). Dacă nu există date pentru perioada de comparație → badge-ul nu se randează (nu afișa „0%").

---

### Rând B — cele două module financiare (hero cards)

Ăstea sunt inima paginii. Vizual mai mari, cu breakdown vizibil fără click.

#### B1. `TaxReserveCard` — „Cât trebuie să pui deoparte" (5 col)

- Accent: border-left `3px --warn-600` sau icon-box `--warn-50`. **Nu** e un card de alertă roșu — e informativ.
- Header: titlu + tooltip „(i)" cu explicația metodei de calcul.
- Valoare mare: `1.250 lei`, sub ea subtext „recomandare rezervă taxe — iunie 2026".
- **Bară stacked orizontală** (h 10, radius full) care arată proporția celor 4 componente. Segmentele colorate discret, legendă = tabelul de mai jos.
- Breakdown ca listă cu 4 rânduri (`label · dot color · sumă aliniată dreapta, tabular`):

| Componentă | Formulă | Exemplu |
| --- | --- | --- |
| TVA intracomunitar estimat | `21% × comision platforme (lună calendaristică)` | 260 lei |
| Taxă nerezident Bolt | `2% × comision Bolt` | 18 lei |
| Impozit pe venit estimat | `10% × profit estimat impozabil` | 420 lei |
| CAS / CASS estimat | din praguri fiscale configurate | 552 lei |

- Footer card: link text „Vezi calculul detaliat →" către pagina Calculator taxe.
- **Praguri fiscale configurabile server-side.** Zero constante fiscale în frontend. Backend returnează pentru fiecare componentă `{ amount, rate, basis, note }` ca UI-ul să poată afișa tooltip-uri corecte fără să știe legislația.

#### B2. `RealProfitCard` — „Profit real estimat" (7 col)

Scop declarat: să rupă confuzia „am încasat 10.000" vs „am câștigat 10.000".

- Valoare mare: `6.202 lei`, subtext „încasări nete − cheltuieli deductibile − taxe estimate".
- **Waterfall vizual** (nu doar text): 4 bare orizontale proporționale, aliniate la aceeași bază, cu semnul explicit:

| Componentă | Sumă | Stil |
| --- | --- | --- |
| Încasări nete | `10.652 lei` | bară plină, `--pos-600` |
| Cheltuieli deductibile | `−3.200 lei` | bară `--neg-600`, opacitate .8 |
| Taxe estimate | `−1.250 lei` | bară `--warn-600`, opacitate .8 |
| **Profit real estimat** | **`6.202 lei`** | bară `--brand-600`, weight 600, separator deasupra |

- În dreapta: un mic „ratio chip" — *„58% din încasări îți rămân"* — cifra pe care șoferul o ține minte.
- Dacă profitul estimat < 0 → valoarea devine `--neg-600` + o linie de context, fără dramatism.

---

### Rând C

#### C1. `NetEarningsChart` — „Încasări nete pe zile" (8 col, h 340)

- **Area chart** cu gradient subtil sub linie (`--brand-500` → transparent), linie 2px, fără puncte vizibile decât la hover.
- Granularitate derivată din filtrul de perioadă: săptămână → zile (L–D); lună → zile 1–31; an → luni.
- Când filtrul de platformă = „Toate": două arii suprapuse (Bolt `--bolt`, Uber `--uber`) sau o singură arie totală cu toggle în header. Recomandare: **o singură arie totală**, cu toggle „Împarte pe platforme" în colțul cardului. Homepage-ul rămâne curat.
- Tooltip custom: dată, net total, defalcare pe platformă, nr. curse.
- Axa Y: max 4 gridlines orizontale, `--border-subtle`, fără axă verticală, fără border la chart.
- Header card: titlu + total perioadă + delta vs perioada anterioară.

#### C2. `PlatformBreakdown` — „De unde vin banii" (4 col)

Nu duplică tile-urile de sus. Doar distribuția.

- Sus: **donut** (net Bolt vs net Uber), grosime 14, gaură cu totalul în centru.
- Jos: tabel compact 3 rânduri:

| Platformă | Net | Comision | Curse |
| --- | --- | --- | --- |
| ● Bolt | 6.200 lei | 720 lei | 85 |
| ● Uber | 4.452 lei | 520 lei | 61 |
| **Total** | **10.652** | **1.240** | **146** |

Coloanele Cash/Card se mută într-un toggle „Cash / Card" în header-ul cardului (altfel tabelul devine ilizibil la 4 coloane de grid). La toggle activ, tabelul afișează Cash / Card în loc de Comision / Curse.

---

### Rând D

#### D1. `FeesAndTaxesChart` — „Comisioane și taxe estimate" (6 col, h 300)

- **Bar chart stacked** pe aceeași granularitate temporală ca C1.
- Serii: comision Bolt, comision Uber, TVA intracomunitar estimat, taxă nerezident Bolt.
- Legendă orizontală sus, sub titlu, cu dot-uri. Bare radius 4 sus.

#### D2. `RealProfitTrendChart` — „Evoluție profit real estimat" (6 col, h 300)

- **Line chart** simplu, o singură serie: `încasări nete − cheltuieli deductibile − taxe estimate`.
- Linie de referință punctată la 0 dacă apar valori negative.
- Opțional: bandă gri deschis în fundal = încasări nete, ca să se vadă gap-ul dintre încasat și rămas. Ăsta e mesajul întregii pagini într-un singur grafic.

**Setup Recharts (comun tuturor graficelor):** `ResponsiveContainer`, `CartesianGrid` doar orizontal cu `strokeDasharray="3 3"`, `stroke=var(--border-subtle)`, `tick={{fill: var(--text-tertiary), fontSize: 12}}`, `axisLine={false}`, `tickLine={false}`, tooltip custom (nu cel default). Formatter monetar `ro-RO` cu separator de mii `.` și zecimal `,`.

---

### Rând E — `RidesHistoryTable` — „Istoric curse" (12 col)

Un singur tabel, combinat Bolt + Uber. Sortare implicită: cea mai recentă cursă sus.

| Data | Ora | Platformă | Categorie | Preluare | Destinație | Distanță | Durată | Plată | Net |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 24.06.2026 | 14:32 | ● Bolt | Comfort | Piața Unirii | Otopeni | 17,4 km | 31 min | Card | 84,50 lei |

**Reguli de randare**
- Platformă = badge cu dot colorat, nu text simplu.
- Plată = badge subtil (`Card` = brand-50, `Cash` = warn-50).
- Net = aliniat dreapta, `tabular-nums`, weight 500.
- Distanță / Durată = aliniate dreapta.
- Preluare / Destinație = `truncate` cu `title` attribute pe hover; max-width 180px fiecare.
- Câmpuri lipsă din CSV-ul Uber → `—` cu culoare `--text-tertiary`. **Nu** „N/A", **nu** celulă goală.
- Header: sticky în interiorul cardului, fundal `--bg-surface-2`.
- Rânduri: h 56, hover `--bg-surface-2`, border-bottom `--border-subtle`, fără zebra striping.
- Sortabile: Data, Distanță, Durată, Net. Restul nu.
- **Paginare: 5 curse/pagină** (per spec), footer cu „Afișez 1–5 din 146" + prev/next + selector page-size (5/10/25).
- Header card: titlu + căutare (pickup/dropoff, debounce 300ms) + buton „Exportă CSV".
- Filtrele globale se aplică: Toate → Bolt + Uber; Doar Bolt → doar Bolt; Doar Uber → doar Uber.
- Row click → drawer lateral cu detaliile cursei (hartă traseu opțional, breakdown tarif). Nu e blocant pentru v1.

---

## 4. Ce se mută în Profil

Se scot complet din „Acasă":

**Profil → tab „Uber Fleet"** (vizibil după configurare)
- Status: ultimul raport încărcat `17.06.2026`, perioadă detectată `10.06–16.06`
- Dropzone upload CSV + istoric rapoarte încărcate (dată, perioadă, nr. curse importate, status parsare)
- CTA: `Încarcă raport Uber`

**Profil → tab „Bolt Fleet"**
- Status conexiune API, ultima sincronizare, acceptări/permisiuni API
- CTA: `Resincronizează`

Pe „Acasă" rămâne doar pill-ul de status din topbar (§2), care linkuiește aici.

---

## 5. Stări

| Stare | Comportament |
| --- | --- |
| **Loading** | Skeleton-uri cu shimmer, cu **exact** aceleași dimensiuni ca finalul (fără layout shift). Tiles → bloc 140px; charts → bloc + 4 linii de grid; tabel → 5 rânduri fantomă. Fără spinner global. |
| **Empty (perioadă fără curse)** | În fiecare card: icon 40px `--text-tertiary`, „Nicio cursă în perioada selectată", buton text „Vezi luna anterioară". Cardurile fiscale afișează `0 lei`, nu empty state. |
| **Empty (cont nou, zero surse)** | Se înlocuiește tot conținutul cu un onboarding card centrat: „Conectează Bolt sau încarcă un raport Uber ca să vezi datele" + 2 CTA către Profil. |
| **Parțial** (doar Bolt conectat) | Pagina funcționează normal. Sub filtrul de platformă apare un chip informativ: „Uber neconectat — datele afișate includ doar Bolt". |
| **Eroare** | Eroare per card, nu per pagină. Card cu icon, mesaj scurt, buton `Reîncearcă`. Restul paginii rămâne funcțional. |
| **Date stale** | Dacă ultima sincronizare Bolt > 24h sau ultimul CSV Uber > 10 zile → banner ambru subtil sub filter bar, dismissable, cu link la Profil. |

---

## 6. Responsive

| Breakpoint | Comportament |
| --- | --- |
| `≥1536px` | Layout complet, 6 tiles pe un rând |
| `1280–1536` | 3 tiles/rând (2 rânduri); restul grid-ului identic |
| `1024–1280` | Sidebar colapsat la 72px (doar icons); C1/C2 și D1/D2 devin full-width stivuite |
| `768–1024` | Sidebar → drawer cu hamburger; 2 tiles/rând; filter bar wrap pe 2 rânduri |
| `<768` | 1 coloană; tiles compacte (label + valoare pe un rând, h 88); filtrele într-un bottom-sheet cu buton „Filtre (3)"; tabelul devine **listă de carduri** (Dată+Oră / rută / net mare dreapta / badge platformă), nu tabel cu scroll orizontal |

---

## 7. Motion

Discret, nu decorativ. Nimic care întârzie citirea unei cifre.

- Page load: staggered fade-up pe rânduri, `translateY(8px) → 0`, `opacity 0 → 1`, durată 280ms, delay 40ms per rând (max 5 rânduri).
- Valorile KPI: count-up 600ms `easeOutCubic` doar la prima montare, **nu** la fiecare schimbare de filtru (devine obositor).
- Schimbare de filtru: cross-fade 150ms pe conținutul cardurilor, cardul își păstrează înălțimea.
- Charts: animație de intrare Recharts 500ms, dezactivată pe re-render din filtre.
- Respectă `prefers-reduced-motion: reduce` → toate animațiile la 0ms.

---

## 8. Contract de date (backend)

Un singur call pentru tot ce e deasupra tabelului. Tabelul are endpoint separat, paginat.

```
GET /api/pfa/dashboard/summary
  ?from=2026-06-01&to=2026-06-30
  &platform=all|bolt|uber
  &payment=all|card|cash
```

```jsonc
{
  "period": { "from": "2026-06-01", "to": "2026-06-30", "granularity": "day" },
  "kpis": {
    "netEarnings":   { "value": 10652.00, "previous": 9825.50 },
    "platformFees":  { "value": 1240.00,  "previous": 1150.00, "byPlatform": { "bolt": 720, "uber": 520 } },
    "onlineHours":   { "value": 184.0,    "previous": 176.5 },
    "rideKm":        { "value": 2140.0,   "previous": 2010.0 },
    "netPerHour":    { "value": 57.89,    "previous": 55.66 },
    "netPerKm":      { "value": 4.98,     "previous": 4.89 }
  },
  "taxReserve": {
    "scope": "period",                    // period | fiscalMonth
    "total": 1250.00,
    "components": [
      { "key": "vatIntracom",   "label": "TVA intracomunitar estimat", "amount": 260, "rate": 0.21, "basis": 1240, "note": "21% din comisionul platformelor" },
      { "key": "boltNonResident","label": "Taxă nerezident Bolt",      "amount": 18,  "rate": 0.02, "basis": 900 },
      { "key": "incomeTax",     "label": "Impozit pe venit estimat",   "amount": 420, "rate": 0.10, "basis": 4200 },
      { "key": "casCass",       "label": "CAS/CASS estimat",           "amount": 552, "rate": null, "basis": null, "note": "Prag 12 salarii minime" }
    ],
    "fiscalMonth": { "month": "2026-06", "total": 1250.00 }   // pentru afișarea de context
  },
  "realProfit": {
    "netEarnings": 10652.00,
    "deductibleExpenses": 3200.00,
    "estimatedTaxes": 1250.00,
    "value": 6202.00,
    "retentionRatio": 0.582
  },
  "platformSplit": [
    { "platform": "bolt", "net": 6200, "fees": 720, "cash": 1100, "card": 5100, "rides": 85 },
    { "platform": "uber", "net": 4452, "fees": 520, "cash": 0,    "card": 4452, "rides": 61 }
  ],
  "series": {
    "netEarnings": [ { "bucket": "2026-06-01", "bolt": 210, "uber": 180, "total": 390 } ],
    "feesAndTaxes":[ { "bucket": "2026-06-01", "boltFee": 24, "uberFee": 21, "vatIntracom": 9.4, "boltNonResident": 0.5 } ],
    "realProfit":  [ { "bucket": "2026-06-01", "netEarnings": 390, "value": 228 } ]
  },
  "sources": {
    "bolt": { "connected": true,  "lastSyncAt": "2026-06-24T14:20:00Z" },
    "uber": { "connected": true,  "lastReportAt": "2026-06-17", "detectedRange": "2026-06-10/2026-06-16" }
  }
}
```

```
GET /api/pfa/dashboard/rides?from&to&platform&payment&page=1&pageSize=5&sort=-date&q=
→ { items: [ { id, date, time, platform, category, pickup, dropoff, distanceKm, durationMin, paymentType, net } ],
    page, pageSize, total }
```

**Reguli backend**
- Toți parametrii fiscali (cote, praguri CAS/CASS, salariu minim, plafon TVA) vin din configurare, nu din cod. Frontend-ul nu conține **nicio** constantă fiscală.
- Câmpurile indisponibile în CSV-ul Uber se returnează `null`, nu `0`. `0` și „lipsă" înseamnă lucruri diferite pe ecran.
- Sumele: `decimal` server-side, `number` în JSON, rotunjire doar la afișare.
- `previous` calculat pe perioada anterioară echivalentă; `null` dacă nu există date.

---

## 9. Structura componentelor

```
features/pfa-dashboard/
├─ pages/HomePage.tsx
├─ hooks/
│  ├─ useDashboardFilters.ts      // sursa unică de adevăr, sincronizată cu URL
│  ├─ useDashboardSummary.ts      // react-query, keepPreviousData: true
│  └─ useRidesHistory.ts
├─ components/
│  ├─ FilterBar.tsx
│  ├─ KpiTile.tsx
│  ├─ TaxReserveCard.tsx
│  ├─ RealProfitCard.tsx
│  ├─ PlatformBreakdown.tsx
│  ├─ charts/{NetEarningsChart,FeesAndTaxesChart,RealProfitTrendChart,ChartTooltip}.tsx
│  ├─ RidesHistoryTable.tsx
│  └─ states/{CardSkeleton,CardEmpty,CardError}.tsx
└─ lib/format.ts                  // formatCurrency/Hours/Km/Percent, toate ro-RO
```

`keepPreviousData: true` în react-query — la schimbarea filtrului conținutul vechi rămâne vizibil estompat, fără flash de skeleton.

---

## 10. Formatare (ro-RO, o singură implementare)

```ts
formatCurrency(10652)  // "10.652,00 lei"   Intl.NumberFormat('ro-RO', {style:'currency', currency:'RON'})
formatCompact(10652)   // "10.652 lei"      pentru KPI tiles (fără zecimale peste 1000)
formatHours(184)       // "184 h"
formatDistance(2140)   // "2.140 km"
formatRate(57.89)      // "57,89 lei/h"
formatDate('2026-06-24') // "24.06.2026"
```

Regulă: în KPI tiles fără zecimale la sume > 1000; în tabel și în breakdown-uri, **cu** 2 zecimale.

---

## 11. Accesibilitate

- Contrast minim 4.5:1 pe tot textul; `--text-tertiary` doar pe fundal alb, doar pentru text ≥12px non-esențial.
- Culoarea nu e niciodată singurul purtător de informație: platformele au dot **și** text; delta are săgeată **și** semn.
- Fiecare grafic are `role="img"` + `aria-label` cu rezumatul numeric, plus un `<table class="sr-only">` cu datele.
- Filtrele: `role="radiogroup"`, navigabile cu săgeți, focus ring vizibil 2px `--brand-500`.
- Tabelul: `<caption class="sr-only">`, `scope="col"` pe headere, paginarea anunțată prin `aria-live="polite"`.

---

## 12. Criterii de acceptanță

1. Schimbarea oricărui filtru actualizează **toate** cardurile, graficele și tabelul, într-un singur ciclu, fără layout shift.
2. Starea filtrelor e în URL și supraviețuiește refresh-ului și butonului Back.
3. Nu există niciun card care apare de două ori cu aceeași informație.
4. Nicio constantă fiscală (21%, 2%, 10%, praguri CAS/CASS) nu e prezentă în codul frontend.
5. Când perioada selectată nu e o lună calendaristică, cardurile fiscale afișează valoarea pe perioadă **și** referința pe luna calendaristică.
6. Upload CSV Uber și status API Bolt nu apar nicăieri pe „Acasă" în afară de pill-ul din topbar.
7. Istoricul curselor e un singur tabel, sortat descrescător după dată, 5 rânduri/pagină, cu `—` pentru câmpurile Uber lipsă.
8. La `<768px` tabelul devine listă de carduri, nu scroll orizontal.
9. Lighthouse ≥ 90 la Accessibility; zero erori de contrast pe axe și legende.
10. `Profit real estimat` = `Încasări nete − Cheltuieli deductibile − Taxe estimate`, verificabil manual din breakdown-ul afișat.

---

## 13. Ordine de implementare

1. Design tokens + `format.ts` + shell (sidebar/topbar) — fundația, nu se atinge după.
2. `useDashboardFilters` + FilterBar + sincronizare URL.
3. Endpoint `/summary` cu date mock complete → deblochează tot frontend-ul în paralel.
4. KpiTile + Rând A.
5. TaxReserveCard + RealProfitCard (partea cu cel mai mare risc de logică fiscală — de făcut cu date reale devreme).
6. Charts (C1, D1, D2) + PlatformBreakdown.
7. RidesHistoryTable + endpoint paginat.
8. Stări (skeleton / empty / error) — de făcut ca pas propriu, nu improvizat pe parcurs.
9. Responsive + motion + a11y pass.
10. Mutarea modulelor Uber CSV / Bolt API în Profil și ștergerea lor din „Acasă".

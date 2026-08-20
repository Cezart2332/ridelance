# NOTES — restructurare Dashboard SRL

Rezumatul cerut de `SPEC-dashboard-srl.md` §0.4, scris înainte de prima linie de cod.
Tot ce urmează e verificat în cod, cu referințe `fișier:linie`. Ultima secțiune listează
divergențele față de spec, cum cere §0.4 („dacă găsești divergențe, semnalează-le înainte
de a improviza").

---

## 1. Rutele și layout-ul dashboard-ului PFA

### 1.1 Prefixul real

`/app/dashboard`, definit ca `DASHBOARD_ROOT` în `src/config/pfaNavigation.ts:36`.

**Nu** `/dashboard` — acela e deja ocupat de un redirect public către demo
(`src/components/layout/AppLayout.tsx:421-422`, `/dashboard` și `/dashboard-demo` → `/demo`).

Lanțul complet de rutare:

| Rută | Element | Fișier |
|---|---|---|
| `/app` | `RoleRedirect` — citește rolul din Redux și trimite mai departe | `src/components/auth/RoleRedirect.tsx` |
| `/app/dashboard/*` | `DashboardPage` (PFA) | `src/App.tsx:97` |
| `/poster/*` | `CarPosterDashboard` (contul de flotă de azi) | `src/App.tsx:100` |
| `/contabil/*`, `/admin/*` | dashboard-uri separate | `src/App.tsx:98-99` |
| `/demo/*` | `DashboardDemoPage`, public | `src/App.tsx:103` |

Toate stau sub `ProtectedRoute` în afară de `/demo` și rutele publice.

### 1.2 Sursa unică a navigației PFA

`src/config/pfaNavigation.ts` (312 linii) e sursa de adevăr și alimentează, în ordine:
sidebar-ul, tabelul de rute, bara de jos de pe mobil, hub-ul de meniu mobil și titlurile din antet.

Exporturi relevante pentru refolosire:

- `PFA_PATHS` — dicționarul de căi, construit prin helperul `at(segment)`.
- `PFA_NAV: NavEntry[]` — arborele de meniu. `NavEntry` e o uniune discriminată:
  `{ kind: 'link' }` | `{ kind: 'group', children: NavLeaf[] }` | `{ kind: 'separator' }` | `{ kind: 'action' }`.
- `NAV_LEAVES`, `findActiveLeaf(pathname)`, `findActiveGroupId(pathname)`, `pageTitleFor(pathname)`.
  Potrivirea rutei active se face **pe segmente**, nu cu `startsWith` — `/profil` nu revendică
  `/profil/istoric-plati` (`pfaNavigation.ts:279-283`).
- `NAV_STATE_STORAGE_KEY = 'ridelance.pfa.nav.v1'` — persistența grupurilor deschise, versionată.
- `MOBILE_TAB_PATHS` — cele 3 destinații directe din bara de jos (`home`, `profile`, `support`);
  al patrulea tab, „Meniu", deschide sertarul.
- `LEGACY_SECTION_ROUTES` — maparea vechilor linkuri `?section=`, păstrată intenționat.

Structura de meniu actuală: Acasă · **Contabilitate** (6 copii) · **Documente** (4) ·
**Conexiuni** (4) · Beneficii · **Servicii** (4) · separator · Suport · Profil · Deconectare (action).

### 1.3 Layout-ul

Trei componente în `src/components/dashboard/layout/`:

- **`AppLayout.tsx`** (162 l.) — `position: fixed` pe tot viewportul, `overflow: hidden`, cu zona
  de conținut ca singura care derulează. Randează sidebar + header + `children` + bara de jos
  glassmorphic de pe mobil (`display: { xs: 'block', md: 'none' }`).
- **`AppHeader.tsx`** (84 l.) — `position: sticky`, titlul vine din `pageTitleFor(pathname)`,
  clopoțel de notificări opțional, buton „înapoi" doar pe subpaginile de mobil.
- **`AppSidebar.tsx`** (440 l.) — logo, eticheta „Meniu Principal", lista de navigație cu grupuri
  colapsabile (`Collapse` din MUI, stare persistată în `localStorage`), divider, buton Deconectare
  în subsol. Pe `md+` e `Box` fix de **284px**; sub `md` e `Drawer`.

Colapsarea grupurilor: `isGroupExpanded` combină starea din `localStorage` cu `findActiveGroupId` —
grupul care conține ruta curentă rămâne deschis chiar dacă utilizatorul l-a închis manual.

### 1.4 Tabelul de rute

`src/components/dashboard/DashboardRoutes.tsx` (112 l.). Regula: căile vin exclusiv din `PFA_PATHS`,
declarate relativ prin helperul `rel(path)`, ca sidebar-ul și rutarea să nu poată diverge.
Rutele de categorie nu au pagină proprie — redirecționează la primul copil.

---

## 2. Componentele comune existente

### 2.1 Tokens

**`src/components/dashboard/dashboardTheme.ts`** — `DASHBOARD_TOKENS`: `ink`, `primary`,
`primaryStrong`, `paper`, `surface`, `surfaceAlt`, `border`, `borderHover`, `textMuted`,
`textSubtle`, rampa de accent (`accent` / `accentSoft` / `accentWash`), semnalele de stare,
scara de `radius` (xs→full) și trei umbre. Tot aici stau `responsiveTableContainerSx` și
`dashboardInputSx`.

Regula cromatică documentată în fișier, care contrazice mockup-ul HTML:
> „Semnale de stare. Nu se folosesc decorativ — doar pe StatusChip și pe mesajele de eroare.
> «Ok» e albastru, nu verde."

**`src/components/dashboard/home/tokens.ts`** — `HOME_TOKENS`, un set separat, mai bogat
(rampe `pos` / `warn` / `neg`, culori de platformă, umbre duble), folosit doar de pagina Acasă.
Cele două seturi coexistă; `HOME_TOKENS.bg.app` se derivă din `DASHBOARD_TOKENS.surface`.

### 2.2 Primitive UI — `src/components/dashboard/ui/` (barrel în `index.ts`)

| Componentă | Rol | Linii |
|---|---|---|
| `Panel` | cardul alb standard: `title`, `subtitle`, `action`, `fill`, `dense` | 74 |
| `PageHeader` | antetul de secțiune: `title`, `subtitle`, `actions` | 53 |
| `StatCard` | tile de KPI | 91 |
| `StatusChip` | **singurul** chip de stare; 3 tonuri (`active`/`neutral`/`error`) | 75 |
| `SplitBar`, `BreakdownRow` | bară de proporție + rând de defalcare | 75 |
| `ComingSoon` | empty state pentru ce nu e construit încă | 103 |
| `formatLei`, `formatNumber` | formatare ro-RO, întregi | 9 |
| `pillToggleSx` | stilul toggle-urilor pastilă | 31 |
| `statusTone.ts` | `documentStatusTone` / `documentStatusText` | 19 |

### 2.3 `Amount`

`src/components/dashboard/home/components/Amount.tsx`. Cinci trepte (`hero` 36px, `kpi` 30,
`card` 22, `row` 14, `axis` 11), cifre tabulare, zecimale la 60% și unitate la 50% din partea
întreagă, minus tipografic U+2212 pentru aliniere pe grilă, iar partea vizibilă e `aria-hidden`
cu textul complet alături în `visuallyHidden`.

⚠️ **Trăiește sub `home/` și importă `HOME_TOKENS`**, nu `DASHBOARD_TOKENS`. Spec §3.3.1 cere
`Amount` pe pagina Facturi — deci componenta trebuie mutată la comun, cu culorile reconciliate.

### 2.4 Grafice

`src/components/dashboard/home/components/charts/` — `chartTheme.ts` + `chartSetup.tsx` și patru
grafice concrete. `chartTheme.ts` există (spec §0.4 îl presupunea), tot sub `home/`.

### 2.5 Tabele

Nu există o componentă `DataTable` comună. Fiecare secțiune își construiește tabelul din
primitivele MUI, cu `responsiveTableContainerSx` pentru scroll orizontal. Pagina Facturi (§3.3.1)
va fi primul consumator care justifică una.

---

## 3. Cum e modelat azi tipul de cont / owner

**Nu există `ownerType`. Tipul de cont *este* rolul.**

### 3.1 Backend

`backend/src/Domain/Users/UserRole.cs`:

```csharp
public enum UserRole { Client = 0, Contabil = 1, Admin = 2, CarPoster = 3 }
```

`Client` = PFA, `CarPoster` = contul de flotă. `CarPoster` e cablat în:

- `Infrastructure/Authorization/PermissionProvider.cs:57` — permisiunile rolului;
- `Application/Cars/CarAccessHelper.cs:31,34` — cine poate edita/vedea o mașină;
- `Application/Cars/Commands/CreateCar/CreateCarCommand.cs:65` — `requiresPayment = user.Role == UserRole.CarPoster`;
- `Application/Payments/CreateCarListingCheckout/…Handler.cs:32` — cine poate porni checkout de listare;
- `Application/Cars/Commands/ToggleCarActive`, `UpdateLeadStatus`, `Queries/GetLeadsAdmin`.

### 3.2 Frontend

- `src/components/auth/shell/AccountTypeChoice.tsx:6` — `export type AccountType = 'Client' | 'CarPoster'`,
  afișate ca **„PFA"** și **„Flotă"**. Comentariul din fișier e explicit: alegerea „decide și rolul
  (`UserRole`) și dashboardul unde aterizezi".
- `src/components/auth/RoleRedirect.tsx` — rutează pe rol: `Contabil`→`/contabil`, `Admin`→`/admin`,
  `CarPoster`→`/poster`, `Client`→`resolveClientPath(sub)`.
- `src/utils/roleLabels.ts` — `ROLE_LABELS.CarPoster = 'Cont inchiriere mașini'`.
- `src/services/user.service.ts:10` — `role: string`, netipat.

**Consecință pentru §1.1 și §7.1:** redenumirea enum-ului în `Pfa | Srl` nu e o migrație de coloană,
ci o schimbare a modelului de autorizare, cu atingeri în plăți și în accesul la mașini.
Vezi §6.2 mai jos pentru alternativa propusă.

---

## 4. Unde se generează cardurile de mașină din marketplace

**O singură componentă:** `src/components/cars/CarListCard.tsx` (259 l.), cu patru consumatori:

| Consumator | Fișier | Notă |
|---|---|---|
| Lista publică de mașini | `src/pages/CarsPage.tsx:391` | |
| Caruselul de pe homepage | `src/components/home/CarCarousel.tsx:79` | |
| Secțiunea „Mașini" din dashboard PFA | `src/components/dashboard/sections/CarsView.tsx:239` | cu `newTab` |
| Pagina de detaliu (VDP) | `src/pages/VehicleDetailPage.tsx` + `components/cars/vdp/` | layout propriu |

Structura cardului: cover + galerie, titlu (link real), meta, preț, status, CTA către
`/masini/{slug}`. Rădăcina e `Box` cu `onClick`, iar titlul și butonul sunt `<a>`-uri reale —
exact tiparul pe care §4.1 îl cere pentru blocul de proprietar (`<a>` real, `stopPropagation`).

**Blocaj pentru §4.1:** DTO-ul public de mașină **nu conține identitatea proprietarului**.
`src/services/cars.service.ts:27-55` expune doar `postedByAdmin: boolean`, derivat pe server în
`Application/Cars/CarDtoMapper.cs:48` (`IsPostedByAdmin`). Nu există `ownerId`, `displayName`,
`logoUrl`, `slug`, `verified` — deci componenta din §4.1 nu are ce consuma nici măcar din mock,
fără extinderea DTO-ului în FAZA 2.

### 4.1 Sortarea de azi

`src/pages/CarsPage.tsx:83-88` — sortare **client-side**, pe tot array-ul, în `useMemo`, fără
paginare. Opțiuni actuale: „Preț: Mic la Mare" (implicit) și „Preț: Mare la Mic".

### 4.2 Entitatea `Car`

`backend/src/Domain/Cars/Car.cs` — brand, model, an, slug, motorizare, transmisie,
`Location` (**string**, oraș), preț/preț vechi/reducere, garanție, tip ofertă, status, categorii
Uber/Bolt, badges, descriere, `Active`, `PostedByUserId`, sursă, aprobare, plată, timestamps,
`ViewCount`/`ClickCount`, `Images`, `Leads`.

Lipsesc, deși apar în mockup-uri și în criteriile de scor din §5.2: număr de înmatriculare, VIN,
kilometraj, culoare, număr de locuri, data primei înmatriculări, **coordonate de pin pe hartă**
(azi doar oraș text — criteriul „Locație pe hartă: +10" nu are suport), data disponibilității,
dosar de documente al vehiculului.

---

## 5. Modelul de facturare actual pentru conturile de flotă

Relevant pentru că unul dintre mockup-urile atașate propune altul.

`backend/src/Domain/Payments/StripeCatalog.cs:138` — `CarListingMonthly`:
lookup key `ridelance_car_listing_monthly_ron`, **3000 bani = 30 lei/lună**, recurent lunar,
`billing_unit: posted_car`, `audience: car_poster`. Plata e obligatorie la creare pentru
`CarPoster` (`CreateCarCommand.cs:65`) și blochează publicarea până la încasare
(`ToggleCarActiveCommand.cs:47`).

Prețul Stripe e imutabil prin design: orice schimbare de sumă cere **lookup key nou**
(`StripeCatalog.cs:29`).

---

## 6. Divergențe față de spec

Semnalate aici, cum cere §0.4. Nu am improvizat pe niciuna.

### 6.1 §0.1 descrie un dashboard care nu există

Specul spune că dashboard-ul de firmă are Acasă, Mașinile mele, Închirieri, Documente societate,
Mentenanță, Pagina firmei, Beneficii, Setări. În realitate `src/pages/CarPosterDashboard.tsx`
are **54 de linii și trei itemi**: Acasă, Mașinile mele, Asigurări — pe `DashboardLayout` generic
(`src/components/layout/DashboardLayout.tsx`), nu pe layout-ul PFA, cu conținutul delegat lui
`CarsAdminView variant="poster"`.

Grep pe tot repo-ul (FE + BE), zero rezultate pentru: `inchirier|rental`, `mentenan|maintenance`,
`pagina firmei|mini-site|minisite`, `eldrive`. Nu există entități, endpoint-uri sau componente
pentru închirieri, contracte, procese-verbale, check-in/check-out, mentenanță, documente de
societate, mini-site.

**Efect:** §2.1 nu e o restructurare de meniu, ci construcția a 5 module noi. Regula §0.3.2
(„refolosește componenta PFA, nu rescrie") nu se poate aplica acolo unde nu există nimic de
refolosit nici la PFA.

### 6.2 §1.1 — rutele propuse intră în coliziune

`/dashboard/srl/*` nu e disponibil: `/dashboard` redirecționează deja la `/demo`
(`AppLayout.tsx:421`), iar PFA-ul nu stă pe `/dashboard`, ci pe `/app/dashboard`.
Paritatea reală cere `/app/dashboard-srl/*` sau `/app/srl/*`.

### 6.3 §1.1 / §7.1 — `ownerType` vs `UserRole`

Vezi §3. Propunerea mea: **nu redenumi rolul**. Introdu `OwnerType` ca dimensiune separată
(`Pfa | Srl`), derivată din rol la început, și lasă `CarPoster` ca rol tehnic în autorizare.
Altfel §1, prezentat ca „refactor mecanic", devine un PR care atinge auth-ul și plățile.

### 6.4 §2 — sidebar-ul PFA nu are ce oferi pentru cerințele SRL

`AppSidebar.tsx` **nu are**: item „Setări", bloc de profil/firmă în subsol, mod colapsat.
Pe desktop e lățime fixă 284px, pe mobil `Drawer` — nu există rail colapsabil, deci condiția
din §2.2 („rămâne colapsabil dacă PFA-ul e colapsabil") se rezolvă prin „nu e".

Cerințele din §2.1 (Setări ca ultim item de navigație + bloc de firmă dedesubt) sunt **adăugiri
la sidebar-ul PFA**, nu configurare. Intră în tensiune cu §0.3.5 („nu regresa PFA") și trebuie
făcute ca extindere opțională, activată prin config, nu ca schimbare necondiționată.

### 6.5 §3.3 / §9.2 — Facturi nu există nici la PFA

`DashboardRoutes.tsx:56` randează `<ComingSoon>`, iar în meniu itemul poartă `badge: 'coming-soon'`
(`pfaNavigation.ts:124`). Răspunsul la întrebarea deschisă §9.2 este: **se construiește de la zero,
pentru amândouă**. E cea mai mare bucată din FAZA 1.

### 6.6 §4.1 — componenta de proprietar nu are date de consumat

Vezi §4. DTO-ul public expune doar `postedByAdmin: boolean`.

### 6.7 §4.2 — „Pagina firmei rămâne cum e" presupune că există

Nu există. La fel §3.1, unde toggle-urile de vizibilitate „se mută" din Pagina firmei în Profil:
nu e o mutare, e o construcție.

### 6.8 §5.2 — criterii de scor fără suport în model

„Locație pe hartă: pin setat (nu doar oraș text)" — `Car.Location` e string de oraș, fără
coordonate. „Dosar vehicul complet ≥ 80%" — nu există dosar de vehicul. „Proprietar verificat" —
nu există `IsVerified` nicăieri (răspuns la §9.4: nu e nici manual, nu există deloc).
„Logo setat" — nu există entitate de profil de companie.

Regula de ordonare `score DESC, updated_at DESC, id ASC` presupune paginare server-side; azi
sortarea e client-side pe tot array-ul (§4.1 de mai sus).

### 6.9 §6.3 — direcția vizuală contrazice mockup-ul pe stări

Mockup-ul folosește verde (`--green:#16a36a`) pentru „Activă" / „Contract activ".
`statusTone.ts` impune trei tonuri, cu „ok" **albastru**. Se randează prin `StatusChip`.

De adăugat în spec și faptul că repo-ul are **și** Tailwind + shadcn pe lângă MUI
(`tailwind.config.js`, `components.json`, `radix-ui`, `shadcn` în `package.json`):
dashboard-ul SRL e MUI, ca PFA, nu shadcn.

### 6.10 Mockup-uri atașate neacoperite de spec

- **`RIDElance_Adauga_Masina_Flota_Preview (1).html`** — wizard „Adaugă mașină" pe 6 pași
  (Vehicul → Ofertă → Poze → Locație/Mapbox → Dosar → Preview). §8 declară explicit fluxul
  out of scope („rămâne cum e"). Azi e un singur `Dialog` MUI în
  `src/components/dashboard/sections/admin/CarsAdminView.tsx:967`. Contradicție deschisă.
- **`preview (7) (1).html`** — plan „RIDElance Fleet, 299 lei/lună", 10 anunțuri incluse,
  +39,90 lei/anunț extra, +14,90 lei anonimizare număr. Modelul implementat e altul: 30 lei/lună
  **per mașină** (§5). Nu e o ajustare de preț, e alt model de business, și cere lookup key Stripe
  nou. Specul nu îl menționează deloc.

### 6.11 Răspunsuri deduse la §9

| # | Întrebare | Răspuns din cod |
|---|---|---|
| 1 | Ce se schimbă la Contabilitate SRL? | Nu se poate deduce — decizie de business. Rămâne blocant pentru §3.3.2. |
| 2 | Facturi există la PFA? | **Nu.** `ComingSoon`. De construit o dată, în comun. |
| 3 | Serviciile PFA se aplică la SRL? | Cele 4 sunt Mașini, Abonamente, Servicii individuale, Asigurări. „Abonamente" e PFA-only în forma actuală (planurile Solo/Start/Pro din `StripeCatalog`); restul se aplică. |
| 4 | „Flotă verificată" e manuală sau are flux? | Niciuna — nu există câmp de verificare în BE. |
| 5 | Slug-ul mini-site-ului? | Nu există. Pentru mașini există `Domain/Cars/CarSlug.cs`, refolosibil ca tipar. |

---

## 7. Consecința asupra secvenței de lucru

Specul are 2 faze. §0.3.2 și §0.3.3 („refolosește componentele PFA", „zero duplicare") nu se pot
respecta câtă vreme componentele partajate încă trăiesc înăuntrul PFA-ului și sunt legate de
`PFA_NAV` / `PFA_PATHS` prin import direct. De aici o fază 0:

**FAZA 0 — extracție și parametrizare** (singurul moment în care se atinge PFA-ul) — **făcută**,
vezi commit-urile de pe `srl-dashboard-restructure`:
1. `AppSidebar` / `AppLayout` / `AppHeader` primesc configul de navigație prin props, în loc să
   importe `PFA_NAV`. Tipurile de navigație se mută într-un modul neutru.
2. `ownerType` introdus în FE ca dimensiune separată de rol.
3. `Amount` iese de sub `home/` la comun. `chartTheme` **rămâne** unde e: niciun ecran SRL
   din FAZA 1 nu are grafice, iar mutarea lui acum ar fi speculativă.
4. `/poster/*` se mută sub `/app/`, cu redirect din vechea rută.

După fiecare pas: verificare pe dashboard-ul PFA, care nu are voie să se schimbe vizual sau
funcțional.

**FAZA 1 — frontend static**, ca în spec, cu bugetul recalibrat: Facturi, Închirieri, Mentenanță,
Documente societate și Pagina firmei sunt module noi, nu clone.

**FAZA 2 — backend**, ca în spec.

Înainte de FAZA 2 trebuie tranșate: §9.1 (regulile fiscale SRL), modelul de facturare (§6.10) și
extinderea entității `Car` (§6.8).

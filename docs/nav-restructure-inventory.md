# Inventar Faza 0 — restructurare navigație Dashboard PFA

> Cerut de `spec-dashboard-pfa-navigatie.md` §4. Poarta de intrare în PR 1.
> Regula spec-ului: unde numele real din repo diferă de cel propus în spec, **câștigă cel din repo**.
> Data inventarului: 2026-08-15.

---

## 0. Rezumat executiv

Trei constatări schimbă forma implementării față de spec:

1. **Dashboard-ul PFA nu are rute.** Există o singură rută `/app/dashboard/*` care randează un component ce comută secțiuni prin `useState` + `?section=<id>`. PR 1 nu e „un config de meniu", e o migrare de rutare.
2. **Multe cerințe sunt deja implementate** — calculul financiar server-side, filtrele partajate sincronizate în URL, logica de dată în C#, pipeline-ul OCR, expirările documentelor cu job de notificări. Vezi §5–§7.
3. **Trei cerințe intră în conflict cu cod livrat** — Cont bancar/Bancă, uploadul CSV Uber, pagina „Expirări" care nu există. Vezi §9.

`backend/` este **repo git separat** (nested). PR-urile care ating ambele părți se împart în două commit-uri corelate.

---

## 1. Rutare curentă

**Fișier unic de rutare:** `src/App.tsx` (103 linii). react-router-dom 7.14.1, `<Routes>/<Route>` declarativ (fără `createBrowserRouter`). Provider-ul e în `src/main.tsx`.

**Prefixul real al rutelor de dashboard: `/app/dashboard`** — nu `/dashboard`, nu `/pfa`.

```tsx
// src/App.tsx:89
<Route path="/app/dashboard/*" element={<DashboardPage />} />
```

Atenție: `/dashboard` și `/dashboard-demo` **există**, dar în shell-ul de marketing (`src/components/layout/AppLayout.tsx:421-422`) și redirecționează la `/demo`. Nu sunt rute PFA.

Tabelul complet de rute top-level (`src/App.tsx`):

| Rută | Element | Linie |
|---|---|---|
| `/auth` | `AuthPage` | 62 |
| `/inregistrare/pfa` | redirect → `/onboarding/pfa` | 63 |
| `/inregistrare/abonament` | `SubscriptionSelectPage` | 64 |
| `/inregistrare/succes` | `RegistrationSuccessPage` | 65 |
| `/checkout` | `CheckoutPage` | 66 |
| `/app` | `RoleRedirect` (protejat) | 70 |
| `/app/pending-access` | `PendingAccessPage` | 71 |
| `/onboarding` + 9 copii | `OnboardingShell` | 74-88 |
| **`/app/dashboard/*`** | **`DashboardPage`** (lazy) | **89** |
| `/contabil/*` | `ContabilDashboard` | 90 |
| `/admin/*` | `AdminDashboard` | 91 |
| `/poster/*` | `CarPosterDashboard` | 92 |
| `/demo/*` | `DashboardDemoPage` (public) | 95 |
| `/*` | `AppLayout` (marketing) | 96 |

`/onboarding` e precedentul de rutare imbricată RO din repo (`/onboarding/pfa/date-personale`) — de aceea slug-urile RO din spec sunt consecvente.

---

## 2. Sidebar

**Componentă:** `src/components/dashboard/layout/AppSidebar.tsx` (393 linii).

Lista de linkuri **nu e definită în sidebar** — vine prin props `sectionConfig` / `bottomSectionConfig` (`:23-31`), din două array-uri hardcodate în `src/components/dashboard/DashboardPage.tsx:34-58`:

```ts
const mainSectionConfig = [
  { id: 'home', label: 'Acasă', icon: iconHome },
  { id: 'banca', label: 'Banca', icon: 'MUI:AccountBalanceRounded' },
  { id: 'profile', label: 'Profil', icon: iconProfile },
  { id: 'documents', label: 'Documente', icon: iconDocs },
  { id: 'support', label: 'Chat & Suport', icon: iconSupport },
  { id: 'accordion_group', label: 'Cheltuieli & Documentatie recurenta', icon: iconWallet,
    subItems: [
      { id: 'expenses', label: 'Cheltuieli' },
      { id: 'doc_recurring', label: 'Documentatie recurenta' },
    ] },
] as const

const bottomSectionConfig = [
  { id: 'cars',          label: 'Mașini',        icon: 'MUI:DirectionsCarFilledRounded' },
  { id: 'beneficii',     label: 'Beneficii',     icon: 'MUI:RedeemRounded' },
  { id: 'abonamente',    label: 'Abonamente',    icon: 'MUI:WorkspacePremiumRounded' },
  { id: 'servicii',      label: 'Servicii',      icon: 'MUI:ShoppingCartRounded' },
  { id: 'asigurari',     label: 'Asigurări',     icon: 'MUI:ShieldRounded' },
  { id: 'istoric_plati', label: 'Istoric Plăți', icon: 'MUI:ReceiptLongRounded' },
] as const
```

Comportament actual:
- Linkurile sunt `<Button onClick={() => setActiveSection(id)}` (`:196-233`) — **fără `<Link>`/`<NavLink>`, URL-ul nu se schimbă**.
- Activ = `activeSection === item.id` (`:101`).
- Grupurile cu `subItems` sunt un MUI `<Accordion defaultExpanded={isChildActive}>` (`:107-193`) — starea nu se persistă și nu se resincronizează.
- Desktop (`md+`): box fix 284px, `position:'sticky', top:0, height:'100vh'` (`:365-381`). Mobil: `<Drawer>` (`:383-392`) — **cod mort**, pentru că `AppLayout.tsx:75` montează sidebar-ul doar când `isMdUp`.
- Titlurile de secțiune sunt hardcodate: `"Meniu Principal"` (`:301`), `"Servicii & Plăți"` (`:325`).
- Relabelare la randare: `'Cheltuieli & Documentatie recurenta'` → `'Cheltuieli & documente'` (`:102-105`).

**Patru surse independente de meniu** trebuie unificate în PR 1:
1. `DashboardPage.tsx:34-49` (sidebar principal)
2. `DashboardPage.tsx:51-58` (sidebar jos)
3. `AppLayout.tsx:182-201` (bottom nav mobil, 4 acțiuni hardcodate)
4. `MenuHubView.tsx:37-68` (`MENU_GROUPS`, hub-ul mobil: „Activitatea mea", „Documente", „Contul meu", „Altele")

Plus `AppLayout.tsx:39-51` — harta `pageTitles`, incompletă (lipsesc `banca`, `beneficii`, `asigurari`).

---

## 3. Paginile existente

Toate sub `/app/dashboard?section=<id>`; switch-ul e la `DashboardPage.tsx:135-156`. Director: `src/components/dashboard/sections/`.

| Pagina din spec | `section` id azi | Fișier | Observații |
|---|---|---|---|
| Acasă | `home` | `HomeDashboardView.tsx` (+ `../home/**`) | |
| Bolt | — | `BoltConnectCard.tsx` → `BoltIntegrationTab.tsx` | **Nu are secțiune proprie**; randat în `ProfileSection.tsx:14`. Id-urile vechi `bolt_integration`/`platforms` sunt forțate la `profile` (`DashboardPage.tsx:82-85`) |
| Uber | — | — | **Nu există pentru PFA.** Doar `sections/admin/UberImportAdminPanel.tsx` |
| OBLIO | — | — | **Nu există pentru PFA.** Doar `sections/admin/OblioAdminView.tsx` |
| Beneficii | `beneficii` | `BeneficiiTab.tsx` (567 linii) | |
| Servicii → Mașini | `cars` | `CarsView.tsx` | |
| Servicii → Abonamente | `abonamente` | `AbonamenteTab.tsx` | |
| Servicii → Servicii individuale | `servicii` | `ServiciiTab.tsx` | titlul paginii e deja „Servicii individuale" (`:50`) |
| Servicii → Asigurări | `asigurari` | `InsuranceTab.tsx` | |
| Suport | `support` | `SupportChatTab.tsx` | |
| Chat contabil | — | `AccountantChatTab.tsx` | Componentă de sine stătătoare, ascunsă după toggle-ul intern `activeChat` (`SupportChatTab.tsx:22,175,201`) |
| Istoric plăți | `istoric_plati` | `IstoricPlatiTab.tsx` | |
| Documente | `documents` | `DocumentsTab.tsx` (806 linii) | |
| Documentație recurentă | `doc_recurring` | `ExpensesRecurringTab.tsx` → `RecurringDocumentationPanel.tsx` | |
| Cheltuieli | `expenses` | `ExpensesRecurringTab.tsx` → `DeductibleExpensesPanel.tsx` | |
| **Expirări** | — | — | **Nu există.** Logica e inline în `DocumentsTab.tsx:72-135` |
| Cont bancar / Bancă | `banca` | `BankTab.tsx` (849 linii) | Integrare Enable Banking **funcțională** |
| Profil | `profile` | `ProfileSection.tsx` → `ProfileTab.tsx` (519 linii) | Conține și conturile Fleet/șofer Bolt+Uber |
| Meniu (hub mobil) | `more` | `MenuHubView.tsx` | |

---

## 4. Maparea rută veche → rută nouă

Shim-ul din PR 1 trebuie să acopere fiecare rând. Nimic nu rămâne 404.

| `?section=` vechi | Rută nouă |
|---|---|
| `home`, absent | `/app/dashboard` |
| `banca` | `/app/dashboard/contabilitate/cont-bancar` |
| `expenses` | `/app/dashboard/contabilitate/cheltuieli` |
| `doc_recurring` | `/app/dashboard/documente/recurente` |
| `documents` | `/app/dashboard/documente/personale` |
| `support` | `/app/dashboard/suport` |
| `profile` | `/app/dashboard/profil` |
| `istoric_plati` | `/app/dashboard/profil#plati` (secțiune în Profil, nu pagină separată) |
| `cars` | `/app/dashboard/servicii/masini` |
| `abonamente` | `/app/dashboard/servicii/abonamente` |
| `servicii` | `/app/dashboard/servicii/servicii-individuale` |
| `asigurari` | `/app/dashboard/servicii/asigurari` |
| `beneficii` | `/app/dashboard/beneficii` |
| `bolt_integration`, `platforms` | `/app/dashboard/conexiuni/bolt` |
| `more` | `/app/dashboard` (meniul mobil e acum sertarul de navigare, nu o secțiune) |
| `?ref=` / `?state=&code=` (callback bancar) | `/app/dashboard/contabilitate/cont-bancar`, **cu query-ul păstrat intact** |

Rutele de categorie fac `Navigate replace` la primul copil: `/contabilitate` → `situatie-financiara`, `/documente` → `personale`, `/conexiuni` → `bolt`, `/servicii` → `masini`.

**Linkuri hardcodate de actualizat** (shim-ul rămâne pentru cele deja trimise prin push/e-mail):

| Fișier | Linie | Link |
|---|---|---|
| `src/components/dashboard/sections/AbonamenteTab.tsx` | 85-86 | `?section=abonamente` |
| `src/constants/recurringDocumentationNotification.ts` | 46 | `?section=doc_recurring` |
| `src/services/stripe.service.ts` | 236 | `?section=servicii` |
| `backend/src/Infrastructure/Chat/ChatHub.cs` | 171, 174 | `?section=support` |
| `backend/src/Application/Payments/HandleWebhook/HandleStripeWebhookCommandHandler.cs` | 757 | `?section=istoric_plati` |
| `backend/src/Application/Notifications/RecurringDocumentation/RecurringDocumentationTexts.cs` | 34 | `?section=doc_recurring` |
| `backend/src/Application/Banking/Commands/InitiateBankConnectionCommand.cs` | 87 | redirect fix pe `/app/dashboard` — **rămâne așa**, shim-ul preia |

---

## 5. Unde se calculează valorile financiare

**Totul server-side, într-un singur handler. Frontend-ul nu face aritmetică.**

Nu există `IFinancialSummaryService`. Echivalentul real:

- `backend/src/Application/PfaDashboard/GetPfaDashboardSummaryQuery.cs`
  - `GetPfaDashboardSummaryQuery(From, To, Platform, Payment)` `:122`
  - `GetPfaDashboardSummaryQueryHandler` `:128`
- Endpoint: `GET /pfa/dashboard/summary?from&to&platform&payment` — `backend/src/Web.Api/Endpoints/PfaDashboard/PfaDashboardEndpoints.cs:14,18`. Al doilea endpoint: `GET /pfa/dashboard/rides` `:38`.
- Interval implicit fără parametri: luna calendaristică curentă (`:75-111`).

| Valoare | Unde se calculează |
|---|---|
| Încasări nete, comision platforme | `Aggregate()` `:300-345`; Bolt per comandă, Uber lunar pro-ratat (`AddUberMonth` `:351-391`) |
| „Cât trebuie să pui deoparte" | `BuildReserve()` `:402-447` — `vatIntracom = VatIntracomRate * Fees` `:408`; `boltNonResident = BoltNonResidentRate * Bolt.Fees` `:409`; `incomeTax` / `casCass` pro-ratate cu `share = min(1, periodNet / annualIncome)` `:411-416` |
| Profit real estimat | `:236` — `net − cheltuieli deductibile − rezervă` |
| Cheltuieli deductibile | `:194-206` — **doar cele al căror `Document.Status == Verified`**, pro-ratate pe lună `:334-340` |
| Bază anuală de impozitare | `:216-218` — `PfaTaxCalculator.Compute(annualIncome, annualExpenses, fiscalYear)` |
| Cote | `backend/src/Application/PfaDashboard/FiscalPolicyOptions.cs` — `VatIntracomRate = 0.21`, `BoltNonResidentRate = 0.02`; legate în `Infrastructure/DependencyInjection.cs:70-71` din secțiunea `"Fiscal"` (absentă din appsettings → se aplică valorile implicite) |
| Formula CAS/CASS/impozit | `backend/src/Application/PfaRegistrations/PfaTaxCalculator.cs:36-88` |
| Aritmetica de perioadă (fus RO, lună fiscală) | `backend/src/Application/PfaDashboard/PfaDashboardPeriod.cs` |

**DTO** (records `GetPfaDashboardSummaryQuery.cs:18-118`, camelCase pe fir; oglinda TS: `src/services/pfaDashboard.service.ts:15-122`):

```
PfaDashboardSummaryResponse {
  Period {From, To, Granularity}
  Kpis {NetEarnings, PlatformFees{Value,Previous,ByPlatform{Bolt,Uber}}, OnlineHours, RideKm, NetPerHour, NetPerKm}
  TaxReserve {Scope, Total, Components[{Key,Label,Amount,Rate?,Basis?,Note?}], FiscalMonth{Month,Total}}
  RealProfit {NetEarnings, DeductibleExpenses, EstimatedTaxes, Value, RetentionRatio?}
  PlatformSplit[{Platform,Net,Fees,Cash,Card,Rides}]
  Series {NetEarnings[], FeesAndTaxes[], RealProfit[]}
  Sources {Bolt{Configured,Connected,LastSyncAt,ErrorMessage}, Uber{Connected,LastReportAt,DetectedRange}}
  UberIsMonthlyAggregate
}
```

DTO-ul acoperă deja integral §7.1 (Situație financiară) și §7.3-A (estimările din Taxe & declarații). **Nu e nevoie de endpoint nou pentru PR 3 și PR 6-A.**

**Hook frontend** (fără react-query/SWR — hooks scrise de mână cu axios + AbortController):
- `src/components/dashboard/home/useDashboardData.ts:54` — `useDashboardSummary(query, enabled): AsyncResource<PfaDashboardSummary>`
- `:86` — `useRidesHistory(...)`; `AsyncResource<T> = { data, isLoading, isFetching, error, reload }` `:12`
- Serviciu: `src/services/pfaDashboard.service.ts:155-171`

**Atenție — a doua bază de calcul.** `GET /users/dashboard-summary` (`backend/src/Web.Api/Endpoints/Users/GetDashboardSummary.cs:14`) întoarce cifre YTD cu **alt algoritm** și e folosit doar pentru poarta de acces. Afișarea celor două pe aceeași pagină fără etichetare produce „taxe estimate" contradictorii.

**Modelul de venit:** `backend/src/Domain/PfaRegistrations/PfaMonthlyIncome.cs`
- `ComputeVenitTotal() => Math.Max(VenitBolt + VenitUber, VenitCash + VenitCard)` `:31` — cash/card e **split de plată**, niciodată aditiv cu bolt/uber.
- `ComputePlatformIncome() => VenitBolt + VenitUber` `:33` — baza fiscală.
- Populare: `Application/PfaRegistrations/MonthlyIncome/PfaMonthlyIncomeRecalculator.cs`.
- KPI-urile de pe Acasă citesc **direct** `BoltOrders`/`UberCsvImports`, nu `PfaMonthlyIncome` (folosit doar ca bază anuală).

---

## 6. Componente reutilizabile

Toate în `src/components/dashboard/home/`:

| Componentă | Fișier:linie | Rol |
|---|---|---|
| `HomeCard` | `components/HomeCard.tsx:29` | chrome-ul oricărui bloc |
| `KpiTile` | `components/KpiTile.tsx:31` | card KPI |
| `Amount` | `components/Amount.tsx:42` | orice cifră (count-up prin `useCountUp.ts:12`) |
| `DeltaBadge` | `components/DeltaBadge.tsx:22` | delta față de perioada anterioară |
| `PlatformBreakdown` | `components/PlatformBreakdown.tsx:25` | **„De unde vin banii"** |
| `TaxReserveCard` | `components/TaxReserveCard.tsx:34` | „Cât trebuie să pui deoparte" |
| `RealProfitCard` | `components/RealProfitCard.tsx:26` | cascada profitului (`:29-34`) |
| `RidesHistoryTable` | `components/RidesHistoryTable.tsx:43` | se auto-alimentează |
| `TileSkeleton`, `CardSkeleton`, `CardError`, `CardEmpty` | `components/states/CardStates.tsx` | stări |
| `SourcesPill` | `components/SourcesPill.tsx:47` + `sourceFreshness.ts` | prospețimea surselor |

**Filtrele sunt deja extrase și sincronizate în URL** — cerința §7.1 e deja îndeplinită:
- `components/FilterBar.tsx:70` — perioadă (`Săpt. curentă / Luna curentă / Luna anterioară / An curent / Interval`, `:20-26`), platformă (`Toate/Bolt/Uber`, `:28-32`), plată (`Toate/Card/Cash`, `:34-38`); sub `lg` devine bottom-sheet.
- `components/SegmentedControl.tsx:26` — generic.
- `useDashboardFilters.ts:61` — sursa de adevăr e URL-ul, prin `useSearchParams` (`period`, `from`, `to`, `platform`, `payment`, `{replace:true}`); `resolvePreset()` `:36` (săptămâna începe luni).

**Seam de reutilizare pentru Acasă:** `HomeDashboardView.tsx:44` (fetch) / `HomeDashboardContent:98` (render pur, deja refolosit de demo).

**Grafice:** recharts 3.8.1. Culorile vin exclusiv din `components/charts/chartTheme.ts` — `CHART[1..7]` (`:14-29`), `PLATFORM_COLOR` (`:36`), `TAX_RAMP` (`:43`). Regula e scrisă în fișier: fără `fill`/`stroke` literal în componente. Tooltip/legendă/tabel a11y: `components/charts/chartSetup.tsx`.

**Tokens:** `home/tokens.ts` (`HOME_TOKENS`, `SPLIT_ROW = '@media (min-width:1400px)'`, `tabularNums`, `reducedMotionSafe`), peste `dashboard/dashboardTheme.ts` (`DASHBOARD_TOKENS`).

---

## 7. Modelul de documente din onboarding

**Entitate:** `backend/src/Domain/Documents/Document.cs`, DbSet `Documents`, config `Infrastructure/Documents/DocumentConfiguration.cs`.

**Storage: fișiere pe disc, criptate AES** — nu blob în DB, nu S3.
`IFileStorageService` → `Infrastructure/Services/LocalFileStorageService.cs` (`FileStorageSettings.BasePath`, implicit `./uploads`; live: `backend/src/Web.Api/uploads/encrypted`); `IFileEncryptionService` → `Infrastructure/Services/FileEncryptionService.cs`, rezultatul în `EncryptedFilePath` + `EncryptionIv`. Valorile extrase sensibile se protejează separat prin `ISecretProtector`.

**Câmpuri deja prezente pe `Document`** (acoperă integral §8): `IssuedAtUtc`, `ExpiresAtUtc`, `AiExtractedExpiresAtUtc`, `UploadedAtUtc`, `Category`, `Status`, `Origin`, `ReplacedByDocumentId`, `PfaVehicleId`, `PlatformProvider`, plus blocul AI (`AiStatus`, `AiSummary`, `AiDetectedType`, `AiConfidence`, `AiExtractedJson`, `AiRequiresManualReview`, `AiAttempts`, `AiProcessedAtUtc`).

**Enum-uri:** `DocumentCategory` (36 valori), `DocumentStatus` (Pending/Verified/Rejected), `DocumentOrigin` (UserUpload/Prefilled/Inherited/SystemGenerated), `DocumentAiStatus`.

**Catalogul de onboarding:** `backend/src/Application/PfaRegistrations/Onboarding/OnboardingSectionCatalog.cs`, cheiat pe `OnboardingSectionKey` (`Pfa=1, AutorizatieTransport=2, CopieConforma=3, Vehicul=4`). **Oglindit manual** în `src/constants/documentSections.tsx` (265 linii) — perechea trebuie ținută sincron.

| Secțiune | Documente cerute |
|---|---|
| AutorizatieTransport | Certificat înregistrare, Certificat constatator, Atestat (`AtestatTransport`\|`AtestatSofer`), Cazier judiciar, Adeverință medicală, Dovadă plată ARR |
| CopieConforma | Autorizație transport alternativ, Talon/ITP, Carte identitate auto, Contract vehicul, Dovadă plată copie conformă & ecusoane (+ `AcordLeasing` opțional) |
| Vehicul | Talon/ITP, RCA, Copie conformă, Ecuson Uber, Ecuson Bolt, Contract vehicul (+ `AsigurareCalatori` opțional) |

**Gruparea actuală e de onboarding (PFA / Autorizație / Copie conformă / Vehicul), nu cea din spec** (personal / pfa / mașină). Registry-ul din §8.1 e o mapare nouă peste aceleași categorii.

**Ce lipsește din `DocumentCategory` pentru spec:**
- `CarteIdentitate`(2), `PermisConducere`(3), `AtestatTransport`(4), `CazierJudiciar`(6), `CertificatTvaIntracomunitar`(30) — **există**.
- „Aviz medical" și „Aviz psihologic" erau **o singură** valoare; PR 4 a adăugat `AvizPsihologic`(36).
- CASCO lipsea; PR 4 a adăugat `Casco`(37).
→ Fără migrație: `DocumentCategory` se persistă ca string (`DocumentConfiguration.cs:18`), deci valorile noi nu ating schema.

**Endpoint-uri:** `POST documents/upload`, `GET documents`, `GET documents/{id}/download`, `PUT documents/{id}/status`, `GET documents/{id}/extracted-fields`, `POST documents/{id}/extracted-fields/confirm`, plus variantele admin.

### Expirări — există backend, nu există pagină
- Job: `Infrastructure/BackgroundJobs/DocumentExpiryCheckJob.cs` → `Application/Notifications/DocumentExpiry/CheckDocumentExpiryCommandHandler.cs`. Notifică la **30 și 7 zile**, în fusul RO, idempotent per zi prin tag-ul `expiry:{docId}:{n}d:{date}`. Tip: `DocumentExpiringSoon`.
- ~~Lista categoriilor expirabile e duplicată~~ — **unificată în PR 4** în `DocumentExpiryPolicy.ExpirableCategories`; jobul o consumă de acolo, iar copia din `documentSections.tsx` a fost ștearsă.
- ~~Calculul se face în client~~ — **mutat pe server în PR 4**. `GET /documents/overview?group=` întoarce statusul deja decis (`Lipsa` · `Valid` · `ExpiraCurand` · `Expirat` · `InVerificare` · `Respins`) plus `daysUntilExpiry`. Data de expirare nu se mai cere la upload: o completează OCR-ul (`ExpiresAtUtc ??= expiresUtc`).

### OCR / extragere — pipeline complet, refolosibil
- Interfață: `Application/Abstractions/Ai/IDocumentAiAnalyzer.cs`; implementare `Infrastructure/Ai/OpenRouterDocumentAiAnalyzer.cs` (OpenRouter, implicit `google/gemini-2.5-flash`, `temperature=0`, `response_format=json_object`). Fișierul merge inline ca data-URL base64; PDF-urile prin plugin-ul `file-parser`.
- Prompt-ul de sistem e **strict de extragere**: modelul nu primește data curentă și nu judecă validitatea (motivul e documentat în cod — respingea acte valide).
- Așteptări per categorie: `Application/Documents/AiVerification/DocumentAiCatalog.cs` (256 linii, ~22 categorii). **`DocumentCategory.Cheltuiala`(15) există dar nu are intrare în catalog** — de asta bonurile nu primesc OCR azi.
- Deciziile temporale, în C#, cu teste: `Application/Documents/AiVerification/DocumentDateValidator.cs` (`DateOnly`, formate `yyyy-MM-dd`/`dd.MM.yyyy`/`dd/MM/yyyy`/`dd-MM-yyyy`/`yyyy/MM/dd`, ziua curentă în fusul României, `SanityFloor = 1990`, `MaxYearsAhead = 50`, verdicte `Accepted/Rejected/NeedsManualReview`). Validatoare de câmp: `Domain/Documents/ExtractedFieldValidators.cs`.
- Persistență + review: `Domain/Documents/ExtractedField.cs` + `Application/Documents/ExtractedFields/`.
- Orchestrare: upload → `AiStatus = Queued` → `Infrastructure/BackgroundJobs/DocumentAiVerificationJob.cs` → `RunDocumentAiVerificationCommandHandler.cs`.

**Concluzie §2.2 din spec: deja implementat.** Pentru bonuri e nevoie doar de o intrare nouă în catalog + un parser de sume.

---

## 8. Iconițe și feature flags

- **Nu se folosește lucide nicăieri**, deși `lucide-react` e în `package.json`. Sistemul e hibrid:
  - iconițe MUI referite prin convenția string `'MUI:<IconName>'`, rezolvate printr-un `switch` hardcodat în `AppSidebar.tsx:63-85` — **adăugarea unei iconițe cere editarea switch-ului**;
  - SVG-uri locale din `src/assets/SVG/2- Regular/*.svg`, importate ca URL și colorate prin `mask-image` (`ImgNavIcon`, `AppSidebar.tsx:41-61`).
- Disponibile dar nefolosite în navigație: `@tabler/icons-react`, `react-icons`.
- **Nu există niciun mecanism de feature flags.** Doar variabile de mediu (`VITE_API_BASE_URL`, `VITE_VAPID_PUBLIC_KEY`, `VITE_PUBLIC_STRIPE`). Controlul accesului e exclusiv server-driven: `src/utils/clientOnboarding.ts` (`canAccessDashboard`, `resolveClientPath`), aplicat în `DashboardPage.tsx:98-128`.
- **Nu există `src/config/`.** Singurul precedent de config tipat: `src/components/onboarding/config/` (`fiscal.ts`, `platforms.ts`, `vehicle.ts`, …). Restul constantelor: `src/constants/`.

---

## 9. Necunoscute și conflicte

| # | Punct | Stare |
|---|---|---|
| 1 | Pagina „Expirări" de șters (§8.5, DoD) | **Rezolvat în PR 4.** Nu exista ca pagină; calculul din client (`DocumentsTab.tsx:72-135`) a fost șters odată cu componenta, iar starea vine acum din `Application/Documents/Expiry/DocumentExpiryPolicy.cs` |
| 2 | Upload CSV Uber de către PFA (§9.2) | **Conflict.** `POST /uber/imports/{pfaId}` cere `Permissions.ManageClientIncome`, cu comentariu explicit: „rapoartele ajung la birou, iar importul se face din Admin". Decizie aplicată: PFA vede read-only (`Sources.Uber.LastReportAt` / `DetectedRange`), uploadul rămâne pentru personal. **De confirmat cu produsul** |
| 3 | Endpoint-uri OBLIO disponibile (§13.6) | Se apelează **4**: `POST authorize/token`, `GET nomenclature/companies`, `GET nomenclature/series`, `POST docs/invoice` (`Infrastructure/Invoicing/OblioService.cs`). **Capcană confirmată în PR 2:** configurația `Oblio` e contul de facturare al *RIDElance* (seria RMS, CIF RIDElance), din care se emit facturi *către* clienți — `TestConnectionAsync` ar întoarce firma RIDElance, care nu are ce căuta pe pagina clientului. Pagina PFA se alimentează din `PfaOblioAccount` (email, consimțăminte, `IntegrationStatus`) + datele propriului PFA, prin `GET /pfa/connections/oblio` |
| 4 | Cont bancar / Bancă „În curând" (§7.4, §9.4) | **Conflict.** Integrarea Enable Banking e funcțională (`BankTab.tsx`, 849 linii; `Application/Banking/Commands/InitiateBankConnectionCommand.cs`). Decizie: se păstrează reală; doar `Facturi` e stub |
| 5 | `TaxObligation` (§13.2) | **Implementat în PR 6:** `Domain/Taxes/TaxObligation.cs` + `GET/POST /tax-obligations`. Scrierea e limitată la contabila asignată și admin — clientul doar citește, altfel distincția estimare/obligație s-ar șterge exact acolo unde contează. Termenul depășit se calculează server-side |
| 6 | Furnizor OCR pentru cheltuieli (§13.3) | **Implementat în PR 5:** `DocumentCategory.Cheltuiala` are acum intrare în `DocumentAiCatalog`, deci bonurile trec prin aceeași coadă ca restul documentelor. Sumele vin ca text brut și se parsează în C# (`Application/Expenses/Ocr/MoneyParser.cs`) |
| 7 | Praguri de expirare (§13.4) | **Implementat:** `DocumentExpiryPolicy.ExpiringSoonDays = 30`, unul pentru toate tipurile. Diferențierea per tip devine o schimbare de tabel, nu de logică |
| 8 | Canal de livrare notificări (§13.5) | **Implementat în PR 7:** `Domain/Notifications/NotificationPreference.cs` (6 categorii, operațional vs comercial) + `GET/PUT /notifications/preferences`. Absența unui rând înseamnă „activ". `CheckDocumentExpiryCommandHandler` respectă preferința titularului; contabila primește oricum anunțul. Canal nou de livrare — nu, rămâne Web Push |
| 9 | Format CSV Uber (§13.7) | **Există parser:** `Application/Uber/UberCsvImporter.cs`, entitate `Domain/Uber/UberCsvImport.cs`, `FileType` ∈ earnings/hours/trips |
| 10 | „Documentație recurentă" | Feature real (`RecurringDocumentationPanel.tsx`, 407 linii + job de notificări), **nemenționat în spec**. Decizie: a 4-a subpagină sub Documente |
| 11 | `/demo` | Fork stagnant (`src/components/dashboard-demo/` + `src/components/layout/DashboardLayout.tsx`, 516 linii) cu propriile copii de layout/sidebar/secțiuni. Rămâne înghețat, în afara scope-ului |

---

## 10. Convenții de proiect (pentru PR-urile de backend)

| Preocupare | Convenție |
|---|---|
| Entități | `backend/src/Domain/<Arie>/<Entitate>.cs`, moștenesc `SharedKernel.Entity` |
| DbContext | `Infrastructure/Database/ApplicationDbContext.cs` (~53 DbSets), schema `public`, tabele/coloane snake_case |
| Config EF | `Infrastructure/<Arie>/<Entitate>Configuration.cs` |
| Migrații | `Infrastructure/Migrations/`, 79 fișiere, `yyyyMMddHHmmss_Nume.cs` + `.Designer.cs` **scrise de mână**; `PendingModelChangesWarning` suprimat în `Infrastructure/DependencyInjection.cs:156-157`. Validare: `backend/scripts/migration-dryrun.sh` |
| Endpoint-uri | `Web.Api/Endpoints/<Arie>/<Nume>.cs`, `internal sealed class X : IEndpoint`, descoperite prin reflecție (`Web.Api/Extensions/EndpointExtensions.cs`). Rute lowercase, **fără prefix `/api`** |
| Use case-uri | `Application/<Arie>/<UseCase>/`, CQRS propriu (`ICommandHandler`/`IQueryHandler`), rezultate `SharedKernel.Result`/`Error` |
| Servicii externe | interfață în `Application/Abstractions/Services/`, implementare în `Infrastructure/<Arie>/`, clase de opțiuni cu `SectionName` |
| Joburi | `Infrastructure/BackgroundJobs/*.cs`, `BackgroundService` cu `Task.Delay` (fără Hangfire/Quartz). 8 joburi |
| Build & test | .NET 10 — `dotnet build/test CleanArchitecture.slnx` din `backend/`. Teste: `backend/tests/UnitTests` (Cars, Documents, PfaRegistrations, Users) + `ArchitectureTests`. **16 fișiere de test în total** |

**Frontend:** `npm run lint` (eslint), `npm run build` (`tsc -b` + vite), `npm run test:responsive` (Playwright, desktop 1440 + Pixel 7; `tests/responsive/dashboards.spec.ts` acoperă azi doar `client-acasa`). **Nu există vitest/jest.**

**Calculul financiar avea zero teste.** PR 3 a extras rezerva fiscală în `Application/PfaDashboard/TaxReserveCalculator.cs` (clasă pură, fără acces la bază) și a adăugat 17 teste: `backend/tests/UnitTests/PfaDashboard/TaxReserveCalculatorTests.cs` și `.../PfaRegistrations/PfaMonthlyIncomeTests.cs`. `PfaTaxCalculator` rămâne netestat.

# RIDElance – Modul Contabilitate PFA (V1)

Spec de implementare pentru Claude Code. Acoperă:

- **Monthly Tax Engine**: D100 / D301 / D390 din documentele Uber/Bolt.
- **Accounting Ledger**: RJIP, REF, Registru-inventar, cash cu raport Z, închiderea perioadelor, dosarul de predare.
- **Serviciul Java `ridelance-anaf-validator`**: repo separat, descris în `SPEC-anaf-validator-service.md`.

Ordinea de lucru: **Partea A – Frontend** (pe date mock, după contractul API din secțiunea 4), apoi **Partea B – Backend**. La final frontend-ul trece de pe mock pe API-ul real.

---

## 0. Reguli pentru Claude Code (citește înainte de orice)

1. **Explorează repo-ul întâi.** Înainte de etapa F0, citește structura existentă a frontend-ului (React + MUI) și a backend-ului (.NET, EF Core) și respectă convențiile existente: denumiri, rute, organizarea API, autentificare/roluri, layout-ul dashboard-urilor ADMIN și Contabil. Unde spec-ul contrazice o convenție existentă, urmează convenția și notează diferența în rezumatul etapei.
2. **Lucrează strict pe etape.** La finalul fiecărei etape:
   - rulează build + lint + testele;
   - fă commit cu mesaj `feat(accounting): <etapa> ...`;
   - scrie un rezumat scurt: ce s-a făcut, ce a rămas, decizii luate.

   Nu începe etapa următoare fără confirmare.
3. **Nicio regulă fiscală hardcodată.** Cote, procente, praguri, entități furnizor, versiuni de schemă ANAF: toate vin din tabele configurabile cu `valid_from` / `valid_to`. Unde spec-ul spune **DE CONFIRMAT**, creezi configurarea și o lași dezactivată sau cu valoarea marcată ca neconfirmată. Nu alegi tu valoarea.
4. **Nu inventa formatul ANAF.** XML-urile se generează din XSD-urile oficiale (secțiunea B4). Parametrii DUKIntegrator se iau din documentația kitului ANAF (vezi spec-ul Java). Dacă un fișier oficial lipsește din repo, oprește-te și cere-l.
5. **AI-ul doar citește documente.** Nicio decizie fiscală, clasificare de deductibilitate sau calcul nu se face prin LLM.
6. **Convenții UI** (existente în proiect):
   - componentele comune stau în `shared/`, parametrizate (aici pe rol: `ADMIN` / `ACCOUNTANT`);
   - fără spacing sau culori hardcodate, doar `theme.spacing()` și tokeni din paleta MUI;
   - dashboard-ul existent e referința vizuală.
7. **Audit peste tot.** Orice modificare manuală de date fiscale sau contabile scrie în `AuditLog`: cine, când, valoarea veche, valoarea nouă, motivul. Nimic nu se șterge fizic.
8. **Tot textul din UI este în română.** Codul, enum-urile și numele din DB sunt în engleză.

---

## 1. Context și scope

**Clienți:** PFA în sistem real, neplătitori normali de TVA, fără angajați, ridesharing Uber/Bolt, unii cu cod special TVA art. 317.

### Intră în V1

- Upload documente Uber/Bolt per PFA / lună, clasificare, extracție AI, review.
- Registru furnizori și reguli fiscale versionate.
- Pre-check lunar, calcul D100 / D301 / D390, generare XML, validare pe 3 niveluri, PDF pentru semnare.
- Statusuri până la recipisă, rectificative, audit în ambele direcții (sumă → document, document → declarații).
- Procesare bulk pentru toate PFA-urile.
- Accounting Ledger alimentat din Open Banking, Uber/Bolt, Oblio, upload-uri, rapoarte Z, manual.
- RJIP, REF, Registru-inventar, cu export PDF + Excel.
- Setări contabilitate per PFA, cu istoric de valabilitate.
- Onboarding pas 3: întrebarea despre cash, plus fluxul de activare cash.
- Închiderea perioadelor, inactivarea PFA, dosarul de predare, politica de retenție.

### NU intră în V1

- D212, D300, D394, D112, RO e-TVA.
- Semnare sau depunere automată pe e-guvernare. Fără Selenium sau browser automation.
- Integrare API cu casa de marcat.
- Secțiune nouă în dashboard-ul utilizatorului PFA. Excepție: pasul 3 din onboarding.
- Registru completat manual rând cu rând.
- Alegerea deductibilității de către client.

---

## 2. Arhitectură

```
                                  ┌──────────────────────────────┐
  React + MUI (ADMIN / Contabil)  │  .NET backend (repo existent) │
  ───────────────────────────────▶│                              │
                                  │  Accounting module           │
                                  │   ├─ Documents + Extraction  │──▶ LLM provider (IDocumentExtractor)
                                  │   ├─ Rules (config)          │
                                  │   ├─ Monthly Tax Engine      │
                                  │   ├─ Declarations + XML      │──HTTP intern──▶ ridelance-anaf-validator (Java)
                                  │   ├─ Accounting Ledger       │                  └─ DUKIntegrator + validatoare ANAF
                                  │   ├─ Registers (RJIP/REF/RI) │
                                  │   └─ Periods / Offboarding   │
                                  └──────────┬───────────────────┘
                                             │
                          DB (EF Core) + file storage (PDF-uri originale, XML, PDF generate)
```

**Repo-uri:**

- `ridelance/`: existent. Frontend + backend .NET.
- `ridelance-anaf-validator/`: **nou, git separat**, folder frate cu `ridelance/`, nu în interiorul lui. Vezi `SPEC-anaf-validator-service.md`.

**Motoare separate logic, pe aceleași date de bază:**

- `MonthlyTaxEngine`: facturi de comision confirmate → D100 / D301 / D390.
- `AccountingLedger`: toate sursele → `LedgerEntry` → RJIP, REF, Registru-inventar, taxe estimate.

O factură de comision Bolt confirmată produce **atât** linii de declarație, cât și (când apare plata sau reținerea) intrări în ledger. Legătura se face prin `source_document_id`.

---

## 3. Enumerări și statusuri

### 3.1 Status document platformă (`PlatformDocumentStatus`)

| Enum | Label UI |
|---|---|
| `UPLOADED` | Încărcat |
| `EXTRACTING` | Se citește… |
| `EXTRACTION_FAILED` | Citire eșuată |
| `NEEDS_REVIEW` | De verificat (cel puțin o verificare a picat) |
| `PENDING_CONFIRMATION` | De confirmat (verificările au trecut, se așteaptă confirmare) |
| `CONFIRMED` | Confirmat |
| `LOCKED` | Blocat (inclus într-o declarație dincolo de `GENERATED` sau într-o perioadă închisă) |

### 3.2 Status declarație (`DeclarationStatus`) și label UI

| Enum | Label UI | Când |
|---|---|---|
| `NOT_APPLICABLE` | N/A | Nu există bază (de ex. nicio achiziție UE → fără D301/D390) |
| `BLOCKED_MISSING_DOCUMENTS` | Lipsesc documente | Pre-check blocat din cauza documentelor lipsă |
| `BLOCKED_NEEDS_REVIEW` | De verificat | Pre-check blocat din cauza documentelor nevalidate |
| `DRAFT` | Draft | Creată, încă negenerată |
| `GENERATED` | Draft automat | XML generat |
| `VALIDATION_FAILED` | De verificat | Unul dintre cele 3 niveluri de validare a picat |
| `VALIDATED` | Verificat | Toate validările au trecut |
| `READY_TO_SIGN` | Pregătit pentru depunere | PDF-ul DUKIntegrator a fost generat |
| `SIGNED` | Semnat | Marcat manual |
| `SUBMITTED` | Depus | Marcat manual. Nu înseamnă acceptat. |
| `ACCEPTED` | Recipisă validă | Recipisa a fost încărcată |
| `REJECTED` | Respins | Marcat manual, cu motiv |

**Tranziții permise:**

- `GENERATED → VALIDATED | VALIDATION_FAILED`
- `VALIDATED → READY_TO_SIGN`
- `READY_TO_SIGN → SIGNED → SUBMITTED → ACCEPTED | REJECTED`
- `VALIDATION_FAILED | REJECTED → GENERATED` (regenerare, pe aceeași versiune)
- `ACCEPTED → versiune nouă RECTIFICATIVE în GENERATED`. Versiunea veche rămâne neschimbată.

Orice altă tranziție e refuzată de backend cu `409`.

### 3.3 Ledger

- `source`: `BANK | UBER | BOLT | OBLIO | UPLOAD | CASH_Z | MANUAL`
- `transaction_type`: `INCOME | EXPENSE | TRANSFER | OWNER_CONTRIBUTION | LOAN | TAX | OTHER`
- `payment_method`: `BANK | CASH`
- `deductibility_type`: `100_PERCENT | 50_PERCENT | NON_DEDUCTIBLE | SPECIAL_RULE`
- `status`: `AUTO_IMPORTED | NEEDS_REVIEW | VERIFIED | LOCKED`

### 3.4 Cash

- `cash_register_status`: `NOT_REQUIRED_CURRENT_CONFIGURATION | PENDING | IN_VERIFICATION | ACTIVE`
- Câmpuri: `cash_requested`, `cash_enabled`, `cash_activation_date`, `cash_verified_by`

### 3.5 Perioadă contabilă

- `AccountingPeriodStatus`: `OPEN | CLOSED`
- O corecție într-o perioadă închisă = `PeriodCorrection`, cu audit.

### 3.6 REF

- `RefStatus`: `CURRENT` (calcul curent) `| FINAL` (după închiderea anului) `| INTERMEDIATE` (situație intermediară la o dată, la predare)

---

## 4. Contract API (sursa de adevăr pentru frontend și backend)

Prefix orientativ: `/api/accounting`. Adaptează-l la convenția existentă. Toate endpoint-urile cer rol `ADMIN` sau `ACCOUNTANT`. Perioada lunară e `yyyy-MM`.

În etapa F0 tipurile TypeScript se scriu în `src/.../accounting/api/types.ts`. În B0 se oglindesc în DTO-urile C#.

### 4.1 PFA și dosar

```
GET  /pfas?status=active|inactive&search=           → PfaListItem[]
GET  /pfas/{pfaId}/summary                          → PfaAccountingSummary
GET  /pfas/{pfaId}/settings                         → PfaAccountingSettings (cu history[])
PUT  /pfas/{pfaId}/settings                         → body: SettingsChange { field, value, validFrom, note }
POST /pfas/{pfaId}/cash/evidence                    → multipart(file) → { documentId }   // dovada de fiscalizare
POST /pfas/{pfaId}/cash/transition                  → body: { to: CashRegisterStatus, note, evidenceDocumentId? }
POST /pfas/{pfaId}/deactivate                       → body: { accountingEndDate }
POST /pfas/{pfaId}/handover-package                 → { jobId }
GET  /pfas/{pfaId}/audit?from&to&entity             → AuditEntry[]
```

### 4.2 Documente platformă

```
GET   /pfas/{pfaId}/platform-documents?period=      → PlatformDocumentListItem[]
POST  /pfas/{pfaId}/platform-documents              → multipart(file, period) → PlatformDocument (status EXTRACTING)
GET   /platform-documents/{id}                      → PlatformDocumentDetail (extraction, checks[], sourceSnippets, includedIn[])
GET   /platform-documents/{id}/file                 → PDF original
PATCH /platform-documents/{id}/extraction           → body: { fields: Partial<ExtractedFields>, reason } → PlatformDocumentDetail
POST  /platform-documents/{id}/confirm              → PlatformDocumentDetail
POST  /platform-documents/confirm-bulk              → body: { ids[] } → { confirmed[], skipped[{id, reason}] }
```

### 4.3 Luna fiscală (bulk)

```
GET  /periods/{period}/overview      → { stats: {total, ready, needsReview, missingDocuments, notProcessed}, rows: OverviewRow[] }
POST /periods/{period}/process       → { jobId }   // extracție pentru documentele neprocesate + pre-check pentru toate PFA-urile
POST /periods/{period}/confirm-clean-documents → { confirmed[], skipped[{id, reason}] }   // confirmă în bloc documentele PENDING_CONFIRMATION
POST /periods/{period}/generate      → { jobId }   // doar PFA-urile READY fără declarații generate
POST /periods/{period}/validate      → { jobId }   // toate versiunile în GENERATED
GET  /jobs/{jobId}                   → { status, progress: {done, total}, results[], errors[] }
```

### 4.4 Declarații

```
GET  /pfas/{pfaId}/declarations?period=                  → DeclarationSummary[] (D100, D301, D390)
GET  /declarations/{id}                                  → DeclarationDetail (versions[])
GET  /declaration-versions/{id}/breakdown                → { lines: DeclarationLine[], total, explanation }
GET  /declaration-versions/{id}/xml                      → application/xml
GET  /declaration-versions/{id}/pdf                      → PDF generat de DUKIntegrator
GET  /declaration-versions/{id}/validation               → { levels: [{level: RIDELANCE|XSD|ANAF, passed, messages[]}] }
POST /declaration-versions/{id}/transitions              → body: { action: VALIDATE|MARK_SIGNED|MARK_SUBMITTED|MARK_REJECTED|REGENERATE, note? }
POST /declaration-versions/{id}/receipt                  → multipart(file, receiptNumber?) → status ACCEPTED
POST /declarations/{id}/rectification                    → body: { reason } → DeclarationVersion nouă
```

### 4.5 Reguli fiscale

```
GET/POST/PUT /rules/suppliers          → SupplierTaxProfile
GET/POST/PUT /rules/vat-rates          → VatRate
GET/POST/PUT /rules/d100               → D100Rule
GET/POST/PUT /rules/anaf-schemas       → AnafDeclarationSchema
GET/POST/PUT /rules/expense-categories → ExpenseCategoryRule (clasificare → categorie fiscală)
GET          /rules/exchange-rates?currency&date
```

Nu există `DELETE`. O regulă se închide setând `valid_to`.

### 4.6 Ledger, cash, registre, perioade

```
GET   /pfas/{pfaId}/ledger?from&to&status&type&source   → LedgerEntry[] (paginat)
PATCH /ledger/{id}                                      → body: { fields, reason }
POST  /ledger/{id}/verify
POST  /pfas/{pfaId}/ledger/manual                       → LedgerEntry (source MANUAL)
POST  /pfas/{pfaId}/expense-documents                   → multipart → document + propunere de matching
POST  /pfas/{pfaId}/z-reports                           → multipart → { extracted: {date, zNumber, total}, ledgerEntry }
GET   /pfas/{pfaId}/assets | POST | PUT                 → Asset

GET   /pfas/{pfaId}/registers/rjip?from&to              → RjipView
GET   /pfas/{pfaId}/registers/rjip/export?from&to&format=pdf|xlsx
GET   /pfas/{pfaId}/registers/ref?year=                 → RefView { status: CURRENT|FINAL|INTERMEDIATE, asOf, rows[] }
GET   /pfas/{pfaId}/registers/ref/export?year&format&asOf?
GET   /pfas/{pfaId}/registers/inventory?year=           → InventoryView
GET   /pfas/{pfaId}/registers/inventory/export?year&format

GET   /pfas/{pfaId}/periods                             → AccountingPeriod[]
POST  /pfas/{pfaId}/periods/{period}/close
POST  /pfas/{pfaId}/periods/{period}/corrections        → body: { ledgerEntryId?, change, reason }
```

---

# PARTEA A – FRONTEND

Toată Partea A merge pe **mock-uri**:

- un adapter API cu două implementări (`mock` și `http`), aleasă printr-un flag de mediu;
- componentele nu știu care implementare rulează.

Mock-urile simulează:

- latența (300–800 ms);
- joburile async (progres care crește);
- tranzițiile de status, cu aceleași reguli din 3.2.

## F0 – Fundație

- Tipurile TS pentru tot contractul din secțiunea 4.
- `accountingApi` cu implementările `mock` și `http`. `http` rămâne neimplementat (stub) până la B9.
- **Fixtures** (30 PFA-uri pentru `2026-08`):
  - **Ion Popescu**: venituri Bolt 8.000 / Uber 5.000, comision Bolt 1.000 / Uber 600 → D100 20, D301 336, D390 0.
  - **Bogdan Matei**: suma extrasă de AI (1.284,50) nu apare în text (1.248,50) → `NEEDS_REVIEW`.
  - **Răzvan Ene**: furnizor Uber cu VAT ID necunoscut → `NEEDS_REVIEW`.
  - **George Stan**: fără factura Uber → `BLOCKED_MISSING_DOCUMENTS`.
  - **2 PFA-uri inactive**, cu perioadă contabilă închisă.
  - **1 PFA cu cash `ACTIVE`** și câteva rapoarte Z.
  - Ledger de 3 luni pentru 3 PFA-uri: combustibil, service, asigurare, payout Bolt/Uber, raport Z.
- Helperi de formatare RO (`1.234,56 lei`, date `dd.MM.yyyy`) în `shared/`.
- Mapare centralizată enum → label + culoare (token MUI).

**Acceptanță:** build verde. O pagină de debug (doar în dev) afișează fixtures prin `accountingApi`.

## F1 – Lista PFA și dosarul PFA

- **Rute:** `ADMIN → PFA` și `Contabil → PFA`. **Aceeași componentă** din `shared/`, parametrizată pe rol.
- **Lista:** taburi Active / Inactive, căutare, coloane:
  - nume, CUI;
  - cod art. 317 (Da/Nu);
  - platforme;
  - status lună curentă (badge agregat);
  - cash (status).
- **Dosarul PFA** (rută `.../pfa/{id}/accounting`):
  - antet cu nume, CUI, cod TVA art. 317 și data activării, sistem real, badge status;
  - banner read-only dacă PFA-ul e inactiv;
  - taburi: **Declarații**, **Documente platformă**, **Tranzacții**, **Registre**, **Setări contabilitate**, **Istoric**.

**Acceptanță:** navigare completă între liste și dosare pe ambele roluri. Niciun element nou în dashboard-ul utilizatorului PFA.

## F2 – Documente platformă și ecranul de verificare

- **Selector de lună.** Un slot pentru fiecare tip așteptat (factură Bolt, factură Uber, raport Bolt, raport Uber), cu status. Un slot lipsă e vizibil și are buton „Încarcă PDF”.
- **Upload** cu drag & drop, mai multe fișiere deodată. Clasificarea tipului vine din răspuns. Status `EXTRACTING` cu polling.
- **Ecranul de verificare** (split view):
  - **Stânga:** PDF-ul original randat (pdf.js / `react-pdf`, cu text layer).
  - **Dreapta:** titlul „RIDElance a citit documentul:”, apoi câmpurile furnizor, VAT ID, țară, nr. factură, dată, perioadă, monedă, comision (plus alte sume, dacă există). Încrederea modelului apare ca informație secundară.
  - **Hover sau focus pe un câmp** evidențiază în PDF fragmentul sursă (`sourceSnippets[field]`), căutat în text layer. Dacă nu e găsit, câmpul primește un indicator „sursă negăsită”.
  - **Lista de verificări** (✓ / ✕), fiecare cu mesaj explicit. Verificarea „furnizor necunoscut” are acțiunea „Adaugă în registrul de furnizori”, care deschide formularul de reguli precompletat.
  - **Butoane:**
    - `Confirmă` (dezactivat cât timp o verificare pică);
    - `Modifică`: câmpuri editabile, plus un **motiv obligatoriu**;
    - `Salvează` re-rulează verificările.
  - Câmpurile modificate manual sunt marcate. Secțiunea **„Inclus în”** listează declarațiile, cu link.
  - Un document `LOCKED` nu poate fi editat și afișează explicația.
- **Confirmare bulk:** checkbox pe documentele `PENDING_CONFIRMATION`, apoi „Confirmă selectate”.

**Acceptanță:** toate cele 4 cazuri din fixtures pot fi rezolvate din UI. După rezolvare, PFA-ul trece în READY în mock.

## F3 – Dashboard lunar declarații

- **Rută:** `Contabil → Declarații → {lună}` (și din ADMIN).
- **Sus:** statistici Total / Gata / Necesită verificare / Document lipsă / Neprocesate.
- **Butoane:**
  - `Procesează luna`
  - `Confirmă documentele fără probleme` (confirmare în bloc a documentelor `PENDING_CONFIRMATION` din toată luna)
  - `Generează declarațiile` (activ doar dacă există PFA READY fără declarații)
  - `Validează toate` (activ doar dacă există versiuni `GENERATED`)

  Fiecare pornește un job, cu progres vizibil și un rezumat la final.
- **Tabel:**

  | PFA | Bolt | Uber | D100 | D301 | D390 | Status |
  |---|---|---|---|---|---|---|

  - Coloanele D afișează suma și status-chip-ul.
  - Sub numele PFA apare primul motiv de blocare.
  - Filtrul „Doar excepții”.
  - Click pe rând deschide dosarul PFA pe tabul relevant.
- Tabelul are scroll orizontal pe ecrane înguste.

**Acceptanță:** fluxul complet se poate face pe fixtures: procesare → confirmarea documentelor fără probleme → 27 gata / 2 verificare / 1 lipsă → rezolvare → generare → validare.

## F4 – Declarații în dosarul PFA

- **Câte un card per declarație** (D100, D301, D390), cu:
  - suma (D390: „0 lei, doar raportare”);
  - status;
  - versiunea curentă (inițială sau rectificativă);
  - stepper de status;
  - rezultatul validării pe 3 niveluri (RIDElance / XSD / ANAF), cu mesaje.
- **Click pe sumă** deschide un dialog „De unde vine suma”:
  - câte o linie per document: `bază × cotă = valoare`, cu link spre documentul sursă (deschide ecranul din F2);
  - pentru D100: convenția și valabilitatea certificatului de rezidență;
  - pentru D301: nota „veniturile din curse nu intră în bază”, cu suma lor;
  - pentru D390: tabel cu tip S / țară / VAT ID / bază.
- **Acțiuni după status:** `Validează`, `Descarcă PDF`, `Vezi XML` (read-only, formatat), `Marchează semnat`, `Marchează depus`, `Încarcă recipisă`, `Marchează respins` (cu motiv), `Regenerează`, `Creează rectificativă` (cu motiv).
- Mesaj permanent în starea `SUBMITTED`: „Depus nu înseamnă acceptat. Se așteaptă recipisa.”
- **Istoric versiuni:** toate versiunile rămân vizibile, cu status și sumă.
- **D100 rectificativă:** mesaj informativ că se aplică procedura specifică D100 (de ex. D710, unde e cazul). Implementarea exactă e **DE CONFIRMAT**.

**Acceptanță:** toate tranzițiile din 3.2 sunt accesibile, iar cele invalide nu apar ca acțiuni.

## F5 – Setări contabilitate PFA și reguli fiscale

- **Tab „Setări contabilitate”**:
  - sistem real (read-only, Da);
  - TVA normal (read-only, Nu);
  - cod art. 317 Da/Nu + data activării;
  - platforme (Uber / Bolt);
  - cash + status casă de marcat;
  - **deductibilitate cheltuieli auto** (50% / 100%) cu **Valabil de la** și **Observație / justificare** obligatorie.
- Fiecare modificare creează o intrare nouă în istoric, fără să o suprascrie pe cea veche. Istoricul e afișat ca timeline (de ex. `01.01.2027–30.06.2027: 50%`, `de la 01.07.2027: 100%`).
- **Pagina „Reguli fiscale”** (Contabilitate → Reguli fiscale), cu tabele editabile:
  - `SupplierTaxProfile`: furnizor, țară, VAT ID, tip venit, convenție, cotă D100, valabil de la/până la, certificat de rezidență de la/până la, fișier certificat. Afișează un avertisment când certificatul expiră în mai puțin de 60 de zile.
  - `VatRate`: cotă, valabil de la/până la.
  - `D100Rule`: `D100_COMMISSION_NONRESIDENT` (activă) și `D100_RENT_INDIVIDUAL` (dezactivată, **DE CONFIRMAT**).
  - `AnafDeclarationSchema`: declarație, versiune, valabil de la/până la, fișier XSD, versiune validator.
  - `ExpenseCategoryRule`: categorie, legătură auto (da/nu), tip deductibilitate implicit.
- Regulile nu se șterg, se închid prin `valid_to`. Perioadele suprapuse pentru aceeași cheie sunt refuzate cu mesaj clar.

**Acceptanță:** schimbarea cotei unui furnizor în mock se reflectă în previzualizarea calculului pentru o lună nouă, dar nu și în declarațiile deja generate.

## F6 – Tranzacții (ledger), cash și registre

- **Tab „Tranzacții”:**
  - tabel paginat cu filtre (perioadă, sursă, tip, status, doar „de verificat”);
  - coloane: dată, document, sursă, contrapartidă, descriere, tip, metodă, sumă, deductibil, status;
  - rândul se expandează și arată documentul justificativ, calculul deductibilității (`sumă × % = deductibil`, cu regula și data ei) și audit-ul;
  - acțiuni: `Verifică`, `Modifică` (cu motiv), `Adaugă manual`, `Încarcă document cheltuială` (propune un matching cu tranzacția, confirmat de utilizator);
  - **Încarcă raport Z** (vizibil doar dacă cash e `ACTIVE`): upload → câmpurile extrase (dată, nr. Z, total) → confirmare → intrare în ledger.
- **Tab „Registre”**, cu 3 carduri:
  - **RJIP:** selector de an sau interval custom, previzualizare în tabel (coloanele modelului oficial 14-1-1/b, totaluri lunare), export PDF / Excel.
  - **REF:** an și badge `Calcul curent` / `Final` / `Situație intermediară la dd.MM.yyyy`, previzualizare, export.
  - **Registru-inventar:** an, lista activelor (CRUD simplu: tip, descriere, data și valoarea achiziției, document, status, data ieșirii), export.
- **Perioade:** listă lunară cu status `OPEN` / `CLOSED` și buton „Închide luna” (cu confirmare). O lună închisă afișează lacăt pe toate rândurile. Corecțiile se fac doar prin „Corecție controlată” (ADMIN / ACCOUNTANT, cu motiv).

**Acceptanță:** exemplul „o zi în RIDElance” (secțiunea 5.3) apare corect în Tranzacții, RJIP și REF pe fixtures.

## F7 – Onboarding cash, activare cash, inactivare și predare

- **Onboarding PFA, pasul 3 „Fiscal, bancă și semnături”**: se adaugă întrebarea
  - **Plăți în numerar:** „Vrei să accepți și curse pentru care pasagerul plătește direct în numerar?”
  - subtext: „Nu ne referim la cursele achitate cu cardul direct în aplicația Uber/Bolt.”
  - opțiuni: `DA, vreau să accept și numerar` / `NU, voi lucra doar cu plăți online prin platformă`
  - DA și NU deschid popup-urile cu textul exact din documentul clientului, fiecare cu butonul `Am înțeles`. Răspunsul e obligatoriu pentru a continua.
  - Se integrează în state machine-ul existent al onboarding-ului, fără pași noi.
- **Activare cash** (în dosar → Setări):
  - traseul `INACTIV → ÎN VERIFICARE → ACTIV`;
  - upload obligatoriu al dovezii de fiscalizare pentru a trece în `ACTIVE`;
  - se afișează cine a verificat și data activării;
  - reminder vizibil: „Activează cash în conturile Fleet doar după verificare.”
- **Inactivare PFA:** dialog cu data de sfârșit a perioadei contabile. După confirmare, dosarul devine read-only.
- **„Generează dosar de predare”:** job, apoi link de descărcare ZIP. Previzualizează structura folderelor înainte de generare.
- **Retenție:** în dosarul inactiv se afișează „Păstrare obligatorie până la dd.MM.yyyy” (calculat de backend).

**Acceptanță:** fluxurile DA / NU din onboarding salvează valorile corecte în mock, iar activarea cash nu poate sări peste pasul de verificare.

---

# PARTEA B – BACKEND (.NET)

## B0 – Model de date și migrații

Entități (EF Core, un migration per etapă):

- **`PlatformDocument`**: `Id, PfaId, Period, Platform, DocumentType, SourceFileId, FileHash, Status, UploadedBy, UploadedAt`
- **`DocumentExtraction`**: `Id, PlatformDocumentId, Version, Fields (json), SourceSnippets (json), ModelConfidence, ModelId, PromptVersion, ChecksResult (json), IsManualEdit, CreatedBy, CreatedAt`
  - Fiecare extracție și fiecare editare manuală creează o versiune nouă. Cea curentă e marcată.
  - Câmpuri tipate: `SupplierName, SupplierCountry, SupplierVatId, InvoiceNumber, InvoiceDate, PeriodFrom, PeriodTo, Currency, Amount, CommissionAmount, OtherAmounts`
- **`SupplierTaxProfile`**: `SupplierName, Country, VatId, IncomeType, Treaty, D100Rate, D100RateConfirmed (bool), ValidFrom, ValidTo, ResidenceCertValidFrom, ResidenceCertValidTo, ResidenceCertFileId`
- **`VatRate`**: `Rate, ValidFrom, ValidTo`
- **`D100Rule`**: `Code, Enabled, Description, ValidFrom, ValidTo, Parameters (json)`
- **`ExchangeRate`**: `Currency, Date, Rate, Source`
- **`AnafDeclarationSchema`**: `DeclarationType, Version, ValidFrom, ValidTo, XsdFileId, ValidatorVersion`
- **`Declaration`**: `Id, PfaId, Period, Type`
- **`DeclarationVersion`**: `Id, DeclarationId, VersionNo, Kind (INITIAL|RECTIFICATIVE), Status, SchemaId, Snapshot (json: input + calcul), XmlFileId, PdfFileId, ValidationResult (json), ReceiptFileId, ReceiptNumber, StatusHistory, CreatedAt`
- **`DeclarationLine`**: `Id, DeclarationVersionId, SourceDocumentId, RuleCode, Base, Rate, Value, Currency, ExchangeRate, Explanation`
  - Relația many-to-many document ↔ declarații se derivă din `DeclarationLine`.
- **`PfaAccountingSettings`** (append-only, cu `ValidFrom`): `PfaId, Key, Value, ValidFrom, Note, ChangedBy, ChangedAt`
- **`CashRegisterState`**: `PfaId, CashRequested, CashEnabled, Status, ActivationDate, VerifiedBy, EvidenceFileId`
- **`LedgerEntry`**: toate câmpurile din documentul clientului, secțiunea 3 („Ce trebuie să conțină o înregistrare contabilă internă”), plus `AccountingPeriod`.
- **`ExpenseDocument`**, **`ZReport`**: `Date, ZNumber, Total, FileId`, legat de `LedgerEntry`.
- **`Asset`**: `Type, Description, AcquisitionDate, AcquisitionValue, DocumentId, Status, DisposedDate`
- **`AccountingPeriod`**: `PfaId, Period, Status, ClosedBy, ClosedAt`
- **`PeriodCorrection`**, **`AuditLog`**: `Entity, EntityId, Action, Before (json), After (json), Reason, UserId, At`
- **`PfaAccountingEngagement`**: `PfaId, StartDate, EndDate, Status (ACTIVE|INACTIVE)`
- **`RetentionPolicy`** (config): `YearsAfter = 5`, `StartMonthDay = 07-01`. Valorile vin din documentul clientului; verifică-le cu contabilul.
- **`BackgroundJob`**: `Id, Type, Status, Progress, Result (json)`

**Reguli:**

- fără delete fizic pe entitățile fiscale și contabile;
- concurrency token pe `DeclarationVersion` și `LedgerEntry`;
- stocarea fișierelor folosește mecanismul existent din proiect. PDF-urile originale sunt imutabile, cu hash SHA-256.

**Acceptanță:** migrații aplicate, seed pentru `VatRate`, `SupplierTaxProfile` (Bolt 2% confirmat; Uber cu `D100RateConfirmed = false`), cele 2 `D100Rule` și `RetentionPolicy`.

## B1 – Documente și extracție AI

- **Upload:**
  - calculează hash-ul; dacă există deja același hash pentru același PFA, răspunde `409` cu link spre documentul existent;
  - salvează fișierul, creează documentul cu status `EXTRACTING` și pune în coadă jobul de extracție.
- **Extracție** (`IDocumentExtractor`, implementarea cu provider-ul LLM configurat; model și versiune de prompt din config):
  1. Extrage textul PDF (PdfPig). Dacă PDF-ul nu are text layer, trimite paginile ca imagine.
  2. Apel LLM cu **JSON schema strictă**. Răspunsul conține `document_type` (clasificare), câmpurile tipate și `source_snippets` (textul exact pentru fiecare valoare).
  3. Salvează un `DocumentExtraction` nou.
  4. Rulează verificările deterministe și setează statusul `NEEDS_REVIEW` sau `PENDING_CONFIRMATION`.
- **Verificări deterministe** (clasă separată, testată unitar):

  | Cod | Verificare |
  |---|---|
  | `AMOUNT_IN_TEXT` | Fiecare sumă apare literal în textul PDF. Normalizează `1.000,00` / `1,000.00` / `1000.00`. |
  | `ARITHMETIC` | Subtotal + TVA = total. TVA trebuie să fie 0 (taxare inversă). |
  | `SUPPLIER_KNOWN` | VAT ID-ul există în `SupplierTaxProfile` valid la data facturii. |
  | `VAT_ID_FORMAT` | Prefixul de țară se potrivește cu `SupplierCountry`. |
  | `PERIOD_MATCH` | Data facturii e în perioada procesată. Regula de exigibilitate e **DE CONFIRMAT** (config). |
  | `NOT_DUPLICATE` | Nu există alt document cu același furnizor + număr. |
  | `NOT_ALREADY_DECLARED` | Documentul nu apare într-o `DeclarationVersion` `ACCEPTED` pe altă perioadă. |
  | `CURRENCY_ALLOWED` | Moneda e RON sau EUR. |
  | `SETTLEMENT_CORRELATION` | Comision / venit din raportul platformei în intervalul configurat (implicit 10–30%). |

- **Editare manuală:** creează o nouă versiune `IsManualEdit`, cu audit (motiv obligatoriu) și re-rulează verificările.
- **Confirmare:** permisă doar dacă verificările trec. Setează `CONFIRMED`, `reviewed_by`, `reviewed_at`.
- **Bulk confirm:** returnează ce a sărit și de ce.

**Acceptanță:** teste unitare pentru fiecare verificare. Test de integrare cu un extractor fake care reproduce cazurile din fixtures.

## B2 – Motorul fiscal lunar (funcții pure)

`MonthlyTaxEngine.Calculate(PfaTaxInput) → TaxResult`, fără acces la DB. Input:

- facturile confirmate ale perioadei;
- regulile valabile la data fiecărei facturi;
- cursurile de schimb;
- setările PFA (art. 317 activ la dată).

**Reguli:**

- **D100 (`D100_COMMISSION_NONRESIDENT`):**
  - pentru fiecare factură de comision: `base = CommissionAmount (RON)`, `rate = SupplierTaxProfile.D100Rate`;
  - condiție: certificatul de rezidență e valabil la data facturii. Altfel, blocare cu mesaj.
  - `D100RateConfirmed = false` blochează cu mesajul „Cota D100 pentru {furnizor} nu e confirmată”.
- **D301:**
  - `base = Σ comisioane servicii UE (RON)`, `vat = base × VatRate(valabil la data exigibilității)`;
  - datele merg în secțiunea 4.1 a D301 (achiziții de servicii intracomunitare: document, valoare valută, valută, curs, bază, TVA);
  - Fără servicii UE → `NOT_APPLICABLE`.
- **D390:** o linie tip `S` per furnizor (cod țară, cod TVA, bază). De plată: 0. Fără servicii UE → `NOT_APPLICABLE`.
- **`D100_RENT_INDIVIDUAL`:** interfață și clasă goală, dezactivată. Nu se calculează nimic până la confirmarea regulii.
- **Rotunjiri:** calculul pe linii se face cu zecimale. Rotunjirea la nivel de declarație urmează XSD-ul sau instrucțiunile formularului (**DE CONFIRMAT**, config per tip de declarație).
- **Curs valutar:** sursa și data cursului sunt **DE CONFIRMAT**. Implementează `IExchangeRateProvider` cu import BNR și config pentru regula datei.
- **Output:** linii cu `Explanation` lizibilă (de ex. `1.000,00 × 21% = 210,00`) și referința spre documentul sursă.

**Teste golden (obligatorii):**

- exemplul Ion Popescu (D100 = 20, D301 = 336, D390 = 2 linii S, total 0);
- factură în EUR;
- certificat de rezidență expirat → blocare;
- cotă TVA schimbată la mijlocul unei luni (folosește data exigibilității);
- lună fără facturi UE → `NOT_APPLICABLE`.

Adaugă ulterior cazurile reale confirmate de contabil în `tests/golden/*.json`.

## B3 – Pre-check și procesarea lunii

- `PreCheckService.Run(pfaId, period) → READY | BLOCKED + reasons[]`. Verifică toată lista din secțiunea 10 a documentului clientului:
  - PFA activ, CIF, date complete, art. 317 valid;
  - documentele așteptate prezente și confirmate;
  - fără duplicat, furnizor identificat, VAT ID, valoare, monedă, perioadă, corelare;
  - regulă existentă, document nedeclarat anterior.
- **Joburi în background** (mecanismul existent din proiect sau un hosted service cu coadă în DB):
  - `process`: extracție pentru documentele neprocesate, apoi pre-check pentru fiecare PFA;
  - `generate`: pentru READY, calcul, apoi `DeclarationVersion` v1 `GENERATED` (cu snapshot) și XML (B4);
  - `validate`: pentru `GENERATED`, cele 3 niveluri (B4).
- Idempotență: a rula de două ori `generate` nu creează versiuni duplicate.
- Progresul se scrie în `BackgroundJob`.
- `GET /periods/{period}/overview`: o singură interogare agregată, fără N+1.

## B4 – Generare XML și validare pe 3 niveluri

- **Fișiere oficiale:** XSD-urile D100, D301 și D390 se descarcă manual de pe paginile ANAF și se pun în `backend/.../Anaf/Schemas/{TIP}/{versiune}/`. Claude Code **nu** le descarcă și nu le reconstruiește. Dacă lipsesc, se oprește și le cere.
- **Clase generate din XSD** (`XmlSchemaClassGenerator` sau `xsd.exe`), în namespace-uri versionate: `Anaf.D301.V{x}`.
- **Mapper per declarație și per versiune de schemă:** `ID301XmlMapper` → `D301MapperV{x}`. Schema e selectată din `AnafDeclarationSchema` după perioada declarației, nu după data curentă.
- **Nivel 1, RIDElance:** recalculează din snapshot și compară. Verifică obligațiile de business (sumele din linii = totaluri etc.).
- **Nivel 2, XSD:** validare cu `XmlSchemaSet` în .NET. Erorile sunt mapate pe câmp.
- **Nivel 3, ANAF:** apel HTTP către `ridelance-anaf-validator` (mod `VALIDATE_AND_PDF`) cu tipul declarației și versiunea validatorului.
  - Salvează rezultatul brut și cel parsat.
  - Dacă toate nivelurile trec: salvează PDF-ul, status `VALIDATED`, apoi `READY_TO_SIGN`.
  - Dacă pică: `VALIDATION_FAILED`, cu mesajele afișate în UI.
- **Client HTTP:** timeout, retry cu backoff (maximum 2), token intern în header, URL din config.

**Acceptanță:** pentru cazul Ion Popescu cele 3 XML-uri trec XSD-ul oficial și validatorul ANAF (test de integrare, rulat doar când serviciul Java e pornit).

## B5 – Statusuri, recipisă, rectificative, audit

- State machine explicit pentru `DeclarationVersion` (3.2). Tranzițiile invalide răspund `409`.
- **Recipisă:** upload fișier și număr opțional, apoi `ACCEPTED`. Documentele sursă sunt deja `LOCKED` de la `VALIDATED` (§3.1); recipisa nu schimbă blocarea.
- **Rectificativă:** doar din `ACCEPTED`. Creează o versiune nouă `RECTIFICATIVE` cu snapshot nou; versiunea veche rămâne neschimbată. Pentru D100 se folosește un flag `CorrectionProcedure` din config (**DE CONFIRMAT**: D100 rectificativă sau D710).
- **Deblocarea documentelor pentru corecție:** permisă doar când există o rectificativă deschisă (`GENERATED`) care le include.
- **`breakdown`:** returnează liniile cu explicație și link spre document.
- **`includedIn`** pe document: toate versiunile care îl referă prin `DeclarationLine`.
- **Audit** automat, printr-un interceptor EF sau în serviciile de domeniu, pentru toate entitățile fiscale și contabile.

## B6 – Accounting Ledger: import și clasificare

- **Importatori**, fiecare cu `ILedgerSource`, idempotent prin `external_id` + sursă:
  - **Open Banking:** reutilizează integrarea existentă (`BankTransaction`). O tranzacție nouă creează un `LedgerEntry` `AUTO_IMPORTED`.
  - **Uber/Bolt:** payout-urile din rapoartele confirmate. Plățile se leagă de tranzacțiile bancare prin matching (sumă + dată ± N zile + contrapartidă). **Nu dubla veniturile:** payout-ul bancar și raportul platformei descriu aceeași încasare. Regula exactă de recunoaștere a venitului e **DE CONFIRMAT**; implementeaz-o prin config.
  - **Oblio:** facturile emise, prin integrarea existentă.
  - **Upload cheltuieli:** extracție AI (comerciant, CUI, dată, total, produse), apoi propunere de matching cu tranzacția bancară. Utilizatorul confirmă.
  - **Raport Z:** extracție (dată, nr. Z, total), apoi `LedgerEntry` `INCOME` / `CASH` / `CASH_Z`. Permis doar dacă `CashRegisterState.Status = ACTIVE` la data raportului.
- **Clasificare:** întâi reguli deterministe (`ExpenseCategoryRule`: pattern contrapartidă sau MCC, apoi categorie). LLM-ul e doar sugestie, cu status `NEEDS_REVIEW`.
- **Deductibilitate:** `DeductibilityService.Resolve(entry)` ia setarea `vehicle_deductibility` **valabilă la data cheltuielii** și `ExpenseCategoryRule`. Amortizarea și alte cazuri speciale se tratează ca `SPECIAL_RULE` (**DE CONFIRMAT**), nu prin procentul auto.
- **Job zilnic** (background) care rulează importatorii pentru toate PFA-urile active.
- Importurile care cad într-o perioadă `CLOSED` **nu** modifică luna. Intră în `NEEDS_REVIEW` cu flag „perioadă închisă”.

## B7 – Registre (RJIP, REF, Registru-inventar)

- Registrele sunt **proiecții** din ledger. Nu se stochează ca documente, doar exporturile generate la cerere.
- **RJIP (14-1-1/b):**
  - cronologic, fiecare operațiune distinctă;
  - coloane conform modelului oficial OMFP 170/2015 (dată, document, felul operațiunii, încasări / plăți pe numerar și bancă);
  - totaluri lunare.
  - Include **sumele efectiv încasate sau plătite** (de ex. 1.000 lei service).
- **REF (model OMFP 3254/2017):**
  - an, rectificare, sursa/categoria venitului, element de calcul, valoare;
  - elementele de calcul: venit brut, cheltuieli deductibile, venit net. Denumirile exacte se iau din modelul oficial, fără să fie inventate.
  - Folosește **sumele deductibile** (de ex. 500 din 1.000 la 50%).
  - Status `CURRENT` / `FINAL` (după închiderea anului) / `INTERMEDIATE` (la o dată dată).
- **Registru-inventar (14-1-2/b):** din `Asset`, la începutul activității, la sfârșitul anului și la încetare.
- **Export:**
  - PDF cu QuestPDF (existent în proiect): layout apropiat de modelul oficial, antet PFA și CUI;
  - Excel cu ClosedXML.
- **Model oficial:** dacă nu ai coloanele exacte din OMFP, oprește-te și cere modelul (PDF-urile OMFP 170/2015 și OMFP 3254/2017) înainte de layout.

**Teste:** exemplul din secțiunea 5.3 apare corect în RJIP și REF.

## B8 – Perioade, inactivare, dosar de predare, retenție

- **`close period`:** marchează `CLOSED`, trece intrările în `LOCKED` și blochează orice scriere din importatori sau utilizatori. Corecția se face doar prin `PeriodCorrection` (ADMIN / ACCOUNTANT, motiv obligatoriu, audit).
- **`deactivate`:** setează `PfaAccountingEngagement.EndDate` și `INACTIVE`. Importatorii ignoră operațiunile de după `EndDate`. Dosarul devine read-only.
- **Dosar de predare** (job): ZIP cu structura exactă din documentul clientului, secțiunea 13:
  - `RIDElance_PFA_{CUI}_{an}.zip`;
  - RJIP și REF (**`INTERMEDIATE`**, dacă anul nu e închis);
  - ultimul Registru-inventar disponibil;
  - ledger-ul în Excel;
  - documentele originale pe subfoldere;
  - declarațiile (XML + PDF) și recipisele;
  - `Sumar_predare.pdf`.
- **Retenție:** `RetentionService.MinimumRetentionUntil(documentYear) = (documentYear + 1)-07-01 + 5 ani − 1 zi` (pentru 2026 → 30.06.2032), din config.
  - Nicio ștergere automată. Anularea abonamentului nu atinge datele contabile.
  - Endpoint de purge **nu** se implementează în V1.

## B9 – Integrare frontend ↔ backend

- Implementează `http` în `accountingApi`, apoi rulează din nou toate scenariile de acceptanță F2–F7 pe API-ul real, cu seed-ul din fixtures.
- Testele e2e (Playwright, dacă există în proiect) acoperă:
  - procesarea lunii și rezolvarea celor 3 excepții;
  - generarea, validarea, recipisa și rectificativa;
  - exportul RJIP.
- Flag-ul de mock rămâne disponibil doar în dev.

---

## 5. Exemple de referință (devin teste)

### 5.1 Luna standard (Ion Popescu, august 2026)

| Intrare | Valoare |
|---|---|
| Venituri Bolt / Uber | 8.000 / 5.000 (nu intră în D100/D301) |
| Comision Bolt (Bolt Operations OÜ, EE) | 1.000 |
| Comision Uber | 600 |

| Declarație | Rezultat |
|---|---|
| D100 | 1.000 × 2% = **20** (+ Uber după cota confirmată) |
| D301 | 1.000 × 21% + 600 × 21% = 210 + 126 = **336** |
| D390 | S / EE / Bolt / 1.000; S / {țara Uber} / Uber / 600; de plată **0** |

### 5.2 Deductibilitate cu schimbare de regulă

Setare: `01.01.2027–30.06.2027 → 50%`, `de la 01.07.2027 → 100%`.

- service 1.000 lei pe 15.03.2027 → deductibil 500;
- service 1.000 lei pe 15.08.2027 → deductibil 1.000.

### 5.3 O zi în RIDElance (10.10.2026, deductibilitate 100%, cash activ)

| Operațiune | Ledger | RJIP | REF |
|---|---|---|---|
| OMV Petrom −300 (bancă) | EXPENSE, combustibil, auto, 300 / 300 | Plată bancă 300 | Cheltuieli deductibile +300 |
| Bolt payout +1.850 (bancă) | INCOME, BOLT, 1.850 | Încasare bancă 1.850 | Venit brut (după regula de recunoaștere **DE CONFIRMAT**) |
| Raport Z nr. 125, 420 | INCOME, CASH_Z, 420 | Încasare numerar 420 | Venit brut +420 |

---

## 6. Puncte DE CONFIRMAT cu contabilul (implementate ca config, nu hardcodate)

1. Cota D100 pentru entitatea Uber (convenția RO–NL) și documentele necesare.
2. Momentul declarării D100 pentru comisionul reținut de platformă.
3. Data exigibilității TVA pentru facturile lunare de comision (luna serviciului sau luna facturii).
4. Sursa și data cursului valutar (BNR, ce zi) pentru D301 și D100.
5. Regulile de rotunjire per declarație.
6. Procedura de corecție D100 (rectificativă sau D710).
7. Regula `D100_RENT_INDIVIDUAL`: bază, cotă, sursa datelor.
8. Recunoașterea venitului în ledger: payout net sau venit brut din raport, plus comisionul ca cheltuială.
9. Cheltuielile auto cu regim special (amortizare etc.).
10. Coloanele exacte RJIP / REF / Registru-inventar, confirmate din modelele OMFP oficiale.
11. Semnarea: contabilul semnează ca împuternicit pentru fiecare PFA? Dacă da, trebuie evidențiată împuternicirea per PFA.
12. Termenul de retenție (5 ani de la 1 iulie a anului următor).

---

## 7. Decizii

Luate după F0 (2026-09-26). Au prioritate față de textul de mai sus acolo unde diferă.

1. **Fixtures:** 32 de PFA-uri: 30 active în `2026-08` și 2 inactive, al căror angajament s-a încheiat înainte de august.
2. **Cota D100 neconfirmată blochează D100** (regula din B2 rămâne). În fixtures profilul Uber e confirmat cu o cotă de 0%, etichetată explicit „fixture – de înlocuit”, ca Ion Popescu să dea D100 = 20. Testul de scenariu verifică separat că o cotă neconfirmată blochează luna.
3. **Blocarea documentelor începe de la `VALIDATED`** (§3.1), nu de la recipisă. O rectificativă deschisă (`GENERATED`) care include documentul îl deblochează pentru corecție. Textul din B5 a fost aliniat.
4. **Documentele nu sunt pre-confirmate.** Procesarea lunii le duce în `PENDING_CONFIRMATION` (sau `NEEDS_REVIEW`). În F3 există la nivel de lună butonul „Confirmă documentele fără probleme” (`POST /periods/{period}/confirm-clean-documents`), după care ies 27 gata / 2 de verificat / 1 document lipsă.
5. **`D100Rule` sunt doar 2:** `D100_COMMISSION_NONRESIDENT` și `D100_RENT_INDIVIDUAL`. „Cele 3” din B0 era o greșeală.
6. **Dovada de fiscalizare** se încarcă prin `POST /pfas/{pfaId}/cash/evidence` (multipart) → `{ documentId }`, trimis apoi ca `evidenceDocumentId` la tranziția cash spre `ACTIVE`.

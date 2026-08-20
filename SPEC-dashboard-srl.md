# SPEC — Restructurare Dashboard SRL

**Status:** draft pentru implementare
**Executor:** Claude Code
**Mod de lucru:** 2 faze obligatorii — **FAZA 1 = frontend static (fără funcționalitate)**, **FAZA 2 = backend + wiring**. Nu treci la FAZA 2 până când FAZA 1 nu e completă și acceptată.

---

## 0. Context și reguli de lucru

### 0.1 Ce e acum
Dashboard-ul de firmă există sub numele **„Flotă / Închirieri auto”** și are doar: Acasă, Mașinile mele, Închirieri, Documente societate, Mentenanță, Pagina firmei, Beneficii, Setări.

### 0.2 Ce vrem
Se numește **Dashboard SRL** și devine paritar cu **Dashboard PFA** (profil, servicii, contabilitate, conexiuni, suport), plus lucruri specifice de firmă (logo public, mini-site, mașini listate în marketplace cu identitatea firmei).

### 0.3 Reguli non-negociabile

1. **HTML-urile atașate sunt DOAR referință de structură și de flux.** Nu se copiază markup, nu se copiază CSS, nu se copiază paleta hardcodată. Implementarea e **React + MUI**, cu design tokens din tema existentă.
2. **Dashboard-ul PFA e sursa vizuală de adevăr.** Orice pagină „la fel ca la PFA” trebuie să folosească **exact aceleași componente**, nu clone. Dacă o componentă e azi legată de PFA, se extrage în `shared/` și se parametrizează pe `ownerType`.
3. **Zero duplicare de module.** Nu se creează `SrlInvoices`, `SrlBankAccount`, `SrlSupport` etc. Se generalizează cele existente.
4. **FAZA 1 nu atinge backend-ul.** Fără endpoint-uri noi, fără migrații, fără fetch. Doar mock-uri tipate.
5. **Nu regresa dashboard-ul PFA.** Orice refactor de componentă comună trebuie verificat pe ambele dashboard-uri.
6. Comite pe pași mici, un commit per secțiune din spec, mesaje în engleză.

### 0.4 Înainte de orice linie de cod
Citește și rezumă în `NOTES-srl-restructure.md`:
- structura rutelor și a layout-ului din dashboard-ul PFA (sidebar, categorii colapsabile, topbar);
- componentele comune deja existente (`Amount`, `chartTheme.ts`, card-uri, tabele, empty states);
- cum e modelat azi tipul de cont/owner în FE și BE;
- unde se generează cardurile de mașină din marketplace.

Rezumatul ăsta e input pentru restul implementării. Dacă găsești divergențe față de spec, semnalează-le înainte de a improviza.

---

## 1. Redenumire și terminologie (se face prima, e refactor mecanic)

### 1.1 Tabel de redenumire

| Unde | Acum | Devine |
|---|---|---|
| Titlu dashboard / document title | „RIDElance Fleet — Rental Management” | „RIDElance — Dashboard SRL” |
| Label meniu sidebar | „FLOTĂ / ÎNCHIRIERI AUTO” | „SRL” |
| Selecție tip cont la înregistrare | „Șofer / Flotă” (sau ce e acum) | **„PFA”** și **„SRL”** |
| Copy onboarding / titluri de pas | „flotă”, „închirieri auto” ca nume de rol | „SRL” |
| Enum owner type (FE + BE) | valorile actuale | `Pfa` \| `Srl` |
| Rute | `/dashboard/fleet/*` (sau echivalent) | `/dashboard/srl/*` |

### 1.2 Precizări
- Cuvântul „flotă” **rămâne** acolo unde descrie obiectul, nu tipul de cont: „Mașinile din flotă”, „Utilizare flotă”, badge „Flotă verificată”. Se elimină doar acolo unde ține locul denumirii de cont.
- Rutele vechi se păstrează cu **redirect 301 client-side** către cele noi, minimum 1 release.
- Enum-ul se redenumește în BE cu migrație de mapare a valorilor existente (vezi §7.1). În FAZA 1 doar tipurile FE.

**DoD 1:** grep pe repo nu mai găsește „Fleet dashboard”, „Închirieri auto” ca denumire de cont; înregistrarea afișează PFA / SRL; rutele vechi redirecționează.

---

## 2. Sidebar — structură nouă

### 2.1 Ordine finală

```
[Brand RIDElance]
[label: SRL]

  Acasă

  ── Flotă ──────────────────
  Mașinile mele        (count)
  Închirieri           (count)
  Mentenanță           (count, warn)

  ── Firmă ──────────────────
  Profil
  Pagina firmei
  Documente societate
  Servicii

  ── Financiar ──────────────
  Contabilitate
    └ Cont bancar
    └ Facturi

  ── Platformă ──────────────
  Conexiuni
  Beneficii
  Suport

──────────────────────────────
  Setări                      ← deasupra blocului de firmă
  [avatar/logo] TUKI GO SRL
                Flotă verificată ✓
```

### 2.2 Cerințe
- Categoriile colapsabile folosesc **exact același pattern** ca în sidebar-ul PFA (aceeași componentă, aceeași persistență a stării, aceleași tokens).
- **Setări iese din lista de navigație** și se mută în zona de jos, ca ultim item **deasupra** blocului cu logo + nume firmă. E un item de navigație normal, cu stare activă, nu un buton secundar.
- Blocul de firmă din subsol: avatar circular cu **logo-ul firmei** (fallback: inițiale pe fundal din paletă, derivat determinist din nume), denumire, badge de verificare. Click pe bloc → `/dashboard/srl/profil`.
- Count-urile din FAZA 1 vin din mock.
- Sidebar-ul rămâne colapsabil dacă PFA-ul e colapsabil; comportament identic.

**DoD 2:** sidebar-ul SRL și cel PFA folosesc aceeași componentă de layout, diferă doar prin configul de meniu.

---

## 3. Pagini noi (paritate cu PFA)

Pentru fiecare: **refolosește componenta PFA**, nu rescrie. Diferențele sunt listate explicit mai jos; ce nu e listat rămâne identic.

### 3.1 Profil — `/dashboard/srl/profil`
Identică cu Profil din PFA, cu adaptări de entitate juridică:
- **Avatar = logo firmă.** Uploader-ul spune explicit, în UI: *„Recomandat: logo-ul firmei, nu o fotografie personală.”*
  - acceptă `png`, `jpg`, `webp`, `svg`; max 2 MB; minim 256×256; crop pătrat cu preview în cerc;
  - preview live în 3 contexte: sidebar, card mașină (§5), mini-site;
  - fallback determinist pe inițiale (max 2 litere).
- Câmpuri: denumire, CUI, nr. Reg. Com., reprezentant legal, sediu social, telefon, email, website, descriere publică.
- Secțiune „Vizibilitate publică” cu toggles (telefon / email / WhatsApp / locație) — dacă există deja pe „Pagina firmei”, se **mută aici** și pagina firmei le consumă, ca să nu fie în două locuri.
- Nu duplica datele companiei din Setări. Setările păstrează doar preferințe operaționale (valori implicite închiriere, notificări); datele de identitate trăiesc în Profil. Migrează câmpurile de identitate din Setări în Profil și lasă în Setări un link.

### 3.2 Servicii — `/dashboard/srl/servicii`
Identică cu Servicii din PFA (aceeași listă, aceleași carduri, aceeași stare de activare). Fără diferențe funcționale în această fază. Dacă un serviciu e PFA-only, se ascunde pe baza `ownerType`, nu se șterge.

### 3.3 Contabilitate — `/dashboard/srl/contabilitate`
Același layout, aceeași navigație internă, aceleași componente ca la PFA. Sub-pagini:

| Sub-pagină | Comportament |
|---|---|
| **Cont bancar** | **Identic cu PFA.** Aceeași componentă, aceleași stări (neconectat / conectat / eroare / sincronizare), același model de tranzacții. |
| **Facturi** | **De construit** (nu există încă nici la PFA sau e incompletă). Se construiește o singură dată, în `shared/`, folosită de ambele dashboard-uri. Vezi §3.3.1. |
| **Fiscal / obligații** | Layout ca la PFA, conținut adaptat SRL — vezi §3.3.2. |

#### 3.3.1 Pagina Facturi (FAZA 1 — doar UI)
- Listă cu: serie+număr, dată emitere, dată scadență, client, valoare fără TVA, TVA, total, status (`draft` / `emisă` / `trimisă` / `plătită` / `restantă` / `stornată`), sursă (`RIDElance` / `Oblio`).
- Filtre: perioadă, status, client, sursă. Search pe număr și client.
- KPI row: total emis luna curentă, încasat, restant, nr. facturi.
- Acțiuni per rând: preview PDF (modal), descărcare, marchează ca plătită, stornare, trimite pe email.
- CTA principal: „Factură nouă” → drawer cu formular (client, linii de factură, cotă TVA, scadență, observații). În FAZA 1 doar validare locală + toast, fără persistență.
- Empty state distinct de „niciun rezultat la filtre”.
- Sumele folosesc componenta `Amount` cu cifre tabulare (Geist), consecvent cu dashboard-ul PFA.

#### 3.3.2 Diferențe SRL față de PFA — **ASUMPȚIE, de confirmat**
Ce dispare: Declarația Unică, CASS/CAS pe venit net, plafoane PFA, contribuții personale.
Ce apare: regim fiscal (micro / impozit pe profit), plătitor de TVA (da/nu + periodicitate), obligații declarative ca listă cu termene (D100, D101, D300, D394, D112), impozit estimat pe trimestru.
**Până la confirmare:** implementează layout-ul și cardurile, populează din mock, marchează blocul cu `// TODO: confirm SRL fiscal rules` și nu implementa niciun calcul real. Nu inventa formule fiscale.

### 3.4 Conexiuni — `/dashboard/srl/conexiuni`
Aceeași componentă ca la PFA (grid de carduri de integrare). În această fază, **doar 3 integrări**:

| Integrare | Ce afișează | Acțiuni |
|---|---|---|
| **Oblio** | status conectare, CIF asociat, serie facturi implicită, ultima sincronizare | Conectează (API key + email) / Deconectează / Sincronizează acum |
| **Bancă** | banca, IBAN mascat, data expirării consimțământului (90 zile), ultima sincronizare | Conectează / Reînnoiește consimțământul / Deconectează |
| **eldrive** | status cont, card/RFID asociat, ultima sesiune de încărcare | Conectează / Deconectează |

- Restul integrărilor (dacă există în PFA) se ascund în spatele unui feature flag, nu se șterg din cod.
- Fiecare card are 4 stări vizuale: `neconectat`, `conectat`, `expiră curând`, `eroare`. Stări identice cu PFA.
- FAZA 1: dialogurile de conectare sunt UI complet, submit → toast, fără request.

### 3.5 Suport — `/dashboard/srl/suport`
Identică cu Suport din PFA. Fără diferențe.

**DoD 3:** cele 5 tab-uri există, se navighează, arată complet cu mock data, folosesc componente partajate, nu fac niciun request.

---

## 4. Identitatea firmei pe platformă

### 4.1 Card de mașină în marketplace
Fiecare card de mașină din listing-ul public primește un **bloc de proprietar**:

```
[◯ logo 28px]  TUKI GO SRL  ✓
```

- Poziție: în corpul cardului, sub titlu/preț, deasupra CTA. Nu peste imagine.
- Avatar circular 28px (32px pe pagina de detaliu), fallback pe inițiale.
- Nume trunchiat cu ellipsis la 1 rând; tooltip cu numele complet.
- Badge de verificare doar dacă firma e verificată.
- **Click pe avatar sau pe nume → mini-site-ul firmei** (`/f/{slug}`), într-un tab nou de pe marketplace. Elementul e un `<a>` real, oprește propagarea către link-ul cardului de mașină, are `aria-label` explicit.
- Se aplică **și la PFA**, nu doar SRL — componenta primește `{ ownerId, ownerType, displayName, logoUrl, slug, verified }` și e agnostică.
- Aceeași componentă se refolosește pe pagina de detaliu a mașinii.

### 4.2 Mini-site firmă
Rămâne cum e (`Pagina firmei`), dar consumă logo-ul din Profil (§3.1) și toggles-urile de vizibilitate din Profil. Slug-ul e stabil și unic; dacă se schimbă denumirea, slug-ul nu se schimbă automat (doar manual, cu avertisment despre linkuri rupte).

---

## 5. Marketplace — sortarea „Recomandate”

### 5.1 Comportament
- Pagina de mașini se deschide implicit, fără niciun filtru aplicat, pe **„Recomandate”**.
- Opțiuni de sortare: `Recomandate` (default), `Cele mai noi`, `Preț crescător`, `Preț descrescător`.
- Sortarea implicită se resetează la „Recomandate” când utilizatorul dă clear la filtre.

### 5.2 Scor intern (`recommendation_score`)
Scor 0–100, calculat pe backend, **stocat pe anunț** (nu calculat la fiecare request), recalculat la salvarea anunțului + printr-un job nocturn (pentru componenta de prospețime).

**Valorile de mai jos sunt punct de plecare; toate stau în `appsettings` sub `Marketplace:Scoring`, ca să poată fi reglate fără deploy de cod.**

| Criteriu | Condiție | Puncte |
|---|---|---|
| Descriere | ≥ 200 caractere, text real | 30 |
| Descriere parțială | 60–199 caractere | 15 |
| Fotografii | ≥ 6 poze | 15 |
| Fotografii | 3–5 poze | 8 |
| Reducere activă | preț redus setat și valabil | 20 |
| Locație pe hartă | pin setat (nu doar oraș text) | 10 |
| Dosar vehicul complet | ≥ 80% completare | 10 |
| Disponibilitate | „Disponibilă acum” | 5 |
| Proprietar verificat | badge de verificare activ | 5 |
| Logo setat | proprietarul are logo/avatar | 5 |

**Penalizări / multiplicatori:**
- Prospețime: `×1.0` dacă a fost actualizat în ultimele 7 zile, `×0.9` la 8–30 zile, `×0.75` peste 30 de zile.
- Anunțurile marcate „Momentan indisponibilă” nu apar în „Recomandate” decât după cele disponibile, indiferent de scor.
- Anunțurile suspendate / expirate sunt excluse.

**Reguli de sortare:** `score DESC, updated_at DESC, id ASC` — determinist, ca să nu sară rândurile la paginare.

**Anti-abuz:** descrierea se validează minimal (nu doar spații/caractere repetate); pozele duplicate (hash identic) se numără o singură dată.

**Vizibil pentru proprietar:** în dashboard, pe cardul mașinii, un indicator „Scor anunț: 72/100” + listă de sugestii concrete („Adaugă 3 poze: +7”, „Setează locația pe hartă: +10”). Scorul brut nu se expune public.

---

## 6. FAZA 1 — Frontend static

### 6.1 Livrabile
1. Rute noi + redirecturi (§1).
2. Sidebar restructurat (§2).
3. Cele 5 secțiuni noi de pagini, complet randate din mock (§3).
4. Uploader de logo cu preview în 3 contexte, fără upload real (§3.1).
5. Componenta de proprietar pe cardul de mașină, în marketplace și pe detaliu (§4.1).
6. Selector de sortare cu „Recomandate” default; mock-ul e deja sortat după un `score` fals (§5).
7. Indicatorul de scor + sugestii pe cardul din dashboard.

### 6.2 Constrângeri
- Mock-urile stau în `**/mocks/*.mock.ts`, tipate cu aceleași tipuri pe care le va folosi FAZA 2. Un singur loc de unde se importă, ca înlocuirea cu API să fie o singură modificare per pagină.
- Fără `fetch` / `axios` / react-query în FAZA 1. Loading și error states se randează totuși, controlate de un flag local, ca să existe UI-ul.
- Toate acțiunile: `toast.info("Disponibil după conectarea backend-ului")`.
- Fără `localStorage` pentru date de business; doar pentru preferințe UI dacă PFA-ul face deja asta.
- Responsive: identic cu breakpoint-urile din PFA.
- A11y: focus vizibil, `aria-label` pe iconuri, navigație cu tastatura în sidebar și în tabele.

### 6.3 Direcție vizuală
Layout-ul și ierarhia din HTML-urile atașate sunt corecte — densitate mare, carduri cu bordură subțire, KPI row sus, panel-uri cu head + body, tabele curate. **Ce nu se preia:** stilul lor concret. Fără gradient albastru pe progress bar, fără iconuri din caractere unicode (`⌂ ▣ ▤ ◇ ⚙`), fără culori hardcodate, fără shadow-uri random.

În schimb:
- iconuri din setul deja folosit în PFA (consecvent, un singur set);
- culori, spacing, radius, elevation **doar** din tema MUI existentă;
- tipografie identică cu PFA, `Amount` cu cifre tabulare pentru orice sumă;
- stările (success / warn / info / error) prin `Chip`-uri tematizate, nu clase ad-hoc;
- densitatea din PFA e referința, nu cea din HTML-uri (HTML-urile sunt la scară redusă artificial, cu font-size de 8–10px — nu reproduce asta).

**DoD FAZA 1:** aplicația se navighează integral ca dashboard SRL, arată coerent cu PFA, nu face niciun request, `npm run build` și lint-ul trec, dashboard-ul PFA e neatins funcțional.

---

## 7. FAZA 2 — Backend

Se pornește doar după acceptarea FAZEI 1. Arhitectură: .NET Clean Architecture, aceleași convenții ca restul proiectului (comenzi/queries, validatoare, mapping, teste).

### 7.1 Model de date

**Migrații:**
- `OwnerType`: enum cu `Pfa` / `Srl`, migrație de mapare a valorilor existente. Fără pierdere de date, cu script de rollback.
- `CompanyProfile` (sau extinderea entității existente): `LogoUrl`, `Slug` (unic, index), `LegalName`, `Cui`, `RegCom`, `LegalRepresentative`, `RegisteredOffice`, `PublicDescription`, `VisibilityFlags` (telefon/email/whatsapp/locație), `IsVerified`.
- `VehicleListing`: `RecommendationScore` (int), `ScoreComputedAt` (timestamp), index pe `(IsPublished, IsAvailable, RecommendationScore DESC, UpdatedAt DESC, Id)`.
- `Invoice` + `InvoiceLine`: serie, număr, dată emitere/scadență, client (denumire, CUI/CNP, adresă), linii (descriere, cantitate, preț unitar, cotă TVA), totaluri, status, sursă, `ExternalId` (Oblio), `PdfUrl`.
- `Integration` / `Connection`: `Provider` (`Oblio` / `Bank` / `Eldrive`), `Status`, `ConnectedAt`, `ExpiresAt`, `LastSyncAt`, `Config` (jsonb, criptat pentru secrete), FK pe owner.
- Reutilizează `BankConnection` / `BankAccount` / `BankTransaction` existente (abstracția `IBankDataProvider`) — nu crea structuri paralele.

**Regulă:** toate entitățile sunt legate de owner prin aceeași cheie, cu `OwnerType` discriminator. Zero tabele `Srl*` separate.

### 7.2 Endpoint-uri (schiță)

```
GET    /api/srl/profile
PUT    /api/srl/profile
POST   /api/srl/profile/logo            (multipart, validare tip+dimensiune, resize server-side)

GET    /api/accounting/invoices          ?from&to&status&client&source&page
POST   /api/accounting/invoices
GET    /api/accounting/invoices/{id}
GET    /api/accounting/invoices/{id}/pdf
POST   /api/accounting/invoices/{id}/mark-paid
POST   /api/accounting/invoices/{id}/storno
POST   /api/accounting/invoices/{id}/send

GET    /api/connections
POST   /api/connections/{provider}/connect
POST   /api/connections/{provider}/sync
DELETE /api/connections/{provider}

GET    /api/marketplace/vehicles         ?sort=recommended|newest|price_asc|price_desc&...
GET    /api/vehicles/{id}/score          (owner-only: scor + sugestii)
```

Autorizare: fiecare endpoint verifică ownership-ul; un SRL nu poate citi datele altui owner. Testează asta explicit.

### 7.3 Scoring
- `IRecommendationScoreCalculator` în Application, pur, testabil, cu ponderi din config.
- Recalculare la: creare/editare anunț, upload/ștergere poze, schimbare disponibilitate, verificare proprietar, setare logo.
- Job nocturn (Hangfire/BackgroundService, ce e deja în proiect) care recalculează componenta de prospețime în batch.
- Teste unitare: minimum un test per criteriu + un test de determinism al ordinii.

### 7.4 Wiring frontend
Se înlocuiesc mock-urile pagină cu pagină, un PR per pagină, cu loading/error/empty deja existente din FAZA 1.

**DoD FAZA 2:** toate paginile consumă date reale, migrațiile rulează curat pe o bază copie de producție, testele trec, marketplace-ul sortează după scor real.

---

## 8. Out of scope (nu implementa acum)

- Facturare recurentă, e-Factura / SPV, integrare ANAF.
- Salarizare, contracte de muncă, administrator.
- Restul integrărilor din Conexiuni în afară de cele 3.
- Modificări la fluxul de „Adaugă mașină” (rămâne cum e; doar câștigă indicatorul de scor la final).
- Aplicație mobilă, notificări push.
- Plăți online între chiriaș și firmă.

---

## 9. Întrebări deschise (răspunde înainte de §3.3.2)

1. Ce anume se schimbă concret la Contabilitate SRL față de PFA? (regim micro vs. profit, TVA, declarații) — până la răspuns, doar layout + mock.
2. Pagina Facturi există deja la PFA într-o formă, sau se construiește de la zero pentru amândouă?
3. Serviciile din PFA se aplică toate și la SRL, sau unele sunt PFA-only?
4. Verificarea firmei („Flotă verificată”) e manuală azi sau are flux? Scorul depinde de ea.
5. Slug-ul mini-site-ului se generează din denumire sau îl alege utilizatorul?

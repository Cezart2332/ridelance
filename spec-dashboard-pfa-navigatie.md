# SPEC — Restructurare navigație și pagini Dashboard PFA (RIDElance)

> **Sursă:** cerință de produs „Reorganizare meniu și structură pagini" (client/PM).
> **Audiență:** agent de implementare (Claude Code) + reviewer uman.
> **Status:** draft de implementare. Secțiunea 13 conține întrebările care blochează anumite părți.

---

## 0. Reguli pentru agent

1. **Nu inventa căi, nume de componente sau endpoint-uri.** Spec-ul folosește nume propuse; înainte de orice PR rulează Faza 0 (§4) și mapează numele propuse peste cele reale din repo. Dacă un nume real diferă, câștigă cel din repo.
2. **Nu rescrie funcționalitate existentă** care nu e cerută explicit aici. Multe pagini se *mută*, nu se refac. O mutare corectă = același comportament, altă rută.
3. **Zero duplicare de calcul.** Dacă ai nevoie de o valoare care există deja pe Acasă, extrage sursa comună; nu recalcula (§2.1).
4. **PR-uri atomice**, în ordinea din §12. Fiecare PR trebuie să compileze, să treacă lint + build + testele existente și să nu lase rute moarte.
5. **Nu implementa** integrarea Open Banking și nici sincronizarea de facturi. Sunt explicit „În curând" (§7.4, §7.5, §8.4).
6. Când ceva e ambiguu și afectează schema de date sau un contract API, **oprește-te și întreabă**, nu ghici.

---

## 1. Obiectiv

Sidebar-ul actual al Dashboard-ului PFA e o listă plată de pagini individuale, care nu mai scalează. Îl restructurăm în **categorii principale cu dropdown/collapse**, astfel încât adăugarea de pagini noi să nu mai aglomereze meniul.

Modelul mental pe care trebuie să-l comunice navigația:

| Secțiune | Întrebarea la care răspunde |
|---|---|
| Acasă | Cum merge activitatea mea? |
| Contabilitate | Cum stau cu banii, cheltuielile și taxele? |
| Documente | Sunt actele mele în regulă? |
| Conexiuni | Ce servicii sunt conectate la RIDElance? |
| Beneficii | Ce avantaje primesc prin RIDElance? |
| Servicii | Ce pot cumpăra/folosi prin RIDElance? |
| Suport | Am nevoie de ajutor din partea RIDElance. |
| Profil | Datele și setările contului meu. |

O funcționalitate trăiește **într-un singur loc**. Acasă e rezumatul, paginile dedicate sunt detalierea.

---

## 2. Principii non-negociabile

### 2.1. Date reutilizate, nu duplicate

„Încasări nete" de pe Acasă și „Încasări nete" din Situație financiară provin din **aceeași sursă și același calcul**. Idem pentru taxe estimate, profit real estimat, cheltuieli și documentele preluate din onboarding. Diferă doar nivelul de prezentare.

Concret:
- calculele financiare stau într-un singur serviciu pe backend (`IFinancialSummaryService` sau echivalentul existent — verifică);
- frontend-ul consumă un singur hook/query per domeniu (`useFinancialSummary(filters)`), nu două implementări;
- dacă în cod există deja logică duplicată între componente, **acest PR e momentul să o unifici** — dar doar pentru valorile atinse de spec.

### 2.2. Logica temporală se face în C#, nu în LLM și nu în frontend

Toate calculele de tip „expiră în X zile", „termen depășit", validare de dată extrasă din document se fac server-side cu `DateOnly` și cultura `ro-RO` explicită. LLM-ul/OCR-ul returnează **string-uri brute**; parsarea, validarea și aritmetica sunt în C#. Frontend-ul primește statusul deja calculat, nu îl deduce.

### 2.3. Estimările RIDElance ≠ obligațiile contabilului

Orice valoare calculată de platformă trebuie marcată vizual și textual ca **estimare**. Orice valoare stabilită/depusă de contabilă e o **obligație reală**. Nu apar niciodată amestecate în aceeași listă (§7.3).

### 2.4. Nu cerem de două ori același document

Documentele colectate în onboarding se preiau automat. „Lipsește" se afișează doar când chiar nu există înregistrare (§8).

---

## 3. Scope

**Intră:**
- structura de navigație + componenta de sidebar + rutare + redirect-uri;
- mutarea paginilor existente sub noile categorii (Bolt, Uber, OBLIO, Beneficii, Servicii*, Suport, Istoric plăți, Chat contabil);
- pagini noi: Situație financiară, Cheltuieli (cu OCR), Taxe & declarații, cele 3 pagini de Documente;
- stub-uri „În curând": Cont bancar, Facturi, Bancă;
- restructurarea paginii Profil.

**Nu intră:**
- redesign-ul paginii Acasă (rămâne exact cum e);
- redesign-ul paginii Beneficii (a fost transmisă separat către IT);
- refacerea funcțională a paginilor din Servicii;
- integrarea efectivă Open Banking;
- sincronizarea reală de facturi.

---

## 4. Faza 0 — Recon (obligatorie înainte de PR 1)

Produ un fișier `docs/nav-restructure-inventory.md` cu:

1. Fișierul de rutare curent și prefixul real al rutelor de dashboard (`/dashboard`? `/pfa`? altceva).
2. Componenta actuală de sidebar + unde e definită lista de linkuri.
3. Pentru fiecare pagină existentă menționată în spec: cale fișier + rută curentă.
4. Unde se calculează azi: încasări nete, comision platforme, profit real estimat, „cât trebuie să pui deoparte", cheltuieli. Backend + frontend.
5. Componentele reutilizabile existente: carduri KPI, „De unde vin banii", graficele, filtrele de perioadă/platformă.
6. Modelul de documente din onboarding: entitate, storage, cum se leagă de tipurile de document.
7. Sistemul de iconițe și cel de feature flags (dacă există).

**Nu începe PR 1 înainte ca acest inventar să fie complet.** Dacă un punct nu are răspuns în cod, notează-l explicit ca necunoscut.

---

## 5. Structura de navigație

### 5.1. Config canonic

Sursa unică de adevăr pentru meniu — un singur fișier, tipat, fără linkuri hardcodate prin componente:

```ts
// src/config/navigation.ts  (adaptează calea la structura reală)

export type NavLeaf = {
  id: string;
  label: string;
  path: string;
  badge?: 'coming-soon';
};

export type NavGroup = {
  id: string;
  label: string;
  icon: IconKey;
  children: NavLeaf[];
};

export type NavEntry =
  | ({ kind: 'link'; icon: IconKey } & NavLeaf)
  | ({ kind: 'group' } & NavGroup)
  | { kind: 'separator' }
  | { kind: 'action'; id: string; label: string; icon: IconKey };

export const PFA_NAV: NavEntry[] = [
  { kind: 'link', id: 'home', label: 'Acasă', icon: 'home', path: '/dashboard' },

  { kind: 'group', id: 'accounting', label: 'Contabilitate', icon: 'calculator', children: [
    { id: 'financial-overview', label: 'Situație financiară', path: '/dashboard/contabilitate/situatie-financiara' },
    { id: 'expenses',           label: 'Cheltuieli',          path: '/dashboard/contabilitate/cheltuieli' },
    { id: 'taxes',              label: 'Taxe & declarații',   path: '/dashboard/contabilitate/taxe-declaratii' },
    { id: 'bank-account',       label: 'Cont bancar',         path: '/dashboard/contabilitate/cont-bancar', badge: 'coming-soon' },
    { id: 'invoices',           label: 'Facturi',             path: '/dashboard/contabilitate/facturi',     badge: 'coming-soon' },
    { id: 'accountant-chat',    label: 'Chat contabil',       path: '/dashboard/contabilitate/chat-contabil' },
  ]},

  { kind: 'group', id: 'documents', label: 'Documente', icon: 'file-text', children: [
    { id: 'docs-personal', label: 'Documente personale', path: '/dashboard/documente/personale' },
    { id: 'docs-pfa',      label: 'Documente PFA',       path: '/dashboard/documente/pfa' },
    { id: 'docs-vehicle',  label: 'Documente mașină',    path: '/dashboard/documente/masina' },
  ]},

  { kind: 'group', id: 'connections', label: 'Conexiuni', icon: 'link', children: [
    { id: 'conn-bolt',  label: 'Bolt',  path: '/dashboard/conexiuni/bolt' },
    { id: 'conn-uber',  label: 'Uber',  path: '/dashboard/conexiuni/uber' },
    { id: 'conn-oblio', label: 'OBLIO', path: '/dashboard/conexiuni/oblio' },
    { id: 'conn-bank',  label: 'Bancă', path: '/dashboard/conexiuni/banca', badge: 'coming-soon' },
  ]},

  { kind: 'link', id: 'benefits', label: 'Beneficii', icon: 'star', path: '/dashboard/beneficii' },

  { kind: 'group', id: 'services', label: 'Servicii', icon: 'grid', children: [
    { id: 'svc-cars',          label: 'Mașini',              path: '/dashboard/servicii/masini' },
    { id: 'svc-subscriptions', label: 'Abonamente',          path: '/dashboard/servicii/abonamente' },
    { id: 'svc-individual',    label: 'Servicii individuale', path: '/dashboard/servicii/servicii-individuale' },
    { id: 'svc-insurance',     label: 'Asigurări',           path: '/dashboard/servicii/asigurari' },
  ]},

  { kind: 'separator' },

  { kind: 'link',   id: 'support', label: 'Suport',      icon: 'help-circle', path: '/dashboard/suport' },
  { kind: 'link',   id: 'profile', label: 'Profil',      icon: 'settings',    path: '/dashboard/profil' },
  { kind: 'action', id: 'logout',  label: 'Deconectare', icon: 'log-out' },
];
```

Regulă: **orice link din sidebar vine din acest config.** Dacă apare un `<Link to="...">` hardcodat în sidebar, PR-ul e greșit.

### 5.2. Rutare și redirect-uri

- Rutele de categorie (`/dashboard/contabilitate`, `/dashboard/documente`, `/dashboard/conexiuni`, `/dashboard/servicii`) fac `Navigate replace` către primul copil.
- Toate rutele vechi ale paginilor mutate primesc **redirect permanent** către noua rută. Compilează lista completă în Faza 0; nimic nu rămâne 404.
- `/dashboard/documente/expirari` (sau echivalentul actual) → redirect la `/dashboard/documente/personale`. Subcategoria „Expirări" **dispare** (§8.5).
- Ruta veche a istoricului de plăți → `/dashboard/profil` (ancoră/tab plăți).
- Deep-link direct pe orice subpagină trebuie să funcționeze la refresh, cu categoria părinte deschisă.

---

## 6. Comportamentul sidebar-ului

- Categoriile cu copii sunt colapsabile; **Acasă și Beneficii sunt linkuri directe**, fără dropdown.
- La mount, categoria care conține ruta activă e **întotdeauna deschisă**. Refresh sau revenire pe pagină nu închide dropdown-ul.
- Starea de expand/collapse setată manual de utilizator se persistă (`localStorage`, cheie versionată, ex. `ridelance.pfa.nav.v1`). Persistența nu poate suprascrie regula de mai sus.
- Se permit mai multe categorii deschise simultan (nu accordion exclusiv).
- **Stări vizuale distincte, toate trei:** categorie activă (conține ruta curentă), subpagină activă, hover. Categoria activă rămâne marcată și când e colapsată.
- Badge „În curând" pe item-ele marcate — discret, nu ascunde item-ul.
- Mobile: sidebar în drawer; selectarea unei subpagini închide drawer-ul.
- A11y: butonul de categorie e `<button aria-expanded aria-controls>`, sub-lista e `<ul>`, navigare completă cu tastatura, `focus-visible` vizibil, `aria-current="page"` pe subpagina activă.
- Animația de collapse respectă `prefers-reduced-motion`.

---

## 7. Contabilitate

### 7.1. Situație financiară

Detalierea informațiilor financiare care există deja pe Acasă, organizate exclusiv din perspectivă financiară. **Acasă = rezumat rapid. Situație financiară = analiză detaliată.**

**Conținut:**
- Carduri: Încasări nete, Profit real estimat, Cheltuieli deductibile, Taxe estimate, (opțional) Bani disponibili după taxe.
- „De unde vin banii" — aceeași componentă ca pe Acasă: Bolt, Uber, Cash/Card, total net, comisioane, număr curse.
- Grafic „Evoluție financiară" cu serii comutabile: Încasări nete, Profit real estimat, Cheltuieli, Taxe estimate.
- Filtre identice ca pe Acasă: Săptămâna curentă / Luna curentă / Luna anterioară / An curent / Interval personalizat; și, unde e relevant, Toate / Bolt / Uber.

**Implementare:**
- Extrage filtrele în componente partajate (`<PeriodFilter />`, `<PlatformFilter />`) cu starea sincronizată în query params, ca deep-link-ul să păstreze filtrarea.
- Reutilizează componentele de card și graficele existente. Dacă nu sunt reutilizabile ca atare, extrage-le — nu le clona.

**Acceptanță:** pentru același interval, fiecare valoare comună e **identică cu cea de pe Acasă**, la nivel de bit. Un test care compară cele două surse pentru un set de intervale.

### 7.2. Cheltuieli

Singura pagină cu funcționalitate substanțial nouă. Aici utilizatorul introduce și gestionează cheltuielile deductibile.

**CTA principal:** `+ Adaugă cheltuială`

**Flux:**
```
Încarcă document (foto / PDF / doc)
        ↓
OCR / extragere informații
        ↓
Dată · Furnizor · Sumă · TVA · Categorie  (precompletate)
        ↓
Utilizator confirmă / corectează
        ↓
Cheltuiala este salvată
```

**Model de date (propunere):**

```
Expense
  Id            Guid
  PfaId         Guid
  Date          DateOnly
  SupplierName  string
  Category      ExpenseCategory
  TotalAmount   decimal
  VatAmount     decimal?
  Currency      string          // default RON
  DocumentType  string          // bon fiscal, factură, ...
  DocumentId    Guid?           // fișierul stocat
  Status        ExpenseStatus   // Draft | Confirmed
  Source        ExpenseSource   // Manual | Ocr
  Extraction    json?           // câmpuri brute + confidence per câmp
  CreatedAt / UpdatedAt
```

`ExpenseCategory`: `Combustibil`, `IncarcareEv`, `ServiceReparatii`, `PieseAuto`, `Spalatorie`, `Asigurari`, `TelefonComunicatii`, `Contabilitate`, `Software`, `Altele`.

**Reguli de extragere (critice):**
- LLM/OCR returnează **doar string-uri brute**, câmp cu câmp, plus confidence. Nicio dată calculată, niciun TVA dedus, nicio comparație de date în prompt.
- Parsarea datelor: C#, `DateOnly.TryParseExact` pe formatele RO uzuale (`dd.MM.yyyy`, `dd/MM/yyyy`, `dd-MM-yyyy`, `yyyy-MM-dd`). Dată în viitor sau mai veche de N ani → câmp nevalidat, marcat în UI pentru corecție manuală, **nu respins silențios**.
- Sumele: parsare tolerantă la virgulă/punct zecimal și separator de mii; validare `VatAmount <= TotalAmount`.
- Deduplicare prin hash al fișierului: dacă același document a mai fost încărcat, avertizează în loc să creezi dublură.
- Extragerea eșuată **nu blochează** adăugarea: formularul rămâne complet editabil manual.

**Listă/tabel:** Data · Furnizor · Categorie · Document · Sumă · Status, cu filtre lună/an, categorie, status și căutare. Numerele aliniate la dreapta, cifre tabulare.

**Acceptanță:** doar cheltuielile cu `Status = Confirmed` alimentează Profit real estimat de pe Acasă și din Situație financiară. Adăugarea unei cheltuieli confirmate modifică imediat ambele pagini (invalidare de cache).

### 7.3. Taxe & declarații

Două zone **clar separate vizual**, niciodată amestecate într-o listă comună.

**A. Estimări RIDElance** — aceleași valori ca în „Cât trebuie să pui deoparte" de pe Acasă:
TVA intracomunitar estimat, Taxă nerezident Bolt, Impozit pe venit estimat, CAS/CASS estimat, Total recomandat de pus deoparte.
Filtre: Luna curentă / Luna anterioară / An curent / Interval.
Fiecare valoare poartă eticheta „Estimare" + tooltip care explică pe ce se bazează.

**B. Declarații depuse de contabilă** — obligații reale, în special TVA intracomunitar și Taxa de nerezident.

```
TaxObligation
  Id, PfaId
  Type          TaxObligationType   // TvaIntracomunitar | TaxaNerezident | Altele
  PeriodMonth   int
  PeriodYear    int
  AmountDue     decimal
  DueDate       DateOnly
  Status        // InPregatire | Depusa | DePlata | Platita
  DocumentId    Guid?               // declarație / recipisă / OP
  CreatedBy     // contabil
```

Card afișat:
```
TVA intracomunitar
Iulie 2026

Sumă de plată: 514,21 lei
Termen: 25.08.2026
Status: De plată

[Vezi document]
```

Documentul, dacă există, se poate vizualiza și descărca. Termenul depășit se calculează server-side și se evidențiază.

**Acceptanță:** un utilizator care se uită la pagină trebuie să poată spune, fără să citească documentație, care sumă e calculată de aplicație și care e stabilită de contabilă.

### 7.4. Cont bancar

Afișăm doar datele bancare cunoscute despre PFA (bancă, titular, IBAN mascat, monedă) + status conexiune:

> **Conectarea automată a contului bancar — În curând**

Furnizorul de Open Banking nu e selectat; **nu construim integrarea acum.** Structura UI și modelul trebuie însă să permită ulterior, fără rescriere: buton „Conectează banca", status `Conectat / Necesită reconectare`, ultima sincronizare, sold, tranzacții, identificarea automată a încasărilor Bolt/Uber, reconciliere.

Practic: definește tipurile și layout-ul cu secțiuni goale/dezactivate, fără client de API, fără job de sincronizare, fără dependență de vreun furnizor.

### 7.5. Facturi

Doar empty state, tab păstrat pentru structura viitoare:

> **Facturile tale, într-un singur loc**
> În curând vei putea vedea și gestiona facturile sincronizate direct în RIDElance.

Fără funcționalitate.

### 7.6. Chat contabil

**Se mută din Suport în Contabilitate.** Funcționalitatea rămâne cea existentă — mutare, nu refacere. Antet explicit:

> **Chat contabil**
> Discută direct cu contabilul tău despre taxe, declarații, documente și situația PFA-ului.

Pregătit (nu implementat acum) pentru atașamente: foto, PDF, documente, și pentru răspunsuri legate de o declarație sau o cheltuială anume.

---

## 8. Documente

Renunțăm la organizarea generică actuală. Trei categorii, o singură componentă de card, un registry comun.

### 8.1. Registry de tipuri de document

```ts
type DocumentTypeDef = {
  key: string;                    // 'id-card', 'driving-license', ...
  label: string;
  group: 'personal' | 'pfa' | 'vehicle';
  hasIssueDate: boolean;
  hasExpiryDate: boolean;
  onboardingKey?: string;         // de unde se preia automat
};
```

Cele trei pagini sunt **aceeași componentă** parametrizată cu `group`. Nu scrii trei pagini separate.

### 8.2. Documente personale
Carte de identitate · Permis de conducere · Atestat profesional · Cazier judiciar · Aviz medical · Aviz psihologic.

### 8.3. Documente PFA
Certificat de înregistrare PFA · Certificat constatator · Certificat / document TVA intracomunitar.

### 8.4. Documente mașină
Talon / Certificat de înmatriculare · Carte de identitate a vehiculului · RCA · Asigurare călători și bagaje · CASCO · Copie conformă · Ecuson Uber · Ecuson Bolt.

### 8.5. Card de document

Fiecare document, card sau rând, cu: denumire · status · data emiterii (dacă există) · data expirării (dacă există) · preview · vizualizare · download · înlocuire/actualizare.

Statusuri: `Valid` · `Expiră în X zile` · `Expirat` · `Lipsește`.

```
RCA

Valid până la 14.09.2026
⚠ Expiră în 34 zile

[Vezi document]
```

**Reguli:**
- Documentele din onboarding se preiau automat. `Lipsește` doar când nu există înregistrare. Zero upload duplicat.
- **Nu mai există subcategoria „Expirări".** Expirarea se gestionează lângă document. Șterge ruta, item-ul de meniu și componenta, cu redirect.
- Status și „X zile" calculate server-side (`DateOnly`, `ro-RO`), praguri configurabile, o singură definiție pentru toate cele trei pagini.
- Structura pregătită pentru notificări ulterioare de expirare (§10.5), fără a le implementa acum.

---

## 9. Conexiuni

Doar servicii pe care utilizatorul le recunoaște — fără furnizori tehnici interni.

### 9.1. Bolt
**Se păstrează pagina actuală de conectare API.** Conexiune API, status, ultima sincronizare, **cont Bolt Fleet**, **cont șofer Bolt** — exact în logica deja existentă. Se schimbă doar încadrarea în meniu. Zero modificări de flux funcțional.

### 9.2. Uber
Uber nu are integrarea API folosită la Bolt. Pagina conține:
- **Import date Uber:** upload CSV — selectare fișier, upload, validare, data ultimului import, perioada acoperită de ultimul CSV;
- **Cont Uber Fleet** și **Cont șofer Uber**, în forma existentă în platformă.

### 9.3. OBLIO
Hub al conexiunii, nu doar un buton de API. Afișează: status conexiune API (`Conectat / Neconectat`), firma/PFA conectată, CUI, ultima sincronizare.
Extensibil ulterior, în funcție de ce expune efectiv API-ul OBLIO: număr documente sincronizate, facturi emise, clienți, serii de facturare, statusuri.
**Înainte de a fixa câmpurile, verifică endpoint-urile OBLIO implementate azi** și listează-le în inventar.

### 9.4. Bancă
„În curând", cu explicație scurtă:
> În curând vei putea conecta contul bancar PFA pentru sincronizarea automată a încasărilor și cheltuielilor.

Fără furnizor, fără integrare.

---

## 10. Beneficii, Servicii, Suport, Profil

### 10.1. Beneficii
Design și conținut deja transmise separat către IT. **Nu se reproiectează aici** — doar se poziționează ca link direct în meniu.

### 10.2. Servicii
Grupare logică a paginilor comerciale existente: Mașini, Abonamente, Servicii individuale, Asigurări. **Mutare, nu refacere.**

### 10.3. Suport
Rămâne jos, aproape neschimbată. Singura modificare: **eliminăm Chat contabil**, mutat la Contabilitate. Suportul e exclusiv pentru relația cu RIDElance: probleme platformă, întrebări abonament, probleme cu serviciile, suport tehnic, contact echipă.

Adaugă o trimitere scurtă: problemele contabile → Contabilitate → Chat contabil.

### 10.4. Profil
Separat de navigarea principală, centralizează contul:
- **Date utilizator:** nume și prenume, denumire PFA, CUI, e-mail, telefon, opțional avatar.
- **Abonament:** plan activ, preț, status, următoarea plată/reînnoire, modalitate de plată, schimbare plan dacă e permisă.
- **Istoric plăți RIDElance** — **se mută aici din sidebar**:
  ```
  08.08.2026
  Abonament RIDElance Pro
  149 lei · Plătit
  [Vezi factura]
  ```
- **Securitate:** schimbare parolă; opțional schimbare e-mail cu verificare; opțional sesiuni active / „Deconectează toate dispozitivele".
- **Confidențialitate și cont**, jos: termeni și condiții, politica de confidențialitate, gestionare consimțăminte, export date, ștergere cont conform fluxului stabilit.

### 10.5. Notificări (în Profil)
Preferințe per categorie, cu **separare clară între operațional și comercial**:

*Operațional:* documente care expiră · taxe și termene · mesaje de la contabil · probleme de sincronizare Bolt/Uber.
*Comercial:* notificări RIDElance · oferte și beneficii.

Modelul de preferințe se persistă acum; canalul de livrare efectiv (e-mail/push) e în afara acestui spec — confirmă la §13.

---

## 11. Pattern „În curând"

O singură componentă `<ComingSoon title description />` folosită de Cont bancar, Facturi și Bancă.
- Ruta **există** și e navigabilă; item-ul de meniu rămâne vizibil cu badge discret.
- Fără dependențe de servicii neimplementate, fără fetch-uri care eșuează, fără console errors.

---

## 12. Plan de execuție

| PR | Conținut | Criteriu de ieșire |
|---|---|---|
| 0 | Inventar Faza 0 | `docs/nav-restructure-inventory.md` complet |
| 1 | `navigation.ts`, componenta de sidebar, rute, redirect-uri, pagini legate la componentele existente | Meniu complet funcțional, zero rute moarte, deep-link + refresh OK |
| 2 | Mutări fără schimbare funcțională: Bolt, Uber, OBLIO, Beneficii, Servicii*, Suport (fără chat contabil), Chat contabil, Istoric plăți → Profil. Ștergere „Expirări". Stub-uri „În curând" | Comportament identic pe rute noi |
| 3 | Layer financiar partajat + Situație financiară | Valori identice cu Acasă, verificate prin test |
| 4 | Documente: registry, card, cele 3 pagini, preluare din onboarding, status expirare server-side | Zero cerere de upload pentru documente deja deținute |
| 5 | Cheltuieli: model, CRUD, upload, extragere, UI listă + formular | Cheltuielile confirmate se reflectă în profit pe ambele pagini |
| 6 | Taxe & declarații: estimări + obligații contabil + documente | Separare vizuală clară între cele două zone |
| 7 | Profil: securitate, preferințe notificări, confidențialitate | Preferințele se persistă și se citesc |

---

## 13. Întrebări deschise (blochează PR-urile indicate)

1. **Prefixul real al rutelor de dashboard** și dacă slug-urile RO sunt acceptabile sau se preferă slug-uri EN. → PR 1
2. **Cine populează `TaxObligation`?** Contabila are interfață de admin sau se importă altfel? Fără răspuns, PR 6 nu are sursă de date. → PR 6
3. **Furnizor OCR/extragere** pentru cheltuieli: serviciu existent în platformă (fluxul de procesare documente) sau unul nou? → PR 5
4. **Praguri de expirare** pentru badge-ul „Expiră în X zile" — 30 de zile pentru toate tipurile sau diferențiat (ex. RCA vs. aviz medical)? → PR 4
5. **Canal de livrare pentru notificări** — doar preferințe stocate acum, sau și trimitere efectivă? → PR 7
6. **Endpoint-uri OBLIO disponibile azi**, ca să fixăm câmpurile paginii. → PR 2
7. **Formatul CSV Uber** — există validator/parser existent sau se scrie acum? → PR 2

---

## 14. Definition of Done

- [ ] Toate linkurile de sidebar vin din `navigation.ts`; niciun link hardcodat.
- [ ] Nicio rută veche nu dă 404; toate au redirect.
- [ ] Refresh pe orice subpagină păstrează categoria deschisă și marcată.
- [ ] Nicio valoare financiară nu e calculată în două locuri.
- [ ] Toată logica de dată e în C# cu `DateOnly`; frontend-ul primește status, nu îl deduce.
- [ ] Estimările sunt vizual distincte de obligațiile contabilului.
- [ ] Niciun document deja deținut nu e cerut din nou la upload.
- [ ] Subcategoria „Expirări" nu mai există nicăieri în cod.
- [ ] Chat contabil nu mai apare în Suport.
- [ ] Istoric plăți nu mai apare în sidebar.
- [ ] Paginile „În curând" nu produc erori în consolă.
- [ ] Sidebar navigabil complet cu tastatura; `aria-expanded` / `aria-current` corecte.
- [ ] Mobile: drawer funcțional, se închide la selecție.
- [ ] Pagina Acasă e neschimbată funcțional și vizual.
- [ ] Lint + build + teste existente trec.

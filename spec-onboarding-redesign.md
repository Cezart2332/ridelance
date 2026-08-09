# SPEC — Refactor Onboarding PFA (RIDElance)

> **Pentru Claude Code.** Refactorizăm onboarding-ul existent. NU rescriem business logic-ul, NU schimbăm cei 6 pași mari, NU atingem backend-ul de validare documente. Schimbăm **shell-ul vizual** (layout cu rail stânga + rail dreapta + topbar) și **granularitatea interacțiunii** (o singură întrebare / un singur upload per ecran).
>
> **Scope-ul acestei iterații:** shell-ul complet + **Pasul 1 (Eligibilitate)** implementat integral pe noua structură. Pașii 2–6 rămân pe implementarea actuală, doar montați în noul shell (vezi §10 Migrare progresivă). Validăm pasul 1, apoi replicăm pattern-ul.

---

## 1. Problema actuală

Onboarding-ul de acum e „greoi" vizual: la un singur pas (ex. Eligibilitate) afișăm simultan CI + Permis + întrebarea de atestat. Utilizatorul primește un perete de câmpuri, fără ierarhie, fără spacing consistent, fără senzație de progres.

**Direcția:** structură inspirată din demo-ul StartGlobal — un lucru pe ecran, spacing generos, delimitări clare, progres mereu vizibil, footer de navigare consistent.

---

## 2. Layout global (`OnboardingLayout`)

Layout persistent pe TOATĂ durata onboarding-ului. Nu se re-monteaza între pași — se schimbă doar conținutul din centru (asta e important pentru tranziții).

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ ┌─────────────┬─────────────────────────────────────────┬──────────────────┐  │
│ │             │  ← Înapoi   Pasul 5 din 17   [====   ] 29%   Salvează ⌄ │  │  │
│ │  RIDElance  ├─────────────────────────────────────────┴──────────────────┤  │
│ │  Onboarding │                                          │                 │  │
│ │  PFA        │   ┌──────────────────────────────────┐   │  PASUL CURENT   │  │
│ │  ridesharing│   │  [icon]                          │   │  Eligibilitate  │  │
│ │             │   │                                  │   │                 │  │
│ │ PROGRES     │   │  ELIGIBILITATE                   │   │  ✓ Vârstă       │  │
│ │ DOSAR       │   │  Ai împlinit 21 de ani?          │   │  ● Permis       │  │
│ │             │   │  Condiție preliminară pentru...  │   │  ○ Atestat      │  │
│ │ ✓ Eligibil. │   │                                  │   │  ○ Rezumat      │  │
│ │ ② Identitate│   │  ┌────────────┐ ┌─────────────┐  │   │                 │  │
│ │   ├ Vârstă  │   │  │ Da, am 21+ │ │ Nu încă     │  │   │  ───────────    │  │
│ │   └ Permis  │   │  └────────────┘ └─────────────┘  │   │  De ce cerem    │  │
│ │ ③ PFA       │   │                                  │   │  asta?          │  │
│ │ ④ TVA       │   │  ─────────────────────────────   │   │  Text scurt...  │  │
│ │ ⑤ ARR       │   │  Înapoi              Continuă →  │   │                 │  │
│ │ ⑥ Trimitere │   └──────────────────────────────────┘   │  ⏱ ~2 min       │  │
│ │             │                                          │                 │  │
│ │─────────────│                                          │                 │  │
│ │ 🎧 Suport   │                                          │                 │  │
│ │ 💳 Abonam. 🔒│                                          │                 │  │
│ │ 🛡 Asigur. 🔒│                                          │                 │  │
│ └─────────────┴──────────────────────────────────────────┴─────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Grid

| Zonă | Lățime | Comportament |
|---|---|---|
| Rail stânga | `280px` fix | `position: sticky`, full height, `borderRight: 1px solid divider` |
| Coloană centrală | `1fr`, conținut `maxWidth: 720px` centrat | scroll independent |
| Rail dreapta | `300px` fix | `position: sticky`, `borderLeft: 1px solid divider` |
| Topbar | full width peste centru+dreapta | `height: 64px`, sticky top |

**Breakpoints:**
- `≥1440px` — 3 coloane, cum e mai sus.
- `1200–1439px` — rail dreapta se restrânge la `260px`.
- `900–1199px` — rail dreapta **dispare**; conținutul lui (checklist pas curent + „De ce cerem asta?") se mută ca un `Accordion` collapsed deasupra cardului central.
- `<900px` — rail stânga devine `Drawer` temporar (hamburger în topbar); topbar păstrează progress bar-ul; cardul central devine full-width cu `padding: 16px`.

Fundal pagină: `background.default` (gri foarte deschis, ex. `#F7F8FA`). Rail-urile și cardul: `background.paper` (alb). Delimitările se fac prin **borders subtile**, nu prin umbre grele.

---

## 3. Rail stânga (`OnboardingSidebar`)

Trei zone verticale: brand (sus), stepper (mijloc, scrollabil dacă e nevoie), utilitare (jos, lipit de bază cu `marginTop: auto`).

### 3.1 Brand
- Logo RIDElance (24px) + wordmark.
- Subtitlu: `Onboarding PFA ridesharing` — `caption`, `text.secondary`.

### 3.2 Stepper macro (`StepRail`)

Label secțiune: `PROGRES DOSAR` — `overline`, `letterSpacing: 0.08em`, `text.disabled`.

Cei 6 pași rămân neschimbați:

| # | Cheie | Label |
|---|---|---|
| 1 | `eligibility` | Eligibilitate |
| 2 | `identity` | Identitate |
| 3 | `pfa` | PFA |
| 4 | `vat_tools` | TVA și instrumente |
| 5 | `arr` | ARR |
| 6 | `submit` | Trimitere |

**Stări vizuale** (exact ca în demo-ul StartGlobal):

| Stare | Indicator | Label | Fundal rând |
|---|---|---|---|
| `completed` | cerc plin verde `success.main` + iconiță check albă, 20px | `text.disabled`, weight 500 | transparent |
| `active` | cerc plin `primary.main` cu numărul alb, 24px | `primary.main`, weight 600 | `primary.50` cu `borderRadius: 8px` |
| `upcoming` | cerc outline `1px divider`, număr `text.disabled`, 20px | `text.secondary`, weight 500 | transparent |
| `failed` | cerc plin `error.main` + „!" | `error.main` | `error.50` |

- Rânduri: `height: 40px`, `gap: 12px` între indicator și label, `12px` padding orizontal.
- **Fără linie verticală continuă** între indicatori — demo-ul StartGlobal nu are, și arată mai curat.
- Pașii `completed` sunt **clickabili** (revenire la review, read-only). Pașii `upcoming` sunt inerți, `cursor: default`, fără hover.

**Sub-pași:** doar sub pasul `active`, indentați `36px`, fără indicator numeric, `body2`. Sub-pasul curent are weight 600 + o săgeată `→` aliniată la dreapta (16px, `text.disabled`). Se animă la intrare/ieșire (`Collapse`, 200ms).

### 3.3 Zona utilitară (jos)

Separator `Divider` deasupra. Trei elemente, în ordinea asta:

**a) Suport** — `SidebarSupportBlock`
- Buton full-width, variant `text`, aliniat stânga, iconiță `HeadsetMic`, label `Contactează suportul`.
- La click → `Menu` (MUI) ancorat, cu 2 opțiuni:
  1. `Trimite un email` — iconiță `MailOutline`, subtitle `Răspundem în maximum 24h`. Acțiune: deschide `SupportEmailDialog` (subiect precompletat cu pasul curent + `applicationId`) SAU `mailto:` — vezi §8, flag de config.
  2. `Programează o vizită la birou` — iconiță `EventAvailable`, subtitle `Te ajutăm față în față`. Acțiune: deschide `OfficeBookingDialog` (§6.7).

**b) Abonamente** — `LockedNavItem`
- Iconiță `CreditCard`, label `Abonamente`, iconiță `Lock` (16px) aliniată dreapta.
- `opacity: 0.55`, `cursor: not-allowed`, `pointerEvents` activ doar pentru tooltip.
- `Tooltip`: „Disponibil după finalizarea onboarding-ului".
- La click: **nu navighează**. Afișează un `Snackbar` info: „Poți alege un abonament după ce finalizezi toți cei 6 pași."
- **Important:** e pur vizual. Nu montăm ruta, nu facem fetch la planuri, nu permitem selecție. Este strict un teaser al tab-ului din dashboard-ul PFA.

**c) Asigurări** — `LockedNavItem`, identic, iconiță `Shield`, label `Asigurări`.

> Ambele devin active (fără lacăt, clickabile, `opacity: 1`) doar când `application.status === 'completed'`. Condiția se citește dintr-un singur loc: `useOnboardingGate()`.

**d) Disclaimer** (opțional, dacă rulăm în mod demo)
- Card mic, `background.default`, `caption`, `text.disabled`, text: „Acesta este un prototip demonstrativ..." — afișat doar dacă `import.meta.env.VITE_ONBOARDING_DEMO === 'true'`.

---

## 4. Topbar (`OnboardingTopBar`)

Sticky, `height: 64px`, `borderBottom: 1px solid divider`, `background.paper`.

- **Stânga:** buton `← Înapoi`, variant `text`, `text.secondary`. Disabled pe primul micro-pas.
- **Centru:** bloc vertical compact:
  - `Pasul {microStepIndex} din {totalMicroSteps}` — `caption`, `text.secondary`.
  - `LinearProgress` determinat, `height: 4px`, `borderRadius: 2px`, lățime `320px`, culoare `primary.main` pe track `primary.100`.
  - `{percent}%` — `caption`, `text.secondary`, la dreapta barei.
- **Dreapta:** buton `Salvează și continuă mai târziu` (variant `outlined`, size small). La click: persistă starea + toast „Progresul a fost salvat" + redirect spre dashboard. *(Înlocuiește „Resetează demo" din prototip — ăla rămâne doar în modul demo.)*

Procentul se calculează pe **micro-pași**, nu pe pași mari, altfel bara stă blocată prea mult timp și utilizatorul crede că nu avansează.

---

## 5. Rail dreapta (`StepContextPanel`) — **DE CONFIRMAT CU CLIENTUL**

> Interpretarea cerinței „progres și în dreapta pentru fiecare pas". Dacă clientul voia altceva, se poate scoate fără să afecteze restul layout-ului (e un slot independent).

Conținut, de sus în jos:
1. **Titlul pasului mare curent** — `overline` + `subtitle1`.
2. **Checklist micro-pași** ai pasului curent: `✓` verde pentru completați, punct plin albastru pentru curent, cerc gol pentru următorii. Labels scurte (`Vârstă`, `Permis`, `Atestat`, `Rezumat`).
3. `Divider`.
4. **„De ce cerem asta?"** — 2–3 rânduri de context, specific micro-pasului curent (text din config, câmpul `helpText`).
5. **„Ce pregătești"** — listă de documente necesare pentru pasul curent, cu bifă pe cele deja încărcate.
6. **Timp estimat** — `⏱ ~2 min` pentru pasul curent.

Fără card, fără shadow — doar text pe fundal `background.paper`, `padding: 24px`, delimitat de linia verticală din stânga lui.

---

## 6. Conținutul central — un lucru pe ecran

### 6.1 Regula fundamentală

**Un ecran = o decizie sau un upload.** Niciodată o întrebare și un upload simultan. Niciodată două documente pe același ecran.

Fluxul e: `întrebare → răspuns → (dacă e cazul) ecran de upload pentru documentul aferent → următoarea întrebare`.

### 6.2 Cardul central (`OnboardingCard`)

- `maxWidth: 720px`, centrat, `marginTop: 48px`.
- `background.paper`, `borderRadius: 16px`, `border: 1px solid divider`, `boxShadow: 0 1px 2px rgba(16,24,40,0.05)` (umbră aproape inexistentă — delimitarea o face border-ul).
- `padding: 40px`.
- Structură internă verticală, `gap` explicit:

```
[icon 48x48, rounded 12px, bg primary.50, icon primary.main]
  ↓ 24px
[EYEBROW]              overline, primary.main, letterSpacing 0.08em
  ↓ 8px
[Întrebarea]           h5, weight 600, text.primary, line-height 1.3
  ↓ 8px
[Subtitlu explicativ]  body2, text.secondary, max 2 rânduri
  ↓ 32px
[CONȚINUT: opțiuni SAU dropzone SAU formular]
  ↓ 32px
[Divider]
  ↓ 20px
[Footer: hint stânga · butoane dreapta]
```

### 6.3 Footer-ul cardului

- **Stânga:** hint discret, `caption`, `text.disabled` — ex. „Poți reveni oricând la pasul anterior."
- **Dreapta:** `Continuă →` (`contained`, `primary`, `size: large`, `borderRadius: 10px`, `paddingX: 24px`). Disabled până când e selectat un răspuns / încărcat documentul.
- Butonul de back principal e în topbar, nu dublăm în footer.

### 6.4 Opțiuni de răspuns (`ChoiceOption`)

Nu radio-uri standard MUI. Card-uri selectabile, așa cum apar în prototip:

- Layout: 2 coloane pe desktop (`gap: 16px`), 1 coloană sub 600px.
- Fiecare card: `padding: 20px`, `borderRadius: 12px`, `border: 1.5px solid divider`.
- Conținut: **titlu** (`subtitle2`, weight 600) + **subtitlu** (`caption`, `text.secondary`) + indicator radio (20px) în colț dreapta-sus.
- Stări:
  - default → `border: divider`, `background.paper`
  - hover → `border: primary.200`, `background: primary.50/40`
  - selected → `border: 1.5px primary.main`, `background: primary.50`, radio plin
  - focus-visible → `outline: 2px solid primary.main`, `outlineOffset: 2px`
- Tranziție: `border-color 150ms, background-color 150ms`.
- **Accesibilitate:** `role="radiogroup"` pe container, `role="radio"` + `aria-checked` pe fiecare, navigare cu săgeți, selecție cu Space/Enter.

### 6.5 Ecranul de upload (`DocumentUploadStep`)

Un singur document per ecran. Aceeași structură de card, dar în locul opțiunilor:

- **Dropzone**: `border: 1.5px dashed divider`, `borderRadius: 12px`, `padding: 40px`, centrat.
  - Iconiță upload (32px, `primary.main`) → titlu document → hint (`Fotografie clară, față` / `Față și verso, într-un singur fișier sau două imagini`) → text `Trage fișierul aici sau alege din calculator`.
  - hover / dragover → `border: primary.main`, `background: primary.50/50`.
- **După încărcare:** dropzone-ul se înlocuiește cu `UploadedFileCard`:
  - thumbnail (48x48, `borderRadius: 8px`) pentru imagini / iconiță PDF
  - nume fișier (trunchiat, `body2`) + dimensiune (`caption`)
  - status chip: `Se verifică...` (info, cu spinner) → `Document validat` (success) sau `Necesită atenție` (warning)
  - acțiuni: `Înlocuiește` (text button) și `Elimină` (icon button)
- **Validare client-side înainte de upload:** tipuri acceptate `image/jpeg, image/png, image/heic, application/pdf`; max `10MB`. Eroarea se afișează inline sub dropzone, `error.main`, `caption` — cu ce s-a întâmplat ȘI cum se rezolvă („Fișierul depășește 10 MB. Încearcă o fotografie cu rezoluție mai mică.").
- **Validarea LLM** rămâne exact cum e acum (nu o atingem). Se afișează asincron în chip-ul de status; utilizatorul **poate continua** fără să aștepte rezultatul — nu blocăm fluxul pe latența LLM-ului. Dacă validarea eșuează după ce a avansat, marcăm micro-pasul cu `warning` în rail și îi arătăm un banner la ecranul de rezumat.

### 6.6 Ecranul de blocaj (`BlockedStateCard`)

Când răspunsul pică o condiție eliminatorie:

- Iconiță `error.main` pe `error.50`.
- Titlu: `Momentan nu îndeplinești condițiile de eligibilitate`.
- Corp: care condiție a picat, în cuvinte simple, și **ce poate face în continuare** (ex. „Poți relua procesul după ce împlinești 21 de ani.").
- CTA primar: `Contactează suportul` (deschide același meniu ca în rail).
- CTA secundar (text): `Anunță-mă când devin eligibil` → salvează email + condiția picată.
- Nu e „dead end" agresiv: rail-ul rămâne vizibil, pasul 1 se marchează `failed`, iar utilizatorul poate reveni și schimba răspunsul.

### 6.7 `OfficeBookingDialog`

- `Dialog`, `maxWidth: sm`, `borderRadius: 16px`.
- Titlu: `Programează o vizită la birou`. Subtitlu cu adresa biroului.
- Conținut: `DateCalendar` (MUI X) — zilele fără sloturi disponibile `disabled`; sub calendar, grid de sloturi orare (`Chip` selectabile, 3 coloane).
- Câmpuri: nume (precompletat), telefon (precompletat), motivul vizitei (`Select`: `Depunere documente` / `Semnare contract` / `Consultanță PFA` / `Altul`).
- Acțiuni: `Anulează` (text) · `Confirmă programarea` (contained).
- După confirmare: ecran de succes în același dialog — data/ora, adresa, buton `Adaugă în calendar` (.ics) și mențiunea că primește confirmare pe email.
- Sloturile se iau din API (§8). Dacă endpoint-ul nu există încă, se folosește un mock local în `src/features/onboarding/mocks/officeSlots.ts`, izolat, cu un TODO clar.

---

## 7. Structura declarativă a pașilor (CEA MAI IMPORTANTĂ PARTE)

Nu hardcodăm micro-pașii în JSX. Definim un **config declarativ** și un runner generic. Altfel, la pașii 2–6 ajungem la același haos ca acum.

### 7.1 Tipuri

```ts
// src/features/onboarding/types.ts

export type MicroStepKind = 'question' | 'upload' | 'form' | 'summary' | 'blocked';

export interface ChoiceDef {
  value: string;
  title: string;
  subtitle?: string;
  /** Dacă e true, selectarea acestei opțiuni oprește pasul mare. */
  blocks?: boolean;
  /** Micro-pașii care devin activi dacă se alege opțiunea asta. */
  unlocks?: string[];
}

export interface MicroStepDef {
  id: string;                 // 'age', 'ci_upload', 'license', ...
  macroStep: MacroStepKey;    // 'eligibility' | 'identity' | ...
  kind: MicroStepKind;
  eyebrow: string;            // 'ELIGIBILITATE'
  icon: string;               // cheie în iconMap
  title: string;              // întrebarea / titlul ecranului
  subtitle?: string;
  helpText?: string;          // pentru rail-ul din dreapta
  estimatedMinutes?: number;
  railLabel: string;          // label scurt pentru checklist ('Vârstă')

  // kind === 'question'
  choices?: ChoiceDef[];

  // kind === 'upload'
  document?: {
    key: string;              // 'ci' | 'driving_license' | 'attestation'
    label: string;
    hint: string;
    accept: string[];
    maxSizeMb: number;
    multiple?: boolean;       // permis față/verso
    required: boolean;
  };

  /** Se afișează doar dacă predicatul e adevărat pe starea curentă. */
  visibleWhen?: (state: OnboardingState) => boolean;
}
```

### 7.2 Config-ul pentru Pasul 1 — Eligibilitate

```ts
// src/features/onboarding/config/eligibility.ts

export const eligibilitySteps: MicroStepDef[] = [
  {
    id: 'age',
    macroStep: 'eligibility',
    kind: 'question',
    eyebrow: 'ELIGIBILITATE',
    icon: 'user',
    railLabel: 'Vârstă',
    title: 'Ai împlinit 21 de ani?',
    subtitle: 'Condiție preliminară pentru activitatea de transport alternativ.',
    helpText: 'Legea impune vârsta minimă de 21 de ani pentru transportul alternativ de persoane.',
    estimatedMinutes: 1,
    choices: [
      { value: 'yes', title: 'Da, am minimum 21 de ani', subtitle: 'Pot continua procesul', unlocks: ['ci_upload'] },
      { value: 'no',  title: 'Nu încă', subtitle: 'Vreau să verific opțiunile disponibile', blocks: true },
    ],
  },
  {
    id: 'ci_upload',
    macroStep: 'eligibility',
    kind: 'upload',
    eyebrow: 'ELIGIBILITATE',
    icon: 'idCard',
    railLabel: 'Carte de identitate',
    title: 'Încarcă cartea de identitate',
    subtitle: 'Confirmăm data nașterii din document. Extragem automat datele.',
    helpText: 'Datele extrase sunt folosite pentru precompletarea dosarului PFA.',
    estimatedMinutes: 2,
    document: {
      key: 'ci',
      label: 'Carte de identitate',
      hint: 'Fotografie clară, față. Toate cele 4 colțuri vizibile.',
      accept: ['image/jpeg', 'image/png', 'image/heic', 'application/pdf'],
      maxSizeMb: 10,
      required: true,
    },
    visibleWhen: (s) => s.answers.age === 'yes',
  },
  {
    id: 'license',
    macroStep: 'eligibility',
    kind: 'question',
    eyebrow: 'ELIGIBILITATE',
    icon: 'car',
    railLabel: 'Permis',
    title: 'Ai permis categoria B de minimum 2 ani?',
    subtitle: 'Vom confirma ulterior data emiterii din permis.',
    estimatedMinutes: 1,
    choices: [
      { value: 'yes', title: 'Da', subtitle: 'Permisul are vechime de cel puțin 2 ani', unlocks: ['license_upload'] },
      { value: 'no',  title: 'Nu', subtitle: 'Permisul are mai puțin de 2 ani', blocks: true },
    ],
    visibleWhen: (s) => s.answers.age === 'yes',
  },
  {
    id: 'license_upload',
    macroStep: 'eligibility',
    kind: 'upload',
    eyebrow: 'ELIGIBILITATE',
    icon: 'car',
    railLabel: 'Permis (document)',
    title: 'Încarcă permisul de conducere',
    subtitle: 'Față și verso, într-un singur fișier sau două imagini.',
    estimatedMinutes: 2,
    document: {
      key: 'driving_license',
      label: 'Permis de conducere',
      hint: 'Față și verso. Data emiterii trebuie să fie lizibilă.',
      accept: ['image/jpeg', 'image/png', 'image/heic', 'application/pdf'],
      maxSizeMb: 10,
      multiple: true,
      required: true,
    },
    visibleWhen: (s) => s.answers.license === 'yes',
  },
  {
    id: 'attestation',
    macroStep: 'eligibility',
    kind: 'question',
    eyebrow: 'ELIGIBILITATE',
    icon: 'shield',
    railLabel: 'Atestat',
    title: 'Ai deja atestat pentru transport persoane în regim de închiriere?',
    subtitle: 'Poți continua și fără el; RIDElance va marca etapa ca fiind necesară.',
    helpText: 'Atestatul se poate obține ulterior. Nu blochează înscrierea, dar e obligatoriu înainte de a începe cursele.',
    estimatedMinutes: 1,
    choices: [
      { value: 'yes', title: 'Da, îl am', subtitle: 'Îl voi încărca în pasul următor', unlocks: ['attestation_upload'] },
      { value: 'no',  title: 'Nu încă', subtitle: 'Vreau să îl obțin ulterior' }, // NU blochează
    ],
    visibleWhen: (s) => s.answers.license === 'yes',
  },
  {
    id: 'attestation_upload',
    macroStep: 'eligibility',
    kind: 'upload',
    eyebrow: 'ELIGIBILITATE',
    icon: 'shield',
    railLabel: 'Atestat (document)',
    title: 'Încarcă atestatul',
    subtitle: 'Documentul emis de ARR pentru transport persoane în regim de închiriere.',
    estimatedMinutes: 2,
    document: {
      key: 'attestation',
      label: 'Atestat transport persoane',
      hint: 'Fotografie sau PDF, lizibil integral.',
      accept: ['image/jpeg', 'image/png', 'image/heic', 'application/pdf'],
      maxSizeMb: 10,
      required: false,
    },
    visibleWhen: (s) => s.answers.attestation === 'yes',
  },
  {
    id: 'eligibility_summary',
    macroStep: 'eligibility',
    kind: 'summary',
    eyebrow: 'ELIGIBILITATE',
    icon: 'checkCircle',
    railLabel: 'Rezumat',
    title: 'Ești eligibil pentru înscriere',
    subtitle: 'Verifică datele de mai jos înainte de a trece la pasul următor.',
    estimatedMinutes: 1,
    visibleWhen: (s) => s.answers.age === 'yes' && s.answers.license === 'yes',
  },
];
```

### 7.3 Ecranul de rezumat (`kind: 'summary'`)

- Listă de rânduri: `label · valoare · [Modifică]`.
- Documentele apar cu thumbnail + status de validare.
- Dacă atestatul lipsește: banner `warning` — „Vei putea începe cursele doar după ce încarci atestatul. Îți vom aminti."
- Butonul devine `Continuă către Identitate →`.

### 7.4 Runner-ul

`OnboardingRunner` primește lista de micro-pași, filtrează după `visibleWhen`, calculează `totalMicroSteps` **dinamic** (se recalculează după fiecare răspuns — de aia contorul din prototip zice „din 17", dar la noi numărul trebuie să reflecte ramura reală a utilizatorului), și randează componenta corespunzătoare lui `kind` printr-un switch. Un singur `switch`, într-un singur fișier.

---

## 8. State, persistență, API

### 8.1 State local

```ts
interface OnboardingState {
  applicationId: string;
  currentMicroStepId: string;
  answers: Record<string, string>;              // { age: 'yes', license: 'yes', ... }
  documents: Record<string, DocumentUploadState>;
  macroStepStatus: Record<MacroStepKey, 'upcoming' | 'active' | 'completed' | 'failed'>;
  blockedReason?: string;
}
```

Store: **Zustand** (sau context + reducer, dacă asta e deja convenția în cod — verifică ce e în `src/store` și **respectă ce există**, nu introduce o librărie nouă).

### 8.2 Persistență

- **După fiecare micro-pas** — `PATCH /api/onboarding/applications/{id}` cu delta (răspunsul sau referința documentului). Optimistic update; dacă pică request-ul, `Snackbar` cu retry, dar **nu blocăm navigarea**.
- **Resume:** la mount, `GET /api/onboarding/applications/current` → dacă există o aplicație în progres, sărim direct la `currentMicroStepId` și afișăm un banner discret: „Am reluat de unde ai rămas."

### 8.3 Endpoint-uri necesare

| Metodă | Rută | Scop |
|---|---|---|
| `GET` | `/api/onboarding/applications/current` | resume |
| `PATCH` | `/api/onboarding/applications/{id}` | salvează răspuns / avansare micro-pas |
| `POST` | `/api/onboarding/applications/{id}/documents` | upload (multipart) |
| `DELETE` | `/api/onboarding/applications/{id}/documents/{key}` | eliminare document |
| `GET` | `/api/onboarding/applications/{id}/documents/{key}/status` | poll status validare LLM |
| `GET` | `/api/support/office-slots?from=&to=` | sloturi disponibile birou |
| `POST` | `/api/support/office-bookings` | creare programare |
| `POST` | `/api/support/tickets` | email suport din dialog |

Dacă un endpoint nu există în backend, **creează-l ca stub în layer-ul de API client** cu tip complet și un `TODO(backend):` — nu inventa contracte în componente.

---

## 9. Tokens & theme

Extinde theme-ul MUI existent, nu suprascrie inline în componente.

```
// Culori (aliniate cu prototipul)
primary.main      #2563EB   (albastrul RIDElance din prototip)
primary.50        #EFF4FF
primary.100       #DBE5FF
primary.200       #BFD1FF
success.main      #16A34A
success.50        #ECFDF3
warning.main      #D97706
error.main        #DC2626
error.50          #FEF2F2
background.default #F7F8FA
background.paper   #FFFFFF
divider            #E5E7EB
text.primary       #101828
text.secondary     #667085
text.disabled      #98A2B3

// Radius
button 10px · card 16px · option/dropzone 12px · chip 8px

// Spacing (multipli de 4)
card padding 40 · între secțiuni în card 32 · între titlu și subtitlu 8 · între opțiuni 16

// Tipografie
h5        24/1.3   weight 600   → întrebări
subtitle1 18/1.4   weight 600
subtitle2 16/1.4   weight 600   → titlu opțiune
body2     14/1.5   weight 400
caption   13/1.5   weight 400
overline  12/1.2   weight 700   letterSpacing 0.08em uppercase

// Umbre — minime
card: 0 1px 2px rgba(16,24,40,0.05)
dialog/menu: 0 12px 24px rgba(16,24,40,0.10)
```

**Fără gradient-uri. Fără umbre colorate. Fără borduri mai groase de 1.5px.** Curățenia vine din spacing consistent și din faptul că pe ecran e un singur lucru.

---

## 10. Tranziții

- Între micro-pași: cardul central face `fade + translateY(8px)`, `200ms ease-out`. Rail-urile și topbar-ul **nu** se animă și **nu** se remontează.
- `LinearProgress` se animă spre noua valoare, `300ms`.
- Sub-pașii din rail: `Collapse`, `200ms`.
- Respectă `prefers-reduced-motion`: toate tranzițiile devin instant.

---

## 11. Migrare progresivă (pașii 2–6)

1. Creează `OnboardingLayout` + rail-uri + topbar ca shell nou.
2. Montează **pașii 2–6 existenți, neschimbați**, în slot-ul central al shell-ului. Pentru ei, `totalMicroSteps` numără fiecare pas mare ca un singur micro-pas (aproximare temporară, e ok).
3. Implementează pasul 1 complet pe noua structură declarativă.
4. **STOP — validare cu clientul.**
5. După OK, migrează pașii 2–6 unul câte unul, scriind doar noi fișiere de config (nu componente noi) — asta e tot rostul structurii din §7.

---

## 12. Fișiere

```
src/features/onboarding/
├── OnboardingLayout.tsx
├── OnboardingRunner.tsx
├── types.ts
├── config/
│   ├── index.ts                 // agregă toți pașii, în ordine
│   └── eligibility.ts           // §7.2
├── components/
│   ├── sidebar/
│   │   ├── OnboardingSidebar.tsx
│   │   ├── StepRail.tsx
│   │   ├── StepRailItem.tsx
│   │   ├── SidebarSupportBlock.tsx
│   │   └── LockedNavItem.tsx
│   ├── topbar/OnboardingTopBar.tsx
│   ├── context/StepContextPanel.tsx
│   ├── card/
│   │   ├── OnboardingCard.tsx
│   │   ├── CardFooter.tsx
│   │   ├── ChoiceOption.tsx
│   │   ├── ChoiceGroup.tsx
│   │   ├── DocumentDropzone.tsx
│   │   ├── UploadedFileCard.tsx
│   │   ├── BlockedStateCard.tsx
│   │   └── StepSummary.tsx
│   └── dialogs/
│       ├── OfficeBookingDialog.tsx
│       └── SupportEmailDialog.tsx
├── hooks/
│   ├── useOnboardingState.ts
│   ├── useMicroSteps.ts         // filtrare visibleWhen + calcul progres
│   └── useOnboardingGate.ts     // deblocare Abonamente/Asigurări
└── api/onboardingApi.ts
```

---

## 13. Criterii de acceptare

- [ ] Rail stânga persistent, cu cei 6 pași și stările corecte; sub-pașii apar doar sub pasul activ.
- [ ] `Suport` deschide meniul cu exact 2 opțiuni; „Programare birou" deschide dialogul cu calendar funcțional.
- [ ] `Abonamente` și `Asigurări` apar în rail, cu lacăt, **imposibil de accesat** înainte de finalizarea onboarding-ului; tooltip + snackbar explicativ.
- [ ] Topbar cu „Înapoi", contor „Pasul X din N", progress bar și procent care avansează la fiecare micro-pas.
- [ ] Pasul 1: exact 7 ecrane posibile, unul pe rând, în ordinea din §7.2 — niciodată două cereri simultan.
- [ ] „Nu" la vârstă sau la permis → ecran de blocaj, pasul 1 marcat `failed` în rail, cu posibilitate de revenire.
- [ ] „Nu încă" la atestat → **nu** blochează, sare peste upload, apare avertisment în rezumat.
- [ ] Fiecare upload apare pe ecran propriu, imediat după întrebarea aferentă.
- [ ] Refresh la mijlocul pasului 1 → revine exact la același micro-pas, cu răspunsurile și fișierele intacte.
- [ ] Navigare completă cu tastatura; focus vizibil pe toate elementele interactive.
- [ ] Responsive verificat la 1440 / 1200 / 900 / 390 px.
- [ ] `prefers-reduced-motion` respectat.

---

## 14. De confirmat cu clientul

1. **Rail-ul din dreapta** (§5) — poza de referință nu a ajuns; conținutul propus e o interpretare a cerinței „progres și în dreapta pentru fiecare pas".
2. Contorul „Pasul X din N" — dinamic (se schimbă în funcție de ramură) sau fix pe cel mai lung parcurs?
3. La „Nu" pe vârstă/permis: colectăm email pentru remarketing sau doar afișăm mesajul?
4. Sloturile pentru vizita la birou: program fix (ex. L–V, 10:00–17:00, la 30 min) sau vin din backend?
5. Card-urile de Abonamente/Asigurări din rail: doar iconiță + label, sau afișăm și un preview cu prețul planurilor?

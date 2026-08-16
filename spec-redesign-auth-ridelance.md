# Spec — Redesign pagină de autentificare RIDElance

**Scop:** refacerea ecranelor `/autentificare` și `/inregistrare` pe MUI, folosind token-urile de design existente.
**Referință:** `RIDElance_Login_PFA_Flote_Clean_MockupStyle.html` — se folosește **doar ca referință de aranjare**, nu se copiază 1:1.
**Asset:** captura de produs din mockup se salvează în `public/auth-visual.webp` (fallback `.png`).

**Presupuneri** (ajustează dacă numele diferă în cod): temă MUI cu `palette.primary`, `palette.text.primary/secondary`, `palette.divider`, `spacing` pe grilă de 8px, `shape.borderRadius`. Dacă token-urile au alte nume, se mapează, nu se introduc valori hardcodate noi.

---

## 1. De ce mockup-ul actual arată „vibe coded"

Astea sunt problemele de rezolvat, nu de reprodus:

| # | Problemă | Efect |
|---|---|---|
| 1 | Scală tipografică fracționară și inconsecventă (10.5px, 8.8px, 11.5px, 12px) | nimic nu pare aliniat pe un sistem |
| 2 | `font-weight: 950 / 900 / 850` | greutăți inexistente în fonturi reale, randare imprevizibilă |
| 3 | 8 valori diferite de `border-radius` (28, 20, 18, 13, 12, 11, 10, 9) | lipsă de ritm vizual |
| 4 | Cercuri decorative + 2 radial-gradients + `backdrop-filter` pe 3 straturi | estetica „template AI" |
| 5 | Badge-uri de încredere duplicate (stânga „Date protejate…", dreapta „Conexiune securizată…") | umplutură, zero informație |
| 6 | Navigație dublă pentru aceeași acțiune: tab-uri sus + link „Creează cont" jos | utilizatorul nu știe care e sursa de adevăr |
| 7 | Card-urile PFA/Flotă apar de două ori (stânga informativ, dreapta ca input) | redundanță conceptuală |
| 8 | Input-uri la `font-size: 12px` | sub minimul de lizibilitate; pe iOS declanșează zoom automat la focus |
| 9 | H1 la 54px cu `letter-spacing: -2.3px` pe un ecran de auth | ton de landing page, nu de aplicație |

---

## 2. Decizii structurale

### D1 — Rute separate, nu tab-uri
`/autentificare` și `/inregistrare` devin rute distincte. Se elimină segmented control-ul și se păstrează **un singur** mecanism de comutare: linkul din subsolul formularului.
*Motiv:* register duce în onboarding-ul PFA (flux multi-pas), deci nu e o simplă schimbare de stare a aceluiași formular. Rute separate înseamnă și SEO, deep-link și analytics curate.

### D2 — Register minimal
Formularul de înregistrare conține **doar**: email, parolă, accept termeni. Atât.

Se scot din register și se mută în primul pas al onboarding-ului:
- selecția tipului de cont (PFA / Flotă)
- numele complet
- confirmarea parolei → înlocuită cu toggle „arată parola" + indicator de putere

*Motiv:* onboarding-ul e deja construit ca secvență de întrebări single-question. Tipul de cont e prima ramificație a acelui flux, nu un câmp de formular. Reduce frecarea la conversie de la 5 câmpuri la 2.

> **Fallback:** dacă tipul de cont trebuie decis înainte de crearea contului (constrângere de backend), atunci `/inregistrare` devine un ecran de alegere cu 2 opțiuni mari (PFA / Flotă) care duce la `/inregistrare/pfa` respectiv `/inregistrare/flota`. **Nu** se pune ca radio group în interiorul formularului.

### D3 — Panoul stâng e context, nu landing page
Un singur mesaj, o singură dovadă vizuală. Se elimină: eyebrow badge, cercurile decorative, gradienții radiali, blur-urile, cele două card-uri PFA/Flotă, rândul de badge-uri de jos.

### D4 — Un singur rând de „trust", în dreapta, sub buton
Formulat concret, nu generic. Vezi §6.

### D5 — Zero valori hardcodate
Toate spațierile prin `theme.spacing()`, culorile prin `palette`, razele prin `shape.borderRadius` sau multipli. Fără `px` liberi în `sx` pentru spațiere.

---

## 3. Layout

### Desktop (`≥ md`, 900px)

```
┌─────────────────────────────────────┬──────────────────────┐
│                                     │                      │
│  [logo]                      p:6    │   p:6                │
│                                     │                      │
│                                     │   ┌────────────────┐ │
│         H1 (max 2 rânduri)          │   │  Titlu (h4)    │ │
│         Subtitlu (max 2 rânduri)    │   │  Subtitlu      │ │
│                                     │   │                │ │
│    ┌──────────────────────────────  │   │  [Email]       │ │
│    │                                │   │  [Parolă]      │ │
│    │   auth-visual.webp             │   │  meta row      │ │
│    │   bleed dincolo de marginea    │   │  [ CTA ]       │ │
│    │   dreaptă/jos a panoului       │   │  ──── sau ──── │ │
│                                     │   │  link secundar │ │
│                                     │   └────────────────┘ │
│  © + link legal              p:6    │   trust row     p:6  │
└─────────────────────────────────────┴──────────────────────┘
        1fr (fluid)                        480px (fix)
```

- Container: `display: grid`, `gridTemplateColumns: '1fr 480px'`, `height: 100dvh`, `overflow: hidden`. **`height`, nu `minHeight`** — pagina se încadrează într-un ecran, fără scroll (vezi §4). **`dvh`, nu `vh`** — altfel bara de browser mobil taie conținutul.
- Panoul drept: lățime fixă `480px`, conținut intern `maxWidth: 400px`, centrat vertical (`alignContent: center`).
- Panoul stâng: fluid. Conținutul are `maxWidth: 560px` ca să nu se întindă textul pe monitoare late.
- Imaginea: `position: absolute`, ancorată în colțul dreapta-jos al panoului stâng, cu bleed în afara panoului (`right: -40px; bottom: -60px`), `overflow: hidden` pe panou. **Fără** card de sticlă cu `backdrop-filter`. Dacă e nevoie de separare de fundal: `border: 1px solid divider` + `borderRadius: 3` + o singură umbră din `theme.shadows`.

### Tabletă (`sm`–`md`)
O singură coloană. Panoul stâng se reduce la o bandă de header: logo + headline pe un rând, fără imagine. Formularul centrat, `maxWidth: 400px`.

### Mobil (`< sm`)
Panoul stâng dispare complet, inclusiv imaginea — care nu se descarcă deloc (`display: none` nu previne descărcarea; folosește randare condiționată în React sau `<picture>` cu `media`). Structură: logo → titlu → formular → link secundar. `padding: theme.spacing(3)`.

### Ritm vertical în formular

Două trepte: normal și comprimat. Treapta comprimată se activează pe viewporturi joase (vezi §4).

| Element | Normal | Comprimat (`max-height: 720px`) |
|---|---|---|
| Padding panou drept (vertical) | `spacing(6)` | `spacing(4)` |
| Titlu → subtitlu | `spacing(1)` | `spacing(1)` |
| Bloc header → primul câmp | `spacing(4)` | `spacing(3)` |
| Între câmpuri | `spacing(2.5)` | `spacing(2)` |
| Ultimul câmp → meta row | `spacing(2)` | `spacing(1.5)` |
| Meta row → CTA | `spacing(3)` | `spacing(2)` |
| CTA → divider | `spacing(3)` | `spacing(2)` |
| Divider → link secundar | `spacing(2)` | `spacing(1.5)` |

Implementare: un obiect `density` în `AuthLayout` expus prin context, sau direct `sx` cu `@media (max-height: 720px)`. Nu duplica valorile în fiecare componentă.

---

## 4. Încadrare într-un singur ecran

**Constrângere:** ecranul de auth nu are scroll. Nici pe desktop, nici pe laptop de 768px înălțime, nici pe telefon.

### Buget vertical

Viewportul critic nu e telefonul, ci **laptopul de 1366×768** — după bara de titlu, tab-uri și bara de adrese rămân ~610px utilizabili. Bugetul se calculează pentru 610px.

| Element (login, treaptă comprimată) | px |
|---|---|
| Padding sus | 32 |
| Titlu (`h4`) | 36 |
| Subtitlu (`body2`) | 20 |
| Gap | 24 |
| Câmp email | 52 |
| Gap | 16 |
| Câmp parolă | 52 |
| Gap | 12 |
| Meta row | 24 |
| Gap | 16 |
| CTA | 48 |
| Gap | 16 |
| Divider „sau" | 20 |
| Gap | 12 |
| Link secundar | 20 |
| Gap | 16 |
| Trust row | 16 |
| Padding jos | 32 |
| **Total** | **464** |
| **Rezervă pentru `Alert` de eroare** | **+56** |
| **Total cu eroare afișată** | **520** |

90px marjă față de 610. Register are un câmp mai puțin dar adaugă checkbox-ul de termeni (~44px cu text pe două rânduri) → aproximativ același total.

**Orice element adăugat ulterior trebuie scăzut din marja de 90px.** Dacă marja se epuizează, se taie trust row-ul, nu se activează scroll-ul.

### Reguli de implementare

1. **Panoul drept:** `height: 100%`, `display: flex`, `flexDirection: column`, `justifyContent: center`, `overflowY: auto`. `overflowY: auto` e supapă de siguranță, nu comportament așteptat — dacă se declanșează în stările normale, bugetul e greșit, nu se acceptă ca soluție.
2. **Panoul stâng:** `overflow: hidden`. Imaginea are bleed în afara panoului; nu poate genera scroll.
3. **Alert-ul de eroare nu are voie să împingă conținutul afară.** Două opțiuni, în ordinea preferinței:
   - a) marja de 90px îl absoarbe (cazul normal, calculat mai sus);
   - b) sub `max-height: 640px`, alert-ul se randează cu `variant="standard"` fără iconiță, pe un singur rând.
4. **Indicatorul de putere a parolei** (register) folosește slotul de `helperText`, care e oricum rezervat pentru erori. Nu adaugă înălțime.
5. **Erorile de validare** au maxim un rând. Mesajele din §8 sunt formulate ca să încapă pe 400px lățime — nu le lungi.
6. **Fără `position: fixed`** pentru subsolul din panoul stâng — `marginTop: auto` în flex column.

### Praguri

| Media query | Efect |
|---|---|
| `max-height: 720px` | treapta comprimată de spațiere (§3) |
| `max-height: 640px` | se ascunde trust row-ul; alert compact |
| `max-height: 560px` | se ascunde și subtitlul formularului |

Sub 560px înălțime (tastatură deschisă pe telefon mic) se acceptă scroll — e singurul caz.

### Comportament la tastatura mobilă

Pe telefon, focus într-un input deschide tastatura și `100dvh` se recalculează. Cu `justifyContent: center` conținutul rămâne centrat în spațiul rămas, deci câmpul focusat rămâne vizibil. **Nu** adăuga `scrollIntoView` manual — intră în conflict cu comportamentul nativ.

---

## 5. Tipografie

Se folosesc **exclusiv** variantele din temă. Nicio valoare fracționară.

| Rol | Variantă | Note |
|---|---|---|
| Headline panou stâng | `h3` (~40px desktop, `h4` pe md) | max 2 rânduri, `letter-spacing: -0.02em` maxim |
| Subtitlu panou stâng | `body1`, `text.secondary` | max 2 rânduri |
| Titlu formular | `h4` (~28px) | |
| Subtitlu formular | `body2`, `text.secondary` | |
| Label-uri câmpuri | label nativ MUI (floating) | nu se creează label-uri externe custom |
| Input | `1rem` (16px) obligatoriu | previne zoom-ul automat iOS la focus |
| Helper / erori | `caption` | |
| Trust row | `caption`, `text.secondary` | contrast ≥ 4.5:1 — verifică token-ul |

Greutăți permise: `400`, `500`, `600`, `700`. Atât.

---

## 6. Conținut (copy final)

**Panou stâng**
- H1: `Contabilitatea ta de PFA, pe pilot automat.`
- Sub: `Încasări sincronizate direct din bancă, taxe calculate automat și declarații gata de depus la ANAF.`
- Subsol: `© 2026 RIDElance` · `Termeni` · `Confidențialitate`

**Login**
- Titlu: `Bine ai revenit`
- Sub: `Autentifică-te ca să continui.`
- Câmpuri: `Email` (placeholder `nume@exemplu.ro`), `Parolă`
- Meta: checkbox `Ține-mă minte` (stânga) · link `Ai uitat parola?` (dreapta)
- CTA: `Autentifică-te` *(fără săgeată — săgeata sugerează navigare, nu submit)*
- Divider: `sau`
- Secundar: `Nu ai cont încă?` + link `Creează cont`

**Register**
- Titlu: `Creează-ți contul`
- Sub: `Îți configurăm contul în câțiva pași după înregistrare.`
- Câmpuri: `Email`, `Parolă` (cu indicator de putere)
- Checkbox: `Sunt de acord cu` + link `Termenii` + `și` + link `Politica de confidențialitate`
- CTA: `Continuă`
- Secundar: `Ai deja cont?` + link `Autentifică-te`

**Trust row** (o singură apariție, sub CTA, iconițe 16px + `caption`):
`Conexiune criptată` · `Date stocate în UE` · `Conform PSD2`

> Verifică cu Legal că a doua și a treia afirmație sunt corecte pentru infrastructura ta. Dacă nu, se elimină rândul — un badge fals e mai rău decât absența lui.

---

## 7. Mapare pe componente MUI

| Element | Componentă | Props cheie |
|---|---|---|
| Container pagină | `Box` | `sx={{ display: 'grid', gridTemplateColumns: {...}, minHeight: '100dvh' }}` |
| Panou stâng | `Box` | `component="aside"`, `display: { xs: 'none', md: 'flex' }` |
| Panou drept | `Box` | `component="main"` |
| Formular | `Box` | `component="form"`, `onSubmit`, `noValidate` |
| Câmp email | `TextField` | `type="email"`, `autoComplete="email"`, `autoFocus`, `fullWidth`, `required` |
| Câmp parolă | `TextField` | `autoComplete="current-password"` (login) / `"new-password"` (register), `InputProps.endAdornment` |
| Toggle parolă | `IconButton` în `InputAdornment` | `aria-label={visible ? 'Ascunde parola' : 'Arată parola'}`, `edge="end"`, `tabIndex={-1}` |
| Ține-mă minte | `FormControlLabel` + `Checkbox` | `size="small"` |
| CTA | `Button` | `type="submit"`, `variant="contained"`, `size="large"`, `fullWidth`, `loading` |
| Divider | `Divider` | `<Divider>sau</Divider>` |
| Link-uri | `Link` (MUI) `component={RouterLink}` | `underline="hover"` |
| Eroare server | `Alert` | `severity="error"`, deasupra formularului, `role="alert"` |
| Succes | `Snackbar` | doar pentru succes; erorile **nu** merg în toast |
| Indicator putere parolă | `LinearProgress` + `Typography caption` | `variant="determinate"` |

Înălțime input: `52px` (via `sx` pe `.MuiOutlinedInput-root`). Înălțime CTA: `48px`.

---

## 8. Stări

**Validare** — la `blur` pentru primul touch, apoi live la `change`. Nu valida în timp ce utilizatorul tastează prima dată.

| Câmp | Regulă | Mesaj |
|---|---|---|
| Email | format valid | `Adresă de email invalidă.` |
| Email | obligatoriu | `Introdu adresa de email.` |
| Parolă (login) | obligatoriu | `Introdu parola.` |
| Parolă (register) | min 8 caractere | `Parola trebuie să aibă minim 8 caractere.` |
| Termeni | bifat | `Trebuie să accepți termenii pentru a continua.` |

**Submit în curs:** `loading` pe buton, toate câmpurile `disabled`. Textul butonului rămâne același (MUI gestionează spinner-ul).

**Erori de la server:** `Alert` deasupra titlului formularului, cu `role="alert"`. Mesaje:
- 401 → `Email sau parolă incorectă.`
- 409 (register) → `Există deja un cont cu acest email.` + link către login
- 429 → `Prea multe încercări. Reîncearcă în câteva minute.`
- 5xx → `Ceva n-a mers bine. Încearcă din nou.`

**Nu** enumera dacă emailul există sau nu la login (enumeration attack). Mesaj unic pentru credențiale greșite.

---

## 9. Accesibilitate

- Un singur `<h1>` pe pagină: headline-ul din panoul stâng pe desktop; pe mobil, titlul formularului devine `h1` (`Typography component="h1" variant="h4"`).
- `<main>` pe panoul drept, `<aside>` pe cel stâng.
- Ordinea de tab: email → parolă → toggle vizibilitate (`tabIndex={-1}`, deci sărit) → ține-mă minte → am uitat parola → CTA → link secundar.
- Enter în orice câmp trimite formularul.
- Focus vizibil: se folosește inelul din temă, **nu** `box-shadow` custom.
- Contrast minim 4.5:1 pentru tot textul, inclusiv `caption` și placeholder-e.
- `prefers-reduced-motion`: fără tranziții de intrare.
- Imaginea din panoul stâng: `alt=""` + `aria-hidden` (e decorativă, informația e în text).

---

## 10. Structura fișierelor

```
src/features/auth/
├── pages/
│   ├── LoginPage.tsx
│   └── RegisterPage.tsx
├── components/
│   ├── AuthLayout.tsx          // grid 2 coloane + responsive
│   ├── AuthBrandPanel.tsx      // panoul stâng
│   ├── AuthFormHeader.tsx      // titlu + subtitlu
│   ├── PasswordField.tsx       // TextField + toggle + strength opțional
│   ├── AuthAltAction.tsx       // divider + link secundar
│   └── TrustRow.tsx
├── schemas/
│   └── auth.schema.ts          // zod
└── hooks/
    └── useAuthForm.ts
```

`AuthLayout` primește `children` (formularul) și randează panoul stâng singur. Ambele pagini îl refolosesc — zero duplicare de layout.

Validare: `react-hook-form` + `zod` prin `zodResolver`, dacă sunt deja în stack. Altfel, state local + funcție de validare în `auth.schema.ts`, cu aceeași formă a erorilor.

---

## 11. Criterii de acceptare

- [ ] Nicio valoare de spațiere hardcodată în `sx` — totul prin `theme.spacing()`
- [ ] Nicio culoare hex în componente — totul prin `palette`
- [ ] Maxim 3 valori distincte de `border-radius` în tot feature-ul
- [ ] Zero `backdrop-filter`, zero elemente pseudo decorative
- [ ] Input-urile randează la 16px → focus pe iOS nu declanșează zoom
- [ ] Un singur mecanism de navigare login ↔ register
- [ ] **Fără scroll** la 1366×768, 1440×900, 390×844 și 375×667 — pe login și pe register
- [ ] **Fără scroll** nici cu `Alert`-ul de eroare afișat, pe aceleași viewporturi
- [ ] `height: 100dvh` pe container, nu `minHeight`, nu `vh`
- [ ] Autofill din browser și password manager funcționează pe ambele câmpuri
- [ ] Formularul e complet utilizabil doar cu tastatura
- [ ] Erorile de rețea apar în `Alert`, nu în toast
- [ ] Imaginea din panoul stâng nu se descarcă sub breakpoint-ul `md` (verifică în tab-ul Network)
- [ ] Lighthouse: Accessibility 100, LCP < 1.5s pe mobil

---

## 12. Explicit în afara scopului

Nu se implementează în acest task, chiar dacă apar în mockup:
- fluxul de resetare parolă (doar linkul, cu rută stub)
- OAuth / login social
- selecția tipului de cont (a trecut în onboarding — vezi D2)
- link „Înapoi la site" (logo-ul e deja link către homepage; e redundant)

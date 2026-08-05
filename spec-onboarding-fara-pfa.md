# Spec — Onboarding RIDElance: ramura „Nu am PFA" (înființare societate prin Consulto)

## 1. Context

În pasul de onboarding în care șoferul declară statutul fiscal, dacă selectează **„Nu am PFA"**, îl ducem printr-un flux de colectare a datelor necesare înființării societății. Datele sunt transmise ulterior către Consulto (partener juridic), care generează și depune actele.

Fluxul are 4 etape:

| Etapă | Nume | Conținut |
|---|---|---|
| 0 | Eligibilitate (**deja implementat**) | CI, permis, atestat — reutilizate ca precompletate |
| 1 | Date personale | identitate + domiciliu |
| 2 | Sediu social | adresă Consulto sau adresă proprie (+ date proprietar) |
| 3 | Acord de consimțământ + semnătură | wizard 5 pași + specimen semnătură |

**Stack:** .NET (backend, Clean Architecture), React (frontend), PostgreSQL.
**Design:** se folosește design system-ul existent RIDElance. Videoclipul atașat este **doar referință de UX/flux** pentru consimțământ și semnătură — nu se copiază stilul vizual.

---

## 2. Reutilizarea datelor din Pasul 0 (Eligibilitate)

CI, permisul de conducere și atestatul sunt deja încărcate și procesate la Eligibilitate (OpenRouter / Gemini 2.5 Flash pentru extragere).

- Câmpurile din Etapa 1 se **precompletează** din rezultatul inferenței pe CI: nume, prenume, CNP, serie, număr, autoritate emitentă, data emiterii, data expirării, domiciliu.
- Câmpurile precompletate sunt **editabile** (inferența poate greși) și marcate vizual cu un indicator de tip „completat automat din CI".
- La orice modificare manuală a unui câmp precompletat, se setează `IsManuallyEdited = true` pe câmpul respectiv (pentru audit / review admin).
- Documentele în sine (fișierele) se afișează read-only, cu buton „Înlocuiește documentul" care trimite înapoi în fluxul de verificare din Pasul 0.

**Nu se re-cere upload de CI/permis/atestat în această ramură.**

---

## 3. Etapa 1 — Date personale

### Câmpuri

**Identitate**
| Câmp | Tip | Validare |
|---|---|---|
| `nume` | text | obligatoriu, 2–100 car., doar litere + `- '` + diacritice |
| `prenume` | text | obligatoriu, 2–100 car. |
| `cnp` | text | obligatoriu, 13 cifre, **validare cifră de control** (algoritm standard 279146358279) |
| `tipActIdentitate` | enum | `CI`, `CIE`, `BI`, `PasaportStrain`, `PermisSedere` |
| `serieAct` | text | obligatoriu dacă tip ∈ {CI, BI}, 2 litere uppercase |
| `numarAct` | text | obligatoriu, 6 cifre pentru CI/BI |
| `autoritateEmitenta` | text | obligatoriu, max 150 car. |
| `dataEmiterii` | date | obligatoriu, ≤ azi |
| `dataExpirarii` | date | obligatoriu, > azi + 30 zile (blocant: nu putem înființa cu act care expiră) |

**Domiciliu** (obiect `Adresa` reutilizabil)
| Câmp | Tip | Validare |
|---|---|---|
| `judet` | select | obligatoriu, listă fixă 41 județe + București |
| `localitate` | text/autocomplete | obligatoriu |
| `strada` | text | obligatoriu |
| `numar` | text | obligatoriu (permite `12A`, `FN`) |
| `bloc` | text | opțional |
| `scara` | text | opțional |
| `etaj` | text | opțional |

> Notă: dacă în CI apare și „apartament", păstrăm câmpul opțional `apartament` pentru completitudine, chiar dacă nu a fost cerut explicit — costă zero și e necesar pentru actele Consulto.

### Consistență CNP ↔ CI
Validare soft (warning, nu blocant): sexul și data nașterii derivate din CNP se compară cu ce a extras inferența din CI. Dacă diferă → mesaj „Verificați CNP-ul".

---

## 4. Etapa 2 — Sediu social

### Selector principal (radio, obligatoriu)

```
( ) Folosesc o adresă pusă la dispoziție de Consulto
( ) Am adresă proprie
```

#### Varianta A — adresă Consulto
- **Un singur câmp**: `select` cu adresele disponibile, servite de backend (`GET /api/onboarding/sedii-disponibile`).
- Fiecare opțiune afișează: adresa completă + (dacă e cazul) costul lunar/anual al găzduirii sediului.
- Fără câmpuri suplimentare. Fără date de proprietar.

#### Varianta B — adresă proprie

1. **Sunt proprietarul imobilului?** (radio obligatoriu: Da / Nu)
2. **Adresa sediului**: `judet`, `localitate`, `strada`, `numar`, `bloc`, `scara`, `etaj` (același obiect `Adresa`)
   - Checkbox utilitar: „Sediul social coincide cu domiciliul" → copiază adresa din Etapa 1.
3. **Dacă „Nu" la proprietar** → se afișează blocul **Date proprietar**, cu exact aceleași câmpuri ca la Etapa 1:
   - nume, prenume, CNP, tip act, serie, număr, autoritate emitentă, data emiterii, data expirării, domiciliu (județ, localitate, stradă, număr, bloc, scară, etaj)
   - Se refolosește **același component** ca la Etapa 1 (`<PersoanaFizicaForm />`), cu prop `mode="proprietar"` (fără precompletare din CI, fără upload).
   - Suportă **1..n proprietari** (coproprietate). UI: listă cu „Adaugă proprietar" / „Elimină". Minim 1.

### Bife informative (doar pentru Varianta B)

Afișate ca panou de tip „info", cu checkbox-uri **obligatorii**:

- [ ] Confirm că dețin actele de proprietate pentru imobilul declarat ca sediu social (extras de carte funciară / contract de vânzare-cumpărare / contract de comodat sau închiriere).
- [ ] Înțeleg că aceste documente vor trebui transmise ulterior către Consulto pentru finalizarea înființării.
- [ ] *(dacă nu e proprietar)* Înțeleg că este necesar acordul scris al proprietarului pentru stabilirea sediului social.

Text informativ suplimentar (non-blocant, sub bife):
> Nu este nevoie să încărcați acum aceste documente. Veți primi pe e-mail instrucțiunile de transmitere după validarea datelor.

---

## 5. Etapa 3 — Acord de consimțământ + semnătură

Referință UX: videoclipul atașat. Structură: **wizard cu 5 pași de acord**, apoi **pad de semnătură**, apoi **ecran de succes**.

### 5.1 Structura wizardului

Header persistent:
- Titlu: `Acord de consimțământ`
- Subtitlu: `Pasul {n} din 5 · Citiți cu atenție`
- **Stepper orizontal** cu 5 noduri: pas completat = bifă verde, pas curent = cerc plin accent, pas viitor = cerc gol. Sub stepper, bară de progres liniară (`n/5`).

Fiecare pas conține:
- Titlu secțiune + subtitlu scurt
- Paragraf de declarație (text juridic)
- **O singură bifă** de acceptare, într-un card cu border. Neselectat = neutru; selectat = accent verde (border + text + iconiță check).
- Butoane: `Înapoi` (dezactivat la pasul 1) / `Continuă` (dezactivat până când bifa e selectată).

Avans automat la pasul următor după bifare (cu delay ~400ms), ca în video. Butonul `Continuă` rămâne prezent ca fallback pentru accesibilitate.

### 5.2 Conținutul celor 5 pași

> Textele juridice de mai jos sunt **draft** — trebuie validate de departamentul juridic Consulto înainte de producție. Se stochează versionat (vezi 5.5), nu hardcodate în componentă.

**Pasul 1 — Documentele care vor fi generate**
Subtitlu: *Ce urmează să semnați*
> Înțeleg că, pe baza datelor furnizate, Consulto va genera documentele necesare înființării societății: actul constitutiv, declarațiile pe proprie răspundere, cererea de înregistrare și, după caz, documentele privind sediul social. Documentele vor fi generate ulterior transmiterii acestui formular.

Bifă: `Am înțeles că documentele vor fi generate ulterior, pe baza datelor furnizate.`

**Pasul 2 — Mandat de completare și depunere**
Subtitlu: *Împuternicirea Consulto*
> Împuternicesc Consulto să completeze, în numele meu, documentele necesare înființării societății, cu datele furnizate în acest formular, și să efectueze demersurile de înregistrare la Oficiul Registrului Comerțului.

Bifă: `Împuternicesc Consulto să completeze și să depună documentele în numele meu.`

**Pasul 3 — Autorizarea semnăturii**
Subtitlu: *Acordați dreptul de aplicare*
> Autorizez în mod expres platforma Consulto să aplice semnătura mea electronică pe documentele menționate, în numele meu. Înțeleg că această acțiune echivalează cu semnarea documentelor de către mine și produce efecte juridice conform legislației în vigoare.

Bifă: `Autorizez aplicarea semnăturii mele electronice și recunosc valoarea ei juridică.`

**Pasul 4 — Declarație de bună-credință**
Subtitlu: *Confirmați corectitudinea datelor*
> Declar că informațiile furnizate sunt corecte, complete și că nu acționez sub nicio formă de constrângere. Confirm că am luat decizia de semnare în mod liber și informat.

Bifă: `Declar că informațiile sunt corecte și că acționez în mod liber și informat.`

**Pasul 5 — Date colectate și termeni**
Subtitlu: *Acceptul final*
> Sunt de acord ca platforma să colecteze datele necesare auditului: adresa IP, data și ora semnării, informații despre dispozitiv și acțiunile efectuate în cadrul procesului de semnare.

Bifă: `Sunt de acord cu colectarea datelor de audit și am citit [Termenii și Condițiile] și [Politica de Confidențialitate].`
(link-urile deschid în tab nou; nu întrerup wizardul)

### 5.3 Pad-ul de semnătură

Afișat după finalizarea pasului 5.

- Titlu: `Semnătură de consimțământ` / subtitlu: `Pasul final — confirmarea legală a semnăturilor`
- Text: *Prin această semnătură confirmați că ați citit, înțeles și acceptat toate declarațiile de mai sus și că semnătura aplicată are valoare juridică.*
- Canvas cu:
  - linie punctată de bază + placeholder „Semnați deasupra liniei"
  - selector de culoare: albastru (default) / negru
  - buton `Șterge`
  - buton primar `Confirmă semnătura` — **dezactivat** până când canvas-ul conține un traseu valid
- Validare „semnătură validă": minim 2 stroke-uri **sau** un stroke cu lungime totală > 150px și bounding box > 40×20px. Scop: blochează un simplu tap/punct.
- Input: `PointerEvent` (mouse + touch + stylus), `touch-action: none` pe canvas.
- Canvas la DPR-ul dispozitivului (`devicePixelRatio`) ca să nu iasă pixelat pe mobil.
- Pe mobil: canvas full-width, înălțime ~180px, cu opțiune de rotire landscape sugerată printr-un hint.

Bibliotecă recomandată: `react-signature-canvas` (sau implementare proprie pe canvas 2D cu interpolare quadratic — ~120 linii, fără dependință).

### 5.4 Ce se salvează

La `Confirmă semnătura`, POST către backend cu:

```jsonc
{
  "signatureImage": "data:image/png;base64,...",   // fundal transparent, trim la bounding box + padding 8px
  "signatureVector": [                              // pentru re-randare la orice rezoluție în actele PDF
    { "points": [{ "x": 0, "y": 0, "t": 0, "p": 0.5 }], "color": "#1E3A8A", "width": 2 }
  ],
  "canvasWidth": 658,
  "canvasHeight": 200,
  "consents": [
    { "stepKey": "documente_generate", "version": "1.0", "acceptedAtUtc": "2026-08-05T09:12:03Z" },
    { "stepKey": "mandat_completare",  "version": "1.0", "acceptedAtUtc": "..." },
    { "stepKey": "autorizare_semnatura", "version": "1.0", "acceptedAtUtc": "..." },
    { "stepKey": "buna_credinta", "version": "1.0", "acceptedAtUtc": "..." },
    { "stepKey": "date_audit_termeni", "version": "1.0", "acceptedAtUtc": "..." }
  ]
}
```

**Backend adaugă (nu se acceptă din client):**
- `ipAddress` (din `X-Forwarded-For`, primul IP public)
- `userAgent`, `deviceType`, `os`, `browser` (parsat server-side)
- `signedAtUtc` (ceasul serverului — nu al clientului)
- `sha256` peste `signatureImage` + payload-ul complet al datelor de onboarding (identitate + sediu + consimțăminte), stocat ca `payloadHash` → dovada că semnătura aparține **acestui set exact de date**
- `consentTextSnapshot`: textul integral al celor 5 declarații, exact cum a fost afișat (vezi 5.5)

### 5.5 Versionarea textelor juridice

Textele **nu se hardcodează în React**. Se servesc din backend:

`GET /api/legal/consent-flow?context=infiintare-societate`

```jsonc
{
  "version": "1.0",
  "effectiveFrom": "2026-08-01",
  "steps": [ { "key": "...", "title": "...", "subtitle": "...", "body": "...", "checkboxLabel": "..." } ]
}
```

Motiv: juridicul va schimba textele, iar acordurile deja date trebuie să rămână legate de versiunea afișată atunci. La semnare se salvează snapshot-ul complet, nu doar `version`.

### 5.6 Ecran de succes

- Bifă verde + `Cerere trimisă cu succes`
- `Ați semnat la data de {dd.MM.yyyy HH:mm}` (ora serverului, timezone `Europe/Bucharest`)
- *Mulțumim! O copie a documentelor semnate vă va fi trimisă pe adresa de e-mail în maximum 24 de ore.*
- Buton: `Înapoi la contul meu`

> Atenție la formulare: în acest punct documentele **nu sunt încă generate**. Nu afișăm „Contract semnat cu succes" (ca în video), ci „Cerere trimisă cu succes" — altfel inducem în eroare.

---

## 6. Model de date (PostgreSQL / EF Core)

```
CompanyFormationRequest
  Id (uuid, PK)
  DriverId (FK)
  Status (enum: Draft, Submitted, InReviewConsulto, InfoRequested, Approved, Rejected)
  CurrentStep (int)
  CreatedAtUtc, UpdatedAtUtc, SubmittedAtUtc

PersonalData            -- 1:1 cu CompanyFormationRequest
  Nume, Prenume, Cnp (encrypted at rest)
  TipAct, SerieAct, NumarAct, AutoritateEmitenta, DataEmiterii, DataExpirarii
  Domiciliu_* (owned type Adresa)
  PrefilledFields (jsonb) -- ce a venit din inferență vs. editat manual

RegisteredOffice        -- 1:1
  Type (enum: ConsultoProvided, Own)
  ConsultoAddressId (FK, nullable)
  IsOwner (bool, nullable)
  Adresa_* (owned type, nullable)
  AcknowledgedOwnershipDocs (bool)
  AcknowledgedSubmitLater (bool)
  AcknowledgedOwnerConsent (bool, nullable)

PropertyOwner           -- 1:n cu RegisteredOffice
  aceleași câmpuri ca PersonalData (fără PrefilledFields)

ConsentRecord           -- 1:n cu CompanyFormationRequest
  StepKey, Version, TextSnapshot (text), AcceptedAtUtc

SignatureRecord         -- 1:1
  ImagePath (obiect în storage, nu în DB), VectorData (jsonb)
  IpAddress, UserAgent, DeviceType, Os, Browser
  SignedAtUtc, PayloadHash (sha256)
```

**CNP** se criptează la rest (column-level, cheie în secret manager). Nu apare niciodată în loguri, nu se trimite în evenimente de analytics, e mascat în UI-ul de admin (`1******123456`) cu dezvăluire la cerere + audit log.

---

## 7. API

| Metodă | Endpoint | Descriere |
|---|---|---|
| `GET` | `/api/onboarding/company-formation` | Starea curentă + datele salvate (resume) |
| `PUT` | `/api/onboarding/company-formation/personal-data` | Salvare Etapa 1 (autosave la blur) |
| `GET` | `/api/onboarding/sedii-disponibile` | Lista adreselor Consulto |
| `PUT` | `/api/onboarding/company-formation/registered-office` | Salvare Etapa 2 |
| `GET` | `/api/legal/consent-flow?context=infiintare-societate` | Textele wizardului |
| `POST` | `/api/onboarding/company-formation/sign` | Consimțăminte + semnătură + submit final |
| `GET` | `/api/admin/company-formation/{id}` | Vizualizare admin |
| `GET` | `/api/admin/company-formation/{id}/export` | Export pachet pentru Consulto |

**Autosave:** Etapele 1 și 2 salvează draft la fiecare `onBlur` de câmp. Etapa 3 (wizard consimțământ) **nu** salvează parțial — se trimite atomic la semnare, ca să nu existe consimțăminte „pe jumătate date" în DB.

**Idempotență:** `POST /sign` acceptă header `Idempotency-Key`. Retrimiterea aceleiași chei returnează rezultatul original, nu creează a doua semnătură.

---

## 8. Reguli de flux

- Nu se poate trece la Etapa 2 fără Etapa 1 validă; nu se poate intra în Etapa 3 fără Etapa 2 validă. Validare **și pe server**, nu doar în UI.
- După `Submitted`, formularul devine read-only pentru șofer. Modificările se fac doar dacă adminul trece cererea în `InfoRequested` (cu motiv), caz în care se redeschid **doar** etapele indicate — iar consimțămintele și semnătura **se invalidează și se re-cer** (datele s-au schimbat → hash-ul nu mai corespunde).
- Revenirea la un pas anterior din wizardul de consimțământ **nu** debifează pașii deja acceptați.
- Abandon: draftul se păstrează 90 de zile; după, se șterge automat (GDPR — minimizare).

---

## 9. Export către Consulto

`GET /api/admin/company-formation/{id}/export` → ZIP:

```
/{cnp-hash}/
  date-solicitant.pdf         # toate câmpurile, formatat
  semnatura.png               # transparent, 300 DPI echivalent
  dovada-consimtamant.pdf     # 5 declarații + timestamp + IP + device + hash
  ci.jpg, permis.jpg, atestat.jpg   # din Pasul 0
  metadata.json
```

---

## 10. Accesibilitate & mobil

- Wizardul e navigabil de la tastatură; bifele sunt `<input type="checkbox">` reale, nu `div`-uri.
- `aria-live="polite"` pe schimbarea pasului, ca screen readerul să anunțe „Pasul 3 din 5".
- Canvas-ul de semnătură are alternativă accesibilă: buton `Nu pot semna pe ecran` → afișează instrucțiuni de contactare a suportului. Nu blocăm utilizatorii cu dizabilități motorii.
- Toate câmpurile de adresă: `autocomplete` corect (`address-level1`, `address-line1` etc.).
- Testare obligatorie pe viewport 360px (Android low-end) — pad-ul de semnătură e cel mai fragil element aici.

---

## 11. Criterii de acceptanță

1. Selectarea „Nu am PFA" duce în Etapa 1 cu date precompletate din CI-ul încărcat la Eligibilitate.
2. CNP invalid (cifră de control) blochează avansarea, cu mesaj explicit.
3. CI expirat sau care expiră în <30 zile blochează avansarea.
4. „Adresă Consulto" afișează exact un câmp select; nicio referință la proprietar.
5. „Adresă proprie" + „nu sunt proprietar" afișează formularul complet de proprietar, cu aceleași validări ca la solicitant; se pot adăuga mai mulți proprietari.
6. Bifele privind actele de proprietate sunt obligatorii pentru avansare (doar pe ramura „adresă proprie").
7. Wizardul de consimțământ nu permite `Continuă` fără bifă; stepperul reflectă corect starea.
8. `Confirmă semnătura` e inactiv pe canvas gol sau cu un simplu punct.
9. După semnare, în DB există: 5 `ConsentRecord` cu snapshot text, 1 `SignatureRecord` cu IP + device + timestamp server + hash.
10. Reload la orice pas din Etapele 1–2 restaurează datele; reload în timpul wizardului repornește wizardul de la pasul 1 (acceptabil, e scurt).
11. Dublu-click pe `Confirmă semnătura` nu creează două cereri.
12. CNP-ul nu apare în niciun log de aplicație.

---

## 12. În afara scopului (fazele următoare)

- Generarea efectivă a PDF-urilor cu semnătura aplicată (rămâne la Consulto).
- Semnătură electronică calificată (QES) / integrare cu furnizor certificat — momentan e semnătură electronică simplă cu probatoriu de audit.
- Plata serviciului de înființare.
- Verificarea disponibilității denumirii firmei la ONRC.

---

## 13. De clarificat cu Consulto înainte de implementare

1. Textele finale ale celor 5 declarații (cele de mai sus sunt draft).
2. Sunt necesare date suplimentare pentru înființare: denumirea firmei (3 variante), obiectul de activitate CAEN, capitalul social, durata mandatului de administrator? **Acestea lipsesc din specificația primită**, dar sunt obligatorii la ONRC — probabil le colectează Consulto separat, dar trebuie confirmat.
3. Lista adreselor de sediu puse la dispoziție + costurile aferente.
4. Formatul exact al pachetului de export dorit de ei.
5. Semnătura electronică simplă este suficientă juridic pentru actul constitutiv, sau e nevoie de semnătură calificată?

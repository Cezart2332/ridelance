# Spec — Fix-uri Onboarding RIDElance

> **Context important pentru agent:** majoritatea problemelor de mai jos au fost raportate în iterațiile anterioare și **nu au fost rezolvate**. Nu marca niciun task ca finalizat pe baza faptului că "codul pare corect" — fiecare item are criterii de acceptare verificabile manual, parcurgând flow-ul end-to-end în browser.

---

## 0. Reguli globale (obligatorii)

1. **Zero valori hardcodate în UI.** Spacing exclusiv prin `theme.spacing()`, culori exclusiv prin `palette.*`, typography prin `theme.typography.*`. Fără `#hex`, fără `px` scriși direct, fără `margin: "16px"`.
2. **Zero valori de business hardcodate.** Prețuri, tarife, liste de documente, IBAN-uri ARR — toate din config / DB / constante centralizate, nu inline în componente.
3. **O singură sursă de adevăr pentru starea onboarding-ului.** Toți pașii citesc din același obiect de stare server-side (state machine). Nu duplica date între pași.
4. **Componente reutilizate, nu duplicate.** Blocul "conturi ARR", "generare dosar", "upload document" apar în mai multe ramuri (cu PFA / fără PFA / proprietate / leasing) — trebuie să fie **aceeași componentă**, altfel fix-urile se aplică doar pe o ramură (exact ce se întâmplă acum).
5. **Fiecare bug fixat primește un test** (unit sau integration, după caz). Aceste probleme au regresat deja o dată.
6. La final, rulează checklist-ul din secțiunea 12 pe **ambele** ramuri: "am PFA" și "nu am PFA".

---

## 1. [P0] Validare CNP — fals negativ + alertă ilizibilă

### Problemă
Pe ramura "nu am PFA", după încărcarea buletinului și introducerea CNP-ului corect, sistemul afișează eroare că CNP-ul nu se potrivește. Alerta în sine este prost stilizată și greu de citit.

### Fix — validare
- Normalizează **ambele** valori înainte de comparație: CNP-ul tastat de utilizator și CNP-ul extras din OCR-ul buletinului.
  - `trim()`, eliminare spații interne, caractere zero-width (`\u200B`, `\uFEFF`), separatori (`-`, `.`, `/`), conversie cifre non-ASCII.
  - Rezultat final: string de exact 13 cifre pe ambele părți, apoi comparație strictă.
- Adaugă validare de **checksum CNP** (algoritm cu cheia `279146358279`) *înainte* de comparația cu OCR-ul. Dacă CNP-ul tastat e invalid matematic → eroare clară pe câmp: "CNP invalid — verifică cifrele".
- Verifică coerența CNP ↔ data nașterii ↔ sex din structura CNP-ului (S, AA, LL, ZZ) și, dacă OCR-ul a extras data nașterii, compară pe acolo ca validare secundară.
- **OCR-ul nu trebuie să blocheze.** Dacă scorul de confidence al extragerii CNP din buletin este sub prag (recomandat 0.85) sau câmpul nu a fost extras:
  - **NU** afișa eroare blocantă.
  - Afișează un `Alert severity="warning"`: "Nu am putut citi clar CNP-ul din buletin. Verifică datele introduse manual." și lasă utilizatorul să continue.
  - Loghează cazul pentru review manual (flag `requiresManualIdentityReview` pe onboarding state).
- Eroarea blocantă rămâne **doar** când ambele valori sunt citite cu confidence ridicat și diferă efectiv.

### Fix — UI alertă
- Folosește `<Alert severity="error">` MUI, plasat imediat sub câmpul afectat, nu în josul paginii / nu ca toast care dispare.
- `role="alert"` + `aria-live="polite"` pentru accesibilitate.
- Culorile din `palette.error.main` / `palette.error.contrastText`; contrast text/fundal minim WCAG AA (4.5:1). Fără text roșu pe fundal roșu.
- Câmpul `TextField` asociat primește `error` + `helperText` cu mesajul scurt; `Alert`-ul conține explicația extinsă și acțiunea recomandată ("Reîncarcă buletinul" / "Corectează CNP-ul").
- Mesajul trebuie să spună **care** valoare nu se potrivește și ce poate face utilizatorul, nu doar "date invalide".

### Criterii de acceptare
- [ ] Buletin valid + CNP corect tastat → **nicio** eroare, pasul avansează.
- [ ] CNP cu checksum greșit → eroare pe câmp, mesaj specific.
- [ ] OCR eșuat / confidence mic → warning non-blocant, utilizatorul poate continua.
- [ ] Alerta este vizibilă, lizibilă, ancorată lângă câmp, cu contrast AA.

---

## 2. [P0] Adresa sediului social lipsește complet

### Problemă
Nu există câmpuri pentru adresa sediului social. Fără ea nu se poate depune dosarul de înființare PFA la ONRC.

### Fix
Adaugă în pasul de date PFA un bloc **"Sediul social"** cu:
- Checkbox sus: **"Sediul social este la adresa din buletin"** (bifat implicit dacă OCR-ul a extras adresa). Când e bifat, câmpurile se precompletează și devin read-only, cu link "Modifică".
- Câmpuri: Județ (select), Localitate, Stradă, Număr, Bloc, Scară, Etaj, Apartament, Cod poștal.
- Validare: Județ, Localitate, Stradă, Număr, Cod poștal — obligatorii. Cod poștal: 6 cifre.
- Județul de aici este **sursa principală** pentru precompletarea județului ARR (vezi secțiunea 7).
- Adaugă un câmp opțional **"Document care atestă spațiul"** (contract comodat / act proprietate / acord asociație) dacă fluxul ONRC îl cere — dacă nu e clar, marchează ca TODO și întreabă, nu inventa.

### Criterii de acceptare
- [ ] Adresa sediului social este persistată pe onboarding state și apare în payload-ul trimis către Consulto.
- [ ] Bifarea checkbox-ului precompletează corect din datele buletinului.
- [ ] Fără adresă completă, pasul nu poate fi finalizat.

---

## 3. [P0] Pasul de plată — sumă și copy greșite

### Problemă
Se cer **300 lei** cu un text care nu descrie corect ce se plătește.

### Fix
- Suma corectă: **399 lei**. Definită într-o singură constantă/config (`Pricing.RidelanceStart.OnboardingAdvance`), nu în componentă.
- Copy nou (exact):

  **Titlu:** `Plata abonamentului RIDElance Start`

  **Corp:**
  > Pentru continuarea procedurii este necesară plata în avans a abonamentului **RIDElance Start — 399 lei**.
  >
  > Ne ocupăm de deschiderea PFA-ului, de obținerea documentelor necesare și de setarea conturilor pentru desfășurarea activității independente.

  **Sub sumă, badge/chip vizibil:** `Nerambursabilă`

- Adaugă un checkbox de confirmare obligatoriu înainte de plată: *"Am înțeles că suma de 399 lei reprezintă plata în avans a abonamentului RIDElance Start și este nerambursabilă."* — butonul de plată e disabled până la bifare.
- Momentul plății rămâne **înainte** de transmiterea efectivă către Consulto. Verifică textul care sugerează că datele "au fost deja transmise" — trebuie să fie: "Datele tale sunt pregătite pentru transmitere. După confirmarea plății, le trimitem către partenerul nostru contabil."
- Chitanța/factura: după plată, afișează confirmarea și trimite factura pe email.

### Criterii de acceptare
- [ ] Nicăieri în UI nu mai apare 300 lei.
- [ ] Suma vine din config; schimbarea în config se reflectă în UI fără modificări de cod.
- [ ] Checkbox-ul de nerambursabilitate blochează plata până la bifare.

---

## 4. [P1] Cont bancar — QR-ul dispare pe ramura "am nevoie de cont bancar"

### Problemă
La selectarea "Am nevoie de cont bancar" nu mai apare codul QR, ci doar butonul cu link către onboarding-ul BCR.

### Fix
- Afișează **ambele**, în aceeași componentă:
  - **QR code** (pentru cazul în care utilizatorul e pe desktop și vrea să continue pe telefon), cu label: "Scanează pentru a deschide contul de pe telefon".
  - **Buton primar** "Deschide cont la BCR" cu link-ul de onboarding.
- Pe viewport mobil (`useMediaQuery(theme.breakpoints.down('sm'))`) QR-ul poate fi colapsat într-un accordion "Continuă pe alt dispozitiv", dar **nu eliminat**.
- Componenta de link BCR trebuie să fie una singură, folosită pe toate ramurile — verifică dacă există duplicate care au divergat.
- Link-ul și payload-ul QR-ului provin din aceeași sursă (config), nu din două locuri diferite.

### Criterii de acceptare
- [ ] Pe ambele răspunsuri ("am cont" / "am nevoie de cont"), QR-ul este prezent unde e relevant.
- [ ] QR-ul encodează exact URL-ul din buton.

---

## 5. [P1] Email Oblio nu se precompletează

### Problemă
La pasul de deschidere cont Oblio, câmpul de email este gol în loc să fie precompletat cu emailul introdus la crearea contului RIDElance.

### Fix
- Precompletează din `onboardingState.contactEmail` (aceeași sursă folosită și la pasul Uber Fleet — vezi secțiunea 9).
- Câmpul rămâne **editabil** (utilizatorul poate vrea un email dedicat pentru facturare), dar precompletat.
- Adaugă `helperText`: "Precompletat cu emailul contului tău RIDElance. Îl poți modifica."
- Auditează **toate** câmpurile de email din onboarding și asigură-te că toate citesc din aceeași sursă. Dacă vreunul citește din alt loc (form local state, context nesincronizat) — corectează.

### Criterii de acceptare
- [ ] Emailul apare precompletat la Oblio.
- [ ] Modificarea lui nu afectează emailul contului RIDElance.

---

## 6. [P1] Butonul "Continuă" persistă după upload

### Problemă
La unele documente, după încărcarea fișierului rămâne butonul "Continuă" în loc să se avanseze automat.

### Fix
- Definește regula, o singură dată, în componenta de upload:
  - **Pas cu un singur document obligatoriu** → după upload reușit (răspuns OK + validare fișier trecută), se afișează scurt starea de succes (~800ms, cu indicator) și se avansează **automat**. Butonul "Continuă" nu se randează deloc.
  - **Pas cu mai multe documente** → "Continuă" se randează, dar este `disabled` până când toate documentele obligatorii au status `uploaded && valid`. Sub buton, un contor: "2 din 3 documente încărcate".
- Auditează **fiecare** pas de upload din onboarding și clasifică-l explicit într-una din cele două categorii. Documentează clasificarea în cod (enum/config al catalogului de documente, nu logică ad-hoc per componentă).
- Avansarea automată trebuie să aibă un mecanism de anulare: dacă utilizatorul dă click pe "Înlocuiește fișierul" în intervalul de tranziție, avansarea se oprește.

### Criterii de acceptare
- [ ] Pentru fiecare pas single-document: upload → avansare automată, fără buton.
- [ ] Pentru fiecare pas multi-document: "Continuă" activ doar când toate sunt încărcate.

---

## 7. [P0] Aviz medical și aviz psihologic — trebuie să fie DOUĂ documente

### Problemă
Raportat de cel puțin două iterații: sunt tratate ca un singur document. Zero modificări față de săptămâna trecută.

### Fix
Sunt **două avize distincte, emise de instituții diferite, cu valabilități diferite**:

| Cod | Denumire afișată | Emitent | Observații |
|---|---|---|---|
| `AVIZ_MEDICAL` | Aviz medical | Cabinet de medicina muncii / unitate autorizată | Are dată de emitere și dată de expirare proprii |
| `AVIZ_PSIHOLOGIC` | Aviz psihologic | Cabinet de psihologie autorizat | Are dată de emitere și dată de expirare proprii |

De verificat și modificat în **toate** locurile:
1. Enum / catalog de tipuri de documente — două intrări separate.
2. Migrare DB + seed.
3. UI onboarding — două carduri de upload distincte, cu titluri și descrieri diferite.
4. Validare — fiecare obligatoriu independent.
5. Generatorul de dosar ARR — două intrări în ordinea documentelor.
6. Dashboard-ul PFA (secțiunea de documente/expirări) — două rânduri, cu alerte de expirare separate.
7. Orice mapare către API-uri externe.

> Dacă în cod există un singur tip `AVIZ_MEDICAL_PSIHOLOGIC` sau similar, scrie migrarea care îl împarte în două, inclusiv pentru înregistrările existente.

### Criterii de acceptare
- [ ] Utilizatorul încarcă două fișiere separate.
- [ ] Ștergerea unuia nu afectează celălalt.
- [ ] Ambele apar separat în dosarul generat și pe dashboard.

---

## 8. [P0] Județ ARR nepre completat + conturi ARR lipsă + metodă de depunere

### 8.1 Precompletare județ
- La întrebarea "Unde depui dosarul ARR?", selectul de județ se precompletează astfel, în această ordine de prioritate:
  1. Județul din **adresa sediului social** (secțiunea 2).
  2. Județul din adresa de pe buletin (OCR).
  3. Gol, dacă niciuna nu e disponibilă.
- Selectul rămâne editabil. `helperText`: "Precompletat pe baza adresei sediului social. Poți alege alt județ."

### 8.2 Conturi ARR — date și UI
Creează tabelul `arr_accounts` cu migrare + seed:

```
id            (PK)
county_code   (varchar, ex. CT, B, IF)
county_name   (varchar)
treasury      (varchar)
fiscal_code   (varchar)
iban          (varchar)
is_active     (bool, default true)
```

**Seed (42 înregistrări):**

| Județ | Trezorerie | Cod fiscal | IBAN |
|---|---|---|---|
| Alba | Trezoreria Alba Iulia | 23831610 | RO07TREZ002501701X006776 |
| Arad | Trezoreria Arad | 23852834 | RO21TREZ021501701X022783 |
| Argeș | Trezoreria Pitești | 23823618 | RO69TREZ046501701X013901 |
| Bacău | Trezoreria Bacău | 23826193 | RO32TREZ061501701X013675 |
| Bihor | Trezoreria Oradea | 23822485 | RO95TREZ076501701X014947 |
| Bistrița-Năsăud | Trezoreria Bistrița | 23811109 | RO15TREZ101501701X008660 |
| Botoșani | Trezoreria Botoșani | 23902070 | RO77TREZ116501701X007622 |
| Brașov | Trezoreria Brașov | 23860730 | RO97TREZ131501701X015876 |
| Brăila | Trezoreria Brăila | 23873330 | RO68TREZ151501701X008936 |
| București | Trezoreria Statului Sector 5 | 27364739 | RO37TREZ705501701X008844 |
| Buzău | Trezoreria Buzău | 23870172 | RO49TREZ166501701X011199 |
| Caraș-Severin | Trezoreria Reșița | 23818980 | RO61TREZ181501701X005726 |
| Călărași | Trezoreria Călărași | 23839606 | RO44TREZ201501701X005360 |
| Cluj | Trezoreria Cluj-Napoca | 23826223 | RO93TREZ216501701X030552 |
| Constanța | Trezoreria Constanța | 23856208 | RO62TREZ231501701X023622 |
| Covasna | Trezoreria Sfântu Gheorghe | 23819170 | RO75TREZ256501701X006543 |
| Dâmbovița | Trezoreria Târgoviște | 23886756 | RO33TREZ271501701X008638 |
| Dolj | Trezoreria Craiova | 23828933 | RO98TREZ291501701X017175 |
| Galați | Trezoreria Galați | 23812074 | RO74TREZ306501701X013999 |
| Giurgiu | Trezoreria Giurgiu | 23872173 | RO05TREZ321501701X008723 |
| Gorj | Trezoreria Târgu Jiu | 23828968 | RO30TREZ336501701X008448 |
| Harghita | Trezoreria Miercurea Ciuc | 23825180 | RO25TREZ351501701X004833 |
| Hunedoara | Trezoreria Deva | 23818913 | RO90TREZ366501701X009561 |
| Ialomița | Trezoreria Slobozia | 23891035 | RO98TREZ391501701X006443 |
| Iași | Trezoreria Iași | 23817055 | RO92TREZ406501701X020597 |
| Ilfov | Trezoreria Ilfov | 23888021 | RO70TREZ421501701X008461 |
| Maramureș | Trezoreria Baia Mare | 23845632 | RO33TREZ436501701X013376 |
| Mehedinți | Trezoreria Drobeta-Turnu Severin | 23862005 | RO26TREZ461501701X006163 |
| Mureș | Trezoreria Mureș | 23872190 | RO84TREZ476501701X014897 |
| Neamț | Trezoreria Neamț | 13220458 | RO47TREZ491501701X014477 |
| Olt | Trezoreria Slatina | 23839410 | RO03TREZ506501701X009236 |
| Prahova | Trezoreria Ploiești | 23835558 | RO84TREZ521501701X013579 |
| Satu Mare | Trezoreria Satu Mare | 23906110 | RO51TREZ546501701X010035 |
| Sălaj | Trezoreria Zalău | 23845535 | RO36TREZ561501701X007861 |
| Sibiu | Trezoreria Sibiu | 23823626 | RO84TREZ576501701X018812 |
| Suceava | Trezoreria Suceava | 23828585 | RO59TREZ591501701X007603 |
| Teleorman | Trezoreria Alexandria | 23837621 | RO24TREZ606501701X007244 |
| Timiș | Trezoreria Timișoara | 23864430 | RO49TREZ621501701X019385 |
| Tulcea | Trezoreria Tulcea | 23877260 | RO03TREZ641501701X006931 |
| Vaslui | Trezoreria Vaslui | 23889639 | RO94TREZ656501701X005177 |
| Vâlcea | Trezoreria Vâlcea | 23830585 | RO58TREZ671501701X010656 |
| Vrancea | Trezoreria Focșani | 23829440 | RO60TREZ691501701X008590 |

**UI:** după selectarea județului, se afișează un card `ArrPaymentDetailsCard` cu:
- Beneficiar: `A.R.R. — Agenția Teritorială {Județ}`
- Cod fiscal (cu buton de copiere)
- IBAN (cu buton de copiere, formatat în grupuri de 4 caractere pentru lizibilitate; copierea copiază fără spații)
- Trezoreria
- Câmp "Sumă de plată" — **din config, nu inventat**. Dacă tarifele ARR nu sunt încă disponibile în sistem, afișează un placeholder explicit și marchează TODO; nu pune o sumă din memorie.
- Text explicativ: ce se plătește și că dovada plății trebuie atașată la dosar.

Componenta se randează **identic** pe toate ramurile (cu PFA / fără PFA / proprietate / leasing / comodat). În acest moment lipsește pe cel puțin două dintre ele.

### 8.3 Metoda de depunere
- Opțiunea **"Depunere online prin RIDElance"** → `disabled`, stil dezactivat (text `palette.text.disabled`), cu `Chip` alături: **"În curând"**.
- Nu poate fi selectată. Tooltip la hover: "Această opțiune va fi disponibilă în curând. Momentan dosarul se depune personal la agenția ARR."
- Opțiunea implicit selectată devine depunerea fizică la agenție.

### Criterii de acceptare
- [ ] Județul apare precompletat.
- [ ] Cardul cu contul ARR apare pe toate ramurile, cu datele corecte pentru județul selectat.
- [ ] Copierea IBAN-ului funcționează și copiază fără spații.
- [ ] "Depunere online prin RIDElance" e gri, nu se poate selecta, are chip "În curând".

---

## 9. [P0] Generarea dosarului nu funcționează

### Problemă
Click pe "Generează dosar" → nu se generează nimic, aplicația trece direct la butonul "Am depus dosarul". Consecință: și fix-ul cerut anterior pentru paginile în plus din PDF nu poate fi validat (probabil nici nu a fost aplicat).

### Fix — flow
Butonul "Generează dosar" trebuie să execute, în ordine:
1. `disabled` + `CircularProgress` + text "Se generează dosarul...".
2. Apel către endpoint-ul de generare. **Așteaptă răspunsul.** Bug-ul actual este aproape sigur o avansare optimistă a state machine-ului pe `onClick`, fără `await`.
3. La succes: afișează preview + buton "Descarcă dosarul (PDF)". Abia acum se deblochează "Am depus dosarul".
4. La eroare: `Alert severity="error"` cu mesaj + buton "Încearcă din nou". State machine-ul **nu** avansează.
5. Butonul "Am depus dosarul" rămâne `disabled` până când dosarul a fost generat **și** descărcat cel puțin o dată.

### Fix — conținutul PDF-ului
- Regulă: **un document sursă = exact numărul lui de pagini**. Fără pagini albe, fără pagini separator, fără pagini de "cover" per document.
- Cauze frecvente de verificat:
  - Page break adăugat necondiționat după fiecare document (trebuie adăugat doar *între* documente, nu după ultimul).
  - Imagini (JPG/PNG de la poze de buletin/talon) scalate incorect care depășesc marginal pagina și generează o a doua pagină aproape goală → folosește `fit: contain` în interiorul zonei utile a paginii, cu marje din constante.
  - PDF-uri sursă cu pagini albe la final — detectează și elimină paginile fără conținut (text extractabil gol + fără imagini).
- Ordinea documentelor în dosar: definită într-o listă configurabilă (`ArrDossierDocumentOrder`), nu în ordinea în care au fost încărcate.
- Adaugă **o singură** pagină de opis/cuprins la început, dacă e cerută — dacă nu e cerută explicit, nu o adăuga.

### Test obligatoriu
Test de integrare: generează un dosar cu N documente de dimensiuni cunoscute (ex: 1 PDF de 2 pagini + 3 imagini) și verifică `pageCount == 5` (+1 doar dacă opisul e activat). Fără acest test, task-ul nu e considerat gata.

### Criterii de acceptare
- [ ] Click pe "Generează dosar" produce un PDF descărcabil.
- [ ] "Am depus dosarul" este blocat până la generare + descărcare.
- [ ] Numărul de pagini din PDF = suma paginilor documentelor sursă.
- [ ] Funcționează identic pe ramura cu PFA existent și pe cea de leasing.

---

## 10. [P0] Pasul 05 — Uber Fleet / Bolt

### 10.1 Întrebarea "Ai deja cont Uber Fleet?"
- Doar **două** opțiuni: `Da` / `Nu`. Elimină orice altă variantă existentă ("Nu știu", "Vreau ajutor", etc.).
- Implementare: `RadioGroup` cu exact două `FormControlLabel`, orientate orizontal pe desktop.

### 10.2 Precompletare email
- Dacă răspunsul este **Nu** (deci contul se creează acum) → câmpul de email se precompletează din `onboardingState.contactEmail`, editabil, cu `helperText` corespunzător.
- Dacă răspunsul este **Da** → câmpul rămâne gol (utilizatorul introduce emailul contului existent), cu placeholder explicativ.

### 10.3 Parola
- **Obligatorie în ambele cazuri.** Elimină eticheta "(opțional)".
- Validare: minim 8 caractere, cel puțin o literă și o cifră. `required: true` în schema de validare, nu doar în UI.
- Adaugă toggle show/hide și indicator de putere a parolei.
- Text explicativ scurt: de ce avem nevoie de parolă (gestionarea contului de flotă în numele PFA-ului).

### 10.4 [BLOCANT] Butonul "Continuă" rămâne dezactivat
După completarea datelor pentru Uber Fleet și Bolt, utilizatorul **nu mai poate avansa** — flow-ul se blochează la pasul 05.

Cauze de investigat, în ordine:
1. Schema de validare cere câmpuri care nu mai sunt randate după schimbarea răspunsului Da/Nu (câmpuri "fantomă" rămase `required` în schema, dar unmount-ate din DOM). → Schema trebuie să fie **condițională** pe răspuns.
2. State-ul formularului nu se resetează la comutarea Da/Nu, rămânând erori vechi.
3. Validarea Bolt și cea Uber sunt în două forme separate, iar butonul citește doar `isValid` de la una dintre ele (sau de la un context nesincronizat).
4. Câmpuri validate async (verificare email disponibil) care rămân în starea `validating` la infinit.

**Obligatoriu:** când butonul "Continuă" este `disabled`, afișează sub el motivul concret — "Completează: parola contului Bolt". Un buton dezactivat fără explicație este inacceptabil pe tot fluxul de onboarding; aplică regula global.

### Criterii de acceptare
- [ ] Doar Da/Nu la întrebarea despre contul de flotă.
- [ ] Email precompletat pe ramura "Nu".
- [ ] Parola obligatorie pe ambele ramuri.
- [ ] Cu toate câmpurile completate, "Continuă" este activ și pasul avansează.
- [ ] Când e dezactivat, motivul este afișat explicit.

---

## 11. [P1] Pasul 06 — Mașina

### 11.1 Elimină "Adaug mașina mai târziu"
- Opțiunea dispare complet din UI. Mașina este obligatorie pentru finalizarea onboarding-ului.
- Verifică și în state machine: nu trebuie să existe tranziție care sare peste pasul de vehicul.

### 11.2 Documente pe tip de deținere
Documentele cerute se schimbă în funcție de modul de deținere. Definește maparea în config, nu în componentă:

| Mod de deținere | Documente obligatorii |
|---|---|
| Proprietate | Certificat de înmatriculare (talon), Carte de identitate a vehiculului, RCA, ITP |
| **Leasing** | **Contract de leasing**, **Acord de leasing** (acordul finanțatorului pentru utilizarea vehiculului în transport alternativ), Certificat de înmatriculare, RCA, ITP |
| Comodat | Contract de comodat, Acordul proprietarului, Certificat de înmatriculare, RCA, ITP |

**Raportat de mai multe ori și încă nerezolvat:**
- Eticheta pentru leasing este "Contract" → trebuie **"Contract de leasing"**.
- **"Acord de leasing" lipsește complet** → trebuie adăugat ca document obligatoriu separat, cu descriere: "Acordul societății de leasing pentru utilizarea vehiculului în activitatea de transport alternativ."

Fiecare document are: cod, denumire afișată, descriere scurtă, obligatoriu da/nu, formate acceptate, dimensiune maximă.

### 11.3 ARR și generare dosar pe ramura leasing
Pe ramura de leasing lipsesc conturile ARR și generarea dosarului. Cauza este aproape sigur duplicarea componentelor. Refactorizează astfel încât secțiunile **"Conturi ARR"** (8.2) și **"Generare dosar"** (9) să fie o singură componentă folosită de toate ramurile.

### Criterii de acceptare
- [ ] "Adaug mașina mai târziu" nu mai există nicăieri.
- [ ] Leasing cere "Contract de leasing" ȘI "Acord de leasing", ambele obligatorii.
- [ ] Conturile ARR și generarea dosarului apar și funcționează pe ramura de leasing.

---

## 12. [P1] Starea dashboard-ului după finalizarea onboarding-ului

### Problemă
După finalizare apare încă "Conectează Bolt" și "Încarcă raport Uber", în loc de dashboard-ul normal.

### Fix
- La finalizarea onboarding-ului → redirect către **dashboard-ul standard PFA**, cu layout complet, toate valorile la `0` și empty states corecte.
- KPI-uri: `0 curse`, `0 lei încasări`, `0 lei cheltuieli`, grafice goale cu mesaj "Nu ai încă date pentru această perioadă".
- **CTA-urile de conectare dispar** dacă integrările au fost configurate în onboarding. Starea integrării devine:
  - `Conectat` — dacă avem confirmarea contului.
  - `În procesare` — dacă contul de flotă a fost creat dar așteptăm activarea din partea Uber/Bolt. Card informativ, nu CTA: "Contul tău Uber Fleet este în curs de activare. Primele rapoarte apar automat după prima cursă."
- CTA-ul "Conectează Bolt" / "Încarcă raport Uber" se afișează **doar** dacă integrarea respectivă chiar lipsește (utilizator care a sărit pasul sau conectare eșuată).
- Empty state general, sub KPI-uri: "Totul e pregătit. Datele apar aici după prima ta cursă."

### Criterii de acceptare
- [ ] După onboarding complet → dashboard normal, valori 0, fără CTA-uri de conectare.
- [ ] Statusul integrărilor reflectă ce s-a configurat efectiv în onboarding.

---

## 13. [P1] Mod dev/QA — navigare granulară între pași

### Scop
În acest moment, testarea unui bug de la pasul 06 presupune reparcurgerea întregului flow. Este nevoie de un instrument intern care permite saltul la **orice pas individual**, nu la începutul unei secțiuni. Este strict pentru dezvoltare și QA, **nu** o funcționalitate pentru utilizatorul final.

### 13.1 Gating (obligatoriu, triplu)
Instrumentul trebuie să fie inaccesibil în producție. Trei niveluri, toate necesare:

1. **Build-time:** codul panoului dev este inclus doar dacă `VITE_ONBOARDING_DEVTOOLS === 'true'`. În build-ul de producție trebuie eliminat prin tree-shaking — verifică în bundle-ul final că nu apare.
2. **Runtime server:** feature flag `Onboarding:DevTools:Enabled` din configurație, forțat `false` când mediul este `Production`.
3. **Autorizare:** utilizatorul trebuie să fie într-un allowlist explicit (rol `OnboardingDevTester` sau listă de user ID-uri din config).

**Critic:** state machine-ul este server-side, deci saltul între pași trebuie autorizat **pe server**. Nu este suficient să ascunzi butonul din UI. Endpoint-urile dev trebuie să returneze **404** (nu 403) când gating-ul nu trece, ca să nu dezvăluie existența lor.

### 13.2 Endpoint-uri
```
POST /api/dev/onboarding/{onboardingId}/jump      { targetStepId }
POST /api/dev/onboarding/{onboardingId}/complete  { stepId, useMockData: bool }
POST /api/dev/onboarding/{onboardingId}/reset     { scope: "step" | "section" | "all", targetId? }
```
- `jump` mută starea la pasul țintă **fără** a rula validările pașilor anteriori, dar marchează pașii săriți cu `status = SkippedInDev`.
- Toate cele trei scriu într-un audit log (cine, când, de la ce pas la ce pas).

### 13.3 UI — panou dev
- Buton flotant discret (colț dreapta-jos), care deschide un `Drawer` MUI.
- Conținut: arborele complet al onboarding-ului — **secțiuni cu pașii lor listați dedesubt**, pasul curent evidențiat, fiecare pas cu status (`completat` / `sărit` / `blocat` / `curent`).
- Click pe orice pas → salt direct la el.
- Per pas, acțiuni rapide: `Sari aici`, `Completează cu date de test`, `Resetează pasul`.
- Sus: `Resetează tot onboarding-ul`, `Completează secțiunea curentă`.
- Deep link: `?devStep={stepId}` pentru a ateriza direct pe un pas la reîncărcarea paginii.
- Scurtătură de tastatură pentru deschiderea panoului (ex. `Ctrl+Shift+D`).

### 13.4 Date de test (fixtures)
Saltul peste pași lasă starea incompletă, iar componentele ulterioare se vor bloca dacă așteaptă date din pașii anteriori. Deci:
- Definește un set de fixtures per pas: CNP de test cu checksum valid, adresă completă, documente PDF/JPG mici de test, date de vehicul, credențiale de flotă fictive.
- `Completează cu date de test` populează pasul cu fixture-ul lui și îl marchează `completat`.
- Când sari la pasul N, toți pașii anteriori necompletați se populează automat cu fixtures, astfel încât pasul N să aibă tot ce îi trebuie. Altfel testul nu e relevant.
- Fixtures-urile stau într-un singur fișier/folder, versionat, nu împrăștiate prin teste.

### 13.5 Izolarea efectelor externe (obligatoriu)
Când onboarding-ul are cel puțin un pas `SkippedInDev` sau completat cu fixtures, sesiunea intră în **mod sandbox**:
- **Nicio** plată reală (Stripe în test mode).
- **Niciun** email către Consulto.
- **Niciun** cont creat real la Uber / Bolt / Oblio / BCR — doar răspunsuri simulate.
- Dosarele generate primesc un watermark vizibil `TEST`.
- Flag `IsDevSession = true` persistat pe entitate, ca înregistrările de test să fie filtrabile și ștergibile în bloc.

### 13.6 Semnalizare vizuală
- Banner persistent în partea de sus, pe toată durata sesiunii: **„MOD DEV — date de test, integrările externe sunt simulate"**, `palette.warning`.
- Pașii săriți apar cu un badge distinct în stepper, ca să nu confunzi un pas sărit cu unul completat corect.

### Criterii de acceptare
- [ ] Panoul listează pașii individual, nu doar secțiunile, și permite salt la oricare.
- [ ] Saltul la pasul 06 populează automat pașii anteriori cu fixtures și pagina se randează fără erori.
- [ ] Endpoint-urile dev returnează 404 în build/config de producție.
- [ ] Codul panoului nu apare în bundle-ul de producție.
- [ ] Într-o sesiune dev nu pleacă niciun email, nicio plată și niciun apel real către Uber/Bolt/Oblio.
- [ ] Bannerul de mod dev este vizibil permanent.

---

## 14. Checklist de validare finală (rulează manual, ambele ramuri)

### Ramura "NU am PFA"
1. [ ] Upload buletin + CNP corect → fără eroare falsă
2. [ ] Adresa sediului social completabilă și persistată
3. [ ] Pasul de plată: 399 lei, copy corect, badge "nerambursabilă", checkbox obligatoriu
4. [ ] "Am nevoie de cont bancar" → QR + buton BCR
5. [ ] Email Oblio precompletat
6. [ ] Aviz medical și aviz psihologic = două upload-uri separate
7. [ ] Fiecare upload single-document avansează automat
8. [ ] Județ ARR precompletat + card cont ARR corect + "depunere online" gri cu "În curând"
9. [ ] "Generează dosar" → PDF descărcabil, fără pagini în plus
10. [ ] "Am depus dosarul" blocat până la generare
11. [ ] Pasul 05: Da/Nu, email precompletat, parolă obligatorie, "Continuă" funcțional
12. [ ] Pasul 06: fără "mai târziu"; leasing → contract + acord de leasing
13. [ ] Finalizare → dashboard normal cu 0-uri, fără CTA de conectare

### Ramura "AM PFA"
Repetă pașii 6–13.

### Ramura vehicul în leasing
Repetă pașii 8–11 cu accent pe conturile ARR și generarea dosarului.

> Pentru reluări rapide, folosește panoul dev din secțiunea 13. **Cel puțin o parcurgere completă, fără skip-uri și fără fixtures, este obligatorie** înainte de a considera fix-urile validate.

---

## 15. Ce NU trebuie făcut

- Nu inventa sume pentru tarifele ARR — dacă nu sunt în config, marchează TODO și întreabă.
- Nu adăuga funcționalități noi. Acest spec este exclusiv pentru fix-uri.
- Nu "repara" prin ascunderea butoanelor problematice; repară cauza.
- Nu marca task-uri ca finalizate fără să parcurgi flow-ul în browser.
- Nu duplica componente pentru a rezolva o ramură — refactorizează în componente comune.

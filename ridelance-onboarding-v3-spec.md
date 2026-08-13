# RIDElance — Spec Onboarding v2

Document de lucru pentru Claude Code. Se implementează task cu task, în ordinea din secțiunea 7.

---

## 0. Context și scop

Onboarding-ul actual (6 pași) are trei probleme mari:

1. **Flux greșit**: pașii se deschid în paralel, plata vine înaintea completării datelor, pasul 3 nu are owner clar.
2. **Zgomot în UI**: butoane „Salvează" care nu fac nimic, documente pre-completate afișate degeaba, câmpuri cerute de două ori (nume/prenume).
3. **Aspect**: shell-ul (coloana stângă + coloana dreaptă) arată ca un mockup generat, nu ca produs. PDF-ul de dosar iese din pagină.

Referința vizuală trimisă (screenshot-ul făcut de client în ChatGPT) se folosește **doar pentru structura de layout: rail stânga + rail dreapta**. Conținutul coloanei din mijloc (întrebări, formulare, texte, ordinea câmpurilor) **rămâne exact cum este acum**.

### Ce NU se schimbă
- Întrebările și textele din pașii de onboarding.
- Structura coloanei centrale (carduri de upload, „Ai atestat?", CTA-ul de submit).
- Tabelele existente în baza de date. Nu se șterge nicio coloană, nicio tabelă. Coloanele rămase fără sursă în UI devin nullable și se populează din alt flux.
- Logica de extragere a datelor din documente (Gemini / OpenRouter) rămâne, doar se schimbă unde se folosește rezultatul.

---

## 1. Layout și direcție vizuală

### 1.0 Punctul de plecare

Ecranul de onboarding are azi două zone:

- **Topbar** pe toată lățimea: buton „Înapoi" în stânga, în centru un indicator circular cu numărul pasului plus textul „Pasul 1 din 11", în dreapta „Ieși din cont".
- **Rail stânga**, aproximativ 280px, fundal alb, scroll propriu: logo, subtitlul „Onboarding PFA ridesharing", eticheta „ÎNROLARE" cu contorul „0 din 6" și o bară de progres subțire, apoi pașii ca stivă de carduri. Pasul curent este un card cu border de accent, expandat, care listează sub-pașii (Vârstă, Carte de identitate, Permis, Permis document, Atestat, Rezumat), cu sub-pasul activ marcat prin bulină și săgeată. Pașii următori sunt carduri gri cu lacăt, eticheta „Blocat" și o linie explicativă de tipul „Finalizează întâi pasul «Eligibilitate»". În subsolul rail-ului, un buton „Suport".
- **Centru**: un banner de mod de testare cu butonul „Sari peste pasul curent", apoi un singur card cu iconiță, eyebrow-ul secțiunii, întrebarea, opțiunile de răspuns și butonul „Continuă".

Rail dreapta nu există. Progresul din pasul curent și lista cu ce mai lipsește nu sunt vizibile nicăieri.

### 1.0.1 Ce e greșit în starea actuală

1. **Două sisteme de numerotare care se contrazic pe același ecran.** Topbar-ul spune „Pasul 1 din 11" (numără sub-pași), rail-ul spune „0 din 6" (numără pași). Se păstrează un singur sistem: 6 pași principali, iar sub-pașii se numără doar în interiorul pasului curent.
2. **Rail-ul amestecă două niveluri de ierarhie în același tip de card.** Pasul și sub-pasul arată la fel de important. Sub-pașii trebuie subordonați vizual, nu promovați la card.
3. **Textul „Finalizează întâi pasul X" e repetat pe fiecare card blocat** și ocupă mai mult spațiu decât informația utilă. Devine o singură linie scurtă, o dată, sau tooltip.
4. **Cardurile blocate au aceeași masă vizuală ca pasul activ.** Un ecran cu 5 carduri gri mari pe care nu poți da click e spațiu irosit; rândurile blocate se comprimă.
5. **Nu se vede nimic despre ce mai lipsește** din pasul curent. De asta se adaugă rail-ul dreapta.
6. **Bannerul de mod de testare arată ca parte din produs.** Trebuie să fie evident dev-only și randat doar când feature flag-ul e activ.

Coloana centrală rămâne exact cum e: aceleași întrebări, aceeași ordine, același card, același CTA. Se schimbă doar shell-ul din jur.

### 1.0.2 Sursa de adevăr vizuală: dashboard-ul

Rail-urile nu primesc un limbaj vizual nou. Se construiesc din sistemul deja existent în **dashboard**, care e partea de produs care arată cum trebuie. Centrul onboarding-ului respectă deja acel sistem, de asta rămâne neatins. Rail-urile sunt singurele care au ieșit din el.

Concret, înainte de orice linie de cod pentru shell:

1. Inventariază ce există deja în dashboard: token-urile de culoare, scala de spațiere, scala de radius, nivelurile de umbră, stilurile de tipografie, setul de iconițe, componentele de card, de listă, de bară de progres și de badge.
2. Rail-urile se compun **din acele componente și token-uri**. Nu se introduce nicio culoare nouă, niciun font nou, nicio valoare de radius sau spațiere care nu există deja în sistem.
3. Dacă un pattern chiar lipsește (de exemplu rândul de pas cu stare `locked`, sau inelul de progres), se adaugă ca extensie a sistemului existent, cu token-urile lui, și se documentează. Nu se rezolvă local, în fișierul paginii de onboarding.
4. Cifrele din rail-uri folosesc aceeași convenție ca în dashboard, inclusiv cifrele tabulare.

Testul de final: pus lângă un ecran de dashboard, shell-ul de onboarding trebuie să pară aceeași aplicație, făcută de aceeași persoană, în aceeași zi.

### 1.1 Grid
Shell cu 3 coloane, rail-uri sticky cu scroll propriu, sub un topbar de înălțime fixă (`56px`):

| Zonă | Lățime | Comportament |
|---|---|---|
| Rail stânga | `280px` fix | `position: sticky`, scroll intern, full height |
| Conținut central | `1fr`, `max-width: 760px` | singura zonă care scrollează „natural" |
| Rail dreapta | `320px` fix | sticky, scroll intern |

Breakpoints:
- `< 1400px`: rail dreapta se îngustează la `280px`.
- `< 1200px`: rail dreapta coboară sub conținut, ca secțiune normală (nu drawer).
- `< 900px`: rail stânga devine stepper orizontal, sticky sub topbar, cu scroll orizontal; cardul de ajutor coboară în footer.

### 1.2 Topbar
- Stânga: „Înapoi", vizibil doar când există unde te întorci.
- Centru: un singur contor, `Pasul {n} din 6`, cu titlul pasului curent lângă el. Fără cerc decorativ separat de text.
- Dreapta: meniul de cont. „Ieși din cont" intră în meniu, nu stă ca acțiune primară permanentă în colț.
- Bannerul de testare, dacă flagul e activ, se randează sub topbar, cu tratament de tip „debug": bandă îngustă, fundal de avertizare, text scurt, buton text. Nu card, nu iconiță mare.

### 1.3 Rail stânga
Ordine verticală, fără decorațiuni suplimentare:
1. Logo și subtitlul produsului.
2. Card de progres general: eticheta „Înrolare", `Pasul {n} din 6`, bară de progres, procent cu **cifre tabulare**, timp estimat pentru pasul curent.
3. Lista celor 6 pași. Fiecare pas e **un rând**, nu un card: index (`01`…`06`), titlu, indicator de status.
4. Doar pasul curent își arată sub-pașii, ca listă indentată sub rândul lui: text mai mic, fără card, fără border, bulină de status în stânga. Restul pașilor nu expandează nimic.
5. Spacer.
6. Card „Ai nevoie de ajutor?" cu un singur CTA („Suport").

Stări vizuale pentru un rând de pas (una singură activă, fără ambiguitate):

| Status | Tratament |
|---|---|
| `completed` | check, text normal, index cu fundal de accent slab |
| `current` | singurul rând tratat ca suprafață: fundal subtil, border 1px accent, titlu bold |
| `pending_admin` | badge „În verificare", iconiță de ceas, text muted |
| `locked` | lacăt, opacitate 0.55, `cursor: not-allowed`, tooltip „Finalizează pasul {n-1}" |

Click pe pas `locked` nu navighează. Click pe pas `completed` navighează în read-only.

### 1.4 Rail dreapta
1. Card „Progres" pentru pasul curent: inel de progres plus `x din y`, apoi checklist cu ce lipsește. Fiecare item are stare explicită (`Lipsește` / `Încărcat` / `În verificare` / `Respins`). Item-ul respins are motivul afișat pe rând, nu într-un tooltip.
2. Indicator de autosave (vezi RL-06).
3. Card de securitate a datelor (criptare, GDPR), ultimul, ton discret.

Rail-ul dreapta e **derivat exclusiv din răspunsul serverului**, nu recalculează nimic în frontend.

### 1.5 Reguli anti „vibe-coded"
Astea sunt criterii de review, nu sugestii:

- Fără emoji ca iconițe. Un singur set de iconițe (cel deja folosit în app), 20px în rail-uri, 16px inline.
- Un singur accent color, cel din logo. Fără gradiente multicolore, fără gradient pe text, fără elemente decorative de tip sclipici sau simboluri ornamentale.
- Scale de radius: `8 / 12 / 16`. Nimic la 20px+, nimic „pill" în afară de badge-uri.
- Scale de spațiere multiplu de 4. Fără valori de tip `13px`, `9px`, `.035em` scoase din context.
- Maxim 2 niveluri de umbră: `sm` pentru suprafețe, `md` pentru elemente ridicate (dropdown, popover). Fără umbre difuze mari pe fiecare card.
- Nu tot ce e grupat logic devine card. Rail-ul stâng are o singură suprafață de card (pasul curent) plus cardul de suport. Restul sunt rânduri.
- Fără glassmorphism (`backdrop-filter`) nicăieri.
- Toate cifrele (procente, `x din y`, sume, contoare) cu `font-variant-numeric: tabular-nums`.
- Fiecare zonă care încarcă date are 4 stări reale: `loading` (skeleton, nu spinner centrat), `empty`, `error` cu retry, `success`.
- Motion: 120–200ms, `ease-out`, doar pe schimbări de stare reale. `prefers-reduced-motion` respectat.
- Focus vizibil pe toate elementele interactive. Contrast minim AA. Rail-urile navigabile de la tastatură, pașii blocați scoși din tab order.
- Tot textul trece prin sistemul de tipografie existent. Fără `font-size` hardcodat în componente noi.
- Un singur ton de gri pentru text secundar. Dacă ajungi la al treilea gri, e o greșeală de ierarhie, nu nevoie de culoare nouă.

### 1.6 Limita de scop a redesign-ului

Redesign-ul atinge **doar shell-ul**: topbar, rail stânga, rail dreapta. Coloana centrală nu se atinge deloc. Nu e o preferință, e o condiție de acceptare.

**Ce se modifică**
- Componenta de layout a paginii de onboarding (grid-ul cu 3 coloane).
- Componenta de topbar.
- Componenta de rail stânga, inclusiv rândurile de pas și lista de sub-pași.
- Rail dreapta, componentă nouă.

**Ce nu se atinge**
- Componentele care randează conținutul pasului: cardul cu întrebarea, eyebrow-ul, iconița, opțiunile de răspuns, butonul „Continuă", validările, mesajele de eroare din formular.
- Textele întrebărilor, ordinea lor, structura de răspunsuri.
- Spațierile, tipografia și radius-urile din interiorul cardului central.
- Componentele de upload de documente din centru (se schimbă doar ce se filtrează, la RL-07, nu cum arată).

**Reguli tehnice care forțează asta**
- Fără selectori globali sau `:root` noi care afectează și centrul. Stilurile shell-ului rămân scoped pe componentele lui.
- Fără refactorizare „de context" în fișierele coloanei centrale. Dacă un fișier din centru trebuie totuși modificat, se semnalează înainte, cu motivul, și se așteaptă confirmarea.
- Lățimea vizuală a cardului central rămâne cea de acum. Dacă rail-ul dreapta reduce spațiul disponibil, diferența se absoarbe din gutter-ele exterioare, nu prin îngustarea cardului.
- Verificare la final: capturi înainte/după pe același pas, la 1440px. Zona centrală trebuie să fie identică pixel cu pixel, cu excepția poziției ei orizontale pe ecran.

---

## 2. Model de stare (fundamentul pentru RL-01 … RL-03)

Sursa de adevăr e serverul. Frontend-ul doar randează.

```
GET /api/onboarding/state
{
  "flowType": "NO_PFA" | "HAS_PFA",
  "currentStep": 2,
  "canPay": false,
  "paymentStatus": "NOT_REQUIRED" | "PENDING" | "PAID" | "FAILED",
  "steps": [
    {
      "index": 1,
      "key": "eligibility",
      "title": "Eligibilitate",
      "status": "completed",          // locked | available | in_progress | pending_admin | completed | rejected
      "completedAt": "2026-08-10T09:12:00Z",
      "blockedReason": null,          // ex: "Finalizează pasul 1"
      "ownedBy": "user" | "admin",
      "checklist": [
        { "key": "id_card", "label": "Carte de identitate", "state": "uploaded", "note": null }
      ]
    }
  ]
}
```

Reguli de tranziție, aplicate **în backend**:

- Pasul `n` devine `available` doar când pasul `n-1` este `completed`. Un singur pas poate fi `available` sau `in_progress` la un moment dat.
- Un pas cu `ownedBy: "admin"` trece prin `pending_admin` și nu poate fi finalizat de user.
- Orice endpoint de scriere pe pasul `n` returnează `409 Conflict` dacă pasul nu e `available` / `in_progress`. Frontend-ul care greșește nu trebuie să poată corupe starea.
- `canPay` devine `true` doar când toți pașii care preced plata sunt `completed`.

---

## 3. Task-uri funcționale

### RL-01 · Pașii se deblochează unul câte unul

**Problemă**: după finalizarea pasului 1 se deschid simultan pașii 2, 3 și 4.

**Comportament dorit**: un singur pas activ. Pasul următor se deblochează la momentul în care cel curent trece în `completed` (sau `pending_admin`, dacă e pas de admin — vezi RL-02).

**Backend**
- Implementează tranzițiile din secțiunea 2 într-un singur serviciu (`OnboardingStateService`), nu împrăștiat prin controllere.
- Validare pe fiecare endpoint de pas: pasul e activ pentru userul curent, altfel `409`.
- Test: încercarea de a scrie pe pasul 4 cu pasul 2 incomplet trebuie să eșueze.

**Frontend**
- Elimină orice logică locală de tip „dacă step1.done atunci arată 2,3,4". Randează exact `status`-ul primit.
- Navigare directă pe URL-ul unui pas blocat → redirect la pasul curent, cu toast explicativ.

**Acceptare**
- În orice moment, în rail-ul stâng, cel mult un pas are stare `current`.
- După completarea pasului 1, pasul 2 e `available`, pașii 3–6 rămân `locked`.
- Refresh-ul paginii nu schimbă starea.

---

### RL-02 · Pasul 3 se finalizează din admin

**Problemă**: pasul 3 (Fiscal, bancă și semnături) presupune ca noi să adăugăm pachetul de semnături. Userul nu are cum să-l închidă singur.

**Comportament dorit**
- Userul completează partea lui din pasul 3 și apasă „Trimite pentru verificare".
- Pasul trece în `pending_admin`. În rail: badge „În verificare", fără CTA de continuare.
- În mijloc apare un card de așteptare: ce urmează, ce facem noi, estimare de timp, canal de contact. Fără spinner infinit.
- Adminul atribuie pachetul de semnături din panoul de admin și marchează pasul finalizat. Abia atunci pasul 4 devine `available`.

**Backend**
- `POST /api/admin/onboarding/{userId}/steps/signatures/complete` cu payload: pachetul alocat, nr. de semnături, data expirării, note interne.
- Audit: cine a finalizat, când. Se salvează în `OnboardingStepAudit`.
- Notificare către user (email + in-app) la finalizare. Notificare către admin la intrarea în `pending_admin`.
- Acțiune de respingere: `status: rejected` + motiv, care întoarce pasul la user cu motivul afișat în checklist.

**Admin UI (MUI, pagina de detaliu existentă)**
- Secțiune „Pasul 3 — Semnături" cu: datele trimise de user, formularul de alocare pachet, butoanele Finalizează / Respinge.
- Lista de onboarding-uri primește filtru rapid „Așteaptă acțiune admin".

**Acceptare**
- Userul nu poate trece de pasul 3 fără acțiune de admin.
- După finalizare din admin, userul vede pasul 4 deblocat fără să dea refresh (poll sau SignalR, în funcție de ce e deja în app).

---

### RL-03 · Flux „Nu am PFA": întâi completare, apoi plată

**Problemă**: acum se plătește primul și abia apoi se completează datele. Se dorește inversul.

**Comportament dorit**
1. Userul alege „Nu am PFA".
2. Parcurge **toți** pașii de colectare a datelor (inclusiv upload documente și consimțăminte).
3. La final vede un ecran de rezumat: ce a completat, ce urmează, prețul și ce include.
4. Abia acolo apare CTA-ul de plată. După plată confirmată, dosarul intră în procesare.

**Backend**
- `canPay` se calculează server-side. Endpoint-ul de creare a sesiunii/intent-ului de plată returnează `422` cu lista de câmpuri lipsă dacă `canPay == false`. Nu se creează intent pe date incomplete.
- Datele completate se persistă independent de plată. Un user care abandonează înainte de plată își găsește tot la revenire.
- Idempotency key pe crearea plății, ca dublu-click să nu producă două plăți.
- Webhook de plată → `paymentStatus: PAID` → dosarul devine procesabil. Plata eșuată păstrează datele și permite reîncercare.

**Frontend**
- Se scoate pasul de plată din poziția curentă și se mută la finalul fluxului.
- Ecranul de rezumat e read-only, cu link „Modifică" pe fiecare secțiune, care duce înapoi la pasul respectiv fără a pierde starea.

**Acceptare**
- Nu există cale prin UI sau prin API de a plăti cu date incomplete.
- Abandon după completare, revenire a doua zi: datele sunt acolo, ecranul de plată e primul lucru afișat.
- Plata eșuată nu resetează progresul.

---

### RL-04 · Prefill nume din buletin pentru fluxul „Am PFA"

**Comportament dorit**: după uploadul cărții de identitate, câmpurile de nume, prenume, CNP, serie/număr și adresă se completează automat din extragerea existentă. Userul le poate corecta.

**Detalii**
- Fiecare câmp completat automat primește metadata `source: "ocr"` și `confidence`. La `confidence` sub prag: câmpul rămâne completat, dar marcat pentru verificare.
- Sub câmpurile precompletate: o singură linie discretă, „Completat automat din buletin. Verifică datele." Fără badge pe fiecare input.
- Editarea manuală trece `source` pe `"user"` și nu mai e suprascrisă la re-upload, decât cu confirmare explicită.
- Eșecul extragerii nu blochează nimic: câmpurile rămân goale și editabile, fără mesaj de eroare alarmant.
- Normalizare la salvare: diacritice păstrate, trim, capitalizare consistentă a numelui, CNP validat cu cifra de control.

**Acceptare**
- Upload buletin valid → câmpurile apar completate în sub 5 secunde sau cu skeleton cât durează.
- Corecția manuală supraviețuiește re-uploadului.

---

### RL-05 · Scoatere nume și prenume din înregistrare/login

**Comportament dorit**: formularul de creare cont cere doar ce e strict necesar (email, parolă, telefon, dacă e cazul deja folosit). Numele vine mai târziu, din buletin.

**Reguli**
- **Nu se șterge nimic din baza de date.** Coloanele `FirstName` / `LastName` rămân, devin nullable dacă nu sunt deja.
- După extragerea din buletin (RL-04), se populează automat coloanele din tabelul de user, dacă sunt goale.
- Nume de afișare până atunci: fallback ordonat `FirstName + LastName` → partea locală a emailului → „Contul meu". Un singur helper, folosit peste tot (avatar, header, emailuri).
- DTO-urile de API păstrează câmpurile în răspuns, ca să nu se spargă consumatorii existenți; devin doar opționale în request.
- Migrare: script care marchează conturile existente fără nume, ca să nu apară ca date corupte în admin.
- Adminul poate edita manual numele pe pagina de detaliu.

**Acceptare**
- Se poate crea cont fără nume și prenume.
- După pasul 1, numele apare în header și în admin fără intervenție manuală.
- Emailurile tranzacționale nu conțin „Salut, null".

---

### RL-06 · Fără buton „Salvează". Autosave. Oblio = un singur buton

**Problemă**: butonul „Salvează" din onboarding nu face nimic util. La Oblio sunt butoane redundante.

**Autosave**
- Salvare la `blur` pe câmp și debounce 800ms pe input, prin `PATCH` parțial (`/api/onboarding/steps/{key}` cu doar câmpurile modificate).
- Salvare forțată la schimbarea pasului și la `visibilitychange` → `hidden`.
- Indicator de status în rail-ul dreapta, o singură linie, trei stări: `Se salvează…` / `Salvat · 14:32` / `Nesalvat · Reîncearcă`. Fără toast la fiecare salvare.
- Eroare de rețea: retry cu backoff (1s, 3s, 9s), draft păstrat local până la confirmare. Dacă rămâne nesalvat, `beforeunload` avertizează.
- Concurrency: ultimul scris câștigă pe câmp, nu pe tot obiectul. Nu trimite payload complet care să suprascrie câmpuri neatinse.
- Se elimină toate butoanele „Salvează" din pașii de onboarding. CTA-ul principal rămâne doar „Continuă" / „Trimite pentru verificare".

**Oblio**
- Un singur buton primar, cu label explicit pentru acțiunea reală (ex. „Conectează Oblio").
- Deasupra lui, un bloc informativ scurt: ce este Oblio, ce se întâmplă când apeși (se creează contul / se emite factura automat), primul an gratuit și costul după, ce date se trimit.
- Stări ale butonului: `idle` → `loading` (disabled) → `connected` (buton devine stare, nu acțiune) sau `error` cu motiv și retry.
- Apel idempotent. Dublu-click nu creează două conturi.

**Acceptare**
- Nu mai există niciun buton „Salvează" în onboarding.
- Închiderea tabului în mijlocul completării nu pierde nimic din ce a fost tastat cu peste 1 secundă înainte.
- Zona Oblio are exact un buton de acțiune.

---

### RL-07 · Documentele deja încărcate dispar din UI, dar rămân în backend

**Problemă**: documentele pre-completate/moștenite apar în interfața userului și încarcă ecranul degeaba.

**Comportament dorit**: userul vede doar ce mai are de făcut. Backendul le păstrează integral și le folosește la generarea dosarului.

**Implementare**
- Câmp calculat pe server pe fiecare document: `isUserFacing: bool`. Frontend-ul filtrează exclusiv după el, fără reguli proprii.
- Regula inițială: documentele cu `origin` în (`prefilled`, `inherited`, `system_generated`) au `isUserFacing = false`.
- Generatorul de dosar ignoră complet flagul. Documentele ascunse intră în PDF ca până acum.
- Adminul le vede pe toate, cu o coloană care arată originea și dacă sunt vizibile pentru user.
- Checklistul din rail-ul dreapta numără doar documentele `isUserFacing`, altfel progresul iese greșit (`0 din 3` când de fapt lipsesc 2).

**Acceptare**
- Userul nu vede documentele pre-completate nicăieri în onboarding.
- Dosarul generat le conține, identic cu înainte.
- Procentul de progres corespunde cu ce e vizibil pe ecran.

---

### RL-08 · PDF-ul de dosar: uniform, imaginile în pagină

**Problemă**: pozele încărcate ies din pagina A4, documentul arată inconsistent.

**Stack**: QuestPDF (Fluent API, .NET). Toate regulile de mai jos se implementează într-un singur `IDocument` cu componente reutilizabile, nu cu compoziții ad-hoc per tip de document.

**Cauza reală a problemei**: imaginile sunt randate cu `FitWidth` (sau fără constrângere), deci o poză portret de 3000x4000 ocupă lățimea utilă și cere o înălțime mai mare decât pagina. QuestPDF nu taie imaginea, ci împinge conținutul, de unde paginile inconsistente. Fixul e ca fiecare imagine să primească o casetă cu **înălțime maximă explicită** și `FitArea()`.

**Normalizare la upload** (o singură dată, se salvează derivatul; generatorul nu procesează imagini la runtime)
- ImageSharp: `image.Mutate(x => x.AutoOrient())` pentru orientarea din EXIF, apoi se elimină metadata EXIF.
- Redimensionare la maxim 2000px pe latura lungă, encoder JPEG cu calitate 82 (PNG doar dacă transparența contează).
- Se salvează în DB `Width`, `Height`, `AspectRatio` și calea derivatului. Generatorul citește dimensiunile din DB, nu decodează imaginea ca să afle raportul.
- PDF-uri încărcate de user: QuestPDF nu poate insera pagini dintr-un PDF existent. Se rasterizează cu `Docnet.Core` sau `PDFtoImage` la 150 DPI, o imagine per pagină, și intră în același pipeline ca pozele. Limită de pagini per document, cu trunchiere semnalată în dosar.
- Fișier corupt sau format necunoscut: se generează un placeholder cu numele fișierului și motivul, ca dosarul să nu crape și lipsa să fie vizibilă.

**Setări globale QuestPDF**
- `QuestPDF.Settings.License`, plus `DocumentSettings`: `ImageRasterDpi = 150`, `ImageCompressionQuality = ImageCompressionQuality.High`, `PdfA = false` (dacă nu e cerință legală).
- Fonturile se înregistrează explicit cu `FontManager.RegisterFont(...)` din fișiere comise în repo și copiate în imaginea Docker. Fără asta, containerul de Linux face fallback pe alt font decât mașina de development și dosarul arată diferit în producție față de local.
- `DefaultTextStyle` setat o dată pe document. Fără `.FontSize()` împrăștiat prin componente.

**Structura paginii**
- `page.Size(PageSizes.A4)`, `page.MarginVertical(18, Unit.Millimetre)`, `page.MarginHorizontal(18, Unit.Millimetre)`. Aceleași margini pe absolut toate paginile.
- `page.Header()`: titlul documentului curent. `page.Footer()`: nume PFA, numărul dosarului, `Pagina {CurrentPageNumber} din {TotalPages}`.
- `page.Content()`: un singur container, cu înălțimea rămasă. Toată aritmetica de „cât spațiu am" se face din constrângeri QuestPDF, nu din numere hardcodate.

**Regula de imagine** (o singură componentă, folosită peste tot)

```csharp
// ImageBlock.cs — singurul loc din care se randează o imagine în dosar
container
    .Border(1).BorderColor(Colors.Grey.Lighten2)
    .Padding(4)
    .AlignCenter().AlignMiddle()
    .MaxHeight(maxHeightMm, Unit.Millimetre)   // înălțimea utilă a casetei
    .Image(imageBytes)
    .FitArea();                                 // păstrează raportul, încadrează în casetă
```

- `FitArea()` peste tot. `FitWidth()` și `FitHeight()` sunt interzise în cod, indiferent de raportul imaginii, pentru că fiecare din ele garantează depășire pe una din axe.
- Caseta are întotdeauna aceeași lățime și aceeași înălțime maximă, indiferent de imagine. O poză landscape lasă spațiu gol sus/jos, una portret lasă spațiu stânga/dreapta. Chenarul face ca paginile să arate uniform chiar dacă rapoartele diferă.
- Un document per pagină. Între documente, `.PageBreak()`, nu spațiere calculată manual.
- Titlul, legenda și imaginea se grupează în același element cu `.ShowEntire()`, ca să nu se rupă titlul de imaginea lui.
- Față/verso: `Column` cu două `ImageBlock`-uri pe aceeași pagină, fiecare cu `MaxHeight` = jumătate din înălțimea utilă minus spațierea. Aceeași componentă, alt parametru.
- Imaginile cu raport peste 3:1 se rotesc 90° la generare (`.RotateLeft()`) doar dacă asta crește dimensiunea randată, cu mențiune în legendă.
- Fără culoare în afara antetului. Un font, trei dimensiuni: titlu document, corp, legendă. Cifrele din subsol cu font monospațiat sau cu tabular figures.

**Development și testare**
- În timpul lucrului, `.DebugArea()` pe casetele de imagine ca să se vadă limitele reale ale conținutului.
- Test de regresie: set fix de fișiere comise în repo — poză portret 4:3, poză landscape, scan A4 vertical, poză de telefon în landscape cu EXIF rotit, imagine foarte îngustă (raport 5:1), PDF cu 3 pagini, fișier corupt.
- Se folosește `document.GenerateImages()` pentru snapshot testing pe fiecare fișier din set. Testul verifică: numărul de pagini e cel așteptat, nicio pagină goală, iar snapshot-ul nu diferă de referință.
- Assert suplimentar, ieftin și eficient: pentru fiecare imagine randată, dimensiunile calculate încap în casetă. Prinde regresia înainte de compararea vizuală.

---

## 4. Ordinea de implementare

Fiecare punct = un PR separat, cu teste.

1. **RL-01 + secțiunea 2** (state machine server-side). Baza pentru tot restul.
2. **RL-02** (pasul 3 din admin).
3. **RL-03** (inversare completare/plată).
4. **RL-05** apoi **RL-04** (întâi scoaterea din login, apoi prefill-ul care umple golul).
5. **RL-06** (autosave + Oblio).
6. **RL-07** (filtrare documente).
7. **Secțiunea 1** (topbar, rail stânga, rail dreapta nou).
8. **RL-08** (PDF).

Redesign-ul vizual vine după ce stările sunt corecte. Altfel se stilizează stări care oricum se schimbă.

---

## 5. Definition of done, per PR

- Comportamentul e forțat în backend, nu doar ascuns în UI.
- Testele acoperă calea validă și cel puțin două căi invalide (pas blocat, plată prematură, salvare pe pas inactiv).
- Fără logică de business duplicată în frontend.
- Stările `loading` / `empty` / `error` există și arată intenționat.
- Nimic șters din schema DB. Migrațiile sunt aditive și reversibile.
- Verificat pe 1440px, 1280px, 1024px și 390px.

---

## 6. Prompt de pornire pentru Claude Code

```
Citește docs/ridelance-onboarding-v2-spec.md.

Înainte să scrii cod:
1. Explorează repo-ul și mapează pentru fiecare task RL-01…RL-08 fișierele
   care trebuie atinse (backend, frontend, admin). Listează-le.
2. Pentru partea de UI, inventariază întâi sistemul de design din dashboard
   (token-uri, spațiere, radius, tipografie, iconițe, componente reutilizabile)
   și listează ce vei refolosi în rail-uri. Rail-urile se construiesc din
   sistemul ăla, nu dintr-unul nou.
3. Semnalează orice loc unde specul intră în conflict cu implementarea
   actuală sau presupune ceva ce nu există în cod.
4. Propune un plan pentru RL-01 și așteaptă confirmarea.

Lucrează un task pe rând, un commit logic pe schimbare. Nu porni task-ul
următor înainte de review. Nu șterge coloane sau tabele.

Limită fermă de scop pentru redesign: se ating doar topbar-ul, rail-ul stânga
și rail-ul dreapta. Coloana centrală a onboarding-ului nu se modifică, nici
markup, nici stiluri, nici texte. Dacă pare că un fișier din centru trebuie
totuși atins, oprește-te și întreabă.
```

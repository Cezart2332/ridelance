# RIDElance — Redesign Onboarding Driver

## Context

Avem deja un onboarding funcțional pentru drivers (PFA rideshare). Task-ul e **redesign de UX/UI**, nu rescriere de business logic. Backend-ul, endpoint-urile, pipeline-ul de verificare cu OpenRouter/Gemini și fluxul de admin review rămân neatinse.

**Referință vizuală:** un onboarding în două panouri — rail de checklist persistent în stânga, zonă de conținut contextual în dreapta. Luăm **structura și tratamentul de motion**, nu identitatea vizuală. Nu e clonă.

---

## 1. Ce păstrăm din referință

- **Rail persistent stânga** cu toți pașii vizibili simultan. Driverul vede mereu unde e și cât a rămas.
- **Progress indicator** sus pe rail (bară + „3 din 6").
- **Pas activ expandat, restul colapsate.** Un singur pas deschis la un moment dat.
- **Conținut contextual dreapta** care se schimbă per pas, fără navigare între pagini.
- **Tranziții continue.** Zero page reload, zero flash de conținut gol. Height animat + cross-fade.

## 2. Ce NU copiem

- Paleta și tipografia din referință.
- Presupunerea că un pas bifat rămâne bifat.
- Ilustrațiile / chart-urile decorative din zona de conținut.

---

## 3. Problema centrală: pașii nu sunt binari

Referința are pași cu două stări: `todo` / `done`. Noi avem șase:

| Stare | Semnificație | Tratament vizual |
|---|---|---|
| `locked` | Depinde de un pas anterior neterminat | Gri, 40% opacity, cursor not-allowed |
| `todo` | Disponibil, neînceput | Border neutru, numărul pasului |
| `in_progress` | Driverul a început, n-a trimis | Border accent, pas expandat |
| `pending_review` | Trimis, așteaptă Gemini + admin | **Pulse subtil pe border**, badge „În verificare" |
| `approved` | Validat | Checkmark, colapsat |
| `rejected` | Respins, necesită re-upload | Border roșu, motiv afișat inline, CTA „Reîncarcă" |

**`pending_review` e starea cea mai importantă și cea pe care referința n-o are deloc.** Driverul trebuie să înțeleagă că a făcut ce trebuia, dar mai are de așteptat. Nu îl blocăm — poate continua la pașii care nu depind de ăsta.

**`rejected` după `approved` e posibil.** Dacă adminul întoarce o decizie, pasul se re-deschide. Tranziția trebuie să fie vizibilă (nu doar schimbare silențioasă de culoare) — animație de „un-check" + toast.

### Regula de dependență
Pașii independenți rămân deblocați cât timp altul e `pending_review`. Doar dependențele reale blochează. Nu facem onboarding strict liniar dacă datele nu o cer.

---

## 4. Structura pașilor

Preia lista reală din codul existent — nu inventa pași. Pentru fiecare:

- titlu scurt
- one-liner de ce e necesar (driverii abandonează când nu înțeleg de ce le ceri buletinul)
- estimare de timp unde e relevant („~2 min")
- badge „Obligatoriu" / „Opțional"

Pașii opționali se pot sări explicit, cu un link „Fac asta mai târziu" care nu arată ca un buton principal.

---

## 5. Zona de upload documente

Punctul cu cea mai mare rată de abandon. Cerințe:

- **Drag & drop + tap-to-upload.** Mobile-first — majoritatea driverilor fac asta de pe telefon, cu poza făcută pe loc.
- **Preview imediat** după selectare, înainte de submit. Cu opțiune de retake.
- **Validare client-side înainte de upload:** dimensiune, format, rezoluție minimă. Mesaj concret („Poza e prea întunecată, încearcă la lumină"), nu „Fișier invalid".
- **Progress real de upload**, nu spinner indefinit.
- **Stare de procesare Gemini** distinctă de stare de upload. Driverul trebuie să vadă că fișierul a ajuns și acum se verifică.

Pe rejected, motivul de la Gemini/admin apare **inline lângă documentul respins**, nu într-un banner global. Dacă sunt trei documente și unul e respins, trebuie să fie evident care.

---

## 6. Direcție vizuală

Nu copia paleta referinței. Direcția pentru RIDElance:

- **Utilitar, nu playful.** Publicul sunt șoferi profesioniști care vor să termine repede și să înceapă să câștige. Nu confetti, nu ilustrații cutesy.
- **Densitate controlată.** Spațiu generos în zona de acțiune, compact pe rail.
- **Un singur accent color** folosit consistent pentru „unde trebuie să acționezi acum". Dacă totul e colorat, nimic nu ghidează.
- **Semantic colors separate de accent:** verde = approved, amber = pending, roșu = rejected. Accentul de brand nu se suprapune peste ele.
- **Tipografie:** o alegere cu caracter, nu Inter/Roboto. Perechea display + body. Cifrele să fie tabular pe progress și pe timere.
- Aliniază-te la design tokens existente din proiect dacă există; dacă nu, definește-le în `index.css` ca CSS variables.

---

## 7. Motion

Stack: React + Framer Motion (deja în proiect sau adaugă `framer-motion@^11`).

- **Layout animation pe rail** — când un pas colapsează și altul se expandează, folosește `layout` pe containerul de pași. Asta produce continuitatea din referință.
- **`<AnimatePresence mode="wait">`** pe zona de conținut dreapta, la schimbarea pasului.
- **Checkmark** — animație de stroke draw, ~400ms, ease-out. Un singur moment de satisfacție per pas, fără să devină obositor la al șaselea.
- **Pulse pe `pending_review`** — foarte subtil, 2s loop, opacity pe border. Trebuie să comunice „se lucrează", nu să distragă.
- **Doar `transform` și `opacity`.** Fără animat width/height direct.
- **`prefers-reduced-motion`** respectat peste tot — durate la 0, stările finale rămân identice.
- **Fără skeleton pe rail.** Pașii se știu de la început, nu se încarcă.

Durate: 150ms micro-interacțiuni, 300ms tranziții de pas, 600ms max orice altceva. Peste atât începe să pară lent la a treia utilizare.

---

## 8. Responsive

- **Mobile (<768px):** rail-ul devine progress bar orizontal sticky sus, cu pașii accesibili printr-un sheet. Conținutul e full-width. Nu încerca să înghesui două coloane.
- **Desktop:** rail fix ~280–320px, conținut restul.
- Zona de upload trebuie să fie utilizabilă cu o mână pe telefon. Butoanele principale în treimea de jos a ecranului.

---

## 9. Persistență

- Progresul se salvează server-side, nu în localStorage. Driverul începe pe telefon și termină pe laptop.
- La revenire, deschide automat primul pas neterminat.
- Dacă a fost respins ceva cât a lipsit, deschide direct pasul respins și arată motivul.

---

## 10. Accesibilitate

- Rail-ul e `<ol>` semantic, pașii au `aria-current="step"` pe cel activ.
- Stările nu se comunică doar prin culoare — checkmark, text de status, icon.
- Focus management: la schimbarea pasului, focus pe heading-ul noii secțiuni.
- Zona de upload accesibilă din tastatură, nu doar drag & drop.

---

## 11. Acceptance criteria

- [ ] Toate cele 6 stări de pas sunt implementate și distingibile vizual fără culoare
- [ ] `pending_review` nu blochează pașii independenți
- [ ] Tranziția `approved` → `rejected` e animată și generează toast
- [ ] Motivul respingerii apare inline, lângă documentul corect
- [ ] Upload funcționează cu poză făcută pe loc de pe mobil
- [ ] Progress de upload real, separat de progress de verificare Gemini
- [ ] Zero page reload la schimbarea pasului
- [ ] `prefers-reduced-motion` elimină toate animațiile, stările finale neschimbate
- [ ] Refresh la mijlocul flow-ului redeschide pasul corect
- [ ] Testat la 375px lățime fără scroll orizontal
- [ ] Business logic și endpoint-uri existente neatinse

---

## Cum abordezi

Începe cu state machine-ul pașilor și componenta de rail. Alea două decid tot restul. Zona de conținut e mai ușoară — odată ce rail-ul și stările sunt corecte, panourile sunt doar forms.

Nu porni de la CSS. Nu adăuga librării peste ce e deja în proiect fără motiv.

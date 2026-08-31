# Spec fix-uri — Onboarding PFA + Dashboard PFA

Context: flux `ridelance.ro/onboarding/pfa`. Fără text nou în UI dincolo de ce e strict necesar — fără helper texts, fără explicații sub câmpuri, fără bannere noi.

---

## P0-1 — Validare CNP: sursa de adevăr greșită

**Observat:** după prefill din buletin, apare warning că data nașterii din CNP diferă de cea citită din buletin, ancorat pe câmpul CNP (evidențiat ca greșit).

**De verificat:**
1. Decodarea secolului din prima cifră: `1`/`2` → 1900–1999, `3`/`4` → 1800–1899, `5`/`6` → 2000–2099, `7`/`8`/`9` → rezidenți străini. Fără hardcodare 19xx.
2. Parsarea MRZ (`YYMMDD`) — fereastra de secol folosită la comparație.
3. Cifra de control a CNP (ponderi `279146358279`, rest 10 → 1).

**Cerut:**
- CNP = sursa de adevăr pentru dată naștere + sex.
- Blocant doar la: lungime ≠ 13, non-numeric, cifră de control invalidă, dată imposibilă.
- Discrepanța CNP vs. OCR = warning ne-blocant, mutat pe zona datelor citite din buletin; câmpul CNP nu mai primește stare de eroare.
- Discrepanța se loghează pe dosar pentru admin.

---

## P0-2 — Plata se cere prea târziu

**Observat:** plata e solicitată după ce dosarul pleacă pe email la Consilto.

**Cerut:** plata e condiție de trimitere.

```
dosar_completat → plata_in_asteptare → plata_confirmata → trimis_consilto
```

- Trimiterea către Consilto se declanșează exclusiv din webhook Stripe (`checkout.session.completed` / `payment_intent.succeeded`), server-side, idempotent (dedupe pe `event.id` + `dosarId`).
- Niciun trigger de email din client.
- Plată eșuată/abandonată → dosarul rămâne în `plata_in_asteptare`, nu pleacă nimic, checkout-ul se poate relua.
- Endpoint-ul de trimitere → 409 pentru orice dosar care nu e în `plata_confirmata`.

---

## P0-3 — Lipsesc conturile Uber Driver și Bolt Driver

**Observat:** pasul cere doar Uber Fleet și Bolt Fleet.

**Cerut:** 4 entități, două grupuri în UI (titlu de secțiune, atât):

| Grup | Câmpuri |
|---|---|
| Flotă | Uber Fleet, Bolt Fleet (existente) |
| Șofer | Uber Driver, Bolt Driver — email, telefon, ID/UUID șofer (opțional) |

- Câmpuri noi pe entitatea de onboarding + migrare.
- Validare: email valid, telefon E.164.
- Pasul nu se marchează complet fără conturile de șofer.

---

## P1-4 — Email și telefon precompletate: read-only

Când vin precompletate din fișa clientului:
- Câmpuri `readOnly` + `disabled`, fără text explicativ.
- Server-side: la salvare se re-hidratează din fișa clientului, se ignoră valoarea trimisă de client.
- Modificarea doar prin admin/suport.

---

## P1-5 — Secțiunea Abonamente (nu există, de creat)

Nu e bug: tab-urile de abonamente nu sunt implementate în sidebar-ul de onboarding PFA.

- De adăugat ca intrare în sidebar, sub aceleași reguli de deblocare secvențială ca pașii existenți (lacăt cât timp e blocată, consistent cu `Fiscal, bancă & semnături`).
- Rută + layout montate în shell-ul de onboarding, nu doar în dashboard.
- Conținutul secțiunii: de definit separat înainte de implementare.

---

## P1-6 — Dashboard PFA: empty state greșit

**Observat:** card cu „Totul e pregătit / Datele apar aici după prima cursă" în locul layout-ului normal.

**Cerut:**
- Se randează structura normală — KPI cards, grafice, tabele — cu valoarea `0`, formatată ca orice altă valoare (`0 RON`, `0 curse`).
- Fără card placeholder. Mesajul de activare Uber/Bolt Fleet rămâne doar dacă e deja component existent, mutat sus, discret.
- Filtrele (perioadă, Bolt/Uber, Card/Cash) funcționale pe set gol.
- Graficele randează axele cu serie goală: fără crash, fără skeleton infinit.

---

## Criterii de acceptare

- [ ] CNP cu prima cifră `5`/`6` nu mai generează eroare de dată; discrepanța OCR e warning ne-blocant, nu pe câmpul CNP.
- [ ] CNP cu cifră de control invalidă blochează pasul.
- [ ] Emailul către Consilto nu pleacă fără `plata_confirmata`; webhook retrimis → fără email duplicat.
- [ ] Pasul cere și validează Uber Driver + Bolt Driver, separat de Fleet.
- [ ] Email/telefon precompletate nu pot fi modificate din UI sau prin request manipulat.
- [ ] Secțiunea Abonamente există în sidebar, cu stare de blocare corectă.
- [ ] Dashboard cu zero curse: layout complet cu `0`, fără placeholder.

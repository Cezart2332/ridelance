# SPEC — RIDElance Fleet (Dashboard închirieri auto)

**Destinatar:** Claude Code
**Tip:** spec de implementare, derivat din documentul funcțional `Dashboard_inchirieri_auto.docx`
**Status:** V1

---

## 0. Cum se folosește acest spec

1. **Nu implementa tot deodată.** Fazele din §12 sunt ordonate; fiecare fază are criterii de acceptanță proprii și se închide într-un PR separat.
2. **Înainte de orice cod, inspectează repo-ul** și raportează ce ai găsit pentru punctele marcate `[VERIFICĂ ÎN COD]`. Sunt lucruri care există deja în RIDElance și trebuie reutilizate, nu rescrise.
3. Dacă o decizie din spec intră în conflict cu o convenție existentă în cod, **oprește-te și întreabă** — nu improviza o a treia variantă.

### Ce trebuie reutilizat, nu reconstruit `[VERIFICĂ ÎN COD]`

| Funcționalitate existentă | Unde se folosește aici |
|---|---|
| Integrarea ANAF (lookup după CUI) | §3 configurare firmă |
| Mecanismul de semnare documente din fluxul de deschidere PFA | §7 trimitere spre semnare |
| Generarea PDF cu QuestPDF | §6 contract + proces-verbal |
| Componentele `shared/` parametrizate pe `ownerType` | tot dashboardul |
| Verificare email + SMS la înregistrare | §2 cont flotă |
| Integrarea Mapbox din paginile de listing | §4 locație vehicul |
| Storage privat + viewer documente | §9 |

### Constrângeri de UI (obligatorii)

- Dashboardul existent este **sursa vizuală de adevăr**. Orice ecran nou preia tipografia, tratamentul de card și header-ul sticky de acolo.
- **Zero valori hardcodate** pentru spațiere și culoare: doar `theme.spacing()` și tokeni din paleta MUI.
- Orice componentă folosită în ambele contexte (flotă / alte tipuri de cont) intră în `shared/` și primește `ownerType` ca prop.

---

## 1. Modelul de domeniu

Relația structurală: **Company → Vehicle → Rental**.
Obiectul central al fluxului operațional este **Rental**, nu contractul. Contractul, procesul-verbal, check-in-ul și check-out-ul sunt derivate din același Rental.

### 1.1 Entități noi

```
FleetProfile        (1:1 cu Company existentă)
Vehicle
Listing             (1:1 cu Vehicle, opțional)
VehiclePhoto
VehicleDocument
CompanyDocument
FleetRentalDefaults (1:1 cu Company)
Tenant
Rental
RentalAccessory
GeneratedDocument
CheckRecord         (discriminat: CheckIn / CheckOut)
CheckPhoto
MaintenanceRecord
Payment
VehicleEvent        (timeline, append-only)
```

`Company` există deja `[VERIFICĂ ÎN COD]` — **nu crea o entitate paralelă**. Adaugă `FleetProfile` pentru câmpurile specifice flotei (reprezentant, logo, descriere, IBAN, setări de vizibilitate publică, slug public, `isVerifiedFleet`).

### 1.2 Vehicle ≠ Listing

Separarea asta este obligatorie și nenegociabilă.

- `Vehicle` = mașina reală (marcă, model, an, VIN, nr. înmatriculare, kilometraj curent).
- `Listing` = anunțul public (preț, oraș, disponibilitate, status publicare).

Punerea anunțului pe pauză înseamnă **exclusiv** `listing.Status = Paused`. Nu se șterge și nu se arhivează `Vehicle`, nu se ating închirierile, contractele, documentele, mentenanța sau istoricul.

### 1.3 Câmpuri

**Vehicle**
`Id, CompanyId, Make, Model, Year, EngineType, Transmission, Color?, SeatCount?, RidesharingCategories[], PlateNumber?, Vin?, CurrentMileage?, Status, CreatedAt, UpdatedAt`

**Listing**
`Id, VehicleId, WeeklyPrice, Deposit?, OfferType, MinPeriodDays?, AvailabilityState, AvailableFrom?, Conditions?, Description, Address, City, Area?, Latitude, Longitude, PublicLocationPrecision, Status, PublishedAt?`

**Tenant**
`Id, CompanyId, Type (Individual|PFA|SRL), FullName|CompanyName, Cnp?, IdSeries?, IdNumber?, Cui?, RegCom?, Address, Phone, Email, DriverLicenseNumber?, CreatedAt`
Tenant aparține companiei de flotă, **nu** primește cont RIDElance.

**Rental**
`Id, PublicCode (RL-000123), CompanyId, VehicleId, TenantId, Status,`
`PickupDate, PickupTime, ExpectedReturnDate, ExpectedReturnTime,`
`RentPrice, Deposit, OtherCosts?, MileageAtPickup?, HasMileageLimit, MileageLimit?, ExtraMileageCost?,`
`FuelLevelAtPickup?, FuelReturnRule, Notes?, CreatedAt`

**FleetRentalDefaults**
`CompanyId, RentPrice?, Deposit?, MinPeriodDays?, HasMileageLimit, MileageLimit?, ExtraMileageCost?, FuelReturnRule?, DefaultConditions?`

**GeneratedDocument**
`Id, RentalId, Type (RentalContract|HandoverProtocol|ReturnProtocol), Status, FilePath, SignedFilePath?, GeneratedAt, SentAt?, SentToEmail?, SignedAt?, ExternalSignatureRef?, Version`

**CheckRecord**
`Id, RentalId, Kind (CheckIn|CheckOut), OccurredAt, Mileage, FuelLevel, AccessoriesJson, Notes?,`
`DepositReturned?, DepositWithheld?, WithholdingReason?, ExtraMileageCharge?, OtherCharges?` (ultimele cinci doar pentru `CheckOut`)

**VehicleDocument / CompanyDocument**
`Id, OwnerId, Type, FilePath, IssueDate?, ExpiryDate?, Status, ReplacedByDocumentId?, UploadedAt`

### 1.4 Enum-uri (exact acestea)

```
VehicleStatus:      available | rented | unavailable | archived
ListingStatus:      draft | published | paused | archived
RentalStatus:       draft | upcoming | active | completed | cancelled
DocumentStatus:     generated | sent_for_signature | signed | cancelled
VehicleDocStatus:   active | expiring_soon | expired | replaced
CheckPhotoSlot:     front | rear | left | right | interior | dashboard | extra
```

`VehicleDocStatus` este **derivat**, nu setat manual: se recalculează din `ExpiryDate` (job zilnic, §10).

---

## 2. Cont flotă

Înregistrare: email, telefon, parolă → verificare email → verificare telefon prin SMS → acces în dashboard.

Distinge două noțiuni separate:

- **Cont verificat** = email verificat + telefon verificat + firmă identificată prin CUI. Automat.
- **✓ Flotă verificată RIDElance** = flag setat manual/administrativ după verificare suplimentară a companiei și documentelor. **Nu se obține prin abonament.**

Badge-ul de flotă verificată apare pe pagina publică a firmei, pe anunțurile mașinilor și în rezultatele marketplace.

---

## 3. Configurarea firmei

La prima autentificare: un singur câmp — **CUI**. Se apelează integrarea ANAF existentă și se precompletează denumire, CUI, sediu și restul datelor disponibile.

Utilizatorul completează manual: reprezentant, telefon, email, logo, descriere, IBAN.
Toate se salvează **la nivel de companie** și se reutilizează automat în toate documentele generate.

**Date publice** — patru toggle-uri independente în `FleetProfile`, care controlează direct pagina publică:
`PublicPhone`, `PublicEmail`, `PublicWhatsApp`, `PublicLocation` (ON/OFF fiecare).

---

## 4. Adăugarea unei mașini

Wizard în 6 pași, cu salvare de draft după fiecare pas:

1. **Vehicul** — marcă, model, an, motorizare, transmisie, culoare, număr locuri, categorii ridesharing
2. **Ofertă** — preț săptămânal, garanție, tip ofertă, perioadă minimă, disponibilitate, data disponibilității, condiții, descriere
3. **Fotografii** — upload multiplu, marcare poză principală, reordonare drag & drop
4. **Locație** — adresă, oraș, zonă, hartă Mapbox cu pin mutabil, salvare `latitude`/`longitude`
5. **Dosar vehicul (opțional)** — nr. înmatriculare, VIN, kilometraj, documente
6. **Preview + publicare**

### Regula de blocare — critică

**Obligatoriu pentru publicare:** marcă, model, an, motorizare, transmisie, preț, tip ofertă, disponibilitate, oraș, locație, descriere, cel puțin o fotografie.

**NU se cer la publicare:** RCA, CASCO, ITP, talon, VIN, număr înmatriculare.

Pasul 5 este skip-abil integral. Flota trebuie să ajungă rapid în marketplace.

---

## 5. Cerințe progresive (gate la generarea documentelor)

Implementează un serviciu `RentalDocumentRequirementsChecker` care, înainte de generarea oricărui document, verifică ce câmpuri lipsesc din Company / Vehicle / Tenant / Rental și returnează lista lor.

UI: modal cu **exact câmpurile lipsă**, nu redirect către formularul complet de editare vehicul.

```
Pentru generarea contractului mai trebuie completate:
  Număr înmatriculare
  VIN
  Culoare
[Completează]
```

După completare, datele se persistă pe `Vehicle` / `Company` și **nu se mai cer niciodată**.

---

## 6. Închiriere nouă și generarea documentelor

### 6.1 Punctul de intrare

Acțiunea principală este **`+ Închiriere nouă`**, nu „creează contract". Contractul este un output al închirierii.

Când fluxul pornește din pagina unei mașini, sistemul are deja compania, vehiculul, VIN-ul, numărul de înmatriculare și datele standard. Formularul cere **doar** ce e specific închirierii.

### 6.2 Prefill din valorile implicite

`Setări → Valori implicite închiriere` populează `FleetRentalDefaults`. La creare de Rental, valorile se **copiază** în Rental ca snapshot.

**Modificarea unei valori într-un Rental nu modifică niciodată `FleetRentalDefaults`.** Testează explicit acest caz.

### 6.3 Datele închirierii

- **Perioadă:** data + ora preluării, data + ora estimată de predare
- **Financiar:** chirie, garanție, alte costuri
- **Kilometraj:** km la predare, limită km DA/NU → dacă DA: număr km + cost/km suplimentar
- **Combustibil/baterie:** nivel la predare, regulă de retur (`plin → plin` | `cel puțin nivelul de la preluare`)
- **Accesorii:** chei, carduri, cablu încărcare, adaptor, stingător, triunghi, trusă, altele (checkbox-uri + câmp liber)
- **Observații:** text liber

### 6.4 Generare

```
Date companie + Date vehicul + Date chiriaș + Date închiriere + Template RIDElance
        → QuestPDF → PDF → salvat cu rental_id
```

Aceeași logică pentru procesul-verbal de predare/primire, cu date suplimentare: km, nivel combustibil/baterie, accesorii, observații.

---

## 7. Preview, descărcare, semnare

După generare, utilizatorul vede **Preview** și două acțiuni de rang egal:

- **Descarcă PDF** → flux clasic (tipărire, semnare pe hârtie)
- **Trimite pe email pentru semnare** → flux digital

**Ambele trebuie să existe. RIDElance nu forțează niciuna.**

### Trimitere spre semnare

Popup cu un singur câmp:

```
Trimite contractul pentru semnare
Email: [adrian@email.ro]        ← precompletat din Tenant, editabil
[Anulează] [Trimite]
```

Se folosește **mecanismul de semnare deja existent în fluxul de deschidere PFA** `[VERIFICĂ ÎN COD]`. Chiriașul semnează din email, **fără cont RIDElance**.

Abstractizează-l în spatele unui port (`IDocumentSignatureService`) ca să nu duplici logica între cele două fluxuri.

### Status și istoric

Statusul se afișează în dashboard cu timestamp:

```
Contract închiriere
Trimis spre semnare · 17.08.2026 14:32
```
```
Contract închiriere
✓ Semnat · 17.08.2026 15:08
```

Versiunea semnată se salvează automat pe Rental. Acțiuni disponibile: **Vizualizează / Descarcă / Retrimite**. Se păstrează istoricul complet al documentului (versiuni, retrimiteri).

---

## 8. Check-in / Check-out

**Check-in** (la predare): data și ora reală, kilometraj, nivel baterie/combustibil, accesorii, observații, fotografii pe sloturile din §1.4.

**Check-out** (la returnare): aceleași câmpuri + garanție returnată, garanție reținută, motivul reținerii, cost km suplimentar, alte costuri, fotografii.

### Comparare fotografii

UI cu două coloane, slot lângă slot:

```
CHECK-IN          CHECK-OUT
Față          |   Față
Spate         |   Spate
Stânga        |   Stânga
Dreapta       |   Dreapta
Interior      |   Interior
```

**Comparație pur vizuală.** Nu se implementează detecție AI de daune în V1.

### Propagarea kilometrajului

La salvarea check-out-ului: `vehicle.CurrentMileage = checkout.Mileage`.
Din asta rezultă automat calculul distanței până la următoarea intervenție de mentenanță.

---

## 9. Documente și storage

### Documente vehicul

Tipuri: talon, RCA, CASCO, ITP, copie conformă, rovinietă, altele.
Per document: tip, fișier, data emiterii, data expirării, status. Acțiuni: **Vizualizează / Descarcă / Înlocuiește**.

**Rămân opționale.** Mașina se publică fără ele. În loc de blocare, afișează un indicator de progres:

```
Dosar vehicul — 45% complet
Completează dosarul pentru alerte de expirare și administrare mai rapidă.
```

### Documente societate

Separate de mașini: certificat înregistrare, certificat constatator, autorizații, contracte, altele. Aceeași logică: storage privat, preview, download, expirare opțională.

### Preview fără download — obligatoriu

PDF-urile și imaginile se văd **direct în RIDElance**, în modal / drawer / full screen. Utilizatorul nu descarcă un document doar ca să-l consulte.

### Organizarea storage-ului

Structură logică, nu fișiere într-un folder plat:

```
{company_id}/
  documents/
  vehicles/{vehicle_id}/
    photos/
    documents/
    maintenance/
  rentals/{rental_id}/
    contracts/
    protocols/
    signed/
    checkin/
    checkout/
```

Tot storage-ul este privat, servit prin URL-uri semnate cu expirare.

---

## 10. Expirări, mentenanță, istoric

### Notificări de expirare

Job zilnic peste orice document cu `ExpiryDate`. Praguri: **30 zile, 14 zile, 7 zile, în ziua expirării**.
Canale în V1: dashboard + email. Recalculează `VehicleDocStatus` în același job.

### Mentenanță

Vizualizare globală + per mașină. Intervenție: vehicul, dată, km, tip, furnizor, cost, observații, document/factură.
Reminder: după dată **sau** după kilometraj (folosind `vehicle.CurrentMileage`).

### Timeline vehicul

`VehicleEvent` este append-only și se scrie **automat** din acțiunile sistemului — nu manual de utilizator:

```
17 aug — contract semnat
17 aug — proces-verbal semnat
17 aug — check-in finalizat
16 aug — RCA nou încărcat
2 aug  — schimb filtre
30 iul — închiriere încheiată
```

### Istoric închirieri per mașină

Coloane: chiriaș, perioadă, valoare contractuală, încasat înregistrat, km parcurși, status.

**Nu folosi termenii „profit" sau „câștig".** Nu avem sursă financiară completă. Afișează doar ce a fost înregistrat efectiv.

### Plăți (V1)

`+ Înregistrează plată` — sumă, dată, metodă, observații. Rezumat:

```
Contract:            14.400 lei
Plăți înregistrate:   7.200 lei
Rămas:                7.200 lei
```

---

## 11. Pagina publică

```
ridelance.ro/{company-slug}                          → pagina flotei
ridelance.ro/{company-slug}/{vehicle-slug}           → pagina mașinii
```

Afișează **strict** ce a permis compania prin toggle-urile din §3.

**Linkuri inteligente:** `?utm_source=olx`, `?utm_source=facebook`, `?utm_source=whatsapp`. Persistă sursa pe view-uri pentru raportare ulterioară (reutilizează deduplicarea de view-uri existentă `[VERIFICĂ ÎN COD]`).

**Locație:** backendul păstrează întotdeauna coordonatele reale. Dacă `PublicLocation` este OFF sau precizia e setată pe zonă, public se afișează doar zona / un punct aproximativ.

---

## 12. Fazele de implementare

Fiecare fază = un PR. Nu treci mai departe până nu trec criteriile de acceptanță.

### Faza 1 — Schema și fundamentul
Migrări pentru toate entitățile din §1, enum-urile din §1.4, structura de storage din §9.
**Acceptanță:** migrările rulează curat pe o bază goală și pe una existentă; seed cu o companie, un vehicul, un listing.

### Faza 2 — Vehicle + Listing + wizard de adăugare
Wizardul din §4 cu draft per pas, upload și reordonare fotografii, Mapbox cu pin mutabil.
**Acceptanță:** o mașină se publică fără VIN, fără număr de înmatriculare și fără niciun document. `listing.Status = paused` nu atinge niciun alt obiect.

### Faza 3 — Rental + Tenant + valori implicite
Formularul din §6.3, prefill din `FleetRentalDefaults`, gate-ul de cerințe progresive din §5.
**Acceptanță:** modificarea garanției într-un rental nu schimbă valoarea implicită a firmei (test explicit); modalul de cerințe listează exact câmpurile lipsă.

### Faza 4 — Generare documente
Contract + proces-verbal prin QuestPDF, preview în aplicație, descărcare, persistare pe `rental_id`.
**Acceptanță:** PDF-ul conține datele companiei, vehiculului, chiriașului și închirierii fără nicio reintroducere manuală.

### Faza 5 — Semnare
`IDocumentSignatureService` peste mecanismul existent, popup de trimitere, tranziții de status, salvarea versiunii semnate, retrimitere, istoric.
**Acceptanță:** chiriașul semnează dintr-un email, fără cont; documentul semnat apare automat în rental; ambele fluxuri (digital și descărcare) funcționează independent.

### Faza 6 — Check-in / Check-out
Formulare, fotografii pe sloturi, comparație vizuală în două coloane, propagarea kilometrajului.
**Acceptanță:** `vehicle.CurrentMileage` se actualizează la check-out; garanția reținută cu motiv apare în rezumatul închirierii.

### Faza 7 — Documente, expirări, mentenanță, timeline
Documente vehicul și societate, viewer inline, job de expirare, mentenanță cu reminder dublu, `VehicleEvent`.
**Acceptanță:** un document cu expirare peste 7 zile generează notificare în dashboard și pe email; timeline-ul se populează singur din acțiunile fazelor 4-6.

### Faza 8 — Pagina publică + plăți
Slug-uri, respectarea toggle-urilor de vizibilitate, UTM, înregistrare plăți.
**Acceptanță:** cu `PublicPhone = OFF`, telefonul nu apare nici în HTML, nici în răspunsul API-ului public.

---

## 13. Meniul dashboardului

```
Acasă
Mașinile mele
Închirieri
Documente societate
Mentenanță
Pagina firmei
Beneficii
Setări
```

### Pagina unei mașini

Header: `Tesla Model 3 Dual Motor, 2021` · `PH 01 TKI` · `VIN ...` · `222.500 km`
Taburi: **Prezentare / Închirieri / Documente / Mentenanță / Istoric**
Acțiuni: `+ Închiriere nouă`, `Generează contract`, `Generează proces-verbal`, `Vezi anunț public`

---

## 14. Regula principală de UX

**Orice informație cunoscută deja se reutilizează. Se introduce o singură dată.**

Interzis: „scrie din nou numele firmei", „scrie din nou VIN-ul", „scrie din nou chiriașul pentru procesul-verbal".

Valorile implicite **precompletează, dar nu blochează** editarea.

---

## 15. În afara scopului V1

- Marketplace de șoferi și matching
- Conturi RIDElance pentru chiriași
- Detecție AI de daune la compararea fotografiilor
- Calcul de profit / câștig
- Badge de flotă verificată cumpărat prin abonament

---

## Anexă — fluxul complet al unei închirieri

```
TESLA MODEL 3
      ↓
+ ÎNCHIRIERE NOUĂ
      ↓
DATE CHIRIAȘ
      ↓
CONDIȚII ÎNCHIRIERE
      ↓
SALVEAZĂ RENTAL
      ↓
┌─────────────────┴─────────────────┐
↓                                   ↓
CONTRACT                      PROCES VERBAL
↓                                   ↓
PREVIEW                          PREVIEW
↓                                   ↓
├─ DESCARCĂ PDF                  ├─ DESCARCĂ PDF
└─ TRIMITE EMAIL                 └─ TRIMITE EMAIL
      ↓                             ↓
   SEMNARE                       SEMNARE
      ↓                             ↓
DOCUMENT SEMNAT               DOCUMENT SEMNAT
└─────────────────┬─────────────────┘
                  ↓
              CHECK-IN
                  ↓
        ÎNCHIRIERE ACTIVĂ
                  ↓
              CHECK-OUT
                  ↓
       ÎNCHIRIERE ÎNCHEIATĂ
                  ↓
               ISTORIC
```

# Spec — Pagina de detaliu vehicul (VDP) + tracking vizualizări

**Scop:** pagină publică de prezentare a unei mașini disponibile spre închiriere pentru șoferi rideshare (PFA). Rolul paginii este **generare de lead**, nu vânzare. Nu există checkout, nu există plată online, nu se colectează date de card nicăieri în flux.

**Stack:** React + MUI. Se folosesc exclusiv design tokens existenți (paletă, spacing, radius, typography). Zero culori hardcodate, zero `#hex` în componente, zero valori px arbitrare unde există token.

---

## 1. Rută & entry points

- Rută: `/masini/:slug` unde `slug = {marca}-{model}-{an}-{id}` (ex. `dacia-logan-2022-4817`). ID-ul numeric la final e sursa de adevăr pentru fetch; slug-ul e cosmetic/SEO. Dacă slug-ul nu corespunde ID-ului → redirect 301 către slug-ul canonic.
- Intrări: card din lista de mașini, link partajat, dashboard partener (preview), rezultate căutare.
- Query params opționale, doar pentru prefill în formular: `?start=2026-09-01&weeks=4`.

---

## 2. Layout general

**Desktop (`md+`):** container max `1200px`, două coloane sub galerie:
- coloana stângă ~62% — tot conținutul informațional;
- coloana dreaptă ~34% — cardul de preț + CTA, `position: sticky`, offset de top egal cu înălțimea header-ului + un spacing unit.

**Mobil (`xs–sm`):** o singură coloană, totul stivuit în ordinea de mai jos, iar cardul de preț devine **bară fixă jos** (preț la stânga, buton CTA la dreapta), cu `safe-area-inset-bottom`.

Ordinea secțiunilor pe verticală:

1. Galerie foto (full-width, deasupra celor două coloane)
2. Header vehicul (titlu + meta)
3. Card preț & CTA *(dreapta pe desktop, sub header pe mobil ca bloc inline + bară sticky)*
4. Specificații rapide
5. Dotări (vehicle features)
6. Descriere
7. Ce include închirierea
8. Condiții & reguli
9. Eligibilitate platforme (Uber / Bolt / etc.)
10. Zonă de ridicare
11. Partener / flotă
12. Recenzii
13. Întrebări frecvente
14. Mașini similare

---

## 3. Galerie foto

**Desktop:** grid pe 4 coloane × 2 rânduri.
- Foto principală ocupă coloanele 1–2 și ambele rânduri (pătrat/landscape mare).
- 4 poze secundare umplu restul celulelor.
- Colțuri rotunjite doar pe exteriorul grid-ului (stânga sus/jos pe imaginea mare, dreapta sus/jos pe ultimele thumbnail-uri), gap mic uniform între imagini.
- Buton discret suprapus în colțul dreapta-jos: „Vezi toate pozele (N)”, fundal semi-opac, deasupra imaginii.
- Aspect ratio fix pe container (`16 / 9` sau `3 / 2`) ca să nu existe CLS la încărcare.

**Mobil:** carusel full-bleed, swipe orizontal, `scroll-snap`. Contor overlay „3 / 12” în colț. Tap pe imagine → lightbox.

**Lightbox:** dialog full-screen, imagine centrată pe fundal închis, săgeți stânga/dreapta pe desktop, swipe pe mobil, contor, închidere pe `ESC` / buton X / click pe fundal. Navigare și cu tastele săgeți. Focus trap în interior, focus returnat pe elementul declanșator la închidere.

**Reguli:**
- Prima imagine se încarcă `eager` + `fetchpriority=high` (e LCP-ul paginii); restul `lazy`.
- `srcset` cu 3 lățimi, format modern cu fallback.
- Sub 5 poze: layout se degradează elegant (1 poză → full width; 2–4 poze → grid simetric fără celulă mare).
- Zero poze: placeholder cu silueta mașinii + text „Fotografii în curs de adăugare”. CTA-ul rămâne funcțional.
- `alt` descriptiv per imagine: „Dacia Logan 2022 — interior, bord”.

---

## 4. Header vehicul

- `h1`: **Marcă Model An** (ex. „Dacia Logan 2022”). O singură dimensiune, greutate mare, fără text secundar în același rând.
- Rând de meta imediat sub titlu, separat prin bullet-uri: rating (valoare + număr de recenzii), număr de închirieri finalizate, oraș/zonă.
- Rând de chip-uri: transmisie, combustibil, categoria platformei (ex. „Eligibil Uber X”), status disponibilitate.
- Chip de status cu variante semantice: `Disponibil` (success), `Rezervat până la DD.MM` (warning), `Indisponibil` (default/disabled).

---

## 5. Card preț & CTA

Elementul central al paginii. **Unitatea de preț este săptămâna, peste tot, fără excepție.**

**Structură:**
1. Preț principal, foarte vizibil: valoare mare + „/ săptămână” la dimensiune normală, în culoare secundară de text. Cifre cu `font-variant-numeric: tabular-nums`.
2. Sub preț, opțional: echivalent zilnic calculat, mic și gri, cu prefix „≈” (ex. „≈ 178 lei / zi”) — **strict informativ**, niciodată folosit ca preț de referință.
3. **Selector de durată** (segmented / toggle group): `1 săptămână` · `4 săptămâni` · `12 săptămâni`. La schimbare, prețul afișat se actualizează la tariful săptămânal aferent treptei. Dacă o treaptă e mai ieftină, se afișează un chip de economie („-8%”) lângă opțiune. Selecția aleasă se propagă în formularul din popup.
4. Listă compactă cu 3–5 rânduri „ce include” (icon + text scurt): km incluși pe săptămână, asigurare, service & revizii, kit platformă, asistență rutieră.
5. Rând separat, discret: garanție/depozit (sumă + mențiunea că se restituie la predare).
6. **CTA primar**, buton contained, full width: „Solicită mașina” → deschide popup-ul de lead existent.
7. **CTA secundar**, buton outlined, full width: „Sună partenerul” (pe mobil `tel:`, pe desktop dezvăluie numărul la click) sau WhatsApp.
8. Microcopy sub butoane, text mic: „Fără plată online. Te contactăm pentru confirmare și programare.”

**Interzis în card:** orice sumă totală de tip checkout, breakdown de taxe, „taxa de serviciu”, iconițe de carduri, orice text care sugerează debitare imediată.

**Stare indisponibil:** CTA primar devine „Anunță-mă când e liberă”, deschide același popup cu un flag `intent: waitlist`.

**Mobil:** cardul apare inline sub header (fără sticky), iar bara fixă de jos afișează doar prețul săptămânal + butonul primar. Bara apare după ce utilizatorul a derulat dincolo de cardul inline.

---

## 6. Specificații rapide

Rând de 4–6 itemi, icon deasupra sau lângă valoare: an, cutie de viteze, combustibil, locuri, portbagaj (litri), consum mediu declarat. Pe mobil, grid 2 coloane. Fără card cu border — separare doar prin spacing.

---

## 7. Dotări (vehicle features)

- Grid de itemi „icon + etichetă”, aliniate pe baseline: 2 coloane pe mobil, 3 pe `md`, 4 pe `lg`.
- Se afișează maximum 8 implicit; dacă sunt mai multe → buton text „Vezi toate cele N dotări” care deschide un dialog cu lista completă grupată pe categorii (Confort, Siguranță, Multimedia, Exterior).
- Iconițele vin dintr-un map `featureKey → icon`; pentru chei necunoscute se folosește un icon generic în loc să crape randarea.
- Nu se afișează dotări absente (fără liste cu bifă tăiată).

---

## 8. Descriere

Text liber al partenerului, limitat la 4 linii cu fade + buton „Citește mai mult” care expandează inline (fără dialog). Se sanitizează HTML-ul; se permit doar paragrafe, liste și bold.

---

## 9. Ce include închirierea

Listă cu iconițe, 2 coloane pe desktop. Itemi tipici: RCA + CASCO, ITP la zi, revizii și consumabile, anvelope sezoniere, rovinietă, înlocuire în caz de defecțiune, asistență rutieră, suport pentru documentele de platformă. Fiecare item are titlu scurt + o linie de detaliu opțională.

---

## 10. Condiții & reguli

Bloc dens, informativ, structurat ca listă de perechi etichetă → valoare:
- kilometri incluși / săptămână și tariful pe km suplimentar;
- garanție/depozit și condițiile de restituire;
- vârstă minimă și vechime permis;
- politica de combustibil și de curățenie la predare;
- regim amenzi și daune;
- perioadă minimă de închiriere;
- preaviz pentru reziliere.

Se randează dintr-un array de obiecte, nu hardcodat, ca să poată fi editat de partener.

---

## 11. Eligibilitate platforme

Rând de badge-uri cu logo + categorie (ex. „Uber X”, „Bolt Comfort”). Sub ele, o linie de text care clarifică dacă mașina vine deja cu documentele necesare pentru înscriere pe platformă. Dacă mașina nu e eligibilă pe nicio platformă, secțiunea nu se randează deloc.

---

## 12. Zonă de ridicare

Hartă statică (imagine) cu un cerc de rază aproximativă centrat pe zonă — **nu adresa exactă**. Sub hartă: oraș + sector/cartier + un reper („lângă metrou X”). Adresa exactă se comunică după contact. Harta se încarcă lazy, sub fold.

---

## 13. Partener / flotă

Card cu: avatar/logo, denumire, badge „Partener verificat” dacă e cazul, număr de mașini în flotă, rating agregat, timp mediu de răspuns, membru din (an). Buton text „Vezi toate mașinile partenerului” → listă filtrată.

---

## 14. Recenzii

- Sumar: rating mare + număr total + breakdown pe stele (bare orizontale) și, opțional, pe criterii (stare mașină, comunicare, promptitudine).
- Listă de 3 recenzii inițial, fiecare cu autor (prenume + inițială), dată, rating, text limitat la 3 linii cu „mai mult”.
- Buton „Vezi toate recenziile (N)” → dialog cu paginare / infinite scroll.
- Empty state: „Această mașină nu are încă recenzii.” — fără scoruri false, fără placeholder de stele goale.

---

## 15. Întrebări frecvente

Accordion cu 5–8 întrebări, sursă din backend per vehicul cu fallback pe un set global. Prima întrebare închisă implicit (nu deschisă), câte una deschisă la un moment dat.

---

## 16. Mașini similare

Carusel orizontal cu 4–8 carduri, criteriu: aceeași categorie de platformă + preț săptămânal ±20%, exclusiv vehiculul curent, doar disponibile. Fiecare card afișează **prețul săptămânal**, nu zilnic. Click → navigare către alt VDP (ceea ce va declanșa un view nou pentru acel vehicul).

---

## 17. Popup CTA (se refolosește dialogul existent)

Nu se construiește un formular nou; se extinde cel existent cu un context de vehicul.

**Prefill / context transmis la deschidere:**
`vehicleId`, denumire vehicul, tarif săptămânal selectat, durata selectată (1/4/12 săptămâni), `intent` (`request` | `waitlist`), sursa (`vdp`).

**Câmpuri:** nume complet, telefon (validare format RO), email, oraș, data dorită de start, durata (preselectată din card), „Ai deja cont activ pe Uber/Bolt?” (da/nu), mesaj opțional.

**Consimțământ:** checkbox GDPR obligatoriu, cu link către politica de confidențialitate. Fără pre-bifare.

**Header dialog:** thumbnail mașină + denumire + tarif săptămânal, ca utilizatorul să vadă pentru ce trimite cererea.

**Submit:** `POST /api/leads` cu payload-ul de mai sus. Buton în stare `loading`, dezactivat, fără dublu-submit.

**Succes:** se înlocuiește conținutul dialogului cu o stare de confirmare — iconiță, „Cererea a fost trimisă”, „Te contactăm în maximum 24 de ore lucrătoare”, buton „Închide”. Nu se închide automat.

**Eroare:** mesaj inline deasupra butonului, datele din formular se păstrează.

---

## 18. Tracking vizualizări

**Regula de bază:** un view se înregistrează **exclusiv la intrarea pe pagina de detaliu a vehiculului**. Niciodată din listă, din card, din carusel de similare, din preview-ul partenerului sau din prefetch.

### Client

- Un singur `useEffect` în componenta de pagină, cu guard pe `useRef` ca să nu se dubleze la double-mount în React StrictMode (dev).
- Se trimite doar dacă `document.visibilityState === 'visible'`. Dacă tab-ul e în background la mount, se atașează un listener `visibilitychange` și se trimite la prima revenire în prim-plan.
- **Delay de 2 secunde** înainte de trimitere, cu `clearTimeout` la unmount. Un utilizator care intră și iese instant nu contorizează.
- Deduplicare locală: cheie `vdp_view:{vehicleId}` în `sessionStorage`. Dacă există, nu se retrimite (refresh, back/forward, re-render nu contorizează).
- Fire-and-forget: fără stare de loading, fără blocarea UI, eroarea se înghite silențios (doar log în consolă în dev).
- Se folosește `keepalive: true` pe fetch, ca requestul să nu fie anulat de o navigare rapidă.
- Nu se trimite dacă ruta e randată în context de admin/preview partener → se pasează un prop/flag `trackView={false}`.

### Backend

- Endpoint dedicat: `POST /api/vehicles/{id}/views`, body opțional `{ source: "vdp" }`. Nu se incrementează niciodată în `GET /api/vehicles/{id}`.
- Răspuns `204 No Content`. Fără corp, fără informații despre contor.
- Rate limit pe IP (ex. 60 req/min) și validare că vehiculul există și e publicat.
- Deduplicare server-side: fereastră de 30 de minute per `(vehicleId, visitorHash)`, unde `visitorHash = hash(ip + user-agent + salt)` — nu se stochează IP brut.
- Filtrare boți: user-agent-uri cunoscute de crawler și requesturi fără `Referer` + fără `Accept-Language` nu incrementează, dar returnează tot `204`.

### Persistență

- Tabel `vehicle_views`: `id`, `vehicle_id`, `visitor_hash`, `source`, `created_at`. Index compus pe `(vehicle_id, created_at)`.
- Contor denormalizat pe `vehicles`: `view_count` (total) și `unique_view_count`, actualizate în aceeași tranzacție sau printr-un job periodic dacă volumul o cere.
- Se păstrează linia individuală ca să se poată calcula „views în ultimele 7 zile” pentru dashboard-ul partenerului.

### Afișare

- Public, opțional și doar peste un prag (ex. ≥ 20 în 7 zile): o linie discretă lângă meta din header — „N persoane au vizualizat mașina în ultimele 7 zile”. Sub prag, nu se afișează nimic (nu arătăm „3 vizualizări”).
- În dashboard-ul partenerului: total, unic, trend 7/30 zile, rată de conversie view → lead.

---

## 19. Contract API

`GET /api/vehicles/{id}` returnează un obiect cu, minimal:

```
id, slug, make, model, year, status ("available" | "reserved" | "unavailable"),
photos: [{ url, alt, width, height, order }],
pricing: {
  currency: "RON",
  tiers: [ { weeks: 1, weeklyPrice }, { weeks: 4, weeklyPrice }, { weeks: 12, weeklyPrice } ],
  deposit,
  includedKmPerWeek,
  extraKmPrice
},
specs: { transmission, fuel, seats, doors, trunkLiters, avgConsumption },
features: [ { key, label, category } ],
included: [ { key, label, detail } ],
rules: [ { label, value } ],
platforms: [ { key: "uber", tier: "X" } ],
description,
location: { city, area, lat, lng, radiusMeters },
partner: { id, name, logoUrl, verified, fleetSize, rating, responseTimeHours, memberSince },
reviews: { average, count, breakdown, items: [...] },
faq: [ { question, answer } ],
stats: { viewsLast7Days }
```

**Regulă de aur:** backend-ul expune **doar prețuri săptămânale**. Prețul zilnic aproximativ, dacă e afișat, se calculează în UI ca `weeklyPrice / 7` și se rotunjește. Nu există câmp `dailyPrice` în API.

---

## 20. Stări ale paginii

- **Loading:** skeleton-uri cu aceleași dimensiuni ca finalul (galerie cu aspect ratio fix, 2 linii de titlu, card de preț). Zero layout shift.
- **404:** vehiculul nu există sau nu e publicat → pagină dedicată cu mesaj și buton către lista de mașini.
- **Eroare de rețea:** mesaj + buton „Reîncearcă”, nu ecran alb.
- **Indisponibil:** pagina se randează integral, cu banner informativ sus și CTA transformat în waitlist.

---

## 21. Performanță

- LCP țintă < 2.5s: prima imagine preîncărcată, dimensiuni explicite, fără fonturi blocante.
- Lightbox, hartă și dialogul de dotări se încarcă lazy (code splitting).
- Recenziile de după primele 3 și mașinile similare se încarcă la intersecție cu viewport-ul.
- Imaginile se servesc în format modern, cu dimensiuni potrivite per breakpoint.

---

## 22. SEO & share

- `title`: „Marcă Model An de închiriat în Oraș — X lei/săptămână”.
- `meta description` generată din specs + preț săptămânal.
- Open Graph / Twitter card cu prima fotografie.
- JSON-LD de tip produs/ofertă, cu `priceSpecification` exprimat pe **săptămână** (`unitCode` corespunzător), nu pe zi.
- URL canonic pe slug.

---

## 23. Accesibilitate

- Un singur `h1`, ierarhie corectă `h2`/`h3` pe secțiuni.
- Focus trap în lightbox și în dialogul de lead; focus returnat la închidere.
- Toate butoanele icon-only au `aria-label`.
- Caruselul e navigabil cu tastatura, cu butoane prev/next reale (nu doar swipe).
- Contrast conform tokenilor existenți; prețul nu se bazează doar pe culoare pentru a comunica reducerea.
- Zonele tap ≥ 44×44 px pe mobil.

---

## 24. Analytics

Evenimente de trimis: `vdp_viewed` (vehicleId, source), `vdp_gallery_opened`, `vdp_duration_changed` (weeks), `vdp_cta_clicked` (intent), `vdp_phone_revealed`, `vdp_lead_submitted` (vehicleId, weeks, intent), `vdp_similar_clicked`.

---

## 25. Structură de fișiere sugerată

```
features/vehicles/
  pages/VehicleDetailPage.tsx
  components/
    VehicleGallery.tsx
    VehicleGalleryLightbox.tsx
    VehicleHeader.tsx
    PricingCard.tsx
    PricingCardMobileBar.tsx
    DurationSelector.tsx
    QuickSpecs.tsx
    FeatureGrid.tsx
    FeaturesDialog.tsx
    IncludedList.tsx
    RulesList.tsx
    PlatformBadges.tsx
    PickupArea.tsx
    PartnerCard.tsx
    ReviewsSection.tsx
    VehicleFaq.tsx
    SimilarVehicles.tsx
    VehicleDetailSkeleton.tsx
  hooks/
    useVehicle.ts
    useVehicleViewTracking.ts
    useWeeklyPricing.ts
  utils/
    formatWeeklyPrice.ts
    featureIconMap.ts
```

---

## 26. Definition of done

- [ ] Toate prețurile afișate în UI sunt săptămânale; echivalentul zilnic apare doar ca text secundar cu „≈”.
- [ ] Nu există niciun element de plată, card, checkout sau sumă totală de tranzacție.
- [ ] CTA-ul deschide popup-ul de lead existent, cu context de vehicul prefill-at.
- [ ] View-ul se incrementează o singură dată per sesiune, doar pe VDP, doar după 2s cu tabul vizibil.
- [ ] Refresh, back/forward și navigarea internă nu dublează contorul.
- [ ] Zero culori sau spacing-uri hardcodate; totul din tokenii existenți.
- [ ] Galeria funcționează corect cu 0, 1, 3 și 20 de poze.
- [ ] Pagina se randează complet și pe status `unavailable`.
- [ ] Fără CLS vizibil la încărcare; skeleton-urile au aceleași dimensiuni ca finalul.
- [ ] Lightbox și dialog trec verificarea de focus și navigare cu tastatura.

---

## 27. Non-goals (v1)

- Plată online, rezervare instant, calendar de disponibilitate în timp real.
- Chat în aplicație cu partenerul.
- Semnare contract în pagină.
- Comparator de mașini.
- Recenzii scrise direct din pagină (doar afișare).

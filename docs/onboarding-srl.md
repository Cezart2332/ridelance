# Onboarding Flotă / SRL

Ruta autentificată: `/onboarding-srl`. Conturile `CarPoster` create după lansare trec prin cele șapte etape; conturile existente păstrează accesul. PFA folosește în continuare propriul flux și propriul avans.

## Flux

1. CUI → rezultat ANAF salvat pe server → confirmare fără editare manuală. Profilul firmei se creează din copia confirmată. După confirmare nu se schimbă firma din onboarding.
2. Prenume, nume, funcție. Email și telefon se pot confirma prin cod, dar confirmarea **nu** blochează pasul cât timp `Onboarding:RequireContactVerification` e fals — furnizorii de email și SMS nu sunt configurați, iar un cod nelivrabil ar opri înrolarea. Se aprinde din configurație, pe backend, iar interfața citește starea din răspuns (`contactVerificationRequired`). Fără documente personale sau aprobare administrativă.
3. Platforme și număr de mașini (inclusiv zero). „Niciuna” exclude celelalte opțiuni. Nu conectează platformele.
4. Banca prin integrarea existentă, oferta BCR și QR. Conexiunea poate fi amânată; după revenirea de la provider se verifică starea. Intenția BCR din pagina publică se păstrează.
5. Oblio: email, token API, CIF confirmat, serie opțională. Cheia este tratată de integrarea existentă și nu se salvează în progres. Configurarea poate fi amânată.
6. Fleet lunar sau anual, cu suma calculată pe server.
7. Documente juridice și Stripe Embedded Checkout. Acceptarea se păstrează cu dată și versiune. Accesul se acordă exclusiv după webhookul de plată confirmat.

Progresul se salvează la continuarea fiecărui pas. Datele nesalvate din formular nu se păstrează la refresh.

## Interfață

Fluxul folosește același cadru ca înrolarea PFA: `shell/OnboardingChrome` (bara de sus, rail-ul de pași, coloana de conținut), `shell/StepIntroCard` pentru antetul pasului și `micro/OnboardingCard` cu `micro/CardFooter` pentru cardul central. Pașii, etichetele și antetele stau în `fleet/fleetSteps.ts`, în forma cerută de rail. Cadrul e o singură definiție pentru ambele fluxuri, deci nu poate diverge la următoarea modificare.

## Prețuri și BCR

| Ciclu | Normal | BCR confirmat înainte de checkout |
| --- | ---: | ---: |
| Lunar | 299 lei/lună | 249 lei/lună timp de 6 luni, apoi 299 |
| Anual | 3.229,20 lei/an | 2.929,20 lei prima factură, apoi 3.229,20 |

Anualul include reducerea de 10%. Beneficiul BCR anual scade 300 lei o singură dată. Intenția de a deschide cont nu activează singură reducerea.

Admin → Coduri de reducere → BCR · Flote SRL: confirmare eligibilitate. Aceasta nu este o aprobare a onboardingului și nu blochează continuarea. O confirmare după plată aplică reducerea facturilor viitoare; nu rambursează automat prima factură. Nu se poate modifica eligibilitatea în timpul unei sesiuni deschise, pentru a nu schimba suma deja prezentată.

## Plăți și acces

- Endpointurile `/fleet-onboarding` citesc/salvează progresul numai pentru contul SRL autentificat.
- `/fleet-onboarding/checkout` creează sau reia aceeași sesiune. `DELETE` închide sesiunea neplătită, apoi permite schimbarea selecției.
- Un identificator de încercare persistent și concurența optimistă împiedică două cereri simultane să creeze două sesiuni diferite.
- Sesiunea deschisă blochează modificarea datelor/prețului. La revenirea din Stripe, interfața așteaptă confirmarea serverului.
- Webhookul verifică plata și ignoră repetarea aceleiași sesiuni Fleet.
- Middleware-ul restricționează API-ul conturilor noi înainte de finalizare. Integrările de configurare și verificarea contactelor rămân accesibile.
- Un abonament cu plată restantă nu poate fi înlocuit automat printr-un al doilea checkout. Mesajul trimite la suport pentru recuperarea abonamentului existent.

## Migrare și verificări

Migrarea `20260906120000_AddFleetOnboarding` adaugă două coloane în `public.users`. Valoarea implicită `fleet_onboarding_required=false` păstrează accesul SRL-urilor existente. Înregistrarea conturilor noi scrie explicit `true` pentru `CarPoster`.

Teste backend: stări, acces, contacte, pași, prețuri, sesiuni refolosite, webhook plătit/neplătit și duplicat. Teste Playwright desktop/mobil: traseul până la plată, prețuri BCR, ruta protejată și confirmarea plății. Acestea folosesc servicii simulate; nu execută plăți sau conexiuni bancare reale.

Comenzi:

```powershell
dotnet test backend/tests/UnitTests/UnitTests.csproj
dotnet test backend/tests/ArchitectureTests/ArchitectureTests.csproj
npx playwright test fleet-onboarding.spec.ts --output=test-results/fleet-run
npm run build
```

Linkul comercial dedicat pentru activarea anului gratuit Oblio nu exista în proiect. Butonul deschide site-ul oficial; activarea efectivă a beneficiului nu este automatizată de acest flux.

Surse pentru integrare: [schema ANAF v9](https://static.anaf.ro/static/10/Anaf/Informatii_R/Servicii_web/doc_WS_V9.txt), [autentificarea API Oblio](https://www.oblio.eu/api). Data ANAF este afișată ca „Data înregistrării”, fără a presupune că este data constituirii societății.

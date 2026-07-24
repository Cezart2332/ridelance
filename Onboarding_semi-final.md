Flux onboarding PFA RIDElance

**Obiectivul fluxului**

Fluxul trebuie să ducă un șofer de la verificarea inițială până la
situația în care are:

-   PFA activ;

-   cod de TVA intracomunitar;

-   cont bancar;

-   cont OBLIO;

-   documentele și împuternicirile necesare semnate;

-   autorizație pentru transport alternativ;

-   conturile de operator/fleet Bolt și/sau Uber;

-   mașină asociată;

-   copie conformă și ecusoane.

Fluxul nu trebuie construit ca un formular lung. Principiul de bază
este:

1.  utilizatorul răspunde la întrebări simple;

2.  încarcă fotografii sau PDF-uri;

3.  OCR-ul extrage automat datele;

4.  câmpurile sunt precompletate;

5.  RIDElance verifică datele din admin;

6.  documentele deja încărcate sunt reutilizate în pașii următori;

7.  utilizatorul nu încarcă același document de mai multe ori.

**Structura generală**

**Bara de progres recomandată**

**Eligibilitate → PFA → Fiscal, bancă și semnături → Autorizație
transport → Uber & Bolt → Vehicul, copie conformă și ecusoane**

În documentația tehnică, pașii pot fi numerotați astfel:

Pasul 0 --- Eligibilitate

Pasul 1 --- PFA

Pasul 2 --- TVA, semnături, bancă și OBLIO

Pasul 3 --- Autorizație transport alternativ

Pasul 4 --- Conturi Uber și Bolt

Pasul 5 --- Vehicul, copie conformă și ecusoane\
\
**Principiul „document-first"**

RIDElance trebuie să ceară cât mai puține informații prin câmpuri
manuale.

Date precum:

-   nume;

-   prenume;

-   CNP;

-   data nașterii;

-   domiciliu;

-   serie și număr CI;

-   număr permis;

-   data obținerii categoriei B;

-   CUI;

-   denumire PFA;

-   număr Registrul Comerțului;

-   sediu profesional;

-   cod CAEN;

-   IBAN;

-   număr de înmatriculare;

-   VIN;

-   date de emitere și expirare;

trebuie extrase prin OCR din documente și apoi:

-   validate automat;

-   afișate utilizatorului doar pentru confirmare, unde este necesar;

-   trimise în admin pentru verificare manuală atunci când OCR-ul are o
    încredere redusă.

Utilizatorul trebuie să completeze manual numai informațiile care nu pot
fi citite din documente, precum:

-   „Ai sau nu PFA?";

-   „Ai sau nu atestat?";

-   „Ai sau nu TVA intracomunitar?";

-   „Ai sau nu cont bancar?";

-   banca aleasă;

-   platformele pe care vrea să lucreze;

-   dacă are sau nu mașină;

-   modul în care deține mașina;

-   perioada dorită pentru copia conformă.

**PASUL 0 --- Eligibilitate**

**Scopul pasului**

Acest pas este o **verificare preliminară**, rapidă, înainte ca
utilizatorul să înceapă procesul de deschidere a PFA-ului sau să încarce
alte documente.

Nu trebuie transformat într-o verificare juridică completă. Verificarea
completă se va realiza ulterior, pe baza cazierului și a avizelor
medical și psihologic necesare pentru autorizația ARR.

Condițiile legale de bază pentru conducătorul auto includ vârsta minimă
de 21 de ani, permis categoria B de cel puțin doi ani și atestat
profesional pentru transport de persoane în regim de închiriere.
Legislația mai impune cazier corespunzător și avize medical și
psihologic „apt", dar acestea vor fi colectate la pasul autorizației.

**Ce solicită platforma**

**1. Carte de identitate**

Utilizatorul încarcă o fotografie cu CI.

OCR-ul extrage:

-   numele;

-   CNP-ul;

-   data nașterii;

-   domiciliul;

-   seria și numărul documentului.

Platforma calculează automat dacă utilizatorul are minimum 21 de ani.

**2. Permis de conducere**

Utilizatorul încarcă permisul față-verso.

OCR-ul extrage:

-   numele;

-   numărul permisului;

-   categoria B;

-   data obținerii categoriei B;

-   data expirării.

Platforma verifică dacă permisul categoria B are o vechime de minimum
doi ani.

**3. Atestat profesional**

Întrebare:

**Ai atestat profesional pentru transport persoane în regim de
închiriere?**

Răspunsuri:

-   Da;

-   Nu.

**Dacă răspunde „Da"**

Se afișează încărcarea documentului:

**Încarcă atestatul profesional**

OCR-ul extrage:

-   titularul;

-   seria/numărul;

-   data emiterii;

-   data expirării.

**Dacă răspunde „Nu"**

Se afișează un pop-up:

**Pentru a lucra legal pe platformele de transport alternativ ai nevoie
de atestat profesional. Obține atestatul, apoi revino în RIDElance
pentru a continua.**

CTA:

**Vezi cum obțin atestatul**

Utilizatorul rămâne cu status:

**În așteptarea atestatului**

Contul nu se șterge și progresul rămâne salvat.

**Condiția de finalizare**

Vârstă minimum 21 ani

AND

Permis categoria B de minimum 2 ani

AND

Atestat valid încărcat\
**Statusuri**

-   Eligibil preliminar;

-   Permis prea recent;

-   Vârstă neeligibilă;

-   Atestat lipsă;

-   Document în verificare;

-   Necesită verificare manuală.

**Observație importantă**

În interfață este mai corect să apară:

**Verificare preliminară finalizată**

și nu:

**Eligibil legal**

pentru că eligibilitatea completă depinde ulterior și de cazier, aviz
medical și aviz psihologic.

**PASUL 1 --- PFA**

**Întrebarea principală**

**Ai deja PFA?**

Opțiuni:

-   Am PFA;

-   Nu am PFA.

Cele două opțiuni deschid fluxuri diferite.

**VARIANTA A --- Utilizatorul nu are PFA**

**Principiu**

RIDElance nu trebuie să dubleze procesul Consulto și nu trebuie să
construiască un formular complet de înființare PFA dacă partenerul va
prelua procedura.

Utilizatorului trebuie să i se solicite **cât mai puține informații
suplimentare**, deoarece:

-   datele de identificare au fost deja extrase din CI;

-   telefonul și emailul există deja în contul RIDElance;

-   Consulto va colecta direct informațiile și documentele suplimentare
    necesare;

-   RIDElance trebuie doar să inițieze predarea clientului către
    partener.

**Ce vede utilizatorul**

Card informativ:

**Nu ai încă PFA?**\
Partenerul RIDElance te va ajuta cu înființarea, documentele și
procedura necesară. Datele de contact și informațiile deja furnizate în
RIDElance pot fi transmise partenerului pentru a nu le completa din nou.

**Ce se solicită**

Doar:

-   confirmarea numărului de telefon;

-   confirmarea adresei de email;

-   județul/localitatea în care dorește sediul profesional;

-   acordul pentru transmiterea datelor către Consulto;

-   eventual alegerea serviciului de găzduire, dacă această opțiune va
    face parte din colaborare.

Nu se mai solicită din nou:

-   numele;

-   CNP-ul;

-   fotografia CI;

-   data nașterii;

-   datele permisului;

-   atestatul.

Acestea există deja în dosarul utilizatorului.

**CTA**

În funcție de forma colaborării cu Consulto:

**Varianta 1 --- Preluare directă**

**Solicită deschiderea PFA**

RIDElance transmite către Consulto:

-   datele de contact;

-   datele de identificare deja colectate;

-   documentele pentru care există acord de transmitere;

-   ID-ul intern RIDElance;

-   serviciul solicitat;

-   opțiunea privind găzduirea.

**Varianta 2 --- Contact extern**

**Continuă către Consulto**

Utilizatorul este redirecționat către o pagină sau un formular dedicat
RIDElance.

**Varianta 3 --- Contact asistat**

**Vreau să fiu contactat**

Consulto primește lead-ul și contactează utilizatorul.

**Ce se întâmplă după deschiderea PFA-ului**

Consulto sau administratorul RIDElance încarcă în contul utilizatorului
documentele rezultate.

Utilizatorul nu trebuie să le încarce din nou.

Statusurile pot fi:

-   Solicitare transmisă;

-   Preluat de partener;

-   Documente în pregătire;

-   Documente de semnat;

-   Dosar depus la ONRC;

-   PFA înființat;

-   Necesită completări.

**VARIANTA B --- Utilizatorul are deja PFA**

Utilizatorul trebuie să încarce aceleași documente pe care RIDElance
le-ar fi primit de la Consulto dacă PFA-ul era înființat prin partener.

**Documente solicitate**

**Obligatorii**

1.  **Certificatul de înregistrare al PFA-ului**;

2.  **Certificatul constatator ONRC actualizat**.

**Opțional, pentru arhiva completă**

3.  Rezoluția/încheierea ONRC;

4.  Alte documente primite la înființare.

Rezoluția nu trebuie să blocheze fluxul dacă certificatul de
înregistrare și certificatul constatator conțin informațiile necesare.

Pentru autorizația de transport alternativ, ARR solicită certificatul de
înregistrare și certificatul constatator eliberate de Registrul
Comerțului.

**Ce extrage OCR-ul**

Din certificatul de înregistrare:

-   denumirea completă;

-   CUI;

-   numărul Registrului Comerțului;

-   titularul;

-   sediul profesional.

Din certificatul constatator:

-   activitățile autorizate;

-   codurile CAEN;

-   sediul profesional;

-   activitatea la sediu/la terți;

-   eventualele puncte de lucru.

**Verificări în admin**

Administratorul verifică:

-   dacă PFA-ul este activ;

-   dacă titularul corespunde utilizatorului;

-   dacă există activitatea necesară pentru transport alternativ;

-   dacă certificatul constatator este suficient de actual;

-   dacă sediul profesional este corect;

-   dacă documentele sunt lizibile.

**Condiția de finalizare**

Certificat de înregistrare verificat

AND

Certificat constatator verificat

AND

Titular PFA = titular cont RIDElance

AND

Activitatea necesară este autorizată

**Statusuri**

-   PFA în verificare;

-   PFA valid;

-   Document ilizibil;

-   Certificat constatator lipsă;

-   Activitate neautorizată;

-   Date neconcordante;

-   Necesită actualizare la ONRC.

**PASUL 2 --- TVA, semnături, bancă și OBLIO**

Acest pas reunește toate elementele fiscale și operaționale necesare
înainte ca RIDElance să înceapă procedura ARR.

Subsecțiunile sunt:

1.  TVA intracomunitar;

2.  documente și împuterniciri;

3.  cont bancar;

4.  cont OBLIO.

**2.1. TVA intracomunitar**

**Întrebarea principală**

**PFA-ul tău are deja cod de TVA intracomunitar?**

Opțiuni:

-   Da;

-   Nu;

-   Nu știu.

**Dacă răspunde „Da"**

Se solicită:

**Încarcă documentul care confirmă înregistrarea în scopuri de TVA**

Utilizatorul încarcă certificatul sau decizia ANAF.

OCR-ul extrage:

-   CUI-ul;

-   codul cu prefix RO;

-   data înregistrării;

-   tipul înregistrării.

RIDElance verifică dacă documentul aparține PFA-ului și dacă
înregistrarea este corespunzătoare.

**Dacă răspunde „Nu"**

Utilizatorul intră automat în fluxul pentru obținerea codului de TVA
intracomunitar.

Nu i se solicită să completeze manual un formular fiscal.

RIDElance și contabilul:

1.  generează documentele;

2.  trimit documentele către utilizator prin EasyStream;

3.  utilizatorul semnează prin fluxul de semnătură „one-shot" convenit
    cu furnizorul;

4.  RIDElance sau contabilul depune cererea la ANAF;

5.  după emitere, documentul este încărcat automat sau de către
    administrator.

Formularul 700 include secțiunea pentru înregistrarea conform art. 317
în cazul achizițiilor sau serviciilor intracomunitare, iar codul obținut
în baza art. 317 este utilizat pentru operațiunile respective, fără să
transforme automat contribuabilul într-o persoană înregistrată normal în
scopuri de TVA.

**Dacă răspunde „Nu știu"**

Statusul devine:

**Verificare fiscală necesară**

Administratorul sau contabilul verifică situația și îl încadrează în una
dintre cele două ramuri.

**Observație pentru IT**

Nu trebuie hard-codată exclusiv denumirea „TVA intracomunitar".

Sistemul trebuie să poată diferenția între:

-   cod special conform art. 317;

-   înregistrare normală în scopuri de TVA;

-   lipsa oricărei înregistrări.

**2.2. Semnarea documentelor și împuternicirile**

Această secțiune se aplică tuturor utilizatorilor:

-   celor care au venit cu PFA existent;

-   celor care și-au deschis PFA prin RIDElance;

-   celor care au deja TVA intracomunitar;

-   celor pentru care trebuie obținut TVA intracomunitar.

Nu se întreabă:

-   dacă utilizatorul are semnătură calificată proprie;

-   dacă are deja SPV;

-   dacă știe parola SPV;

-   dacă are contabil;

-   dacă a mai împuternicit pe cineva.

RIDElance pornește de la regula că trebuie să obțină propriile drepturi
și documente pentru prestarea serviciilor.

**Pachetul de semnat**

Pachetul va putea include, în funcție de procedura stabilită cu
contabilul și furnizorul de semnătură:

-   contractul de servicii;

-   acordurile fiscale;

-   procura/împuternicirea;

-   documentele necesare accesului și reprezentării în relația cu
    ANAF/SPV;

-   acordul privind transmiterea documentelor către contabil;

-   acordul privind prelucrarea și stocarea documentelor;

-   documentele pentru obținerea TVA intracomunitar, dacă este necesar;

-   alte declarații utilizate în proces.

Utilizatorul primește un singur flux de semnare, nu mai multe emailuri
separate.

EasyStream este prezentat de Trans Sped ca soluție pentru automatizarea
fluxurilor de semnare și aprobare; mecanismul exact prin care este emisă
și utilizată semnătura „one-shot" trebuie configurat conform ofertei
tehnice și juridice agreate cu furnizorul.

**Condiția de finalizare**

Toate documentele obligatorii au fost semnate

AND

Semnăturile au fost validate

AND

Documentele au fost arhivate

**2.3. Contul bancar**

**Întrebarea principală**

**Ai deja un cont bancar deschis pentru PFA?**

Opțiuni:

-   Da;

-   Nu.

**Dacă răspunde „Da"**

Se solicită:

**Banca**

Un selector cu căutare și listă de bănci.

**BCR trebuie să apară întotdeauna prima**, după care celelalte bănci în
ordine alfabetică.

**IBAN**

Câmp:

**IBAN-ul contului PFA**

**Document de confirmare**

**Încarcă un extras de cont sau un document de confirmare IBAN**

Documentul trebuie să permită verificarea:

-   IBAN-ului;

-   titularului contului;

-   legăturii cu PFA-ul.

OCR-ul extrage IBAN-ul și îl compară cu cel introdus. Dacă cele două
valori nu coincid, documentul intră în verificare manuală.

**Dacă răspunde „Nu"**

Se afișează în primul rând oferta BCR.

Card recomandat:

**Deschide contul PFA la BCR prin RIDElance**\
Beneficiezi de oferta dedicată parteneriatului RIDElance--BCR și îți
poți folosi contul pentru încasările de la platforme, plata taxelor și
administrarea activității PFA.

CTA principal:

**Deschide cont la BCR**

Sub CTA:

**Prefer altă bancă**

Dacă utilizatorul selectează altă bancă, se afișează un pop-up:

Poți deschide contul la banca aleasă. După ce contul este activ, revino
în această secțiune și încarcă IBAN-ul și documentul de confirmare.

Status:

**În așteptarea contului bancar**

**Pentru utilizatorii care și-au deschis PFA prin RIDElance**

După ce documentele PFA au fost încărcate de Consulto, această secțiune
se afișează automat.

Nu se presupune că au cont bancar. Li se oferă direct:

-   BCR ca opțiune recomandată;

-   lista celorlalte bănci;

-   posibilitatea de a reveni după deschidere.

**Condiția de finalizare**

Bancă selectată

AND

IBAN valid

AND

Document de confirmare verificat

AND

Titularul contului corespunde PFA-ului

**2.4. Contul OBLIO**

În acest pas utilizatorul este informat că RIDElance lucrează cu OBLIO
pentru administrarea facturării și transmiterea documentelor fiscale.

**Card informativ**

**Facturare prin OBLIO**\
Pentru administrarea corectă a facturilor și transmiterea documentelor
în sistemele fiscale, contul tău RIDElance va fi conectat la OBLIO. Prin
parteneriatul RIDElance, beneficiezi de un an gratuit, iar ulterior
costul este de 29 euro/an. Costul poate fi înregistrat contabil ca
serviciu utilizat pentru activitatea PFA, conform încadrării efectuate
de contabil.

Parametrii comerciali:

-   perioada gratuită;

-   prețul ulterior;

-   moneda;

-   textul ofertei;

trebuie să poată fi modificați din admin și să nu fie hard-codați în
aplicație.

**Consimțăminte**

Utilizatorul trebuie să accepte:

-   crearea contului OBLIO;

-   transmiterea către OBLIO a datelor PFA;

-   conectarea contului cu RIDElance;

-   accesul tehnic necesar pentru administrarea integrării;

-   transmiterea documentelor către contabil;

-   termenii și condițiile serviciului.

Nu este necesar un formular separat cu datele PFA. Acestea sunt preluate
din Pasul 1.

**Ce face platforma**

-   creează sau solicită crearea contului OBLIO;

-   transmite denumirea PFA;

-   transmite CUI-ul;

-   transmite sediul;

-   transmite emailul;

-   asociază utilizatorul RIDElance cu ID-ul OBLIO;

-   salvează statusul integrării.

**Statusuri**

-   Consimțământ necesar;

-   Cont în curs de creare;

-   Cont creat;

-   Integrare activă;

-   Necesită intervenție manuală.

**Finalizarea Pasului 2**

Pasul este complet când:

TVA intracomunitar existent sau obținut

AND

Documentele și împuternicirile sunt semnate

AND

Contul bancar este confirmat

AND

Consimțămintele OBLIO sunt acceptate

AND

Contul OBLIO este creat sau în curs controlat de activare

Conform logicii tale, Pasul 3 rămâne blocat până la finalizarea acestor
operațiuni.

Tehnic, RIDElance poate începe în fundal pregătirea draftului ARR
înainte de emiterea codului TVA, dar utilizatorului nu îi este deblocat
Pasul 3 până când Pasul 2 este complet.

**PASUL 3 --- Autorizația pentru transport alternativ**

**Scopul pasului**

În acest moment utilizatorul:

-   a trecut verificarea preliminară;

-   are PFA;

-   are documentele PFA verificate;

-   are codul TVA intracomunitar sau situația fiscală rezolvată;

-   a semnat împuternicirile;

-   are cont bancar;

-   are relația contabilă și OBLIO configurate.

RIDElance poate începe efectiv pregătirea dosarului ARR.

**Principiu**

Se solicită **strict documentele necesare pentru autorizația de
transport alternativ**.

Nu se solicită în această etapă:

-   fotografie de profil;

-   fotografii ale mașinii;

-   RCA;

-   CIV;

-   talon;

-   cazier auto, dacă nu este cerut în procedura concretă pentru dosarul
    respectiv;

-   documente Bolt/Uber;

-   conturi de platformă;

-   documentele pentru copia conformă.

**Documente deja existente și reutilizate**

Din pașii anteriori:

-   certificatul de înregistrare PFA;

-   certificatul constatator;

-   atestatul profesional;

-   CI;

-   datele titularului;

-   sediul profesional;

-   contul bancar.

**Ce mai trebuie încărcat**

**1. Cazier judiciar**

**Încarcă certificatul de cazier judiciar**

OCR-ul extrage:

-   numele;

-   CNP-ul;

-   data emiterii;

-   eventualele mențiuni.

**2. Aviz medical**

**Încarcă avizul medical cu mențiunea „APT"**

OCR-ul extrage:

-   titularul;

-   unitatea emitentă;

-   data;

-   rezultatul;

-   valabilitatea, dacă este menționată.

**3. Aviz psihologic**

**Încarcă avizul psihologic cu mențiunea „APT"**

OCR-ul extrage aceleași informații relevante.

**4. Dovada plății tarifului ARR**

RIDElance afișează:

-   agenția teritorială competentă;

-   beneficiarul;

-   IBAN-ul ARR;

-   suma;

-   explicația plății;

-   CUI-ul PFA;

-   instrucțiunile de plată.

Plata poate fi făcută din contul bancar confirmat la Pasul 2.

Utilizatorul încarcă:

**Dovada plății tarifului ARR**

Tariful legal pentru eliberarea autorizației este de 300 lei, iar
autorizația se eliberează pentru trei ani. Dosarul se depune la agenția
teritorială ARR din județul sau municipiul București unde operatorul își
are sediul sau domiciliul, după caz.

**Documentele oficiale ale dosarului**

Pentru PFA, dosarul trebuie să conțină, în esență:

-   cererea;

-   certificatul de înregistrare;

-   certificatul constatator;

-   atestatul profesional pentru transport persoane în regim de
    închiriere;

-   cazierul judiciar;

-   avizul medical „apt";

-   avizul psihologic „apt";

-   dovada plății tarifului de 300 lei.

**Ce generează RIDElance**

RIDElance generează un pachet descărcabil care poate conține:

1.  copertă de dosar;

2.  checklist;

3.  cererea ARR completată;

4.  documentele în ordinea corectă;

5.  marcaje clare pentru paginile care trebuie semnate;

6.  instrucțiuni privind depunerea;

7.  datele agenției teritoriale ARR;

8.  dovada plății;

9.  copii ale documentelor anexate.

**Formatul descărcării**

Recomandat:

-   un PDF complet pentru tipărire;

-   separat, un fișier ZIP cu documentele individuale;

-   denumire standard:

Dosar_Autorizatie_Transport_Alternativ\_\[CUI\]\_\[Data\].pdf

**Mesaj către utilizator**

**Dosarul tău este pregătit**\
Descarcă dosarul, verifică datele, semnează documentele marcate și
depune-l fizic la agenția ARR indicată. Poți face acest lucru când
dorești, iar progresul tău rămâne salvat.

CTA:

**Descarcă dosarul ARR**

**După depunere**

Pasul rămâne în status:

**Dosar pregătit --- în așteptarea depunerii**

Utilizatorul poate selecta:

**Am depus dosarul**

După emiterea autorizației, trebuie să încarce:

**Încarcă autorizația pentru transport alternativ**

OCR-ul extrage:

-   numărul autorizației;

-   operatorul;

-   CUI-ul;

-   agenția emitentă;

-   data emiterii;

-   data expirării.

Pasul se finalizează numai după verificarea documentului de către
RIDElance.

**Statusuri**

-   Documente necesare;

-   Documente în verificare;

-   Plata ARR lipsește;

-   Dosar pregătit;

-   Dosar descărcat;

-   Dosar depus;

-   În așteptarea autorizației;

-   Autorizație încărcată;

-   Autorizație verificată;

-   Document respins/neconform.

**PASUL 4 --- Conturile Uber și Bolt**

**Scopul pasului**

După obținerea autorizației, RIDElance începe configurarea conturilor de
operator/fleet și a relației cu platformele.

**Prima întrebare**

**Pe ce platforme vrei să lucrezi?**

Opțiuni:

-   Uber;

-   Bolt;

-   Uber și Bolt.

Selecția va fi reutilizată ulterior pentru:

-   crearea conturilor;

-   obținerea contractelor de afiliere;

-   calcularea și generarea documentelor pentru ecusoane;

-   integrarea datelor în RIDElance.

**Pentru fiecare platformă selectată**

Se verifică:

**Ai deja un cont pe această platformă?**

Opțiuni:

-   Da;

-   Nu;

-   Am cont de șofer, dar nu am cont de operator/fleet;

-   Nu știu ce tip de cont am.

În funcție de răspuns, RIDElance:

-   conectează contul existent;

-   solicită migrarea/asocierea;

-   creează un cont nou;

-   creează contul de operator/fleet;

-   asociază șoferul cu operatorul;

-   solicită documentele sau aprobările platformei.

**Documente reutilizate automat**

Platforma nu trebuie să îi ceară utilizatorului să încarce din nou:

-   certificatul PFA;

-   certificatul constatator;

-   TVA intracomunitar;

-   extrasul bancar;

-   autorizația de transport;

-   CI;

-   permisul;

-   atestatul;

-   cazierul;

-   celelalte documente deja existente.

RIDElance transmite sau precompletează datele acolo unde integrarea și
procedura platformei permit acest lucru.

**Emailul și accesul la conturi**

Această parte trebuie tratată ca o decizie tehnică separată.

**Varianta recomandată**

Contul trebuie să rămână în proprietatea clientului, iar RIDElance să
primească acces prin:

-   rol de administrator;

-   invitație în contul fleet;

-   integrare API;

-   token de acces;

-   alt mecanism delegat oferit de platformă.

**Ce nu recomand**

Nu recomand un câmp standard:

„Introdu parola Uber/Bolt"

și nici stocarea parolelor în baza de date RIDElance.

Acest model creează riscuri privind:

-   securitatea;

-   schimbarea parolei;

-   autentificarea în doi pași;

-   accesul angajaților;

-   încetarea colaborării;

-   răspunderea în cazul unui incident.

**Varianta cu email creat de RIDElance**

Poate exista doar ca variantă alternativă:

-   RIDElance creează un email operațional dedicat clientului;

-   emailul este utilizat pentru conturile fleet;

-   clientul este informat cine deține adresa;

-   este stabilit cine are drept de recuperare;

-   există procedură de predare a contului la încetarea colaborării;

-   parolele sunt gestionate într-un sistem securizat, nu vizibile în
    admin.

Exemplu:

client.\[CUI\]@accounts.ridelance.ro

Totuși, această variantă trebuie implementată numai după ce se
stabilește clar relația de proprietate asupra conturilor.

**Recomandarea pentru IT**

În prima versiune, formularul nu trebuie să conțină câmp de parolă.

Trebuie să conțină:

-   platforma;

-   existența unui cont;

-   emailul asociat contului, dacă există;

-   telefonul asociat;

-   acordul pentru configurare;

-   statusul conectării.

Câmpurile pentru parolă pot fi adăugate numai dacă, după testarea
concretă cu Bolt și Uber, nu există nicio metodă de acces delegat și
există o procedură de securitate aprobată.

**Contractul de afiliere**

Pentru fiecare platformă selectată, RIDElance trebuie să urmărească
obținerea documentului care dovedește contractul de afiliere.

Legislația prevede că relația de afiliere se încheie prin platforma
digitală, prin acceptarea termenilor și condițiilor, iar dovada și
conținutul acestora pot fi tipărite pentru a fi prezentate ARR în
vederea eliberării ecusoanelor.

Status separat pentru fiecare platformă:

-   cont neînceput;

-   cont în creare;

-   email neverificat;

-   documente trimise;

-   cont operator creat;

-   cont șofer asociat;

-   în verificare;

-   cont aprobat;

-   contract de afiliere disponibil;

-   contract de afiliere verificat.

**Condiția de finalizare**

Pentru platforma selectată:

Cont operator/fleet creat

AND

Contul este asociat PFA-ului

AND

Documentele au fost acceptate

AND

Contractul de afiliere este disponibil

Dacă au fost selectate ambele platforme, Pasul 4 este finalizat când
ambele fluxuri sunt pregătite sau când administratorul aprobă
continuarea cu una dintre ele.

**PASUL 5 --- Vehicul, copie conformă și ecusoane**

**Poziționarea în flux**

Acest pas trebuie să rămână la final.

Este logic deoarece utilizatorul poate:

-   să nu aibă încă mașină;

-   să dorească să închirieze una;

-   să aștepte livrarea unei mașini;

-   să aibă mașina în service;

-   să dorească mai întâi deschiderea conturilor de operator;

-   să decidă ulterior ce autoturism va folosi.

Conturile PFA, fiscale, bancare, ARR și de platformă pot fi pregătite
înainte ca vehiculul să existe efectiv.

**Prima întrebare**

**Ai deja mașina cu care vei lucra?**

Opțiuni:

-   Da;

-   Nu, vreau să închiriez prin RIDElance;

-   Nu, voi adăuga mașina mai târziu.

**Dacă nu are mașină**

**Varianta „Vreau să închiriez"**

Se afișează:

**Alege o mașină disponibilă pentru ridesharing**

CTA:

**Vezi mașinile disponibile**

După alegerea mașinii, documentele vehiculului pot fi încărcate direct
de proprietar/flotă sau preluate automat din marketplace-ul RIDElance.

**Varianta „Voi adăuga mai târziu"**

Status:

**În așteptarea vehiculului**

Utilizatorul poate reveni oricând. Toți pașii anteriori rămân salvați.

**Dacă utilizatorul are mașină**

**Întrebarea privind dreptul de folosință**

**Cum deții mașina?**

Opțiuni:

-   Proprietate;

-   Închiriere;

-   Leasing;

-   Comodat.

Această alegere stabilește ce documente suplimentare trebuie încărcate.

**Documente solicitate**

**Pentru toate mașinile**

1.  **Certificatul de înmatriculare --- talon**;

2.  **Cartea de identitate a vehiculului --- CIV**.

OCR-ul extrage:

-   numărul de înmatriculare;

-   seria VIN;

-   marca;

-   modelul;

-   anul fabricației;

-   proprietarul;

-   numărul de locuri;

-   masa și alte date necesare;

-   datele documentelor.

**În funcție de dreptul de folosință**

**Proprietate**

Nu se solicită contract suplimentar dacă proprietatea rezultă din
documentele mașinii și corespunde situației juridice acceptate.

**Închiriere**

Se solicită:

-   contractul de închiriere.

**Leasing**

Se solicită:

-   contractul de leasing;

-   eventualele documente suplimentare cerute de ARR.

**Comodat**

Se solicită:

-   contractul de comodat în forma acceptată de ARR.

Pentru copia conformă, legislația indică autorizația de transport
alternativ, certificatul de înmatriculare, CIV-ul, declarația privind
îndeplinirea condițiilor autoturismului și, după caz, contractul de
închiriere sau comodat; leasingul este de asemenea reglementat ca
modalitate de deținere.

**Documente reutilizate**

Nu se solicită din nou:

-   autorizația de transport alternativ;

-   documentele PFA;

-   contractele de afiliere Uber/Bolt;

-   datele titularului;

-   dovada contului bancar.

Acestea sunt preluate automat din pașii anteriori.

**Perioada copiei conforme**

Întrebare:

**Pentru ce perioadă dorești copia conformă?**

Opțiuni:

-   1 an;

-   2 ani;

-   3 ani.

Platforma trebuie să calculeze automat perioada maximă posibilă, ținând
cont de:

-   expirarea autorizației de transport;

-   vechimea mașinii;

-   durata contractului de închiriere/leasing/comodat;

-   condițiile legale aplicabile.

Copia conformă poate fi emisă pentru unul, doi sau trei ani, fără să
depășească valabilitatea autorizației, iar tariful este de 100 lei
pentru fiecare an sau fracție de an.

**Copia conformă și ecusoanele --- un singur pas pentru utilizator**

În RIDElance, copia conformă și ecusoanele trebuie combinate.

Utilizatorul trebuie să vadă:

**Vehicul, copie conformă și ecusoane**

și să primească:

**un singur dosar pregătit pentru depunere la ARR.**

**Precizarea tehnică și juridică**

În interiorul dosarului există documente distincte:

1.  cererea pentru copia conformă;

2.  declarația privind vehiculul;

3.  cererea/cererile pentru ecusoane;

4.  contractul sau contractele de afiliere;

5.  dovezile de plată.

ARR emite procedural copia conformă înaintea ecusoanelor, deoarece
ecusoanele se eliberează pentru un vehicul pentru care a fost emisă în
prealabil copia conformă. Această ordine internă nu împiedică RIDElance
să trateze operațiunea ca **un singur pas, un singur checklist și un
singur pachet de depunere pentru client**.

**Calculul taxelor**

**Copia conformă**

100 lei × numărul de ani sau fracții de an

Exemple:

-   1 an: 100 lei;

-   2 ani: 200 lei;

-   3 ani: 300 lei.

**Ecusoanele**

Tariful legal este de:

8 lei / set de 2 bucăți

Cele două bucăți sunt pentru:

-   partea din față a mașinii;

-   partea din spate a mașinii.

Ecusonul conține denumirea platformei digitale, iar tariful oficial este
de 8 lei pentru două bucăți.

**Dacă utilizatorul selectează o singură platformă**

Exemplu:

Bolt:

1 set × 8 lei

sau:

Uber:

1 set × 8 lei

**Dacă utilizatorul selectează ambele platforme**

Deoarece ecusonul conține denumirea platformei, sistemul trebuie să
permită calcularea unui set pentru fiecare platformă:

Bolt: 8 lei / 2 bucăți

Uber: 8 lei / 2 bucăți

Total estimat: 16 lei

Aceasta este interpretarea operațională firească a textului legal.
Înainte de hard-codarea definitivă a sumei pentru două platforme,
procedura trebuie confirmată cu agenția ARR sau printr-un prim
dosar-pilot, deoarece practica exactă privind includerea ambelor
platforme poate trebui reflectată în cererea folosită.

Prin urmare, în sistem taxa ecusoanelor trebuie să fie **configurabilă
din admin**, nu fixată definitiv în cod.

**Dosarul generat**

Dosarul trebuie să includă:

-   copertă;

-   checklist;

-   cererea pentru copia conformă;

-   autorizația de transport alternativ;

-   talonul;

-   CIV-ul;

-   declarația privind îndeplinirea condițiilor vehiculului;

-   contractul de închiriere/leasing/comodat, dacă este cazul;

-   cererea pentru ecusoane;

-   contractul de afiliere Bolt, dacă este selectat Bolt;

-   contractul de afiliere Uber, dacă este selectat Uber;

-   dovada plății copiei conforme;

-   dovada plății ecusoanelor;

-   instrucțiunile de semnare și depunere.

Denumire recomandată:

Dosar_Copie_Conforma_Ecusoane\_\[NumarInmatriculare\]\_\[CUI\].pdf

**Modalitatea de depunere la ARR**

Sistemul trebuie proiectat pentru două variante.

**Varianta A --- Depunere fizică de către client**

Aceasta trebuie să fie varianta disponibilă în prima versiune.

Flux:

1.  RIDElance generează dosarul;

2.  utilizatorul îl descarcă;

3.  semnează documentele indicate;

4.  achită taxele;

5.  depune dosarul la ARR;

6.  revine în RIDElance;

7.  încarcă copia conformă și ecusoanele/documentul de eliberare.

Mesaj:

**Dosarul este pregătit**\
Descarcă, semnează și depune documentele la agenția ARR. După emitere,
revino și încarcă documentele primite.

**Varianta B --- Depunere online prin RIDElance**

Arhitectura poate include de acum opțiunea:

submission_method:

\- physical_by_client

\- online_by_ridelance

Dar opțiunea online_by_ridelance trebuie să rămână dezactivată până când
este confirmat:

-   că procedura de transport alternativ poate fi depusă online la
    agenția respectivă;

-   canalul oficial de depunere;

-   tipul semnăturii acceptate;

-   calitatea în care RIDElance depune;

-   procura necesară;

-   modalitatea de ridicare/primire a documentelor;

-   dacă ecusoanele fizice pot fi expediate sau trebuie ridicate.

Pe site-ul public ARR am identificat procedurile, formularele și plata
online, însă nu am găsit o confirmare publică suficient de clară a unui
flux național online dedicat autorizării pentru transport alternativ,
copiei conforme și ecusoanelor. Portalul licente.arr.ro afișat public
este în primul rând un portal de verificare, iar mențiunea explicită
privind depunerea online apare pentru procedurile de licențiere.

Prin urmare:

**V1: generare dosar + depunere fizică.**\
**V2: depunere online, după validarea oficială a procedurii.**

**Finalizarea Pasului 5**

După emitere, utilizatorul încarcă:

-   copia conformă;

-   ecusonul/ecusoanele sau documentele care confirmă emiterea;

-   orice document suplimentar primit de la ARR.

OCR-ul extrage:

-   seria copiei conforme;

-   numărul de înmatriculare;

-   operatorul;

-   data emiterii;

-   data expirării;

-   platforma înscrisă pe ecusoane.

RIDElance verifică documentele din admin.

**Statusuri**

-   Nu are vehicul;

-   Caută vehicul;

-   Vehicul adăugat;

-   Documente vehicul incomplete;

-   Documente în verificare;

-   Dosar în pregătire;

-   Plata lipsește;

-   Dosar pregătit;

-   Dosar descărcat;

-   Dosar depus;

-   În așteptarea documentelor ARR;

-   Copie conformă emisă;

-   Ecusoane emise;

-   Activare completă.

**Reguli generale pentru interfață**

**1. Fiecare document se încarcă o singură dată**

Exemplu:

-   atestatul încărcat la Pasul 0 este reutilizat la Pasul 3;

-   certificatul PFA încărcat la Pasul 1 este reutilizat la ARR, Bolt și
    Uber;

-   TVA-ul și extrasul bancar de la Pasul 2 sunt reutilizate pentru
    platforme;

-   autorizația de la Pasul 3 este reutilizată pentru copia conformă;

-   contractele de afiliere de la Pasul 4 sunt reutilizate pentru
    ecusoane.

**2. OCR-ul nu trebuie să blocheze fluxul**

Dacă OCR-ul nu citește corect:

-   documentul este salvat;

-   utilizatorului i se poate cere confirmarea unor date;

-   administratorul îl poate corecta manual;

-   fișierul original rămâne atașat.

**3. Câmpurile extrase trebuie să fie editabile doar controlat**

În admin trebuie să existe:

-   valoarea OCR;

-   valoarea confirmată;

-   cine a modificat-o;

-   data modificării;

-   motivul modificării;

-   documentul-sursă.

**4. Nu se cer parole prin formulare obișnuite**

Nu se cer și nu se stochează în clar:

-   parola SPV;

-   parola emailului;

-   parola Bolt;

-   parola Uber;

-   credențialele bancare.

Accesul trebuie obținut prin:

-   procură;

-   rol delegat;

-   API;

-   invitație;

-   token;

-   integrare autorizată.

**5. Fiecare blocare trebuie să explice clar motivul**

Exemplu:

**Autorizația de transport este blocată**\
Pentru a continua, trebuie să finalizăm verificarea documentelor PFA,
codul TVA, semnarea împuternicirilor și confirmarea contului bancar.

Nu se afișează doar:

„Blocat"

**Logica tehnică de deblocare**

eligibility_ready =

age_verified \>= 21

AND driving_licence_category_b_age \>= 2 years

AND driver_certificate_verified

pfa_ready =

(

pfa_created_by_partner

OR

existing_pfa_documents_verified

)

AND registration_certificate_verified

AND constatator_verified

AND holder_matches_user

AND activity_verified

fiscal_ready =

vat_status_resolved

AND required_signatures_completed

AND mandate_completed

AND bank_account_verified

AND oblio_consents_completed

transport_authorization_ready =

pfa_ready

AND fiscal_ready

AND criminal_record_verified

AND medical_approval_verified

AND psychological_approval_verified

AND arr_payment_verified

platforms_ready =

transport_authorization_uploaded

AND transport_authorization_verified

AND selected_platform_accounts_created

AND required_affiliation_contracts_available

vehicle_dossier_ready =

platforms_ready

AND vehicle_added

AND registration_certificate_vehicle_verified

AND vehicle_identity_card_verified

AND right_of_use_verified

AND copy_conforma_payment_verified

AND badge_payment_verified

onboarding_complete =

vehicle_dossier_ready

AND copy_conforma_uploaded

AND copy_conforma_verified

AND required_badges_verified

**Structura documentelor în baza de date**

Fiecare document trebuie să aibă cel puțin:

document_id

user_id

pfa_id

vehicle_id

platform_id

document_type

original_file

ocr_status

ocr_confidence

extracted_data

verified_data

verification_status

verified_by

issued_at

expires_at

rejection_reason

created_at

updated_at

**Status verificare**

uploaded

ocr_processing

ocr_completed

manual_review

verified

rejected

expired

replaced

**Structura minimă a adminului**

Pentru fiecare client trebuie să existe o singură pagină de dosar cu
următoarele secțiuni:

**Identitate și eligibilitate**

-   CI;

-   permis;

-   atestat;

-   rezultatul verificării preliminare.

**PFA**

-   certificat de înregistrare;

-   certificat constatator;

-   CUI;

-   CAEN;

-   sediu;

-   sursa PFA: Consulto/existent.

**Fiscal și bancar**

-   TVA;

-   documente semnate;

-   procură;

-   bancă;

-   IBAN;

-   extras;

-   OBLIO.

**ARR**

-   cazier;

-   medical;

-   psihologic;

-   plata;

-   dosarul generat;

-   autorizația emisă.

**Platforme**

-   Uber;

-   Bolt;

-   status cont;

-   email asociat;

-   ID operator/fleet;

-   contract de afiliere;

-   acces RIDElance.

**Vehicul**

-   talon;

-   CIV;

-   drept de folosință;

-   perioada copiei conforme;

-   plăți;

-   dosar generat;

-   copie conformă;

-   ecusoane.

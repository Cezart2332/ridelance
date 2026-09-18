/**
 * Întrebările frecvente: pagina principală și „Despre”, plus cele din dashboardurile PFA și SRL.
 *
 * Textul e cel aprobat; nu se reformulează aici fără acord — răspunsurile descriu servicii și
 * condiții concrete (abonament, contabilitate, beneficii).
 */
export interface FaqItem {
  q: string
  a: string
}

export const HOME_FAQ: FaqItem[] = [
  {
    q: 'Pot folosi RIDELANCE dacă nu am încă un PFA?',
    a: 'Da. Începem cu verificarea eligibilității, apoi te ghidăm prin înființarea PFA-ului și pregătirea documentelor necesare activității. Dacă ai deja un PFA, parcurgem doar pașii care îți lipsesc.',
  },
  {
    q: 'Ce presupune înscrierea și ce pot face online?',
    a: 'Completezi datele și încarci documentele în platformă. Împreună cu partenerii noștri, gestionăm înființarea PFA-ului, dacă este necesară, obținerea codului TVA intracomunitar, accesul în SPV și procesul pentru autorizația de transport, copia conformă și ecusoane. Tot în onboarding pregătim facturarea și conectarea contului bancar. Datele sunt verificate automat și validate de un agent RIDELANCE.',
  },
  {
    q: 'Când aleg abonamentul și primesc acces în dashboard?',
    a: 'După finalizarea onboardingului și verificarea datelor, alegi și activezi abonamentul potrivit. Primești acces în dashboard-ul RIDELANCE, pe web și în aplicația mobilă, unde ai la un loc informațiile, documentele, conexiunile și beneficiile tale. Conținutul abonamentului și eventualele servicii suplimentare sunt prezentate înainte de plată.',
  },
  {
    q: 'Cine se ocupă de contabilitatea PFA-ului meu?',
    a: 'Contabilii colaboratori RIDELANCE țin evidența contabilă pe tot parcursul colaborării, conform serviciilor din abonamentul ales. Informațiile disponibile prin conexiunile platformei ajung automat la ei. Pentru documentele sau explicațiile care nu pot fi preluate automat, îți comunicăm ce trebuie să completezi.',
  },
  {
    q: 'Mai trebuie să trimit manual facturi și extrase bancare?',
    a: 'Un agent RIDELANCE configurează contul de facturare pentru trimiterea automată în SPV a facturilor aferente curselor. Prin conectarea contului bancar, soldul și tranzacțiile se sincronizează în dashboard și devin disponibile contabilului. Astfel, reducem transmiterea manuală a documentelor; dacă lipsesc informații, echipa îți solicită punctual ce este necesar.',
  },
  {
    q: 'Cum emit bonurile fiscale pentru cursele încasate cash?',
    a: 'Poți achiziționa o casă de marcat compatibilă la preț preferențial și o poți conecta la RIDELANCE. Apoi comanzi emiterea bonurilor fiscale și generarea rapoartelor direct din dashboard, fără să folosești butoanele aparatului. Documentele sunt disponibile și online, pentru tine și contabil. Casa de marcat fizică rămâne necesară.',
  },
  {
    q: 'Ce beneficii pot activa prin RIDELANCE?',
    a: 'Poți alege reduceri la combustibil și spălătorii, un cont bancar fără comisioane și reducere la abonamentul RIDELANCE, tarife preferențiale la încărcarea electrică, precum și acces la reducerile și cashbackul Benefit Edenred. Pentru cursele cash, ai și opțiunea unei case de marcat cu reducere. Activarea, eligibilitatea și condițiile fiecărui beneficiu sunt prezentate în platformă.',
  },
  {
    q: 'Primesc ajutor și după activarea contului?',
    a: 'Da. Agenții RIDELANCE îți oferă suport pe toată durata colaborării, pentru utilizarea platformei și nevoile legate de activitatea PFA-ului. Pentru întrebările contabile, implicăm contabilii colaboratori. În paralel, îmbunătățim constant aplicația web și mobilă, inclusiv pe baza feedbackului primit de la utilizatori.',
  },
]

/** Întrebările din dashboardul PFA (Suport). */
export const PFA_DASHBOARD_FAQ: FaqItem[] = [
  {
    q: 'Ce trebuie să mai fac eu dacă activitatea este automatizată?',
    a: 'Încarcă bonurile și facturile de cheltuieli care nu ajung automat în platformă, actualizează documentele când se schimbă și răspunde solicitărilor contabilului. RIDELANCE centralizează informațiile din conexiunile active, iar echipa te ajută cu pașii care necesită intervenția ta.',
  },
  {
    q: 'Cum trimit contabilului bonurile de combustibil și celelalte cheltuieli?',
    a: 'Încarcă o fotografie clară sau fișierul documentului în secțiunea de cheltuieli. Contabilul are acces la documentele încărcate și le verifică pentru înregistrare. Chiar dacă plata apare în contul bancar conectat, încarcă și documentul justificativ: tranzacția bancară nu înlocuiește bonul sau factura.',
  },
  {
    q: 'Trebuie să trimit separat facturile curselor și tranzacțiile bancare?',
    a: 'Nu trebuie să le retrimiți dacă sunt deja preluate prin conexiunile active. Contul de facturare configurat de echipa RIDELANCE transmite automat facturile curselor în SPV, iar conexiunea bancară aduce soldul și tranzacțiile în dashboard. Dacă observi informații lipsă sau o conexiune întreruptă, contactează echipa pentru verificare.',
  },
  {
    q: 'Cum emit bonurile fiscale pentru cursele cash?',
    a: 'Cu o casă de marcat compatibilă conectată prin FiscalLink, poți comanda emiterea bonurilor și generarea rapoartelor direct din dashboard. Documentele sunt disponibile online și pentru contabil. Verifică finalizarea emiterii înainte să repeți o comandă, pentru a evita dublarea bonului. Casa de marcat fizică rămâne necesară.',
  },
  {
    q: 'Cum activez reducerile și beneficiile din abonament?',
    a: 'Accesează zona de beneficii, alege oferta dorită și urmează pașii de activare afișați. În funcție de partener, poate fi necesar un cont, un card sau conectarea serviciului la RIDELANCE. Verifică eligibilitatea și condițiile ofertei; dacă un beneficiu nu se activează sau reducerea nu apare, echipa RIDELANCE te ajută.',
  },
]

/** Întrebările din dashboardul SRL (Suport). */
export const SRL_DASHBOARD_FAQ: FaqItem[] = [
  {
    q: 'Care este diferența dintre adăugarea unei mașini și publicarea unui anunț?',
    a: 'Adăugarea mașinii îți permite să o administrezi în dashboard, împreună cu informațiile și documentele sale. Publicarea anunțului o face vizibilă în marketplace pentru potențialii clienți. Completează fotografiile, prețul, condițiile de închiriere și locația de preluare înainte de publicare.',
  },
  {
    q: 'Cum primesc cereri de închiriere și ce fac după ce primesc una?',
    a: 'Cererile trimise prin platformă apar în dashboard. Verifică solicitarea, contactează persoana interesată și stabiliți disponibilitatea, condițiile și predarea mașinii. O cerere exprimă interesul clientului; nu înseamnă, în sine, că închirierea este confirmată sau plătită.',
  },
  {
    q: 'Ce actualizez când o mașină se închiriază sau redevine disponibilă?',
    a: 'Actualizează disponibilitatea mașinii și informațiile din anunț, astfel încât acestea să reflecte situația reală. Verifică și prețul, condițiile și locația de preluare dacă s-au schimbat. Datele actualizate îi ajută pe clienți să aleagă corect și reduc solicitările pentru mașini indisponibile.',
  },
  {
    q: 'Pot pregăti contractul și procesul-verbal de predare-primire din platformă?',
    a: 'Da. Poți genera contractul de închiriere și procesul-verbal de predare-primire, cu export PDF și trimitere pe email. Verifică datele părților, mașina, perioada, chiria, garanția și starea vehiculului înainte de finalizare. Generarea documentelor nu înlocuiește semnarea lor de către părți.',
  },
  {
    q: 'Cum urmăresc documentele care urmează să expire?',
    a: 'Încarcă documentele mașinilor și completează corect datele de valabilitate. RIDELANCE îți permite să urmărești expirările și îți trimite notificări pe baza informațiilor introduse. După reînnoire, actualizează documentul și data expirării, pentru ca evidența flotei să rămână corectă.',
  },
]

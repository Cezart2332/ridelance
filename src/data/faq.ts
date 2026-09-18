/**
 * Întrebările frecvente, comune paginii principale și paginii „Despre”.
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

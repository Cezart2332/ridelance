/**
 * Paginile de partener, după materialele primite de la fiecare (Consulto, MOL, Oblio, FiscalLink,
 * Smart Fintech, Constalaris).
 *
 * Materialele veneau ca pagini HTML de sine stătătoare, fiecare cu stilul ei. Aici rămâne doar
 * conținutul — textele, prețurile, pașii — iar `PartnerShowcase` îl desenează cu tokenii noștri,
 * la fel pe pagina publică de Parteneri și în Beneficii. Aceeași ofertă nu se scrie de două ori.
 *
 * Toate secțiunile sunt opționale: un partener are exact ce avea în materialul lui, nu un șablon
 * completat cu umplutură.
 */

/** Iconițele disponibile, mapate pe componente MUI în `PartnerShowcase`. */
export type ShowcaseIcon =
  | 'account'
  | 'bank'
  | 'bolt'
  | 'build'
  | 'business'
  | 'card'
  | 'carWash'
  | 'document'
  | 'fuel'
  | 'gavel'
  | 'insights'
  | 'link'
  | 'location'
  | 'percent'
  | 'receipt'
  | 'register'
  | 'savings'
  | 'security'
  | 'speed'
  | 'support'
  | 'sync'
  | 'verified'
  | 'wifi'

export interface ShowcaseCard {
  icon: ShowcaseIcon
  title: string
  text: string
  /** Prețul sau eticheta din colțul cardului — „0 lei”, „Inclus”, „Beneficiu RIDElance”. */
  value?: string
}

export interface ShowcaseStat {
  value: string
  label: string
}

export interface ShowcaseProduct {
  variant: string
  name: string
  subtitle: string
  price: string
  priceNote: string
  checks: string[]
  firstYear: { label: string; value: string }
  href: string
}

export interface PartnerShowcase {
  slug: string
  /** Rândul mic de deasupra titlului: domeniul parteneriatului. */
  eyebrow: string
  headline: string
  lead: string
  /** Cartea din dreapta hero-ului: oferta principală, cu cifrele ei. */
  highlight?: {
    badge: string
    title: string
    text?: string
    stats?: ShowcaseStat[]
    chips?: string[]
  }
  offers?: { title: string; lead?: string; cards: ShowcaseCard[] }
  /** Cifre de context, fără card — acoperire, număr de bănci, autorizare. */
  facts?: ShowcaseStat[]
  steps?: { title: string; lead?: string; tags?: string[]; items: { title: string; text: string }[] }
  flow?: { title: string; lead?: string; items: { icon: ShowcaseIcon; title: string; text: string }[] }
  products?: { title: string; lead?: string; items: ShowcaseProduct[]; note?: string }
  locations?: { title: string; lead: string; price: string; items: { city: string; county: string }[] }
  reasons?: { title: string; lead?: string; items: { icon: ShowcaseIcon; title: string; text: string }[] }
  /** Precizări de preț și condiții, cu text mic, la final. */
  notes?: { title: string; text: string }[]
  cta: { title: string; text: string; label: string; href: string }
}

export const partnerShowcases: PartnerShowcase[] = [
  {
    slug: 'mol',
    eyebrow: 'Carburant și spălătorii',
    headline: 'Mai avantajos la fiecare drum.',
    lead: 'Clienții RIDElance cu abonament activ au avantaje dedicate în rețeaua MOL România, la alimentare și la îngrijirea mașinii. Benzină, diesel, GPL și spălătorii — într-un singur beneficiu, gândit pentru cei care sunt zilnic pe drum.',
    highlight: {
      badge: 'Card partener',
      title: 'MOL × RIDElance',
      text: 'Primești cardul MOL al colaborării și îl folosești pentru avantajele negociate prin parteneriat.',
      chips: ['Benzină', 'Diesel', 'GPL', 'Spălătorii'],
    },
    offers: {
      title: 'Beneficii pentru ce folosești cel mai des',
      lead: 'Fără procente de calculat: beneficiile sunt legate de cardul MOL primit prin RIDElance.',
      cards: [
        { icon: 'fuel', title: 'Benzină', text: 'Condiții dedicate pentru alimentările cu benzină eligibile în rețeaua MOL România.', value: 'Beneficiu RIDElance' },
        { icon: 'fuel', title: 'Diesel', text: 'Avantaje dedicate pentru cei care alimentează motorină în activitatea de zi cu zi.', value: 'Beneficiu RIDElance' },
        { icon: 'fuel', title: 'GPL', text: 'Beneficiile parteneriatului se aplică și alimentărilor GPL eligibile.', value: 'Beneficiu RIDElance' },
        { icon: 'carWash', title: 'Spălătorii MOL', text: 'Condiții dedicate și la spălătoriile MOL, acolo unde sunt disponibile.', value: 'Beneficiu RIDElance' },
      ],
    },
    steps: {
      title: 'Cum ajungi la beneficiu',
      lead: 'Orice client cu abonament RIDElance eligibil — PFA sau SRL — are acces la condițiile negociate, fără să caute oferte separat.',
      tags: ['Abonament activ', 'PFA', 'SRL', 'Flote'],
      items: [
        { title: 'Ai un abonament RIDElance activ', text: 'Beneficiul e disponibil clienților eligibili, pe orice abonament PFA sau SRL.' },
        { title: 'Primești cardul MOL', text: 'Cardul colaborării e asociat beneficiilor negociate pentru comunitatea RIDElance.' },
        { title: 'Îl folosești în rețeaua MOL', text: 'Alimentezi sau folosești serviciile eligibile, iar avantajele se aplică conform condițiilor active.' },
      ],
    },
    reasons: {
      title: 'De ce contează pentru un șofer sau o flotă',
      lead: 'Nu e un beneficiu ocazional: e legat de cheltuieli pe care ridesharingul le are în fiecare zi.',
      items: [
        { icon: 'savings', title: 'Costuri recurente mai mici', text: 'Carburantul și spălarea mașinii sunt exact categoriile pe care se aplică beneficiul.' },
        { icon: 'card', title: 'Un card pentru mai multe nevoi', text: 'Benzină, diesel, GPL și spălătorii, sub același parteneriat.' },
        { icon: 'business', title: 'Pentru PFA și SRL', text: 'Pentru șoferii pe PFA, dar și pentru firmele și flotele cu abonament RIDElance activ.' },
      ],
    },
    cta: {
      title: 'Conduci mult? Fă fiecare oprire să conteze.',
      text: 'Activează beneficiul MOL prin RIDElance și folosește cardul dedicat la carburant și spălătorii.',
      label: 'Vezi MOL România',
      href: 'https://molromania.ro/',
    },
  },
  {
    slug: 'oblio',
    eyebrow: 'Facturare și SPV',
    headline: 'Facturare automată, direct din RIDElance.',
    lead: 'Prin integrarea cu Oblio, facturarea și transmiterea în SPV se fac singure. Pentru abonamentele RIDElance plătite, contul Oblio e creat și configurat de noi, iar legătura dintre platformele de ridesharing, Oblio și RIDElance elimină munca manuală.',
    highlight: {
      badge: 'Cont nou · cod „ridelance”',
      title: 'Primul an gratuit pentru conturile noi.',
      text: 'Faci un cont nou pentru firma ta cu codul promoțional ridelance, iar primul an de Oblio nu te costă nimic.',
      stats: [
        { value: '0 €', label: 'în primul an, cu codul „ridelance”' },
        { value: '29 € / an', label: 'după primul an' },
      ],
    },
    offers: {
      title: 'Un parteneriat construit pentru automatizare',
      lead: 'În RIDElance, Oblio e piesa care emite facturile și le trimite în SPV, fără lucru manual.',
      cards: [
        { icon: 'savings', title: 'Primul an gratuit', text: 'Pentru orice cont nou al firmei tale, cu codul promoțional „ridelance”.', value: '0 € în primul an' },
        { icon: 'build', title: 'Configurare făcută de noi', text: 'Pentru abonamentele RIDElance plătite, deschidem contul și îl setăm noi.', value: 'Inclus în abonament' },
        { icon: 'link', title: 'Legat de ridesharing', text: 'Oblio se conectează la platformele de ridesharing, apoi la RIDElance, într-un singur flux.', value: 'Flux automat' },
        { icon: 'receipt', title: 'Transmitere automată în SPV', text: 'Facturile curselor ajung în SPV conform legii, fără să le trimiți tu una câte una.', value: 'Conform legii' },
      ],
    },
    steps: {
      title: 'Cum funcționează',
      tags: ['Facturare', 'SPV', 'Integrare ridesharing', 'Automatizare'],
      items: [
        { title: 'Se creează contul Oblio', text: 'Cu codul „ridelance” pentru conturile noi; pentru abonații plătiți, configurarea o face echipa noastră.' },
        { title: 'Se configurează integrarea', text: 'Oblio se leagă de platformele de ridesharing și apoi de RIDElance.' },
        { title: 'Facturile se generează singure', text: 'Documentele curselor se emit automat, fără date introduse de mână pentru fiecare cursă.' },
        { title: 'Facturile ajung în SPV', text: 'Transmiterea în SPV se face automat, fără să lucrezi pe fiecare document.' },
      ],
    },
    flow: {
      title: 'De la cursă la factură și în SPV, într-un singur flux',
      items: [
        { icon: 'sync', title: 'Platformele de ridesharing', text: 'De aici pleacă datele curselor.' },
        { icon: 'receipt', title: 'Oblio', text: 'Facturile se generează și se păstrează aici.' },
        { icon: 'insights', title: 'RIDElance', text: 'Totul e legat și urmărit din dashboard.' },
        { icon: 'verified', title: 'SPV', text: 'Fiecare factură ajunge unde cere legea.' },
      ],
    },
    reasons: {
      title: 'De ce contează integrarea',
      items: [
        { icon: 'speed', title: 'Mai puțin lucru manual', text: 'Nu mai emiți și nu mai trimiți fiecare factură de mână.' },
        { icon: 'link', title: 'Facturare integrată', text: 'Activitatea de ridesharing și partea fiscală sunt în același flux.' },
        { icon: 'security', title: 'Conformitate mai simplă', text: 'Transmiterea automată în SPV te ține în regulă cu mai puțină bătaie de cap.' },
      ],
    },
    cta: {
      title: 'Activezi RIDElance. Oblio preia facturarea.',
      text: 'Primul an e gratuit pentru conturile noi cu codul „ridelance”. Pentru abonații plătiți, contul e deschis și configurat de noi.',
      label: 'Vezi Oblio',
      href: 'https://www.oblio.eu/',
    },
  },
  {
    slug: 'consulto',
    eyebrow: 'Servicii juridice și ONRC',
    headline: 'Mai simplu să îți deschizi și să îți administrezi firma.',
    lead: 'Prin RIDElance × Consulto ai acces direct din platformă la deschiderea PFA, înființarea SRL, găzduirea sediului social și costuri mult mai mici pentru modificările viitoare la ONRC.',
    highlight: {
      badge: 'Pachet pentru clienții RIDElance',
      title: 'PFA gratuit cu abonament RIDElance.',
      text: 'Îți deschizi PFA-ul și alegi orice abonament RIDElance de PFA: deschiderea costă 0 lei.',
      stats: [
        { value: '249 lei', label: 'înființare PFA, ca serviciu separat' },
        { value: '349 lei / an', label: 'găzduire sediu social' },
      ],
    },
    offers: {
      title: 'Oferte clare, făcute pentru clienții RIDElance',
      cards: [
        { icon: 'register', title: 'Deschidere PFA gratuită', text: 'Cu orice abonament RIDElance de PFA, deschiderea PFA e gratuită prin Consulto.', value: '0 lei' },
        { icon: 'document', title: 'Înființare PFA standard', text: 'Doar serviciul de înființare, fără abonament, la un preț fix.', value: '249 lei' },
        { icon: 'location', title: 'Găzduire sediu social', text: 'Sediul social e găzduit prin Consulto, în locațiile disponibile din rețea.', value: '349 lei / an' },
        { icon: 'business', title: 'Înființare SRL cu reducere', text: 'La deschiderea unui SRL primești reducere la onorariul afișat de Consulto.', value: '−20% la onorariu' },
      ],
    },
    steps: {
      title: 'Ce face Consulto în acest parteneriat',
      lead: 'Consulto se ocupă de partea juridică și administrativă, iar RIDElance aduce serviciile într-un flux simplu, fără să cauți separat cine te ajută.',
      tags: ['PFA', 'SRL', 'Sediu social', 'Modificări ONRC'],
      items: [
        { title: 'Alegi serviciul în RIDElance', text: 'Deschidere PFA, înființare SRL sau găzduire sediu social, direct din platformă.' },
        { title: 'Primești beneficiul', text: 'Se aplică gratuitatea, prețul dedicat sau reducerea pachetului ales.' },
        { title: 'Consulto procesează dosarul', text: 'Partea juridică și administrativă e preluată de Consulto.' },
        { title: 'Rămâi acoperit și după', text: 'Cu sediul găzduit prin parteneriat, modificările viitoare la ONRC costă mult mai puțin.' },
      ],
    },
    locations: {
      title: 'Unde poți avea sediul social',
      lead: 'Alegi zona care ți se potrivește; adresa exactă și contractul de găzduire se stabilesc după validarea dosarului.',
      price: '349 lei / an',
      items: [
        { city: 'Sectorul 1', county: 'București' },
        { city: 'Sectorul 2', county: 'București' },
        { city: 'Sectorul 3', county: 'București' },
        { city: 'Sectorul 4', county: 'București' },
        { city: 'Sectorul 5', county: 'București' },
        { city: 'Sectorul 6', county: 'București' },
        { city: 'Ilfov', county: 'Ilfov' },
        { city: 'Cluj-Napoca', county: 'Cluj' },
        { city: 'Timișoara', county: 'Timiș' },
        { city: 'Iași', county: 'Iași' },
        { city: 'Brașov', county: 'Brașov' },
        { city: 'Constanța', county: 'Constanța' },
        { city: 'Suceava', county: 'Suceava' },
        { city: 'Botoșani', county: 'Botoșani' },
      ],
    },
    flow: {
      title: 'Un avantaj și după ce firma e deschisă',
      lead: 'Cu sediul social găzduit prin RIDElance × Consulto, modificările ulterioare la ONRC te costă mult mai puțin.',
      items: [
        { icon: 'location', title: 'Ai sediul social găzduit', text: 'Găzduirea e activă prin parteneriat.' },
        { icon: 'document', title: 'Ai nevoie de o modificare', text: 'Cod CAEN, activități noi, schimbare de sediu și altele similare.' },
        { icon: 'percent', title: 'Primești 85% reducere', text: 'La dosarul ONRC pentru modificările eligibile.' },
      ],
    },
    cta: {
      title: 'Deschizi, găzduiești și modifici mai simplu.',
      text: 'Consulto se ocupă de partea juridică și administrativă, iar RIDElance îți aduce serviciile cu beneficii negociate pentru PFA și SRL.',
      label: 'Vezi Consulto',
      href: 'https://consulto.ro/',
    },
  },
  {
    slug: 'smart-fintech',
    eyebrow: 'Open banking · Smart Accounts',
    headline: 'Contul bancar, direct în RIDElance.',
    lead: 'Prin Smart Accounts de la Smart Fintech îți conectezi contul bancar la RIDElance, iar soldurile și tranzacțiile apar singure în dashboard — fără extrase încărcate de mână și fără verificări repetate în aplicația băncii.',
    highlight: {
      badge: 'Cont bancar · dashboard RIDElance',
      title: 'Sincronizat automat',
      text: 'Soldul, încasările și cheltuielile din contul tău de firmă, în același loc cu restul activității.',
      chips: ['Sold', 'Încasări', 'Cheltuieli', 'Istoric tranzacții'],
    },
    facts: [
      { value: '95%+', label: 'acoperire declarată a pieței bancare din România' },
      { value: '13', label: 'bănci principale incluse' },
      { value: 'BNR', label: 'furnizor local autorizat' },
    ],
    steps: {
      title: 'Cum funcționează',
      lead: 'Smart Accounts e soluția de open banking a Smart Fintech: cu acordul tău, aplicațiile integrate citesc soldurile și istoricul tranzacțiilor într-un format unitar.',
      items: [
        { title: 'Alegi banca și conectezi contul', text: 'Pornești din RIDElance, iar conectarea se face securizat prin Smart Accounts.' },
        { title: 'Îți dai acordul', text: 'Tu autorizezi accesul la date, prin fluxul standard de open banking al băncii.' },
        { title: 'Datele se sincronizează', text: 'Soldurile și tranzacțiile ajung automat în RIDElance.' },
        { title: 'Finanțele se urmăresc ușor', text: 'Încasările și cheltuielile se folosesc pentru evidență, reconciliere și contabilitate.' },
      ],
    },
    flow: {
      title: 'De la bancă la dashboard, fără importuri manuale',
      items: [
        { icon: 'bank', title: 'Contul bancar', text: 'Soldurile și tranzacțiile din banca pe care o folosești.' },
        { icon: 'sync', title: 'Smart Accounts', text: 'Conectează și structurează datele prin open banking.' },
        { icon: 'insights', title: 'RIDElance', text: 'Datele ajung în dashboard, lângă restul activității.' },
      ],
    },
    reasons: {
      title: 'Mai puține extrase. Mai mult control.',
      items: [
        { icon: 'insights', title: 'Imagine financiară clară', text: 'Sold, încasări și cheltuieli în același loc cu activitatea ta.' },
        { icon: 'speed', title: 'Mai puțin lucru manual', text: 'Fără extrase descărcate, importuri și verificări între aplicații.' },
        { icon: 'security', title: 'Conectare securizată', text: 'Acces prin infrastructură de open banking autorizată, cu acordul titularului.' },
      ],
    },
    cta: {
      title: 'Conectează banca. RIDElance se ocupă de rest.',
      text: 'Smart Accounts face conexiunea open banking, iar RIDElance pune datele bancare lângă tot ce îți trebuie pentru administrarea activității.',
      label: 'Vezi Smart Accounts',
      href: 'https://www.smartfintech.eu/smartaccounts',
    },
  },
  {
    slug: 'fiscallink',
    eyebrow: 'Fiscalizare · casa de marcat',
    headline: 'Fiscalizare simplă, direct din RIDElance.',
    lead: 'Conectezi casa de marcat prin FiscalLink și gestionezi bonurile fiscale, rapoartele și documentele lor direct din RIDElance — fără pași manuali în plus.',
    highlight: {
      badge: 'Fiscalizare · dashboard PFA',
      title: 'Casa de marcat, conectată',
      text: 'Echipamentul fiscal e sincronizat cu RIDElance, iar contabilul are acces la aceleași date.',
      chips: ['Bon fiscal', 'Raport X', 'Raport Z', 'Istoric digital'],
    },
    steps: {
      title: 'Cum funcționează',
      lead: 'FiscalLink e infrastructura prin care aplicațiile comunică cu casele de marcat și imprimantele fiscale — emiți documente fiscale fără să lucrezi în mai multe sisteme.',
      items: [
        { title: 'Conectezi casa de marcat', text: 'Legătura dintre echipamentul fiscal și RIDElance se face prin FiscalLink.' },
        { title: 'Emiți bonuri și rapoarte', text: 'Bonurile fiscale și rapoartele X/Z pleacă din același flux digital.' },
        { title: 'Datele rămân în dashboard', text: 'Documentele și istoricul fiscal stau online, la îndemână.' },
        { title: 'Contabilul le vede pe loc', text: 'Fără poze, mesaje și date introduse de mână pentru fiecare document.' },
      ],
    },
    flow: {
      title: 'Un singur flux, de la bon la contabilitate',
      items: [
        { icon: 'receipt', title: 'Casa de marcat', text: 'Bonuri și rapoarte emise prin echipamentul conectat.' },
        { icon: 'sync', title: 'RIDElance + FiscalLink', text: 'Sincronizare și istoric digital, din dashboard.' },
        { icon: 'support', title: 'Contabil', text: 'Acces direct la ce îi trebuie, cu mai puțin input manual.' },
      ],
    },
    reasons: {
      title: 'Mai puțină administrație. Mai mult timp pentru curse.',
      items: [
        { icon: 'account', title: 'Pentru șofer', text: 'Mai puțini pași manuali și toate datele fiscale în același dashboard.' },
        { icon: 'support', title: 'Pentru contabil', text: 'Bonuri și rapoarte la un click, fără să aștepte documentele de la tine.' },
        { icon: 'insights', title: 'Pentru activitate', text: 'O evidență fiscală clară, legată de restul instrumentelor din RIDElance.' },
      ],
    },
    cta: {
      title: 'Casa ta de marcat, conectată la RIDElance.',
      text: 'FiscalLink face legătura cu echipamentul fiscal, iar RIDElance ține informațiile lângă restul activității tale de PFA.',
      label: 'Vezi FiscalLink',
      href: 'https://fiscallink.ro/',
    },
  },
  {
    slug: 'constalaris',
    eyebrow: 'Case de marcat și fiscalizare',
    headline: 'Casa de marcat pentru activitatea ta de ridesharing.',
    lead: 'Prin Constalaris iei o casă de marcat Orgtech Teo, nouă sau second-hand, cu fiscalizare, asistență pentru NUI, conectare la ANAF și contract de service. Comanda o plasezi direct pe site-ul Constalaris.',
    highlight: {
      badge: 'Cost în primul an',
      title: 'de la 550 lei',
      text: 'Aparat second-hand + contract de service standard pe 12 luni.',
      stats: [
        { value: '300 lei', label: 'aparat second-hand' },
        { value: '445 lei', label: 'aparat nou' },
        { value: '250 lei / an', label: 'service anual, de la' },
      ],
    },
    products: {
      title: 'Case de marcat disponibile',
      lead: 'Alegi aparatul și continui comanda pe site-ul partenerului, unde verifici și disponibilitatea.',
      items: [
        {
          variant: 'Second-hand',
          name: 'Orgtech Teo SH',
          subtitle: 'Un cost inițial mai mic pentru activitatea ta.',
          price: '300 lei',
          priceNote: 'TVA și timbru verde incluse în prețul aparatului',
          checks: ['Testată de service, cu memorie fiscală nouă', 'Produs folosit, cu posibile urme de utilizare'],
          firstYear: { label: 'Primul an, cu service standard', value: 'de la 550 lei' },
          href: 'https://www.constalaris.ro/case-de-marcat/casa-de-marcat-second-hand/',
        },
        {
          variant: 'Nouă',
          name: 'Orgtech Teo',
          subtitle: 'Aparat nou, recomandat de partener pentru ridesharing.',
          price: '445 lei',
          priceNote: 'TVA și timbru verde incluse în prețul aparatului',
          checks: ['Acumulator și alimentator auto incluse', 'Conexiune Wi-Fi, fără SIM dedicat aparatului'],
          firstYear: { label: 'Primul an, cu service standard', value: 'de la 695 lei' },
          href: 'https://www.constalaris.ro/case-de-marcat/casa-de-marcat-uber-orgtech-teo/',
        },
      ],
      note: 'Totalurile pentru primul an sunt estimative și includ contractul standard de la 250 lei/an/aparat, plătit pe 12 luni. Consumabilele, actualizările legislative și livrarea se plătesc separat.',
    },
    offers: {
      title: 'Ce e inclus în pachet',
      lead: 'La achiziția aparatului împreună cu un contract de service.',
      cards: [
        { icon: 'verified', title: 'Fiscalizarea aparatului', text: 'Inclusă în pachetul aparat + contract de service.' },
        { icon: 'document', title: 'Asistență pentru NUI', text: 'Sprijin pentru obținerea și configurarea NUI.' },
        { icon: 'link', title: 'Conectare la ANAF', text: 'Configurarea conexiunii aparatului la serverele ANAF.' },
        { icon: 'wifi', title: 'Configurare inițială', text: 'La sediul Constalaris sau online, în programul de lucru, pe internetul tău.' },
      ],
    },
    notes: [
      {
        title: 'Din anul al doilea: de la 250 lei / an / aparat',
        text: 'Contractul de service standard. Aparatul se plătește o singură dată; tariful anual se poate modifica.',
      },
      {
        title: 'Alte costuri',
        text: 'Consumabilele și actualizările legislative se plătesc separat. Piesele și serviciile din afara contractului se confirmă cu furnizorul. Pentru aplicația de raportare există un pachet de 315 lei/an/aparat în locul contractului standard; FiscalNet, dacă îl folosești, are cost separat.',
      },
      {
        title: 'Prețuri și disponibilitate',
        text: 'Se verifică pe constalaris.ro la momentul comenzii. Vânzarea, fiscalizarea și service-ul sunt asigurate de Constalaris, în condițiile contractului lor.',
      },
    ],
    cta: {
      title: 'Comanda se plasează pe site-ul Constalaris.',
      text: 'Alegi aparatul, verifici disponibilitatea și finalizezi achiziția direct la partener. Pentru PFA și SRL.',
      label: 'Mergi pe Constalaris',
      href: 'https://www.constalaris.ro/',
    },
  },
]

export const getPartnerShowcase = (slug: string) => partnerShowcases.find((item) => item.slug === slug)

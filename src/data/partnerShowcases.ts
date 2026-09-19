/**
 * Paginile de partener, cu textul materialelor primite de la fiecare (Consulto, MOL, Oblio,
 * FiscalLink, Smart Fintech, Constalaris), păstrat cuvânt cu cuvânt.
 *
 * Materialele veneau ca pagini HTML de sine stătătoare, fiecare cu stilul ei. Aici stă doar
 * conținutul lor, în ordinea din pagină, iar `PartnerShowcase` îl desenează cu tokenii noștri — la
 * fel pe pagina publică de Parteneri și în Beneficii. Textul NU se reformulează aici: e al
 * partenerului, iar o modificare pleacă de la materialul lui.
 *
 * Din HTML-uri lipsesc doar bara de sus cu logoul RIDElance și meniul paginii Constalaris: pe site
 * le ține deja antetul nostru.
 */

/** Iconițele disponibile, mapate pe componente MUI în `PartnerShowcase`. */
export type ShowcaseIcon =
  | 'account'
  | 'bank'
  | 'build'
  | 'business'
  | 'card'
  | 'carWash'
  | 'document'
  | 'fuel'
  | 'insights'
  | 'link'
  | 'location'
  | 'percent'
  | 'receipt'
  | 'register'
  | 'road'
  | 'savings'
  | 'security'
  | 'speed'
  | 'support'
  | 'sync'
  | 'verified'
  | 'wifi'

/** Text cu fragmente îngroșate sau linkuri, exact cum erau marcate în material. */
export type RichPart = string | { strong: string } | { link: string; href: string }
export type Rich = string | RichPart[]

export interface ShowcaseStat {
  value: string
  label: string
}

/** Un buton: spre o secțiune a paginii (`section`) sau spre site-ul partenerului (`href`). */
export type ShowcaseAction = { label: string; section: string } | { label: string; href: string }

/** Cartea din dreapta hero-ului. Fiecare material o desena altfel, deci câmpurile sunt opționale. */
export interface ShowcaseHeroCard {
  top?: string
  status?: string
  label?: string
  title?: string
  /** Suma mare: „de la” · „550” · „lei”. */
  amount?: { prefix?: string; value: string; unit?: string }
  text?: Rich
  chips?: string[]
  stats?: ShowcaseStat[]
  /** Cifre mici pe trei coloane (FiscalLink): eticheta deasupra valorii. */
  metrics?: { label: string; value: string }[]
  /** Rânduri de tranzacții (Smart Fintech). */
  rows?: { title: string; text: string; amount: string; positive?: boolean }[]
  lines?: string[]
  note?: { title: string; text: string }
}

export interface ShowcaseCard {
  icon: ShowcaseIcon
  title: string
  text: string
  value?: string
}

export interface ShowcaseProduct {
  label: string
  name: string
  description: string
  price: string
  unit: string
  taxNote: string
  features: string[]
  firstYear: { title: string; subtitle: string; prefix: string; value: string; unit: string }
  cta: { label: string; href: string }
}

export type ShowcaseSection =
  | { kind: 'cards'; id?: string; title?: string; lead?: string; cards: ShowcaseCard[]; note?: string }
  | {
      kind: 'aboutSteps'
      id?: string
      title?: string
      lead?: string
      about: {
        icon: ShowcaseIcon
        title: string
        paragraphs: string[]
        link?: { label: string; href: string }
        labels?: string[]
        stats?: ShowcaseStat[]
      }
      steps: { title: string; text: string }[]
    }
  | { kind: 'chain'; id?: string; title: string; lead: string; items: { icon: ShowcaseIcon; title: string; text: string }[] }
  | { kind: 'locations'; title: string; lead: string; price: string; items: { city: string; county: string }[] }
  | { kind: 'callout'; title: string; text: string; badge: string }
  | { kind: 'products'; id?: string; title: string; lead: string; items: ShowcaseProduct[]; footnote: string }
  | { kind: 'notes'; items: { label?: string; title?: string; titleUnit?: string; text: Rich }[] }

export interface PartnerShowcase {
  slug: string
  /** Eticheta din bara de sus a materialului; devine descrierea scurtă a partenerului. */
  tagline: string
  /** Paragraful de deasupra hero-ului (doar Constalaris îl are). */
  intro?: Rich
  hero: {
    eyebrow: string
    headline: string
    lead: Rich
    actions: ShowcaseAction[]
    card: ShowcaseHeroCard
  }
  sections: ShowcaseSection[]
  cta?: { title: string; text: string; action: { label: string; href: string } }
  footer: { left: string; right?: string; link?: { label: string; href: string } }
}

export const partnerShowcases: PartnerShowcase[] = [
  {
    slug: 'mol',
    tagline: 'Beneficiu partener · MOL România',
    hero: {
      eyebrow: 'RIDElance × MOL România',
      headline: 'Mai avantajos la fiecare drum.',
      lead: 'Clienții RIDElance cu abonament activ beneficiază de avantaje dedicate în rețeaua MOL România, atât pentru alimentare, cât și pentru îngrijirea mașinii. Benzină, diesel, GPL și spălătorii — reunite într-un beneficiu simplu, gândit pentru cei care sunt zilnic pe drum.',
      actions: [
        { label: 'Vezi beneficiile', section: 'beneficii' },
        { label: 'Vezi MOL România ↗', href: 'https://molromania.ro/' },
      ],
      card: {
        top: 'Beneficiu RIDElance',
        status: '● Activ',
        label: 'Card partener',
        title: 'MOL × RIDElance',
        text: 'Disponibil pentru clienții PFA și SRL cu abonament RIDElance',
        chips: ['BENZINĂ', 'DIESEL', 'GPL', 'SPĂLĂTORII'],
        note: {
          title: 'Un beneficiu pe care îl folosești în activitatea de zi cu zi.',
          text: 'Primești cardul MOL aferent colaborării RIDElance și îl folosești pentru avantajele dedicate disponibile prin parteneriat.',
        },
      },
    },
    sections: [
      {
        kind: 'aboutSteps',
        title: 'Un beneficiu făcut pentru cei care conduc mult.',
        lead: 'Pentru un șofer sau o flotă, carburantul și întreținerea curentă a mașinii sunt cheltuieli recurente. Colaborarea RIDElance × MOL România aduce avantaje dedicate exact acolo unde contează cel mai des.',
        about: {
          icon: 'card',
          title: 'Beneficii dedicate RIDElance în rețeaua MOL.',
          paragraphs: [
            'Orice client cu abonament RIDElance eligibil — PFA sau SRL — poate beneficia de condițiile negociate prin parteneriat, fără să fie nevoie să caute separat oferte pentru fiecare tip de carburant sau serviciu.',
          ],
          labels: ['Abonament RIDElance activ', 'PFA', 'SRL', 'Flote'],
        },
        steps: [
          { title: 'Ai un abonament RIDElance activ', text: 'Beneficiul este disponibil clienților eligibili indiferent de tipul de abonament PFA sau SRL.' },
          { title: 'Primești cardul MOL', text: 'Cardul aferent colaborării este asociat beneficiilor negociate pentru comunitatea RIDElance.' },
          { title: 'Îl folosești în rețeaua MOL', text: 'Alimentezi sau folosești serviciile eligibile, iar avantajele parteneriatului se aplică conform condițiilor active.' },
        ],
      },
      {
        kind: 'cards',
        id: 'beneficii',
        title: 'Beneficii pentru ceea ce folosești cel mai des.',
        lead: 'Fără procente afișate și fără calcule complicate. Beneficiile dedicate sunt asociate cardului MOL primit prin RIDElance.',
        cards: [
          { icon: 'fuel', title: 'Benzină', text: 'Condiții dedicate pentru alimentările cu benzină eligibile în rețeaua MOL România.', value: 'Beneficiu RIDElance' },
          { icon: 'fuel', title: 'Diesel', text: 'Avantaje dedicate pentru clienții care alimentează motorină în activitatea lor curentă.', value: 'Beneficiu RIDElance' },
          { icon: 'fuel', title: 'GPL', text: 'Beneficiile parteneriatului se extind și către alimentările GPL eligibile din rețeaua MOL.', value: 'Beneficiu RIDElance' },
          { icon: 'carWash', title: 'Spălătorii MOL', text: 'Condiții dedicate și pentru serviciile de spălare auto MOL, acolo unde acestea sunt disponibile.', value: 'Beneficiu RIDElance' },
        ],
      },
      {
        kind: 'chain',
        title: 'De la primul kilometru până la finalul zilei.',
        lead: 'Parteneriatul este construit în jurul costurilor recurente ale unui șofer sau ale unei flote: alimentezi, continui activitatea și păstrezi mașina pregătită pentru următoarea cursă.',
        items: [
          { icon: 'card', title: 'Cardul MOL', text: 'Primești acces la beneficiile negociate special pentru clienții RIDElance.' },
          { icon: 'fuel', title: 'Alimentare', text: 'Beneficiezi de condiții dedicate pentru carburanții eligibili din rețeaua MOL România.' },
          { icon: 'carWash', title: 'Îngrijirea mașinii', text: 'Folosești avantajele disponibile și pentru spălătoriile MOL incluse în parteneriat.' },
        ],
      },
      {
        kind: 'cards',
        title: 'De ce contează pentru un șofer sau o flotă?',
        lead: 'Beneficiul nu este unul ocazional. Este legat de servicii pe care activitatea de ridesharing le folosește în mod repetat.',
        cards: [
          { icon: 'savings', title: 'Costuri recurente mai bine optimizate', text: 'Carburantul și spălarea mașinii fac parte din activitatea curentă, iar beneficiile se aplică exact acestor categorii.' },
          { icon: 'card', title: 'Un singur beneficiu pentru mai multe nevoi', text: 'Benzină, diesel, GPL și servicii de spălare sunt reunite sub același parteneriat RIDElance × MOL.' },
          { icon: 'business', title: 'Disponibil pentru PFA și SRL', text: 'Beneficiul se adresează atât șoferilor care operează prin PFA, cât și firmelor și flotelor cu abonament RIDElance activ.' },
        ],
      },
    ],
    cta: {
      title: 'Conduci mult? Fă fiecare oprire să conteze.',
      text: 'Activează beneficiul MOL disponibil prin RIDElance și folosește cardul dedicat pentru avantajele negociate la carburant și spălătorii.',
      action: { label: 'Vezi MOL România ↗', href: 'https://molromania.ro/' },
    },
    footer: { left: 'RIDElance · Beneficiu partener MOL România', right: 'Pentru clienți PFA și SRL cu abonament activ' },
  },
  {
    slug: 'oblio',
    tagline: 'Facturare & SPV · Oblio',
    hero: {
      eyebrow: 'RIDElance × Oblio',
      headline: 'Facturare automată, direct din ecosistemul RIDElance.',
      lead: 'Prin integrarea cu Oblio, utilizatorii RIDElance își automatizează fluxul de facturare și transmiterea în SPV. Contul Oblio este creat și configurat pentru utilizatorii cu abonament RIDElance plătit, iar integrarea dintre platformele de ridesharing, Oblio și RIDElance elimină complet munca manuală.',
      actions: [
        { label: 'Vezi beneficiile', section: 'oferte' },
        { label: 'Vezi Oblio ↗', href: 'https://www.oblio.eu/' },
      ],
      card: {
        top: 'Beneficii active în RIDElance',
        status: '● Disponibil',
        label: 'Promo nou cont · cod „ridelance”',
        title: 'Primul an gratuit pentru conturile noi.',
        text: [
          'Dacă îți faci un cont nou pentru societatea ta și folosești codul promoțional ',
          { strong: 'ridelance' },
          ', primul an de utilizare Oblio este gratuit. După primul an, abonamentul costă 29 euro pe an.',
        ],
        stats: [
          { value: '0 € în primul an', label: 'pentru cont nou cu codul promoțional „ridelance”' },
          { value: '29 € / an', label: 'după expirarea primului an de gratuitate' },
        ],
      },
    },
    sections: [
      {
        kind: 'cards',
        id: 'oferte',
        title: 'Un parteneriat construit pentru automatizare completă.',
        lead: 'Oblio nu este doar un soft de facturare în ecosistemul RIDElance. Este piesa centrală pentru emiterea și transmiterea automată a facturilor către SPV, fără lucru manual.',
        cards: [
          { icon: 'savings', title: 'Primul an gratuit', text: 'Pentru orice cont nou creat pentru societatea ta, primul an este gratuit dacă este folosit codul promoțional „ridelance”.', value: '0 € în primul an' },
          { icon: 'build', title: 'Configurare făcută de RIDElance', text: 'Pentru utilizatorii cu abonament RIDElance plătit, noi ne ocupăm de deschiderea contului și de setarea lui.', value: 'Inclus pentru abonații plătiți' },
          { icon: 'link', title: 'Legare cu platformele de ridesharing', text: 'Platforma Oblio se conectează la platformele de ridesharing, apoi este legată și cu RIDElance pentru un flux unitar.', value: 'Flux automatizat' },
          { icon: 'receipt', title: 'Transmitere automată în SPV', text: 'Facturile aferente curselor ajung în SPV conform legii, fără input uman și fără operare manuală.', value: 'Conform fluxului fiscal' },
        ],
      },
      {
        kind: 'aboutSteps',
        about: {
          icon: 'receipt',
          title: 'Ce face Oblio în acest parteneriat?',
          paragraphs: [
            'Oblio acoperă partea de facturare și de transmitere fiscală, iar RIDElance transformă tot acest proces într-un flux simplu și integrat pentru utilizatorii din ridesharing.',
            'Rezultatul este un sistem în care facturile sunt generate, organizate și trimise mai departe fără muncă repetitivă, fără exporturi și fără intervenții manuale constante.',
          ],
          labels: ['Facturare', 'SPV', 'Integrare ridesharing', 'Automatizare'],
        },
        steps: [
          { title: 'Se creează contul Oblio', text: 'Pentru conturile noi se folosește codul promoțional „ridelance”, iar pentru abonații RIDElance plătiți configurarea este făcută de echipa noastră.' },
          { title: 'Se configurează integrarea', text: 'Oblio este conectat la platformele de ridesharing, apoi este legat și cu platforma RIDElance pentru a unifica întregul flux.' },
          { title: 'Facturile sunt generate automat', text: 'Documentele aferente curselor sunt gestionate în mod automatizat, fără introducere manuală de date pentru fiecare cursă.' },
          { title: 'Facturile ajung în SPV', text: 'Transmiterea către SPV se face în mod automat, conform fluxului fiscal stabilit, fără ca utilizatorul să lucreze manual pe fiecare document.' },
        ],
      },
      {
        kind: 'chain',
        title: 'De la cursă la factură și apoi în SPV — totul într-un singur flux.',
        lead: 'RIDElance și Oblio lucrează împreună pentru a elimina operațiunile manuale repetitive și pentru a oferi șoferilor sau firmelor un proces fiscal mult mai simplu.',
        items: [
          { icon: 'road', title: 'Platformele de ridesharing', text: 'Datele relevante pentru curse și facturare pornesc din platformele cu care lucrează utilizatorul.' },
          { icon: 'receipt', title: 'Oblio', text: 'Facturile sunt generate și gestionate în platforma de facturare, cu primul an gratuit pentru conturile noi eligibile.' },
          { icon: 'insights', title: 'RIDElance', text: 'Integrarea este centralizată în dashboard și configurată astfel încât utilizatorul să nu mai depindă de munca manuală.' },
          { icon: 'verified', title: 'SPV', text: 'Fiecare factură aferentă curselor este trimisă în SPV conform legii, într-un proces automatizat.' },
        ],
      },
      {
        kind: 'cards',
        title: 'De ce contează această integrare?',
        lead: 'Oblio rezolvă o problemă reală pentru șoferi și firme: facturarea și transmiterea fiscală devin predictibile, rapide și ușor de administrat.',
        cards: [
          { icon: 'speed', title: 'Mai puțin lucru manual', text: 'Nu mai este nevoie de emiterea și trimiterea manuală a fiecărei facturi în fluxul zilnic de lucru.' },
          { icon: 'link', title: 'Facturare integrată', text: 'Oblio și RIDElance lucrează împreună pentru a crea un flux coerent între activitatea de ridesharing și partea fiscală.' },
          { icon: 'security', title: 'Conformitate mai simplă', text: 'Transmiterea automată în SPV ajută utilizatorul să respecte fluxul fiscal cerut, cu mai puțină bătaie de cap.' },
        ],
      },
    ],
    cta: {
      title: 'Activezi RIDElance. Oblio preia facturarea.',
      text: 'Pentru conturile noi, primul an este gratuit cu promo code „ridelance”. Pentru abonații RIDElance plătiți, contul este deschis și configurat de noi, iar fluxul de facturare și SPV devine automatizat cap-coadă.',
      action: { label: 'Vezi Oblio ↗', href: 'https://www.oblio.eu/' },
    },
    footer: { left: 'RIDElance · Partener Oblio', right: 'Facturare, automatizare și SPV' },
  },
  {
    slug: 'consulto',
    tagline: 'Partener servicii juridice & ONRC · Consulto',
    hero: {
      eyebrow: 'RIDElance × Consulto',
      headline: 'Mai simplu să îți deschizi și administrezi forma juridică.',
      lead: 'Prin colaborarea RIDElance × Consulto, clienții noștri accesează servicii esențiale pentru PFA și SRL direct din platformă: deschidere PFA, înființare SRL, găzduire sediu social și costuri mult reduse pentru modificările viitoare la ONRC.',
      actions: [
        { label: 'Vezi ofertele', section: 'oferte' },
        { label: 'Vezi Consulto ↗', href: 'https://consulto.ro/' },
      ],
      card: {
        top: 'Beneficii active în RIDElance',
        status: '● Disponibil',
        label: 'Pachet pentru clienții RIDElance',
        title: 'PFA gratuit cu abonament RIDElance.',
        text: 'Dacă îți deschizi un PFA și alegi orice abonament RIDElance de PFA, costul deschiderii PFA devine 0 lei prin parteneriat.',
        stats: [
          { value: '249 lei', label: 'înființare PFA ca serviciu standard al platformei' },
          { value: '349 lei / an', label: 'găzduire sediu social prin RIDElance × Consulto' },
        ],
      },
    },
    sections: [
      {
        kind: 'cards',
        id: 'oferte',
        title: 'Oferte clare, construite special pentru clienții RIDElance.',
        lead: 'Am grupat serviciile cele mai importante pentru șoferii și firmele din ecosistemul RIDElance, astfel încât lansarea și administrarea activității să fie mai simple.',
        cards: [
          { icon: 'register', title: 'Deschidere PFA gratuită', text: 'Dacă alegi orice abonament RIDElance de PFA, deschiderea PFA este gratuită prin colaborarea cu Consulto.', value: '0 lei cu abonament RIDElance PFA' },
          { icon: 'document', title: 'Înființare PFA standard', text: 'Pentru clienții care doresc doar serviciul separat de înființare PFA, tariful standard în platformă este fix și clar.', value: '249 lei' },
          { icon: 'location', title: 'Găzduire sediu social', text: 'Găzduirea sediului social se face prin parteneriatul RIDElance × Consulto, în locațiile disponibile din rețea.', value: '349 lei / an' },
          { icon: 'business', title: 'Înființare SRL cu reducere', text: 'La deschiderea unui SRL prin RIDElance × Consulto, clientul beneficiază de reducere aplicată la onorariul afișat de Consulto.', value: '20% reducere la onorariul lor' },
        ],
      },
      {
        kind: 'aboutSteps',
        about: {
          icon: 'business',
          title: 'Ce face Consulto în acest parteneriat?',
          paragraphs: [
            'Consulto acoperă partea operațională și juridică pentru serviciile de înființare și modificare, iar RIDElance integrează aceste servicii într-un flux simplu, ușor de accesat pentru clienții PFA și SRL.',
            'Astfel, utilizatorul nu trebuie să caute separat soluții pentru începerea activității sau pentru schimbările care apar ulterior în firmă.',
          ],
          labels: ['PFA', 'SRL', 'Sediu social', 'Modificări ONRC'],
        },
        steps: [
          { title: 'Alegi serviciul în RIDElance', text: 'Selectezi dacă vrei deschidere PFA, înființare SRL sau găzduire sediu social, direct din fluxul platformei.' },
          { title: 'Primești beneficiul aferent', text: 'În funcție de pachetul ales, se aplică gratuitatea, prețul dedicat sau reducerea aferentă parteneriatului.' },
          { title: 'Consulto procesează dosarul', text: 'Partea juridică și administrativă este gestionată prin partenerul Consulto, iar clientul urmează un proces mai clar și mai rapid.' },
          { title: 'Rămâi acoperit și pe viitor', text: 'Dacă ai găzduire sediu social prin acest parteneriat, beneficiezi și de costuri reduse pentru multe modificări ulterioare la ONRC.' },
        ],
      },
      {
        kind: 'locations',
        title: 'Locații disponibile pentru găzduirea sediului social',
        lead: 'Prin RIDElance × Consulto, serviciul de găzduire sediu social este disponibil în mai multe zone din țară. Alegi zona care ți se potrivește, iar adresa exactă și contractul de găzduire sunt stabilite după validarea dosarului.',
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
      {
        kind: 'chain',
        title: 'Un avantaj important și după ce firma este deja deschisă.',
        lead: 'Dacă alegi serviciul de găzduire sediu social prin RIDElance × Consulto, primești și un beneficiu consistent pentru eventualele modificări viitoare la ONRC.',
        items: [
          { icon: 'location', title: 'Ai sediul social găzduit', text: 'Serviciul de găzduire este activ prin parteneriatul RIDElance × Consulto.' },
          { icon: 'document', title: 'Ai nevoie de o modificare', text: 'Exemplu: actualizare cod CAEN, adăugare activități, schimbare sediu sau alte modificări similare.' },
          { icon: 'percent', title: 'Primești 85% reducere', text: 'Reducerea se aplică la dosarul ONRC pentru modificările eligibile, prin acest parteneriat.' },
        ],
      },
    ],
    cta: {
      title: 'Deschizi, găzduiești și modifici mai simplu.',
      text: 'Consulto gestionează partea juridică și administrativă, iar RIDElance îți aduce serviciile într-un format clar, cu beneficii negociate special pentru PFA și SRL.',
      action: { label: 'Vezi Consulto ↗', href: 'https://consulto.ro/' },
    },
    footer: { left: 'RIDElance · Partener Consulto', right: 'Servicii pentru PFA, SRL și sediu social' },
  },
  {
    slug: 'smart-fintech',
    tagline: 'Integrare Open Banking · Smart Accounts',
    hero: {
      eyebrow: 'RIDElance × Smart Fintech',
      headline: 'Contul bancar, direct în RIDElance.',
      lead: 'Prin integrarea Smart Accounts de la Smart Fintech, îți conectezi contul bancar la RIDElance și ai soldurile și tranzacțiile centralizate automat în dashboard — fără extrase încărcate manual și fără verificări repetate în aplicația băncii.',
      actions: [
        { label: 'Vezi cum funcționează', section: 'integrare' },
        { label: 'Vezi Smart Accounts ↗', href: 'https://www.smartfintech.eu/smartaccounts' },
      ],
      card: {
        top: 'Cont bancar · Dashboard RIDElance',
        status: '● Conectat',
        label: 'SOLD DISPONIBIL',
        title: '12.486,40 lei',
        text: 'Cont business · sincronizat automat',
        chips: ['Sold', 'Încasări', 'Cheltuieli', 'Istoric tranzacții'],
        rows: [
          { title: 'Încasare', text: 'Tranzacție bancară sincronizată', amount: '+ 1.240 lei', positive: true },
          { title: 'Cheltuială', text: 'Identificată în istoricul contului', amount: '− 186,50 lei' },
        ],
      },
    },
    sections: [
      {
        kind: 'aboutSteps',
        id: 'integrare',
        title: 'Open banking integrat în platforma în care îți gestionezi deja activitatea.',
        lead: 'Smart Accounts furnizează infrastructura de conectare la conturile bancare, iar RIDElance aduce datele relevante în dashboard-ul PFA-ului sau al firmei.',
        about: {
          icon: 'bank',
          title: 'Ce este Smart Accounts?',
          paragraphs: [
            'Smart Accounts este soluția de open banking dezvoltată de Smart Fintech pentru interogarea și agregarea datelor bancare. Permite aplicațiilor integrate să acceseze, cu acordul titularului, informații precum soldurile și istoricul tranzacțiilor într-un format unitar.',
          ],
          link: { label: 'Află mai multe despre Smart Accounts ↗', href: 'https://www.smartfintech.eu/smartaccounts' },
          stats: [
            { value: '95%+', label: 'acoperire declarată a pieței bancare locale' },
            { value: '13', label: 'bănci principale incluse în ecosistem' },
            { value: 'BNR', label: 'furnizor local autorizat' },
          ],
        },
        steps: [
          { title: 'Alegi banca și conectezi contul', text: 'Conectarea pornește direct din RIDElance și se realizează securizat prin infrastructura Smart Accounts.' },
          { title: 'Îți dai acordul pentru acces', text: 'Tu controlezi accesul la datele bancare și autorizezi conexiunea conform fluxului de open banking.' },
          { title: 'Soldurile și tranzacțiile se sincronizează', text: 'RIDElance preia automat datele disponibile prin integrare și le afișează într-o structură unitară.' },
          { title: 'Finanțele tale devin mai ușor de urmărit', text: 'Încasările și cheltuielile pot fi folosite în dashboard pentru evidență financiară, reconciliere și contabilitate.' },
        ],
      },
      {
        kind: 'chain',
        title: 'De la bancă la dashboard, fără importuri manuale.',
        lead: 'Smart Fintech asigură infrastructura de open banking. RIDElance o transformă într-un flux simplu pentru administrarea financiară a activității tale.',
        items: [
          { icon: 'bank', title: 'Contul bancar', text: 'Solduri și tranzacții din banca pe care o folosești pentru activitatea ta.' },
          { icon: 'sync', title: 'Smart Accounts', text: 'Conectează și structurează datele bancare prin tehnologie open banking.' },
          { icon: 'insights', title: 'RIDElance', text: 'Date centralizate în dashboard pentru o imagine financiară mai clară și mai puțin input manual.' },
        ],
      },
      {
        kind: 'cards',
        title: 'Mai puține extrase. Mai puține verificări. Mai mult control.',
        lead: 'Integrarea bancară nu este doar despre afișarea soldului. Datele pot susține automatizarea întregului flux financiar și contabil din RIDElance.',
        cards: [
          { icon: 'insights', title: 'Imagine financiară clară', text: 'Vezi soldurile, încasările și cheltuielile în același loc în care îți gestionezi activitatea RIDElance.' },
          { icon: 'speed', title: 'Mai puțin lucru manual', text: 'Reduci descărcarea extraselor de cont, importurile și verificările repetitive între aplicația băncii și celelalte instrumente.' },
          { icon: 'security', title: 'Conectare securizată', text: 'Accesul la date se face prin infrastructură de open banking autorizată, pe baza consimțământului titularului contului.' },
        ],
      },
    ],
    cta: {
      title: 'Conectează banca. RIDElance se ocupă de restul fluxului.',
      text: 'Smart Accounts furnizează conexiunea open banking, iar RIDElance centralizează datele bancare alături de celelalte informații necesare administrării activității tale.',
      action: { label: 'Vezi Smart Accounts ↗', href: 'https://www.smartfintech.eu/smartaccounts' },
    },
    footer: { left: 'RIDElance · Integrare Smart Fintech', right: 'Open Banking prin Smart Accounts' },
  },
  {
    slug: 'fiscallink',
    tagline: 'Partener integrat: FiscalLink',
    hero: {
      eyebrow: 'RIDElance × FiscalLink',
      headline: 'Fiscalizare simplă, direct din RIDElance.',
      lead: 'Conectezi casa de marcat prin FiscalLink și gestionezi bonurile fiscale, rapoartele și documentele aferente direct din ecosistemul RIDElance — fără pași manuali inutili.',
      actions: [
        { label: 'Vezi cum funcționează', section: 'integrare' },
        { label: 'Vezi FiscalLink ↗', href: 'https://fiscallink.ro/' },
      ],
      card: {
        top: 'Fiscalizare · Dashboard PFA',
        status: '● Conectat',
        label: 'CASĂ DE MARCAT',
        text: 'Conectată și sincronizată cu RIDElance',
        chips: ['Bon fiscal', 'Raport X', 'Raport Z', 'Istoric digital'],
        metrics: [
          { label: 'Astăzi', value: '18 bonuri' },
          { label: 'Ultimul Z', value: 'Generat' },
          { label: 'Contabil', value: 'Acces activ' },
        ],
      },
    },
    sections: [
      {
        kind: 'aboutSteps',
        id: 'integrare',
        title: 'FiscalLink conectează echipamentul fiscal cu software-ul pe care îl folosești deja.',
        lead: 'În RIDElance, integrarea este folosită pentru a reduce operațiunile manuale și pentru a păstra informațiile fiscale centralizate în același dashboard.',
        about: {
          icon: 'receipt',
          title: 'Ce este FiscalLink?',
          paragraphs: [
            'FiscalLink este infrastructura prin care aplicațiile software comunică cu casele de marcat și imprimantele fiscale. Integrarea permite emiterea documentelor fiscale și gestionarea operațiunilor fără a lucra separat în mai multe sisteme.',
          ],
          link: { label: 'Află mai multe pe fiscallink.ro ↗', href: 'https://fiscallink.ro/' },
        },
        steps: [
          { title: 'Conectezi casa de marcat', text: 'Legătura dintre echipamentul fiscal și RIDElance este realizată prin FiscalLink.' },
          { title: 'Emiți bonuri și rapoarte', text: 'Bonurile fiscale și rapoartele X/Z sunt gestionate din același flux digital.' },
          { title: 'Datele rămân în dashboard', text: 'Documentele și istoricul fiscal sunt centralizate online pentru acces rapid și evidență clară.' },
          { title: 'Contabilul vede informațiile în timp real', text: 'Nu mai este nevoie de poze, mesaje și introducere manuală pentru fiecare document transmis.' },
        ],
      },
      {
        kind: 'chain',
        title: 'Un singur flux, de la bon la contabilitate.',
        lead: 'RIDElance aduce operațiunile fiscale în același ecosistem în care PFA-ul își gestionează activitatea, iar FiscalLink asigură legătura cu echipamentul fiscal.',
        items: [
          { icon: 'receipt', title: 'Casa de marcat', text: 'Bonuri și rapoarte fiscale emise prin echipamentul conectat.' },
          { icon: 'sync', title: 'RIDElance + FiscalLink', text: 'Sincronizare, istoric digital și gestionare din dashboard.' },
          { icon: 'support', title: 'Contabil', text: 'Acces direct la informațiile necesare, cu mai puțin input uman.' },
        ],
      },
      {
        kind: 'cards',
        title: 'Mai puțină administrație. Mai mult timp pentru activitate.',
        lead: 'Integrarea este gândită pentru șoferul PFA, dar simplifică în același timp și munca contabilului.',
        cards: [
          { icon: 'account', title: 'Pentru șofer', text: 'Mai puțini pași manuali și toate informațiile fiscale în același dashboard RIDElance.' },
          { icon: 'support', title: 'Pentru contabil', text: 'Acces rapid la bonuri și rapoarte, fără să depindă de transmiterea manuală a documentelor.' },
          { icon: 'insights', title: 'Pentru activitate', text: 'O evidență fiscală mai clară, centralizată și integrată cu restul instrumentelor folosite în RIDElance.' },
        ],
      },
    ],
    cta: {
      title: 'Casa ta de marcat, conectată la RIDElance.',
      text: 'FiscalLink asigură conexiunea cu echipamentul fiscal, iar RIDElance centralizează informațiile în același ecosistem în care îți gestionezi activitatea PFA.',
      action: { label: 'Vezi FiscalLink ↗', href: 'https://fiscallink.ro/' },
    },
    // Rândul al doilea din subsolul materialului era „Preview pagină partener” — eticheta
    // machetei, nu text pentru clienți.
    footer: { left: 'RIDElance · Partener FiscalLink' },
  },
  {
    slug: 'constalaris',
    tagline: 'Case de marcat și servicii de fiscalizare pentru PFA, SRL și flote.',
    intro: [
      'Prin partenerul Constalaris poți achiziționa o casă de marcat Orgtech Teo pentru activitatea de ridesharing, nouă sau second-hand. Ai acces la fiscalizare, asistență pentru NUI și conectare ANAF, împreună cu un contract de service. ',
      { strong: 'Comanzi direct pe site-ul Constalaris.' },
    ],
    hero: {
      eyebrow: 'PARTENER RIDELANCE',
      headline: 'Casa de marcat pentru activitatea ta de ridesharing.',
      lead: [
        'Alegi varianta potrivită bugetului tău: ',
        { strong: '300 lei pentru un aparat SH' },
        ' sau ',
        { strong: '445 lei pentru un aparat nou' },
        ', la care se adaugă contractul anual de service.',
      ],
      actions: [
        { label: 'Vezi casele de marcat', section: 'produse' },
        { label: 'Mergi pe Constalaris', href: 'https://www.constalaris.ro/' },
      ],
      card: {
        label: 'COST ÎN PRIMUL AN',
        amount: { prefix: 'de la', value: '550', unit: 'lei' },
        text: 'aparat SH + service standard',
        lines: ['300 lei pentru aparat', '+ de la 250 lei/an pentru service'],
      },
    },
    sections: [
      {
        kind: 'callout',
        title: 'Comanda se plasează pe site-ul Constalaris',
        text: 'Butoanele de mai jos te duc direct la produs, unde verifici disponibilitatea și finalizezi achiziția.',
        badge: 'PFA + SRL',
      },
      {
        kind: 'products',
        id: 'produse',
        title: 'Case de marcat disponibile',
        lead: 'Alege aparatul și continuă comanda pe site-ul partenerului.',
        items: [
          {
            label: 'Varianta second-hand',
            name: 'Orgtech Teo SH',
            description: 'Un cost inițial mai mic pentru activitatea ta.',
            price: '300',
            unit: 'lei / aparat',
            taxNote: 'TVA și timbru verde incluse în prețul aparatului',
            features: ['Testată de service, cu memorie fiscală nouă', 'Produs folosit, cu posibile urme de utilizare'],
            firstYear: { title: 'Primul an, cu service standard', subtitle: 'Aparat + contract pentru 12 luni', prefix: 'de la', value: '550', unit: 'lei' },
            cta: { label: 'Comandă pe Constalaris', href: 'https://www.constalaris.ro/case-de-marcat/casa-de-marcat-second-hand/' },
          },
          {
            label: 'Varianta nouă',
            name: 'Orgtech Teo',
            description: 'Aparat nou, prezentat de partener pentru ridesharing.',
            price: '445',
            unit: 'lei / aparat',
            taxNote: 'TVA și timbru verde incluse în prețul aparatului',
            features: ['Acumulator și alimentator auto incluse', 'Conexiune Wi-Fi, fără SIM dedicat aparatului'],
            firstYear: { title: 'Primul an, cu service standard', subtitle: 'Aparat + contract pentru 12 luni', prefix: 'de la', value: '695', unit: 'lei' },
            cta: { label: 'Comandă pe Constalaris', href: 'https://www.constalaris.ro/case-de-marcat/casa-de-marcat-uber-orgtech-teo/' },
          },
        ],
        footnote: 'Totalurile pentru primul an sunt estimative și folosesc contractul standard de la 250 lei/an/aparat, achitat pentru 12 luni. Consumabilele, actualizările legislative și eventualele costuri de livrare se plătesc separat.',
      },
      {
        kind: 'cards',
        id: 'servicii',
        title: 'Ce este inclus în pachet',
        lead: 'La achiziția aparatului împreună cu un contract de service, conform informațiilor Constalaris.',
        cards: [
          { icon: 'verified', title: 'Fiscalizarea aparatului', text: 'Inclusă în pachetul aparat + contract service.' },
          { icon: 'document', title: 'Asistență pentru NUI', text: 'Sprijin pentru obținerea și configurarea NUI.' },
          { icon: 'link', title: 'Conectare la ANAF', text: 'Configurarea conexiunii aparatului la serverele ANAF.' },
          { icon: 'wifi', title: 'Configurare inițială', text: 'Instalare și configurare cu sprijinul Constalaris.' },
        ],
        note: 'Configurarea se face la sediul Constalaris sau online, în timpul programului de lucru. Conexiunea Wi-Fi utilizează accesul tău la internet.',
      },
      {
        kind: 'notes',
        items: [
          {
            label: 'Începând cu anul al doilea',
            title: 'De la 250 lei',
            titleUnit: '/ an / aparat',
            text: 'Contract de service standard. Prețul aparatului se achită o singură dată; tariful anual se poate modifica.',
          },
          {
            title: 'Alte costuri de avut în vedere',
            text: 'Consumabilele și actualizările legislative se achită separat. Pentru intervențiile acoperite de contract este indicată manopera inclusă; piesele și serviciile suplimentare se confirmă cu furnizorul.',
          },
          {
            text: [
              { strong: 'Te interesează și aplicația de raportare?' },
              ' Constalaris a indicat un ',
              {
                link: 'pachet de 315 lei/an/aparat',
                href: 'https://www.constalaris.ro/case-de-marcat/contract-service-casa-de-marcat/contract-service-si-aplicatie-raportare/',
              },
              ', în locul contractului standard. Disponibilitatea și funcțiile se confirmă cu partenerul. FiscalNet, dacă alegi să îl folosești, presupune un cost separat.',
            ],
          },
          {
            text: [
              { strong: 'Prețurile și disponibilitatea se verifică pe constalaris.ro la momentul comenzii.' },
              ' Prețurile aparatelor includ TVA și timbru verde; TVA-ul serviciilor și totalul final se confirmă cu furnizorul. Comercializarea, fiscalizarea și service-ul sunt asigurate de Constalaris, în condițiile contractului propriu.',
            ],
          },
        ],
      },
    ],
    footer: {
      left: 'RIDElance × Constalaris · Beneficii pentru afacerea ta',
      link: { label: 'Vizitează site-ul partenerului', href: 'https://www.constalaris.ro/' },
    },
  },
]

export const getPartnerShowcase = (slug: string) => partnerShowcases.find((item) => item.slug === slug)

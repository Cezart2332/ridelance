import docs from '../assets/docs.svg'
import renteaza from '../assets/renteaza.svg'
import silso from '../assets/silso.png'
import lion from '../assets/lion.png'
import character2 from '../assets/Stickers/character 2.png'
import scene1 from '../assets/Stickers/scene 1.png'
import scene4 from '../assets/Stickers/scene 4.png'
import checkSvg from '../assets/SVG/2- Regular/check-circle.svg'
import starSvg from '../assets/SVG/2- Regular/star.svg'
import desktop from '../assets/SVG/2- Regular/desktop.svg'

export const loremLongText =
  'Lorem ipsum dolor sit amet consectetur adipisicing elit. Distinctio ipsa ducimus, ipsam pariatur hic possimus aliquam eaque similique nostrum! Vero veniam earum sint sapiente ut. Quae aspernatur assumenda aliquam pariatur suscipit in porro ipsam.'

export const navItems = [
  { label: 'Servicii', path: '/servicii' },
  { label: 'Abonamente', path: '/abonamente-preturi' },
  { label: 'Fiscal', path: '/fiscal' },
  { label: 'Parteneri', path: '/parteneri' },
  { label: 'Despre Ridelance', path: '/despre-ridelance' },
  { label: 'Contact', path: '/contact' },
]

export const faqItems = [
  {
    title: 'De ce as avea nevoie de o platforma ca aceasta',
    text: loremLongText,
  },
  {
    title: 'Daca am deja PFA, pot sa folosesc platforma?',
    text: loremLongText,
  },
  { title: 'De ce documente am nevoie?', text: loremLongText },
]

export const pricingCards = [
  {
    title: 'RIDElance Solo',
    price: '49 lei / săpt.',
    priceNote: 'Abonament săptămânal, cu reînnoire automată în fiecare luni.',
    summary: 'Pentru șoferii care au deja contabil sau vor să își gestioneze singuri partea contabilă, dar vor infrastructura RIDElance.',
    cta: 'Alege Solo',
    footnote: 'Fără contabilitate lunară inclusă.',
    list: [
      'Deschidere PFA la tarif preferențial — 300 lei',
      'Export lunar pentru contabilul propriu',
      'Asistență și consultanță constantă',
      'Acces complet în dashboardul RIDElance',
      'Organizare completă pentru activitatea de șofer PFA',
      'Reduceri și beneficii prin partenerii RIDElance',
    ],
  },
  {
    title: 'RIDElance Start',
    price: '99 lei / săptămână',
    priceNote: 'Abonament săptămânal, cu reînnoire automată în fiecare luni.',
    summary: 'Pentru șoferii care vor să înceapă rapid și să aibă totul pus la punct.',
    cta: 'Începe cu Start',
    list: [
      'Deschidere PFA cu cost rambursabil + bonus 100 lei',
      'Asistență și consultanță constantă',
      'Acces complet în dashboardul RIDElance',
      'Contabilitate completă pentru PFA',
      'Reduceri și beneficii prin partenerii RIDElance',
    ],
  },
  {
    title: 'RIDElance Pro',
    price: '149 lei / săptămână',
    priceNote: 'Abonament săptămânal, cu reînnoire automată în fiecare luni.',
    summary: 'Pentru cei care vor mai mult confort, suport prioritar și avantaje suplimentare.',
    cta: 'Vezi Pro',
    intro: 'Include tot ce ai în Start, plus:',
    list: [
      'Găzduire sediu social gratuit în București / Ilfov',
      'Suport prioritar',
      'Oferte, campanii și promoții exclusive PRO',
      'Reducere la chiria mașinilor RIDElance',
    ],
  },
]

export const partnerLogos = [
  {
    name: 'RENTeaza',
    image: renteaza,
    href: 'https://renteaza.ro',
    desc: 'RENTeaza este cea mai mare platformă digitală de mobilitate care modernizează listarea, administrarea și rezervarea vehiculelor, atât pentru persoane fizice, cât și pentru operatori.',
  },
  {
    name: 'Silso',
    image: silso,
    href: 'https://silso.ro',
    desc: 'Silso este un partener specializat în servicii administrative și suport pentru antreprenori, de la înființări de firme și PFA până la contabilitate și găzduire sediu social.',
  },
  {
    name: 'Lion Finance Consulting',
    image: lion,
    href: 'https://bonurifiscale.ro/',
    desc: 'Lion Finance Consulting este un partener specializat în case de marcat și echipamente fiscale, oferind soluții pentru fiscalizare, configurare și suport dedicat.',
  },
]

export const homeSec2 = [
  'Deschidere PFA',
  'Autorizații ARR',
  'TVA intracomunitar',
  'Deschidere conturi Fleet Uber si Bolt',
  'Gestionare conturi Fleet',
  'Deschidere si management cont SPV',
  'Trimiterea facturilor asociate fiecarei curse, direct in SPV',
  'Contabilitate completă pentru PFA ',
  'Dashboard pentru încărcarea cheltuielilor și documentelor ',
  'Acces la mașini de închiriat',
]

export const homeSec3 = [
  {
    title: '1. Alegi varianta potrivita',
    text: 'Abonament sau serviciu individual, în funcție de ce ai nevoie.',
    image: scene1,
  },
  {
    title: '2. Completezi datele necesare',
    text: 'Încarci informațiile și documentele direct în platformă.',
    image: docs,
  },
  {
    title: '3. Procesul este preluat mai departe',
    text: 'Noi și partenerii noștri gestionăm pașii necesari pentru continuarea procedurii.',
    image: scene4,
  },
  {
    title: '4. Tu te concentrezi pe activitate',
    text: 'Mai puțin stres administrativ, mai multă claritate și organizare.',
    image: character2,
  },
]

export const homeSec4 = [
  {
    title: 'PFA & documente',
    text: 'Pornire simplificată, cu pași clari și flux organizat.',
    icon: checkSvg,
  },
  {
    title: 'Contabilitate completă',
    text: 'Suport pentru partea administrativă și contabilă a activității tale.',
    icon: checkSvg,
  },
  {
    title: 'Dashboard dedicat',
    text: 'Încarci cheltuieli, documente, urmărești activitatea PFA-ului și ai acces rapid la funcțiile importante într-un singur loc.',
    icon: desktop,
  },
  {
    title: 'Beneficii utile',
    text: 'Acces la parteneri, reduceri, suport direct și avantaje relevante pentru activitatea ta.',
    icon: starSvg,
  },
]

export const economyComparison = [
  {
    service: 'Deschidere PFA',
    withRidelance: 'Inclus + bonus',
    withoutRidelance: '450 lei',
  },
  {
    service: 'Comision din venituri săptămânale',
    withRidelance: '0%',
    withoutRidelance: '10–20%',
  },
  {
    service: 'Contabilitate specializată ridesharing',
    withRidelance: 'Inclusă',
    withoutRidelance: '300 lei/lună',
  },
  {
    service: 'Găzduire sediu social',
    withRidelance: 'Inclusă în PRO',
    withoutRidelance: '449 lei/an',
  },
  {
    service: 'Start asistat până la prima cursă',
    withRidelance: 'Inclus',
    withoutRidelance: 'Servicii separate',
  },
  {
    service: 'Casă de marcat',
    withRidelance: '599 lei',
    withoutRidelance: '900 lei',
  },
  {
    service: 'Reduceri mașini premium de închiriat',
    withRidelance: 'Incluse',
    withoutRidelance: 'Nu ai',
  },
  {
    service: 'Dashboard venituri & cheltuieli',
    withRidelance: 'Inclus',
    withoutRidelance: 'Nu ai',
  },
  {
    service: 'Bonusuri și reduceri parteneri',
    withRidelance: 'Incluse',
    withoutRidelance: 'Nu',
  },
]

export const homeSec6 = [
  {
    title: 'Înființare PFA',
    price: '450 lei',
    desc: 'Deschizi rapid un PFA printr-un proces simplu și organizat, fără abonament lunar.',
    cta: 'Vezi serviciul',
  },
  {
    title: 'Găzduire Sediu Social',
    price: '449 lei / an',
    desc: 'O soluție practică pentru cei care au nevoie de sediu social pentru PFA în București / Ilfov.',
    cta: 'Vezi serviciul',
  },
  {
    title: 'Start Ride',
    price: '799 lei',
    priceNote: '* nu include taxe ARR',
    desc: 'Începi pe PFA, fără să pierzi timp cu pași neclari. RIDElance te ghidează prin deschiderea PFA-ului și activarea pentru ridesharing, până ești pregătit să lucrezi independent.',
    tagline: 'Proces clar. Pornire corectă. Suport până la activare.',
    cta: 'Alege serviciul',
  },
]

export const homeSec8 = [
  'Totul într-un singur loc ',
  'Proces clar și ușor de urmat ',
  'Servicii gândite pentru ridesharing',
  'Chat direct cu contabilul și suportul ',
  'Statistici și organizare mai bună pentru activitatea PFA-ului ',
  'Remindere și funcții utile în dashboard',
  'Acces la vehicule gata de ridesharing',
  'Mai puțin stres administrativ ',
]

export const homeSec9 = [
  {
    q: 'Trebuie să am deja PFA?',
    a: 'Nu. Poți alege un abonament sau serviciul individual de înființare PFA.',
  },
  {
    q: 'Mă ajutați doar cu contabilitatea?',
    a: 'Nu. RIDElance acoperă mai mult decât contabilitatea: PFA, ARR, TVA intracomunitar, conturi Fleet, SPV, facturi și alte etape importante.',
  },
  {
    q: 'Pot alege doar un serviciu, fără abonament?',
    a: 'Da. Poți solicita separat înființarea PFA sau găzduirea sediului social.',
  },
  {
    q: 'Cum funcționează înființarea PFA?',
    a: 'Completezi datele și documentele necesare în platformă, iar solicitarea este transmisă ulterior către partenerul RIDElance, SILSO.',
  },
  {
    q: 'Ce documente sunt necesare pentru găzduire sediu social?',
    a: 'Pentru solicitarea inițială, vor fi necesare buletinul și CUI-ul PFA.',
  },
]

import docs from '../assets/docs.svg'
import ace from '../assets/partners/ace.png'
import mol from '../assets/partners/mol.png'
import asigurari from '../assets/partners/asigurari.png'
import consulto from '../assets/partners/consulto.png'
import eldrive from '../assets/partners/eldrive.png'
import oblio from '../assets/partners/oblio.png'
import simplifi from '../assets/partners/simplifi.png'
import { sortByPartnerOrder } from './benefits'
import { PFA_PLANS } from './plans'
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
  { label: 'Mașini', path: '/masini' },
  // Lângă Mașini, nu la Despre: e o întrebare pe care și-o pune cineva înainte să se înscrie —
  // „merg platformele în orașul meu?" — nu una despre noi.
  { label: 'Orașe', path: '/orase-ridesharing' },
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

/**
 * Cardurile de abonament de pe landing.
 *
 * Derivate din `plans.ts`, nu scrise a doua oară: erau o copie a acelorași planuri și ajunseseră
 * să anunțe alte prețuri decât pagina de Abonamente. Landingul arată doar varianta lunară pentru
 * PFA — comparația lunar/anual și planul de flotă stau pe pagina dedicată.
 */
export const pricingCards = PFA_PLANS

/**
 * Logourile de pe pagina publică. Ordinea vine din `benefits.ts`, ca peste tot: aici era scrisă
 * de mână și ajunsese alta decât în Beneficii.
 */
export const partnerLogos: { slug: string; name: string; image: string; href?: string }[] =
  sortByPartnerOrder([
    { slug: 'ace', name: 'ACE', image: ace },
    { slug: 'mol', name: 'MOL', image: mol },
    { slug: 'asigurari-ro', name: 'asigurari.ro', image: asigurari },
    { slug: 'bcr', name: 'BCR', image: '/logobcr.jpeg' },
    { slug: 'oblio', name: 'Oblio', image: oblio },
    { slug: 'eldrive', name: 'eldrive', image: eldrive },
    { slug: 'consulto', name: 'Consulto', image: consulto },
    { slug: 'simplifi', name: 'Simplifi', image: simplifi },
  ])

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
    serviceKey: 'infiintare_pfa' as const,
    title: 'Înființare PFA',
    price: '450 lei',
    desc: 'Deschizi rapid un PFA printr-un proces simplu și organizat, fără abonament lunar.',
    cta: 'Cumpără serviciul',
  },
  {
    serviceKey: 'sediu_social' as const,
    title: 'Găzduire Sediu Social',
    price: '449 lei / an',
    desc: 'O soluție practică pentru cei care au nevoie de sediu social pentru PFA în București / Ilfov.',
    cta: 'Cumpără serviciul',
  },
  {
    serviceKey: 'start_ride' as const,
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
    a: 'Completezi datele și documentele necesare în platformă, iar solicitarea este preluată și procesată de echipa RIDElance.',
  },
  {
    q: 'Ce documente sunt necesare pentru găzduire sediu social?',
    a: 'Pentru solicitarea inițială, vor fi necesare buletinul și CUI-ul PFA.',
  },
]

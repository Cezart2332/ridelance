import { getCarImageUrl, type Car } from '../../../services/cars.service'
import { breadcrumbJsonLd, SITE_ORIGIN, usePageSeo } from '../../../seo/pageSeo'
import { formatLei } from '../../../utils/vehiclePricing'

/**
 * Titlul, descrierea și datele structurate ale paginii (spec §22).
 *
 * Se scriu direct în `<head>` (`usePageSeo`), pe etichetele care există deja. Randate ca etichete
 * din componentă, pagina ajungea cu două `<title>` și două descrieri — cele statice din
 * `index.html` și cele de aici — iar un crawler le lua pe primele, cele generice.
 *
 * Adresa canonică e mereu `/masini/{slug}`: aceeași mașină se deschide și din mini-site-ul firmei
 * (`/{firma}/{slug}`), iar fără canonică fiecare adresă ar fi tratată ca pagină separată.
 *
 * Datele structurate descriu o **mașină de închiriat** (`Car` cu ofertă `LeaseOut`), nu un produs
 * de vânzare. Prețul e exprimat pe **săptămână** (`unitCode: WEE`): un preț pe zi calculat de noi
 * ar deveni prețul afișat în rezultatele căutării — exact confuzia pe care o evită restul paginii.
 * Intră doar ce se vede pe pagină.
 */
export function VehicleSeo({ car }: { car: Car }) {
  const name = `${car.brand} ${car.model} ${car.year}`
  const title = `${name} de închiriat în ${car.location} — ${formatLei(car.pricePerWeek)} lei/săptămână`
  const description =
    `${name}, ${car.transmission.toLowerCase()}, ${car.engine.toLowerCase()}, disponibilă în ` +
    `${car.location} pentru ridesharing. ${formatLei(car.pricePerWeek)} lei pe săptămână, fără plată online.`
  const images = car.images.map((image) => getCarImageUrl(image.imageUrl))
  const path = `/masini/${car.slug}`
  const url = `${SITE_ORIGIN}${path}`

  usePageSeo({
    title,
    description,
    path,
    image: images[0],
    type: 'product',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Car',
        '@id': `${url}#car`,
        name,
        description: car.description || description,
        image: images.length > 0 ? images : undefined,
        brand: { '@type': 'Brand', name: car.brand },
        model: car.model,
        vehicleModelDate: String(car.year),
        fuelType: car.engine,
        vehicleTransmission: car.transmission,
        offers: {
          '@type': 'Offer',
          url,
          businessFunction: 'http://purl.org/goodrelations/v1#LeaseOut',
          price: car.pricePerWeek,
          priceCurrency: 'RON',
          availability: car.status === 'Available' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          areaServed: car.location,
          seller: car.owner ? { '@type': 'Organization', name: car.owner.displayName } : undefined,
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: car.pricePerWeek,
            priceCurrency: 'RON',
            unitCode: 'WEE',
            unitText: 'săptămână',
          },
        },
      },
      breadcrumbJsonLd([
        { name: 'Acasă', path: '/' },
        { name: 'Mașini', path: '/masini' },
        { name, path },
      ]),
    ],
  })

  return null
}

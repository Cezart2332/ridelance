import { getCarImageUrl, type Car } from '../../../services/cars.service'
import { formatLei } from '../../../utils/vehiclePricing'

/**
 * Titlul, descrierea și datele structurate ale paginii (spec §22).
 *
 * React 19 ridică singur `<title>`, `<meta>` și `<link>` din componente în `<head>`, deci nu e
 * nevoie de nicio bibliotecă. Limitarea rămâne cea a oricărui SPA: le văd doar crawlerele care
 * execută JavaScript.
 *
 * Prețul din JSON-LD e exprimat pe **săptămână** (`unitCode: WEE`). Un preț pe zi calculat de noi
 * și pus în date structurate ar deveni prețul afișat în rezultatele căutării — exact confuzia pe
 * care o evită restul paginii.
 */
export function VehicleSeo({ car }: { car: Car }) {
  const name = `${car.brand} ${car.model} ${car.year}`
  const title = `${name} de închiriat în ${car.location} — ${formatLei(car.pricePerWeek)} lei/săptămână`
  const description =
    `${name}, ${car.transmission.toLowerCase()}, ${car.engine.toLowerCase()}, disponibilă în ` +
    `${car.location} pentru ridesharing. ${formatLei(car.pricePerWeek)} lei pe săptămână, fără plată online.`
  const image = car.images[0] ? getCarImageUrl(car.images[0].imageUrl) : undefined
  const url = `${window.location.origin}/masini/${car.slug}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: car.description || description,
    image: image ? [image] : undefined,
    brand: { '@type': 'Brand', name: car.brand },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'RON',
      availability:
        car.status === 'Available'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: car.pricePerWeek,
        priceCurrency: 'RON',
        unitCode: 'WEE',
        unitText: 'săptămână',
      },
    },
  }

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content="product" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}

      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />

      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </>
  )
}

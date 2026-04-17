import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState, type MouseEvent } from 'react'
import logo from './assets/logo.svg'
import TaxCalculator from './components/TaxCalculator'
import { scrollToTarget } from './lib/lenis'
import { fadeUp, pageEntrance, staggerContainer, staggerItem } from './lib/variants'
import './App.css'

function App() {
  const [showSplash, setShowSplash] = useState(true)

  const beneficii = [
    {
      titlu: 'Înrolare ghidată cap-coadă',
      text: 'Primești suport pas cu pas pentru documentele PFA și activarea rapidă în sistem.',
    },
    {
      titlu: 'Contabil dedicat pentru fiecare PFA',
      text: 'Fiecare PFA va avea un contabil care te ajută cu partea fiscală și administrativă.',
    },
    {
      titlu: 'Management simplificat',
      text: 'Ții evidența actelor și taskurilor într-un singur loc, fără foi împrăștiate.',
    },
    {
      titlu: 'Comunicare clară',
      text: 'Știi mereu ce ai de făcut și când, prin notificări și statusuri ușor de urmărit.',
    },
    {
      titlu: 'Făcut pentru ridesharing',
      text: 'Proces gândit special pentru colaborarea cu Uber și Bolt în România.',
    },
  ]

  const ceEste = [
    {
      titlu: 'Pregătire documente',
      text: 'Ai checklist-ul necesar și știi exact ce trebuie completat, în ordinea corectă.',
    },
    {
      titlu: 'Înrolare rapidă',
      text: 'Elimini pașii confuzi și reduci timpul pierdut între acte, întrebări și confirmări.',
    },
    {
      titlu: 'Management lunar',
      text: 'Rămâi organizat după activare, cu un loc unic pentru responsabilitățile curente.',
    },
  ]

  const pasi = [
    {
      pas: '01',
      titlu: 'Completezi formularul inițial',
      text: 'Ne trimiți rapid datele de bază și îți validăm eligibilitatea pentru înrolare.',
    },
    {
      pas: '02',
      titlu: 'Primești checklist personalizat',
      text: 'Vezi clar ce documente sunt necesare și în ce stadiu se află fiecare.',
    },
    {
      pas: '03',
      titlu: 'Pornești la drum cu PFA-ul organizat',
      text: 'După activare, ai în continuare un spațiu unic pentru managementul administrativ.',
    },
  ]

  const intrebariFrecvente = [
    {
      intrebare: 'Pentru cine este Ridelance?',
      raspuns:
        'Ridelance este pentru șoferii Uber/Bolt din România care vor să lucreze legal ca PFA și să își reducă timpul petrecut cu partea administrativă.',
    },
    {
      intrebare: 'Trebuie să mă pricep la contabilitate?',
      raspuns:
        'Nu. Platforma este construită pentru claritate: ai pași concreți, statusuri și suport, astfel încât să știi exact ce ai de făcut.',
    },
    {
      intrebare: 'Cât durează înrolarea?',
      raspuns:
        'Durata depinde de completitudinea documentelor, dar fluxul este optimizat pentru activare rapidă și fără blocaje.',
    },
    {
      intrebare: 'Pot folosi platforma și după activare?',
      raspuns:
        'Da. Ridelance este gândit și pentru managementul continuu al activității PFA, nu doar pentru început.',
    },
  ]

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setShowSplash(false)
    }, 1650)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [])

  const handleAnchorNavigation = (event: MouseEvent<HTMLAnchorElement>) => {
    const href = event.currentTarget.getAttribute('href')
    if (!href || !href.startsWith('#')) {
      return
    }

    const section = document.querySelector(href)
    if (!(section instanceof HTMLElement)) {
      return
    }

    event.preventDefault()
    scrollToTarget(section, -84)
  }

  const sectionViewport = { once: true, amount: 0.22 }

  return (
    <>
      <AnimatePresence>
        {showSplash ? (
          <motion.div
            className="splash-screen"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.45 } }}
          >
            <motion.div
              className="splash-content"
              initial={{ opacity: 0, y: 18, scale: 0.92 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
              }}
              exit={{ opacity: 0, y: -12, scale: 0.96, transition: { duration: 0.3 } }}
            >
              <motion.img
                src={logo}
                className="splash-logo"
                alt="Logo Ridelance"
                initial={{ opacity: 0, scale: 0.9, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              />
              <p className="splash-title">Ridelance</p>
              <span className="splash-subtitle">Înrolare PFA pentru șoferi Uber și Bolt</span>
              <div className="splash-loader" aria-hidden="true">
                <motion.span
                  className="splash-loader-bar"
                  initial={{ x: '-100%' }}
                  animate={{ x: '0%' }}
                  transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div className="page-shell" variants={pageEntrance} initial="hidden" animate="visible">
        <header className="topbar">
          <a className="brand" href="#acasa" aria-label="Ridelance acasă" onClick={handleAnchorNavigation}>
            
            <span>Ridelance</span>
          </a>
          <nav aria-label="Navigație principală">
            <ul className="nav-links">
              <li>
                <a href="#ce-este" onClick={handleAnchorNavigation}>
                  Ce este
                </a>
              </li>
              <li>
                <a href="#de-ce-noi" onClick={handleAnchorNavigation}>
                  De ce noi
                </a>
              </li>
              <li>
                <a href="#faq" onClick={handleAnchorNavigation}>
                  FAQ
                </a>
              </li>
            </ul>
          </nav>
          <a className="nav-cta" href="#contact" onClick={handleAnchorNavigation}>
            Solicită demo
          </a>
        </header>

        <main>
          <motion.section
            className="hero"
            id="acasa"
            aria-labelledby="hero-title"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            <p className="hero-badge">Înrolare & management PFA pentru șoferi Uber/Bolt</p>
            <div className="hero-title-row">
              <motion.img
                src={logo}
                className="title-logo"
                alt=""
                aria-hidden="true"
                animate={{ y: [0, -5, 0], rotate: [0, 2, -2, 0] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <h1 id="hero-title">Condu liniștit. Restul îl organizăm împreună.</h1>
            </div>
            <p className="hero-subtitle">
              Ridelance este platforma care simplifică înrolarea și administrarea PFA pentru ridesharing
              în România, cu un proces clar, rapid și ușor de urmărit.
            </p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#contact" onClick={handleAnchorNavigation}>
                Începe înrolarea
              </a>
              <a className="btn btn-ghost" href="#faq" onClick={handleAnchorNavigation}>
                Vezi întrebările frecvente
              </a>
            </div>
            <ul className="hero-highlights" aria-label="Avantaje cheie">
              <li>Flux simplu pentru documente</li>
              <li>Statut clar pentru fiecare pas</li>
              <li>Fiecare PFA va avea un contabil</li>
              <li>Gândit special pentru piața din România</li>
            </ul>
          </motion.section>

          <motion.section
            className="panel"
            id="ce-este"
            aria-labelledby="ce-este-title"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={sectionViewport}
          >
            <div className="panel-head">
              <p className="eyebrow">Ce este</p>
              <h2 id="ce-este-title">O bază digitală clară pentru activitatea ta ca PFA</h2>
            </div>
            <motion.div
              className="what-grid"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={sectionViewport}
            >
              {ceEste.map((item) => (
                <motion.article key={item.titlu} variants={staggerItem} whileHover={{ y: -4, scale: 1.01 }}>
                  <h3>{item.titlu}</h3>
                  <p>{item.text}</p>
                </motion.article>
              ))}
            </motion.div>
          </motion.section>

          <motion.section
            className="panel panel-contrast"
            id="de-ce-noi"
            aria-labelledby="de-ce-noi-title"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={sectionViewport}
          >
            <div className="panel-head">
              <p className="eyebrow">De ce noi</p>
              <h2 id="de-ce-noi-title">Reducem stresul administrativ, nu doar pașii din checklist</h2>
            </div>
            <motion.div
              className="benefits-grid"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={sectionViewport}
            >
              {beneficii.map((beneficiu) => (
                <motion.article
                  key={beneficiu.titlu}
                  className="benefit-card"
                  variants={staggerItem}
                  whileHover={{ y: -4, scale: 1.01 }}
                >
                  <h3>{beneficiu.titlu}</h3>
                  <p>{beneficiu.text}</p>
                </motion.article>
              ))}
            </motion.div>
          </motion.section>

          <motion.section
            className="panel"
            aria-labelledby="cum-functioneaza-title"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={sectionViewport}
          >
            <div className="panel-head">
              <p className="eyebrow">Cum funcționează</p>
              <h2 id="cum-functioneaza-title">3 pași și ești gata de drum</h2>
            </div>
            <motion.ol
              className="steps-grid"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={sectionViewport}
            >
              {pasi.map((item) => (
                <motion.li key={item.pas} className="step-card" variants={staggerItem} whileHover={{ y: -4, scale: 1.01 }}>
                  <p className="step-index">{item.pas}</p>
                  <h3>{item.titlu}</h3>
                  <p>{item.text}</p>
                </motion.li>
              ))}
            </motion.ol>
          </motion.section>

          <motion.section
            className="panel"
            id="faq"
            aria-labelledby="faq-title"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={sectionViewport}
          >
            <div className="panel-head">
              <p className="eyebrow">FAQ</p>
              <h2 id="faq-title">Întrebări frecvente</h2>
            </div>
            <motion.div
              className="faq-list"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={sectionViewport}
            >
              {intrebariFrecvente.map((item) => (
                <motion.details key={item.intrebare} variants={staggerItem} whileHover={{ y: -2 }}>
                  <summary>{item.intrebare}</summary>
                  <p>{item.raspuns}</p>
                </motion.details>
              ))}
            </motion.div>
          </motion.section>

          <motion.section
            className="final-cta"
            id="contact"
            aria-labelledby="cta-title"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={sectionViewport}
          >
            <h2 id="cta-title">Vrei să începi fără bătăi de cap?</h2>
            <p>
              Programează o discuție scurtă cu echipa Ridelance și vezi cum îți poți organiza înrolarea
              PFA într-un flux simplu și previzibil.
            </p>
            <a className="btn btn-primary" href="#acasa" onClick={handleAnchorNavigation}>
              Programează consultanța
            </a>
          </motion.section>

          <motion.section
            className="panel"
            id="calculator"
            aria-labelledby="calculator-title"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={sectionViewport}
          >
            <div className="panel-head">
              <p className="eyebrow">Calculator taxe</p>
              <h2 id="calculator-title">Calculează instant ce sistem fiscal este mai avantajos</h2>
            </div>
            <TaxCalculator />
          </motion.section>
        </main>

        <motion.footer variants={fadeUp} initial="hidden" whileInView="visible" viewport={sectionViewport}>
          <p>Ridelance • soluție dedicată șoferilor de ridesharing din România</p>
        </motion.footer>
      </motion.div>
    </>
  )
}

export default App

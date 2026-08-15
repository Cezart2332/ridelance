# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: onboarding.spec.ts >> pasul 1 pe micro-pași >> „Nu" la atestat duce la ecranul de blocaj, cu motivul de la server
- Location: tests/responsive/onboarding.spec.ts:300:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('radio', { name: 'Nu' })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - button "Vezi toți pașii înrolării" [ref=e5] [cursor=pointer]:
    - generic [ref=e6]:
      - img [ref=e8]
      - generic [ref=e10]:
        - paragraph [ref=e11]: Vehicul, copie conformă & ecusoane
        - paragraph [ref=e12]: Blocat
      - paragraph [ref=e13]: 0/6
      - img [ref=e14]
  - generic [ref=e18]:
    - button "Înapoi" [ref=e19] [cursor=pointer]:
      - img [ref=e21]
      - text: Înapoi
    - generic [ref=e23]:
      - generic [ref=e24]:
        - progressbar [ref=e25]:
          - img [ref=e26]
        - progressbar "Progresul înrolării" [ref=e28]:
          - img [ref=e29]
        - paragraph [ref=e31]: "42"
      - generic [ref=e32]: Pasul 42 din 42
  - generic [ref=e34]:
    - generic [ref=e38]:
      - img [ref=e40]
      - paragraph [ref=e42]: VEHICUL
      - heading "Cum deții mașina?" [level=1] [ref=e43]
      - radiogroup "Cum deții mașina?" [ref=e45]:
        - radio "Proprietate" [ref=e46] [cursor=pointer]:
          - heading "Proprietate" [level=6] [ref=e47]
        - radio "Închiriere" [ref=e49] [cursor=pointer]:
          - heading "Închiriere" [level=6] [ref=e50]
        - radio "Leasing" [ref=e52] [cursor=pointer]:
          - heading "Leasing" [level=6] [ref=e53]
        - radio "Comodat" [ref=e55] [cursor=pointer]:
          - heading "Comodat" [level=6] [ref=e56]
        - radio "Adaug mașina mai târziu" [ref=e58] [cursor=pointer]:
          - heading "Adaug mașina mai târziu" [level=6] [ref=e59]
    - generic [ref=e63]:
      - paragraph [ref=e64]: Ce ai de făcut aici
      - generic [ref=e65]:
        - generic [ref=e66]:
          - img [ref=e67]
          - paragraph [ref=e71]: 0%
        - generic [ref=e72]:
          - paragraph [ref=e73]: 0 din 1
          - paragraph [ref=e74]: Vehicul, copie conformă & ecusoane
      - button "Mod de deținere Acum" [ref=e76] [cursor=pointer]:
        - generic [ref=e79]:
          - paragraph [ref=e80]: Mod de deținere
          - paragraph [ref=e81]: Acum
  - link "contact@ridelance.ro" [ref=e83] [cursor=pointer]:
    - /url: mailto:contact@ridelance.ro
```

# Test source

```ts
  209 |     await page.goto('/onboarding/arr', { waitUntil: 'networkidle' })
  210 | 
  211 |     // Pe telefon lista de pași stă în sheet-ul de jos, nu în rail.
  212 |     if (testInfo.project.name === 'mobile') {
  213 |       await page.getByRole('button', { name: 'Vezi toți pașii înrolării' }).click()
  214 |     }
  215 | 
  216 |     // pfa e AwaitingValidation, dar fiscal/arr/platforms rămân accesibile; doar vehicle e blocat.
  217 |     for (const label of ['Fiscal, bancă & semnături', 'Autorizație transport', 'Uber & Bolt']) {
  218 |       await expect(page.getByRole('button', { name: new RegExp(label) }).first()).toBeEnabled()
  219 |     }
  220 |     await expect(page.getByRole('button', { name: /Vehicul, copie conformă/ }).first()).toBeDisabled()
  221 |   })
  222 | 
  223 |   test('documentele din pașii anteriori apar deja încărcate', async ({ page }) => {
  224 |     await stubBackend(page, [
  225 |       // Încărcat la pasul PFA, cerut din nou la ARR.
  226 |       uploadedDoc('CertificatInregistrare', 'certificat.pdf'),
  227 |       // Încărcat la eligibilitate; la ARR cerința se numește „AtestatTransport", categorie echivalentă.
  228 |       uploadedDoc('AtestatSofer', 'atestat.pdf'),
  229 |     ])
  230 |     await page.goto('/onboarding/arr', { waitUntil: 'networkidle' })
  231 | 
  232 |     await expect(page.getByText('certificat.pdf')).toBeVisible()
  233 |     await expect(page.getByText(/de la .PFA./)).toBeVisible()
  234 | 
  235 |     // Categoria echivalentă contează: atestatul urcat la eligibilitate satisface cerința de la ARR.
  236 |     await expect(page.getByText('atestat.pdf')).toBeVisible()
  237 |     await expect(page.getByText(/de la .Eligibilitate./)).toBeVisible()
  238 | 
  239 |     // Cerințele acoperite nu mai cer upload; cele neacoperite, da.
  240 |     await expect(page.getByRole('button', { name: 'Alege fișier' })).toHaveCount(4)
  241 |   })
  242 | })
  243 | 
  244 | test.describe('pasul 1 pe micro-pași', () => {
  245 |   const stubEligibility = (page: Page, documents: unknown[] = [], eligibility: unknown = null) =>
  246 |     stubBackend(page, documents, {
  247 |       state: { ...onboardingState, steps: eligibilityInProgress },
  248 |       eligibility,
  249 |     })
  250 | 
  251 |   test('un singur ecran pe rând, iar contorul avansează', async ({ page }) => {
  252 |     await stubEligibility(page)
  253 |     await page.goto('/onboarding/eligibility', { waitUntil: 'networkidle' })
  254 | 
  255 |     // Primul ecran e o întrebare — și doar întrebarea. Nicio zonă de upload alături.
  256 |     await expect(page.getByRole('heading', { name: 'Ai împlinit 21 de ani?' })).toBeVisible()
  257 |     await expect(page.getByRole('button', { name: 'Alege fișier' })).toHaveCount(0)
  258 |     await expect(page.getByText(/Pasul 1 din \d+/).first()).toBeVisible()
  259 | 
  260 |     // Un singur card pe ecran: un singur titlu de nivel 1.
  261 |     await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  262 | 
  263 |     await page.getByRole('radio', { name: 'Da' }).click()
  264 |     await page.getByRole('button', { name: /Continuă/ }).click()
  265 | 
  266 |     // Ecranul următor e uploadul aferent — și doar el.
  267 |     await expect(page.getByRole('heading', { name: 'Încarcă cartea de identitate' })).toBeVisible()
  268 |     await expect(page.getByRole('radio')).toHaveCount(0)
  269 |     await expect(page.getByText(/Pasul 2 din \d+/).first()).toBeVisible()
  270 |   })
  271 | 
  272 |   test('micro-pasul curent trăiește în URL, deci refresh-ul revine pe același ecran', async ({ page }) => {
  273 |     await stubEligibility(page)
  274 |     await page.goto('/onboarding/eligibility?pas=license', { waitUntil: 'networkidle' })
  275 | 
  276 |     await expect(
  277 |       page.getByRole('heading', { name: 'Ai permis categoria B de minimum 2 ani?' }),
  278 |     ).toBeVisible()
  279 | 
  280 |     await page.reload({ waitUntil: 'networkidle' })
  281 |     await expect(
  282 |       page.getByRole('heading', { name: 'Ai permis categoria B de minimum 2 ani?' }),
  283 |     ).toBeVisible()
  284 |   })
  285 | 
  286 |   test('documentele deja încărcate sar peste ecranele lor', async ({ page }) => {
  287 |     // CI și permisul există deja: fluxul trebuie să aterizeze direct pe întrebarea de atestat.
  288 |     await stubEligibility(
  289 |       page,
  290 |       [uploadedDoc('CarteIdentitate', 'ci.pdf'), uploadedDoc('PermisConducere', 'permis.pdf')],
  291 |       eligibilityProfile(),
  292 |     )
  293 |     await page.goto('/onboarding/eligibility', { waitUntil: 'networkidle' })
  294 | 
  295 |     await expect(
  296 |       page.getByRole('heading', { name: 'Ai atestat de transport alternativ?' }),
  297 |     ).toBeVisible()
  298 |   })
  299 | 
  300 |   test('„Nu" la atestat duce la ecranul de blocaj, cu motivul de la server', async ({ page }) => {
  301 |     const reason = 'Atestatul de transport alternativ este obligatoriu.'
  302 |     await stubEligibility(
  303 |       page,
  304 |       [uploadedDoc('CarteIdentitate', 'ci.pdf'), uploadedDoc('PermisConducere', 'permis.pdf')],
  305 |       eligibilityProfile({ status: 'Ineligible', reasons: [reason] }),
  306 |     )
  307 |     await page.goto('/onboarding/eligibility?pas=attestation', { waitUntil: 'networkidle' })
  308 | 
> 309 |     await page.getByRole('radio', { name: 'Nu' }).click()
      |                                                   ^ Error: locator.click: Test timeout of 30000ms exceeded.
  310 |     await page.getByRole('button', { name: /Continuă/ }).click()
  311 | 
  312 |     await expect(
  313 |       page.getByRole('heading', { name: /nu îndeplinești condițiile de eligibilitate/i }),
  314 |     ).toBeVisible()
  315 |     // Motivul apare și în rail (pasul e „Respins"), deci îl căutăm în lista cardului.
  316 |     await expect(page.getByRole('list', { name: 'Condiții neîndeplinite' })).toContainText(reason)
  317 | 
  318 |     // Nu e o fundătură: rail-ul rămâne întreg și se poate reveni.
  319 |     await expect(page.getByRole('button', { name: 'Înapoi la pasul anterior' })).toBeVisible()
  320 |     await expect(page.getByRole('button', { name: 'Suport' }).first()).toBeVisible()
  321 |   })
  322 | })
  323 | 
```
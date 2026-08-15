# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: onboarding.spec.ts >> onboarding rail >> nu are scroll orizontal și afișează toți pașii
- Location: tests/responsive/onboarding.spec.ts:171:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('[aria-current="step"]')
Expected: 1
Received: 2

Call log:
  - Expect "toHaveCount" with timeout 15000ms
  - waiting for locator('[aria-current="step"]')
    27 × locator resolved to 2 elements
       - unexpected value "2"

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - button [ref=e5] [cursor=pointer]:
      - generic [ref=e6]:
        - img [ref=e8]
        - generic [ref=e10]:
          - paragraph [ref=e11]: Vehicul, copie conformă & ecusoane
          - paragraph [ref=e12]: Blocat
        - paragraph [ref=e13]: 0/6
        - img [ref=e14]
    - generic [ref=e18]:
      - button [ref=e19] [cursor=pointer]:
        - img [ref=e21]
        - text: Înapoi
      - generic [ref=e23]:
        - generic [ref=e24]:
          - progressbar [ref=e25]:
            - img [ref=e26]
          - progressbar [ref=e28]:
            - img [ref=e29]
          - paragraph [ref=e31]: "42"
        - generic [ref=e32]: Pasul 42 din 42
    - generic [ref=e34]:
      - generic [ref=e38]:
        - img [ref=e40]
        - paragraph [ref=e42]: VEHICUL
        - heading [level=1] [ref=e43]: Cum deții mașina?
        - radiogroup [ref=e45]:
          - radio [ref=e46] [cursor=pointer]:
            - heading [level=6] [ref=e47]: Proprietate
          - radio [ref=e49] [cursor=pointer]:
            - heading [level=6] [ref=e50]: Închiriere
          - radio [ref=e52] [cursor=pointer]:
            - heading [level=6] [ref=e53]: Leasing
          - radio [ref=e55] [cursor=pointer]:
            - heading [level=6] [ref=e56]: Comodat
          - radio [ref=e58] [cursor=pointer]:
            - heading [level=6] [ref=e59]: Adaug mașina mai târziu
      - generic [ref=e63]:
        - paragraph [ref=e64]: Ce ai de făcut aici
        - generic [ref=e65]:
          - generic [ref=e66]:
            - img [ref=e67]
            - paragraph [ref=e71]: 0%
          - generic [ref=e72]:
            - paragraph [ref=e73]: 0 din 1
            - paragraph [ref=e74]: Vehicul, copie conformă & ecusoane
        - button [ref=e76] [cursor=pointer]:
          - generic [ref=e79]:
            - paragraph [ref=e80]: Mod de deținere
            - paragraph [ref=e81]: Acum
    - link [ref=e83] [cursor=pointer]:
      - /url: mailto:contact@ridelance.ro
      - text: contact@ridelance.ro
  - dialog [active] [ref=e85]:
    - list [ref=e87]:
      - listitem [ref=e88]:
        - button "Eligibilitate — Blocat" [disabled] [ref=e89]:
          - generic [ref=e90]:
            - img [ref=e92]
            - paragraph [ref=e94]: Eligibilitate
      - listitem [ref=e95]:
        - button "PFA — Blocat" [disabled] [ref=e96]:
          - generic [ref=e97]:
            - img [ref=e99]
            - paragraph [ref=e101]: PFA
      - listitem [ref=e102]:
        - button "Fiscal, bancă & semnături — Blocat" [disabled] [ref=e103]:
          - generic [ref=e104]:
            - img [ref=e106]
            - paragraph [ref=e108]: Fiscal, bancă & semnături
      - listitem [ref=e109]:
        - button "Autorizație transport — Blocat" [disabled] [ref=e110]:
          - generic [ref=e111]:
            - img [ref=e113]
            - paragraph [ref=e115]: Autorizație transport
      - listitem [ref=e116]:
        - button "Uber & Bolt — Blocat" [disabled] [ref=e117]:
          - generic [ref=e118]:
            - img [ref=e120]
            - paragraph [ref=e122]: Uber & Bolt
      - listitem [ref=e123]:
        - generic "Finalizează întâi pasul „Autorizație transport”." [ref=e124]:
          - button "Vehicul, copie conformă & ecusoane — Blocat" [disabled] [ref=e125]:
            - generic [ref=e126]:
              - img [ref=e128]
              - paragraph [ref=e130]: Vehicul, copie conformă & ecusoane
```

# Test source

```ts
  86  |   allSectionsValidated: false,
  87  |   steps,
  88  |   testSkipEnabled: false,
  89  | }
  90  | 
  91  | /** Un document încărcat la un pas anterior, exact cum îl întoarce `GET /documents`. */
  92  | const uploadedDoc = (category: string, fileName: string) => ({
  93  |   id: `doc-${category}`,
  94  |   originalFileName: fileName,
  95  |   contentType: 'application/pdf',
  96  |   category,
  97  |   status: 'Pending',
  98  |   fileSize: 1024,
  99  |   uploadedAtUtc: '2026-08-01T09:00:00Z',
  100 |   expiresAtUtc: null,
  101 |   aiStatus: 'Passed',
  102 |   aiSummary: null,
  103 |   aiDetectedType: null,
  104 |   aiExtractedExpiresAtUtc: null,
  105 |   aiRequiresManualReview: false,
  106 | })
  107 | 
  108 | /** Aceeași listă, dar cu pasul 1 încă în lucru — punctul de plecare al micro-pașilor. */
  109 | const eligibilityInProgress = steps.map((step) =>
  110 |   step.key === 'eligibility' ? { ...step, status: 'InProgress' } : step,
  111 | )
  112 | 
  113 | /** Profilul de eligibilitate, exact cum îl întoarce `GET /onboarding/eligibility`. */
  114 | const eligibilityProfile = (overrides: Record<string, unknown> = {}) => ({
  115 |   id: 'e1',
  116 |   dateOfBirth: '1990-01-01',
  117 |   idSeriesMask: null,
  118 |   categoryBObtainedOn: '2015-01-01',
  119 |   drivingCategories: 'B',
  120 |   drivingLicenceExpiresOn: '2030-01-01',
  121 |   hasDriverCertificate: false,
  122 |   driverCertificateExpiresOn: null,
  123 |   status: 'NeedsReview',
  124 |   reasons: [],
  125 |   ...overrides,
  126 | })
  127 | 
  128 | async function stubBackend(
  129 |   page: Page,
  130 |   documents: unknown[] = [],
  131 |   overrides: { state?: unknown; eligibility?: unknown } = {},
  132 | ) {
  133 |   /**
  134 |    * Cererile pleacă de pe originea Vite către `localhost:5000`, deci sunt cross-origin și
  135 |    * credențializate (`withCredentials: true`). Browserul respinge un `Allow-Origin: *` combinat cu
  136 |    * `Allow-Credentials: true`, așa că răspunsul stubuit trebuie să reflecte originea cerută. La fel,
  137 |    * preflight-ul OPTIONS trebuie servit explicit, altfel cererea reală nici nu pleacă.
  138 |    */
  139 |   const cors = (origin: string) => ({
  140 |     'Access-Control-Allow-Origin': origin,
  141 |     'Access-Control-Allow-Credentials': 'true',
  142 |     'Access-Control-Allow-Headers': 'authorization,content-type',
  143 |     'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  144 |   })
  145 | 
  146 |   const reply = (body: unknown) => async (route: Route) => {
  147 |     const headers = cors((await route.request().headerValue('origin')) ?? '*')
  148 |     if (route.request().method() === 'OPTIONS') {
  149 |       return route.fulfill({ status: 204, headers })
  150 |     }
  151 |     return route.fulfill({
  152 |       status: 200,
  153 |       contentType: 'application/json',
  154 |       headers,
  155 |       body: JSON.stringify(body),
  156 |     })
  157 |   }
  158 | 
  159 |   // Playwright rulează ultima rută înregistrată prima, deci catch-all-ul se declară primul.
  160 |   await page.route(`${API}/**`, reply(null))
  161 |   await page.route(
  162 |     `${API}/users/refresh-token`,
  163 |     reply({ accessToken: 'test-token', role: 'Client', userId: 'u1' }),
  164 |   )
  165 |   await page.route(`${API}/onboarding/state`, reply(overrides.state ?? onboardingState))
  166 |   await page.route(`${API}/documents**`, reply(documents))
  167 |   await page.route(`${API}/onboarding/eligibility`, reply(overrides.eligibility ?? null))
  168 | }
  169 | 
  170 | test.describe('onboarding rail', () => {
  171 |   test('nu are scroll orizontal și afișează toți pașii', async ({ page }, testInfo) => {
  172 |     const mobile = testInfo.project.name === 'mobile'
  173 |     await page.setViewportSize(mobile ? { width: 375, height: 812 } : { width: 1440, height: 1000 })
  174 | 
  175 |     await stubBackend(page)
  176 |     await page.goto('/onboarding/arr', { waitUntil: 'networkidle' })
  177 | 
  178 |     // Rail-ul (desktop) sau sheet-ul (mobil) conțin aceeași listă semantică de pași.
  179 |     if (mobile) {
  180 |       await page.getByRole('button', { name: 'Vezi toți pașii înrolării' }).click()
  181 |     }
  182 |     const railSteps = page.locator('ol > li')
  183 |     await expect(railSteps).toHaveCount(steps.length)
  184 | 
  185 |     // Pasul curent e marcat pentru cititoarele de ecran.
> 186 |     await expect(page.locator('[aria-current="step"]')).toHaveCount(1)
      |                                                         ^ Error: expect(locator).toHaveCount(expected) failed
  187 | 
  188 |     // Stările se citesc din text, nu doar din culoare.
  189 |     await expect(page.getByText('În verificare').first()).toBeVisible()
  190 |     await expect(page.getByText('Blocat').first()).toBeVisible()
  191 |     await expect(page.getByText('Validat').first()).toBeVisible()
  192 | 
  193 |     // Sheet-ul se închide complet înainte de captură, altfel screenshot-ul prinde animația.
  194 |     if (mobile) {
  195 |       await page.keyboard.press('Escape')
  196 |       await expect(page.locator('.MuiDrawer-root .MuiPaper-root')).toBeHidden()
  197 |     }
  198 | 
  199 |     const screenshotDir = `test-results/responsive/screenshots/${testInfo.project.name}`
  200 |     mkdirSync(screenshotDir, { recursive: true })
  201 |     await page.screenshot({ path: `${screenshotDir}/onboarding-arr.png`, fullPage: true })
  202 | 
  203 |     const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  204 |     expect(overflow).toBeLessThanOrEqual(2)
  205 |   })
  206 | 
  207 |   test('un pas în verificare nu blochează pașii independenți', async ({ page }, testInfo) => {
  208 |     await stubBackend(page)
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
```
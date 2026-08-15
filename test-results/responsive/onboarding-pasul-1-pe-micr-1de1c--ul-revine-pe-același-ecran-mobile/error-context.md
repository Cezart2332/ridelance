# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: onboarding.spec.ts >> pasul 1 pe micro-pași >> micro-pasul curent trăiește în URL, deci refresh-ul revine pe același ecran
- Location: tests/responsive/onboarding.spec.ts:272:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Ai permis categoria B de minimum 2 ani?' })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByRole('heading', { name: 'Ai permis categoria B de minimum 2 ani?' })

```

```yaml
- button "Vezi toți pașii înrolării":
  - paragraph: Vehicul, copie conformă & ecusoane
  - paragraph: Blocat
  - paragraph: 0/6
- button "Înapoi"
- progressbar "Progresul înrolării":
  - img
- paragraph: "42"
- text: Pasul 42 din 42
- paragraph: VEHICUL
- heading "Cum deții mașina?" [level=1]
- radiogroup "Cum deții mașina?":
  - radio "Proprietate":
    - heading "Proprietate" [level=6]
  - radio "Închiriere":
    - heading "Închiriere" [level=6]
  - radio "Leasing":
    - heading "Leasing" [level=6]
  - radio "Comodat":
    - heading "Comodat" [level=6]
  - radio "Adaug mașina mai târziu":
    - heading "Adaug mașina mai târziu" [level=6]
- paragraph: Ce ai de făcut aici
- paragraph: 0%
- paragraph: 0 din 1
- paragraph: Vehicul, copie conformă & ecusoane
- button "Mod de deținere Acum":
  - paragraph: Mod de deținere
  - paragraph: Acum
- link "contact@ridelance.ro":
  - /url: mailto:contact@ridelance.ro
```

# Test source

```ts
  178 |     // Rail-ul (desktop) sau sheet-ul (mobil) conțin aceeași listă semantică de pași.
  179 |     if (mobile) {
  180 |       await page.getByRole('button', { name: 'Vezi toți pașii înrolării' }).click()
  181 |     }
  182 |     const railSteps = page.locator('ol > li')
  183 |     await expect(railSteps).toHaveCount(steps.length)
  184 | 
  185 |     // Pasul curent e marcat pentru cititoarele de ecran.
  186 |     await expect(page.locator('[aria-current="step"]')).toHaveCount(1)
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
> 278 |     ).toBeVisible()
      |       ^ Error: expect(locator).toBeVisible() failed
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
  309 |     await page.getByRole('radio', { name: 'Nu' }).click()
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
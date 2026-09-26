import { useState } from 'react'
import { Alert, Button, Paper, Stack, Tab, Tabs, TextField, Typography } from '@mui/material'

import { accountingApi } from '../../api/accountingApi'
import {
  D100_RULE_CODES,
  DECLARATION_TYPES,
  DEDUCTIBILITY_TYPES,
  type AnafDeclarationSchema,
  type D100Rule,
  type ExchangeRate,
  type ExpenseCategoryRule,
  type RuleInput,
  type SupplierTaxProfile,
  type VatRate,
} from '../../api/types'
import { formatDate, formatRate } from '../../format'
import { DEDUCTIBILITY_TYPE_LABEL } from '../../statusLabels'
import { StatusBadge } from '../../../../components/admin'
import { useAccountingNav } from '../navigation'
import { errorMessage } from '../useApi'
import { RuleTable, type RuleField } from './RuleTable'

const SECTIONS = ['furnizori', 'tva', 'd100', 'anaf', 'categorii', 'curs'] as const
type Section = (typeof SECTIONS)[number]

const SECTION_LABEL: Record<Section, string> = {
  furnizori: 'Furnizori',
  tva: 'Cote TVA',
  d100: 'Reguli D100',
  anaf: 'Scheme ANAF',
  categorii: 'Categorii cheltuieli',
  curs: 'Curs valutar',
}

/** Avertismentul pentru certificatul de rezidență care expiră în mai puțin de 60 de zile. */
function CertificateStatus({ validTo, now }: { validTo: string | null; now: number }) {
  if (!validTo) return <StatusBadge label="Fără certificat" tone="warning" />
  const days = Math.ceil((new Date(`${validTo}T00:00:00`).getTime() - now) / 864e5)
  if (days < 0) return <StatusBadge label={`Expirat la ${formatDate(validTo)}`} tone="error" />
  if (days < 60) return <StatusBadge label={`Expiră în ${days} ${days === 1 ? 'zi' : 'zile'}`} tone="warning" />
  return <Typography variant="body2">până la {formatDate(validTo)}</Typography>
}

const validityFields = <T extends { id: string }>(): RuleField<T>[] => [
  { key: 'validFrom' as RuleField<T>['key'], label: 'Valabil de la', kind: 'date' },
  { key: 'validTo' as RuleField<T>['key'], label: 'Valabil până la', kind: 'date', nullable: true },
]

const today = () => new Date().toISOString().slice(0, 10)

const SUPPLIER_EMPTY: RuleInput<SupplierTaxProfile> = {
  supplierName: '',
  country: '',
  vatId: '',
  incomeType: 'COMMISSION',
  treaty: null,
  d100Rate: null,
  d100RateConfirmed: false,
  validFrom: today(),
  validTo: null,
  residenceCertValidFrom: null,
  residenceCertValidTo: null,
  residenceCertFile: null,
  note: null,
}

function ExchangeRateLookup() {
  const [currency, setCurrency] = useState('EUR')
  const [date, setDate] = useState(today())
  const [result, setResult] = useState<{ rate: ExchangeRate | null; error: string | null } | null>(null)

  const lookup = async () => {
    try {
      setResult({ rate: await accountingApi.rules.getExchangeRate({ currency, date }), error: null })
    } catch (error) {
      setResult({ rate: null, error: errorMessage(error) })
    }
  }

  return (
    <Paper sx={{ p: 2.5 }}>
      <Stack spacing={2}>
        <Typography variant="h2">Curs valutar</Typography>
        <Typography variant="body2" color="text.secondary">
          Cursul folosit la conversia facturilor în valută. Sursa și ziua cursului sunt DE CONFIRMAT cu contabilul.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
          <TextField label="Monedă" value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} />
          <TextField type="date" label="Data" value={date} onChange={(event) => setDate(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <Button variant="outlined" onClick={lookup}>
            Caută
          </Button>
        </Stack>
        {result?.error && <Alert severity="error">{result.error}</Alert>}
        {result && !result.error && (
          <Typography variant="body2">
            {result.rate
              ? `1 ${result.rate.currency} = ${result.rate.rate} lei la ${formatDate(result.rate.date)} (${result.rate.source})`
              : `Niciun curs ${currency} până la ${formatDate(date)}.`}
          </Typography>
        )}
      </Stack>
    </Paper>
  )
}

/**
 * F5: „Reguli fiscale”. Tabelele editabile cu valabilitate; nicio regulă nu se șterge, ci se
 * închide prin „Valabil până la”.
 */
export function TaxRulesView() {
  const nav = useAccountingNav()
  const [section, setSection] = useState<Section>('furnizori')
  const prefill = nav.supplierPrefill
  const [now] = useState(() => Date.now())

  const supplierFields: RuleField<SupplierTaxProfile>[] = [
    { key: 'supplierName', label: 'Furnizor', kind: 'text' },
    { key: 'country', label: 'Țară (cod ISO)', kind: 'text' },
    { key: 'vatId', label: 'Cod TVA', kind: 'text' },
    { key: 'incomeType', label: 'Tip venit', kind: 'select', options: [{ value: 'COMMISSION', label: 'Comision platformă' }] },
    { key: 'treaty', label: 'Convenție de evitare a dublei impuneri', kind: 'text', nullable: true },
    { key: 'd100Rate', label: 'Cotă D100 (%)', kind: 'number', nullable: true },
    { key: 'd100RateConfirmed', label: 'Cotă D100 confirmată de contabil', kind: 'bool' },
    ...validityFields<SupplierTaxProfile>(),
    { key: 'residenceCertValidFrom', label: 'Certificat de rezidență de la', kind: 'date', nullable: true },
    { key: 'residenceCertValidTo', label: 'Certificat de rezidență până la', kind: 'date', nullable: true },
    { key: 'note', label: 'Observație', kind: 'text', nullable: true },
  ]

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h1">Reguli fiscale</Typography>
        <Typography variant="body2" color="text.secondary">
          Cote, furnizori și scheme cu perioadă de valabilitate. Declarațiile deja generate păstrează regulile din momentul generării.
        </Typography>
      </Stack>

      <Paper sx={{ px: 1 }}>
        <Tabs value={section} onChange={(_, value: Section) => setSection(value)} variant="scrollable" allowScrollButtonsMobile>
          {SECTIONS.map((item) => (
            <Tab key={item} value={item} label={SECTION_LABEL[item]} />
          ))}
        </Tabs>
      </Paper>

      {section === 'furnizori' && (
        <RuleTable<SupplierTaxProfile>
          title="Registrul de furnizori"
          description="Entitățile platformelor, cu cota D100 și certificatul de rezidență."
          resource={accountingApi.rules.suppliers}
          fields={supplierFields}
          empty={SUPPLIER_EMPTY}
          prefill={prefill ? { supplierName: prefill.supplierName ?? '', country: prefill.country ?? '', vatId: prefill.vatId ?? '' } : null}
          onPrefillUsed={() => prefill && nav.openRules()}
          columns={[
            {
              label: 'Furnizor',
              render: (item) => (
                <>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {item.supplierName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.country} · {item.vatId}
                  </Typography>
                  {item.note && (
                    <Typography variant="caption" color="warning.main" component="div">
                      {item.note}
                    </Typography>
                  )}
                </>
              ),
            },
            { label: 'Convenție', render: (item) => item.treaty ?? '—' },
            {
              label: 'Cotă D100',
              render: (item) => (
                <Stack spacing={0.5} sx={{ alignItems: 'flex-start' }}>
                  <Typography variant="body2">{formatRate(item.d100Rate)}</Typography>
                  {!item.d100RateConfirmed && <StatusBadge label="Neconfirmată" tone="warning" />}
                </Stack>
              ),
            },
            { label: 'Certificat de rezidență', render: (item) => <CertificateStatus validTo={item.residenceCertValidTo} now={now} /> },
          ]}
        />
      )}

      {section === 'tva' && (
        <RuleTable<VatRate>
          title="Cote TVA"
          resource={accountingApi.rules.vatRates}
          fields={[{ key: 'rate', label: 'Cotă (%)', kind: 'number' }, ...validityFields<VatRate>()]}
          empty={{ rate: 21, validFrom: today(), validTo: null }}
          columns={[{ label: 'Cotă', render: (item) => formatRate(item.rate) }]}
        />
      )}

      {section === 'd100' && (
        <RuleTable<D100Rule>
          title="Reguli D100"
          description="D100_RENT_INDIVIDUAL rămâne dezactivată până la confirmarea regulii (bază, cotă, sursa datelor)."
          resource={accountingApi.rules.d100}
          fields={[
            { key: 'code', label: 'Cod', kind: 'select', options: D100_RULE_CODES.map((code) => ({ value: code, label: code })) },
            { key: 'description', label: 'Descriere', kind: 'text' },
            { key: 'enabled', label: 'Activă', kind: 'bool' },
            { key: 'pendingConfirmation', label: 'DE CONFIRMAT cu contabilul', kind: 'bool', readOnly: true },
            ...validityFields<D100Rule>(),
          ]}
          empty={{ code: 'D100_COMMISSION_NONRESIDENT', description: '', enabled: false, pendingConfirmation: true, parameters: {}, validFrom: today(), validTo: null }}
          columns={[
            { label: 'Cod', render: (item) => item.code },
            { label: 'Descriere', render: (item) => item.description },
            {
              label: 'Stare',
              render: (item) => (
                <Stack direction="row" sx={{ gap: 0.5, flexWrap: 'wrap' }}>
                  <StatusBadge label={item.enabled ? 'Activă' : 'Dezactivată'} tone={item.enabled ? 'success' : 'neutral'} />
                  {item.pendingConfirmation && <StatusBadge label="DE CONFIRMAT" tone="warning" />}
                </Stack>
              ),
            },
          ]}
        />
      )}

      {section === 'anaf' && (
        <RuleTable<AnafDeclarationSchema>
          title="Scheme ANAF"
          description="Versiunea XSD și a validatorului, selectată după perioada declarației. Fișierele XSD oficiale se încarcă în B4."
          resource={accountingApi.rules.anafSchemas}
          fields={[
            { key: 'declarationType', label: 'Declarație', kind: 'select', options: DECLARATION_TYPES.map((type) => ({ value: type, label: type })) },
            { key: 'version', label: 'Versiune', kind: 'text' },
            { key: 'validatorVersion', label: 'Versiune validator', kind: 'text', nullable: true },
            ...validityFields<AnafDeclarationSchema>(),
          ]}
          empty={{ declarationType: 'D100', version: '', xsdFile: null, validatorVersion: null, validFrom: today(), validTo: null }}
          columns={[
            { label: 'Declarație', render: (item) => item.declarationType },
            { label: 'Versiune', render: (item) => item.version },
            { label: 'Fișier XSD', render: (item) => item.xsdFile?.fileName ?? '—' },
            { label: 'Validator', render: (item) => item.validatorVersion ?? '—' },
          ]}
        />
      )}

      {section === 'categorii' && (
        <RuleTable<ExpenseCategoryRule>
          title="Categorii de cheltuieli"
          description="Clasificarea deterministă a tranzacțiilor. Pentru cheltuielile auto, procentul vine din setarea de deductibilitate a PFA-ului."
          resource={accountingApi.rules.expenseCategories}
          fields={[
            { key: 'category', label: 'Cod categorie', kind: 'text' },
            { key: 'label', label: 'Denumire', kind: 'text' },
            { key: 'vehicleRelated', label: 'Legată de autovehicul', kind: 'bool' },
            {
              key: 'defaultDeductibility',
              label: 'Deductibilitate implicită',
              kind: 'select',
              options: DEDUCTIBILITY_TYPES.map((type) => ({ value: type, label: DEDUCTIBILITY_TYPE_LABEL[type] })),
            },
            { key: 'counterpartyPattern', label: 'Contrapartidă (regex)', kind: 'text', nullable: true, helperText: 'De ex. OMV|PETROM|MOL' },
            ...validityFields<ExpenseCategoryRule>(),
          ]}
          empty={{ category: '', label: '', vehicleRelated: false, defaultDeductibility: '100_PERCENT', counterpartyPattern: null, validFrom: today(), validTo: null }}
          columns={[
            { label: 'Categorie', render: (item) => `${item.label} (${item.category})` },
            { label: 'Auto', render: (item) => (item.vehicleRelated ? 'Da' : 'Nu') },
            { label: 'Deductibilitate implicită', render: (item) => DEDUCTIBILITY_TYPE_LABEL[item.defaultDeductibility] },
            { label: 'Contrapartidă', render: (item) => item.counterpartyPattern ?? '—' },
          ]}
        />
      )}

      {section === 'curs' && <ExchangeRateLookup />}
    </Stack>
  )
}

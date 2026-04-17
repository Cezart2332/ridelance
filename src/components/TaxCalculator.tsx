import { Button, HStack, Input, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { useMemo, useState, type ChangeEvent } from 'react'
import {
  calculateNormaSystem,
  calculateRealSystem,
  formatRon,
  GROSS_MINIMUM_SALARY,
  UBER_BOLT_ANNUAL_INCOME_NORM,
  type TaxConfig,
  type TaxSystem,
} from '../lib/taxCalculator'
import { palette } from '../lib/palette'

const DEFAULT_VALUES: TaxConfig = {
  yearlyIncome: 96000,
  yearlyDeductibleExpenses: 12000,
}

const DEFAULT_INPUT_VALUES: Record<keyof TaxConfig, string> = {
  yearlyIncome: String(DEFAULT_VALUES.yearlyIncome),
  yearlyDeductibleExpenses: String(DEFAULT_VALUES.yearlyDeductibleExpenses),
}

const subtleCardMotion = {
  transition: 'transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
  willChange: 'transform',
  _hover: {
    transform: 'translateY(-1px)',
    borderColor: 'rgba(220, 247, 99, 0.34)',
    boxShadow: '0 8px 18px rgba(0, 0, 0, 0.18)',
  },
} as const

function toPositiveNumber(value: string) {
  if (value.trim() === '') {
    return 0
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }

  return parsed
}

function normalizeNumberInput(value: string) {
  const digitsOnly = value.replace(/\D+/g, '')
  if (digitsOnly.length === 0) {
    return ''
  }

  return digitsOnly.replace(/^0+(?=\d)/, '')
}

export default function TaxCalculator() {
  const [taxSystem, setTaxSystem] = useState<TaxSystem>('real')
  const [formInputs, setFormInputs] = useState<Record<keyof TaxConfig, string>>(DEFAULT_INPUT_VALUES)

  const form = useMemo<TaxConfig>(
    () => ({
      yearlyIncome: toPositiveNumber(formInputs.yearlyIncome),
      yearlyDeductibleExpenses: toPositiveNumber(formInputs.yearlyDeductibleExpenses),
    }),
    [formInputs],
  )

  const realResult = useMemo(() => calculateRealSystem(form), [form])
  const normaResult = useMemo(() => calculateNormaSystem(form), [form])

  const selected = taxSystem === 'real' ? realResult : normaResult
  const alternative = taxSystem === 'real' ? normaResult : realResult
  const lostMoney = Math.max(0, alternative.moneyKept - selected.moneyKept)
  const bestSystem: TaxSystem = realResult.moneyKept >= normaResult.moneyKept ? 'real' : 'norma'

  const handleNumberChange =
    (key: keyof TaxConfig) => (event: ChangeEvent<HTMLInputElement>) => {
      setFormInputs((previous) => ({
        ...previous,
        [key]: normalizeNumberInput(event.target.value),
      }))
    }

  return (
    <Stack
      aria-label="Calculator taxe PFA"
      gap="4"
      borderWidth="1px"
      borderColor={palette.border}
      borderRadius="20px"
      p={{ base: '4', md: '6' }}
      bgGradient="linear(180deg, rgba(13, 18, 21, 0.84) 0%, rgba(13, 18, 21, 0.65) 100%)"
    >
      <SimpleGrid columns={{ base: 1, md: 2 }} gap="3">
        <Stack gap="2">
          <Text fontSize="sm" color={palette.textSoft}>
            Venit anual estimat (RON)
          </Text>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={formInputs.yearlyIncome}
            onChange={handleNumberChange('yearlyIncome')}
            borderColor={palette.border}
            bg="rgba(8, 12, 14, 0.6)"
            color={palette.text}
            _hover={{ borderColor: palette.mid }}
            _focusVisible={{ borderColor: palette.lime, boxShadow: '0 0 0 1px #DCF763' }}
          />
        </Stack>

        <Stack gap="2">
          <Text fontSize="sm" color={palette.textSoft}>
            Cheltuieli deductibile anuale
          </Text>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={formInputs.yearlyDeductibleExpenses}
            onChange={handleNumberChange('yearlyDeductibleExpenses')}
            placeholder="Ex: 12000"
            borderColor={palette.border}
            bg="rgba(8, 12, 14, 0.6)"
            color={palette.text}
            _hover={{ borderColor: palette.mid }}
            _focusVisible={{ borderColor: palette.lime, boxShadow: '0 0 0 1px #DCF763' }}
          />
        </Stack>
      </SimpleGrid>

      <HStack gap="2" role="group" aria-label="Tip impozitare" flexWrap="wrap">
        <Button
          type="button"
          onClick={() => setTaxSystem('real')}
          borderRadius="full"
          variant="outline"
          borderColor={taxSystem === 'real' ? 'rgba(220, 247, 99, 0.7)' : palette.border}
          bg={taxSystem === 'real' ? 'rgba(220, 247, 99, 0.16)' : 'rgba(19, 25, 29, 0.8)'}
          color={palette.text}
          _hover={{ bg: 'rgba(220, 247, 99, 0.18)' }}
        >
          Sistem Real
        </Button>
        <Button
          type="button"
          onClick={() => setTaxSystem('norma')}
          borderRadius="full"
          variant="outline"
          borderColor={taxSystem === 'norma' ? 'rgba(220, 247, 99, 0.7)' : palette.border}
          bg={taxSystem === 'norma' ? 'rgba(220, 247, 99, 0.16)' : 'rgba(19, 25, 29, 0.8)'}
          color={palette.text}
          _hover={{ bg: 'rgba(220, 247, 99, 0.18)' }}
        >
          Normă de venit
        </Button>
      </HStack>

      <Text color={palette.textSoft} fontSize="sm">
        Salariul minim brut folosit în calcule: <Text as="strong">{formatRon(GROSS_MINIMUM_SALARY)} RON</Text>.
      </Text>
      <Text color={palette.textSoft} fontSize="sm">
        Normă anuală Uber / Bolt: <Text as="strong">{formatRon(UBER_BOLT_ANNUAL_INCOME_NORM)} RON</Text>.
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap="3">
        <Stack borderWidth="1px" borderColor={palette.border} borderRadius="14px" p="4" bg={palette.surfaceAlt} gap="2" {...subtleCardMotion}>
          <Text color={palette.textSoft} fontSize="xs">
            Venit anual real (input)
          </Text>
          <Text fontWeight="700" fontSize="xl">
            {formatRon(form.yearlyIncome)} RON
          </Text>
        </Stack>
        <Stack borderWidth="1px" borderColor={palette.border} borderRadius="14px" p="4" bg={palette.surfaceAlt} gap="2" {...subtleCardMotion}>
          <Text color={palette.textSoft} fontSize="xs">
            {taxSystem === 'norma' ? 'Normă de venit (bază taxare)' : 'Bază taxare (venit - cheltuieli)'}
          </Text>
          <Text fontWeight="700" fontSize="xl">
            {formatRon(selected.taxBase)} RON
          </Text>
        </Stack>
        <Stack borderWidth="1px" borderColor={palette.border} borderRadius="14px" p="4" bg={palette.surfaceAlt} gap="2" {...subtleCardMotion}>
          <Text color={palette.textSoft} fontSize="xs">
            Total taxe
          </Text>
          <Text fontWeight="700" fontSize="xl">
            {formatRon(selected.breakdown.totalTaxes)} RON
          </Text>
        </Stack>
        <Stack borderWidth="1px" borderColor={palette.border} borderRadius="14px" p="4" bg={palette.surfaceAlt} gap="2" {...subtleCardMotion}>
          <Text color={palette.textSoft} fontSize="xs">
            Bani finali
          </Text>
          <Text fontWeight="700" fontSize="xl">
            {formatRon(selected.moneyKept)} RON
          </Text>
        </Stack>
      </SimpleGrid>

      <Stack gap="1" color={palette.textSoft}>
        <Text>Impozit pe venit: {formatRon(selected.breakdown.incomeTax)} RON</Text>
        <Text>CAS: {formatRon(selected.breakdown.cas)} RON</Text>
        <Text>CASS: {formatRon(selected.breakdown.cass)} RON</Text>
      </Stack>

      <Stack borderWidth="1px" borderColor={palette.border} borderRadius="14px" p="4" bg={palette.surfaceAlt} gap="2" {...subtleCardMotion}>
        <Text>
          Sistem Real: <strong>{formatRon(realResult.moneyKept)} RON</strong>
        </Text>
        <Text>
          Normă de venit: <strong>{formatRon(normaResult.moneyKept)} RON</strong>
        </Text>
        <Text color={lostMoney > 0 ? '#FF9B9B' : '#B6F98C'} fontWeight="700">
          {lostMoney > 0
            ? `Pierzi ${formatRon(lostMoney)} RON dacă alegi sistemul greșit.`
            : `Alegi deja varianta optimă (${bestSystem === 'real' ? 'Sistem Real' : 'Normă de venit'}).`}
        </Text>
      </Stack>
    </Stack>
  )
}
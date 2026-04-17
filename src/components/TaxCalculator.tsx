import { Button, HStack, Icon, Input, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { FiAlertTriangle, FiCheckCircle, FiDollarSign, FiTrendingUp } from 'react-icons/fi'
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
import { getPalette, type ThemeMode } from '../lib/palette'

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

interface TaxCalculatorProps {
  themeMode?: ThemeMode
}

export default function TaxCalculator({ themeMode = 'dark' }: TaxCalculatorProps) {
  const palette = getPalette(themeMode)
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
      bg={palette.surface}
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
            bg={palette.inputBg}
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
            bg={palette.inputBg}
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
          bg={taxSystem === 'real' ? 'rgba(220, 247, 99, 0.16)' : palette.toggleIdleBg}
          color={palette.text}
          _hover={{ bg: 'rgba(220, 247, 99, 0.18)' }}
        >
          <HStack gap="1.5">
            <Icon as={FiTrendingUp} boxSize="4" />
            <Text as="span">Sistem Real</Text>
          </HStack>
        </Button>
        <Button
          type="button"
          onClick={() => setTaxSystem('norma')}
          borderRadius="full"
          variant="outline"
          borderColor={taxSystem === 'norma' ? 'rgba(220, 247, 99, 0.7)' : palette.border}
          bg={taxSystem === 'norma' ? 'rgba(220, 247, 99, 0.16)' : palette.toggleIdleBg}
          color={palette.text}
          _hover={{ bg: 'rgba(220, 247, 99, 0.18)' }}
        >
          <HStack gap="1.5">
            <Icon as={FiDollarSign} boxSize="4" />
            <Text as="span">Normă de venit</Text>
          </HStack>
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
          <HStack gap="1.5" color={palette.textSoft} fontSize="xs">
            <Icon as={FiDollarSign} boxSize="3.5" />
            <Text>Venit anual real (input)</Text>
          </HStack>
          <Text fontWeight="700" fontSize="xl">
            {formatRon(form.yearlyIncome)} RON
          </Text>
        </Stack>
        <Stack borderWidth="1px" borderColor={palette.border} borderRadius="14px" p="4" bg={palette.surfaceAlt} gap="2" {...subtleCardMotion}>
          <HStack gap="1.5" color={palette.textSoft} fontSize="xs">
            <Icon as={FiTrendingUp} boxSize="3.5" />
            <Text>{taxSystem === 'norma' ? 'Normă de venit (bază taxare)' : 'Bază taxare (venit - cheltuieli)'}</Text>
          </HStack>
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
        <HStack gap="1.5" align="center" color={lostMoney > 0 ? palette.warning : palette.success} fontWeight="700">
          <Icon as={lostMoney > 0 ? FiAlertTriangle : FiCheckCircle} boxSize="4" />
          <Text as="span">
            {lostMoney > 0
              ? `Pierzi ${formatRon(lostMoney)} RON dacă alegi sistemul greșit.`
              : `Alegi deja varianta optimă (${bestSystem === 'real' ? 'Sistem Real' : 'Normă de venit'}).`}
          </Text>
        </HStack>
      </Stack>
    </Stack>
  )
}
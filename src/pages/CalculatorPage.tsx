import { useState, useCallback } from 'react'
import { Box, Button, Container, Paper, Stack, TextField, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { TOKENS } from '../constants/tokens'
import { SectionHeader } from '../components/common/SectionHeader'
import { TaxRow } from '../components/common/TaxRow'
import { DeductibleExpensesList } from '../components/fiscal/DeductibleExpensesList'
import { pageFrameSx } from '../constants/layout'

export function CalculatorPage() {
  const GROSS_SALARY = 4050

  const roundToInt = (value: number) => Math.round(value)
  const toNumber = (value: string) => {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }

  const [anualIncome, setAnualIncome] = useState(0)
  const [deductibleExpenses, setDeductibleExpenses] = useState(0)
  const [realIncomeTax, setRealIncomeTax] = useState(0)
  const [realCAS, setRealCAS] = useState(0)
  const [realCASS, setRealCASS] = useState(0)
  const [netIncomeRealSystem, setNetIncomeRealSystem] = useState(0)

  const computeTaxes = useCallback(() => {
    // 2026 Logic
    const profit = Math.max(0, anualIncome - deductibleExpenses)
    let CAS = 0
    let CASS = 0
    let incomeTax = 0
    let netIncomeAfterTaxes = 0

    // CAS (25%)
    if (profit >= GROSS_SALARY * 12 && profit < GROSS_SALARY * 24) {
      CAS = 0.25 * (GROSS_SALARY * 12)
    } else if (profit >= GROSS_SALARY * 24) {
      CAS = 0.25 * (GROSS_SALARY * 24)
    }

    // CASS (10%)
    if (profit < GROSS_SALARY * 6) {
      CASS = 0.1 * (GROSS_SALARY * 6) // Minimum contribution
    } else if (profit >= GROSS_SALARY * 6 && profit < GROSS_SALARY * 72) {
      CASS = 0.1 * profit
    } else if (profit >= GROSS_SALARY * 72) {
      CASS = 0.1 * (GROSS_SALARY * 72) // Maximum cap (72 salaries in 2024+)
    }

    // Impozit pe venit (10% on profit after deducting CAS and CASS)
    // Both CAS and CASS are fully deductible from the taxable base
    const taxableIncome = Math.max(0, profit - CAS - CASS)
    incomeTax = 0.1 * taxableIncome

    // Venit net PFA (What's left from your bank account = Income - Expenses - Taxes)
    netIncomeAfterTaxes = anualIncome - deductibleExpenses - CAS - CASS - incomeTax

    setRealCAS(roundToInt(CAS))
    setRealCASS(roundToInt(CASS))
    setRealIncomeTax(roundToInt(incomeTax))
    setNetIncomeRealSystem(roundToInt(netIncomeAfterTaxes))
  }, [anualIncome, deductibleExpenses])

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: TOKENS.paper,
      color: TOKENS.ink,
      borderRadius: TOKENS.radius.lg,
      fontSize: '0.95rem',
      transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: TOKENS.border,
        borderWidth: '1px',
      },
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: TOKENS.borderHover,
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: TOKENS.primary,
        borderWidth: '2px',
      },
    },
    '& .MuiInputBase-input::placeholder': {
      color: alpha(TOKENS.ink, 0.4),
      opacity: 1,
    },
    '& .MuiInputLabel-root': {
      color: TOKENS.textMuted,
      fontWeight: 600,
      fontSize: '0.9rem',
    },
  }

  return (
    <Box sx={pageFrameSx}>
      <Container maxWidth="xl">
        <Stack sx={{ alignItems: "center" }} spacing={6}>
          <SectionHeader
            title="Calculator Fiscal"
            subtitle="Estimează veniturile nete și taxele datorate pentru PFA în sistem real."
          />

          <Paper
            elevation={0}
            sx={{
              width: '100%',
              maxWidth: 1000,
              borderRadius: TOKENS.radius.xl,
              border: `1px solid ${TOKENS.border}`,
              boxShadow: TOKENS.shadow.xl,
              overflow: 'hidden',
              backgroundColor: TOKENS.paper,
            }}
          >
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
              {/* Left Side: Inputs */}
              <Box sx={{ p: { xs: 3, md: 5 }, borderRight: { md: `1px solid ${TOKENS.border}` } }}>
                <Typography variant="h6" sx={{ mb: 3.5, fontWeight: 800, color: TOKENS.ink }}>
                  Configurare Venituri
                </Typography>
                <Stack spacing={3}>
                  <TextField
                    type="number"
                    fullWidth
                    label="Venit anual încasat (RON)"
                    placeholder="Ex: 80000"
                    onChange={(e) => setAnualIncome(toNumber(e.target.value))}
                    sx={inputSx}
                  />
                  <TextField
                    type="number"
                    fullWidth
                    label="Cheltuieli deductibile (RON)"
                    placeholder="Ex: 5000"
                    onChange={(e) => setDeductibleExpenses(toNumber(e.target.value))}
                    sx={inputSx}
                  />
                  <Button
                    variant="contained"
                    onClick={computeTaxes}
                    size="large"
                    sx={{
                      mt: 1,
                      py: 1.5,
                      color: '#FFFFFF',
                      backgroundColor: TOKENS.primary,
                      borderRadius: TOKENS.radius.full,
                      fontWeight: 700,
                      fontSize: '1rem',
                      boxShadow: 'none',
                      '&:hover': {
                        backgroundColor: TOKENS.primaryStrong,
                        transform: 'translateY(-2px)',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    Calculează Taxele
                  </Button>
                </Stack>
              </Box>

              {/* Right Side: Results */}
              <Box sx={{ p: { xs: 3, md: 5 }, bgcolor: alpha(TOKENS.surfaceAlt, 0.4) }}>
                <Typography variant="h6" sx={{ mb: 3.5, fontWeight: 800, color: TOKENS.ink }}>
                  Rezumat Fiscal
                </Typography>
                <Stack component="div" spacing={2.2}>
                  <TaxRow
                    label="Venit impozabil"
                    value={`${Math.max(0, roundToInt(anualIncome - deductibleExpenses - realCAS - realCASS)).toLocaleString()} lei`}
                  />
                  <TaxRow
                    label="Contributii CAS"
                    value={`${realCAS.toLocaleString()} lei`}
                  />
                  <TaxRow
                    label="Contributii CASS"
                    value={`${realCASS.toLocaleString()} lei`}
                  />
                  <TaxRow
                    label="Impozit venit"
                    value={`${realIncomeTax.toLocaleString()} lei`}
                  />
                  <Box sx={{ my: 1, borderTop: `1px solid ${TOKENS.border}`, opacity: 0.5 }} />
                  <TaxRow
                    label="Venit net"
                    value={`${netIncomeRealSystem.toLocaleString()} lei`}
                    bold
                    highlight
                  />
                </Stack>
              </Box>
            </Box>
          </Paper>

          <DeductibleExpensesList />
        </Stack>
      </Container>
    </Box>
  )
}

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
    if (profit < GROSS_SALARY * 12) {
      CAS = 0
    } else if (profit >= GROSS_SALARY * 12 && profit < GROSS_SALARY * 24) {
      CAS = 0.25 * (GROSS_SALARY * 12)
    } else if (profit >= GROSS_SALARY * 24) {
      CAS = 0.25 * (GROSS_SALARY * 24)
    }

    // CASS (10%)
    if (profit < GROSS_SALARY * 6) {
      CASS = 0
    } else if (profit >= GROSS_SALARY * 6 && profit < GROSS_SALARY * 72) {
      CASS = 0.1 * profit
    } else if (profit >= GROSS_SALARY * 72) {
      CASS = 0.1 * (GROSS_SALARY * 72)
    }

    // Impozit pe venit (10% on profit after deducting CAS and CASS)
    incomeTax = 0.1 * Math.max(0, profit - CAS - CASS)

    // Venit net PFA (What's left from your bank account = Income - Expenses - Taxes)
    netIncomeAfterTaxes = profit > 0 ? (anualIncome - deductibleExpenses - CAS - CASS - incomeTax) : anualIncome - deductibleExpenses

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
                      boxShadow: TOKENS.shadow.glow,
                      '&:hover': {
                        backgroundColor: TOKENS.primaryStrong,
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 24px rgba(92,203,245,0.3)',
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
                <Stack spacing={2.2}>
                  <TaxRow
                    label="Venit brut estimat"
                    value={`${roundToInt(anualIncome).toLocaleString()} RON`}
                  />
                  {deductibleExpenses > 0 && (
                    <TaxRow
                      label="Cheltuieli deductibile"
                      value={`-${roundToInt(deductibleExpenses).toLocaleString()} RON`}
                    />
                  )}
                  <TaxRow
                    label="Venit impozabil (Profit)"
                    value={`${Math.max(0, roundToInt(anualIncome - deductibleExpenses)).toLocaleString()} RON`}
                  />
                  <Box sx={{ my: 1, borderTop: `1px solid ${TOKENS.border}`, opacity: 0.5 }} />
                  <TaxRow
                    label="Impozit pe venit (10%)"
                    value={`-${realIncomeTax.toLocaleString()} RON`}
                  />
                  <TaxRow
                    label="Contribuție CAS (25%)"
                    value={`-${realCAS.toLocaleString()} RON`}
                  />
                  {realCASS > 0 && (
                    <TaxRow
                      label="Contribuție CASS (10%)"
                      value={`-${realCASS.toLocaleString()} RON`}
                    />
                  )}
                  <Box
                    sx={{
                      mt: 1.5,
                      pt: 2.5,
                      borderTop: `2px dashed ${TOKENS.border}`,
                    }}
                  >
                    <TaxRow
                      label="Venit Net Real PFA"
                      value={`${netIncomeRealSystem.toLocaleString()} RON`}
                      bold
                      highlight
                    />
                  </Box>
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

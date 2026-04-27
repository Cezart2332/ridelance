import { useState } from 'react'
import { Box, Tab, Tabs, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { TOKENS } from '../../constants/tokens'
import { deductibleExpensesData } from '../../data/cheltuieliDeductibile'

export function DeductibleExpensesList() {
  const [activeTab, setActiveTab] = useState(0)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const activeCategory = deductibleExpensesData[activeTab]

  if (!deductibleExpensesData || deductibleExpensesData.length === 0) {
    return null
  }

  return (
    <Box sx={{ mt: 8, mb: 4, width: '100%' }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: TOKENS.ink, textAlign: 'center' }}>
        Cheltuieli Deductibile
      </Typography>

      <Box sx={{
        maxWidth: '1000px',
        mx: 'auto',
        bgcolor: TOKENS.paper,
        borderRadius: TOKENS.radius.xl,
        border: `1px solid ${TOKENS.border}`,
        boxShadow: TOKENS.shadow.lg,
        overflow: 'hidden'
      }}>
        <Box sx={{ borderBottom: 1, borderColor: TOKENS.border, bgcolor: alpha(TOKENS.surfaceAlt, 0.5) }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: 2,
              '& .MuiTabs-indicator': {
                backgroundColor: TOKENS.primary,
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
              '& .MuiTab-root': {
                color: TOKENS.textMuted,
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.9rem',
                py: 2.5,
                minHeight: 0,
                '&.Mui-selected': {
                  color: TOKENS.ink,
                }
              }
            }}
          >
            {deductibleExpensesData.map((category, index) => (
              <Tab key={index} label={category.name} />
            ))}
          </Tabs>
        </Box>

        <Box sx={{ p: { xs: 3, md: 4 }, display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center' }}>
          {activeCategory.items.map((item, itemIdx) => (
            <Box
              key={itemIdx}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                bgcolor: TOKENS.surface,
                border: `1px solid ${TOKENS.border}`,
                borderRadius: TOKENS.radius.md,
                px: 2,
                py: 1.2,
                transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
                '&:hover': {
                  borderColor: TOKENS.primary,
                  boxShadow: TOKENS.shadow.sm,
                  backgroundColor: TOKENS.paper,
                  transform: 'translateY(-2px)',
                }
              }}
            >
              <Typography sx={{ color: TOKENS.ink, fontWeight: 600, fontSize: '0.88rem' }}>
                {item.name}
              </Typography>
              <Box sx={{
                bgcolor: alpha(TOKENS.primary, 0.1),
                color: TOKENS.primaryStrong,
                px: 1.2,
                py: 0.4,
                borderRadius: TOKENS.radius.full,
                fontWeight: 800,
                fontSize: '0.72rem',
                whiteSpace: 'nowrap'
              }}>
                {item.deductible}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

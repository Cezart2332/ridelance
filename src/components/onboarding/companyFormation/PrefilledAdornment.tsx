import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import { InputAdornment, Tooltip } from '@mui/material'

import { TOKENS } from '../onboardingTheme'

/**
 * Semnul că valoarea din câmp a fost citită automat din cartea de identitate. Contează pentru
 * că inferența poate greși: userul trebuie să vadă ce n-a scris el, ca să verifice.
 */
export function PrefilledAdornment() {
  return (
    <InputAdornment position="end">
      <Tooltip title="Completat automat din cartea de identitate. Verifică și corectează dacă e greșit.">
        <AutoAwesomeRoundedIcon
          aria-label="Completat automat din cartea de identitate"
          sx={{ fontSize: 17, color: TOKENS.primary }}
        />
      </Tooltip>
    </InputAdornment>
  )
}

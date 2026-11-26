import { Button, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { useState } from 'react'

import { accountingApi } from '../../api/accountingApi'
import type { CategoryDeductibility, DeductibilityChoice, OwnDeductibility } from '../../api/types'
import { formatDate } from '../../format'
import { ReasonDialog } from '../components'
import { useNotify } from '../notify'

const LABEL: Record<DeductibilityChoice, string> = {
  '100_PERCENT': '100%',
  '50_PERCENT': '50%',
  NON_DEDUCTIBLE: 'Nedeductibil',
  SPECIAL_RULE: 'Regim special',
}

/** Valoarea din select: `GLOBAL` = fără procent propriu, urmează regula globală. */
type Choice = OwnDeductibility | 'GLOBAL'

/**
 * Cât se deduce din fiecare categorie de cheltuieli pentru acest client. Implicit, regula globală a
 * categoriei; un procent propriu se adaugă în istoric de la o dată, cu justificare, ca orice setare,
 * iar cheltuielile din lunile deschise se recalculează.
 *
 * Categoriile auto urmează „Deductibilitate cheltuieli auto” de mai sus, iar amortizarea nu are
 * procent: rândurile lor arată ce se aplică, fără să se poată schimba aici.
 */
export function CategoryDeductibilitySection({
  pfaId,
  categories,
  readOnly,
  defaultValidFrom,
  onChanged,
}: {
  pfaId: string
  categories: CategoryDeductibility[]
  readOnly: boolean
  defaultValidFrom: string
  onChanged: () => void
}) {
  const notify = useNotify()
  const [editing, setEditing] = useState<CategoryDeductibility | null>(null)
  const [choice, setChoice] = useState<Choice>('GLOBAL')
  const [validFrom, setValidFrom] = useState(defaultValidFrom)

  const open = (category: CategoryDeductibility) => {
    setChoice(category.own ?? 'GLOBAL')
    setValidFrom(defaultValidFrom)
    setEditing(category)
  }

  if (categories.length === 0) return null

  return (
    <Paper sx={{ p: 2.5 }}>
      <Stack spacing={2}>
        <Typography variant="h2">Cheltuieli deductibile</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Categorie</TableCell>
              <TableCell>Global</TableCell>
              <TableCell>Pentru acest client</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => {
              const editable = !readOnly && (category.source === 'Global' || category.source === 'Client')
              return (
                <TableRow key={category.category}>
                  <TableCell>{category.label}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>{LABEL[category.global]}</TableCell>
                  <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    <Typography variant="body2" sx={{ fontWeight: category.source === 'Client' ? 700 : 400 }}>
                      {category.source === 'Client'
                        ? `${LABEL[category.effective]} · din ${formatDate(category.ownFrom)}`
                        : category.source === 'Vehicle'
                          ? `${LABEL[category.effective]} · setarea auto`
                          : category.source === 'Special'
                            ? 'Regim special'
                            : 'Ca global'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {editable && (
                      <Button size="small" variant="outlined" onClick={() => open(category)}>
                        Modifică
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Stack>

      <ReasonDialog
        open={editing !== null}
        title={editing ? `Deductibilitate: ${editing.label}` : ''}
        description="Procentul nou se adaugă în istoric de la data aleasă; cheltuielile din lunile deschise se recalculează."
        reasonLabel="Observație / justificare"
        canSubmit={Boolean(validFrom) && editing !== null && choice !== (editing.own ?? 'GLOBAL')}
        onClose={() => setEditing(null)}
        onSubmit={async (note) => {
          if (!editing) return
          await accountingApi.pfas.updateCategoryDeductibility(pfaId, {
            category: editing.category,
            value: choice === 'GLOBAL' ? null : choice,
            validFrom,
            note,
          })
          notify('Procentul a fost adăugat în istoric.', 'success')
          onChanged()
        }}
      >
        {editing && (
          <TextField select label="Deductibil" value={choice} onChange={(event) => setChoice(event.target.value as Choice)}>
            <MenuItem value="GLOBAL">Ca global ({LABEL[editing.global]})</MenuItem>
            <MenuItem value="100_PERCENT">100%</MenuItem>
            <MenuItem value="50_PERCENT">50%</MenuItem>
            <MenuItem value="NON_DEDUCTIBLE">Nedeductibil</MenuItem>
          </TextField>
        )}
        <TextField
          type="date"
          label="Valabil de la"
          value={validFrom}
          onChange={(event) => setValidFrom(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </ReasonDialog>
    </Paper>
  )
}

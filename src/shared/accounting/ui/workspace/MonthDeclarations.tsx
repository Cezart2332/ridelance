import { Box, ButtonBase, Dialog, DialogContent, IconButton, Stack, Typography } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'

import type { DeclarationSummary } from '../../api/types'
import { formatLei } from '../../format'
import { DeclarationCard } from '../declarations/DeclarationCard'
import { useAccountingNav } from '../navigation'
import { Panel, StatusPill } from './parts'
import { declarationCell, HAIRLINE, INK } from './status'

/** Declarațiile lunii: un rând pe declarație; cardul complet (validare, semnare, recipisă) se deschide peste pagină. */
export function MonthDeclarations({
  declarations,
  readOnly,
  onChanged,
}: {
  declarations: DeclarationSummary[]
  readOnly: boolean
  onChanged: () => void
}) {
  const nav = useAccountingNav()
  const openType = nav.declarationType
  const opened = declarations.find((declaration) => declaration.type === openType) ?? null

  return (
    <Panel>
      <Typography component="h2" sx={{ px: 2.5, pt: 2, pb: 1, fontSize: 16, fontWeight: 700, color: INK }}>
        Declarații
      </Typography>
      {declarations.map((declaration) => {
        const cell = declarationCell({
          declarationId: declaration.declarationId,
          versionId: declaration.currentVersionId,
          status: declaration.status,
          amount: declaration.amount,
        })
        return (
          <ButtonBase
            key={declaration.type}
            onClick={() => nav.setParam('declaratie', declaration.type)}
            aria-label={`Deschide ${declaration.type}`}
            sx={{ width: '100%', display: 'flex', gap: 2, px: 2.5, py: 1.5, borderTop: `1px solid ${HAIRLINE}`, fontFamily: 'inherit', textAlign: 'left' }}
          >
            <Typography sx={{ flexGrow: 1, fontSize: 14, fontWeight: 600, color: INK }}>{declaration.type}</Typography>
            <Typography sx={{ fontSize: 14, color: INK }}>
              {declaration.type !== 'D390' && declaration.amount !== null ? formatLei(declaration.amount) : ''}
            </Typography>
            <Box sx={{ minWidth: 120, display: 'flex', justifyContent: 'flex-end' }}>
              <StatusPill cell={cell} />
            </Box>
          </ButtonBase>
        )
      })}

      <Dialog open={opened !== null} onClose={() => nav.setParam('declaratie', null)} maxWidth="md" fullWidth>
        <Stack direction="row" sx={{ justifyContent: 'flex-end', px: 1, pt: 1 }}>
          <IconButton aria-label="Închide" onClick={() => nav.setParam('declaratie', null)}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
        <DialogContent sx={{ pt: 0 }}>{opened && <DeclarationCard summary={opened} readOnly={readOnly} onChanged={onChanged} />}</DialogContent>
      </Dialog>
    </Panel>
  )
}


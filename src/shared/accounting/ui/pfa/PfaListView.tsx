import { useDeferredValue, useState } from 'react'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'

import { accountingApi } from '../../api/accountingApi'
import { formatPeriod } from '../../format'
import { CASH_REGISTER_STATUS, PFA_MONTH_STATUS, PLATFORM_LABEL } from '../../statusLabels'
import { AccountingBadge, EmptyText, ErrorBlock, LoadingBlock } from '../components'
import { useAccountingNav } from '../navigation'
import { useApi } from '../useApi'

/** F1: lista PFA-urilor, cu tab-uri Active / Inactive și căutare după nume sau CUI. */
export function PfaListView() {
  const nav = useAccountingNav()
  const [search, setSearch] = useState('')
  const query = useDeferredValue(search.trim())
  const list = useApi(() => accountingApi.pfas.list({ status: nav.listTab, search: query || undefined }), [nav.listTab, query])
  const all = useApi(() => accountingApi.pfas.list(), [])
  const count = (status: 'ACTIVE' | 'INACTIVE') => all.data?.filter((pfa) => pfa.engagementStatus === status).length
  const period = list.data?.[0]?.currentPeriod ?? all.data?.[0]?.currentPeriod

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h1">PFA</Typography>
        <Typography variant="body2" color="text.secondary">
          Contabilitatea PFA-urilor în sistem real: declarații, documente Uber/Bolt, tranzacții și registre.
        </Typography>
      </Stack>

      <Paper>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          sx={{ px: 2, pt: 1, gap: 2, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}
        >
          <Tabs value={nav.listTab} onChange={(_, value) => nav.openPfaList(value)}>
            <Tab value="active" label={`Active${count('ACTIVE') !== undefined ? ` (${count('ACTIVE')})` : ''}`} />
            <Tab value="inactive" label={`Inactive${count('INACTIVE') !== undefined ? ` (${count('INACTIVE')})` : ''}`} />
          </Tabs>
          <TextField
            placeholder="Caută după nume sau CUI"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ minWidth: { sm: 280 }, pb: { xs: 1.5, sm: 0 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Stack>

        {list.error && <ErrorBlock message={list.error} onRetry={list.reload} />}
        {!list.data && !list.error && <LoadingBlock />}
        {list.data && list.data.length === 0 && (
          <Stack sx={{ px: 2.5 }}>
            <EmptyText>{query ? 'Niciun PFA nu corespunde căutării.' : 'Niciun PFA în această listă.'}</EmptyText>
          </Stack>
        )}
        {list.data && list.data.length > 0 && (
          <TableContainer sx={{ overflowX: 'auto', opacity: list.loading ? 0.6 : 1 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>PFA</TableCell>
                  <TableCell>Cod art. 317</TableCell>
                  <TableCell>Platforme</TableCell>
                  <TableCell>{period ? `Status ${formatPeriod(period)}` : 'Status lună curentă'}</TableCell>
                  <TableCell>Cash</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.data.map((pfa) => (
                  <TableRow
                    key={pfa.id}
                    hover
                    tabIndex={0}
                    role="link"
                    aria-label={`Deschide dosarul ${pfa.name}`}
                    onClick={() => nav.openPfa(pfa.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') nav.openPfa(pfa.id)
                    }}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {pfa.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        CUI {pfa.cui}
                      </Typography>
                    </TableCell>
                    <TableCell>{pfa.art317 ? 'Da' : 'Nu'}</TableCell>
                    <TableCell>{pfa.platforms.map((platform) => PLATFORM_LABEL[platform]).join(', ')}</TableCell>
                    <TableCell>
                      {pfa.engagementStatus === 'INACTIVE' ? (
                        <Typography variant="body2" color="text.secondary">
                          Inactiv
                        </Typography>
                      ) : (
                        <AccountingBadge descriptor={PFA_MONTH_STATUS[pfa.currentMonthStatus]} />
                      )}
                    </TableCell>
                    <TableCell>
                      <AccountingBadge descriptor={CASH_REGISTER_STATUS[pfa.cashStatus]} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Stack>
  )
}

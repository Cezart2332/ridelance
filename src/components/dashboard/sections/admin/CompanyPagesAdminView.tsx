import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'

import { TOKENS } from '../../../../constants/tokens'
import { getErrorMessage } from '../../../../utils/errorHandler'
import {
  adminCompanyPageService,
  type AdminCompanyPageDetail,
  type AdminCompanyPageListItem,
} from '../../../../services/adminCompanyPage.service'
import type { CompanyPageReviewStatus } from '../../../../services/company.service'
import { BLOCKABLE_SECTIONS } from '../../../company/sections'
import { CompanyPageReviewPanel } from './companyPages/CompanyPageReviewPanel'
import { statusChip } from './companyPages/statusChip'

/**
 * Paginile publice ale firmelor, cu verificarea lor.
 *
 * Mini-site-ul e singurul loc din platformă unde un cont scrie text liber și încarcă o fotografie
 * care ajung pe un domeniu al nostru, lângă marca RIDElance. De aceea nu se publică singur:
 * proprietarul salvează o ciornă, iar de aici se decide dacă pleacă mai departe.
 *
 * Lista se deschide pe „De verificat" — restul e istorie, iar ce contează e coada.
 */

type Filter = CompanyPageReviewStatus | 'all'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'Pending', label: 'De verificat' },
  { id: 'Approved', label: 'Publicate' },
  { id: 'Rejected', label: 'Refuzate' },
  { id: 'all', label: 'Toate' },
]

export function CompanyPagesAdminView() {
  const [filter, setFilter] = useState<Filter>('Pending')
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<AdminCompanyPageListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<AdminCompanyPageDetail | null>(null)
  const [opening, setOpening] = useState<string | null>(null)

  /**
   * Se aduce lista întreagă, o dată, iar filtrul și căutarea lucrează pe ea în memorie.
   *
   * Serverul știe și el să filtreze, dar o cerere la fiecare literă tastată ar fi însemnat un
   * debounce, o cerere de anulat și o stare de încărcare care clipește — pentru câteva sute de
   * firme, cât are lista asta.
   */
  const load = useCallback(() => {
    adminCompanyPageService
      .list()
      .then((data) => {
        setItems(data)
        setError(null)
      })
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  /** Reîncărcarea cerută de om. Spre deosebire de cea de la montare, arată că se întâmplă ceva. */
  const reload = () => {
    setLoading(true)
    load()
  }

  const needle = search.trim().toLowerCase()
  const visible = items.filter((item) => {
    if (filter !== 'all' && item.status !== filter) return false
    if (needle.length === 0) return true

    return [item.legalName, item.slug, item.ownerEmail, item.cui ?? ''].some((field) =>
      field.toLowerCase().includes(needle),
    )
  })

  const open = async (profileId: string) => {
    setOpening(profileId)
    setError(null)
    try {
      setSelected(await adminCompanyPageService.get(profileId))
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setOpening(null)
    }
  }

  if (selected) {
    return (
      <CompanyPageReviewPanel
        detail={selected}
        onBack={() => {
          setSelected(null)
          reload()
        }}
        onChanged={setSelected}
      />
    )
  }

  const pendingCount = items.filter((item) => item.status === 'Pending').length

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: TOKENS.ink }}>
          Pagini firme
        </Typography>
        <Typography sx={{ mt: 0.4, fontSize: '0.9rem', color: alpha(TOKENS.ink, 0.62) }}>
          Mini-site-urile publice ale flotelor. Nimic din ce scrie o firmă nu ajunge public fără o
          aprobare de aici.
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: TOKENS.radius.lg,
          border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}
        >
          <ToggleButtonGroup
            exclusive
            size="small"
            value={filter}
            onChange={(_, next: Filter | null) => next && setFilter(next)}
          >
            {FILTERS.map((entry) => (
              <ToggleButton
                key={entry.id}
                value={entry.id}
                sx={{ textTransform: 'none', fontWeight: 700, px: 1.8 }}
              >
                {entry.label}
                {entry.id === 'Pending' && pendingCount > 0 && ` (${pendingCount})`}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Denumire, CUI, adresă publică sau e-mail"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <SearchRoundedIcon sx={{ mr: 1, fontSize: 18, color: alpha(TOKENS.ink, 0.45) }} />
                  ),
                },
              }}
              sx={{ minWidth: { xs: '100%', md: 320 } }}
            />
            <Button
              variant="outlined"
              startIcon={<RefreshRoundedIcon />}
              onClick={reload}
              sx={{ textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}
            >
              Reîncarcă
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ borderRadius: TOKENS.radius.md, fontWeight: 600 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : visible.length === 0 ? (
        <Alert severity="success" sx={{ borderRadius: TOKENS.radius.md, fontWeight: 600 }}>
          {filter === 'Pending'
            ? 'Nicio pagină nu așteaptă verificarea.'
            : 'Nicio pagină care să corespundă filtrului.'}
        </Alert>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ borderRadius: TOKENS.radius.lg, border: `1px solid ${alpha(TOKENS.ink, 0.08)}` }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Firmă', 'Adresă publică', 'Stare', 'Secțiuni oprite', 'Trimisă', ''].map((heading, index) => (
                  <TableCell key={heading || index} sx={{ fontWeight: 800, fontSize: '0.75rem' }}>
                    {heading}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((item) => (
                <TableRow key={item.profileId} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.88rem' }}>
                      {item.legalName}
                    </Typography>
                    <Typography sx={{ fontSize: '0.78rem', color: alpha(TOKENS.ink, 0.6) }}>
                      {item.ownerEmail}
                      {item.cui && ` · CUI ${item.cui}`}
                      {` · ${item.publicCarCount} ${item.publicCarCount === 1 ? 'mașină' : 'mașini'}`}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography
                      component="a"
                      href={`/${item.slug}`}
                      target="_blank"
                      rel="noopener"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        color: TOKENS.primary,
                        textDecoration: 'none',
                      }}
                    >
                      /{item.slug}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center' }}>
                      {statusChip(item.status)}
                      {/* Statutul singur nu spune dacă publicul vede ceva: o pagină „de verificat"
                          poate fi online cu versiunea aprobată data trecută. */}
                      {item.publishedAtUtc && item.status !== 'Approved' && (
                        <Chip
                          label="online"
                          size="small"
                          sx={{ fontSize: '0.64rem', fontWeight: 700, height: 20 }}
                        />
                      )}
                    </Stack>
                  </TableCell>

                  <TableCell>
                    {item.blockedSections.length === 0 ? (
                      <Typography sx={{ fontSize: '0.8rem', color: alpha(TOKENS.ink, 0.45) }}>—</Typography>
                    ) : (
                      <Typography sx={{ fontSize: '0.8rem' }}>
                        {item.blockedSections
                          .map((id) => BLOCKABLE_SECTIONS.find((s) => s.id === id)?.label ?? id)
                          .join(', ')}
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <Typography sx={{ fontSize: '0.8rem', color: alpha(TOKENS.ink, 0.62) }}>
                      {formatDate(item.submittedAtUtc)}
                    </Typography>
                  </TableCell>

                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="contained"
                      disableElevation
                      disabled={opening === item.profileId}
                      onClick={() => void open(item.profileId)}
                      sx={{ textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}
                    >
                      {opening === item.profileId ? 'Se deschide…' : 'Verifică'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  )
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

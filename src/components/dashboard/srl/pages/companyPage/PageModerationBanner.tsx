import { Alert, AlertTitle, Box, Stack, Typography } from '@mui/material'
import BlockRoundedIcon from '@mui/icons-material/BlockRounded'

import type { CompanyPageModeration } from '../../../../../services/company.service'
import { BLOCKABLE_SECTIONS } from '../../../../company/sections'
import { DASHBOARD_TOKENS } from '../../../dashboardTheme'
import { StatusChip } from '../../../ui'

/**
 * Ce se întâmplă cu pagina între „am salvat" și „se vede pe internet".
 *
 * Fără banda asta, editorul ar minți prin omisiune: butonul spune „Salvează pagina", salvarea
 * reușește, iar proprietarul pleacă convins că a publicat ceva. În realitate a trimis o ciornă
 * spre verificare, iar publicul vede altceva — sau nimic.
 *
 * Distincția care contează cel mai mult e între „în verificare, fără nimic publicat" și „în
 * verificare, dar versiunea veche e live". Arată la fel în statut și înseamnă lucruri opuse
 * pentru vizitator, deci se scriu ca două mesaje diferite.
 */

interface PageModerationBannerProps {
  moderation: CompanyPageModeration
  /** Sunt modificări nesalvate în editor. Atunci nici măcar ciorna trimisă nu e ce se vede aici. */
  dirty: boolean
}

export function PageModerationBanner({ moderation, dirty }: PageModerationBannerProps) {
  const { status, note, blockedSections, publishedAtUtc } = moderation
  const live = Boolean(publishedAtUtc)

  const state = describe(status, live)

  return (
    <Stack spacing={1.5}>
      <Alert
        severity={state.severity}
        sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}
      >
        <AlertTitle sx={{ fontWeight: 800 }}>{state.title}</AlertTitle>
        {state.body}
        {live && publishedAtUtc && (
          <Typography component="div" sx={{ mt: 0.6, fontSize: '0.82rem', opacity: 0.85 }}>
            Versiunea publicată acum a fost aprobată pe {formatDate(publishedAtUtc)}.
          </Typography>
        )}
        {note && (
          <Typography component="div" sx={{ mt: 0.8, fontSize: '0.86rem' }}>
            <strong>Mesaj de la RIDElance:</strong> {note}
          </Typography>
        )}
        {dirty && (
          <Typography component="div" sx={{ mt: 0.8, fontSize: '0.82rem', opacity: 0.85 }}>
            Ai modificări nesalvate. Ele nu ajung la verificare până nu apeși „Salvează pagina”.
          </Typography>
        )}
      </Alert>

      {blockedSections.length > 0 && <BlockedSections ids={blockedSections} />}
    </Stack>
  )
}

/**
 * Secțiunile oprite de RIDElance.
 *
 * Se spune deschis că nu se pot reactiva din editor. Un blocaj fără explicație ar fi trimis
 * proprietarul să caute prin taburi un comutator care nu există — și să creadă că e o defecțiune.
 */
function BlockedSections({ ids }: { ids: readonly string[] }) {
  const labels = BLOCKABLE_SECTIONS.filter((section) => ids.includes(section.id))

  return (
    <Box
      sx={{
        borderRadius: `${DASHBOARD_TOKENS.radius.md}px`,
        border: `1px solid ${DASHBOARD_TOKENS.border}`,
        p: 1.8,
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
        <BlockRoundedIcon sx={{ fontSize: 18, color: DASHBOARD_TOKENS.textMuted }} />
        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: DASHBOARD_TOKENS.ink }}>
          Secțiuni oprite de RIDElance
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
        {labels.map((section) => (
          <StatusChip key={section.id} label={section.label} tone="warning" size="sm" outlined />
        ))}
      </Stack>

      <Typography sx={{ mt: 1.2, fontSize: '0.82rem', color: DASHBOARD_TOKENS.textMuted }}>
        Nu apar pe pagina publică, oricât ai scrie în ele. Le poți edita mai departe, dar
        reactivarea o face RIDElance — scrie-ne din Suport dacă vrei să le revedem.
      </Typography>
    </Box>
  )
}

type BannerState = { severity: 'info' | 'success' | 'warning' | 'error'; title: string; body: string }

function describe(status: CompanyPageModeration['status'], live: boolean): BannerState {
  switch (status) {
    case 'Approved':
      return {
        severity: 'success',
        title: 'Pagina e publicată',
        body: 'Ce se vede pe adresa publică e versiunea aprobată. Orice modificare salvată de aici încolo trece din nou prin verificare.',
      }

    case 'Pending':
      return live
        ? {
            severity: 'info',
            title: 'Modificările așteaptă verificarea',
            body: 'Pagina rămâne online cu versiunea aprobată anterior. Cea nouă o înlocuiește după ce o verificăm.',
          }
        : {
            severity: 'info',
            title: 'Pagina așteaptă verificarea',
            body: 'Până la verdict, pe adresa publică apar doar denumirea firmei, mașinile aprobate și datele de contact pe care le-ai marcat publice.',
          }

    case 'Rejected':
      return {
        severity: 'error',
        title: 'Pagina nu a fost aprobată',
        body: 'Nu e vizibilă public. Corectează ce ți se cere mai jos și salvează din nou — retrimiterea la verificare e automată.',
      }

    default:
      return {
        severity: 'info',
        title: 'Pagina nu e încă publicată',
        body: 'Scrie descrierea și secțiunile, apoi salvează. Salvarea o trimite la verificare, iar după aprobare apare pe adresa publică.',
      }
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })
}

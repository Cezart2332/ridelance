import { useEffect, useState } from 'react'
import { Alert, Box, CircularProgress, Paper, Stack, Switch, Typography } from '@mui/material'
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded'

import { DASHBOARD_TOKENS } from '../../dashboardTheme'
import {
  notificationPreferencesService,
  type NotificationPreferenceItem,
} from '../../../../services/notificationPreferences.service'
import { getErrorMessage } from '../../../../utils/errorHandler'

const GROUP_COPY = {
  operational: {
    title: 'Operațional',
    hint: 'Lucruri care îți afectează activitatea. Recomandăm să le lași pornite.',
  },
  commercial: {
    title: 'Comercial',
    hint: 'Noutăți și oferte. Le poți opri fără să pierzi nimic important.',
  },
} as const

/**
 * Preferințele de notificări, pe categorii.
 *
 * Separarea operațional/comercial e cerută de spec §10.5 și e cea care contează: cineva care
 * nu vrea oferte trebuie să le poată tăia fără să piardă anunțul că îi expiră RCA-ul.
 *
 * Deocamdată se persistă doar preferința, iar jobul de expirări o respectă. Canalul de livrare
 * rămâne cel existent (Web Push) — nu se adaugă unul nou în acest PR.
 */
export function NotificationPreferencesPanel() {
  const [items, setItems] = useState<NotificationPreferenceItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savingCategory, setSavingCategory] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    notificationPreferencesService
      .get()
      .then((data) => {
        if (!cancelled) setItems(data.items ?? [])
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(getErrorMessage(cause, 'Nu am putut încărca preferințele.'))
      })
    return () => {
      cancelled = true
    }
  }, [])

  const toggle = async (category: string, enabled: boolean) => {
    // Comutatorul se mișcă imediat: e o preferință, nu o tranzacție — așteptarea ar face
    // ecranul să pară blocat. La eroare se pune la loc.
    setItems((previous) =>
      previous ? previous.map((item) => (item.category === category ? { ...item, enabled } : item)) : previous,
    )
    setSavingCategory(category)
    setError(null)

    try {
      const updated = await notificationPreferencesService.update([{ category, enabled }])
      setItems(updated.items ?? [])
    } catch (cause) {
      setItems((previous) =>
        previous
          ? previous.map((item) => (item.category === category ? { ...item, enabled: !enabled } : item))
          : previous,
      )
      setError(getErrorMessage(cause, 'Preferința nu a putut fi salvată.'))
    } finally {
      setSavingCategory(null)
    }
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: DASHBOARD_TOKENS.radius.lg,
        border: `1px solid ${DASHBOARD_TOKENS.border}`,
        boxShadow: DASHBOARD_TOKENS.shadow.sm,
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
        <NotificationsRoundedIcon sx={{ fontSize: 20, color: DASHBOARD_TOKENS.primaryStrong }} />
        <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800 }}>Notificări</Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: DASHBOARD_TOKENS.radius.md }}>
          {error}
        </Alert>
      )}

      {items === null ? (
        <Stack sx={{ alignItems: 'center', py: 3 }}>
          <CircularProgress size={24} sx={{ color: DASHBOARD_TOKENS.primary }} />
        </Stack>
      ) : (
        <Stack spacing={3}>
          {(['operational', 'commercial'] as const).map((group) => {
            const groupItems = items.filter((item) => item.group === group)
            if (groupItems.length === 0) return null

            return (
              <Box key={group}>
                <Typography
                  sx={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: DASHBOARD_TOKENS.textSubtle,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                  }}
                >
                  {GROUP_COPY[group].title}
                </Typography>
                <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.82rem', mt: 0.3, mb: 1 }}>
                  {GROUP_COPY[group].hint}
                </Typography>

                {groupItems.map((item, index) => (
                  <Stack
                    key={item.category}
                    direction="row"
                    sx={{
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      py: 1,
                      borderBottom:
                        index === groupItems.length - 1 ? 'none' : `1px solid ${DASHBOARD_TOKENS.border}`,
                    }}
                  >
                    <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontSize: '0.9rem' }}>
                      {item.label}
                    </Typography>
                    <Switch
                      checked={item.enabled}
                      disabled={savingCategory === item.category}
                      onChange={(event) => void toggle(item.category, event.target.checked)}
                      slotProps={{ input: { 'aria-label': item.label } }}
                    />
                  </Stack>
                ))}
              </Box>
            )
          })}
        </Stack>
      )}
    </Paper>
  )
}

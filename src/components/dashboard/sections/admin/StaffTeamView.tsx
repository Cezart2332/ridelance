import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Box, Button, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material'

import { panelTableSx } from '../../../panel/panelUtils'
import { Badge, DataPanel, PageHeading, PanelCard, PersonCell, RowActions } from '../../../panel/ui'
import { staffService, type StaffMember, type StaffOverview, type StaffRole } from '../../../../services/staff.service'
import { getErrorMessage } from '../../../../utils/errorHandler'

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString('ro-RO') : '—')

/**
 * „Echipă”: membrii (Admin, Contabil) cu starea 2FA, invitațiile deschise și formularul de
 * invitare. Adminii îi invită doar proprietarul; resetarea 2FA a unui admin, tot el.
 */
export function StaffTeamView({ onNotify }: { onNotify: (message: string, severity: 'success' | 'error') => void }) {
  const [data, setData] = useState<StaffOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<StaffRole>('Contabil')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    staffService
      .get()
      .then((value) => {
        if (!active) return
        setData(value)
        setError(null)
      })
      .catch((cause) => active && setError(getErrorMessage(cause, 'Echipa nu a putut fi încărcată.')))
    return () => {
      active = false
    }
  }, [version])

  const reload = () => setVersion((value) => value + 1)

  const invite = async (event: FormEvent) => {
    event.preventDefault()
    if (busy || !fullName.trim() || !email.trim()) return
    setBusy(true)
    try {
      await staffService.invite(fullName.trim(), email.trim(), role)
      onNotify(`Invitația a fost trimisă la ${email.trim()}.`, 'success')
      setFullName('')
      setEmail('')
      setRole('Contabil')
      reload()
    } catch (cause) {
      onNotify(getErrorMessage(cause, 'Invitația nu a putut fi trimisă.'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const run = async (action: () => Promise<void>, success: string) => {
    try {
      await action()
      onNotify(success, 'success')
      reload()
    } catch (cause) {
      onNotify(getErrorMessage(cause, 'Acțiunea nu a reușit.'), 'error')
    }
  }

  const canReset = (member: StaffMember) => !member.isOwner && member.twoFactorEnabled && (member.role === 'Contabil' || Boolean(data?.canInviteAdmins))

  return (
    <Box sx={{ minWidth: 0 }}>
      <PageHeading title="Echipă" />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 360px' }, gap: 1.5, alignItems: 'start' }}>
        <Stack spacing={1.5} sx={{ minWidth: 0 }}>
          <DataPanel>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table sx={{ ...panelTableSx, minWidth: 620 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ pl: 2 }}>Membru</TableCell>
                    <TableCell>Rol</TableCell>
                    <TableCell>2FA</TableCell>
                    <TableCell>Ultima activitate</TableCell>
                    <TableCell sx={{ width: 48 }} aria-label="Acțiuni" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data?.members ?? []).map((member) => (
                    <TableRow key={member.id} sx={member.closed ? { opacity: 0.5 } : undefined}>
                      <TableCell sx={{ pl: 2 }}>
                        <PersonCell name={member.name || member.email} meta={member.email} />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" sx={{ gap: 0.5 }}>
                          <Badge toneName={member.role === 'Admin' ? 'blue' : 'gray'}>{member.role === 'Admin' ? 'Admin' : 'Contabil'}</Badge>
                          {member.isOwner && <Badge toneName="green">Proprietar</Badge>}
                        </Stack>
                      </TableCell>
                      <TableCell>{member.twoFactorEnabled ? <Badge toneName="green">Activ</Badge> : <Badge toneName="yellow">De configurat</Badge>}</TableCell>
                      <TableCell sx={{ color: 'var(--rl-text-muted)' }}>{formatDate(member.lastActivityAtUtc)}</TableCell>
                      <TableCell align="right" sx={{ pr: 1 }}>
                        {canReset(member) && (
                          <RowActions
                            label={`Acțiuni pentru ${member.name}`}
                            actions={[
                              {
                                label: 'Resetează 2FA',
                                danger: true,
                                onClick: () => {
                                  if (window.confirm(`Resetezi autentificarea în doi pași pentru ${member.name || member.email}? Va trebui s-o configureze din nou la următorul login.`)) {
                                    void run(() => staffService.resetTwoFactor(member.id), '2FA a fost resetat.')
                                  }
                                },
                              },
                            ]}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DataPanel>

          {data && data.invitations.length > 0 && (
            <PanelCard title="Invitații trimise">
              <Stack spacing={1}>
                {data.invitations.map((invitation) => (
                  <Stack key={invitation.id} direction="row" sx={{ alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <PersonCell name={invitation.fullName} meta={invitation.email} />
                    <Badge toneName={invitation.role === 'Admin' ? 'blue' : 'gray'}>{invitation.role}</Badge>
                    <Box sx={{ flex: 1, fontSize: 12, color: 'var(--rl-text-muted)' }}>expiră {formatDate(invitation.expiresAtUtc)}</Box>
                    {(invitation.role === 'Contabil' || data.canInviteAdmins) && (
                      <Button size="small" color="error" onClick={() => void run(() => staffService.revoke(invitation.id), 'Invitația a fost retrasă.')}>
                        Retrage
                      </Button>
                    )}
                  </Stack>
                ))}
              </Stack>
            </PanelCard>
          )}
        </Stack>

        <PanelCard title="Invită în echipă">
          <Box component="form" onSubmit={invite} noValidate>
            <Stack spacing={1.5}>
              <TextField label="Nume complet" value={fullName} onChange={(event) => setFullName(event.target.value)} disabled={busy} fullWidth />
              <TextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} fullWidth />
              {data?.canInviteAdmins && (
                <TextField select label="Rol" value={role} onChange={(event) => setRole(event.target.value as StaffRole)} disabled={busy} fullWidth>
                  <MenuItem value="Contabil">Contabil</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                </TextField>
              )}
              <Button type="submit" variant="contained" loading={busy} disabled={!fullName.trim() || !email.trim()}>
                Trimite invitația
              </Button>
            </Stack>
          </Box>
        </PanelCard>
      </Box>
    </Box>
  )
}

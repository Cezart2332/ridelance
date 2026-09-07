import { useState } from 'react'
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material'
import {
  bankService,
  type BankConnectionDto,
} from '../../../services/bank.service'
import { invoicesService } from '../../../services/invoices.service'
import { BCR_ONBOARDING_URL } from '../../../data/partners'
import { readBcrDiscountIntent } from '../../../data/bcrDiscount'
import { getErrorMessage } from '../../../utils/errorHandler'
import type {
  FleetInput,
  FleetState,
} from '../../../services/fleetOnboarding.service'

interface Props {
  state: FleetState
  busy: boolean
  save: (input: FleetInput) => Promise<boolean>
  refresh: () => Promise<void>
}

export function FleetBankStep({ state, busy, save, refresh }: Props) {
  const [hasAccount, setHasAccount] = useState<boolean | null>(
    state.bankConnected ? true : null,
  )
  const [connection, setConnection] = useState<BankConnectionDto | null>(null)
  const [link, setLink] = useState('')
  const [working, setWorking] = useState(false)
  const [requested, setRequested] = useState(
    () => state.progress.bcrRequested || readBcrDiscountIntent(),
  )
  const [error, setError] = useState('')
  const run = async (fn: () => Promise<void>) => {
    setWorking(true)
    setError('')
    try {
      await fn()
    } catch (e) {
      setError(
        getErrorMessage(
          e,
          'Conectarea nu a reușit. Poți configura banca mai târziu.',
        ),
      )
    } finally {
      setWorking(false)
    }
  }
  return (
    <Stack spacing={2.5}>
      <Typography>Ai deja un cont bancar pentru această firmă?</Typography>
      <Stack direction="row" spacing={1}>
        {[true, false].map((value) => (
          <Button
            key={String(value)}
            variant={hasAccount === value ? 'contained' : 'outlined'}
            onClick={() => setHasAccount(value)}
          >
            {value ? 'Da' : 'Nu'}
          </Button>
        ))}
      </Stack>
      {hasAccount && (
        <>
          <Typography color="text.secondary">
            Conectează contul bancar pentru a vedea soldul și tranzacțiile
            firmei în RIDElance.
          </Typography>
          {state.bankConnected ? (
            <Alert severity="success">
              Cont bancar conectat {connection?.institutionName}{' '}
              {connection?.accounts[0]?.ibanMasked}
            </Alert>
          ) : (
            <>
              <Button
                disabled={working}
                variant="contained"
                onClick={() =>
                  void run(async () => {
                    const result = await bankService.initiateConnection(null)
                    setLink(result.link)
                  })
                }
              >
                Conectează contul bancar
              </Button>
              {link && (
                <Button
                  component="a"
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Continuă la bancă ↗
                </Button>
              )}
            </>
          )}
          <Button
            disabled={working}
            onClick={() =>
              void run(async () => {
                setConnection(await bankService.getConnection())
                await refresh()
              })
            }
          >
            Verifică starea conexiunii
          </Button>
          {connection?.candidates.map((candidate) => (
            <Button
              key={candidate.providerConnectionId}
              disabled={working}
              onClick={() =>
                void run(async () => {
                  setConnection(
                    await bankService.chooseConnection(
                      candidate.providerConnectionId,
                    ),
                  )
                  await refresh()
                })
              }
            >
              Confirmă conexiunea {candidate.institutionName}
            </Button>
          ))}
        </>
      )}
      {hasAccount === false && (
        <Box
          sx={{
            p: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
          }}
        >
          <Stack spacing={2}>
            <Box
              component="img"
              src="/logobcr.jpeg"
              alt="BCR"
              sx={{ width: 90, height: 48, objectFit: 'contain' }}
            />
            <Typography variant="h6">
              Deschide un cont BCR prin RIDElance
            </Typography>
            <Typography>
              Beneficiezi de oferta dedicată BCR și de 50 lei reducere/lună timp
              de 6 luni la abonamentul RIDElance, după confirmarea
              eligibilității.
            </Typography>
            <Button
              component="a"
              href={BCR_ONBOARDING_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setRequested(true)}
              variant="contained"
            >
              Deschide cont BCR
            </Button>
            <Box
              component="img"
              src="/codqrbcr.jpeg"
              alt="Cod QR pentru deschiderea contului BCR"
              sx={{ width: 112, height: 112, objectFit: 'contain' }}
            />
          </Stack>
        </Box>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      {state.bankConnected && (
        <Button
          variant="contained"
          disabled={busy || working}
          onClick={() => void save({ step: 4, bcrRequested: requested })}
        >
          Continuă
        </Button>
      )}
      <Button
        disabled={busy || working}
        onClick={() =>
          void save({ step: 4, deferred: true, bcrRequested: requested })
        }
      >
        Voi configura contul bancar mai târziu
      </Button>
    </Stack>
  )
}

export function FleetOblioStep({ state, busy, save, refresh }: Props) {
  const [hasAccount, setHasAccount] = useState<boolean | null>(
    state.oblioConnected ? true : null,
  )
  const [clientId, setClientId] = useState('')
  const [secret, setSecret] = useState('')
  const [series, setSeries] = useState('')
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const connect = async () => {
    setWorking(true)
    setError('')
    try {
      await invoicesService.connectOblio({
        clientId: clientId.trim(),
        clientSecret: secret.trim(),
        cif: state.progress.company!.cui,
        seriesName: series.trim() || null,
      })
      setSecret('')
      await refresh()
    } catch (e) {
      setError(getErrorMessage(e, 'Nu am putut conecta Oblio.'))
    } finally {
      setWorking(false)
    }
  }
  return (
    <Stack spacing={2.5}>
      <Typography color="text.secondary">
        RIDElance se integrează cu Oblio pentru a simplifica emiterea și
        gestionarea facturilor direct din dashboard.
      </Typography>
      <Typography>Ai deja cont Oblio?</Typography>
      <Stack direction="row" spacing={1}>
        {[true, false].map((value) => (
          <Button
            key={String(value)}
            variant={hasAccount === value ? 'contained' : 'outlined'}
            onClick={() => setHasAccount(value)}
          >
            {value ? 'Da' : 'Nu'}
          </Button>
        ))}
      </Stack>
      {state.oblioConnected ? (
        <Alert severity="success">
          Oblio conectat · {state.progress.company?.name}
        </Alert>
      ) : (
        hasAccount && (
          <>
            <Box component="ol" sx={{ pl: 2.5, m: 0, '& li': { mb: 1 } }}>
              <li>Intră în contul Oblio.</li>
              <li>Deschide Setări → Date cont.</li>
              <li>
                Copiază tokenul API și introdu-l mai jos, împreună cu emailul
                contului.
              </li>
            </Box>
            <TextField
              label="Email cont Oblio"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              type="email"
            />
            <TextField
              label="Token API Oblio"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              type="password"
              autoComplete="off"
            />
            <TextField
              label="CIF firmă"
              value={state.progress.company?.cui ?? ''}
              slotProps={{ input: { readOnly: true } }}
            />
            <TextField
              label="Serie implicită (opțional)"
              value={series}
              onChange={(e) => setSeries(e.target.value)}
            />
            <Button
              variant="contained"
              disabled={working || !clientId.trim() || !secret.trim()}
              onClick={() => void connect()}
            >
              Conectează Oblio
            </Button>
          </>
        )
      )}
      {hasAccount === false && (
        <Alert icon={false} severity="info">
          <Typography sx={{ fontWeight: 700 }}>
            Nu ai Oblio? Prin RIDElance beneficiezi de 1 an gratuit.
          </Typography>
          <Button
            component="a"
            href="https://www.oblio.eu"
            target="_blank"
            rel="noopener noreferrer"
          >
            Creează cont Oblio ↗
          </Button>
        </Alert>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      {state.oblioConnected && (
        <Button
          variant="contained"
          disabled={busy || working}
          onClick={() => void save({ step: 5 })}
        >
          Continuă
        </Button>
      )}
      <Button
        disabled={busy || working}
        onClick={() => void save({ step: 5, deferred: true })}
      >
        Configurează mai târziu
      </Button>
    </Stack>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material'
import {
  bankService,
  type BankConnectionDto,
} from '../../../services/bank.service'
import { invoicesService } from '../../../services/invoices.service'
import { BankConnectPanel } from '../../banking/BankConnectPanel'
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
  const [requested, setRequested] = useState(
    () => state.progress.bcrRequested || readBcrDiscountIntent(),
  )
  const [error, setError] = useState('')

  /**
   * Starea conexiunii, citită de la server. E și momentul finalizării: furnizorul nu ne sună
   * înapoi, deci abia întrebarea asta află că omul a autorizat la bancă.
   */
  const loadConnection = useCallback(async () => {
    const data = await bankService.getConnection()
    setConnection(data)
    await refresh()
    return data
  }, [refresh])

  // Prima citire, la intrarea în pas. Scrisă ca lanț de promisiuni, nu ca `await`: starea se
  // atinge doar din callback, iar un pas părăsit între timp nu mai scrie în componenta demontată.
  useEffect(() => {
    let cancelled = false

    bankService
      .getConnection()
      .then((data) => {
        if (!cancelled) setConnection(data)
      })
      .catch(() => {
        // O citire eșuată nu e o eroare de arătat aici: panoul de dedesubt oferă oricum conectarea.
      })

    return () => {
      cancelled = true
    }
  }, [])

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
            // Același panou ca în dashboard: alegi banca, îi dai datele pe care le cere ea și te
            // întorci. Înainte, pasul ăsta conecta „orb" — fără alegere de bancă — și cerea apoi
            // apăsarea manuală a unui buton de verificare.
            <BankConnectPanel
              connection={connection}
              onRefresh={loadConnection}
              onNotify={setError}
              hideHeader
            />
          )}
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
          disabled={busy}
          onClick={() => void save({ step: 4, bcrRequested: requested })}
        >
          Continuă
        </Button>
      )}
      <Button
        disabled={busy}
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

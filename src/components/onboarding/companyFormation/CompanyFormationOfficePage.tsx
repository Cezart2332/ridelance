import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  companyFormationService,
  emptyAdresa,
  emptyPersoana,
  type Adresa,
  type CompanyFormationOffice,
  type CompanyFormationOwner,
  type CompanyFormationState,
  type PersoanaFizica,
  type RegisteredOfficeType,
} from '../../../services/companyFormation.service'
import { PanelCard, PanelHeading } from '../PanelCard'
import { TOKENS, inputSx } from '../onboardingTheme'
import { useOnboardingResource } from '../useOnboarding'
import { AdresaForm } from './AdresaForm'
import { PersoanaFizicaForm } from './PersoanaFizicaForm'
import { useCompanyFormation } from './useCompanyFormation'

const ADDRESS_KEYS: (keyof Adresa)[] = [
  'judet',
  'localitate',
  'strada',
  'numar',
  'bloc',
  'scara',
  'etaj',
  'apartament',
]

const sameAddress = (a: Adresa, b: Adresa) =>
  ADDRESS_KEYS.every((k) => (a[k] ?? '') === (b[k] ?? ''))

const hasAddress = (a: Adresa) => Boolean(a.judet && a.localitate && a.strada && a.numar)

/**
 * Id-ul unui proprietar nou se generează în pagină, nu pe server: două autosave-uri pornite
 * înainte ca primul să răspundă ar crea altfel de două ori aceeași persoană.
 */
function newOwnerId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Contextele nesecurizate n-au randomUUID. Serverul cere un GUID valid, deci păstrăm
  // versiunea și varianta; restul e aleatoriu.
  const hex = (n: number) =>
    Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('')

  const variant = (8 + Math.floor(Math.random() * 4)).toString(16)
  return `${hex(8)}-${hex(4)}-4${hex(3)}-${variant}${hex(3)}-${hex(12)}`
}

/** Taxa lunară/anuală, afișată doar când există. Sumele vin în bani. */
function feeLabel(monthly: number, yearly: number): string {
  if (monthly > 0) return ` — ${(monthly / 100).toFixed(0)} lei/lună`
  if (yearly > 0) return ` — ${(yearly / 100).toFixed(0)} lei/an`
  return ''
}

/** Etapa 2 din dosarul de înființare: unde va avea firma sediul social. */
export default function CompanyFormationOfficePage() {
  const navigate = useNavigate()
  const { state, patch, save, saving, error } = useCompanyFormation()
  const { data: offices } = useOnboardingResource('consultoOffices', () =>
    companyFormationService.getConsultoOffices(),
  )

  // Bifa nu are corespondent în model: la reîncărcare o deducem din faptul că cele două
  // adrese sunt identice.
  const [mirrorsHome, setMirrorsHome] = useState<boolean | null>(null)

  const office = state?.office
  const domiciliu = state?.solicitant.domiciliu ?? emptyAdresa()

  const mirrors = useMemo(() => {
    if (mirrorsHome !== null) return mirrorsHome
    return office ? hasAddress(office.adresa) && sameAddress(office.adresa, domiciliu) : false
  }, [mirrorsHome, office, domiciliu])

  if (!state || !office) return null

  const disabled = state.isLocked || saving

  const patchOffice = (next: Partial<CompanyFormationOffice>) =>
    patch({ ...state, office: { ...office, ...next } })

  const patchOwners = (owners: CompanyFormationOwner[]) => patch({ ...state, owners })

  const payload = (source: CompanyFormationState) => ({
    type: source.office.type,
    consultoOfficeId: source.office.consultoOfficeId,
    isOwner: source.office.isOwner,
    adresa: source.office.adresa,
    acknowledgedOwnershipDocs: source.office.acknowledgedOwnershipDocs,
    acknowledgedSubmitLater: source.office.acknowledgedSubmitLater,
    acknowledgedOwnerConsent: source.office.acknowledgedOwnerConsent,
    owners: source.owners.map((o) => ({
      id: o.id || null,
      persoana: o.persoana,
    })),
  })

  /** Salvează starea dată explicit — bifele trebuie trimise imediat, nu la următorul blur. */
  const persist = (source?: CompanyFormationState) =>
    void save(() => companyFormationService.saveRegisteredOffice(payload(source ?? state)))

  const commit = (next: CompanyFormationState) => {
    patch(next)
    persist(next)
  }

  const setType = (type: RegisteredOfficeType) =>
    commit({ ...state, office: { ...office, type } })

  const setMirror = (checked: boolean) => {
    setMirrorsHome(checked)
    commit({
      ...state,
      office: { ...office, adresa: checked ? { ...domiciliu } : emptyAdresa() },
    })
  }

  const blankOwner = (position: number): CompanyFormationOwner => ({
    id: newOwnerId(),
    position,
    persoana: emptyPersoana(),
  })

  const addOwner = () => patchOwners([...state.owners, blankOwner(state.owners.length)])

  const removeOwner = (index: number) =>
    commit({ ...state, owners: state.owners.filter((_, i) => i !== index) })

  const setOwnerPersoana = (index: number, persoana: PersoanaFizica) =>
    patchOwners(state.owners.map((o, i) => (i === index ? { ...o, persoana } : o)))

  const goNext = async () => {
    const saved = await save(() => companyFormationService.saveRegisteredOffice(payload(state)))
    if (saved?.registeredOfficeComplete) {
      navigate('/onboarding/pfa/consimtamant')
    }
  }

  const isOwn = office.type === 'Own'
  const needsOwners = isOwn && office.isOwner === false

  return (
    <Stack spacing={3}>
      <PanelHeading title="Sediul social" />

      {error && (
        <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
          {error}
        </Alert>
      )}

      {state.isLocked && (
        <Alert severity="info" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
          Dosarul a fost trimis. Datele nu mai pot fi modificate.
        </Alert>
      )}

      <PanelCard>
        <RadioGroup
          value={office.type ?? ''}
          onChange={(e) => setType(e.target.value as RegisteredOfficeType)}
        >
          <FormControlLabel
            value="ConsultoProvided"
            control={<Radio disabled={disabled} />}
            label="Folosesc o adresă pusă la dispoziție de Consulto"
          />
          <FormControlLabel
            value="Own"
            control={<Radio disabled={disabled} />}
            label="Am adresă proprie"
          />
        </RadioGroup>
      </PanelCard>

      {office.type === 'ConsultoProvided' &&
        (offices && offices.length > 0 ? (
          <PanelCard>
            <TextField
              select
              label="Adresa sediului"
              value={office.consultoOfficeId ?? ''}
              onChange={(e) =>
                commit({ ...state, office: { ...office, consultoOfficeId: e.target.value } })
              }
              disabled={disabled}
              sx={inputSx}
              fullWidth
            >
              {offices.map((o) => (
                <MenuItem key={o.id} value={o.id}>
                  {o.adresa}
                  {feeLabel(o.monthlyFeeBani, o.yearlyFeeBani)}
                </MenuItem>
              ))}
            </TextField>
          </PanelCard>
        ) : (
          <Alert severity="info" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
            Momentan nu există adrese disponibile. Alege „Am adresă proprie" sau revino mai târziu.
          </Alert>
        ))}

      {isOwn && (
        <>
          <PanelCard title="Ești proprietarul imobilului?">
            <RadioGroup
              row
              value={office.isOwner === null ? '' : String(office.isOwner)}
              onChange={(e) => {
                const isOwner = e.target.value === 'true'
                commit({
                  ...state,
                  office: { ...office, isOwner },
                  // „Nu" înseamnă cel puțin un proprietar de declarat — deschidem direct
                  // formularul, ca pasul următor să fie evident.
                  owners: !isOwner && state.owners.length === 0 ? [blankOwner(0)] : state.owners,
                })
              }}
            >
              <FormControlLabel value="true" control={<Radio disabled={disabled} />} label="Da" />
              <FormControlLabel value="false" control={<Radio disabled={disabled} />} label="Nu" />
            </RadioGroup>
          </PanelCard>

          <PanelCard title="Adresa sediului">
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={mirrors}
                    onChange={(e) => setMirror(e.target.checked)}
                    disabled={disabled || !hasAddress(domiciliu)}
                  />
                }
                label="Sediul social coincide cu domiciliul"
              />
              <AdresaForm
                value={office.adresa}
                onChange={(adresa) => patchOffice({ adresa })}
                onBlur={() => persist()}
                prefix="SEDIU"
                prefilled={new Set()}
                disabled={disabled || mirrors}
              />
            </Stack>
          </PanelCard>

          {needsOwners && (
            <>
              {state.owners.map((owner, index) => (
                <PanelCard
                  key={owner.id || `nou-${index}`}
                  title={`Proprietar ${index + 1}`}
                  action={
                    state.owners.length > 1 ? (
                      <IconButton
                        aria-label={`Elimină proprietarul ${index + 1}`}
                        onClick={() => removeOwner(index)}
                        disabled={disabled}
                        sx={{ color: TOKENS.textMuted }}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    ) : undefined
                  }
                >
                  <PersoanaFizicaForm
                    value={owner.persoana}
                    onChange={(persoana) => setOwnerPersoana(index, persoana)}
                    onBlur={() => persist()}
                    disabled={disabled}
                  />
                </PanelCard>
              ))}

              <Stack direction="row">
                <Button
                  startIcon={<AddRoundedIcon />}
                  onClick={addOwner}
                  disabled={disabled}
                  sx={{ textTransform: 'none', fontWeight: 700, color: TOKENS.primaryStrong }}
                >
                  Adaugă proprietar
                </Button>
              </Stack>
            </>
          )}

          <PanelCard>
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={office.acknowledgedOwnershipDocs}
                    onChange={(e) =>
                      commit({
                        ...state,
                        office: { ...office, acknowledgedOwnershipDocs: e.target.checked },
                      })
                    }
                    disabled={disabled}
                  />
                }
                label="Dețin actele de proprietate pentru imobilul declarat ca sediu."
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={office.acknowledgedSubmitLater}
                    onChange={(e) =>
                      commit({
                        ...state,
                        office: { ...office, acknowledgedSubmitLater: e.target.checked },
                      })
                    }
                    disabled={disabled}
                  />
                }
                label="Înțeleg că actele vor fi transmise ulterior către Consulto."
              />
              {needsOwners && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={office.acknowledgedOwnerConsent === true}
                      onChange={(e) =>
                        commit({
                          ...state,
                          office: { ...office, acknowledgedOwnerConsent: e.target.checked },
                        })
                      }
                      disabled={disabled}
                    />
                  }
                  label="Înțeleg că este necesar acordul scris al proprietarului."
                />
              )}
              <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.85rem', pl: 4 }}>
                Nu încărca nimic acum — primești instrucțiunile pe e-mail după validare.
              </Typography>
            </Stack>
          </PanelCard>
        </>
      )}

      <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          endIcon={<ArrowForwardRoundedIcon />}
          onClick={() => void goNext()}
          disabled={disabled || !state.registeredOfficeComplete}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            backgroundColor: TOKENS.primary,
            '&:hover': { backgroundColor: TOKENS.primaryStrong },
          }}
        >
          Continuă
        </Button>
      </Stack>
    </Stack>
  )
}

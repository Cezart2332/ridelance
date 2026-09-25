import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  Link,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'

import {
  emptyAdresa,
  emptyPersoana,
  type Adresa,
  type CompanyFormationOffice,
  type CompanyFormationOwner,
  type ConsultoOffice,
  type PersoanaFizica,
  type RegisteredOfficeType,
} from '../../../services/companyFormation.service'
import { PanelCard } from '../PanelCard'
import { TOKENS } from '../onboardingTheme'
import { AdresaForm } from './AdresaForm'
import { OfficeZonePicker } from './OfficeZonePicker'
import { PersoanaFizicaForm } from './PersoanaFizicaForm'
import { hasAddress, missingOfficeFields, sameAddress } from './officeRules'

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

export interface RegisteredOfficeValue {
  office: CompanyFormationOffice
  owners: CompanyFormationOwner[]
}

interface RegisteredOfficeFormProps {
  value: RegisteredOfficeValue
  /** Domiciliul solicitantului: bifa „sediul e la adresa din buletin" îl copiază. */
  domiciliu: Adresa
  offices: ConsultoOffice[] | null | undefined
  /**
   * `commit` = alegerea trebuie salvată acum (radio, bifă), nu la următoarea ieșire din câmp.
   * Unde nu există salvare de draft (comanda de pe site), se poate ignora.
   */
  onChange: (next: RegisteredOfficeValue, commit: boolean) => void
  onBlur: () => void
  disabled?: boolean
}

/**
 * Sediul social al firmei de înființat: o zonă din lista Consulto sau o adresă proprie, cu
 * proprietarii ei. Același formular în onboarding („Nu am PFA") și la serviciile cumpărate de pe
 * site — de aceea nu știe nimic despre salvare.
 */
export function RegisteredOfficeForm({
  value,
  domiciliu,
  offices,
  onChange,
  onBlur,
  disabled = false,
}: RegisteredOfficeFormProps) {
  const { office, owners } = value

  // Bifa nu are corespondent în model: la reîncărcare o deducem din faptul că cele două
  // adrese sunt identice.
  const [mirrorsHome, setMirrorsHome] = useState<boolean | null>(null)

  const mirrors = useMemo(() => {
    if (mirrorsHome !== null) return mirrorsHome
    return hasAddress(office.adresa) && sameAddress(office.adresa, domiciliu)
  }, [mirrorsHome, office, domiciliu])

  const patchOffice = (next: Partial<CompanyFormationOffice>) =>
    onChange({ office: { ...office, ...next }, owners }, false)

  const commitOffice = (next: Partial<CompanyFormationOffice>) =>
    onChange({ office: { ...office, ...next }, owners }, true)

  const setType = (type: RegisteredOfficeType) => commitOffice({ type })

  const setMirror = (checked: boolean) => {
    setMirrorsHome(checked)
    commitOffice({ adresa: checked ? { ...domiciliu } : emptyAdresa() })
  }

  const blankOwner = (position: number): CompanyFormationOwner => ({
    id: newOwnerId(),
    position,
    persoana: emptyPersoana(),
  })

  const addOwner = () => onChange({ office, owners: [...owners, blankOwner(owners.length)] }, false)

  const removeOwner = (index: number) =>
    onChange({ office, owners: owners.filter((_, i) => i !== index) }, true)

  const setOwnerPersoana = (index: number, persoana: PersoanaFizica) =>
    onChange({ office, owners: owners.map((o, i) => (i === index ? { ...o, persoana } : o)) }, false)

  const isOwn = office.type === 'Own'
  const needsOwners = isOwn && office.isOwner === false
  const officeMissing = isOwn ? missingOfficeFields(office.adresa) : []

  return (
    <>
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
          <PanelCard title="În ce zonă vrei sediul social?">
            <Stack spacing={2}>
              <Typography sx={{ fontSize: '0.88rem', color: TOKENS.textMuted }}>
                Alege zona care ți se potrivește. Adresa exactă și contractul de găzduire vin de la
                Consulto după validarea dosarului.
              </Typography>
              <OfficeZonePicker
                offices={offices}
                value={office.consultoOfficeId ?? null}
                onChange={(consultoOfficeId) => commitOffice({ consultoOfficeId })}
                disabled={disabled}
              />
            </Stack>
          </PanelCard>
        ) : (
          <Alert severity="info" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
            Momentan nu există zone disponibile. Alege „Am adresă proprie" sau revino mai târziu.
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
                onChange(
                  {
                    office: { ...office, isOwner },
                    // „Nu" înseamnă cel puțin un proprietar de declarat — deschidem direct
                    // formularul, ca pasul următor să fie evident.
                    owners: !isOwner && owners.length === 0 ? [blankOwner(0)] : owners,
                  },
                  true,
                )
              }}
            >
              <FormControlLabel value="true" control={<Radio disabled={disabled} />} label="Da" />
              <FormControlLabel value="false" control={<Radio disabled={disabled} />} label="Nu" />
            </RadioGroup>
          </PanelCard>

          <PanelCard title="Sediul social">
            <Stack spacing={2}>
              {/*
                Bifat implicit când OCR-ul a citit adresa din buletin: în marea majoritate a
                cazurilor sediul E acolo, iar cine face excepție o debifează. Câmpurile rămân
                read-only cât timp e bifat — altfel s-ar putea edita o copie care se rescrie
                la următoarea salvare.
              */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={mirrors}
                    onChange={(e) => setMirror(e.target.checked)}
                    disabled={disabled || !hasAddress(domiciliu)}
                  />
                }
                label="Sediul social este la adresa din buletin"
              />

              {mirrors && !disabled && (
                <Link
                  component="button"
                  type="button"
                  onClick={() => setMirror(false)}
                  sx={{
                    alignSelf: 'flex-start',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: TOKENS.primaryStrong,
                  }}
                >
                  Modifică
                </Link>
              )}

              <AdresaForm
                value={office.adresa}
                onChange={(adresa) => patchOffice({ adresa })}
                onBlur={onBlur}
                requirePostalCode
                disabled={disabled || mirrors}
              />

              {officeMissing.length > 0 && (
                <Alert
                  severity="info"
                  role="status"
                  aria-live="polite"
                  sx={{ borderRadius: `${TOKENS.radius.md}px` }}
                >
                  Mai lipsește: {officeMissing.join(', ')}.
                </Alert>
              )}
            </Stack>
          </PanelCard>

          {needsOwners && (
            <>
              {owners.map((owner, index) => (
                <PanelCard
                  key={owner.id || `nou-${index}`}
                  title={`Proprietar ${index + 1}`}
                  action={
                    owners.length > 1 ? (
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
                    onBlur={onBlur}
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
                    onChange={(e) => commitOffice({ acknowledgedOwnershipDocs: e.target.checked })}
                    disabled={disabled}
                  />
                }
                label="Dețin actele de proprietate pentru imobilul declarat ca sediu."
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={office.acknowledgedSubmitLater}
                    onChange={(e) => commitOffice({ acknowledgedSubmitLater: e.target.checked })}
                    disabled={disabled}
                  />
                }
                label="Înțeleg că actele sunt transmise către Consulto de echipa RideLance."
              />
              {needsOwners && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={office.acknowledgedOwnerConsent === true}
                      onChange={(e) => commitOffice({ acknowledgedOwnerConsent: e.target.checked })}
                      disabled={disabled}
                    />
                  }
                  label="Înțeleg că este necesar acordul scris al proprietarului."
                />
              )}
              <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.85rem', pl: 4 }}>
                Nu ai nimic de încărcat: documentele sunt transmise către Consulto, iar actele PFA rezultate le adăugăm noi în dosarul tău.
              </Typography>
            </Stack>
          </PanelCard>
        </>
      )}
    </>
  )
}

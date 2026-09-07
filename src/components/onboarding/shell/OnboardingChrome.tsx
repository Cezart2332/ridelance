import { Box, Stack } from '@mui/material'
import type { ReactNode } from 'react'

import logo from '../../../assets/logo.svg'
import { displaySx, TOKENS } from '../onboardingTheme'
import { SHELL, SHELL_LAYOUT } from '../shellTokens'
import { MobileStepBar, MOBILE_BAR_HEIGHT } from '../rail/MobileStepBar'
import { StepRail } from '../rail/StepRail'
import { OnboardingTopBar } from './OnboardingTopBar'
import type { StepView } from '../stepModel'

/**
 * Cadrul onboardingului: bara de sus, rail-ul de pași din stânga, coloana de conținut și, opțional,
 * rail-ul din dreapta.
 *
 * Trăiește separat de `OnboardingShell` fiindcă îl folosesc DOUĂ fluxuri — înrolarea PFA și cea de
 * flotă. Cât timp fiecare își desena propriul cadru, cel de flotă avea alt antet, alt stepper și
 * alte spații: același produs, două aplicații diferite la vedere. Aici e o singură definiție, deci
 * „arată la fel" nu mai e o coincidență care se pierde la următoarea modificare.
 *
 * Nu știe nimic despre datele niciunuia dintre fluxuri: primește pașii deja calculați și randează.
 */
export interface OnboardingChromeProps {
  steps: StepView[]
  activeKey: string | null
  onSelectStep: (step: StepView) => void
  /** Timp estimat pentru pasul curent, afișat în cardul de progres al rail-ului. */
  estimate?: string | null

  stepPosition: number
  stepTotal: number
  stepLabel: string | null
  canGoBack: boolean
  onBack: () => void
  onLogout: () => void

  /** Rândul de sub logo, în capul rail-ului. Spune în ce flux ești. */
  brandCaption: string
  /** Lipit sub bara de sus, pe desktop: bannerul de mod dev. */
  banner?: ReactNode
  /** A doua bară de pe mobil, când fluxul are micro-pași. */
  mobileExtra?: ReactNode
  /** Cardul de ajutor din piciorul rail-ului. Depinde de contextul de suport, deci vine de sus. */
  support?: ReactNode
  /** Rail-ul din dreapta, cu progresul pasului curent. */
  rightRail?: ReactNode
  /**
   * Rail-ul din dreapta încape pe ecran. Când nu, conținutul lui coboară sub coloana centrală —
   * decizia e a apelantului, fiindcă el știe dacă are ce pune acolo.
   */
  showRightRail?: boolean
  /** `useMediaQuery` stă la apelant: shell-ul PFA îl folosește deja pentru alte decizii. */
  isMobile: boolean
  children: ReactNode
}

const RAIL_WIDTH = 280

export function OnboardingChrome({
  steps,
  activeKey,
  onSelectStep,
  estimate,
  stepPosition,
  stepTotal,
  stepLabel,
  canGoBack,
  onBack,
  onLogout,
  brandCaption,
  banner,
  mobileExtra,
  support,
  rightRail,
  showRightRail = false,
  isMobile,
  children,
}: OnboardingChromeProps) {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: SHELL.bg.app }}>
      {isMobile ? (
        <>
          <MobileStepBar steps={steps} activeKey={activeKey} onSelect={onSelectStep} />
          {/* Spacer pentru bara fixed — sticky nu funcționează (overflow-x: hidden pe #root). */}
          <Box sx={{ height: MOBILE_BAR_HEIGHT + 3 }} />
          {mobileExtra}
        </>
      ) : (
        <>
          <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 3 }}>
            <OnboardingTopBar
              stepPosition={stepPosition}
              stepTotal={stepTotal}
              stepLabel={stepLabel}
              canGoBack={canGoBack}
              onBack={onBack}
              onLogout={onLogout}
            />
            {banner}
          </Box>
          <Box sx={{ height: SHELL_LAYOUT.topbarHeight }} />
        </>
      )}

      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
        {!isMobile && (
          <>
            {/* Rail fix + spacer, din același motiv: position: sticky e rupt în acest proiect. */}
            <Stack
              component="nav"
              aria-label="Pașii înrolării"
              sx={{
                position: 'fixed',
                top: SHELL_LAYOUT.topbarHeight,
                bottom: 0,
                left: 0,
                width: RAIL_WIDTH,
                borderRight: `1px solid ${SHELL.border.subtle}`,
                backgroundColor: SHELL.bg.surface,
                pt: 2.5,
              }}
            >
              <Box sx={{ px: 2 }}>
                <SidebarBrand caption={brandCaption} />
              </Box>

              {/* Doar lista de pași scrolează. Ajutorul nu are voie să dispară sub fold — e exact
                  ce caută cineva blocat la un pas lung. */}
              <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 2, py: 1 }}>
                <StepRail
                  steps={steps}
                  activeKey={activeKey}
                  onSelect={onSelectStep}
                  estimate={estimate}
                />
              </Box>

              {/* Fără divider: cardul de ajutor se separă singur de listă. */}
              {support && (
                <Box sx={{ px: 2, pt: 1, pb: 2, backgroundColor: SHELL.bg.surface }}>{support}</Box>
              )}
            </Stack>
            <Box sx={{ width: RAIL_WIDTH, flexShrink: 0 }} />
          </>
        )}

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            px: { xs: 2, md: 4 },
            py: { xs: 2.5, md: 6 },
            // Cardul central își păstrează lățimea: diferența pentru rail-ul dreapta se absoarbe
            // din gutter-ele exterioare, nu din conținut.
            maxWidth: SHELL_LAYOUT.contentMaxWidth + 128,
            mx: 'auto',
          }}
        >
          {children}

          {rightRail && !showRightRail && <Box sx={{ mt: 4 }}>{rightRail}</Box>}
        </Box>

        {rightRail && showRightRail && (
          <>
            {/* Fix + spacer, ca și rail-ul stâng: `sticky` e rupt de overflow-x: hidden pe #root. */}
            <Box
              component="aside"
              aria-label="Progresul pasului curent"
              sx={{
                position: 'fixed',
                top: SHELL_LAYOUT.topbarHeight,
                bottom: 0,
                right: 0,
                width: { md: SHELL_LAYOUT.rightRailNarrow, xl: SHELL_LAYOUT.rightRail },
                overflowY: 'auto',
                borderLeft: `1px solid ${SHELL.border.subtle}`,
                backgroundColor: SHELL.bg.app,
                px: 2,
                py: 2.5,
              }}
            >
              {rightRail}
            </Box>
            <Box
              sx={{
                width: { md: SHELL_LAYOUT.rightRailNarrow, xl: SHELL_LAYOUT.rightRail },
                flexShrink: 0,
              }}
            />
          </>
        )}
      </Box>

      {/* Pe mobil, ajutorul nu are unde sta în rail — rămâne ancorat sub conținut. */}
      {isMobile && (
        <Box sx={{ px: 2, pb: 4, textAlign: 'center' }}>
          <Box
            component="a"
            href="mailto:contact@ridelance.ro"
            sx={{
              ...displaySx,
              fontSize: '0.85rem',
              color: TOKENS.textMuted,
              fontWeight: 600,
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            contact@ridelance.ro
          </Box>
        </Box>
      )}
    </Box>
  )
}

function SidebarBrand({ caption }: { caption: string }) {
  return (
    <Stack spacing={0.25} sx={{ px: 1.5, pb: 1 }}>
      <Box component="img" src={logo} alt="RIDElance" sx={{ height: 24, width: 'auto', mb: 0.5 }} />
      <Box sx={{ color: TOKENS.textMuted, fontSize: '0.75rem', lineHeight: 1.66 }}>{caption}</Box>
    </Stack>
  )
}

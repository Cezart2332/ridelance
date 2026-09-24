import { Box, ButtonBase, type SxProps, type Theme } from '@mui/material'
import { keyframes } from '@mui/material/styles'

import { AUTH_COLORS } from '../../components/auth/shell/authShellSx'
import { TOKENS } from '../../constants/tokens'

const bounce = keyframes`
  0%, 80%, 100% { transform: translateY(0); opacity: .55; }
  40% { transform: translateY(-5px); opacity: 1; }
`

/** Lățimea pastilei în care se strânge butonul cât se verifică datele. */
const PILL_WIDTH = 88

/**
 * Butonul de login din aplicație. Cât se verifică datele, se strânge într-o pastilă cu trei puncte
 * care sar; după conectare, cortina acoperă ecranul pornind de aici.
 *
 * Nu e `Button` cu `loading`: acela înlocuiește textul cu un cerc, dar lasă butonul cât era.
 */
export function NativeLoginButton({ loading, sx }: { loading: boolean; sx?: SxProps<Theme> }) {
  return (
    <Box sx={[{ display: 'flex', justifyContent: 'center' }, ...(Array.isArray(sx) ? sx : [sx])]}>
      <ButtonBase
        type="submit"
        aria-busy={loading}
        aria-label={loading ? 'Se verifică datele' : undefined}
        sx={{
          width: loading ? PILL_WIDTH : '100%',
          height: 'var(--auth-button-height, 48px)',
          // Jumătate din înălțime, nu 999px: așa colțurile se rotunjesc treptat, nu dintr-odată.
          borderRadius: loading ? 'calc(var(--auth-button-height, 48px) / 2)' : `${TOKENS.radius.md}px`,
          backgroundColor: AUTH_COLORS.primary,
          color: AUTH_COLORS.onPrimary,
          fontWeight: 750,
          fontSize: '0.98rem',
          boxShadow: '0 8px 20px rgba(69, 184, 226, 0.25)',
          transition: 'width .42s cubic-bezier(0.65, 0, 0.35, 1), border-radius .42s cubic-bezier(0.65, 0, 0.35, 1)',
          '&:active': { transform: 'scale(0.98)' },
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        }}
      >
        {loading ? (
          <Box component="span" aria-hidden sx={{ display: 'inline-flex', gap: '6px' }}>
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                component="span"
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: 'currentColor',
                  animation: `${bounce} 1s ease-in-out ${i * 0.14}s infinite`,
                }}
              />
            ))}
          </Box>
        ) : (
          'Intră în RIDElance'
        )}
      </ButtonBase>
    </Box>
  )
}

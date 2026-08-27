import { Box, Chip, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'

import { TOKENS } from '../../constants/tokens'
import type { BenefitBlock } from '../../data/benefits'

/**
 * Conținutul de la Beneficii, afișat și în pagina publică a partenerului.
 *
 * Oblio, Consulto și Simplifi n-aveau text propriu în `partners.ts`, deci pagina lor publică arăta
 * doar logoul și numele. Textul exista de mult, dar numai în `benefits.ts` — adică doar pentru
 * cineva deja logat.
 *
 * Se citește de acolo, nu se copiază aici: două exemplare ale aceleiași oferte ajung diferite la
 * prima modificare, iar cea publică e tocmai cea pe care o vede un om înainte să fie client.
 */
export function PartnerBenefitBlocks({ blocks }: { blocks: BenefitBlock[] }) {
  if (blocks.length === 0) return null

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: blocks.length > 1 ? '1fr 1fr' : '1fr' },
        gap: 3,
        alignItems: 'stretch',
      }}
    >
      {blocks.map((block) => (
        <Box
          key={block.title}
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: `${TOKENS.radius.lg}px`,
            border: `1px solid ${TOKENS.border}`,
            backgroundColor: TOKENS.paper,
            boxShadow: TOKENS.shadow.sm,
          }}
        >
          {block.badge && (
            <Chip
              label={block.badge}
              size="small"
              sx={{
                mb: 1.5,
                fontWeight: 800,
                backgroundColor: alpha(TOKENS.primary, 0.12),
                color: TOKENS.primaryStrong,
                borderRadius: `${TOKENS.radius.full}px`,
              }}
            />
          )}

          <Typography sx={{ fontWeight: 850, fontSize: '1.12rem', color: TOKENS.ink }}>
            {block.title}
          </Typography>

          {block.text && (
            <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.92rem', lineHeight: 1.7, mt: 1 }}>
              {block.text}
            </Typography>
          )}

          {block.checks && block.checks.length > 0 && (
            <Stack spacing={1.2} sx={{ mt: 2 }}>
              {block.checks.map((check) => (
                <Stack key={check} direction="row" spacing={1.2}>
                  <CheckCircleRoundedIcon
                    sx={{ fontSize: 18, color: TOKENS.primaryStrong, mt: 0.25, flexShrink: 0 }}
                  />
                  <Typography sx={{ fontSize: '0.92rem', color: alpha(TOKENS.ink, 0.85), lineHeight: 1.6 }}>
                    {check}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}

          {block.rows && block.rows.length > 0 && (
            <Stack sx={{ mt: 2 }}>
              {block.rows.map((row, index) => (
                <Stack
                  key={row.label}
                  direction="row"
                  sx={{
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: 2,
                    py: 1.1,
                    borderTop: index === 0 ? 'none' : `1px solid ${TOKENS.border}`,
                  }}
                >
                  <Typography sx={{ fontSize: '0.92rem', color: TOKENS.textMuted }}>
                    {row.label}
                  </Typography>
                  <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: TOKENS.ink, textAlign: 'right' }}>
                    {row.value}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}

          {block.contact && (
            <Stack spacing={0.4} sx={{ mt: 2 }}>
              <Typography sx={{ fontSize: '0.92rem', fontWeight: 800, color: TOKENS.ink }}>
                {block.contact.name}
              </Typography>
              <Typography
                component="a"
                href={`mailto:${block.contact.email}`}
                sx={{ fontSize: '0.9rem', color: TOKENS.primaryStrong, textDecoration: 'none' }}
              >
                {block.contact.email}
              </Typography>
              <Typography
                component="a"
                href={`tel:${block.contact.phone.replace(/\s/g, '')}`}
                sx={{ fontSize: '0.9rem', color: TOKENS.primaryStrong, textDecoration: 'none' }}
              >
                {block.contact.phone}
              </Typography>
            </Stack>
          )}

          {/* Doar linkurile externe. Cele de forma `section:asigurari` duc într-o secțiune de
              dashboard, care nu există pentru un vizitator nelogat. */}
          {block.link && block.link.href.startsWith('http') && (
            <Stack
              component="a"
              href={block.link.href}
              target="_blank"
              rel="noopener noreferrer"
              direction="row"
              spacing={0.6}
              sx={{
                mt: 2,
                alignItems: 'center',
                fontSize: '0.9rem',
                fontWeight: 750,
                color: TOKENS.primaryStrong,
                textDecoration: 'none',
              }}
            >
              {block.link.label}
              <OpenInNewRoundedIcon sx={{ fontSize: 15 }} />
            </Stack>
          )}
        </Box>
      ))}
    </Box>
  )
}

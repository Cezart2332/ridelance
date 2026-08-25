import { Box, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'

import { partnerLogoFor, type PlanFeature } from '../../data/plans'
import { TOKENS } from '../../constants/tokens'

/**
 * O linie din lista unui plan.
 *
 * Când linia e despre un partener, logoul ține locul numelui scris — „BCR: 100 lei bonus" devine
 * logoul urmat de restul frazei. Numele rămâne în `alt`, ca linia să se citească întreagă cu un
 * cititor de ecran.
 *
 * Logoul stă inline, pe linia de bază a textului, nu ca pictogramă separată: e parte din
 * propoziție, nu o decorație lângă ea.
 */
export function PlanFeatureItem({ feature }: { feature: PlanFeature }) {
  const logo = feature.partner ? partnerLogoFor(feature.partner) : null

  return (
    <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2 }}>
      <CheckCircleOutlineRoundedIcon
        sx={{ fontSize: 18, minWidth: 18, mt: 0.3, color: alpha(TOKENS.primary, 0.8) }}
      />
      <Typography
        component="span"
        sx={{ fontSize: '0.9rem', color: alpha(TOKENS.ink, 0.85), lineHeight: 1.7 }}
      >
        {logo && (
          <Box
            component="img"
            src={logo}
            alt={feature.partner}
            sx={{
              height: 15,
              maxWidth: 62,
              width: 'auto',
              objectFit: 'contain',
              verticalAlign: 'text-bottom',
              mr: 0.7,
            }}
          />
        )}
        {feature.prefix ? `${feature.prefix} ` : null}
        {feature.strong && (
          <Box component="strong" sx={{ fontWeight: 800, color: TOKENS.ink }}>
            {feature.strong}
          </Box>
        )}
        {/* Fără spațiu când urmează semn de punctuație: „GRATUITĂ , în oricare" arăta ca o greșeală. */}
        {feature.strong && feature.text && !/^[,.;:]/.test(feature.text) ? ' ' : null}
        {feature.text}
      </Typography>
    </Box>
  )
}

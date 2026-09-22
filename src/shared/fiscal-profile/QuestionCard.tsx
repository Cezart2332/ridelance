import { Box, FormControlLabel, Radio, RadioGroup, Stack, TextField, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded'
import NotesRoundedIcon from '@mui/icons-material/NotesRounded'
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded'
import RadioButtonCheckedRoundedIcon from '@mui/icons-material/RadioButtonCheckedRounded'
import type { SvgIconComponent } from '@mui/icons-material'

import type { Question } from './schema'

const KIND: Record<Question['kind'], { icon: SvgIconComponent; label: string }> = {
  single: { icon: RadioButtonCheckedRoundedIcon, label: 'Alegere unică' },
  date: { icon: CalendarTodayRoundedIcon, label: 'Dată' },
  text: { icon: NotesRoundedIcon, label: 'Text' },
  textarea: { icon: NotesRoundedIcon, label: 'Text' },
  number: { icon: PaymentsRoundedIcon, label: 'Sumă' },
}

interface QuestionCardProps {
  question: Question
  title: string
  help?: string
  value: string | number | null | undefined
  error?: string
  disabled?: boolean
  onChange: (value: string | number | null) => void
}

/**
 * O întrebare = un card (spec §5). Culorile vin doar din temă: accentul e `primary.main`, adică
 * albastrul platformei în oricare dintre cele trei dashboarduri.
 */
export function QuestionCard({ question, title, help, value, error, disabled, onChange }: QuestionCardProps) {
  const kind = KIND[question.kind]
  const Icon = kind.icon
  const titleId = `fp-q-${question.key}`
  const errorId = `${titleId}-error`

  return (
    <Box
      component="section"
      aria-labelledby={titleId}
      data-question={question.key}
      sx={(theme) => ({
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: theme.shadows[1],
        border: `1px solid ${error ? theme.palette.error.main : alpha(theme.palette.text.primary, 0.06)}`,
        p: { xs: 2, sm: 3 },
      })}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
        <Box
          aria-hidden
          sx={(theme) => ({
            width: 32,
            height: 32,
            flexShrink: 0,
            borderRadius: 1,
            display: 'grid',
            placeItems: 'center',
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: 'primary.main',
          })}
        >
          <Icon sx={{ fontSize: 18 }} />
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {kind.label}
        </Typography>
      </Stack>

      <Typography id={titleId} variant="subtitle1" component="h3" sx={{ fontWeight: 600, color: 'text.primary' }}>
        {title}
        {question.required && (
          <Box component="span" aria-hidden sx={{ color: 'text.secondary', ml: 0.5 }}>
            *
          </Box>
        )}
      </Typography>
      {help && (
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {help}
        </Typography>
      )}

      <Box sx={{ mt: 2 }}>
        {question.kind === 'single' && (
          <RadioGroup
            aria-labelledby={titleId}
            aria-describedby={error ? errorId : undefined}
            value={value ?? ''}
            onChange={(event) => onChange(event.target.value)}
            sx={{ gap: 1 }}
          >
            {question.options?.map((option) => {
              const selected = value === option.value
              return (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  disabled={disabled}
                  control={<Radio color="primary" size="small" />}
                  label={<Typography variant="body2">{option.label}</Typography>}
                  sx={(theme) => ({
                    m: 0,
                    px: 2,
                    py: 1.5,
                    width: '100%',
                    borderRadius: 1,
                    border: `1.5px solid ${selected ? theme.palette.primary.main : 'transparent'}`,
                    bgcolor: alpha(theme.palette.primary.main, selected ? 0.12 : 0.05),
                    transition: theme.transitions.create(['background-color', 'border-color'], {
                      duration: theme.transitions.duration.shortest,
                    }),
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, selected ? 0.12 : 0.09) },
                    '&:has(input:focus-visible)': {
                      outline: `2px solid ${theme.palette.primary.main}`,
                      outlineOffset: 2,
                    },
                    '& .MuiRadio-root': { p: 0, mr: 1.5 },
                  })}
                />
              )
            })}
          </RadioGroup>
        )}

        {question.kind === 'number' && (
          <TextField
            type="number"
            fullWidth
            variant="outlined"
            disabled={disabled}
            value={value ?? ''}
            onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))}
            error={!!error}
            slotProps={{
              htmlInput: { min: 0, step: 1, inputMode: 'numeric', 'aria-labelledby': titleId, 'aria-describedby': error ? errorId : undefined },
              input: { endAdornment: <Typography sx={{ color: 'text.secondary', ml: 1 }}>lei</Typography> },
            }}
            sx={(theme) => ({ '& .MuiOutlinedInput-root': { bgcolor: alpha(theme.palette.primary.main, 0.03) } })}
          />
        )}

        {question.kind === 'date' && (
          <TextField
            type="date"
            fullWidth
            variant="outlined"
            disabled={disabled}
            value={value ?? ''}
            onChange={(event) => onChange(event.target.value || null)}
            error={!!error}
            slotProps={{
              htmlInput: { 'aria-labelledby': titleId, 'aria-describedby': error ? errorId : undefined },
            }}
            sx={(theme) => ({ '& .MuiOutlinedInput-root': { bgcolor: alpha(theme.palette.primary.main, 0.03) } })}
          />
        )}

        {(question.kind === 'text' || question.kind === 'textarea') && (
          <TextField
            fullWidth
            variant="outlined"
            disabled={disabled}
            multiline={question.kind === 'textarea'}
            minRows={question.kind === 'textarea' ? 3 : undefined}
            placeholder={question.placeholder}
            value={value ?? ''}
            onChange={(event) => onChange(event.target.value === '' ? null : event.target.value)}
            error={!!error}
            slotProps={{
              htmlInput: {
                maxLength: 2000,
                'aria-labelledby': titleId,
                'aria-describedby': error ? errorId : undefined,
              },
            }}
            sx={(theme) => ({ '& .MuiOutlinedInput-root': { bgcolor: alpha(theme.palette.primary.main, 0.03) } })}
          />
        )}

        {error && (
          <Typography id={errorId} role="alert" variant="body2" sx={{ color: 'error.main', mt: 1, fontWeight: 600 }}>
            {error}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

import { useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { TOKENS } from '../../constants/tokens'

export function ServicePaymentSuccessDialog() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (searchParams.get('service_paid') === '1') {
      setOpen(true)
    }
  }, [searchParams])

  const handleClose = () => {
    setOpen(false)
    const next = new URLSearchParams(searchParams)
    next.delete('service_paid')
    const qs = next.toString()
    navigate({ pathname: '/', search: qs ? `?${qs}` : '' }, { replace: true })
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 800 }}>
        <CheckCircleRoundedIcon sx={{ color: TOKENS.primary, fontSize: 32 }} />
        Plată reușită
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ color: TOKENS.textMuted, lineHeight: 1.7 }}>
          Mulțumim! Plata ta a fost înregistrată. Echipa RIDElance te va contacta în curând pentru
          următorii pași. Ți-am trimis și un email de confirmare la adresa furnizată.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="contained" onClick={handleClose} sx={{ fontWeight: 700, borderRadius: TOKENS.radius.full }}>
          Am înțeles
        </Button>
      </DialogActions>
    </Dialog>
  )
}

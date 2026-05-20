import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { CarsAdminView } from '../components/dashboard/sections/admin/CarsAdminView'
import { authService } from '../services/auth.service'
import { userService, type UserProfile } from '../services/user.service'
import { useEffect, useState } from 'react'
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded'

export function CarPosterDashboard() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    userService.getProfile().then(setProfile).catch(() => {})
  }, [])

  const handleLogout = async () => {
    await authService.logout()
    navigate('/auth', { replace: true })
  }

  const userName = profile ? `${profile.firstName} ${profile.lastName}` : '...'

  return (
    <DashboardLayout
      navItems={[{ id: 'cars', label: 'Mașinile mele', icon: <DirectionsCarFilledRoundedIcon /> }]}
      activeId="cars"
      onNavClick={() => {}}
      onLogout={handleLogout}
      userName={userName}
      userRole="Postator mașini"
    >
      <CarsAdminView variant="poster" />
    </DashboardLayout>
  )
}

import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { CarsAdminView } from '../components/dashboard/sections/admin/CarsAdminView'
import { authService } from '../services/auth.service'
import { userService, type UserProfile } from '../services/user.service'
import { useEffect, useState } from 'react'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded'
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded'
import { InsuranceTab } from '../components/dashboard/sections/InsuranceTab'
import { ROLE_LABELS } from '../utils/roleLabels'

export function CarPosterDashboard() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [activeSection, setActiveSection] = useState('home')

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
      navItems={[
        { id: 'home', label: 'Acasă', icon: <HomeRoundedIcon /> },
        { id: 'cars', label: 'Mașinile mele', icon: <DirectionsCarFilledRoundedIcon /> },
        { id: 'asigurari', label: 'Asigurări', icon: <ShieldRoundedIcon /> },
      ]}
      activeId={activeSection}
      onNavClick={setActiveSection}
      onLogout={handleLogout}
      userName={userName}
      userRole={ROLE_LABELS.CarPoster}
    >
      {activeSection === 'asigurari' ? (
        <InsuranceTab />
      ) : (
        <CarsAdminView
          variant="poster"
          posterSection={activeSection === 'home' ? 'overview' : 'manage'}
        />
      )}
    </DashboardLayout>
  )
}

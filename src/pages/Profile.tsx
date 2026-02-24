import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import CustomerProfile from './profile/CustomerProfile'
import SellerProfile from './profile/SellerProfile'
import AdminProfile from './profile/AdminProfile'

export default function Profile() {
  const { user, loading } = useAuth()
  const [searchParams] = useSearchParams()
  const tab = searchParams.get('tab')

  if (loading) {
    return (
      <div className="container py-12">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />
  }

  // Route based on user role
  if (user.role === 'admin') {
    return <AdminProfile />
  }

  if (user.role === 'seller') {
    return <SellerProfile />
  }

  return <CustomerProfile defaultTab={tab || undefined} />
}

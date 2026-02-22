import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import CustomerProfile from './profile/CustomerProfile'
import SellerProfile from './profile/SellerProfile'
import AdminProfile from './profile/AdminProfile'

export default function Profile() {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/auth/login" replace />
  }

  // Route based on user role
  if (user.role === 'admin') {
    return <AdminProfile />
  } else if (user.role === 'seller') {
    return <SellerProfile />
  } else {
    return <CustomerProfile />
  }
}

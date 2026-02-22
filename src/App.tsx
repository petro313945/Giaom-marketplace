import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { Toaster } from '@/components/ui/toaster'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'
import Category from './pages/Category'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Checkout from './pages/Checkout'
import BecomeSeller from './pages/BecomeSeller'
import Profile from './pages/Profile'
import Layout from './components/Layout'

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/category/:slug" element={<Category />} />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/sign-up" element={<Signup />} />
              <Route 
                path="/checkout" 
                element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/become-seller" 
                element={
                  <ProtectedRoute>
                    <BecomeSeller />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile/*" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
            </Routes>
            <Toaster />
          </Layout>
        </Router>
      </CartProvider>
    </AuthProvider>
  )
}

export default App

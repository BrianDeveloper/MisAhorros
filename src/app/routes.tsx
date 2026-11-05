import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from '@/pages/Home'
import Transactions from '@/pages/Transactions'
import Savings from '@/pages/Savings'
import Login from '@/pages/Login'
import Profile from '@/pages/Profile'
import Predictions from '@/pages/Predictions'
import Categories from '@/pages/Categories'
import Budgets from '@/pages/Budgets'
import { PrivateRoute } from '@/components/auth/PrivateRoute'

export function AppRoutes() {
  const Router = import.meta.env.VITE_USE_HASH_ROUTER === 'true' ? HashRouter : BrowserRouter

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/movimientos"
          element={
            <PrivateRoute>
              <Transactions />
            </PrivateRoute>
          }
        />
        <Route
          path="/metas"
          element={
            <PrivateRoute>
              <Savings />
            </PrivateRoute>
          }
        />
        <Route
          path="/predicciones"
          element={
            <PrivateRoute>
              <Predictions />
            </PrivateRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/categorias"
          element={
            <PrivateRoute>
              <Categories />
            </PrivateRoute>
          }
        />
        <Route
          path="/presupuestos"
          element={
            <PrivateRoute>
              <Budgets />
            </PrivateRoute>
          }
        />
        <Route path="/ajustes" element={<Navigate to="/perfil" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

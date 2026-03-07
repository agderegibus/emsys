import { BrowserRouter, Routes, Route } from "react-router-dom"
import AppLayout from "@/layout/AppLayout"
import { Toaster } from "@/components/ui/sonner"
import ProtectedRoute from "@/components/ProtectedRoute"

import Login from "@/pages/Login"
import POS from "@/pages/POS"
import Productos from "@/pages/Productos"
import Stock from "@/pages/Stock"
import Clientes from "@/pages/Clientes"
import Proveedores from "@/pages/Proveedores"
import Usuarios from "@/pages/Usuarios"
import Analytics from "@/pages/Analytics"
import Empleados from "@/pages/Empleados"
import Admin from "@/pages/Admin"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route - Login */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          {/* Routes accessible to all authenticated users */}
          <Route path="/" element={<POS />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/clientes" element={<Clientes />} />

          {/* Admin-only routes */}
          <Route path="/stock" element={
            <ProtectedRoute requireAdmin>
              <Stock />
            </ProtectedRoute>
          } />
          <Route path="/proveedores" element={
            <ProtectedRoute requireAdmin>
              <Proveedores />
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute requireAdmin>
              <Analytics />
            </ProtectedRoute>
          } />
          <Route path="/usuarios" element={
            <ProtectedRoute requireAdmin>
              <Usuarios />
            </ProtectedRoute>
          } />
          <Route path="/empleados" element={
            <ProtectedRoute requireAdmin>
              <Empleados />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin>
              <Admin />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
      <Toaster richColors position="top-right" />
    </BrowserRouter>
  )
}

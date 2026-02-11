import { BrowserRouter, Routes, Route } from "react-router-dom"
import AppLayout from "@/layout/AppLayout"
import { Toaster } from "@/components/ui/sonner"

import POS from "@/pages/POS"
import Productos from "@/pages/Productos"
import Stock from "@/pages/Stock"
import Clientes from "@/pages/Clientes"
import Proveedores from "@/pages/Proveedores"
import Usuarios from "@/pages/Usuarios"
import Analytics from "@/pages/Analytics"
import Empleados from "@/pages/Empleados"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<POS />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/proveedores" element={<Proveedores />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/empleados" element={<Empleados />} />
        </Route>
      </Routes>
      <Toaster richColors position="top-right" />
    </BrowserRouter>
  )
}

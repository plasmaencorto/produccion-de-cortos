// ===== Rutas de la aplicación =====
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Rescate from './components/Rescate'
import Proyectos from './pages/Proyectos'
import Dashboard from './pages/Dashboard'
import Desglose from './pages/Desglose'
import Tomas from './pages/Tomas'
import ImportarGuion from './pages/ImportarGuion'
import Presupuesto from './pages/Presupuesto'
import Gastos from './pages/Gastos'
import PlanRodaje from './pages/PlanRodaje'
import HojaLlamado from './pages/HojaLlamado'
import Personas from './pages/Personas'
import Locaciones from './pages/Locaciones'
import Equipamiento from './pages/Equipamiento'
import Reportes from './pages/Reportes'
import Documentos from './pages/Documentos'

export default function App() {
  return (
    <Rescate>
      <HashRouter>
        <Routes>
        <Route path="/" element={<Proyectos />} />
        <Route path="/p/:id" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="desglose" element={<Desglose />} />
          <Route path="tomas" element={<Tomas />} />
          <Route path="guion" element={<ImportarGuion />} />
          <Route path="presupuesto" element={<Presupuesto />} />
          <Route path="gastos" element={<Gastos />} />
          <Route path="plan" element={<PlanRodaje />} />
          <Route path="llamado" element={<HojaLlamado />} />
          <Route path="personas" element={<Personas />} />
          <Route path="locaciones" element={<Locaciones />} />
          <Route path="equipamiento" element={<Equipamiento />} />
          <Route path="documentos" element={<Documentos />} />
          <Route path="reportes" element={<Reportes />} />
        </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </Rescate>
  )
}

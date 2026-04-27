import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import PipelineDetail from './pages/PipelineDetail'
import Alerts from './pages/Alerts'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar />
        <Routes>
          <Route path="/"               element={<Dashboard />} />
          <Route path="/pipeline/:id"   element={<PipelineDetail />} />
          <Route path="/alerts"         element={<Alerts />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
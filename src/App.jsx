import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar/Sidebar.jsx'
import MiniOverview from './pages/MiniOverview.jsx'
import ProductAdmin from './pages/ProductAdmin.jsx'
import MinisAdmin from './pages/MinisAdmin.jsx'
import DatabaseOverview from './pages/DatabaseOverview.jsx'
import ManualSQL from './pages/ManualSQL.jsx'
import './App.css'

function App() {
  return (
    <Router>
      <div className="d-flex">
        <Sidebar />
        <div className="flex-grow-1">
          <Routes>
            <Route path="/overview" element={<MiniOverview />} />
            <Route path="/product-admin" element={<ProductAdmin />} />
            <Route path="/minis-admin" element={<MinisAdmin />} />
            <Route path="/database" element={<DatabaseOverview />} />
            <Route path="/manual-sql" element={<ManualSQL />} />
            <Route path="/" element={<Navigate to="/overview" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App

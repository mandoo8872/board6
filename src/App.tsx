import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AdminPage from './components/AdminPage'
import ViewPage from './components/ViewPage'

const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/view" element={<ViewPage />} />
      {/* 기본 경로는 /view로 리다이렉트 */}
      <Route path="*" element={<Navigate to="/view" replace />} />
    </Routes>
  </BrowserRouter>
)

export default App 
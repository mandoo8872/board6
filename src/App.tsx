import React from 'react'
import AdminPage from './components/AdminPage'
import ViewPage from './components/ViewPage'

const App: React.FC = () => {
  // URL의 path로 페이지 결정
  const isViewPage = window.location.pathname.includes('/view')

  return (
    <>
      {isViewPage ? <ViewPage /> : <AdminPage />}
    </>
  )
}

export default App 
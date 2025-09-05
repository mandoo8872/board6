import React, { useState } from 'react';
import PasswordGate from './PasswordGate';

const AdminPage = React.lazy(() => import('../pages/AdminPage'));

const AdminGate: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handlePasswordSuccess = () => {
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <PasswordGate passwordKey="ADMIN" onSuccess={handlePasswordSuccess} />;
  }

  return <AdminPage />;
};

export default AdminGate; 
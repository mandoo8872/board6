import React, { useState } from 'react';
import PasswordGate from './PasswordGate';

const ViewPage = React.lazy(() => import('../pages/ViewPage'));

const ViewGate: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handlePasswordSuccess = () => {
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <PasswordGate passwordKey="VIEW" onSuccess={handlePasswordSuccess} />;
  }

  return <ViewPage />;
};

export default ViewGate; 
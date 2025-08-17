import React from 'react';
import Canvas from '../components/Canvas';
import { default as Toolbar } from '../components/toolbar/Toolbar';
import ZoomControls from '../components/zoom/ZoomControls';
import DrawToolSettings from '../components/toolbar/DrawToolSettings';
import { auth, database } from '../config/firebase';
import { usePageBootstrap } from '../hooks/usePageBootstrap';

const AdminPage: React.FC = () => {
  const { ready } = usePageBootstrap({
    boardId: 'default',
    auth,
    rtdb: database,
    onReady: () => {},
    onError: () => {},
  });

  return ready ? (
    <div className={`bg-[#F5F7FA] w-screen h-screen overflow-hidden flex`}>
      <div className={`w-72 h-full bg-[#1F3A5F] border-r border-[#172A46] shadow-lg`}>
        <Toolbar />
      </div>
      <main className={`flex-1 h-full relative bg-[#F5F7FA]`}>
        <div className="pointer-events-none absolute inset-4 rounded-xl ring-1 ring-white/70 shadow-[0_8px_24px_rgba(31,58,95,0.08)]" />
        <Canvas isViewPage={false} />
        <DrawToolSettings />
      </main>
      <ZoomControls />
    </div>
  ) : null;
};

export default AdminPage; 
import React, { useState } from 'react';
import Canvas from '../components/Canvas';
import { default as Toolbar } from '../components/toolbar/Toolbar';
import ZoomControls from '../components/zoom/ZoomControls';
import DrawToolSettings from '../components/toolbar/DrawToolSettings';
import { auth, database } from '../config/firebase';
import { usePageBootstrap } from '../hooks/usePageBootstrap';
import { CaretDoubleLeft, CaretDoubleRight } from 'phosphor-react';

const AdminPage: React.FC = () => {
  const { ready } = usePageBootstrap({
    boardId: 'default',
    auth,
    rtdb: database,
    onReady: () => {},
    onError: () => {},
  });

  const [collapsed, setCollapsed] = useState(false);

  return ready ? (
    <div className={`bg-[#F5F7FA] w-screen h-screen overflow-hidden flex`}>
      <div className={`${collapsed ? 'w-10' : 'w-72'} relative h-full bg-[#1F3A5F] border-r border-[#172A46] shadow-lg transition-all duration-200`}>
        {/* 토글 버튼 */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? '툴바 펼치기' : '툴바 접기'}
          className={`absolute top-2 right-2 rounded bg-white/10 hover:bg-white/20 text-white p-1 transition-colors`}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {collapsed ? <CaretDoubleRight size={16} weight="bold" /> : <CaretDoubleLeft size={16} weight="bold" />}
        </button>
        {!collapsed && <Toolbar />}
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
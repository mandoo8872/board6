import React, { useEffect } from 'react';
import Canvas from '../components/Canvas';
import { default as Toolbar } from '../components/toolbar/Toolbar';
import ZoomControls from '../components/zoom/ZoomControls';
import DrawToolSettings from '../components/toolbar/DrawToolSettings';
import { useAdminConfigStore } from '../store/adminConfigStore';

const AdminPage: React.FC = () => {
  const { initializeFirebaseListeners } = useAdminConfigStore();

  useEffect(() => {
    // AdminPage에서 Firebase 리스너 초기화
    initializeFirebaseListeners();
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      const { cleanupFirebaseListeners } = useAdminConfigStore.getState();
      cleanupFirebaseListeners();
    };
  }, [initializeFirebaseListeners]);

  return (
    <div className="w-screen h-screen overflow-hidden flex">
      {/* 왼쪽 툴바 */}
      <div className="w-72 h-full bg-slate-100/95 backdrop-blur-sm shadow-xl border-r border-slate-200">
        <Toolbar />
      </div>
      
      {/* 메인 캔버스 영역 - 나머지 공간 전체 사용 */}
      <main className="flex-1 h-full relative">
        <Canvas isViewPage={false} />
        
        {/* 필기/지우개 도구 설정 */}
        <DrawToolSettings />
      </main>
      
      {/* 확대/축소 컨트롤 */}
      <ZoomControls />
    </div>
  );
};

export default AdminPage; 
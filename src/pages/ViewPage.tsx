import React, { useEffect, useState, useRef } from 'react';
import Canvas from '../components/Canvas';
import ViewFloatingToolbar from '../components/toolbar/ViewFloatingToolbar';
import ViewVirtualKeyboard from '../components/keyboard/ViewVirtualKeyboard';
import { useAdminConfigStore } from '../store/adminConfigStore';
import { auth, database } from '../config/firebase';
import { usePageBootstrap } from '../hooks/usePageBootstrap';

const ViewPage: React.FC = () => {
  const { settings } = useAdminConfigStore();

  // 설정이 로드되지 않았을 때 기본값 제공
  const virtualKeyboardEnabled = settings?.view?.virtualKeyboardEnabled ?? true;

  // 플로팅 툴바 자동 숨김 상태 관리
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { ready } = usePageBootstrap({
    boardId: 'default',
    auth,
    rtdb: database,
    onReady: () => {},
    onError: () => {},
  });

  // 플로팅 툴바 자동 숨김 관리
  useEffect(() => {
    const startHideTimer = () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      
      hideTimerRef.current = setTimeout(() => {
        setToolbarVisible(false);
      }, 10000); // 10초 후 숨김
    };

    const showToolbar = () => {
      setToolbarVisible(true);
      startHideTimer();
    };

    // 사용자 액션 감지 이벤트 핸들러
    const handleUserAction = () => {
      showToolbar();
    };

    // 초기 타이머 시작
    startHideTimer();

    // 전역 이벤트 리스너 등록
    window.addEventListener('mousemove', handleUserAction);
    window.addEventListener('mousedown', handleUserAction);
    window.addEventListener('click', handleUserAction);
    window.addEventListener('touchstart', handleUserAction);

    // 정리
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      
      window.removeEventListener('mousemove', handleUserAction);
      window.removeEventListener('mousedown', handleUserAction);
      window.removeEventListener('click', handleUserAction);
      window.removeEventListener('touchstart', handleUserAction);
    };
  }, []);

  return ready ? (
    <div className="w-screen h-screen overflow-hidden relative">
      {/* 메인 캔버스 영역 */}
      <main className="w-full h-full">
        <Canvas isViewPage={true} />
      </main>
      
      {/* ViewPage 전용 플로팅 툴바 - 조건부 렌더링 */}
      {toolbarVisible && <ViewFloatingToolbar />}
      
      {/* ViewPage 전용 가상 키보드 (설정에 따라 표시) */}
      {virtualKeyboardEnabled && <ViewVirtualKeyboard />}
    </div>
  ) : null;
};

export default ViewPage; 
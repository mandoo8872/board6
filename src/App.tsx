import React, { useEffect, Suspense } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate
} from 'react-router-dom';

// 패스워드 게이트가 적용된 페이지 컴포넌트들
const AdminGate = React.lazy(() => import('./components/AdminGate'));
const ViewGate = React.lazy(() => import('./components/ViewGate'));

const App: React.FC = () => {
  // 인증 관련 상태 (현재 사용하지 않음)
  // const [isAuthenticated, setIsAuthenticated] = useState(false);
  // const [password, setPassword] = useState('');

  // 전역 이벤트 방지 (iPad Safari 호환성 최적화)
  useEffect(() => {
    // 컨텍스트 메뉴 방지 (우클릭 및 터치 길게 누르기)
    const handleContextMenu = (e: Event) => {
      try {
        e.preventDefault();
      } catch (error) {
        // passive event listener에서 실패 시 무시
        console.debug('preventDefault failed in global context menu:', error);
      }
      return false;
    };

    // 터치 길게 누르기 방지 (iPad Safari 최적화)
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        let longPressTimer: NodeJS.Timeout;

        const preventLongPress = () => {
          longPressTimer = setTimeout(() => {
            try {
              e.preventDefault();
            } catch (error) {
              // passive event에서 실패 시 무시
            }
          }, 300); // iPad Safari 최적화: 300ms로 단축
        };

        const clearLongPress = () => {
          if (longPressTimer) {
            clearTimeout(longPressTimer);
          }
          document.removeEventListener('touchend', clearLongPress);
          document.removeEventListener('touchmove', clearLongPress);
        };

        preventLongPress();
        document.addEventListener('touchend', clearLongPress, { once: true });
        document.addEventListener('touchmove', clearLongPress, { once: true });
      }
    };

    // 선택 방지 (텍스트 드래그 선택 방지)
    const handleSelectStart = (e: Event) => {
      // 입력 필드가 아닌 경우에만 방지
      const target = e.target as HTMLElement;
      if (target && !['INPUT', 'TEXTAREA'].includes(target.tagName) && !target.isContentEditable) {
        e.preventDefault();
        return false;
      }
    };

    // 드래그 방지
    const handleDragStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // 이벤트 리스너 등록
    document.addEventListener('contextmenu', handleContextMenu, { passive: false });
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('selectstart', handleSelectStart, { passive: false });
    document.addEventListener('dragstart', handleDragStart, { passive: false });

    // cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  return (
    <Router>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">페이지를 불러오는 중...</p>
          </div>
        </div>
      }>
        <Routes>
          <Route path="/admin" element={<AdminGate />} />
          <Route path="/view" element={<ViewGate />} />
          <Route path="/" element={<Navigate to="/view" />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App; 
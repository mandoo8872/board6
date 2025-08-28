import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAdminConfigStore, useEditorStore } from '../store';
import BaseLayer from './layers/BaseLayer';
import FixedGridLayer from './layers/FixedGridLayer';
import DrawLayer from './layers/DrawLayer';
import GridLayer from './layers/GridLayer';
import ExcelPreviewLayer from './layers/ExcelPreviewLayer';

interface CanvasProps {
  isViewPage?: boolean;
}

// 2160x3840 4K 세로형 고정 해상도
const CANVAS_WIDTH = 2160;
const CANVAS_HEIGHT = 3840;

const Canvas: React.FC<CanvasProps> = ({ isViewPage = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [autoScale, setAutoScale] = useState(0.15); // 초기 로딩용 임시값
  const { zoom, viewOffset, setZoom, setViewOffset, zoomAtPoint, currentTool } = useEditorStore();
  const { floorImage, settings } = useAdminConfigStore();

  // 설정이 로드되지 않았을 때 기본값 제공
  const safeGridSettings = {
    gridVisible: settings?.admin?.gridVisible ?? true,
    gridSize: settings?.admin?.gridSize ?? 32
  };

  // 마우스 휠 이벤트 핸들러 (캔버스 영역 전용 - 일반 스크롤 허용)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    // Ctrl 키가 눌린 상태에서는 전역 휠 이벤트에서 처리하므로 여기서는 무시
    if (e.ctrlKey) {
      return;
    }
    
    // 일반 휠 이벤트는 스크롤로 처리 (확대/축소 하지 않음)
    // 기본 스크롤 동작 허용
  }, []);

  // 모바일 두 손가락 핀치/팬 제스처 상태
  const gestureRef = useRef<{
    active: boolean;
    startDistance: number;
    startCenter: { x: number; y: number } | null;
    startZoom: number;
    startOffset: { x: number; y: number };
  }>({ active: false, startDistance: 0, startCenter: null, startZoom: 1, startOffset: { x: 0, y: 0 } });

  const isTouchDevice = () => {
    if (typeof window === 'undefined') return false;
    return ('ontouchstart' in window) || (navigator.maxTouchPoints ?? 0) > 0;
  };

  const getTouchCenterAndDistance = (touches: TouchList) => {
    const t1 = touches[0];
    const t2 = touches[1];
    const center = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
    const dx = t2.clientX - t1.clientX;
    const dy = t2.clientY - t1.clientY;
    const distance = Math.hypot(dx, dy);
    return { center, distance };
  };

  const handleTouchStartGesture = useCallback((e: React.TouchEvent) => {
    if (isViewPage) return; // 어드민에서만
    if (!isTouchDevice()) return;
    if (e.touches.length === 2) {
      // 핀치 제스처 시작
      const { center, distance } = getTouchCenterAndDistance(e.nativeEvent.touches);
      gestureRef.current.active = true;
      gestureRef.current.startDistance = Math.max(1, distance);
      gestureRef.current.startCenter = center;
      gestureRef.current.startZoom = zoom;
      gestureRef.current.startOffset = { x: viewOffset.x, y: viewOffset.y };
      try { e.preventDefault(); } catch {}
    }
  }, [isViewPage, zoom, viewOffset]);

  const handleTouchMoveGesture = useCallback((e: React.TouchEvent) => {
    if (!gestureRef.current.active) return;
    if (!containerRef.current) return;
    if (e.touches.length !== 2) return;
    const { center, distance } = getTouchCenterAndDistance(e.nativeEvent.touches);
    const startCenter = gestureRef.current.startCenter;
    if (!startCenter) return;

    // 새로운 줌 계산 (클램프 적용)
    const scaleRatio = Math.max(0.2, distance / Math.max(1, gestureRef.current.startDistance));
    const targetZoom = Math.min(5.0, Math.max(0.05, gestureRef.current.startZoom * scaleRatio));

    // 팬: 화면 좌표의 중심 이동을 캔버스 오프셋으로 변환 (스케일 보정)
    const finalScale = autoScale * targetZoom;
    const deltaX = center.x - startCenter.x;
    const deltaY = center.y - startCenter.y;
    const newOffsetX = gestureRef.current.startOffset.x + (deltaX / (finalScale || 1));
    const newOffsetY = gestureRef.current.startOffset.y + (deltaY / (finalScale || 1));

    // 상태 적용 (줌 먼저, 그 다음 오프셋)
    setZoom(targetZoom);
    setViewOffset({ x: newOffsetX, y: newOffsetY });

    try { e.preventDefault(); } catch {}
  }, [autoScale, setZoom, setViewOffset]);

  const handleTouchEndGesture = useCallback((e: React.TouchEvent) => {
    if (!gestureRef.current.active) return;
    if (e.touches.length < 2) {
      gestureRef.current.active = false;
      gestureRef.current.startCenter = null;
    }
  }, []);

  // zoom이 비정상적으로 작으면 1.0으로 리셋
  useEffect(() => {
    if (zoom < 0.04) {
      setZoom(1.0);
    }
  }, [zoom, setZoom]);

  // 전역 wheel 이벤트 리스너 (Ctrl + 휠 조합 전용)
  useEffect(() => {
    const handleGlobalWheel = (e: WheelEvent) => {
      // Ctrl 키가 눌린 상태에서만 처리
      if (e.ctrlKey) {
        try {
          e.preventDefault(); // 브라우저 기본 확대/축소 차단
        } catch (error) {
          console.debug('preventDefault failed in global wheel handler:', error);
        }
        
        // 캔버스 컨테이너와 캔버스 요소가 있는지 확인
        if (!containerRef.current || !canvasRef.current) return;
        
        const containerRect = containerRef.current.getBoundingClientRect();
        
        // 마우스 위치 계산 (컨테이너 기준)
        const mouseXRelative = e.clientX - containerRect.left;
        const mouseYRelative = e.clientY - containerRect.top;
        
        // wheelDelta는 양수면 위로(확대), 음수면 아래로(축소)
        const delta = -e.deltaY;
        
        // 확대/축소 실행
        zoomAtPoint(delta, mouseXRelative, mouseYRelative, containerRect);
      }
    };

    // window에 wheel 이벤트 리스너 추가 (passive: false로 설정하여 preventDefault 허용)
    window.addEventListener('wheel', handleGlobalWheel, { passive: false });
    
    return () => {
      window.removeEventListener('wheel', handleGlobalWheel);
    };
  }, [zoomAtPoint]);

  // 전역 키보드 이벤트 리스너 (Ctrl + +, Ctrl + - 조합)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Plus (확대)
      if (e.ctrlKey && (e.key === '+' || e.key === '=')) {
        try {
          e.preventDefault();
        } catch (error) {
          console.debug('preventDefault failed in global keydown handler:', error);
        }
        
        if (!containerRef.current || !canvasRef.current) return;
        
        const containerRect = containerRef.current.getBoundingClientRect();
        // 화면 중앙을 기준으로 확대
        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;
        
        zoomAtPoint(120, centerX, centerY, containerRect); // 양수 값으로 확대
      }
      
      // Ctrl + Minus (축소)
      if (e.ctrlKey && e.key === '-') {
        try {
          e.preventDefault();
        } catch (error) {
          console.debug('preventDefault failed in global keydown handler:', error);
        }
        
        if (!containerRef.current || !canvasRef.current) return;
        
        const containerRect = containerRef.current.getBoundingClientRect();
        // 화면 중앙을 기준으로 축소
        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;
        
        zoomAtPoint(-120, centerX, centerY, containerRect); // 음수 값으로 축소
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [zoomAtPoint]);

  // Firebase 리스너는 상위 페이지(ViewPage/AdminPage)에서 초기화하므로 여기서는 제거

  // 창 크기에 맞는 자동 스케일 계산
  useEffect(() => {
    const updateAutoScale = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // 컨테이너가 너무 작으면 최소값 사용
        if (containerWidth <= 0 || containerHeight <= 0) {
          setAutoScale(0.15);
          return;
        }
        
        // 여백 없이 창에 딱 맞게 맞춤
        const scaleX = containerWidth / CANVAS_WIDTH;
        const scaleY = containerHeight / CANVAS_HEIGHT;
        
        // 두 스케일 중 작은 값을 사용하여 캔버스가 완전히 들어가도록 함
        const newAutoScale = Math.min(scaleX, scaleY);
        
        setAutoScale(Math.max(0.1, newAutoScale)); // 최소 0.1 보장
      }
    };

    // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 계산
    const timeoutId = setTimeout(updateAutoScale, 100);
    
    window.addEventListener('resize', updateAutoScale);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateAutoScale);
    };
  }, [zoom]);

  const finalScale = autoScale * zoom;
  const scaledWidth = CANVAS_WIDTH * finalScale;
  const scaledHeight = CANVAS_HEIGHT * finalScale;

  // 스크롤 필요 여부 계산
  const containerWidth = containerRef.current?.clientWidth || 0;
  const containerHeight = containerRef.current?.clientHeight || 0;

  // 캔버스가 컨테이너보다 클 때만 여백 추가, 작을 때는 컨테이너 크기 사용
  const needsHorizontalScroll = scaledWidth > containerWidth;
  const needsVerticalScroll = scaledHeight > containerHeight;
  
  const scrollAreaWidth = needsHorizontalScroll 
    ? scaledWidth 
    : containerWidth;
  const scrollAreaHeight = needsVerticalScroll 
    ? scaledHeight 
    : containerHeight;

  // 스케일에 따른 그리드 표시 여부 결정
  // const shouldShowGrid = gridEnabled && finalScale > 0.3; // 현재 사용하지 않음

  // 컨텍스트 메뉴 방지 (iPad Safari 호환)
  const handleContextMenu = (e: React.MouseEvent) => {
    try {
      e.preventDefault();
      e.stopPropagation();
    } catch (error) {
      // passive event listener에서 실패 시 무시
      console.debug('preventDefault failed in Canvas context menu:', error);
    }
    return false;
  };

  // 터치 길게 누르기 방지 (iPad Safari 최적화)
  const handleTouchStart = (e: React.TouchEvent) => {
    // iPad에서 길게 누르기 시 컨텍스트 메뉴 방지
    if (e.touches.length === 1) {
      const longPressTimer = setTimeout(() => {
        try {
          e.preventDefault();
        } catch (error) {
          // passive event에서 실패 시 무시
        }
      }, 200); // iPad Safari 최적화: 200ms로 단축
      
      // 터치가 끝나거나 이동하면 타이머 취소
      const clearTimer = () => {
        clearTimeout(longPressTimer);
        document.removeEventListener('touchend', clearTimer);
        document.removeEventListener('touchmove', clearTimer);
      };
      
      document.addEventListener('touchend', clearTimer, { once: true });
      document.addEventListener('touchmove', clearTimer, { once: true });
    }
  };

  // 현재 도구에 따른 커서 설정
  const getCursor = () => {
    if (currentTool === 'pen' || currentTool === 'eraser') {
      return 'crosshair';
    }
    return isViewPage ? 'default' : 'default';
  };

  return (
    <div 
      ref={containerRef}
      onWheel={handleWheel}
      onTouchStart={handleTouchStartGesture}
      onTouchMove={handleTouchMoveGesture}
      onTouchEnd={handleTouchEndGesture}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflowX: needsHorizontalScroll ? 'auto' : 'hidden',
        overflowY: needsVerticalScroll ? 'auto' : 'hidden',
        backgroundColor: 'transparent',
        cursor: getCursor(),
      }}
    >
      {/* 가상 스크롤 영역 - 실제 스케일된 캔버스 크기를 반영 (스크롤이 필요할 때만) */}
      {(needsHorizontalScroll || needsVerticalScroll) && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: scrollAreaWidth,
            height: scrollAreaHeight,
            pointerEvents: 'none', // 클릭 이벤트 무시
            zIndex: 1,
          }}
        />
      )}

      {/* 캔버스 컨테이너 - 2160x3840 고정 크기, 가용 영역 중앙 배치 */}
      <div
        ref={canvasRef}
        data-canvas-container
        style={{
          position: 'absolute',
          backgroundColor: '#ffffff',
          border: '1px solid #d1d5db',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          transform: `translate(${viewOffset.x}px, ${viewOffset.y}px) scale(${finalScale})`,
          transformOrigin: 'center center',
          left: (needsHorizontalScroll || needsVerticalScroll) 
            ? scrollAreaWidth / 2 
            : '50%', // 스크롤이 없으면 컨테이너 중앙
          top: (needsHorizontalScroll || needsVerticalScroll) 
            ? scrollAreaHeight / 2 
            : '50%', // 스크롤이 없으면 컨테이너 중앙
          marginLeft: `-${CANVAS_WIDTH / 2}px`,
          marginTop: `-${CANVAS_HEIGHT / 2}px`,
          zIndex: 10,
        }}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
      >
        {/* 최하단: Background (floor.png) - zIndex 0 */}
        {floorImage ? (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${floorImage.path})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              zIndex: 0,
            }}
          />
        ) : (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#f9fafb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 0,
          }}>
            <div style={{
              color: '#9ca3af',
              fontSize: '24px',
              textAlign: 'center'
            }}>
              Board7 Canvas<br/>
              <span style={{ fontSize: '16px' }}>2160 x 3840</span>
            </div>
          </div>
        )}

        {/* 중간층: 콘텐츠 레이어 - zIndex 100~9999 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 100,
        }}>
          {/* 그리드 레이어: 배경 위에 표시 */}
          <GridLayer 
            gridEnabled={safeGridSettings.gridVisible}
            gridSize={safeGridSettings.gridSize}
            canvasWidth={CANVAS_WIDTH}
            canvasHeight={CANVAS_HEIGHT}
          />

          {/* FixedGridLayer: 엑셀 붙여넣기용 셀, 배경 위 고정 */}
          <FixedGridLayer />

          {/* BaseLayer: 텍스트, 체크박스, 사각형, 이미지 포함 모든 객체 */}
          <BaseLayer isViewPage={isViewPage} />

          {/* 엑셀 미리보기 레이어: BaseLayer 위에 배치 */}
          <ExcelPreviewLayer />
        </div>

        {/* 최상단: DrawLayer - zIndex 10000 (항상 최상단) */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10000,
          pointerEvents: (currentTool === 'pen' || currentTool === 'eraser') ? 'auto' : 'none',
        }}>
          <DrawLayer isViewPage={isViewPage} />
        </div>
      </div>

      {/* 줌 레벨 표시 */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        color: '#ffffff',
        padding: '4px 12px',
        borderRadius: '4px',
        fontSize: '14px',
        zIndex: 1000 // 적절한 z-index로 조정
      }}>
        {Math.round(autoScale * zoom * 100)}%
      </div>
    </div>
  );
};

export default Canvas;

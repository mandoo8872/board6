import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAdminConfigStore, useEditorStore } from '../store';
import BaseLayer from './layers/BaseLayer';
import FixedGridLayer from './layers/FixedGridLayer';
import DBGridHydrator from './layers/BaseLayer/DBGridHydrator';
import { flags } from '../flags';
import GridEditorLayer from '../features/gridEditor/GridEditorLayer';
import { useGridEditorStore } from '../features/gridEditor/gridEditorStore';
import GridBoxesOverlay from './layers/GridBoxesOverlay';
import DrawLayer from './layers/DrawLayer';
import GridLayer from './layers/GridLayer';
import ExcelPreviewLayer from './layers/ExcelPreviewLayer';
import { useCanvasInteractions } from './layers/BaseLayer/hooks/useCanvasInteractions';
import SnapPreviewOverlay from './layers/BaseLayer/SnapPreviewOverlay';

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

  // 캔버스 상호작용 훅 사용
  const { onCanvasKeyDown } = useCanvasInteractions(isViewPage);

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

  const gridEditorMode = useGridEditorStore((s) => s.mode);

  // 멀티터치 핀치/패닝 (어드민 전용)
  const touchesRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastPinchDistRef = useRef<number | null>(null);
  const lastCenterRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDownContainer = useCallback((e: React.PointerEvent) => {
    if (isViewPage) return;
    if (e.pointerType !== 'touch') return;
    touchesRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    // 두 손가락 이상부터만 컨테이너가 제스처 처리 (하위 포인터 액션 차단)
    if (touchesRef.current.size >= 2) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [isViewPage]);

  const handlePointerMoveContainer = useCallback((e: React.PointerEvent) => {
    if (isViewPage) return;
    if (e.pointerType !== 'touch') return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    touchesRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touchesRef.current.size >= 2) {
      e.preventDefault();
      const pts = Array.from(touchesRef.current.values()).slice(0, 2);
      const [p1, p2] = pts;
      const dx = p2.x - p1.x; const dy = p2.y - p1.y;
      const dist = Math.hypot(dx, dy);
      const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      const lastDist = lastPinchDistRef.current;
      const lastCenter = lastCenterRef.current;
      if (lastDist) {
        const factor = dist / lastDist;
        if (Number.isFinite(factor) && factor > 0) {
          const newZoom = Math.max(0.05, Math.min(5.0, zoom * factor));
          if (newZoom !== zoom) {
            const availableAreaCenterY = rect.height / 2;
            const offsetFromCenterY = center.y - availableAreaCenterY;
            const zoomRatio = newZoom / zoom;
            const newOffsetY = viewOffset.y + offsetFromCenterY * (1 - zoomRatio);
            setZoom(newZoom);
            setViewOffset({ x: viewOffset.x, y: newOffsetY });
          }
        }
      }
      if (lastCenter) {
        const deltaX = center.x - lastCenter.x;
        const deltaY = center.y - lastCenter.y;
        if (Math.abs(deltaX) + Math.abs(deltaY) > 0) {
          setViewOffset({ x: viewOffset.x + deltaX, y: viewOffset.y + deltaY });
        }
      }
      lastPinchDistRef.current = dist;
      lastCenterRef.current = center;
      e.stopPropagation();
    }
  }, [isViewPage, setZoom, setViewOffset, viewOffset.x, viewOffset.y, zoom]);

  const handlePointerUpContainer = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== 'touch') return;
    touchesRef.current.delete(e.pointerId);
    if (touchesRef.current.size < 2) {
      lastPinchDistRef.current = null;
      lastCenterRef.current = null;
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      onWheel={handleWheel}
      onKeyDown={onCanvasKeyDown}
      {...(!isViewPage && {
        onPointerDownCapture: handlePointerDownContainer,
        onPointerMoveCapture: handlePointerMoveContainer,
        onPointerUpCapture: handlePointerUpContainer
      })}
      tabIndex={0} // 키보드 이벤트를 받기 위해 tabIndex 추가
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        // 어드민: 자체 제스처 처리 위해 기본 제스처 비활성화
        touchAction: isViewPage ? 'auto' : 'none',
        overflowX: needsHorizontalScroll ? 'auto' : 'hidden',
        overflowY: needsVerticalScroll ? 'auto' : 'hidden',
        backgroundColor: 'transparent',
        cursor: getCursor(),
        outline: 'none', // 포커스 표시 제거
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
          {/* DB Grid hydrator: injects v2 centers when enabled */}
          {flags.useCellCenterSnapV2 && (
            <DBGridHydrator imageBoxWorld={{ x: 0, y: 0, w: CANVAS_WIDTH, h: CANVAS_HEIGHT }} />
          )}
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

          {/* 저장된 DB 그리드 박스 표시(어드민 전용) */}
          {flags.enableGridEditor && !isViewPage && (
            <GridBoxesOverlay imageBoxWorld={{ x: 0, y: 0, w: CANVAS_WIDTH, h: CANVAS_HEIGHT }} />
          )}

          {/* 스냅 미리보기 오버레이 */}
          {flags.useCellCenterSnapV2 && (
            <SnapPreviewOverlay />
          )}

          {/* Grid editor */}
          {flags.enableGridEditor && !isViewPage && (
            <GridEditorLayer imageBoxWorld={{ x: 0, y: 0, w: CANVAS_WIDTH, h: CANVAS_HEIGHT }} enabled={gridEditorMode !== 'off'} />
          )}
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

      {/* 줌 레벨 표시 (어드민 페이지에서만 표시) */}
      {!isViewPage && (
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
      )}
    </div>
  );
};

export default Canvas;

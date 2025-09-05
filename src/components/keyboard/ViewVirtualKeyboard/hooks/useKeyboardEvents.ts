import { useEffect, useCallback, RefObject } from 'react';

interface UseKeyboardEventsProps {
  isDragging: boolean;
  isResizing: boolean;
  dragOffset: { x: number; y: number };
  position: { x: number; y: number };
  size: { width: number; height: number };
  keyboardRef: RefObject<HTMLDivElement>;
  setPosition: (pos: { x: number; y: number }) => void;
  setSize: (size: { width: number; height: number }) => void;
  setIsDragging: (dragging: boolean) => void;
  setIsResizing: (resizing: boolean) => void;
  saveSettings: (position: { x: number; y: number }, size: { width: number; height: number }) => void;
  constrainToViewport: (pos: { x: number; y: number }, sz: { width: number; height: number }) => { x: number; y: number };
}

export const useKeyboardEvents = ({
  isDragging,
  isResizing,
  dragOffset,
  position,
  size,
  keyboardRef,
  setPosition,
  setSize,
  setIsDragging,
  setIsResizing,
  saveSettings,
  constrainToViewport
}: UseKeyboardEventsProps) => {
  
  // 포인터 이벤트 처리
  useEffect(() => {
    if (!isDragging && !isResizing) {
      return; // 드래그나 리사이즈 중이 아니면 이벤트 리스너 추가하지 않음
    }

    const handlePointerMove = (e: PointerEvent) => {
      // 터치 디바이스에서 이벤트 처리 최적화
      if (e.pointerType === 'touch') {
        e.preventDefault(); // 터치 스크롤 방지
      }
      
      if (isDragging) {
        const newPosition = {
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        };
        const constrainedPosition = constrainToViewport(newPosition, size);
        setPosition(constrainedPosition);
      }
      
      if (isResizing) {
        const rect = keyboardRef.current?.getBoundingClientRect();
        if (rect) {
          const newWidth = Math.max(400, Math.min(1600, e.clientX - rect.left));
          const newHeight = Math.max(270, Math.min(800, e.clientY - rect.top));
          const newSize = { width: newWidth, height: newHeight };
          const constrainedPosition = constrainToViewport(position, newSize);
          setSize(newSize);
          setPosition(constrainedPosition);
        }
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (isDragging || isResizing) {
        // 드래그나 리사이즈 종료 시 설정 저장
        saveSettings(position, size);
      }
      setIsDragging(false);
      setIsResizing(false);
      
      // 포인터 캡처 해제
      if (keyboardRef.current) {
        try {
          keyboardRef.current.releasePointerCapture(e.pointerId);
        } catch (error) {
          // 포인터 캡처 해제 실패는 무시
        }
      }
    };

    // 터치 디바이스에서 추가 이벤트 리스너
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // 터치 스크롤 방지
    };

    const handleTouchEnd = (_e: TouchEvent) => {
      if (isDragging || isResizing) {
        saveSettings(position, size);
      }
      setIsDragging(false);
      setIsResizing(false);
    };

    // 포인터 이벤트 리스너 추가
    document.addEventListener('pointermove', handlePointerMove, { passive: false });
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      // cleanup
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, isResizing, dragOffset, position, size, keyboardRef, setPosition, setSize, setIsDragging, setIsResizing, saveSettings, constrainToViewport]);

  // 윈도우 리사이즈 처리
  useEffect(() => {
    const handleWindowResize = () => {
      const constrainedPosition = constrainToViewport(position, size);
      if (constrainedPosition.x !== position.x || constrainedPosition.y !== position.y) {
        setPosition(constrainedPosition);
        saveSettings(constrainedPosition, size);
      }
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [position, size, constrainToViewport, setPosition, saveSettings]);

  // 드래그 시작 핸들러
  const handleDragStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    
    // 포인터 캡처
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (error) {
      // 포인터 캡처 실패는 무시
    }
    
    // dragOffset은 외부에서 설정됨
  }, [setIsDragging, keyboardRef]);

  // 리사이즈 시작 핸들러
  const handleResizeStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    // 포인터 캡처
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (error) {
      // 포인터 캡처 실패는 무시
    }
  }, [setIsResizing]);

  return {
    handleDragStart,
    handleResizeStart
  };
};
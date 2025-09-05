import { useState, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

export const useKeyboardState = () => {
  // 키보드 기본 설정
  const loadSettings = useCallback(() => {
    try {
      const savedPosition = localStorage.getItem('viewVirtualKeyboard_position');
      const savedSize = localStorage.getItem('viewVirtualKeyboard_size');
      
      const defaultPosition = { x: 50, y: window.innerHeight - 300 };
      const defaultSize = { width: 600, height: 280 }; // 팔레트가 헤더로 이동했으므로 원래 높이로 복원
      
      return {
        position: savedPosition ? JSON.parse(savedPosition) : defaultPosition,
        size: savedSize ? JSON.parse(savedSize) : defaultSize
      };
    } catch {
      return {
        position: { x: 50, y: window.innerHeight - 300 },
        size: { width: 600, height: 280 } // 팔레트가 헤더로 이동했으므로 원래 높이로 복원
      };
    }
  }, []);

  const savedSettings = loadSettings();
  
  // 키보드 상태
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<Position>(savedSettings.position);
  const [size, setSize] = useState<Size>(savedSettings.size);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  
  // 입력 상태
  const [isKorean, setIsKorean] = useState(true);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [shiftLocked, setShiftLocked] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [selectedColor, setSelectedColor] = useState<'black' | 'red' | 'blue'>('black');
  
  // 텍스트 스타일 상태 추가
  const [textStyle, setTextStyle] = useState({
    bold: false,
    italic: false,
    fontSize: 28
  });

  // 설정 저장
  const saveSettings = useCallback((newPosition: Position, newSize: Size) => {
    try {
      localStorage.setItem('viewVirtualKeyboard_position', JSON.stringify(newPosition));
      localStorage.setItem('viewVirtualKeyboard_size', JSON.stringify(newSize));
    } catch (error) {
      console.warn('Failed to save keyboard settings:', error);
    }
  }, []);

  // 경계 체크 및 조정 (툴바와 동일: 화면 밖으로 나가지 않도록 8px 여백 보장)
  const constrainToViewport = useCallback((pos: Position, sz: Size): Position => {
    const margin = 8;
    const maxX = Math.max(margin, window.innerWidth - sz.width - margin);
    const maxY = Math.max(margin, window.innerHeight - sz.height - margin);
    const minX = margin;
    const minY = margin;
    return {
      x: Math.max(minX, Math.min(maxX, pos.x)),
      y: Math.max(minY, Math.min(maxY, pos.y))
    };
  }, []);

  // Shift 상태 처리
  const handleShiftPress = useCallback(() => {
    if (isShiftPressed && !shiftLocked) {
      // Shift가 눌린 상태에서 다시 누르면 고정
      setShiftLocked(true);
    } else if (shiftLocked) {
      // 고정된 상태에서 누르면 해제
      setIsShiftPressed(false);
      setShiftLocked(false);
    } else {
      // 일반 상태에서 누르면 임시 활성화
      setIsShiftPressed(true);
    }
  }, [isShiftPressed, shiftLocked]);

  // 키 입력 후 Shift 상태 업데이트
  const updateShiftAfterKeyPress = useCallback(() => {
    if (isShiftPressed && !shiftLocked) {
      // 임시 Shift는 키 입력 후 해제
      setIsShiftPressed(false);
    }
  }, [isShiftPressed, shiftLocked]);

  return {
    // 상태
    isVisible,
    position,
    size,
    isDragging,
    isResizing,
    dragOffset,
    isKorean,
    isShiftPressed,
    shiftLocked,
    currentText,
    selectedColor,
    textStyle,
    
    // 세터
    setIsVisible,
    setPosition,
    setSize,
    setIsDragging,
    setIsResizing,
    setDragOffset,
    setIsKorean,
    setCurrentText,
    setSelectedColor,
    setTextStyle,
    
    // 유틸리티
    saveSettings,
    constrainToViewport,
    handleShiftPress,
    updateShiftAfterKeyPress
  };
};
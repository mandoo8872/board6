import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useEditorStore, useAdminConfigStore } from '../../store';

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

// 한글 자모 조합을 위한 유틸리티
const assembleHangul = (initial: string, middle: string, final: string = '') => {
  // 초성 19개
  const initials = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  // 중성 21개
  const middles = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
  // 종성 28개 (없는 경우 포함)
  const finals = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  
  const initialIndex = initials.indexOf(initial);
  const middleIndex = middles.indexOf(middle);
  const finalIndex = finals.indexOf(final);
  
  if (initialIndex >= 0 && middleIndex >= 0 && finalIndex >= 0) {
    const code = 0xAC00 + (initialIndex * 21 + middleIndex) * 28 + finalIndex;
    return String.fromCharCode(code);
  }
  return initial + middle + final;
};

const ViewVirtualKeyboard: React.FC = () => {
  const { textObjects, updateTextObject } = useAdminConfigStore();
  const { selectedObjectId } = useEditorStore();
  
  // 저장된 위치와 크기 로드
  const loadSettings = () => {
    try {
      const savedPosition = localStorage.getItem('viewVirtualKeyboard_position');
      const savedSize = localStorage.getItem('viewVirtualKeyboard_size');
      
      const defaultPosition = { x: 50, y: window.innerHeight - 400 };
      const defaultSize = { width: 700, height: 350 };
      
      return {
        position: savedPosition ? JSON.parse(savedPosition) : defaultPosition,
        size: savedSize ? JSON.parse(savedSize) : defaultSize
      };
    } catch {
      return {
        position: { x: 50, y: window.innerHeight - 400 },
        size: { width: 700, height: 350 }
      };
    }
  };

  const savedSettings = loadSettings();
  
  // 키보드 위치 및 크기 상태
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<Position>(savedSettings.position);
  const [size, setSize] = useState<Size>(savedSettings.size);
  
  // 초기 마운트 시 경계 체크
  useEffect(() => {
    const constrainedPosition = constrainToViewport(savedSettings.position, savedSettings.size);
    if (constrainedPosition.x !== savedSettings.position.x || constrainedPosition.y !== savedSettings.position.y) {
      setPosition(constrainedPosition);
      saveSettings(constrainedPosition, savedSettings.size);
    }
  }, []);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  
  // 키보드 상태
  const [isKorean, setIsKorean] = useState(true);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [shiftLocked, setShiftLocked] = useState(false);
  const [currentText, setCurrentText] = useState('');
  
  // 한글 조립 상태
  const [hangulState, setHangulState] = useState({
    initial: '',
    middle: '',
    final: '',
    isAssembling: false
  });
  
  const keyboardRef = useRef<HTMLDivElement>(null);

  // 위치 및 크기 저장 함수
  const saveSettings = (newPosition: Position, newSize: Size) => {
    try {
      localStorage.setItem('viewVirtualKeyboard_position', JSON.stringify(newPosition));
      localStorage.setItem('viewVirtualKeyboard_size', JSON.stringify(newSize));
    } catch (error) {
      console.warn('Failed to save keyboard settings:', error);
    }
  };

  // 경계 체크 및 조정 함수
  const constrainToViewport = (pos: Position, sz: Size): Position => {
    const margin = 0.2; // 20% 여백 허용 (80% 벗어나면 조정)
    const minVisibleWidth = sz.width * margin;
    const minVisibleHeight = sz.height * margin;
    
    const maxX = window.innerWidth - minVisibleWidth;
    const maxY = window.innerHeight - minVisibleHeight;
    const minX = -sz.width + minVisibleWidth;
    const minY = -sz.height + minVisibleHeight;
    
    return {
      x: Math.max(minX, Math.min(maxX, pos.x)),
      y: Math.max(minY, Math.min(maxY, pos.y))
    };
  };

  // 키보드 레이아웃 정의
  const koreanLayout = {
    row1: ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'],
    row2: ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'],
    row3: ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ'],
    numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
  };

  const koreanShiftLayout = {
    row1: ['ㅃ', 'ㅉ', 'ㄸ', 'ㄲ', 'ㅆ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅒ', 'ㅖ'],
    row2: ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'],
    row3: ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ'],
    numbers: ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')']
  };

  const englishLayout = {
    row1: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    row2: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    row3: ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
    numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
  };

  const englishShiftLayout = {
    row1: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    row2: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    row3: ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
    numbers: ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')']
  };

  // 가상 키보드 활성화/숨기기 이벤트 리스너
  useEffect(() => {
    const handleActivateKeyboard = (event: any) => {
      // 한글 조립 상태 초기화
      setHangulState({ initial: '', middle: '', final: '', isAssembling: false });
      
      // 현재 선택된 객체의 텍스트를 가져오기
      const currentObjectId = selectedObjectId || event?.detail?.objectId;
      if (currentObjectId) {
        const selectedObject = textObjects.find(obj => obj.id === currentObjectId);
        if (selectedObject) {
          setCurrentText(selectedObject.text || ''); // 기존 텍스트 로드
        } else {
          setCurrentText(''); // 객체가 없으면 빈 텍스트
        }
      } else {
        setCurrentText(''); // 선택된 객체가 없으면 빈 텍스트
      }
      
      setIsVisible(true);
    };

    // hideVirtualKeyboard 이벤트는 제거 - useEffect로 자동 관리
    window.addEventListener('activateVirtualKeyboard', handleActivateKeyboard);
    
    return () => {
      window.removeEventListener('activateVirtualKeyboard', handleActivateKeyboard);
    };
  }, [selectedObjectId, textObjects]);

  // 실시간 업데이트 제거 - 입력 버튼 클릭 시에만 반영

  // 키보드 가시성 제어 - 선택된 객체가 해제될 때만 키보드 숨기기
  useEffect(() => {
    if (!isVisible) return;

    // 선택된 객체가 없어지면 키보드 즉시 숨기기
    if (!selectedObjectId) {
      setIsVisible(false);
      setCurrentText('');
      setHangulState({ initial: '', middle: '', final: '', isAssembling: false });
    }
  }, [selectedObjectId, isVisible]);

  // 마우스 및 터치 이벤트 처리
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
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
          const newWidth = Math.max(500, e.clientX - rect.left);
          const newHeight = Math.max(300, e.clientY - rect.top);
          const newSize = { width: newWidth, height: newHeight };
          const constrainedPosition = constrainToViewport(position, newSize);
          setSize(newSize);
          setPosition(constrainedPosition);
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // 스크롤 방지
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        if (isDragging) {
          const newPosition = {
            x: touch.clientX - dragOffset.x,
            y: touch.clientY - dragOffset.y
          };
          const constrainedPosition = constrainToViewport(newPosition, size);
          setPosition(constrainedPosition);
        }
        
        if (isResizing) {
          const rect = keyboardRef.current?.getBoundingClientRect();
          if (rect) {
            const newWidth = Math.max(500, touch.clientX - rect.left);
            const newHeight = Math.max(300, touch.clientY - rect.top);
            const newSize = { width: newWidth, height: newHeight };
            const constrainedPosition = constrainToViewport(position, newSize);
            setSize(newSize);
            setPosition(constrainedPosition);
          }
        }
      }
    };

    const handleMouseUp = () => {
      if (isDragging || isResizing) {
        // 드래그나 리사이즈 종료 시 설정 저장
        saveSettings(position, size);
      }
      setIsDragging(false);
      setIsResizing(false);
    };

    const handleTouchEnd = () => {
      if (isDragging || isResizing) {
        // 드래그나 리사이즈 종료 시 설정 저장
        saveSettings(position, size);
      }
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, isResizing, dragOffset, position, size]);

  // 윈도우 리사이즈 시 위치 조정
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
  }, [position, size]);

  const handleHeaderMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    const rect = keyboardRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  }, []);

  const handleHeaderTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    const rect = keyboardRef.current?.getBoundingClientRect();
    if (rect && e.touches.length === 1) {
      const touch = e.touches[0];
      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      });
    }
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  }, []);

  const handleResizeTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  }, []);

  const handleKeyPress = (e: React.MouseEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    
    if (key === 'Backspace') {
      setCurrentText(prev => {
        if (prev.length === 0) return prev;
        
        // 한글 조립 상태에서 백스페이스 처리
        if (hangulState.isAssembling) {
          if (hangulState.final) {
            // 종성이 있으면 종성만 제거
            setHangulState(prev => ({ ...prev, final: '' }));
            const assembled = assembleHangul(hangulState.initial, hangulState.middle);
            return prev.slice(0, -1) + assembled;
          } else if (hangulState.middle) {
            // 중성이 있으면 중성 제거하고 초성만 남김
            setHangulState(prev => ({ ...prev, middle: '', isAssembling: false }));
            return prev.slice(0, -1) + hangulState.initial;
          } else if (hangulState.initial) {
            // 초성만 있으면 완전히 제거
            setHangulState({ initial: '', middle: '', final: '', isAssembling: false });
            return prev.slice(0, -1);
          }
        } else {
          // 일반적인 백스페이스
          setHangulState({ initial: '', middle: '', final: '', isAssembling: false });
          return prev.slice(0, -1);
        }
        return prev;
      });
    } else if (key === 'ClearAll') {
      setCurrentText('');
      setHangulState({ initial: '', middle: '', final: '', isAssembling: false });
    } else if (key === 'Space') {
      setCurrentText(prev => prev + ' ');
      setHangulState({ initial: '', middle: '', final: '', isAssembling: false });
    } else if (key === 'Enter') {
      // Enter 키는 입력 완료로 처리
      handleApplyText();
      return;
    } else if (key === 'Shift') {
      if (isShiftPressed && !shiftLocked) {
        setShiftLocked(true);
      } else if (shiftLocked) {
        setIsShiftPressed(false);
        setShiftLocked(false);
      } else {
        setIsShiftPressed(true);
      }
    } else if (key === '한/영') {
      setIsKorean(!isKorean);
      setHangulState({ initial: '', middle: '', final: '', isAssembling: false });
    } else {
      if (isKorean) {
        handleKoreanInput(key);
      } else {
        setCurrentText(prev => prev + key);
      }
      
      // Shift 상태 해제 (고정되지 않은 경우)
      if (isShiftPressed && !shiftLocked) {
        setIsShiftPressed(false);
      }
    }
  };

  const handleKoreanInput = (key: string) => {
    const isConsonant = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'.includes(key);
    const isVowel = 'ㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣㅐㅔㅒㅖ'.includes(key);

    if (isConsonant) {
      if (!hangulState.isAssembling) {
        // 새로운 한글 조립 시작
        setHangulState({
          initial: key,
          middle: '',
          final: '',
          isAssembling: true
        });
        setCurrentText(prev => prev + key);
      } else if (hangulState.initial && hangulState.middle && !hangulState.final) {
        // 종성 추가 가능
        setHangulState(prev => ({
          ...prev,
          final: key
        }));
        const assembled = assembleHangul(hangulState.initial, hangulState.middle, key);
        setCurrentText(prev => prev.slice(0, -1) + assembled);
      } else if (hangulState.initial && hangulState.middle && hangulState.final) {
        // 이미 완성된 글자에 새로운 자음 시작
        const assembled = assembleHangul(hangulState.initial, hangulState.middle, hangulState.final);
        setCurrentText(prev => prev.slice(0, -1) + assembled + key);
        setHangulState({
          initial: key,
          middle: '',
          final: '',
          isAssembling: true
        });
      } else {
        // 현재 조립 완료하고 새로운 자음으로 시작
        if (hangulState.initial && hangulState.middle) {
          const assembled = assembleHangul(hangulState.initial, hangulState.middle);
          setCurrentText(prev => prev.slice(0, -1) + assembled + key);
        } else {
          setCurrentText(prev => prev + key);
        }
        setHangulState({
          initial: key,
          middle: '',
          final: '',
          isAssembling: true
        });
      }
    } else if (isVowel) {
      if (hangulState.isAssembling && hangulState.initial && !hangulState.middle) {
        // 중성 추가
        setHangulState(prev => ({
          ...prev,
          middle: key
        }));
        const assembled = assembleHangul(hangulState.initial, key);
        setCurrentText(prev => prev.slice(0, -1) + assembled);
      } else if (hangulState.initial && hangulState.middle && hangulState.final) {
        // 종성이 있는 완성된 글자 다음에 모음 (종성을 분리해서 새 글자 시작)
        const lastConsonant = hangulState.final;
        const assembledWithoutFinal = assembleHangul(hangulState.initial, hangulState.middle);
        const newAssembled = assembleHangul(lastConsonant, key);
        setCurrentText(prev => prev.slice(0, -1) + assembledWithoutFinal + newAssembled);
        setHangulState({
          initial: lastConsonant,
          middle: key,
          final: '',
          isAssembling: true
        });
      } else {
        // 단독 모음 입력 또는 조립 불가능한 상황
        setCurrentText(prev => prev + key);
        setHangulState({ initial: '', middle: '', final: '', isAssembling: false });
      }
    } else {
      // 숫자나 특수문자
      setCurrentText(prev => prev + key);
      setHangulState({ initial: '', middle: '', final: '', isAssembling: false });
    }
  };

  // 입력 완료 - 텍스트를 객체에 반영하고 키보드 숨기기
  const handleApplyText = useCallback(() => {
    if (selectedObjectId) {
      updateTextObject(selectedObjectId, { 
        text: currentText,
        isEditing: false 
      });
    }
    setIsVisible(false);
    setCurrentText('');
    setHangulState({ initial: '', middle: '', final: '', isAssembling: false });
  }, [selectedObjectId, currentText, updateTextObject]);

  // 입력 취소 - 변경사항 무시하고 키보드 숨기기
  const handleCancelText = useCallback(() => {
    if (selectedObjectId) {
      updateTextObject(selectedObjectId, { isEditing: false });
    }
    setIsVisible(false);
    setCurrentText('');
    setHangulState({ initial: '', middle: '', final: '', isAssembling: false });
  }, [selectedObjectId, updateTextObject]);

  const handleClose = useCallback(() => {
    handleCancelText();
  }, [handleCancelText]);

  // 키보드 단축키 처리 (ESC로 취소)
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancelText();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, handleCancelText]);

  const getCurrentLayout = () => {
    if (isKorean) {
      return (isShiftPressed || shiftLocked) ? koreanShiftLayout : koreanLayout;
    } else {
      return (isShiftPressed || shiftLocked) ? englishShiftLayout : englishLayout;
    }
  };

  const getKeyButtonClass = (_key: string) => {
    const baseClass = 'bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors border border-gray-600';
    let keySize = 'text-sm px-2 py-2';
    
    if (size.width < 600) {
      keySize = 'text-xs px-1 py-1';
    } else if (size.width >= 800) {
      keySize = 'text-base px-3 py-2';
    }
    
    return `${baseClass} ${keySize}`;
  };

  if (!isVisible) {
    return null;
  }

  const layout = getCurrentLayout();

  return (
    <div
      ref={keyboardRef}
      data-virtual-keyboard="true"
      className="fixed bg-gray-800 bg-opacity-95 rounded-lg shadow-2xl border border-gray-600 select-none"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex: 9999 // 더 높은 z-index
      }}
      onClick={(e) => {
        e.stopPropagation(); // 키보드 클릭 시 이벤트 버블링 방지
        
        // 가상 키보드 버튼 클릭 시에만 캔버스 포커스 해제
        const target = e.target as HTMLElement;
        const isKeyboardButton = target.tagName === 'BUTTON' || target.closest('button');
        
        if (isKeyboardButton) {
          const activeElement = document.activeElement as HTMLElement;
          // 캔버스 컨테이너만 정확히 타겟팅
          if (activeElement && 
              (activeElement.hasAttribute('data-canvas-container') || 
               (activeElement.tabIndex === 0 && activeElement.tagName === 'DIV'))) {
            activeElement.blur();
          }
        }
      }}
      onPointerDown={(e) => e.stopPropagation()} // 터치 이벤트도 방지
      onMouseDown={(e) => e.stopPropagation()} // 마우스 다운 이벤트도 방지
    >
      {/* 드래그 핸들 */}
      <div 
        className="bg-gray-700 px-3 py-2 rounded-t-lg border-b border-gray-600"
        style={{
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleHeaderMouseDown}
        onTouchStart={handleHeaderTouchStart}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white">가상 키보드</span>
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsKorean(!isKorean);
              }}
              className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-white"
            >
              {isKorean ? '한' : 'A'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="text-xs px-2 py-1 bg-red-600 hover:bg-red-500 rounded text-white"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* 입력 미리보기 */}
      <div 
        className="p-2 border-b border-gray-600"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleKeyPress(e, 'ClearAll');
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-medium transition-colors whitespace-nowrap"
            title="전체 삭제"
          >
            전체삭제
          </button>
          <div className="flex-1 bg-white text-black p-2 rounded text-sm min-h-[30px] max-h-[60px] overflow-auto"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {currentText || '여기에 입력된 텍스트가 표시됩니다...'}
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleApplyText();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors"
            >
              입력
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCancelText();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs font-medium transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      </div>

      {/* 키보드 레이아웃 */}
      <div 
        className="p-2 flex flex-col gap-1 flex-1 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* 숫자열 + 백스페이스 */}
        <div className="flex gap-1 justify-center">
          {layout.numbers.map((key) => (
            <button
              key={key}
              onClick={(e) => handleKeyPress(e, key)}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className={getKeyButtonClass(key)}
              style={{ minWidth: `${Math.max(30, size.width / 15)}px` }}
            >
              {key}
            </button>
          ))}
          <button
            onClick={(e) => handleKeyPress(e, 'Backspace')}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className={`${getKeyButtonClass('Backspace')} bg-red-600 hover:bg-red-500`}
            style={{ minWidth: `${Math.max(50, size.width / 10)}px` }}
          >
            ⌫
          </button>
        </div>
        
        {/* 첫 번째 행 */}
        <div className="flex gap-1 justify-center">
          {layout.row1.map((key) => (
            <button
              key={key}
              onClick={(e) => handleKeyPress(e, key)}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className={getKeyButtonClass(key)}
              style={{ minWidth: `${Math.max(30, size.width / 12)}px` }}
            >
              {key}
            </button>
          ))}
        </div>
        
        {/* 두 번째 행 */}
        <div className="flex gap-1 justify-center">
          {layout.row2.map((key) => (
            <button
              key={key}
              onClick={(e) => handleKeyPress(e, key)}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className={getKeyButtonClass(key)}
              style={{ minWidth: `${Math.max(30, size.width / 11)}px` }}
            >
              {key}
            </button>
          ))}
        </div>
        
        {/* 세 번째 행 */}
        <div className="flex gap-1 justify-center">
          <button
            onClick={(e) => handleKeyPress(e, 'Shift')}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className={`${getKeyButtonClass('Shift')} ${(isShiftPressed || shiftLocked) ? 'bg-blue-600' : ''}`}
            style={{ minWidth: `${Math.max(50, size.width / 10)}px` }}
          >
            ⇧{shiftLocked ? '🔒' : ''}
          </button>
          
          {layout.row3.map((key) => (
            <button
              key={key}
              onClick={(e) => handleKeyPress(e, key)}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className={getKeyButtonClass(key)}
              style={{ minWidth: `${Math.max(30, size.width / 12)}px` }}
            >
              {key}
            </button>
          ))}
        </div>
        
        {/* 하단 행 */}
        <div className="flex gap-1 justify-center">
          <button
            onClick={(e) => handleKeyPress(e, '한/영')}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className={getKeyButtonClass('한/영')}
            style={{ minWidth: `${Math.max(60, size.width / 8)}px` }}
          >
            한/영
          </button>
          
          <button
            onClick={(e) => handleKeyPress(e, 'Space')}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className={getKeyButtonClass('Space')}
            style={{ minWidth: `${Math.max(200, size.width / 3)}px` }}
          >
            스페이스
          </button>
          
          <button
            onClick={(e) => handleKeyPress(e, 'Enter')}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className={`${getKeyButtonClass('Enter')} bg-blue-600 hover:bg-blue-500`}
            style={{ minWidth: `${Math.max(60, size.width / 8)}px` }}
          >
            완료
          </button>
        </div>
      </div>

      {/* 리사이즈 핸들 */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onMouseDown={handleResizeStart}
        onTouchStart={handleResizeTouchStart}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-gray-400"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        ></div>
      </div>
    </div>
  );
};

export default ViewVirtualKeyboard; 
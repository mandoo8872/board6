import React, { useRef, useEffect, useCallback } from 'react';
import { useAdminConfigStore } from '../../store/adminConfigStore';
import { useEditorStore } from '../../store/editorStore';

// 분리된 컴포넌트들
import {
  KeyboardHeader,
  TextDisplay,
  KeyboardLayout,
  ResizeHandle
} from './ViewVirtualKeyboard/components';

// 커스텀 hooks
import {
  useKeyboardState,
  useHangulInput,
  useKeyboardEvents
} from './ViewVirtualKeyboard/hooks';

const ViewVirtualKeyboard: React.FC = () => {
  const { textObjects, updateTextObject } = useAdminConfigStore();
  const { selectedObjectId } = useEditorStore();
  
  const keyboardRef = useRef<HTMLDivElement>(null);

  // 키보드 상태 관리
  const {
    isVisible,
    position,
    size,
    isDragging,
    isResizing,
    dragOffset,
    isKorean,
    isShiftPressed,
    currentText,
    setIsVisible,
    setPosition,
    setSize,
    setIsDragging,
    setIsResizing,
    setDragOffset,
    setIsKorean,
    setCurrentText,
    saveSettings,
    constrainToViewport,
    handleShiftPress,
    updateShiftAfterKeyPress
  } = useKeyboardState();

  // 한글 입력 로직
  const {
    processKoreanInput,
    processBackspace,
    resetHangulState,
    finalizeCurrentChar
  } = useHangulInput();

  // 이벤트 처리 (포인터 이벤트 리스너 등록)
  useKeyboardEvents({
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
  });

  // 초기 위치 제약 조건 적용
  useEffect(() => {
    const constrainedPosition = constrainToViewport(position, size);
    if (constrainedPosition.x !== position.x || constrainedPosition.y !== position.y) {
      setPosition(constrainedPosition);
      saveSettings(constrainedPosition, size);
    }
  }, []); // 한 번만 실행

  // 가상 키보드 활성화/숨기기 이벤트 리스너
  useEffect(() => {
    const handleActivateKeyboard = (event: any) => {
      const { objectId } = event.detail;
      const textObj = textObjects.find(obj => obj.id === objectId);
      
      if (textObj) {
        setCurrentText(textObj.text);
        resetHangulState();
        setIsVisible(true);
      }
    };

    const handleHideKeyboard = () => {
      setIsVisible(false);
      setCurrentText('');
      resetHangulState();
    };

    window.addEventListener('activateVirtualKeyboard', handleActivateKeyboard);
    window.addEventListener('hideVirtualKeyboard', handleHideKeyboard);
    
    return () => {
      window.removeEventListener('activateVirtualKeyboard', handleActivateKeyboard);
      window.removeEventListener('hideVirtualKeyboard', handleHideKeyboard);
    };
  }, [selectedObjectId, textObjects, setIsVisible, setCurrentText, resetHangulState]);

  // 키보드 가시성 제어 - 선택된 객체가 해제될 때만 키보드 숨기기
  useEffect(() => {
    if (!isVisible) return;

    // 선택된 객체가 없어지면 키보드 즉시 숨기기
    if (!selectedObjectId) {
      setIsVisible(false);
      setCurrentText('');
      resetHangulState();
    }
  }, [selectedObjectId, isVisible, setIsVisible, setCurrentText, resetHangulState]);

  // 드래그 시작 핸들러 (개선된 버전)
  const handleHeaderPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    
    // 포인터 캡처
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (error) {
      // 포인터 캡처 실패는 무시
    }
    
    const rect = keyboardRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  }, [setIsDragging, setDragOffset]);

  // 리사이즈 시작 핸들러
  const handleResizePointerStart = useCallback((e: React.PointerEvent) => {
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

  // 키 입력 처리
  const handleKeyPress = useCallback((key: string) => {
    if (key === 'Backspace') {
      if (isKorean) {
        const newText = processBackspace(currentText);
        setCurrentText(newText);
        } else {
        setCurrentText(prev => prev.slice(0, -1));
        resetHangulState();
      }
    } else if (key === 'Enter') {
      // Enter 키는 적용과 동일
      handleApplyText();
    } else if (key === ' ') {
      // 스페이스바는 현재 조립 완료 후 공백 추가
      const finalizedText = finalizeCurrentChar(currentText);
      setCurrentText(finalizedText + ' ');
    } else {
      // 일반 키 입력
      if (isKorean) {
        const newText = processKoreanInput(key, currentText);
        setCurrentText(newText);
      } else {
        const finalizedText = finalizeCurrentChar(currentText);
        setCurrentText(finalizedText + key);
      }
      
      // Shift 상태 업데이트
      updateShiftAfterKeyPress();
    }
  }, [isKorean, currentText, processBackspace, processKoreanInput, finalizeCurrentChar, resetHangulState, updateShiftAfterKeyPress]);

  // 언어 전환
  const handleLanguageToggle = useCallback(() => {
    const finalizedText = finalizeCurrentChar(currentText);
    setCurrentText(finalizedText);
    setIsKorean(!isKorean);
  }, [isKorean, setIsKorean, currentText, finalizeCurrentChar, setCurrentText]);

  // 텍스트 직접 변경
  const handleTextChange = useCallback((text: string) => {
    setCurrentText(text);
    resetHangulState();
  }, [setCurrentText, resetHangulState]);

  // 입력 완료 - 텍스트를 객체에 반영하고 키보드 숨기기
  const handleApplyText = useCallback(() => {
    if (selectedObjectId) {
      const finalizedText = finalizeCurrentChar(currentText);
      updateTextObject(selectedObjectId, { 
        text: finalizedText,
        isEditing: false 
      });
    }
    setIsVisible(false);
    setCurrentText('');
    resetHangulState();
  }, [selectedObjectId, currentText, finalizeCurrentChar, updateTextObject, setIsVisible, setCurrentText, resetHangulState]);

  // 입력 취소 - 변경사항 무시하고 키보드 숨기기
  const handleCancelText = useCallback(() => {
    setIsVisible(false);
    setCurrentText('');
    resetHangulState();
  }, [setIsVisible, setCurrentText, resetHangulState]);

  // 전체 삭제
  const handleClearAll = useCallback(() => {
    setCurrentText('');
    resetHangulState();
  }, [setCurrentText, resetHangulState]);

  if (!isVisible) {
    return null;
  }

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
        zIndex: 9999
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* 헤더 */}
      <KeyboardHeader
        onPointerDown={handleHeaderPointerDown}
      />

      {/* 텍스트 입력 영역 */}
      <TextDisplay
        currentText={currentText}
        onTextChange={handleTextChange}
        onApply={handleApplyText}
        onCancel={handleCancelText}
        onClearAll={handleClearAll}
      />

      {/* 키보드 레이아웃 */}
      <KeyboardLayout
        isKorean={isKorean}
        isShiftPressed={isShiftPressed}
        onKeyPress={handleKeyPress}
        onShiftPress={handleShiftPress}
        onLanguageToggle={handleLanguageToggle}
        keyboardWidth={size.width}
        keyboardHeight={size.height}
      />

      {/* 리사이즈 핸들 */}
      <ResizeHandle onPointerDown={handleResizePointerStart} />
    </div>
  );
};

export default ViewVirtualKeyboard; 
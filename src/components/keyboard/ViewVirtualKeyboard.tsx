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
    selectedColor,
    textStyle,
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
        
        // 기존 객체의 색상을 파악하여 초기 색상 설정
        const existingColor = textObj.textStyle?.color;
        let initialColor: 'black' | 'red' | 'blue' = 'black';
        
        if (existingColor) {
          if (existingColor === '#000000') initialColor = 'black';
          else if (existingColor === '#D32F2F') initialColor = 'red';
          else if (existingColor === '#1976D2') initialColor = 'blue';
        }
        
        setSelectedColor(initialColor);
        
        // 기존 객체의 스타일을 초기값으로 설정
        setTextStyle({
          bold: textObj.textStyle?.bold || false,
          italic: textObj.textStyle?.italic || false,
          fontSize: textObj.fontSize || 28
        });
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
    
    // 터치 디바이스에서 포인터 캡처 최적화
    if (e.pointerType === 'touch') {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (error) {
        // iOS Safari에서는 포인터 캡처가 제한적일 수 있음
        console.warn('Pointer capture failed:', error);
      }
    } else {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (error) {
        // 포인터 캡처 실패는 무시
      }
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
    
    // 터치 디바이스에서 포인터 캡처 최적화
    if (e.pointerType === 'touch') {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (error) {
        // iOS Safari에서는 포인터 캡처가 제한적일 수 있음
        console.warn('Pointer capture failed:', error);
      }
    } else {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (error) {
        // 포인터 캡처 실패는 무시
      }
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
      // Enter 키: 줄바꿈 추가
      const finalizedText = finalizeCurrentChar(currentText);
      setCurrentText(finalizedText + '\n');
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

  // 색상 선택 핸들러
  const handleColorSelect = useCallback((color: 'black' | 'red' | 'blue') => {
    setSelectedColor(color);
  }, [setSelectedColor]);

  // 스타일 변경 핸들러
  const handleStyleChange = useCallback((style: 'bold' | 'italic' | 'fontSize', value: boolean | number) => {
    setTextStyle(prev => ({
      ...prev,
      [style]: value
    }));
  }, [setTextStyle]);

  // 입력 완료 - 텍스트를 객체에 반영하고 키보드 숨기기
  const handleApplyText = useCallback(() => {
    if (selectedObjectId) {
      const finalizedText = finalizeCurrentChar(currentText);
      // 색상 매핑 (더 진한 색상)
      const colorMap = {
        black: '#000000',
        red: '#D32F2F',
        blue: '#0000FF' // 순수한 파란색
      };
      
      // 기존 객체 찾기
      const existingObject = textObjects.find(obj => obj.id === selectedObjectId);
      
      // 기존 속성 유지하면서 스타일 업데이트
      const updatedTextStyle = {
        ...(existingObject?.textStyle || {
          bold: false,
          italic: false,
          horizontalAlign: 'left',
          verticalAlign: 'middle',
          fontFamily: 'Arial'
        }),
        color: colorMap[selectedColor],
        bold: textStyle.bold,
        italic: textStyle.italic
      };
      
      updateTextObject(selectedObjectId, { 
        text: finalizedText,
        textStyle: updatedTextStyle,
        fontSize: textStyle.fontSize,
        isEditing: false 
      });
    }
    setIsVisible(false);
    setCurrentText('');
    resetHangulState();
  }, [selectedObjectId, currentText, selectedColor, textStyle, finalizeCurrentChar, updateTextObject, textObjects, setIsVisible, setCurrentText, resetHangulState]);

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
        zIndex: 9999,
        touchAction: 'none' // iOS Safari에서 터치 스크롤 방지
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* 헤더 */}
      <KeyboardHeader
        onPointerDown={handleHeaderPointerDown}
        selectedColor={selectedColor}
        onColorSelect={handleColorSelect}
        textStyle={textStyle}
        onStyleChange={handleStyleChange}
        scale={1}
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
import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore, useAdminConfigStore, useDrawStore } from '../../store';
import { Tool, TextObject } from '../../types';

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

const ViewFloatingToolbar: React.FC = () => {
  const { currentTool, setCurrentTool, fitToWindow } = useEditorStore();
  const { addTextObject, settings } = useAdminConfigStore();
  const { penColor, penWidth, setPenColor, setPenWidth } = useDrawStore();
  
  // 간소화된 색상 팔레트
  const simpleColors = ['#000000', '#ff0000', '#0000ff', '#ffff00', '#ffffff'];
  
  // 저장된 위치와 크기 로드
  const loadSettings = () => {
    try {
      const savedPosition = localStorage.getItem('viewFloatingToolbar_position');
      const savedSize = localStorage.getItem('viewFloatingToolbar_size');
      
      const defaultPosition = { x: window.innerWidth - 200, y: window.innerHeight - 150 };
      const defaultSize = { width: 180, height: 120 };
      
      return {
        position: savedPosition ? JSON.parse(savedPosition) : defaultPosition,
        size: savedSize ? JSON.parse(savedSize) : defaultSize
      };
    } catch {
      return {
        position: { x: window.innerWidth - 200, y: window.innerHeight - 150 },
        size: { width: 180, height: 120 }
      };
    }
  };

  const savedSettings = loadSettings();
  
  // 툴바 위치 및 크기 상태
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
  const [showColorPalette, setShowColorPalette] = useState(false);
  
  const toolbarRef = useRef<HTMLDivElement>(null);

  // 위치 및 크기 저장 함수
  const saveSettings = (newPosition: Position, newSize: Size) => {
    try {
      localStorage.setItem('viewFloatingToolbar_position', JSON.stringify(newPosition));
      localStorage.setItem('viewFloatingToolbar_size', JSON.stringify(newSize));
    } catch (error) {
      console.warn('Failed to save toolbar settings:', error);
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

  // 설정이 로드되지 않았을 때 기본값 제공
  const safeSettings = {
    admin: {
      objectCreationPosition: settings?.admin?.objectCreationPosition ?? { x: 200, y: 200 },
      defaultBoxWidth: settings?.admin?.defaultBoxWidth ?? 200,
      defaultBoxHeight: settings?.admin?.defaultBoxHeight ?? 60,
      defaultFontSize: settings?.admin?.defaultFontSize ?? 18,
      defaultCheckboxSettings: settings?.admin?.defaultCheckboxSettings ?? {
        checkedColor: '#22c55e',
        uncheckedColor: '#f3f4f6',
        checkedBackgroundColor: '#22c55e',
        uncheckedBackgroundColor: '#f3f4f6',
        checkedBackgroundOpacity: 0.2,
        uncheckedBackgroundOpacity: 0.1
      }
    }
  };

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
        const rect = toolbarRef.current?.getBoundingClientRect();
        if (rect) {
          const newWidth = Math.max(120, e.clientX - rect.left);
          const newHeight = Math.max(80, e.clientY - rect.top);
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
          const rect = toolbarRef.current?.getBoundingClientRect();
          if (rect) {
            const newWidth = Math.max(120, touch.clientX - rect.left);
            const newHeight = Math.max(80, touch.clientY - rect.top);
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

  const handleToolbarMouseDown = (e: React.MouseEvent) => {
    // 버튼이나 리사이즈 핸들이 아닌 경우에만 드래그 시작
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.resize-handle')) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    const rect = toolbarRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleToolbarTouchStart = (e: React.TouchEvent) => {
    // 버튼이나 리사이즈 핸들이 아닌 경우에만 드래그 시작
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.resize-handle')) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    const rect = toolbarRef.current?.getBoundingClientRect();
    if (rect && e.touches.length === 1) {
      const touch = e.touches[0];
      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      });
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };

  const handleResizeTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };

  const handleToolChange = (tool: Tool) => {
    setCurrentTool(tool);
    if (tool !== 'pen') {
      setShowColorPalette(false);
    }
  };

  const handleCheckboxCreate = async () => {
    // admin 설정된 위치 사용
    const { x, y } = safeSettings.admin.objectCreationPosition;
    
    const { 
      checkedColor, 
      uncheckedColor, 
      checkedBackgroundColor, 
      uncheckedBackgroundColor,
      checkedBackgroundOpacity,
      uncheckedBackgroundOpacity
    } = safeSettings.admin.defaultCheckboxSettings;
    
    const newCheckboxObject: Omit<TextObject, 'id'> = {
      x,
      y,
      width: safeSettings.admin.defaultBoxWidth,
      height: safeSettings.admin.defaultBoxHeight,
      text: '새 체크박스',
      hasCheckbox: true,
      checkboxChecked: false,
      checkboxCheckedColor: checkedColor,
      checkboxUncheckedColor: uncheckedColor,
      checkedBackgroundColor: checkedBackgroundColor,
      uncheckedBackgroundColor: uncheckedBackgroundColor,
      checkedBackgroundOpacity: checkedBackgroundOpacity,
      uncheckedBackgroundOpacity: uncheckedBackgroundOpacity,
      boxStyle: {
        backgroundColor: '#ffffff',
        backgroundOpacity: 1,
        borderColor: '#000000',
        borderWidth: 1,
        borderRadius: 8, // 라운딩 처리 추가
      },
      fontSize: safeSettings.admin.defaultFontSize,
      textStyle: {
        color: '#000000',
        fontFamily: 'Arial, sans-serif',
        bold: false,
        italic: false,
        horizontalAlign: 'left',
        verticalAlign: 'middle'
      },
      permissions: {
        movable: true,
        resizable: true,
        deletable: true
      },
      zIndex: Date.now(),
      locked: false,
      visible: true,
      opacity: 1,
      isEditing: true,
      lastModified: Date.now()
    };

    await addTextObject(newCheckboxObject);
    
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('activateVirtualKeyboard'));
    }, 100);
  };

  const handleColorSelect = (color: string) => {
    setPenColor(color);
    setShowColorPalette(false);
  };

  const adjustPenWidth = (delta: number) => {
    const newWidth = Math.max(1, Math.min(20, penWidth + delta));
    setPenWidth(newWidth);
  };

  // 툴바 크기에 따른 아이콘 크기 계산
  const iconScale = Math.min(size.width / 180, size.height / 120);
  const iconSize = Math.max(24, Math.min(40, 32 * iconScale));
  const buttonSize = iconSize + 8;

  return (
    <div
      ref={toolbarRef}
      className="fixed bg-white bg-opacity-95 rounded-lg shadow-2xl border border-gray-300 select-none cursor-move"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex: 9999,
        minWidth: 120,
        minHeight: 80
      }}
      onMouseDown={handleToolbarMouseDown}
      onTouchStart={handleToolbarTouchStart}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 툴바 내용 */}
      <div className="p-2 h-full flex flex-col">
        {/* 도구 버튼들 - 유연한 그리드 */}
        <div 
          className="flex flex-wrap gap-1 flex-1 content-start"
          style={{ minHeight: buttonSize }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToolChange('select');
            }}
            className={`rounded transition-all duration-200 flex items-center justify-center ${
              currentTool === 'select' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={{ width: buttonSize, height: buttonSize }}
            title="선택 도구"
          >
            <span style={{ fontSize: iconSize * 0.6 }}>👆</span>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToolChange('pen');
            }}
            className={`rounded transition-all duration-200 flex items-center justify-center ${
              currentTool === 'pen' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={{ width: buttonSize, height: buttonSize }}
            title="필기 도구"
          >
            <span style={{ fontSize: iconSize * 0.6 }}>✏️</span>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToolChange('eraser');
            }}
            className={`rounded transition-all duration-200 flex items-center justify-center ${
              currentTool === 'eraser' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={{ width: buttonSize, height: buttonSize }}
            title="지우개"
          >
            <span style={{ fontSize: iconSize * 0.6 }}>🧽</span>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCheckboxCreate();
            }}
            className="rounded transition-all duration-200 flex items-center justify-center bg-green-500 text-white hover:bg-green-600 shadow-md"
            style={{ width: buttonSize, height: buttonSize }}
            title="체크박스 추가"
          >
            <span style={{ fontSize: iconSize * 0.6 }}>☑️</span>
          </button>

          {/* 창맞춤 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              fitToWindow();
            }}
            className="rounded transition-all duration-200 flex items-center justify-center bg-blue-500 text-white hover:bg-blue-600 shadow-md"
            style={{ width: buttonSize, height: buttonSize }}
            title="창맞춤"
          >
            <span style={{ fontSize: iconSize * 0.6 }}>⌂</span>
          </button>

          {/* 필기 도구 설정 - 펜 선택 시에만 표시 */}
          {currentTool === 'pen' && (
            <>
              {/* 색상 선택 버튼 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColorPalette(!showColorPalette);
                }}
                className="rounded border flex items-center justify-center bg-white hover:bg-gray-50"
                style={{ width: buttonSize, height: buttonSize }}
                title="색상 선택"
              >
                <div 
                  className="rounded"
                  style={{ 
                    backgroundColor: penColor,
                    width: iconSize * 0.6,
                    height: iconSize * 0.6,
                    border: '1px solid #ccc'
                  }}
                />
              </button>

              {/* 굵기 조절 버튼들 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  adjustPenWidth(1);
                }}
                className="rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                style={{ width: buttonSize, height: buttonSize }}
                title="굵기 증가"
              >
                <span style={{ fontSize: iconSize * 0.5 }}>▲</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  adjustPenWidth(-1);
                }}
                className="rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                style={{ width: buttonSize, height: buttonSize }}
                title="굵기 감소"
              >
                <span style={{ fontSize: iconSize * 0.5 }}>▼</span>
              </button>
            </>
          )}
        </div>

        {/* 색상 팔레트 */}
        {showColorPalette && currentTool === 'pen' && (
          <div className="mt-2 p-2 bg-gray-50 rounded border-t">
            <div className="flex flex-wrap gap-1 justify-center">
              {simpleColors.map((color) => (
                <button
                  key={color}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleColorSelect(color);
                  }}
                  className="rounded border-2 hover:scale-110 transition-transform"
                  style={{
                    backgroundColor: color,
                    borderColor: penColor === color ? '#000' : '#ccc',
                    width: Math.max(20, iconSize * 0.6),
                    height: Math.max(20, iconSize * 0.6)
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 리사이즈 핸들 */}
      <div
        className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onMouseDown={handleResizeStart}
        onTouchStart={handleResizeTouchStart}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-gray-400"></div>
      </div>
    </div>
  );
};

export default ViewFloatingToolbar; 
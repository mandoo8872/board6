import React from 'react';
import { useEditorStore, useAdminConfigStore } from '../../store';
import { Tool, TextObject } from '../../types';

interface FloatingToolbarProps {
  currentTool?: Tool;
  onToolChange?: (tool: Tool) => void;
  onTTCreate?: () => void;
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = () => {
  const { currentTool, setCurrentTool } = useEditorStore();
  const { addTextObject, settings } = useAdminConfigStore();

  // 설정이 로드되지 않았을 때 기본값 제공
  const safeSettings = {
    objectCreationPosition: settings?.admin?.objectCreationPosition ?? { x: 260, y: 950 },
    defaultCheckboxSettings: settings?.admin?.defaultCheckboxSettings ?? {
      checkedColor: '#22c55e',
      uncheckedColor: '#f3f4f6'
    }
  };

  const handleToolChange = (tool: Tool) => {
    setCurrentTool(tool);
  };

  const handleTTCreate = async () => {
    // T/T (체크박스 + 텍스트) 객체 생성
    const { x, y } = safeSettings.objectCreationPosition;
    const { checkedColor, uncheckedColor } = safeSettings.defaultCheckboxSettings;
    const newCheckboxObject: Omit<TextObject, 'id'> = {
      x,
      y,
      width: 200,
      height: 60,
      text: '새 체크박스',
      hasCheckbox: true,
      checkboxChecked: false,
      checkboxCheckedColor: checkedColor,
      checkboxUncheckedColor: uncheckedColor,
      boxStyle: {
        backgroundColor: '#ffffff',
        backgroundOpacity: 1,
        borderColor: '#000000',
        borderWidth: 1,
        borderRadius: 0,
      },
      fontSize: 18,
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
      isEditing: false,
      lastModified: Date.now()
    };

    await addTextObject(newCheckboxObject);
  };

  const getToolButtonClass = (tool: Tool) => {
    const baseClass = 'p-3 rounded-full transition-all duration-200 shadow-lg';
    const activeClass = 'bg-blue-500 text-white scale-110';
    const inactiveClass = 'bg-white text-gray-700 hover:bg-gray-100';

    return `${baseClass} ${currentTool === tool ? activeClass : inactiveClass}`;
  };

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3">
      {/* 펜 도구 */}
      <button
        onClick={() => handleToolChange('pen')}
        className={getToolButtonClass('pen')}
        title="펜으로 그리기"
      >
        <span className="text-2xl">✏️</span>
      </button>
      
      {/* 지우개 도구 */}
      <button
        onClick={() => handleToolChange('eraser')}
        className={getToolButtonClass('eraser')}
        title="지우개"
      >
        <span className="text-2xl">🧽</span>
      </button>
      
      {/* T/T 생성 버튼 */}
      <button
        onClick={handleTTCreate}
        className="p-3 rounded-full bg-green-500 text-white hover:bg-green-600 transition-all duration-200 shadow-lg hover:scale-105"
        title="T/T 항목 추가"
      >
        <span className="text-2xl">📝</span>
      </button>

      {/* 현재 도구 표시 */}
      <div className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs text-center">
        {currentTool === 'pen' && '펜'}
        {currentTool === 'eraser' && '지우개'}
        {currentTool === 'select' && '선택'}
      </div>
    </div>
  );
};

export default FloatingToolbar;

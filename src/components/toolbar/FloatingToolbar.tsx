import React from 'react';
import { Tool } from '../../types';
import { PencilSimple, Eraser } from 'phosphor-react';
import { useFloatingToolbar } from './hooks/useFloatingToolbar';

interface FloatingToolbarProps {
  currentTool?: Tool;
  onToolChange?: (tool: Tool) => void;
  onTTCreate?: () => void;
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = () => {
  const { currentTool, handleToolChange, handleTTCreate, getToolButtonClass } = useFloatingToolbar();

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
        <Eraser size={24} weight="duotone" color="#FFFFFF" />
      </button>
      
      {/* T/T 생성 버튼 */}
      <button
        onClick={handleTTCreate}
        className="p-3 rounded-full bg-green-500 text-white hover:bg-green-600 transition-all duration-200 shadow-lg hover:scale-105"
        title="T/T 항목 추가"
      >
        <PencilSimple size={24} weight="duotone" color="#FFFFFF" />
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

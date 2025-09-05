import React from 'react';
import { CaretUp, CaretDown } from 'phosphor-react';

interface KeyboardHeaderProps {
  onPointerDown: (e: React.PointerEvent) => void;
  selectedColor: 'black' | 'red' | 'blue';
  onColorSelect: (color: 'black' | 'red' | 'blue') => void;
  textStyle: {
    bold: boolean;
    italic: boolean;
    fontSize: number;
  };
  onStyleChange: (style: 'bold' | 'italic' | 'fontSize', value: boolean | number) => void;
  scale?: number;
}

const KeyboardHeader: React.FC<KeyboardHeaderProps> = ({ 
  onPointerDown, 
  selectedColor, 
  onColorSelect, 
  textStyle, 
  onStyleChange, 
  scale = 1 
}) => {
  // 색상 팔레트 정의 (더 진한 색상)
  const colorPalette = [
    { id: 'black' as const, color: '#000000' },
    { id: 'red' as const, color: '#D32F2F' },
    { id: 'blue' as const, color: '#0000FF' } // 순수한 파란색
  ];

  // 스케일 기반 크기 계산
  const baseSize = 12 * scale;
  const buttonSize = 16 * scale;
  const fontSize = 10 * scale;

  // 글씨 크기 조절 상수
  const FONT_SIZE_STEP = 2;
  const FONT_SIZE_MIN = 12;
  const FONT_SIZE_MAX = 96;

  const handleFontSizeChange = (direction: 'up' | 'down') => {
    const newSize = direction === 'up' 
      ? Math.min(FONT_SIZE_MAX, textStyle.fontSize + FONT_SIZE_STEP)
      : Math.max(FONT_SIZE_MIN, textStyle.fontSize - FONT_SIZE_STEP);
    onStyleChange('fontSize', newSize);
  };

  return (
    <div 
      className="bg-gray-700 px-3 py-2 rounded-t-lg border-b border-gray-600 cursor-move select-none flex items-center justify-between"
      onPointerDown={onPointerDown}
    >
      <div className="text-gray-300 font-medium text-sm">가상 키보드</div>
      
      {/* 3개 그룹 컨트롤 */}
      <div className="flex items-center gap-3">
        {/* 그룹 1: 볼드/이탤릭 토글 */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onStyleChange('bold', !textStyle.bold);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className={`px-2 py-1 rounded transition-all duration-200 focus:outline-none ${
              textStyle.bold 
                ? 'bg-blue-500 text-white ring-2 ring-white ring-offset-1 ring-offset-gray-700' 
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
            style={{
              fontSize: `${fontSize}px`,
              minWidth: `${buttonSize}px`,
              height: `${buttonSize}px`,
              cursor: 'pointer',
            }}
            title="볼드"
          >
            B
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onStyleChange('italic', !textStyle.italic);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className={`px-2 py-1 rounded transition-all duration-200 focus:outline-none ${
              textStyle.italic 
                ? 'bg-blue-500 text-white ring-2 ring-white ring-offset-1 ring-offset-gray-700' 
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
            style={{
              fontSize: `${fontSize}px`,
              minWidth: `${buttonSize}px`,
              height: `${buttonSize}px`,
              cursor: 'pointer',
            }}
            title="이탤릭"
          >
            /
          </button>
        </div>

        {/* 구분선 */}
        <div className="w-px h-4 bg-gray-500"></div>

        {/* 그룹 2: 글씨 크기 조절 */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleFontSizeChange('up');
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1 rounded transition-all duration-200 focus:outline-none bg-gray-600 text-gray-300 hover:bg-gray-500"
            style={{
              width: `${buttonSize}px`,
              height: `${buttonSize}px`,
              cursor: 'pointer',
            }}
            title="글씨 크기 증가"
          >
            <CaretUp size={baseSize} weight="duotone" color="#d1d5db" />
          </button>
          <div 
            className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-center"
            style={{
              fontSize: `${fontSize}px`,
              minWidth: `${buttonSize * 1.5}px`,
              height: `${buttonSize}px`,
              lineHeight: `${buttonSize}px`,
            }}
          >
            {textStyle.fontSize}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleFontSizeChange('down');
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1 rounded transition-all duration-200 focus:outline-none bg-gray-600 text-gray-300 hover:bg-gray-500"
            style={{
              width: `${buttonSize}px`,
              height: `${buttonSize}px`,
              cursor: 'pointer',
            }}
            title="글씨 크기 감소"
          >
            <CaretDown size={baseSize} weight="duotone" color="#d1d5db" />
          </button>
        </div>

        {/* 구분선 */}
        <div className="w-px h-4 bg-gray-500"></div>

        {/* 그룹 3: 색상 선택 (기존 팔레트 재사용) */}
        <div className="flex gap-1">
          {colorPalette.map(({ id, color }) => (
            <button
              key={id}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onColorSelect(id);
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              className={`rounded-full transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-white focus:ring-opacity-50 ${
                selectedColor === id 
                  ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-700' 
                  : 'hover:scale-110'
              }`}
              style={{
                backgroundColor: color,
                width: `${buttonSize}px`,
                height: `${buttonSize}px`,
                minWidth: `${buttonSize}px`,
                minHeight: `${buttonSize}px`,
                cursor: 'pointer',
              }}
              title={id}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default KeyboardHeader;
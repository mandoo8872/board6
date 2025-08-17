import React from 'react';
import { DEFAULT_COLOR_PALETTE } from '../utils/toolbarHelpers';

interface ColorManagementSectionProps {
  colorMode: 'text' | 'background' | 'border';
  currentColor: string;
  onColorModeChange: (mode: 'text' | 'background' | 'border') => void;
  onColorSelect: (color: string) => void;
  showTransparent?: boolean;
}

const ColorManagementSection: React.FC<ColorManagementSectionProps> = ({
  colorMode,
  currentColor,
  onColorModeChange,
  onColorSelect,
  showTransparent = false
}) => {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600 mb-2 block">색상</label>
      
      {/* 색상 모드 선택 버튼 */}
      <div className="grid grid-cols-3 gap-1 mb-3">
        <button
          onClick={() => onColorModeChange('text')}
          className={`px-2 py-2 rounded text-xs transition-colors ${
            colorMode === 'text'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          텍스트
        </button>
        <button
          onClick={() => onColorModeChange('background')}
          className={`px-2 py-2 rounded text-xs transition-colors ${
            colorMode === 'background'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          배경
        </button>
        <button
          onClick={() => onColorModeChange('border')}
          className={`px-2 py-2 rounded text-xs transition-colors ${
            colorMode === 'border'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          테두리
        </button>
      </div>

      {/* 색상 파레트 */}
      <div className="grid grid-cols-5 gap-2">
        {/* 배경 모드일 때만 투명 옵션 표시 */}
        {showTransparent && (
          <button
            onClick={() => onColorSelect('transparent')}
            className={`w-8 h-8 rounded border-2 transition-all ${
              currentColor === 'transparent'
                ? 'border-blue-500 border-2 shadow-md' 
                : 'border-slate-300 hover:border-slate-400'
            }`}
            style={{ 
              backgroundColor: 'white',
              backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
              backgroundSize: '8px 8px',
              backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
            }}
            title="투명"
          />
        )}
        {DEFAULT_COLOR_PALETTE.map((color, index) => {
          const isSelected = currentColor === color;
          return (
            <button
              key={index}
              onClick={() => onColorSelect(color)}
              className={`w-8 h-8 rounded border-2 transition-all ${
                isSelected 
                  ? 'border-blue-500 border-2 shadow-md' 
                  : 'border-slate-300 hover:border-slate-400'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ColorManagementSection;
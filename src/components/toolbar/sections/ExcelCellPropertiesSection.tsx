import React from 'react';
import { TextObject } from '../../../types';
import { ChartBar } from 'phosphor-react';
import { useExcelCellProperties } from '../hooks/useExcelCellProperties';

interface ExcelCellPropertiesSectionProps {
  textObjects: TextObject[];
  colorMode: 'text' | 'background' | 'border';
  onColorModeChange: (mode: 'text' | 'background' | 'border') => void;
  onUpdateTextObject: (id: string, updates: Partial<TextObject>) => void;
  clearCellSelection: () => void;
}

const ExcelCellPropertiesSection: React.FC<ExcelCellPropertiesSectionProps> = ({
  textObjects,
  colorMode,
  onColorModeChange,
  onUpdateTextObject,
  clearCellSelection
}) => {
  const {
    selectedCount,
    colorMode: cm,
    onColorModeChange: setColorMode,
    colorPalette,
    getMinFontSize,
    handleClearSelection,
    handleFontSizeDecrease,
    handleFontSizeIncrease,
    handleSetTransparentBackground,
    handleColorPick,
    handleToggleBold,
    handleToggleItalic,
    handleSetHorizontalAlign,
    handleSetVerticalAlign,
  } = useExcelCellProperties({
    textObjects,
    colorMode,
    onColorModeChange,
    onUpdateTextObject,
    clearCellSelection,
  });

  if (selectedCount === 0) return null;

  // 팔레트는 훅에서 제공

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <ChartBar size={16} weight="duotone" color="#302929" className="mr-1" />
          선택된 엑셀 셀 ({selectedCount}개)
        </h3>
        <button
          onClick={() => {
            handleClearSelection();
          }}
          className="text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors"
        >
          선택 해제
        </button>
      </div>
      
      <div className="space-y-4">
        {/* 폰트 크기 일괄 변경 */}
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">
            폰트 크기 (가장 작은 크기: {getMinFontSize()}px 기준)
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={handleFontSizeDecrease}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs transition-colors"
              title={`폰트 크기 감소 (${selectedCount}개 셀 일괄 변경)`}
            >
              ▼
            </button>
            <span className="flex-1 text-center text-sm font-mono bg-slate-50 py-1 rounded border">
              {getMinFontSize()}px → 일괄변경
            </span>
            <button
              onClick={handleFontSizeIncrease}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs transition-colors"
              title={`폰트 크기 증가 (${selectedCount}개 셀 일괄 변경)`}
            >
              ▲
            </button>
          </div>
        </div>
        
        {/* 색상 일괄 변경 */}
        <div>
          <label className="text-xs font-medium text-slate-600 mb-2 block">색상</label>
          
          {/* 색상 모드 선택 버튼 */}
          <div className="grid grid-cols-3 gap-1 mb-3">
            <button
              onClick={() => setColorMode('text')}
              className={`px-2 py-2 rounded text-xs transition-colors ${
                cm === 'text'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              텍스트
            </button>
            <button
              onClick={() => setColorMode('background')}
              className={`px-2 py-2 rounded text-xs transition-colors ${
                cm === 'background'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              배경
            </button>
            <button
              onClick={() => setColorMode('border')}
              className={`px-2 py-2 rounded text-xs transition-colors ${
                cm === 'border'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              테두리
            </button>
          </div>

          {/* 색상 팔레트 */}
          <div className="grid grid-cols-5 gap-2">
            {/* 배경 모드일 때만 투명 옵션 표시 */}
            {cm === 'background' && (
              <button
                onClick={handleSetTransparentBackground}
                className="w-8 h-8 rounded border-2 border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
                title={`투명 (${selectedCount}개 셀 일괄 변경)`}
              >
                <span className="text-red-500 text-xs">∅</span>
              </button>
            )}
            
            {colorPalette.map((color) => (
              <button
                key={color}
                onClick={() => handleColorPick(color)}
                className="w-8 h-8 rounded border border-gray-300 hover:scale-110 transition-transform cursor-pointer"
                style={{ backgroundColor: color }}
                title={`${color} (${selectedCount}개 셀 일괄 변경)`}
              />
            ))}
          </div>
        </div>

        {/* 텍스트 스타일 일괄 변경 */}
        <div>
          <label className="text-xs font-medium text-slate-600 mb-2 block">텍스트 스타일</label>
          <div className="flex gap-2">
            <button
              onClick={handleToggleBold}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded text-xs font-bold transition-colors"
              title={`굵게 (${selectedCount}개 셀 일괄 변경)`}
            >
              B
            </button>
            <button
              onClick={handleToggleItalic}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded text-xs italic transition-colors"
              title={`기울임 (${selectedCount}개 셀 일괄 변경)`}
            >
              I
            </button>
          </div>
        </div>

        {/* 정렬 일괄 변경 */}
        <div>
          <label className="text-xs font-medium text-slate-600 mb-2 block">정렬</label>
          <div className="grid grid-cols-3 gap-1 mb-2">
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                onClick={() => handleSetHorizontalAlign(align)}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs transition-colors"
                title={`${align === 'left' ? '왼쪽' : align === 'center' ? '가운데' : '오른쪽'} 정렬 (${selectedCount}개 셀 일괄 변경)`}
              >
                {align === 'left' ? '←' : align === 'center' ? '↔' : '→'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1">
            {(['top', 'middle', 'bottom'] as const).map((align) => (
              <button
                key={align}
                onClick={() => handleSetVerticalAlign(align)}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs transition-colors"
              >
                {align === 'top' ? '↑' : align === 'middle' ? '↕' : '↓'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelCellPropertiesSection;
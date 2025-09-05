import React from 'react';
import type { SafeSettings } from '../types';
import { Eye, Trash, Clipboard, ChartBar } from 'phosphor-react';
import { useExcelDataSection } from '../hooks/useExcelDataSection';

interface ExcelDataSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  excelPasteData: string;
  showPreview: boolean;
  safeSettings: SafeSettings;
  onDataChange: (data: string) => void;
  onPreviewToggle: () => void;
  onCreateCells: () => void;
  onDeleteCellGroups: () => void;
  updateSettings: (category: 'admin' | 'view', updates: any) => void;
}

const ExcelDataSection: React.FC<ExcelDataSectionProps> = ({
  isExpanded,
  onToggle,
  excelPasteData,
  showPreview,
  safeSettings,
  onDataChange,
  onPreviewToggle,
  onCreateCells,
  onDeleteCellGroups,
  updateSettings
}) => {
  const {
    dataDimensions,
    handleDataChange,
    canExecute,
    decStartX, incStartX, setStartX,
    decStartY, incStartY, setStartY,
    decCellWidth, incCellWidth,
    decCellHeight, incCellHeight,
  } = useExcelDataSection({
    excelPasteData,
    safeSettings,
    onDataChange,
    updateSettings,
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-t-xl transition-colors"
      >
        <span className="flex items-center gap-2">
          <ChartBar size={20} weight="duotone" color="#302929" className="mr-2" />
        엑셀 데이터 입력
        </span>
        <span className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      
      {isExpanded && (
        <div className="p-4 border-t border-slate-200 space-y-4">
          {/* 데이터 입력 */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-2 block">데이터 붙여넣기</label>
            <textarea
              value={excelPasteData}
              onChange={(e) => handleDataChange(e.target.value)}
              onFocus={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              placeholder="엑셀에서 복사한 데이터를 붙여넣으세요..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
            <div className="text-xs text-slate-500 mt-1">
              {excelPasteData ? `${dataDimensions.rows}행 × ${dataDimensions.cols}열` : '데이터 없음'}
            </div>
          </div>

          {/* 시작 위치 설정 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">X 좌표</label>
              <div className="flex items-center gap-1">
                <button
                  onClick={decStartX}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-mono"
                >
                  ◀
                </button>
                <input
                  type="number"
                  value={safeSettings.admin.excelPasteSettings.startPosition.x}
                  onChange={(e) => setStartX(parseInt(e.target.value) || 0)}
                  onFocus={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className="w-16 px-1 py-1 border border-slate-300 rounded text-xs text-center"
                />
                <button
                  onClick={incStartX}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-mono"
                >
                  ▶
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Y 좌표</label>
              <div className="flex items-center gap-1">
                <button
                  onClick={decStartY}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-mono"
                >
                  ▲
                </button>
                <input
                  type="number"
                  value={safeSettings.admin.excelPasteSettings.startPosition.y}
                  onChange={(e) => setStartY(parseInt(e.target.value) || 0)}
                  onFocus={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className="w-16 px-1 py-1 border border-slate-300 rounded text-xs text-center"
                />
                <button
                  onClick={incStartY}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-mono"
                >
                  ▼
                </button>
              </div>
            </div>
          </div>

          {/* 셀 크기 설정 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">셀 너비</label>
              <div className="flex items-center gap-1">
                <button
                  onClick={decCellWidth}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
                >
                  ◀
                </button>
                <span className="flex-1 text-center text-sm font-mono bg-slate-50 py-1 rounded">
                  {safeSettings.admin.excelPasteSettings.cellWidth}px
                </span>
                <button
                  onClick={incCellWidth}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
                >
                  ▶
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">셀 높이</label>
              <div className="flex items-center gap-1">
                <button
                  onClick={decCellHeight}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
                >
                  ▲
                </button>
                <span className="flex-1 text-center text-sm font-mono bg-slate-50 py-1 rounded">
                  {safeSettings.admin.excelPasteSettings.cellHeight}px
                </span>
                <button
                  onClick={incCellHeight}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
                >
                  ▼
                </button>
              </div>
            </div>
          </div>

          {/* 실행 버튼 */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={onCreateCells}
                disabled={!canExecute}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Clipboard size={16} weight="duotone" color="#FFFFFF" className="mr-1" />
                셀 생성
              </button>
              <button
                onClick={onPreviewToggle}
                disabled={!canExecute}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Eye size={16} weight="duotone" color="#FFFFFF" className="mr-1" />
                {showPreview ? '숨김' : '미리보기'}
              </button>
            </div>
            
            <button
              onClick={onDeleteCellGroups}
              className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
              title="생성된 모든 엑셀 셀 그룹을 삭제합니다"
            >
              <Trash size={16} weight="duotone" color="#FFFFFF" className="mr-1" />
              엑셀 셀 그룹 삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelDataSection;
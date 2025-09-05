import React from 'react';
import { useDrawStore } from '../../store/drawStore';
import { useEditorStore } from '../../store/editorStore';
import { useAdminConfigStore } from '../../store/adminConfigStore';

const DrawToolSettings: React.FC = () => {
  const { currentTool } = useEditorStore();
  const { 
    penColor, 
    penWidth, 
    usePerfectFreehand,
    defaultColors,
    setPenColor, 
    setPenWidth,
    setUsePerfectFreehand
  } = useDrawStore();
  const { updateSettings } = useAdminConfigStore();

  // 필기나 지우개 도구가 선택되지 않으면 렌더링하지 않음
  if (currentTool !== 'pen' && currentTool !== 'eraser') {
    return null;
  }

  const widthOptions = [1, 2, 3, 4, 5];

  // perfect-freehand 설정 변경 핸들러
  const handlePerfectFreehandChange = async (checked: boolean) => {
    setUsePerfectFreehand(checked);
    // DB에 설정 저장
    try {
      await updateSettings('view', { usePerfectFreehand: checked });
    } catch (error) {
      console.error('Failed to save perfect-freehand setting:', error);
    }
  };

  return (
    <div 
      className="absolute left-4 top-20 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50"
      style={{ minWidth: '280px' }}
    >
      <div className="space-y-4">
        {/* 도구 타이틀 */}
        <div className="text-sm font-medium text-gray-700">
          {currentTool === 'pen' ? '필기 설정' : '지우개 설정'}
        </div>

        {/* 필기 도구일 때만 색상 선택 */}
        {currentTool === 'pen' && (
          <div>
            <div className="text-xs text-gray-600 mb-2">색상</div>
            <div className="grid grid-cols-5 gap-1">
              {defaultColors.map((color, index) => (
                <button
                  key={index}
                  className={`w-8 h-8 rounded border-2 ${
                    penColor === color 
                      ? 'border-blue-500 border-4' 
                      : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setPenColor(color)}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}

        {/* 필기 도구일 때만 굵기 선택 */}
        {currentTool === 'pen' && (
          <div>
            <div className="text-xs text-gray-600 mb-2">굵기</div>
            <div className="flex gap-2">
              {widthOptions.map((width) => (
                <button
                  key={width}
                  className={`px-3 py-2 rounded text-xs ${
                    penWidth === width
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setPenWidth(width)}
                >
                  {width}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* perfect-freehand 토글 (필기 도구일 때만) */}
        {currentTool === 'pen' && (
          <div>
            <div className="text-xs text-gray-600 mb-2">렌더링 품질</div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={usePerfectFreehand}
                onChange={(e) => handlePerfectFreehandChange(e.target.checked)}
                className="rounded"
              />
              <span className="text-xs text-gray-700">
                고품질 렌더링 (Perfect Freehand)
              </span>
            </label>
            <div className="text-xs text-gray-500 mt-1">
              {usePerfectFreehand 
                ? '✨ 압력 감지 및 부드러운 곡선 활성화' 
                : '⚡ 기본 선 렌더링 (빠른 성능)'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DrawToolSettings; 
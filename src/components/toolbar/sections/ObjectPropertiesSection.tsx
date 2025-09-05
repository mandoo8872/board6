import React, { useState, useEffect } from 'react';
import { TextObject, ImageObject } from '../../../types';
import { isTextObject, isImageObject } from '../utils/toolbarHelpers';
import { Pencil } from 'phosphor-react';
import ColorManagementSection from './ColorManagementSection';
import LayoutControlSection from './LayoutControlSection';
import { useObjectProperties } from '../hooks/useObjectProperties';

interface ObjectPropertiesSectionProps {
  selectedObject: TextObject | ImageObject | null;
  colorMode: 'text' | 'background' | 'border';
  onColorModeChange: (mode: 'text' | 'background' | 'border') => void;
  onColorSelect: (color: string) => void;
  onUpdateTextObject: (id: string, updates: any) => void;
  onUpdateImageObject: (id: string, updates: any) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringToFront: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onSendToBack: () => void;
  getCurrentColor: () => string;
}

const ObjectPropertiesSection: React.FC<ObjectPropertiesSectionProps> = ({
  selectedObject,
  colorMode,
  onColorModeChange,
  onColorSelect,
  onUpdateTextObject,
  onUpdateImageObject,
  onDuplicate,
  onDelete,
  onBringToFront,
  onBringForward,
  onSendBackward,
  onSendToBack,
  getCurrentColor
}) => {
  if (!selectedObject) return null;

  // 로컬 텍스트 상태 관리
  const [localText, setLocalText] = useState(
    isTextObject(selectedObject) ? selectedObject.text || '' : ''
  );

  // selectedObject가 변경될 때 로컬 텍스트 업데이트
  useEffect(() => {
    if (isTextObject(selectedObject)) {
      setLocalText(selectedObject.text || '');
    }
  }, [selectedObject.id, selectedObject]);

  const { currentColor, updateTextStyle, updateBoxStyle } = useObjectProperties({
    selectedObject,
    getCurrentColor,
    onUpdateTextObject,
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
        <Pencil size={16} weight="duotone" color="#302929" className="mr-1" />
        선택된 객체 편집
      </h3>
      
      {isTextObject(selectedObject) && (
        <div className="space-y-4">
          {/* 텍스트 입력 */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">텍스트</label>
            <div className="flex gap-2">
              <textarea
                value={localText}
                onChange={(e) => {
                  // 로컬 상태만 업데이트 (즉시 반영)
                  setLocalText(e.target.value);
                }}
                onFocus={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
              <button
                onClick={() => {
                  // 입력 버튼 클릭 시 실제 업데이트 수행
                  onUpdateTextObject(selectedObject.id, { text: localText });
                }}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                입력
              </button>
            </div>
          </div>
          
          {/* 폰트 크기 */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">폰트 크기</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateTextObject(selectedObject.id, { 
                  fontSize: Math.max(8, selectedObject.fontSize - 2) 
                })}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
              >
                ▼
              </button>
              <span className="flex-1 text-center text-sm font-mono bg-slate-50 py-1 rounded border">
                {selectedObject.fontSize}px
              </span>
              <button
                onClick={() => onUpdateTextObject(selectedObject.id, { 
                  fontSize: Math.min(72, selectedObject.fontSize + 2) 
                })}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
              >
                ▲
              </button>
            </div>
          </div>
          
          {/* 색상 선택 */}
          <ColorManagementSection
            colorMode={colorMode}
            currentColor={currentColor}
            onColorModeChange={onColorModeChange}
            onColorSelect={onColorSelect}
            showTransparent={colorMode === 'background'}
          />

          {/* 텍스트 스타일 */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-2 block">텍스트 스타일</label>
            <div className="flex gap-2">
              <button 
                onClick={() => updateTextStyle({ 
                  bold: !selectedObject.textStyle?.bold 
                })}
                className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                  selectedObject.textStyle?.bold 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                굵게
              </button>
              <button 
                onClick={() => updateTextStyle({ 
                  italic: !selectedObject.textStyle?.italic 
                })}
                className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                  selectedObject.textStyle?.italic 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                기울임
              </button>
            </div>
          </div>
          
          {/* 정렬 */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-2 block">텍스트 정렬</label>
            <div className="space-y-2">
              {/* 가로 정렬 */}
              <div>
                <div className="text-xs text-slate-500 mb-1">가로</div>
                <div className="grid grid-cols-3 gap-1">
                  {['left', 'center', 'right'].map(align => (
                    <button 
                      key={align}
                      onClick={() => updateTextStyle({ horizontalAlign: align })}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        selectedObject.textStyle?.horizontalAlign === align
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {align === 'left' ? '◀' : align === 'center' ? '●' : '▶'}
                    </button>
                  ))}
                </div>
              </div>
              {/* 세로 정렬 */}
              <div>
                <div className="text-xs text-slate-500 mb-1">세로</div>
                <div className="grid grid-cols-3 gap-1">
                  {['top', 'middle', 'bottom'].map(align => (
                    <button 
                      key={align}
                      onClick={() => updateTextStyle({ verticalAlign: align })}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        selectedObject.textStyle?.verticalAlign === align
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {align === 'top' ? '▲' : align === 'middle' ? '●' : '▼'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* 테두리 두께 */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">테두리 두께</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateBoxStyle({ 
                  borderWidth: Math.max(0, (selectedObject.boxStyle?.borderWidth || 0) - 1) 
                })}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
              >
                ▼
              </button>
              <span className="flex-1 text-center text-sm font-mono bg-slate-50 py-1 rounded">
                {selectedObject.boxStyle?.borderWidth || 0}px
              </span>
              <button
                onClick={() => updateBoxStyle({ 
                  borderWidth: Math.min(10, (selectedObject.boxStyle?.borderWidth || 0) + 1) 
                })}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
              >
                ▲
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이미지 객체 편집 */}
      {isImageObject(selectedObject) && (
        <div className="space-y-3">
          {/* 비율 유지 체크박스 */}
          <div>
            <label className="flex items-center gap-2 text-xs">
              <input 
                type="checkbox" 
                checked={selectedObject.maintainAspectRatio || false}
                onChange={(e) => onUpdateImageObject(selectedObject.id, { 
                  maintainAspectRatio: e.target.checked 
                })}
                className="rounded" 
              />
              <span>비율 유지</span>
            </label>
          </div>
          
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">불투명도</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateImageObject(selectedObject.id, { 
                  opacity: Math.max(0.1, (selectedObject.opacity || 1) - 0.1) 
                })}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
              >
                ▼
              </button>
              <span className="flex-1 text-center text-sm font-mono bg-slate-50 py-1 rounded">
                {Math.round((selectedObject.opacity || 1) * 100)}%
              </span>
              <button
                onClick={() => onUpdateImageObject(selectedObject.id, { 
                  opacity: Math.min(1, (selectedObject.opacity || 1) + 0.1) 
                })}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
              >
                ▲
              </button>
            </div>
          </div>
          
          {/* 크기 조절 */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-2 block">크기</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-600 mb-1 block">너비</label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const newWidth = Math.max(50, selectedObject.width - 10);
                      const updates = selectedObject.maintainAspectRatio
                        ? { 
                            width: newWidth,
                            height: newWidth / (selectedObject.width / selectedObject.height)
                          }
                        : { width: newWidth };
                      onUpdateImageObject(selectedObject.id, updates);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
                  >
                    ◀
                  </button>
                  <span className="flex-1 text-center text-xs font-mono bg-slate-50 py-1 rounded">
                    {Math.round(selectedObject.width)}
                  </span>
                  <button
                    onClick={() => {
                      const newWidth = selectedObject.width + 10;
                      const updates = selectedObject.maintainAspectRatio
                        ? { 
                            width: newWidth,
                            height: newWidth / (selectedObject.width / selectedObject.height)
                          }
                        : { width: newWidth };
                      onUpdateImageObject(selectedObject.id, updates);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
                  >
                    ▶
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-600 mb-1 block">높이</label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const newHeight = Math.max(30, selectedObject.height - 10);
                      const updates = selectedObject.maintainAspectRatio
                        ? { 
                            height: newHeight,
                            width: newHeight * (selectedObject.width / selectedObject.height)
                          }
                        : { height: newHeight };
                      onUpdateImageObject(selectedObject.id, updates);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
                  >
                    ▲
                  </button>
                  <span className="flex-1 text-center text-xs font-mono bg-slate-50 py-1 rounded">
                    {Math.round(selectedObject.height)}
                  </span>
                  <button
                    onClick={() => {
                      const newHeight = selectedObject.height + 10;
                      const updates = selectedObject.maintainAspectRatio
                        ? { 
                            height: newHeight,
                            width: newHeight * (selectedObject.width / selectedObject.height)
                          }
                        : { height: newHeight };
                      onUpdateImageObject(selectedObject.id, updates);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 레이아웃 컨트롤 */}
      <div className="mt-4 pt-3 border-t border-slate-200">
        <LayoutControlSection
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onBringToFront={onBringToFront}
          onBringForward={onBringForward}
          onSendBackward={onSendBackward}
          onSendToBack={onSendToBack}
        />
      </div>
    </div>
  );
};

export default ObjectPropertiesSection;
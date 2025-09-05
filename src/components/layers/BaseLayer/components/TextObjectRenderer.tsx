import React from 'react';
import { TextObjectData } from '../types';
import { useCellSelectionStore } from '../../../../store/cellSelectionStore';
import { useCheckboxStore } from '../../../../store/checkboxStore';
import InlineEditor from './InlineEditor';
import ResizeHandles from './ResizeHandles';
import { pushSnapshotImmediate } from '../../../../utils/snapshot';

interface TextObjectRendererProps {
  obj: TextObjectData;
  isSelected: boolean;
  isHovered: boolean;
  isViewPage: boolean;
  isDragging: boolean;
  isResizing: boolean;
  currentX: number;
  currentY: number;
  currentWidth: number;
  currentHeight: number;
  currentTool: string;
  editingObjectId: string | null;
  editingText: string;
  onTextBoxClick: (obj: TextObjectData, e: React.MouseEvent) => void;
  onObjectClick: (e: React.MouseEvent, id: string) => void;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  onResizePointerDown: (e: React.PointerEvent, handle: string, objectId: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onEditingTextChange: (text: string) => void;
  onFinishEdit: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  updateTextObject: (id: string, updates: Partial<TextObjectData>) => Promise<void>;
}

const TextObjectRenderer: React.FC<TextObjectRendererProps> = ({
  obj,
  isSelected,
  isHovered,
  isViewPage,
  isDragging,

  currentX,
  currentY,
  currentWidth,
  currentHeight,
  currentTool,
  editingObjectId,
  editingText,
  onTextBoxClick,
  onObjectClick,
  onPointerDown,
  onResizePointerDown,
  onMouseEnter,
  onMouseLeave,
  onEditingTextChange,
  onFinishEdit,
  onKeyDown,
  updateTextObject
}) => {
  const { 
    defaultCheckedColor,
    defaultUncheckedColor,
    checkedBackgroundColor,
    uncheckedBackgroundColor,
    checkedBackgroundOpacity,
    uncheckedBackgroundOpacity
  } = useCheckboxStore();

  // 엑셀 셀 다중선택 상태 확인
  const isCellSelected = obj.cellType === 'cell' && useCellSelectionStore.getState().isSelected(obj.id);
  
  // boxStyle 기본값 설정
  const boxStyle = obj.boxStyle || {
    backgroundColor: 'transparent',
    backgroundOpacity: 1,
    borderColor: '#000000',
    borderWidth: 0,
    borderRadius: 0
  };
  
  // textStyle 기본값 설정
  const textStyle = obj.textStyle || {
    color: '#000000',
    bold: false,
    italic: false,
    horizontalAlign: 'left',
    verticalAlign: 'middle',
    fontFamily: 'Arial'
  };

  const handleCheckboxClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const isChecked = !obj.checkboxChecked;
    try {
      await updateTextObject(obj.id, { 
        checkboxChecked: isChecked,
        // 체크박스 색상이 없으면 기본값 적용
        checkboxCheckedColor: obj.checkboxCheckedColor || defaultCheckedColor,
        checkboxUncheckedColor: obj.checkboxUncheckedColor || defaultUncheckedColor
      });
      pushSnapshotImmediate();
    } catch {}
  };

  const handleCheckboxPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className={`absolute select-none ${
        isSelected ? 'ring-4 ring-blue-600' : 
        isHovered ? 'ring-2 ring-gray-400' : ''
      }`}
      style={{
        left: currentX,
        top: currentY,
        width: currentWidth,
        height: currentHeight,
        opacity: obj.opacity,
        zIndex: obj.zIndex || 0,
        cursor: editingObjectId === obj.id ? 'text' : (
          isViewPage 
            ? 'default' 
            : (isDragging ? 'grabbing' : (obj.permissions?.movable ? 'grab' : 'default'))
        ),
        border: `${boxStyle.borderWidth}px solid ${boxStyle.borderColor}`,
        borderRadius: `${boxStyle.borderRadius}px`,
        transition: isDragging ? 'none' : 'all 0.1s ease',
        // iPad Safari 최적화: 펜/지우개 도구 사용 시 포인터 이벤트 비활성화
        pointerEvents: (currentTool === 'pen' || currentTool === 'eraser') ? 'none' : 'auto'
      }}
      onClick={(e) => {
        // 드래그 중이 아닐 때만 텍스트 박스 클릭 처리
        if (!isDragging) {
          onTextBoxClick(obj, e);
        } else {
          onObjectClick(e, obj.id);
        }
      }}
      onPointerDown={(e) => {
        // 인라인 편집 중인 경우
        if (editingObjectId) {
          // 다른 객체를 클릭한 경우에만 편집 종료
          if (editingObjectId !== obj.id) {
            e.stopPropagation();
            return;
          }
          // 같은 객체를 클릭한 경우는 편집 계속 (커서 이동 등)
          // preventDefault를 호출하지 않아서 텍스트 편집기의 기본 동작 허용
        }
        onPointerDown(e, obj.id);
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* 배경 레이어 (투명도 별도 적용) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: isCellSelected 
            ? '#9ca3af'  // 다중선택된 엑셀 셀: 회색 반투명
            : obj.hasCheckbox && obj.checkboxChecked 
              ? (obj.checkedBackgroundColor || checkedBackgroundColor)
              : obj.hasCheckbox && !obj.checkboxChecked 
                ? (obj.uncheckedBackgroundColor || uncheckedBackgroundColor)
                : boxStyle.backgroundColor,
          opacity: isCellSelected 
            ? 0.15  // 다중선택된 셀: 15% 투명도 (더 투명하게)
            : obj.hasCheckbox && obj.checkboxChecked 
              ? (obj.checkedBackgroundOpacity ?? checkedBackgroundOpacity)
              : obj.hasCheckbox && !obj.checkboxChecked 
                ? (obj.uncheckedBackgroundOpacity ?? uncheckedBackgroundOpacity)
                : boxStyle.backgroundOpacity,
          borderRadius: `${boxStyle.borderRadius}px`,
        }}
      />
      
      {/* 텍스트 레이어 */}
      <div
        className="relative z-10 h-full flex items-center"
        style={{
          justifyContent: textStyle.horizontalAlign === 'left' ? 'flex-start' : 
                         textStyle.horizontalAlign === 'center' ? 'center' : 'flex-end',
          alignItems: textStyle.verticalAlign === 'top' ? 'flex-start' : 
                     textStyle.verticalAlign === 'middle' ? 'center' : 'flex-end',
          padding: '8px',
        }}
      >
        {editingObjectId === obj.id ? (
          <InlineEditor
            text={editingText}
            textStyle={textStyle}
            fontSize={obj.fontSize || 16}
            onChange={onEditingTextChange}
            onBlur={onFinishEdit}
            onKeyDown={onKeyDown}
          />
        ) : (
          // 일반 표시 모드
          <div
            style={{
              color: textStyle.color,
              fontFamily: textStyle.fontFamily,
              fontSize: `${obj.fontSize || 16}px`,
              fontWeight: textStyle.bold ? 'bold' : 'normal',
              fontStyle: textStyle.italic ? 'italic' : 'normal',
              textAlign: textStyle.horizontalAlign,
              lineHeight: '1.2',
              wordBreak: 'break-word',
              cursor: 'pointer',
              display: 'flex',
              alignItems: textStyle.verticalAlign === 'top' ? 'flex-start' : 
                         textStyle.verticalAlign === 'middle' ? 'center' : 'flex-end',
              width: '100%',
              height: '100%',
            }}
          >
            {obj.hasCheckbox && (
              <div
                className="checkbox-area"
                onClick={handleCheckboxClick}
                onPointerDown={handleCheckboxPointerDown}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '35px',
                  height: '35px',
                  backgroundColor: obj.checkboxChecked 
                    ? (obj.checkboxCheckedColor || defaultCheckedColor)
                    : (obj.checkboxUncheckedColor || defaultUncheckedColor),
                  border: `2px solid ${obj.checkboxChecked 
                    ? (obj.checkboxCheckedColor || defaultCheckedColor)
                    : '#d1d5db'}`,
                  borderRadius: '4px',
                  marginRight: '8px',
                  transition: 'all 0.2s ease',
                  userSelect: 'none',
                  flexShrink: 0, // 체크박스 크기 고정
                  pointerEvents: 'auto', // 체크박스 클릭 가능
                  cursor: 'pointer',
                }}
              >
                {obj.checkboxChecked && (
                  <svg
                    className="checkbox-area"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      className="checkbox-area"
                      d="M13.5 4.5L6 12L2.5 8.5"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            )}
            <span
              style={{
                flex: 1, // 남은 공간 차지
                whiteSpace: 'pre-wrap', // 줄바꿈 문자 보존
              }}
            >
              {obj.text}
            </span>
          </div>
        )}
      </div>

      {/* 크기조절 핸들 - 텍스트 박스와 체크박스에 표시 (어드민 페이지에서만) */}
      {isSelected && !isViewPage && obj.permissions?.resizable && obj.cellType !== 'cell' && (
        <ResizeHandles onPointerDown={onResizePointerDown} objectId={obj.id} />
      )}
    </div>
  );
};

export default TextObjectRenderer;
import React from 'react';
//
import { 
  ArrowCounterClockwise, 
  ArrowClockwise, 
  Eraser,
  HandPointing,
  Pencil,
  CheckSquare,
  House,
  Palette,
  Circle,
  TextAa,
  Trash
} from 'phosphor-react';
import { useViewFloatingToolbar } from './hooks/useViewFloatingToolbar';
import { useAdminConfigStore } from '../../store/adminConfigStore';

//

const ViewFloatingToolbar: React.FC = () => {
  const { settings } = useAdminConfigStore();
  
  const {
    // refs/state
    toolbarRef,
    position,
    size,
    minW,
    minH,
    buttonSize,
    iconSize,
    showColorPalette,
    showSizeAdjuster,
    setShowColorPalette,
    setShowSizeAdjuster,
    // drawing state
    penColor,
    penWidth,
    setPenWidth,
    // editor/undo
    currentTool,
    handleToolChange,
    fitToWindow,
    executeUndo,
    executeRedo,
    canUndo,
    canRedo,
    // actions
    handleCheckboxCreate,
    handleTextCreate,
    handleDeleteObject,
    handleColorSelect,
    handleToolbarPointerDown,
    handleResizePointerStart,
  } = useViewFloatingToolbar();

  // DB에서 perfect-freehand 설정 가져오기
  const usePerfectFreehand = settings?.view?.usePerfectFreehand ?? true;

  return (
    <div
      ref={toolbarRef}
      data-floating-toolbar="true"
      className="fixed bg-white bg-opacity-95 rounded-lg shadow-2xl border border-gray-300 select-none cursor-move"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex: 9999,
        minWidth: minW,
        minHeight: minH,
        touchAction: 'none' // iOS Safari에서 터치 스크롤 방지
      }}
      onPointerDown={(e) => {
        // 터치 입력 시 툴바 생성과 버튼 클릭을 분리
        if (e.pointerType === 'touch') {
          // 짧은 지연을 두어 터치 이벤트 버블링과 분리
          setTimeout(() => {
            handleToolbarPointerDown(e);
          }, 100);
        } else {
          handleToolbarPointerDown(e);
        }
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 툴바 내용 */}
      <div className="p-2 h-full flex flex-col">
        {/* 3x3 고정 그리드 */}
        <div className="grid grid-cols-3 gap-2" style={{ minHeight: buttonSize * 3 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToolChange('select');
            }}
            onPointerDown={(e) => {
              // 터치 입력으로 인한 즉시 클릭 방지
              if (e.pointerType === 'touch') {
                e.preventDefault();
                e.stopPropagation();
                // 짧은 지연 후 실행하여 터치 이벤트와 분리
                setTimeout(() => {
                  handleToolChange('select');
                }, 50);
              }
            }}
            className={`rounded transition-all duration-200 flex items-center justify-center ${
              currentTool === 'select' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={{ width: buttonSize, height: buttonSize }}
            title="선택 도구"
          >
            <HandPointing size={iconSize * 0.8} weight="duotone" color="#302929" />
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
            <Pencil size={iconSize * 0.8} weight="duotone" color="#302929" />
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
            <Eraser size={iconSize * 0.8} weight="duotone" color="#302929" />
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); handleCheckboxCreate(); }}
            className="rounded transition-all duration-200 flex items-center justify-center bg-green-500 text-white hover:bg-green-600 shadow-md"
            style={{ width: buttonSize, height: buttonSize }}
            title="체크박스 추가"
          >
            <CheckSquare size={iconSize * 0.8} weight="duotone" color="#302929" />
          </button>

          {/* Undo/Redo 버튼들 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              executeUndo();
            }}
            disabled={!canUndo}
            className={`rounded transition-all duration-200 flex items-center justify-center ${
              canUndo 
                ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-md' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            style={{ width: buttonSize, height: buttonSize }}
            title="되돌리기"
          >
            <ArrowCounterClockwise size={iconSize * 0.8} weight="duotone" color="#302929" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              executeRedo();
            }}
            disabled={!canRedo}
            className={`rounded transition-all duration-200 flex items-center justify-center ${
              canRedo 
                ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-md' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            style={{ width: buttonSize, height: buttonSize }}
            title="다시 실행"
          >
            <ArrowClockwise size={iconSize * 0.8} weight="duotone" color="#302929" />
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
            <House size={iconSize * 0.8} weight="duotone" color="#302929" />
          </button>

          {/* 8: Color Picker */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowColorPalette((v) => !v);
              setShowSizeAdjuster(false);
            }}
            className="rounded border flex items-center justify-center bg-white hover:bg-gray-50"
            style={{ width: buttonSize, height: buttonSize }}
            title="색상 선택"
          >
            <Palette size={iconSize * 0.9} weight="duotone" color="#302929" />
          </button>

          {/* 9: Size Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSizeAdjuster((v) => !v);
              setShowColorPalette(false);
            }}
            className="rounded border flex items-center justify-center bg-white hover:bg-gray-50"
            style={{ width: buttonSize, height: buttonSize }}
            title="크기 조절"
          >
            <Circle size={iconSize * 0.9} weight="duotone" color="#302929" />
          </button>
        </div>

        {/* 하단 2개 버튼 */}
        <div className="flex gap-2 justify-center mt-2">
          {/* 텍스트 박스 생성 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleTextCreate();
            }}
            className="rounded transition-all duration-200 flex items-center justify-center bg-blue-500 text-white hover:bg-blue-600 shadow-md"
            style={{ width: buttonSize, height: buttonSize }}
            title="텍스트 박스 생성"
          >
            <TextAa size={iconSize * 0.8} weight="duotone" color="#FFFFFF" />
          </button>

          {/* 객체 삭제 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteObject();
            }}
            className="rounded transition-all duration-200 flex items-center justify-center bg-red-500 text-white hover:bg-red-600 shadow-md"
            style={{ width: buttonSize, height: buttonSize }}
            title="선택된 객체 삭제"
          >
            <Trash size={iconSize * 0.8} weight="duotone" color="#FFFFFF" />
          </button>
        </div>

        {/* 확장 영역: 색상 팔레트 */}
        {showColorPalette && (
          <div className="mt-2 p-2 bg-gray-50 rounded border">
            <div className="flex flex-wrap gap-2 justify-center">
              {['#000000', '#ff0000', '#00a854', '#1d4ed8', '#ff9900', '#ffff00', '#ffffff', '#7c3aed'].map((color) => (
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
                    width: 24,
                    height: 24
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}

        {/* 확장 영역: 크기 슬라이더 */}
        {showSizeAdjuster && (
          <div className="mt-2 p-2 bg-gray-50 rounded border flex items-center gap-3">
            <span className="text-xs text-slate-600">굵기</span>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={penWidth}
              onChange={(e) => setPenWidth(Number(e.target.value))}
              className="no-drag"
              style={{ width: Math.max(80, size.width - 90) }}
            />
            <span className="text-xs font-mono w-6 text-right">{penWidth}</span>
          </div>
        )}

        {/* 렌더링 품질 표시 */}
        {currentTool === 'pen' && (
          <div className="mt-2 p-2 bg-blue-50 rounded border">
            <div className="text-xs text-blue-700 flex items-center gap-1">
              <span>{usePerfectFreehand ? '✨' : '⚡'}</span>
              {usePerfectFreehand ? '고품질 렌더링' : '기본 렌더링'}
            </div>
          </div>
        )}
      </div>

      {/* 리사이즈 핸들 */}
      <div
        className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        style={{
          touchAction: 'none' // iOS Safari에서 터치 스크롤 방지
        }}
        onPointerDown={handleResizePointerStart}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-gray-400"></div>
      </div>
    </div>
  );
};

export default ViewFloatingToolbar; 
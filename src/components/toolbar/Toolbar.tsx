import React, { useEffect } from 'react';
import { useEditorStore, useAdminConfigStore } from '../../store';
import { useCellSelectionStore } from '../../store/cellSelectionStore';

// 분리된 컴포넌트들 import
import MainToolsSection from './sections/MainToolsSection';
import ExcelDataSection from './sections/ExcelDataSection';
import ObjectPropertiesSection from './sections/ObjectPropertiesSection';
import ExcelCellPropertiesSection from './sections/ExcelCellPropertiesSection';
import DataManagementSection from './sections/DataManagementSection';
import GridManagerSection from './sections/GridManagerSection';
import SettingsSection from './sections/SettingsSection';

// 커스텀 hooks import
import { useToolbarState } from './hooks/useToolbarState';
import { useColorPalette } from './hooks/useColorPalette';
// 사용처 이동됨
import { useToolbarActions } from './hooks/useToolbarActions';

// 유틸리티 함수들 import
import { 
  isExcelCellSelected,
  isInputElement,
  isCanvasContainer
} from './utils/toolbarHelpers';

// 파일 처리 유틸 사용 없음 (핸들러 이동)

import type { SafeSettings } from './types';

const ToolbarRefactored: React.FC = () => {
  // Store hooks
  const { 
    textObjects, 
    imageObjects,
    drawObjects,
    floorImage,
    updateTextObject,
    settings,
    updateSettings,
    initializeFirebaseListeners,
    isLoading
  } = useAdminConfigStore();
  
  const { currentTool, setCurrentTool } = useEditorStore();

  // 커스텀 hooks
  const {
    isSettingsExpanded,
    isExcelPasteExpanded,
    isDataManagementExpanded,
    excelPasteData,
    showPreview,
    colorMode,
    updateTimerRef,
    setExcelPasteData,
    setShowPreview,
    setColorMode,
    toggleSettings,
    toggleExcelPaste,
    toggleDataManagement,
    clearUpdateTimer,
  } = useToolbarState();

  // 설정이 로드되지 않았을 때 기본값 제공
  const safeSettings: SafeSettings = {
    admin: {
      autoToolSwitch: settings?.admin?.autoToolSwitch ?? true,
      gridVisible: settings?.admin?.gridVisible ?? true,
      gridSize: settings?.admin?.gridSize ?? 32,
      gridSnapEnabled: settings?.admin?.gridSnapEnabled ?? false,
      defaultFontSize: settings?.admin?.defaultFontSize ?? 16,
      defaultBoxWidth: settings?.admin?.defaultBoxWidth ?? 200,
      defaultBoxHeight: settings?.admin?.defaultBoxHeight ?? 60,
      objectCreationPosition: settings?.admin?.objectCreationPosition ?? { x: 260, y: 950 },
      defaultCheckboxSettings: settings?.admin?.defaultCheckboxSettings ?? {
        checkedColor: '#22c55e',
        uncheckedColor: '#f3f4f6',
        checkedBackgroundColor: '#ffffff',
        uncheckedBackgroundColor: '#ffffff',
        checkedBackgroundOpacity: 1,
        uncheckedBackgroundOpacity: 1
      },
      excelPasteSettings: settings?.admin?.excelPasteSettings ?? {
        startPosition: { x: 100, y: 100 },
        cellWidth: 120,
        cellHeight: 40,
        fontSize: 14,
        fontColor: '#000000',
        backgroundColor: 'transparent',
        maxRows: 50,
        maxCols: 50
      }
    },
    view: {
      virtualKeyboardEnabled: settings?.view?.virtualKeyboardEnabled ?? true,
      touchMode: settings?.view?.touchMode ?? true,
      usePerfectFreehand: settings?.view?.usePerfectFreehand ?? true
    }
  };

  // 동작 훅으로 콜백/핸들러 집약 (UI/동작 동일)
  const actions = useToolbarActions({
    safeSettings,
    excelPasteData,
    showPreview,
    colorMode,
    setExcelPasteData,
    setShowPreview,
    updateTimerRef,
  });

  // 동작 훅을 사용하므로, Toolbar 내부 임시 구현은 제거

  // 색상 팔레트 hook
  const { handleColorSelect } = useColorPalette({
    selectedObject: actions.selectedObject,
    colorMode,
    updateTextStyle: actions.updateTextStyle,
    updateBoxStyle: actions.updateBoxStyle,
  });

  // Excel 붙여넣기 핸들러는 actions에 통합되어 전달됨
  // 로컬 참조 제거: 아래에서 actions.* 직접 전달

  // 현재 색상 가져오기
  const currentColor = actions.currentColor;

  // 엑셀 셀 선택 상태
  const { clearSelection } = useCellSelectionStore.getState();

  // 객체 생성/삭제/정렬 핸들러는 actions에 통합됨

  // 정렬/복제/삭제/업로드/프리뷰 핸들러는 actions에 통합됨

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      clearUpdateTimer();
    };
  }, [clearUpdateTimer]);

  // 로딩 중이거나 설정이 없으면 로딩 표시
  if (isLoading || !settings) {
    return (
      <div className="w-64 h-full bg-white border-r border-gray-200 p-4 flex items-center justify-center">
        <div className="text-gray-500">설정 로드 중...</div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-[#1F3A5F] h-full flex flex-col overflow-hidden`}
      onClick={(e) => {
        e.stopPropagation();
        
        const target = e.target as HTMLElement;
        if (!isInputElement(target)) {
          const activeElement = document.activeElement as HTMLElement;
          if (activeElement && isCanvasContainer(activeElement)) {
            activeElement.blur();
          }
        }
      }}
    >
      {/* 헤더 */}
      <div className="px-4 h-12 flex items-center border-b border-[#0f1e33] bg-[#1F3A5F]">
        <h1 className="text-lg font-bold text-[#F1F5F9] flex items-center gap-2 leading-none">
          <img src="/ci.png" alt="현대글로비스ci" className="h-5" />
          보드관리자
        </h1>
      </div>

      {/* 스크롤 가능한 콘텐츠 영역 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className={`p-3 space-y-3`}>
          
          {/* 1. 메인 도구 */}
          <MainToolsSection
            currentTool={currentTool}
            onToolSelect={setCurrentTool}
            onCreateText={actions.handleCreateText}
            onCreateCheckbox={actions.handleCreateCheckbox}
            onCreateImage={actions.handleCreateImage}
          />

          {/* 2. 엑셀 데이터 입력 */}
          <ExcelDataSection
            isExpanded={isExcelPasteExpanded}
            onToggle={toggleExcelPaste}
            excelPasteData={excelPasteData}
            showPreview={showPreview}
            safeSettings={safeSettings}
            onDataChange={setExcelPasteData}
            onPreviewToggle={actions.handlePreviewToggle}
            onCreateCells={actions.handleCreateExcelCells}
            onDeleteCellGroups={actions.handleDeleteExcelCellGroups}
            updateSettings={updateSettings}
          />

          {/* 3. 선택된 객체 편집 */}
          {actions.selectedObject && !isExcelCellSelected(actions.selectedObject) && actions.selectedCellCount === 0 && (
            <ObjectPropertiesSection
              selectedObject={actions.selectedObject}
              colorMode={colorMode}
              onColorModeChange={setColorMode}
              onColorSelect={handleColorSelect}
              onUpdateTextObject={updateTextObject}
              onUpdateImageObject={actions.debouncedUpdateImageObject}
              onDuplicate={actions.handleDuplicateObject}
              onDelete={actions.handleDeleteObject}
              onBringToFront={actions.handleBringToFront}
              onBringForward={actions.handleBringForward}
              onSendBackward={actions.handleSendBackward}
              onSendToBack={actions.handleSendToBack}
              getCurrentColor={() => currentColor}
            />
          )}

          {/* 3-1. 다중선택된 엑셀 셀들 편집 */}
          <ExcelCellPropertiesSection
            textObjects={textObjects}
            colorMode={colorMode}
            onColorModeChange={setColorMode}
            onUpdateTextObject={updateTextObject}
            clearCellSelection={clearSelection}
          />

          {/* 4. 그리드 설정 */}
          <GridManagerSection />

          {/* 5. 데이터 관리 */}
          <DataManagementSection
            isExpanded={isDataManagementExpanded}
            onToggle={toggleDataManagement}
            textObjects={textObjects}
            imageObjects={imageObjects}
            drawObjects={drawObjects}
            floorImage={floorImage}
            settings={settings}
            initializeFirebaseListeners={initializeFirebaseListeners}
          />

          {/* 6. 설정 */}
          <SettingsSection
            isExpanded={isSettingsExpanded}
            onToggle={toggleSettings}
            safeSettings={safeSettings}
            updateSettings={updateSettings}
            onImageUpload={actions.handleImageUpload}
          />
                      </div>
                    </div>
    </div>
  );
};

export default ToolbarRefactored;
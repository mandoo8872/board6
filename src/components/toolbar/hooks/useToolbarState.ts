import { useState, useRef } from 'react';

export const useToolbarState = () => {
  // 설정 메뉴 접기/펼치기 상태
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [isExcelPasteExpanded, setIsExcelPasteExpanded] = useState(false);
  const [isDataManagementExpanded, setIsDataManagementExpanded] = useState(false);
  const [excelPasteData, setExcelPasteData] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // 색상 선택 모드 상태 (text, background, border)
  const [colorMode, setColorMode] = useState<'text' | 'background' | 'border'>('text');

  // 디바운싱을 위한 타이머 ref
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);

  const toggleSettings = () => setIsSettingsExpanded(!isSettingsExpanded);
  const toggleExcelPaste = () => setIsExcelPasteExpanded(!isExcelPasteExpanded);
  const toggleDataManagement = () => setIsDataManagementExpanded(!isDataManagementExpanded);

  const resetExcelData = () => {
    setExcelPasteData('');
    setShowPreview(false);
  };

  const clearUpdateTimer = () => {
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
      updateTimerRef.current = null;
    }
  };

  return {
    // 상태
    isSettingsExpanded,
    isExcelPasteExpanded,
    isDataManagementExpanded,
    excelPasteData,
    showPreview,
    colorMode,
    updateTimerRef,
    
    // 액션
    setIsSettingsExpanded,
    setIsExcelPasteExpanded,
    setIsDataManagementExpanded,
    setExcelPasteData,
    setShowPreview,
    setColorMode,
    toggleSettings,
    toggleExcelPaste,
    toggleDataManagement,
    resetExcelData,
    clearUpdateTimer,
  };
};
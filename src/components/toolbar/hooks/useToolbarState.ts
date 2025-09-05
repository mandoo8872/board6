import { useState, useRef, useEffect } from 'react';

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

  const toggleSettings = () => {
    const next = !isSettingsExpanded;
    setIsSettingsExpanded(next);
    if (next) {
      setIsExcelPasteExpanded(false);
      setIsDataManagementExpanded(false);
      window.dispatchEvent(new CustomEvent('toolbar-open', { detail: 'settings' } as any));
    }
  };
  const toggleExcelPaste = () => {
    const next = !isExcelPasteExpanded;
    setIsExcelPasteExpanded(next);
    if (next) {
      setIsSettingsExpanded(false);
      setIsDataManagementExpanded(false);
      window.dispatchEvent(new CustomEvent('toolbar-open', { detail: 'excel' } as any));
    }
  };
  const toggleDataManagement = () => {
    const next = !isDataManagementExpanded;
    setIsDataManagementExpanded(next);
    if (next) {
      setIsSettingsExpanded(false);
      setIsExcelPasteExpanded(false);
      window.dispatchEvent(new CustomEvent('toolbar-open', { detail: 'data' } as any));
    }
  };

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

  // GridManagerSection가 열릴 때(=detail 'grid') 다른 카드 접기
  useEffect(() => {
    const h = (e: any) => {
      if (e && e.detail === 'grid') {
        setIsSettingsExpanded(false);
        setIsExcelPasteExpanded(false);
        setIsDataManagementExpanded(false);
      }
    };
    window.addEventListener('toolbar-open', h);
    return () => window.removeEventListener('toolbar-open', h);
  }, []);

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
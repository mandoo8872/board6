import { useMemo, useCallback } from 'react';
import type { SafeSettings } from '../types';
import { getExcelDataDimensions } from '../utils/toolbarHelpers';

interface Params {
  excelPasteData: string;
  safeSettings: SafeSettings;
  onDataChange: (data: string) => void;
  updateSettings: (category: 'admin' | 'view', updates: any) => void;
}

export function useExcelDataSection(params: Params) {
  const { excelPasteData, safeSettings, onDataChange, updateSettings } = params;

  const dataDimensions = useMemo(() => getExcelDataDimensions(excelPasteData), [excelPasteData]);

  const handleDataChange = useCallback((value: string) => {
    onDataChange(value);
    const event = new CustomEvent('excel-preview-update', {
      detail: { data: value, show: !!value.trim() },
    });
    window.dispatchEvent(event);
  }, [onDataChange]);

  const setStartX = useCallback((x: number) => {
    updateSettings('admin', {
      excelPasteSettings: {
        ...safeSettings.admin.excelPasteSettings,
        startPosition: { ...safeSettings.admin.excelPasteSettings.startPosition, x },
      },
    });
  }, [safeSettings, updateSettings]);

  const setStartY = useCallback((y: number) => {
    updateSettings('admin', {
      excelPasteSettings: {
        ...safeSettings.admin.excelPasteSettings,
        startPosition: { ...safeSettings.admin.excelPasteSettings.startPosition, y },
      },
    });
  }, [safeSettings, updateSettings]);

  const decStartX = useCallback(() => setStartX(Math.max(0, safeSettings.admin.excelPasteSettings.startPosition.x - 10)), [safeSettings, setStartX]);
  const incStartX = useCallback(() => setStartX(safeSettings.admin.excelPasteSettings.startPosition.x + 10), [safeSettings, setStartX]);
  const decStartY = useCallback(() => setStartY(Math.max(0, safeSettings.admin.excelPasteSettings.startPosition.y - 10)), [safeSettings, setStartY]);
  const incStartY = useCallback(() => setStartY(safeSettings.admin.excelPasteSettings.startPosition.y + 10), [safeSettings, setStartY]);

  const setCellWidth = useCallback((cellWidth: number) => {
    updateSettings('admin', {
      excelPasteSettings: {
        ...safeSettings.admin.excelPasteSettings,
        cellWidth,
      },
    });
  }, [safeSettings, updateSettings]);

  const setCellHeight = useCallback((cellHeight: number) => {
    updateSettings('admin', {
      excelPasteSettings: {
        ...safeSettings.admin.excelPasteSettings,
        cellHeight,
      },
    });
  }, [safeSettings, updateSettings]);

  const decCellWidth = useCallback(() => setCellWidth(Math.max(20, safeSettings.admin.excelPasteSettings.cellWidth - 1)), [safeSettings, setCellWidth]);
  const incCellWidth = useCallback(() => setCellWidth(Math.min(300, safeSettings.admin.excelPasteSettings.cellWidth + 1)), [safeSettings, setCellWidth]);
  const decCellHeight = useCallback(() => setCellHeight(Math.max(20, safeSettings.admin.excelPasteSettings.cellHeight - 1)), [safeSettings, setCellHeight]);
  const incCellHeight = useCallback(() => setCellHeight(Math.min(100, safeSettings.admin.excelPasteSettings.cellHeight + 1)), [safeSettings, setCellHeight]);

  const canExecute = useMemo(() => !!excelPasteData.trim(), [excelPasteData]);

  return {
    dataDimensions,
    handleDataChange,
    canExecute,
    // position handlers
    decStartX, incStartX, setStartX,
    decStartY, incStartY, setStartY,
    // size handlers
    decCellWidth, incCellWidth,
    decCellHeight, incCellHeight,
  };
}



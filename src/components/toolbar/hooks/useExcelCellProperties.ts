import { useCallback } from 'react';
import { useCellSelectionStore } from '../../../store/cellSelectionStore';
import { useAdminConfigStore } from '../../../store';
import type { TextObject } from '../../../types';

type ColorMode = 'text' | 'background' | 'border';

interface UseExcelCellPropertiesParams {
  textObjects: TextObject[];
  colorMode: ColorMode;
  onColorModeChange: (mode: ColorMode) => void;
  onUpdateTextObject: (id: string, updates: Partial<TextObject>) => void;
  clearCellSelection: () => void;
}

export function useExcelCellProperties(params: UseExcelCellPropertiesParams) {
  const { textObjects, colorMode, onColorModeChange, onUpdateTextObject, clearCellSelection } = params;
  const adminStore = useAdminConfigStore;

  // Zustand selection store
  const selectedCells = useCellSelectionStore((state) => Array.from(state.selectedCellIds));
  const selectedCount = useCellSelectionStore((state) => state.selectedCellIds.size);
  const storeClearSelection = useCellSelectionStore((state) => state.clearSelection);

  const handleClearSelection = useCallback(() => {
    storeClearSelection();
    clearCellSelection();
  }, [storeClearSelection, clearCellSelection]);

  const getMinFontSize = useCallback(() => {
    let minFontSize = 72;
    for (const cellId of selectedCells) {
      const cellObj = textObjects.find((obj) => obj.id === cellId);
      if (cellObj && cellObj.cellType === 'cell') {
        minFontSize = Math.min(minFontSize, cellObj.fontSize || 16);
      }
    }
    return minFontSize === 72 ? 16 : minFontSize;
  }, [selectedCells, textObjects]);

  const handleFontSizeDecrease = useCallback(async () => {
    const currentMinSize = getMinFontSize();
    const newFontSize = Math.max(8, currentMinSize - 2);
    if (adminStore.getState().updateTextObjectsBatch) {
      const updates: Record<string, Partial<TextObject>> = {};
      selectedCells.forEach((cellId) => {
        const cellObj = textObjects.find((obj) => obj.id === cellId);
        if (cellObj && cellObj.cellType === 'cell') {
          updates[cellId] = { fontSize: newFontSize };
        }
      });
      await adminStore.getState().updateTextObjectsBatch(updates);
    } else {
      const updatePromises = selectedCells.map(async (cellId) => {
        const cellObj = textObjects.find((obj) => obj.id === cellId);
        if (cellObj && cellObj.cellType === 'cell') {
          return onUpdateTextObject(cellId, { fontSize: newFontSize });
        }
      });
      await Promise.all(updatePromises.filter((p) => p !== undefined));
    }
  }, [getMinFontSize, selectedCells, textObjects, onUpdateTextObject]);

  const handleFontSizeIncrease = useCallback(async () => {
    const currentMinSize = getMinFontSize();
    const newFontSize = Math.min(72, currentMinSize + 2);
    if (adminStore.getState().updateTextObjectsBatch) {
      const updates: Record<string, Partial<TextObject>> = {};
      selectedCells.forEach((cellId) => {
        const cellObj = textObjects.find((obj) => obj.id === cellId);
        if (cellObj && cellObj.cellType === 'cell') {
          updates[cellId] = { fontSize: newFontSize };
        }
      });
      await adminStore.getState().updateTextObjectsBatch(updates);
    } else {
      const updatePromises = selectedCells.map(async (cellId) => {
        const cellObj = textObjects.find((obj) => obj.id === cellId);
        if (cellObj && cellObj.cellType === 'cell') {
          return onUpdateTextObject(cellId, { fontSize: newFontSize });
        }
      });
      await Promise.all(updatePromises.filter((p) => p !== undefined));
    }
  }, [getMinFontSize, selectedCells, textObjects, onUpdateTextObject]);

  const handleSetTransparentBackground = useCallback(async () => {
    const updatePromises = selectedCells.map(async (cellId) => {
      const cellObj = textObjects.find((obj) => obj.id === cellId);
      if (cellObj && cellObj.cellType === 'cell') {
        const currentBoxStyle = cellObj.boxStyle || {
          backgroundColor: 'transparent',
          backgroundOpacity: 1,
          borderColor: '#000000',
          borderWidth: 0,
          borderRadius: 0,
        };
        return onUpdateTextObject(cellId, { boxStyle: { ...currentBoxStyle, backgroundColor: 'transparent' } });
      }
    });
    await Promise.all(updatePromises.filter((p) => p !== undefined));
  }, [selectedCells, textObjects, onUpdateTextObject]);

  const handleColorPick = useCallback(
    async (color: string) => {
      const updatePromises = selectedCells.map(async (cellId) => {
        const cellObj = textObjects.find((obj) => obj.id === cellId);
        if (cellObj && cellObj.cellType === 'cell') {
          if (colorMode === 'text') {
            const currentTextStyle = cellObj.textStyle || {
              color: '#000000',
              bold: false,
              italic: false,
              horizontalAlign: 'left',
              verticalAlign: 'middle',
              fontFamily: 'Arial',
            };
            return onUpdateTextObject(cellId, { textStyle: { ...currentTextStyle, color } });
          } else if (colorMode === 'background') {
            const currentBoxStyle = cellObj.boxStyle || {
              backgroundColor: 'transparent',
              backgroundOpacity: 1,
              borderColor: '#000000',
              borderWidth: 0,
              borderRadius: 0,
            };
            return onUpdateTextObject(cellId, { boxStyle: { ...currentBoxStyle, backgroundColor: color } });
          } else if (colorMode === 'border') {
            const currentBoxStyle = cellObj.boxStyle || {
              backgroundColor: 'transparent',
              backgroundOpacity: 1,
              borderColor: '#000000',
              borderWidth: 0,
              borderRadius: 0,
            };
            return onUpdateTextObject(cellId, { boxStyle: { ...currentBoxStyle, borderColor: color, borderWidth: 1 } });
          }
        }
      });
      await Promise.all(updatePromises.filter((p) => p !== undefined));
    },
    [colorMode, selectedCells, textObjects, onUpdateTextObject]
  );

  const handleToggleBold = useCallback(async () => {
    const updatePromises = selectedCells.map(async (cellId) => {
      const cellObj = textObjects.find((obj) => obj.id === cellId);
      if (cellObj && cellObj.cellType === 'cell') {
        const currentTextStyle = cellObj.textStyle || {
          color: '#000000',
          bold: false,
          italic: false,
          horizontalAlign: 'left',
          verticalAlign: 'middle',
          fontFamily: 'Arial',
        };
        return onUpdateTextObject(cellId, { textStyle: { ...currentTextStyle, bold: !currentTextStyle.bold } });
      }
    });
    await Promise.all(updatePromises.filter((p) => p !== undefined));
  }, [selectedCells, textObjects, onUpdateTextObject]);

  const handleToggleItalic = useCallback(async () => {
    const updatePromises = selectedCells.map(async (cellId) => {
      const cellObj = textObjects.find((obj) => obj.id === cellId);
      if (cellObj && cellObj.cellType === 'cell') {
        const currentTextStyle = cellObj.textStyle || {
          color: '#000000',
          bold: false,
          italic: false,
          horizontalAlign: 'left',
          verticalAlign: 'middle',
          fontFamily: 'Arial',
        };
        return onUpdateTextObject(cellId, { textStyle: { ...currentTextStyle, italic: !currentTextStyle.italic } });
      }
    });
    await Promise.all(updatePromises.filter((p) => p !== undefined));
  }, [selectedCells, textObjects, onUpdateTextObject]);

  const handleSetHorizontalAlign = useCallback(
    async (align: 'left' | 'center' | 'right') => {
      const updatePromises = selectedCells.map(async (cellId) => {
        const cellObj = textObjects.find((obj) => obj.id === cellId);
        if (cellObj && cellObj.cellType === 'cell') {
          const currentTextStyle = cellObj.textStyle || {
            color: '#000000',
            bold: false,
            italic: false,
            horizontalAlign: 'left',
            verticalAlign: 'middle',
            fontFamily: 'Arial',
          };
          return onUpdateTextObject(cellId, { textStyle: { ...currentTextStyle, horizontalAlign: align } });
        }
      });
      await Promise.all(updatePromises.filter((p) => p !== undefined));
    },
    [selectedCells, textObjects, onUpdateTextObject]
  );

  const handleSetVerticalAlign = useCallback(
    async (align: 'top' | 'middle' | 'bottom') => {
      for (const cellId of selectedCells) {
        const cellObj = textObjects.find((obj) => obj.id === cellId);
        if (cellObj && cellObj.cellType === 'cell') {
          const currentTextStyle = cellObj.textStyle || {
            color: '#000000',
            bold: false,
            italic: false,
            horizontalAlign: 'left',
            verticalAlign: 'middle',
            fontFamily: 'Arial',
          };
          await onUpdateTextObject(cellId, { textStyle: { ...currentTextStyle, verticalAlign: align } });
        }
      }
    },
    [selectedCells, textObjects, onUpdateTextObject]
  );

  const colorPalette = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#FFC0CB', '#A52A2A', '#808080', '#008000', '#000080',
    '#800000', '#008080', '#C0C0C0', '#FFFFE0', '#F0F8FF',
  ];

  return {
    selectedCells,
    selectedCount,
    colorMode,
    onColorModeChange,
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
  };
}



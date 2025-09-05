import { useCallback, useMemo, MutableRefObject } from 'react';
import { useAdminConfigStore, useEditorStore } from '../../../store';
import { useCellSelectionStore } from '../../../store/cellSelectionStore';
import { TextObject, ImageObject } from '../../../types';
import { useExcelPaste } from './useExcelPaste';
import {
  getCurrentColor,
  getMinZIndex,
  getNextHigherZIndex,
  getNextLowerZIndex,
} from '../utils/toolbarHelpers';
import {
  convertImageToBase64,
  getImageDimensions,
  openFileDialog,
  calculateOptimalImageSize,
} from '../utils/fileHandlers';
import type { SafeSettings } from '../types';

interface UseToolbarActionsParams {
  safeSettings: SafeSettings;
  excelPasteData: string;
  showPreview: boolean;
  colorMode: 'text' | 'background' | 'border';
  setExcelPasteData: (data: string) => void;
  setShowPreview: (show: boolean) => void;
  updateTimerRef: MutableRefObject<NodeJS.Timeout | null>;
}

export function useToolbarActions(params: UseToolbarActionsParams) {
  const { safeSettings, excelPasteData, showPreview, colorMode, setExcelPasteData, setShowPreview, updateTimerRef } = params;

  // Stores
  const {
    textObjects,
    imageObjects,
    drawObjects,
    floorImage,
    addTextObject,
    addTextObjects,
    addImageObject,
    updateTextObject,
    updateImageObject,
    setFloorImage,
    deleteTextObject,
    deleteTextObjects,
    deleteImageObject,
    settings,
    updateSettings,
    initializeFirebaseListeners,
    isLoading,
  } = useAdminConfigStore();

  const { selectedObjectId, setSelectedObjectId } = useEditorStore();

  // 선택 객체 계산
  const selectedObject = useMemo(() => {
    return selectedObjectId
      ? (textObjects.find((o) => o.id === selectedObjectId) || imageObjects.find((o) => o.id === selectedObjectId) || null)
      : null;
  }, [selectedObjectId, textObjects, imageObjects]);

  // 디바운스 타이머 Ref는 상위에서 전달

  const debouncedUpdateTextObject = useCallback(
    (id: string, updates: any) => {
      if (updateTimerRef?.current) {
        clearTimeout(updateTimerRef.current);
      }
      updateTimerRef.current = setTimeout(() => {
        updateTextObject(id, updates);
      }, 300);
    },
    [updateTextObject]
  );

  const debouncedUpdateImageObject = useCallback(
    (id: string, updates: any) => {
      if (updateTimerRef?.current) {
        clearTimeout(updateTimerRef.current);
      }
      updateTimerRef.current = setTimeout(() => {
        updateImageObject(id, updates);
      }, 300);
    },
    [updateImageObject]
  );

  const updateTextStyle = useCallback(
    async (updates: any) => {
      if (selectedObject && 'text' in selectedObject) {
        const currentTextStyle = selectedObject.textStyle || {
          color: '#000000',
          bold: false,
          italic: false,
          horizontalAlign: 'left',
          verticalAlign: 'middle',
          fontFamily: 'Arial',
        };
        await updateTextObject(selectedObject.id, {
          textStyle: { ...currentTextStyle, ...updates },
        });
      }
    },
    [selectedObject, updateTextObject]
  );

  const updateBoxStyle = useCallback(
    async (updates: any) => {
      if (selectedObject && 'text' in selectedObject) {
        const currentBoxStyle = selectedObject.boxStyle || {
          backgroundColor: 'transparent',
          backgroundOpacity: 1,
          borderColor: '#000000',
          borderWidth: 0,
          borderRadius: 0,
        };
        await updateTextObject(selectedObject.id, {
          boxStyle: { ...currentBoxStyle, ...updates },
        });
      }
    },
    [selectedObject, updateTextObject]
  );

  // Excel 붙여넣기용 래퍼
  const addTextObjectsForExcel = useCallback(async (objects: Omit<TextObject, 'id'>[]): Promise<string[]> => {
    return await addTextObjects(objects);
  }, [addTextObjects]);

  const deleteTextObjectsForExcel = useCallback(async (ids: string[]): Promise<void> => {
    return await deleteTextObjects(ids);
  }, [deleteTextObjects]);

  const { handleCreateExcelCells, handleDeleteExcelCellGroups } = useExcelPaste({
    excelPasteData,
    showPreview,
    safeSettings,
    textObjects,
    addTextObjects: addTextObjectsForExcel,
    deleteTextObjects: deleteTextObjectsForExcel,
    onDataChange: setExcelPasteData,
    onPreviewChange: setShowPreview,
  });

  // 현재 색상
  const currentColor = useMemo(() => getCurrentColor(selectedObject, colorMode), [selectedObject, colorMode]);

  // 객체 생성
  const handleCreateText = useCallback(async () => {
    const { x, y } = safeSettings.admin.objectCreationPosition;
    const newTextObject: Omit<TextObject, 'id'> = {
      x,
      y,
      width: safeSettings.admin.defaultBoxWidth,
      height: safeSettings.admin.defaultBoxHeight,
      text: '새 텍스트',
      fontSize: safeSettings.admin.defaultFontSize,
      textStyle: {
        color: '#000000',
        bold: false,
        italic: false,
        horizontalAlign: 'left',
        verticalAlign: 'middle',
        fontFamily: 'Arial',
      },
      boxStyle: {
        backgroundColor: 'transparent',
        backgroundOpacity: 1,
        borderColor: '#000000',
        borderWidth: 0,
        borderRadius: 0,
      },
      permissions: { editable: true, movable: true, resizable: true, deletable: true },
      zIndex: 10000 + (Date.now() % 100000),
      locked: false,
      visible: true,
      opacity: 1,
      hasCheckbox: false,
      checkboxChecked: false,
      checkboxCheckedColor: '#22c55e',
      checkboxUncheckedColor: '#f3f4f6',
      isEditing: false,
      lastModified: Date.now(),
    };
    await addTextObject(newTextObject);
  }, [addTextObject, safeSettings]);

  const handleCreateCheckbox = useCallback(async () => {
    const { x, y } = safeSettings.admin.objectCreationPosition;
    const {
      checkedColor,
      uncheckedColor,
      checkedBackgroundColor,
      uncheckedBackgroundColor,
      checkedBackgroundOpacity,
      uncheckedBackgroundOpacity,
    } = safeSettings.admin.defaultCheckboxSettings;

    const newCheckboxObject: Omit<TextObject, 'id'> = {
      x,
      y,
      width: safeSettings.admin.defaultBoxWidth,
      height: safeSettings.admin.defaultBoxHeight,
      text: '체크박스',
      fontSize: safeSettings.admin.defaultFontSize,
      textStyle: {
        color: '#000000',
        bold: true,
        italic: false,
        horizontalAlign: 'left',
        verticalAlign: 'middle',
        fontFamily: 'Arial',
      },
      boxStyle: {
        backgroundColor: 'transparent',
        backgroundOpacity: 1,
        borderColor: '#000000',
        borderWidth: 1,
        borderRadius: 8,
      },
      permissions: { editable: true, movable: true, resizable: true, deletable: true },
      zIndex: 10000 + (Date.now() % 100000),
      locked: false,
      visible: true,
      opacity: 1,
      hasCheckbox: true,
      checkboxChecked: false,
      checkboxCheckedColor: checkedColor,
      checkboxUncheckedColor: uncheckedColor,
      checkedBackgroundColor,
      uncheckedBackgroundColor,
      checkedBackgroundOpacity,
      uncheckedBackgroundOpacity,
      isEditing: false,
      lastModified: Date.now(),
    };
    await addTextObject(newCheckboxObject);
  }, [addTextObject, safeSettings]);

  const handleCreateImage = useCallback(async () => {
    const file = await openFileDialog('image/*');
    if (!file) return;
    const src = await convertImageToBase64(file);
    const { width: naturalWidth, height: naturalHeight } = await getImageDimensions(src);
    const { width, height } = calculateOptimalImageSize(naturalWidth, naturalHeight, 200);
    const { x, y } = safeSettings.admin.objectCreationPosition;
    const newImageObject: Omit<ImageObject, 'id'> = {
      x,
      y,
      width,
      height,
      src,
      permissions: { editable: true, movable: true, resizable: true, deletable: true },
      zIndex: 10000 + (Date.now() % 100000),
      locked: false,
      visible: true,
      opacity: 1,
      maintainAspectRatio: true,
      lastModified: Date.now(),
    };
    await addImageObject(newImageObject);
  }, [addImageObject, safeSettings]);

  // 레이어 순서 조정
  const handleBringToFront = useCallback(async () => {
    if (!selectedObjectId) return;
    const nonExcelObjects = [...textObjects, ...imageObjects].filter((obj) => !('cellType' in obj) || obj.cellType !== 'cell');
    const maxZIndex = nonExcelObjects.length > 0 ? Math.max(...nonExcelObjects.map((obj) => obj.zIndex || 0)) : 10000;
    const textObj = textObjects.find((obj) => obj.id === selectedObjectId);
    if (textObj) { await updateTextObject(selectedObjectId, { zIndex: maxZIndex + 1 }); return; }
    const imageObj = imageObjects.find((obj) => obj.id === selectedObjectId);
    if (imageObj) { await updateImageObject(selectedObjectId, { zIndex: maxZIndex + 1 }); }
  }, [selectedObjectId, textObjects, imageObjects, updateTextObject, updateImageObject]);

  const handleBringForward = useCallback(async () => {
    if (!selectedObjectId) return;
    const currentObj = [...textObjects, ...imageObjects].find((obj) => obj.id === selectedObjectId);
    if (!currentObj) return;
    const nonExcelTextObjects = textObjects.filter((obj) => !('cellType' in obj) || obj.cellType !== 'cell');
    const nonExcelImageObjects = imageObjects.filter((obj) => !('cellType' in obj) || obj.cellType !== 'cell');
    const nextZIndex = getNextHigherZIndex(currentObj.zIndex || 0, nonExcelTextObjects, nonExcelImageObjects);
    if (nextZIndex === null) return;
    const textObj = textObjects.find((obj) => obj.id === selectedObjectId);
    if (textObj) { await updateTextObject(selectedObjectId, { zIndex: nextZIndex + 1 }); return; }
    const imageObj = imageObjects.find((obj) => obj.id === selectedObjectId);
    if (imageObj) { await updateImageObject(selectedObjectId, { zIndex: nextZIndex + 1 }); }
  }, [selectedObjectId, textObjects, imageObjects, updateTextObject, updateImageObject]);

  const handleSendBackward = useCallback(async () => {
    if (!selectedObjectId) return;
    const currentObj = [...textObjects, ...imageObjects].find((obj) => obj.id === selectedObjectId);
    if (!currentObj) return;
    const nonExcelTextObjects = textObjects.filter((obj) => !('cellType' in obj) || obj.cellType !== 'cell');
    const nonExcelImageObjects = imageObjects.filter((obj) => !('cellType' in obj) || obj.cellType !== 'cell');
    const prevZIndex = getNextLowerZIndex(currentObj.zIndex || 0, nonExcelTextObjects, nonExcelImageObjects);
    if (prevZIndex === null) return;
    const textObj = textObjects.find((obj) => obj.id === selectedObjectId);
    if (textObj) { await updateTextObject(selectedObjectId, { zIndex: prevZIndex - 1 }); return; }
    const imageObj = imageObjects.find((obj) => obj.id === selectedObjectId);
    if (imageObj) { await updateImageObject(selectedObjectId, { zIndex: prevZIndex - 1 }); }
  }, [selectedObjectId, textObjects, imageObjects, updateTextObject, updateImageObject]);

  const handleSendToBack = useCallback(async () => {
    if (!selectedObjectId) return;
    const nonExcelTextObjects = textObjects.filter((obj) => !('cellType' in obj) || obj.cellType !== 'cell');
    const nonExcelImageObjects = imageObjects.filter((obj) => !('cellType' in obj) || obj.cellType !== 'cell');
    const minZIndex = getMinZIndex(nonExcelTextObjects, nonExcelImageObjects);
    const newZIndex = Math.max(10000, minZIndex - 1);
    const textObj = textObjects.find((obj) => obj.id === selectedObjectId);
    if (textObj) { await updateTextObject(selectedObjectId, { zIndex: newZIndex }); return; }
    const imageObj = imageObjects.find((obj) => obj.id === selectedObjectId);
    if (imageObj) { await updateImageObject(selectedObjectId, { zIndex: newZIndex }); }
  }, [selectedObjectId, textObjects, imageObjects, updateTextObject, updateImageObject]);

  // 복제/삭제
  const handleDuplicateObject = useCallback(async () => {
    if (!selectedObjectId) return;
    const textObj = textObjects.find((obj) => obj.id === selectedObjectId);
    if (textObj) {
      const duplicatedObj = { ...textObj, x: textObj.x + 20, y: textObj.y + 20, isEditing: false } as TextObject;
      delete (duplicatedObj as any).id;
      await addTextObject(duplicatedObj);
      return;
    }
    const imageObj = imageObjects.find((obj) => obj.id === selectedObjectId);
    if (imageObj) {
      const duplicatedObj = { ...imageObj, x: imageObj.x + 20, y: imageObj.y + 20 } as ImageObject;
      delete (duplicatedObj as any).id;
      await addImageObject(duplicatedObj);
    }
  }, [selectedObjectId, textObjects, imageObjects, addTextObject, addImageObject]);

  const handleDeleteObject = useCallback(async () => {
    if (!selectedObjectId) return;
    const textObj = textObjects.find((obj) => obj.id === selectedObjectId);
    if (textObj && textObj.permissions?.deletable) {
      await deleteTextObject(selectedObjectId);
      setSelectedObjectId(null);
      return;
    }
    const imageObj = imageObjects.find((obj) => obj.id === selectedObjectId);
    if (imageObj && imageObj.permissions?.deletable) {
      await deleteImageObject(selectedObjectId);
      setSelectedObjectId(null);
    }
  }, [selectedObjectId, textObjects, imageObjects, deleteTextObject, deleteImageObject, setSelectedObjectId]);

  // 배경 이미지 업로드
  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const base64 = await convertImageToBase64(file);
      await setFloorImage({ path: base64 });
    },
    [setFloorImage]
  );

  // 프리뷰 토글
  const handlePreviewToggle = useCallback(() => {
    setShowPreview(!showPreview);
    const event = new CustomEvent('excel-preview-update', {
      detail: { data: excelPasteData, show: !showPreview },
    });
    window.dispatchEvent(event);
  }, [showPreview, excelPasteData, setShowPreview]);

  // 엑셀 셀 선택 카운트
  const selectedCellCount = useCellSelectionStore.getState().getSelectedCount();

  return {
    // pass-through
    textObjects,
    imageObjects,
    drawObjects,
    floorImage,
    settings,
    updateSettings,
    initializeFirebaseListeners,
    isLoading,
    selectedObject,
    selectedCellCount,
    currentColor,
    // handlers
    debouncedUpdateTextObject,
    debouncedUpdateImageObject,
    updateTextStyle,
    updateBoxStyle,
    addTextObjectsForExcel,
    deleteTextObjectsForExcel,
    handleCreateExcelCells,
    handleDeleteExcelCellGroups,
    handleCreateText,
    handleCreateCheckbox,
    handleCreateImage,
    handleBringToFront,
    handleBringForward,
    handleSendBackward,
    handleSendToBack,
    handleDuplicateObject,
    handleDeleteObject,
    handleImageUpload,
    handlePreviewToggle,
  };
}



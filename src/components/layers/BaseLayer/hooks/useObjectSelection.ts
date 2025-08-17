import { useCallback } from 'react';
import { TextObject, ImageObject } from '../../../../types';
import { useCellSelectionStore } from '../../../../store/cellSelectionStore';

export const useObjectSelection = (
  textObjects: TextObject[],
  imageObjects: ImageObject[],
  deleteTextObject: (id: string) => Promise<void>,
  deleteImageObject: (id: string) => Promise<void>,
  addTextObject: (obj: Omit<TextObject, 'id'>) => Promise<string>,
  addImageObject: (obj: Omit<ImageObject, 'id'>) => Promise<string>,
  updateTextObject: (id: string, updates: Partial<TextObject>) => Promise<void>,
  setSelectedObjectId: (id: string | null) => void
) => {
  // 선택된 객체 복제
  const handleDuplicateObject = useCallback(async (selectedObjectId: string | null) => {
    if (!selectedObjectId) return;
    
    // 텍스트 객체 복제
    const textObj = textObjects.find(obj => obj.id === selectedObjectId);
    if (textObj) {
      const duplicatedObj = {
        ...textObj,
        x: textObj.x + 20, // 약간 오프셋
        y: textObj.y + 20,
        isEditing: false
      };
      delete (duplicatedObj as any).id; // id 제거하여 새로 생성되도록
      await addTextObject(duplicatedObj);
      return;
    }
    
    // 이미지 객체 복제
    const imageObj = imageObjects.find(obj => obj.id === selectedObjectId);
    if (imageObj) {
      const duplicatedObj = {
        ...imageObj,
        x: imageObj.x + 20, // 약간 오프셋
        y: imageObj.y + 20
      };
      delete (duplicatedObj as any).id; // id 제거하여 새로 생성되도록
      await addImageObject(duplicatedObj);
      return;
    }
  }, [textObjects, imageObjects, addTextObject, addImageObject]);

  // 선택된 객체 삭제
  const handleDeleteObject = useCallback(async (selectedObjectId: string | null) => {
    if (!selectedObjectId) return;
    
    // 텍스트 객체 삭제
    const textObj = textObjects.find(obj => obj.id === selectedObjectId);
    if (textObj && textObj.permissions?.deletable) {
      await deleteTextObject(selectedObjectId);
      setSelectedObjectId(null);
      return;
    }
    
    // 이미지 객체 삭제
    const imageObj = imageObjects.find(obj => obj.id === selectedObjectId);
    if (imageObj && imageObj.permissions?.deletable) {
      await deleteImageObject(selectedObjectId);
      setSelectedObjectId(null);
      return;
    }
  }, [textObjects, imageObjects, deleteTextObject, deleteImageObject, setSelectedObjectId]);

  // 다중선택된 엑셀 셀들의 텍스트 내용 일괄 삭제
  const handleBulkClearCellText = useCallback(async () => {
    const { getSelectedCells } = useCellSelectionStore.getState();
    const selectedCellIds = getSelectedCells();
    
    if (selectedCellIds.length === 0) return;
    
    try {
      // 선택된 셀들의 텍스트를 빈 문자열로 변경
      for (const cellId of selectedCellIds) {
        const cellObj = textObjects.find(obj => obj.id === cellId);
        if (cellObj && cellObj.cellType === 'cell') {
          await updateTextObject(cellId, { text: '' });
        }
      }
      
      console.log(`${selectedCellIds.length}개 셀의 텍스트 내용이 삭제되었습니다.`);
    } catch (error) {
      console.error('셀 텍스트 일괄 삭제 실패:', error);
    }
  }, [textObjects, updateTextObject]);

  return {
    handleDuplicateObject,
    handleDeleteObject,
    handleBulkClearCellText
  };
};
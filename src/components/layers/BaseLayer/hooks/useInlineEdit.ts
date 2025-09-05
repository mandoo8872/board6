import { useState, useCallback } from 'react';
import { TextObject } from '../../../../types';
import { useAdminConfigStore } from '../../../../store/adminConfigStore';
import { createCurrentSnapshot } from '../../../../utils/snapshot';
import { useUndoRedoStore } from '../../../../store/undoRedoStore';

export const useInlineEdit = (
  updateTextObject: (id: string, updates: Partial<TextObject>) => Promise<void>,
  setSelectedObjectId: (id: string | null) => void,
  isViewPage: boolean = false
) => {
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  const startInlineEdit = useCallback((obj: TextObject) => {
    setEditingObjectId(obj.id);
    setEditingText(obj.text);
    
    // 객체를 편집 상태로 업데이트
    updateTextObject(obj.id, { isEditing: true });
    
    // ViewPage에서는 가상 키보드 활성화
    if (isViewPage) {
      setSelectedObjectId(obj.id);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('activateVirtualKeyboard', {
          detail: { objectId: obj.id }
        }));
      }, 100);
    } else {
      // AdminPage에서는 기존 방식 (textarea 포커스)
      setTimeout(() => {
        const textarea = document.querySelector('textarea[data-editing="true"]') as HTMLTextAreaElement;
        if (textarea) {
          const textLength = obj.text.length;
          textarea.setSelectionRange(textLength, textLength);
          textarea.focus();
        }
      }, 0);
    }
  }, [isViewPage, updateTextObject, setSelectedObjectId]);

  const finishInlineEdit = useCallback(async () => {
    if (editingObjectId && editingText !== undefined) {
      await updateTextObject(editingObjectId, {
        text: editingText,
        isEditing: false
      });

      // 현재 편집 중인 객체가 엑셀 셀인지 확인
      const adminStore = useAdminConfigStore.getState();
      const editingObject = adminStore.textObjects.find(obj => obj.id === editingObjectId);
      const isExcelCell = editingObject && editingObject.groupId && editingObject.groupId.startsWith('excel-input-');

      if (isExcelCell) {
        // 엑셀 셀 편집: DB 저장만, undo/redo 제외
        await adminStore.flushDocumentState(false);
        if (import.meta.env.DEV) {
          console.log(`📝 엑셀 셀 편집 완료: ${editingObjectId} (undo/redo 제외)`);
        }
      } else {
        // 일반 객체 편집: DB 저장 + undo/redo 스냅샷 생성
        await adminStore.flushDocumentState(true, () => {
          useUndoRedoStore.getState().pushSnapshot(createCurrentSnapshot());
        });
        if (import.meta.env.DEV) {
          console.log(`📝 일반 객체 편집 완료: ${editingObjectId} (undo/redo 포함)`);
        }
      }

      setEditingObjectId(null);
      setEditingText('');
    }
  }, [editingObjectId, editingText, updateTextObject]);

  const cancelInlineEdit = useCallback(() => {
    if (editingObjectId) {
      // 편집 취소 시 원래 텍스트로 복원
      updateTextObject(editingObjectId, { isEditing: false });
    }
    setEditingObjectId(null);
    setEditingText('');
  }, [editingObjectId, updateTextObject]);

  const updateEditingText = useCallback((text: string) => {
    setEditingText(text);
  }, []);

  return {
    editingObjectId,
    editingText,
    startInlineEdit,
    finishInlineEdit,
    cancelInlineEdit,
    updateEditingText
  };
};
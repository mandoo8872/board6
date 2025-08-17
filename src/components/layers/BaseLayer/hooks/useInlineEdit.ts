import { useState, useCallback } from 'react';
import { TextObject } from '../../../../types';

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
      setEditingObjectId(null);
      setEditingText('');
    }
  }, [editingObjectId, editingText, updateTextObject]);

  const cancelInlineEdit = useCallback(() => {
    setEditingObjectId(null);
    setEditingText('');
  }, []);

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
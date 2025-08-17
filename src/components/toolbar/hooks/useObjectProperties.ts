import { useMemo, useCallback } from 'react';
import { TextObject, ImageObject } from '../../../types';

interface UseObjectPropertiesParams {
  selectedObject: TextObject | ImageObject | null;
  getCurrentColor: () => string;
  onUpdateTextObject: (id: string, updates: any) => void;
}

export const useObjectProperties = (params: UseObjectPropertiesParams) => {
  const { selectedObject, getCurrentColor, onUpdateTextObject } = params;

  const currentColor = useMemo(() => getCurrentColor(), [getCurrentColor, selectedObject]);

  const updateTextStyle = useCallback(
    (updates: any) => {
      if (selectedObject && 'text' in selectedObject) {
        const currentTextStyle = selectedObject.textStyle || {
          color: '#000000',
          bold: false,
          italic: false,
          horizontalAlign: 'left',
          verticalAlign: 'middle',
          fontFamily: 'Arial',
        };
        onUpdateTextObject(selectedObject.id, {
          textStyle: { ...currentTextStyle, ...updates },
        });
      }
    },
    [selectedObject, onUpdateTextObject]
  );

  const updateBoxStyle = useCallback(
    (updates: any) => {
      if (selectedObject && 'text' in selectedObject) {
        const currentBoxStyle = selectedObject.boxStyle || {
          backgroundColor: 'transparent',
          backgroundOpacity: 1,
          borderColor: '#000000',
          borderWidth: 0,
          borderRadius: 0,
        };
        onUpdateTextObject(selectedObject.id, {
          boxStyle: { ...currentBoxStyle, ...updates },
        });
      }
    },
    [selectedObject, onUpdateTextObject]
  );

  return {
    currentColor,
    updateTextStyle,
    updateBoxStyle,
  };
};



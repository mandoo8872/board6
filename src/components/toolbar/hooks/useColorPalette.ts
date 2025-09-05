import { useCallback } from 'react';
import { DEFAULT_COLOR_PALETTE, getCurrentColor, isTextObject } from '../utils/toolbarHelpers';

interface UseColorPaletteProps {
  selectedObject: any;
  colorMode: 'text' | 'background' | 'border';
  updateTextStyle: (updates: any) => Promise<void>;
  updateBoxStyle: (updates: any) => Promise<void>;
}

export const useColorPalette = ({
  selectedObject,
  colorMode,
  updateTextStyle,
  updateBoxStyle
}: UseColorPaletteProps) => {
  
  // 색상 적용 함수
  const handleColorSelect = useCallback((color: string) => {
    if (!selectedObject || !isTextObject(selectedObject)) return;
    
    switch (colorMode) {
      case 'text':
        updateTextStyle({ color });
        break;
      case 'background':
        updateBoxStyle({ backgroundColor: color });
        break;
      case 'border':
        updateBoxStyle({ borderColor: color });
        break;
    }
  }, [colorMode, selectedObject, updateTextStyle, updateBoxStyle]);
  
  // 현재 선택된 색상 가져오기
  const currentColor = getCurrentColor(selectedObject, colorMode);

  return {
    colors: DEFAULT_COLOR_PALETTE,
    currentColor,
    handleColorSelect,
    showTransparent: colorMode === 'background',
  };
};
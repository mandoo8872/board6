import { useMemo } from 'react';
import { useEditorStore, useAdminConfigStore } from '../../../store';
import type { Tool, TextObject } from '../../../types';

export const useFloatingToolbar = () => {
  const { currentTool, setCurrentTool } = useEditorStore();
  const { addTextObject, settings } = useAdminConfigStore();

  const safeSettings = useMemo(
    () => ({
      objectCreationPosition: settings?.admin?.objectCreationPosition ?? { x: 260, y: 950 },
      defaultCheckboxSettings: settings?.admin?.defaultCheckboxSettings ?? {
        checkedColor: '#22c55e',
        uncheckedColor: '#f3f4f6',
      },
    }),
    [settings]
  );

  const handleToolChange = (tool: Tool) => {
    setCurrentTool(tool);
  };

  const handleTTCreate = async () => {
    const { x, y } = safeSettings.objectCreationPosition;
    const { checkedColor, uncheckedColor } = safeSettings.defaultCheckboxSettings;
    const newCheckboxObject: Omit<TextObject, 'id'> = {
      x,
      y,
      width: 200,
      height: 60,
      text: '체크박스',
      hasCheckbox: true,
      checkboxChecked: false,
      checkboxCheckedColor: checkedColor,
      checkboxUncheckedColor: uncheckedColor,
      boxStyle: {
        backgroundColor: '#ffffff',
        backgroundOpacity: 1,
        borderColor: '#000000',
        borderWidth: 1,
        borderRadius: 0,
      },
      fontSize: 18,
      textStyle: {
        color: '#000000',
        fontFamily: 'Arial, sans-serif',
        bold: false,
        italic: false,
        horizontalAlign: 'left',
        verticalAlign: 'middle',
      },
      permissions: { movable: true, resizable: true, deletable: true },
      zIndex: Date.now(),
      locked: false,
      visible: true,
      opacity: 1,
      isEditing: false,
      lastModified: Date.now(),
    };

    await addTextObject(newCheckboxObject);
  };

  const getToolButtonClass = (tool: Tool) => {
    const baseClass = 'p-3 rounded-full transition-all duration-200 shadow-lg';
    const activeClass = 'bg-blue-500 text-white scale-110';
    const inactiveClass = 'bg-white text-gray-700 hover:bg-gray-100';
    return `${baseClass} ${currentTool === tool ? activeClass : inactiveClass}`;
  };

  return {
    currentTool,
    handleToolChange,
    handleTTCreate,
    getToolButtonClass,
  };
};



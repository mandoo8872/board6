import React, { useState, useCallback, useRef } from 'react';
import { useEditorStore, useAdminConfigStore, useCellSelectionStore } from '../../store';
import { Tool, TextObject, ImageObject } from '../../types';

const Toolbar: React.FC = () => {
  // 모든 hooks를 최상단에 배치
  const { 
    textObjects, 
    imageObjects,
    addTextObject, 
    addImageObject,
    updateTextObject,
    updateImageObject,
    setFloorImage,
    deleteTextObject,
    deleteImageObject,
    settings,
    updateSettings,
    isLoading
  } = useAdminConfigStore();
  const { currentTool, setCurrentTool, selectedObjectId, setSelectedObjectId } = useEditorStore();
  // const { getSelectedCells, getSelectedCount } = useCellSelectionStore();
  
  // 설정 메뉴 접기/펼치기 상태
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [isExcelPasteExpanded, setIsExcelPasteExpanded] = useState(false);
  const [excelPasteData, setExcelPasteData] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // 색상 선택 모드 상태 (text, background, border)
  const [colorMode, setColorMode] = useState<'text' | 'background' | 'border'>('text');
  
  // 색상 파레트
  const colorPalette = [
    '#000000', '#ffffff', '#cccccc', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080'
  ];

  // 디바운싱을 위한 타이머 ref
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 선택된 객체 가져오기
  const selectedObject = selectedObjectId 
    ? textObjects.find(obj => obj.id === selectedObjectId) || imageObjects.find(obj => obj.id === selectedObjectId)
    : null;

  // 설정이 로드되지 않았거나 기본값이 없을 때 기본값 제공
  const safeSettings = {
    admin: {
      autoToolSwitch: settings?.admin?.autoToolSwitch ?? true,
      gridVisible: settings?.admin?.gridVisible ?? true,
      gridSize: settings?.admin?.gridSize ?? 32,
      gridSnapEnabled: settings?.admin?.gridSnapEnabled ?? false,
      defaultFontSize: settings?.admin?.defaultFontSize ?? 16,
      defaultBoxWidth: settings?.admin?.defaultBoxWidth ?? 200,
      defaultBoxHeight: settings?.admin?.defaultBoxHeight ?? 60,
      objectCreationPosition: settings?.admin?.objectCreationPosition ?? { x: 260, y: 950 },
      defaultCheckboxSettings: settings?.admin?.defaultCheckboxSettings ?? {
        checkedColor: '#22c55e',
        uncheckedColor: '#f3f4f6',
        checkedBackgroundColor: '#ffffff',
        uncheckedBackgroundColor: '#ffffff',
        checkedBackgroundOpacity: 1,
        uncheckedBackgroundOpacity: 1
      },
      excelPasteSettings: settings?.admin?.excelPasteSettings ?? {
        startPosition: { x: 100, y: 100 },
        cellWidth: 120,
        cellHeight: 40,
        fontSize: 14,
        fontColor: '#000000',
        backgroundColor: 'transparent',
        maxRows: 50,
        maxCols: 50
      }
    },
    view: {
      virtualKeyboardEnabled: settings?.view?.virtualKeyboardEnabled ?? true,
      touchMode: settings?.view?.touchMode ?? true
    }
  };

  // 타입 가드 함수들
  const isTextObject = (obj: any): obj is TextObject => {
    return obj && typeof obj.hasCheckbox !== 'undefined';
  };

  const isImageObject = (obj: any): obj is ImageObject => {
    return obj && typeof obj.src !== 'undefined';
  };

  // 속성 업데이트 함수들 (debounced 함수들보다 먼저 정의)
  const updateTextStyle = useCallback(async (updates: any) => {
    if (selectedObject && 'text' in selectedObject) {
      const currentTextStyle = selectedObject.textStyle || {
        color: '#000000',
        bold: false,
        italic: false,
        horizontalAlign: 'left',
        verticalAlign: 'middle',
        fontFamily: 'Arial'
      };
      await updateTextObject(selectedObject.id, {
        textStyle: { ...currentTextStyle, ...updates }
      });
    }
  }, [selectedObject, updateTextObject]);

  const updateBoxStyle = useCallback(async (updates: any) => {
    if (selectedObject && 'text' in selectedObject) {
      const currentBoxStyle = selectedObject.boxStyle || {
        backgroundColor: 'transparent',
        backgroundOpacity: 1,
        borderColor: '#000000',
        borderWidth: 0,
        borderRadius: 0
      };
      await updateTextObject(selectedObject.id, {
        boxStyle: { ...currentBoxStyle, ...updates }
      });
    }
  }, [selectedObject, updateTextObject]);

  // 텍스트 스타일 디바운싱 업데이트
  const debouncedUpdateTextStyle = useCallback((updates: any) => {
    if (!selectedObject) return;
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
    }
    updateTimerRef.current = setTimeout(() => {
      updateTextStyle(updates);
    }, 300);
  }, [selectedObject, updateTextStyle]);

  // 박스 스타일 디바운싱 업데이트
  const debouncedUpdateBoxStyle = useCallback((updates: any) => {
    if (!selectedObject) return;
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
    }
    updateTimerRef.current = setTimeout(() => {
      updateBoxStyle(updates);
    }, 300);
  }, [selectedObject, updateBoxStyle]);

  // 이미지 객체 디바운싱 업데이트
  const debouncedUpdateImageObject = useCallback((id: string, updates: any) => {
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
    }
    updateTimerRef.current = setTimeout(() => {
      updateImageObject(id, updates);
    }, 300);
  }, [updateImageObject]);

  // 디바운싱된 업데이트 함수
  const debouncedUpdateTextObject = useCallback((id: string, updates: any) => {
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
    }
    updateTimerRef.current = setTimeout(() => {
      updateTextObject(id, updates);
    }, 300); // 300ms 지연
  }, [updateTextObject]);

  // 색상 적용 함수
  const handleColorSelect = useCallback((color: string) => {
    if (!selectedObject || !isTextObject(selectedObject)) return;
    
    switch (colorMode) {
      case 'text':
        debouncedUpdateTextStyle({ color });
        break;
      case 'background':
        debouncedUpdateBoxStyle({ backgroundColor: color });
        break;
      case 'border':
        debouncedUpdateBoxStyle({ borderColor: color });
        break;
    }
  }, [colorMode, selectedObject, debouncedUpdateTextStyle, debouncedUpdateBoxStyle]);
  
  // 현재 선택된 색상 가져오기
  const getCurrentColor = useCallback(() => {
    if (!selectedObject || !isTextObject(selectedObject)) return '#000000';
    
    switch (colorMode) {
      case 'text':
        return selectedObject.textStyle?.color || '#000000';
      case 'background':
        return selectedObject.boxStyle?.backgroundColor || 'transparent';
      case 'border':
        return selectedObject.boxStyle?.borderColor || '#000000';
      default:
        return '#000000';
    }
  }, [colorMode, selectedObject]);

  // 컴포넌트 언마운트 시 타이머 정리
  React.useEffect(() => {
    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
    };
  }, []);

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
        fontFamily: 'Arial'
      },
      boxStyle: {
        backgroundColor: 'transparent',
        backgroundOpacity: 1,
        borderColor: '#000000',
        borderWidth: 0,
        borderRadius: 0
      },
      permissions: {
        editable: true,
        movable: true,
        resizable: true,
        deletable: true,
      },
      zIndex: Date.now(),
      locked: false,
      visible: true,
      opacity: 1,
      hasCheckbox: false,
      checkboxChecked: false,
      checkboxCheckedColor: '#22c55e',
      checkboxUncheckedColor: '#f3f4f6',
      isEditing: false,
      lastModified: Date.now()
    };

    try {
      await addTextObject(newTextObject);
    } catch (error) {
      console.error('텍스트 객체 생성 실패:', error);
    }
  }, [addTextObject, safeSettings.admin.objectCreationPosition, safeSettings.admin.defaultFontSize, safeSettings.admin.defaultBoxWidth, safeSettings.admin.defaultBoxHeight]);

  const handleCreateCheckbox = useCallback(async () => {
    const { x, y } = safeSettings.admin.objectCreationPosition;
    const { 
      checkedColor, 
      uncheckedColor,
      checkedBackgroundColor,
      uncheckedBackgroundColor,
      checkedBackgroundOpacity,
      uncheckedBackgroundOpacity
    } = safeSettings.admin.defaultCheckboxSettings;
    
    const newCheckboxObject: Omit<TextObject, 'id'> = {
      x,
      y,
      width: safeSettings.admin.defaultBoxWidth,
      height: safeSettings.admin.defaultBoxHeight,
      text: '새 체크박스',
      fontSize: safeSettings.admin.defaultFontSize,
      textStyle: {
        color: '#000000',
        bold: true, // 체크박스는 기본적으로 굵게
        italic: false,
        horizontalAlign: 'left',
        verticalAlign: 'middle',
        fontFamily: 'Arial'
      },
      boxStyle: {
        backgroundColor: 'transparent',
        backgroundOpacity: 1,
        borderColor: '#000000',
        borderWidth: 1, // 1px 테두리 추가
        borderRadius: 8 // 라운딩 처리 추가
      },
      permissions: {
        editable: true,
        movable: true,
        resizable: true,
        deletable: true,
      },
      zIndex: Date.now(),
      locked: false,
      visible: true,
      opacity: 1,
      hasCheckbox: true,
      checkboxChecked: false,
      checkboxCheckedColor: checkedColor,
      checkboxUncheckedColor: uncheckedColor,
      checkedBackgroundColor: checkedBackgroundColor,
      uncheckedBackgroundColor: uncheckedBackgroundColor,
      checkedBackgroundOpacity: checkedBackgroundOpacity,
      uncheckedBackgroundOpacity: uncheckedBackgroundOpacity,
      isEditing: false,
      lastModified: Date.now()
    };

    try {
      await addTextObject(newCheckboxObject);
    } catch (error) {
      console.error('체크박스 객체 생성 실패:', error);
    }
  }, [addTextObject, safeSettings.admin.objectCreationPosition, safeSettings.admin.defaultCheckboxSettings, safeSettings.admin.defaultFontSize, safeSettings.admin.defaultBoxWidth, safeSettings.admin.defaultBoxHeight]);

  const handleCreateImage = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const src = event.target?.result as string;
          const { x, y } = safeSettings.admin.objectCreationPosition;
          
          // 이미지 실제 크기 측정을 위한 임시 이미지 객체 생성
          const img = new Image();
          img.onload = async () => {
            // 가로 200px 고정, 세로는 비율에 맞춰 계산
            const targetWidth = 200;
            const aspectRatio = img.naturalHeight / img.naturalWidth;
            const targetHeight = targetWidth * aspectRatio;
          
          const newImageObject: Omit<ImageObject, 'id'> = {
            x,
            y,
              width: targetWidth,
              height: targetHeight,
            src,
            permissions: {
              editable: true,
              movable: true,
              resizable: true,
              deletable: true,
            },
            zIndex: Date.now(),
            locked: false,
            visible: true,
            opacity: 1,
              maintainAspectRatio: true, // 비율 유지 활성화
            lastModified: Date.now()
          };

          await addImageObject(newImageObject);
          };
          
          img.onerror = () => {
            console.error('이미지 로드 실패');
            alert('이미지를 로드할 수 없습니다.');
          };
          
          img.src = src;
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('이미지 객체 생성 실패:', error);
      }
    };

    input.click();
  }, [addImageObject, safeSettings.admin.objectCreationPosition, safeSettings.admin.defaultBoxWidth, safeSettings.admin.defaultBoxHeight]);

  // 엑셀 데이터 파싱 함수
  const parseExcelData = useCallback((data: string): string[][] => {
    if (!data.trim()) return [];
    
    const rows = data.split('\n').filter(row => row.trim() !== '');
    return rows.map(row => row.split('\t'));
  }, []);

  // 엑셀 셀 그룹 삭제 함수
  const handleDeleteExcelCellGroups = useCallback(async () => {
    // 엑셀로 생성된 셀들 찾기 (groupId가 'excel-input-'로 시작하는 것들)
    const excelCells = textObjects.filter(obj => 
      obj.groupId && obj.groupId.startsWith('excel-input-')
    );

    if (excelCells.length === 0) {
      alert('삭제할 엑셀 셀이 없습니다.');
      return;
    }

    const groupCount = new Set(excelCells.map(cell => cell.groupId)).size;
    
    const confirmMessage = `${groupCount}개의 엑셀 그룹 (총 ${excelCells.length}개 셀)을 삭제하시겠습니까?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      // 모든 엑셀 셀 삭제
      for (const cell of excelCells) {
        await deleteTextObject(cell.id);
      }
      
      alert(`${groupCount}개 그룹 (${excelCells.length}개 셀)이 삭제되었습니다.`);
    } catch (error) {
      console.error('엑셀 셀 삭제 실패:', error);
      alert('셀 삭제 중 오류가 발생했습니다.');
    }
  }, [textObjects, deleteTextObject]);

  // 엑셀 셀 생성 함수
  const handleCreateExcelCells = useCallback(async () => {
    const parsedData = parseExcelData(excelPasteData);
    if (parsedData.length === 0) {
      alert('붙여넣을 데이터가 없습니다.');
      return;
    }

    const { 
      startPosition, 
      cellWidth, 
      cellHeight, 
      fontSize, 
      fontColor, 
      backgroundColor,
      maxRows = 100,  // 기본값 설정
      maxCols = 50    // 기본값 설정
    } = safeSettings.admin.excelPasteSettings;
    
    const groupId = `excel-input-${Date.now()}`;
    const cells: Omit<TextObject, 'id'>[] = [];

    // 최대 행/열 제한
        const actualRows = Math.min(parsedData.length, maxRows);
        
        // 각 행의 길이를 안전하게 계산
        const rowLengths = parsedData.map(row => row.length);
        const maxRowLength = rowLengths.length > 0 ? Math.max(...rowLengths) : 0;
        const actualCols = Math.min(maxRowLength, maxCols);

    for (let row = 0; row < actualRows; row++) {
      for (let col = 0; col < actualCols; col++) {
        const cellText = parsedData[row]?.[col] || '';
        
        const cellObject: Omit<TextObject, 'id'> = {
          x: startPosition.x + col * cellWidth,
          y: startPosition.y + row * cellHeight,
          width: cellWidth,
          height: cellHeight,
          text: cellText,
          fontSize: fontSize,
          textStyle: {
            color: fontColor,
            bold: false,
            italic: false,
            horizontalAlign: 'center',
            verticalAlign: 'middle',
            fontFamily: 'Arial'
          },
          boxStyle: {
            backgroundColor: backgroundColor,
            backgroundOpacity: 1,
            borderColor: '#d1d5db',
            borderWidth: 1,
            borderRadius: 0
          },
          permissions: {
            editable: true,
            movable: false,
            resizable: false,
            deletable: false,
          },
          zIndex: Date.now() + row * actualCols + col,
          locked: true,
          visible: true,
          opacity: 1,
          hasCheckbox: false,
          checkboxChecked: false,
          checkboxCheckedColor: '#22c55e',
          checkboxUncheckedColor: '#f3f4f6',
          isEditing: false,
          lastModified: Date.now(),
          // 셀 메타데이터
          groupId: groupId,
          cellType: 'cell',
          cellPosition: { row, col }
        };

        cells.push(cellObject);
      }
    }

    try {
      // 모든 셀을 생성
      for (const cell of cells) {
        await addTextObject(cell);
      }
      
      // 성공 메시지
      alert(`${actualRows}x${actualCols} 셀이 생성되었습니다.`);
      setExcelPasteData(''); // 입력창 초기화
    setShowPreview(false); // 미리보기 숨기기
    
    // 미리보기 숨기기 이벤트 발생
    const event = new CustomEvent('excel-preview-update', {
      detail: {
        data: '',
        show: false
      }
    });
    window.dispatchEvent(event);
    } catch (error) {
      console.error('엑셀 셀 생성 실패:', error);
      alert('셀 생성 중 오류가 발생했습니다.');
    }
  }, [excelPasteData, parseExcelData, addTextObject, safeSettings.admin.excelPasteSettings]);

  // 미리보기 업데이트를 위한 useEffect
  React.useEffect(() => {
    if (showPreview && excelPasteData.trim()) {
      const event = new CustomEvent('excel-preview-update', {
        detail: {
          data: excelPasteData,
          show: true
        }
      });
      window.dispatchEvent(event);
    } else {
      const event = new CustomEvent('excel-preview-update', {
        detail: {
          data: '',
          show: false
        }
      });
      window.dispatchEvent(event);
    }
  }, [showPreview, excelPasteData, safeSettings.admin.excelPasteSettings.startPosition, safeSettings.admin.excelPasteSettings.cellWidth, safeSettings.admin.excelPasteSettings.cellHeight]);



  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        await setFloorImage({ path: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  // 선택된 객체 복제
  const handleDuplicateObject = async () => {
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
  };

  // 선택된 객체 삭제
  const handleDeleteObject = async () => {
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
  };

  // 레이어 순서 조정 함수들
  const handleBringToFront = async () => {
    if (!selectedObjectId) return;
    
    // 모든 객체의 최대 zIndex 찾기
    const allObjects = [...textObjects, ...imageObjects];
    const maxZIndex = Math.max(...allObjects.map(obj => obj.zIndex || 0));
    
    // 텍스트 객체인 경우
    const textObj = textObjects.find(obj => obj.id === selectedObjectId);
    if (textObj) {
      await updateTextObject(selectedObjectId, { zIndex: maxZIndex + 1 });
      return;
    }
    
    // 이미지 객체인 경우
    const imageObj = imageObjects.find(obj => obj.id === selectedObjectId);
    if (imageObj) {
      await updateImageObject(selectedObjectId, { zIndex: maxZIndex + 1 });
      return;
    }
  };

  const handleBringForward = async () => {
    if (!selectedObjectId) return;
    
    const allObjects = [...textObjects, ...imageObjects];
    const currentObj = allObjects.find(obj => obj.id === selectedObjectId);
    if (!currentObj) return;
    
    // 현재 객체보다 zIndex가 큰 객체들 중 가장 작은 값 찾기
    const higherObjects = allObjects.filter(obj => (obj.zIndex || 0) > (currentObj.zIndex || 0));
    if (higherObjects.length === 0) return; // 이미 최상위
    
    const nextZIndex = Math.min(...higherObjects.map(obj => obj.zIndex || 0));
    
    // 텍스트 객체인 경우
    const textObj = textObjects.find(obj => obj.id === selectedObjectId);
    if (textObj) {
      await updateTextObject(selectedObjectId, { zIndex: nextZIndex + 1 });
      return;
    }
    
    // 이미지 객체인 경우
    const imageObj = imageObjects.find(obj => obj.id === selectedObjectId);
    if (imageObj) {
      await updateImageObject(selectedObjectId, { zIndex: nextZIndex + 1 });
      return;
    }
  };

  const handleSendBackward = async () => {
    if (!selectedObjectId) return;
    
    const allObjects = [...textObjects, ...imageObjects];
    const currentObj = allObjects.find(obj => obj.id === selectedObjectId);
    if (!currentObj) return;
    
    // 현재 객체보다 zIndex가 작은 객체들 중 가장 큰 값 찾기
    const lowerObjects = allObjects.filter(obj => (obj.zIndex || 0) < (currentObj.zIndex || 0));
    if (lowerObjects.length === 0) return; // 이미 최하위
    
    const prevZIndex = Math.max(...lowerObjects.map(obj => obj.zIndex || 0));
    
    // 텍스트 객체인 경우
    const textObj = textObjects.find(obj => obj.id === selectedObjectId);
    if (textObj) {
      await updateTextObject(selectedObjectId, { zIndex: prevZIndex - 1 });
      return;
    }
    
    // 이미지 객체인 경우
    const imageObj = imageObjects.find(obj => obj.id === selectedObjectId);
    if (imageObj) {
      await updateImageObject(selectedObjectId, { zIndex: prevZIndex - 1 });
      return;
    }
  };

  const handleSendToBack = async () => {
    if (!selectedObjectId) return;
    
    // 모든 객체의 최소 zIndex 찾기
    const allObjects = [...textObjects, ...imageObjects];
    const minZIndex = Math.min(...allObjects.map(obj => obj.zIndex || 0));
    
    // 최소 zIndex를 1로 제한 (배경 이미지는 zIndex 0이므로 그 아래로 가지 않도록)
    const newZIndex = Math.max(1, minZIndex - 1);
    
    // 텍스트 객체인 경우
    const textObj = textObjects.find(obj => obj.id === selectedObjectId);
    if (textObj) {
      await updateTextObject(selectedObjectId, { zIndex: newZIndex });
      return;
    }
    
    // 이미지 객체인 경우
    const imageObj = imageObjects.find(obj => obj.id === selectedObjectId);
    if (imageObj) {
      await updateImageObject(selectedObjectId, { zIndex: newZIndex });
      return;
    }
  };

  const tools: { id: Tool; label: string; icon: string }[] = [
    { id: 'select', label: '선택', icon: '👆' },
    { id: 'text', label: '텍스트', icon: '📝' },
    { id: 'checkbox', label: '체크', icon: '☑️' },
    { id: 'image', label: '이미지', icon: '🖼️' },
    { id: 'pen', label: '필기', icon: '✏️' },
    { id: 'eraser', label: '지우개', icon: '🧽' },
  ];

  // 로딩 중이거나 설정이 없으면 로딩 표시 (모든 hooks 이후에 배치)
  if (isLoading || !settings) {
    return (
      <div className="w-64 h-full bg-white border-r border-gray-200 p-4 flex items-center justify-center">
        <div className="text-gray-500">설정 로드 중...</div>
      </div>
    );
  }

  return (
    <div 
      className="h-full flex flex-col overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100"
      onClick={(e) => {
        // 툴바 클릭 시 캔버스 포커스 해제 (이미지 붙여넣기 방지)
        e.stopPropagation();
        
        // 입력 필드 클릭 시에는 포커스 해제하지 않음
        const target = e.target as HTMLElement;
        const isInputElement = target.tagName === 'INPUT' || 
                              target.tagName === 'TEXTAREA' || 
                              target.isContentEditable ||
                              target.closest('input, textarea, [contenteditable]');
        
        if (!isInputElement) {
          const activeElement = document.activeElement as HTMLElement;
          // 캔버스 컨테이너만 정확히 타겟팅 (data-canvas-container 또는 tabIndex가 0인 요소)
          if (activeElement && 
              (activeElement.hasAttribute('data-canvas-container') || 
               (activeElement.tabIndex === 0 && activeElement.tagName === 'DIV'))) {
            activeElement.blur();
          }
        }
      }}
    >
      {/* 헤더 */}
      <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-pink-200 to-purple-200">
        <h1 className="text-lg font-bold text-gray-700 flex items-center gap-2">
          <span>🛠️</span>
        관리자 도구
        </h1>
      </div>

      {/* 스크롤 가능한 콘텐츠 영역 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4 space-y-4">
          
          {/* 1. 메인 도구 */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <span>⚡</span> 메인 도구
            </h3>
        <div className="grid grid-cols-3 gap-2">
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => {
                if (tool.id === 'select') {
                  setCurrentTool('select');
                } else if (tool.id === 'text') {
                  handleCreateText();
                } else if (tool.id === 'checkbox') {
                  handleCreateCheckbox();
                } else if (tool.id === 'image') {
                  handleCreateImage();
                } else if (tool.id === 'pen' || tool.id === 'eraser') {
                  setCurrentTool(tool.id);
                }
              }}
                  className={`p-3 rounded-lg flex flex-col items-center gap-1 transition-all duration-200 border-2
                ${currentTool === tool.id 
                      ? 'bg-blue-500 text-white border-blue-600 shadow-lg scale-105' 
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
            >
                  <span className="text-2xl">{tool.icon}</span>
                  <span className="text-xs font-medium">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

          {/* 2. 엑셀 데이터 입력 */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <button
          onClick={() => setIsExcelPasteExpanded(!isExcelPasteExpanded)}
              className="w-full p-4 flex items-center justify-between text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-t-xl transition-colors"
            >
              <span className="flex items-center gap-2">
                <span>📊</span> 엑셀 데이터 입력
              </span>
              <span className={`text-slate-400 transition-transform duration-200 ${isExcelPasteExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        
        {isExcelPasteExpanded && (
              <div className="p-4 border-t border-slate-200 space-y-4">
                {/* 데이터 입력 */}
            <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">데이터 붙여넣기</label>
              <textarea
                value={excelPasteData}
                onChange={(e) => {
                  setExcelPasteData(e.target.value);
                  setShowPreview(!!e.target.value.trim());
                  const event = new CustomEvent('excel-preview-update', {
                    detail: {
                      data: e.target.value,
                      show: !!e.target.value.trim()
                    }
                  });
                  window.dispatchEvent(event);
                }}
                onFocus={(e) => {
                  // textarea 포커스 시 포커스 유지 보장
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  // textarea 클릭 시 이벤트 전파 중단 (상위 포커스 해제 방지)
                  e.stopPropagation();
                }}
                    placeholder="엑셀에서 복사한 데이터를 붙여넣으세요..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                  <div className="text-xs text-slate-500 mt-1">
                {excelPasteData ? `${parseExcelData(excelPasteData).length}행 × ${Math.max(...parseExcelData(excelPasteData).map(row => row.length))}열` : '데이터 없음'}
              </div>
            </div>

                {/* 시작 위치 */}
                <div className="grid grid-cols-2 gap-3">
              <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">X 좌표</label>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateSettings('admin', {
                          excelPasteSettings: {
                            ...safeSettings.admin.excelPasteSettings,
                            startPosition: {
                              ...safeSettings.admin.excelPasteSettings.startPosition,
                              x: Math.max(0, safeSettings.admin.excelPasteSettings.startPosition.x - 10)
                            }
                          }
                        })}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-mono"
                      >
                        ◀
                      </button>
                <input
                  type="number"
                  value={safeSettings.admin.excelPasteSettings.startPosition.x}
                  onChange={(e) => updateSettings('admin', {
                    excelPasteSettings: {
                      ...safeSettings.admin.excelPasteSettings,
                      startPosition: {
                        ...safeSettings.admin.excelPasteSettings.startPosition,
                        x: parseInt(e.target.value) || 0
                      }
                    }
                  })}
                  onFocus={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                        className="w-16 px-1 py-1 border border-slate-300 rounded text-xs text-center"
                      />
                      <button
                        onClick={() => updateSettings('admin', {
                          excelPasteSettings: {
                            ...safeSettings.admin.excelPasteSettings,
                            startPosition: {
                              ...safeSettings.admin.excelPasteSettings.startPosition,
                              x: safeSettings.admin.excelPasteSettings.startPosition.x + 10
                            }
                          }
                        })}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-mono"
                      >
                        ▶
                      </button>
                    </div>
              </div>
              <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Y 좌표</label>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateSettings('admin', {
                          excelPasteSettings: {
                            ...safeSettings.admin.excelPasteSettings,
                            startPosition: {
                              ...safeSettings.admin.excelPasteSettings.startPosition,
                              y: Math.max(0, safeSettings.admin.excelPasteSettings.startPosition.y - 10)
                            }
                          }
                        })}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-mono"
                      >
                        ▲
                      </button>
                <input
                  type="number"
                  value={safeSettings.admin.excelPasteSettings.startPosition.y}
                  onChange={(e) => updateSettings('admin', {
                    excelPasteSettings: {
                      ...safeSettings.admin.excelPasteSettings,
                      startPosition: {
                        ...safeSettings.admin.excelPasteSettings.startPosition,
                        y: parseInt(e.target.value) || 0
                      }
                    }
                  })}
                  onFocus={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                        className="w-16 px-1 py-1 border border-slate-300 rounded text-xs text-center"
                      />
                      <button
                        onClick={() => updateSettings('admin', {
                          excelPasteSettings: {
                            ...safeSettings.admin.excelPasteSettings,
                            startPosition: {
                              ...safeSettings.admin.excelPasteSettings.startPosition,
                              y: safeSettings.admin.excelPasteSettings.startPosition.y + 10
                            }
                          }
                        })}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-mono"
                      >
                        ▼
                      </button>
                    </div>
              </div>
            </div>

                {/* 셀 크기 조정 */}
                <div className="grid grid-cols-2 gap-3">
              <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">셀 너비</label>
                    <div className="flex items-center gap-1">
                                             <button
                         onClick={() => updateSettings('admin', {
                    excelPasteSettings: {
                      ...safeSettings.admin.excelPasteSettings,
                             cellWidth: Math.max(20, safeSettings.admin.excelPasteSettings.cellWidth - 1)
                           }
                         })}
                         className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
                       >
                         ◀
                       </button>
                       <span className="flex-1 text-center text-sm font-mono bg-slate-50 py-1 rounded">
                         {safeSettings.admin.excelPasteSettings.cellWidth}px
                       </span>
                       <button
                         onClick={() => updateSettings('admin', {
                           excelPasteSettings: {
                             ...safeSettings.admin.excelPasteSettings,
                             cellWidth: Math.min(300, safeSettings.admin.excelPasteSettings.cellWidth + 1)
                           }
                         })}
                         className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
                       >
                         ▶
                       </button>
                    </div>
              </div>
              <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">셀 높이</label>
                    <div className="flex items-center gap-1">
                                             <button
                         onClick={() => updateSettings('admin', {
                    excelPasteSettings: {
                      ...safeSettings.admin.excelPasteSettings,
                             cellHeight: Math.max(20, safeSettings.admin.excelPasteSettings.cellHeight - 1)
                           }
                         })}
                         className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
                       >
                         ▲
                       </button>
                       <span className="flex-1 text-center text-sm font-mono bg-slate-50 py-1 rounded">
                         {safeSettings.admin.excelPasteSettings.cellHeight}px
                       </span>
                       <button
                         onClick={() => updateSettings('admin', {
                           excelPasteSettings: {
                             ...safeSettings.admin.excelPasteSettings,
                             cellHeight: Math.min(100, safeSettings.admin.excelPasteSettings.cellHeight + 1)
                           }
                         })}
                         className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
                       >
                         ▼
                       </button>
                    </div>
              </div>
            </div>

            {/* 폰트 설정 */}
                 <div className="grid grid-cols-2 gap-3">
              <div>
                     <label className="text-xs font-medium text-slate-600 mb-1 block">폰트 크기</label>
                     <div className="flex items-center gap-1">
                       <button
                         onClick={() => updateSettings('admin', {
                    excelPasteSettings: {
                      ...safeSettings.admin.excelPasteSettings,
                             fontSize: Math.max(8, safeSettings.admin.excelPasteSettings.fontSize - 1)
                           }
                         })}
                         className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
                       >
                         ▼
                       </button>
                       <span className="flex-1 text-center text-sm font-mono bg-slate-50 py-1 rounded">
                         {safeSettings.admin.excelPasteSettings.fontSize}px
                       </span>
                       <button
                         onClick={() => updateSettings('admin', {
                           excelPasteSettings: {
                             ...safeSettings.admin.excelPasteSettings,
                             fontSize: Math.min(24, safeSettings.admin.excelPasteSettings.fontSize + 1)
                           }
                         })}
                         className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
                       >
                         ▲
                       </button>
                     </div>
              </div>
              <div>
                     <label className="text-xs font-medium text-slate-600 mb-1 block">폰트 색상</label>
                <input
                  type="color"
                  value={safeSettings.admin.excelPasteSettings.fontColor}
                  onChange={(e) => updateSettings('admin', {
                    excelPasteSettings: {
                      ...safeSettings.admin.excelPasteSettings,
                      fontColor: e.target.value
                    }
                  })}
                  onFocus={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                       className="w-full h-8 rounded border border-slate-300"
                />
              </div>
            </div>

            {/* 배경 색상 */}
            <div>
                   <label className="text-xs font-medium text-slate-600 mb-1 block">배경 색상</label>
                   <div className="grid grid-cols-5 gap-1">
                {[
                  { color: 'transparent', label: '투명', className: 'bg-white border-2 border-dashed border-gray-300' },
                  { color: '#ffffff', label: '흰색', className: 'bg-white border border-gray-300' },
                  { color: '#f3f4f6', label: '회색', className: 'bg-gray-100' },
                  { color: '#fee2e2', label: '빨강', className: 'bg-red-100' },
                  { color: '#fef3c7', label: '노랑', className: 'bg-yellow-100' },
                  { color: '#d1fae5', label: '초록', className: 'bg-green-100' },
                  { color: '#dbeafe', label: '파랑', className: 'bg-blue-100' },
                  { color: '#e0e7ff', label: '인디고', className: 'bg-indigo-100' },
                  { color: '#f3e8ff', label: '보라', className: 'bg-purple-100' },
                  { color: '#fce7f3', label: '핑크', className: 'bg-pink-100' }
                     ].map(({ color, label, className }) => (
                  <button
                    key={color}
                    onClick={() => updateSettings('admin', {
                      excelPasteSettings: {
                        ...safeSettings.admin.excelPasteSettings,
                        backgroundColor: color
                      }
                    })}
                         className={`w-8 h-8 ${className} ${
                      safeSettings.admin.excelPasteSettings.backgroundColor === color 
                        ? 'ring-2 ring-blue-500' 
                        : 'hover:ring-1 hover:ring-gray-400'
                         } transition-all rounded`}
                    title={label}
                  >
                    {color === 'transparent' && (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">×</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

                 {/* 실행 버튼 */}
                 <div className="space-y-2">
                 <div className="flex gap-2">
            <button
              onClick={handleCreateExcelCells}
              disabled={!excelPasteData.trim()}
                     className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
                   >
                     📋 셀 생성
            </button>
                        <button
                     onClick={() => {
                       setShowPreview(!showPreview);
                       const event = new CustomEvent('excel-preview-update', {
                         detail: {
                           data: excelPasteData,
                           show: !showPreview
                         }
                       });
                       window.dispatchEvent(event);
                     }}
                     disabled={!excelPasteData.trim()}
                     className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
                   >
                     👁️ {showPreview ? '숨김' : '미리보기'}
                     </button>
                   </div>
                   
                   {/* 엑셀 셀 그룹 삭제 버튼 */}
                   <button
                     onClick={handleDeleteExcelCellGroups}
                     className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                     title="생성된 모든 엑셀 셀 그룹을 삭제합니다"
                   >
                     🗑️ 엑셀 셀 그룹 삭제
                        </button>
                      </div>
          </div>
        )}
      </div>

          {/* 3. 선택된 객체 편집 */}
          {selectedObject && (() => {
            // 엑셀 셀이 선택되었는지 확인
            const isExcelCellSelected = 'cellType' in selectedObject && selectedObject.cellType === 'cell';
            const { getSelectedCount } = useCellSelectionStore.getState();
            const selectedCellCount = getSelectedCount();
            
            // 엑셀 셀이 다중선택되었거나 단일 엑셀 셀이 선택되었으면 기존 편집 메뉴 숨김
            if (isExcelCellSelected || selectedCellCount > 0) {
              return null;
            }
            
            return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <span>✏️</span> 선택된 객체 편집
        </h3>
        
              {isTextObject(selectedObject) && (
                <div className="space-y-4">
                  {/* 텍스트 입력 */}
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">텍스트</label>
                    <textarea
                      value={selectedObject.text}
                      onChange={(e) => debouncedUpdateTextObject(selectedObject.id, { text: e.target.value })}
                      onFocus={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
              </div>
              
                  {/* 폰트 크기 */}
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">폰트 크기</label>
                    <div className="flex items-center gap-2">
                <button
                        onClick={() => debouncedUpdateTextObject(selectedObject.id, { 
                          fontSize: Math.max(8, selectedObject.fontSize - 2) 
                        })}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
                      >
                        ▼
                </button>
                      <span className="flex-1 text-center text-sm font-mono bg-slate-50 py-1 rounded border">
                        {selectedObject.fontSize}px
                      </span>
                <button
                        onClick={() => debouncedUpdateTextObject(selectedObject.id, { 
                          fontSize: Math.min(72, selectedObject.fontSize + 2) 
                        })}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
                      >
                        ▲
                </button>
              </div>
              </div>
              
                  {/* 색상 선택 */}
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-2 block">색상</label>
                    
                    {/* 색상 모드 선택 버튼 */}
                    <div className="grid grid-cols-3 gap-1 mb-3">
                <button
                        onClick={() => setColorMode('text')}
                        className={`px-2 py-2 rounded text-xs transition-colors ${
                          colorMode === 'text'
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        텍스트
                </button>
                <button
                        onClick={() => setColorMode('background')}
                        className={`px-2 py-2 rounded text-xs transition-colors ${
                          colorMode === 'background'
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        배경
                </button>
                <button
                        onClick={() => setColorMode('border')}
                        className={`px-2 py-2 rounded text-xs transition-colors ${
                          colorMode === 'border'
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        테두리
                </button>
            </div>

                    {/* 색상 파레트 */}
                    <div className="grid grid-cols-5 gap-2">
                      {/* 배경 모드일 때만 투명 옵션 표시 */}
                      {colorMode === 'background' && (
                        <button
                          onClick={() => handleColorSelect('transparent')}
                          className={`w-8 h-8 rounded border-2 transition-all ${
                            getCurrentColor() === 'transparent'
                              ? 'border-blue-500 border-2 shadow-md' 
                              : 'border-slate-300 hover:border-slate-400'
                          }`}
                          style={{ 
                            backgroundColor: 'white',
                            backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                            backgroundSize: '8px 8px',
                            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
                          }}
                          title="투명"
                        />
                      )}
                      {colorPalette.map((color, index) => {
                        const isSelected = getCurrentColor() === color;
                        return (
                          <button
                            key={index}
                            onClick={() => handleColorSelect(color)}
                            className={`w-8 h-8 rounded border-2 transition-all ${
                              isSelected 
                                ? 'border-blue-500 border-2 shadow-md' 
                                : 'border-slate-300 hover:border-slate-400'
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* 텍스트 스타일 */}
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-2 block">텍스트 스타일</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => debouncedUpdateTextStyle({ 
                          bold: !selectedObject.textStyle?.bold 
                        })}
                        className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                          selectedObject.textStyle?.bold 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        굵게
                      </button>
                      <button 
                        onClick={() => debouncedUpdateTextStyle({ 
                          italic: !selectedObject.textStyle?.italic 
                        })}
                        className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                          selectedObject.textStyle?.italic 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        기울임
                      </button>
                    </div>
                  </div>
                  
                  {/* 정렬 */}
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-2 block">텍스트 정렬</label>
                    <div className="space-y-2">
                      {/* 가로 정렬 */}
                      <div>
                        <div className="text-xs text-slate-500 mb-1">가로</div>
                        <div className="grid grid-cols-3 gap-1">
                    {['left', 'center', 'right'].map(align => (
                      <button 
                        key={align}
                              onClick={() => debouncedUpdateTextStyle({ horizontalAlign: align })}
                              className={`px-2 py-1 rounded text-xs transition-colors ${
                                selectedObject.textStyle?.horizontalAlign === align
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              {align === 'left' ? '◀' : align === 'center' ? '●' : '▶'}
                      </button>
                    ))}
                  </div>
                      </div>
                      {/* 세로 정렬 */}
                      <div>
                        <div className="text-xs text-slate-500 mb-1">세로</div>
                  <div className="grid grid-cols-3 gap-1">
                    {['top', 'middle', 'bottom'].map(align => (
                      <button 
                        key={align}
                              onClick={() => debouncedUpdateTextStyle({ verticalAlign: align })}
                              className={`px-2 py-1 rounded text-xs transition-colors ${
                                selectedObject.textStyle?.verticalAlign === align
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              {align === 'top' ? '▲' : align === 'middle' ? '●' : '▼'}
                      </button>
                    ))}
                  </div>
                </div>
                    </div>
                  </div>


                  
                  {/* 테두리 두께 */}
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">테두리 두께</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => debouncedUpdateBoxStyle({ 
                          borderWidth: Math.max(0, (selectedObject.boxStyle?.borderWidth || 0) - 1) 
                        })}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
                      >
                        ▼
                      </button>
                      <span className="flex-1 text-center text-sm font-mono bg-slate-50 py-1 rounded">
                        {selectedObject.boxStyle?.borderWidth || 0}px
                      </span>
                      <button
                        onClick={() => debouncedUpdateBoxStyle({ 
                          borderWidth: Math.min(10, (selectedObject.boxStyle?.borderWidth || 0) + 1) 
                        })}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
                      >
                        ▲
                      </button>
                      </div>
                    </div>
              </div>
            )}

              {/* 이미지 객체 편집 */}
              {isImageObject(selectedObject) && (
                <div className="space-y-3">
                {/* 비율 유지 체크박스 */}
                  <div>
                  <label className="flex items-center gap-2 text-xs">
                    <input 
                      type="checkbox" 
                        checked={selectedObject.maintainAspectRatio || false}
                        onChange={(e) => debouncedUpdateImageObject(selectedObject.id, { 
                          maintainAspectRatio: e.target.checked 
                        })}
                      className="rounded" 
                    />
                      <span>비율 유지</span>
                  </label>
                </div>
                  
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">불투명도</label>
                  <div className="flex items-center gap-2">
                      <button
                        onClick={() => debouncedUpdateImageObject(selectedObject.id, { 
                          opacity: Math.max(0.1, (selectedObject.opacity || 1) - 0.1) 
                        })}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
                      >
                        ▼
                      </button>
                      <span className="flex-1 text-center text-sm font-mono bg-slate-50 py-1 rounded">
                        {Math.round((selectedObject.opacity || 1) * 100)}%
                      </span>
                      <button
                        onClick={() => debouncedUpdateImageObject(selectedObject.id, { 
                          opacity: Math.min(1, (selectedObject.opacity || 1) + 0.1) 
                        })}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
                      >
                        ▲
                      </button>
              </div>
                </div>
                
                  {/* 크기 조절 */}
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-2 block">크기</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-600 mb-1 block">너비</label>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              const newWidth = Math.max(50, selectedObject.width - 10);
                              const updates = selectedObject.maintainAspectRatio
                                ? { 
                                    width: newWidth,
                                    height: newWidth / (selectedObject.width / selectedObject.height)
                                  }
                                : { width: newWidth };
                              debouncedUpdateImageObject(selectedObject.id, updates);
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
                          >
                            ◀
                          </button>
                          <span className="flex-1 text-center text-xs font-mono bg-slate-50 py-1 rounded">
                            {Math.round(selectedObject.width)}
                          </span>
                          <button
                            onClick={() => {
                              const newWidth = selectedObject.width + 10;
                              const updates = selectedObject.maintainAspectRatio
                                ? { 
                                    width: newWidth,
                                    height: newWidth / (selectedObject.width / selectedObject.height)
                                  }
                                : { width: newWidth };
                              debouncedUpdateImageObject(selectedObject.id, updates);
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
                          >
                            ▶
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-slate-600 mb-1 block">높이</label>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              const newHeight = Math.max(30, selectedObject.height - 10);
                              const updates = selectedObject.maintainAspectRatio
                                ? { 
                                    height: newHeight,
                                    width: newHeight * (selectedObject.width / selectedObject.height)
                                  }
                                : { height: newHeight };
                              debouncedUpdateImageObject(selectedObject.id, updates);
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
                          >
                            ▲
                          </button>
                          <span className="flex-1 text-center text-xs font-mono bg-slate-50 py-1 rounded">
                            {Math.round(selectedObject.height)}
                          </span>
                          <button
                            onClick={() => {
                              const newHeight = selectedObject.height + 10;
                              const updates = selectedObject.maintainAspectRatio
                                ? { 
                                    height: newHeight,
                                    width: newHeight * (selectedObject.width / selectedObject.height)
                                  }
                                : { height: newHeight };
                              debouncedUpdateImageObject(selectedObject.id, updates);
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
                          >
                            ▼
                          </button>
              </div>
            </div>
                    </div>
                  </div>
              </div>
            )}

              {/* 객체 제어 버튼 */}
              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-200">
                <button
                  onClick={handleDuplicateObject}
                  className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  📋 복사
                </button>
                <button
                  onClick={handleDeleteObject}
                  className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  🗑️ 삭제
                </button>
              </div>
              
              {/* 레이어 제어 */}
              <div className="grid grid-cols-4 gap-1 mt-2">
                <button
                  onClick={handleBringToFront}
                  className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors"
                  title="맨 위로"
                >
                  ⬆⬆
                </button>
                <button
                  onClick={handleBringForward}
                  className="px-2 py-1 bg-blue-400 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors"
                  title="위로"
                >
                  ⬆
                </button>
                <button
                  onClick={handleSendBackward}
                  className="px-2 py-1 bg-purple-400 hover:bg-purple-500 text-white rounded text-xs font-medium transition-colors"
                  title="아래로"
                >
                  ⬇
                </button>
                <button
                  onClick={handleSendToBack}
                  className="px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-xs font-medium transition-colors"
                  title="맨 아래로"
                >
                  ⬇⬇
                </button>
              </div>
            </div>
          );
          })()}

          {/* 다중선택된 엑셀 셀들 편집 */}
          {(() => {
            const { getSelectedCells, getSelectedCount } = useCellSelectionStore.getState();
            const selectedCells = getSelectedCells();
            const selectedCount = getSelectedCount();
            
            return selectedCount > 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <span>📊</span> 선택된 엑셀 셀 ({selectedCount}개)
                </h3>
                
                <div className="space-y-4">
                  {/* 폰트 크기 */}
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">폰트 크기</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          // 선택된 셀들 중 가장 작은 폰트 크기 찾기
                          let minFontSize = 72;
                          for (const cellId of selectedCells) {
                            const cellObj = textObjects.find(obj => obj.id === cellId);
                            if (cellObj && cellObj.cellType === 'cell') {
                              minFontSize = Math.min(minFontSize, cellObj.fontSize);
                            }
                          }
                          
                          // 가장 작은 폰트 크기 기준으로 2px 감소
                          const newFontSize = Math.max(8, minFontSize - 2);
                          
                          // 모든 선택된 셀에 동일한 폰트 크기 적용
                          for (const cellId of selectedCells) {
                            const cellObj = textObjects.find(obj => obj.id === cellId);
                            if (cellObj && cellObj.cellType === 'cell') {
                              await updateTextObject(cellId, { 
                                fontSize: newFontSize
                              });
                            }
                          }
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
                      >
                        ▼
                      </button>
                      <span className="flex-1 text-center text-sm font-mono bg-slate-50 py-1 rounded border">
                        일괄 변경
                      </span>
                      <button
                        onClick={async () => {
                          // 선택된 셀들 중 가장 작은 폰트 크기 찾기
                          let minFontSize = 72;
                          for (const cellId of selectedCells) {
                            const cellObj = textObjects.find(obj => obj.id === cellId);
                            if (cellObj && cellObj.cellType === 'cell') {
                              minFontSize = Math.min(minFontSize, cellObj.fontSize);
                            }
                          }
                          
                          // 가장 작은 폰트 크기 기준으로 2px 증가
                          const newFontSize = Math.min(72, minFontSize + 2);
                          
                          // 모든 선택된 셀에 동일한 폰트 크기 적용
                          for (const cellId of selectedCells) {
                            const cellObj = textObjects.find(obj => obj.id === cellId);
                            if (cellObj && cellObj.cellType === 'cell') {
                              await updateTextObject(cellId, { 
                                fontSize: newFontSize
                              });
                            }
                          }
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
                      >
                        ▲
                      </button>
                    </div>
                  </div>
                  
                  {/* 색상 선택 */}
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-2 block">색상</label>
                    
                    {/* 색상 모드 선택 버튼 */}
                    <div className="grid grid-cols-3 gap-1 mb-3">
                      <button
                        onClick={() => setColorMode('text')}
                        className={`px-2 py-2 rounded text-xs transition-colors ${
                          colorMode === 'text'
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        텍스트
                      </button>
                      <button
                        onClick={() => setColorMode('background')}
                        className={`px-2 py-2 rounded text-xs transition-colors ${
                          colorMode === 'background'
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        배경
                      </button>
                      <button
                        onClick={() => setColorMode('border')}
                        className={`px-2 py-2 rounded text-xs transition-colors ${
                          colorMode === 'border'
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        테두리
                      </button>
                    </div>

                    {/* 색상 파레트 */}
                    <div className="grid grid-cols-5 gap-2">
                      {/* 배경 모드일 때만 투명 옵션 표시 */}
                      {colorMode === 'background' && (
                        <button
                          onClick={async () => {
                            for (const cellId of selectedCells) {
                              const cellObj = textObjects.find(obj => obj.id === cellId);
                              if (cellObj && cellObj.cellType === 'cell') {
                                await updateTextObject(cellId, {
                                  boxStyle: { 
                                    ...cellObj.boxStyle,
                                    backgroundColor: 'transparent'
                                  }
                                });
                              }
                            }
                          }}
                          className={`w-8 h-8 rounded border-2 transition-all ${
                            getCurrentColor() === 'transparent'
                              ? 'border-blue-500 border-2 shadow-md' 
                              : 'border-slate-300 hover:border-slate-400'
                          }`}
                          style={{ 
                            backgroundColor: 'white',
                            backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                            backgroundSize: '8px 8px',
                            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
                          }}
                          title="투명"
                        />
                      )}
                      {colorPalette.map((color, index) => {
                        const isSelected = getCurrentColor() === color;
                        return (
                          <button
                            key={index}
                            onClick={async () => {
                              for (const cellId of selectedCells) {
                                const cellObj = textObjects.find(obj => obj.id === cellId);
                                if (cellObj && cellObj.cellType === 'cell') {
                                  switch (colorMode) {
                                    case 'text':
                                      await updateTextObject(cellId, {
                                        textStyle: { 
                                          ...cellObj.textStyle,
                                          color: color
                                        }
                                      });
                                      break;
                                    case 'background':
                                      await updateTextObject(cellId, {
                                        boxStyle: { 
                                          ...cellObj.boxStyle,
                                          backgroundColor: color
                                        }
                                      });
                                      break;
                                    case 'border':
                                      await updateTextObject(cellId, {
                                        boxStyle: { 
                                          ...cellObj.boxStyle,
                                          borderColor: color
                                        }
                                      });
                                      break;
                                  }
                                }
                              }
                            }}
                            className={`w-8 h-8 rounded border-2 transition-all ${
                              isSelected 
                                ? 'border-blue-500 border-2 shadow-md' 
                                : 'border-slate-300 hover:border-slate-400'
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* 텍스트 스타일 */}
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-2 block">텍스트 스타일</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={async () => {
                          for (const cellId of selectedCells) {
                            const cellObj = textObjects.find(obj => obj.id === cellId);
                            if (cellObj && cellObj.cellType === 'cell') {
                              const currentBold = cellObj.textStyle?.bold || false;
                              await updateTextObject(cellId, {
                                textStyle: { 
                                  ...cellObj.textStyle,
                                  bold: !currentBold
                                }
                              });
                            }
                          }
                        }}
                        className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                          // 첫 번째 선택된 셀의 bold 상태를 기준으로 표시
                          (() => {
                            const firstCell = textObjects.find(obj => obj.id === selectedCells[0]);
                            return firstCell?.textStyle?.bold 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700';
                          })()
                        }`}
                      >
                        굵게
                      </button>
                      <button 
                        onClick={async () => {
                          for (const cellId of selectedCells) {
                            const cellObj = textObjects.find(obj => obj.id === cellId);
                            if (cellObj && cellObj.cellType === 'cell') {
                              const currentItalic = cellObj.textStyle?.italic || false;
                              await updateTextObject(cellId, {
                                textStyle: { 
                                  ...cellObj.textStyle,
                                  italic: !currentItalic
                                }
                              });
                            }
                          }
                        }}
                        className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                          // 첫 번째 선택된 셀의 italic 상태를 기준으로 표시
                          (() => {
                            const firstCell = textObjects.find(obj => obj.id === selectedCells[0]);
                            return firstCell?.textStyle?.italic 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700';
                          })()
                        }`}
                      >
                        기울임
                      </button>
                    </div>
                  </div>
                  
                  {/* 정렬 */}
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-2 block">텍스트 정렬</label>
                    <div className="space-y-2">
                      {/* 가로 정렬 */}
                      <div>
                        <div className="text-xs text-slate-500 mb-1">가로</div>
                        <div className="grid grid-cols-3 gap-1">
                          {(['left', 'center', 'right'] as const).map(align => (
                            <button 
                              key={align}
                              onClick={async () => {
                                for (const cellId of selectedCells) {
                                  const cellObj = textObjects.find(obj => obj.id === cellId);
                                  if (cellObj && cellObj.cellType === 'cell') {
                                    await updateTextObject(cellId, {
                                      textStyle: { 
                                        ...cellObj.textStyle,
                                        horizontalAlign: align
                                      }
                                    });
                                  }
                                }
                              }}
                              className={`px-2 py-1 rounded text-xs transition-colors ${
                                // 첫 번째 선택된 셀의 정렬 상태를 기준으로 표시
                                (() => {
                                  const firstCell = textObjects.find(obj => obj.id === selectedCells[0]);
                                  return firstCell?.textStyle?.horizontalAlign === align
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700';
                                })()
                              }`}
                            >
                              {align === 'left' ? '◀' : align === 'center' ? '●' : '▶'}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* 세로 정렬 */}
                      <div>
                        <div className="text-xs text-slate-500 mb-1">세로</div>
                        <div className="grid grid-cols-3 gap-1">
                          {(['top', 'middle', 'bottom'] as const).map(align => (
                            <button 
                              key={align}
                              onClick={async () => {
                                for (const cellId of selectedCells) {
                                  const cellObj = textObjects.find(obj => obj.id === cellId);
                                  if (cellObj && cellObj.cellType === 'cell') {
                                    await updateTextObject(cellId, {
                                      textStyle: { 
                                        ...cellObj.textStyle,
                                        verticalAlign: align
                                      }
                                    });
                                  }
                                }
                              }}
                              className={`px-2 py-1 rounded text-xs transition-colors ${
                                // 첫 번째 선택된 셀의 정렬 상태를 기준으로 표시
                                (() => {
                                  const firstCell = textObjects.find(obj => obj.id === selectedCells[0]);
                                  return firstCell?.textStyle?.verticalAlign === align
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700';
                                })()
                              }`}
                            >
                              {align === 'top' ? '▲' : align === 'middle' ? '●' : '▼'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 테두리 두께 */}
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">테두리 두께</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          for (const cellId of selectedCells) {
                            const cellObj = textObjects.find(obj => obj.id === cellId);
                            if (cellObj && cellObj.cellType === 'cell') {
                              const currentBorderWidth = cellObj.boxStyle?.borderWidth || 0;
                              await updateTextObject(cellId, {
                                boxStyle: { 
                                  ...cellObj.boxStyle,
                                  borderWidth: Math.max(0, currentBorderWidth - 1)
                                }
                              });
                            }
                          }
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
                      >
                        ▼
                      </button>
                      <span className="flex-1 text-center text-sm font-mono bg-slate-50 py-1 rounded border">
                        일괄 변경
                      </span>
                      <button
                        onClick={async () => {
                          for (const cellId of selectedCells) {
                            const cellObj = textObjects.find(obj => obj.id === cellId);
                            if (cellObj && cellObj.cellType === 'cell') {
                              const currentBorderWidth = cellObj.boxStyle?.borderWidth || 0;
                              await updateTextObject(cellId, {
                                boxStyle: { 
                                  ...cellObj.boxStyle,
                                  borderWidth: Math.min(10, currentBorderWidth + 1)
                                }
                              });
                            }
                          }
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs"
                      >
                        ▲
                      </button>
                    </div>
                  </div>
                  
                  {/* 제어 버튼 */}
                  <div className="flex gap-2 pt-3 border-t border-slate-200">
                    <button
                      onClick={async () => {
                        // 선택된 셀들의 텍스트 내용 삭제
                        for (const cellId of selectedCells) {
                          const cellObj = textObjects.find(obj => obj.id === cellId);
                          if (cellObj && cellObj.cellType === 'cell') {
                            await updateTextObject(cellId, { text: '' });
                          }
                        }
                        console.log(`${selectedCount}개 셀의 텍스트가 삭제되었습니다.`);
                      }}
                      className="flex-1 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      🗑️ 텍스트 삭제
                    </button>
                    <button
                      onClick={() => {
                        const { clearSelection } = useCellSelectionStore.getState();
                        clearSelection();
                      }}
                      className="flex-1 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      ❌ 선택 해제
                    </button>
                  </div>
                </div>
              </div>
            ) : null;
          })()}

          {/* 4. 설정 */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <button
              onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
              className="w-full p-4 flex items-center justify-between text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-t-xl transition-colors"
            >
              <span className="flex items-center gap-2">
                <span>⚙️</span> 설정
              </span>
              <span className={`text-slate-400 transition-transform duration-200 ${isSettingsExpanded ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            
            {isSettingsExpanded && (
              <div className="p-4 border-t border-slate-200 space-y-4">
                
                {/* 그리드 설정 */}
                <div className="bg-slate-50 rounded-lg p-3 space-y-3">
                  <h4 className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <span>🔲</span> 그리드
                  </h4>
                  
                  <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs">
                    <input 
                      type="checkbox" 
                        checked={safeSettings.admin.gridVisible}
                        onChange={(e) => updateSettings('admin', { gridVisible: e.target.checked })}
                      className="rounded" 
                    />
                      <span>그리드 표시</span>
                  </label>

                <label className="flex items-center gap-2 text-xs">
                  <input 
                    type="checkbox" 
                        checked={safeSettings.admin.gridSnapEnabled}
                        onChange={(e) => updateSettings('admin', { gridSnapEnabled: e.target.checked })}
                    className="rounded" 
                  />
                      <span>그리드에 스냅</span>
                </label>
                    
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">그리드 크기</label>
                      <div className="flex items-center gap-2">
        <button
                          onClick={() => updateSettings('admin', { 
                            gridSize: Math.max(8, safeSettings.admin.gridSize - 4) 
                          })}
                          className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs border"
                        >
                          ▼
                        </button>
                        <span className="flex-1 text-center text-sm font-mono bg-white py-1 rounded border">
                          {safeSettings.admin.gridSize}px
          </span>
                        <button
                          onClick={() => updateSettings('admin', { 
                            gridSize: Math.min(64, safeSettings.admin.gridSize + 4) 
                          })}
                          className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs border"
                        >
                          ▲
        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 객체 생성 위치 */}
                <div className="bg-slate-50 rounded-lg p-3 space-y-3">
                  <h4 className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <span>📍</span> 객체 생성 위치
                  </h4>
                  
              <div className="grid grid-cols-2 gap-2">
                <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">X 좌표</label>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const x = Math.max(0, safeSettings.admin.objectCreationPosition.x - 20);
                      updateSettings('admin', {
                        objectCreationPosition: {
                          ...safeSettings.admin.objectCreationPosition,
                          x
                        }
                      });
                    }}
                          className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs border"
                        >
                          ◀
                        </button>
                        <span className="flex-1 text-center text-xs font-mono bg-white py-1 rounded border">
                          {safeSettings.admin.objectCreationPosition.x}
                        </span>
                        <button
                          onClick={() => {
                            const x = safeSettings.admin.objectCreationPosition.x + 20;
                            updateSettings('admin', {
                              objectCreationPosition: {
                                ...safeSettings.admin.objectCreationPosition,
                                x
                              }
                            });
                          }}
                          className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs border"
                        >
                          ▶
                        </button>
                      </div>
                </div>
                <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">Y 좌표</label>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const y = Math.max(0, safeSettings.admin.objectCreationPosition.y - 20);
                      updateSettings('admin', {
                        objectCreationPosition: {
                          ...safeSettings.admin.objectCreationPosition,
                          y
                        }
                      });
                    }}
                          className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs border"
                        >
                          ▲
                        </button>
                        <span className="flex-1 text-center text-xs font-mono bg-white py-1 rounded border">
                          {safeSettings.admin.objectCreationPosition.y}
                        </span>
                        <button
                          onClick={() => {
                            const y = safeSettings.admin.objectCreationPosition.y + 20;
                            updateSettings('admin', {
                              objectCreationPosition: {
                                ...safeSettings.admin.objectCreationPosition,
                                y
                              }
                            });
                          }}
                          className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs border"
                        >
                          ▼
                        </button>
                </div>
              </div>
              </div>
            </div>

                {/* 체크박스 기본값 설정 */}
                <div className="bg-slate-50 rounded-lg p-3 space-y-3">
                  <h4 className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <span>☑️</span> 체크박스 기본값
                  </h4>
                  
                  {/* 체크박스 색상 */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                      <label className="text-xs text-slate-600 mb-1 block">체크 색상</label>
                    <input
                      type="color"
                      value={safeSettings.admin.defaultCheckboxSettings.checkedColor}
                      onChange={(e) => updateSettings('admin', {
                        defaultCheckboxSettings: {
                          ...safeSettings.admin.defaultCheckboxSettings,
                          checkedColor: e.target.value
                        }
                      })}
                      onFocus={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                        className="w-full h-8 rounded border border-slate-300"
                    />
                  </div>
                  <div>
                      <label className="text-xs text-slate-600 mb-1 block">미체크 색상</label>
                    <input
                      type="color"
                      value={safeSettings.admin.defaultCheckboxSettings.uncheckedColor}
                      onChange={(e) => updateSettings('admin', {
                        defaultCheckboxSettings: {
                          ...safeSettings.admin.defaultCheckboxSettings,
                          uncheckedColor: e.target.value
                        }
                      })}
                      onFocus={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                        className="w-full h-8 rounded border border-slate-300"
                    />
                  </div>
                </div>

                  {/* 체크박스 배경 색상 */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                      <label className="text-xs text-slate-600 mb-1 block">체크 배경</label>
                    <input
                      type="color"
                      value={safeSettings.admin.defaultCheckboxSettings.checkedBackgroundColor}
                      onChange={(e) => updateSettings('admin', {
                        defaultCheckboxSettings: {
                          ...safeSettings.admin.defaultCheckboxSettings,
                          checkedBackgroundColor: e.target.value
                        }
                      })}
                      onFocus={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                        className="w-full h-8 rounded border border-slate-300"
                    />
                  </div>
                  <div>
                      <label className="text-xs text-slate-600 mb-1 block">미체크 배경</label>
                    <input
                      type="color"
                      value={safeSettings.admin.defaultCheckboxSettings.uncheckedBackgroundColor}
                      onChange={(e) => updateSettings('admin', {
                        defaultCheckboxSettings: {
                          ...safeSettings.admin.defaultCheckboxSettings,
                          uncheckedBackgroundColor: e.target.value
                        }
                      })}
                      onFocus={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                        className="w-full h-8 rounded border border-slate-300"
                    />
                  </div>
                </div>

                  {/* 투명도 조정 */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                      <label className="text-xs text-slate-600 mb-1 block">체크 투명도</label>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateSettings('admin', {
                        defaultCheckboxSettings: {
                          ...safeSettings.admin.defaultCheckboxSettings,
                              checkedBackgroundOpacity: Math.max(0, safeSettings.admin.defaultCheckboxSettings.checkedBackgroundOpacity - 0.1)
                            }
                          })}
                          className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs border"
                        >
                          ▼
                        </button>
                        <span className="flex-1 text-center text-xs font-mono bg-white py-1 rounded border">
                          {Math.round(safeSettings.admin.defaultCheckboxSettings.checkedBackgroundOpacity * 100)}%
                        </span>
                        <button
                          onClick={() => updateSettings('admin', {
                            defaultCheckboxSettings: {
                              ...safeSettings.admin.defaultCheckboxSettings,
                              checkedBackgroundOpacity: Math.min(1, safeSettings.admin.defaultCheckboxSettings.checkedBackgroundOpacity + 0.1)
                            }
                          })}
                          className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs border"
                        >
                          ▲
                        </button>
                      </div>
                  </div>
                  <div>
                      <label className="text-xs text-slate-600 mb-1 block">미체크 투명도</label>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateSettings('admin', {
                        defaultCheckboxSettings: {
                          ...safeSettings.admin.defaultCheckboxSettings,
                              uncheckedBackgroundOpacity: Math.max(0, safeSettings.admin.defaultCheckboxSettings.uncheckedBackgroundOpacity - 0.1)
                            }
                          })}
                          className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs border"
                        >
                          ▼
                        </button>
                        <span className="flex-1 text-center text-xs font-mono bg-white py-1 rounded border">
                          {Math.round(safeSettings.admin.defaultCheckboxSettings.uncheckedBackgroundOpacity * 100)}%
                        </span>
                        <button
                          onClick={() => updateSettings('admin', {
                            defaultCheckboxSettings: {
                              ...safeSettings.admin.defaultCheckboxSettings,
                              uncheckedBackgroundOpacity: Math.min(1, safeSettings.admin.defaultCheckboxSettings.uncheckedBackgroundOpacity + 0.1)
                            }
                          })}
                          className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs border"
                        >
                          ▲
                        </button>
                  </div>
                </div>
              </div>
            </div>

                {/* 배경 이미지 업로드 */}
                <div className="bg-slate-50 rounded-lg p-3">
                  <h4 className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                    <span>🖼️</span> 배경 이미지
                  </h4>
                  <label className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors cursor-pointer text-sm font-medium flex items-center justify-center gap-2">
                    <span>📁</span>
                    <span>이미지 업로드</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* 기타 설정 */}
                <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                  <h4 className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <span>🔧</span> 기타
                  </h4>
                  
                <label className="flex items-center gap-2 text-xs">
                  <input 
                    type="checkbox" 
                    checked={safeSettings.admin.autoToolSwitch}
                    onChange={(e) => updateSettings('admin', { autoToolSwitch: e.target.checked })}
                    className="rounded" 
                  />
                    <span>객체 생성 후 자동으로 선택 도구로 전환</span>
                </label>
                  
                <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">기본 폰트 크기</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateSettings('admin', { 
                          defaultFontSize: Math.max(8, safeSettings.admin.defaultFontSize - 2) 
                        })}
                        className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs border"
                      >
                        ▼
                      </button>
                      <span className="flex-1 text-center text-sm font-mono bg-white py-1 rounded border">
                        {safeSettings.admin.defaultFontSize}px
                      </span>
                      <button
                        onClick={() => updateSettings('admin', { 
                          defaultFontSize: Math.min(72, safeSettings.admin.defaultFontSize + 2) 
                        })}
                        className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs border"
                      >
                        ▲
                      </button>
              </div>
            </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-2 block">기본 박스 크기</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">가로</label>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateSettings('admin', { 
                              defaultBoxWidth: Math.max(50, safeSettings.admin.defaultBoxWidth - 10) 
                            })}
                            className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs border"
                          >
                            ◀
                          </button>
                          <span className="flex-1 text-center text-xs font-mono bg-white py-1 rounded border">
                            {safeSettings.admin.defaultBoxWidth}px
                          </span>
                          <button
                            onClick={() => updateSettings('admin', { 
                              defaultBoxWidth: Math.min(500, safeSettings.admin.defaultBoxWidth + 10) 
                            })}
                            className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs border"
                          >
                            ▶
                          </button>
              </div>
            </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">세로</label>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateSettings('admin', { 
                              defaultBoxHeight: Math.max(30, safeSettings.admin.defaultBoxHeight - 10) 
                            })}
                            className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs border"
                          >
                            ▲
                          </button>
                          <span className="flex-1 text-center text-xs font-mono bg-white py-1 rounded border">
                            {safeSettings.admin.defaultBoxHeight}px
                          </span>
                          <button
                            onClick={() => updateSettings('admin', { 
                              defaultBoxHeight: Math.min(200, safeSettings.admin.defaultBoxHeight + 10) 
                            })}
                            className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs border"
                          >
                            ▼
                          </button>
          </div>
                      </div>
                    </div>
      </div>

 
        </div>
          </div>
        )}
      </div>
        </div>
      </div>


    </div>
  );
};

export default Toolbar; 
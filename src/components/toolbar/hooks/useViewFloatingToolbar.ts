import { useState, useRef, useEffect, useMemo } from 'react';
import { useEditorStore, useAdminConfigStore, useDrawStore } from '../../../store';
import { useUndoRedo } from '../../../hooks/useUndoRedo';
import type { TextObject } from '../../../types';

interface Position { x: number; y: number }
interface Size { width: number; height: number }

export function useViewFloatingToolbar() {
  const { currentTool, setCurrentTool, fitToWindow, setSelectedObjectId, selectedObjectId } = useEditorStore();
  const { addTextObject, settings, textObjects, imageObjects, deleteTextObject, deleteImageObject } = useAdminConfigStore();
  const { penColor, penWidth, setPenColor, setPenWidth } = useDrawStore();
  const { executeUndo, executeRedo, canUndo, canRedo } = useUndoRedo();

  // DB에서 perfect-freehand 설정 가져오기
  const usePerfectFreehand = settings?.view?.usePerfectFreehand ?? true;

  // 설정이 로드되지 않았을 때 기본값 제공
  const safeSettings = {
    admin: {
      objectCreationPosition: settings?.admin?.objectCreationPosition ?? { x: 200, y: 200 },
      defaultBoxWidth: settings?.admin?.defaultBoxWidth ?? 200,
      defaultBoxHeight: settings?.admin?.defaultBoxHeight ?? 60,
      defaultFontSize: settings?.admin?.defaultFontSize ?? 18,
      defaultCheckboxSettings: settings?.admin?.defaultCheckboxSettings ?? {
        checkedColor: '#22c55e',
        uncheckedColor: '#f3f4f6',
        checkedBackgroundColor: '#22c55e',
        uncheckedBackgroundColor: '#f3f4f6',
        checkedBackgroundOpacity: 0.2,
        uncheckedBackgroundOpacity: 0.1,
      },
    },
  } as const;

  // 저장된 위치와 크기 로드
  const loadSettings = () => {
    try {
      const savedPosition = localStorage.getItem('viewFloatingToolbar_position');
      const savedSize = localStorage.getItem('viewFloatingToolbar_size');
      const defaultPosition = { x: window.innerWidth - 200, y: window.innerHeight - 150 };
      const defaultSize = { width: 180, height: 120 };
      return {
        position: savedPosition ? JSON.parse(savedPosition) : defaultPosition,
        size: savedSize ? JSON.parse(savedSize) : defaultSize,
      } as { position: Position; size: Size };
    } catch {
      return {
        position: { x: window.innerWidth - 200, y: window.innerHeight - 150 },
        size: { width: 180, height: 120 },
      };
    }
  };

  const savedSettings = loadSettings();

  // 툴바 위치 및 크기 상태
  const [position, setPosition] = useState<Position>(savedSettings.position);
  const [size, setSize] = useState<Size>(savedSettings.size);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [showSizeAdjuster, setShowSizeAdjuster] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // 위치 및 크기 저장 함수
  const saveSettings = (newPosition: Position, newSize: Size) => {
    try {
      localStorage.setItem('viewFloatingToolbar_position', JSON.stringify(newPosition));
      localStorage.setItem('viewFloatingToolbar_size', JSON.stringify(newSize));
    } catch (error) {
      console.warn('Failed to save toolbar settings:', error);
    }
  };

  // 경계 체크 및 조정 함수
  const constrainToViewport = (pos: Position, sz: Size): Position => {
    const expandHeight = showColorPalette || showSizeAdjuster ? 110 : 0;
    const rectW = sz.width;
    const rectH = sz.height + expandHeight;
    const maxX = Math.max(8, window.innerWidth - rectW - 8);
    const maxY = Math.max(8, window.innerHeight - rectH - 8);
    const minX = 8;
    const minY = 8;
    return { x: Math.max(minX, Math.min(maxX, pos.x)), y: Math.max(minY, Math.min(maxY, pos.y)) };
  };

  // 초기 마운트 시 경계 보정
  useEffect(() => {
    const constrainedPosition = constrainToViewport(savedSettings.position, savedSettings.size);
    if (constrainedPosition.x !== savedSettings.position.x || constrainedPosition.y !== savedSettings.position.y) {
      setPosition(constrainedPosition);
      saveSettings(constrainedPosition, savedSettings.size);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 포인터 이동/업 핸들러 등록 (드래그/리사이즈 중에만)
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handlePointerMove = (e: PointerEvent) => {
      // 터치 디바이스에서 이벤트 처리 최적화
      if (e.pointerType === 'touch') {
        e.preventDefault(); // 터치 스크롤 방지
      }
      
      if (isDragging) {
        const newPos = { x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y };
        const constrained = constrainToViewport(newPos, size);
        setPosition(constrained);
      }
      if (isResizing) {
        const rect = toolbarRef.current?.getBoundingClientRect();
        if (rect) {
          const newWidth = Math.max(120, e.clientX - rect.left);
          const newHeight = Math.max(80, e.clientY - rect.top);
          const newSize = { width: newWidth, height: newHeight };
          const constrained = constrainToViewport(position, newSize);
          setSize(newSize);
          setPosition(constrained);
        }
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (isDragging || isResizing) {
        saveSettings(position, size);
      }
      setIsDragging(false);
      setIsResizing(false);
      if (toolbarRef.current) {
        try {
          toolbarRef.current.releasePointerCapture(e.pointerId);
        } catch {}
      }
    };

    // 터치 디바이스에서 추가 이벤트 리스너
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // 터치 스크롤 방지
    };

    const handleTouchEnd = (_e: TouchEvent) => {
      if (isDragging || isResizing) {
        saveSettings(position, size);
      }
      setIsDragging(false);
      setIsResizing(false);
    };

    document.addEventListener('pointermove', handlePointerMove, { passive: false });
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, isResizing, dragOffset, size, position]);

  // 윈도우 리사이즈 시 위치 보정
  useEffect(() => {
    const onResize = () => {
      const constrained = constrainToViewport(position, size);
      if (constrained.x !== position.x || constrained.y !== position.y) {
        setPosition(constrained);
        saveSettings(constrained, size);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [position, size, showColorPalette, showSizeAdjuster]);

  // 툴바 리사이즈/내용 변화 자동 보정
  useEffect(() => {
    if (!toolbarRef.current) return;
    const ro = new ResizeObserver(() => {
      const constrained = constrainToViewport(position, size);
      if (constrained.x !== position.x || constrained.y !== position.y) {
        setPosition(constrained);
        saveSettings(constrained, size);
      }
    });
    ro.observe(toolbarRef.current);
    return () => ro.disconnect();
  }, [position, size, showColorPalette, showSizeAdjuster]);

  // 외부 클릭 시 확장 패널 닫기
  useEffect(() => {
    const onDocPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (!toolbarRef.current) return;
      if (!toolbarRef.current.contains(target)) {
        setShowColorPalette(false);
        setShowSizeAdjuster(false);
      }
    };
    
    // 터치 입력으로 인한 즉시 클릭 방지를 위해 약간의 지연 추가
    const timeoutId = setTimeout(() => {
      document.addEventListener('pointerdown', onDocPointerDown);
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('pointerdown', onDocPointerDown);
    };
  }, []);

  // 이벤트 핸들러들
  const handleToolbarPointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('.resize-handle') ||
      target.closest('input') ||
      target.classList.contains('no-drag')
    ) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    
    // 터치 디바이스에서 포인터 캡처 최적화
    if (e.pointerType === 'touch') {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (error) {
        // iOS Safari에서는 포인터 캡처가 제한적일 수 있음
        console.warn('Pointer capture failed:', error);
      }
    } else {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
    }
    
    const rect = toolbarRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
    if (import.meta.env.DEV) {
      console.log(`🔧 Floating Toolbar drag started with ${e.pointerType}`);
    }
  };

  const handleResizePointerStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    // 터치 디바이스에서 포인터 캡처 최적화
    if (e.pointerType === 'touch') {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (error) {
        // iOS Safari에서는 포인터 캡처가 제한적일 수 있음
        console.warn('Pointer capture failed:', error);
      }
    } else {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
    }
    
    if (import.meta.env.DEV) {
      console.log(`🔧 Floating Toolbar resize started with ${e.pointerType}`);
    }
  };

  const handleToolChange = (tool: string) => {
    setCurrentTool(tool as any);
    if (tool !== 'pen') {
      setShowColorPalette(false);
      setShowSizeAdjuster(false);
    }
  };

  const handleCheckboxCreate = async () => {
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
      hasCheckbox: true,
      checkboxChecked: false,
      checkboxCheckedColor: checkedColor,
      checkboxUncheckedColor: uncheckedColor,
      checkedBackgroundColor,
      uncheckedBackgroundColor,
      checkedBackgroundOpacity,
      uncheckedBackgroundOpacity,
      boxStyle: {
        backgroundColor: '#ffffff',
        backgroundOpacity: 1,
        borderColor: '#000000',
        borderWidth: 1,
        borderRadius: 8,
      },
      fontSize: safeSettings.admin.defaultFontSize,
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
      isEditing: true,
      lastModified: Date.now(),
    };

    try {
      const newObjectId = await addTextObject(newCheckboxObject);
      setSelectedObjectId(newObjectId);
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('activateVirtualKeyboard', { detail: { objectId: newObjectId } })
        );
      }, 100);
      if (import.meta.env.DEV) {
        console.log(`✅ 체크박스 생성 및 선택 완료: ${newObjectId}`);
      }
    } catch (error) {
      console.error('❌ 체크박스 생성 실패:', error);
    }
  };

  const handleColorSelect = (color: string) => {
    setPenColor(color);
    setShowColorPalette(false);
    setCurrentTool('pen');
  };

  // 텍스트 박스 생성 함수
  const handleTextCreate = async () => {
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

    try {
      const newObjectId = await addTextObject(newTextObject);
      setSelectedObjectId(newObjectId);
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('activateVirtualKeyboard', { detail: { objectId: newObjectId } })
        );
      }, 100);
      if (import.meta.env.DEV) {
        console.log(`✅ 텍스트 박스 생성 및 선택 완료: ${newObjectId}`);
      }
    } catch (error) {
      console.error('❌ 텍스트 박스 생성 실패:', error);
    }
  };

  // 객체 삭제 함수
  const handleDeleteObject = async () => {
    if (!selectedObjectId) {
      console.warn('삭제할 객체가 선택되지 않았습니다.');
      return;
    }

    try {
      const textObj = textObjects.find(obj => obj.id === selectedObjectId);
      const imageObj = imageObjects.find(obj => obj.id === selectedObjectId);
      
      if (textObj) {
        await deleteTextObject(selectedObjectId);
      } else if (imageObj) {
        await deleteImageObject(selectedObjectId);
      } else {
        console.warn('선택된 객체를 찾을 수 없습니다.');
        return;
      }
      
      setSelectedObjectId(null);
      if (import.meta.env.DEV) {
        console.log(`✅ 객체 삭제 완료: ${selectedObjectId}`);
      }
    } catch (error) {
      console.error('❌ 객체 삭제 실패:', error);
    }
  };



  // 3x3 그리드 + 하단 2개 버튼 동적 크기 계산
  const layoutPadding = 8;
  const layoutGap = 8;
  const { buttonSize, iconSize, minW, minH } = useMemo(() => {
    const gridCols = 3;
    const gridRows = 3;
    const availableW = Math.max(0, size.width - layoutPadding * 2 - layoutGap * (gridCols - 1));
    const availableH = Math.max(0, size.height - layoutPadding * 2 - layoutGap * (gridRows + 1)); // 하단 행 추가
    const rawButton = Math.floor(Math.min(availableW / gridCols, availableH / (gridRows + 1)));
    const clampedButton = Math.max(36, Math.min(72, rawButton || 36));
    const computedIcon = Math.floor(clampedButton * 0.72);
    const minW = layoutPadding * 2 + gridCols * clampedButton + layoutGap * (gridCols - 1);
    const minH = layoutPadding * 2 + (gridRows + 1) * clampedButton + layoutGap * (gridRows + 1); // 하단 행 포함
    return { buttonSize: clampedButton, iconSize: computedIcon, minW, minH };
  }, [size.width, size.height]);

  return {
    // refs/state
    toolbarRef,
    position,
    size,
    minW,
    minH,
    buttonSize,
    iconSize,
    showColorPalette,
    showSizeAdjuster,
    setShowColorPalette,
    setShowSizeAdjuster,
    // drawing state
    penColor,
    penWidth,
    setPenWidth,
    usePerfectFreehand, // DB 설정 반환
    // editor/undo
    currentTool,
    handleToolChange,
    fitToWindow,
    executeUndo,
    executeRedo,
    canUndo,
    canRedo,
    // actions
    handleCheckboxCreate,
    handleTextCreate,
    handleDeleteObject,
    handleColorSelect,
    handleToolbarPointerDown,
    handleResizePointerStart,
  };
}



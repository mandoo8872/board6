import { useState, useRef, useEffect, useMemo } from 'react';
import { useEditorStore, useAdminConfigStore, useDrawStore } from '../../../store';
import { useUndoRedo } from '../../../hooks/useUndoRedo';
import type { TextObject } from '../../../types';

interface Position { x: number; y: number }
interface Size { width: number; height: number }

export function useViewFloatingToolbar() {
  const { currentTool, setCurrentTool, fitToWindow, setSelectedObjectId } = useEditorStore();
  const { addTextObject, settings } = useAdminConfigStore();
  const { penColor, penWidth, setPenColor, setPenWidth } = useDrawStore();
  const { executeUndo, executeRedo, canUndo, canRedo } = useUndoRedo();

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

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
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
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
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
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
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
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
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
      text: '새 체크박스',
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

  const handleSetPenWidth = (width: number) => {
    setPenWidth(width);
    setCurrentTool('pen');
  };

  // 3x3 그리드 동적 크기 계산
  const layoutPadding = 8;
  const layoutGap = 8;
  const { buttonSize, iconSize, minW, minH } = useMemo(() => {
    const gridCols = 3;
    const gridRows = 3;
    const availableW = Math.max(0, size.width - layoutPadding * 2 - layoutGap * (gridCols - 1));
    const availableH = Math.max(0, size.height - layoutPadding * 2 - layoutGap * (gridRows - 1));
    const rawButton = Math.floor(Math.min(availableW / gridCols, availableH / gridRows));
    const clampedButton = Math.max(36, Math.min(72, rawButton || 36));
    const computedIcon = Math.floor(clampedButton * 0.72);
    const minW = layoutPadding * 2 + gridCols * clampedButton + layoutGap * (gridCols - 1);
    const minH = layoutPadding * 2 + gridRows * clampedButton + layoutGap * (gridRows - 1);
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
    setPenWidth: handleSetPenWidth,

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
    handleColorSelect,
    handleToolbarPointerDown,
    handleResizePointerStart,
  };
}



import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Point, Stroke, DrawingTool, Shape } from '../types'
import { useStroke } from '../hooks/useStroke'
import { useShapes } from '../hooks/useShapes'
import { useUndoRedo } from '../hooks/useUndoRedo'
import { useBoardStorage } from '../hooks/useBoardStorage'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants'
import BaseLayer from './BaseLayer'
import DrawLayer from './DrawLayer'
import InteractionLayer from './InteractionLayer'

interface CanvasWrapperProps {
  tool: DrawingTool
  shapes: Shape[]
  strokes: Stroke[]
  penColor: string
  penSize: number
  gridSize: number
  selectedId: string | null
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>
  setStrokes: React.Dispatch<React.SetStateAction<Stroke[]>>
  setSelectedId: React.Dispatch<React.SetStateAction<string | null>>
  onUndoRedoStateChange?: (canUndo: boolean, canRedo: boolean) => void
  onSave?: () => void
  onLoad?: () => void
  onPushPull?: (action: 'push' | 'pull') => void
  onCommand?: (command: string) => void
  onToolChange: (tool: DrawingTool) => void
  showGrid?: boolean
  onMoveShape?: (shapeId: string, newPosition: { x: number; y: number }) => void
  onResizeShape?: (shapeId: string, newSize: { width: number; height: number; x?: number; y?: number }) => void
  userId: string
}

const CanvasWrapper: React.FC<CanvasWrapperProps> = ({
  tool,
  shapes,
  strokes,
  penColor,
  penSize,
  gridSize,
  selectedId,
  setShapes,
  setStrokes,
  setSelectedId,
  onUndoRedoStateChange,
  onSave,
  onLoad,
  onPushPull,
  onCommand,
  onToolChange,
  showGrid = true,
  onMoveShape,
  onResizeShape,
  userId
}) => {
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null)
  const [currentStrokeId, setCurrentStrokeId] = useState<string | null>(null)
  const shapesRef = useRef(shapes)
  const setShapesRef = useRef(setShapes)

  // shapes 상태 업데이트
  useEffect(() => {
    shapesRef.current = shapes
    setShapesRef.current = setShapes
  }, [shapes, setShapes])

  // 드래그/리사이즈 중 프론트 상태 업데이트
  // const handleShapeUpdate = useCallback((shapeId: string, updates: Partial<Shape>) => {
  //   if (!setShapesRef.current) return
  //   setShapesRef.current(prev => prev.map(s => 
  //     s.id === shapeId ? { ...s, ...updates } : s
  //   ))
  // }, [])

  // 드래그/리사이즈 종료 시 Firebase 동기화
  const handleShapeSync = useCallback((shapeId: string, updates: Partial<Shape>) => {
    if (onMoveShape && 'x' in updates && 'y' in updates) {
      onMoveShape(shapeId, { x: updates.x!, y: updates.y! })
    }
    if (onResizeShape && ('width' in updates || 'height' in updates)) {
      onResizeShape(shapeId, {
        width: updates.width || shapesRef.current.find(s => s.id === shapeId)?.width || 100,
        height: updates.height || shapesRef.current.find(s => s.id === shapeId)?.height || 60,
        x: updates.x,
        y: updates.y
      })
    }
  }, [onMoveShape, onResizeShape])

  // Undo/Redo 훅
  const undoRedoActions = useUndoRedo({
    shapes,
    strokes,
    selectedId,
    setShapes,
    setStrokes,
    setSelectedId
  })

  // 저장/불러오기 훅
  const storageActions = useBoardStorage({
    shapes,
    strokes,
    selectedId,
    setShapes,
    setStrokes,
    setSelectedId,
    onClearHistory: undoRedoActions.clearHistory
  })

  // 스트로크 관리 훅
  const strokeActions = useStroke({
    setStrokes,
    penColor,
    penSize
  })

  // 셰이프 관리 훅
  const shapeActions = useShapes({
    shapes,
    setShapes,
    selectedId,
    setSelectedId,
    gridSize
  })

  // Undo/Redo 상태 변경 알림
  React.useEffect(() => {
    if (onUndoRedoStateChange) {
      onUndoRedoStateChange(undoRedoActions.canUndo, undoRedoActions.canRedo)
    }
  }, [undoRedoActions.canUndo, undoRedoActions.canRedo, onUndoRedoStateChange])

  // 스트로크 시작 (Undo 기록 포함)
  const handleStartStroke = useCallback((point: Point): string => {
    const strokeId = strokeActions.startStroke(point, tool, userId)
    setCurrentStrokeId(strokeId)
    
    // 현재 그리고 있는 스트로크 설정
    const newStroke: Stroke = {
      id: strokeId,
      tool: tool,
      points: [point],
      color: penColor,
      size: penSize,
      isErasable: true,
      updatedAt: Date.now(),
      updatedBy: userId,
      userId: userId
    }
    setCurrentStroke(newStroke)
    
    return strokeId
  }, [strokeActions, penColor, penSize, tool, userId])

  // 스트로크에 포인트 추가
  const handleAddPointToStroke = useCallback((strokeId: string, point: Point) => {
    strokeActions.addPointToStroke(strokeId, point)
    
    // 현재 스트로크 업데이트
    if (currentStroke && currentStroke.id === strokeId) {
      setCurrentStroke(prev => prev ? {
        ...prev,
        points: [...prev.points, point]
      } : null)
    }
  }, [strokeActions, currentStroke])

  // 스트로크 완료 (Undo 기록)
  const handleFinishStroke = useCallback(() => {
    if (currentStroke) {
      // 완성된 스트로크를 Undo 히스토리에 기록
      undoRedoActions.recordCreateStroke(currentStroke)
    }
    // 드래그 종료 시점에 DB 동기화
    strokeActions.saveStrokesOnDrawEnd(strokes)
    setCurrentStroke(null)
    setCurrentStrokeId(null)
  }, [currentStroke, undoRedoActions, strokeActions, strokes])

  // 지우개 처리 (Undo 기록 포함)
  const handleEraseAtPoint = useCallback((point: Point) => {
    const beforeStrokes = [...strokes]
    strokeActions.eraseAtPoint(point)
    
    // 삭제된 스트로크 확인을 위해 다음 프레임에서 처리
    setTimeout(() => {
      const afterStrokes = strokes
      const deletedStrokes = beforeStrokes.filter(bs => 
        !afterStrokes.some((as: Stroke) => as.id === bs.id)
      )
      
      if (deletedStrokes.length > 0) {
        undoRedoActions.recordDeleteStrokes(deletedStrokes)
      }
    }, 0)
  }, [strokes, strokeActions, undoRedoActions])

  // 선택된 셰이프 삭제 (Undo 기록 포함)
  const handleDeleteSelectedShape = useCallback(() => {
    if (!selectedId) return
    
    const shapeToDelete = shapes.find((s: Shape) => s.id === selectedId)
    if (!shapeToDelete || shapeToDelete.meta?.isDeletable === false) return

    // Undo 기록
    undoRedoActions.recordDeleteShape(selectedId)
    
    // 실제 삭제
    shapeActions.deleteSelectedShape()
  }, [selectedId, shapes, undoRedoActions, shapeActions])

  // 선택된 셰이프 복제 (Undo 기록 포함)
  const handleDuplicateSelectedShape = useCallback(() => {
    if (!selectedId) return
    
    shapeActions.duplicateShape(selectedId)
    
    // 다음 프레임에서 Undo 기록
    setTimeout(() => {
      const afterState = undoRedoActions.getCurrentState()
      undoRedoActions.recordBatchAction(undoRedoActions.getCurrentState(), afterState)
    }, 0)
  }, [selectedId, shapeActions, undoRedoActions])

  // 셰이프 이동 (Undo 기록 포함)
  // const handleMoveShape = useCallback((shapeId: string, newPosition: Point) => {
  //   setShapes(prev => prev.map(shape =>
  //     shape.id === shapeId ? { ...shape, x: newPosition.x, y: newPosition.y } : shape
  //   ))
  // }, [])

  // 셰이프 생성 (Undo 기록 포함)
  const handleCreateRect = useCallback((point: Point): string => {
    const newRectId = shapeActions.createRect(point)
    
    // 다음 프레임에서 Undo 기록
    setTimeout(() => {
      const newShape = shapes.find((s: Shape) => s.id === newRectId)
      if (newShape) {
        undoRedoActions.recordCreateShape(newShape)
      }
    }, 0)

    // 자동으로 select 도구로 전환
    if (onToolChange) {
      onToolChange('select')
    }

    return newRectId
  }, [shapeActions, shapes, undoRedoActions, onToolChange])

  // 외부 명령 처리 (저장/불러오기, Undo/Redo 등)
  const handleExternalCommand = useCallback((command: string) => {
    switch (command) {
      case 'save':
        storageActions.saveToFile()
        if (onSave) onSave()
        break
      case 'load':
        storageActions.loadFromFile()
        if (onLoad) onLoad()
        break
      case 'push':
        storageActions.pushToStorage()
        if (onPushPull) onPushPull('push')
        break
      case 'pull':
        storageActions.pullFromStorage()
        if (onPushPull) onPushPull('pull')
        break
      case 'undo':
        undoRedoActions.undo()
        break
      case 'redo':
        undoRedoActions.redo()
        break
    }
  }, [storageActions, undoRedoActions, onSave, onLoad, onPushPull])

  // 외부 명령 처리
  React.useEffect(() => {
    if (onCommand && typeof onCommand === 'string') {
      handleExternalCommand(onCommand)
    }
  }, [onCommand, handleExternalCommand])

  // 캔버스 컨테이너 스타일 계산
  const getContainerStyle = useCallback(() => {
    const maxWidth = window.innerWidth - 40 // 좌우 여백
    const maxHeight = window.innerHeight - 40 // 상하 여백
    
    const scaleX = maxWidth / CANVAS_WIDTH
    const scaleY = maxHeight / CANVAS_HEIGHT
    const scale = Math.min(scaleX, scaleY, 1) // 최대 1배까지만
    
    return {
      position: 'absolute' as const,
      top: '50%',
      left: '50%',
      transform: `translate(-50%, -50%) scale(${scale})`,
      transformOrigin: 'center',
      width: `${CANVAS_WIDTH}px`,
      height: `${CANVAS_HEIGHT}px`,
      border: '1px solid #ccc',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      backgroundColor: 'white'
    }
  }, [])

  // 선택 도구로 자동 전환 타이머
  const autoSwitchTimerRef = useRef<number | null>(null)

  // 도구 변경 시 타이머 초기화
  useEffect(() => {
    if (autoSwitchTimerRef.current) {
      window.clearTimeout(autoSwitchTimerRef.current)
      autoSwitchTimerRef.current = null
    }
  }, [tool])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#f5f5f5',
      overflow: 'hidden'
    }}>
      <div style={getContainerStyle()}>
        {/* Base Layer: 그리드와 셰이프 */}
        <BaseLayer
          shapes={shapes}
          selectedId={selectedId}
          gridSize={gridSize}
          showGrid={showGrid}
        />
        
        {/* Draw Layer: 스트로크 */}
        <DrawLayer
          strokes={strokes}
        />
        
        {/* Interaction Layer: 이벤트 처리 */}
        <InteractionLayer
          tool={tool}
          shapes={shapes}
          penColor={penColor}
          penSize={penSize}
          gridSize={gridSize}
          selectedId={selectedId}
          onToolChange={onToolChange}
          onStartStroke={handleStartStroke}
          onAddPointToStroke={handleAddPointToStroke}
          onFinishStroke={handleFinishStroke}
          onEraseAtPoint={handleEraseAtPoint}
          onSelectShape={shapeActions.selectShape}
          onCreateRect={handleCreateRect}
          currentStrokeId={currentStrokeId}
          onDeleteSelectedShape={handleDeleteSelectedShape}
          onDuplicateSelectedShape={handleDuplicateSelectedShape}
          onMoveShape={handleShapeSync}
          onResizeShape={handleShapeSync}
          setShapes={setShapes}
        />
      </div>
    </div>
  )
}

export default CanvasWrapper 
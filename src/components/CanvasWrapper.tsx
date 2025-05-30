import React, { useState, useCallback, useRef, useEffect } from 'react'
import { CanvasWrapperProps, Point, Stroke, DrawingTool, Shape } from '../types'
import { useStroke } from '../hooks/useStroke'
import { useShapes } from '../hooks/useShapes'
import { useUndoRedo } from '../hooks/useUndoRedo'
import { useBoardStorage } from '../hooks/useBoardStorage'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants'
import BaseLayer from './BaseLayer'
import DrawLayer from './DrawLayer'
import InteractionLayer from './InteractionLayer'

interface ExtendedCanvasWrapperProps extends Omit<CanvasWrapperProps, 'setShapes' | 'setStrokes'> {
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>
  setStrokes: React.Dispatch<React.SetStateAction<Stroke[]>>
  onUndoRedoStateChange?: (canUndo: boolean, canRedo: boolean) => void
  onSave?: () => void
  onLoad?: () => void
  onPushPull?: (action: 'push' | 'pull') => void
  onCommand?: (command: string) => void
  onToolChange: (tool: DrawingTool) => void
  isViewPage?: boolean
}

const CanvasWrapper: React.FC<ExtendedCanvasWrapperProps> = ({
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
  isViewPage = false
}) => {
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null)
  const [currentStrokeId, setCurrentStrokeId] = useState<string | null>(null)
  const [showGrid] = useState(true)

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
    const strokeId = strokeActions.startStroke(point)
    setCurrentStrokeId(strokeId)
    
    // 현재 그리고 있는 스트로크 설정
    const newStroke: Stroke = {
      id: strokeId,
      points: [point],
      color: penColor,
      size: penSize,
      isErasable: true
    }
    setCurrentStroke(newStroke)
    
    return strokeId
  }, [strokeActions, penColor, penSize])

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
    
    setCurrentStroke(null)
    setCurrentStrokeId(null)
  }, [currentStroke, undoRedoActions])

  // 지우개 처리 (Undo 기록 포함)
  const handleEraseAtPoint = useCallback((point: Point) => {
    const beforeStrokes = [...strokes]
    strokeActions.eraseAtPoint(point)
    
    // 삭제된 스트로크 확인을 위해 다음 프레임에서 처리
    setTimeout(() => {
      const afterStrokes = strokes
      const deletedStrokes = beforeStrokes.filter(bs => 
        !afterStrokes.some(as => as.id === bs.id)
      )
      
      if (deletedStrokes.length > 0) {
        undoRedoActions.recordDeleteStrokes(deletedStrokes)
      }
    }, 0)
  }, [strokes, strokeActions, undoRedoActions])

  // 선택된 셰이프 삭제 (Undo 기록 포함)
  const handleDeleteSelectedShape = useCallback(() => {
    if (!selectedId) return
    
    const shapeToDelete = shapes.find(s => s.id === selectedId)
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
  const handleMoveShape = useCallback((shapeId: string, newPosition: Point) => {
    const shape = shapes.find(s => s.id === shapeId)
    if (!shape || shape.meta?.isMovable === false) return

    const beforeState = undoRedoActions.getCurrentState()
    shapeActions.moveShape(shapeId, newPosition)
    
    // 다음 프레임에서 Undo 기록
    setTimeout(() => {
      const afterState = undoRedoActions.getCurrentState()
      undoRedoActions.recordBatchAction(beforeState, afterState)
    }, 0)
  }, [shapes, shapeActions, undoRedoActions])

  // 셰이프 생성 (Undo 기록 포함)
  const handleCreateRect = useCallback((point: Point): string => {
    const newRectId = shapeActions.createRect(point)
    
    // 다음 프레임에서 Undo 기록
    setTimeout(() => {
      const newShape = shapes.find(s => s.id === newRectId)
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

  // 셰이프 리사이즈 핸들러
  const handleResizeShape = useCallback((shapeId: string, newSize: { width: number; height: number; x?: number; y?: number }) => {
    const shape = shapes.find(s => s.id === shapeId)
    if (!shape || !shape.meta?.isResizable) return

    // 리사이즈 전 상태 저장
    const beforeState = undoRedoActions.getCurrentState()

    // 셰이프 크기 업데이트
    shapeActions.updateShapeProperty(shapeId, 'width', newSize.width)
    shapeActions.updateShapeProperty(shapeId, 'height', newSize.height)
    
    // 위치가 변경된 경우 업데이트
    if (newSize.x !== undefined) {
      shapeActions.updateShapeProperty(shapeId, 'x', newSize.x)
    }
    if (newSize.y !== undefined) {
      shapeActions.updateShapeProperty(shapeId, 'y', newSize.y)
    }

    // 리사이즈 후 상태 저장
    setTimeout(() => {
      const afterState = undoRedoActions.getCurrentState()
      undoRedoActions.recordBatchAction(beforeState, afterState)
    }, 0)
  }, [shapes, shapeActions, undoRedoActions])

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
          currentStroke={currentStroke}
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
          onMoveShape={handleMoveShape}
          onResizeShape={handleResizeShape}
          isViewPage={isViewPage}
        />
      </div>
    </div>
  )
}

export default CanvasWrapper 
import React, { useState, useCallback, useEffect } from 'react'
import { DrawingTool, CommandTool, Shape, Stroke } from '../types'
import { DEFAULT_PEN_COLOR, DEFAULT_PEN_SIZE, DEFAULT_GRID_SIZE } from '../utils/constants'
import CanvasWrapper from './CanvasWrapper'
import Toolbar from './Toolbar'
import PropertiesPanel from './PropertiesPanel'
import { useShapes } from '../hooks/useShapes'
import { useUndoRedo } from '../hooks/useUndoRedo'
import { useBoardStorage } from '../hooks/useBoardStorage'
import { saveStrokesToFirebase, updateBoardData, isFirebaseAvailable, subscribeToSharedBoard } from '../firebase'
import { createSyncCallbacks } from '../utils/syncUtils'
import { mergeLWW } from '../utils/syncUtils'

const AdminPage: React.FC = () => {
  const [tool, setTool] = useState<DrawingTool>('select')
  const [shapes, setShapes] = useState<Shape[]>([])
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [penColor, setPenColor] = useState(DEFAULT_PEN_COLOR)
  const [penSize, setPenSize] = useState(DEFAULT_PEN_SIZE)
  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE)
  const [showGrid, setShowGrid] = useState(false)

  const selectedShape = shapes.find(shape => shape.id === selectedId) || null

  // Undo/Redo 훅
  const undoRedoActions = useUndoRedo({
    shapes,
    strokes,
    selectedId,
    setShapes,
    setStrokes,
    setSelectedId
  })

  // 보드 저장/불러오기 훅
  const storageActions = useBoardStorage({
    shapes,
    strokes,
    selectedId,
    setShapes,
    setStrokes,
    setSelectedId,
    onClearHistory: undoRedoActions.clearHistory
  })

  const shapeActions = useShapes({
    shapes,
    setShapes,
    selectedId,
    setSelectedId,
    gridSize
  })

  // 실시간 write 콜백 구현
  const syncCallbacks = React.useMemo(() => createSyncCallbacks({
    onDrawEnd: () => {
      if (isFirebaseAvailable()) {
        saveStrokesToFirebase(strokes)
      }
    },
    onMoveShape: (shapeId: string, newPosition: { x: number; y: number }) => {
      if (isFirebaseAvailable()) {
        const userId = 'admin'
        const shape = shapes.find(s => s.id === shapeId)
        if (shape) {
          updateBoardData({
            [`shapes/${shapeId}`]: {
              ...shape,
              x: newPosition.x,
              y: newPosition.y,
              updatedAt: Date.now(),
              updatedBy: userId
            }
          })
        }
      }
    },
    onResizeShape: (shapeId: string, newSize: { width: number; height: number; x?: number; y?: number }) => {
      if (isFirebaseAvailable()) {
        const userId = 'admin'
        const shape = shapes.find(s => s.id === shapeId)
        if (shape) {
          updateBoardData({
            [`shapes/${shapeId}`]: {
              ...shape,
              width: newSize.width,
              height: newSize.height,
              ...(newSize.x !== undefined ? { x: newSize.x } : {}),
              ...(newSize.y !== undefined ? { y: newSize.y } : {}),
              updatedAt: Date.now(),
              updatedBy: userId
            }
          })
        }
      }
    },
    onUpdateShape: (shapeId: string, property: keyof Shape, value: any) => {
      if (isFirebaseAvailable()) {
        if (property === 'selected') return // selected는 동기화하지 않음
        const userId = 'admin'
        const shape = shapes.find(s => s.id === shapeId)
        if (shape) {
          updateBoardData({
            [`shapes/${shapeId}`]: {
              ...shape,
              [property]: value,
              updatedAt: Date.now(),
              updatedBy: userId
            }
          })
        }
      }
    },
    onDeleteShape: (shapeId: string) => {
      if (isFirebaseAvailable()) {
        const userId = 'admin'
        const shape = shapes.find(s => s.id === shapeId)
        if (shape) {
          updateBoardData({
            [`shapes/${shapeId}`]: {
              ...shape,
              deleted: true,
              updatedAt: Date.now(),
              updatedBy: userId
            }
          })
        }
      }
    }
  }), [strokes, shapes])

  const handleToolChange = useCallback((newTool: DrawingTool) => {
    setTool(newTool)
  }, [])

  const handleGridSizeChange = useCallback((newSize: number) => {
    setGridSize(newSize)
  }, [])

  const handleCommand = useCallback((command: CommandTool) => {
    switch (command) {
      case 'text':
        const textId = shapeActions.createText({ x: 1080, y: 1920 }, '새 텍스트')
        undoRedoActions.recordCreateShape(shapes.find(s => s.id === textId)!)
        setTool('select')
        break
      case 'image':
        // 파일 선택 대화상자 열기
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          if (file) {
            const reader = new FileReader()
            reader.onload = (event) => {
              const imageSrc = event.target?.result as string
              if (imageSrc) {
                const imageId = shapeActions.createImage({ x: 1080, y: 1920 }, imageSrc)
                undoRedoActions.recordCreateShape(shapes.find(s => s.id === imageId)!)
                setTool('select')
              }
            }
            reader.readAsDataURL(file)
          }
        }
        input.click()
        break
      case 'save':
        storageActions.saveToFile()
        break
      case 'load':
        storageActions.loadFromFile()
        break
      case 'push':
        // Firebase 우선, 실패 시 localStorage 백업
        storageActions.pushToFirebase()
        break
      case 'pull':
        storageActions.pullFromStorage()
        break
      case 'undo':
        undoRedoActions.undo()
        break
      case 'redo':
        undoRedoActions.redo()
        break
      case 'settings':
        // 설정 대화상자에서 펜 색상과 크기를 변경할 수 있도록 함
        const newColor = prompt('펜 색상을 입력하세요 (예: #FF0000):', penColor)
        if (newColor) {
          setPenColor(newColor)
        }
        const newSize = prompt('펜 크기를 입력하세요 (1-20):', penSize.toString())
        if (newSize) {
          const size = parseInt(newSize)
          if (!isNaN(size) && size >= 1 && size <= 20) {
            setPenSize(size)
          }
        }
        break
    }
  }, [shapeActions, undoRedoActions, storageActions, shapes, penColor, penSize])

  const handleUpdateShape = useCallback((property: keyof Shape, value: any) => {
    if (!selectedId) return
    const beforeShape = shapes.find(s => s.id === selectedId)
    if (!beforeShape) return
    shapeActions.updateShapeProperty(selectedId, property, value)
    syncCallbacks.onUpdateShape?.(selectedId, property, value) // sync로 update
    setTimeout(() => {
      const afterShape = shapes.find(s => s.id === selectedId)
      if (afterShape) {
        undoRedoActions.recordUpdateShape(selectedId, beforeShape, afterShape)
      }
    }, 0)
  }, [selectedId, shapeActions, shapes, undoRedoActions, syncCallbacks])

  const handleDeleteShape = useCallback(() => {
    if (!selectedId) return
    undoRedoActions.recordDeleteShape(selectedId)
    shapeActions.deleteSelectedShape()
    const onDeleteShape = syncCallbacks?.onDeleteShape
    if (typeof onDeleteShape === 'function') {
      onDeleteShape(selectedId)
    }
  }, [selectedId, undoRedoActions, shapeActions, syncCallbacks])

  const handleDuplicateShape = useCallback(() => {
    if (!selectedId) return
    const beforeState = undoRedoActions.getCurrentState()
    shapeActions.duplicateShape(selectedId)
    setTimeout(() => {
      const afterState = undoRedoActions.getCurrentState()
      undoRedoActions.recordBatchAction(beforeState, afterState)
    }, 0)
  }, [selectedId, shapeActions, undoRedoActions])

  // 실시간 구독 (ViewPage와 동일)
  useEffect(() => {
    if (!isFirebaseAvailable()) return
    const unsubscribe = subscribeToSharedBoard((data) => {
      if (data.type === 'shapes') {
        setShapes(prev => mergeLWW(prev, data.shapes))
      } else if (data.type === 'strokes') {
        setStrokes(data.strokes)
      }
    }, (err) => {
      console.warn('[AdminPage] Firebase 실시간 구독 오류', err)
    })
    return () => unsubscribe()
  }, [])

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'relative', 
      backgroundColor: '#f5f5f5',
      margin: 0,
      padding: 0,
      overflow: 'hidden'
    }}>
      {/* 관리자 표시 */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '280px',
        zIndex: 1001,
        padding: '8px 16px',
        backgroundColor: '#007acc',
        color: 'white',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: 'bold'
      }}>
        관리자 화면
      </div>

      <Toolbar
        currentTool={tool}
        onToolChange={handleToolChange}
        onCommand={handleCommand}
        gridSize={gridSize}
        onGridSizeChange={handleGridSizeChange}
        penColor={penColor}
        onPenColorChange={setPenColor}
        penSize={penSize}
        onPenSizeChange={setPenSize}
        showGrid={showGrid}
        onShowGridChange={setShowGrid}
      />

      <PropertiesPanel
        selectedShape={selectedShape}
        onUpdateShape={handleUpdateShape}
        onDeleteShape={handleDeleteShape}
        onDuplicateShape={handleDuplicateShape}
        onBringToFront={shapeActions.bringToFront}
        onSendToBack={shapeActions.sendToBack}
        onMoveForward={shapeActions.moveForward}
        onMoveBackward={shapeActions.moveBackward}
      />

      {/* 캔버스 영역 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%'
      }}>
        <CanvasWrapper
          tool={tool}
          shapes={shapes}
          strokes={strokes}
          penColor={penColor}
          penSize={penSize}
          gridSize={gridSize}
          selectedId={selectedId}
          setShapes={setShapes}
          setStrokes={setStrokes}
          setSelectedId={setSelectedId}
          onToolChange={handleToolChange}
          showGrid={showGrid}
          userId="admin"
          onMoveShape={syncCallbacks.onMoveShape}
          onResizeShape={syncCallbacks.onResizeShape}
        />
      </div>
    </div>
  )
}

export default AdminPage 
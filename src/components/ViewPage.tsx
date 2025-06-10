import React, { useState, useCallback, useRef, useEffect } from 'react'
import { DrawingTool, Shape, Stroke } from '../types'
import { DEFAULT_PEN_COLOR, DEFAULT_PEN_SIZE, DEFAULT_GRID_SIZE } from '../utils/constants'
import CanvasWrapper from './CanvasWrapper'
import { useBoardStorage } from '../hooks/useBoardStorage'
import { isFirebaseAvailable, subscribeToSharedBoard, saveStrokesToFirebase, updateBoardData } from '../firebase'
import { createSyncCallbacks } from '../utils/syncUtils'

interface ToolbarState {
  x: number
  y: number
  width: number
  height: number
  opacity: number
}

// LWW 병합 함수 (CanvasWrapper에서 복사)
function mergeLWW<T extends { id: string; updatedAt?: number }>(localArr: T[], remoteArr: T[]): T[] {
  const map = new Map<string, T>()
  for (const item of localArr) {
    map.set(item.id, item)
  }
  for (const remote of remoteArr) {
    const local = map.get(remote.id)
    if (!local || (remote.updatedAt && (!local.updatedAt || remote.updatedAt > local.updatedAt))) {
      map.set(remote.id, remote)
    }
  }
  return Array.from(map.values())
}

const ViewPage: React.FC = () => {
  const [tool, setTool] = useState<DrawingTool>('select')
  const [shapes, setShapes] = useState<Shape[]>([])
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [penColor, setPenColor] = useState(DEFAULT_PEN_COLOR)
  const [penSize, setPenSize] = useState(DEFAULT_PEN_SIZE)
  const gridSize = DEFAULT_GRID_SIZE

  // 툴바 상태 (위치, 크기, 투명도)
  const [toolbarState, setToolbarState] = useState<ToolbarState>(() => {
    // localStorage에서 저장된 상태 복원
    const saved = localStorage.getItem('viewpage-toolbar-state')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.warn('Failed to parse toolbar state from localStorage')
      }
    }
    // 기본값
    return {
      x: 50,
      y: 50,
      width: 600,
      height: 80,
      opacity: 0.5
    }
  })

  // 드래그 상태
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })

  const toolbarRef = useRef<HTMLDivElement>(null)

  // 보드 저장/불러오기 훅 (자동 저장용)
  const storageActions = useBoardStorage({
    shapes,
    strokes,
    selectedId,
    setShapes,
    setStrokes,
    setSelectedId,
    silent: true
  })

  // 툴바 상태를 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('viewpage-toolbar-state', JSON.stringify(toolbarState))
  }, [toolbarState])

  // 화면 경계 내로 위치/크기 조정
  const constrainToScreen = useCallback((state: ToolbarState): ToolbarState => {
    const minWidth = 200
    const minHeight = 100
    const maxWidth = window.innerWidth - 20
    const maxHeight = window.innerHeight - 20

    let { x, y, width, height, opacity } = state

    // 크기 제한
    width = Math.max(minWidth, Math.min(width, maxWidth))
    height = Math.max(minHeight, Math.min(height, maxHeight))

    // 위치 제한
    x = Math.max(10, Math.min(x, window.innerWidth - width - 10))
    y = Math.max(10, Math.min(y, window.innerHeight - height - 10))

    return { x, y, width, height, opacity }
  }, [])

  // 툴바 드래그 시작
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (isResizing) return
    setIsDragging(true)
    setDragStart({
      x: e.clientX - toolbarState.x,
      y: e.clientY - toolbarState.y
    })
    e.preventDefault()
  }, [toolbarState.x, toolbarState.y, isResizing])

  // 리사이즈 시작
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    setIsResizing(true)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: toolbarState.width,
      height: toolbarState.height
    })
    e.preventDefault()
    e.stopPropagation()
  }, [toolbarState.width, toolbarState.height])

  // 마우스 이동 처리
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newState = {
          ...toolbarState,
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        }
        setToolbarState(newState)
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x
        const deltaY = e.clientY - resizeStart.y
        const newState = {
          ...toolbarState,
          width: resizeStart.width + deltaX,
          height: resizeStart.height + deltaY
        }
        setToolbarState(constrainToScreen(newState))
      }
    }

    const handleMouseUp = () => {
      if (isDragging || isResizing) {
        // 드래그/리사이즈 완료 시 화면 경계 체크
        setToolbarState(prev => constrainToScreen(prev))
        setIsDragging(false)
        setIsResizing(false)
      }
    }

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, dragStart, resizeStart, toolbarState, constrainToScreen])

  // 자동으로 현장 데이터 불러오기 (Firebase 없을 때만)
  React.useEffect(() => {
    if (!isFirebaseAvailable()) {
      console.log('[ViewPage] Firebase 미사용, localStorage에서 복원 시도')
      storageActions.pullFromStorage()
    }
  }, [storageActions])

  // 자동 저장 (변경 시마다 localStorage에 저장) - Firebase 환경에서는 불필요
  React.useEffect(() => {
    if (!isFirebaseAvailable()) {
      const timeoutId = setTimeout(() => {
        console.log('[ViewPage] localStorage 자동 저장 실행')
        storageActions.pushToStorage()
      }, 1000) // 1초 후 자동 저장

      return () => clearTimeout(timeoutId)
    }
  }, [shapes, strokes, storageActions])

  // Firebase 실시간 구독 (ViewPage에서만)
  useEffect(() => {
    if (!isFirebaseAvailable()) return
    const unsubscribe = subscribeToSharedBoard((data) => {
      if (data.type === 'shapes') {
        setShapes(prev => mergeLWW(prev, data.shapes))
      } else if (data.type === 'strokes') {
        setStrokes(data.strokes)
      }
    }, (err) => {
      console.warn('[ViewPage] Firebase 실시간 구독 오류', err)
    })
    return () => unsubscribe()
  }, [])

  const handleToolChange = useCallback((newTool: DrawingTool) => {
    // ViewPage에서는 pen, eraser, select 허용
    if (newTool === 'pen' || newTool === 'eraser' || newTool === 'select') {
      setTool(newTool)
    }
  }, [])

  // 실시간 write 콜백 구현
  const syncCallbacks = React.useMemo(() => createSyncCallbacks({
    onDrawEnd: () => {
      if (isFirebaseAvailable()) {
        saveStrokesToFirebase(strokes)
      }
    },
    onMoveShape: (shapeId: string, newPosition: { x: number; y: number }) => {
      if (isFirebaseAvailable()) {
        const userId = 'viewer'
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
        const userId = 'viewer'
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
        const userId = 'viewer'
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
        const userId = 'viewer'
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

  // const handleDeleteShape = (shapeId: string) => {
  //   if (syncCallbacks.onDeleteShape) {
  //     syncCallbacks.onDeleteShape(shapeId)
  //   }
  // }

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
          showGrid={false}
          userId="viewer"
          onMoveShape={syncCallbacks.onMoveShape}
          onResizeShape={syncCallbacks.onResizeShape}
        />
      </div>

      {/* 플로팅 툴바 */}
      <div
        ref={toolbarRef}
        style={{
          position: 'fixed',
          left: `${toolbarState.x}px`,
          top: `${toolbarState.y}px`,
          width: `${toolbarState.width}px`,
          height: `${toolbarState.height}px`,
          zIndex: 2000,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '12px',
          border: '1px solid rgba(221, 221, 221, 0.8)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(10px)',
          opacity: toolbarState.opacity,
          display: 'flex',
          flexDirection: 'column',
          userSelect: 'none'
        }}
      >
        {/* 드래그 헤더 */}
        <div
          style={{
            height: '24px',
            backgroundColor: 'rgba(0, 102, 255, 0.1)',
            borderRadius: '12px 12px 0 0',
            cursor: isDragging ? 'grabbing' : 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid rgba(221, 221, 221, 0.5)'
          }}
          onMouseDown={handleDragStart}
        >
          <div style={{
            width: '40px',
            height: '4px',
            backgroundColor: 'rgba(0, 102, 255, 0.3)',
            borderRadius: '2px'
          }}></div>
        </div>

        {/* 툴바 컨텐츠 */}
        <div style={{
          flex: 1,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {/* 도구 버튼들 */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {/* 선택 도구 */}
            <button
              onClick={() => handleToolChange('select')}
              style={{
                padding: '6px',
                border: tool === 'select' ? '2px solid #0066ff' : '1px solid rgba(204, 204, 204, 0.6)',
                borderRadius: '6px',
                backgroundColor: tool === 'select' ? 'rgba(240, 248, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '32px',
                minHeight: '32px'
              }}
              title="선택"
            >
              <span style={{ fontSize: '16px' }}>👆</span>
            </button>

            {/* 펜 도구 */}
            <button
              onClick={() => handleToolChange('pen')}
              style={{
                padding: '6px',
                border: tool === 'pen' ? '2px solid #0066ff' : '1px solid rgba(204, 204, 204, 0.6)',
                borderRadius: '6px',
                backgroundColor: tool === 'pen' ? 'rgba(240, 248, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '32px',
                minHeight: '32px'
              }}
              title="펜"
            >
              <span style={{ fontSize: '16px' }}>✏️</span>
            </button>

            {/* 지우개 도구 */}
            <button
              onClick={() => handleToolChange('eraser')}
              style={{
                padding: '6px',
                border: tool === 'eraser' ? '2px solid #0066ff' : '1px solid rgba(204, 204, 204, 0.6)',
                borderRadius: '6px',
                backgroundColor: tool === 'eraser' ? 'rgba(240, 248, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '32px',
                minHeight: '32px'
              }}
              title="지우개"
            >
              <span style={{ fontSize: '16px' }}>🧽</span>
            </button>
          </div>

          {/* 구분선 */}
          <div style={{ 
            width: '1px', 
            height: '25px', 
            backgroundColor: 'rgba(204, 204, 204, 0.6)' 
          }}></div>

          {/* 색상 설정 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#666' }}>색상:</label>
            <input
              type="color"
              value={penColor}
              onChange={(e) => setPenColor(e.target.value)}
              style={{ width: '28px', height: '20px', border: 'none', borderRadius: '3px' }}
            />
          </div>

          {/* 크기 설정 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#666' }}>크기:</label>
            <input
              type="range"
              min="1"
              max="20"
              value={penSize}
              onChange={(e) => setPenSize(Number(e.target.value))}
              style={{ width: '50px' }}
            />
            <span style={{ fontSize: '10px', fontWeight: 'bold', minWidth: '18px', color: '#666' }}>
              {penSize}
            </span>
          </div>

          {/* 구분선 */}
          <div style={{ 
            width: '1px', 
            height: '25px', 
            backgroundColor: 'rgba(204, 204, 204, 0.6)' 
          }}></div>

          {/* 투명도 설정 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <label style={{ fontSize: '8px', fontWeight: 'bold', color: '#666' }}>투명도</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={toolbarState.opacity}
                onChange={(e) => setToolbarState(prev => ({ ...prev, opacity: Number(e.target.value) }))}
                style={{ width: '50px' }}
              />
              <span style={{ fontSize: '9px', fontWeight: 'bold', minWidth: '25px', color: '#666' }}>
                {Math.round(toolbarState.opacity * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* 리사이즈 핸들 */}
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '16px',
            height: '16px',
            cursor: 'nw-resize',
            background: 'linear-gradient(-45deg, transparent 30%, rgba(0, 102, 255, 0.3) 30%, rgba(0, 102, 255, 0.3) 70%, transparent 70%)',
            borderRadius: '0 0 12px 0'
          }}
          onMouseDown={handleResizeStart}
        >
          <div style={{
            position: 'absolute',
            bottom: '2px',
            right: '2px',
            width: '12px',
            height: '12px',
            background: 'repeating-linear-gradient(-45deg, rgba(0, 102, 255, 0.2) 0px, rgba(0, 102, 255, 0.2) 2px, transparent 2px, transparent 4px)'
          }}></div>
        </div>
      </div>
    </div>
  )
}

export default ViewPage 
import React, { useRef, useEffect, useCallback } from 'react'
import { DrawingTool, Stroke } from '../types'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants'
import { clearCanvas, drawAllStrokes, drawStroke } from '../utils/canvasHelpers'
import { debounce } from '../utils/debounceThrottle'
import { updateBoardData } from '../firebase'
import { getDatabase, ref, get, set } from 'firebase/database'

interface DrawLayerProps {
  tool: DrawingTool
  penColor: string
  penSize: number
  strokes: Stroke[]
  setStrokes: React.Dispatch<React.SetStateAction<Stroke[]>>
  onDrawEnd?: () => void
}

const DrawLayer: React.FC<DrawLayerProps> = ({
  tool,
  penColor,
  penSize,
  strokes,
  setStrokes,
  onDrawEnd
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const currentStrokeRef = useRef<Stroke | null>(null)
  const debouncedSync = useRef(onDrawEnd ? debounce(onDrawEnd, 200) : undefined).current

  // 캔버스 초기화
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 캔버스 크기를 부모 요소에 맞춤
    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (!parent) return
      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  // 스트로크 그리기
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    strokes.forEach(stroke => drawStroke(ctx, stroke))
  }, [strokes])

  // 이벤트 핸들러
  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (tool !== 'pen' && tool !== 'eraser') return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top

    isDrawingRef.current = true
    currentStrokeRef.current = {
      id: Date.now().toString(),
      tool,
      color: tool === 'eraser' ? '#ffffff' : penColor,
      size: penSize,
      points: [{ x, y }],
      userId: (typeof (window as any).userId === 'string' ? (window as any).userId : 'anonymous'),
      updatedAt: Date.now(),
      updatedBy: (typeof (window as any).userId === 'string' ? (window as any).userId : 'anonymous'),
      isErasable: true
    }
  }, [tool, penColor, penSize])

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top

    currentStrokeRef.current.points.push({ x, y })
  }, [setStrokes])

  const handleEnd = useCallback(async () => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return

    isDrawingRef.current = false
    // points가 2개 이상일 때만 저장
    if (currentStrokeRef.current.points.length > 1) {
      setStrokes(prev => [...prev, currentStrokeRef.current!])
      // 실시간 DB에 strokes 경로가 없으면 먼저 빈 객체로 생성
      const db = getDatabase()
      const strokesRef = ref(db, '/sharedBoardData/strokes')
      const snapshot = await get(strokesRef)
      if (!snapshot.exists()) {
        await set(strokesRef, {})
      }
      updateBoardData({ [`strokes/${currentStrokeRef.current.id}`]: currentStrokeRef.current })
    }
    currentStrokeRef.current = null
    onDrawEnd?.()
  }, [onDrawEnd, setStrokes])

  // 마우스 이벤트 핸들러
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY)
  }, [handleStart])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY)
  }, [handleMove])

  const handleMouseUp = useCallback(() => {
    handleEnd()
  }, [handleEnd])

  // 터치 이벤트 핸들러
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    handleStart(touch.clientX, touch.clientY)
  }, [handleStart])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    handleMove(touch.clientX, touch.clientY)
  }, [handleMove])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    handleEnd()
  }, [handleEnd])

  // 스트로크 렌더링
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 캔버스 초기화
    clearCanvas(ctx)

    // 완성된 스트로크들 그리기
    drawAllStrokes(ctx, strokes)

    // 현재 그리고 있는 스트로크 그리기
    if (currentStrokeRef.current) {
      drawStroke(ctx, currentStrokeRef.current)
    }

    // ViewPage에서만 실시간 동기화
    if (debouncedSync) debouncedSync()
  }, [strokes, currentStrokeRef.current, debouncedSync])

  // 지우개로 스트로크 삭제 (포인트 기반)
  // const eraseAtPoint = useCallback((point: { x: number; y: number }, eraseRadius: number = 10) => {
  //   setStrokes(prev => prev.filter(stroke => {
  //     return !stroke.points.some(p => {
  //       const dx = p.x - point.x
  //       const dy = p.y - point.y
  //       return Math.sqrt(dx * dx + dy * dy) < eraseRadius
  //     })
  //   }))
  // }, [])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 2,
        pointerEvents: 'auto',
        touchAction: 'none' // 터치 이벤트가 브라우저 기본 동작을 방해하지 않도록 설정
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  )
}

export default DrawLayer 
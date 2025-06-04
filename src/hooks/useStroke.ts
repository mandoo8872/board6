import { useCallback, useRef } from 'react'
import { Stroke, Point, DrawingTool } from '../types'
import { isFirebaseAvailable, saveStrokesToFirebase } from '../firebase'

interface UseStrokeProps {
  setStrokes: (fn: (prev: Stroke[]) => Stroke[]) => void
  penColor: string
  penSize: number
}

export const useStroke = ({ setStrokes, penColor, penSize }: UseStrokeProps) => {
  const prevStrokesRef = useRef<Stroke[]>([])

  // 새 스트로크 시작
  const startStroke = useCallback((point: Point, tool: DrawingTool, userId: string) => {
    const now = Date.now()
    const newStroke: Stroke = {
      id: now.toString(),
      tool,
      points: [point],
      color: penColor,
      size: penSize,
      isErasable: true,
      updatedAt: now,
      updatedBy: userId,
      userId: userId
    }
    setStrokes(prev => {
      const next = [...(Array.isArray(prev) ? prev : []), newStroke]
      return next
    })
    return newStroke.id
  }, [penColor, penSize, setStrokes])

  // 현재 스트로크에 포인트 추가
  const addPointToStroke = useCallback((strokeId: string, point: Point) => {
    setStrokes(prev => {
      const next = Array.isArray(prev)
        ? prev.map(stroke =>
            stroke && stroke.id === strokeId
              ? { ...stroke, points: [...stroke.points, point], updatedAt: Date.now() }
              : stroke
          )
        : prev
      return next
    })
  }, [setStrokes])

  // 지우개로 스트로크 삭제 (포인트 기반)
  const eraseAtPoint = useCallback((point: Point, eraseRadius: number = 10) => {
    setStrokes(prev => {
      const strokesToErase = prev.filter(stroke => {
        if (!stroke.isErasable) return false
        return stroke.points.some(strokePoint => {
          const distance = Math.sqrt(
            Math.pow(strokePoint.x - point.x, 2) +
            Math.pow(strokePoint.y - point.y, 2)
          )
          return distance <= eraseRadius
        })
      })
      const next = prev.filter(stroke => !strokesToErase.some(s => s.id === stroke.id))
      return next
    })
  }, [setStrokes])

  // 모든 스트로크 삭제
  const clearAllStrokes = useCallback(() => {
    setStrokes(() => {
      return []
    })
  }, [setStrokes])

  // Undo 기능을 위한 마지막 스트로크 삭제
  const removeLastStroke = useCallback(() => {
    setStrokes(prev => {
      const next = prev.slice(0, -1)
      return next
    })
  }, [setStrokes])

  // 드래그 종료 시점에만 DB 저장 (prevStrokes와 현재 strokes를 함께 전달)
  const saveStrokesOnDrawEnd = useCallback((strokes: Stroke[]) => {
    if (isFirebaseAvailable()) {
      saveStrokesToFirebase(strokes, prevStrokesRef.current)
      prevStrokesRef.current = strokes
    }
  }, [])

  // 외부에서 saveStrokesOnDrawEnd를 사용할 수 있도록 반환
  return {
    startStroke,
    addPointToStroke,
    eraseAtPoint,
    clearAllStrokes,
    removeLastStroke,
    saveStrokesOnDrawEnd,
    prevStrokesRef
  }
} 
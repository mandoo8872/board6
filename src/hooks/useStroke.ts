import { useCallback } from 'react'
import { Stroke, Point, DrawingTool } from '../types'
import { isFirebaseAvailable, saveStrokesToFirebase } from '../firebase'

interface UseStrokeProps {
  setStrokes: (fn: (prev: Stroke[]) => Stroke[]) => void
  penColor: string
  penSize: number
}

export const useStroke = ({ setStrokes, penColor, penSize }: UseStrokeProps) => {
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
      if (isFirebaseAvailable()) saveStrokesToFirebase(next)
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
      if (isFirebaseAvailable()) saveStrokesToFirebase(next)
      return next
    })
  }, [setStrokes])

  // 지우개로 스트로크 삭제 (포인트 기반)
  const eraseAtPoint = useCallback((point: Point, eraseRadius: number = 10) => {
    setStrokes(prev => {
      console.log('[useStroke] 지우개 사용 전 strokes:', prev)
      // 지우개로 삭제할 stroke 찾기
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
      console.log('[useStroke] 삭제할 strokes:', strokesToErase)

      // 삭제할 stroke를 제외한 나머지 stroke만 유지
      const next = prev.filter(stroke => !strokesToErase.some(s => s.id === stroke.id))
      console.log('[useStroke] 지우개 사용 후 strokes:', next)

      if (isFirebaseAvailable()) {
        console.log('[useStroke] DB에 저장할 strokes:', next)
        saveStrokesToFirebase(next)
      }
      return next
    })
  }, [setStrokes])

  // 모든 스트로크 삭제
  const clearAllStrokes = useCallback(() => {
    setStrokes(() => {
      if (isFirebaseAvailable()) saveStrokesToFirebase([])
      return []
    })
  }, [setStrokes])

  // Undo 기능을 위한 마지막 스트로크 삭제
  const removeLastStroke = useCallback(() => {
    setStrokes(prev => {
      const next = prev.slice(0, -1)
      if (isFirebaseAvailable()) saveStrokesToFirebase(next)
      return next
    })
  }, [setStrokes])

  return {
    startStroke,
    addPointToStroke,
    eraseAtPoint,
    clearAllStrokes,
    removeLastStroke
  }
} 
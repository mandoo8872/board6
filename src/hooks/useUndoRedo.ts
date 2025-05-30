import { useState, useCallback } from 'react'
import { UndoRedoAction, BoardState, Shape, Stroke } from '../types'

interface UseUndoRedoProps {
  shapes: Shape[]
  strokes: Stroke[]
  selectedId: string | null
  setShapes: (fn: (prev: Shape[]) => Shape[]) => void
  setStrokes: (fn: (prev: Stroke[]) => Stroke[]) => void
  setSelectedId: (id: string | null) => void
}

const MAX_HISTORY_SIZE = 20

export const useUndoRedo = ({
  shapes,
  strokes,
  selectedId,
  setShapes,
  setStrokes,
  setSelectedId
}: UseUndoRedoProps) => {
  const [undoStack, setUndoStack] = useState<UndoRedoAction[]>([])
  const [redoStack, setRedoStack] = useState<UndoRedoAction[]>([])

  // 현재 상태 생성
  const getCurrentState = useCallback((): BoardState => ({
    shapes,
    strokes,
    selectedId
  }), [shapes, strokes, selectedId])

  // 액션 추가
  const addAction = useCallback((
    type: UndoRedoAction['type'],
    beforeState: Partial<BoardState>,
    afterState: Partial<BoardState>
  ) => {
    const action: UndoRedoAction = {
      id: Date.now().toString(),
      type,
      timestamp: Date.now(),
      beforeState,
      afterState
    }

    setUndoStack(prev => {
      const newStack = [...prev, action]
      // 최대 크기 제한
      if (newStack.length > MAX_HISTORY_SIZE) {
        return newStack.slice(-MAX_HISTORY_SIZE)
      }
      return newStack
    })

    // 새로운 액션이 추가되면 redo 스택 초기화
    setRedoStack([])
  }, [])

  // 상태 적용
  const applyState = useCallback((state: Partial<BoardState>) => {
    if (state.shapes !== undefined) {
      setShapes(() => state.shapes!)
    }
    if (state.strokes !== undefined) {
      setStrokes(() => state.strokes!)
    }
    if (state.selectedId !== undefined) {
      setSelectedId(state.selectedId)
    }
  }, [setShapes, setStrokes, setSelectedId])

  // Undo 실행
  const undo = useCallback(() => {
    if (undoStack.length === 0) return false

    const lastAction = undoStack[undoStack.length - 1]
    
    // 현재 상태를 redo 스택에 저장
    setRedoStack(prev => [...prev, {
      ...lastAction,
      beforeState: lastAction.afterState,
      afterState: lastAction.beforeState
    }])

    // undo 스택에서 제거
    setUndoStack(prev => prev.slice(0, -1))

    // 이전 상태 적용
    applyState(lastAction.beforeState)
    
    return true
  }, [undoStack, applyState])

  // Redo 실행
  const redo = useCallback(() => {
    if (redoStack.length === 0) return false

    const lastRedoAction = redoStack[redoStack.length - 1]
    
    // undo 스택에 다시 추가
    setUndoStack(prev => [...prev, {
      ...lastRedoAction,
      beforeState: lastRedoAction.afterState,
      afterState: lastRedoAction.beforeState
    }])

    // redo 스택에서 제거
    setRedoStack(prev => prev.slice(0, -1))

    // 다음 상태 적용
    applyState(lastRedoAction.afterState)
    
    return true
  }, [redoStack, applyState])

  // 셰이프 생성 액션 기록
  const recordCreateShape = useCallback((newShape: Shape) => {
    addAction(
      'CREATE_SHAPE',
      { shapes },
      { shapes: [...shapes, newShape] }
    )
  }, [shapes, addAction])

  // 셰이프 삭제 액션 기록
  const recordDeleteShape = useCallback((shapeId: string) => {
    const shapeToDelete = shapes.find(s => s.id === shapeId)
    if (!shapeToDelete) return

    addAction(
      'DELETE_SHAPE',
      { shapes, selectedId },
      { 
        shapes: shapes.filter(s => s.id !== shapeId),
        selectedId: null
      }
    )
  }, [shapes, selectedId, addAction])

  // 셰이프 업데이트 액션 기록
  const recordUpdateShape = useCallback((shapeId: string, _beforeShape: Shape, afterShape: Shape) => {
    addAction(
      'UPDATE_SHAPE',
      { shapes },
      { shapes: shapes.map(s => s.id === shapeId ? afterShape : s) }
    )
  }, [shapes, addAction])

  // 스트로크 생성 액션 기록
  const recordCreateStroke = useCallback((newStroke: Stroke) => {
    addAction(
      'CREATE_STROKE',
      { strokes },
      { strokes: [...strokes, newStroke] }
    )
  }, [strokes, addAction])

  // 스트로크 삭제 액션 기록 (지우개용)
  const recordDeleteStrokes = useCallback((deletedStrokes: Stroke[]) => {
    if (deletedStrokes.length === 0) return

    addAction(
      'DELETE_STROKE',
      { strokes },
      { strokes: strokes.filter(s => !deletedStrokes.some(ds => ds.id === s.id)) }
    )
  }, [strokes, addAction])

  // 배치 액션 기록 (복잡한 변경사항)
  const recordBatchAction = useCallback((beforeState: Partial<BoardState>, afterState: Partial<BoardState>) => {
    addAction('BATCH', beforeState, afterState)
  }, [addAction])

  // 히스토리 초기화
  const clearHistory = useCallback(() => {
    setUndoStack([])
    setRedoStack([])
  }, [])

  return {
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    undoStackSize: undoStack.length,
    redoStackSize: redoStack.length,
    undo,
    redo,
    recordCreateShape,
    recordDeleteShape,
    recordUpdateShape,
    recordCreateStroke,
    recordDeleteStrokes,
    recordBatchAction,
    clearHistory,
    getCurrentState
  }
} 
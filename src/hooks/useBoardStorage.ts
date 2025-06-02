import { useCallback } from 'react'
import { Shape, Stroke } from '../types'
import { saveBoardToFirebase } from '../firebase'

interface BoardStorageProps {
  shapes: Shape[]
  strokes: Stroke[]
  selectedId: string | null
  setShapes: (shapes: Shape[]) => void
  setStrokes: (strokes: Stroke[]) => void
  setSelectedId: (id: string | null) => void
  onClearHistory?: () => void
  silent?: boolean
}

interface BoardState {
  shapes: Shape[]
  strokes: Stroke[]
  selectedId: string | null
  timestamp: number
}

export const useBoardStorage = ({
  shapes,
  strokes,
  selectedId,
  setShapes,
  setStrokes,
  setSelectedId,
  onClearHistory,
  silent = false
}: BoardStorageProps) => {
  // 현재 보드 상태 가져오기
  const getCurrentBoardState = useCallback((): BoardState => {
    const state = {
      shapes,
      strokes,
      selectedId,
      timestamp: Date.now()
    }
    console.log('[useBoardStorage] getCurrentBoardState', state)
    return state
  }, [shapes, strokes, selectedId])

  // 보드 상태 복원
  const restoreBoardState = useCallback((boardState: BoardState) => {
    console.log('[useBoardStorage] restoreBoardState', boardState)
    setShapes(boardState.shapes || [])
    setStrokes(boardState.strokes || [])
    setSelectedId(boardState.selectedId || null)
    if (onClearHistory) {
      onClearHistory()
    }
  }, [setShapes, setStrokes, setSelectedId, onClearHistory])

  // localStorage에 저장
  const saveToLocalStorage = useCallback((boardState: BoardState, key: string = 'board-push-state') => {
    try {
      localStorage.setItem(key, JSON.stringify(boardState))
      console.log('[useBoardStorage] localStorage 저장 성공', key, boardState)
      return true
    } catch (error) {
      console.error('[useBoardStorage] localStorage 저장 실패:', error)
      return false
    }
  }, [])

  // localStorage에서 불러오기
  const loadFromLocalStorage = useCallback((key: string = 'board-push-state'): BoardState | null => {
    try {
      const saved = localStorage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved)
        console.log('[useBoardStorage] localStorage 불러오기 성공', key, parsed)
        return parsed
      }
    } catch (error) {
      console.error('[useBoardStorage] localStorage 불러오기 실패:', error)
    }
    return null
  }, [])

  // 파일로 저장
  const saveToFile = useCallback(() => {
    const boardState = getCurrentBoardState()
    const dataStr = JSON.stringify(boardState, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(dataBlob)
    link.download = `board-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
    link.click()
    
    if (!silent) {
      alert('보드가 파일로 저장되었습니다.')
    }
  }, [getCurrentBoardState, silent])

  // 파일에서 불러오기
  const loadFromFile = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          try {
            const boardState = JSON.parse(event.target?.result as string)
            restoreBoardState(boardState)
            if (!silent) {
              alert('보드가 파일에서 불러와졌습니다.')
            }
          } catch (error) {
            console.error('파일 파싱 실패:', error)
            alert('올바르지 않은 파일 형식입니다.')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }, [restoreBoardState, silent])

  // Firebase에 현재 상태 저장 (관리자 → Firebase)
  const pushToFirebase = useCallback(async () => {
    const boardState = getCurrentBoardState()
    console.log('[useBoardStorage] pushToFirebase 호출', boardState)
    const success = await saveBoardToFirebase(boardState)
    
    if (success) {
      if (!silent) {
        alert('✅ 현장으로 전송되었습니다.')
      }
      console.log('[useBoardStorage] Firebase 푸시 성공')
    } else {
      // Firebase 실패 시 localStorage 백업
      saveToLocalStorage(boardState, 'board-push-state')
      if (!silent) {
        alert('⚠️ Firebase 연결 실패. 로컬에 임시 저장되었습니다.')
      }
      console.warn('[useBoardStorage] Firebase 실패, localStorage에 백업')
    }
  }, [getCurrentBoardState, silent, saveToLocalStorage])

  // localStorage 기반 push/pull (Firebase 백업용)
  const pushToStorage = useCallback(() => {
    const boardState = getCurrentBoardState()
    saveToLocalStorage(boardState, 'board-push-state')
    if (!silent) {
      alert('관리자 상태가 저장되었습니다.')
    }
    console.log('[useBoardStorage] pushToStorage 호출', boardState)
  }, [getCurrentBoardState, saveToLocalStorage, silent])

  const pullFromStorage = useCallback(() => {
    const boardState = loadFromLocalStorage('board-push-state')
    if (boardState) {
      restoreBoardState(boardState)
      if (!silent) {
        alert('관리자 상태를 불러왔습니다.')
      }
      console.log('[useBoardStorage] pullFromStorage 성공', boardState)
    } else {
      if (!silent) {
        alert('저장된 관리자 상태가 없습니다.')
      }
      console.warn('[useBoardStorage] pullFromStorage: 저장된 상태 없음')
    }
  }, [loadFromLocalStorage, restoreBoardState, silent])

  return {
    // 파일 저장/불러오기
    saveToFile,
    loadFromFile,
    
    // Firebase 실시간 동기화
    pushToFirebase,
    
    // localStorage 기반 (백업용)
    pushToStorage,
    pullFromStorage,
    
    // 유틸리티
    getCurrentBoardState,
    restoreBoardState,
    saveToLocalStorage,
    loadFromLocalStorage
  }
} 
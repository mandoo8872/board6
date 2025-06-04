import { Shape } from '../types'
import { isFirebaseAvailable, updateBoardData, saveStrokesToFirebase } from '../firebase'

export interface SyncCallbacks {
  onDrawEnd?: () => void
  onMoveShape?: (shapeId: string, newPosition: { x: number; y: number }) => void
  onResizeShape?: (shapeId: string, newSize: { width: number; height: number; x?: number; y?: number }) => void
  onUpdateShape?: (shapeId: string, property: keyof Shape, value: any) => void
  onDeleteShape?: (shapeId: string) => void
}

/**
 * 동기화 콜백을 생성하는 함수
 * @param callbacks 동기화 콜백 함수들
 * @returns 동기화된 콜백 함수들
 */
export const createSyncCallbacks = (callbacks: SyncCallbacks) => {
  return {
    onDrawEnd: callbacks.onDrawEnd,
    onMoveShape: callbacks.onMoveShape,
    onResizeShape: callbacks.onResizeShape,
    onUpdateShape: callbacks.onUpdateShape,
    onDeleteShape: callbacks.onDeleteShape
  }
}

/**
 * Firebase에 데이터를 업데이트하는 함수
 * @param path 업데이트할 경로
 * @param data 업데이트할 데이터
 */
export function syncToFirebase(path: string, data: any) {
  if (!isFirebaseAvailable()) return
  
  try {
    updateBoardData({ [path]: data })
  } catch (error) {
    console.error('[Sync] Firebase 업데이트 실패:', error)
  }
}

/**
 * Firebase에 스트로크를 저장하는 함수
 * @param strokes 저장할 스트로크 배열
 */
export function syncStrokesToFirebase(strokes: any[]) {
  if (!isFirebaseAvailable()) return
  
  try {
    saveStrokesToFirebase(strokes)
  } catch (error) {
    console.error('[Sync] 스트로크 저장 실패:', error)
  }
}

// LWW 병합 함수 (Last Write Wins)
export function mergeLWW<T extends { id: string; updatedAt?: number; deleted?: boolean }>(localArr: T[], remoteArr: T[]): T[] {
  const map = new Map<string, T>()
  for (const item of localArr) {
    if (!item.id || !item.updatedAt) continue
    map.set(item.id, item)
  }
  for (const remote of remoteArr) {
    if (!remote.id || !remote.updatedAt) continue
    const local = map.get(remote.id)
    // tombstone(삭제) 처리
    if (remote.deleted) {
      if (!local || (remote.updatedAt && (!local.updatedAt || remote.updatedAt > local.updatedAt))) {
        map.delete(remote.id)
      }
      continue
    }
    if (!local || (remote.updatedAt && (!local.updatedAt || remote.updatedAt > local.updatedAt))) {
      map.set(remote.id, remote)
    }
  }
  return Array.from(map.values())
} 
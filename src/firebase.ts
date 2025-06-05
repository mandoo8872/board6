// Firebase 초기화 및 DB 참조
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, onValue, set, update, off, DatabaseReference, DataSnapshot } from 'firebase/database'

// 환경변수 기반 설정
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

export { db }

// Firebase 사용 가능 여부 확인
export const isFirebaseAvailable = (): boolean => {
  const available = !!db && !!firebaseConfig.apiKey && !!firebaseConfig.databaseURL
  if (!available) {
    console.warn('[firebase.ts] Firebase 사용 불가: 환경변수 누락 또는 db 미초기화')
  }
  return available
}

// /sharedBoardData 경로 참조
export const getSharedBoardRef = (): DatabaseReference => {
  return ref(db, '/sharedBoardData')
}

// 실시간 구독 (ViewPage에서 사용)
export const subscribeToSharedBoard = (
  onData: (data: any) => void,
  onError?: (err: any) => void
): (() => void) => {
  // shapes만 구독
  const shapesRef = ref(db, '/sharedBoardData/shapes')
  const strokesRef = ref(db, '/sharedBoardData/strokes')

  const shapesUnsub = onValue(shapesRef, (snapshot) => {
    const shapes = snapshot.val()
    if (shapes) {
      onData({ type: 'shapes', shapes: Object.values(shapes) })
    }
  }, (error) => {
    console.error('❌ [firebase.ts] shapes 실시간 구독 오류:', error)
    if (onError) onError(error)
  })

  const strokesUnsub = onValue(strokesRef, (snapshot) => {
    const strokes = snapshot.val()
    if (strokes) {
      onData({ type: 'strokes', strokes: Object.values(strokes) })
    }
  }, (error) => {
    console.error('❌ [firebase.ts] strokes 실시간 구독 오류:', error)
    if (onError) onError(error)
  })

  return () => {
    off(shapesRef)
    off(strokesRef)
    shapesUnsub()
    strokesUnsub()
  }
}

// 필기(Stroke) 저장 (onDrawEnd)
export const saveStrokesToFirebase = async (strokes: any[], prevStrokes: any[] = []) => {
  try {
    const updates: Record<string, any> = {}
    const currentIds = new Set(strokes.map((s: any) => s.id))
    const prevIds = new Set(prevStrokes.map((s: any) => s.id))
    // 삭제된 id 추적
    for (const id of prevIds) {
      if (!currentIds.has(id)) {
        updates[`/sharedBoardData/strokes/${id}`] = null
      }
    }
    // 나머지는 update
    for (const stroke of strokes) {
      updates[`/sharedBoardData/strokes/${stroke.id}`] = stroke
    }
    await update(ref(db), updates)
    console.log('[firebase.ts] 필기 저장 update (부분, 삭제 포함)', updates)
  } catch (error) {
    console.error('[firebase.ts] 필기 저장 실패:', error)
  }
}

// 객체 이동/크기조절/속성변경 등 update
export const updateBoardData = async (patch: any) => {
  try {
    // 모든 객체의 속성 변경을 동기화
    const newPatch: any = {}
    for (const key in patch) {
      if (key.startsWith('shapes/')) {
        const shapeId = key.split('/')[1]
        const property = key.split('/')[2]
        const value = patch[key]
        
        // 전체 객체 업데이트가 필요한 경우
        if (property === undefined && value && typeof value === 'object') {
          newPatch[key] = value
        } else {
          // 개별 속성 업데이트
          newPatch[key] = value
        }
      } else {
        newPatch[key] = patch[key]
      }
    }
    const boardRef = getSharedBoardRef()
    console.log('[firebase.ts] 데이터 update', newPatch)
    await update(boardRef, newPatch)
  } catch (error) {
    console.error('[firebase.ts] 데이터 update 실패:', error)
  }
}

// 보드 데이터 참조 가져오기
export const getBoardRef = (boardId: string = 'mainBoard'): DatabaseReference => {
  return ref(db, `boards/${boardId}`)
}

// 보드 상태를 Firebase에 저장
export const saveBoardToFirebase = async (boardState: any, boardId: string = 'mainBoard'): Promise<boolean> => {
  try {
    // shapes, strokes가 배열이면 객체로 변환
    let shapes = boardState.shapes
    let strokes = boardState.strokes
    if (Array.isArray(shapes)) {
      shapes = Object.fromEntries(shapes.map((s: any) => [s.id, s]))
    }
    if (Array.isArray(strokes)) {
      strokes = Object.fromEntries(strokes.map((s: any) => [s.id, s]))
    }
    const boardRef = getBoardRef(boardId)
    await set(boardRef, {
      ...boardState,
      shapes,
      strokes,
      lastUpdated: Date.now(),
      updatedBy: 'admin'
    })
    console.log('✅ [firebase.ts] Firebase에 보드 상태 저장 성공')
    return true
  } catch (error) {
    console.error('❌ [firebase.ts] Firebase 저장 실패:', error)
    return false
  }
}

// Firebase에서 보드 상태 실시간 구독
export const subscribeToBoardChanges = (
  callback: (boardState: any) => void,
  boardId: string = 'mainBoard'
): (() => void) => {
  const boardRef = getBoardRef(boardId)
  const unsubscribe = onValue(boardRef, (snapshot: DataSnapshot) => {
    const data = snapshot.val()
    if (data) {
      console.log('🔄 [firebase.ts] Firebase에서 보드 상태 업데이트 수신', data)
      callback(data)
    } else {
      console.warn('⚠️ [firebase.ts] Firebase에서 빈 데이터 수신')
    }
  }, (error) => {
    console.error('❌ [firebase.ts] Firebase 구독 오류:', error)
  })

  return () => {
    off(boardRef)
    unsubscribe()
  }
} 

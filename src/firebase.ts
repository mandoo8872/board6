// Firebase 초기화 및 DB 참조
import { initializeApp, FirebaseApp } from 'firebase/app'
import { getDatabase, ref, onValue, set, off, Database, DatabaseReference, DataSnapshot } from 'firebase/database'

const env = (import.meta as any).env

const firebaseConfig = {
  apiKey: env?.VITE_FIREBASE_API_KEY as string,
  authDomain: env?.VITE_FIREBASE_AUTH_DOMAIN as string,
  databaseURL: env?.VITE_FIREBASE_DATABASE_URL as string,
  projectId: env?.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: env?.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: env?.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: env?.VITE_FIREBASE_APP_ID as string,
}

// Firebase가 정상적으로 설정되었는지 확인
const isFirebaseConfigured = Object.values(firebaseConfig).every(value => value && value !== 'undefined')

let app: FirebaseApp | null = null
let db: Database | null = null

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig)
    db = getDatabase(app)
    console.log('✅ Firebase 초기화 성공')
  } catch (error) {
    console.warn('⚠️ Firebase 초기화 실패:', error)
  }
} else {
  console.warn('⚠️ Firebase 환경변수가 설정되지 않음. localStorage만 사용됩니다.')
}

export { db }

// 보드 데이터 참조 가져오기
export const getBoardRef = (boardId: string = 'mainBoard'): DatabaseReference | null => {
  if (!db) return null
  return ref(db, `boards/${boardId}`)
}

// Firebase가 사용 가능한지 확인
export const isFirebaseAvailable = (): boolean => {
  return !!db && isFirebaseConfigured
}

// 보드 상태를 Firebase에 저장
export const saveBoardToFirebase = async (boardState: any, boardId: string = 'mainBoard'): Promise<boolean> => {
  if (!isFirebaseAvailable()) {
    console.warn('Firebase를 사용할 수 없습니다. localStorage만 사용됩니다.')
    return false
  }

  try {
    const boardRef = getBoardRef(boardId)
    if (boardRef) {
      await set(boardRef, {
        ...boardState,
        lastUpdated: Date.now(),
        updatedBy: 'admin'
      })
      console.log('✅ Firebase에 보드 상태 저장 성공')
      return true
    }
  } catch (error) {
    console.error('❌ Firebase 저장 실패:', error)
    return false
  }
  return false
}

// Firebase에서 보드 상태 실시간 구독
export const subscribeToBoardChanges = (
  callback: (boardState: any) => void,
  boardId: string = 'mainBoard'
): (() => void) | null => {
  if (!isFirebaseAvailable()) {
    console.warn('Firebase를 사용할 수 없습니다.')
    return null
  }

  const boardRef = getBoardRef(boardId)
  if (!boardRef) return null

  const unsubscribe = onValue(boardRef, (snapshot: DataSnapshot) => {
    const data = snapshot.val()
    if (data) {
      console.log('🔄 Firebase에서 보드 상태 업데이트 수신')
      callback(data)
    }
  }, (error) => {
    console.error('❌ Firebase 구독 오류:', error)
  })

  return () => {
    off(boardRef)
    unsubscribe()
  }
} 
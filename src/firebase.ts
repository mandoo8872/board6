// Firebase 초기화 및 DB 참조
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, onValue, set, off, DatabaseReference, DataSnapshot } from 'firebase/database'

// 환경변수 기반 설정
const firebaseConfig = {
  apiKey: "AIzaSyBF1sBC8tegqpQzlhZDkfRyCkG1N-RqHZM",
  authDomain: "board6-a2c5a.firebaseapp.com",
  databaseURL: "https://board6-a2c5a-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "board6-a2c5a",
  storageBucket: "board6-a2c5a.appspot.com",
  messagingSenderId: "192957529739",
  appId: "1:192957529739:web:9c317aa3344e1824d89e8e",
  measurementId: "G-GS9NWB8PYP"
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

// 보드 데이터 참조 가져오기
export const getBoardRef = (boardId: string = 'mainBoard'): DatabaseReference => {
  return ref(db, `boards/${boardId}`)
}

// 보드 상태를 Firebase에 저장
export const saveBoardToFirebase = async (boardState: any, boardId: string = 'mainBoard'): Promise<boolean> => {
  try {
    const boardRef = getBoardRef(boardId)
    await set(boardRef, {
      ...boardState,
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

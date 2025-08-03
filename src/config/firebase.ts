import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from "firebase/analytics";

// 개발환경용 Firebase 설정 (board6-dev)
const developmentConfig = {
  apiKey: "AIzaSyCy37FNEfuORjN0AxpjqtwdKoQzGqfG8Ww",
  authDomain: "board6-dev.firebaseapp.com",
  databaseURL: "https://board6-dev-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "board6-dev",
  storageBucket: "board6-dev.firebasestorage.app",
  messagingSenderId: "851964244941",
  appId: "1:851964244941:web:5e4af7c4a93198d94f0a84"
  // 개발환경에서는 measurementId 없음
};

// 배포환경용 Firebase 설정 (board6-a2c5a)
const productionConfig = {
  apiKey: "AIzaSyBF1sBC8tegqpQzlhZDkfRyCkG1N-RqHZM",
  authDomain: "board6-a2c5a.firebaseapp.com",
  databaseURL: "https://board6-a2c5a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "board6-a2c5a",
  storageBucket: "board6-a2c5a.firebasestorage.app",
  messagingSenderId: "192957529739",
  appId: "1:192957529739:web:9c317aa3344e1824d89e8e",
  measurementId: "G-GS9NWB8PYP"
};

// 환경에 따른 Firebase 설정 선택
const getFirebaseConfig = () => {
  const isDevelopment = import.meta.env.MODE === 'development';
  
  if (isDevelopment) {
    console.log('🔧 Firebase: 개발환경 (board6-dev) 사용');
    return developmentConfig;
  } else {
    console.log('🚀 Firebase: 배포환경 (board6-a2c5a) 사용');
    return productionConfig;
  }
};

// 선택된 설정으로 Firebase 초기화
const config = getFirebaseConfig();

// 이미 초기화된 앱이 있으면 재사용
const app = getApps().length === 0 ? initializeApp(config) : getApp();

// Analytics 초기화 (배포환경에서만)
let analytics: any = null;
if (config.measurementId && typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
    console.log('📊 Firebase Analytics 초기화 완료');
  } catch (error) {
    console.warn('⚠️ Firebase Analytics 초기화 실패:', error);
  }
}

// Firebase Realtime Database 초기화
export const database = getDatabase(app);

// Analytics export (배포환경에서만 사용 가능)
export { analytics };

// 현재 환경 정보 export (디버깅용)
export const firebaseEnv = {
  mode: import.meta.env.MODE,
  isDevelopment: import.meta.env.MODE === 'development',
  projectId: config.projectId,
  databaseURL: config.databaseURL
};

console.log(`🔥 Firebase 초기화 완료:`, {
  환경: firebaseEnv.mode,
  프로젝트: firebaseEnv.projectId,
  데이터베이스: firebaseEnv.databaseURL
});

export default app;
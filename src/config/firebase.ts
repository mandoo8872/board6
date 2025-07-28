import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from "firebase/analytics";

// board6 백업/개발/테스트용 Firebase 설정
// board6prod와 board6dev 모두 동일한 프로젝트 사용
const config = {
  apiKey: "AIzaSyBF1sBC8tegqpQzlhZDkfRyCkG1N-RqHZM",
  authDomain: "board6-a2c5a.firebaseapp.com",
  databaseURL: "https://board6-a2c5a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "board6-a2c5a",
  storageBucket: "board6-a2c5a.firebasestorage.app",
  messagingSenderId: "192957529739",
  appId: "1:192957529739:web:9c317aa3344e1824d89e8e",
  measurementId: "G-GS9NWB8PYP"
};

// 이미 초기화된 앱이 있으면 재사용
const app = getApps().length === 0 ? initializeApp(config) : getApp();

// Analytics 초기화 (선택사항)
export const analytics = getAnalytics(app);

// Firebase 서비스 초기화 (Realtime Database만 사용)
export const database = getDatabase(app);

export default app; 
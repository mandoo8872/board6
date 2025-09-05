import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInAnonymously, deleteUser, User } from 'firebase/auth';

// Firebase 설정 인터페이스 (measurementId는 선택적)
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string; // 선택적 속성
}

// 환경변수에서 Firebase 설정 가져오기
const getFirebaseConfig = (): FirebaseConfig => {
  const isDevelopment = import.meta.env.MODE === 'development';
  
  // 환경변수 디버깅
  console.log('🔍 환경변수 디버깅:', {
    MODE: import.meta.env.MODE,
    isDevelopment: isDevelopment,
    VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY ? '설정됨' : 'undefined',
    VITE_FIREBASE_DATABASE_URL: import.meta.env.VITE_FIREBASE_DATABASE_URL ? '설정됨' : 'undefined',
  });

  // 환경변수가 없으면 하드코딩된 설정 사용
  if (!import.meta.env.VITE_FIREBASE_API_KEY) {
    console.log('⚠️ 환경변수가 로드되지 않아 하드코딩된 설정을 사용합니다.');
    
    if (isDevelopment) {
      console.log('🔧 Firebase: 개발환경 (board6-dev) 하드코딩 설정 사용');
      return {
        apiKey: "AIzaSyCy37FNEfuORjN0AxpjqtwdKoQzGqfG8Ww",
        authDomain: "board6-dev.firebaseapp.com",
        databaseURL: "https://board6-dev-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "board6-dev",
        storageBucket: "board6-dev.firebasestorage.app",
        messagingSenderId: "851964244941",
        appId: "1:851964244941:web:5e4af7c4a93198d94f0a84"
      };
    } else {
      console.log('🚀 Firebase: 배포환경 (board6-main) 하드코딩 설정 사용');
      return {
        apiKey: "AIzaSyBF1sBC8tegqpQzlhZDkfRyCkG1N-RqHZM",
        authDomain: "board6-a2c5a.firebaseapp.com",
        databaseURL: "https://board6-a2c5a-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "board6-a2c5a",
        storageBucket: "board6-a2c5a.firebasestorage.app",
        messagingSenderId: "192957529739",
        appId: "1:192957529739:web:9c317aa3344e1824d89e8e",
        measurementId: "G-GS9NWB8PYP"
      };
    }
  }

  // 환경변수가 있으면 환경변수 사용
  const config: FirebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  // measurementId가 있으면 추가
  if (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) {
    config.measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;
  }

  console.log('✅ Firebase 설정 완료 (환경변수 사용):', {
    projectId: config.projectId,
    databaseURL: config.databaseURL,
    authDomain: config.authDomain
  });

  return config;
};

// 선택된 설정으로 Firebase 초기화
const config = getFirebaseConfig();

// 환경 정보 로깅
const isDevelopment = import.meta.env.MODE === 'development';
if (isDevelopment) {
  console.log('🔧 Firebase: 개발환경 (board6-dev) 사용');
} else {
  console.log('🚀 Firebase: 배포환경 (board6-main) 사용');
}

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

// Firebase Auth 초기화
export const auth = getAuth(app);

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

// 익명 계정 참조 저장 (삭제를 위해)
let currentAnonymousUser: User | null = null;

/**
 * 보안 익명 로그인 함수
 * - Firebase Auth 익명 로그인 수행
 * - 브라우저 종료/새로고침 시 익명 계정 자동 삭제
 * - Admin/View 페이지에서 공통으로 사용
 */
export const secureAnonymousLogin = async (): Promise<void> => {
  try {
    if (import.meta.env.DEV) {
      console.log('🚀 Firebase Auth: 익명 로그인 시작');
      console.log('🔍 Firebase Auth: 현재 상태 확인 중...');
    }
    
    // 현재 사용자 상태 확인 (이 과정에서 accounts:lookup API 호출됨)
    if (auth.currentUser) {
      if (import.meta.env.DEV) {
        console.log('🔍 Firebase Auth: 기존 사용자 발견:', {
          uid: auth.currentUser.uid,
          isAnonymous: auth.currentUser.isAnonymous,
          providerId: auth.currentUser.providerId
        });
      }
      
      if (auth.currentUser.isAnonymous) {
        if (import.meta.env.DEV) {
          console.log('🔒 Firebase Auth: 이미 익명 로그인된 사용자 존재');
        }
        currentAnonymousUser = auth.currentUser;
        return;
      }
    } else {
      if (import.meta.env.DEV) {
        console.log('🔍 Firebase Auth: 기존 사용자 없음, 새로운 익명 로그인 시작');
      }
    }

    // 익명 로그인 수행
    if (import.meta.env.DEV) {
      console.log('🔄 Firebase Auth: signInAnonymously() 호출 중...');
    }
    
    const userCredential = await signInAnonymously(auth);
    currentAnonymousUser = userCredential.user;
    
    if (import.meta.env.DEV) {
      console.log('🔐 Firebase Auth: 익명 로그인 성공!', {
        uid: currentAnonymousUser.uid,
        isAnonymous: currentAnonymousUser.isAnonymous,
        providerId: currentAnonymousUser.providerId,
        tokenAvailable: !!currentAnonymousUser
      });
    }

    // Auth 상태가 완전히 설정될 때까지 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 100));

    // beforeunload 이벤트 리스너 등록 (브라우저 종료/새로고침 감지)
    const handleBeforeUnload = async () => {
      if (currentAnonymousUser) {
        try {
          // 익명 계정 삭제 (동기적으로 처리하려고 시도)
          await deleteUser(currentAnonymousUser);
          if (import.meta.env.DEV) {
            console.log('🗑️ Firebase Auth: 익명 계정 삭제 완료');
          }
        } catch (error) {
          // 삭제 실패 시 경고만 출력 (앱 흐름 유지)
          console.warn('⚠️ Firebase Auth: 익명 계정 삭제 실패:', error);
        }
      }
    };

    // 브라우저 종료/새로고침 이벤트 리스너 등록
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // pagehide 이벤트로 추가 보안 (실제 페이지 떠날 때만)
    const handlePageHide = async () => {
      if (currentAnonymousUser) {
        try {
          await deleteUser(currentAnonymousUser);
          if (import.meta.env.DEV) {
            console.log('🗑️ Firebase Auth: 페이지 완전히 떠남으로 익명 계정 삭제');
          }
        } catch (error) {
          console.warn('⚠️ Firebase Auth: 페이지 숨김 시 계정 삭제 실패:', error);
        }
      }
    };

    // pagehide는 페이지가 실제로 떠날 때만 발생 (탭 전환이나 최소화와 구분)
    window.addEventListener('pagehide', handlePageHide);

  } catch (error: any) {
    // 익명 로그인 실패 시 상세한 오류 분석
    console.error('❌ Firebase Auth: 익명 로그인 실패!', {
      error: error,
      code: error?.code,
      message: error?.message,
      customData: error?.customData
    });
    
    // 특정 오류 코드별 안내 메시지
    if (error?.code === 'auth/operation-not-allowed') {
      console.error('🔧 Firebase Console에서 Anonymous Authentication을 활성화해야 합니다!');
      console.error('📍 해결 방법: https://console.firebase.google.com/ > 프로젝트 선택 > Authentication > Sign-in method > Anonymous 활성화');
      console.error('🎯 현재 프로젝트:', firebaseEnv.projectId);
    } else if (error?.code === 'auth/api-key-not-valid') {
      console.error('🔑 Firebase API 키가 올바르지 않습니다:', config.apiKey);
    } else if (error?.code === 'auth/network-request-failed') {
      console.error('🌐 네트워크 연결 문제가 발생했습니다.');
    } else {
      console.error('🚨 예상치 못한 오류:', error?.code || 'UNKNOWN_ERROR');
      console.error('🔍 전체 오류 내용:', error);
    }
    
    // 현재 인증 상태 확인
    console.error('🔍 현재 Auth 상태:', {
      currentUser: auth.currentUser,
      appName: auth.app.name,
      config: {
        apiKey: config.apiKey.substring(0, 10) + '...',
        authDomain: config.authDomain,
        projectId: config.projectId
      }
    });
    
    // 오류가 발생해도 앱이 계속 동작할 수 있도록 함
    // RTDB 접근이 제한될 수 있지만 UI는 정상 표시됨
  }
};

/**
 * 현재 익명 사용자 정보 반환
 */
export const getCurrentAnonymousUser = (): User | null => {
  return currentAnonymousUser;
};

/**
 * 수동으로 익명 계정 삭제 (개발/디버깅용)
 */
export const deleteCurrentAnonymousUser = async (): Promise<void> => {
  if (currentAnonymousUser) {
    try {
      await deleteUser(currentAnonymousUser);
      currentAnonymousUser = null;
      if (import.meta.env.DEV) {
        console.log('🗑️ Firebase Auth: 수동 익명 계정 삭제 완료');
      }
    } catch (error) {
      console.warn('⚠️ Firebase Auth: 수동 계정 삭제 실패:', error);
    }
  }
};

export default app;
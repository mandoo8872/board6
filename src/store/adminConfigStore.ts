import { create } from 'zustand';
import { ref, onValue, set as firebaseSet, update as firebaseUpdate, push, remove, Unsubscribe } from 'firebase/database';
import { database, auth } from '../config/firebase';
import { TextObject, ImageObject, DrawObject, FloorImage, Settings, AdminSettings, ViewSettings } from '../types';
import { validateFirebaseUpdate } from '../utils/validation';
import { lwwUpdateTextObject, lwwUpdateImageObject, getCurrentSessionId } from '../utils/lww';
// import { lwwCreateDrawObject } from '../utils/lww'; // 현재 사용하지 않음

export interface AdminConfigStore {
  textObjects: TextObject[];
  imageObjects: ImageObject[];
  drawObjects: DrawObject[];
  floorImage: FloorImage | null;
  settings: Settings;
  isLoading: boolean;
  
  // Firebase 동기화
  initializeFirebaseListeners: () => void;
  cleanupFirebaseListeners: () => void;
  
  // TextObject 관리
  addTextObject: (obj: Omit<TextObject, 'id'>) => Promise<string>;
  addTextObjects: (objects: Omit<TextObject, 'id'>[]) => Promise<string[]>;
  updateTextObject: (id: string, updates: Partial<TextObject>) => Promise<void>;
  updateTextObjectsBatch: (updatesById: Record<string, Partial<TextObject>>) => Promise<void>;
  deleteTextObject: (id: string) => Promise<void>;
  deleteTextObjects: (ids: string[]) => Promise<void>;
  
  // ImageObject 관리
  addImageObject: (obj: Omit<ImageObject, 'id'>) => Promise<string>;
  updateImageObject: (id: string, updates: Partial<ImageObject>) => Promise<void>;
  deleteImageObject: (id: string) => Promise<void>;
  deleteImageObjects: (ids: string[]) => Promise<void>;
  
  // DrawObject 관리 (ViewPage에서만 생성, 여기서는 동기화만)
  deleteDrawObject: (id: string) => Promise<void>;
  
  // FloorImage 관리
  setFloorImage: (image: FloorImage) => Promise<void>;
  
  // Settings 관리
  updateSettings: (section: 'admin' | 'view', updates: Partial<AdminSettings | ViewSettings>) => Promise<void>;
  
  // 패스워드 관리
  initializePasswords: () => Promise<void>;
  updatePassword: (type: 'admin' | 'view', newPassword: string) => Promise<void>;
  getPassword: (type: 'admin' | 'view') => string;
}

export const useAdminConfigStore = create<AdminConfigStore>((set, get) => {
  // Firebase 리스너 해제 함수들을 저장할 배열
  let unsubscribeFunctions: Unsubscribe[] = [];

  return {
    textObjects: [],
    imageObjects: [],
    drawObjects: [],
    floorImage: null,
    settings: {
      admin: {
        autoToolSwitch: true,
        gridVisible: true,
        gridSize: 16,
        gridSnapEnabled: true,
        defaultFontSize: 16,
        defaultBoxWidth: 200,
        defaultBoxHeight: 60,
        objectCreationPosition: {
          x: 260,
          y: 950
        },
        defaultCheckboxSettings: {
          checkedColor: '#22c55e',
          uncheckedColor: '#f3f4f6',
          checkedBackgroundColor: '#ffffff',
          uncheckedBackgroundColor: '#ffffff',
          checkedBackgroundOpacity: 1,
          uncheckedBackgroundOpacity: 1
        },
        excelPasteSettings: {
          startPosition: { x: 100, y: 100 },
          cellWidth: 120,
          cellHeight: 40,
          fontSize: 14,
          fontColor: '#000000',
          backgroundColor: '#ffffff',
          maxRows: 50,
          maxCols: 50
        },
        passwords: {
          admin: '1004',
          view: '1004'
        }
      },
      view: {
        virtualKeyboardEnabled: true,
        touchMode: true,
      }
    },
    isLoading: false,
    
    initializeFirebaseListeners: () => {
      // 기존 리스너들 정리
      get().cleanupFirebaseListeners();
      
      set({ isLoading: true });
      
      let loadedCount = 0;
      const totalLoaders = 5; // textObjects, imageObjects, drawObjects, floorImage, settings
      
      const checkAllLoaded = () => {
        loadedCount++;
        if (import.meta.env.DEV) {
          console.log(`🔥 Firebase: Loaded ${loadedCount}/${totalLoaders} data types`);
        }
        if (loadedCount >= totalLoaders) {
          if (import.meta.env.DEV) {
            console.log('🔥 Firebase: All data loaded successfully');
          }
          set({ isLoading: false });
        }
      };

      // 성공/실패 카운터 분리
      let successCount = 0;
      let errorCount = 0;
      
      const checkSuccess = () => {
        successCount++;
        checkAllLoaded();
      };
      
      const checkError = (source: string, error: any) => {
        errorCount++;
        if (import.meta.env.DEV) {
          console.error(`❌ Firebase: ${source} 로드 실패:`, error);
        }
        checkAllLoaded();
      };

      // Firebase Auth 상태 상세 확인
      if (import.meta.env.DEV) {
        console.log('🔍 Firebase: Initializing listeners with auth state:', {
          currentUser: auth.currentUser?.uid,
          isAnonymous: auth.currentUser?.isAnonymous,
          authToken: auth.currentUser ? 'EXISTS' : 'NULL',
          authReady: !!auth.currentUser
        });
        
        // 인증 토큰 추가 검증
        if (auth.currentUser) {
          auth.currentUser.getIdToken().then(token => {
            console.log('🔑 Firebase: Auth token acquired:', token ? 'SUCCESS' : 'FAILED');
          }).catch(error => {
            console.error('❌ Firebase: Token acquisition failed:', error);
          });
        } else {
          console.error('❌ Firebase: No authenticated user found when initializing listeners');
        }
      }
      
      // TextObjects 리스너
      const textObjectsRef = ref(database, 'textObjects');
      const unsubscribeTextObjects = onValue(textObjectsRef, (snapshot) => {
        const data = snapshot.val();
        const textObjects = data ? Object.values(data) as TextObject[] : [];
        if (import.meta.env.DEV) {
          console.log(`📝 Loaded ${textObjects.length} text objects`);
        }
        set({ textObjects });
        checkSuccess();
      }, (error) => {
        checkError('TextObjects', error);
      });
      unsubscribeFunctions.push(unsubscribeTextObjects);
      
      // ImageObjects 리스너
      const imageObjectsRef = ref(database, 'imageObjects');
      const unsubscribeImageObjects = onValue(imageObjectsRef, (snapshot) => {
        const data = snapshot.val();
        const imageObjects = data ? Object.values(data) as ImageObject[] : [];
        if (import.meta.env.DEV) {
          console.log(`🖼️ Loaded ${imageObjects.length} image objects`);
        }
        set({ imageObjects });
        checkSuccess();
      }, (error) => {
        checkError('ImageObjects', error);
      });
      unsubscribeFunctions.push(unsubscribeImageObjects);
      
      // DrawObjects 리스너  
      const drawObjectsRef = ref(database, 'drawObjects');
      const unsubscribeDrawObjects = onValue(drawObjectsRef, (snapshot) => {
        const data = snapshot.val();
        const drawObjects = data ? Object.values(data) as DrawObject[] : [];
        if (import.meta.env.DEV) {
          console.log(`✏️ Loaded ${drawObjects.length} draw objects`);
        }
        set({ drawObjects });
        checkSuccess();
      }, (error) => {
        checkError('DrawObjects', error);
      });
      unsubscribeFunctions.push(unsubscribeDrawObjects);
      
      // FloorImage 리스너
      const floorImageRef = ref(database, 'floorImage');
      const unsubscribeFloorImage = onValue(floorImageRef, (snapshot) => {
        const floorImage = snapshot.val() as FloorImage | null;
        if (import.meta.env.DEV) {
          console.log(`🏠 Loaded floor image: ${floorImage ? 'YES' : 'NO'}`);
        }
        set({ floorImage });
        checkSuccess();
      }, (error) => {
        checkError('FloorImage', error);
      });
      unsubscribeFunctions.push(unsubscribeFloorImage);
      
      // Settings 리스너
      const settingsRef = ref(database, 'settings');
      const unsubscribeSettings = onValue(settingsRef, (snapshot) => {
        const settings = snapshot.val() as Settings;
        if (settings) {
          set({ settings });
        }
        if (import.meta.env.DEV) {
          console.log(`⚙️ Loaded settings`);
        }
        checkSuccess();
      }, (error) => {
        checkError('Settings', error);
      });
      unsubscribeFunctions.push(unsubscribeSettings);
    },
    
    cleanupFirebaseListeners: () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
      unsubscribeFunctions = [];
    },
    
    addTextObject: async (obj) => {
      const textObjectsRef = ref(database, 'textObjects');
      const newRef = push(textObjectsRef);
      const sessionId = getCurrentSessionId();
      const newObj: TextObject = {
        ...obj,
        id: newRef.key!,
        lastModified: Date.now(),
        modifiedBy: sessionId
      };
      await firebaseSet(newRef, newObj);
      return newRef.key!; // 새로 생성된 객체의 ID 반환
    },
    
    addTextObjects: async (objects) => {
      if (objects.length === 0) return [];
      
      const textObjectsRef = ref(database, 'textObjects');
      const sessionId = getCurrentSessionId();
      const timestamp = Date.now();
      
      // 모든 객체에 대해 Firebase key를 미리 생성
      const newRefs = objects.map(() => push(textObjectsRef));
      const newObjects: TextObject[] = objects.map((obj, index) => ({
        ...obj,
        id: newRefs[index].key!,
        lastModified: timestamp,
        modifiedBy: sessionId
      }));
      
      // Firebase batch update (merge) - 루트에서 경로 기반 업데이트
      const updates: Record<string, TextObject> = {};
      newObjects.forEach((obj) => {
        updates[`textObjects/${obj.id}`] = obj;
      });
      await firebaseUpdate(ref(database), updates);
      
      // 생성된 모든 ID 반환
      return newObjects.map(obj => obj.id);
    },
    
    updateTextObject: async (id, updates) => {
      const validatedUpdates = validateFirebaseUpdate(updates);
      const success = await lwwUpdateTextObject(id, validatedUpdates);
      if (!success) {
        console.warn(`Failed to update text object ${id} due to LWW conflict`);
        // 필요시 사용자에게 알림 표시
      }
    },

    // 여러 TextObject를 한 번의 네트워크 호출로 병합 업데이트
    updateTextObjectsBatch: async (updatesById) => {
      const ids = Object.keys(updatesById);
      if (ids.length === 0) return;

      // 경로 기반 업데이트 객체 구성
      const sessionId = getCurrentSessionId();
      const timestamp = Date.now();
      const rootUpdates: Record<string, any> = {};

      const flatten = (basePath: string, obj: any) => {
        Object.entries(obj).forEach(([key, value]) => {
          const path = `${basePath}/${key}`;
          if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            flatten(path, value);
          } else {
            rootUpdates[path] = value;
          }
        });
      };

      for (const id of ids) {
        const validated = validateFirebaseUpdate(updatesById[id]);
        // 개별 필드들에 대해 경로 기반으로 업데이트 구성
        flatten(`textObjects/${id}`, { ...validated, lastModified: timestamp, modifiedBy: sessionId });
      }

      await firebaseUpdate(ref(database), rootUpdates);
    },
    
    deleteTextObject: async (id) => {
      const objectRef = ref(database, `textObjects/${id}`);
      await remove(objectRef);
    },
    
    deleteTextObjects: async (ids) => {
      if (ids.length === 0) return;
      
      if (ids.length === 1) {
        // 단일 객체는 기존 함수 사용
        await get().deleteTextObject(ids[0]);
        return;
      }
      
      // Firebase batch delete (merge) - 루트에서 경로 기반 삭제
      const updates: Record<string, null> = {};
      ids.forEach((id) => {
        updates[`textObjects/${id}`] = null; // Firebase update에서 null은 해당 경로 삭제
      });
      await firebaseUpdate(ref(database), updates);
    },
    
    addImageObject: async (obj) => {
      const imageObjectsRef = ref(database, 'imageObjects');
      const newRef = push(imageObjectsRef);
      const sessionId = getCurrentSessionId();
      const newObj: ImageObject = {
        ...obj,
        id: newRef.key!,
        lastModified: Date.now(),
        modifiedBy: sessionId
      };
      await firebaseSet(newRef, newObj);
      return newRef.key!; // 새로 생성된 객체의 ID 반환
    },
    
    updateImageObject: async (id, updates) => {
      const validatedUpdates = validateFirebaseUpdate(updates);
      const success = await lwwUpdateImageObject(id, validatedUpdates);
      if (!success) {
        console.warn(`Failed to update image object ${id} due to LWW conflict`);
        // 필요시 사용자에게 알림 표시
      }
    },
    
    deleteImageObject: async (id) => {
      const objectRef = ref(database, `imageObjects/${id}`);
      await remove(objectRef);
    },
    
    deleteImageObjects: async (ids) => {
      if (ids.length === 0) return;
      
      if (ids.length === 1) {
        // 단일 객체는 기존 함수 사용
        await get().deleteImageObject(ids[0]);
        return;
      }
      
      // Firebase batch delete (merge) - 루트에서 경로 기반 삭제
      const updates: Record<string, null> = {};
      ids.forEach((id) => {
        updates[`imageObjects/${id}`] = null;
      });
      await firebaseUpdate(ref(database), updates);
    },
    
    deleteDrawObject: async (id) => {
      const objectRef = ref(database, `drawObjects/${id}`);
      await remove(objectRef);
    },
    
    setFloorImage: async (image) => {
      const floorImageRef = ref(database, 'floorImage');
      await firebaseSet(floorImageRef, image);
    },
    
    updateSettings: async (section, updates) => {
      const settingsRef = ref(database, `settings/${section}`);
      const currentSettings = get().settings[section];
      await firebaseSet(settingsRef, { ...currentSettings, ...updates });
    },

    // 패스워드 초기화 (DB만 사용, 환경변수 의존성 제거)
    initializePasswords: async () => {
      // 더 이상 환경변수를 사용하지 않음
      // DB에 패스워드가 없는 경우에만 기본값 설정
      const currentState = get();
      const currentPasswords = currentState.settings.admin.passwords;
      
      if (import.meta.env.DEV) {
        console.log('🔑 Password initialization: DB-only mode');
        console.log('🔑 Current passwords:', currentPasswords);
      }
    },

    // 패스워드 업데이트
    updatePassword: async (type, newPassword) => {
      if (!newPassword || newPassword.length !== 4 || !/^\d{4}$/.test(newPassword)) {
        throw new Error('패스워드는 4자리 숫자여야 합니다.');
      }

      const currentState = get();
      const currentPasswords = currentState.settings.admin.passwords;
      
      await get().updateSettings('admin', {
        passwords: {
          ...currentPasswords,
          [type]: newPassword
        }
      });

      if (import.meta.env.DEV) {
        console.log(`🔑 ${type.toUpperCase()} password updated successfully`);
      }
    },

    // 패스워드 조회
    getPassword: (type) => {
      const currentState = get();
      return currentState.settings.admin.passwords[type] || '1004';
    },
  };
}); 
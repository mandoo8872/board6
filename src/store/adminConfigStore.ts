import { create } from 'zustand';
import { ref, onValue, set as firebaseSet, push, remove, Unsubscribe } from 'firebase/database';
// import { update } from 'firebase/database'; // 현재 사용하지 않음
import { database } from '../config/firebase';
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
  updateTextObject: (id: string, updates: Partial<TextObject>) => Promise<void>;
  deleteTextObject: (id: string) => Promise<void>;
  
  // ImageObject 관리
  addImageObject: (obj: Omit<ImageObject, 'id'>) => Promise<string>;
  updateImageObject: (id: string, updates: Partial<ImageObject>) => Promise<void>;
  deleteImageObject: (id: string) => Promise<void>;
  
  // DrawObject 관리 (ViewPage에서만 생성, 여기서는 동기화만)
  deleteDrawObject: (id: string) => Promise<void>;
  
  // FloorImage 관리
  setFloorImage: (image: FloorImage) => Promise<void>;
  
  // Settings 관리
  updateSettings: (section: 'admin' | 'view', updates: Partial<AdminSettings | ViewSettings>) => Promise<void>;
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
        if (loadedCount >= totalLoaders) {
          if (import.meta.env.DEV) {
            console.log('🔥 Firebase: All data loaded successfully');
          }
          set({ isLoading: false });
        }
      };
      
      // TextObjects 리스너
      const textObjectsRef = ref(database, 'textObjects');
      const unsubscribeTextObjects = onValue(textObjectsRef, (snapshot) => {
        const data = snapshot.val();
        const textObjects = data ? Object.values(data) as TextObject[] : [];
        if (import.meta.env.DEV) {
          console.log(`📝 Loaded ${textObjects.length} text objects`);
        }
        set({ textObjects });
        checkAllLoaded();
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
        checkAllLoaded();
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
        checkAllLoaded();
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
        checkAllLoaded();
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
        checkAllLoaded();
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
    
    updateTextObject: async (id, updates) => {
      const validatedUpdates = validateFirebaseUpdate(updates);
      const success = await lwwUpdateTextObject(id, validatedUpdates);
      if (!success) {
        console.warn(`Failed to update text object ${id} due to LWW conflict`);
        // 필요시 사용자에게 알림 표시
      }
    },
    
    deleteTextObject: async (id) => {
      const objectRef = ref(database, `textObjects/${id}`);
      await remove(objectRef);
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
  };
}); 
import { useEffect, useMemo, useRef, useState } from 'react';
import type { User, Auth as FirebaseAuth } from 'firebase/auth';
import type { Database } from 'firebase/database';
import { ref, get, onValue, Unsubscribe } from 'firebase/database';
import { useAdminConfigStore } from '../store';
import { useUndoRedoStore } from '../store/undoRedoStore';
import { secureAnonymousLogin } from '../config/firebase';

export type BootstrapParams = {
  boardId: string;
  auth: FirebaseAuth;
  rtdb: Database;
  onReady?: (ctx: { user: User; perms: string[] }) => void;
  onError?: (err: unknown) => void;
};

export function usePageBootstrap(params: BootstrapParams): {
  ready: boolean;
  user: User | null;
  perms: string[] | null;
  error: unknown | null;
} {
  const { boardId, auth, rtdb, onReady, onError } = params;

  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [perms, setPerms] = useState<string[] | null>(null);
  const [error, setError] = useState<unknown | null>(null);

  const didInitRef = useRef(false);

  const registry = useMemo(() => {
    const g = globalThis as unknown as { __BOARD7_REGISTRY__?: Map<string, { subscribed: boolean }> };
    if (!g.__BOARD7_REGISTRY__) g.__BOARD7_REGISTRY__ = new Map();
    const reg = g.__BOARD7_REGISTRY__!;
    // HMR 대비: 모듈 dispose 시 레지스트리 초기화
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (import.meta && (import.meta as any).hot) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (import.meta as any).hot.dispose(() => {
        if (import.meta.env.DEV) console.debug('[bootstrap] hmr dispose: clear registry');
        reg.clear();
      });
    }
    return reg;
  }, []);

  useEffect(() => {
    let unsubIsLoading: (() => void) | null = null;
    let unsubFirstSync: Unsubscribe | null = null;
    let unmounted = false;

    const run = async () => {
      if (didInitRef.current) return;

      if (import.meta.env.DEV) console.debug('[bootstrap] init', { boardId });

      // 익명 로그인(지수 백오프 최대 3회)
      const delays = [0, 300, 900];
      try {
        if (import.meta.env.DEV) console.debug('[bootstrap] login start');
        for (let i = 0; i < delays.length; i++) {
          try {
            if (delays[i] > 0) await new Promise((r) => setTimeout(r, delays[i]));
            await secureAnonymousLogin();
            if (auth.currentUser) {
              if (import.meta.env.DEV) console.debug('[bootstrap] login success');
              break;
            }
          } catch (e) {
            if (i === delays.length - 1) throw e;
          }
        }
        if (unmounted) return;
        setUser(auth.currentUser ?? null);
      } catch (err) {
        if (import.meta.env.DEV) console.debug('[bootstrap] login failed', err);
        setError(err);
        onError?.(err);
        return;
      }

      // 권한 확인 (permission_denied 시 onError로 통일) - get으로 사전 확인
      try {
        await get(ref(rtdb, 'settings'));
        setPerms([]);
      } catch (err) {
        if (import.meta.env.DEV) console.debug('[bootstrap] permission_denied or read error', err);
        setError(err);
        onError?.(err);
        // 계속 진행하여 기존 동작 유지
      }

      const store = useAdminConfigStore.getState();
      const undo = useUndoRedoStore.getState();

      // 초기 동기화는 히스토리 오염 방지
      undo.setRestoring(true);

      const entry = registry.get(boardId);
      if (!entry?.subscribed) {
        if (import.meta.env.DEV) console.debug('[bootstrap] subscribe', boardId);
        store.initializeFirebaseListeners();
        registry.set(boardId, { subscribed: true });
      } else if (import.meta.env.DEV) {
        console.debug('[bootstrap] skip:registry', boardId);
      }

      // first-sync 확정: 필수 경로(settings)의 onValue 첫 콜백을 'first-sync'로 간주
      let firstSyncDone = false;
      unsubFirstSync = onValue(
        ref(rtdb, 'settings'),
        () => {
          if (firstSyncDone) return;
          firstSyncDone = true;
          if (import.meta.env.DEV) console.debug('[bootstrap] first-sync');
          if (unmounted) return;
          // 첫 동기화 완료
          undo.setRestoring(false);
          setReady(true);
          if (import.meta.env.DEV) console.debug('[bootstrap] ready=true');
          if (auth.currentUser) onReady?.({ user: auth.currentUser, perms: perms ?? [] });
        },
        (err) => {
          if (import.meta.env.DEV) console.debug('[bootstrap] first-sync error', err);
          setError(err);
          onError?.(err);
        }
      );

      // subscribe 완료 후에만 idempotent 플래그 설정
      didInitRef.current = true;
    };

    run();

    return () => {
      unmounted = true;
      try {
        if (import.meta.env.DEV) console.debug('[bootstrap] cleanup', boardId);
        if (unsubIsLoading) {
          unsubIsLoading();
          unsubIsLoading = null;
        }
        if (unsubFirstSync) {
          unsubFirstSync();
          unsubFirstSync = null;
        }
        const store = useAdminConfigStore.getState();
        store.cleanupFirebaseListeners();
        registry.delete(boardId);
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, auth, rtdb]);

  return { ready, user, perms, error };
}



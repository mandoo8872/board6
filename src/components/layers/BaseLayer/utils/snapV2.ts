import { useAdminConfigStore } from '../../../../store/adminConfigStore';
import { Position } from '../types';
import { flags } from '../../../../flags';

// Simple module-level cache for DB grid centers in world coords
let centersWorldCache: Position[] | null = null;
let cacheReady = false;

// TODO: Replace with real DB grid config when available.
// Here we probe settings for presence; if absent, v2 will be a no-op.
function ensureCacheReady() {
  if (cacheReady) return;
  // In this codebase we don't yet have explicit DB grid config types.
  // We treat absence as no-op by leaving centersWorldCache null.
  centersWorldCache = null;
  cacheReady = true;
}

// Public API: returns nearest center if v2 DB grid is available, otherwise null.
export function getDBSnapPosition(anchorWorld: Position): Position | null {
  if (!flags.useCellCenterSnapV2) return null;
  const { settings } = useAdminConfigStore.getState();
  const snapOn = settings?.admin?.gridSnapEnabled ?? false;
  if (!snapOn) return null;
  ensureCacheReady();
  if (!centersWorldCache || centersWorldCache.length === 0) return null;
  // Find nearest center in O(n). Screen-radius thresholding is handled by caller.
  let best: Position | null = null;
  let bestDist2 = Number.POSITIVE_INFINITY;
  for (const c of centersWorldCache) {
    const dx = c.x - anchorWorld.x;
    const dy = c.y - anchorWorld.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestDist2) {
      best = c;
      bestDist2 = d2;
    }
  }
  // Screen-radius threshold is delegated to caller's UX; here we just return nearest.
  return best;
}

// UX helper: find nearest within screen radius with hysteresis; return null if no candidate
export function findSnapCandidate(
  anchorWorld: Position,
  worldToScreen: (p: Position) => Position,
  zoom: number,
  prevCandidate: Position | null,
  radiusPxBase = 0,
  hysteresisFactor = 1.4,
): Position | null {
  if (!flags.useCellCenterSnapV2) return null;
  const { settings } = useAdminConfigStore.getState();
  const snapOn = settings?.admin?.gridSnapEnabled ?? false;
  if (!snapOn) return null;
  ensureCacheReady();
  if (!centersWorldCache || centersWorldCache.length === 0) return null;

  // 반경 자동 산정: 주변 이웃 간 거리(화면 px) 기반, 8~24px 클램프
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  let radiusPx = radiusPxBase;
  const keepRatio = hysteresisFactor;

  let best: Position | null = null;
  let bestDistPx2 = Number.POSITIVE_INFINITY;
  let secondBestDistPx2 = Number.POSITIVE_INFINITY;
  const anchorScreen = worldToScreen(anchorWorld);
  for (const c of centersWorldCache) {
    const cs = worldToScreen(c);
    const dx = cs.x - anchorScreen.x;
    const dy = cs.y - anchorScreen.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestDistPx2) {
      secondBestDistPx2 = bestDistPx2;
      best = c;
      bestDistPx2 = d2;
    } else if (d2 < secondBestDistPx2) {
      secondBestDistPx2 = d2;
    }
  }
  if (!best) return null;
  // 자동 반경 계산
  if (radiusPx <= 0) {
    const d1 = Math.sqrt(bestDistPx2);
    const d2 = secondBestDistPx2 < Number.POSITIVE_INFINITY ? Math.sqrt(secondBestDistPx2) : d1 * 2;
    const localSpacing = (d1 + d2) * 0.5; // 근접 이웃 간 평균 거리
    radiusPx = clamp(localSpacing * 0.35, 8, 24);
  }
  const keepPx = radiusPx * keepRatio;
  const bestScreen = worldToScreen(best);
  const distPx = Math.hypot(bestScreen.x - anchorScreen.x, bestScreen.y - anchorScreen.y);
  let locked = false;
  if (prevCandidate) {
    const prevScreen = worldToScreen(prevCandidate);
    const prevDistPx = Math.hypot(prevScreen.x - anchorScreen.x, prevScreen.y - anchorScreen.y);
    if (prevDistPx <= keepPx) {
      locked = true;
      // 히스테리시스 잠금: 이전 후보 유지
      // 개발 모드 디버그 로그 (최대 1줄/초)
      maybeDebug({ candIdx: -1, distPx: prevDistPx, locked: true, radiusPx, zoom });
      return prevCandidate;
    }
  }
  const result = distPx <= radiusPx ? best : null;
  maybeDebug({ candIdx: -1, distPx, locked, radiusPx, zoom });
  return result;
}

// Placeholder API to be called when DB grid config is loaded/changed in future.
export function setDBGridCentersWorld(centers: Position[] | null) {
  centersWorldCache = centers;
  cacheReady = true;
}

// --- Dev-only debug (1 line/sec) ---
let lastDebugTs = 0;
function maybeDebug(payload: { candIdx: number; distPx: number; locked: boolean; radiusPx: number; zoom: number }) {
  if (!import.meta.env.DEV) return;
  if (!flags.enableSnapV2Debug) return;
  const now = Date.now();
  if (now - lastDebugTs < 1000) return;
  lastDebugTs = now;
  // eslint-disable-next-line no-console
  console.debug('[SnapV2]', payload);
}



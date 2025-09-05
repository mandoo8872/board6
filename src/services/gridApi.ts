export interface GridConfig {
  templateId: string;
  version: string;
  rectPct: { x: number; y: number; w: number; h: number };
  rows: number;
  cols: number;
  vLinesPct?: number[];
  hLinesPct?: number[];
  label?: string | null;
  updatedAt: string;
  updatedBy: string;
}

export interface GridConfigItem extends GridConfig {
  id: string;
}

// Realtime DB integration with localStorage fallback
import { ref, set as firebaseSet, get as firebaseGet, remove as firebaseRemove } from 'firebase/database';
import { database } from '../config/firebase';
import { flags } from '../flags';

const RTDB_COLLECTION = 'gridConfigs';

export async function saveGridConfig(cfg: GridConfig): Promise<GridConfigItem> {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  const item: GridConfigItem = { id, ...cfg };
  try {
    await firebaseSet(ref(database, `${RTDB_COLLECTION}/${id}`), item);
  } catch (e) {
    // expose debug log to aid diagnosis in dev
    if (import.meta.env.DEV) console.error('[gridApi] RTDB save failed:', e);
    // fallback to localStorage silently for offline/dev
    try {
      const raw = localStorage.getItem('board7.gridConfigs');
      const arr: GridConfigItem[] = raw ? JSON.parse(raw) : [];
      arr.push(item);
      localStorage.setItem('board7.gridConfigs', JSON.stringify(arr));
    } catch {}
  }
  return item;
}

export async function loadGridConfig(): Promise<GridConfig | null> {
  try {
    // kept for backward compatibility when only one existed
    const snapshot = await firebaseGet(ref(database, `${RTDB_COLLECTION}/default`));
    if (snapshot.exists()) return snapshot.val() as GridConfig;
  } catch {}
  // fallback
  if (!flags.gridUseDBOnly) {
    try {
      const raw = localStorage.getItem('board7.gridConfig'); // legacy single
      return raw ? JSON.parse(raw) as GridConfig : null;
    } catch { /* ignore */ }
  }
  return null;
}

export async function loadGridConfigs(): Promise<GridConfigItem[]> {
  try {
    const snapshot = await firebaseGet(ref(database, RTDB_COLLECTION));
    if (snapshot.exists()) {
      const data = snapshot.val() as Record<string, GridConfigItem>;
      return Object.values(data);
    }
  } catch {}
  if (!flags.gridUseDBOnly) {
    try {
      const raw = localStorage.getItem('board7.gridConfigs');
      return raw ? JSON.parse(raw) as GridConfigItem[] : [];
    } catch { /* ignore */ }
  }
  return [];
}

export async function deleteGridConfig(id: string): Promise<void> {
  try {
    await firebaseRemove(ref(database, `${RTDB_COLLECTION}/${id}`));
  } catch (e) {
    if (import.meta.env.DEV) console.error('[gridApi] RTDB delete failed:', e);
    try {
      const raw = localStorage.getItem('board7.gridConfigs');
      const arr: GridConfigItem[] = raw ? JSON.parse(raw) : [];
      const next = arr.filter((g) => g.id !== id);
      localStorage.setItem('board7.gridConfigs', JSON.stringify(next));
    } catch {}
  }
}



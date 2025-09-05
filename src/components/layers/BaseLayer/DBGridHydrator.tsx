import { useEffect } from 'react';
import { setDBGridCentersWorld } from './utils/snapV2';
import { computeCellCenters } from '../../../features/gridEditor/computeCenters';
import { loadGridConfig, loadGridConfigs } from '../../../services/gridApi';
import { flags } from '../../../flags';

interface Rect { x: number; y: number; w: number; h: number; }

export default function DBGridHydrator({ imageBoxWorld }: { imageBoxWorld: Rect }) {
  useEffect(() => {
    let mounted = true;
    // try multi first
    const injectFromDB = () => loadGridConfigs().then((list) => {
      if (!mounted) return;
      if (list && list.length > 0) {
        const all = list.flatMap((cfg) => computeCellCenters(cfg, imageBoxWorld));
        setDBGridCentersWorld(all);
        if (import.meta.env.DEV) console.debug(`[GridHydrator] centers injected from ${list.length} configs: ${all.length}`);
        return;
      }
      // fallback single
      if (!flags.gridUseDBOnly) {
        loadGridConfig().then((cfg) => {
          if (!mounted) return;
          if (!cfg) {
            setDBGridCentersWorld(null);
            if (import.meta.env.DEV) console.debug('[GridHydrator] no DB grid, snap NOP');
            return;
          }
          const centers = computeCellCenters(cfg, imageBoxWorld);
          setDBGridCentersWorld(centers);
          if (import.meta.env.DEV) console.debug(`[GridHydrator] centers injected: ${centers.length}`);
        });
        return;
      }
      // DB only mode (no fallback)
      setDBGridCentersWorld(null);
      if (import.meta.env.DEV) console.debug('[GridHydrator] DB-only mode: no grids');
    });
    injectFromDB();
    const h = () => injectFromDB();
    window.addEventListener('gridConfigsUpdated', h);
    return () => { mounted = false; window.removeEventListener('gridConfigsUpdated', h); };
  }, [imageBoxWorld.x, imageBoxWorld.y, imageBoxWorld.w, imageBoxWorld.h]);
  return null;
}



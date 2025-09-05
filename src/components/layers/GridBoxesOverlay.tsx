import { useEffect, useState } from 'react';
import { loadGridConfigs, GridConfigItem } from '../../services/gridApi';
import { useGridEditorStore } from '../../features/gridEditor/gridEditorStore';

interface Rect { x: number; y: number; w: number; h: number }

export default function GridBoxesOverlay({ imageBoxWorld }: { imageBoxWorld: Rect }) {
  const [items, setItems] = useState<GridConfigItem[]>([]);
  const { loadFromItem, viewEnabled } = useGridEditorStore();

  const refresh = () => { loadGridConfigs().then(setItems); };

  useEffect(() => {
    refresh();
    const h = () => refresh();
    window.addEventListener('gridConfigsUpdated', h);
    return () => window.removeEventListener('gridConfigsUpdated', h);
  }, []);

  if (!viewEnabled) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 95, pointerEvents: 'none' }}>
      {items.map((it) => {
        const left = imageBoxWorld.x + it.rectPct.x * imageBoxWorld.w;
        const top = imageBoxWorld.y + it.rectPct.y * imageBoxWorld.h;
        const width = it.rectPct.w * imageBoxWorld.w;
        const height = it.rectPct.h * imageBoxWorld.h;
        return (
          <div
            key={it.id}
            onClick={(e) => { e.stopPropagation(); loadFromItem(it); }}
            title={(it as any).label || it.id}
            style={{ position: 'absolute', left, top, width, height, pointerEvents: 'auto', cursor: 'pointer' }}
          >
            <div style={{ position: 'absolute', inset: 0, border: '2px solid rgba(59,130,246,0.6)', borderRadius: 4, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }} />
            {/* 내부 라인 (얇게) */}
            {(() => {
              const v = it.vLinesPct && it.vLinesPct.length ? it.vLinesPct : Array.from({ length: it.cols + 1 }, (_, i) => i / it.cols);
              const h = it.hLinesPct && it.hLinesPct.length ? it.hLinesPct : Array.from({ length: it.rows + 1 }, (_, i) => i / it.rows);
              return (
                <>
                  {v.map((p, idx) => idx>0 && idx<v.length-1 && (
                    <div key={`v-${idx}`} style={{ position: 'absolute', left: p*width, top: 0, width: 1, height: '100%', background: 'rgba(59,130,246,0.3)' }} />
                  ))}
                  {h.map((p, idx) => idx>0 && idx<h.length-1 && (
                    <div key={`h-${idx}`} style={{ position: 'absolute', top: p*height, left: 0, height: 1, width: '100%', background: 'rgba(59,130,246,0.3)' }} />
                  ))}
                </>
              );
            })()}
            {/* 라벨 표시 */}
            <div style={{ position: 'absolute', left: 6, top: 6, fontSize: 10, padding: '2px 6px', background: 'rgba(31,41,55,0.85)', color: 'white', borderRadius: 3, pointerEvents: 'none' }}>
              {(it as any).label || it.id}
            </div>
          </div>
        );
      })}
    </div>
  );
}



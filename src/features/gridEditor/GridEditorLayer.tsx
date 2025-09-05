import React, { useCallback, useMemo, useRef } from 'react';
import { useGridEditorStore, MIN_CELL_PX } from './gridEditorStore';
import { computeCellCenters } from './computeCenters';
import { getCanvasScale } from '../../components/layers/BaseLayer/utils/positionUtils';

export interface Rect { x: number; y: number; w: number; h: number; }

function pctFromWorldX(x: number, box: Rect) { return (x - box.x) / box.w; }
function pctFromWorldY(y: number, box: Rect) { return (y - box.y) / box.h; }
function worldXFromPct(p: number, box: Rect) { return box.x + box.w * p; }
function worldYFromPct(p: number, box: Rect) { return box.y + box.h * p; }

export default function GridEditorLayer({ imageBoxWorld, enabled }: { imageBoxWorld: Rect; enabled: boolean }) {
  const { mode, draft, previewCenters, setRectPct, moveLine } = useGridEditorStore();

  type Handle = 'nw'|'n'|'ne'|'e'|'se'|'s'|'sw'|'w';
  type DragState = { kind: 'rect' | 'v' | 'h' | 'resize' | 'move'; handle?: Handle; index?: number; start: { x: number; y: number }; startRect?: { x: number; y: number; w: number; h: number } };
  const dragging = useRef<DragState | null>(null);
  // no local state required currently

  const minDxPct = MIN_CELL_PX / imageBoxWorld.w;
  const minDyPct = MIN_CELL_PX / imageBoxWorld.h;

  const getWorldPoint = (e: React.PointerEvent) => {
    const container = (e.currentTarget as HTMLElement).closest('[data-canvas-container]') as HTMLElement;
    const scale = getCanvasScale(container);
    const rect = container.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale };
  };

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!enabled) return;
    e.stopPropagation();
    e.preventDefault();
    const { x, y } = getWorldPoint(e);
    if (mode === 'draw' && !draft) {
      dragging.current = { kind: 'rect', start: { x, y } };
      // 초기 사각형 0 크기 생성
      const x0 = Math.min(x, x); const y0 = Math.min(y, y);
      const w = 0; const h = 0;
      setRectPct({ x: (x0 - imageBoxWorld.x) / imageBoxWorld.w, y: (y0 - imageBoxWorld.y) / imageBoxWorld.h, w: w / imageBoxWorld.w, h: h / imageBoxWorld.h });
      return;
    }
  }, [enabled, mode, draft, setRectPct, imageBoxWorld.x, imageBoxWorld.y, imageBoxWorld.w, imageBoxWorld.h]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!enabled || !dragging.current) return;
    e.preventDefault();
    const { x, y } = getWorldPoint(e);
    if (dragging.current.kind === 'rect') {
      const sx = dragging.current.start.x; const sy = dragging.current.start.y;
      const x0 = Math.min(sx, x); const y0 = Math.min(sy, y);
      const w = Math.max(1, Math.abs(x - sx));
      const h = Math.max(1, Math.abs(y - sy));
      setRectPct({ x: (x0 - imageBoxWorld.x) / imageBoxWorld.w, y: (y0 - imageBoxWorld.y) / imageBoxWorld.h, w: w / imageBoxWorld.w, h: h / imageBoxWorld.h });
      return;
    }
    if (draft && dragging.current.kind === 'move' && dragging.current.startRect) {
      const sr = dragging.current.startRect;
      const dx = x - dragging.current.start.x;
      const dy = y - dragging.current.start.y;
      let left = sr.x + dx, top = sr.y + dy;
      left = Math.max(imageBoxWorld.x, Math.min(imageBoxWorld.x + imageBoxWorld.w - sr.w, left));
      top = Math.max(imageBoxWorld.y, Math.min(imageBoxWorld.y + imageBoxWorld.h - sr.h, top));
      setRectPct({ x: (left - imageBoxWorld.x) / imageBoxWorld.w, y: (top - imageBoxWorld.y) / imageBoxWorld.h, w: sr.w / imageBoxWorld.w, h: sr.h / imageBoxWorld.h });
      return;
    }
    if (draft && dragging.current.kind === 'resize' && dragging.current.startRect && dragging.current.handle) {
      const sr = dragging.current.startRect;
      let x0 = sr.x, y0 = sr.y, w0 = sr.w, h0 = sr.h;
      const minW = MIN_CELL_PX * 2; // 최소 2셀 정도 영역 확보
      const minH = MIN_CELL_PX * 2;
      const absLeft = worldXFromPct(draft.rectPct.x, imageBoxWorld);
      const absTop = worldYFromPct(draft.rectPct.y, imageBoxWorld);
      const absRight = absLeft + draft.rectPct.w * imageBoxWorld.w;
      const absBottom = absTop + draft.rectPct.h * imageBoxWorld.h;
      // 시작 기준 실제 픽셀 값
      x0 = absLeft; y0 = absTop; w0 = absRight - absLeft; h0 = absBottom - absTop;
      let left = x0, top = y0, right = x0 + w0, bottom = y0 + h0;
      switch (dragging.current.handle) {
        case 'nw': left = Math.min(Math.max(imageBoxWorld.x, x), right - minW); top = Math.min(Math.max(imageBoxWorld.y, y), bottom - minH); break;
        case 'n':  top = Math.min(Math.max(imageBoxWorld.y, y), bottom - minH); break;
        case 'ne': right = Math.max(left + minW, Math.min(imageBoxWorld.x + imageBoxWorld.w, x)); top = Math.min(Math.max(imageBoxWorld.y, y), bottom - minH); break;
        case 'e':  right = Math.max(left + minW, Math.min(imageBoxWorld.x + imageBoxWorld.w, x)); break;
        case 'se': right = Math.max(left + minW, Math.min(imageBoxWorld.x + imageBoxWorld.w, x)); bottom = Math.max(top + minH, Math.min(imageBoxWorld.y + imageBoxWorld.h, y)); break;
        case 's':  bottom = Math.max(top + minH, Math.min(imageBoxWorld.y + imageBoxWorld.h, y)); break;
        case 'sw': left = Math.min(Math.max(imageBoxWorld.x, x), right - minW); bottom = Math.max(top + minH, Math.min(imageBoxWorld.y + imageBoxWorld.h, y)); break;
        case 'w':  left = Math.min(Math.max(imageBoxWorld.x, x), right - minW); break;
      }
      const newXpct = (left - imageBoxWorld.x) / imageBoxWorld.w;
      const newYpct = (top - imageBoxWorld.y) / imageBoxWorld.h;
      const newWpct = (right - left) / imageBoxWorld.w;
      const newHpct = (bottom - top) / imageBoxWorld.h;
      setRectPct({ x: newXpct, y: newYpct, w: newWpct, h: newHpct });
      return;
    }
    if (draft && dragging.current.kind === 'v' && dragging.current.index !== undefined) {
      const i = dragging.current.index;
      // 경계 유지 및 최소 간격 보장
      const left = draft.vLinesPct[i - 1];
      const right = draft.vLinesPct[i + 1];
      const p = pctFromWorldX(x, imageBoxWorld);
      const clamped = Math.max(left + minDxPct, Math.min(right - minDxPct, p));
      moveLine('v', i, clamped);
      return;
    }
    if (draft && dragging.current.kind === 'h' && dragging.current.index !== undefined) {
      const i = dragging.current.index;
      const up = draft.hLinesPct[i - 1];
      const down = draft.hLinesPct[i + 1];
      const p = pctFromWorldY(y, imageBoxWorld);
      const clamped = Math.max(up + minDyPct, Math.min(down - minDyPct, p));
      moveLine('h', i, clamped);
      return;
    }
  }, [enabled, setRectPct, draft, imageBoxWorld, minDxPct, minDyPct, moveLine]);

  const handlePointerUp = useCallback((_e: React.PointerEvent<HTMLDivElement>) => {
    if (!enabled) return;
    dragging.current = null;
  }, [enabled]);

  const lineHandleSize = 12;

  const centers = useMemo(() => {
    if (!draft || !previewCenters) return [] as { x: number; y: number }[];
    return computeCellCenters({
      rectPct: draft.rectPct,
      rows: draft.rows,
      cols: draft.cols,
      vLinesPct: draft.vLinesPct,
      hLinesPct: draft.hLinesPct,
    }, imageBoxWorld as any);
  }, [draft, previewCenters, imageBoxWorld]);

  return (
    <div
      style={{ position: 'absolute', inset: 0, zIndex: 9000, pointerEvents: enabled ? 'auto' : 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* 드래그 박스 렌더 */}
      {draft && (
        <div
          style={{
            position: 'absolute',
            left: worldXFromPct(draft.rectPct.x, imageBoxWorld),
            top: worldYFromPct(draft.rectPct.y, imageBoxWorld),
            width: draft.rectPct.w * imageBoxWorld.w,
            height: draft.rectPct.h * imageBoxWorld.h,
            border: '2px dashed #3b82f6',
            background: 'rgba(59,130,246,0.06)',
            borderRadius: 4,
          }}
        >
          {/* 박스 이동 영역 (안쪽 배경 클릭 드래그) */}
          <div
            onPointerDown={(ev) => {
              ev.stopPropagation();
              const container = (ev.currentTarget as HTMLElement).closest('[data-canvas-container]') as HTMLElement;
              const scale = getCanvasScale(container);
              const rect = container.getBoundingClientRect();
              const p = { x: (ev.clientX - rect.left) / scale, y: (ev.clientY - rect.top) / scale };
              const left = worldXFromPct(draft.rectPct.x, imageBoxWorld);
              const top = worldYFromPct(draft.rectPct.y, imageBoxWorld);
              const width = draft.rectPct.w * imageBoxWorld.w;
              const height = draft.rectPct.h * imageBoxWorld.h;
              dragging.current = { kind: 'move', start: p, startRect: { x: left, y: top, w: width, h: height } };
            }}
            style={{ position: 'absolute', inset: 0, cursor: 'move' }}
          />
          {/* 세로 라인 핸들 */}
          {draft.vLinesPct.slice(1, -1).map((p, idx) => {
            const i = idx + 1;
            const x = worldXFromPct(draft.rectPct.x + draft.rectPct.w * p, imageBoxWorld) - worldXFromPct(draft.rectPct.x, imageBoxWorld);
            return (
              <div key={`v-${i}`} style={{ position: 'absolute', left: x - 1, top: 0, width: 2, height: '100%', background: 'rgba(59,130,246,0.6)' }} />
            );
          })}
          {draft.vLinesPct.slice(1, -1).map((p, idx) => {
            const i = idx + 1;
            const x = worldXFromPct(draft.rectPct.x + draft.rectPct.w * p, imageBoxWorld) - worldXFromPct(draft.rectPct.x, imageBoxWorld);
            return (
              <div
                key={`vh-${i}`}
                onPointerDown={(ev) => { ev.stopPropagation(); const p = getWorldPoint(ev as any); dragging.current = { kind: 'v', index: i, start: p }; }}
                style={{ position: 'absolute', left: x - lineHandleSize / 2, top: -lineHandleSize, width: lineHandleSize, height: lineHandleSize, borderRadius: 4, background: '#3b82f6', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', cursor: 'ew-resize' }}
                title="세로 라인 이동"
              />
            );
          })}

          {/* 가로 라인 핸들 */}
          {draft.hLinesPct.slice(1, -1).map((p, idx) => {
            const i = idx + 1;
            const y = worldYFromPct(draft.rectPct.y + draft.rectPct.h * p, imageBoxWorld) - worldYFromPct(draft.rectPct.y, imageBoxWorld);
            return (
              <div key={`h-${i}`} style={{ position: 'absolute', top: y - 1, left: 0, height: 2, width: '100%', background: 'rgba(59,130,246,0.6)' }} />
            );
          })}
          {draft.hLinesPct.slice(1, -1).map((p, idx) => {
            const i = idx + 1;
            const y = worldYFromPct(draft.rectPct.y + draft.rectPct.h * p, imageBoxWorld) - worldYFromPct(draft.rectPct.y, imageBoxWorld);
            return (
              <div
                key={`hh-${i}`}
                onPointerDown={(ev) => { ev.stopPropagation(); const p = getWorldPoint(ev as any); dragging.current = { kind: 'h', index: i, start: p }; }}
                style={{ position: 'absolute', top: y - lineHandleSize / 2, left: -lineHandleSize, width: lineHandleSize, height: lineHandleSize, borderRadius: 4, background: '#3b82f6', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', cursor: 'ns-resize' }}
                title="가로 라인 이동"
              />
            );
          })}
          {/* 박스 8방향 리사이즈 핸들 */}
          {(() => {
            const left = 0, top = 0, width = draft.rectPct.w * imageBoxWorld.w, height = draft.rectPct.h * imageBoxWorld.h;
            const cx = width / 2, cy = height / 2, hs = 10;
            const mk = (style: React.CSSProperties, handle: Handle, cursor: string, key: string) => (
              <div
                key={key}
                onPointerDown={(ev) => { ev.stopPropagation(); dragging.current = { kind: 'resize', handle, start: { x: ev.clientX, y: ev.clientY }, startRect: { x: left, y: top, w: width, h: height } }; }}
                style={{ position: 'absolute', ...style, width: hs, height: hs, background: '#1f2937', border: '2px solid #60a5fa', borderRadius: 2, cursor }}
                title="크기 조절"
              />
            );
            return (
              <>
                {mk({ left: left - hs / 2, top: top - hs / 2 }, 'nw', 'nwse-resize', 'hnw')}
                {mk({ left: left + cx - hs / 2, top: top - hs / 2 }, 'n', 'ns-resize', 'hn')}
                {mk({ left: left + width - hs / 2, top: top - hs / 2 }, 'ne', 'nesw-resize', 'hne')}
                {mk({ left: left + width - hs / 2, top: top + cy - hs / 2 }, 'e', 'ew-resize', 'he')}
                {mk({ left: left + width - hs / 2, top: top + height - hs / 2 }, 'se', 'nwse-resize', 'hse')}
                {mk({ left: left + cx - hs / 2, top: top + height - hs / 2 }, 's', 'ns-resize', 'hs')}
                {mk({ left: left - hs / 2, top: top + height - hs / 2 }, 'sw', 'nesw-resize', 'hsw')}
                {mk({ left: left - hs / 2, top: top + cy - hs / 2 }, 'w', 'ew-resize', 'hw')}
              </>
            );
          })()}
        </div>
      )}

      {/* 중심점 미리보기 */}
      {draft && previewCenters && centers.map((c, i) => (
        <div key={`c-${i}`} style={{ position: 'absolute', left: c.x - 3, top: c.y - 3, width: 6, height: 6, background: '#10b981', borderRadius: 6, pointerEvents: 'none' }} />
      ))}
    </div>
  );
}



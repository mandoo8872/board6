import type { Position } from '../../components/layers/BaseLayer/types';

export interface Rect { x: number; y: number; w: number; h: number; }

export interface GridConfig {
  rectPct: { x: number; y: number; w: number; h: number };
  rows: number;
  cols: number;
  vLinesPct?: number[];
  hLinesPct?: number[];
}

export function computeCellCenters(cfg: GridConfig, imageBox: Rect): Position[] {
  const gx = imageBox.x + cfg.rectPct.x * imageBox.w;
  const gy = imageBox.y + cfg.rectPct.y * imageBox.h;
  const gw = cfg.rectPct.w * imageBox.w;
  const gh = cfg.rectPct.h * imageBox.h;
  const v = (cfg.vLinesPct?.length ? cfg.vLinesPct : Array.from({ length: cfg.cols + 1 }, (_, i) => i / cfg.cols));
  const h = (cfg.hLinesPct?.length ? cfg.hLinesPct : Array.from({ length: cfg.rows + 1 }, (_, i) => i / cfg.rows));
  const centers: Position[] = [];
  for (let r = 0; r < cfg.rows; r++) {
    for (let c = 0; c < cfg.cols; c++) {
      const x0 = gx + gw * v[c], x1 = gx + gw * v[c + 1];
      const y0 = gy + gh * h[r], y1 = gy + gh * h[r + 1];
      centers.push({ x: (x0 + x1) / 2, y: (y0 + y1) / 2 });
    }
  }
  return centers;
}



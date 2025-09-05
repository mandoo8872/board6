import { useEffect, useState } from 'react';
import { Plus, Minus, FloppyDisk, X, Eye } from 'phosphor-react';
import { useGridEditorStore } from './gridEditorStore';
import { saveGridConfig, loadGridConfigs, GridConfigItem } from '../../services/gridApi';
import { computeCellCenters } from './computeCenters';
import { setDBGridCentersWorld } from '../../components/layers/BaseLayer/utils/snapV2';

export default function GridEditorToolbar({ imageBoxWorld }: { imageBoxWorld: { x: number; y: number; w: number; h: number } }) {
  const { mode, draft, setMode, setRows, setCols, togglePreview, reset, loadFromItem, setEditingId, editingId } = useGridEditorStore();
  const [items, setItems] = useState<GridConfigItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadGridConfigs().then(setItems);
  }, []);

  const canSave = !!draft;

  const handleSave = async () => {
    if (!draft) return;
    const cfg = {
      templateId: 'default',
      version: 'v1',
      rectPct: draft.rectPct,
      rows: draft.rows,
      cols: draft.cols,
      vLinesPct: draft.vLinesPct,
      hLinesPct: draft.hLinesPct,
      updatedAt: new Date().toISOString(),
      updatedBy: 'local-dev',
    };
    const saved = await saveGridConfig(cfg as any);
    // 전체 구성 재주입(마지막만 반영되는 문제 방지)
    const list = await loadGridConfigs();
    setItems(list);
    const allCenters = list.flatMap((g) => computeCellCenters(g as any, imageBoxWorld));
    setDBGridCentersWorld(allCenters);
    window.dispatchEvent(new Event('gridConfigsUpdated'));
    setEditingId(saved.id);
  };

  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-4 z-[9050] bg-gray-800/95 text-white rounded shadow-lg border border-gray-700 px-3 py-2 flex items-center gap-2 select-none">
      <button onClick={() => setMode(mode === 'draw' ? 'off' : 'draw')} className={`px-2 py-1 rounded ${mode === 'draw' ? 'bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'}`}>DRAW</button>
      <button onClick={() => setMode(mode === 'edit' ? 'off' : 'edit')} className={`px-2 py-1 rounded ${mode === 'edit' ? 'bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'}`}>LINES</button>
      <div className="w-px h-5 bg-gray-600 mx-1" />
      <div className="flex items-center gap-1">
        <span className="text-xs opacity-80">Rows</span>
        <button disabled={!draft} onClick={() => draft && setRows(draft.rows - 1)} className="p-1 bg-gray-700 rounded disabled:opacity-50"><Minus size={14} /></button>
        <span className="px-2 py-1 bg-gray-700 rounded text-xs min-w-[24px] text-center">{draft?.rows ?? '-'}</span>
        <button disabled={!draft} onClick={() => draft && setRows(draft.rows + 1)} className="p-1 bg-gray-700 rounded disabled:opacity-50"><Plus size={14} /></button>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs opacity-80">Cols</span>
        <button disabled={!draft} onClick={() => draft && setCols(draft.cols - 1)} className="p-1 bg-gray-700 rounded disabled:opacity-50"><Minus size={14} /></button>
        <span className="px-2 py-1 bg-gray-700 rounded text-xs min-w-[24px] text-center">{draft?.cols ?? '-'}</span>
        <button disabled={!draft} onClick={() => draft && setCols(draft.cols + 1)} className="p-1 bg-gray-700 rounded disabled:opacity-50"><Plus size={14} /></button>
      </div>
      <div className="w-px h-5 bg-gray-600 mx-1" />
      <button onClick={togglePreview} className="p-1 bg-gray-700 rounded"><Eye size={16} /></button>
      <button disabled={!canSave} onClick={handleSave} className="p-1 bg-blue-600 hover:bg-blue-500 rounded disabled:opacity-50"><FloppyDisk size={16} /></button>
      <button onClick={reset} className="p-1 bg-gray-700 hover:bg-gray-600 rounded"><X size={16} /></button>

      {/* 목록 토글 */}
      <button onClick={() => setOpen(!open)} className="px-2 py-1 bg-gray-700 rounded text-xs">목록</button>
      {open && (
        <div className="absolute mt-2 left-1/2 -translate-x-1/2 top-full bg-gray-900 text-white border border-gray-700 rounded shadow-lg w-[360px] max-h-[260px] overflow-auto p-2">
          {items.length === 0 && <div className="text-xs opacity-70 p-2">저장된 그리드가 없습니다.</div>}
          {items.map((it) => (
            <div key={it.id} className={`flex items-center justify-between text-xs px-2 py-1 rounded hover:bg-gray-800 ${editingId===it.id?'bg-gray-800':''}`}>
              <div className="truncate mr-2">{it.id}</div>
              <div className="flex items-center gap-2">
                <button className="px-2 py-0.5 bg-gray-700 rounded" onClick={() => { loadFromItem(it); setOpen(false); }}>편집</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



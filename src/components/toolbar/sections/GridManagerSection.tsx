import React, { useEffect, useState } from 'react';
import { SquaresFour, FloppyDisk, Plus, Trash, List, Pencil } from 'phosphor-react';
import { useAdminConfigStore } from '../../../store';
import { GridConfigItem, loadGridConfigs, saveGridConfig, deleteGridConfig } from '../../../services/gridApi';
import { useGridEditorStore } from '../../../features/gridEditor/gridEditorStore';
import { computeCellCenters } from '../../../features/gridEditor/computeCenters';
import { setDBGridCentersWorld } from '../../../components/layers/BaseLayer/utils/snapV2';

const GridManagerSection: React.FC = () => {
  const { setMode, draft, startDraft, loadFromItem, reset, setRows, setCols, viewEnabled, setViewEnabled, clearDraft } = useGridEditorStore();
  const imageBoxWorld = { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight } as any; // fallback; real path uses DBGridHydrator
  const [items, setItems] = useState<GridConfigItem[]>([]);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const adminSettings = useAdminConfigStore((s) => s.settings.admin);
  const updateSettings = useAdminConfigStore((s) => s.updateSettings);

  useEffect(() => {
    loadGridConfigs().then(setItems);
  }, []);

  const handleNew = () => {
    setMode('draw');
    startDraft({ x: 0.2, y: 0.2, w: 0.6, h: 0.6 });
  };

  const handleSave = async () => {
    if (!draft) return;
    const cfg = {
      templateId: 'default', version: 'v1', rectPct: draft.rectPct,
      rows: draft.rows, cols: draft.cols, vLinesPct: draft.vLinesPct, hLinesPct: draft.hLinesPct,
      label: label ? label : null,
      updatedAt: new Date().toISOString(), updatedBy: 'local-dev'
    };
    await saveGridConfig(cfg);
    // 전체 목록 기준으로 스냅 주입 (마지막만 반영되는 문제 방지)
    const list = await loadGridConfigs();
    setItems(list);
    // imageBoxWorld는 DBGridHydrator에서 실제 값으로 주입되므로, 여기서는 즉시 주입이 필요한 경우에만 화면 기준으로 임시 환산
    const allCenters = list.flatMap((g) => computeCellCenters(g as any, imageBoxWorld));
    setDBGridCentersWorld(allCenters);
    window.dispatchEvent(new Event('gridConfigsUpdated'));
  };
  const handleDelete = async (id: string) => {
    await deleteGridConfig(id);
    const list = await loadGridConfigs();
    setItems(list);
    window.dispatchEvent(new Event('gridConfigsUpdated'));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <button
        onClick={() => { setIsExpanded(!isExpanded); if (!isExpanded) window.dispatchEvent(new CustomEvent('toolbar-open', { detail: 'grid' } as any)); }}
        className="w-full p-4 flex items-center justify-between text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-t-xl transition-colors"
      >
        <span className="flex items-center gap-2">
          <SquaresFour size={20} weight="duotone" color="#302929" /> 그리드 설정
        </span>
        <span className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {isExpanded && (
      <div className="p-4 border-t border-slate-200 space-y-3">
        {/* 1행: 보기 on/off */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-700">
            <input type="checkbox" checked={viewEnabled} onChange={(e)=>setViewEnabled(e.target.checked)} className="rounded" />
            그리드 보기
          </label>
        </div>

        {/* 2행: 행/열 +/− (한 줄로 합침) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <span className="opacity-80">행</span>
            <button disabled={!draft} onClick={() => draft && setRows(draft.rows - 1)} className="px-2 py-1 bg-slate-200 rounded disabled:opacity-50">-</button>
            <span className="px-2 py-0.5 bg-white border rounded min-w-[28px] text-center">{draft?.rows ?? '-'}</span>
            <button disabled={!draft} onClick={() => draft && setRows(draft.rows + 1)} className="px-2 py-1 bg-slate-200 rounded disabled:opacity-50">+</button>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <span className="opacity-80">열</span>
            <button disabled={!draft} onClick={() => draft && setCols(draft.cols - 1)} className="px-2 py-1 bg-slate-200 rounded disabled:opacity-50">-</button>
            <span className="px-2 py-0.5 bg-white border rounded min-w-[28px] text-center">{draft?.cols ?? '-'}</span>
            <button disabled={!draft} onClick={() => draft && setCols(draft.cols + 1)} className="px-2 py-1 bg-slate-200 rounded disabled:opacity-50">+</button>
          </div>
        </div>

        {/* 스텝 스냅 옵션 (아래쪽 배치, 한 줄) */}
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={adminSettings.stepSnapDuringDrag ?? false}
              onChange={(e) => updateSettings('admin', { stepSnapDuringDrag: e.target.checked } as any)}
              className="rounded"
            />
            <span>드래그 중 즉시 스냅(스텝 이동)</span>
          </label>
        </div>

        {/* 3행: 새 그리드 박스 + 레이블/저장 */}
        <div className="flex items-center gap-2 w-full">
          <button
            onClick={() => { clearDraft(); setMode('draw'); handleNew(); }}
            className="flex-shrink-0 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs flex items-center gap-1"
          >
            <Plus size={14} /> 새 그리드
          </button>
          <div className="flex items-center gap-1 bg-white border rounded px-2 py-1 flex-1 min-w-0">
            <Pencil size={12} color="#334155" />
            <input value={label} onChange={(e)=>setLabel(e.target.value)} placeholder="레이블" className="text-xs outline-none w-full" />
          </div>
          <button onClick={handleSave} disabled={!draft} className="flex-shrink-0 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded text-xs disabled:opacity-50 flex items-center gap-1"><FloppyDisk size={14} /> 저장</button>
        </div>

        {/* 4행: 목록 / 편집취소 (중복 Rows/Cols 제거) */}
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setOpen(!open)} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs flex items-center gap-1"><List size={14} /> 목록</button>
          <button onClick={reset} className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded text-xs flex items-center gap-1"><Trash size={14} /> 편집취소</button>
        </div>

        {/* 4행 이후: 목록 (툴바 내부 스크롤에 종속) */}
        {open && (
          <div className="border rounded p-2 max-h-[260px] overflow-auto bg-slate-50">
            {items.length === 0 && <div className="text-xs text-slate-500 p-2">저장된 그리드 없음</div>}
            {items.map((it) => (
              <div key={it.id} className="flex items-center justify-between px-2 py-1 text-xs bg-white rounded border mb-1">
                <div className="truncate mr-2">{it.label || it.id}</div>
                <div className="flex items-center gap-2">
                  <button className="px-2 py-0.5 bg-slate-200 rounded" onClick={() => loadFromItem(it)}>편집</button>
                  <button className="px-2 py-0.5 bg-red-500 text-white rounded" onClick={() => handleDelete(it.id)}>삭제</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="text-[11px] text-slate-500 leading-5">스냅은 DB에 저장된 모든 그리드 박스를 기준으로 동작합니다.</div>
      </div>
      )}
    </div>
  );
};

export default GridManagerSection;



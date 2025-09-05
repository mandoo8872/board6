import React, { useCallback } from 'react';
import { useEditorStore } from '../../store';

const ZoomControls: React.FC = React.memo(() => {
  const { zoom, setZoom, fitToWindow } = useEditorStore();

  const handleZoomIn = useCallback(() => {
    setZoom(Math.min(zoom * 1.2, 5.0));
  }, [zoom, setZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom(Math.max(zoom / 1.2, 0.05));
  }, [zoom, setZoom]);

  const handleFitToWindow = useCallback(() => {
    fitToWindow();
  }, [fitToWindow]);

  const handleZoomReset = useCallback(() => {
    setZoom(1.0);
  }, [setZoom]);

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      <button
        onClick={handleZoomIn}
        className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center justify-center text-lg font-semibold"
        title="확대 (Ctrl + 휠 위 또는 Ctrl + +)"
      >
        +
      </button>
      <button
        onClick={handleZoomOut}
        className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center justify-center text-lg font-semibold"
        title="축소 (Ctrl + 휠 아래 또는 Ctrl + -)"
      >
        -
      </button>
      <button
        onClick={handleZoomReset}
        className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center justify-center text-xs font-semibold"
        title="100% 크기"
      >
        1:1
      </button>
      <button
        onClick={handleFitToWindow}
        className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center justify-center text-xs font-semibold"
        title="창맞춤"
      >
        ⌂
      </button>
    </div>
  );
});

ZoomControls.displayName = 'ZoomControls';

export default ZoomControls; 
// Feature flags for runtime behavior toggles
export const flags = {
  // Use DB-based cell-center snapping (v2). If false, fallback to design grid snapping.
  useCellCenterSnapV2: true,

  // Use requestAnimationFrame coalescing for pointermove handling during drag.
  useSnapRafCoalescing: true,

  // Development-only debug log for SnapV2 (1 line/sec max). Remove before prod.
  enableSnapV2Debug: true,

  // Low-latency mode: remove debounce/throttle from visual feedback paths.
  lowLatencyMode: true,
  // Debounce time for save/network batching (ms)
  saveDebounceMs: 400,

  // Hide design grid size control in Settings UI. Visual overlay still renders if enabled.
  hideDesignGridSizeControl: true,

  // Expose lightweight grid editor (admin only) for DB GridConfig authoring.
  enableGridEditor: true,

  // When true, ignore any localStorage fallback and only use DB grid values.
  gridUseDBOnly: true,
};



export interface ToolItem {
  id: string;
  label: string;
  icon: string;
}

export interface ColorMode {
  mode: 'text' | 'background' | 'border';
}

export interface ExcelPasteData {
  data: string;
  parsedRows: string[][];
  rowCount: number;
  colCount: number;
}

export interface ColorPaletteProps {
  colors: string[];
  currentColor: string;
  colorMode: 'text' | 'background' | 'border';
  onColorSelect: (color: string) => void;
  showTransparent?: boolean;
}

export interface SectionProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export interface SettingsUpdateFunction {
  (category: 'admin' | 'view', updates: any): void;
}

export interface SafeSettings {
  admin: {
    autoToolSwitch: boolean;
    gridVisible: boolean;
    gridSize: number;
    gridSnapEnabled: boolean;
    stepSnapDuringDrag?: boolean;
    defaultFontSize: number;
    defaultBoxWidth: number;
    defaultBoxHeight: number;
    objectCreationPosition: { x: number; y: number };
    defaultCheckboxSettings: {
      checkedColor: string;
      uncheckedColor: string;
      checkedBackgroundColor: string;
      uncheckedBackgroundColor: string;
      checkedBackgroundOpacity: number;
      uncheckedBackgroundOpacity: number;
    };
    excelPasteSettings: {
      startPosition: { x: number; y: number };
      cellWidth: number;
      cellHeight: number;
      fontSize: number;
      fontColor: string;
      backgroundColor: string;
      maxRows: number;
      maxCols: number;
    };
  };
  view: {
    virtualKeyboardEnabled: boolean;
    touchMode: boolean;
    usePerfectFreehand: boolean; // perfect-freehand 사용 여부
  };
}

export interface ToolbarCallbacks {
  handleCreateText: () => Promise<void>;
  handleCreateCheckbox: () => Promise<void>;
  handleCreateImage: () => Promise<void>;
  handleDuplicateObject: () => Promise<void>;
  handleDeleteObject: () => Promise<void>;
  handleBringToFront: () => Promise<void>;
  handleBringForward: () => Promise<void>;
  handleSendBackward: () => Promise<void>;
  handleSendToBack: () => Promise<void>;
  handleCreateExcelCells: () => Promise<void>;
  handleDeleteExcelCellGroups: () => Promise<void>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface TextStyleUpdate {
  color?: string;
  bold?: boolean;
  italic?: boolean;
  horizontalAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  fontFamily?: string;
}

export interface BoxStyleUpdate {
  backgroundColor?: string;
  backgroundOpacity?: number;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
}
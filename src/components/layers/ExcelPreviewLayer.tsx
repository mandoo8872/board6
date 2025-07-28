import React from 'react';
import { useAdminConfigStore } from '../../store';

// 간단한 파싱 함수 (Toolbar 컴포넌트와 동일)
const parseExcelData = (data: string) => {
  return data
    .split('\n')
    .filter(line => line.trim())
    .map(line => line.split('\t'));
};

const ExcelPreviewLayer: React.FC = () => {
  const { settings } = useAdminConfigStore();
  
  // 툴바에서 설정한 값들을 가져옴 (미리보기에서는 상태를 직접 접근할 수 없어서)
  // 이 컴포넌트는 props로 받거나 전역 상태로 관리해야 함
  // 일단 기본값으로 구현하고 나중에 연결
  
  const [previewData, setPreviewData] = React.useState<string>('');
  const [showPreview, setShowPreview] = React.useState<boolean>(false);
  
  // 미리보기를 위한 이벤트 리스너 추가
  React.useEffect(() => {
    const handlePreview = (event: CustomEvent) => {
      setPreviewData(event.detail.data);
      setShowPreview(event.detail.show);
    };
    
    window.addEventListener('excel-preview-update', handlePreview as EventListener);
    
    return () => {
      window.removeEventListener('excel-preview-update', handlePreview as EventListener);
    };
  }, []);
  
  if (!showPreview || !previewData.trim()) {
    return null;
  }
  
  // 설정 기본값
  const safeSettings = {
    excelPasteSettings: settings?.admin?.excelPasteSettings ?? {
      startPosition: { x: 100, y: 100 },
      cellWidth: 120,
      cellHeight: 40,
      fontSize: 14,
      fontColor: '#000000',
      backgroundColor: 'transparent',
      maxRows: 50,
      maxCols: 50
    }
  };
  
  const parsedData = parseExcelData(previewData);
  const { startPosition, cellWidth, cellHeight } = safeSettings.excelPasteSettings;
  
  // 전체 영역 계산
  const totalWidth = Math.max(...parsedData.map(row => row.length)) * cellWidth;
  const totalHeight = parsedData.length * cellHeight;
  
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 15, // BaseLayer(10) 위, DrawLayer(20) 아래
      }}
    >
      {/* 미리보기 영역 외곽선 */}
      <div
        style={{
          position: 'absolute',
          left: startPosition.x,
          top: startPosition.y,
          width: totalWidth,
          height: totalHeight,
          border: '3px dashed #fbbf24', // 노란색 점선
          backgroundColor: 'rgba(251, 191, 36, 0.1)', // 반투명 노란색 배경
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(251, 191, 36, 0.3)',
        }}
      />
      
      {/* 개별 셀 미리보기 */}
      {parsedData.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div
            key={`preview-${rowIndex}-${colIndex}`}
            style={{
              position: 'absolute',
              left: startPosition.x + colIndex * cellWidth,
              top: startPosition.y + rowIndex * cellHeight,
              width: cellWidth,
              height: cellHeight,
              border: '1px solid rgba(251, 191, 36, 0.4)',
              backgroundColor: 'rgba(251, 191, 36, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: `${safeSettings.excelPasteSettings.fontSize}px`,
              color: 'rgba(251, 191, 36, 0.8)',
              fontWeight: 'bold',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              padding: '2px',
            }}
          >
            {cell}
          </div>
        ))
      )}
      
      {/* 안내 텍스트 */}
      <div
        style={{
          position: 'absolute',
          left: startPosition.x,
          top: startPosition.y - 30,
          backgroundColor: 'rgba(251, 191, 36, 0.9)',
          color: '#ffffff',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        }}
      >
        📊 미리보기: {parsedData.length}행 × {Math.max(...parsedData.map(row => row.length))}열
      </div>
    </div>
  );
};

export default ExcelPreviewLayer; 
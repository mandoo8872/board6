import React, { useRef } from 'react';
import { ref, set as firebaseSet } from 'firebase/database';
import { database } from '../../../config/firebase';
import { TextObject, ImageObject, DrawObject, FloorImage, Settings } from '../../../types';
import { FloppyDisk, Database, FolderOpen } from 'phosphor-react';

interface DataManagementSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  // 현재 데이터
  textObjects: TextObject[];
  imageObjects: ImageObject[];
  drawObjects: DrawObject[];
  floorImage: FloorImage | null;
  settings: Settings;
  // 액션 함수들
  initializeFirebaseListeners: () => void;
}

interface BoardData {
  textObjects: TextObject[];
  imageObjects: ImageObject[];
  drawObjects: DrawObject[];
  floorImage: FloorImage | null;
  settings: Settings;
  exportedAt: string;
  version: '1.0';
}

const DataManagementSection: React.FC<DataManagementSectionProps> = ({
  isExpanded,
  onToggle,
  textObjects,
  imageObjects,
  drawObjects,
  floorImage,
  settings,
  initializeFirebaseListeners
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 데이터 저장 (JSON 다운로드)
  const handleSaveData = () => {
    try {
      const boardData: BoardData = {
        textObjects,
        imageObjects,
        drawObjects,
        floorImage,
        settings,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      const dataStr = JSON.stringify(boardData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      // 파일명 생성 (날짜시간 포함)
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `board7-backup-${timestamp}.json`;
      
      // 다운로드 링크 생성
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(dataBlob);
      downloadLink.download = filename;
      downloadLink.click();
      
      // 메모리 정리
      URL.revokeObjectURL(downloadLink.href);
      
      alert(`✅ 데이터가 성공적으로 저장되었습니다!\n파일명: ${filename}`);
      
    } catch (error) {
      console.error('데이터 저장 오류:', error);
      alert('❌ 데이터 저장 중 오류가 발생했습니다.');
    }
  };

  // 데이터 불러오기 파일 선택
  const handleLoadDataClick = () => {
    fileInputRef.current?.click();
  };

  // 파일 불러오기 처리
  const handleFileLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증
    if (!file.name.endsWith('.json')) {
      alert('❌ JSON 파일만 업로드 가능합니다.');
      return;
    }

    // 확인 팝업
    const confirmMessage = `⚠️ 경고: 현재 캔버스의 모든 객체와 그리기 요소가 삭제됩니다!

현재 데이터:
• 텍스트 객체: ${textObjects.length}개
• 이미지 객체: ${imageObjects.length}개  
• 그리기 요소: ${drawObjects.length}개
• 배경 이미지: ${floorImage ? '있음' : '없음'}

정말로 불러오시겠습니까?`;

    if (!confirm(confirmMessage)) {
      // 파일 입력 초기화
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const jsonData = e.target?.result as string;
        const boardData: BoardData = JSON.parse(jsonData);
        
        // 데이터 구조 검증
        if (!boardData.version || !boardData.exportedAt) {
          throw new Error('올바르지 않은 백업 파일 형식입니다.');
        }

        // Firebase에서 모든 데이터 삭제 후 새 데이터 설정
        await clearAndLoadData(boardData);
        
        alert(`✅ 데이터가 성공적으로 불러와졌습니다!

불러온 데이터:
• 텍스트 객체: ${boardData.textObjects?.length || 0}개
• 이미지 객체: ${boardData.imageObjects?.length || 0}개
• 그리기 요소: ${boardData.drawObjects?.length || 0}개
• 배경 이미지: ${boardData.floorImage ? '있음' : '없음'}
• 백업 생성일: ${new Date(boardData.exportedAt).toLocaleString()}`);

      } catch (error) {
        console.error('데이터 불러오기 오류:', error);
        alert('❌ 데이터 불러오기 중 오류가 발생했습니다.\n파일이 손상되었거나 올바르지 않은 형식입니다.');
      }
      
      // 파일 입력 초기화
      event.target.value = '';
    };

    reader.readAsText(file);
  };

  // Firebase에서 모든 데이터 삭제 후 새 데이터 로드
  const clearAndLoadData = async (boardData: BoardData) => {
    try {
      // 1. 기존 데이터 모두 삭제 (null로 설정)
      await Promise.all([
        firebaseSet(ref(database, 'textObjects'), null),
        firebaseSet(ref(database, 'imageObjects'), null),
        firebaseSet(ref(database, 'drawObjects'), null),
        firebaseSet(ref(database, 'floorImage'), null)
      ]);

      // 2. 새 데이터 설정
      const promises = [];

      // 텍스트 객체들 추가
      if (boardData.textObjects?.length > 0) {
        const textObjectsData = boardData.textObjects.reduce((acc, obj) => {
          acc[obj.id] = obj;
          return acc;
        }, {} as Record<string, TextObject>);
        promises.push(firebaseSet(ref(database, 'textObjects'), textObjectsData));
      }

      // 이미지 객체들 추가
      if (boardData.imageObjects?.length > 0) {
        const imageObjectsData = boardData.imageObjects.reduce((acc, obj) => {
          acc[obj.id] = obj;
          return acc;
        }, {} as Record<string, ImageObject>);
        promises.push(firebaseSet(ref(database, 'imageObjects'), imageObjectsData));
      }

      // 그리기 객체들 추가
      if (boardData.drawObjects?.length > 0) {
        const drawObjectsData = boardData.drawObjects.reduce((acc, obj) => {
          acc[obj.id] = obj;
          return acc;
        }, {} as Record<string, DrawObject>);
        promises.push(firebaseSet(ref(database, 'drawObjects'), drawObjectsData));
      }

      // 배경 이미지 설정
      if (boardData.floorImage) {
        promises.push(firebaseSet(ref(database, 'floorImage'), boardData.floorImage));
      }

      // 설정 업데이트
      if (boardData.settings) {
        promises.push(firebaseSet(ref(database, 'settings'), boardData.settings));
      }

      // 모든 데이터 설정 완료 대기
      await Promise.all(promises);
      
      // Firebase 리스너 재초기화 (데이터 동기화를 위해)
      setTimeout(() => {
        initializeFirebaseListeners();
      }, 500);

    } catch (error) {
      console.error('데이터 로드 오류:', error);
      throw error;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-t-xl transition-colors"
      >
        <span className="flex items-center gap-2">
          <Database size={20} weight="duotone" color="#302929" /> 데이터 관리
        </span>
        <span className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      
      {isExpanded && (
        <div className="p-4 border-t border-slate-200 space-y-4">
          
          {/* 현재 데이터 현황 */}
          <div className="bg-slate-50 rounded-lg p-3 space-y-2">
            <h4 className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <span>📊</span> 현재 데이터 현황
            </h4>
            <div className="text-xs text-slate-600 space-y-1">
              <div>• 텍스트 객체: <span className="font-medium">{textObjects.length}개</span></div>
              <div>• 이미지 객체: <span className="font-medium">{imageObjects.length}개</span></div>
              <div>• 그리기 요소: <span className="font-medium">{drawObjects.length}개</span></div>
              <div>• 배경 이미지: <span className="font-medium">{floorImage ? '있음' : '없음'}</span></div>
            </div>
          </div>

          {/* 저장/불러오기 버튼들 */}
          <div className="space-y-3">
            {/* 저장 버튼 */}
            <button
              onClick={handleSaveData}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <FloppyDisk size={18} weight="duotone" color="#FFFFFF" />
              데이터 저장 (JSON 다운로드)
            </button>

            {/* 불러오기 버튼 */}
            <button
              onClick={handleLoadDataClick}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <FolderOpen size={18} weight="duotone" color="#FFFFFF" />
              불러오기 (JSON 업로드)
            </button>

            {/* 숨겨진 파일 입력 */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileLoad}
              className="hidden"
            />
          </div>

          {/* 주의사항 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h5 className="text-xs font-bold text-yellow-700 mb-2 flex items-center gap-1">
              <span>⚠️</span> 주의사항
            </h5>
            <div className="text-xs text-yellow-700 space-y-1">
              <div>• 불러오기 시 현재 모든 데이터가 삭제됩니다</div>
              <div>• 저장된 JSON 파일은 오프라인에서 보관됩니다</div>
              <div>• 백업을 정기적으로 생성하는 것을 권장합니다</div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default DataManagementSection;
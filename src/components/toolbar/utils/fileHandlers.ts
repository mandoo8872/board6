/**
 * 이미지 파일을 base64로 변환
 */
export const convertImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const result = event.target?.result as string;
      resolve(result);
    };
    
    reader.onerror = () => {
      reject(new Error('파일 읽기 실패'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * 이미지의 실제 크기 측정
 */
export const getImageDimensions = (src: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    
    img.onerror = () => {
      reject(new Error('이미지 로드 실패'));
    };
    
    img.src = src;
  });
};

/**
 * 파일 선택 다이얼로그 열기
 */
export const openFileDialog = (accept: string = 'image/*'): Promise<File | null> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      resolve(file || null);
    };
    
    input.click();
  });
};

/**
 * 이미지를 최적 크기로 조정
 */
export const calculateOptimalImageSize = (
  originalWidth: number, 
  originalHeight: number, 
  targetWidth: number = 200
): { width: number; height: number } => {
  const aspectRatio = originalHeight / originalWidth;
  const height = targetWidth * aspectRatio;
  
  return {
    width: targetWidth,
    height: height
  };
};

/**
 * Excel 미리보기 이벤트 발송
 */
export const dispatchExcelPreviewEvent = (data: string, show: boolean): void => {
  const event = new CustomEvent('excel-preview-update', {
    detail: { data, show }
  });
  window.dispatchEvent(event);
};

/**
 * 데이터를 JSON 파일로 다운로드
 */
export const downloadAsJSON = (data: any, filename: string): void => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  
  URL.revokeObjectURL(url);
};

/**
 * JSON 파일 업로드 및 파싱
 */
export const uploadJSONFile = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('파일이 선택되지 않았습니다.'));
        return;
      }
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        resolve(data);
      } catch (error) {
        reject(new Error('JSON 파일 파싱 실패'));
      }
    };
    
    input.click();
  });
};
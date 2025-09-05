import { useCallback } from 'react';
import { ImageObject, TextObject } from '../../../../types';

export const useClipboard = (
  addImageObject: (obj: Omit<ImageObject, 'id'>) => Promise<string>,
  addTextObject: (obj: Omit<TextObject, 'id'>) => Promise<string>,
  settings?: any
) => {
  // 클립보드 붙여넣기 핸들러 (이미지 + 텍스트)
  const handleClipboardPaste = useCallback(async () => {
    try {
      // 클립보드 API 지원 확인
      if (!navigator.clipboard || !navigator.clipboard.read) {
        console.warn('클립보드 API가 지원되지 않습니다.');
        return;
      }

      const clipboardItems = await navigator.clipboard.read();
      
      for (const clipboardItem of clipboardItems) {
        // 이미지 타입 처리
        const imageTypes = clipboardItem.types.filter(type => type.startsWith('image/'));
        
        if (imageTypes.length > 0) {
          const imageType = imageTypes[0];
          const blob = await clipboardItem.getType(imageType);
          
          // Blob을 base64로 변환
          const reader = new FileReader();
          reader.onload = async (event) => {
            const src = event.target?.result as string;
            
            // 설정이 로드되지 않았을 때 기본값 제공
            const objectCreationPosition = settings?.admin?.objectCreationPosition ?? { x: 260, y: 950 };
            
            // 이미지 실제 크기 측정을 위한 임시 이미지 객체 생성
            const img = new Image();
            img.onload = async () => {
              try {
                // 가로 200px 고정, 세로는 비율에 맞춰 계산
                const targetWidth = 200;
                const aspectRatio = img.naturalHeight / img.naturalWidth;
                const targetHeight = targetWidth * aspectRatio;
                
                const newImageObject = {
                  x: objectCreationPosition.x,
                  y: objectCreationPosition.y,
                  width: targetWidth,
                  height: targetHeight,
                  src,
                  permissions: {
                    editable: true,
                    movable: true,
                    resizable: true,
                    deletable: true,
                  },
                  zIndex: 10000 + Date.now() % 100000, // 일반 객체는 10000 이후부터
                  locked: false,
                  visible: true,
                  opacity: 1,
                  maintainAspectRatio: true, // 비율 유지 활성화
                  lastModified: Date.now()
                };

                await addImageObject(newImageObject);
                console.log('클립보드 이미지가 성공적으로 붙여넣어졌습니다.');
              } catch (error) {
                console.error('이미지 객체 생성 실패:', error);
              }
            };
            
            img.onerror = () => {
              console.error('클립보드 이미지 로드 실패');
            };
            
            img.src = src;
          };
          
          reader.onerror = () => {
            console.error('클립보드 이미지 읽기 실패');
          };
          
          reader.readAsDataURL(blob);
          break; // 첫 번째 이미지만 처리
        }
        
        // 텍스트 타입 처리
        const textTypes = clipboardItem.types.filter(type => type === 'text/plain');
        
        if (textTypes.length > 0) {
          const textBlob = await clipboardItem.getType('text/plain');
          const text = await textBlob.text();
          
          if (text.trim()) {
            // 설정이 로드되지 않았을 때 기본값 제공
            const objectCreationPosition = settings?.admin?.objectCreationPosition ?? { x: 260, y: 950 };
            const defaultCheckboxSettings = settings?.admin?.defaultCheckboxSettings ?? {
              checkedColor: '#22c55e',
              uncheckedColor: '#f3f4f6',
              checkedBackgroundColor: '#ffffff',
              uncheckedBackgroundColor: '#ffffff',
              checkedBackgroundOpacity: 1,
              uncheckedBackgroundOpacity: 1
            };
            
            const newCheckboxObject = {
              x: objectCreationPosition.x,
              y: objectCreationPosition.y,
              width: settings?.admin?.defaultBoxWidth ?? 200,
              height: settings?.admin?.defaultBoxHeight ?? 60,
              text: text.trim(),
              fontSize: settings?.admin?.defaultFontSize ?? 16,
              textStyle: {
                color: '#000000',
                bold: true,
                italic: false,
                horizontalAlign: 'left' as const,
                verticalAlign: 'middle' as const,
                fontFamily: 'Arial'
              },
              boxStyle: {
                backgroundColor: 'transparent',
                backgroundOpacity: 1,
                borderColor: '#000000',
                borderWidth: 1,
                borderRadius: 8
              },
              permissions: {
                editable: true,
                movable: true,
                resizable: true,
                deletable: true,
              },
              zIndex: 10000 + Date.now() % 100000, // 일반 객체는 10000 이후부터
              locked: false,
              visible: true,
              opacity: 1,
              hasCheckbox: true,
              checkboxChecked: false,
              checkboxCheckedColor: defaultCheckboxSettings.checkedColor,
              checkboxUncheckedColor: defaultCheckboxSettings.uncheckedColor,
              checkedBackgroundColor: defaultCheckboxSettings.checkedBackgroundColor,
              uncheckedBackgroundColor: defaultCheckboxSettings.uncheckedBackgroundColor,
              checkedBackgroundOpacity: defaultCheckboxSettings.checkedBackgroundOpacity,
              uncheckedBackgroundOpacity: defaultCheckboxSettings.uncheckedBackgroundOpacity,
              isEditing: false,
              lastModified: Date.now()
            };

            await addTextObject(newCheckboxObject);
            console.log('클립보드 텍스트가 체크박스로 성공적으로 붙여넣어졌습니다.');
          }
          break; // 첫 번째 텍스트만 처리
        }
      }
    } catch (error) {
      // 사용자가 클립보드 접근을 거부했거나 다른 오류
      console.log('클립보드에서 데이터를 읽을 수 없습니다:', error);
    }
  }, [settings?.admin?.objectCreationPosition, settings?.admin?.defaultCheckboxSettings, settings?.admin?.defaultBoxWidth, settings?.admin?.defaultBoxHeight, settings?.admin?.defaultFontSize, addImageObject, addTextObject]);

  return {
    handleClipboardPaste
  };
};
import { useRef, useEffect } from 'react';

export const useDeviceDetection = () => {
  const isSafariRef = useRef<boolean>(false);
  const lastPointerEventTimeRef = useRef<number>(0);
  
  // Safari/iOS 감지 (iPad Safari 호환성을 위한 최소한의 조건부 로직)
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    isSafariRef.current = isIOS || isSafari;
  }, []);

  const updatePointerEventTime = (timeStamp: number) => {
    lastPointerEventTimeRef.current = timeStamp;
  };

  const isGhostClick = (eventTimeStamp: number) => {
    // iPad Safari에서 ghost click 방지 (포인터 이벤트 이후 300ms 내의 클릭은 무시)
    return isSafariRef.current && eventTimeStamp - lastPointerEventTimeRef.current < 300;
  };

  const isIPhone = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    return /iphone/.test(userAgent);
  };

  return {
    isSafari: isSafariRef.current,
    updatePointerEventTime,
    isGhostClick,
    isIPhone
  };
};
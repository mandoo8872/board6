import React from 'react';

interface FixedGridLayerProps {
  isViewPage?: boolean;
}

const FixedGridLayer: React.FC<FixedGridLayerProps> = ({ isViewPage: _isViewPage = false }) => {
  // 엑셀 붙여넣기 기능 제거됨
  // 향후 다른 용도로 사용할 수 있도록 컴포넌트 구조만 유지
  return null;
};

export default FixedGridLayer; 
// 한글 조립 유틸리티

// 초성, 중성, 종성 배열
export const INITIALS = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
export const MIDDLES = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
export const FINALS = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

// 자음/모음 구분
export const CONSONANTS = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
export const VOWELS = 'ㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣㅐㅔㅒㅖㅘㅙㅚㅝㅞㅟㅢ';

// 복합 모음 조합 규칙
export const COMPOUND_VOWELS: Record<string, string> = {
  'ㅗㅏ': 'ㅘ',
  'ㅗㅐ': 'ㅙ',
  'ㅗㅣ': 'ㅚ',
  'ㅜㅓ': 'ㅝ',
  'ㅜㅔ': 'ㅞ',
  'ㅜㅣ': 'ㅟ',
  'ㅡㅣ': 'ㅢ'
};

// 복합 자음 조합 규칙 (종성)
export const COMPOUND_CONSONANTS: Record<string, string> = {
  'ㄱㅅ': 'ㄳ',
  'ㄴㅈ': 'ㄵ',
  'ㄴㅎ': 'ㄶ',
  'ㄹㄱ': 'ㄺ',
  'ㄹㅁ': 'ㄻ',
  'ㄹㅂ': 'ㄼ',
  'ㄹㅅ': 'ㄽ',
  'ㄹㅌ': 'ㄾ',
  'ㄹㅍ': 'ㄿ',
  'ㄹㅎ': 'ㅀ',
  'ㅂㅅ': 'ㅄ'
};

// 한글 조립 함수 (개선된 버전)
export const assembleHangul = (initial: string, middle: string, final: string = ''): string => {
  const initialIndex = INITIALS.indexOf(initial);
  const middleIndex = MIDDLES.indexOf(middle);
  const finalIndex = FINALS.indexOf(final);
  
  if (initialIndex >= 0 && middleIndex >= 0 && finalIndex >= 0) {
    const code = 0xAC00 + (initialIndex * 21 + middleIndex) * 28 + finalIndex;
    return String.fromCharCode(code);
  }
  
  // 조립 실패 시 개별 자모 반환하지 않고 빈 문자열 반환
  return '';
};

// 한글 분해 함수
export const disassembleHangul = (char: string): { initial: string; middle: string; final: string } | null => {
  const code = char.charCodeAt(0);
  
  if (code >= 0xAC00 && code <= 0xD7A3) {
    const base = code - 0xAC00;
    const initialIndex = Math.floor(base / (21 * 28));
    const middleIndex = Math.floor((base % (21 * 28)) / 28);
    const finalIndex = base % 28;
    
    return {
      initial: INITIALS[initialIndex],
      middle: MIDDLES[middleIndex],
      final: FINALS[finalIndex]
    };
  }
  
  return null;
};

// 자음인지 확인
export const isConsonant = (char: string): boolean => {
  return CONSONANTS.includes(char);
};

// 모음인지 확인
export const isVowel = (char: string): boolean => {
  return VOWELS.includes(char);
};

// 복합 모음 조합 가능한지 확인
export const canCombineVowels = (vowel1: string, vowel2: string): string | null => {
  const compound = COMPOUND_VOWELS[vowel1 + vowel2];
  return compound || null;
};

// 복합 자음 조합 가능한지 확인
export const canCombineConsonants = (consonant1: string, consonant2: string): string | null => {
  const compound = COMPOUND_CONSONANTS[consonant1 + consonant2];
  return compound || null;
};
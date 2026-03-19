import { NameData, SurnameSyllable } from './types';
import { CharSlotData, Eumyang, NameInput, Ohaeng } from '@/naming-tool/types';
import { soundEumyangFromHangul } from '@/naming-tool/domain/soundEumyangMap';

function eumyangStrToType(s: string): Eumyang | null {
  if (s === '음' || s === '양') return s;
  return null;
}

function surnameSyllableToSlot(s: SurnameSyllable): CharSlotData {
  return {
    hangul: s.한글,
    hanja: s.한자,
    mean: s.meaning,
    strokeCount: s.stroke_count,
    charOhaeng: (s.오행 as Ohaeng) || null,
    soundEumyang: eumyangStrToType(s.sound_eumyang),
    strokeEumyang: eumyangStrToType(s.stroke_eumyang),
  };
}

const EMPTY_SLOT: CharSlotData = {
  hangul: '',
  hanja: '',
  mean: '',
  strokeCount: null,
  charOhaeng: null,
  soundEumyang: null,
  strokeEumyang: null,
};

/**
 * AI가 추천한 NameData를 SelfNaming 분석 섹션에서 사용하는 NameInput(CharSlotData) 형식으로 변환합니다.
 *
 * surname_syllable: 백엔드에서 성씨 한자의 획수·자원오행·음양 데이터를 포함해 반환합니다.
 * syllables: 이름 글자(성씨 제외)만 담고 있습니다.
 *   syllables[0] = 이름 첫째 (first1)
 *   syllables[1] = 이름 둘째 (first2, 있는 경우)
 */
export function nameDataToNameInput(nameData: NameData): NameInput {
  const { full_name, 한글: nameOnly, syllables, surname_syllable } = nameData;

  let surnameSlot: CharSlotData;
  if (surname_syllable) {
    surnameSlot = surnameSyllableToSlot(surname_syllable);
  } else {
    // surname_syllable이 없는 경우(구 응답) 폴백: 한글만 추출
    const surnameHangul = full_name.slice(
      0,
      full_name.length - nameOnly.length,
    );
    surnameSlot = surnameHangul
      ? {
          hangul: surnameHangul,
          hanja: '',
          mean: '',
          strokeCount: null,
          charOhaeng: null,
          soundEumyang: soundEumyangFromHangul(surnameHangul),
          strokeEumyang: null,
        }
      : EMPTY_SLOT;
  }

  function getNameSlot(index: number): CharSlotData {
    const s = syllables[index];
    if (!s) return EMPTY_SLOT;

    // stroke_count: 백엔드가 직접 내려주면 사용, 없으면 hanja_options에서 찾기
    const matchedOption = s.hanja_options?.find((o) => o.한자 === s.한자);
    const strokeCount = s.stroke_count ?? matchedOption?.stroke_count ?? null;

    // char_오행: 자원오행 (백엔드가 직접 내려주면 사용, 없으면 hanja_options에서 찾기)
    const charOhaengStr = s.char_오행 ?? matchedOption?.오행 ?? '';

    return {
      hangul: s.한글,
      hanja: s.한자,
      mean: s.meaning,
      strokeCount,
      charOhaeng: (charOhaengStr as Ohaeng) || null,
      soundEumyang: eumyangStrToType(s.sound_eumyang ?? ''),
      strokeEumyang: eumyangStrToType(s.stroke_eumyang ?? ''),
    };
  }

  return {
    surname: surnameSlot,
    first1: getNameSlot(0),
    first2: getNameSlot(1),
  };
}

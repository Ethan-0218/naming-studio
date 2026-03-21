import { NameData } from './types';
import { NameInput } from '@/naming-tool/types';

/**
 * 세 글자 슬롯(family/first/second)이 모두 있고 hangul이 문자열인지 확인합니다.
 * 세션 복원·구 API 응답 등에서 `firstCharacter: undefined`인 경우(`in` 연산자만으로는 구분 불가)를 걸러냅니다.
 */
export function isCompleteNameData(data: unknown): data is NameData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (typeof d.한글 !== 'string' || typeof d.full_name !== 'string') {
    return false;
  }
  for (const key of [
    'familyCharacter',
    'firstCharacter',
    'secondCharacter',
  ] as const) {
    const slot = d[key];
    if (!slot || typeof slot !== 'object') return false;
    if (typeof (slot as { hangul?: unknown }).hangul !== 'string') {
      return false;
    }
  }
  return true;
}

/**
 * AI가 추천한 NameData를 SelfNaming 분석 섹션에서 사용하는 NameInput 형식으로 변환합니다.
 * HanjaCharData는 CharSlotData의 모든 필드를 포함하므로 직접 할당 가능합니다.
 */
export function nameDataToNameInput(nameData: NameData): NameInput {
  return {
    surname: nameData.familyCharacter,
    first1: nameData.firstCharacter,
    first2: nameData.secondCharacter,
  };
}

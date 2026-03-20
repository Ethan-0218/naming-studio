/**
 * 백엔드 domain/saju/사주보완등급.py 와 동일: 한자 자원오행 3글자 기준
 * net = (용신 글자 수 + 희신 글자 수) − 기신 글자 수 → 大吉/吉/平/凶/大凶
 */
import type { Ohaeng, SajuComplementLevel } from '../types';

/** 글자 자원오행이 용신 기준으로 어떤 역할인지 (백엔드 net 집계와 동일 분류) */
export type CharYongsinRole = '용' | '희' | '기' | '중';

/** 용신을 생해 주는 오행 (백엔드 오행.get생아오행) */
export function heesinOhaeng(yongsin: Ohaeng): Ohaeng {
  const m: Record<Ohaeng, Ohaeng> = {
    목: '수',
    화: '목',
    토: '화',
    금: '토',
    수: '금',
  };
  return m[yongsin];
}

/** 용신을 극하는 오행 (백엔드 오행.get극아오행) */
export function gisinOhaeng(yongsin: Ohaeng): Ohaeng {
  const m: Record<Ohaeng, Ohaeng> = {
    목: '금',
    화: '수',
    토: '목',
    금: '화',
    수: '토',
  };
  return m[yongsin];
}

export function charYongsinRole(
  yongsin: Ohaeng,
  charOhaeng: Ohaeng | null,
): CharYongsinRole | null {
  if (charOhaeng == null) return null;
  const hui = heesinOhaeng(yongsin);
  const gi = gisinOhaeng(yongsin);
  if (charOhaeng === yongsin) return '용';
  if (charOhaeng === hui) return '희';
  if (charOhaeng === gi) return '기';
  return '중';
}

/**
 * 성·이름1·이름2의 자원오행만 사용 (null 제외). 백엔드와 동일 규칙.
 */
export function computeSajuComplementLevel(
  yongsin: Ohaeng,
  charOhaengSlots: (Ohaeng | null)[],
): SajuComplementLevel {
  const elements = charOhaengSlots.filter((e): e is Ohaeng => e != null);
  if (elements.length === 0) {
    return '平';
  }

  const hui = heesinOhaeng(yongsin);
  const gi = gisinOhaeng(yongsin);

  let yCnt = 0;
  let hCnt = 0;
  let gCnt = 0;
  for (const e of elements) {
    if (e === yongsin) yCnt += 1;
    else if (e === hui) hCnt += 1;
    else if (e === gi) gCnt += 1;
  }

  const net = yCnt + hCnt - gCnt;
  if (net >= 2) return '大吉';
  if (net === 1) return '吉';
  if (net === 0) return '平';
  if (net === -1) return '凶';
  return '大凶';
}

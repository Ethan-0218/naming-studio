import { SuriEntry, SurigyeokResult, Gender } from '../types';
import { SURIGYEOK_81 } from '../data/surigyeok81';
import { toScore } from './ratingScore';

function computeSuriEntry(strokeSum: number, gender: Gender): SuriEntry {
  const key = String(strokeSum % 81);
  const row = SURIGYEOK_81[key];
  const level = row.level[gender];
  return {
    number: strokeSum % 81,
    level,
    score: toScore(level),
    name1: row.name1,
    name2: row.name2,
    interpretation: row.interpretation,
    easyInterpretation: row.easyInterpretation,
  };
}

/**
 * 이름수리격 계산
 * - 원격: 이름1획 + 이름2획 (외자: 이름1획 × 2)
 * - 형격: 성획 + 이름1획
 * - 이격: 성획 + 이름2획 (외자: 성획 + 이름1획)
 * - 정격: 성획 + 이름1획 + 이름2획
 */
export function computeSurigyeok(
  sungStroke: number,
  ireum1Stroke: number,
  ireum2Stroke: number | null,
  gender: Gender,
): SurigyeokResult {
  const wongyeok =
    ireum2Stroke != null
      ? computeSuriEntry(ireum1Stroke + ireum2Stroke, gender)
      : computeSuriEntry(ireum1Stroke * 2, gender);

  const hyeongyeok = computeSuriEntry(sungStroke + ireum1Stroke, gender);

  const igyeok =
    ireum2Stroke != null
      ? computeSuriEntry(sungStroke + ireum2Stroke, gender)
      : computeSuriEntry(sungStroke + ireum1Stroke, gender);

  const jeongyeok =
    ireum2Stroke != null
      ? computeSuriEntry(sungStroke + ireum1Stroke + ireum2Stroke, gender)
      : computeSuriEntry(sungStroke + ireum1Stroke, gender);

  const totalScore =
    (wongyeok.score + hyeongyeok.score + igyeok.score + jeongyeok.score) / 4;

  return { wongyeok, hyeongyeok, igyeok, jeongyeok, totalScore };
}

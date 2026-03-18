// ─── 지역 데이터 ───────────────────────────────────────────────────────────────
export interface Region {
  name: string;
  full: string;
  offset: number | null; // 지방시 보정 분 (분 단위, null = 해외)
}

export const REGIONS: Region[] = [
  { name: '서울', full: '서울특별시', offset: 32 },
  { name: '인천', full: '인천광역시', offset: 33 },
  { name: '대전', full: '대전광역시', offset: 27 },
  { name: '대구', full: '대구광역시', offset: 27 },
  { name: '세종', full: '세종특별자치시', offset: 27 },
  { name: '광주', full: '광주광역시', offset: 16 },
  { name: '울산', full: '울산광역시', offset: 22 },
  { name: '부산', full: '부산광역시', offset: 24 },
  { name: '경기', full: '경기도', offset: 31 },
  { name: '강원', full: '강원특별자치도', offset: 28 },
  { name: '충북', full: '충청북도', offset: 28 },
  { name: '충남', full: '충청남도', offset: 29 },
  { name: '전북', full: '전북특별자치도', offset: 17 },
  { name: '전남', full: '전라남도', offset: 16 },
  { name: '경북', full: '경상북도', offset: 23 },
  { name: '경남', full: '경상남도', offset: 21 },
  { name: '제주', full: '제주특별자치도', offset: 34 },
  { name: '수원', full: '경기 수원시', offset: 30 },
  { name: '고양', full: '경기 고양시', offset: 31 },
  { name: '용인', full: '경기 용인시', offset: 30 },
  { name: '성남', full: '경기 성남시', offset: 30 },
  { name: '부천', full: '경기 부천시', offset: 33 },
  { name: '안산', full: '경기 안산시', offset: 32 },
  { name: '화성', full: '경기 화성시', offset: 31 },
  { name: '남양주', full: '경기 남양주시', offset: 30 },
  { name: '안양', full: '경기 안양시', offset: 32 },
  { name: '평택', full: '경기 평택시', offset: 30 },
  { name: '청주', full: '충북 청주시', offset: 28 },
  { name: '천안', full: '충남 천안시', offset: 29 },
  { name: '전주', full: '전북 전주시', offset: 17 },
  { name: '창원', full: '경남 창원시', offset: 21 },
  { name: '포항', full: '경북 포항시', offset: 22 },
  { name: '춘천', full: '강원 춘천시', offset: 30 },
  { name: '원주', full: '강원 원주시', offset: 29 },
  { name: '제주시', full: '제주 제주시', offset: 34 },
  { name: '서귀포', full: '제주 서귀포시', offset: 34 },
  { name: '해외', full: '해외 출생', offset: null },
];

// ─── 시진 데이터 ──────────────────────────────────────────────────────────────
export interface Sijan {
  name: string;
  hanja: string;
  hanjaFull: string;
  range: string;
  startHour: number; // 24h 기준 시진 시작 시각
}

export const SIJAN: Sijan[] = [
  {
    name: '자시',
    hanja: '子',
    hanjaFull: '子時',
    range: '오후 11:00 – 오전 1:00',
    startHour: 23,
  },
  {
    name: '축시',
    hanja: '丑',
    hanjaFull: '丑時',
    range: '오전 1:00 – 오전 3:00',
    startHour: 1,
  },
  {
    name: '인시',
    hanja: '寅',
    hanjaFull: '寅時',
    range: '오전 3:00 – 오전 5:00',
    startHour: 3,
  },
  {
    name: '묘시',
    hanja: '卯',
    hanjaFull: '卯時',
    range: '오전 5:00 – 오전 7:00',
    startHour: 5,
  },
  {
    name: '진시',
    hanja: '辰',
    hanjaFull: '辰時',
    range: '오전 7:00 – 오전 9:00',
    startHour: 7,
  },
  {
    name: '사시',
    hanja: '巳',
    hanjaFull: '巳時',
    range: '오전 9:00 – 오전 11:00',
    startHour: 9,
  },
  {
    name: '오시',
    hanja: '午',
    hanjaFull: '午時',
    range: '오전 11:00 – 오후 1:00',
    startHour: 11,
  },
  {
    name: '미시',
    hanja: '未',
    hanjaFull: '未時',
    range: '오후 1:00 – 오후 3:00',
    startHour: 13,
  },
  {
    name: '신시',
    hanja: '申',
    hanjaFull: '申時',
    range: '오후 3:00 – 오후 5:00',
    startHour: 15,
  },
  {
    name: '유시',
    hanja: '酉',
    hanjaFull: '酉時',
    range: '오후 5:00 – 오후 7:00',
    startHour: 17,
  },
  {
    name: '술시',
    hanja: '戌',
    hanjaFull: '戌時',
    range: '오후 7:00 – 오후 9:00',
    startHour: 19,
  },
  {
    name: '해시',
    hanja: '亥',
    hanjaFull: '亥時',
    range: '오후 9:00 – 오후 11:00',
    startHour: 21,
  },
];

export function getSijan(hour24: number): Sijan {
  if (hour24 >= 23 || hour24 < 1) return SIJAN[0];
  for (let i = SIJAN.length - 1; i >= 0; i--) {
    if (hour24 >= SIJAN[i].startHour) return SIJAN[i];
  }
  return SIJAN[0];
}

// ─── 명주 목 데이터 (임시 mock) ──────────────────────────────────────────────
import { MyeongJuProfile } from './types';

export const MOCK_PROFILES: MyeongJuProfile[] = [
  {
    id: '1',
    ilgan: '壬',
    ohaeng: '수',
    iljoo: '임수일주',
    iljooHanja: '壬子',
    gender: 'male',
    calendarType: '양력',
    birthDate: '2024년 3월 12일',
    birthTime: '묘시(卯時) · 오전 5:30',
    analysisCount: 3,
    savedCount: 2,
  },
  {
    id: '2',
    ilgan: '甲',
    ohaeng: '목',
    iljoo: '갑목일주',
    iljooHanja: '甲午',
    gender: 'female',
    calendarType: '음력',
    birthDate: '2023년 11월 5일',
    birthTime: '자시(子時) · 오전 0:10',
    analysisCount: 1,
  },
  {
    id: '3',
    ilgan: '丙',
    ohaeng: '화',
    iljoo: '병화일주',
    iljooHanja: '丙午',
    gender: 'male',
    calendarType: '양력',
    birthDate: '2023년 8월 20일',
    birthTime: '오시(午時) · 오후 12:45',
    analysisCount: 2,
    savedCount: 5,
  },
  {
    id: '4',
    ilgan: '庚',
    ohaeng: '금',
    iljoo: '경금일주',
    iljooHanja: '庚申',
    gender: 'female',
    calendarType: '양력',
    birthDate: '2022년 6월 1일',
    birthTime: '미시(未時) · 오후 2:20',
  },
];

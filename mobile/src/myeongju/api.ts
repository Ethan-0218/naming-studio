import { BACKEND_URL } from '../../constants/config';
import { getToken } from '../auth/tokenStorage';
import { MyeongJuProfile, OhaengType } from './types';

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  return { Authorization: `Bearer ${token}` };
}

interface CreateMyeongJuParams {
  gender: 'male' | 'female';
  calendarType: '양력' | '음력';
  year: number;
  month: number;
  day: number;
  timeUnknown: boolean;
  isAm: boolean;
  hour: number; // 1–12
  minute: number;
  regionName: string | null;
  regionOffset: number | null;
}

interface MyeongJuApiResponse {
  id: string;
  ilgan: string;
  ohaeng: string;
  iljoo: string;
  iljoo_hanja: string;
  gender: string;
  calendar_type: string;
  birth_date: string;
  birth_time: string;
  created_at: string;
}

function toProfile(r: MyeongJuApiResponse): MyeongJuProfile {
  return {
    id: r.id,
    ilgan: r.ilgan,
    ohaeng: r.ohaeng as OhaengType,
    iljoo: r.iljoo,
    iljooHanja: r.iljoo_hanja,
    gender: r.gender as 'male' | 'female',
    calendarType: r.calendar_type as '양력' | '음력',
    birthDate: r.birth_date,
    birthTime: r.birth_time,
  };
}

function to24h(isAm: boolean, hour: number): number {
  if (isAm) return hour === 12 ? 0 : hour;
  return hour === 12 ? 12 : hour + 12;
}

export async function createMyeongJu(
  params: CreateMyeongJuParams,
): Promise<MyeongJuProfile> {
  const birth_hour = params.timeUnknown
    ? null
    : to24h(params.isAm, params.hour);
  const birth_minute = params.timeUnknown ? null : params.minute;

  const res = await fetch(`${BACKEND_URL}/api/myeongju`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await authHeaders()),
    },
    body: JSON.stringify({
      gender: params.gender,
      calendar_type: params.calendarType,
      year: params.year,
      month: params.month,
      day: params.day,
      time_unknown: params.timeUnknown,
      birth_hour,
      birth_minute,
      region_name: params.regionName,
      region_offset: params.regionOffset,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`명주 생성 실패: ${res.status} ${text}`);
  }

  const data: MyeongJuApiResponse = await res.json();
  return toProfile(data);
}

export async function listMyeongJu(): Promise<MyeongJuProfile[]> {
  const res = await fetch(`${BACKEND_URL}/api/myeongju`, {
    headers: await authHeaders(),
  });

  if (!res.ok) {
    throw new Error(`명주 목록 조회 실패: ${res.status}`);
  }

  const data: MyeongJuApiResponse[] = await res.json();
  return data.map(toProfile);
}

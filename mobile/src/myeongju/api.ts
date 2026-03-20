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
  surname: string;
  surnameHanja: string;
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
  surname: string;
  surname_hanja: string;
  created_at: string;
  yongsin: string | null;
  heesin: string | null;
  gisin: string | null;
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
    surname: r.surname,
    surnameHanja: r.surname_hanja,
    yongsin: (r.yongsin as OhaengType) ?? null,
    heesin: (r.heesin as OhaengType) ?? null,
    gisin: (r.gisin as OhaengType) ?? null,
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
      surname: params.surname,
      surname_hanja: params.surnameHanja,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`명주 생성 실패: ${res.status} ${text}`);
  }

  const data: MyeongJuApiResponse = await res.json();
  return toProfile(data);
}

export async function deleteMyeongJu(id: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/myeongju/${id}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`명주 삭제 실패: ${res.status}`);
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

export async function findOrCreateSession(
  myeongjuId: string,
): Promise<{ session_id: string; is_new: boolean }> {
  const res = await fetch(`${BACKEND_URL}/api/session/find-or-create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ myeongju_id: myeongjuId }),
  });
  if (!res.ok) throw new Error(`세션 생성 실패: ${res.status}`);
  return res.json();
}

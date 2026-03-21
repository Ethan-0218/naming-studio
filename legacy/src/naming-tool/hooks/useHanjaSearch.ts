import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BACKEND_URL } from '../../../constants/config';
import { HanjaSearchResult, Ohaeng, Eumyang } from '../types';
import { strokeToOhaeng } from '../domain/ohaeng';
import { strokeToEumyang, parseEumyang } from '../domain/eumyang';
import { parseOhaeng } from '../domain/baleumOhaeng';
import { queryKeys } from '@/lib/queryKeys';

interface RawHanjaResult {
  hanja: string;
  eum: string;
  mean: string;
  stroke: number | null;
  char_ohaeng?: string;
  stroke_ohaeng?: string;
  sound_eumyang?: string;
  stroke_eumyang?: string;
  baleum_ohaeng?: string;
}

function mapResult(r: RawHanjaResult): HanjaSearchResult {
  const stroke = r.stroke ?? null;

  const charOhaeng: Ohaeng | null =
    parseOhaeng(r.char_ohaeng ?? '') ??
    parseOhaeng(r.stroke_ohaeng ?? '') ??
    (stroke != null ? strokeToOhaeng(stroke) : null);

  const baleumOhaeng: Ohaeng | null =
    parseOhaeng(r.baleum_ohaeng ?? '') ?? null;

  const soundEumyang: Eumyang | null =
    parseEumyang(r.sound_eumyang ?? '') ?? null;

  const strokeEumyang: Eumyang | null =
    parseEumyang(r.stroke_eumyang ?? '') ??
    (stroke != null ? strokeToEumyang(stroke) : null);

  return {
    hanja: r.hanja,
    eum: r.eum,
    mean: r.mean,
    strokeCount: stroke,
    charOhaeng,
    baleumOhaeng,
    soundEumyang,
    strokeEumyang,
  };
}

const EMPTY_RESULTS: HanjaSearchResult[] = [];

async function fetchHanjaSearch(
  role: 'surname' | 'name',
  q: string,
): Promise<HanjaSearchResult[]> {
  const endpoint =
    role === 'surname' ? '/api/surname-search' : '/api/hanja-search';
  const res = await fetch(
    `${BACKEND_URL}${endpoint}?q=${encodeURIComponent(q)}`,
  );
  const raw: RawHanjaResult[] = await res.json();
  return raw.map(mapResult);
}

export function useHanjaSearch(role: 'surname' | 'name') {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const {
    data,
    isFetching: loading,
    isSuccess,
  } = useQuery({
    queryKey: queryKeys.hanja.search(role, debouncedQuery),
    queryFn: () => fetchHanjaSearch(role, debouncedQuery),
    enabled: debouncedQuery.trim().length > 0,
    staleTime: Infinity, // Hanja 데이터는 정적 — 한번 받으면 재요청 불필요
  });

  // EMPTY_RESULTS 상수를 기본값으로 사용해 레퍼런스를 안정적으로 유지.
  // 인라인 [] 기본값은 렌더마다 새 레퍼런스를 생성해
  // NameInputSection의 surnameResults useEffect를 잘못 트리거하는 버그를 유발함.
  const results = data ?? EMPTY_RESULTS;

  function search(q: string) {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setDebouncedQuery('');
      return;
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(q);
    }, 250);
  }

  function clearResults() {
    setQuery('');
    setDebouncedQuery('');
  }

  // activeQuery: 현재 results가 어느 검색어에 대한 결과인지 (debouncedQuery)
  // hasResults: fetch가 완료되어 실제 결과가 있는 상태인지 (fetching 중 false)
  return {
    query,
    results,
    loading,
    search,
    clearResults,
    activeQuery: debouncedQuery,
    hasResults: isSuccess,
  };
}

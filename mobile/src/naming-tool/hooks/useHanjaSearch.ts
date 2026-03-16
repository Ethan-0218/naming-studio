import { useRef, useState } from 'react';
import { BACKEND_URL } from '../../../constants/config';
import { HanjaSearchResult, Ohaeng, Eumyang } from '../types';
import { strokeToOhaeng } from '../domain/ohaeng';
import { strokeToEumyang, parseEumyang } from '../domain/eumyang';
import { parseOhaeng } from '../domain/baleumOhaeng';

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

export function useHanjaSearch(role: 'surname' | 'name') {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<HanjaSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function search(q: string) {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const endpoint = role === 'surname' ? '/api/surname-search' : '/api/hanja-search';
        const res = await fetch(`${BACKEND_URL}${endpoint}?q=${encodeURIComponent(q)}`);
        const raw: RawHanjaResult[] = await res.json();
        setResults(raw.map(mapResult));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
  }

  function clearResults() {
    setResults([]);
    setQuery('');
  }

  return { query, results, loading, search, clearResults };
}

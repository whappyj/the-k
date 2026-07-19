import { useCallback, useEffect, useState } from 'react';

/** 앱의 메인 저장 키(theKData)와는 완전히 분리된 별도 키를 쓴다 — appDataReducer.ts나
 *  LocalStorage의 기존 스키마를 전혀 건드리지 않기 위함이다. */
const FAVORITES_KEY = 'thek-hunt-area-favorites';

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * hooks/useHuntAreaFavorites.ts
 * "사냥터 효율" 화면의 즐겨찾기 사냥터 목록. 기존 앱 데이터(theKData, appDataReducer.ts)와는
 * 완전히 독립된 별도 LocalStorage 키(thek-hunt-area-favorites)를 사용하므로, 기존
 * LocalStorage 구조·Reducer·Import/Export에는 전혀 영향이 없다.
 */
export function useHuntAreaFavorites(): { favorites: Set<string>; toggleFavorite: (area: string) => void; isFavorite: (area: string) => boolean } {
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set(loadFavorites()));

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)));
    } catch {
      // 저장 실패해도(예: 프라이빗 모드) 화면 사용에는 지장 없음
    }
  }, [favorites]);

  const toggleFavorite = useCallback((area: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(area)) next.delete(area);
      else next.add(area);
      return next;
    });
  }, []);

  const isFavorite = useCallback((area: string) => favorites.has(area), [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}

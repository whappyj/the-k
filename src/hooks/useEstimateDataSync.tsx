import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useAppData, useAppDataActions } from '@/hooks/useAppData';
import { generateId } from '@/utils/id';
import type { EstimateMaterial, EstimatePreset } from '@/types';

/** public/estimate-data.json의 예상 구조. 관리자 페이지(yaki.html)가 만드는 파일과 동일한 스키마. */
export interface EstimateDataItem {
  id: string;
  name: string;
  materials: { name: string; qty: number; priceA: number; priceB: number }[];
  rateA: number;
  rateB: number;
  feeA: number;
  feeB: number;
  qtyTier: 1 | 3 | 5;
}

export interface EstimateDataFile {
  version: string;
  items: EstimateDataItem[];
}

export type EstimateSyncStatus = 'loading' | 'success' | 'error';

interface EstimateSyncContextValue {
  status: EstimateSyncStatus;
  errorMessage: string | null;
  retry: () => void;
}

const EstimateSyncContext = createContext<EstimateSyncContextValue | null>(null);

/** JSON에서 불러온 프리셋임을 표시하는 id 접두사. 새로고침마다 이 접두사를 가진 것만 갱신하고,
 *  사용자가 직접 만든 프리셋은 건드리지 않는다. */
const JSON_PRESET_PREFIX = 'json-';

/**
 * hooks/useEstimateDataSync.ts
 * "제작 비교 견적" 데이터의 단일 진실 공급원은 public/estimate-data.json 하나뿐이다.
 * 앱이 뜨자마자(페이지와 무관하게) 이 파일을 한 번 읽어서 반영한다 — 홈 화면의 환율 요약
 * 등 "제작 비교 견적" 화면 밖에서도 estimate 값을 보여주는 곳이 있기 때문에, 특정 페이지
 * 진입을 기다리지 않고 앱 시작 시점에 바로 로드한다.
 *
 * 실패하면 조용히 예전 하드코딩 값으로 계속 진행하지 않고 상태를 'error'로 남겨,
 * "제작 비교 견적" 화면에서 사용자에게 명확히 경고 배너로 알린다 — 잘못된 기본 데이터를
 * 사용자가 모른 채 쓰는 일을 막기 위함이다.
 *
 * calculations.ts/appDataReducer.ts의 계산·리듀서 로직은 전혀 건드리지 않고, 이미 존재하는
 * 프리셋 구조(EstimatePreset[])와 공개 액션 patchEstimate()(ESTIMATE_PATCH)만 사용한다.
 * storage.ts의 freshMaterials()/defaultAppData()는 보호 파일이라 삭제할 수 없어 앱 최초
 * 렌더링 순간(JSON 로드가 끝나기 전 짧은 찰나)에만 비상용으로 쓰이며, JSON 로드가
 * 끝나는 즉시(성공이든 실패든) 그 값에 의존하지 않는다.
 */
export function EstimateSyncProvider({ children }: { children: ReactNode }) {
  const { data } = useAppData();
  const { patchEstimate } = useAppDataActions();
  const [status, setStatus] = useState<EstimateSyncStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const currentPresetsRef = useRef(data.estimate.presets);
  currentPresetsRef.current = data.estimate.presets;

  useEffect(() => {
    let active = true;
    setStatus('loading');
    setErrorMessage(null);

    // cache:'no-store' + 타임스탬프 쿼리스트링: 브라우저 캐시와 GitHub Pages CDN 캐시를
    // 모두 우회해, 매번 실제로 최신 estimate-data.json을 받아오도록 이중으로 보장한다.
    fetch(`./estimate-data.json?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error(`estimate-data.json 응답 오류 (HTTP ${res.status})`);
        return res.json() as Promise<EstimateDataFile>;
      })
      .then((json) => {
        if (!active) return;
        if (!json || !Array.isArray(json.items) || json.items.length === 0) {
          throw new Error('estimate-data.json에 items가 없습니다.');
        }

        const toMaterials = (list: EstimateDataItem['materials']): EstimateMaterial[] =>
          list.map((m) => ({ id: generateId(), name: m.name, qty: m.qty, priceA: m.priceA, priceB: m.priceB }));

        const jsonPresets: EstimatePreset[] = json.items.map((item) => ({
          id: `${JSON_PRESET_PREFIX}${item.id}`,
          name: item.name,
          readonly: false,
          favorite: false,
          materials: toMaterials(item.materials),
          rateA: item.rateA,
          rateB: item.rateB,
          feeA: item.feeA,
          feeB: item.feeB,
          createdAt: new Date().toISOString(),
        }));

        const keepExisting = currentPresetsRef.current.filter((p) => !p.id.startsWith(JSON_PRESET_PREFIX));
        const first = json.items[0];
        if (!first) throw new Error('estimate-data.json의 첫 번째 아이템을 찾을 수 없습니다.');

        patchEstimate({
          presets: [...jsonPresets, ...keepExisting],
          materials: toMaterials(first.materials),
          rateA: first.rateA,
          rateB: first.rateB,
          feeA: first.feeA,
          feeB: first.feeB,
          qtyTier: first.qtyTier,
        });
        setStatus('success');
      })
      .catch((err: unknown) => {
        if (!active) return;
        console.error('estimate-data.json을 불러오지 못했습니다.', err);
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : String(err));
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return <EstimateSyncContext.Provider value={{ status, errorMessage, retry }}>{children}</EstimateSyncContext.Provider>;
}

/** "제작 비교 견적" 화면에서 로드 실패 시 경고 배너를 띄우기 위해 상태를 읽는다. */
export function useEstimateSyncStatus(): EstimateSyncContextValue {
  const ctx = useContext(EstimateSyncContext);
  if (!ctx) throw new Error('useEstimateSyncStatus는 EstimateSyncProvider 내부에서만 사용할 수 있습니다.');
  return ctx;
}

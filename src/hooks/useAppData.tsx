import { createContext, useContext, useEffect, useReducer, useRef, useCallback, useMemo } from 'react';
import type { ReactNode, Dispatch } from 'react';
import { appDataReducer } from '@/lib/appDataReducer';
import type { AppAction } from '@/lib/appDataReducer';
import { loadAppData, persistAppData } from '@/lib/storage';
import type { AppData } from '@/types';
import { AUTO_SAVE_DEBOUNCE_MS } from '@/constants';

interface AppDataContextValue {
  data: AppData;
  dispatch: Dispatch<AppAction>;
  lastSavedLabel: string;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

/** 마지막 저장 시각을 "YYYY.MM.DD HH:MM" 형태로 표시한다. */
function formatSavedAt(iso: string | null): string {
  if (!iso) return '마지막 저장 기록 없음';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `마지막 저장 ${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 앱 전역 데이터 Provider.
 * 최초 마운트 시 LocalStorage에서 데이터를 읽어오고(HYDRATE),
 * 이후 상태가 바뀔 때마다 500ms debounce로 LocalStorage에 자동 저장한다.
 */
export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(appDataReducer, undefined, loadAppData);
  const savedAtRef = useRef<string | null>(data.lastSaved);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 마지막으로 LocalStorage와 실제로 동기화된 데이터의 스냅샷.
  // (이전에는 "최초 마운트 여부" 플래그로 저장을 건너뛰었는데, React StrictMode의 개발 모드
  // 이펙트 이중 실행 때문에 마운트 직후 곧바로 기본값이 저장돼버려 새로고침 시에도 항상
  // "이미 저장된" 상태로 시작하는 문제가 있었다. 실제로 값이 바뀌었는지로 판단하도록 변경.)
  const lastPersistedRef = useRef<string>(JSON.stringify(data));

  useEffect(() => {
    const snapshot = JSON.stringify(data);
    if (snapshot === lastPersistedRef.current) {
      // 실제로 바뀐 내용이 없다면(최초 마운트 포함) 저장을 건너뛴다.
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      savedAtRef.current = persistAppData(data);
      lastPersistedRef.current = snapshot;
    }, AUTO_SAVE_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [data]);

  const value = useMemo<AppDataContextValue>(
    () => ({ data, dispatch, lastSavedLabel: formatSavedAt(data.lastSaved ?? savedAtRef.current) }),
    [data]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

/** 전역 데이터와 dispatch에 접근하는 훅. Provider 내부에서만 사용 가능하다. */
export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData는 AppDataProvider 내부에서만 사용할 수 있습니다.');
  return ctx;
}

/** 특정 액션 타입을 손쉽게 dispatch할 수 있도록 감싼 헬퍼 훅. */
export function useAppDataActions() {
  const { dispatch } = useAppData();
  return useMemo(
    () => ({
      hydrate: (payload: AppData) => dispatch({ type: 'HYDRATE', payload }),
      patchEstimate: (payload: Partial<AppData['estimate']>) => dispatch({ type: 'ESTIMATE_PATCH', payload }),
      resetEstimateToBase: () => dispatch({ type: 'ESTIMATE_RESET_TO_BASE' }),
      addPreset: (payload: AppData['estimate']['presets'][number]) => dispatch({ type: 'PRESET_ADD', payload }),
      updatePreset: (id: string, patch: Partial<AppData['estimate']['presets'][number]>) =>
        dispatch({ type: 'PRESET_UPDATE', payload: { id, patch } }),
      deletePreset: (id: string) => dispatch({ type: 'PRESET_DELETE', payload: { id } }),
      addExperience: (payload: AppData['experienceRecords'][number]) =>
        dispatch({ type: 'EXPERIENCE_ADD', payload }),
      updateExperience: (id: string, patch: Partial<AppData['experienceRecords'][number]>) =>
        dispatch({ type: 'EXPERIENCE_UPDATE', payload: { id, patch } }),
      deleteExperience: (id: string) => dispatch({ type: 'EXPERIENCE_DELETE', payload: { id } }),
      addFavorite: (payload: AppData['favoriteParties'][number]) => dispatch({ type: 'FAVORITE_ADD', payload }),
      updateFavorite: (id: string, patch: Partial<AppData['favoriteParties'][number]>) =>
        dispatch({ type: 'FAVORITE_UPDATE', payload: { id, patch } }),
      deleteFavorite: (id: string) => dispatch({ type: 'FAVORITE_DELETE', payload: { id } }),
      setRecordDraft: (payload: AppData['recordDraft']) => dispatch({ type: 'RECORD_DRAFT_SET', payload }),
      addCalcRecord: (payload: AppData['calculator24Records'][number]) => dispatch({ type: 'CALC_ADD', payload }),
      deleteCalcRecord: (id: string) => dispatch({ type: 'CALC_DELETE', payload: { id } }),
      setCalcDraft: (payload: AppData['calculatorDraft']) => dispatch({ type: 'CALC_DRAFT_SET', payload }),
      addItem: (payload: AppData['items'][number]) => dispatch({ type: 'ITEM_ADD', payload }),
      updateItem: (id: string, patch: Partial<AppData['items'][number]>) =>
        dispatch({ type: 'ITEM_UPDATE', payload: { id, patch } }),
      deleteItem: (id: string) => dispatch({ type: 'ITEM_DELETE', payload: { id } }),
      addRecentItemSearch: (term: string) => dispatch({ type: 'RECENT_ITEM_SEARCH_ADD', payload: { term } }),
      removeRecentItemSearch: (term: string) => dispatch({ type: 'RECENT_ITEM_SEARCH_REMOVE', payload: { term } }),
      clearRecentItemSearches: () => dispatch({ type: 'RECENT_ITEM_SEARCH_CLEAR' }),
      patchPurchaseSettings: (payload: Partial<AppData['purchaseSettings']>) => dispatch({ type: 'PURCHASE_SETTINGS_PATCH', payload }),
      patchExpGoal: (payload: Partial<AppData['expGoal']>) => dispatch({ type: 'EXP_GOAL_PATCH', payload }),
      addPurchaseRecord: (payload: AppData['purchaseRecords'][number]) => dispatch({ type: 'PURCHASE_RECORD_ADD', payload }),
      updatePurchaseRecord: (id: string, patch: Partial<AppData['purchaseRecords'][number]>) =>
        dispatch({ type: 'PURCHASE_RECORD_UPDATE', payload: { id, patch } }),
      deletePurchaseRecord: (id: string) => dispatch({ type: 'PURCHASE_RECORD_DELETE', payload: { id } }),
      patchSettings: (payload: Partial<AppData['settings']>) => dispatch({ type: 'SETTINGS_PATCH', payload }),
      importMerge: (payload: Partial<AppData>) => dispatch({ type: 'IMPORT_MERGE', payload }),
      resetAll: () => dispatch({ type: 'RESET_ALL' }),
    }),
    [dispatch]
  );
}

/** 현재 설정을 반영한 숫자/퍼센트 포맷터를 반환하는 훅. */
export function useFormatSettings() {
  const { data } = useAppData();
  return data.settings;
}

export const useAppDataDispatchRaw = () => {
  const { dispatch } = useAppData();
  return useCallback((action: AppAction) => dispatch(action), [dispatch]);
};

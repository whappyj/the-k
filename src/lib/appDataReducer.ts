import type {
  AppData,
  EstimateMaterial,
  EstimatePreset,
  EstimateState,
  ExperienceRecord,
  FavoriteParty,
  Calculator24Record,
  ItemRecord,
  AppSettings,
  ExperienceFormValues,
  CalculatorFormValues,
  PurchaseSettings,
  PurchaseRecord,
  ExpGoal,
} from '@/types';
import { defaultAppData, freshMaterials } from '@/lib/storage';
import { BASE_PRESET_NAME, MAX_RECENT_ITEM_SEARCHES } from '@/constants';

export type AppAction =
  | { type: 'HYDRATE'; payload: AppData }
  | { type: 'ESTIMATE_PATCH'; payload: Partial<EstimateState> }
  | { type: 'ESTIMATE_RESET_TO_BASE' }
  | { type: 'PRESET_ADD'; payload: EstimatePreset }
  | { type: 'PRESET_UPDATE'; payload: { id: string; patch: Partial<EstimatePreset> } }
  | { type: 'PRESET_DELETE'; payload: { id: string } }
  | { type: 'EXPERIENCE_ADD'; payload: ExperienceRecord }
  | { type: 'EXPERIENCE_UPDATE'; payload: { id: string; patch: Partial<ExperienceRecord> } }
  | { type: 'EXPERIENCE_DELETE'; payload: { id: string } }
  | { type: 'FAVORITE_ADD'; payload: FavoriteParty }
  | { type: 'FAVORITE_UPDATE'; payload: { id: string; patch: Partial<FavoriteParty> } }
  | { type: 'FAVORITE_DELETE'; payload: { id: string } }
  | { type: 'RECORD_DRAFT_SET'; payload: Partial<ExperienceFormValues> | null }
  | { type: 'CALC_ADD'; payload: Calculator24Record }
  | { type: 'CALC_DELETE'; payload: { id: string } }
  | { type: 'CALC_DRAFT_SET'; payload: Partial<CalculatorFormValues> | null }
  | { type: 'ITEM_ADD'; payload: ItemRecord }
  | { type: 'ITEM_UPDATE'; payload: { id: string; patch: Partial<ItemRecord> } }
  | { type: 'ITEM_DELETE'; payload: { id: string } }
  | { type: 'RECENT_ITEM_SEARCH_ADD'; payload: { term: string } }
  | { type: 'RECENT_ITEM_SEARCH_REMOVE'; payload: { term: string } }
  | { type: 'RECENT_ITEM_SEARCH_CLEAR' }
  | { type: 'PURCHASE_SETTINGS_PATCH'; payload: Partial<PurchaseSettings> }
  | { type: 'EXP_GOAL_PATCH'; payload: Partial<ExpGoal> }
  | { type: 'PURCHASE_RECORD_ADD'; payload: PurchaseRecord }
  | { type: 'PURCHASE_RECORD_UPDATE'; payload: { id: string; patch: Partial<PurchaseRecord> } }
  | { type: 'PURCHASE_RECORD_DELETE'; payload: { id: string } }
  | { type: 'SETTINGS_PATCH'; payload: Partial<AppSettings> }
  | { type: 'IMPORT_MERGE'; payload: Partial<AppData> }
  | { type: 'RESET_ALL' };

function mergeByIdKeepLatest<T extends { id: string; updatedAt?: string; createdAt?: string }>(
  current: T[],
  incoming: T[] | undefined,
  timeField: 'updatedAt' | 'createdAt'
): T[] {
  const map = new Map<string, T>();
  current.forEach((item) => map.set(item.id, item));
  (incoming ?? []).forEach((item) => {
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
      return;
    }
    const existingTime = new Date(existing[timeField] ?? existing.createdAt ?? 0).getTime();
    const incomingTime = new Date(item[timeField] ?? item.createdAt ?? 0).getTime();
    map.set(item.id, incomingTime >= existingTime ? item : existing);
  });
  return Array.from(map.values());
}

/** 전체 앱 데이터에 대한 순수 리듀서. 모든 변경은 이 함수를 거친다. */
export function appDataReducer(state: AppData, action: AppAction): AppData {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload;

    case 'ESTIMATE_PATCH':
      return { ...state, estimate: { ...state.estimate, ...action.payload } };

    case 'ESTIMATE_RESET_TO_BASE': {
      const base = state.estimate.presets.find((p) => p.readonly);
      const materials = base ? JSON.parse(JSON.stringify(base.materials)) as EstimateMaterial[] : freshMaterials();
      return {
        ...state,
        estimate: {
          ...state.estimate,
          materials,
          rateA: base?.rateA ?? 0,
          rateB: base?.rateB ?? 0,
          feeA: base?.feeA ?? 0,
          feeB: base?.feeB ?? 0,
        },
      };
    }

    case 'PRESET_ADD':
      return { ...state, estimate: { ...state.estimate, presets: [...state.estimate.presets, action.payload] } };

    case 'PRESET_UPDATE':
      return {
        ...state,
        estimate: {
          ...state.estimate,
          presets: state.estimate.presets.map((p) =>
            p.id === action.payload.id ? { ...p, ...action.payload.patch } : p
          ),
        },
      };

    case 'PRESET_DELETE':
      return {
        ...state,
        estimate: {
          ...state.estimate,
          presets: state.estimate.presets.filter((p) => p.id !== action.payload.id || p.readonly),
        },
      };

    case 'EXPERIENCE_ADD':
      return { ...state, experienceRecords: [...state.experienceRecords, action.payload] };

    case 'EXPERIENCE_UPDATE':
      return {
        ...state,
        experienceRecords: state.experienceRecords.map((r) =>
          r.id === action.payload.id
            ? { ...r, ...action.payload.patch, updatedAt: new Date().toISOString() }
            : r
        ),
      };

    case 'EXPERIENCE_DELETE':
      return { ...state, experienceRecords: state.experienceRecords.filter((r) => r.id !== action.payload.id) };

    case 'FAVORITE_ADD':
      return { ...state, favoriteParties: [...state.favoriteParties, action.payload] };

    case 'FAVORITE_UPDATE':
      return {
        ...state,
        favoriteParties: state.favoriteParties.map((p) =>
          p.id === action.payload.id ? { ...p, ...action.payload.patch } : p
        ),
      };

    case 'FAVORITE_DELETE':
      return { ...state, favoriteParties: state.favoriteParties.filter((p) => p.id !== action.payload.id) };

    case 'RECORD_DRAFT_SET':
      return state.settings.autoSave === false ? state : { ...state, recordDraft: action.payload };

    case 'CALC_ADD':
      return { ...state, calculator24Records: [...state.calculator24Records, action.payload] };

    case 'CALC_DELETE':
      return { ...state, calculator24Records: state.calculator24Records.filter((r) => r.id !== action.payload.id) };

    case 'CALC_DRAFT_SET':
      return state.settings.autoSave === false ? state : { ...state, calculatorDraft: action.payload };

    case 'ITEM_ADD':
      return { ...state, items: [...state.items, action.payload] };

    case 'ITEM_UPDATE':
      return {
        ...state,
        items: state.items.map((it) =>
          it.id === action.payload.id ? { ...it, ...action.payload.patch, updatedAt: new Date().toISOString() } : it
        ),
      };

    case 'ITEM_DELETE':
      return { ...state, items: state.items.filter((it) => it.id !== action.payload.id) };

    case 'RECENT_ITEM_SEARCH_ADD': {
      const term = action.payload.term.trim();
      if (!term) return state;
      const deduped = [term, ...state.recentItemSearches.filter((t) => t !== term)];
      return { ...state, recentItemSearches: deduped.slice(0, MAX_RECENT_ITEM_SEARCHES) };
    }

    case 'RECENT_ITEM_SEARCH_REMOVE':
      return { ...state, recentItemSearches: state.recentItemSearches.filter((t) => t !== action.payload.term) };

    case 'RECENT_ITEM_SEARCH_CLEAR':
      return { ...state, recentItemSearches: [] };

    case 'PURCHASE_SETTINGS_PATCH':
      return { ...state, purchaseSettings: { ...state.purchaseSettings, ...action.payload } };

    case 'EXP_GOAL_PATCH':
      return { ...state, expGoal: { ...state.expGoal, ...action.payload } };

    case 'PURCHASE_RECORD_ADD':
      return { ...state, purchaseRecords: [...state.purchaseRecords, action.payload] };

    case 'PURCHASE_RECORD_UPDATE':
      return {
        ...state,
        purchaseRecords: state.purchaseRecords.map((r) => (r.id === action.payload.id ? { ...r, ...action.payload.patch } : r)),
      };

    case 'PURCHASE_RECORD_DELETE':
      return { ...state, purchaseRecords: state.purchaseRecords.filter((r) => r.id !== action.payload.id) };

    case 'SETTINGS_PATCH':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'IMPORT_MERGE': {
      const incoming = action.payload;
      return {
        ...state,
        experienceRecords: mergeByIdKeepLatest(state.experienceRecords, incoming.experienceRecords, 'updatedAt'),
        favoriteParties: mergeByIdKeepLatest(state.favoriteParties, incoming.favoriteParties, 'createdAt'),
        calculator24Records: mergeByIdKeepLatest(state.calculator24Records, incoming.calculator24Records, 'createdAt'),
        customTabs: mergeByIdKeepLatest(state.customTabs, incoming.customTabs, 'createdAt'),
        items: mergeByIdKeepLatest(state.items, incoming.items, 'updatedAt'),
        purchaseRecords: mergeByIdKeepLatest(state.purchaseRecords, incoming.purchaseRecords, 'createdAt'),
        purchaseSettings: incoming.purchaseSettings ? { ...state.purchaseSettings, ...incoming.purchaseSettings } : state.purchaseSettings,
        expGoal: incoming.expGoal ? { ...state.expGoal, ...incoming.expGoal } : state.expGoal,
        recentItemSearches: incoming.recentItemSearches
          ? Array.from(new Set([...incoming.recentItemSearches, ...state.recentItemSearches])).slice(0, MAX_RECENT_ITEM_SEARCHES)
          : state.recentItemSearches,
        estimate: {
          ...state.estimate,
          presets: mergeByIdKeepLatest(state.estimate.presets, incoming.estimate?.presets, 'createdAt'),
        },
        settings: incoming.settings ? { ...state.settings, ...incoming.settings } : state.settings,
      };
    }

    case 'RESET_ALL':
      return defaultAppData();

    default:
      return state;
  }
}

export { BASE_PRESET_NAME };

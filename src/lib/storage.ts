import {
  STORAGE_KEY,
  DEFAULT_SETTINGS,
  DEFAULT_PURCHASE_SETTINGS,
  BASE_MATERIAL_NAMES,
  BASE_MATERIAL_PRICES,
  BASE_MATERIAL_QTY,
  BASE_KEY_MATERIAL_PRICE_A,
  BASE_RATE_A,
  BASE_RATE_B,
  BASE_PRESET_NAME,
} from '@/constants';
import type { AppData, AppSettings, EstimateMaterial } from '@/types';
import { generateId } from '@/utils/id';
import { DEFAULT_ITEM_DB } from '@/data/defaultItems';

/** "달의 장궁" 기본 재료 목록을 생성한다.
 *  대표(핵심) 재료인 "신성한 유니콘의 뿔"만 A/B 기본 단가가 다르고(130,000 / 140,000),
 *  나머지는 A/B 동일한 기본 시세로 시작한다. 필요수량도 기본값으로 채워진다
 *  (이 값들은 어디까지나 "최초 1회" 기본값이며, 사용자가 저장한 값이 있으면 항상 그 값이 우선한다). */
export function freshMaterials(): EstimateMaterial[] {
  return BASE_MATERIAL_NAMES.map((name) => {
    const basePrice = BASE_MATERIAL_PRICES[name] ?? 0;
    const qty = BASE_MATERIAL_QTY[name] ?? 0;
    const priceA = name === '신성한 유니콘의 뿔' ? BASE_KEY_MATERIAL_PRICE_A : basePrice;
    return { id: generateId(), name, qty, priceA, priceB: basePrice };
  });
}

/** 기본 데이터 스키마. 최초 실행(저장된 데이터가 전혀 없을 때)에만 사용된다. */
export function defaultAppData(): AppData {
  const materials = freshMaterials();
  return {
    estimate: {
      materials,
      rateA: BASE_RATE_A,
      rateB: BASE_RATE_B,
      feeA: 0,
      feeB: 0,
      qtyTier: 1,
      presets: [
        {
          id: generateId(),
          name: BASE_PRESET_NAME,
          readonly: true,
          favorite: false,
          materials: JSON.parse(JSON.stringify(materials)) as EstimateMaterial[],
          rateA: BASE_RATE_A,
          rateB: BASE_RATE_B,
          feeA: 0,
          feeB: 0,
          createdAt: new Date().toISOString(),
        },
      ],
    },
    experienceRecords: [],
    favoriteParties: [],
    recordDraft: null,
    calculator24Records: [],
    calculatorDraft: null,
    customTabs: [],
    items: [...DEFAULT_ITEM_DB],
    recentItemSearches: [],
    purchaseSettings: { ...DEFAULT_PURCHASE_SETTINGS },
    expGoal: { targetDate: null },
    purchaseRecords: [],
    settings: { ...DEFAULT_SETTINGS },
    lastSaved: null,
  };
}

/** settings 필드에 누락된 값이 있으면 기본값으로 보정한다. */
function normalizeSettings(settings: Partial<AppSettings> | undefined): AppSettings {
  return { ...DEFAULT_SETTINGS, ...(settings ?? {}) };
}

/** LocalStorage에서 전체 데이터를 읽어온다. 없거나 손상됐으면 기본값을 반환한다. */
export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultAppData();
    const parsed = JSON.parse(raw) as Partial<AppData>;
    const base = defaultAppData();

    const merged: AppData = {
      ...base,
      ...parsed,
      estimate: {
        ...base.estimate,
        ...(parsed.estimate ?? {}),
        materials: parsed.estimate?.materials?.length ? parsed.estimate.materials : base.estimate.materials,
        presets: parsed.estimate?.presets?.length ? parsed.estimate.presets : base.estimate.presets,
      },
      experienceRecords: (parsed.experienceRecords ?? []).map((r) => {
        // 이전 버전은 level(단일 필드) 하나만 썼다. startLevel/endLevel이 없으면 그 값으로 둘 다 채운다.
        const legacy = r as unknown as { level?: number };
        const startLevel = r.startLevel ?? legacy.level ?? 1;
        const endLevel = r.endLevel ?? legacy.level ?? startLevel;
        return { ...r, startLevel, endLevel };
      }),
      favoriteParties: parsed.favoriteParties ?? [],
      calculator24Records: parsed.calculator24Records ?? [],
      customTabs: parsed.customTabs ?? [],
      items: (parsed.items ?? []).map((it) => ({
        ...it,
        favorite: it.favorite ?? false,
        safeEnchant: it.safeEnchant ?? '',
        equipClass: it.equipClass ?? '',
      })),
      recentItemSearches: parsed.recentItemSearches ?? [],
      purchaseSettings: { ...DEFAULT_PURCHASE_SETTINGS, ...(parsed.purchaseSettings ?? {}) },
      expGoal: { targetDate: null, ...(parsed.expGoal ?? {}) },
      purchaseRecords: parsed.purchaseRecords ?? [],
      settings: normalizeSettings(parsed.settings),
    };
    return merged;
  } catch (err) {
    console.error('데이터 로드에 실패해 기본값으로 초기화합니다.', err);
    return defaultAppData();
  }
}

/** 전체 데이터를 LocalStorage에 저장한다 (동기, 순수 IO). */
export function persistAppData(data: AppData): string {
  const stamped: AppData = { ...data, lastSaved: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stamped));
  return stamped.lastSaved as string;
}

/** 전체 데이터를 삭제한다. */
export function clearAppData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

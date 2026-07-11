/**
 * constants/index.ts
 * 매직 넘버/문자열 하드코딩을 피하기 위한 전역 상수 모음.
 */

import type { AppSettings, Route, WeaponCategory, PurchaseSettings } from '@/types';

export const STORAGE_KEY = 'theKData' as const;
export const APP_VERSION = '1.0.2' as const;

export const MAX_PARTY = 8 as const;

export const BASE_PRESET_NAME = '달의 장궁' as const;
export const BASE_MATERIAL_NAMES = [
  '신성한 유니콘의 뿔',
  '달빛의 정기',
  '최고급 다이아몬드',
  '최고급 사파이어',
  '최고급 에메랄드',
  '최고급 루비',
] as const;

/** 달의 장궁 기본 재료의 초기 단가. A/B 두 견적 모두 이 값으로 시작하고, 이후 사용자가 자유롭게 조정한다. */
export const BASE_MATERIAL_PRICES: Record<string, number> = {
  '신성한 유니콘의 뿔': 140000,
  '달빛의 정기': 140000,
  '최고급 다이아몬드': 200000,
  '최고급 사파이어': 100000,
  '최고급 에메랄드': 10000,
  '최고급 루비': 10000,
};

/** 신성한 유니콘의 뿔만 A/B 기본 단가가 서로 달라(130,000 / 140,000) 별도로 둔다. */
export const BASE_KEY_MATERIAL_PRICE_A = 130000 as const;

/** 달의 장궁 기본 재료의 1개 제작 필요수량. */
export const BASE_MATERIAL_QTY: Record<string, number> = {
  '신성한 유니콘의 뿔': 300,
  '달빛의 정기': 3,
  '최고급 다이아몬드': 5,
  '최고급 사파이어': 5,
  '최고급 에메랄드': 5,
  '최고급 루비': 5,
};

/** 최초 실행(저장된 데이터가 전혀 없을 때) 자동 적용되는 기본 환율. */
export const BASE_RATE_A = 900 as const;
export const BASE_RATE_B = 1000 as const;

export const DEFAULT_HUNT_AREAS = ['버땅', '타땅', '상아탑', '잊섬'] as const;

export const QTY_TIERS = [1, 3, 5] as const;

export const MIN_RECOMMEND_COUNT = 3 as const;

export const ROUTE_LABEL: Record<Route, string> = {
  home: '홈',
  estimate: '제작 비교 견적',
  experience: '경험치 기록',
  analysis: '경험치 분석',
  calculator: '24시간 계산기',
  adenaPurchase: '아데나 매입',
  settings: '설정',
};

export const ROUTE_EXPORT_LABEL: Record<Route, string> = {
  home: 'Home',
  estimate: 'Estimate',
  experience: 'Experience',
  analysis: 'Analysis',
  calculator: 'Calculator24',
  adenaPurchase: 'AdenaPurchase',
  settings: 'Settings',
};

export const ROUTES: Route[] = ['home', 'estimate', 'experience', 'analysis', 'calculator', 'adenaPurchase', 'settings'];

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  animation: true,
  numberFormat: 'comma',
  decimalPlaces: 4,
  autoSave: true,
  jpgQuality: 'veryHigh',
};

export const AUTO_SAVE_DEBOUNCE_MS = 500 as const;
export const TOAST_DURATION_MS = 2000 as const;

/* ============================== 아이템 비교 ============================== */

export const WEAPON_CATEGORY_LABEL: Record<WeaponCategory, string> = {
  melee: '근거리 무기',
  ranged: '원거리 무기',
  etc: '기타 아이템',
};

/** 무기 종류별 기본 비교 컬럼(key/label). 첨부 비교표 이미지의 컬럼 구성을 따른다.
 *  값(value)은 사용자가 채우며, 필요하면 스탯을 자유롭게 추가/삭제할 수 있다. */
export const DEFAULT_STAT_TEMPLATE: Record<WeaponCategory, { key: string; label: string }[]> = {
  melee: [
    { key: 'pAtk', label: '공격력' },
    { key: 'meleeAccuracy', label: '근거리 명중' },
    { key: 'meleeDamage', label: '근거리 대미지' },
  ],
  ranged: [
    { key: 'pAtk', label: '공격력' },
    { key: 'rangedAccuracy', label: '원거리 명중' },
    { key: 'rangedDamage', label: '원거리 대미지' },
  ],
  etc: [
    { key: 'note', label: '설명' },
  ],
};

export const MAX_COMPARISON_ITEMS = 5 as const;
export const MAX_RECENT_ITEM_SEARCHES = 10 as const;

/* ============================== 아데나 매입 (구조만) ============================== */
export const DEFAULT_PURCHASE_SETTINGS: PurchaseSettings = {
  rate: 0,
  targetAmount: 0,
  currentAmount: 0,
  memo: '',
  kakaoId: '',
};

/**
 * types/index.ts
 * THE K 전체에서 사용하는 도메인 타입 정의.
 * PRD-06에서 명시한 LocalStorage 스키마를 그대로 따른다.
 */

export type PriceSource = 'fixed' | 'A' | 'B';

export interface EstimateMaterial {
  id: string;
  name: string;
  qty: number;
  priceA: number;
  priceB: number;
}

export interface EstimatePreset {
  id: string;
  name: string;
  readonly: boolean;
  favorite: boolean;
  materials: EstimateMaterial[];
  rateA: number;
  rateB: number;
  feeA: number;
  feeB: number;
  createdAt: string;
}

export interface EstimateState {
  materials: EstimateMaterial[];
  rateA: number;
  rateB: number;
  feeA: number;
  feeB: number;
  qtyTier: 1 | 3 | 5;
  presets: EstimatePreset[];
}

export interface PartyComposition {
  knight: number;
  elf: number;
  wizard: number;
  partyCount: number;
}

export interface BibigiInfo {
  enabled: boolean;
  count: number;
}

export interface ExperienceRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  huntArea: string;
  startLevel: number; // 시작 시점 캐릭터 레벨
  endLevel: number; // 종료 시점 캐릭터 레벨 (레벨업 없이 끝났다면 startLevel과 같음)
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  townMinutes: number; // 마을 체류(엠탐) 시간 - 실제 사냥시간 계산 시 제외한다
  playTime: number; // seconds
  startExp: number;
  endExp: number;
  gainExp: number;
  expPerHour: number;
  expPerMinute: number;
  party: PartyComposition;
  bibigi: BibigiInfo;
  molly: boolean;
  memo: string;
}

export interface FavoriteParty {
  id: string;
  name: string;
  knight: number;
  elf: number;
  wizard: number;
  bibigiEnabled: boolean;
  bibigiCount: number;
  molly: boolean;
  createdAt: string;
}

export type Calculator24Status = 'achievable' | 'needMore' | 'impossible' | null;

export interface Calculator24Record {
  id: string;
  createdAt: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  startExp: number;
  endExp: number;
  maintenanceEnabled: boolean;
  maintenanceHours: number;
  totalHours: number;
  playHours: number;
  gainExp: number;
  hourExp: number;
  minuteExp: number;
  dayExp: number;
  currentLevel: string;
  remainExp: number;
  remainHours: number | null;
  remainDays: number | null;
  expectedLevelUpDate: string | null;
  expectedLevelUpTime: string | null;
  targetDate: string | null;
  requiredHourExp: number | null;
  requiredDayExp: number | null;
  status: Calculator24Status;
}

export interface CustomTab {
  id: string;
  name: string;
  createdAt: string;
}

export type ThemeMode = 'dark' | 'light';
export type NumberFormat = 'comma' | 'plain';
export type JpgQuality = 'high' | 'veryHigh' | 'lossless';

export interface AppSettings {
  theme: ThemeMode;
  animation: boolean;
  numberFormat: NumberFormat;
  decimalPlaces: 2 | 3 | 4;
  autoSave: boolean;
  jpgQuality: JpgQuality;
}

export interface AppData {
  estimate: EstimateState;
  experienceRecords: ExperienceRecord[];
  favoriteParties: FavoriteParty[];
  recordDraft: Partial<ExperienceFormValues> | null;
  calculator24Records: Calculator24Record[];
  calculatorDraft: Partial<CalculatorFormValues> | null;
  customTabs: CustomTab[];
  items: ItemRecord[];
  recentItemSearches: string[];
  purchaseSettings: PurchaseSettings;
  expGoal: ExpGoal;
  purchaseRecords: PurchaseRecord[];
  settings: AppSettings;
  lastSaved: string | null;
}

/** 경험치 기록 입력 폼 상태 (record.js 이식) */
export interface ExperienceFormValues {
  huntArea: string;
  startLevel: number | '';
  endLevel: number | '';
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  townMinutes: number;
  startExp: number | '';
  endExp: number | '';
  knight: number;
  elf: number;
  wizard: number;
  bibigiEnabled: boolean;
  bibigiCount: number;
  molly: boolean;
  memo: string;
}

/** 24시간 계산기 입력 폼 상태 */
export interface CalculatorFormValues {
  startDate: string;
  startTime: string;
  startExp: number | '';
  endDate: string;
  endTime: string;
  endExp: number | '';
  maintenanceEnabled: boolean;
  maintenanceHours: number;
  currentLevel: string;
  targetExp: number | '';
  targetDate: string;
}

/* ============================== 아데나 매입 (구조만, 계산/UI 미구현) ============================== */

export interface PurchaseSettings {
  rate: number; // 매입 환율
  targetAmount: number; // 목표 매입량 (만 단위)
  currentAmount: number; // 현재까지 매입량 (만 단위)
  memo: string;
  kakaoId: string;
}

export interface PurchaseRecord {
  id: string;
  accountId: string; // 판매자 계정/닉네임
  amount: number; // 매입량 (만 단위)
  cashAmount: number; // 지급 금액(원)
  depositCompleted: boolean;
  createdAt: string;
  memo?: string; // 선택 메모(비고)
}

/** 경험치 목표(목표일) — 페이지를 새로고침해도 유지되도록 별도 저장한다. */
export interface ExpGoal {
  targetDate: string | null; // YYYY-MM-DD
}

export type Route =
  | 'home'
  | 'estimate'
  | 'experience'
  | 'analysis'
  | 'compare'
  | 'statistics'
  | 'huntAreaEfficiency'
  | 'calculator'
  | 'adenaPurchase'
  | 'settings';

export type ToastType = 'default' | 'success' | 'danger';

/* ============================== 아이템 비교 ============================== */

/** 근거리/원거리에 따라 비교표에 표시할 컬럼(행)이 달라진다. */
export type WeaponCategory = 'melee' | 'ranged' | 'etc';

/** OCR/수동입력 모두 문자열로 저장한다 — OCR 결과가 숫자+단위(예: "120~150") 혼재라 강제 형변환하지 않는다. */
export interface ItemStat {
  key: string;
  label: string;
  value: string;
}

export type ItemSource = 'ocr' | 'manual' | 'api' | 'seed';

export interface ItemRecord {
  id: string;
  name: string;
  weaponCategory: WeaponCategory;
  grade: string;
  requiredLevel: string;
  safeEnchant: string; // 안전 인챈트 수치
  equipClass: string; // 착용 가능 클래스 (예: "기사, 요정")
  iconUrl: string | null; // base64 데이터 URL. 없으면 무기 종류별 기본 아이콘을 사용한다.
  stats: ItemStat[];
  options: string[];
  memo: string;
  favorite: boolean;
  source: ItemSource;
  createdAt: string;
  updatedAt: string;
}

/** 비교표에 담긴 아이템 id 목록 (여러 개 선택해서 나란히 비교) */
export type ComparisonBasket = string[];

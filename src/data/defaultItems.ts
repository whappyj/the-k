import type { ItemRecord } from '@/types';

/**
 * data/defaultItems.ts
 * 신규 설치(빈 LocalStorage) 시 THE K DB에 기본으로 채워지는 관리자 기본 아이템.
 * 현재는 활 5종만 포함한다 (이미지 기준으로 등록).
 *
 * 확장 방법: 이 배열에 항목을 추가/수정/삭제하면 된다. 실제 서비스에서는 아이템비교
 * 화면의 "새 아이템 등록"/"수정"/"삭제"로 사용자가 직접 관리하게 되므로, 이 파일은
 * 어디까지나 "최초 설치 시 기본값"일 뿐이다 — 이미 데이터가 있는 사용자의 LocalStorage는
 * 절대 덮어쓰지 않는다 (storage.ts의 defaultAppData()는 최초 1회만 쓰인다).
 */
export const DEFAULT_ITEM_DB: ItemRecord[] = [
  {
    id: 'seed-bow-saiha',
    name: '사이하의 활',
    weaponCategory: 'ranged',
    grade: '',
    requiredLevel: '',
    safeEnchant: '+6',
    equipClass: '요정',
    iconUrl: null,
    stats: [
      { key: 'pAtk', label: '공격력', value: '4/4' },
      { key: 'rangedAccuracy', label: '원거리 명중', value: '+2' },
      { key: 'rangedDamage', label: '원거리 대미지', value: '+5' },
    ],
    options: ['발동: 장착된 화살이 없을 경우 무형 화살 사용'],
    memo: '',
    favorite: false,
    source: 'seed',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'seed-bow-flame',
    name: '화염의 활',
    weaponCategory: 'ranged',
    grade: '',
    requiredLevel: '',
    safeEnchant: '+6',
    equipClass: '요정',
    iconUrl: null,
    stats: [
      { key: 'pAtk', label: '공격력', value: '3/3' },
      { key: 'rangedAccuracy', label: '원거리 명중', value: '+2' },
      { key: 'rangedDamage', label: '원거리 대미지', value: '+4' },
    ],
    options: [],
    memo: '',
    favorite: false,
    source: 'seed',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'seed-bow-long',
    name: '장궁',
    weaponCategory: 'ranged',
    grade: '',
    requiredLevel: '',
    safeEnchant: '+6',
    equipClass: '요정',
    iconUrl: null,
    stats: [
      { key: 'pAtk', label: '공격력', value: '3/3' },
      { key: 'rangedAccuracy', label: '원거리 명중', value: '' },
      { key: 'rangedDamage', label: '원거리 대미지', value: '+3' },
    ],
    options: [],
    memo: '',
    favorite: false,
    source: 'seed',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'seed-bow-crossbow',
    name: '크로스 보우',
    weaponCategory: 'ranged',
    grade: '',
    requiredLevel: '',
    safeEnchant: '+6',
    equipClass: '기사, 요정',
    iconUrl: null,
    stats: [
      { key: 'pAtk', label: '공격력', value: '3/2' },
      { key: 'rangedAccuracy', label: '원거리 명중', value: '+3' },
      { key: 'rangedDamage', label: '원거리 대미지', value: '+2' },
    ],
    options: [],
    memo: '',
    favorite: false,
    source: 'seed',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'seed-bow-moon',
    name: '달의 장궁',
    weaponCategory: 'ranged',
    grade: '',
    requiredLevel: '',
    safeEnchant: '+6',
    equipClass: '요정',
    iconUrl: null,
    stats: [
      { key: 'pAtk', label: '공격력', value: '3/3' },
      { key: 'rangedAccuracy', label: '원거리 명중', value: '+3' },
      { key: 'rangedDamage', label: '원거리 대미지', value: '+4' },
    ],
    options: ['발동: 문라이트 이럽션'],
    memo: '',
    favorite: false,
    source: 'seed',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

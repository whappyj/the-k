import { Gem, Sparkles, Star, Zap, Package, Shield, Flame, Droplet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * utils/materialIcon.ts
 * 재료 이름으로부터 아이콘을 결정론적으로 골라준다. 재료 데이터에 새 필드를 추가하지 않고
 * (JSON 구조를 그대로 유지) 순수하게 표시용으로만 아이콘을 매핑한다 — 같은 이름이면 항상
 * 같은 아이콘이 나오고, 이름이 바뀌면 다른 아이콘이 나올 수 있다.
 */
const ICONS: LucideIcon[] = [Gem, Sparkles, Star, Zap, Package, Shield, Flame, Droplet];

export function getMaterialIcon(name: string): LucideIcon {
  if (!name) return Package;
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
return ICONS[hash % ICONS.length] ?? Package;
}

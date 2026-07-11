/** UUID 형태의 간단한 고유 id를 생성한다. */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

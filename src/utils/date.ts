/** 오늘 날짜를 YYYY-MM-DD 형식으로 반환한다 (input[type=date] 기본값용). */
export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 현재 시각을 HH:MM 형식으로 반환한다 (input[type=time] 기본값용). */
export function nowTimeStr(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 날짜 + 시간 문자열을 합쳐 Date 객체를 만든다. 형식이 비어있으면 null. */
export function combineDateTime(date: string, time: string): Date | null {
  if (!date || !time) return null;
  const dt = new Date(`${date}T${time}`);
  return isNaN(dt.getTime()) ? null : dt;
}

/** date("YYYY-MM-DD") + time("HH:MM")을 input[type=datetime-local]용 값("YYYY-MM-DDTHH:MM")으로 합친다. */
export function toDateTimeLocalValue(date: string, time: string): string {
  if (!date || !time) return '';
  return `${date}T${time}`;
}

/** input[type=datetime-local]에서 받은 값("YYYY-MM-DDTHH:MM")을 date/time 필드로 분리한다. */
export function splitDateTimeLocalValue(value: string): { date: string; time: string } {
  const [date, time] = value.split('T');
  return { date: date ?? '', time: time ?? '' };
}

/** 현재 PC 시각을 input[type=datetime-local] 기본값 형식("YYYY-MM-DDTHH:MM")으로 반환한다. */
export function nowDateTimeLocalValue(): string {
  return toDateTimeLocalValue(todayStr(), nowTimeStr());
}

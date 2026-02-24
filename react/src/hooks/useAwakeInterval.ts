function toMinuteOfDay(value: string | null): number | null {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return null;
  const [hh, mm] = value.split(':').map(Number);
  if (!Number.isInteger(hh) || !Number.isInteger(mm)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

function overlapMs(aStart: number, aEnd: number, bStart: number, bEnd: number): number {
  const from = Math.max(aStart, bStart);
  const to = Math.min(aEnd, bEnd);
  return Math.max(0, to - from);
}

export function getAwakeInterval(
  start: Date,
  end: Date,
  sleepStart: string | null,
  sleepEnd: string | null,
): number {
  const startMs = start.getTime();
  const endMs = end.getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) return 0;

  const sleepStartMin = toMinuteOfDay(sleepStart);
  const sleepEndMin = toMinuteOfDay(sleepEnd);
  if (sleepStartMin == null || sleepEndMin == null || sleepStartMin === sleepEndMin) {
    return Math.floor((endMs - startMs) / 60_000);
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const loopStart = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const loopEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  let excludedMs = 0;

  for (let base = loopStart; base <= loopEnd; base += dayMs) {
    if (sleepStartMin < sleepEndMin) {
      const winStart = base + sleepStartMin * 60_000;
      const winEnd = base + sleepEndMin * 60_000;
      excludedMs += overlapMs(startMs, endMs, winStart, winEnd);
    } else {
      const firstStart = base;
      const firstEnd = base + sleepEndMin * 60_000;
      excludedMs += overlapMs(startMs, endMs, firstStart, firstEnd);

      const secondStart = base + sleepStartMin * 60_000;
      const secondEnd = base + dayMs;
      excludedMs += overlapMs(startMs, endMs, secondStart, secondEnd);
    }
  }

  return Math.max(0, Math.floor((endMs - startMs - excludedMs) / 60_000));
}

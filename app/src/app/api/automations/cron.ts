/**
 * Minimal 5-field cron helpers (minute hour dom month dow) for scheduled tasks.
 * Supports "*", plain numbers, ranges (a-b), lists (a,b,c) and steps (* / n,
 * a-b/n). Enough for the automation schedule builder and next-run previews —
 * not a full Vixie implementation (no names, no @macros).
 */

type FieldKey = "minutes" | "hours" | "doms" | "months" | "dows";

interface CronField {
  values: Set<number>;
  /** field is the bare "*" — relevant for dom/dow OR semantics */
  star: boolean;
}

export interface CronExpr {
  minutes: CronField;
  hours: CronField;
  doms: CronField;
  months: CronField;
  dows: CronField;
}

const FIELD_RANGES: Record<FieldKey, [number, number]> = {
  minutes: [0, 59],
  hours: [0, 23],
  doms: [1, 31],
  months: [1, 12],
  dows: [0, 7], // 0 and 7 both mean Sunday
};

const FIELD_ORDER: FieldKey[] = ["minutes", "hours", "doms", "months", "dows"];

function parseField(raw: string, key: FieldKey): CronField | null {
  if (raw === "") return null;
  const [min, max] = FIELD_RANGES[key];
  const values = new Set<number>();
  let star = false;
  for (const part of raw.split(",")) {
    if (part === "") return null;
    const slash = part.indexOf("/");
    const rangePart = slash === -1 ? part : part.slice(0, slash);
    const stepPart = slash === -1 ? null : part.slice(slash + 1);
    const step = stepPart === null ? 1 : Number.parseInt(stepPart, 10);
    if (!Number.isFinite(step) || step < 1) return null;

    let lo: number;
    let hi: number;
    let isStar = false;
    if (rangePart === "*") {
      isStar = true;
      lo = min;
      hi = max;
    } else if (/^\d+$/.test(rangePart)) {
      lo = hi = Number.parseInt(rangePart, 10);
    } else if (/^\d+-\d+$/.test(rangePart)) {
      const [a, b] = rangePart.split("-");
      lo = Number.parseInt(a, 10);
      hi = Number.parseInt(b, 10);
    } else {
      return null;
    }
    if (lo < min || hi > max || lo > hi) return null;
    if (isStar && stepPart === null) star = true;
    for (let v = lo; v <= hi; v += step) {
      values.add(key === "dows" && v === 7 ? 0 : v);
    }
  }
  if (values.size === 0) return null;
  return { values, star };
}

/** Parse a 5-field cron expression; returns null when malformed. */
export function parseCronExpr(expr: string): CronExpr | null {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const fields: Partial<Record<FieldKey, CronField>> = {};
  for (let i = 0; i < 5; i++) {
    const field = parseField(parts[i], FIELD_ORDER[i]);
    if (!field) return null;
    fields[FIELD_ORDER[i]] = field;
  }
  return fields as CronExpr;
}

/**
 * Next strict occurrence of the expression after `from` (default now).
 * Returns null when the expression is invalid or nothing matches within
 * ~4 years (e.g. Feb 30).
 */
export function getNextCronRun(expr: string, from: Date = new Date()): Date | null {
  const cron = parseCronExpr(expr);
  if (!cron) return null;

  const minutes = [...cron.minutes.values].sort((a, b) => a - b);
  const hours = [...cron.hours.values].sort((a, b) => a - b);

  const c = new Date(from.getTime());
  c.setSeconds(0, 0);
  c.setMinutes(c.getMinutes() + 1);

  /* Month-level walk (≤48 months ≈ 4 years of runway). */
  for (let guard = 0; guard < 48; guard++) {
    if (!cron.months.values.has(c.getMonth() + 1)) {
      c.setDate(1);
      c.setHours(0, 0, 0, 0);
      c.setMonth(c.getMonth() + 1);
      continue;
    }
    const year = c.getFullYear();
    const month = c.getMonth();

    /* Day-level walk inside the matched month. */
    while (c.getMonth() === month) {
      const dom = c.getDate();
      const dow = c.getDay();
      const domOk = cron.doms.values.has(dom);
      const dowOk = cron.dows.values.has(dow);
      const dayMatches =
        cron.doms.star && cron.dows.star
          ? true
          : cron.doms.star
            ? dowOk
            : cron.dows.star
              ? domOk
              : domOk || dowOk;
      if (!dayMatches) {
        c.setDate(dom + 1);
        c.setHours(0, 0, 0, 0);
        continue;
      }

      const currentHour = c.getHours();
      const currentMinute = c.getMinutes();
      for (const h of hours) {
        if (h < currentHour) continue;
        for (const m of minutes) {
          if (h === currentHour && m < currentMinute) continue;
          return new Date(year, month, dom, h, m, 0, 0);
        }
      }
      c.setDate(dom + 1);
      c.setHours(0, 0, 0, 0);
    }
    /* month exhausted — the outer loop re-checks the (new) current month */
  }
  return null;
}

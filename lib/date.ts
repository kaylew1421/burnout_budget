export function ymd(d = new Date()) {
  return d.toISOString().slice(0, 10);
}
export function addDaysYMD(ymdStr: string, days: number) {
  const d = new Date(`${ymdStr}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

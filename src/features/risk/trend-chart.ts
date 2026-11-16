const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

/** "2025-07" -> "Jul" (or "Jul 2025" with `withYear`). */
export function monthLabel(month: string, withYear = false): string {
  const name = MONTHS[Number(month.slice(5, 7)) - 1] ?? month;
  return withYear ? `${name} ${month.slice(0, 4)}` : name;
}

/** Y-axis ticks from 0 in round steps, at most 5 ticks, the last one >= max. */
export function niceTicks(max: number): number[] {
  if (max <= 0) return [0, 1];
  const rough = max / 3;
  const pow = 10 ** Math.floor(Math.log10(rough));
  // Counts are integers, so only whole steps qualify (2.5 only from 25 up).
  const step =
    [1, 2, 2.5, 5, 10]
      .map((m) => m * pow)
      .find((v) => v >= rough && Number.isInteger(v)) ?? Math.ceil(rough);
  const ticks: number[] = [];
  for (let v = 0; v < max + step; v += step) {
    ticks.push(v);
    if (v >= max) break;
  }
  return ticks;
}

/** Step path for the line and the closed area; each value fills one slot of width / n. */
export function stepAreaPath(
  values: number[],
  width: number,
  height: number,
  top: number,
): { line: string; area: string } {
  const slot = width / values.length;
  const y = (v: number) => +(height - (v / top) * height).toFixed(2);
  let line = `M0 ${y(values[0])}`;
  values.forEach((v, i) => {
    if (i > 0) line += `V${y(v)}`;
    line += `H${+((i + 1) * slot).toFixed(2)}`;
  });
  return { line, area: `M0 ${height}V${line.slice(3)}V${height}Z` };
}

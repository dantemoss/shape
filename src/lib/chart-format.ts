import { roundMoney } from "./money";

/** Pesos con el mismo criterio que el resto de Shape, siempre en es-AR. */
export function formatChartPesos(amount: number): string {
  const rounded = roundMoney(amount);
  const abs = Math.abs(rounded);
  const digits = Math.abs(abs - Math.round(abs)) < 0.001 ? 0 : 2;
  const formatted = abs.toLocaleString("es-AR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: 2,
  });
  return rounded < 0 ? `−$${formatted}` : `$${formatted}`;
}

/** Eje corto: `$30 mil`, `$1,2 M`. */
export function formatAxisPesos(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  if (abs >= 1_000_000) {
    const scaled = abs / 1_000_000;
    const digits = scaled >= 10 ? 0 : 1;
    return `${sign}$${scaled.toLocaleString("es-AR", { maximumFractionDigits: digits })} M`;
  }
  if (abs >= 1000) {
    const scaled = abs / 1000;
    const digits = scaled >= 10 ? 0 : 1;
    return `${sign}$${scaled.toLocaleString("es-AR", { maximumFractionDigits: digits })} mil`;
  }
  return `${sign}$${Math.round(abs).toLocaleString("es-AR")}`;
}

export function formatSignedPercent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "0%";
  const abs = Math.abs(value).toLocaleString("es-AR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  if (value > 0.05) return `+${abs}%`;
  if (value < -0.05) return `−${abs}%`;
  return `${abs}%`;
}

export function niceCeiling(max: number, steps = 4): { top: number; ticks: number[] } {
  const safe = Number.isFinite(max) && max > 0 ? max : 1;
  const rough = safe / steps;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const err = rough / pow;
  const step = err <= 1.5 ? pow : err <= 3 ? 2 * pow : err <= 7 ? 5 * pow : 10 * pow;
  const top = Math.max(step, Math.ceil(safe / step) * step);
  const ticks: number[] = [];
  for (let value = 0; value <= top + step * 0.001; value += step) {
    ticks.push(Math.round(value));
  }
  return { top, ticks };
}

export function paddedDomain(values: number[]): { min: number; max: number } {
  const finite = values.filter((value) => Number.isFinite(value));
  if (finite.length === 0) return { min: 0, max: 1 };
  let min = Math.min(...finite);
  let max = Math.max(...finite);
  if (min === max) {
    const pad = Math.abs(min) * 0.2 || 1;
    min -= pad;
    max += pad;
  } else {
    const pad = (max - min) * 0.18;
    min -= pad;
    max += pad;
  }
  return { min, max };
}

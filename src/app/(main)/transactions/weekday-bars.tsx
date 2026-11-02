import { signedFormat, type WeekdayPattern } from "./logic";

/** Barras chicas, ancho fijo. Un solo tono: el día más alto va oscuro y el resto gris. */
export function WeekdayBars({ pattern }: { pattern: WeekdayPattern }) {
  const max = Math.max(...pattern.buckets.map((bucket) => bucket.value), 0);
  if (max <= 0) {
    return <p className="text-[13px] leading-snug text-[#6d7480]">Sin movimientos en estos días.</p>;
  }

  const width = 280;
  const height = 104;
  const labelH = 18;
  const plotH = height - labelH - 6;
  const gap = 10;
  const barW = (width - gap * (pattern.buckets.length - 1)) / pattern.buckets.length;

  return (
    <div className="min-w-0">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[104px] w-full max-w-[280px]"
        role="img"
        aria-label={pattern.title}
      >
        {pattern.buckets.map((bucket, index) => {
          const barH = Math.max(4, (bucket.value / max) * plotH);
          const x = index * (barW + gap);
          const y = plotH - barH;
          const peak = bucket.value === max;
          return (
            <g key={bucket.key}>
              <title>
                {bucket.label}: {signedFormat(bucket.value, pattern.currency)}
              </title>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={8}
                fill={peak ? "#1c1f26" : "#e6e8ee"}
              />
              <text
                x={x + barW / 2}
                y={height - 2}
                textAnchor="middle"
                fill="#9aa1ab"
                fontSize="11"
                className="font-sans"
              >
                {bucket.label}
              </text>
            </g>
          );
        })}
      </svg>
      {pattern.peakLabel ? <p className="mt-2 text-[13px] leading-snug text-[#6d7480]">{pattern.peakLabel}</p> : null}
    </div>
  );
}

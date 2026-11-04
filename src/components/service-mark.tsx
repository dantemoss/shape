import { IconWell } from "@/components/primitives";
import { monogram, resolveServiceMark } from "@/lib/service-marks";

/** Pozo neutro. El isotipo conserva el color de la marca; si no hay marca, monograma oscuro. */
export function ServiceMark({
  name,
  domain = "",
  size = "md",
}: {
  name: string;
  domain?: string;
  size?: "sm" | "md";
}) {
  const mark = resolveServiceMark(name, domain);
  const icon = size === "sm" ? "size-3.5" : "size-[18px]";
  return (
    <IconWell size={size === "sm" ? "sm" : "md"}>
      {mark ? (
        <svg viewBox={mark.viewBox} className={icon} aria-hidden>
          <path d={mark.path} fill={mark.hex} />
        </svg>
      ) : (
        <span className={size === "sm" ? "text-[11px] font-semibold" : "text-[12px] font-semibold"}>{monogram(name)}</span>
      )}
    </IconWell>
  );
}

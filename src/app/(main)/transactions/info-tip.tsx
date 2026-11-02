"use client";

import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/** Igual al InfoTip de las primitivas compartidas. Local hasta que ese PR entre a main. */
export function InfoTip({
  text,
  label = "Más información",
  buttonClassName,
}: {
  text: string;
  label?: string;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const shown = open || hover;

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <span
      ref={ref}
      className="relative shrink-0"
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHover(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") setHover(false);
      }}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={shown}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex size-4 items-center justify-center rounded-full border border-black/[0.06] bg-[#f4f5f7] text-[#1c1f26]",
          buttonClassName
        )}
      >
        <Info size={11} />
      </button>
      {shown ? (
        <span className="absolute top-6 left-0 z-30 w-[min(18rem,calc(100vw-3rem))] rounded-2xl bg-white p-3 text-[13px] leading-relaxed text-[#3a4150] shadow-[0_12px_32px_rgba(15,23,42,0.12)] ring-1 ring-black/[0.06]">
          {text}
        </span>
      ) : null}
    </span>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";

/**
 * Puntero de color, adaptado de Magic UI (MIT), variante Colored Pointer:
 * https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/pointer.tsx
 * El relleno es --brand. No hay gradiente.
 * Una sola instancia sigue al mouse sobre [data-shape-pointer].
 */

const FINE_POINTER = "(hover: hover) and (pointer: fine)";
const REDUCE_MOTION = "(prefers-reduced-motion: reduce)";
const ENTER_MS = 0.2;
const EXIT_MS = 0.16;
const EASE = [0.16, 1, 0.3, 1] as const;
const CURSOR_SIZE = 24;

const NATIVE_CONTROL = [
  "button",
  "input",
  "textarea",
  "select",
  "a",
  "label",
  "summary",
  "[role='button']",
  "[role='tab']",
  "[role='menuitem']",
  "[contenteditable='true']",
].join(", ");

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}

function zoneFromTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  const zone = target.closest("[data-shape-pointer]");
  if (!zone) return null;
  const control = target.closest(NATIVE_CONTROL);
  if (control && zone.contains(control) && control !== zone && !control.hasAttribute("data-shape-pointer")) {
    return null;
  }
  return zone;
}

export function Pointer() {
  const fine = useMediaQuery(FINE_POINTER);
  const reduce = useMediaQuery(REDUCE_MOTION);
  if (!fine || reduce) return null;
  return <PointerCursor />;
}

function PointerCursor() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [active, setActive] = useState(false);
  const activeRef = useRef(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("shape-pointer");

    const setShown = (next: boolean) => {
      if (activeRef.current === next) return;
      activeRef.current = next;
      setActive(next);
    };

    const show = (event: PointerEvent) => {
      if (event.pointerType === "touch" || event.pointerType === "pen") {
        setShown(false);
        return;
      }
      if (!zoneFromTarget(event.target)) {
        setShown(false);
        return;
      }
      x.set(event.clientX - CURSOR_SIZE / 2);
      y.set(event.clientY - CURSOR_SIZE / 2);
      setShown(true);
    };

    const hide = () => setShown(false);
    const hideIfLeft = (event: MouseEvent) => {
      if (!event.relatedTarget) hide();
    };

    window.addEventListener("pointermove", show, { passive: true });
    window.addEventListener("blur", hide);
    document.addEventListener("mouseout", hideIfLeft);

    return () => {
      root.classList.remove("shape-pointer");
      window.removeEventListener("pointermove", show);
      window.removeEventListener("blur", hide);
      document.removeEventListener("mouseout", hideIfLeft);
    };
  }, [x, y]);

  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          key="shape-pointer"
          aria-hidden
          className="pointer-events-none fixed top-0 left-0 z-50"
          style={{ x, y }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0, transition: { duration: EXIT_MS, ease: EASE } }}
          transition={{ duration: ENTER_MS, ease: EASE }}
        >
          <svg
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="1"
            viewBox="0 0 16 16"
            height={CURSOR_SIZE}
            width={CURSOR_SIZE}
            xmlns="http://www.w3.org/2000/svg"
            className="block rotate-[-70deg] fill-brand stroke-white text-brand"
          >
            <path d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103z" />
          </svg>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

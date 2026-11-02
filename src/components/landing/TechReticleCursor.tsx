import { useEffect, useRef, useState } from "react";

/**
 * TechReticleCursor
 * 
 * Precision Tech HUD reticle cursor:
 * - Minimalist technical crosshair / corner-bracket reticle (4 clean slate-colored corner angles: #475569)
 * - Centered around a tiny, sharp point (#475569 -> #3B82F6)
 * - Fluid inertia trailing physics via requestAnimationFrame spring/lerp
 * - Target locking state: corner brackets animate outward / snap to lock on with #3B82F6 steel-blue tint
 * - Automatically hidden on touchscreens
 */
export function TechReticleCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const reticleRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check if the device is touch-based or has a coarse pointer
    const isTouch =
      window.matchMedia("(pointer: coarse)").matches ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0;

    if (isTouch) {
      return;
    }

    setMounted(true);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let reticleX = mouseX;
    let reticleY = mouseY;
    let targetSize = 26;
    let currentSize = 26;
    let isLocked = false;
    let isClicking = false;
    let isVisible = false;
    let rafId: number;

    // Apply cursor-none to html and interactive elements
    document.documentElement.classList.add("tech-cursor-active");

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isVisible) {
        isVisible = true;
        reticleX = mouseX;
        reticleY = mouseY;
      }

      // Check for interactive targets (buttons, links, sliders, cards, inputs)
      const target = e.target as HTMLElement | null;
      const interactiveEl = target?.closest(
        "a, button, [role='button'], input, [role='slider'], select, textarea, label, .group, [data-interactive]"
      );

      isLocked = !!interactiveEl;
    };

    const onMouseDown = () => {
      isClicking = true;
    };

    const onMouseUp = () => {
      isClicking = false;
    };

    const onMouseLeave = () => {
      isVisible = false;
    };

    const onMouseEnter = () => {
      isVisible = true;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave, { passive: true });
    document.addEventListener("mouseenter", onMouseEnter, { passive: true });

    // Smooth inertia physics loop
    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

    const tick = () => {
      const dot = dotRef.current;
      const reticle = reticleRef.current;

      if (dot && reticle) {
        if (!isVisible) {
          dot.style.opacity = "0";
          reticle.style.opacity = "0";
        } else {
          dot.style.opacity = "1";
          reticle.style.opacity = "1";

          // Sharp center point snaps instantly to true mouse coordinates
          dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;

          // Reticle trails mouse with fluid spring/damping inertia
          const followSpeed = isLocked ? 0.22 : 0.16;
          reticleX = lerp(reticleX, mouseX, followSpeed);
          reticleY = lerp(reticleY, mouseY, followSpeed);

          // Size transition: 26px idle, 38px target-locked, 20px on-click
          targetSize = isClicking ? 20 : isLocked ? 38 : 26;
          currentSize = lerp(currentSize, targetSize, 0.2);

          reticle.style.transform = `translate3d(${reticleX}px, ${reticleY}px, 0)`;
          reticle.style.width = `${currentSize}px`;
          reticle.style.height = `${currentSize}px`;

          if (isLocked) {
            reticle.classList.add("reticle-locked");
            dot.classList.add("dot-locked");
          } else {
            reticle.classList.remove("reticle-locked");
            dot.classList.remove("dot-locked");
          }

          if (isClicking) {
            reticle.classList.add("reticle-clicking");
          } else {
            reticle.classList.remove("reticle-clicking");
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      document.documentElement.classList.remove("tech-cursor-active");
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden" aria-hidden="true">
      {/* ── Precision Sharp Center Point ── */}
      <div
        ref={dotRef}
        className="tech-center-point fixed left-0 top-0 -translate-x-1/2 -translate-y-1/2 transition-[background-color,box-shadow] duration-150 will-change-transform"
      />

      {/* ── Tech HUD Reticle with 4 Corner Brackets ── */}
      <div
        ref={reticleRef}
        className="tech-reticle-frame fixed left-0 top-0 -translate-x-1/2 -translate-y-1/2 will-change-[transform,width,height]"
      >
        {/* Top-Left Bracket */}
        <span className="reticle-corner reticle-corner-tl" />
        {/* Top-Right Bracket */}
        <span className="reticle-corner reticle-corner-tr" />
        {/* Bottom-Left Bracket */}
        <span className="reticle-corner reticle-corner-bl" />
        {/* Bottom-Right Bracket */}
        <span className="reticle-corner reticle-corner-br" />

        {/* Micro Axis Ticks */}
        <span className="reticle-axis reticle-axis-top" />
        <span className="reticle-axis reticle-axis-bottom" />
        <span className="reticle-axis reticle-axis-left" />
        <span className="reticle-axis reticle-axis-right" />
      </div>
    </div>
  );
}

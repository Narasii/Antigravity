import { useEffect, useRef } from "react";

/**
 * InteractiveBackground
 * 
 * Clean light-mode enterprise background canvas:
 * - Canvas sitting behind app layout (#F8FAFC)
 * - Subtle geometric dot grid (#E2E8F0)
 * - Reactive Spotlight Glow: tracks user cursor, softly illuminating nearby intersections in warm slate-indigo (#E0E7FF)
 * - Ambient Floating Nodes: 5 slowly drifting wireframe data node vectors signifying memory-mapped streaming
 * - 60fps optimized with spatial culling & RAF
 */

interface FloatingNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  type: "cube" | "hexagon" | "octahedron" | "buffer-pair" | "matrix";
  label: string;
}

export function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let rafId: number;

    // Mouse tracking with fluid lerp
    let mouseX = -1000;
    let mouseY = -1000;
    let spotX = -1000;
    let spotY = -1000;
    let isMouseActive = false;

    // Grid configuration
    const GRID_SPACING = 36;
    const DOT_BASE_RADIUS = 1.15;
    const SPOTLIGHT_RADIUS = 210;

    // Initialize 5 floating wireframe data nodes
    const nodes: FloatingNode[] = [
      {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: 0.18,
        vy: 0.12,
        size: 30,
        rotation: 0.2,
        rotSpeed: 0.002,
        type: "cube",
        label: "MMAP-RING::0x7f40",
      },
      {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: -0.15,
        vy: 0.2,
        size: 26,
        rotation: 0.8,
        rotSpeed: -0.0025,
        type: "hexagon",
        label: "SHARD_CACHE::NVMe",
      },
      {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: 0.22,
        vy: -0.14,
        size: 28,
        rotation: 1.4,
        rotSpeed: 0.0018,
        type: "octahedron",
        label: "ZERO_COPY::PINNED",
      },
      {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: -0.16,
        vy: -0.18,
        size: 24,
        rotation: 0.5,
        rotSpeed: 0.003,
        type: "buffer-pair",
        label: "RING_BUFFER::CUDA",
      },
      {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: 0.14,
        vy: 0.24,
        size: 25,
        rotation: 2.1,
        rotSpeed: -0.002,
        type: "matrix",
        label: "DMA_BYPASS::active",
      },
    ];

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });

    const onPointerMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isMouseActive) {
        spotX = mouseX;
        spotY = mouseY;
        isMouseActive = true;
      }
    };

    const onPointerLeave = () => {
      isMouseActive = false;
      mouseX = -1000;
      mouseY = -1000;
    };

    window.addEventListener("mousemove", onPointerMove, { passive: true });
    document.addEventListener("mouseleave", onPointerLeave, { passive: true });

    // Helper: Draw isometric wireframe cube
    const drawWireframeCube = (cx: number, cy: number, size: number, angle: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      const s = size * 0.7;
      const h = s * 0.577; // isometric angle ratio

      ctx.beginPath();
      // Center vertical
      ctx.moveTo(0, -h);
      ctx.lineTo(0, h);
      // Top face
      ctx.lineTo(s * 0.866, 0);
      ctx.lineTo(0, -h);
      ctx.lineTo(-s * 0.866, 0);
      ctx.lineTo(0, h);

      // Outer outline
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.866, -h * 0.5);
      ctx.lineTo(s * 0.866, h * 0.5);
      ctx.lineTo(0, s);
      ctx.lineTo(-s * 0.866, h * 0.5);
      ctx.lineTo(-s * 0.866, -h * 0.5);
      ctx.closePath();

      // Connecting edges
      ctx.moveTo(0, -s);
      ctx.lineTo(0, -h);
      ctx.moveTo(s * 0.866, h * 0.5);
      ctx.lineTo(s * 0.866, 0);
      ctx.moveTo(-s * 0.866, h * 0.5);
      ctx.lineTo(-s * 0.866, 0);

      ctx.stroke();
      ctx.restore();
    };

    // Helper: Draw wireframe hexagon with internal braces
    const drawWireframeHex = (cx: number, cy: number, size: number, angle: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      const r = size * 0.6;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const x = r * Math.cos(a);
        const y = r * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      // Inner spokes
      for (let i = 0; i < 3; i++) {
        const a1 = (i * Math.PI) / 3;
        const a2 = a1 + Math.PI;
        ctx.moveTo(r * Math.cos(a1), r * Math.sin(a1));
        ctx.lineTo(r * Math.cos(a2), r * Math.sin(a2));
      }

      ctx.stroke();
      ctx.restore();
    };

    // Helper: Draw wireframe octahedron
    const drawWireframeOctahedron = (cx: number, cy: number, size: number, angle: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      const w = size * 0.6;
      const h = size * 0.75;

      ctx.beginPath();
      // Outer diamond
      ctx.moveTo(0, -h);
      ctx.lineTo(w, 0);
      ctx.lineTo(0, h);
      ctx.lineTo(-w, 0);
      ctx.closePath();

      // Inner horizon
      ctx.moveTo(-w, 0);
      ctx.lineTo(0, -h * 0.2);
      ctx.lineTo(w, 0);
      ctx.lineTo(0, h * 0.2);
      ctx.closePath();

      ctx.stroke();
      ctx.restore();
    };

    // Helper: Draw wireframe buffer pair with stream vector
    const drawWireframeBufferPair = (cx: number, cy: number, size: number, angle: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      const s = size * 0.4;
      // Box 1
      ctx.strokeRect(-size * 0.6, -s * 0.5, s, s);
      // Box 2
      ctx.strokeRect(size * 0.2, -s * 0.5, s, s);

      // Connecting vector arrow
      ctx.beginPath();
      ctx.setLineDash([2, 2]);
      ctx.moveTo(-size * 0.2, 0);
      ctx.lineTo(size * 0.2, 0);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore();
    };

    // Helper: Draw wireframe 2x2 matrix shard
    const drawWireframeMatrix = (cx: number, cy: number, size: number, angle: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      const s = size * 0.5;
      ctx.strokeRect(-s, -s, s * 2, s * 2);

      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(0, s);
      ctx.moveTo(-s, 0);
      ctx.lineTo(s, 0);
      ctx.stroke();

      ctx.restore();
    };

    let isTabVisible = true;
    const onVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // ── 60fps Render Loop ──
    const render = () => {
      if (!isTabVisible) {
        rafId = requestAnimationFrame(render);
        return;
      }

      // Smooth spotlight inertia towards mouse
      spotX += (mouseX - spotX) * 0.12;
      spotY += (mouseY - spotY) * 0.12;

      // Clean Light-Mode Enterprise Background: #F8FAFC
      ctx.fillStyle = "#F8FAFC";
      ctx.fillRect(0, 0, width, height);

      // ── 1. Reactive Spotlight Radial Gradient Glow (#E0E7FF) ──
      if (isMouseActive && spotX > -200 && spotY > -200) {
        const spotGrad = ctx.createRadialGradient(
          spotX,
          spotY,
          10,
          spotX,
          spotY,
          SPOTLIGHT_RADIUS
        );
        // Soft warm slate-indigo hue without neon flare
        spotGrad.addColorStop(0, "rgba(224, 231, 255, 0.55)"); // #E0E7FF
        spotGrad.addColorStop(0.5, "rgba(238, 242, 255, 0.28)"); // #EEF2FF
        spotGrad.addColorStop(1, "rgba(248, 250, 252, 0)"); // fade cleanly into #F8FAFC

        ctx.fillStyle = spotGrad;
        ctx.fillRect(
          spotX - SPOTLIGHT_RADIUS,
          spotY - SPOTLIGHT_RADIUS,
          SPOTLIGHT_RADIUS * 2,
          SPOTLIGHT_RADIUS * 2
        );
      }

      // ── 2. Subtle Geometric Dot Grid (#E2E8F0) ──
      const cols = Math.ceil(width / GRID_SPACING);
      const rows = Math.ceil(height / GRID_SPACING);
      const spotDistSqMax = SPOTLIGHT_RADIUS * SPOTLIGHT_RADIUS;

      for (let c = 0; c <= cols; c++) {
        const x = c * GRID_SPACING;
        for (let r = 0; r <= rows; r++) {
          const y = r * GRID_SPACING;

          let radius = DOT_BASE_RADIUS;
          let fill = "#E2E8F0"; // Slate-200 base dot color

          if (isMouseActive) {
            const dx = x - spotX;
            const dy = y - spotY;
            const distSq = dx * dx + dy * dy;

            if (distSq < spotDistSqMax) {
              const intensity = 1 - Math.sqrt(distSq) / SPOTLIGHT_RADIUS;
              // Smoothly illuminate dots near spotlight
              radius = DOT_BASE_RADIUS + intensity * 1.05;
              // Transition from slate-200 to subtle slate-indigo/steel
              fill = intensity > 0.45 ? "#94A3B8" : "#CBD5E1";
            }
          }

          ctx.fillStyle = fill;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── 3. Ambient Floating Data Nodes (Memory-Mapped Streaming Vectors) ──
      ctx.lineWidth = 1.15;
      ctx.strokeStyle = "rgba(100, 116, 139, 0.28)"; // Clean slate #64748B with gentle opacity
      ctx.fillStyle = "rgba(100, 116, 139, 0.38)";
      ctx.font = "9px 'JetBrains Mono', monospace";

      for (const node of nodes) {
        // Update position along smooth trajectory
        node.x += node.vx;
        node.y += node.vy;
        node.rotation += node.rotSpeed;

        // Wrap around screen boundaries cleanly
        if (node.x < -80) node.x = width + 80;
        if (node.x > width + 80) node.x = -80;
        if (node.y < -80) node.y = height + 80;
        if (node.y > height + 80) node.y = -80;

        // Draw node wireframe based on type
        switch (node.type) {
          case "cube":
            drawWireframeCube(node.x, node.y, node.size, node.rotation);
            break;
          case "hexagon":
            drawWireframeHex(node.x, node.y, node.size, node.rotation);
            break;
          case "octahedron":
            drawWireframeOctahedron(node.x, node.y, node.size, node.rotation);
            break;
          case "buffer-pair":
            drawWireframeBufferPair(node.x, node.y, node.size, node.rotation);
            break;
          case "matrix":
            drawWireframeMatrix(node.x, node.y, node.size, node.rotation);
            break;
        }

        // Draw tiny technical metadata tag
        ctx.fillText(node.label, node.x + node.size * 0.7, node.y + 3);
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onPointerMove);
      document.removeEventListener("mouseleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-10 block"
      aria-hidden="true"
    />
  );
}

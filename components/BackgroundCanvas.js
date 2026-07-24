"use client";
import { useEffect, useRef } from "react";

export default function BackgroundCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w, h, dots = [], blobs = [];
    const mouse = { x: -9999, y: -9999 };
    let raf;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      const count = Math.min(95, Math.floor((w * h) / 16000));
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        base: 1.4 + Math.random() * 1.2,
        phase: Math.random() * Math.PI * 2,
        red: Math.random() < 0.2,
      }));
      blobs = [
        { cx: w * 0.2, cy: h * 0.25, r: 260, color: "227,27,35", spd: 0.00035, off: 0 },
        { cx: w * 0.8, cy: h * 0.65, r: 320, color: "13,13,13", spd: 0.00028, off: 2 },
        { cx: w * 0.5, cy: h * 0.85, r: 220, color: "227,27,35", spd: 0.0004, off: 4 },
      ];
    }
    function onMove(e) { mouse.x = e.clientX; mouse.y = e.clientY; }
    function onLeave() { mouse.x = -9999; mouse.y = -9999; }

    function frame(t) {
      ctx.clearRect(0, 0, w, h);
      blobs.forEach((b) => {
        const bx = b.cx + Math.cos(t * b.spd + b.off) * 70;
        const by = b.cy + Math.sin(t * b.spd * 1.3 + b.off) * 70;
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, b.r);
        g.addColorStop(0, `rgba(${b.color},0.07)`);
        g.addColorStop(1, `rgba(${b.color},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      });
      dots.forEach((d) => {
        const dx = d.x - mouse.x, dy = d.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 110) {
          const force = ((110 - dist) / 110) * 0.6;
          d.x += (dx / dist) * force;
          d.y += (dy / dist) * force;
        }
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;
      });
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const a = dots[i], b = dots[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 150) {
            ctx.strokeStyle = `rgba(13,13,13,${(1 - dist / 150) * 0.12})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        const md = Math.hypot(dots[i].x - mouse.x, dots[i].y - mouse.y);
        if (md < 190) {
          ctx.strokeStyle = `rgba(227,27,35,${(1 - md / 190) * 0.4})`;
          ctx.lineWidth = 1.3;
          ctx.beginPath(); ctx.moveTo(dots[i].x, dots[i].y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
      dots.forEach((d) => {
        const pulse = d.base + Math.sin(t * 0.002 + d.phase) * 0.7;
        ctx.fillStyle = d.red ? "rgba(227,27,35,0.6)" : "rgba(13,13,13,0.4)";
        ctx.beginPath(); ctx.arc(d.x, d.y, pulse, 0, Math.PI * 2); ctx.fill();
      });
      if (!reduceMotion) raf = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas id="bgCanvas" ref={canvasRef} />;
}

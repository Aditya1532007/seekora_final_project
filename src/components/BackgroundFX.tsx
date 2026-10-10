import { useEffect, useRef, useState } from "react";

export function BackgroundFX() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const particles: Particle[] = [];
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let animId = 0;
    let lastFrame = 0;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointer = window.matchMedia("(pointer: coarse)");

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      const count = coarsePointer.matches
        ? Math.min(32, Math.max(14, Math.floor(width / 24)))
        : Math.min(85, Math.max(30, Math.floor(width / 14)));
      while (particles.length < count) particles.push(new Particle());
      particles.length = count;
      particles.forEach((particle) => particle.reset());
    };

    class Particle {
      x = 0;
      y = 0;
      vx = 0;
      vy = 0;
      r = 0;
      c = "";

      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.35;
        this.vy = (Math.random() - 0.5) * 0.35;
        this.r = Math.random() * 1.8 + 0.4;
        const colors = ["0,229,255", "124,58,237", "255,46,166"];
        this.c = colors[Math.floor(Math.random() * 3)];
      }

      update() {
        const dx = mx - this.x;
        const dy = my - this.y;
        const d = Math.hypot(dx, dy);
        if (d < 160 && d > 40) {
          this.x += dx * 0.0018;
          this.y += dy * 0.0018;
        }
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
          this.reset();
        }
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, 7);
        ctx.fillStyle = `rgba(${this.c},0.7)`;
        ctx.fill();
      }
    }

    resize();
    const draw = (timestamp: number) => {
      if (document.hidden) return;
      if (!reducedMotion.matches && timestamp - lastFrame < 1000 / 30) {
        animId = requestAnimationFrame(draw);
        return;
      }
      lastFrame = timestamp;
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.hypot(dx, dy);
          if (d < 130) {
            ctx.strokeStyle = `rgba(124,58,237,${0.13 * (1 - d / 130)})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
        if (!reducedMotion.matches) particles[i].update();
        particles[i].draw();
      }
      if (!reducedMotion.matches) animId = requestAnimationFrame(draw);
    };

    const start = () => {
      cancelAnimationFrame(animId);
      lastFrame = 0;
      animId = requestAnimationFrame(draw);
    };
    const onMotionPreferenceChange = () => {
      if (reducedMotion.matches) {
        cancelAnimationFrame(animId);
        draw(0);
      } else if (!document.hidden) {
        start();
      }
    };
    const onVisibilityChange = () => {
      if (document.hidden) cancelAnimationFrame(animId);
      else if (!reducedMotion.matches) start();
      else draw(0);
    };
    const onMouseMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibilityChange);
    reducedMotion.addEventListener("change", onMotionPreferenceChange);
    coarsePointer.addEventListener("change", resize);
    if (!coarsePointer.matches) window.addEventListener("mousemove", onMouseMove);
    if (reducedMotion.matches) draw(0);
    else start();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reducedMotion.removeEventListener("change", onMotionPreferenceChange);
      coarsePointer.removeEventListener("change", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="particles-canvas" />
      <div className="grid-overlay" />
      <div className="glow-orb orb1" />
      <div className="glow-orb orb2" />
    </>
  );
}

export function CursorFX() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine) and (min-width: 768px)");
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let ringX = targetX;
    let ringY = targetY;
    let frameId = 0;
    let active = false;

    const position = (element: HTMLDivElement, x: number, y: number) => {
      element.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      targetX = event.clientX;
      targetY = event.clientY;
      position(dot, targetX, targetY);
      if (reducedMotion.matches) {
        ringX = targetX;
        ringY = targetY;
        position(ring, ringX, ringY);
      }
    };
    const animateRing = () => {
      ringX += (targetX - ringX) * 0.14;
      ringY += (targetY - ringY) * 0.14;
      position(ring, ringX, ringY);
      frameId = requestAnimationFrame(animateRing);
    };
    const onPointerOver = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest("a, button, input, textarea, select, [role='button']")) {
        document.body.classList.add("seekora-cursor-hover");
      }
    };
    const onPointerOut = (event: PointerEvent) => {
      if (
        event.target instanceof Element
        && event.target.closest("a, button, input, textarea, select, [role='button']")
        && !(event.relatedTarget instanceof Element
          && event.relatedTarget.closest("a, button, input, textarea, select, [role='button']"))
      ) {
        document.body.classList.remove("seekora-cursor-hover");
      }
    };
    const onMotionPreferenceChange = () => {
      cancelAnimationFrame(frameId);
      if (reducedMotion.matches) {
        ringX = targetX;
        ringY = targetY;
        position(ring, ringX, ringY);
      } else {
        animateRing();
      }
    };
    const disable = () => {
      if (!active) return;
      active = false;
      document.body.classList.remove("seekora-custom-cursor", "seekora-cursor-hover");
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerover", onPointerOver);
      window.removeEventListener("pointerout", onPointerOut);
      reducedMotion.removeEventListener("change", onMotionPreferenceChange);
      cancelAnimationFrame(frameId);
    };
    const enable = () => {
      if (active) return;
      active = true;
      document.body.classList.add("seekora-custom-cursor");
      position(dot, targetX, targetY);
      position(ring, ringX, ringY);
      if (!reducedMotion.matches) animateRing();
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerover", onPointerOver);
      window.addEventListener("pointerout", onPointerOut);
      reducedMotion.addEventListener("change", onMotionPreferenceChange);
    };
    const onPointerCapabilityChange = () => {
      if (finePointer.matches) enable();
      else disable();
    };

    if (finePointer.matches) enable();
    finePointer.addEventListener("change", onPointerCapabilityChange);
    window.addEventListener("resize", onPointerCapabilityChange);

    return () => {
      disable();
      finePointer.removeEventListener("change", onPointerCapabilityChange);
      window.removeEventListener("resize", onPointerCapabilityChange);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="seekora-cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="seekora-cursor-ring" aria-hidden="true" />
    </>
  );
}

export function ProgressBar() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
      setWidth(pct);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return <div className="progress-bar" style={{ width: `${width}%` }} />;
}

export function Preloader({ done }: { done: boolean }) {
  const [fillWidth, setFillWidth] = useState(0);

  useEffect(() => {
    let lp = 0;
    const interval = setInterval(() => {
      lp = Math.min(100, lp + Math.random() * 22);
      setFillWidth(lp);
      if (lp >= 100) clearInterval(interval);
    }, 180);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`preloader ${done ? "done" : ""}`}>
      <div className="loader-logo">
        <div className="logo-icon" style={{ width: 56, height: 56 }}>S</div>
      </div>
      <div className="loader-bar">
        <div className="loader-bar-fill" style={{ width: `${fillWidth}%` }} />
      </div>
      <div className="loader-text">Loading Seekora...</div>
    </div>
  );
}

export function ToTopButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      className={`to-top ${show ? "show" : ""}`}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      title="Back to top"
    >
      ↑
    </button>
  );
}

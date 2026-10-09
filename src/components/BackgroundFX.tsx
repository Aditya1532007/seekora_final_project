import { useEffect, useRef, useState } from "react";

export function BackgroundFX() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Particle[] = [];
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    const onMouseMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", resize);

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      c: string;

      constructor() {
        this.reset();
        this.y = Math.random() * canvas.height;
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
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
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
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

    const count = Math.min(85, Math.floor(window.innerWidth / 14));
    for (let i = 0; i < count; i++) particles.push(new Particle());

    const loop = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
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
        particles[i].update();
        particles[i].draw();
      }
      animId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", resize);
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

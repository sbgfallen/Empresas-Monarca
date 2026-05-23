"use client";

import { useCallback, useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  radius: number;
  color: string;
  glowColor: string;
  twinklePhase: number;
  twinkleSpeed: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  opacity: number;
  color: { r: number; g: number; b: number };
  life: number;
  maxLife: number;
}

// ─── Config ───────────────────────────────────────────

const PARTICLE_COUNT = 55;
const MAX_CONNECTION_DIST = 130;
const PARTICLE_SPEED = 0.3;
const CONNECTION_OPACITY = 0.08;
const MAX_PARTICLE_OPACITY = 0.45;
const MIN_PARTICLE_RADIUS = 1.2;
const MAX_PARTICLE_RADIUS = 3.0;

// Twinkle config
const TWINKLE_SPEED_MIN = 0.6;
const TWINKLE_SPEED_MAX = 2.0;

// Constellation config
const CONSTELLATION_NEIGHBORS = 2; // nearest neighbors per particle
const CONSTELLATION_LINE_GLOW = 3.0; // glow multiplier for line width
const PULSE_SPEED_MIN = 0.4; // radians per second
const PULSE_SPEED_MAX = 1.2;

// Shooting star config
const SHOOTING_STAR_SPEED = 14;
const SHOOTING_STAR_LENGTH = 120;
const SHOOTING_STAR_MIN_INTERVAL = 3000;  // ms
const SHOOTING_STAR_MAX_INTERVAL = 10000; // ms
const SHOOTING_STAR_OPACITY = 0.85;

// Brand color palette
const COLORS = {
  rose: { r: 244, g: 63, b: 94 },
  amber: { r: 251, g: 191, b: 36 },
  white: { r: 254, g: 252, b: 245 },
} as const;

function rgba({ r, g, b }: { r: number; g: number; b: number }, a: number) {
  return `rgba(${r},${g},${b},${a})`;
}

function pickColor(): { r: number; g: number; b: number } {
  const rand = Math.random();
  if (rand < 0.6) return COLORS.rose;
  if (rand < 0.7) return COLORS.amber;
  return COLORS.white;
}

// ─── Component ────────────────────────────────────────

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  // Persistent constellation connections: Map<"i,j", { phase, speed }>
  const connectionsRef = useRef<Map<string, { phase: number; speed: number }>>(
    new Map()
  );
  const timeRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // ── Shooting star helpers ──

  const spawnShootingStar = useCallback((w: number, h: number): ShootingStar => {
    // Decide entry edge: 0 = top, 1 = left, 2 = right edge (shooting inwards)
    const edge = Math.floor(Math.random() * 3);
    let x: number, y: number, vx: number, vy: number;
    const angle = 0.4 + Math.random() * 0.5; // diagonal angle (22°-51°)
    const speed = SHOOTING_STAR_SPEED * (0.7 + Math.random() * 0.6);

    switch (edge) {
      case 0: // top edge → shoots down-right
        x = Math.random() * w * 0.8;
        y = -20;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;
        break;
      case 1: // left edge → shoots down-right
        x = -20;
        y = Math.random() * h * 0.6;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;
        break;
      case 2: // top-right area → shoots down-left
        x = w * (0.6 + Math.random() * 0.4);
        y = -20;
        vx = -Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;
        break;
      default:
        x = -20;
        y = -20;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;
    }

    // Color: mostly rose or warm white, occasionally amber
    const color =
      Math.random() < 0.5
        ? COLORS.rose
        : Math.random() < 0.7
          ? COLORS.white
          : COLORS.amber;

    const lifeMax = 40 + Math.floor(Math.random() * 30); // frames

    return {
      x,
      y,
      vx,
      vy,
      length: SHOOTING_STAR_LENGTH * (0.6 + Math.random() * 0.4),
      opacity: SHOOTING_STAR_OPACITY * (0.6 + Math.random() * 0.4),
      color,
      life: 0,
      maxLife: lifeMax,
    };
  }, []);

  const initParticles = useCallback((w: number, h: number) => {
    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const c = pickColor();
      const opacity = 0.1 + Math.random() * MAX_PARTICLE_OPACITY;
      const baseR =
        MIN_PARTICLE_RADIUS +
        Math.random() * (MAX_PARTICLE_RADIUS - MIN_PARTICLE_RADIUS);
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * PARTICLE_SPEED,
        vy: (Math.random() - 0.5) * PARTICLE_SPEED,
        baseRadius: baseR,
        radius: baseR,
        color: rgba(c, opacity),
        glowColor: rgba(c, opacity * 0.15),
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed:
          TWINKLE_SPEED_MIN +
          Math.random() * (TWINKLE_SPEED_MAX - TWINKLE_SPEED_MIN),
      });
    }
    particlesRef.current = particles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ── Resize handler ──
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas!.width = w;
      canvas!.height = h;
      initParticles(w, h);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // ── Mouse tracking ──
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    // ── Shooting stars state ──
    const shootingStars: ShootingStar[] = [];
    let nextStarTimer =
      SHOOTING_STAR_MIN_INTERVAL +
      Math.random() * (SHOOTING_STAR_MAX_INTERVAL - SHOOTING_STAR_MIN_INTERVAL);
    let lastStarSpawn = performance.now();

    // ── Connection color strings (precomputed) ──
    const roseConnection = (opacity: number) =>
      `rgba(244,63,94,${opacity})`;
    const amberConnection = (opacity: number) =>
      `rgba(251,191,36,${opacity})`;

    // ── Animation loop ──
    const animate = (now: number) => {
      const w = canvas!.width;
      const h = canvas!.height;

      ctx!.clearRect(0, 0, w, h);

      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      // ── Update particles ──
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        p.vx += (Math.random() - 0.5) * 0.02;
        p.vy += (Math.random() - 0.5) * 0.02;

        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > PARTICLE_SPEED * 1.5) {
          p.vx = (p.vx / speed) * PARTICLE_SPEED;
          p.vy = (p.vy / speed) * PARTICLE_SPEED;
        }

        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
      }

      // ── Advance global time with real delta ──
      const delta = lastTimeRef.current ? (now - lastTimeRef.current) / 1000 : 1 / 60;
      timeRef.current += Math.min(delta, 0.05); // cap to avoid large jumps
      lastTimeRef.current = now;
      const t = timeRef.current;

      // ── Build constellation connections (each particle → 2 nearest neighbors) ──
      const newConnections = new Map<string, { phase: number; speed: number }>();
      const oldConnections = connectionsRef.current;

      for (let i = 0; i < particles.length; i++) {
        // Collect all neighbors j > i within range, sorted by distance
        const neighbors: { j: number; dist: number }[] = [];
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_CONNECTION_DIST) {
            neighbors.push({ j, dist });
          }
        }
        neighbors.sort((a, b) => a.dist - b.dist);

        // Connect to the nearest N neighbors
        const limit = Math.min(CONSTELLATION_NEIGHBORS, neighbors.length);
        for (let k = 0; k < limit; k++) {
          const j = neighbors[k].j;
          const key = `${Math.min(i, j)},${Math.max(i, j)}`;
          if (!newConnections.has(key)) {
            // Reuse existing connection data for stability, or create new
            const existing = oldConnections.get(key);
            newConnections.set(key, {
              phase: existing?.phase ?? Math.random() * Math.PI * 2,
              speed:
                existing?.speed ??
                PULSE_SPEED_MIN +
                  Math.random() * (PULSE_SPEED_MAX - PULSE_SPEED_MIN),
            });
          }
        }
      }

      connectionsRef.current = newConnections;

      // ── Draw constellation connections with pulse ──
      for (const [key, conn] of newConnections) {
        const [si, sj] = key.split(",").map(Number);
        const a = particles[si];
        const b = particles[sj];

        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Sine pulse: oscillates between 0.2 and 1.0
        const pulse = 0.7 + 0.3 * Math.sin(t * conn.speed + conn.phase);
        const distFactor = 1 - dist / MAX_CONNECTION_DIST;
        const op = CONNECTION_OPACITY * pulse * distFactor;

        // Glow layer (wider, softer)
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.lineTo(b.x, b.y);
        ctx!.strokeStyle = roseConnection(op * 0.3);
        ctx!.lineWidth = CONSTELLATION_LINE_GLOW;
        ctx!.stroke();

        // Core line
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.lineTo(b.x, b.y);
        ctx!.strokeStyle = roseConnection(op);
        ctx!.lineWidth = 0.7;
        ctx!.stroke();

        // Tiny node glow at each particle on this connection
        ctx!.beginPath();
        ctx!.arc(a.x, a.y, 2, 0, Math.PI * 2);
        ctx!.fillStyle = roseConnection(op * 0.15);
        ctx!.fill();
        ctx!.beginPath();
        ctx!.arc(b.x, b.y, 2, 0, Math.PI * 2);
        ctx!.fillStyle = roseConnection(op * 0.15);
        ctx!.fill();
      }

      // ── Draw mouse connections (interactive, no pulse) ──
      if (mouse.x > 0 && mouse.y > 0) {
        for (const p of particles) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const threshold = MAX_CONNECTION_DIST * 1.2;

          if (dist < threshold) {
            const op =
              CONNECTION_OPACITY * 0.8 * (1 - dist / threshold);
            ctx!.beginPath();
            ctx!.moveTo(p.x, p.y);
            ctx!.lineTo(mouse.x, mouse.y);
            ctx!.strokeStyle = amberConnection(op);
            ctx!.lineWidth = 0.8;
            ctx!.stroke();

            p.vx += dx * 0.0004;
            p.vy += dy * 0.0004;
          }
        }
      }

      // ── Update & draw shooting stars ──
      const elapsed = now - lastStarSpawn;
      if (elapsed >= nextStarTimer) {
        shootingStars.push(spawnShootingStar(w, h));
        lastStarSpawn = now;
        nextStarTimer =
          SHOOTING_STAR_MIN_INTERVAL +
          Math.random() *
            (SHOOTING_STAR_MAX_INTERVAL - SHOOTING_STAR_MIN_INTERVAL);
      }

      for (let s = shootingStars.length - 1; s >= 0; s--) {
        const star = shootingStars[s];
        star.x += star.vx;
        star.y += star.vy;
        star.life++;

        // Kill star if it exceeds max life or goes off screen entirely
        if (
          star.life > star.maxLife ||
          star.x > w + star.length ||
          star.y > h + star.length ||
          star.x < -star.length ||
          star.y < -star.length
        ) {
          shootingStars.splice(s, 1);
          continue;
        }

        // Fade out toward the end of life
        const lifeRatio = star.life / star.maxLife;
        const fade = lifeRatio > 0.7 ? 1 - (lifeRatio - 0.7) / 0.3 : 1;
        const currentOpacity = star.opacity * fade;

        // Direction unit vector
        const len = Math.sqrt(
          star.vx * star.vx + star.vy * star.vy
        );
        const dirX = star.vx / len;
        const dirY = star.vy / len;

        // Trail — draw multiple segments with decreasing opacity & width
        const segments = 20;
        for (let i = segments; i >= 0; i--) {
          const t = i / segments;
          const tx = star.x - dirX * star.length * t;
          const ty = star.y - dirY * star.length * t;
          const segOpacity = currentOpacity * (1 - t) * 0.9;
          const segWidth = 2.5 * (1 - t) + 0.3;

          // Glow layer (wider, softer)
          ctx!.beginPath();
          ctx!.arc(tx, ty, segWidth * 2.5, 0, Math.PI * 2);
          ctx!.fillStyle = rgba(
            star.color,
            segOpacity * 0.12
          );
          ctx!.fill();

          // Solid trail core
          ctx!.beginPath();
          ctx!.arc(tx, ty, segWidth, 0, Math.PI * 2);
          ctx!.fillStyle = rgba(star.color, segOpacity);
          ctx!.fill();
        }

        // Bright head
        const headRadius = 3 + (1 - lifeRatio) * 2;

        // Head glow
        ctx!.beginPath();
        ctx!.arc(star.x, star.y, headRadius * 3, 0, Math.PI * 2);
        ctx!.fillStyle = rgba(star.color, currentOpacity * 0.2);
        ctx!.fill();

        // Head core
        ctx!.beginPath();
        ctx!.arc(star.x, star.y, headRadius, 0, Math.PI * 2);
        ctx!.fillStyle = rgba(
          star.color,
          currentOpacity * 1.0
        );
        ctx!.fill();
      }

      // ── Draw particles with individual twinkle ──
      for (const p of particles) {
        // Twinkle factor: oscillates between 0.2 and 1.0
        const twinkle = 0.6 + 0.4 * Math.sin(t * p.twinkleSpeed + p.twinklePhase);
        const currentRadius = p.baseRadius * twinkle;

        // Main dot
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
        ctx!.fillStyle = p.color;
        ctx!.fill();

        // Glow — scales more aggressively with twinkle for dramatic effect
        const glowRadius = p.baseRadius * 2 * (0.5 + 0.5 * twinkle);
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
        ctx!.fillStyle = p.glowColor;
        ctx!.fill();

        // Extra bright flash at peak twinkle
        if (twinkle > 0.85) {
          const flashOp = ((twinkle - 0.85) / 0.15) * 0.08;
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.baseRadius * 3.5, 0, Math.PI * 2);
          ctx!.fillStyle = roseConnection(flashOp);
          ctx!.fill();
        }

      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    // ── Cleanup ──
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1] h-full w-full"
      style={{ mixBlendMode: "screen" }}
    />
  );
}

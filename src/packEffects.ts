// Particle shapes, emission parameters and integration from prism-holo-pack (MIT).
import { createLightJet, GOLD_PALETTE, RAINBOW_PALETTE } from './lightJet';

const rand = (low: number, high: number) => low + Math.random() * (high - low);
const deg = Math.PI / 180;
interface Point {
  x: number;
  y: number;
}
interface Spark extends Point {
  vx: number;
  vy: number;
  age: number;
  gravity: number;
  life: number;
  scale: number;
  rotation: number;
  spin: number;
  color: string;
}
interface Ring extends Point {
  age: number;
  life: number;
  r0: number;
  r1: number;
  color: string;
  width: number;
}
interface Confetti extends Point {
  z: number;
  vx: number;
  vy: number;
  vz: number;
  spin: number;
  rotation: number;
  startRotation: number;
  drag: number;
  flutter: number;
  drift: number;
  scale: number;
  phase: number;
  age: number;
  shape: Path2D;
  color: string;
}

export function createPackEffects(canvas: HTMLCanvasElement, svg?: SVGSVGElement, palette = RAINBOW_PALETTE) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const jet = svg && createLightJet(svg, palette);
  let lastBrush = -Infinity;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)');
  const star = new Path2D('M0-7 1.4-1.4 7 0 1.4 1.4 0 7-1.4 1.4-7 0-1.4-1.4Z');
  const shapes = [
    new Path2D(),
    new Path2D(),
    new Path2D('M0-6 1.3-1.3 6 0 1.3 1.3 0 6-1.3 1.3-6 0-1.3-1.3Z'),
  ];
  shapes[0].arc(0, 0, 4.4, 0, Math.PI * 2);
  shapes[1].roundRect(-3.4, -6, 6.8, 12, 2);
  let sparks: Spark[] = [];
  let rings: Ring[] = [];
  let bits: Confetti[] = [];
  let frame = 0,
    last = 0,
    carry = 0;

  function emit(
    origin: Point,
    count: number,
    colors: string[],
    speed: [number, number],
    gravity: number,
    life: [number, number],
    scale: [number, number],
  ) {
    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2),
        velocity = rand(...speed);
      sparks.push({
        ...origin,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - rand(20, 90),
        age: 0,
        gravity,
        life: rand(...life),
        scale: rand(...scale),
        rotation: rand(0, Math.PI * 2),
        spin: rand(-8, 8),
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  function confetti(origin: Point, width: number, height: number) {
    const colors = [...palette, '#ffffff'];
    for (let i = 0; i < (coarse.matches ? 120 : 210); i++) {
      const lx = rand(6, 94);
      const angle =
        ((lx - 50) / 50 + rand(-0.5, 0.5)) * Math.min(1, Math.max(0.5, window.innerWidth / 1000));
      const speed = rand(520, 2650),
        terminal = 260 + 400 * Math.pow(Math.random(), 1.5);
      const rotation = rand(0, 360);
      bits.push({
        x: origin.x + ((lx - 50) * width) / 100,
        y: origin.y,
        z: rand(4.5, 7),
        vx: Math.sin(angle) * speed,
        vy: -Math.cos(angle) * speed,
        vz: rand(0, 160),
        spin: rand(-700, 700),
        rotation,
        startRotation: rotation,
        drag: 2600 / terminal ** 2,
        flutter: rand(900, 2500),
        drift: Math.sign(lx - 50) * rand(-180, 880),
        scale: rand(0.9, 1.85),
        phase: rand(0, Math.PI * 2),
        age: -(i < 48 ? 0 : rand(0, 0.22)) - (height * rand(0.01, 0.16)) / rand(900, 2550),
        shape: shapes[i % 3],
        color: colors[i % colors.length],
      });
    }
  }

  function clear() {
    cancelAnimationFrame(frame);
    frame = last = carry = 0;
    jet?.clear();
    sparks = [];
    rings = [];
    bits = [];
    ctx!.resetTransform();
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
  }
  function tick(now: number) {
    frame = 0;
    if (motion.matches) {
      clear();
      return;
    }
    const dt = last ? Math.min(0.04, Math.max(0, (now - last) / 1000)) : 1 / 60;
    last = now;
    const w = canvas.clientWidth,
      h = canvas.clientHeight;
    const dpr = Math.min(coarse.matches ? 1.5 : 2, devicePixelRatio);
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    }
    const c = ctx!;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, h);
    const flowing = jet?.step(dt, now);
    rings = rings.filter((r) => {
      r.age += dt;
      if (r.age < 0) return true;
      const u = r.age / r.life;
      if (u >= 1) return false;
      c.globalAlpha = (1 - u) ** 1.6 * 0.9;
      c.strokeStyle = r.color;
      c.lineWidth = Math.max(0.5, r.width * (1 - u * 0.7));
      c.beginPath();
      c.arc(r.x, r.y, r.r0 + (r.r1 - r.r0) * (1 - (1 - u) ** 3), 0, Math.PI * 2);
      c.stroke();
      return true;
    });
    sparks = sparks.filter((s) => {
      s.age += dt;
      if (s.age >= s.life) return false;
      s.vy += s.gravity * dt;
      s.vx *= 1 - Math.min(0.9, 2.4 * dt);
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.rotation += s.spin * dt;
      const u = s.age / s.life,
        k = dpr * s.scale * (1 - u * 0.65);
      const cos = Math.cos(s.rotation) * k,
        sin = Math.sin(s.rotation) * k;
      c.setTransform(cos, sin, -sin, cos, s.x * dpr, s.y * dpr);
      c.globalAlpha = (1 - u) ** 1.25;
      c.fillStyle = s.color;
      c.fill(star);
      return true;
    });
    c.globalAlpha = 1;
    bits = bits.filter((b) => {
      b.age += dt;
      if (b.age < 0) return true;
      b.z += b.vz * dt;
      b.vy += 2600 * dt;
      b.vx += (Math.sin(b.phase) * b.flutter + b.drift) * dt;
      const speed = Math.hypot(b.vx, b.vy),
        drag = 1 / (1 + b.drag * Math.min(1, 0.06 + b.age / 0.45) * speed * dt);
      const tumble = 0.35 + speed / 800;
      b.vx *= drag;
      b.vy *= drag;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.rotation += b.spin * tumble * dt;
      b.phase += 7 * tumble * dt;
      if (b.y >= h + 40) return false;
      const persp = 1400 / (1400 - b.z),
        k = dpr * persp * b.scale;
      const cos = k * Math.cos(b.rotation * deg),
        sin = k * Math.sin(b.rotation * deg);
      const foreshorten = Math.cos((b.rotation - b.startRotation) * 0.7 * deg);
      c.setTransform(
        cos,
        sin,
        -sin * foreshorten,
        cos * foreshorten,
        (w / 2 + (b.x - w / 2) * persp) * dpr,
        (h * 0.4 + (b.y - h * 0.4) * persp) * dpr,
      );
      c.fillStyle = b.color;
      c.fill(b.shape);
      return true;
    });
    // One last transparent frame clears the final paint.
    if (flowing || sparks.length || rings.length || bits.length)
      frame = requestAnimationFrame(tick);
    else clear();
  }
  function start() {
    if (!frame) {
      last = 0;
      frame = requestAnimationFrame(tick);
    }
  }
  function local(element: HTMLElement, x: number, y: number) {
    const stage = canvas.getBoundingClientRect(),
      rect = element.getBoundingClientRect();
    return {
      x: rect.left - stage.left + x * rect.width,
      y: rect.top - stage.top + y * rect.height,
    };
  }
  return {
    brush(element: HTMLElement, pan: number) {
      const now = performance.now();
      if (motion.matches || now - lastBrush < 140) return;
      lastBrush = now;
      emit(local(element, 0.5 + pan * 0.36, 0.08), 5, ['#ffffff', '#ddffff'],
        [35, 105], 160, [0.24, 0.42], [0.6, 1.05]);
      start();
    },
    peek(element: HTMLElement, color: string, awaken: boolean) {
      if (motion.matches) return;
      for (let i = 0; i < 4; i++)
        emit(
          local(element, rand(0.18, 0.82), 0.08),
          awaken ? 9 : 7,
          [color, '#ffffff'],
          [80, awaken ? 455 : 385],
          420,
          [0.3, 0.68],
          [0.55, 1.25],
        );
      if (awaken) {
        const center = local(element, 0.5, 0.5);
        [color, '#ffe3a6', '#94edff'].forEach((tint, i) =>
          rings.push({
            ...center,
            r0: element.offsetWidth * 0.3,
            r1: element.offsetWidth * (1.1 + i * 0.2),
            age: -i * 0.07,
            life: 0.68,
            width: 3 - i * 0.4,
            color: tint,
          }),
        );
      }
      start();
    },
    tear(element: HTMLElement, progress: number, direction: number, advance: number, tipY: number) {
      if (!jet || motion.matches || palette === GOLD_PALETTE) return;
      jet.tear(element, progress, direction, advance);
      carry += Math.max(0, advance) * 46;
      const count = Math.min(6, Math.floor(carry));
      carry -= count;
      emit(
        local(element, direction > 0 ? progress : 1 - progress, tipY),
        count,
        ['#ffffff', '#dce8ff', '#ffd454', '#5ce6ff', '#ff66dc'],
        [70, 250],
        640,
        [0.18, 0.42],
        [0.45, 0.95],
      );
      start();
    },
    release() {
      jet?.release();
      carry = 0;
    },
    open(element: HTMLElement) {
      if (!jet || motion.matches) return;
      jet.open(element);
      const p = local(element, 0.5, 0.16),
        w = element.offsetWidth;
      confetti(p, w, element.offsetHeight);
      rings.push(
        { ...p, age: 0, r0: w * 0.22, r1: w * 1.35, life: 0.46, color: '#5ce6ff', width: 4.2 },
        { ...p, age: -0.05, r0: w * 0.18, r1: w * 1.65, life: 0.52, color: '#ff66dc', width: 2.8 },
      );
      emit(
        p,
        coarse.matches ? 24 : 42,
        ['#ffd454', '#ffffff', '#5ce6ff', '#ff66dc', '#4fd9a0'],
        [180, 620],
        540,
        [0.36, 0.78],
        [0.75, 1.5],
      );
      start();
    },
    flip(element: HTMLElement, color: string, star: boolean) {
      if (motion.matches) return;
      const p = local(element, 0.5, 0.5),
        base = element.offsetWidth * 0.34;
      rings.push({
        ...p,
        r0: base * 0.35,
        r1: base * 1.75,
        age: 0,
        life: 0.42,
        color,
        width: 3,
      });
      if (star)
        [color, '#ffdc8a'].forEach((tint, i) =>
          rings.push({
            ...p,
            r0: base * 0.35,
            r1: base * (2.2 + i * 0.45),
            age: -0.055 * (i + 1),
            life: 0.58,
            width: 3 - i * 0.5,
            color: tint,
          }),
        );
      emit(p, star ? 42 : 24, [color, '#ffffff'], [120, 400], 620, [0.3, 0.6], [0.6, 1.2]);
      start();
    },
    clear,
  };
}
export type PackEffects = NonNullable<ReturnType<typeof createPackEffects>>;

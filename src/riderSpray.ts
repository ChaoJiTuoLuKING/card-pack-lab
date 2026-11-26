// Each droplet leaves the seam in screen space, independent of later pointer motion.
type Drop = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  age: number;
  life: number;
  size: number;
  sprite: number;
  angle: number;
  spin: number;
};

export function createRiderSpray(
  canvas: HTMLCanvasElement,
  atlas: HTMLImageElement,
  steam: HTMLImageElement,
) {
  const jets: { x: number; y: number; age: number; width: number; height: number; flip: number }[] =
    [];
  const crest = new Image();
  crest.src = import.meta.env.BASE_URL + 'rider/seedance-jet.webp';
  let jetClock = 0;
  const ctx = canvas.getContext('2d');
  const drops: Drop[] = [];
  let frame = 0,
    last = 0,
    carry = 0,
    advanced = 0;
  let opening = 0,
    direction = 1;
  let bounds: DOMRect, stage: DOMRect;
  let seam: (x: number) => number;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  function seamPoint(along: number) {
    const fraction = direction > 0 ? along : 1 - along;
    return {
      x: bounds.left - stage.left + fraction * bounds.width,
      y: bounds.top - stage.top + (seam(fraction * 100) * bounds.height) / 100,
    };
  }

  function emit(first = false) {
    const along = first
      ? opening
      : opening * (Math.random() < 0.45 ? 0.85 + Math.random() * 0.15 : Math.random());
    const { x, y } = seamPoint(along);
    const mist = !first && Math.random() < 0.24;
    const gravity = mist ? 360 : 770;
    const energy = first
      ? 0.09 + Math.random() * 0.12
      : Math.min(1.12, 2.8 * opening) * (0.32 + 0.8 * Math.random());
    const speed = Math.sqrt(2 * gravity * Math.max(10, y) * energy);
    drops.push({
      x,
      y,
      vx: (Math.random() - 0.5) * (40 + 260 * opening),
      vy: -speed,
      gravity,
      age: 0,
      life: (speed / gravity) * (mist ? 1.18 : 1.8),
      size: first
        ? 5 + Math.random() * 4
        : mist
          ? 12 + 22 * opening * Math.random()
          : 2.5 + 7 * Math.random(),
      sprite: mist ? 4 + Math.floor(Math.random() * 2) : Math.floor(Math.random() * 4),
      angle: Math.random() * 6,
      spin: Math.random() * 3 - 1.5,
    });
  }

  function tick(now: number) {
    frame = 0;
    if (!ctx) return;
    const dt = Math.min(0.04, (now - last) / 1000);
    last = now;
    ctx.clearRect(0, 0, stage.width, stage.height);
    if (opening > 0) {
      const pressure = Math.exp(-Math.max(0, now - advanced) / 420);
      carry += dt * (8 + 120 * opening) * (0.33 + pressure);
      while (carry >= 1) {
        emit();
        carry--;
      }
    }
    jetClock += dt;
    if (opening > 0 && jetClock > 0.13 && crest.naturalWidth) {
      jetClock = 0;
      const slit = opening * bounds.width;
      const width = Math.min(slit * 0.8, 20 + slit * 0.32);
      const offset = width / 2 + Math.random() * (slit - width);
      const fraction = direction > 0 ? offset / bounds.width : 1 - offset / bounds.width;
      jets.push({
        x: bounds.left - stage.left + fraction * bounds.width,
        y: bounds.top - stage.top + (seam(fraction * 100) * bounds.height) / 100,
        width,
        height: width * (0.7 + Math.random() * 0.65),
        age: 0,
        flip: Math.random() > 0.5 ? 1 : -1,
      });
    }
    for (let i = jets.length - 1; i >= 0; i--) {
      const jet = jets[i];
      jet.age += dt;
      if (jet.age >= 0.48) {
        jets.splice(i, 1);
        continue;
      }
      const t = jet.age / 0.48;
      const tile = Math.min(11, Math.floor(t * 12));
      ctx.save();
      ctx.globalAlpha = Math.min(0.85, t * 9, (1 - t) * 3);
      ctx.translate(jet.x, jet.y);
      ctx.scale(jet.flip, 1);
      ctx.drawImage(
        crest,
        (tile % 6) * 96,
        Math.floor(tile / 6) * 96,
        96,
        96,
        -jet.width / 2,
        -jet.height,
        jet.width,
        jet.height,
      );
      ctx.restore();
    }
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.age += dt;
      if (d.age >= d.life) {
        drops.splice(i, 1);
        continue;
      }
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vy += d.gravity * dt;
      d.angle += d.spin * dt;
      ctx.save();
      ctx.globalAlpha = Math.min(1, (1 - d.age / d.life) * 2.3) * (d.sprite >= 4 ? 0.5 : 0.95);
      ctx.translate(d.x, d.y);
      ctx.rotate(d.angle);
      if (atlas.naturalWidth) {
        ctx.drawImage(atlas, d.sprite * 64, 0, 64, 64, -d.size / 2, -d.size / 2, d.size, d.size);
      } else {
        ctx.fillStyle = '#ccedffce';
        ctx.beginPath();
        ctx.ellipse(0, 0, d.size * 0.32, d.size * 0.46, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    if (opening > 0 || drops.length || jets.length) frame = requestAnimationFrame(tick);
  }

  return {
    update(amount: number, dir: number, rect: DOMRect, line: (x: number) => number) {
      if (!ctx || reduced.matches) return;
      const justOpened = opening === 0 && amount > 0;
      if (amount > opening) advanced = performance.now();
      opening = amount;
      direction = dir;
      bounds = rect;
      stage = canvas.getBoundingClientRect();
      seam = line;
      if (opening > 0) {
        // Seat the plume just inside the open lip as the leading edge advances.
        const source = seamPoint(opening * 0.8);
        const plumeHeight = Math.min(bounds.width * 0.8, 225, Math.max(0, source.y - 8));
        steam.style.height = plumeHeight + 'px';
        steam.style.left = source.x + 'px';
        steam.style.top = source.y + 'px';
      }
      steam.toggleAttribute('data-venting', opening > 0);
      const ratio = Math.min(devicePixelRatio, 2);
      if (
        canvas.width !== Math.round(stage.width * ratio) ||
        canvas.height !== Math.round(stage.height * ratio)
      ) {
        canvas.width = Math.round(stage.width * ratio);
        canvas.height = Math.round(stage.height * ratio);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      }
      if (justOpened) {
        carry = 0;
        jetClock = 0;
        for (let i = 0; i < 3; i++) emit(true);
      }
      if (!frame && opening) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    },
    release() {
      steam.removeAttribute('data-venting');
      opening = 0;
      carry = 0;
    },
    dispose() {
      steam.removeAttribute('data-venting');
      cancelAnimationFrame(frame);
    },
  };
}

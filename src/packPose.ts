import { SpringValue } from './spring';

// Keep the hit targets still. The printed foil, its reflection and its shadow share one pose.
export function createPackPose(pack: HTMLElement, onShake: () => void, onBrush: (speed: number, pan: number) => void) {
  const stage = pack.closest<HTMLElement>('.stage, .rice-room, .rider-room')!;
  const skin = pack.querySelector<HTMLElement>('.pack-visual')!;
  const riderPouch = pack.closest<HTMLElement>('.rider-pouch');
  const mascot = pack.querySelector<HTMLElement>('.pack-mascot');
  const eyeCenter = pack.querySelector<HTMLElement>('.mascot-eyes');
  const snackZone = mascot?.querySelector<HTMLElement>('.whale-snack-zone');
  const lookX = new SpringValue(0, 0.18, 0.3),
    lookY = new SpringValue(0, 0.18, 0.3);
  let nextBlink = 2.4,
    blinkEnd = 0,
    moodEnd = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const x = new SpringValue(0, 0.7, 0.28),
    y = new SpringValue(0, 0.7, 0.28);
  const rx = new SpringValue(0, 0.7, 0.28),
    ry = new SpringValue(0, 0.7, 0.28);
  const rz = new SpringValue(0, 0.7, 0.28),
    squeeze = new SpringValue(0, 0.3, 0.45);
  const turn = new SpringValue(0, 0.82, 0.11);
  const springs = [x, y, rx, ry, rz, squeeze, turn, lookX, lookY];
  let nx = 0,
    ny = 0,
    previousX: number | null = null,
    previousY = 0,
    brushTravel = 0,
    energy = 0,
    previousDirection = 0,
    reversed = false,
    lastMove = 0;
  let nearPouch = false;
  let paused = false,
    verticalTug = 0;
  let pressed = false,
    tearing = false,
    stopped = false,
    time = 0,
    nudge = 5,
    last = 0,
    frame = 0;

  function resetPointer() {
    nearPouch = false;
    if (snackZone) mascot?.removeAttribute('data-guarding');
    nx = ny = energy = 0;
    previousX = null;
    brushTravel = 0;
    previousDirection = 0;
    reversed = false;
    pressed = false;
    lookX.to = lookY.to = 0;
    if (reduced.matches) drawGaze(0, 0);
  }
  function drawGaze(x: number, y: number) {
    mascot?.style.setProperty('--look-x', x.toFixed(3));
    mascot?.style.setProperty('--look-y', y.toFixed(3));
  }
  function pointer(event: PointerEvent) {
    if (!event.isPrimary || tearing || stopped || paused) return;
    if (eyeCenter) {
      const eyes = eyeCenter.getBoundingClientRect();
      const dx = event.clientX - eyes.left - eyes.width / 2,
        dy = event.clientY - eyes.top - eyes.height / 2;
      const range = Math.max(50, eyes.width * 2.7, Math.hypot(dx, dy));
      lookX.to = dx / range;
      lookY.to = dy / range;
    }
    if (snackZone && mascot) {
      const bag = snackZone.getBoundingClientRect();
      const u = (event.clientX - bag.left) / bag.width - 0.5;
      const v = (event.clientY - bag.top) / bag.height - 0.5;
      // Leave a little room to retreat so the floating wrapper cannot flicker at the boundary.
      const radius = mascot.hasAttribute('data-guarding') ? 0.69 : 0.5;
      mascot.toggleAttribute('data-guarding', Math.hypot(u, v) < radius);
    }
    if (reduced.matches) drawGaze(lookX.to, lookY.to);
    const nextX = event.clientX;
    const bounds = riderPouch?.getBoundingClientRect();
    if (bounds && event.pointerType === 'mouse' && !event.buttons) {
      const distance = Math.hypot(
        Math.max(bounds.left - nextX, 0, nextX - bounds.right),
        Math.max(bounds.top - event.clientY, 0, event.clientY - bounds.bottom),
      );
      // Keep the entry cue stable when the pointer rests near the edge.
      if (!nearPouch && distance <= 32) {
        nearPouch = true;
        onShake();
      } else if (distance > 56) nearPouch = false;
    }
    nx = Math.max(-1, Math.min(1, ((nextX - (bounds?.left ?? 0)) / (bounds?.width ?? window.innerWidth)) * 2 - 1));
    ny = Math.max(-1, Math.min(1, ((event.clientY - (bounds?.top ?? 0)) / (bounds?.height ?? window.innerHeight)) * 2 - 1));
    if (previousX !== null) {
      const dx = nextX - previousX,
        distance = Math.abs(dx);
      const interval = Math.max(1, event.timeStamp - lastMove);
      if (event.pointerType === 'mouse' && !event.buttons && pack.contains(event.target as Node)) {
        const travel = Math.hypot(dx, event.clientY - previousY);
        brushTravel = (interval > 160 ? 0 : brushTravel) + travel;
        if (brushTravel >= 12) {
          const bounds = pack.getBoundingClientRect();
          onBrush(Math.min(1, travel / interval), (nextX - bounds.left) / bounds.width * 2 - 1);
          brushTravel = 0;
        }
      } else brushTravel = 0;
      energy *= Math.exp(-interval * 0.0045);
      if (energy < 8) {
        reversed = false;
        previousDirection = 0;
      }
      if (distance / interval > 0.65 && (event.pointerType === 'mouse' || pressed)) {
        const dir = Math.sign(dx);
        if (previousDirection && dir !== previousDirection) reversed = true;
        previousDirection = dir;
        energy += distance;
        if (reversed && energy > 290) {
          energy = 0;
          reversed = false;
          onShake();
        }
      }
    }
    lastMove = event.timeStamp;
    previousX = nextX;
    previousY = event.clientY;
    if (reduced.matches) render();
  }

  function render() {
    const still = reduced.matches || tearing;
    const shine = still ? (tearing ? 0 : nx * 12) : ry.x;
    skin.style.transform = still
      ? ''
      : `perspective(1000px) translate3d(${x.x}px,${y.x}px,0) rotateZ(${rz.x}deg) rotateX(${rx.x}deg) rotateY(${ry.x + turn.x}deg) scale(${1 + squeeze.x * 0.03},${1 - squeeze.x * 0.06})`;
    pack.style.setProperty('--shine-pos', (50 + shine * 1.2).toFixed(1) + '%');
    pack.style.setProperty(
      '--foil-hue',
      Math.max(-22, Math.min(22, shine * 1.2 + rx.x * 0.8)).toFixed(1) + 'deg',
    );
    pack.style.setProperty('--glint-op', (0.8 - shine * 0.012).toFixed(3));
    pack.style.setProperty('--shadow-x', (still ? 0 : -x.x * 0.4 - shine * 0.65) + 'px');
    pack.style.setProperty('--shadow-scale', String(still ? 1 : 1 - y.x / 300));
    stage.style.setProperty('--lamp-x', (50 + shine * 0.95).toFixed(1) + '%');
    stage.style.setProperty('--lamp-y', (35 + (still ? 0 : -rx.x) * 0.7).toFixed(1) + '%');
  }

  function tick(now: number) {
    frame = 0;
    if (stopped || paused || tearing || document.hidden || reduced.matches) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    time += dt;
    y.to = Math.sin(time * 1.4) * 7 + verticalTug;
    ry.to = nx * 22;
    rx.to = -ny * 16 - squeeze.x * 6;
    rz.to = Math.sin(time * 0.9) * 1.6;
    squeeze.to = verticalTug ? -Math.abs(verticalTug) / 90 : pressed ? 1 : 0;
    if (time > nudge) {
      rz.v += (Math.random() < 0.5 ? -1 : 1) * 68;
      nudge = time + 4.2 + Math.random() * 2.8;
    }
    if (time >= nextBlink && !pack.dataset.mood && !pressed) {
      pack.setAttribute('data-blinking', '');
      blinkEnd = time + 0.18;
      nextBlink = time + 2.2 + Math.random() * 3.2;
    }
    if (blinkEnd && time >= blinkEnd) {
      pack.removeAttribute('data-blinking');
      blinkEnd = 0;
    }
    const steps = Math.max(1, Math.ceil(dt * 240));
    for (let i = 0; i < steps; i++) for (const value of springs) value.step(dt / steps);
    drawGaze(lookX.x, lookY.x);
    render();
    frame = requestAnimationFrame(tick);
  }
  function resume() {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    if (stopped || paused || tearing) return;
    if (document.hidden) {
      resetPointer();
      return;
    }
    if (reduced.matches) render();
    else frame = requestAnimationFrame(tick);
  }
  function lock(value: boolean) {
    if (stopped) return;
    tearing = value;
    verticalTug = 0;
    resetPointer();
    if (value) {
      cancelAnimationFrame(frame);
      pack.removeAttribute('data-blinking');
      drawGaze(0, 0);
      frame = 0;
      for (const sp of springs) sp.x = sp.to = sp.v = 0;
      render();
    } else resume();
  }
  function touchStart(event: PointerEvent) {
    if (event.pointerType !== 'mouse') pointer(event);
  }
  function touchEnd(event: PointerEvent) {
    if (event.isPrimary && event.pointerType !== 'mouse') resetPointer();
  }
  stage.addEventListener('pointermove', pointer);
  if (snackZone) {
    stage.addEventListener('pointerdown', touchStart);
    stage.addEventListener('pointerup', touchEnd);
    stage.addEventListener('pointercancel', touchEnd);
  }
  stage.addEventListener('pointerleave', resetPointer);
  window.addEventListener('blur', resetPointer);
  document.addEventListener('visibilitychange', resume);
  reduced.addEventListener('change', resume);
  if (!reduced.matches) {
    x.x = Math.min(110, window.innerWidth * 0.15);
    ry.x = -35;
    rz.x = 8;
  }
  resume();
  return {
    lock,
    pause(value: boolean) {
      paused = value;
      resetPointer();
      resume();
    },
    tug(dy: number) {
      verticalTug = Math.sign(dy) * 170 * (1 - 1 / (1 + Math.abs(dy) / 170));
    },
    press(down: boolean) {
      pressed = down;
      if (!down) previousX = null;
    },
    shake(awaken: boolean) {
      clearTimeout(moodEnd);
      pack.removeAttribute('data-blinking');
      pack.dataset.mood = awaken ? 'delighted' : 'shake';
      moodEnd = window.setTimeout(() => pack.removeAttribute('data-mood'), awaken ? 1050 : 560);
      const sign = Math.random() < 0.5 ? -1 : 1;
      rz.v += sign * 315;
      x.v += sign * 320;
      y.v -= 180;
      squeeze.v += 11;
      if (awaken) turn.to = 360;
    },
    dispose() {
      stopped = true;
      clearTimeout(moodEnd);
      cancelAnimationFrame(frame);
      stage.removeEventListener('pointermove', pointer);
      stage.removeEventListener('pointerdown', touchStart);
      stage.removeEventListener('pointerup', touchEnd);
      stage.removeEventListener('pointercancel', touchEnd);
      stage.removeEventListener('pointerleave', resetPointer);
      window.removeEventListener('blur', resetPointer);
      document.removeEventListener('visibilitychange', resume);
      reduced.removeEventListener('change', resume);
      stage.style.removeProperty('--lamp-x');
      stage.style.removeProperty('--lamp-y');
    },
  };
}

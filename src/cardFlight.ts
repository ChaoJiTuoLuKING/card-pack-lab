import { gsap } from 'gsap';

export interface PackMouth {
  x: number;
  y: number;
  width: number;
}

export function launchCards(
  deck: HTMLOListElement,
  mouth: PackMouth,
  onSwirl: (duration: number) => void,
  onLand: (index: number) => void,
  onReady: () => void,
  hold = 0,
) {
  const slots = Array.from(deck.querySelectorAll<HTMLElement>('.deck-slot'));
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches) {
    onReady();
    const frame = requestAnimationFrame(() => onLand(Math.floor(slots.length / 2)));
    return () => cancelAnimationFrame(frame);
  }

  function clear() {
    gsap.set(slots, { clearProps: 'transform,opacity,visibility,zIndex' });
  }

  const flight = gsap.timeline({ paused: true });
  function detach() {
    window.removeEventListener('resize', finish);
    motion.removeEventListener('change', motionChanged);
    flight.kill();
    clear();
  }

  function finish() {
    detach();
    onReady();
  }

  function motionChanged() {
    if (motion.matches) finish();
  }

  // Reference orbit, expressed relative to the actual meadow card slots.
  const orbitDuration = 1.22;
  const orbitStart = 0.2;
  const smooth = (a: number, b: number, value: number) => {
    const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  flight.call(() => onSwirl(orbitDuration), [], orbitStart);
  slots.forEach((slot, index) => {
    const rect = slot.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2,
      targetY = rect.top + rect.height / 2;
    const startScale = Math.min(1.2, (mouth.width * 0.84) / rect.width);
    const launchY = mouth.y + rect.height * startScale * 0.41;
    const start = index * 0.022,
      turn = orbitStart + index * 0.03;
    const velocity = (-(1260 + Math.random() * 190) * mouth.width * 1.43) / 420;
    const ejectedY = launchY + (velocity * (1 - Math.exp(-1.2 * (turn - start)))) / 1.2;
    const ringAngle = (-index * 2 * Math.PI) / slots.length;
    const endAngle = Math.PI / 2 - (index - (slots.length - 1) / 2) * 0.55;
    const radius = Math.min(window.innerWidth * 0.33, 430);
    const orbit = { u: 0 };
    gsap.set(slot, {
      x: mouth.x - targetX,
      y: launchY - targetY,
      scale: startScale,
      autoAlpha: 0,
      transformPerspective: 1400,
    });
    flight
      .set(slot, { autoAlpha: 1 }, start)
      .to(slot, { y: ejectedY - targetY, duration: turn - start, ease: 'none' }, start)
      .to(
        orbit,
        {
          u: 1,
          duration: orbitDuration,
          ease: 'none',
          onUpdate: () => {
            const u = orbit.u,
              blend = smooth(0.52, 1, u);
            const weight = Math.sin((Math.min(1, u / 0.42) * Math.PI) / 2) * (1 - blend);
            const angle = endAngle + (1 - u) ** 2 * (ringAngle - endAngle + Math.PI * 2.5);
            const cos = Math.cos(angle),
              sin = Math.sin(angle);
            const coast =
              ejectedY +
              ((velocity * Math.exp(-1.2 * (turn - start))) / 9) *
                (1 - Math.exp(-9 * u * orbitDuration));
            const center = coast + (window.innerHeight * 0.475 - coast) * smooth(0, 0.42, u);
            const z = sin * 300 * weight;
            gsap.set(slot, {
              x: (mouth.x - targetX) * (1 - blend) + cos * radius * weight,
              y: (center - targetY) * (1 - blend) + sin * radius * 0.2 * weight,
              z,
              zIndex: Math.round(302 + z),
              rotationZ: -cos * 8 * weight,
              rotationY: -cos * 26 * weight,
              rotationX: 7 * weight,
              scale: startScale + (1 - startScale) * smooth(0, 1, u),
            });
          },
        },
        turn,
      )
      .call(() => onLand(index), [], turn + orbitDuration);
  });

  if (hold > 0) flight.shiftChildren(hold, true, 0);
  flight.eventCallback('onComplete', finish);
  window.addEventListener('resize', finish);
  motion.addEventListener('change', motionChanged);
  flight.play(0);
  return detach;
}

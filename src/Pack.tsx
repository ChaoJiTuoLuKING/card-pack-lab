import { createPackPose } from './packPose';
import { cardsPerPack, finishes, themes, type Finish, cards } from './cards';
import { packNames, type Theme } from './rounds';
import chefArt from './assets/whale-chef.webp';
import mealtimeTitle from './assets/rider-mealtime.svg';
import readerArt from './assets/whale-headphones.webp';
import { createSeal } from './seal';
import { gsap } from 'gsap';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent, RefObject } from 'react';
import { Mascot } from './Mascot';
import './mascot.css';
import { WhaleMascot } from './WhaleMascot';
import type { PackMouth } from './cardFlight';
import type { PackEffects } from './packEffects';
import type { PackSound } from './packSound';

// Stable positions along the sunbeam keep the dust pattern intact while the pouch moves.
const sunMotes = [
  [82, 17],
  [75, 29],
  [86, 32],
  [70, 41],
  [81, 48],
  [65, 54],
  [70, 62],
  [57, 67],
  [48, 74],
  [39, 79],
  [32, 70],
  [60, 82],
].map(
  ([left, top], i) =>
    ({
      left: left + '%',
      top: top + '%',
      '--mote-size': (i % 4 === 1 ? 2.4 : 1.5) + 'px',
      '--drift-time': 2.2 + (i % 4) * 0.31 + 's',
      '--drift-delay': (i % 5) * -0.37 + 's',
      '--drift-x': (i % 3) * 9 - 11 + 'px',
      '--drift-y': -8 - (i % 4) * 4 + 'px',
    }) satisfies CSSProperties & Record<`--${string}`, string>,
);

interface Drag {
  pointer: number;
  x: number;
  y: number;
  width: number;
  direction: -1 | 0 | 1;
  distance: number;
  travelled: number;
  lastTime: number;
}

function WhalePacket() {
  return (
    <div className="packet-skin">
      <div className="whale-print-band" />
      <div className="whale-print-heading">
        <span>零食闪卡</span>
        <strong>大肥鱼</strong>
      </div>
      <div className="whale-print-scene">
        <i className="whale-print-spark" />
        <i className="whale-print-spark" />
      </div>
      <WhaleMascot />
      <span className="whale-pack-count">全套 {themes.whale.cards.length} 张闪卡</span>
      <i className="foil-reflection" />
    </div>
  );
}

function PacketSkin({ theme }: { theme: Theme }) {
  if (theme === 'whale') return <WhalePacket />;
  if (theme === 'english')
    return (
      <div className="packet-skin">
        <div className="english-cover-print">
          <strong lang="en">English</strong>
          <span>大肥鱼背单词</span>
          <img src={readerArt} alt="" />
        </div>
        <i className="foil-reflection" />
      </div>
    );
  if (theme === 'meal')
    return (
      <div className="packet-skin">
        <div className="daily-print">
          <strong>{packNames[theme]}</strong>
          <img src={chefArt} alt="" />
          <span>一包决定一道菜</span>
        </div>
        <i className="foil-reflection" />
      </div>
    );
  return (
    <div className="packet-skin">
      <span className="packet-type">绵绵牧场</span>
      <span className="packet-title">小羊闪卡</span>
      <div className="packet-landscape" />
      <Mascot />
      <i className="foil-reflection" />
      <span className="packet-count">内含 {Math.min(cardsPerPack, cards.length)} 张闪卡</span>
    </div>
  );
}

export function Pack({
  theme,
  riceSkin = false,
  riderSkin = false,
  onPeel,
  goldPreview,
  paused,
  onAwaken,
  strongest,
  onLaunch,
  onOpened,
  autoFocus,
  sound,
  effects,
}: {
  theme: Theme;
  riceSkin?: boolean;
  riderSkin?: boolean;
  onPeel?: (
    progress: number,
    direction: number,
    seamY: number,
    rect: DOMRect,
    line: (x: number) => number,
  ) => void;
  goldPreview: boolean;
  paused: boolean;
  onAwaken: () => void;
  strongest: Finish;
  onLaunch: (mouth: PackMouth) => void;
  onOpened: () => void;
  autoFocus: boolean;
  sound: PackSound;
  effects: RefObject<PackEffects | null>;
}) {
  const packet = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLButtonElement>(null);
  const drag = useRef<Drag | null>(null);
  const bodyTap = useRef<{ x: number; y: number } | null>(null);
  const peel = useRef({ progress: 0 });
  const tween = useRef<gsap.core.Tween | null>(null);
  const committed = useRef(false);
  const [opening, setOpening] = useState(false);

  const pose = useRef<ReturnType<typeof createPackPose> | null>(null);
  const shakeCount = useRef(0);
  const lastShake = useRef(-Infinity);
  const [shakes, setShakes] = useState(0);
  const peekTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const tearing = useRef(false);

  function shake() {
    const element = packet.current;
    if (
      !element ||
      committed.current ||
      tearing.current ||
      performance.now() - lastShake.current < 400
    )
      return;
    lastShake.current = performance.now();
    const awaken = shakeCount.current === 2;
    shakeCount.current = Math.min(3, shakeCount.current + 1);
    setShakes(shakeCount.current);
    if (awaken && theme === 'meadow') onAwaken();
    const finish = shakeCount.current === 3 ? 'astral' : strongest;
    pose.current?.shake(awaken);
    sound.shake(finish, awaken);
    effects.current?.peek(element, finishes[finish].color, awaken);
    element.style.setProperty('--peek-color', finishes[finish].color);
    element.setAttribute('data-peeking', '');
    clearTimeout(peekTimer.current);
    peekTimer.current = setTimeout(() => element.removeAttribute('data-peeking'), 1350);
  }
  const shakeAction = useRef(shake);
  useLayoutEffect(() => {
    shakeAction.current = shake;
  });
  useLayoutEffect(() => {
    pose.current = createPackPose(packet.current!, () => shakeAction.current(), (speed, pan) => {
      sound.brush(speed, pan);
      if (riderSkin && packet.current) effects.current?.brush(packet.current, pan);
    });
    return () => {
      pose.current?.dispose();
      pose.current = null;
      clearTimeout(peekTimer.current);
    };
  }, [effects, riderSkin, sound]);
  useLayoutEffect(() => {
    pose.current?.pause(paused);
  }, [paused]);
  function lockPose(value: boolean) {
    tearing.current = value;
    pose.current?.lock(value);
    if (value) {
      packet.current?.removeAttribute('data-peeking');
      packet.current?.removeAttribute('data-mood');
    }
    packet.current?.toggleAttribute('data-wincing', value);
  }

  useEffect(() => {
    if (autoFocus) handle.current?.focus({ preventScroll: true });
    return () => {
      tween.current?.kill();
      sound.rip(0);
      effects.current?.release();
    };
  }, [autoFocus, effects, sound]);

  const seal = useRef<ReturnType<typeof createSeal> | null>(null);
  const direction = useRef(1);
  const steer = useRef(0);
  const [slices] = useState(() => (matchMedia('(pointer: coarse)').matches ? 8 : 12));
  useLayoutEffect(() => {
    seal.current = createSeal(packet.current!, goldPreview);
    return () => {
      seal.current = null;
    };
  }, [goldPreview]);
  function draw(progress: number, velocity = 0, dy = 0) {
    progress = Math.max(0, Math.min(1, progress));
    seal.current?.draw(progress, direction.current, velocity, dy);
    if (onPeel && seal.current) {
      const center = direction.current > 0 ? progress / 2 : 1 - progress / 2;
      onPeel(
        progress,
        direction.current,
        seal.current.tearYAt(center * 100),
        packet.current!.getBoundingClientRect(),
        seal.current.tearYAt,
      );
    }
    peel.current.progress = progress;
    packet.current?.style.setProperty('--tear', progress.toFixed(4));
  }

  function animate(progress: number, duration: number, ease: string) {
    tween.current?.kill();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      draw(progress);
      lockPose(false);
      return;
    }
    tween.current = gsap.to(peel.current, {
      progress,
      duration,
      ease,
      onUpdate: () => draw(peel.current.progress),
      onComplete: () => lockPose(false),
    });
  }

  function finish() {
    const element = packet.current;
    if (committed.current || !element) return;
    committed.current = true;
    packet.current?.removeAttribute('data-pinched');
    drag.current = null;
    tween.current?.kill();
    draw(1);
    sound.rip(0);
    element.removeAttribute('data-wincing');
    sound.open(shakeCount.current === 3);
    if (goldPreview) effects.current?.release();
    else effects.current?.open(element);
    const bounds = element.getBoundingClientRect();
    onLaunch({
      x: bounds.left + bounds.width / 2,
      y:
        bounds.top +
        bounds.height *
          ((goldPreview || riderSkin || theme === 'english') && seal.current
            ? seal.current.tearYAt(50) / 100
            : 0.16),
      width: bounds.width,
    });
    setOpening(true);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) onOpened();
    else tween.current = gsap.delayedCall(goldPreview ? 0.6 : 0.42, onOpened);
  }

  function autoTear() {
    if (committed.current) return;
    lockPose(true);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return;
    }
    tween.current?.kill();
    const from = peel.current.progress;
    const state = { p: from };
    tween.current = gsap.to(state, {
      p: 1,
      duration: goldPreview ? Math.max(0.16, (1 - from) * 0.62) : Math.max(0.16, (1 - from) * 0.36),
      ease: 'power1.inOut',
      onUpdate: () => {
        const advance = state.p - peel.current.progress;
        draw(state.p);
        if (packet.current && seal.current) {
          const tip = (direction.current > 0 ? state.p : 1 - state.p) * 100;
          effects.current?.tear(
            packet.current,
            state.p,
            direction.current,
            advance,
            seal.current.tearYAt(tip) / 100,
          );
        }
        sound.rip(Math.min(1, advance * 18));
      },
      onComplete: finish,
    });
  }

  function begin(event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || event.button !== 0 || committed.current) return;
    tearing.current = true;
    pose.current?.press(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus({ preventScroll: true });
    const width = packet.current!.offsetWidth;
    if ((riderSkin || goldPreview) && packet.current) {
      const rect = packet.current.getBoundingClientRect();
      const pinch = Math.max(-1, Math.min(1, (2 * (event.clientX - rect.left)) / rect.width - 1));
      packet.current.style.setProperty('--pinch-angle', pinch * 1.05 + 'deg');
      packet.current.style.setProperty('--pinch-pivot', pinch < 0 ? '100%' : '0%');
      packet.current.style.setProperty('--pinch-x', (pinch + 1) * 50 + '%');
      packet.current.dataset.pinched = 'true';
    }
    drag.current = {
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      width,
      direction: 0,
      distance: width * 0.85,
      travelled: 0,
      lastTime: event.timeStamp,
    };
    tween.current?.kill();
    draw(0);
    effects.current?.release();
    steer.current = 0;
    sound.grab();
  }

  function move(event: PointerEvent<HTMLButtonElement>) {
    const active = drag.current;
    if (active?.pointer !== event.pointerId) return;
    const dx = event.clientX - active.x;
    active.travelled = Math.max(active.travelled, Math.hypot(dx, event.clientY - active.y));
    if (!active.direction) {
      const dy = event.clientY - active.y;
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy) * 0.5) {
        pose.current?.tug(dy);
        return;
      }
      lockPose(true);
      sound.tug();
      active.direction = dx < 0 ? -1 : 1;
      direction.current = active.direction;
      const room = dx < 0 ? active.x : window.innerWidth - active.x;
      active.distance = Math.max(40, Math.min(active.width * 0.85, room - 14));
      packet.current?.toggleAttribute('data-reverse', dx < 0);
    }
    const progress = Math.max(0, Math.min(1, (dx * active.direction) / active.distance));
    const advance = progress - peel.current.progress;
    const seconds = Math.max(0.004, (event.timeStamp - active.lastTime) / 1000);
    const intensity = Math.min(1, (Math.max(0, advance) / seconds / 4) ** 0.6);
    active.lastTime = event.timeStamp;
    const dy = event.clientY - active.y;
    const target =
      (Math.max(-0.7, Math.min(0.7, dy / Math.max(60, Math.abs(dx)))) * active.width) /
      packet.current!.offsetHeight;
    steer.current += (target - steer.current) * 0.3;
    seal.current?.steer(steer.current, peel.current.progress, active.direction);
    draw(progress, advance / seconds, dy);
    sound.rip(intensity);
    tween.current?.kill();
    tween.current = gsap.delayedCall(0.055, () => sound.rip(0));
    const tip = (active.direction > 0 ? progress : 1 - progress) * 100;
    if (packet.current && seal.current)
      effects.current?.tear(
        packet.current,
        progress,
        active.direction,
        advance,
        seal.current.tearYAt(tip) / 100,
      );
    if (progress === 1) finish();
  }

  function end(event: PointerEvent<HTMLButtonElement>) {
    const active = drag.current;
    if (active?.pointer !== event.pointerId) return;
    packet.current?.removeAttribute('data-pinched');
    drag.current = null;
    pose.current?.tug(0);
    pose.current?.press(false);
    sound.rip(0);
    const tapped =
      event.type === 'pointerup' &&
      Math.max(active.travelled, Math.hypot(event.clientX - active.x, event.clientY - active.y)) <
        8;
    if (tapped) {
      packet.current?.removeAttribute('data-reverse');
      direction.current = 1;
      autoTear();
      return;
    }
    if (event.type === 'pointerup' && peel.current.progress > 0.54) {
      autoTear();
      return;
    }
    effects.current?.release();
    if (event.type === 'pointerup' && peel.current.progress > 0.025) sound.rebound();
    animate(0, 0.4, 'back.out(1.35)');
  }

  return (
    <>
      <div
        className="pack"
        data-pack={riderSkin ? 'rider' : riceSkin ? 'rice' : theme}
        data-awake={shakes === 3}
        data-opening={opening}
        ref={packet}
      >
        <i className="pack-ground" aria-hidden="true" />
        <div className="pack-visual" aria-hidden="true">
          <div className="wrapper-back">
            {riderSkin ? null : riceSkin ? (
              <span>开饭啦</span>
            ) : theme === 'whale' ? (
              <div className="whale-back-print">
                <strong>大肥鱼</strong>
                <span>零食闪卡</span>
                <p>
                  全套 {themes.whale.cards.length} 张
                  <br />
                  撕开即可欣赏全套闪卡
                </p>
                <i className="whale-print-bars" />
              </div>
            ) : (
              <span>{packNames[theme]}</span>
            )}
          </div>
          {!goldPreview && !riceSkin && theme !== 'english' && (
            <>
              <i className="pouch-side side-left" />
              <i className="pouch-side side-right" />
            </>
          )}
          <div className="wrapper-front">
            <i className="pack-aura" />
            <div className="pack-body" aria-hidden="true">
              {riceSkin ? (
                <div className="packet-skin">
                  {riderSkin && (
                    <div className="rider-cover-art">
                      <div className="rider-cover-glow">
                        <div className="rider-cover-dust">
                          {sunMotes.map((style, index) => (
                            <i key={index} style={style} />
                          ))}
                        </div>
                      </div>
                      <i className="rider-cover-wave" />
                      <img className="rider-cover-title" src={mealtimeTitle} alt="吃饭啦" />
                    </div>
                  )}
                  <i className="foil-reflection" />
                </div>
              ) : (
                <PacketSkin theme={theme} />
              )}
              <i className="foil-lip" />
            </div>
            <div className="pack-seal" aria-hidden="true">
              {Array.from({ length: slices }, (_, i) => (
                <div className="strip-segment" key={i} hidden>
                  <div className="strip-front">
                    <div className="packet-skin" />
                  </div>
                  <div className="foil-lining" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <button
          className="shake-zone"
          type="button"
          tabIndex={-1}
          aria-label="轻摇袋身"
          disabled={opening}
          onPointerDown={(e) => {
            if (!e.isPrimary || e.button !== 0) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            bodyTap.current = { x: e.clientX, y: e.clientY };
            pose.current?.press(true);
            sound.grab();
          }}
          onLostPointerCapture={() => pose.current?.press(false)}
          onPointerMove={(e) => {
            if (
              bodyTap.current &&
              Math.hypot(e.clientX - bodyTap.current.x, e.clientY - bodyTap.current.y) > 10
            )
              bodyTap.current = null;
          }}
          onPointerCancel={() => {
            bodyTap.current = null;
          }}
          onClick={(e) => {
            if (e.detail === 0 || bodyTap.current) shake();
            bodyTap.current = null;
          }}
        />
        <button
          className="tear-zone"
          type="button"
          aria-label="撕开卡包封口"
          aria-describedby="pack-hint"
          disabled={opening}
          ref={handle}
          onPointerDown={begin}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onLostPointerCapture={end}
          onClick={(event) => {
            if (event.detail === 0) {
              sound.grab();
              autoTear();
            }
          }}
        />
      </div>
      {!riceSkin && (
        <div className="pack-controls" inert={opening}>
          {(theme === 'whale' || theme === 'meadow') && (
            <button type="button" className="shake-button" onClick={shake} aria-label="摇包验光">
              <span aria-hidden="true">✧</span> 摇包验光{' '}
              <span className="shake-meter" aria-hidden="true">
                {[1, 2, 3].map((i) => (
                  <i key={i} data-lit={shakes >= i} />
                ))}
              </span>
            </button>
          )}
          <p className="hint" id="pack-hint" aria-live="polite">
            {theme === 'meal'
              ? '拖开封口，看看今天吃什么'
              : theme === 'english'
                ? '横向撕开封口，抽一张听读卡'
                : theme === 'whale'
                  ? `拖动顶封拆开 · ${themes.whale.cards.length} 张卡依次亮相`
                  : shakes === 0
                    ? '摇三次唤醒星夜包 · 拖动顶封拆开'
                    : shakes < 3
                      ? `封口透出${finishes[strongest].name}光 · 再摇 ${3 - shakes} 次唤醒星夜包`
                      : '星夜包已唤醒 · 内含星夜闪卡'}
          </p>
        </div>
      )}
    </>
  );
}

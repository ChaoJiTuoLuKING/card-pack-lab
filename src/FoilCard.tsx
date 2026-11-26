import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react';
import { cardsPerPack, finishes, type Finish, type CardDesign } from './cards';
import { FishArt, FishBack, isFishId } from './FishArt';
import type { CardCue } from './packSound';
import backArt from './assets/panorama.webp';

const arrows: Record<string, readonly [number, number] | undefined> = {
  ArrowLeft: [-13, 0],
  ArrowRight: [13, 0],
  ArrowUp: [0, -13],
  ArrowDown: [0, 13],
};

export function FoilCard({
  card,
  finish,
  position,
  total = cardsPerPack,
  revealed,
  active,
  featured,
  hintId,
  canFlip,
  onHover,
  onCardCue,
  onPreview,
  onReveal,
  onInspect,
}: {
  card: CardDesign;
  finish: Finish;
  position: number;
  total?: number;
  revealed: boolean;
  active: boolean;
  featured?: boolean;
  hintId?: string;
  canFlip: boolean;
  onHover: () => void;
  onCardCue?: (cue: CardCue, pan: number) => void;
  onPreview?: () => void;
  onInspect?: () => void;
  onReveal: (card: HTMLDivElement) => void;
}) {
  const fish = isFishId(card.id) ? card.id : undefined;
  const [danceRun, setDanceRun] = useState(0);
  const replayDance = fish === 'whale-dance' && !onInspect;
  function restartDance() {
    reset();
    setDanceRun((run) => run + 1);
  }
  const activate = onInspect ?? (replayDance ? restartDance : undefined);
  const portraitMotion = useRef<SVGFEDisplacementMapElement>(null);
  const fanCenter = (total - 1) / 2;
  const area = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const focusOnReveal = useRef(false);
  const point = useRef({ x: 50, y: 50 });
  const lastGesture = useRef('');
  const tap = useRef<{ x: number; y: number } | null>(null);
  const touchPointer = useRef<number | null>(null);

  useEffect(() => {
    if (revealed && focusOnReveal.current) {
      focusOnReveal.current = false;
      surface.current?.focus({ preventScroll: true });
    }
  }, [revealed]);

  function illuminate(left: number, top: number, tracking = true) {
    const element = area.current;
    if (!element) return;
    const x = Math.max(0, Math.min(100, left));
    const y = Math.max(0, Math.min(100, top));
    point.current = { x, y };
    const horizontal = (x - 50) / 50;
    const vertical = (y - 50) / 50;
    element.toggleAttribute('data-tracking', tracking);
    let cue: CardCue | undefined;
    let side = '';
    if (fish === 'whale-snack' || fish === 'whale-token') {
      const nearSnack = Math.hypot((x - 55) / 22, (y - 60) / 16) < 1;
      element.toggleAttribute('data-reacting', tracking && (fish === 'whale-token' || nearSnack));
      if (fish === 'whale-snack' && nearSnack) cue = 'bag';
      if (fish === 'whale-token' && y > 78) cue = 'coin';
    }
    if (fish === 'whale-dance') {
      if (!tracking) delete element.dataset.dancePose;
      else {
        const pose = y < 35 ? 'hop' : x < 40 ? 'left' : x > 60 ? 'right' : 'center';
        element.dataset.dancePose = pose;
        if (pose === 'hop') cue = 'hop';
        if (pose === 'left' || pose === 'right') {
          cue = 'step';
          side = pose;
        }
      }
    }
    if (portraitMotion.current) {
      let strength = 0;
      if (fish === 'whale-headphones') {
        strength = horizontal * 15;
        if (Math.abs(horizontal) > 0.35) {
          cue = 'signal';
          side = horizontal < 0 ? 'left' : 'right';
        }
      }
      if (fish === 'whale-chef') {
        strength = 5 - vertical * 13;
        if (y < 35) cue = 'spoon';
      }
      if (fish === 'whale-nap') {
        const distance = Math.hypot((x - 29) / 48, (y - 57) / 38);
        strength = 17 * Math.max(0, 1 - distance);
        if (distance < 0.6) cue = 'fabric';
      }
      portraitMotion.current.setAttribute('scale', tracking ? strength.toFixed(2) : '0');
    }
    const gesture = tracking && cue ? cue + side : '';
    if (gesture && gesture !== lastGesture.current && cue) onCardCue?.(cue, horizontal * 0.65);
    lastGesture.current = gesture;
    element.style.setProperty('--px', x.toFixed(2));
    element.style.setProperty('--py', y.toFixed(2));
    element.style.setProperty(
      '--hyp',
      (tracking ? Math.min(1, 0.34 + Math.hypot(horizontal, vertical) * 0.66) : 0.16).toFixed(3),
    );
    element.style.setProperty('--rx', `${(-vertical * 13).toFixed(2)}deg`);
    element.style.setProperty('--ry', `${(horizontal * 16).toFixed(2)}deg`);
  }

  function reset() {
    illuminate(50, 50, false);
  }

  function track(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    illuminate(
      ((event.clientX - bounds.left) / bounds.width) * 100,
      ((event.clientY - bounds.top) / bounds.height) * 100,
    );
  }

  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    const offset = arrows[event.key];
    if (offset) {
      event.preventDefault();
      illuminate(point.current.x + offset[0], point.current.y + offset[1]);
    }
    if (event.key === 'Escape') reset();
  }

  return (
    <li
      className="deck-slot"
      style={
        {
          '--fan-index': position - fanCenter,
          '--fan-depth': Math.abs(position - fanCenter) ** 2,
          '--panorama-x': (position / Math.max(1, total - 1)) * 100 + '%',
          '--panorama-width': total * 100 + '%',
        } as CSSProperties
      }
      data-slot={position}
      data-fish={fish}
      data-active={active}
      data-featured={featured || undefined}
      data-finish={finish}
    >
      <div
        className="card-area"
        ref={area}
        data-revealed={revealed}
        style={
          {
            '--edge': card.edge,
            '--finish-color': finishes[finish].color,
            '--matte': card.dark,
            '--back-art': `url(${backArt})`,
          } as CSSProperties
        }
        onPointerEnter={(event) => {
          if (canFlip || revealed) onHover();
          if (revealed && event.pointerType === 'mouse') {
            onPreview?.();
            track(event);
          }
        }}
        onPointerDown={(event) => {
          if (!revealed || !event.isPrimary || event.pointerType === 'mouse') return;
          touchPointer.current = event.pointerId;
          (surface.current ?? event.currentTarget).setPointerCapture(event.pointerId);
          track(event);
        }}
        onPointerMove={(event) => {
          if (
            revealed &&
            (event.pointerType === 'mouse' || event.pointerId === touchPointer.current)
          )
            track(event);
        }}
        onPointerLeave={() => {
          if (touchPointer.current === null) reset();
        }}
        onLostPointerCapture={(event) => {
          if (event.pointerId !== touchPointer.current) return;
          touchPointer.current = null;
          reset();
        }}
      >
        <div className="card-flip">
          <button
            type="button"
            className="card-back"
            tabIndex={!canFlip || revealed ? -1 : 0}
            aria-hidden={!canFlip || revealed}
            aria-label={`翻开第 ${position + 1} 张卡`}
            disabled={!canFlip || revealed}
            onClick={() => {
              focusOnReveal.current = true;
              if (area.current) onReveal(area.current);
            }}
          >
            {fish ? (
              <FishBack />
            ) : (
              <>
                <span className="back-frame" aria-hidden="true" />
                <span className="back-image" aria-hidden="true" />
                <i className="back-engraving" aria-hidden="true" />
                <span className="back-text" aria-hidden="true">
                  绵绵牧场
                </span>
              </>
            )}
          </button>
          <div className="card-front" aria-hidden={!revealed}>
            <div
              className="card-focus"
              role={activate ? 'button' : 'group'}
              aria-pressed={featured}
              aria-label={`${card.title} · ${card.sheep}${replayDance ? '，点击重看舞蹈' : ''}`}
              aria-describedby={
                hintId ?? (canFlip ? 'deck-hint' : revealed ? 'album-hint' : undefined)
              }
              aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Escape"
              tabIndex={revealed ? 0 : -1}
              ref={surface}
              onPointerDown={(e) => {
                tap.current = { x: e.clientX, y: e.clientY };
              }}
              onClick={(e) => {
                if (!activate || !revealed) return;
                if (
                  e.detail === 0 ||
                  (tap.current &&
                    Math.hypot(e.clientX - tap.current.x, e.clientY - tap.current.y) < 9)
                )
                  activate();
                tap.current = null;
              }}
              onKeyDown={(e) => {
                if (activate && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  activate();
                } else onKey(e);
              }}
              onFocus={(event) => {
                if (event.currentTarget.matches(':focus-visible')) onPreview?.();
              }}
              onBlur={reset}
            >
              <figure className="foil-card">
                <div className="surface" aria-hidden="true" />
                <div className="art-wrap">
                  {fish ? (
                    <FishArt key={danceRun} id={fish} card={card} motion={portraitMotion} />
                  ) : (
                    <img className="art" src={card.art} alt={card.alt} draggable={false} />
                  )}
                  <div className="diffraction" aria-hidden="true" />
                  <div className="glare" aria-hidden="true" />
                  <div className="foil-pattern" aria-hidden="true" />
                  <div className="coat" aria-hidden="true" />
                </div>
                <div className="edge-light" aria-hidden="true" />
                <figcaption className="caption">
                  {!fish && <p className="series">{finishes[finish].name}版</p>}
                  <h2>{card.title}</h2>
                  <p className="name">{card.sheep}</p>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

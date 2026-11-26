import { useLayoutEffect, useEffect, useRef, useState, type PointerEvent } from 'react';
import { gsap } from 'gsap';
import { createRiderSpray } from './riderSpray';
import { PackPicker, type NavigatePack } from './PackPicker';
import { Pack } from './Pack';
import { RiderRiceOffer } from './RiderRiceOffer';
import type { PackMouth } from './cardFlight';
import { createPackEffects, type PackEffects } from './packEffects';
import { createPackSound, readMuted } from './packSound';
import './rider-pack.css';

const dorsalCurve = 'M257 193 C275 158 302 139 343 136 C399 129 446 158 462 203';

const surfCurve =
  'M142 241 C112 205 84 200 68 222 C39 263 80 303 127 316 C171 328 186 311 211 318 S276 352 331 338 C363 331 391 322 416 303';

type Phase = 'sealed' | 'arriving' | 'card';
const media = (file: string) => import.meta.env.BASE_URL + file;

export function RiderPack({ onNavigate }: { onNavigate: NavigatePack }) {
  const [phase, setPhase] = useState<Phase>('sealed');
  const [muted, setMuted] = useState(readMuted);
  const [sound] = useState(() => createPackSound(muted));
  const effects = useRef<PackEffects | null>(null);
  const stage = useRef<HTMLElement>(null);
  const pack = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const figure = useRef<HTMLDivElement>(null);
  const launchClip = useRef<HTMLVideoElement>(null);
  const foilLight = useRef<SVGRadialGradientElement>(null);
  const origin = useRef<PackMouth | null>(null);
  const glint = useRef<HTMLElement>(null);
  const seamSteam = useRef<HTMLImageElement>(null);
  const sparkleCanvas = useRef<HTMLCanvasElement>(null);
  const sprayCanvas = useRef<HTMLCanvasElement>(null);
  const spray = useRef<ReturnType<typeof createRiderSpray> | null>(null);
  useLayoutEffect(() => {
    effects.current = createPackEffects(sparkleCanvas.current!);
    const atlas = new Image();
    atlas.src = media('rider/seedance-drops.png');
    spray.current = createRiderSpray(sprayCanvas.current!, atlas, seamSteam.current!);
    return () => {
      spray.current?.dispose();
      effects.current?.clear();
      effects.current = null;
    };
  }, []);
  useEffect(() => {
    document.title = '大肥鱼 · 送饭卡包 · 拆卡实验室';
    return () => sound.dispose();
  }, [sound]);
  function lightPouch(event: PointerEvent<HTMLDivElement>) {
    if (phase !== 'sealed') return;
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    el.style.setProperty('--wave-light', 80 - x * 60 + '%');
    el.style.setProperty('--ray-angle', (0.5 - x) * 16 + 'deg');
    el.style.setProperty('--dust-x', (x - 0.5) * 13 + '%');
    el.style.setProperty('--dust-y', (y - 0.5) * 9 + '%');
    el.dataset.hovered = 'true';
  }
  function peel(
    amount: number,
    dir: number,
    _y: number,
    rect: DOMRect,
    line: (x: number) => number,
  ) {
    pack.current?.style.setProperty('--peel', String(amount));
    spray.current?.update(amount, dir, rect, line);
  }
  const polish = useRef<HTMLElement>(null);
  const arrivalPolish = useRef<Animation | null>(null);
  useLayoutEffect(() => {
    const el = polish.current;
    if (phase !== 'card' || !el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const entrance = el.animate(
      [
        { backgroundPosition: '100% 50%', opacity: 0 },
        { opacity: 0.8, offset: 0.25 },
        { opacity: 0.75, offset: 0.7 },
        { backgroundPosition: '0% 50%', opacity: 0 },
      ],
      { duration: 780, easing: 'ease-in-out' },
    );
    arrivalPolish.current = entrance;
    return () => {
      entrance.cancel();
      arrivalPolish.current = null;
    };
  }, [phase]);
  function lightCard(event: PointerEvent<HTMLDivElement>) {
    if (phase !== 'card') return;
    const el = event.currentTarget;
    const r = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - r.left) / r.width));
    const y = Math.max(0, Math.min(1, (event.clientY - r.top) / r.height));
    el.style.setProperty('--foil-x', x.toFixed(3));
    el.style.setProperty('--foil-y', y.toFixed(3));
    foilLight.current?.setAttribute('cx', String(x * 480));
    foilLight.current?.setAttribute('cy', String(y * 351));
    const px = x * 480,
      py = y * 351;
    const nearBowl = Math.hypot((px - 304) / 45, (py - 110) / 27);
    if (nearBowl < 1) el.dataset.nearRice = 'true';
    else if (nearBowl > 1.25) delete el.dataset.nearRice;
    const point = new DOMPoint(px, py);
    const zone = ['dorsal', 'surf'].find((id) =>
      el.querySelector<SVGPathElement>('#rider-hit-' + id)?.isPointInStroke(point),
    );
    if (zone) el.dataset.sweep = zone;
    else delete el.dataset.sweep;
    if (!el.dataset.lit) arrivalPolish.current?.cancel();
    // Project the pointer onto the 117-degree band in the triple-width gradient.
    const bandX =
      x + (y - 0.5) * (el.offsetHeight / el.offsetWidth) * Math.tan((27 * Math.PI) / 180);
    el.style.setProperty('--polish-position', ((1.5 - bandX) * 50).toFixed(2) + '%');
    el.dataset.lit = 'true';
  }
  function releaseCard(event: PointerEvent<HTMLDivElement>) {
    delete event.currentTarget.dataset.lit;
    delete event.currentTarget.dataset.nearRice;
    delete event.currentTarget.dataset.sweep;
  }
  function launch(mouth: PackMouth) {
    spray.current?.release();
    origin.current = mouth;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('card');
      sound.land(0);
    } else {
      setPhase('arriving');
    }
    const bounds = stage.current?.getBoundingClientRect();
    if (bounds && glint.current) {
      glint.current.style.left = mouth.x - bounds.left + 'px';
      glint.current.style.top = mouth.y - bounds.top + 'px';
      glint.current.style.width = mouth.width * 0.85 + 'px';
    }
  }
  useLayoutEffect(() => {
    if (phase !== 'arriving' || !origin.current || !card.current || !figure.current) return;
    const r = card.current.getBoundingClientRect();
    const mouth = origin.current;
    const x = mouth.x - r.left - r.width / 2;
    const y = mouth.y - r.top - r.height / 2;
    const small = Math.min(0.56, (mouth.width * 0.75) / r.width);
    const video = launchClip.current!;
    const printPose = figure.current.querySelector('img')!;
    video.currentTime = 0;
    video.playbackRate = 1.22;
    void video.play().catch(() => {});
    const timeline = gsap.timeline({
      onComplete: () => {
        sound.land(0);
        setPhase('card');
      },
    });
    // The footage contains the head lift and final tail stroke. The pouch masks its lower half.
    timeline
      .set(video, { opacity: 1, rotation: -12, scale: 1 })
      .set(printPose, { opacity: 0 })
      .set(figure.current, { autoAlpha: 1, x, y: y + r.height * small * 0.54, scale: small })
      .to(figure.current, { y: y - r.height * small * 0.4, duration: 0.54, ease: 'sine.inOut' }, 0)
      .to(
        figure.current,
        { x: -r.width * 0.035, y: -r.height * 0.05, scale: 0.82, duration: 0.24, ease: 'sine.out' },
        0.54,
      )
      .to(video, { rotation: 42, scale: 1.08, duration: 0.34, ease: 'sine.inOut' }, 0.58)
      .to(figure.current, { x: 0, y: 0, scale: 1, duration: 0.17, ease: 'sine.out' }, 0.78)
      .to(video, { opacity: 0, duration: 0.13 }, 0.82)
      .to(printPose, { opacity: 1, duration: 0.13 }, 0.82)
      // The figure and print share their pixel coordinates at this point.
      .fromTo(
        '.rider-crest-flare',
        { opacity: 0, scale: 0.45 },
        { opacity: 1, scale: 1, duration: 0.06 },
        0.92,
      )
      .to('.rider-crest-flare', { opacity: 0, scale: 1.25, duration: 0.15 }, 0.98)
      .fromTo(
        card.current,
        { '--print-front': '-5%' },
        { '--print-front': '108%', duration: 0.32, ease: 'sine.inOut' },
        0.97,
      )
      .to(figure.current, { opacity: 0, duration: 0.09 }, 1.26)
      .fromTo(
        card.current.querySelector('.rider-edge'),
        { opacity: 0 },
        { opacity: 1, duration: 0.14 },
        1.29,
      );
    return () => {
      timeline.kill();
      video.pause();
      gsap.set(figure.current, { clearProps: 'all' });
    };
  }, [phase, sound]);
  return (
    <main ref={stage} className="rider-room" data-phase={phase}>
      <PackPicker
        active="rider"
        onNavigate={onNavigate}
        onToggleSound={() => {
          sound.setMuted(!muted);
          setMuted(!muted);
        }}
      />
      <img ref={seamSteam} className="rider-tear-steam" src={media('rice/steam.webp')} alt="" />
      <canvas ref={sparkleCanvas} className="stage-effects rider-sparkles" aria-hidden="true" />
      <canvas ref={sprayCanvas} className="rider-spray" aria-hidden="true" />
      <i className="rider-seam-glint" ref={glint} aria-hidden="true" />
      {phase !== 'card' && (
        <div
          className="rider-pouch"
          ref={pack}
          onPointerEnter={lightPouch}
          onPointerMove={lightPouch}
          onPointerLeave={(e) => {
            delete e.currentTarget.dataset.hovered;
          }}
          onPointerUp={(e) => {
            if (e.pointerType !== 'mouse') delete e.currentTarget.dataset.hovered;
          }}
          onPointerCancel={(e) => {
            delete e.currentTarget.dataset.hovered;
          }}
        >
          <Pack
            riderSkin
            riceSkin
            theme="whale"
            strongest="dew"
            paused={false}
            autoFocus={false}
            onAwaken={() => {}}
            goldPreview={false}
            sound={sound}
            effects={effects}
            onPeel={peel}
            onLaunch={launch}
            onOpened={() => {}}
          />
        </div>
      )}
      <div className="rider-leap-figure" ref={figure} aria-hidden="true">
        <video
          ref={launchClip}
          src={media('rider/leap-launch.webm')}
          muted
          playsInline
          preload="auto"
        />
        <img alt="" src={media('rider/leap-figure.webp')} />
      </div>
      {phase !== 'sealed' && (
        <div
          ref={card}
          className="rider-card"
          onPointerEnter={lightCard}
          onPointerDown={lightCard}
          onPointerMove={lightCard}
          onPointerLeave={releaseCard}
          onPointerCancel={releaseCard}
          onPointerUp={(e) => {
            if (e.pointerType !== 'mouse') releaseCard(e);
          }}
        >
          <img src={media('rider/orbit-card.webp')} alt="大肥鱼端着米饭，骑着蓝鲸跃过粉蓝水浪" />
          {phase === 'card' && (
            <>
              <i className="rider-polish" ref={polish} aria-hidden="true" />
              <RiderRiceOffer art={media('rider/orbit-card.webp')} />
            </>
          )}
          <svg
            className="rider-foil"
            viewBox="0 0 480 351"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <radialGradient
                id="rider-foil-light"
                ref={foilLight}
                gradientUnits="userSpaceOnUse"
                cx="0"
                cy="0"
                r="85"
              >
                <stop stopColor="#fff9ff" />
                <stop offset=".17" stopColor="#ffd5f5" />
                <stop offset=".44" stopColor="#ae93ff" stopOpacity=".88" />
                <stop offset=".7" stopColor="#66ddff" stopOpacity=".68" />
                <stop offset="1" stopColor="#8aeaff" stopOpacity="0" />
              </radialGradient>
              <filter id="rider-foil-bloom" x="-15%" y="-35%" width="130%" height="170%">
                <feGaussianBlur stdDeviation="2.8" />
              </filter>
              <path id="rider-dorsal" pathLength="100" d={dorsalCurve} />
              <path id="rider-surf" pathLength="100" d={surfCurve} />
              <path
                id="rider-hit-dorsal"
                d={dorsalCurve}
                fill="none"
                stroke="white"
                strokeWidth="52"
              />
              <path id="rider-hit-surf" d={surfCurve} fill="none" stroke="white" strokeWidth="52" />
            </defs>
            <g fill="none" stroke="url(#rider-foil-light)" strokeLinecap="round">
              <g filter="url(#rider-foil-bloom)" opacity=".86">
                <use href="#rider-dorsal" strokeWidth="11" />
                <use href="#rider-surf" strokeWidth="15" />
              </g>
              <use href="#rider-dorsal" strokeWidth="2.5" />
              <use href="#rider-surf" strokeWidth="3.5" />
              <path
                d="M302 155 Q368 116 428 163 M57 245 Q54 282 93 303 M181 332 Q201 323 224 332 M345 342 Q379 335 398 321"
                strokeWidth="1.6"
              />
            </g>
            <g className="rider-foil-echo" fill="none" strokeLinecap="round" strokeWidth="2.8">
              <use className="rider-echo-back" href="#rider-dorsal" />
              <use className="rider-echo-surf" href="#rider-surf" />
            </g>
          </svg>
          <i className="rider-print-line" aria-hidden="true" />
          <i className="rider-edge" />
        </div>
      )}
      {phase === 'card' && (
        <button
          type="button"
          className="next-pack"
          onClick={() => onNavigate('?pack=whale&effects=gold')}
        >
          再次抽卡
        </button>
      )}
      {phase === 'arriving' && (
        <div className="rider-crest-layer" aria-hidden="true">
          <i className="rider-crest-flare" />
        </div>
      )}
      <span hidden id="pack-hint">
        横向拖开顶部封口
      </span>
    </main>
  );
}

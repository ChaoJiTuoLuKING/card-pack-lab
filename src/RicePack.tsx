import { useEffect, useRef, useState, useLayoutEffect, type PointerEvent } from 'react';
import { createPackSound, readMuted } from './packSound';
import { Pack } from './Pack';
import { type PackEffects } from './packEffects';
import { launchCards, type PackMouth } from './cardFlight';
import snack from './assets/whale-snack.webp';
import hiddenSnack from './assets/whale-snack-hide.webp';
import { FishPortrait } from './FishPortrait';
import chef from './assets/whale-chef.webp';
import './rice-pack.css';

const art = (name: string) => `${import.meta.env.BASE_URL}rice/${name}.webp`;
const cards = [
  { title: '开饭啦', image: art('front'), alt: '大肥鱼端着一盆白米饭，笑着跑过石廊' },
  { title: '私房零食', image: snack, alt: '大肥鱼抱着私藏的零食' },
  { title: '深夜小厨', image: chef, alt: '戴着厨师帽的大肥鱼正举勺尝汤' },
  { title: '骑鲸送饭', image: art('rider'), alt: '大肥鱼捧着热饭骑鲸穿过石廊云海' },
];
const hints = [
  '轻点饭盆，或翻开鲸尾暗牌',
  '靠近零食袋，看她把零食藏起来',
  '上下移动鼠标，让大肥鱼抬勺尝汤',
  '轻点鲸背，再跃一次',
];
type Phase = 'sealed' | 'opening' | 'turning' | 'front';

export function RicePack() {
  const [phase, setPhase] = useState<Phase>('sealed');
  const [active, setActive] = useState(0);
  const [guard, setGuard] = useState(false);
  const [unmasked, setUnmasked] = useState(false);
  const [collectedSecret, setCollectedSecret] = useState(false);
  const chefMotion = useRef<SVGFEDisplacementMapElement>(null);
  const [found, setFound] = useState(false);
  const [muted, setMuted] = useState(readMuted);
  const [sound] = useState(() => createPackSound(muted));
  const box = useRef<HTMLDivElement>(null);
  const effects = useRef<PackEffects | null>(null);
  const deck = useRef<HTMLOListElement>(null);
  const [mouth, setMouth] = useState<PackMouth | null>(null);
  const [wrapperGone, setWrapperGone] = useState(false);

  useEffect(() => {
    document.title = '大肥鱼 · 开饭啦 · 拆卡实验室';
    for (const name of ['cover', 'back', 'front', 'guard']) new Image().src = art(name);
    return () => sound.dispose();
  }, [sound]);
  useLayoutEffect(() => {
    if (!mouth || !deck.current) return;
    return launchCards(deck.current, mouth, sound.swirl, sound.land, () => {
      sound.flip(0, 'dew');
      setPhase('turning');
    });
  }, [mouth, sound]);
  useEffect(() => {
    if (phase !== 'turning') return;
    const timer = window.setTimeout(
      () => {
        setPhase('front');
        setFound(true);
      },
      matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1000,
    );
    return () => clearTimeout(timer);
  }, [phase]);
  useEffect(() => {
    if (active !== 3 || unmasked) return;
    const timer = window.setTimeout(() => {
      setUnmasked(true);
      setCollectedSecret(true);
      sound.flip(3, 'astral');
    }, 550);
    return () => clearTimeout(timer);
  }, [active, unmasked, sound]);
  function peel(progress: number, direction: number, seamY: number) {
    const style = box.current?.style;
    const center = direction > 0 ? progress / 2 : 1 - progress / 2;
    style?.setProperty('--mouth-x', center * 100 + '%');
    style?.setProperty('--mouth-y', seamY + '%');
    style?.setProperty('--vapour-width', 14 + progress * 68 + '%');
    style?.setProperty('--vapour-opacity', String(Math.min(1, progress * 5)));
  }
  function inspect(event: PointerEvent<HTMLLIElement>) {
    if (phase !== 'front') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    if (active === 2 && event.currentTarget.dataset.place === 'main')
      chefMotion.current?.setAttribute('scale', String((1 - y) * 18));
    const style = event.currentTarget.style;
    style.setProperty('--tilt-x', (0.5 - y) * 14 + 'deg');
    style.setProperty('--tilt-y', (x - 0.5) * 18 + 'deg');
    style.setProperty('--gloss', x * 100 + '%');
    style.setProperty('--pearl', String(0.18 + Math.abs(x - 0.5) * 1.6));
  }
  function level(event: PointerEvent<HTMLLIElement>) {
    if (active === 2) chefMotion.current?.setAttribute('scale', '0');
    for (const property of ['--tilt-x', '--tilt-y', '--gloss', '--pearl']) {
      event.currentTarget.style.removeProperty(property);
    }
  }
  function selectCard(index: number) {
    setGuard(false);
    setActive(index);
    sound.hover(index, true);
  }
  function knock() {
    sound.hover(2, false);
    box.current
      ?.querySelector('[data-place=main] .rice-flip')
      ?.animate(
        [
          { transform: 'rotateY(180deg) translateY(0)' },
          { transform: 'rotateY(180deg) translateY(-7px) rotate(-1deg)' },
          { transform: 'rotateY(180deg) translateY(0)' },
        ],
        { duration: 310, easing: 'ease-out' },
      );
  }
  return (
    <main className="rice-room" data-phase={phase}>
      <header>
        <span>
          收藏 {(found ? 3 : 0) + (collectedSecret ? 1 : 0)} / {cards.length}
        </span>
        <button
          onClick={() => {
            sound.setMuted(!muted);
            setMuted(!muted);
          }}
        >
          声音{muted ? '关' : '开'}
        </button>
      </header>
      <div className="rice-object" ref={box}>
        {phase !== 'front' && <div className="rice-mouth-vapour" aria-hidden="true" />}
        {mouth && (
          <ol className="rice-flight" ref={deck}>
            {cards.map((card, index) => (
              <li
                key={card.title}
                className="deck-slot"
                data-place={
                  ['main', 'left', 'right', 'extra'][(index - active + cards.length) % cards.length]
                }
                data-index={index}
                data-hidden={index === 3 && !unmasked}
                data-reveal={index === 3 && unmasked}
                onPointerMove={inspect}
                onPointerLeave={level}
                onPointerCancel={level}
              >
                <div className="rice-tilt">
                  <div className="rice-flip">
                    <div className="rice-back">{index === 3 && <i className="secret-tail" />}</div>
                    <div className="rice-front" data-guard={guard}>
                      {index === 2 ? (
                        <div className="rice-cook">
                          <FishPortrait id="whale-chef" art={chef} motion={chefMotion} />
                        </div>
                      ) : (
                        <img
                          className={index === 1 ? 'rice-guest' : undefined}
                          src={card.image}
                          alt={card.alt}
                        />
                      )}
                      {index === 1 && (
                        <img className="rice-guest snack-away" src={hiddenSnack} alt="" />
                      )}
                      <i className="rice-laser" aria-hidden="true" />
                      {index === 0 && (
                        <>
                          <img
                            className={'rice-guard ' + (guard ? 'active' : '')}
                            src={art('guard')}
                            alt=""
                          />
                          <i className="rice-bowl-vapour" aria-hidden="true" />
                          <i className="rice-rim-gloss" aria-hidden="true" />
                        </>
                      )}
                      <i className="rice-tail-print" aria-hidden="true" />
                      <strong>{card.title}</strong>
                      {phase === 'front' && active === index && index !== 0 && (
                        <button
                          className="rice-action"
                          aria-label={['', '逗她护零食', '逗她尝汤', '让鲸鱼跃起'][index]}
                          onPointerEnter={() => setGuard(true)}
                          onPointerLeave={() => setGuard(false)}
                          onFocus={() => setGuard(true)}
                          onBlur={() => setGuard(false)}
                          onClick={() => {
                            if (index === 2) chefMotion.current?.setAttribute('scale', '18');
                            if (
                              index === 3 &&
                              !matchMedia('(prefers-reduced-motion: reduce)').matches
                            )
                              deck.current
                                ?.querySelector('[data-index="3"] .rice-front img')
                                ?.animate(
                                  [
                                    { transform: 'scale(1.04)' },
                                    { transform: 'scale(1.12) translateY(-2%) rotate(-1deg)' },
                                    { transform: 'scale(1.04)' },
                                  ],
                                  { duration: 830, easing: 'ease-in-out' },
                                );
                            sound.hover(index, false);
                          }}
                        />
                      )}
                      {phase === 'front' && index === 0 && active === 0 && (
                        <button
                          className="rice-bowl"
                          aria-label="逗大肥鱼护饭"
                          onPointerEnter={() => setGuard(true)}
                          onPointerLeave={() => setGuard(false)}
                          onFocus={() => setGuard(true)}
                          onBlur={() => setGuard(false)}
                          onPointerDown={() => setGuard(true)}
                          onClick={knock}
                        />
                      )}
                    </div>
                  </div>
                </div>
                {phase === 'front' && index !== active && (
                  <button
                    className="rice-select"
                    aria-label={index === 3 && !unmasked ? '翻开鲸尾暗牌' : '查看' + card.title}
                    onClick={() => selectCard(index)}
                  />
                )}
              </li>
            ))}
          </ol>
        )}
        {!wrapperGone && (
          <Pack
            theme="whale"
            onPeel={peel}
            riceSkin
            goldPreview={false}
            paused={false}
            onAwaken={() => {}}
            strongest="dew"
            autoFocus={false}
            sound={sound}
            effects={effects}
            onLaunch={(origin) => {
              setMouth(origin);
              setPhase('opening');
            }}
            onOpened={() => setWrapperGone(true)}
          />
        )}
      </div>
      <footer id="pack-hint" aria-live="polite">
        {phase === 'sealed' ? (
          '横向拖开顶部封口'
        ) : phase === 'front' ? (
          <>
            <span>{hints[active]}</span>
            <button
              onClick={() => {
                setUnmasked(false);
                setActive(0);
                setGuard(false);
                peel(0, 1, 12);
                setMouth(null);
                setWrapperGone(false);
                setPhase('sealed');
              }}
            >
              再拆一包
            </button>
          </>
        ) : (
          '开包中…'
        )}
      </footer>
    </main>
  );
}

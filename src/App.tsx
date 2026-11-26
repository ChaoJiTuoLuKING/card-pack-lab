import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { launchCards } from './cardFlight';
import type { PackMouth } from './cardFlight';
import {
  awakenPack,
  collectionId,
  finishes,
  readCollection,
  recordPrint,
  themes,
  type PackTheme,
  type Pull,
  type Finish,
} from './cards';
import { Collection } from './Collection';
import { FoilCard } from './FoilCard';
import { DailyCard } from './DailyCard';
import { newRound, openingRound, packNames, type Theme } from './rounds';
import { PackPicker, type NavigatePack } from './PackPicker';
import { Pack } from './Pack';
import { createPackEffects } from './packEffects';
import type { PackEffects } from './packEffects';
import { createPackSound, readMuted } from './packSound';
import type { PackSound } from './packSound';
import { GOLD_PALETTE } from './lightJet';
import goldBurst from './assets/holopix-pack-burst.mp4';
import goldRing from './assets/holopix-card-reveal.mp4';

function stopEffect(video: HTMLVideoElement | null) {
  if (!video) return;
  delete video.dataset.playing;
  video.pause();
}

function playEffect(video: HTMLVideoElement | null, x: number, y: number, width: number) {
  const stage = video?.offsetParent?.getBoundingClientRect();
  if (!video || !stage || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  video.style.left = `${x - stage.left}px`;
  video.style.top = `${y - stage.top}px`;
  video.style.width = `${width}px`;
  video.currentTime = 0;
  video.dataset.playing = '';
  void video.play().catch(() => stopEffect(video));
}

function Deck({
  theme,
  mouth,
  pulls,
  sound,
  goldPreview,
  onGoldReveal,
  onReset,
  onFlip,
}: {
  theme: PackTheme;
  mouth: PackMouth;
  pulls: Pull[];
  sound: PackSound;
  goldPreview: boolean;
  onGoldReveal: (element: HTMLElement) => void;
  onReset: () => void;
  onFlip: (element: HTMLDivElement, pull: Pull) => void;
}) {
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(() => new Set());
  const [active, setActive] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [compact, setCompact] = useState(
    () => matchMedia('(max-width: 660px), (hover: none) and (pointer: coarse)').matches,
  );
  const [featuredIndex, setFeaturedIndex] = useState(
    goldPreview ? 0 : Math.min(2, pulls.length - 1),
  );
  const [showcase, setShowcase] = useState<'enter' | 'leave' | null>(null);
  const showcaseCard = useRef<HTMLUListElement>(null);
  const revealTimeline = useRef<gsap.core.Timeline | null>(null);
  const showFeatured = compact && theme === 'whale';
  const featured = pulls[featuredIndex];
  useEffect(() => {
    const query = matchMedia('(max-width: 660px), (hover: none) and (pointer: coarse)');
    const resize = () => setCompact(query.matches);
    query.addEventListener('change', resize);
    resize();
    return () => query.removeEventListener('change', resize);
  }, []);
  const deck = useRef<HTMLOListElement>(null);
  const seen = useRef(new Set<string>());
  const sweep = useRef<{ id: number; x: number; y: number; first: number; moved: boolean } | null>(
    null,
  );
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(
    () => () => {
      revealTimeline.current?.kill();
      for (const timer of timers.current) clearTimeout(timer);
    },
    [],
  );
  function reveal(index: number, inspect: boolean) {
    const pull = pulls[index];
    const element = deck.current?.querySelector<HTMLDivElement>(
      `[data-slot="${index}"] .card-area`,
    );
    if (!ready || !element || !pull || seen.current.has(pull.card.id)) return;
    seen.current.add(pull.card.id);
    sound.flip(index, pull.finish);
    onFlip(element, pull);
    setRevealed(new Set(seen.current));
    if (inspect) setActive(index);
  }
  function revealAll() {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current = [];
    setActive(null);
    pulls.forEach((_, i) => {
      timers.current.push(setTimeout(() => reveal(i, false), i * 145));
    });
  }
  function revealGold() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      revealAll();
      return;
    }
    setShowcase('enter');
    const timeline = gsap.timeline().addLabel('reveal', 0.35).addLabel('hand', 1.22);
    revealTimeline.current = timeline;
    timeline
      .call(
        () => {
          if (showcaseCard.current) onGoldReveal(showcaseCard.current);
        },
        [],
        0.06,
      )
      .call(() => reveal(0, false), [], 'reveal')
      .call(() => setShowcase('leave'), [], 'hand')
      .call(() => setShowcase(null), [], 'hand+=0.34');
    for (let index = 1; index < pulls.length; index++) {
      timeline.call(() => reveal(index, false), [], 0.8 + index * 0.095);
    }
  }
  function slotAt(x: number, y: number) {
    const slot = document.elementFromPoint(x, y)?.closest<HTMLElement>('.deck-slot');
    return slot && deck.current?.contains(slot) ? Number(slot.dataset.slot) : -1;
  }

  useLayoutEffect(() => {
    if (deck.current)
      return launchCards(
        deck.current,
        mouth,
        sound.swirl,
        sound.land,
        () => setReady(true),
        goldPreview ? 0.17 : 0,
      );
  }, [goldPreview, mouth, sound]);

  const showSeries = useEffectEvent(revealAll);
  const showGoldSeries = useEffectEvent(revealGold);
  useEffect(() => {
    if (!ready) return;
    if (goldPreview) showGoldSeries();
    else if (theme === 'whale') showSeries();
    else deck.current?.querySelector('button')?.focus({ preventScroll: true });
  }, [goldPreview, ready, theme]);

  return (
    <section
      className="deck"
      aria-label={`${pulls.length} 张闪卡`}
      data-count={pulls.length}
      aria-busy={!ready}
      data-ready={ready}
      data-inspecting={active !== null}
    >
      {showcase && (
        <div className="gold-showcase" data-phase={showcase}>
          <ul ref={showcaseCard} className="gold-showcase-card" aria-hidden="true" inert>
            <FoilCard
              card={pulls[0].card}
              finish={pulls[0].finish}
              position={0}
              total={1}
              active
              canFlip={false}
              revealed={revealed.has(pulls[0].card.id)}
              onHover={() => {}}
              onReveal={() => {}}
            />
          </ul>
        </div>
      )}
      {showFeatured && (
        <ul
          className="whale-featured"
          aria-label="当前赏卡"
          style={{ visibility: ready ? 'visible' : 'hidden' }}
        >
          <FoilCard
            key={featured.card.id}
            card={featured.card}
            finish={featured.finish}
            position={0}
            total={1}
            hintId="deck-hint"
            active
            canFlip={false}
            revealed={revealed.has(featured.card.id)}
            onHover={() => {
              if (goldPreview) sound.cardCue('foil', 0);
            }}
            onCardCue={goldPreview ? sound.cardCue : undefined}
            onReveal={() => {}}
          />
        </ul>
      )}
      <ol
        className="deck-cards"
        data-count={pulls.length}
        ref={deck}
        onPointerDown={(e) => {
          const first = slotAt(e.clientX, e.clientY);
          if (
            ready &&
            e.isPrimary &&
            e.button === 0 &&
            first >= 0 &&
            !seen.current.has(pulls[first].card.id)
          )
            sweep.current = { id: e.pointerId, x: e.clientX, y: e.clientY, first, moved: false };
        }}
        onPointerMove={(e) => {
          const gesture = sweep.current;
          if (!gesture || gesture.id !== e.pointerId || !e.buttons) return;
          if (!gesture.moved && Math.abs(e.clientX - gesture.x) < 12) return;
          if (!gesture.moved) {
            if (Math.abs(e.clientY - gesture.y) > Math.abs(e.clientX - gesture.x)) {
              sweep.current = null;
              return;
            }
            gesture.moved = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            reveal(gesture.first, false);
          }
          const index = slotAt(e.clientX, e.clientY);
          if (index >= 0) reveal(index, false);
        }}
        onPointerUp={() => {
          sweep.current = null;
        }}
        onPointerCancel={() => {
          sweep.current = null;
        }}
        onLostPointerCapture={(e) => {
          if (e.target === e.currentTarget) sweep.current = null;
        }}
      >
        {pulls.map(({ card, finish }, index) => (
          <FoilCard
            key={card.id}
            card={card}
            finish={finish}
            position={index}
            total={pulls.length}
            active={active === null || index === active}
            featured={showFeatured ? featuredIndex === index : undefined}
            canFlip={ready}
            revealed={revealed.has(card.id)}
            onHover={() => {
              if (goldPreview && revealed.has(card.id))
                sound.cardCue('foil', (index / Math.max(1, pulls.length - 1) - 0.5) * 0.8);
              else sound.hover(index, revealed.has(card.id));
            }}
            onCardCue={goldPreview ? sound.cardCue : undefined}
            onPreview={theme === 'whale' ? () => setFeaturedIndex(index) : undefined}
            onReveal={() => reveal(index, theme === 'meadow')}
            onInspect={
              showFeatured
                ? () => setFeaturedIndex(index)
                : compact
                  ? () => setActive(index)
                  : undefined
            }
          />
        ))}
      </ol>
      {goldPreview && (
        <button
          type="button"
          className="next-pack"
          disabled={!ready || !!showcase || revealed.size < pulls.length}
          onClick={onReset}
        >
          再次抽卡
        </button>
      )}
      <div className="deck-nav" role="group" aria-label="选择卡位" inert={!ready}>
        {pulls.map(({ card }, index) => (
          <button
            key={card.id}
            type="button"
            aria-pressed={active === index}
            aria-label={`第 ${index + 1} 张卡${revealed.has(card.id) ? '，已翻开' : ''}`}
            onClick={() => setActive(index)}
          >
            <span>{index + 1}</span>
            {revealed.has(card.id) && <i aria-hidden="true" />}
          </button>
        ))}
      </div>
      <div className="deck-controls" inert={!ready}>
        <p className="hint" id="deck-hint">
          {revealed.size === 0 && theme === 'meadow' ? (
            '点卡背翻开，或按住横扫连翻'
          ) : theme === 'whale' ? (
            featured.card.hint
          ) : (
            <>
              <span className="mouse-hint">移入卡面赏卡，移动看镭射</span>
              <span className="touch-hint">轻划卡面看镭射</span>
            </>
          )}
        </p>
        <p className="count" role="status">
          已翻开 {revealed.size} / {pulls.length}
        </p>
        {theme === 'meadow' && revealed.size < pulls.length && (
          <button className="secondary" type="button" onClick={revealAll}>
            全部翻开
          </button>
        )}
        <button className="secondary" type="button" onClick={onReset}>
          再拆一包
        </button>
      </div>
    </section>
  );
}

export function App({ onNavigate }: { onNavigate: NavigatePack }) {
  const [round, setRound] = useState(() => openingRound(window.location.search));
  const theme = round.theme;
  const goldPreview =
    theme === 'whale' && new URLSearchParams(location.search).get('effects') === 'gold';
  const showcase = goldPreview || theme === 'english';
  const catalog = 'pulls' in round ? themes[round.theme] : null;
  const hasCards = 'pulls' in round ? round.pulls.length > 0 : !!round.entry;
  useEffect(() => {
    document.title = theme === 'english' ? '大肥鱼 · 背单词 · 拆卡实验室' : packNames[theme] + ' · 拆卡实验室';
  }, [theme]);
  const [mouth, setMouth] = useState<PackMouth | null>(null);
  const [found, setFound] = useState(readCollection);
  const ownedCount = catalog?.prints.filter((p) => found.has(collectionId(p))).length ?? 0;
  const [album, setAlbum] = useState(false);
  const [daylight, setDay] = useState<boolean | null>(null);
  const day = daylight ?? (theme !== 'meadow' && !goldPreview);
  const strongest: Finish =
    'pulls' in round && round.pulls.some((p) => p.finish === 'astral')
      ? 'astral'
      : theme === 'meal' || ('pulls' in round && round.pulls.some((p) => p.finish === 'amber'))
        ? 'amber'
        : 'dew';
  useEffect(() => {
    const sync = () => setFound((prev) => new Set([...prev, ...readCollection()]));
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  const [wrapperGone, setWrapperGone] = useState(false);
  const [packNumber, setPackNumber] = useState(0);
  const [muted, setMuted] = useState(readMuted);
  const [sound] = useState(() => createPackSound(muted));
  const jet = useRef<SVGSVGElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const packBurst = useRef<HTMLVideoElement>(null);
  const cardRing = useRef<HTMLVideoElement>(null);
  const effects = useRef<PackEffects | null>(null);

  useEffect(() => {
    if (canvas.current && jet.current)
      effects.current = createPackEffects(
        canvas.current,
        jet.current,
        goldPreview ? GOLD_PALETTE : undefined,
      );
    function hide() {
      if (document.hidden) {
        sound.rip(0);
        effects.current?.clear();
        stopEffect(packBurst.current);
        stopEffect(cardRing.current);
      }
    }
    document.addEventListener('visibilitychange', hide);
    return () => {
      document.removeEventListener('visibilitychange', hide);
      effects.current?.clear();
      effects.current = null;
    };
  }, [sound, goldPreview]);
  useEffect(() => () => sound.dispose(), [sound]);

  function resetPack(nextTheme: Theme, previousWord?: string) {
    effects.current?.clear();
    stopEffect(packBurst.current);
    stopEffect(cardRing.current);
    setPackNumber((previous) => previous + 1);
    setRound(newRound(nextTheme, Math.random, previousWord));
    setMouth(null);
    setWrapperGone(false);
  }

  function openAnother() {
    sound.arrive();
    resetPack(theme, round.theme === 'english' ? round.entry?.word : undefined);
  }

  function toggleSound() {
    sound.setMuted(!muted);
    setMuted(!muted);
  }

  function switchTheme(next: Theme) {
    const url = new URL(window.location.href);
    url.searchParams.delete('word');
    if (next !== 'meadow') url.searchParams.set('pack', next);
    else url.searchParams.delete('pack');
    window.history.replaceState(window.history.state, '', url);
    setAlbum(false);
    resetPack(next);
  }

  return (
    <main
      className="stage"
      data-showcase={showcase || undefined}
      data-theme={theme}
      data-effects={goldPreview ? 'gold' : undefined}
      data-light={day ? 'day' : 'night'}
      data-view={mouth ? 'deck' : 'pack'}
    >
      <svg ref={jet} className="light-jet" viewBox="0 0 100 76" aria-hidden="true" />
      <canvas ref={canvas} className="stage-effects" aria-hidden="true" />
      {goldPreview && (
        <>
          <video
            ref={packBurst}
            className="gold-effect gold-effect-burst"
            src={goldBurst}
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            onEnded={(event) => stopEffect(event.currentTarget)}
          />
          <video
            ref={cardRing}
            className="gold-effect"
            src={goldRing}
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            onEnded={(event) => stopEffect(event.currentTarget)}
          />
        </>
      )}
      {showcase ? (
        <PackPicker
          active={goldPreview ? 'gold' : 'english'}
          onNavigate={onNavigate}
          onToggleSound={toggleSound}
        />
      ) : (
        <header className="stage-header">
          {catalog && (
            <button className="album-toggle" type="button" onClick={() => setAlbum(true)}>
              收藏册{' '}
              <span>
                {ownedCount}/{catalog.prints.length}
              </span>
            </button>
          )}
          {theme === 'meadow' ? (
            <PackPicker active="meadow" onNavigate={onNavigate} onToggleSound={toggleSound} />
          ) : (
            <h1>
              {packNames[theme]}
              <span> · </span>拆卡
            </h1>
          )}
          <div className="stage-tools">
            <select
              className="theme-toggle"
              aria-label="选择卡包玩法"
              value={theme}
              onChange={(e) => switchTheme(e.target.value as Theme)}
            >
              {Object.entries(packNames).map(([key, name]) => (
                <option key={key} value={key}>
                  {name}包
                </option>
              ))}
            </select>
            <button
              type="button"
              className="light-toggle"
              onClick={() => setDay(!day)}
              aria-label="日光展台"
              aria-pressed={day}
            >
              {day ? '日光' : '月光'}
            </button>
            <button
              type="button"
              className="sound-toggle"
              aria-label="声音"
              aria-pressed={!muted}
              onClick={toggleSound}
            >
              声音 {muted ? '关' : '开'}
            </button>
          </div>
        </header>
      )}
      {mouth && 'pulls' in round && (
        <Deck
          theme={round.theme}
          mouth={mouth}
          pulls={round.pulls}
          sound={sound}
          goldPreview={goldPreview}
          onGoldReveal={(element) => {
            const rect = element.getBoundingClientRect();
            playEffect(
              cardRing.current,
              rect.left + rect.width / 2,
              rect.top + rect.height / 2,
              rect.width * 4,
            );
          }}
          onFlip={(element, pull) => {
            if (!goldPreview)
              effects.current?.flip(element, finishes[pull.finish].color, pull.finish === 'astral');
            const id = collectionId(pull);
            recordPrint(id);
            setFound((prev) => new Set(prev).add(id));
          }}
          onReset={goldPreview ? () => onNavigate('?pack=rider') : openAnother}
        />
      )}
      {mouth && 'entry' in round && (
        <DailyCard round={round} mouth={mouth} muted={muted} onReset={openAnother} />
      )}
      {!hasCards && (
        <p className="daily-empty" role="status">
          这个卡池还是空的，请换一包，或在源码的 card-pools 目录加入卡片。
        </p>
      )}
      {hasCards && !wrapperGone && (
        <section className="pack-stage" aria-label={`未打开的${packNames[theme]}卡包`}>
          <Pack
            theme={theme}
            goldPreview={goldPreview}
            paused={album}
            strongest={strongest}
            onAwaken={() =>
              setRound((previous) =>
                'pulls' in previous ? { ...previous, pulls: awakenPack(previous.pulls) } : previous,
              )
            }
            key={packNumber}
            autoFocus={packNumber > 0}
            effects={effects}
            sound={sound}
            onLaunch={(origin) => {
              if (goldPreview)
                playEffect(packBurst.current, origin.x, origin.y, origin.width * 3.65);
              setMouth(origin);
            }}
            onOpened={() => setWrapperGone(true)}
          />
        </section>
      )}
      {album && 'pulls' in round && (
        <Collection
          theme={round.theme}
          found={found}
          ownedCount={ownedCount}
          onClose={() => setAlbum(false)}
        />
      )}
    </main>
  );
}

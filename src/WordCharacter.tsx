import { useId, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { StretchPortrait } from './StretchPortrait';
import headphones from './assets/whale-headphones.webp';
import bag from './assets/whale-pack-caught.webp';
import { FishPortrait } from './FishPortrait';
import chef from './assets/whale-chef.webp';
import dancer from './assets/whale-dance.webp';
import { WordProp, hasWordProp } from './WordProp';
import nap from './assets/whale-nap.webp';
import hiding from './assets/whale-snack-hide.webp';

import snack from './assets/whale-snack.webp';

// Pivot the spoon and its painted sleeve together. The opposite shoulder supplies
// the fabric behind the raised arm, and the near rim stays in front of the spoon.
function StirPortrait() {
  const id = useId();
  const print = '#' + id + '-print';
  const arm =
    'M120 232Q122 227 128 229L147 233Q151 225 158 230L165 233 171 239 174 244 194 247Q210 239 225 248Q234 253 226 263L221 268 220 289Q217 299 214 292L213 269Q200 268 192 258L174 252Q178 266 169 279L170 286Q182 302 173 324Q164 341 146 342Q130 341 124 326Q116 312 128 285L134 274 137 252 140 241 125 240Q120 240 120 232Z';
  return (
    <svg viewBox="0 0 500 500" aria-hidden="true">
      <defs>
        <image id={id + '-print'} href={chef} width="500" height="500" />
        <clipPath id={id + '-arm'}>
          <path d={arm} />
        </clipPath>
        <clipPath id={id + '-rim'}>
          <path d="M193 367Q231 392 277 367L276 393Q274 410 237 412Q198 412 194 396Z" />
        </clipPath>
      </defs>
      <use href={print} />
      <g clipPath={`url(#${id}-arm)`}>
        <use href={print} transform="translate(485 0) scale(-1 1)" />
      </g>
      <g className="stir-arm">
        <g clipPath={`url(#${id}-arm)`}>
          <use href={print} />
        </g>
      </g>
      <g clipPath={`url(#${id}-rim)`}>
        <use href={print} />
      </g>
    </svg>
  );
}

const portraits = {
  hug: { id: 'whale-nap', art: nap },
  listen: { id: 'whale-headphones', art: headphones },
  shake: { id: 'shake-bag', art: bag },
  nod: { id: 'word-nod', art: dancer },
} as const;

export function WordCharacter({
  word,
  cue,
  accent,
}: {
  word: string;
  cue: number;
  accent: boolean;
}) {
  const root = useRef<HTMLButtonElement>(null);
  const replay = useRef<() => void>(() => {});
  const warp = useRef<SVGFEDisplacementMapElement>(null);
  const portrait =
    word === 'hug' || word === 'shake' || word === 'listen' ? portraits[word] : portraits.nod;
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let timeout: number | undefined;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        paused: true,
        defaults: { immediateRender: false },
        onComplete: () => {
          delete el.dataset.meaning;
        },
      });
      if (word === 'hug' || word === 'listen') {
        tl.to(warp.current, { attr: { scale: 16 }, duration: 0.26, ease: 'sine.inOut' }).to(
          warp.current,
          { attr: { scale: 0 }, duration: 0.32, ease: 'sine.inOut' },
          '+=0.50',
        );
      } else if (word === 'stir') {
        const arm = '.stir-arm';
        tl.set(arm, { svgOrigin: '145 313' })
          .to(arm, { rotation: 72, y: 10, duration: 0.25, ease: 'sine.inOut' })
          .to(arm, { rotation: 81, x: -11, y: 6, duration: 0.16, ease: 'sine.inOut' })
          .to(arm, { rotation: 74, x: -15, y: 3, duration: 0.14 })
          .to(arm, { rotation: 69, x: 0, y: 7, duration: 0.16 })
          .to(arm, { rotation: 0, x: 0, y: 0, duration: 0.26, ease: 'sine.inOut' });
      } else if (word === 'hide') {
        tl.to('.snack-visible', { opacity: 0, duration: 0.1 })
          .fromTo(
            '.snack-hidden',
            { opacity: 0, xPercent: -2 },
            { opacity: 1, xPercent: 0, duration: 0.14 },
            0,
          )
          .to('.snack-hidden', { opacity: 0, duration: 0.15 }, '+=0.75')
          .to('.snack-visible', { opacity: 1, duration: 0.15 }, '<');
      } else if (word === 'shake') {
        tl.to(warp.current, { attr: { scale: 12 }, duration: 0.09, ease: 'sine.out' })
          .to(warp.current, {
            attr: { scale: -12 },
            duration: 0.14,
            repeat: 2,
            yoyo: true,
            ease: 'sine.inOut',
          })
          .to(warp.current, { attr: { scale: 0 }, duration: 0.12 });
      } else if (word === 'stretch') {
        tl.fromTo(
          '.stretch-upper',
          { svgOrigin: '159 236', scaleY: 0.94, rotation: -3 },
          { scaleY: 1.035, rotation: 1, ease: 'sine.inOut', duration: 0.35 },
        )
          .fromTo(
            '.stretch-arm',
            { rotation: 26, svgOrigin: '183 158' },
            { rotation: -14, duration: 0.34, ease: 'sine.inOut' },
            0,
          )
          .to('.stretch-upper', { scaleY: 1, rotation: 0, duration: 0.24 }, '+=0.23')
          .to('.stretch-arm', { rotation: 4, duration: 0.24 }, '<');
      } else if (hasWordProp(word)) {
        const movement = {
          peel: { rotation: 37, transformOrigin: '13px 50px' },
          slice: { x: 13, y: 3, rotation: 7 },
          share: { x: 11, y: -8 },
          unwrap: { y: -14, rotation: -12 },
          whisper: { x: 7, opacity: 0.35 },
          float: { x: 10, y: -4, rotation: -6 },
        }[word];
        tl.to('.prop-piece', {
          ...movement,
          duration: 0.5,
          ease: 'sine.inOut',
          repeat: 1,
          repeatDelay: 0.28,
          yoyo: true,
        });
      } else {
        tl.to(warp.current, { attr: { scale: 14 }, duration: 0.16, ease: 'sine.inOut' }).to(
          warp.current,
          { attr: { scale: 0 }, duration: 0.2, ease: 'sine.inOut' },
          '+=0.06',
        );
      }
      replay.current = () => {
        clearTimeout(timeout);
        el.dataset.meaning = '';
        if (reduced) {
          tl.progress(0.5).pause();
          timeout = window.setTimeout(() => {
            tl.pause(0);
            delete el.dataset.meaning;
          }, 750);
        } else {
          tl.restart();
        }
      };
      if (!reduced) timeout = window.setTimeout(() => replay.current(), 850);
    }, root);
    return () => {
      clearTimeout(timeout);
      replay.current = () => {};
      ctx.revert();
      delete el.dataset.meaning;
    };
  }, [word]);
  useLayoutEffect(() => {
    if (cue || accent) replay.current();
  }, [cue, accent]);
  return (
    <button
      ref={root}
      type="button"
      className="word-character"
      data-word={word}
      aria-label={`重播 ${word} 的动作`}
      onClick={() => replay.current()}
    >
      <span className="word-demonstration" aria-hidden="true">
        {hasWordProp(word) && (
          <>
            <img
              src={word === 'peel' || word === 'slice' ? chef : word === 'unwrap' ? snack : dancer}
              alt=""
              draggable={false}
            />
            <WordProp word={word} />
          </>
        )}
        {word === 'stretch' && <StretchPortrait />}
        {!hasWordProp(word) && !['stretch', 'stir', 'hide'].includes(word) && (
          <FishPortrait id={portrait.id} art={portrait.art} motion={warp} />
        )}
        {word === 'stir' && <StirPortrait />}
        {word === 'hide' && (
          <>
            <img className="snack-visible" src={snack} alt="" draggable={false} />
            <img className="snack-hidden" src={hiding} alt="" draggable={false} />
          </>
        )}
      </span>
    </button>
  );
}

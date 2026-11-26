import { useId, type Ref } from 'react';
import { FishPortrait, hasPortraitRig } from './FishPortrait';
import type { CardDesign } from './cards';
import snackFace from './assets/whale-snack-face.webp';
import snackEyes from './assets/whale-snack-eyes.webp';
import snackHide from './assets/whale-snack-hide.webp';
import tokenFace from './assets/whale-token-face.webp';
import tokenEyes from './assets/whale-token-eyes.webp';
import tokenOfferFace from './assets/whale-token-offer-face.webp';
import tokenOfferEyes from './assets/whale-token-offer-eyes.webp';
import danceStep from './assets/whale-dance-step.webp';
import danceHop from './assets/whale-dance-hop.webp';

interface FishPrint {
  number: string;
  face?: string;
  eyes?: string;
  alternate?: string;
  alternateEyes?: string;
}

const fishPrints = {
  'whale-snack': {
    number: '01',
    face: snackFace,
    eyes: snackEyes,
    alternate: snackHide,
  },
  'whale-token': {
    number: '02',
    face: tokenFace,
    eyes: tokenEyes,
    alternate: tokenOfferFace,
    alternateEyes: tokenOfferEyes,
  },
  'whale-dance': {
    number: '03',
    alternate: danceStep,
  },
  'whale-headphones': { number: '04' },
  'whale-chef': { number: '05' },
  'whale-nap': { number: '06' },
} satisfies Record<string, FishPrint>;

export type FishId = keyof typeof fishPrints;

export function isFishId(id: string): id is FishId {
  return Object.hasOwn(fishPrints, id);
}

const star = 'M0 -8 Q1 -1 7 0 Q1 1 0 8 Q-1 1 -7 0 Q-1 -1 0 -8Z';
const tail =
  'M0 9C-1 4 -4 0 -10 -1C-17 -2 -20 -7 -22 -12C-12 -12 -4 -11 0 -4C4 -11 12 -12 22 -12C20 -7 17 -2 10 -1C4 0 1 4 0 9Z';

function Accent({ id }: { id: FishId }) {
  if (id === 'whale-headphones') {
    return (
      <g fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M-9 3v-3a9 9 0 0 1 18 0v3" />
        <rect x="-11" y="0" width="5" height="8" rx="2" />
        <rect x="6" y="0" width="5" height="8" rx="2" />
      </g>
    );
  }
  if (id === 'whale-chef') {
    return (
      <g fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M-10 0h20q-1 9-10 9t-10-9Zm5-3q-4-3 0-5m5 5q-4-3 0-6m5 6q-4-3 0-5" />
      </g>
    );
  }
  if (id === 'whale-nap') {
    return <path fill="currentColor" d="M4-10A10 10 0 1 0 11 5 10 10 0 0 1 4-10Z" />;
  }
  if (id === 'whale-snack') {
    return (
      <g stroke="currentColor" strokeWidth="1.35" fill="none" strokeLinejoin="round">
        <path d="m-8 -2 -6 -4 1 5 -2 4 7 -1m16 -2 6 -4 -1 5 2 4 -7 -1" />
        <rect x="-8" y="-6" width="16" height="12" rx="5" />
        <path d="m-3 -5 -3 8m9 -8 -4 10" />
      </g>
    );
  }
  if (id === 'whale-token') {
    return (
      <g stroke="currentColor" strokeWidth="1.45" fill="none">
        <ellipse rx="9" ry="10" />
        <ellipse rx="6.5" ry="7.8" strokeWidth=".7" />
        <path d="M-3.5 -2h7m-3.5 0v6" />
      </g>
    );
  }
  return (
    <g fill="currentColor">
      <path d="M-4 -7 6 -10v13h-2v-9l-6 2v10h-2Z" />
      <ellipse cx="-5.6" cy="6.3" rx="3.9" ry="2.7" transform="rotate(-18 -5.6 6.3)" />
      <ellipse cx="2.5" cy="3.4" rx="3.9" ry="2.7" transform="rotate(-18 2.5 3.4)" />
    </g>
  );
}

export function FishBack() {
  return (
    <span className="fish-back-print" aria-hidden="true">
      <svg viewBox="0 0 180 254" preserveAspectRatio="none" fill="none">
        <rect x="8" y="8" width="164" height="238" rx="8" stroke="currentColor" />
        <rect
          x="12"
          y="12"
          width="156"
          height="230"
          rx="6"
          stroke="currentColor"
          strokeDasharray="1 3"
        />
        <g stroke="currentColor">
          <path d="M24 41q0 -16 17 -16m98 0q17 0 17 16M24 213q0 16 17 16m98 0q17 0 17 -16" />
          <ellipse
            cx="90"
            cy="125"
            rx="57"
            ry="72"
            transform="rotate(22 90 125)"
            strokeDasharray="1.5 4"
          />
          <ellipse cx="90" cy="125" rx="49" ry="67" />
          <ellipse cx="90" cy="125" rx="45" ry="63" strokeWidth=".5" />
          <path d="M61 145q7 -5 14 0t14 0t14 0t14 0m-46 6q6 -4 12 0t12 0t12 0" />
        </g>
        <g fill="currentColor">
          <path d={tail} transform="translate(90 122) scale(1.42)" />
          <path d={star} transform="translate(90 79) scale(.66)" />
          <path d={star} transform="translate(43 69) scale(.52)" />
          <path d={star} transform="translate(138 181) scale(.54)" />
          <path d={star} transform="translate(90 213) scale(.68)" />
          <path d="M75 38h30v1H75z" />
        </g>
      </svg>
      <b>大肥鱼</b>
    </span>
  );
}

function FishScene({ id }: { id: FishId }) {
  const print = useId();
  return (
    <svg className="fish-scene" viewBox="0 0 180 249" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <pattern id={print} width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r=".65" fill="currentColor" />
        </pattern>
        <pattern
          id={`${print}-stamps`}
          color="white"
          width="33"
          height="32"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-16)"
        >
          <g transform="translate(9 9) scale(.38)">
            <Accent id={id} />
          </g>
          <path d={tail} transform="translate(27 25) scale(.19)" fill="currentColor" />
        </pattern>
        <linearGradient
          id={`${print}-pearl`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="48"
          x2="105"
          y2="81"
          spreadMethod="reflect"
        >
          <stop stopColor="var(--fish-line)" />
          <stop offset=".28" stopColor="var(--fish-flash)" />
          <stop offset=".43" stopColor="#ffffed" />
          <stop offset=".54" stopColor="#aefbed" />
          <stop offset=".71" stopColor="var(--fish-flash)" />
          <stop offset="1" stopColor="var(--fish-star)" />
        </linearGradient>
        <mask id={`${print}-foil`}>
          <g color="white" fill="none" stroke="white">
            <rect x="5.5" y="5" width="169" height="239" rx="7" strokeWidth="2.2" />
            <rect x="9" y="8.5" width="162" height="232" rx="5" strokeWidth=".7" />
            <path
              d="M7 14Q30 3 57 12Q25 29 9 82ZM171 167Q159 195 132 199Q158 201 172 188Z"
              fill={`url(#${print}-stamps)`}
              stroke="none"
            />
            <path d="M9 72Q28 23 60 16M8 80Q30 25 66 16M172 159Q162 181 142 188M172 165Q162 186 142 191" />
          </g>
        </mask>
      </defs>
      <g className="fish-stationery">
        <path
          d="M8 57Q50 5 113 16q42 4 58 30v76Q146 62 85 61Q40 60 8 103Z"
          fill={`url(#${print})`}
        />
        <path
          d="M8 155q19 -24 53 -20q50 10 111 -29v51q-26 24 -79 19q-41 -5 -85 12Z"
          fill={`url(#${print})`}
        />
      </g>
      {id === 'whale-snack' && (
        <g className="fish-lines">
          <path d="M-10 74Q51 16 111 37t87 17M-8 80Q53 21 112 42t86 17" />
          <path d="M-6 166q9 -11 18 -7t17 0t17 0t17 0t17 0t17 0t17 0t17 0t17 0t17 0t17 0" />
        </g>
      )}
      {id === 'whale-token' && (
        <g className="fish-lines">
          <path d="M-4 84Q49 20 144 30M-8 89Q51 24 147 34" />
          <ellipse
            cx="87"
            cy="111"
            rx="98"
            ry="39"
            transform="rotate(-34 87 111)"
            strokeDasharray="2 4"
          />
          <path d="M135 143h33m-19 4h23m-10 4h12" />
        </g>
      )}
      {id === 'whale-dance' && (
        <g className="fish-lines">
          <path d="M-10 82q58 -64 146 -52M-8 88q59 -61 146 -52M-7 94q60 -59 147 -52" />
          <path d="M-8 151q45 18 101 6t99 -48m-200 48q48 18 104 5t99 -46" />
        </g>
      )}
      <g mask={`url(#${print}-foil)`}>
        <rect
          className="fish-pearl-foil"
          x="-180"
          y="-150"
          width="540"
          height="549"
          fill={`url(#${print}-pearl)`}
        />
      </g>
      <g className="fish-charms">
        <g transform="translate(28 58) rotate(-24)">
          <Accent id={id} />
        </g>
        <g transform="translate(156 143) rotate(21) scale(.66)">
          <Accent id={id} />
        </g>
      </g>
      <g fill="currentColor" className="fish-print-stars">
        <path d={star} transform="translate(154 56) scale(1.2)" />
        <path d={star} transform="translate(144 48) scale(.42)" />
        <path d={star} transform="translate(22 136) scale(.84)" />
        <path d={star} transform="translate(15 145) scale(.4)" />
        <circle cx="37" cy="39" r="1.6" />
        <circle cx="147" cy="153" r="1.7" />
      </g>
    </svg>
  );
}

function Pose({ pose, image, eyes }: { pose: string; image: string; eyes?: string }) {
  return (
    <div className={`fish-pose ${pose}`}>
      <img src={image} alt="" draggable={false} />
      {eyes && <img className="fish-eyes" src={eyes} alt="" draggable={false} />}
    </div>
  );
}

function FishProps({ id }: { id: FishId }) {
  return (
    <svg className="fish-props" viewBox="0 0 100 100" aria-hidden="true">
      {id === 'whale-token' && (
        <g className="fish-coin">
          <ellipse rx="4.6" ry="5.2" fill="#a76930" cy=".7" />
          <ellipse rx="4.6" ry="5" fill="#ffde7e" stroke="#a76b36" strokeWidth=".6" />
          <ellipse rx="3.4" ry="3.9" fill="none" stroke="#fff5bb" />
          <path d="M-2-1.6h4m-2 0v4" fill="none" stroke="#9b6430" strokeWidth=".85" />
        </g>
      )}
      {id === 'whale-headphones' && (
        <g fill="none" strokeWidth="1.4" strokeLinecap="round">
          <path className="fish-signal left" d="M20 30q-6 6-2 14m-1-18q-10 9-6 22" />
          <path className="fish-signal right" d="M76 29q7 5 6 13m-3-17q11 7 10 19" />
        </g>
      )}
      {id === 'whale-chef' && (
        <g
          className="fish-steam"
          fill="none"
          stroke="#fff8dc"
          strokeWidth="1.35"
          strokeLinecap="round"
        >
          <path d="M45 71c-7-5 5-7 0-13m5 13c-3-3 5-6 2-11m3 12c-2-3 4-4 4-7" />
        </g>
      )}
      {id === 'whale-nap' && (
        <g className="fish-dream" fill="#ffefb6" stroke="#977caa" strokeWidth=".55">
          <circle cx="-7" cy="9" r="1.3" />
          <circle cx="-4" cy="5" r="2" />
          <path d="M2-9a8 8 0 1 0 8 11A8 8 0 0 1 2-9Z" />
          <path d={star} transform="translate(9 -5) scale(.37)" />
        </g>
      )}
    </svg>
  );
}

export function FishArt({
  id,
  card,
  motion,
}: {
  id: FishId;
  card: CardDesign;
  motion: Ref<SVGFEDisplacementMapElement>;
}) {
  const print: FishPrint = fishPrints[id];
  return (
    <>
      <div className="fish-paper" />
      <div className="fish-window" />
      <FishScene id={id} />
      <div className="fish-edition" aria-hidden="true">
        <svg viewBox="-26 -15 52 28">
          <path d={tail} fill="currentColor" />
        </svg>
        <span>DF / {print.number}</span>
      </div>
      <div className="fish-floor" />
      <div className="fish-follow">
        <div className="fish-actor" role="img" aria-label={card.alt}>
          {hasPortraitRig(id) ? (
            <FishPortrait id={id} art={card.art} motion={motion} />
          ) : (
            <Pose pose="fish-idle" image={print.face ?? card.art} eyes={print.eyes} />
          )}
          {print.alternate && (
            <Pose pose="fish-action" image={print.alternate} eyes={print.alternateEyes} />
          )}
          {id === 'whale-dance' && <Pose pose="fish-hop" image={danceHop} />}
        </div>
        {id !== 'whale-snack' && id !== 'whale-dance' && <FishProps id={id} />}
      </div>
      {id === 'whale-dance' && (
        <div className="fish-dance-spark" aria-hidden="true">
          ✦
        </div>
      )}
    </>
  );
}

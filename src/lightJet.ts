import { SpringValue } from './spring';
// SVG light jet from prism-holo-pack (MIT), adapted to the measured meadow pack.
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
export const RAINBOW_PALETTE = [
  '#ff3d6e',
  '#ff8a3d',
  '#ffd34d',
  '#4fd9a0',
  '#4fb2ff',
  '#8b6cff',
  '#ff5cc8',
];
export const GOLD_PALETTE = ['#ffc45b', '#ffdf89', '#f7b239', '#fff0bc', '#ffd266', '#ffedaa'];
const RIBBON_COUNT = 32;
const JET_ORIGIN_Y = 107.5;
const JET_SPAN = 1500;
const JET_TIP = 36;

interface JetEdge {
  ox: number;
  x: number;
  ux: number;
  uy: number;
  phase: number;
  r: number;
}
interface Ribbon {
  midX: number;
  gradX: number;
  r: number;
  maxLen: number;
  color: string;
  active: boolean;
  len: number;
  growth: SpringValue;
}
interface Mote {
  el: Element;
  bandIdx: number;
  u: number;
  v: number;
  speed: number;
  radius: number;
}

export function createLightJet(lightJet: SVGSVGElement, palette = RAINBOW_PALETTE) {
  const isCoarsePointer = matchMedia('(pointer: coarse)').matches;
  let packWidth = 0;
  let layoutWidth = 0;
  let packHeight = 0;
  let mouthTop = 0;
  let progress = 0;
  let direction = 1;
  let openedAtSec: number | null = null;
  let glow = new SpringValue(0, 0.5);
  let initialized = false;
  const seamY = 10.6;
  const JET_STEP = isCoarsePointer ? 3.5 : 2.5;

  let jetEdges: JetEdge[] = [];
  let jetRibbons: Ribbon[] = [];
  let jetMotes: Mote[] = [];
  let bandPaths: Element[] = [];
  let seamPaths: Element[] = [];
  let fadeStops: Element[] = [];
  let jetReach = 0;
  let jetDrained = false;
  let jetStartY = 62.5;
  let jetRadius0 = 45;

  const lightenHex = (hex: string, ratio: number) =>
    '#' +
    [1, 3, 5]
      .map((i) =>
        Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - ratio) + 255 * ratio)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('');

  function initLightJet() {
    const colorOffset = Math.floor(rand(0, palette.length));
    const unit = packWidth / 100;
    jetStartY = 62.5 + (((19.5 - seamY) / 100) * packHeight) / unit;
    jetRadius0 = JET_ORIGIN_Y - jetStartY;

    jetEdges = Array.from({ length: RIBBON_COUNT + 1 }, (_, j) => {
      const ox = 3 + (94 * j) / RIBBON_COUNT;
      const x = 50 + ((ox - 50) * jetRadius0) / 45;
      const angle = Math.atan2(x - 50, jetRadius0) + rand(-0.012, 0.012);
      return {
        ox,
        x,
        ux: Math.sin(angle),
        uy: -Math.cos(angle),
        phase: j * 0.35 + rand(-0.1, 0.1),
        r: Math.hypot(x - 50, jetRadius0),
      };
    });

    jetRibbons = Array.from({ length: RIBBON_COUNT }, (_, j) => {
      const r = (jetEdges[j].r + jetEdges[j + 1].r) / 2;
      return {
        midX: (jetEdges[j].ox + jetEdges[j + 1].ox) / 2,
        gradX: (jetEdges[j].x + jetEdges[j + 1].x) / 2,
        r,
        maxLen: 0,
        color: palette[(j + colorOffset) % palette.length],
        active: false,
        len: 0,
        growth: new SpringValue(0, 0.4, 0.3),
      };
    });

    lightJet.innerHTML = `<defs>
    <radialGradient id="jetMote"><stop offset=".2" stop-color="#fff"/><stop offset=".45" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    ${jetRibbons
      .map((b, j) => {
        const ux = (jetEdges[j].ux + jetEdges[j + 1].ux) / 2;
        const uy = (jetEdges[j].uy + jetEdges[j + 1].uy) / 2;
        const hotDist = 26 + jetStartY - 62.5;
        return `<linearGradient id="jb${j}" gradientUnits="userSpaceOnUse" x1="${b.gradX.toFixed(2)}" y1="${jetStartY}" x2="${(b.gradX + ux * hotDist).toFixed(2)}" y2="${(jetStartY + uy * hotDist).toFixed(2)}"><stop stop-color="${lightenHex(b.color, 0.7)}"/><stop offset="1" stop-color="${b.color}"/></linearGradient>`;
      })
      .join('')}
    <radialGradient id="jetFadeGrad" gradientUnits="userSpaceOnUse" cx="50" cy="${jetStartY + jetRadius0}" r="${JET_SPAN}">
      <stop stop-color="#fff" stop-opacity="0"/><stop stop-color="#fff"/><stop stop-color="#fff"/><stop stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <mask id="jetFadeMask" maskUnits="userSpaceOnUse"><rect fill="url(#jetFadeGrad)"/></mask>
    <filter id="jetBloom" filterUnits="userSpaceOnUse"><feGaussianBlur stdDeviation="2.4"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <g${isCoarsePointer ? '' : ' filter="url(#jetBloom)"'}>
    <g${isCoarsePointer ? '' : ' mask="url(#jetFadeMask)"'}>
      ${jetRibbons.map((_, j) => `<path class="jet-band" fill="url(#jb${j})"/>`).join('')}
      ${isCoarsePointer ? '' : `<g fill="none" stroke="#fff" stroke-opacity=".68" stroke-width=".4">${'<path class="jet-seam"/>'.repeat(RIBBON_COUNT + 1)}</g>`}
      ${'<circle class="jet-spark" fill="url(#jetMote)"/>'.repeat(10)}
    </g>
  </g>`;

    bandPaths = [...lightJet.querySelectorAll('.jet-band')];
    seamPaths = [...lightJet.querySelectorAll('.jet-seam')];
    fadeStops = [...lightJet.querySelectorAll('#jetFadeGrad stop')];
    jetMotes = [...lightJet.querySelectorAll('.jet-spark')].map((el) => ({
      el,
      bandIdx: -1,
      u: Math.random(),
      v: rand(0.2, 0.8),
      speed: rand(0.3, 0.5),
      radius: rand(1.6, 3.0),
    }));

    fitLightJetBounds();
  }

  function fitLightJetBounds() {
    const unit = packWidth / 100;
    const topRoom = 2.5 + mouthTop / unit;
    const halfSpanW = Math.min(window.innerWidth / 2 / unit, topRoom * 1.2 + 60) + 20;
    jetReach = (45 + topRoom) * Math.hypot(47 / 45, 1) + JET_TIP + 20;
    for (const b of jetRibbons) b.maxLen = jetReach - b.r;

    const bbox = {
      x: 50 - halfSpanW,
      y: 32.5 - topRoom,
      width: 2 * halfSpanW,
      height: topRoom + 60,
    };
    for (const el of lightJet.querySelectorAll('#jetFadeMask, #jetFadeMask rect, #jetBloom')) {
      for (const [k, val] of Object.entries(bbox)) el.setAttribute(k, val.toFixed(1));
    }
  }

  function stepLightJet(dt: number, clockSec: number) {
    const animT = clockSec;
    const tipX = direction > 0 ? progress * 100 : 100 - progress * 100;
    const sway = Math.sin(animT * 0.9) * 1.5;
    const released = openedAtSec !== null;
    const elapsed = clockSec - (openedAtSec ?? clockSec);
    const unit = packWidth / 100;
    const screenRoof = 60 - mouthTop / unit;
    const fullThrow =
      ((jetStartY + jetRadius0 - screenRoof) * jetRibbons[0].r) / jetRadius0 + JET_TIP + 20;
    const farDist = released
      ? jetReach + (fullThrow - jetReach) * (1 - Math.pow(1 - Math.min(1, elapsed / 0.5), 2))
      : jetReach;
    const tailDist =
      jetRadius0 -
      5 +
      (released
        ? (fullThrow + 21 - jetRadius0) * Math.pow(clamp((elapsed - 0.35) / 0.55, 0, 1), 2)
        : 0);
    const waveCarry = released ? (45 * elapsed * elapsed) / (elapsed + 0.25) : 0;

    for (const b of jetRibbons) {
      if (!released && progress > 0) {
        const inside = direction > 0 ? b.midX < tipX : b.midX > tipX;
        b.active = inside || b.active;
      }
      b.growth.to = b.active ? 1 : 0;
      b.len = b.maxLen * Math.max(0, b.growth.x) + farDist - jetReach;
    }

    if (!isCoarsePointer) {
      [tailDist - 16, tailDist, farDist - JET_TIP, farDist].forEach((val, idx) => {
        fadeStops[idx]?.setAttribute(
          'offset',
          clamp(Math.min(val, farDist) / JET_SPAN, 0, 1).toFixed(4),
        );
      });
    }

    const pointAlongEdge = (edgeIdx: number, dist: number) => {
      const e = jetEdges[edgeIdx];
      const k = Math.min(1, dist / 90);
      const wave =
        (0.4 + 2 * k) * Math.sin(((dist - waveCarry) / 22 - animT * 1.4) * Math.PI * 2 + e.phase) +
        sway * k;
      return [e.x + e.ux * dist - e.uy * wave, jetStartY + e.uy * dist + e.ux * wave];
    };

    const leadPad = isCoarsePointer ? 0 : 20;
    const maxSide = window.innerWidth / 2 / unit + 14;
    const snap = (n: number) => Math.round(n * 20) / 20;

    const sampledEdges = jetEdges.map((e, j) => {
      const stopLimit =
        Math.min(
          (jetStartY - screenRoof) / -e.uy,
          (maxSide - Math.abs(e.x - 50)) / Math.abs(e.ux),
        ) + 24;
      const len = Math.min(
        Math.max(jetRibbons[j - 1]?.len || 0, jetRibbons[j]?.len || 0),
        stopLimit,
      );
      const iStart = Math.max(0, Math.floor((tailDist - leadPad - e.r) / JET_STEP));
      const pts = [];
      if (len > iStart * JET_STEP) {
        for (let i = iStart; ; i++) {
          const d = Math.min(i * JET_STEP, len);
          const [px, py] = pointAlongEdge(j, d);
          pts.push(`${snap(px)} ${snap(py)}`);
          if (d >= len) break;
        }
      }
      return { iStart, pts };
    });

    const slicePts = (edgeObj: { pts: string[]; iStart: number }, len: number) =>
      edgeObj.pts.slice(0, Math.max(0, Math.ceil(len / JET_STEP) - edgeObj.iStart + 1));

    jetRibbons.forEach((b, j) => {
      const leftPts = slicePts(sampledEdges[j], b.len);
      const rightPts = slicePts(sampledEdges[j + 1], b.len);
      bandPaths[j].setAttribute(
        'd',
        leftPts.length > 1 && rightPts.length > 1
          ? `M${leftPts.join('L')}L${rightPts.slice().reverse().join('L')}Z`
          : '',
      );
    });

    seamPaths.forEach((el, j) => {
      el.setAttribute(
        'd',
        sampledEdges[j].pts.length > 1 ? `M${sampledEdges[j].pts.join('L')}` : '',
      );
    });

    jetDrained = released && elapsed > 0.92;

    const activeIndices = jetRibbons.flatMap((b, j) => (b.active ? [j] : []));
    for (const m of jetMotes) {
      m.u += dt * m.speed;
      if (m.u > 1 || !jetRibbons[m.bandIdx]?.active) {
        if (m.u > 1) m.u -= 1;
        if (!activeIndices.length) {
          m.el.setAttribute('opacity', '0');
          continue;
        }
        m.bandIdx = activeIndices[Math.floor(rand(0, activeIndices.length))];
      }
      const len = jetRibbons[m.bandIdx].len;
      const d0 = Math.max(0, tailDist - jetEdges[m.bandIdx].r);
      const dist = d0 + m.u * (len - d0);
      const [x1, y1] = pointAlongEdge(m.bandIdx, dist);
      const [x2, y2] = pointAlongEdge(m.bandIdx + 1, dist);
      m.el.setAttribute('cx', (x1 + (x2 - x1) * m.v).toFixed(2));
      m.el.setAttribute('cy', (y1 + (y2 - y1) * m.v).toFixed(2));
      m.el.setAttribute('r', (m.radius * (0.6 + m.u * 0.7)).toFixed(2));
      m.el.setAttribute('opacity', (Math.sin(Math.PI * m.u) * Math.min(1, len / 20)).toFixed(2));
    }
  }

  function position(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    const stage = lightJet.parentElement!.getBoundingClientRect();
    layoutWidth = element.offsetWidth;
    packWidth = rect.width;
    packHeight = rect.height;
    mouthTop = rect.top + (rect.height * seamY) / 100;
    Object.assign(lightJet.style, {
      width: rect.width + 'px',
      height: rect.width * 0.76 + 'px',
      left: rect.left - stage.left + 'px',
      top: mouthTop - stage.top - rect.width * 0.6 + 'px',
    });
    if (!initialized) {
      initLightJet();
      initialized = true;
    } else fitLightJetBounds();
  }

  function clear() {
    initialized = false;
    openedAtSec = null;
    progress = 0;
    jetDrained = false;
    glow = new SpringValue(0, 0.5);
    lightJet.style.opacity = '0';
    lightJet.replaceChildren();
  }

  return {
    tear(element: HTMLElement, p: number, dir: number, advance: number) {
      if (!initialized || Math.abs(layoutWidth - element.offsetWidth) > 0.5) position(element);
      direction = dir;
      progress = p;
      for (const band of jetRibbons) {
        if (advance > 0 && band.active) band.growth.v += advance * 6;
      }
    },
    release() {
      if (openedAtSec === null) {
        progress = 0;
        for (const band of jetRibbons) band.active = false;
      }
    },
    open(element: HTMLElement) {
      position(element);
      openedAtSec = performance.now() / 1000;
      // A tap or keyboard activation can complete the seal in one frame.
      for (const band of jetRibbons) band.active = true;
    },
    step(dt: number, now: number) {
      if (!initialized) return false;
      glow.to = progress > 0 || openedAtSec !== null ? 1 : 0;
      const substeps = Math.max(1, Math.ceil(dt * 240));
      for (let i = 0; i < substeps; i++) {
        glow.step(dt / substeps);
        for (const band of jetRibbons) band.growth.step(dt / substeps);
      }
      if (jetDrained || (!glow.to && glow.x < 0.003)) {
        clear();
        return false;
      }
      lightJet.style.opacity = glow.x.toFixed(3);
      stepLightJet(dt, now / 1000);
      return true;
    },
    clear,
  };
}

// Torn edge and cascaded foil curl from prism-holo-pack (MIT).
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const polyFromPoints = (points: number[][]) =>
  `polygon(${points.map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`).join(',')})`;
const mirrorPointsX = (points: number[][]) => points.map(([x, y]) => [100 - x, y]);
const TEAR_SEGMENTS = 96,
  TEAR_MIN_Y = 8,
  TEAR_MAX_Y = 19.5;

export function createSeal(pack: HTMLElement, gold = false) {
  const notched = gold || ['rider', 'rice', 'english'].includes(pack.dataset.pack ?? '');
  const body = pack.querySelector<HTMLElement>('.pack-body')!;
  const lip = pack.querySelector<HTMLElement>('.foil-lip')!;
  const tearFlap = pack.querySelector<HTMLElement>('.pack-seal')!;
  const stripSegments = Array.from(
    tearFlap.querySelectorAll<HTMLElement>('.strip-segment'),
    (el) => ({
      el,
      frontEl: el.firstElementChild as HTMLElement,
      liningEl: el.lastElementChild as HTMLElement,
    }),
  );
  const STRIP_SLICES = stripSegments.length;
  let tearVertices: number[][] = [];
  let curlTightness = 1;

  function applyVertexBend(vert: number[], bendOffset: number) {
    vert[5] = bendOffset;
    vert[1] = clamp(vert[2] + bendOffset, TEAR_MIN_Y, TEAR_MAX_Y) + vert[3];
  }

  function generateTearLine() {
    curlTightness = rand(0.7, 1.38);
    const slope = rand(-7.0, 7.0);
    const arch = rand(-2.8, 2.8);
    const waveFreq = rand(1.6, 3.4);
    const wavePhase = rand(0, Math.PI * 2);
    const waveAmp = rand(0.3, 1.05);
    const startY = rand(10.6, 13.8);
    let drift = 0;

    tearVertices = Array.from({ length: TEAR_SEGMENTS + 1 }, (_, i) => {
      const x = (i / TEAR_SEGMENTS) * 100;
      const normX = x / 50 - 1;
      drift = clamp(
        drift + rand(-0.24, 0.24) + (Math.random() < 0.05 ? rand(-1.4, 1.4) : 0),
        -2.1,
        2.1,
      );
      const px = i > 0 && i < TEAR_SEGMENTS ? x + rand(-0.28, 0.28) : x;
      const baseY =
        startY +
        slope * normX +
        arch * (1 - normX * normX) +
        waveAmp * Math.sin(normX * waveFreq * Math.PI + wavePhase) +
        drift;
      const microTooth = rand(-0.4, 0.4) + (Math.random() < 0.14 ? rand(-1.15, 1.15) : 0);
      const lipWidth = Math.random() < 0.12 ? rand(1.2, 2.05) : rand(0.36, 1.08);
      // Align the ends with the die-cut notches on the pillow pouches. The
      // interior still follows the original tear line and pointer steering.
      const edgeBlend = notched ? Math.min(1, x / 7, (100 - x) / 7) : 1;
      const v = [px, 0, 12.06 + (baseY - 12.06) * edgeBlend, microTooth * edgeBlend, lipWidth, 0];
      applyVertexBend(v, 0);
      return v;
    });
  }

  function tearYAt(xPercent: number) {
    const f = (clamp(xPercent, 0, 100) / 100) * TEAR_SEGMENTS;
    const idx = Math.min(TEAR_SEGMENTS - 1, Math.floor(f));
    return tearVertices[idx][1] + (tearVertices[idx + 1][1] - tearVertices[idx][1]) * (f - idx);
  }

  function steerRemainingTear(steerSlope: number, progress: number, dir: number) {
    const pivotIdx = clamp(
      Math.round((dir > 0 ? progress : 1 - progress) * TEAR_SEGMENTS),
      0,
      TEAR_SEGMENTS,
    );
    for (let i = pivotIdx + dir; i >= 0 && i <= TEAR_SEGMENTS; i += dir) {
      const dist = (Math.abs(i - pivotIdx) * 100) / TEAR_SEGMENTS;
      applyVertexBend(tearVertices[i], tearVertices[pivotIdx][5] + steerSlope * dist);
    }
  }

  function draw(p: number, d: number, velocity: number, dy: number) {
    const packWidth = pack.offsetWidth;
    const clockSec = performance.now() / 1000;
    const tipX = d > 0 ? p * 100 : 100 - p * 100;
    const tipY = tearYAt(tipX);
    const tipVert = [tipX, tipY, 0, 0, 0];

    const tornPart = tearVertices.filter(([x]) => (d > 0 ? x < tipX : x > tipX));
    const bodyPoly =
      d > 0
        ? [[tipX, 0], [100, 0], [100, 100], [0, 100], ...tornPart, [tipX, tipY]]
        : [[0, 0], [tipX, 0], [tipX, tipY], ...tornPart, [100, 100], [0, 100]];

    body.style.clipPath = p ? polyFromPoints(bodyPoly) : '';
    const edge = d > 0 ? [...tornPart, tipVert] : [tipVert, ...tornPart];
    lip.style.visibility = p > 0 ? 'visible' : 'hidden';
    lip.style.clipPath = polyFromPoints([
      ...edge,
      ...edge
        .slice()
        .reverse()
        .map(([x, y, , , thickness]) => [x, y + thickness]),
    ]);
    tearFlap.style.transform = `rotateZ(${d * (6 + 14 * p + clamp(-dy * 0.16, -6, 22))}deg) rotateX(${-(8 + 22 * p) - clamp(-dy * 0.2, 0, 24)}deg)`;
    tearFlap.style.transformOrigin = `${tipX}% ${tipY}%`;
    const sliceW = 100 / STRIP_SLICES;
    const seamOverlap = 0.25;

    stripSegments.forEach((seg, idx) => {
      const lo = d > 0 ? idx * sliceW : Math.max(idx * sliceW, tipX);
      const hi = d > 0 ? Math.min((idx + 1) * sliceW, tipX) : (idx + 1) * sliceW;
      if (hi <= lo) {
        seg.el.hidden = true;
        return;
      }
      seg.el.hidden = false;
      const leftEdge = d < 0 && lo === tipX ? lo : Math.max(0, lo - seamOverlap);
      const rightEdge = d > 0 && hi === tipX ? hi : Math.min(100, hi + seamOverlap);
      const span = [
        [leftEdge, tearYAt(leftEdge), 0, 0, 0.8],
        ...tearVertices.filter((q) => q[0] > leftEdge && q[0] < rightEdge),
        [rightEdge, tearYAt(rightEdge), 0, 0, 0.8],
      ];
      const flapPoly = [[leftEdge, 0], [rightEdge, 0], ...span.slice().reverse()];
      seg.frontEl.style.clipPath = polyFromPoints(flapPoly);
      seg.liningEl.style.clipPath = polyFromPoints(mirrorPointsX(flapPoly));
    });

    const activeSlice = clamp(
      Math.floor((d > 0 ? tipX - 1e-6 : tipX) / sliceW),
      0,
      STRIP_SLICES - 1,
    );
    const curlBase = (2.6 + 2.6 * p) * curlTightness;
    const flutter = Math.min(1, Math.abs(velocity) * 0.4) * 1.6;
    let matrixChain = '';
    let totalAngle = 0;

    for (let n = 0, k = activeSlice; k >= 0 && k < STRIP_SLICES; n++, k -= d) {
      const hingePx = (((n ? (d > 0 ? k + 1 : k) * sliceW : tipX) / 100) * packWidth).toFixed(2);
      const hingeAngle = curlBase * (0.4 + 0.3 * n);
      const degY = d * (hingeAngle + Math.sin(clockSec * 16 + n * 0.9) * flutter);
      const degZ = (d * 0.9 * n) / 4;
      totalAngle += degY;
      matrixChain += `translateX(${hingePx}px) rotateY(${degY.toFixed(2)}deg) rotateZ(${degZ.toFixed(2)}deg) translateX(-${hingePx}px) `;

      const seg = stripSegments[k];
      seg.el.style.transform = matrixChain;
      seg.el.style.setProperty(
        '--curl-shade',
        Math.min(0.5, Math.abs(totalAngle) / 200).toFixed(2),
      );
    }
  }

  generateTearLine();
  return { draw, steer: steerRemainingTear, tearYAt };
}

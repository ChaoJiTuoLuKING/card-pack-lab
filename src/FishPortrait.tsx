import { useId, type Ref } from 'react';

// The displacement maps use the portrait's original 100 × 100 coordinate space.
// Neutral grey pins the paper in place. Soft elliptical weights move only the
// painted head, hand or plush, keeping the seated silhouette anchored.
function mapFor(zones: readonly (readonly [number, number, number, number, string])[]) {
  const gradients = zones
    .map(
      (zone, i) =>
        `<radialGradient id="g${i}"><stop offset=".22" stop-color="${zone[4]}"/><stop offset="1" stop-color="${zone[4]}" stop-opacity="0"/></radialGradient>`,
    )
    .join('');
  const fields = zones
    .map(
      ([cx, cy, rx, ry], i) =>
        `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#g${i})"/>`,
    )
    .join('');
  const map = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs>${gradients}</defs><rect width="100" height="100" fill="#808080"/>${fields}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(map)}`;
}

const maps = {
  'shake-bag': mapFor([
    [51, 72, 26, 18, '#ef9980'], // foil bag and both gripping hands move together
    [50, 58, 16, 7, '#d59680'],
  ]),
  'word-nod': mapFor([
    [49, 28, 33, 31, '#784280'], // lower the chin, with the feet and sweater pinned
    [64, 34, 11, 19, '#745980'],
  ]),
  'whale-headphones': mapFor([
    [49, 35, 39, 43, '#247080'], // head leans towards the listening ear
    [29, 48, 15, 17, '#3fb280'], // palm presses the ear cup
    [61, 67, 17, 18, '#9d9e80'], // notebook counterbalances the lean
  ]),
  'whale-chef': mapFor([
    [47, 30, 29, 33, '#6a5780'], // lean in to taste
    [38, 49, 20, 14, '#35ef80'], // raise the spoon and wrist together
    [51, 74, 14, 9, '#808a80'],
  ]),
  'whale-nap': mapFor([
    [43, 37, 34, 38, '#b11a80'], // cheek settles into the plush
    [41, 58, 25, 13, '#984580'], // arms tuck in
    [23, 71, 20, 15, '#497280'], // whale nose gently squashes inwards
  ]),
};

export type PortraitId = keyof typeof maps;
export function hasPortraitRig(id: string): id is PortraitId {
  return Object.hasOwn(maps, id);
}

export function FishPortrait({
  id,
  art,
  motion,
}: {
  id: PortraitId;
  art: string;
  motion: Ref<SVGFEDisplacementMapElement>;
}) {
  const filter = useId();
  return (
    <svg className="fish-pose fish-idle" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <filter
          id={filter}
          x="0"
          y="0"
          width="100"
          height="100"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feImage href={maps[id]} x="0" y="0" width="100" height="100" result="weights" />
          <feDisplacementMap
            ref={motion}
            in="SourceGraphic"
            in2="weights"
            scale="0"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
      <image href={art} width="100" height="100" filter={`url(#${filter})`} />
    </svg>
  );
}

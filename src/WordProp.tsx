// Each prop is drawn in the same small print area beside the character's hands.
// The moving piece keeps its own pivot so the rest of the illustration stays still.
const props = {
  peel: (
    <>
      <path fill="#fff0ad" d="M12 50Q47 62 57 10Q63 7 64 14Q64 61 30 66Q16 66 12 50Z" />
      <path
        className="prop-piece"
        fill="#ffcf55"
        d="M13 50Q45 63 59 17L61 18Q57 60 32 69Q15 71 13 50Z"
      />
    </>
  ),
  slice: (
    <>
      <path fill="#edb87d" d="M6 33Q0 21 15 18L28 20Q41 25 32 35L29 59L5 55Z" />
      <path
        className="prop-piece"
        fill="#ffe5aa"
        d="M22 35Q16 22 30 20L43 22Q57 27 48 38L45 61L21 57Z"
      />
    </>
  ),
  share: (
    <>
      <ellipse cx="29" cy="56" rx="26" ry="5" fill="#dfebea" />
      <g className="prop-piece">
        <path fill="#f7cd83" d="M12 32L46 35V53L12 50Z" />
        <path fill="#fff2e4" d="M12 32L30 20L46 35L12 36Z" />
        <path stroke="#c76e77" d="M14 43L44 46" />
        <circle cx="30" cy="26" r="5" fill="#e98185" />
      </g>
    </>
  ),
  unwrap: (
    <>
      <path fill="#efb892" d="M12 35L53 33L52 62L14 63Z" />
      <path fill="#5b9b93" d="M27 35L34 35L35 62L28 63Z" />
      <g className="prop-piece">
        <path fill="#fae1b3" d="M9 26L55 24L56 35L9 38Z" />
        <path fill="#9bc2b1" d="M31 26Q6 23 18 14Q25 11 31 24Q40 6 46 15Q50 22 31 26Z" />
      </g>
    </>
  ),
  whisper: (
    <g className="prop-piece" fill="none" stroke="#927044" strokeWidth="4">
      <path d="M16 37l9-5m-7 14 13 1m-16 8 9 5" />
    </g>
  ),
  float: (
    <>
      <path fill="none" stroke="#72a8b2" d="M2 51q11-4 20 0t20 0t18 0M9 58q8-3 15 0t17 0" />
      <g className="prop-piece">
        <path fill="#9cbf78" d="M12 41Q16 22 50 27Q43 50 12 41Z" />
        <path fill="none" stroke="#587955" d="M10 43l29-11" />
      </g>
    </>
  ),
};

export function hasWordProp(word: string): word is keyof typeof props {
  return Object.hasOwn(props, word);
}

export function WordProp({ word }: { word: keyof typeof props }) {
  return (
    <svg
      className="word-prop"
      viewBox="0 0 72 72"
      fill="none"
      stroke="#6a5145"
      strokeWidth="2"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {props[word]}
    </svg>
  );
}

import { useId } from 'react';
import raised from './assets/whale-dance-hop.webp';
import standing from './assets/whale-dance.webp';

// Use the planted feet from the standing print and articulate the sweater sleeves
// from the raised-hand print about their shoulder seams.
export function StretchPortrait() {
  const id = useId();
  const raisedPrint = '#' + id + '-raised';
  const clip = (name: string) => `url(#${id}-${name})`;
  return (
    <svg viewBox="-5 -8 360 360" aria-hidden="true">
      <defs>
        <image id={id + '-raised'} href={raised} width="350" height="350" />
        <clipPath id={id + '-legs'}>
          <path d="M138 257L163 265 145 296 119 331 88 328 93 293Z M174 267L201 270 199 297 207 349 156 349 168 308Z" />
        </clipPath>
        <path
          id={id + '-sleeve-shape'}
          d="M172 152Q187 157 201 168L220 175 237 168 253 176 251 202 228 214Q202 217 177 191Z"
        />
        <clipPath id={id + '-low-sleeve'}>
          <use href={'#' + id + '-sleeve-shape'} />
        </clipPath>
        <mask id={id + '-body'} maskUnits="userSpaceOnUse" x="0" y="0" width="350" height="350">
          <rect width="350" height="350" fill="white" />
          <use href={'#' + id + '-sleeve-shape'} fill="black" />
          <path
            fill="black"
            d="M121 239Q143 242 178 229L174 248Q173 253 181 255L197 274 198 306H117V256Z"
          />
        </mask>
        <clipPath id={id + '-arm'}>
          <path d="M67 88L91 78 101 87 104 101Q110 124 131 145L140 154 126 168Q109 162 93 140L79 117 68 111Z" />
        </clipPath>
      </defs>
      <g transform="translate(-7 -39)">
        <g clipPath={clip('legs')}>
          <image href={standing} width="350" height="350" />
        </g>
      </g>
      <g className="stretch-upper">
        <g>
          <use href={raisedPrint} mask={clip('body')} />
          <g clipPath={clip('low-sleeve')}>
            <use href={raisedPrint} transform="translate(307 0) scale(-1 1)" />
          </g>
        </g>
        <g className="stretch-arm">
          <g transform="translate(313 0) scale(-1 1)">
            <g clipPath={clip('arm')}>
              <use href={raisedPrint} />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}

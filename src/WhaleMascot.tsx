import { useId } from 'react';
import snack from './assets/whale-snack.webp';
import guard from './assets/whale-pack-guard.webp';
import caught from './assets/whale-pack-caught.webp';

// The shapes trace the two printed cels in their original 640 × 640 coordinates.
// Moving just the irises inside the eye openings preserves the inked upper lashes.
const poses = {
  idle: {
    image: snack,
    irises:
      'M260 251Q271 246 284 250Q292 253 292 268Q292 282 280 284Q266 286 261 275Q255 262 260 251Z M349 248Q361 243 375 247Q385 251 383 266Q380 280 366 281Q352 281 348 270Q344 258 349 248Z',
    openings:
      'M248 256Q263 244 283 251Q293 254 293 269Q290 285 277 284Q255 285 248 256Z M342 250Q361 241 381 248L392 252Q387 280 368 282Q347 283 342 265Z',
    lids: 'M233 254Q248 244 250 238Q268 242 282 242L297 264Q300 284 279 287Q254 288 244 269Z M338 250Q344 236 374 237L382 234Q389 244 403 249L393 262Q390 282 369 284Q344 284 343 267Z',
    lashes: 'M246 264Q268 282 290 267 M346 263Q368 278 393 258',
  },
  guard: {
    image: guard,
    irises:
      'M260 259Q276 259 293 263Q299 288 280 288Q260 290 260 259Z M350 258Q368 253 385 254Q386 281 371 284Q347 288 350 258Z',
    openings:
      'M247 259Q269 258 293 263Q297 288 279 288Q256 291 247 259Z M347 259Q366 254 395 254Q390 282 369 285Q346 286 347 259Z',
    lids: 'M230 250Q241 253 246 245Q264 252 292 256L299 271Q298 289 280 290Q250 291 241 269Z M339 262Q345 251 360 248L383 245L386 241Q393 250 410 245L399 262Q389 286 369 287Q344 289 344 268Z',
    lashes: 'M247 269Q270 286 293 268 M348 265Q368 280 395 260',
  },
};

function LookingPose({ pose }: { pose: keyof typeof poses }) {
  const id = useId();
  const { image, irises, openings, lids, lashes } = poses[pose];
  return (
    <svg className={`whale-cel whale-${pose}`} viewBox="0 0 640 640" aria-hidden="true">
      <defs>
        <image id={`${id}-art`} href={image} width="640" height="640" />
        <clipPath id={`${id}-irises`}>
          <path d={irises} />
        </clipPath>
        <clipPath id={`${id}-openings`}>
          <path d={openings} />
        </clipPath>
        <linearGradient id={`${id}-skin`} x2="0" y2="1">
          <stop stopColor="#ffc5a8" />
          <stop offset=".8" stopColor="#ffdfc7" />
        </linearGradient>
      </defs>
      <use href={`#${id}-art`} />
      <path d={irises} fill="#fff2e7" />
      <g clipPath={`url(#${id}-openings)`}>
        <g className="whale-irises">
          <use href={`#${id}-art`} clipPath={`url(#${id}-irises)`} />
        </g>
      </g>
      <g className="whale-lids">
        <path d={lids} fill={`url(#${id}-skin)`} />
        <path d={lashes} stroke="#40202c" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function WhaleMascot() {
  return (
    <div className="pack-mascot whale-pack-mascot" aria-hidden="true">
      <LookingPose pose="idle" />
      <LookingPose pose="guard" />
      <img className="whale-cel whale-caught" alt="" src={caught} draggable={false} />
      <i className="mascot-eyes" />
      <i className="whale-snack-zone" />
    </div>
  );
}

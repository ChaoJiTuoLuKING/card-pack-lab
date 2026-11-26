import { useId, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import displacement from './assets/rider-rice-displacement.png';

export function RiderRiceOffer({ art }: { art: string }) {
  const root = useRef<HTMLDivElement>(null);
  const warp = useRef<SVGFEDisplacementMapElement>(null);
  const accept = useRef<() => void>(() => {});
  const filterId = useId();

  useLayoutEffect(() => {
    const el = root.current!;
    const field = warp.current!;
    const pose = { reach: 0 };
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let timeline: gsap.core.Timeline | undefined;
    let serving = false;

    function draw() {
      // The field is registered to the illustration. The sleeves travel with the
      // rim, while the nose tips farther down than the saddle or the rider's face.
      field.setAttribute('scale', String(20 * pose.reach));
      el.style.setProperty('--reach', String(pose.reach));
    }

    function play(receive: boolean) {
      if (serving || (!receive && reduced.matches)) return;
      timeline?.kill();
      serving = receive;
      el.dataset.offer = receive ? 'serving' : 'inviting';
      timeline = gsap.timeline({
        onUpdate: draw,
        onComplete: () => {
          serving = false;
          delete el.dataset.offer;
        },
      });
      const reach = receive ? (reduced.matches ? 0.22 : 1) : 0.22;
      timeline
        .to(
          pose,
          { reach, duration: receive ? 0.52 : 0.32, ease: 'power2.inOut' },
          receive ? 0 : 0.24,
        )
        .to(
          pose,
          { reach: 0, duration: receive ? 0.48 : 0.34, ease: 'sine.inOut' },
          receive ? '+=0.55' : '+=0.16',
        );
    }

    accept.current = () => play(true);
    play(false);
    return () => {
      timeline?.kill();
      accept.current = () => {};
    };
  }, []);

  return (
    <div ref={root} className="rider-rice-offer">
      <div className="rider-offer-art" aria-hidden="true">
        <svg className="rider-offer-pose" viewBox="0 0 480 351" preserveAspectRatio="none">
          <defs>
            <filter
              id={filterId}
              filterUnits="userSpaceOnUse"
              primitiveUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="480"
              height="351"
              colorInterpolationFilters="sRGB"
            >
              <feImage href={displacement} x="0" y="0" width="480" height="351" result="motion" />
              <feDisplacementMap
                ref={warp}
                in="SourceGraphic"
                in2="motion"
                scale="0"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
          <image
            href={art}
            width="480"
            height="351"
            preserveAspectRatio="none"
            filter={`url(#${filterId})`}
          />
        </svg>
        <i className="rider-rice-steam" />
      </div>
      <button
        type="button"
        className="rider-receive"
        aria-label="接她递来的饭"
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') accept.current();
        }}
        onClick={() => accept.current()}
      />
    </div>
  );
}

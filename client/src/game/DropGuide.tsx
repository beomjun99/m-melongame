import { useEffect, useRef, type RefObject } from 'react';
import { Composite, type Engine } from 'matter-js';
import type { FruitSkin } from '../theme/types';
import { DROP_CONFIG } from './config';
import { predictLandingY } from './preview';

type DropGuideProps = {
  engineRef: RefObject<Engine | null>;
  x: number;
  radius: number;
  width: number;
  height: number;
  skin: FruitSkin;
  visible: boolean;
};

export function DropGuide({ engineRef, x, radius, width, height, skin, visible }: DropGuideProps) {
  const ghost = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;
    let frame = 0;
    const update = () => {
      const bodies = engineRef.current ? Composite.allBodies(engineRef.current.world) : [];
      const y = predictLandingY(x, radius, DROP_CONFIG.spawnY, height, bodies);
      if (ghost.current) ghost.current.style.top = `${y / height * 100}%`;
      if (line.current) line.current.style.height = `${Math.max(0, y - DROP_CONFIG.previewY) / height * 100}%`;
      frame = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(frame);
  }, [engineRef, x, radius, height, visible]);

  if (!visible) return null;
  return (
    <>
      <div ref={line} className="drop-guide-line" aria-hidden="true"
        style={{ left: `${x / width * 100}%`, top: `${DROP_CONFIG.previewY / height * 100}%` }} />
      <div ref={ghost} className="drop-preview drop-ghost" aria-hidden="true"
        style={{ left: `${x / width * 100}%`, top: `${(height - radius) / height * 100}%`,
          width: `${radius * 2 / width * 100}%`, height: `${radius * 2 / height * 100}%`, backgroundColor: skin.color }}>
        {skin.imageUrl ? <img key={skin.imageUrl} src={skin.imageUrl} alt="" draggable={false} /> : skin.level}
      </div>
    </>
  );
}

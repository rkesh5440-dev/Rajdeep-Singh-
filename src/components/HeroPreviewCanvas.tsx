import React, { useEffect, useRef, useState } from 'react';
import { HeroLoadout } from '../types/game';
import { drawCarSprite, drawHeroSprite } from '../utils/heroRenderer';

interface HeroPreviewCanvasProps {
  loadout: HeroLoadout;
  width?: number;
  height?: number;
  scale?: number;
  interactive?: boolean;
  showCar?: boolean;
}

export const HeroPreviewCanvas: React.FC<HeroPreviewCanvasProps> = ({
  loadout,
  width = 180,
  height = 150,
  scale = 1.65,
  interactive = true,
  showCar = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const swingRef = useRef<number>(0);
  const gunRef = useRef<number>(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    let rafId = 0;
    const start = performance.now();

    const render = (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const groundY = height - 22;

      const grad = ctx.createRadialGradient(cx, groundY - 35, 8, cx, groundY - 35, 82);
      grad.addColorStop(0, `${loadout.primaryColor}38`);
      grad.addColorStop(1, 'rgba(14, 17, 23, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(cx, groundY + 4, showCar ? 62 : 46, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (swingRef.current > 0) {
        swingRef.current = Math.max(0, swingRef.current - 0.045);
        if (swingRef.current === 0 && gunRef.current === 0) setAnimating(false);
      }
      if (gunRef.current > 0) {
        gunRef.current = Math.max(0, gunRef.current - 0.06);
        if (gunRef.current === 0 && swingRef.current === 0) setAnimating(false);
      }

      if (showCar) {
        drawCarSprite(ctx, {
          x: cx,
          y: groundY,
          facing: 1,
          carId: loadout.carId,
          wheelAngle: t * 3.5,
          speedRatio: 0.4,
          nitroActive: swingRef.current > 0,
          occupied: true,
          driverColor: loadout.primaryColor,
          scale: Math.min(1.25, scale * 0.72),
        });
      } else {
        drawHeroSprite(ctx, {
          x: cx,
          y: groundY,
          facing: 1,
          loadout,
          animTime: t,
          isMoving: false,
          isGrounded: true,
          attackProgress: swingRef.current > 0 ? 1 - swingRef.current : 0,
          gunFlash: gunRef.current,
          scale,
        });
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [loadout, width, height, scale, showCar]);

  const triggerPreview = () => {
    if (!interactive || animating) return;
    setAnimating(true);
    if (showCar) {
      swingRef.current = 1;
    } else if (Math.random() < 0.5) {
      swingRef.current = 1;
    } else {
      gunRef.current = 1;
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={triggerPreview}
      title={interactive ? 'Tap to preview action' : undefined}
      className={interactive ? 'cursor-pointer select-none' : 'select-none'}
    />
  );
};

import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Car,
  Crosshair,
  HeartPulse,
  Shield,
  Sword,
  Wind,
  Zap,
} from 'lucide-react';
import { ControllerSettings, SkillDef } from '../types/game';

export interface TouchInputPayload {
  left: boolean;
  right: boolean;
  jump: boolean;
  attack: boolean;
  gun: boolean;
  guard: boolean;
  dash: boolean;
  carToggle: boolean;
  skill0: boolean;
  skill1: boolean;
  skill2: boolean;
}

interface CircularControlsProps {
  settings: ControllerSettings;
  skills: SkillDef[];
  skillCds: [number, number, number];
  inCar: boolean;
  canEnterCar: boolean;
  potions?: number;
  disableHealing?: boolean;
  onUsePotion?: () => void;
  onInputChange: (field: keyof TouchInputPayload, active: boolean) => void;
  onJoystickUpdate: (left: boolean, right: boolean, jump: boolean) => void;
}

export const CircularControls: React.FC<CircularControlsProps> = ({
  settings,
  skills,
  skillCds,
  inCar,
  canEnterCar,
  potions = 0,
  disableHealing = false,
  onUsePotion,
  onInputChange,
  onJoystickUpdate,
}) => {
  const stickBaseRef = useRef<HTMLDivElement | null>(null);
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const activePointerIdRef = useRef<number | null>(null);

  const scaleFactor =
    settings.scale === 'compact' ? 0.85 : settings.scale === 'large' ? 1.15 : 1;

  const baseDiameter = Math.round(108 * scaleFactor);
  const maxRadius = Math.round(36 * scaleFactor);

  const processStick = (clientX: number, clientY: number) => {
    const el = stickBaseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }
    setKnobOffset({ x: dx, y: dy });

    const left = dx < -maxRadius * 0.28;
    const right = dx > maxRadius * 0.28;
    const jump = dy < -maxRadius * 0.45;
    onJoystickUpdate(left, right, jump);
  };

  const resetStick = () => {
    activePointerIdRef.current = null;
    setKnobOffset({ x: 0, y: 0 });
    onJoystickUpdate(false, false, false);
  };

  const bindCircleBtn = (field: keyof TouchInputPayload) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      onInputChange(field, true);
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      onInputChange(field, false);
    },
    onPointerLeave: () => onInputChange(field, false),
    onPointerCancel: () => onInputChange(field, false),
  });

  const joyPosStyle: React.CSSProperties = {
    bottom: `${settings.customOffsets.joystick.y}%`,
    left: settings.swapSides ? undefined : `${settings.customOffsets.joystick.x}%`,
    right: settings.swapSides ? `${settings.customOffsets.joystick.x}%` : undefined,
    transform: settings.swapSides ? 'translate(50%, 50%)' : 'translate(-50%, 50%)',
    opacity: settings.opacity,
  };

  const actionPosStyle: React.CSSProperties = {
    bottom: `${settings.customOffsets.actionCluster.y}%`,
    right: settings.swapSides ? undefined : `${settings.customOffsets.actionCluster.x}%`,
    left: settings.swapSides ? `${settings.customOffsets.actionCluster.x}%` : undefined,
    transform: settings.swapSides ? 'translate(-50%, 50%)' : 'translate(50%, 50%)',
    opacity: settings.opacity,
  };

  const btnSize = Math.round(48 * scaleFactor);
  const primarySize = Math.round(58 * scaleFactor);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Movement Zone: Circular Virtual Joystick OR Circle Tap Buttons */}
      <div className="pointer-events-auto absolute touch-none" style={joyPosStyle}>
        {settings.moveMode === 'joystick' ? (
          <div
            ref={stickBaseRef}
            onPointerDown={(e) => {
              e.preventDefault();
              activePointerIdRef.current = e.pointerId;
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              processStick(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (activePointerIdRef.current !== e.pointerId) return;
              processStick(e.clientX, e.clientY);
            }}
            onPointerUp={(e) => {
              if (activePointerIdRef.current === e.pointerId) resetStick();
            }}
            onPointerCancel={resetStick}
            style={{ width: baseDiameter, height: baseDiameter }}
            className="relative flex items-center justify-center rounded-full border-2 border-slate-600/80 bg-slate-900/65 shadow-xl backdrop-blur-sm"
          >
            {/* Subtle directional cross ticks */}
            <div className="pointer-events-none absolute top-1.5 text-[9px] font-bold text-slate-400">
              ▲
            </div>
            <div className="pointer-events-none absolute left-2 text-[9px] font-bold text-slate-400">
              ◀
            </div>
            <div className="pointer-events-none absolute right-2 text-[9px] font-bold text-slate-400">
              ▶
            </div>

            {/* Draggable Inner Thumbstick Circle */}
            <div
              style={{
                width: Math.round(44 * scaleFactor),
                height: Math.round(44 * scaleFactor),
                transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
              }}
              className="rounded-full border-2 border-amber-400 bg-gradient-to-b from-amber-400/90 to-amber-600/90 shadow-lg"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              {...bindCircleBtn('left')}
              style={{ width: btnSize, height: btnSize }}
              className="flex items-center justify-center rounded-full border-2 border-slate-600/80 bg-slate-900/75 text-slate-100 active:border-amber-400 active:bg-amber-500 active:text-slate-950 backdrop-blur-sm"
              aria-label="Move Left"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              {...bindCircleBtn('jump')}
              style={{ width: btnSize, height: btnSize }}
              className="flex items-center justify-center rounded-full border-2 border-slate-600/80 bg-slate-900/75 text-slate-100 active:border-amber-400 active:bg-amber-500 active:text-slate-950 backdrop-blur-sm"
              aria-label="Jump"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
            <button
              type="button"
              {...bindCircleBtn('right')}
              style={{ width: btnSize, height: btnSize }}
              className="flex items-center justify-center rounded-full border-2 border-slate-600/80 bg-slate-900/75 text-slate-100 active:border-amber-400 active:bg-amber-500 active:text-slate-950 backdrop-blur-sm"
              aria-label="Move Right"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Right/Action Circular Cluster: Skills Arc + Gun + Sword + Car + Jump + Guard + Dash */}
      <div
        className="pointer-events-auto absolute flex flex-col items-end gap-2 touch-none"
        style={actionPosStyle}
      >
        {/* Top Row: Potion + Circular Car Enter/Exit + 3 Circular Skills */}
        <div className="flex items-center gap-1.5">
          {potions > 0 && !disableHealing && onUsePotion && (
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                onUsePotion();
              }}
              style={{ width: Math.round(42 * scaleFactor), height: Math.round(42 * scaleFactor) }}
              className="relative flex flex-col items-center justify-center rounded-full border-2 border-emerald-400/85 bg-emerald-950/85 text-[8px] font-bold text-emerald-300 shadow-md active:scale-95 backdrop-blur-sm"
              aria-label="Drink Healing Potion"
            >
              <HeartPulse className="h-3.5 w-3.5 text-emerald-400" />
              <span>POT x{potions}</span>
            </button>
          )}

          {(inCar || canEnterCar) && (
            <button
              type="button"
              {...bindCircleBtn('carToggle')}
              style={{ width: Math.round(42 * scaleFactor), height: Math.round(42 * scaleFactor) }}
              className={`flex flex-col items-center justify-center rounded-full border-2 text-[9px] font-bold shadow-md active:scale-95 backdrop-blur-sm ${
                inCar
                  ? 'border-amber-400 bg-amber-500 text-slate-950'
                  : 'border-emerald-400/80 bg-slate-900/85 text-emerald-300'
              }`}
            >
              <Car className="h-4 w-4" />
              <span>{inCar ? 'EXIT' : 'CAR'}</span>
            </button>
          )}

          {skills.map((sk, idx) => {
            const cd = skillCds[idx];
            const field = `skill${idx}` as keyof TouchInputPayload;
            return (
              <button
                key={`${sk.id}-${idx}`}
                type="button"
                {...bindCircleBtn(field)}
                style={{
                  width: Math.round(42 * scaleFactor),
                  height: Math.round(42 * scaleFactor),
                  borderColor: cd > 0 ? undefined : `${sk.color}aa`,
                }}
                className="relative flex flex-col items-center justify-center rounded-full border-2 border-slate-700 bg-slate-900/80 text-[8px] font-semibold text-slate-100 active:scale-95 backdrop-blur-sm"
              >
                <Zap className="h-3.5 w-3.5" style={{ color: sk.color }} />
                <span className="truncate max-w-[34px]">{sk.name.split(' ')[0]}</span>
                {cd > 0 && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-950/85 font-mono-num text-[11px] font-bold text-amber-300">
                    {cd}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Row: Jump + Dash/Turbo + Guard + Gun + Sword */}
        <div className="flex items-end gap-1.5">
          {settings.moveMode === 'joystick' && (
            <button
              type="button"
              {...bindCircleBtn('jump')}
              style={{ width: Math.round(42 * scaleFactor), height: Math.round(42 * scaleFactor) }}
              className="flex flex-col items-center justify-center rounded-full border-2 border-slate-600/80 bg-slate-900/80 text-[9px] font-semibold text-slate-200 active:bg-amber-500 active:text-slate-950 backdrop-blur-sm"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            {...bindCircleBtn('dash')}
            style={{ width: Math.round(42 * scaleFactor), height: Math.round(42 * scaleFactor) }}
            className="flex flex-col items-center justify-center rounded-full border-2 border-sky-500/70 bg-slate-900/80 text-[9px] font-semibold text-sky-300 active:bg-sky-500 active:text-slate-950 backdrop-blur-sm"
          >
            <Wind className="h-4 w-4" />
            <span>{inCar ? 'NITRO' : 'DASH'}</span>
          </button>

          {!inCar && (
            <button
              type="button"
              {...bindCircleBtn('guard')}
              style={{ width: Math.round(42 * scaleFactor), height: Math.round(42 * scaleFactor) }}
              className="flex flex-col items-center justify-center rounded-full border-2 border-amber-500/70 bg-slate-900/80 text-[9px] font-semibold text-amber-300 active:bg-amber-500 active:text-slate-950 backdrop-blur-sm"
            >
              <Shield className="h-4 w-4" />
              <span>BLK</span>
            </button>
          )}

          <button
            type="button"
            {...bindCircleBtn('gun')}
            style={{ width: btnSize, height: btnSize }}
            className="flex flex-col items-center justify-center rounded-full border-2 border-amber-400 bg-amber-600/85 text-[9px] font-bold text-white shadow-lg active:scale-95"
          >
            <Crosshair className="h-4 w-4" />
            <span>GUN</span>
          </button>

          {!inCar && (
            <button
              type="button"
              {...bindCircleBtn('attack')}
              style={{ width: primarySize, height: primarySize }}
              className="flex flex-col items-center justify-center rounded-full border-2 border-rose-400 bg-rose-600/90 text-[10px] font-bold text-white shadow-lg active:scale-95"
            >
              <Sword className="h-5 w-5" />
              <span>ATK</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

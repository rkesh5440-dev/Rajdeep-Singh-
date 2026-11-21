import React, { useRef, useState } from 'react';
import { Crosshair, RotateCcw, Sliders, X } from 'lucide-react';
import { ControllerSettings } from '../types/game';
import { DEFAULT_CONTROLLER_SETTINGS } from '../utils/storage';

interface ControllerSettingsModalProps {
  settings: ControllerSettings;
  onChange: (next: ControllerSettings) => void;
  onClose: () => void;
}

export const ControllerSettingsModal: React.FC<ControllerSettingsModalProps> = ({
  settings,
  onChange,
  onClose,
}) => {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState<'joystick' | 'actionCluster' | null>(null);

  const handlePreviewPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * 100;
    const relY = ((rect.bottom - e.clientY) / rect.height) * 100;

    if (dragging === 'joystick') {
      const sideX = settings.swapSides ? 100 - relX : relX;
      onChange({
        ...settings,
        customOffsets: {
          ...settings.customOffsets,
          joystick: {
            x: Math.round(Math.max(8, Math.min(42, sideX))),
            y: Math.round(Math.max(8, Math.min(45, relY))),
          },
        },
      });
    } else {
      const sideX = settings.swapSides ? relX : 100 - relX;
      onChange({
        ...settings,
        customOffsets: {
          ...settings.customOffsets,
          actionCluster: {
            x: Math.round(Math.max(8, Math.min(42, sideX))),
            y: Math.round(Math.max(8, Math.min(45, relY))),
          },
        },
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm">
      <div className="grid h-full max-h-[380px] w-full max-w-3xl grid-cols-12 overflow-hidden rounded-xl border border-slate-700 bg-[#141923] shadow-2xl">
        {/* Left: Settings Controls */}
        <div className="col-span-6 flex flex-col justify-between border-r border-slate-800 p-4 overflow-y-auto custom-scroll">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-amber-400" />
                <h2 className="font-display text-base font-bold text-slate-100">
                  Controller Settings
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white sm:hidden"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Circle Movement Style */}
            <div>
              <div className="mb-1 text-xs font-medium text-slate-300">Movement Control Style</div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onChange({ ...settings, moveMode: 'joystick' })}
                  className={`min-h-[34px] rounded-lg border px-2 text-xs font-medium transition ${
                    settings.moveMode === 'joystick'
                      ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  Circle Joystick
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...settings, moveMode: 'circle_buttons' })}
                  className={`min-h-[34px] rounded-lg border px-2 text-xs font-medium transition ${
                    settings.moveMode === 'circle_buttons'
                      ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  Circle Tap Buttons
                </button>
              </div>
            </div>

            {/* Side Layout & Button Size */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1 text-xs font-medium text-slate-300">Thumb Handedness</div>
                <button
                  type="button"
                  onClick={() => onChange({ ...settings, swapSides: !settings.swapSides })}
                  className="min-h-[34px] w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 text-xs font-medium text-slate-200 hover:border-amber-500"
                >
                  {settings.swapSides ? 'Swapped (Move Right)' : 'Standard (Move Left)'}
                </button>
              </div>

              <div>
                <div className="mb-1 text-xs font-medium text-slate-300">Circle Scale</div>
                <div className="grid grid-cols-3 gap-1">
                  {(['compact', 'normal', 'large'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => onChange({ ...settings, scale: sz })}
                      className={`min-h-[34px] rounded-lg border text-[11px] capitalize transition ${
                        settings.scale === sz
                          ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-semibold'
                          : 'border-slate-800 bg-slate-900 text-slate-400'
                      }`}
                    >
                      {sz === 'compact' ? 'S' : sz === 'normal' ? 'M' : 'L'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Opacity Slider */}
            <div>
              <div className="mb-1 flex justify-between text-xs text-slate-300">
                <span>Control Opacity</span>
                <span className="font-mono-num text-amber-400">
                  {Math.round(settings.opacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.45}
                max={0.95}
                step={0.05}
                value={settings.opacity}
                onChange={(e) => onChange({ ...settings, opacity: Number(e.target.value) })}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Screen Shake Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
              <span className="text-xs text-slate-300">Combat Impact Shake</span>
              <button
                type="button"
                onClick={() => onChange({ ...settings, screenShake: !settings.screenShake })}
                className={`rounded px-2.5 py-1 text-xs font-semibold ${
                  settings.screenShake
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {settings.screenShake ? 'Enabled' : 'Off'}
              </button>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => onChange(DEFAULT_CONTROLLER_SETTINGS)}
              className="flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 text-xs font-medium text-slate-300 hover:bg-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex min-h-[36px] flex-1 items-center justify-center rounded-lg bg-amber-500 px-4 text-xs font-bold text-slate-950 hover:bg-amber-400"
            >
              Save Controls
            </button>
          </div>
        </div>

        {/* Right: Interactive Drag-to-Position Landscape Preview */}
        <div className="col-span-6 flex flex-col bg-[#0e1117] p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <Crosshair className="h-3.5 w-3.5 text-amber-400" />
              Drag Circles to Reposition
            </div>
            <button
              type="button"
              onClick={onClose}
              className="hidden sm:flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-label="Close controller settings"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div
            ref={previewRef}
            onPointerMove={handlePreviewPointerMove}
            onPointerUp={() => setDragging(null)}
            onPointerLeave={() => setDragging(null)}
            className="relative flex-1 overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 touch-none select-none"
          >
            {/* Preview horizon hint */}
            <div className="pointer-events-none absolute inset-x-0 bottom-8 h-px bg-slate-800" />
            <div className="pointer-events-none absolute inset-x-0 top-3 text-center text-[11px] text-slate-500">
              Drag the Move Stick or Action Wheel to fit your thumbs
            </div>

            {/* Draggable Joystick / Move Pad Marker */}
            <button
              type="button"
              onPointerDown={() => setDragging('joystick')}
              style={{
                left: settings.swapSides ? undefined : `${settings.customOffsets.joystick.x}%`,
                right: settings.swapSides ? `${settings.customOffsets.joystick.x}%` : undefined,
                bottom: `${settings.customOffsets.joystick.y}%`,
                opacity: settings.opacity,
              }}
              className="absolute -translate-x-1/2 translate-y-1/2 flex h-16 w-16 cursor-grab items-center justify-center rounded-full border-2 border-amber-400 bg-slate-800/80 text-[10px] font-bold text-amber-300 shadow-lg active:cursor-grabbing"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/30 border border-amber-400">
                MOVE
              </div>
            </button>

            {/* Draggable Action Cluster Marker */}
            <button
              type="button"
              onPointerDown={() => setDragging('actionCluster')}
              style={{
                right: settings.swapSides ? undefined : `${settings.customOffsets.actionCluster.x}%`,
                left: settings.swapSides ? `${settings.customOffsets.actionCluster.x}%` : undefined,
                bottom: `${settings.customOffsets.actionCluster.y}%`,
                opacity: settings.opacity,
              }}
              className="absolute translate-x-1/2 translate-y-1/2 flex h-20 w-20 cursor-grab items-center justify-center rounded-full border-2 border-rose-400 bg-slate-800/80 text-[10px] font-bold text-rose-300 shadow-lg active:cursor-grabbing"
            >
              <div className="flex flex-col items-center">
                <span>ATK · GUN</span>
                <span>CAR · SKL</span>
              </div>
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono-num">
            <span>
              Joystick: {settings.customOffsets.joystick.x}% / {settings.customOffsets.joystick.y}%
            </span>
            <span>
              Actions: {settings.customOffsets.actionCluster.x}% /{' '}
              {settings.customOffsets.actionCluster.y}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { RotateCw, Maximize2 } from 'lucide-react';

interface OrientationGuardProps {
  isPortrait: boolean;
  onRequestLandscape: () => void;
  children: React.ReactNode;
}

export const OrientationGuard: React.FC<OrientationGuardProps> = ({
  isPortrait,
  onRequestLandscape,
  children,
}) => {
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0e1117]">
      {children}

      {isPortrait && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0b0e14]/98 px-6 text-center backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Rotate device to landscape"
        >
          <div className="mb-8 flex items-center justify-center">
            <div className="animate-rotate-phone relative flex h-24 w-14 items-center justify-center rounded-xl border-2 border-amber-400/80 bg-slate-900 shadow-lg shadow-amber-500/10">
              <div className="h-14 w-10 rounded bg-slate-800" />
              <div className="absolute bottom-1.5 h-1 w-4 rounded-full bg-amber-400/70" />
            </div>
          </div>

          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <RotateCw className="h-5 w-5" />
            <span className="text-xs font-semibold tracking-widest uppercase">
              Landscape Only
            </span>
          </div>

          <h1 className="font-display text-2xl font-bold text-slate-100 text-balance max-w-xs">
            Rotate Your Phone to Play
          </h1>

          <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-400">
            Ironbound Realms uses dual-thumb landscape controls. Turn your device sideways to unlock the arena, adventure map, and 2-player offline battles.
          </p>

          <button
            type="button"
            onClick={onRequestLandscape}
            className="mt-6 flex min-h-[44px] items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 active:scale-[0.98]"
          >
            <Maximize2 className="h-4 w-4" />
            Switch to Landscape Fullscreen
          </button>
        </div>
      )}
    </div>
  );
};

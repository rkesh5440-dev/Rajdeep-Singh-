import React, { useState } from 'react';
import { Download, Smartphone, X, Share, Package } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="flex min-h-[34px] items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1 text-xs font-semibold text-slate-950 transition hover:bg-amber-400 active:scale-[0.98] whitespace-nowrap shrink-0"
      >
        <Download className="h-3.5 w-3.5" />
        {isIOS ? 'Save to iPhone' : 'Install on Phone'}
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-700/80 bg-[#161b26] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-slate-100">
                    Install on Phone or Build APK
                  </h3>
                  <p className="text-xs text-slate-400">
                    Play full-screen offline on Android & iOS
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                aria-label="Close install guide"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="mt-4 space-y-2.5 text-xs text-slate-300">
                <p className="flex items-center gap-2">
                  <span className="font-mono-num font-bold text-amber-400">1.</span>
                  <span>
                    Tap the <strong className="inline-flex items-center gap-1 text-slate-100"><Share className="h-3.5 w-3.5" /> Share</strong> button in Safari.
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-mono-num font-bold text-amber-400">2.</span>
                  <span>
                    Scroll down and select <strong className="text-slate-100">Add to Home Screen</strong>.
                  </span>
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3 text-xs text-slate-300">
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                  <div className="font-semibold text-amber-300 mb-1">
                    Option 1: Instant Phone Install (WebAPK — No PC Needed)
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Open the Shared App URL in <strong className="text-white">Android Chrome</strong> and tap <strong className="text-white">⋮ → Install App</strong>. Chrome wraps this game into an offline home-screen app.
                  </p>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-300 mb-1">
                    <Package className="h-3.5 w-3.5" />
                    Option 2: Compile Native .APK File (Capacitor Android Project)
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Export this project and open the <code className="text-amber-300">android/</code> folder in <strong className="text-white">Android Studio</strong> (Build → Build APK) or push to GitHub to run the included <code className="text-amber-300">Build Android APK</code> workflow automatically.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="min-h-[36px] rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

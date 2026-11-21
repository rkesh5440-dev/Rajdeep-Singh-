import React, { useEffect, useState } from 'react';
import {
  Car,
  CheckCircle2,
  Coins,
  Compass,
  Crosshair,
  Lock,
  Play,
  Shield,
  ShoppingBag,
  Sliders,
  Sword,
  Target,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  WifiOff,
} from 'lucide-react';
import { ArmoryTab, ArmoryView } from './components/ArmoryView';
import { ControllerSettingsModal } from './components/ControllerSettingsModal';
import { FriendsOfflineHub } from './components/FriendsOfflineHub';
import { GameCanvasEngine } from './components/GameCanvasEngine';
import { HeroPreviewCanvas } from './components/HeroPreviewCanvas';
import { OrientationGuard } from './components/OrientationGuard';
import { PWAInstallButton } from './components/PWAInstallButton';
import {
  ADVENTURE_REGIONS,
  CARS,
  GUNS,
  MAX_POTIONS,
  MAX_UPGRADE_LEVEL,
  MISSIONS,
  POTION_PRICE,
  WEAPONS,
  computeHeroStats,
  getUpgradeCost,
} from './data/gameCatalog';
import { useLandscapeLock } from './hooks/useLandscapeLock';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import {
  ActiveSessionConfig,
  ControllerSettings,
  HeroLoadout,
  PlayerSaveData,
  SessionResult,
} from './types/game';
import { soundFX } from './utils/sound';
import { loadSaveData, persistSaveData, xpForNextLevel } from './utils/storage';

type HubTab = 'adventure' | 'missions' | 'arena' | 'friends' | 'armory';

export default function App() {
  const { isPortrait, requestLandscapeFullscreen } = useLandscapeLock();
  const isOnline = useOnlineStatus();

  const [save, setSave] = useState<PlayerSaveData>(() => loadSaveData());
  const [activeTab, setActiveTab] = useState<HubTab>('adventure');
  const [armoryInitialTab, setArmoryInitialTab] = useState<ArmoryTab>('shop');
  const [selectedRegionId, setSelectedRegionId] = useState<string>(ADVENTURE_REGIONS[0].id);
  const [arenaDiff, setArenaDiff] = useState<'novice' | 'veteran' | 'champion'>('novice');
  const [arenaOpponentIdx, setArenaOpponentIdx] = useState<number>(0);
  const [arenaStageId, setArenaStageId] = useState<string>(ADVENTURE_REGIONS[4].id);
  const [activeSession, setActiveSession] = useState<ActiveSessionConfig | null>(null);
  const [showControllerSettings, setShowControllerSettings] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    soundFX.muted = save.muted;
    persistSaveData(save);
  }, [save]);

  const toggleMute = () => {
    setSave((prev) => ({ ...prev, muted: !prev.muted }));
  };

  const handleUpdateHero = (hero: HeroLoadout) => {
    setSave((prev) => ({ ...prev, hero }));
  };

  const handleUpdateFriends = (friendPresets: HeroLoadout[]) => {
    setSave((prev) => ({ ...prev, friendPresets }));
  };

  const handleUpdateControllerSettings = (controllerSettings: ControllerSettings) => {
    setSave((prev) => ({ ...prev, controllerSettings }));
  };

  const handleUnlockAndEquip = (
    category: 'weapon' | 'gun' | 'car' | 'armor' | 'relic' | 'skill' | 'passive',
    id: string,
    cost: number,
    skillSlotIndex = 0
  ) => {
    setSave((prev) => {
      if (cost > 0 && prev.gold < cost) return prev;
      const next = { ...prev, gold: prev.gold - cost };

      if (category === 'weapon') {
        if (!next.unlockedWeapons.includes(id)) {
          next.unlockedWeapons = [...next.unlockedWeapons, id];
        }
        next.hero = { ...next.hero, weaponId: id };
      } else if (category === 'gun') {
        if (!next.unlockedGuns.includes(id)) {
          next.unlockedGuns = [...next.unlockedGuns, id];
        }
        next.hero = { ...next.hero, gunId: id };
      } else if (category === 'car') {
        if (!next.unlockedCars.includes(id)) {
          next.unlockedCars = [...next.unlockedCars, id];
        }
        next.hero = { ...next.hero, carId: id };
      } else if (category === 'armor') {
        if (!next.unlockedArmors.includes(id)) {
          next.unlockedArmors = [...next.unlockedArmors, id];
        }
        next.hero = { ...next.hero, armorId: id };
      } else if (category === 'relic') {
        if (!next.unlockedRelics.includes(id)) {
          next.unlockedRelics = [...next.unlockedRelics, id];
        }
        next.hero = { ...next.hero, relicId: id };
      } else if (category === 'skill') {
        if (!next.unlockedSkills.includes(id)) {
          next.unlockedSkills = [...next.unlockedSkills, id];
        }
        const updatedSkills = [...next.hero.skillIds] as [string, string, string];
        const existingIdx = updatedSkills.indexOf(id);
        if (existingIdx !== -1 && existingIdx !== skillSlotIndex) {
          updatedSkills[existingIdx] = updatedSkills[skillSlotIndex];
        }
        updatedSkills[skillSlotIndex] = id;
        next.hero = { ...next.hero, skillIds: updatedSkills };
      } else if (category === 'passive') {
        if (!next.unlockedPassives.includes(id)) {
          next.unlockedPassives = [...next.unlockedPassives, id];
        }
        next.hero = { ...next.hero, passiveId: id };
      }

      soundFX.pickup();
      return next;
    });
  };

  const handleBuyPotion = () => {
    setSave((prev) => {
      if (prev.potions >= MAX_POTIONS || prev.gold < POTION_PRICE) return prev;
      soundFX.pickup();
      return {
        ...prev,
        gold: prev.gold - POTION_PRICE,
        potions: prev.potions + 1,
      };
    });
  };

  const handleConsumePotion = () => {
    setSave((prev) => ({
      ...prev,
      potions: Math.max(0, prev.potions - 1),
    }));
  };

  const handleUpgradeGear = (slot: 'weapon' | 'gun' | 'armor') => {
    setSave((prev) => {
      const curLvl = prev.upgrades?.[slot] || 0;
      const cost = getUpgradeCost(curLvl);
      if (curLvl >= MAX_UPGRADE_LEVEL || prev.gold < cost) return prev;
      soundFX.pickup();
      return {
        ...prev,
        gold: prev.gold - cost,
        upgrades: {
          ...prev.upgrades,
          [slot]: curLvl + 1,
        },
      };
    });
  };

  const handleSessionComplete = (result: SessionResult) => {
    setSave((prev) => {
      let gold = prev.gold + result.goldEarned;
      let xp = prev.xp + result.xpEarned;
      let level = prev.level;

      while (xp >= xpForNextLevel(level)) {
        xp -= xpForNextLevel(level);
        level += 1;
      }

      const clearedRegions = [...prev.clearedRegions];
      if (
        result.victory &&
        result.mode === 'ADVENTURE' &&
        activeSession?.regionId &&
        !clearedRegions.includes(activeSession.regionId)
      ) {
        clearedRegions.push(activeSession.regionId);
      }

      const completedMissions = [...prev.completedMissions];
      const missionClearCounts = { ...prev.missionClearCounts };
      if (result.victory && result.mode === 'MISSION' && activeSession?.mission) {
        const mId = activeSession.mission.id;
        if (!completedMissions.includes(mId)) {
          completedMissions.push(mId);
        }
        missionClearCounts[mId] = (missionClearCounts[mId] || 0) + 1;
      }

      const arenaWins =
        result.victory && result.mode === 'ARENA' ? prev.arenaWins + 1 : prev.arenaWins;

      return {
        ...prev,
        gold,
        xp,
        level,
        clearedRegions,
        completedMissions,
        missionClearCounts,
        arenaWins,
      };
    });
  };

  const selectedRegion =
    ADVENTURE_REGIONS.find((r) => r.id === selectedRegionId) || ADVENTURE_REGIONS[0];
  const heroStats = computeHeroStats(save.hero, save.level, save.upgrades);
  const equippedSword = WEAPONS.find((w) => w.id === save.hero.weaponId) || WEAPONS[0];
  const equippedGun = GUNS.find((g) => g.id === save.hero.gunId) || GUNS[0];
  const equippedCar = CARS.find((c) => c.id === save.hero.carId) || CARS[0];

  const totalClearedMissions = save.completedMissions.length;

  const navItems: { id: HubTab; label: string; icon: React.ReactNode }[] = [
    { id: 'adventure', label: 'Adventure', icon: <Compass className="h-3.5 w-3.5" /> },
    { id: 'missions', label: 'Missions', icon: <Target className="h-3.5 w-3.5" /> },
    { id: 'arena', label: 'Fighting', icon: <Sword className="h-3.5 w-3.5" /> },
    { id: 'friends', label: 'Friends', icon: <Users className="h-3.5 w-3.5" /> },
    { id: 'armory', label: 'Shop & Gear', icon: <ShoppingBag className="h-3.5 w-3.5" /> },
  ];

  return (
    <OrientationGuard isPortrait={isPortrait} onRequestLandscape={requestLandscapeFullscreen}>
      {activeSession ? (
        <GameCanvasEngine
          config={activeSession}
          save={save}
          isPortraitLocked={isPortrait}
          onToggleMute={toggleMute}
          onUpdateControllerSettings={handleUpdateControllerSettings}
          onConsumePotion={handleConsumePotion}
          onComplete={handleSessionComplete}
          onOpenShop={() => {
            setActiveSession(null);
            setArmoryInitialTab('shop');
            setActiveTab('armory');
          }}
          onExit={() => setActiveSession(null)}
        />
      ) : (
        <div className="flex h-full w-full flex-col bg-[#0e1117] text-slate-100">
          {/* 3-Zone Top Navigation Bar */}
          <header className="flex h-[52px] shrink-0 items-center justify-between gap-4 border-b border-slate-800/90 bg-[#121620] px-4">
            <div className="font-display text-base font-bold tracking-tight text-amber-400 whitespace-nowrap shrink-0">
              Ironbound Realms
            </div>

            <nav className="flex items-center gap-1 overflow-x-auto">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex min-h-[34px] items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition ${
                    activeTab === item.id
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setArmoryInitialTab('shop');
                  setActiveTab('armory');
                }}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-amber-500/35 bg-amber-500/10 px-2.5 text-xs font-mono-num font-bold text-amber-300 hover:bg-amber-500/20 whitespace-nowrap"
                title="Spend earned Gold in Shop & Gear"
              >
                <Coins className="h-3.5 w-3.5 text-amber-400" />
                <span>{save.gold}g</span>
                <span className="hidden md:inline text-slate-500">·</span>
                <span className="hidden md:inline text-slate-200">LV {save.level}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowControllerSettings(true)}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 text-xs font-medium text-slate-200 hover:border-amber-500/60 hover:text-amber-300"
                title="Customize Controls"
              >
                <Sliders className="h-3.5 w-3.5 text-amber-400" />
                <span className="hidden sm:inline">Controls</span>
              </button>
              <button
                type="button"
                onClick={toggleMute}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
                aria-label={save.muted ? 'Unmute audio' : 'Mute audio'}
              >
                {save.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <PWAInstallButton />
            </div>
          </header>

          {/* Main Landscape Workspace */}
          <main className="flex-1 overflow-hidden p-3">
            {activeTab === 'adventure' && (
              <div className="grid h-full grid-cols-12 gap-3 overflow-hidden">
                <div className="col-span-5 flex flex-col gap-2 overflow-y-auto pr-1 custom-scroll">
                  {ADVENTURE_REGIONS.map((reg) => {
                    const selected = reg.id === selectedRegion.id;
                    const cleared = save.clearedRegions.includes(reg.id);
                    return (
                      <button
                        key={reg.id}
                        type="button"
                        onClick={() => setSelectedRegionId(reg.id)}
                        className={`flex items-center gap-3 rounded-xl border p-2 text-left transition ${
                          selected
                            ? 'border-amber-500 bg-amber-500/10'
                            : 'border-slate-800 bg-[#141923] hover:border-slate-700'
                        }`}
                      >
                        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-900">
                          {!brokenImages[reg.id] ? (
                            <img
                              src={reg.bgImage}
                              alt={reg.name}
                              referrerPolicy="no-referrer"
                              onError={() =>
                                setBrokenImages((prev) => ({ ...prev, [reg.id]: true }))
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div
                              className="h-full w-full"
                              style={{
                                background: `linear-gradient(135deg, ${reg.skyFallback[0]}, ${reg.skyFallback[1]})`,
                              }}
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate font-display text-sm font-bold text-slate-100">
                              {reg.name}
                            </span>
                            {cleared && (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                            )}
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-400 truncate">
                            {reg.questSummary}
                          </div>
                          <div className="mt-1 font-mono-num text-[11px] text-amber-400">
                            +{reg.rewardGold}g · +{reg.rewardXp} XP
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="col-span-7 flex flex-col justify-between overflow-hidden rounded-xl border border-slate-800 bg-[#141923]">
                  <div className="relative h-36 sm:h-44 w-full overflow-hidden bg-slate-900">
                    {!brokenImages[selectedRegion.id] ? (
                      <img
                        src={selectedRegion.bgImage}
                        alt={selectedRegion.name}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setBrokenImages((prev) => ({ ...prev, [selectedRegion.id]: true }))
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className="h-full w-full"
                        style={{
                          background: `linear-gradient(135deg, ${selectedRegion.skyFallback[0]}, ${selectedRegion.skyFallback[1]})`,
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141923] via-[#141923]/40 to-transparent" />
                    <div className="absolute bottom-2.5 left-4 right-4 flex items-end justify-between gap-4">
                      <div>
                        <div className="text-[11px] font-medium text-amber-400">
                          4,200m Open Frontier · Boss: {selectedRegion.bossName}
                        </div>
                        <h2 className="font-display text-xl font-bold text-white">
                          {selectedRegion.name}
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveSession({
                            mode: 'ADVENTURE',
                            regionId: selectedRegion.id,
                          })
                        }
                        className="flex min-h-[40px] items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg hover:bg-amber-400 active:scale-[0.98] whitespace-nowrap shrink-0"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        Embark Now
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-1 items-center justify-between gap-4 px-4 py-2">
                    <div className="space-y-1.5">
                      <p className="text-xs leading-relaxed text-slate-300">
                        {selectedRegion.subtitle}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                        <span className="inline-flex items-center gap-1 text-slate-200">
                          <Sword className="h-3 w-3 text-rose-400" />
                          {equippedSword.name}
                        </span>
                        <span className="inline-flex items-center gap-1 text-slate-200">
                          <Crosshair className="h-3 w-3 text-amber-400" />
                          {equippedGun.name}
                        </span>
                        <span className="inline-flex items-center gap-1 text-slate-200">
                          <Car className="h-3 w-3 text-sky-400" />
                          {equippedCar.name}
                        </span>
                        <span className="font-mono-num text-emerald-400">
                          HP {heroStats.maxHp}
                        </span>
                      </div>
                    </div>
                    <div className="hidden sm:block shrink-0">
                      <HeroPreviewCanvas
                        loadout={save.hero}
                        width={116}
                        height={92}
                        scale={1.05}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'missions' && (
              <div className="flex h-full flex-col gap-2 overflow-hidden">
                <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#141923] px-3 py-1.5 text-xs">
                  <span className="text-slate-300">
                    Escalating Campaign — Clearing each mission unlocks the next and increases enemy Threat Level.
                  </span>
                  <span className="font-mono-num font-bold text-amber-400 whitespace-nowrap">
                    Cleared {totalClearedMissions}/{MISSIONS.length} · Global Threat +{totalClearedMissions * 15}%
                  </span>
                </div>

                <div className="grid flex-1 grid-cols-4 gap-2.5 overflow-y-auto pr-1 custom-scroll">
                  {MISSIONS.map((m, idx) => {
                    const prevMission = idx > 0 ? MISSIONS[idx - 1] : null;
                    const unlocked =
                      idx === 0 || (prevMission && save.completedMissions.includes(prevMission.id));
                    const clears = save.missionClearCounts[m.id] || 0;
                    const threatTier = 1 + clears + Math.floor(totalClearedMissions / 2);
                    const reg = ADVENTURE_REGIONS.find((r) => r.id === m.regionId);
                    const scaledGold = Math.round(m.rewardGold * (1 + (threatTier - 1) * 0.25));
                    const scaledXp = Math.round(m.rewardXp * (1 + (threatTier - 1) * 0.25));

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col justify-between rounded-xl border p-2.5 ${
                          unlocked
                            ? 'border-slate-800 bg-[#141923]'
                            : 'border-slate-800/60 bg-[#10141c] opacity-65'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 text-[10px]">
                            <span
                              className={`font-semibold ${
                                m.tier === 'Mythic'
                                  ? 'text-violet-400'
                                  : m.tier === 'Gold'
                                    ? 'text-amber-400'
                                    : m.tier === 'Silver'
                                      ? 'text-sky-400'
                                      : 'text-orange-400'
                              }`}
                            >
                              {m.tier} · Threat T{threatTier}
                            </span>
                            {clears > 0 && (
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                                <CheckCircle2 className="h-3 w-3" /> x{clears}
                              </span>
                            )}
                          </div>
                          <h3 className="mt-1 font-display text-xs font-bold text-slate-100">
                            {m.title}
                          </h3>
                          <p className="mt-1 text-[11px] leading-snug text-slate-400">
                            {m.description}
                          </p>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between border-t border-slate-800/80 pt-2">
                          <div className="text-[10px] text-slate-400">
                            <div className="text-slate-300 truncate max-w-[95px]">
                              {reg?.name.split(' ')[0]}
                            </div>
                            <div className="font-mono-num text-amber-400">
                              +{scaledGold}g · +{scaledXp} XP
                            </div>
                          </div>
                          {unlocked ? (
                            <button
                              type="button"
                              onClick={() =>
                                setActiveSession({
                                  mode: 'MISSION',
                                  regionId: m.regionId,
                                  mission: m,
                                  missionThreatTier: threatTier,
                                })
                              }
                              className="flex min-h-[32px] items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-slate-950 hover:bg-amber-400"
                            >
                              <Play className="h-3 w-3 fill-current" />
                              Play
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                              <Lock className="h-3 w-3" /> Clear #{idx}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'arena' && (
              <div className="grid h-full grid-cols-12 gap-3 overflow-hidden">
                <div className="col-span-7 flex flex-col justify-between rounded-xl border border-slate-800 bg-[#141923] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-display text-lg font-bold text-slate-100">
                        1v1 Arena Duel (Best of 3)
                      </h2>
                      <p className="text-xs text-slate-400">
                        Fight with your Sword, Gun, and Custom Skills against rival AI champions.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-mono-num text-amber-400">
                      <Trophy className="h-4 w-4" />
                      {save.arenaWins} Wins
                    </div>
                  </div>

                  <div className="my-2 flex items-center justify-around rounded-lg border border-slate-800/80 bg-slate-900/60 py-2">
                    <div className="text-center">
                      <HeroPreviewCanvas
                        loadout={save.hero}
                        width={135}
                        height={112}
                        scale={1.3}
                      />
                      <div className="text-xs font-semibold text-slate-100">{save.hero.name}</div>
                      <div className="text-[11px] text-emerald-400">You</div>
                    </div>

                    <div className="font-display text-xl font-extrabold text-amber-500">VS</div>

                    <div className="text-center">
                      <HeroPreviewCanvas
                        loadout={save.friendPresets[arenaOpponentIdx] || save.friendPresets[0]}
                        width={135}
                        height={112}
                        scale={1.3}
                      />
                      <div className="text-xs font-semibold text-slate-100">
                        {(save.friendPresets[arenaOpponentIdx] || save.friendPresets[0]).name}
                      </div>
                      <div className="text-[11px] text-rose-400 capitalize">
                        {arenaDiff} Challenger
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveSession({
                        mode: 'ARENA',
                        regionId: arenaStageId,
                        arenaDifficulty: arenaDiff,
                        friendsRoster: [
                          save.friendPresets[arenaOpponentIdx] || save.friendPresets[0],
                        ],
                      })
                    }
                    className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
                  >
                    <Sword className="h-4 w-4" /> Enter Fighting Arena
                  </button>
                </div>

                <div className="col-span-5 flex flex-col justify-between rounded-xl border border-slate-800 bg-[#141923] p-4 overflow-y-auto custom-scroll">
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1.5 text-xs font-semibold text-slate-200">
                        AI Difficulty
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['novice', 'veteran', 'champion'] as const).map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setArenaDiff(d)}
                            className={`min-h-[34px] rounded-lg border text-xs font-medium capitalize transition ${
                              arenaDiff === d
                                ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-1.5 text-xs font-semibold text-slate-200">
                        Select Challenger
                      </div>
                      <div className="space-y-1.5">
                        {save.friendPresets.map((op, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setArenaOpponentIdx(idx)}
                            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition ${
                              arenaOpponentIdx === idx
                                ? 'border-amber-500 bg-amber-500/10 text-slate-100'
                                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <span className="font-semibold">{op.name}</span>
                            <span className="capitalize text-[11px]">{op.classId}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-1.5 text-xs font-semibold text-slate-200">
                        Arena Stage
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {ADVENTURE_REGIONS.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setArenaStageId(r.id)}
                            className={`truncate rounded-lg border px-2 py-1.5 text-[11px] font-medium transition ${
                              arenaStageId === r.id
                                ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {r.name.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-[11px] text-slate-400">
                    <Shield className="h-4 w-4 shrink-0 text-sky-400" />
                    <span>
                      Guard cuts incoming sword & bullet damage by 65%.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'friends' && (
              <FriendsOfflineHub
                save={save}
                onUpdateFriends={handleUpdateFriends}
                onStartSession={(cfg) => setActiveSession(cfg)}
              />
            )}

            {activeTab === 'armory' && (
              <ArmoryView
                save={save}
                initialTab={armoryInitialTab}
                onUpdateHero={handleUpdateHero}
                onUnlockAndEquip={handleUnlockAndEquip}
                onBuyPotion={handleBuyPotion}
                onUpgradeGear={handleUpgradeGear}
              />
            )}
          </main>

          {showControllerSettings && (
            <ControllerSettingsModal
              settings={save.controllerSettings}
              onChange={handleUpdateControllerSettings}
              onClose={() => setShowControllerSettings(false)}
            />
          )}

          {!isOnline && (
            <div className="pointer-events-none fixed bottom-2.5 left-3 z-30 flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-slate-900/90 px-2.5 py-1 text-[11px] font-medium text-amber-300 shadow-lg">
              <WifiOff className="h-3.5 w-3.5" />
              Offline Mode Active — All saves & multiplayer ready
            </div>
          )}
        </div>
      )}
    </OrientationGuard>
  );
}

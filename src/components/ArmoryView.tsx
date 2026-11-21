import React, { useEffect, useState } from 'react';
import {
  Car,
  Check,
  Coins,
  Crosshair,
  Flame,
  HeartPulse,
  Lock,
  Shield,
  ShoppingBag,
  Sparkles,
  Sword,
  Zap,
} from 'lucide-react';
import {
  ARMOR_COLORS,
  ARMORS,
  CARS,
  GUNS,
  HERO_CLASSES,
  MAX_POTIONS,
  MAX_UPGRADE_LEVEL,
  PASSIVES,
  POTION_PRICE,
  RELICS,
  SKILLS,
  WEAPONS,
  computeHeroStats,
  getUpgradeCost,
} from '../data/gameCatalog';
import { CapeStyle, HelmStyle, HeroLoadout, PlayerSaveData } from '../types/game';
import { HeroPreviewCanvas } from './HeroPreviewCanvas';

interface ArmoryViewProps {
  save: PlayerSaveData;
  onUpdateHero: (hero: HeroLoadout) => void;
  onUnlockAndEquip: (
    category: 'weapon' | 'gun' | 'car' | 'armor' | 'relic' | 'skill' | 'passive',
    id: string,
    cost: number,
    skillSlotIndex?: number
  ) => void;
  onBuyPotion: () => void;
  onUpgradeGear: (slot: 'weapon' | 'gun' | 'armor') => void;
  initialTab?: ArmoryTab;
}

export type ArmoryTab =
  | 'shop'
  | 'identity'
  | 'weapons'
  | 'guns'
  | 'cars'
  | 'armors'
  | 'relics'
  | 'skills'
  | 'passives';

export const ArmoryView: React.FC<ArmoryViewProps> = ({
  save,
  onUpdateHero,
  onUnlockAndEquip,
  onBuyPotion,
  onUpgradeGear,
  initialTab = 'shop',
}) => {
  const [tab, setTab] = useState<ArmoryTab>(initialTab);
  const [activeSkillSlot, setActiveSkillSlot] = useState<0 | 1 | 2>(0);
  const [notice, setNotice] = useState<string | null>(null);
  const { hero } = save;
  const stats = computeHeroStats(hero, save.level, save.upgrades);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const flashNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2000);
  };

  const helmOptions: { id: HelmStyle; label: string }[] = [
    { id: 'knight', label: 'Visor Helm' },
    { id: 'hood', label: 'Shadow Hood' },
    { id: 'crown', label: 'War Crown' },
    { id: 'none', label: 'Unmasked' },
  ];

  const capeOptions: { id: CapeStyle; label: string }[] = [
    { id: 'royal', label: 'Royal Cloak' },
    { id: 'scarf', label: 'Combat Scarf' },
    { id: 'tattered', label: 'Worn Mantle' },
    { id: 'none', label: 'No Cape' },
  ];

  return (
    <div className="grid h-full grid-cols-12 gap-3 overflow-hidden">
      {/* Left Column: Live Hero / Car Preview + Stats */}
      <div className="col-span-4 flex flex-col justify-between rounded-xl border border-slate-800 bg-[#141923] p-3 overflow-y-auto custom-scroll">
        <div className="flex flex-col items-center">
          <div className="flex w-full items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-200 truncate">{hero.name}</span>
            <span className="font-mono-num text-amber-400">LV {save.level}</span>
          </div>

          <div className="my-1 flex items-center justify-center">
            <HeroPreviewCanvas
              loadout={hero}
              width={170}
              height={126}
              scale={1.4}
              showCar={tab === 'cars'}
            />
          </div>

          <p className="text-[11px] text-slate-500">
            {tab === 'cars' ? 'Tap vehicle to test nitro flame' : 'Tap hero to test sword & gun'}
          </p>
        </div>

        {/* Computed Stats Grid */}
        <div className="mt-2 border-t border-slate-800/80 pt-2">
          <div className="grid grid-cols-3 gap-x-2 gap-y-1.5 text-[11px]">
            <div>
              <div className="text-slate-500">Health</div>
              <div className="font-mono-num font-bold text-emerald-400">{stats.maxHp}</div>
            </div>
            <div>
              <div className="text-slate-500">Sword ATK</div>
              <div className="font-mono-num font-bold text-rose-400">{stats.atk}</div>
            </div>
            <div>
              <div className="text-slate-500">Gun DMG</div>
              <div className="font-mono-num font-bold text-amber-400">{stats.gunDmg}</div>
            </div>
            <div>
              <div className="text-slate-500">Defense</div>
              <div className="font-mono-num font-bold text-sky-400">{stats.def}</div>
            </div>
            <div>
              <div className="text-slate-500">Speed</div>
              <div className="font-mono-num font-bold text-slate-200">{stats.speed}</div>
            </div>
            <div>
              <div className="text-slate-500">Crit</div>
              <div className="font-mono-num font-bold text-violet-400">{stats.critChance}%</div>
            </div>
          </div>

          {/* Equipped Skills Summary */}
          <div className="mt-2 border-t border-slate-800/80 pt-2">
            <div className="text-[11px] text-slate-500 mb-1">Active Skill Loadout</div>
            <div className="grid grid-cols-3 gap-1">
              {hero.skillIds.map((sid, idx) => {
                const s = SKILLS.find((sk) => sk.id === sid);
                return (
                  <button
                    key={`${sid}-${idx}`}
                    type="button"
                    onClick={() => {
                      setTab('skills');
                      setActiveSkillSlot(idx as 0 | 1 | 2);
                    }}
                    className={`truncate rounded border px-1.5 py-1 text-left text-[10px] font-medium transition ${
                      tab === 'skills' && activeSkillSlot === idx
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                        : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {idx + 1}. {s?.name.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Tabs + Customization Grid */}
      <div className="col-span-8 flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-[#141923]">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 px-3 py-2">
          <div className="flex items-center gap-1 overflow-x-auto">
            {(
              [
                { id: 'shop', label: 'Shop & Forge' },
                { id: 'identity', label: 'Hero' },
                { id: 'weapons', label: 'Swords' },
                { id: 'guns', label: 'Guns' },
                { id: 'cars', label: 'Cars' },
                { id: 'armors', label: 'Armor' },
                { id: 'relics', label: 'Relics' },
                { id: 'skills', label: 'Skills' },
                { id: 'passives', label: 'Passives' },
              ] as { id: ArmoryTab; label: string }[]
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`min-h-[34px] rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition ${
                  tab === t.id
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/35 bg-amber-500/10 px-2.5 py-1 text-xs font-mono-num font-bold text-amber-300 shrink-0">
            <Coins className="h-3.5 w-3.5 text-amber-400" />
            <span>{save.gold}g</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 custom-scroll">
          {notice && (
            <div className="mb-2.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
              {notice}
            </div>
          )}

          {tab === 'shop' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-amber-500/25 bg-slate-900/75 px-3 py-2">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Spend Earned Gold
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Earn Gold from battles, chests, and clearing levels. Spend it here or in Swords, Guns, Cars &amp; Armor!
                  </p>
                </div>
                <div className="text-right font-mono-num shrink-0">
                  <div className="text-xs font-bold text-amber-400">{save.gold}g Wallet</div>
                  <div className="text-[10px] text-emerald-400">
                    {save.potions}/{MAX_POTIONS} Potions
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Battle Consumable: Healing Potion */}
                <div className="flex flex-col justify-between rounded-lg border border-emerald-500/35 bg-slate-900/70 p-2.5">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-100">
                        <HeartPulse className="h-4 w-4 text-emerald-400" />
                        Healing Potion
                      </span>
                      <span className="font-mono-num text-[11px] text-emerald-400">
                        {save.potions}/{MAX_POTIONS} Owned
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Drink mid-battle (POT button or R key) to restore 45% Max HP instantly.
                    </p>
                  </div>
                  <div className="mt-2.5 flex justify-end">
                    <button
                      type="button"
                      disabled={save.potions >= MAX_POTIONS || save.gold < POTION_PRICE}
                      onClick={() => {
                        onBuyPotion();
                        flashNotice(`Bought Healing Potion (-${POTION_PRICE}g)`);
                      }}
                      className={`min-h-[32px] rounded px-3 py-1 text-xs font-semibold transition ${
                        save.potions >= MAX_POTIONS
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : save.gold >= POTION_PRICE
                            ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                            : 'bg-slate-800/70 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {save.potions >= MAX_POTIONS
                        ? 'Bag Full'
                        : `Buy Potion (${POTION_PRICE}g)`}
                    </button>
                  </div>
                </div>

                {/* Upgrade Sword Mastery */}
                {(['weapon', 'gun', 'armor'] as const).map((slot) => {
                  const lvl = save.upgrades?.[slot] || 0;
                  const maxed = lvl >= MAX_UPGRADE_LEVEL;
                  const cost = getUpgradeCost(lvl);
                  const canAfford = save.gold >= cost && !maxed;
                  const meta =
                    slot === 'weapon'
                      ? {
                          title: 'Forge Sword Edge',
                          stat: `+4 Sword ATK per rank (Now +${lvl * 4})`,
                          icon: <Sword className="h-4 w-4 text-rose-400" />,
                        }
                      : slot === 'gun'
                        ? {
                            title: 'Calibrate Gun Barrel',
                            stat: `+4 Gun DMG per rank (Now +${lvl * 4})`,
                            icon: <Crosshair className="h-4 w-4 text-amber-400" />,
                          }
                        : {
                            title: 'Temper Armor Plates',
                            stat: `+18 HP & +2 DEF per rank (Now +${lvl * 18} HP)`,
                            icon: <Shield className="h-4 w-4 text-sky-400" />,
                          };

                  return (
                    <div
                      key={slot}
                      className="flex flex-col justify-between rounded-lg border border-slate-800 bg-slate-900/70 p-2.5"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-100">
                            {meta.icon}
                            {meta.title}
                          </span>
                          <span className="font-mono-num text-[11px] text-amber-400">
                            Rank {lvl}/{MAX_UPGRADE_LEVEL}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">{meta.stat}</p>
                      </div>
                      <div className="mt-2.5 flex justify-end">
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => {
                            onUpgradeGear(slot);
                            flashNotice(`Upgraded ${meta.title} to Rank ${lvl + 1} (-${cost}g)`);
                          }}
                          className={`min-h-[32px] inline-flex items-center gap-1 rounded px-3 py-1 text-xs font-semibold transition ${
                            maxed
                              ? 'bg-slate-800 text-emerald-400 cursor-default'
                              : canAfford
                                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                                : 'bg-slate-800/70 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Flame className="h-3 w-3" />
                          {maxed ? 'Max Rank' : `Upgrade (${cost}g)`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'identity' && (
            <div className="space-y-3">
              <div className="grid grid-cols-12 items-center gap-3">
                <label className="col-span-3 text-xs font-medium text-slate-300">
                  Hero Name
                </label>
                <input
                  type="text"
                  maxLength={14}
                  value={hero.name}
                  onChange={(e) => onUpdateHero({ ...hero, name: e.target.value })}
                  className="col-span-9 h-9 rounded-lg border border-slate-700 bg-slate-900 px-3 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                  placeholder="Enter hero name"
                />
              </div>

              <div>
                <div className="mb-1.5 text-xs font-medium text-slate-300">Combat Class</div>
                <div className="grid grid-cols-2 gap-2">
                  {HERO_CLASSES.map((cls) => {
                    const selected = hero.classId === cls.id;
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() =>
                          onUpdateHero({
                            ...hero,
                            classId: cls.id,
                            primaryColor: cls.accentColor,
                          })
                        }
                        className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition ${
                          selected
                            ? 'border-amber-500 bg-amber-500/10'
                            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="text-xs font-semibold text-slate-100">{cls.name}</span>
                          <span className="text-[10px] text-slate-400">{cls.title}</span>
                        </div>
                        <p className="mt-1 text-[11px] leading-snug text-slate-400">
                          {cls.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="mb-1.5 text-xs font-medium text-slate-300">Armor Color</div>
                  <div className="flex flex-wrap gap-1.5">
                    {ARMOR_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => onUpdateHero({ ...hero, primaryColor: c.hex })}
                        title={c.name}
                        className={`h-7 w-7 rounded-md border-2 transition ${
                          hero.primaryColor === c.hex
                            ? 'border-white scale-105'
                            : 'border-slate-800'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 text-xs font-medium text-slate-300">Headgear</div>
                  <div className="grid grid-cols-2 gap-1">
                    {helmOptions.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => onUpdateHero({ ...hero, helm: h.id })}
                        className={`rounded border px-2 py-1 text-[11px] transition ${
                          hero.helm === h.id
                            ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                            : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {h.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 text-xs font-medium text-slate-300">Cape Style</div>
                  <div className="grid grid-cols-2 gap-1">
                    {capeOptions.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onUpdateHero({ ...hero, cape: c.id })}
                        className={`rounded border px-2 py-1 text-[11px] transition ${
                          hero.cape === c.id
                            ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                            : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'weapons' && (
            <div className="grid grid-cols-2 gap-2">
              {WEAPONS.map((w) => {
                const unlocked = save.unlockedWeapons.includes(w.id);
                const equipped = hero.weaponId === w.id;
                const canAfford = save.gold >= w.cost;

                return (
                  <div
                    key={w.id}
                    className={`flex flex-col justify-between rounded-lg border p-2.5 ${
                      equipped
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-slate-800 bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-100">
                          <Sword className="h-3.5 w-3.5 text-amber-400" />
                          {w.name}
                        </span>
                        <span className="font-mono-num text-[11px] text-rose-400">
                          +{w.atkBonus} ATK
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-400">
                        Range {w.range} · Crit +{w.critBonus}% · Speed {w.cooldownMs}ms
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">{w.description}</p>
                    </div>
                    <div className="mt-2.5 flex justify-end">
                      {equipped ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400">
                          <Check className="h-3.5 w-3.5" /> Equipped
                        </span>
                      ) : unlocked ? (
                        <button
                          type="button"
                          onClick={() => onUnlockAndEquip('weapon', w.id, 0)}
                          className="min-h-[32px] rounded bg-slate-800 px-3 py-1 text-xs font-medium text-slate-100 hover:bg-slate-700"
                        >
                          Equip
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => onUnlockAndEquip('weapon', w.id, w.cost)}
                          className={`min-h-[32px] inline-flex items-center gap-1.5 rounded px-3 py-1 text-xs font-semibold transition ${
                            canAfford
                              ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                              : 'bg-slate-800/70 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Lock className="h-3 w-3" /> Unlock {w.cost}g
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'guns' && (
            <div className="grid grid-cols-2 gap-2">
              {GUNS.map((g) => {
                const unlocked = save.unlockedGuns.includes(g.id);
                const equipped = hero.gunId === g.id;
                const canAfford = save.gold >= g.cost;

                return (
                  <div
                    key={g.id}
                    className={`flex flex-col justify-between rounded-lg border p-2.5 ${
                      equipped
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-slate-800 bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-100">
                          <Crosshair className="h-3.5 w-3.5" style={{ color: g.color }} />
                          {g.name}
                        </span>
                        <span className="font-mono-num text-[11px] text-amber-400">
                          {g.damage}
                          {g.pellets > 1 ? `x${g.pellets}` : ''} DMG
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-400">
                        Fire {g.fireRateMs}ms · Range {g.range}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">{g.description}</p>
                    </div>
                    <div className="mt-2.5 flex justify-end">
                      {equipped ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400">
                          <Check className="h-3.5 w-3.5" /> Equipped
                        </span>
                      ) : unlocked ? (
                        <button
                          type="button"
                          onClick={() => onUnlockAndEquip('gun', g.id, 0)}
                          className="min-h-[32px] rounded bg-slate-800 px-3 py-1 text-xs font-medium text-slate-100 hover:bg-slate-700"
                        >
                          Equip
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => onUnlockAndEquip('gun', g.id, g.cost)}
                          className={`min-h-[32px] inline-flex items-center gap-1.5 rounded px-3 py-1 text-xs font-semibold transition ${
                            canAfford
                              ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                              : 'bg-slate-800/70 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Lock className="h-3 w-3" /> Unlock {g.cost}g
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'cars' && (
            <div className="grid grid-cols-2 gap-2">
              {CARS.map((c) => {
                const unlocked = save.unlockedCars.includes(c.id);
                const equipped = hero.carId === c.id;
                const canAfford = save.gold >= c.cost;

                return (
                  <div
                    key={c.id}
                    className={`flex flex-col justify-between rounded-lg border p-2.5 ${
                      equipped
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-slate-800 bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-100">
                          <Car className="h-3.5 w-3.5" style={{ color: c.primaryColor }} />
                          {c.name}
                        </span>
                        <span className="font-mono-num text-[11px] text-rose-400">
                          {c.ramDamage} RAM
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-400">
                        Top Speed {c.topSpeed} · Nitro x{c.nitroBoost} · +{c.armorBonus} Armor
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">{c.description}</p>
                    </div>
                    <div className="mt-2.5 flex justify-end">
                      {equipped ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400">
                          <Check className="h-3.5 w-3.5" /> Active Vehicle
                        </span>
                      ) : unlocked ? (
                        <button
                          type="button"
                          onClick={() => onUnlockAndEquip('car', c.id, 0)}
                          className="min-h-[32px] rounded bg-slate-800 px-3 py-1 text-xs font-medium text-slate-100 hover:bg-slate-700"
                        >
                          Select Car
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => onUnlockAndEquip('car', c.id, c.cost)}
                          className={`min-h-[32px] inline-flex items-center gap-1.5 rounded px-3 py-1 text-xs font-semibold transition ${
                            canAfford
                              ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                              : 'bg-slate-800/70 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Lock className="h-3 w-3" /> Unlock {c.cost}g
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'armors' && (
            <div className="grid grid-cols-2 gap-2">
              {ARMORS.map((a) => {
                const unlocked = save.unlockedArmors.includes(a.id);
                const equipped = hero.armorId === a.id;
                const canAfford = save.gold >= a.cost;

                return (
                  <div
                    key={a.id}
                    className={`flex flex-col justify-between rounded-lg border p-2.5 ${
                      equipped
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-slate-800 bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-100">
                          <Shield className="h-3.5 w-3.5 text-sky-400" />
                          {a.name}
                        </span>
                        <span className="font-mono-num text-[11px] text-emerald-400">
                          +{a.hpBonus} HP
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-400">
                        DEF +{a.defBonus} · Speed {a.speedMod >= 0 ? `+${a.speedMod}` : a.speedMod}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">{a.description}</p>
                    </div>
                    <div className="mt-2.5 flex justify-end">
                      {equipped ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400">
                          <Check className="h-3.5 w-3.5" /> Equipped
                        </span>
                      ) : unlocked ? (
                        <button
                          type="button"
                          onClick={() => onUnlockAndEquip('armor', a.id, 0)}
                          className="min-h-[32px] rounded bg-slate-800 px-3 py-1 text-xs font-medium text-slate-100 hover:bg-slate-700"
                        >
                          Equip
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => onUnlockAndEquip('armor', a.id, a.cost)}
                          className={`min-h-[32px] inline-flex items-center gap-1.5 rounded px-3 py-1 text-xs font-semibold transition ${
                            canAfford
                              ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                              : 'bg-slate-800/70 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Lock className="h-3 w-3" /> Unlock {a.cost}g
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'relics' && (
            <div className="grid grid-cols-2 gap-2">
              {RELICS.map((r) => {
                const unlocked = save.unlockedRelics.includes(r.id);
                const equipped = hero.relicId === r.id;
                const canAfford = save.gold >= r.cost;

                return (
                  <div
                    key={r.id}
                    className={`flex flex-col justify-between rounded-lg border p-2.5 ${
                      equipped
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-slate-800 bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-100">
                          <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                          {r.name}
                        </span>
                        <span className="font-mono-num text-[11px] text-amber-400">
                          +{r.critBonus}% Crit
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-400">
                        ATK +{r.atkBonus} · HP +{r.hpBonus} · CDR +{r.cdrPercent}%
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">{r.description}</p>
                    </div>
                    <div className="mt-2.5 flex justify-end">
                      {equipped ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400">
                          <Check className="h-3.5 w-3.5" /> Equipped
                        </span>
                      ) : unlocked ? (
                        <button
                          type="button"
                          onClick={() => onUnlockAndEquip('relic', r.id, 0)}
                          className="min-h-[32px] rounded bg-slate-800 px-3 py-1 text-xs font-medium text-slate-100 hover:bg-slate-700"
                        >
                          Equip
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => onUnlockAndEquip('relic', r.id, r.cost)}
                          className={`min-h-[32px] inline-flex items-center gap-1.5 rounded px-3 py-1 text-xs font-semibold transition ${
                            canAfford
                              ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                              : 'bg-slate-800/70 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Lock className="h-3 w-3" /> Unlock {r.cost}g
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'skills' && (
            <div>
              <div className="mb-2.5 flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
                <span className="text-xs text-slate-300">Assigning to Skill Slot:</span>
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map((slotIdx) => {
                    const sk = SKILLS.find((s) => s.id === hero.skillIds[slotIdx]);
                    return (
                      <button
                        key={slotIdx}
                        type="button"
                        onClick={() => setActiveSkillSlot(slotIdx as 0 | 1 | 2)}
                        className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                          activeSkillSlot === slotIdx
                            ? 'bg-amber-500 text-slate-950 font-semibold'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        Slot {slotIdx + 1}: {sk?.name.split(' ')[0]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {SKILLS.map((sk) => {
                  const unlocked = save.unlockedSkills.includes(sk.id);
                  const equippedIndex = hero.skillIds.indexOf(sk.id);
                  const canAfford = save.gold >= sk.cost;

                  return (
                    <div
                      key={sk.id}
                      className={`flex flex-col justify-between rounded-lg border p-2.5 ${
                        equippedIndex !== -1
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-slate-800 bg-slate-900/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-100">
                            <Zap className="h-3.5 w-3.5" style={{ color: sk.color }} />
                            {sk.name}
                          </span>
                          <span className="font-mono-num text-[11px] text-slate-400">
                            {sk.cooldownSec}s CD
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">{sk.description}</p>
                      </div>
                      <div className="mt-2.5 flex justify-end">
                        {equippedIndex === activeSkillSlot ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400">
                            <Check className="h-3.5 w-3.5" /> In Slot {activeSkillSlot + 1}
                          </span>
                        ) : unlocked ? (
                          <button
                            type="button"
                            onClick={() =>
                              onUnlockAndEquip('skill', sk.id, 0, activeSkillSlot)
                            }
                            className="min-h-[32px] rounded bg-slate-800 px-3 py-1 text-xs font-medium text-slate-100 hover:bg-slate-700"
                          >
                            {equippedIndex !== -1
                              ? `Move to Slot ${activeSkillSlot + 1}`
                              : `Set Slot ${activeSkillSlot + 1}`}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!canAfford}
                            onClick={() =>
                              onUnlockAndEquip('skill', sk.id, sk.cost, activeSkillSlot)
                            }
                            className={`min-h-[32px] inline-flex items-center gap-1.5 rounded px-3 py-1 text-xs font-semibold transition ${
                              canAfford
                                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                                : 'bg-slate-800/70 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <Lock className="h-3 w-3" /> Unlock {sk.cost}g
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'passives' && (
            <div className="grid grid-cols-2 gap-2">
              {PASSIVES.map((p) => {
                const unlocked = save.unlockedPassives.includes(p.id);
                const equipped = hero.passiveId === p.id;
                const canAfford = save.gold >= p.cost;

                return (
                  <div
                    key={p.id}
                    className={`flex flex-col justify-between rounded-lg border p-3 ${
                      equipped
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-slate-800 bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-100">{p.name}</div>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                        {p.description}
                      </p>
                    </div>
                    <div className="mt-3 flex justify-end">
                      {equipped ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400">
                          <Check className="h-3.5 w-3.5" /> Active Mastery
                        </span>
                      ) : unlocked ? (
                        <button
                          type="button"
                          onClick={() => onUnlockAndEquip('passive', p.id, 0)}
                          className="min-h-[32px] rounded bg-slate-800 px-3 py-1 text-xs font-medium text-slate-100 hover:bg-slate-700"
                        >
                          Equip
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => onUnlockAndEquip('passive', p.id, p.cost)}
                          className={`min-h-[32px] inline-flex items-center gap-1.5 rounded px-3 py-1 text-xs font-semibold transition ${
                            canAfford
                              ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                              : 'bg-slate-800/70 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Lock className="h-3 w-3" /> Unlock {p.cost}g
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

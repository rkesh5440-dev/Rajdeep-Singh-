export type GameMode =
  | 'ADVENTURE'
  | 'MISSION'
  | 'ARENA'
  | 'COOP_OFFLINE'
  | 'DUEL_OFFLINE'
  | 'PASS_PLAY';

export type HeroClassId = 'vanguard' | 'shadowblade' | 'pyromancer' | 'stormwarden';

export type WeaponKind = 'sword' | 'daggers' | 'staff' | 'halberd' | 'greatsword' | 'hammer';

export type GunKind = 'pistol' | 'smg' | 'shotgun' | 'rifle' | 'plasma';

export type CarKind = 'buggy' | 'truck' | 'interceptor' | 'warrig';

export type HelmStyle = 'knight' | 'hood' | 'crown' | 'none';
export type CapeStyle = 'royal' | 'tattered' | 'scarf' | 'none';

export interface HeroClassDef {
  id: HeroClassId;
  name: string;
  title: string;
  description: string;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseSpeed: number;
  accentColor: string;
}

export interface WeaponItem {
  id: string;
  name: string;
  kind: WeaponKind;
  atkBonus: number;
  range: number;
  cooldownMs: number;
  critBonus: number;
  cost: number;
  color: string;
  description: string;
}

export interface GunItem {
  id: string;
  name: string;
  kind: GunKind;
  damage: number;
  fireRateMs: number;
  bulletSpeed: number;
  pellets: number;
  spread: number;
  range: number;
  cost: number;
  color: string;
  description: string;
}

export interface CarItem {
  id: string;
  name: string;
  kind: CarKind;
  topSpeed: number;
  ramDamage: number;
  armorBonus: number;
  nitroBoost: number;
  cost: number;
  primaryColor: string;
  accentColor: string;
  description: string;
}

export interface ArmorItem {
  id: string;
  name: string;
  hpBonus: number;
  defBonus: number;
  speedMod: number;
  cost: number;
  trimColor: string;
  heavyPlates: boolean;
  description: string;
}

export interface RelicItem {
  id: string;
  name: string;
  atkBonus: number;
  hpBonus: number;
  speedBonus: number;
  critBonus: number;
  cdrPercent: number;
  cost: number;
  description: string;
}

export type SkillEffectType =
  | 'whirlwind'
  | 'fireball'
  | 'shield'
  | 'blink'
  | 'frostnova'
  | 'lightning'
  | 'heal'
  | 'slam';

export interface SkillDef {
  id: string;
  name: string;
  effect: SkillEffectType;
  cooldownSec: number;
  energyCost: number;
  powerMultiplier: number;
  color: string;
  cost: number;
  description: string;
}

export type PassiveEffectType = 'vampiric' | 'ironskin' | 'fleetfoot' | 'arcane';

export interface PassiveDef {
  id: string;
  name: string;
  effect: PassiveEffectType;
  cost: number;
  description: string;
}

export interface HeroLoadout {
  name: string;
  classId: HeroClassId;
  primaryColor: string;
  helm: HelmStyle;
  cape: CapeStyle;
  weaponId: string;
  gunId: string;
  carId: string;
  armorId: string;
  relicId: string;
  skillIds: [string, string, string];
  passiveId: string;
}

export interface ComputedStats {
  maxHp: number;
  atk: number;
  gunDmg: number;
  def: number;
  speed: number;
  critChance: number;
  cdr: number;
  range: number;
  atkCooldownMs: number;
}

export interface ControlOffsets {
  joystick: { x: number; y: number }; // percentage from bottom-left (or swapped side)
  actionCluster: { x: number; y: number }; // percentage from bottom-right
}

export interface ControllerSettings {
  moveMode: 'joystick' | 'circle_buttons';
  swapSides: boolean;
  scale: 'compact' | 'normal' | 'large';
  opacity: number; // 0.5 to 0.95
  screenShake: boolean;
  customOffsets: ControlOffsets;
}

export interface AdventureRegion {
  id: string;
  levelNumber: number;
  name: string;
  subtitle: string;
  recommendedLevel: number;
  difficultyMult: number;
  bgImage: string;
  tintOverlay?: string;
  groundColor: string;
  skyFallback: [string, string];
  ambientColor: string;
  bossName: string;
  bossColor: string;
  enemyTypes: ('raider' | 'archer' | 'mage' | 'knight' | 'stalker')[];
  questSummary: string;
  rewardGold: number;
  rewardXp: number;
}

export interface MissionDef {
  id: string;
  order: number;
  title: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Mythic';
  difficultyScale: number;
  objectiveType: 'slay' | 'survive' | 'boss_rush' | 'no_heal' | 'vehicle_raid';
  targetCount: number;
  timeLimitSec?: number;
  regionId: string;
  rewardGold: number;
  rewardXp: number;
  description: string;
}

export interface GearUpgrades {
  weapon: number;
  gun: number;
  armor: number;
}

export interface PlayerSaveData {
  hero: HeroLoadout;
  friendPresets: HeroLoadout[];
  gold: number;
  potions: number;
  upgrades: GearUpgrades;
  xp: number;
  level: number;
  unlockedWeapons: string[];
  unlockedGuns: string[];
  unlockedCars: string[];
  unlockedArmors: string[];
  unlockedRelics: string[];
  unlockedSkills: string[];
  unlockedPassives: string[];
  clearedRegions: string[];
  completedMissions: string[];
  missionClearCounts: Record<string, number>;
  arenaWins: number;
  muted: boolean;
  controllerSettings: ControllerSettings;
}

export interface ActiveSessionConfig {
  mode: GameMode;
  regionId: string;
  mission?: MissionDef;
  missionThreatTier?: number;
  arenaDifficulty?: 'novice' | 'veteran' | 'champion';
  friendsRoster?: HeroLoadout[];
}

export interface SessionResult {
  victory: boolean;
  mode: GameMode;
  title: string;
  summary: string;
  goldEarned: number;
  xpEarned: number;
  defeatedCount: number;
  durationSec: number;
  winnerName?: string;
}

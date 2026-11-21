import { ControllerSettings, HeroLoadout, PlayerSaveData } from '../types/game';

const STORAGE_KEY = 'ironbound_realms_save_v2';

export const DEFAULT_CONTROLLER_SETTINGS: ControllerSettings = {
  moveMode: 'joystick',
  swapSides: false,
  scale: 'normal',
  opacity: 0.85,
  screenShake: true,
  customOffsets: {
    joystick: { x: 16, y: 14 },
    actionCluster: { x: 14, y: 12 },
  },
};

export const DEFAULT_HERO: HeroLoadout = {
  name: 'Aldric',
  classId: 'vanguard',
  primaryColor: '#3b82f6',
  helm: 'knight',
  cape: 'royal',
  weaponId: 'iron_broadsword',
  gunId: 'iron_pistol',
  carId: 'outlander_buggy',
  armorId: 'traveler_jerkin',
  relicId: 'whetstone_charm',
  skillIds: ['whirlwind', 'fireball', 'shield'],
  passiveId: 'ironskin',
};

export const DEFAULT_FRIENDS: HeroLoadout[] = [
  {
    name: 'Lyra',
    classId: 'shadowblade',
    primaryColor: '#10b981',
    helm: 'hood',
    cape: 'scarf',
    weaponId: 'twin_fangs',
    gunId: 'viper_smg',
    carId: 'crimson_interceptor',
    armorId: 'shadow_shroud',
    relicId: 'wind_feather',
    skillIds: ['blink', 'frostnova', 'whirlwind'],
    passiveId: 'fleetfoot',
  },
  {
    name: 'Kaelen',
    classId: 'pyromancer',
    primaryColor: '#dc2626',
    helm: 'crown',
    cape: 'tattered',
    weaponId: 'ember_staff',
    gunId: 'scatter_shotgun',
    carId: 'ironclad_truck',
    armorId: 'emberforge_mail',
    relicId: 'chrono_ring',
    skillIds: ['fireball', 'lightning', 'heal'],
    passiveId: 'arcane',
  },
  {
    name: 'Torin',
    classId: 'stormwarden',
    primaryColor: '#eab308',
    helm: 'none',
    cape: 'royal',
    weaponId: 'runic_halberd',
    gunId: 'marksman_rifle',
    carId: 'siege_warrig',
    armorId: 'vanguard_plate',
    relicId: 'titan_crest',
    skillIds: ['slam', 'shield', 'whirlwind'],
    passiveId: 'vampiric',
  },
];

export const INITIAL_SAVE_DATA: PlayerSaveData = {
  hero: DEFAULT_HERO,
  friendPresets: DEFAULT_FRIENDS,
  gold: 250,
  potions: 2,
  upgrades: {
    weapon: 0,
    gun: 0,
    armor: 0,
  },
  xp: 0,
  level: 1,
  unlockedWeapons: ['iron_broadsword'],
  unlockedGuns: ['iron_pistol'],
  unlockedCars: ['outlander_buggy'],
  unlockedArmors: ['traveler_jerkin'],
  unlockedRelics: ['whetstone_charm'],
  unlockedSkills: ['whirlwind', 'fireball', 'shield'],
  unlockedPassives: ['ironskin'],
  clearedRegions: [],
  completedMissions: [],
  missionClearCounts: {},
  arenaWins: 0,
  muted: false,
  controllerSettings: DEFAULT_CONTROLLER_SETTINGS,
};

export function loadSaveData(): PlayerSaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('ironbound_realms_save_v1');
    if (!raw) return INITIAL_SAVE_DATA;
    const parsed = JSON.parse(raw) as Partial<PlayerSaveData>;
    return {
      ...INITIAL_SAVE_DATA,
      ...parsed,
      potions: typeof parsed.potions === 'number' ? parsed.potions : INITIAL_SAVE_DATA.potions,
      upgrades: {
        ...INITIAL_SAVE_DATA.upgrades,
        ...(parsed.upgrades || {}),
      },
      hero: {
        ...DEFAULT_HERO,
        ...(parsed.hero || {}),
      },
      friendPresets:
        parsed.friendPresets && parsed.friendPresets.length >= 3
          ? parsed.friendPresets.map((f, idx) => ({ ...DEFAULT_FRIENDS[idx], ...f }))
          : DEFAULT_FRIENDS,
      controllerSettings: {
        ...DEFAULT_CONTROLLER_SETTINGS,
        ...(parsed.controllerSettings || {}),
        customOffsets: {
          ...DEFAULT_CONTROLLER_SETTINGS.customOffsets,
          ...(parsed.controllerSettings?.customOffsets || {}),
        },
      },
      unlockedGuns: parsed.unlockedGuns?.length ? parsed.unlockedGuns : ['iron_pistol'],
      unlockedCars: parsed.unlockedCars?.length ? parsed.unlockedCars : ['outlander_buggy'],
      missionClearCounts: parsed.missionClearCounts || {},
    };
  } catch {
    return INITIAL_SAVE_DATA;
  }
}

export function persistSaveData(data: PlayerSaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota restrictions
  }
}

export function xpForNextLevel(level: number): number {
  return 100 + (level - 1) * 80;
}

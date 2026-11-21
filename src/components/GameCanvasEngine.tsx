import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Coins,
  LogOut,
  Pause,
  Play,
  RotateCcw,
  ShoppingBag,
  Skull,
  Sliders,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  ADVENTURE_REGIONS,
  CARS,
  GUNS,
  PASSIVES,
  SKILLS,
  WEAPONS,
  computeHeroStats,
} from '../data/gameCatalog';
import {
  ActiveSessionConfig,
  ControllerSettings,
  HeroLoadout,
  PlayerSaveData,
  SessionResult,
  SkillDef,
} from '../types/game';
import { drawCarSprite, drawHeroSprite } from '../utils/heroRenderer';
import { soundFX } from '../utils/sound';
import { CircularControls, TouchInputPayload } from './CircularControls';
import { ControllerSettingsModal } from './ControllerSettingsModal';

interface GameCanvasEngineProps {
  config: ActiveSessionConfig;
  save: PlayerSaveData;
  isPortraitLocked: boolean;
  onToggleMute: () => void;
  onUpdateControllerSettings: (next: ControllerSettings) => void;
  onConsumePotion: () => void;
  onComplete: (result: SessionResult) => void;
  onOpenShop: () => void;
  onExit: () => void;
}

interface FighterEntity {
  id: string;
  name: string;
  team: 'p1' | 'p2' | 'enemy';
  isPlayerControlled: boolean;
  controlSlot: 1 | 2 | 0;
  isBoss?: boolean;
  enemyKind?: 'raider' | 'archer' | 'mage' | 'knight' | 'stalker' | 'boss';
  loadout?: HeroLoadout;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  atk: number;
  gunDmg: number;
  def: number;
  speed: number;
  critChance: number;
  cdr: number;
  range: number;
  atkCooldownMs: number;
  grounded: boolean;
  attackTimer: number;
  attackTotal: number;
  attackCooldown: number;
  hasDealtSwingHit: boolean;
  gunCooldown: number;
  gunFlashTimer: number;
  dashTimer: number;
  dashCooldown: number;
  guarding: boolean;
  shieldTimer: number;
  slowTimer: number;
  stunTimer: number;
  hurtTimer: number;
  hasteTimer: number;
  drivingCarId: string | null;
  skillCooldowns: [number, number, number];
  aiThinkTimer: number;
  color: string;
}

interface WorldCar {
  id: string;
  carItemId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  wheelAngle: number;
  driverId: string | null;
  ramCooldown: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  ownerId: string;
  team: 'p1' | 'p2' | 'enemy';
  color: string;
  life: number;
  pierce: boolean;
  kind: 'fireball' | 'lightning' | 'arrow' | 'ember' | 'bullet';
  hitIds: Set<string>;
}

interface WorldObject {
  id: string;
  kind: 'chest' | 'shrine' | 'crate' | 'beacon' | 'barricade' | 'hazard';
  x: number;
  y: number;
  w?: number;
  opened: boolean;
  hp: number;
  maxHp: number;
}

interface Platform {
  x: number;
  y: number;
  w: number;
  isRamp?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface AmbientMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
}

function emptyInput(): TouchInputPayload {
  return {
    left: false,
    right: false,
    jump: false,
    attack: false,
    gun: false,
    guard: false,
    dash: false,
    carToggle: false,
    skill0: false,
    skill1: false,
    skill2: false,
  };
}

const LOGICAL_W = 960;
const LOGICAL_H = 460;
const GROUND_Y = 392;

export const GameCanvasEngine: React.FC<GameCanvasEngineProps> = ({
  config,
  save,
  isPortraitLocked,
  onToggleMute,
  onUpdateControllerSettings,
  onConsumePotion,
  onComplete,
  onOpenShop,
  onExit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgImgRef = useRef<HTMLImageElement | null>(null);

  const p1InputRef = useRef<TouchInputPayload>(emptyInput());
  const p2InputRef = useRef<TouchInputPayload>(emptyInput());
  const carToggleLatchRef = useRef(false);
  const potionRequestRef = useRef(false);

  const saveRef = useRef(save);
  saveRef.current = save;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onConsumePotionRef = useRef(onConsumePotion);
  onConsumePotionRef.current = onConsumePotion;

  const [paused, setPaused] = useState(false);
  const [showCtrlModal, setShowCtrlModal] = useState(false);
  const pausedRef = useRef(false);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [passOverlay, setPassOverlay] = useState<{ nextName: string; roundNum: number } | null>(
    null
  );
  const passOverlayRef = useRef(false);

  const [hudState, setHudState] = useState({
    p1Hp: 100,
    p1MaxHp: 100,
    p1Energy: 100,
    p1Name: save.hero.name,
    p2Hp: 100,
    p2MaxHp: 100,
    p2Name: '',
    p2Visible: false,
    skillCds: [0, 0, 0] as [number, number, number],
    inCar: false,
    canEnterCar: false,
    goldInMatch: 0,
    objectiveText: '',
    subObjectiveText: '',
    timerText: '00:00',
    bossName: '',
    bossHp: 0,
    bossMaxHp: 0,
    roundsP1: 0,
    roundsP2: 0,
    roundLabel: '',
    activeTurnName: '',
    turnTimeLeft: 0,
  });

  const [runNonce, setRunNonce] = useState(0);

  const region =
    ADVENTURE_REGIONS.find((r) => r.id === config.regionId) || ADVENTURE_REGIONS[0];

  useEffect(() => {
    pausedRef.current =
      paused || showCtrlModal || isPortraitLocked || !!result || passOverlayRef.current;
  }, [paused, showCtrlModal, isPortraitLocked, result]);

  useEffect(() => {
    const img = new Image();
    img.src = region.bgImage;
    img.onload = () => {
      bgImgRef.current = img;
    };
    img.onerror = () => {
      bgImgRef.current = null;
    };
  }, [region.bgImage]);

  useEffect(() => {
    const activeSave = saveRef.current;
    setResult(null);
    setPassOverlay(null);
    passOverlayRef.current = false;
    setPaused(false);
    p1InputRef.current = emptyInput();
    p2InputRef.current = emptyInput();
    potionRequestRef.current = false;
    soundFX.startChime();

    const isAdventure = config.mode === 'ADVENTURE';
    const worldW = isAdventure ? 4200 : LOGICAL_W;
    const isSimultaneous2P =
      config.mode === 'DUEL_OFFLINE' || config.mode === 'COOP_OFFLINE';
    const isPassPlay = config.mode === 'PASS_PLAY';

    const missionDiffMult =
      config.mode === 'MISSION' && config.mission
        ? config.mission.difficultyScale * (1 + ((config.missionThreatTier || 1) - 1) * 0.25)
        : 1;

    const createHeroFighter = (
      id: string,
      loadout: HeroLoadout,
      team: 'p1' | 'p2',
      x: number,
      facing: 1 | -1,
      controlSlot: 1 | 2 | 0,
      levelScale = activeSave.level,
      useUpgrades = false
    ): FighterEntity => {
      const stats = computeHeroStats(
        loadout,
        levelScale,
        useUpgrades ? activeSave.upgrades : undefined
      );
      return {
        id,
        name: loadout.name,
        team,
        isPlayerControlled: controlSlot !== 0,
        controlSlot,
        loadout,
        x,
        y: GROUND_Y,
        vx: 0,
        vy: 0,
        facing,
        hp: stats.maxHp,
        maxHp: stats.maxHp,
        energy: 100,
        maxEnergy: 100,
        atk: stats.atk,
        gunDmg: stats.gunDmg,
        def: stats.def,
        speed: stats.speed,
        critChance: stats.critChance,
        cdr: stats.cdr,
        range: stats.range,
        atkCooldownMs: stats.atkCooldownMs,
        grounded: true,
        attackTimer: 0,
        attackTotal: stats.atkCooldownMs / 1000,
        attackCooldown: 0,
        hasDealtSwingHit: false,
        gunCooldown: 0,
        gunFlashTimer: 0,
        dashTimer: 0,
        dashCooldown: 0,
        guarding: false,
        shieldTimer: 0,
        slowTimer: 0,
        stunTimer: 0,
        hurtTimer: 0,
        hasteTimer: 0,
        drivingCarId: null,
        skillCooldowns: [0, 0, 0],
        aiThinkTimer: 0.3,
        color: loadout.primaryColor,
      };
    };

    const createEnemy = (
      id: string,
      kind: 'raider' | 'archer' | 'mage' | 'knight' | 'stalker' | 'boss',
      x: number
    ): FighterEntity => {
      const regionMult = region.difficultyMult || 1;
      const mult = config.mode === 'MISSION' ? missionDiffMult : regionMult;
      const isBoss = kind === 'boss';
      const baseHp = isBoss
        ? 400 * mult
        : kind === 'knight'
          ? 125 * mult
          : kind === 'mage' || kind === 'archer'
            ? 80 * mult
            : 95 * mult;
      const baseAtk = isBoss ? 29 * mult : kind === 'stalker' ? 21 * mult : 14 * mult;

      return {
        id,
        name: isBoss ? region.bossName : kind.charAt(0).toUpperCase() + kind.slice(1),
        team: 'enemy',
        isPlayerControlled: false,
        controlSlot: 0,
        isBoss,
        enemyKind: kind,
        x,
        y: GROUND_Y,
        vx: 0,
        vy: 0,
        facing: -1,
        hp: Math.round(baseHp),
        maxHp: Math.round(baseHp),
        energy: 100,
        maxEnergy: 100,
        atk: Math.round(baseAtk),
        gunDmg: Math.round(baseAtk * 0.8),
        def: isBoss ? 12 : kind === 'knight' ? 10 : 4,
        speed:
          (isBoss ? 180 : kind === 'stalker' ? 240 : kind === 'knight' ? 150 : 178) *
          Math.min(1.35, 0.92 + mult * 0.08),
        critChance: isBoss ? 15 : 5,
        cdr: 0,
        range: isBoss ? 94 : kind === 'archer' || kind === 'mage' ? 310 : 64,
        atkCooldownMs: isBoss ? 820 : kind === 'stalker' ? 560 : 880,
        grounded: true,
        attackTimer: 0,
        attackTotal: 0.45,
        attackCooldown: 0.55,
        hasDealtSwingHit: false,
        gunCooldown: 0,
        gunFlashTimer: 0,
        dashTimer: 0,
        dashCooldown: 0,
        guarding: false,
        shieldTimer: 0,
        slowTimer: 0,
        stunTimer: 0,
        hurtTimer: 0,
        hasteTimer: 0,
        drivingCarId: null,
        skillCooldowns: [0, 0, 0],
        aiThinkTimer: 0.2,
        color: isBoss
          ? region.bossColor
          : kind === 'mage'
            ? '#f97316'
            : kind === 'knight'
              ? '#64748b'
              : kind === 'stalker'
                ? '#a855f7'
                : '#16a34a',
      };
    };

    const fighters: FighterEntity[] = [];
    const cars: WorldCar[] = [];
    const projectiles: Projectile[] = [];
    const particles: Particle[] = [];
    const floatingTexts: FloatingText[] = [];
    const worldObjects: WorldObject[] = [];
    const ambientMotes: AmbientMote[] = Array.from({ length: 34 }, () => ({
      x: Math.random() * LOGICAL_W,
      y: Math.random() * (GROUND_Y - 20),
      vx: -12 + Math.random() * 24,
      vy: -8 - Math.random() * 14,
      size: 1.5 + Math.random() * 2.5,
      alpha: 0.2 + Math.random() * 0.45,
    }));

    const platforms: Platform[] = isAdventure
      ? [
          { x: 420, y: 295, w: 170 },
          { x: 640, y: 225, w: 150 },
          { x: 1020, y: 280, w: 200 },
          { x: 1480, y: 265, w: 180 },
          { x: 1720, y: 205, w: 150 },
          { x: 2120, y: 280, w: 210 },
          { x: 2580, y: 255, w: 180 },
          { x: 3100, y: 280, w: 200 },
          { x: 3480, y: 245, w: 170 },
        ]
      : [
          { x: 150, y: 280, w: 170 },
          { x: 640, y: 280, w: 170 },
        ];

    if (config.mode === 'ADVENTURE') {
      fighters.push(createHeroFighter('p1', activeSave.hero, 'p1', 110, 1, 1, activeSave.level, true));

      // Spawn Player's Customized Car near the start + a backup car midway
      cars.push(
        {
          id: 'car_1',
          carItemId: save.hero.carId,
          x: 250,
          y: GROUND_Y,
          vx: 0,
          vy: 0,
          facing: 1,
          wheelAngle: 0,
          driverId: null,
          ramCooldown: 0,
        },
        {
          id: 'car_2',
          carItemId: save.hero.carId,
          x: 2020,
          y: GROUND_Y,
          vx: 0,
          vy: 0,
          facing: 1,
          wheelAngle: 0,
          driverId: null,
          ramCooldown: 0,
        }
      );

      // Rich Adventure World: Patrols, Barricades, 3 Outpost Beacons, Chests, Shrines, Hazards
      const enemySpots = [520, 760, 1080, 1340, 1620, 1860, 2240, 2500, 2780, 3080, 3360];
      enemySpots.forEach((sx, idx) => {
        const kind = region.enemyTypes[idx % region.enemyTypes.length];
        fighters.push(createEnemy(`adv_e_${idx}`, kind, sx));
      });
      fighters.push(createEnemy('boss', 'boss', 3920));

      worldObjects.push(
        { id: 'bar1', kind: 'barricade', x: 880, y: GROUND_Y, opened: false, hp: 45, maxHp: 45 },
        { id: 'bcn1', kind: 'beacon', x: 1120, y: 280, opened: false, hp: 50, maxHp: 50 },
        { id: 'ch1', kind: 'chest', x: 700, y: 225, opened: false, hp: 1, maxHp: 1 },
        { id: 'haz1', kind: 'hazard', x: 1410, y: GROUND_Y, w: 95, opened: false, hp: 1, maxHp: 1 },
        { id: 'sh1', kind: 'shrine', x: 1940, y: GROUND_Y, opened: false, hp: 1, maxHp: 1 },
        { id: 'ch2', kind: 'chest', x: 1790, y: 205, opened: false, hp: 1, maxHp: 1 },
        { id: 'bcn2', kind: 'beacon', x: 2220, y: 280, opened: false, hp: 50, maxHp: 50 },
        { id: 'bar2', kind: 'barricade', x: 2440, y: GROUND_Y, opened: false, hp: 55, maxHp: 55 },
        { id: 'haz2', kind: 'hazard', x: 2860, y: GROUND_Y, w: 95, opened: false, hp: 1, maxHp: 1 },
        { id: 'bcn3', kind: 'beacon', x: 3200, y: 280, opened: false, hp: 50, maxHp: 50 },
        { id: 'ch3', kind: 'chest', x: 3560, y: 245, opened: false, hp: 1, maxHp: 1 },
        { id: 'sh2', kind: 'shrine', x: 3630, y: GROUND_Y, opened: false, hp: 1, maxHp: 1 }
      );
    } else if (config.mode === 'MISSION') {
      fighters.push(createHeroFighter('p1', activeSave.hero, 'p1', 160, 1, 1, activeSave.level, true));
      const m = config.mission;
      if (m?.objectiveType === 'vehicle_raid') {
        cars.push({
          id: 'mission_car',
          carItemId: activeSave.hero.carId,
          x: 245,
          y: GROUND_Y,
          vx: 0,
          vy: 0,
          facing: 1,
          wheelAngle: 0,
          driverId: null,
          ramCooldown: 0,
        });
      }
      if (m?.objectiveType === 'boss_rush' || m?.objectiveType === 'no_heal') {
        fighters.push(createEnemy('boss', 'boss', 760));
      } else {
        for (let i = 0; i < 3; i++) {
          const kind = region.enemyTypes[i % region.enemyTypes.length];
          fighters.push(createEnemy(`m_e_${i}`, kind, 640 + i * 95));
        }
      }
    } else if (config.mode === 'ARENA') {
      fighters.push(createHeroFighter('p1', activeSave.hero, 'p1', 210, 1, 1, activeSave.level, true));
      const aiLoadout = config.friendsRoster?.[0] || activeSave.friendPresets[0];
      const aiLevel =
        config.arenaDifficulty === 'champion'
          ? activeSave.level + 2
          : config.arenaDifficulty === 'veteran'
            ? activeSave.level + 1
            : Math.max(1, activeSave.level);
      const aiFighter = createHeroFighter('p2', aiLoadout, 'p2', 750, -1, 0, aiLevel);
      if (config.arenaDifficulty === 'novice') {
        aiFighter.maxHp = Math.round(aiFighter.maxHp * 0.8);
        aiFighter.hp = aiFighter.maxHp;
        aiFighter.atk = Math.round(aiFighter.atk * 0.78);
      } else if (config.arenaDifficulty === 'champion') {
        aiFighter.maxHp = Math.round(aiFighter.maxHp * 1.25);
        aiFighter.hp = aiFighter.maxHp;
        aiFighter.atk = Math.round(aiFighter.atk * 1.15);
      }
      fighters.push(aiFighter);
    } else if (config.mode === 'DUEL_OFFLINE') {
      fighters.push(createHeroFighter('p1', activeSave.hero, 'p1', 200, 1, 1, activeSave.level, true));
      const p2Loadout = config.friendsRoster?.[1] || activeSave.friendPresets[0];
      fighters.push(createHeroFighter('p2', p2Loadout, 'p2', 760, -1, 2));
    } else if (config.mode === 'COOP_OFFLINE') {
      fighters.push(createHeroFighter('p1', activeSave.hero, 'p1', 150, 1, 1, activeSave.level, true));
      const p2Loadout = config.friendsRoster?.[1] || activeSave.friendPresets[0];
      fighters.push(createHeroFighter('p2', p2Loadout, 'p2', 240, 1, 2));
      for (let i = 0; i < 3; i++) {
        fighters.push(
          createEnemy(`w1_${i}`, region.enemyTypes[i % region.enemyTypes.length], 700 + i * 80)
        );
      }
    } else if (config.mode === 'PASS_PLAY') {
      const roster = config.friendsRoster || [activeSave.hero, activeSave.friendPresets[0]];
      const spacing = 640 / Math.max(1, roster.length - 1);
      roster.forEach((heroLoadout, idx) => {
        const f = createHeroFighter(
          `pp_${idx}`,
          heroLoadout,
          'p1',
          160 + idx * spacing,
          idx < roster.length / 2 ? 1 : -1,
          1,
          activeSave.level,
          idx === 0
        );
        fighters.push(f);
      });
    }

    let cameraX = 0;
    let elapsedSec = 0;
    let kills = 0;
    let beaconsCleared = 0;
    let bonusGold = 0;
    let coopWave = 1;
    let spawnTimer = 2.0;
    let roundsP1 = 0;
    let roundsP2 = 0;
    let arenaRound = 1;
    let roundTimer = 60;
    let roundBannerTimer = 2.2;
    let startIntroHoldTimer = 1.1;
    let deathSequenceTimer = 0;
    let victorySequenceTimer = 0;
    let pendingOutcome: {
      victory: boolean;
      title: string;
      summary: string;
      winnerName?: string;
    } | null = null;
    let usedHealInNoHeal = false;
    let passTurnIdx = 0;
    let passTurnTimeLeft = 8.0;
    let passRoundNum = 1;
    let finished = false;
    let hitstop = 0;
    let screenShake = 0;
    let animClock = 0;

    const addFloatingText = (x: number, y: number, text: string, color: string) => {
      floatingTexts.push({ x, y, vy: -44, text, color, life: 0.95 });
    };

    const spawnSparks = (x: number, y: number, color: string, count = 8) => {
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 60 + Math.random() * 180;
        particles.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 40,
          life: 0.28 + Math.random() * 0.25,
          maxLife: 0.53,
          color,
          size: 2.5 + Math.random() * 3.2,
        });
      }
    };

    const applyDamage = (
      attacker: FighterEntity,
      target: FighterEntity,
      rawDamage: number,
      knockbackX: number,
      isSkill = false
    ) => {
      if (target.hp <= 0) return;
      if (target.shieldTimer > 0) {
        soundFX.block();
        addFloatingText(target.x, target.y - 62, 'BLOCKED', '#fbbf24');
        spawnSparks(target.x, target.y - 30, '#fbbf24', 6);
        return;
      }

      const isCrit = Math.random() * 100 < attacker.critChance;
      let dmg = rawDamage * (isCrit ? 1.55 : 1);

      // Extra car armor protection while driving
      let targetDef = target.def;
      if (target.drivingCarId) {
        const carItem = CARS.find((c) => c.id === target.loadout?.carId) || CARS[0];
        targetDef += carItem.armorBonus * 0.35;
      }
      dmg = Math.max(4, dmg - targetDef * 0.45);

      if (target.loadout) {
        const passive = PASSIVES.find((p) => p.id === target.loadout?.passiveId);
        if (passive?.effect === 'ironskin') dmg *= 0.85;
      }

      if (target.guarding && !target.drivingCarId) {
        dmg *= 0.35;
        soundFX.block();
        addFloatingText(target.x, target.y - 60, `Guard -${Math.round(dmg)}`, '#38bdf8');
      } else {
        soundFX.hit(isCrit);
        addFloatingText(
          target.x,
          target.y - 60,
          `${isCrit ? 'CRIT ' : ''}-${Math.round(dmg)}`,
          isCrit ? '#facc15' : '#f87171'
        );
      }

      const finalDmg = Math.round(dmg);
      target.hp = Math.max(0, target.hp - finalDmg);
      if (!target.drivingCarId) {
        target.vx = knockbackX * (target.guarding ? 0.4 : 1);
      }
      target.hurtTimer = 0.16;
      hitstop = isCrit || isSkill ? 0.04 : 0.018;
      if (save.controllerSettings.screenShake) {
        screenShake = isCrit || isSkill ? 5 : 2.5;
      }
      spawnSparks(target.x, target.y - 30, isCrit ? '#facc15' : '#f87171', isCrit ? 12 : 7);

      if (attacker.loadout) {
        const atkPassive = PASSIVES.find((p) => p.id === attacker.loadout?.passiveId);
        if (atkPassive?.effect === 'vampiric' && attacker.hp > 0) {
          const healAmt = Math.max(1, Math.round(finalDmg * 0.14));
          attacker.hp = Math.min(attacker.maxHp, attacker.hp + healAmt);
        }
      }

      if (target.hp <= 0 && target.team === 'enemy') {
        kills++;
        const bounty = target.isBoss ? 110 : 18;
        bonusGold += bounty;
        addFloatingText(target.x, target.y - 46, `+${bounty}g`, '#fbbf24');
        spawnSparks(target.x, target.y - 25, target.color, 18);
      }
    };

    const fireGun = (shooter: FighterEntity) => {
      if (!shooter.loadout || shooter.gunCooldown > 0) return;
      const gun = GUNS.find((g) => g.id === shooter.loadout?.gunId) || GUNS[0];
      shooter.gunCooldown = gun.fireRateMs / 1000;
      shooter.gunFlashTimer = 0.14;
      soundFX.gunshot(gun.kind);

      const muzzleX = shooter.x + shooter.facing * (shooter.drivingCarId ? 32 : 24);
      const muzzleY = shooter.y - (shooter.drivingCarId ? 44 : 32);

      for (let i = 0; i < gun.pellets; i++) {
        const angleOffset = (Math.random() - 0.5) * gun.spread * 2;
        const speed = gun.bulletSpeed;
        projectiles.push({
          x: muzzleX,
          y: muzzleY,
          vx: shooter.facing * Math.cos(angleOffset) * speed,
          vy: Math.sin(angleOffset) * speed,
          radius: gun.kind === 'plasma' ? 6 : 4,
          damage: shooter.gunDmg,
          ownerId: shooter.id,
          team: shooter.team,
          color: gun.color,
          life: gun.range / speed,
          pierce: gun.kind === 'rifle',
          kind: 'bullet',
          hitIds: new Set(),
        });
      }
      spawnSparks(muzzleX, muzzleY, gun.color, 4);
    };

    const castSkill = (caster: FighterEntity, slotIndex: 0 | 1 | 2) => {
      if (!caster.loadout) return;
      const skillId = caster.loadout.skillIds[slotIndex];
      const skill: SkillDef | undefined = SKILLS.find((s) => s.id === skillId);
      if (!skill) return;
      if (caster.skillCooldowns[slotIndex] > 0 || caster.energy < skill.energyCost) return;

      if (config.mission?.objectiveType === 'no_heal' && skill.effect === 'heal') {
        usedHealInNoHeal = true;
      }

      const cdFactor = 1 - caster.cdr / 100;
      caster.skillCooldowns[slotIndex] = skill.cooldownSec * cdFactor;
      caster.energy = Math.max(0, caster.energy - skill.energyCost);
      soundFX.skill(skill.effect);

      const enemies = fighters.filter((f) => {
        if (f.id === caster.id || f.hp <= 0) return false;
        if (isPassPlay) return true;
        if (
          config.mode === 'COOP_OFFLINE' ||
          config.mode === 'ADVENTURE' ||
          config.mode === 'MISSION'
        ) {
          return f.team === 'enemy';
        }
        return f.team !== caster.team;
      });

      if (skill.effect === 'whirlwind') {
        caster.attackTimer = 0.35;
        caster.attackTotal = 0.35;
        spawnSparks(caster.x, caster.y - 28, skill.color, 18);
        enemies.forEach((e) => {
          if (Math.hypot(e.x - caster.x, e.y - caster.y) < 130) {
            applyDamage(
              caster,
              e,
              caster.atk * skill.powerMultiplier,
              e.x >= caster.x ? 240 : -240,
              true
            );
          }
        });
      } else if (skill.effect === 'fireball') {
        projectiles.push({
          x: caster.x + caster.facing * 24,
          y: caster.y - 30,
          vx: caster.facing * 470,
          vy: 0,
          radius: 13,
          damage: caster.atk * skill.powerMultiplier,
          ownerId: caster.id,
          team: caster.team,
          color: skill.color,
          life: 1.6,
          pierce: false,
          kind: 'fireball',
          hitIds: new Set(),
        });
      } else if (skill.effect === 'shield') {
        caster.shieldTimer = 2.6;
        addFloatingText(caster.x, caster.y - 68, 'AEGIS!', '#fbbf24');
        enemies.forEach((e) => {
          if (Math.abs(e.x - caster.x) < 110) {
            e.vx = e.x >= caster.x ? 300 : -300;
            applyDamage(caster, e, caster.atk * 0.7, e.vx, true);
          }
        });
      } else if (skill.effect === 'blink') {
        spawnSparks(caster.x, caster.y - 25, skill.color, 12);
        caster.x = Math.max(30, Math.min(worldW - 30, caster.x + caster.facing * 175));
        spawnSparks(caster.x, caster.y - 25, skill.color, 14);
        enemies.forEach((e) => {
          if (Math.abs(e.x - caster.x) < 115) {
            applyDamage(caster, e, caster.atk * skill.powerMultiplier, caster.facing * 220, true);
          }
        });
      } else if (skill.effect === 'frostnova') {
        spawnSparks(caster.x, caster.y - 28, '#22d3ee', 22);
        enemies.forEach((e) => {
          if (Math.hypot(e.x - caster.x, e.y - caster.y) < 150) {
            e.slowTimer = 3.0;
            applyDamage(
              caster,
              e,
              caster.atk * skill.powerMultiplier,
              e.x >= caster.x ? 180 : -180,
              true
            );
          }
        });
      } else if (skill.effect === 'lightning') {
        projectiles.push({
          x: caster.x + caster.facing * 20,
          y: caster.y - 32,
          vx: caster.facing * 740,
          vy: 0,
          radius: 11,
          damage: caster.atk * skill.powerMultiplier,
          ownerId: caster.id,
          team: caster.team,
          color: skill.color,
          life: 1.1,
          pierce: true,
          kind: 'lightning',
          hitIds: new Set(),
        });
      } else if (skill.effect === 'heal') {
        const healAmt = Math.round(caster.maxHp * 0.3);
        caster.hp = Math.min(caster.maxHp, caster.hp + healAmt);
        caster.hasteTimer = 4.0;
        addFloatingText(caster.x, caster.y - 65, `+${healAmt} HP`, '#4ade80');
        spawnSparks(caster.x, caster.y - 25, '#4ade80', 14);
      } else if (skill.effect === 'slam') {
        if (save.controllerSettings.screenShake) screenShake = 8;
        spawnSparks(caster.x, caster.y - 6, '#f59e0b', 24);
        enemies.forEach((e) => {
          if (Math.abs(e.x - caster.x) < 145 && Math.abs(e.y - caster.y) < 95) {
            e.vy = -340;
            e.grounded = false;
            e.stunTimer = 1.1;
            applyDamage(
              caster,
              e,
              caster.atk * skill.powerMultiplier,
              e.x >= caster.x ? 260 : -260,
              true
            );
          }
        });
      }
    };

    const runAI = (ai: FighterEntity, dt: number) => {
      ai.aiThinkTimer -= dt;
      const targets = fighters.filter((f) => {
        if (f.id === ai.id || f.hp <= 0) return false;
        if (ai.team === 'enemy') return f.team === 'p1' || f.team === 'p2';
        return f.team !== ai.team;
      });
      if (targets.length === 0) return;

      const target = targets.reduce((best, cur) =>
        Math.abs(cur.x - ai.x) < Math.abs(best.x - ai.x) ? cur : best
      );

      const dx = target.x - ai.x;
      const dist = Math.abs(dx);
      if (isAdventure && dist > 680 && !ai.isBoss) {
        // Patrol near spawn until player approaches
        ai.vx *= 0.85;
        return;
      }

      ai.facing = dx >= 0 ? 1 : -1;

      if (ai.enemyKind === 'archer' || ai.enemyKind === 'mage') {
        if (dist < 140) ai.vx = -ai.facing * ai.speed * 0.75;
        else if (dist > 310) ai.vx = ai.facing * ai.speed * 0.85;
        else ai.vx *= 0.8;

        if (dist <= 370 && ai.attackCooldown <= 0) {
          ai.attackCooldown = ai.atkCooldownMs / 1000 + 0.45;
          ai.attackTimer = 0.25;
          ai.attackTotal = 0.25;
          soundFX.slash();
          projectiles.push({
            x: ai.x + ai.facing * 20,
            y: ai.y - 30,
            vx: ai.facing * (ai.enemyKind === 'mage' ? 320 : 390),
            vy: 0,
            radius: ai.enemyKind === 'mage' ? 9 : 6,
            damage: ai.atk,
            ownerId: ai.id,
            team: ai.team,
            color: ai.enemyKind === 'mage' ? '#fb923c' : '#a3e635',
            life: 1.8,
            pierce: false,
            kind: ai.enemyKind === 'mage' ? 'ember' : 'arrow',
            hitIds: new Set(),
          });
        }
        return;
      }

      const engageDist = ai.range * 0.82;
      ai.guarding = false;

      if (dist > engageDist) {
        ai.vx = ai.facing * ai.speed * (ai.team === 'enemy' ? 0.84 : 0.95);
        if (target.y < ai.y - 60 && ai.grounded && Math.random() < 0.03) {
          ai.vy = -480;
          ai.grounded = false;
        }
      } else {
        ai.vx *= 0.72;
        if (ai.attackCooldown <= 0) {
          ai.attackCooldown = ai.atkCooldownMs / 1000 + (ai.team === 'enemy' ? 0.24 : 0.08);
          ai.attackTimer = ai.attackTotal;
          ai.hasDealtSwingHit = false;
          soundFX.slash();
        } else if (ai.loadout && Math.random() < 0.025) {
          castSkill(ai, Math.floor(Math.random() * 3) as 0 | 1 | 2);
        } else if (ai.loadout && Math.random() < 0.02) {
          fireGun(ai);
        } else if (target.attackTimer > 0 && Math.random() < 0.35) {
          ai.guarding = true;
        }
      }

      if (ai.isBoss && ai.aiThinkTimer <= 0) {
        ai.aiThinkTimer = 2.6;
        if (dist < 380 && Math.random() < 0.7) {
          projectiles.push({
            x: ai.x + ai.facing * 25,
            y: ai.y - 26,
            vx: ai.facing * 370,
            vy: 0,
            radius: 14,
            damage: ai.atk * 1.1,
            ownerId: ai.id,
            team: 'enemy',
            color: ai.color,
            life: 1.5,
            pierce: false,
            kind: 'ember',
            hitIds: new Set(),
          });
        }
      }
    };

    const finishGame = (victory: boolean, title: string, summary: string, winnerName?: string) => {
      if (finished) return;
      finished = true;
      if (victory) soundFX.victory();
      else soundFX.defeat();

      const threatMult =
        config.mode === 'MISSION' ? 1 + ((config.missionThreatTier || 1) - 1) * 0.25 : 1;

      const baseGold =
        config.mode === 'ADVENTURE'
          ? victory
            ? region.rewardGold
            : 30
          : config.mode === 'MISSION'
            ? victory
              ? Math.round((config.mission?.rewardGold || 100) * threatMult)
              : 25
            : config.mode === 'ARENA'
              ? victory
                ? 110
                : 30
              : 80;

      const baseXp =
        config.mode === 'ADVENTURE'
          ? victory
            ? region.rewardXp
            : 35
          : config.mode === 'MISSION'
            ? victory
              ? Math.round((config.mission?.rewardXp || 90) * threatMult)
              : 30
            : 85;

      const finalResult: SessionResult = {
        victory,
        mode: config.mode,
        title,
        summary,
        goldEarned: baseGold + bonusGold,
        xpEarned: baseXp + kills * 9,
        defeatedCount: kills,
        durationSec: Math.round(elapsedSec),
        winnerName,
      };
      setResult(finalResult);
      onCompleteRef.current(finalResult);
    };

    const triggerDeathSequence = (title: string, summary: string, winnerName?: string) => {
      if (deathSequenceTimer > 0 || victorySequenceTimer > 0 || finished) return;
      deathSequenceTimer = 1.9;
      pendingOutcome = { victory: false, title, summary, winnerName };
      soundFX.death();
      const p1 = fighters[0];
      if (p1) {
        spawnSparks(p1.x, p1.y - 25, '#ef4444', 26);
        addFloatingText(p1.x, p1.y - 72, 'YOU DIED!', '#ef4444');
      }
    };

    const triggerVictorySequence = (title: string, summary: string, winnerName?: string) => {
      if (victorySequenceTimer > 0 || deathSequenceTimer > 0 || finished) return;
      victorySequenceTimer = 1.25;
      pendingOutcome = { victory: true, title, summary, winnerName };
      soundFX.victory();
      const p1 = fighters[0];
      if (p1) {
        spawnSparks(p1.x, p1.y - 32, '#fbbf24', 26);
      }
    };

    const advancePassTurn = () => {
      const alive = fighters.filter((f) => f.hp > 0);
      if (alive.length <= 1) return;
      passTurnIdx = (passTurnIdx + 1) % fighters.length;
      while (fighters[passTurnIdx].hp <= 0) {
        passTurnIdx = (passTurnIdx + 1) % fighters.length;
      }
      if (passTurnIdx === 0) passRoundNum++;
      passTurnTimeLeft = 8.0;
      passOverlayRef.current = true;
      setPassOverlay({
        nextName: fighters[passTurnIdx].name,
        roundNum: passRoundNum,
      });
    };

    (window as unknown as { __endPassTurn?: () => void }).__endPassTurn = advancePassTurn;
    (window as unknown as { __resumePassTurn?: () => void }).__resumePassTurn = () => {
      passOverlayRef.current = false;
      setPassOverlay(null);
    };

    let lastTime = performance.now();
    let rafId = 0;
    let hudTick = 0;

    const tick = (now: number) => {
      const rawDt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (!pausedRef.current && !finished) {
        if (hitstop > 0) {
          hitstop -= rawDt;
        } else {
          const dt = rawDt;
          animClock += dt;

          if (roundBannerTimer > 0) roundBannerTimer = Math.max(0, roundBannerTimer - dt);
          if (startIntroHoldTimer > 0) startIntroHoldTimer = Math.max(0, startIntroHoldTimer - dt);

          // Explicit Death -> Game Over or Victory -> Stage Clear dramatic transition
          if (deathSequenceTimer > 0) {
            deathSequenceTimer -= dt;
            for (let i = particles.length - 1; i >= 0; i--) {
              const p = particles[i];
              p.x += p.vx * dt;
              p.y += p.vy * dt;
              p.vy += 320 * dt;
              p.life -= dt;
              if (p.life <= 0) particles.splice(i, 1);
            }
            for (let i = floatingTexts.length - 1; i >= 0; i--) {
              const ft = floatingTexts[i];
              ft.y += ft.vy * dt;
              ft.life -= dt;
              if (ft.life <= 0) floatingTexts.splice(i, 1);
            }
            if (deathSequenceTimer <= 0 && pendingOutcome) {
              finishGame(
                pendingOutcome.victory,
                pendingOutcome.title,
                pendingOutcome.summary,
                pendingOutcome.winnerName
              );
            }
          } else if (victorySequenceTimer > 0) {
            victorySequenceTimer -= dt;
            if (victorySequenceTimer <= 0 && pendingOutcome) {
              finishGame(
                pendingOutcome.victory,
                pendingOutcome.title,
                pendingOutcome.summary,
                pendingOutcome.winnerName
              );
            }
          } else {
            elapsedSec += dt;

            if (isPassPlay) {
              passTurnTimeLeft -= dt;
              if (passTurnTimeLeft <= 0) advancePassTurn();
            }

            // Potion request handler (from circular button or R key)
            if (potionRequestRef.current) {
              potionRequestRef.current = false;
              const p1Hero = fighters[0];
              if (
                p1Hero &&
                p1Hero.hp > 0 &&
                p1Hero.hp < p1Hero.maxHp &&
                saveRef.current.potions > 0 &&
                config.mission?.objectiveType !== 'no_heal'
              ) {
                const healAmt = Math.round(p1Hero.maxHp * 0.45);
                p1Hero.hp = Math.min(p1Hero.maxHp, p1Hero.hp + healAmt);
                soundFX.potion();
                addFloatingText(p1Hero.x, p1Hero.y - 68, `+${healAmt} HP POTION!`, '#4ade80');
                spawnSparks(p1Hero.x, p1Hero.y - 26, '#4ade80', 16);
                onConsumePotionRef.current();
              }
            }

          // Ambient motes
          ambientMotes.forEach((m) => {
            m.x += m.vx * dt;
            m.y += m.vy * dt;
            if (m.y < 10) m.y = GROUND_Y - 15;
            if (m.x < 0) m.x = LOGICAL_W;
            if (m.x > LOGICAL_W) m.x = 0;
          });

          // World Cars update (unoccupied friction)
          cars.forEach((car) => {
            car.ramCooldown = Math.max(0, car.ramCooldown - dt);
            if (!car.driverId) {
              car.vx *= 0.88;
              car.x += car.vx * dt;
              car.wheelAngle += (car.vx * dt) / 14;
            }
          });

          // Fighters update
          fighters.forEach((f, idx) => {
            if (f.hp <= 0) return;

            f.energy = Math.min(f.maxEnergy, f.energy + dt * (11 + (f.cdr > 15 ? 4 : 0)));
            f.attackCooldown = Math.max(0, f.attackCooldown - dt);
            f.gunCooldown = Math.max(0, f.gunCooldown - dt);
            f.gunFlashTimer = Math.max(0, f.gunFlashTimer - dt);
            f.dashCooldown = Math.max(0, f.dashCooldown - dt);
            f.shieldTimer = Math.max(0, f.shieldTimer - dt);
            f.slowTimer = Math.max(0, f.slowTimer - dt);
            f.stunTimer = Math.max(0, f.stunTimer - dt);
            f.hurtTimer = Math.max(0, f.hurtTimer - dt);
            f.hasteTimer = Math.max(0, f.hasteTimer - dt);
            f.skillCooldowns = [
              Math.max(0, f.skillCooldowns[0] - dt),
              Math.max(0, f.skillCooldowns[1] - dt),
              Math.max(0, f.skillCooldowns[2] - dt),
            ];

            // Enter / Exit Car toggle for P1
            if (f.controlSlot === 1 && f.isPlayerControlled) {
              const inp = p1InputRef.current;
              if (inp.carToggle && !carToggleLatchRef.current) {
                carToggleLatchRef.current = true;
                if (f.drivingCarId) {
                  const drivenCar = cars.find((c) => c.id === f.drivingCarId);
                  if (drivenCar) drivenCar.driverId = null;
                  f.drivingCarId = null;
                  f.vy = -260;
                  f.grounded = false;
                  soundFX.jump();
                } else {
                  const nearbyCar = cars.find(
                    (c) => !c.driverId && Math.abs(c.x - f.x) < 76 && Math.abs(c.y - f.y) < 60
                  );
                  if (nearbyCar) {
                    nearbyCar.driverId = f.id;
                    f.drivingCarId = nearbyCar.id;
                    f.x = nearbyCar.x;
                    f.y = nearbyCar.y;
                    soundFX.carTurbo();
                    addFloatingText(f.x, f.y - 68, 'DRIVING!', '#fbbf24');
                  }
                }
              } else if (!inp.carToggle) {
                carToggleLatchRef.current = false;
              }
            }

            // Melee swing collision
            if (f.attackTimer > 0 && !f.drivingCarId) {
              f.attackTimer = Math.max(0, f.attackTimer - dt);
              const progress = 1 - f.attackTimer / f.attackTotal;
              if (!f.hasDealtSwingHit && progress >= 0.4) {
                f.hasDealtSwingHit = true;
                const targets = fighters.filter((t) => {
                  if (t.id === f.id || t.hp <= 0) return false;
                  if (isPassPlay) return true;
                  if (
                    config.mode === 'COOP_OFFLINE' ||
                    config.mode === 'ADVENTURE' ||
                    config.mode === 'MISSION'
                  ) {
                    return f.team === 'enemy' ? t.team !== 'enemy' : t.team === 'enemy';
                  }
                  return t.team !== f.team;
                });

                targets.forEach((t) => {
                  const dx = t.x - f.x;
                  const dy = Math.abs(t.y - f.y);
                  const inFront =
                    f.facing === 1 ? dx >= -16 && dx <= f.range : dx <= 16 && dx >= -f.range;
                  if (inFront && dy < 66) {
                    applyDamage(f, t, f.atk, f.facing * 200);
                  }
                });

                // Hit barricades or beacons in Adventure
                if (f.team !== 'enemy') {
                  worldObjects.forEach((obj) => {
                    if (
                      !obj.opened &&
                      (obj.kind === 'barricade' || obj.kind === 'beacon') &&
                      Math.abs(obj.x - f.x) < f.range + 22 &&
                      Math.abs(obj.y - f.y) < 70
                    ) {
                      obj.hp -= f.atk;
                      soundFX.hit(false);
                      spawnSparks(obj.x, obj.y - 24, '#fbbf24', 8);
                      if (obj.hp <= 0) {
                        obj.opened = true;
                        if (obj.kind === 'beacon') {
                          beaconsCleared++;
                          bonusGold += 35;
                          addFloatingText(obj.x, obj.y - 50, `Beacon ${beaconsCleared}/3!`, '#38bdf8');
                        } else {
                          bonusGold += 20;
                          addFloatingText(obj.x, obj.y - 45, '+20g', '#fbbf24');
                        }
                      }
                    }
                  });
                }
              }
            }

            // Movement & Driving Physics
            if (f.drivingCarId) {
              const car = cars.find((c) => c.id === f.drivingCarId);
              const carSpec = CARS.find((c) => c.id === f.loadout?.carId) || CARS[0];
              if (car) {
                const inp = p1InputRef.current;
                const boostActive = inp.dash && f.energy > 8;
                if (boostActive) {
                  f.energy = Math.max(0, f.energy - dt * 28);
                  if (Math.random() < 0.35) {
                    spawnSparks(car.x - car.facing * 48, car.y - 14, '#38bdf8', 2);
                  }
                }
                const targetMax = carSpec.topSpeed * (boostActive ? carSpec.nitroBoost : 1);
                if (inp.left) {
                  car.vx = Math.max(-targetMax, car.vx - 980 * dt);
                  car.facing = -1;
                } else if (inp.right) {
                  car.vx = Math.min(targetMax, car.vx + 980 * dt);
                  car.facing = 1;
                } else {
                  car.vx *= 0.92;
                }

                if (inp.jump && f.grounded) {
                  car.vy = -440;
                  f.grounded = false;
                  soundFX.jump();
                }

                car.vy += 1280 * dt;
                car.x = Math.max(55, Math.min(worldW - 55, car.x + car.vx * dt));
                car.y += car.vy * dt;
                if (car.y >= GROUND_Y) {
                  car.y = GROUND_Y;
                  car.vy = 0;
                  f.grounded = true;
                }
                car.wheelAngle += (car.vx * dt) / 13;

                f.x = car.x;
                f.y = car.y;
                f.vx = car.vx;
                f.facing = car.facing;
                f.guarding = false;

                // Fire roof gun turret
                if (inp.gun) fireGun(f);
                if (inp.skill0) castSkill(f, 0);
                if (inp.skill1) castSkill(f, 1);
                if (inp.skill2) castSkill(f, 2);

                // Ram enemies & barricades at speed
                if (Math.abs(car.vx) > 180 && car.ramCooldown <= 0) {
                  fighters.forEach((e) => {
                    if (e.team === 'enemy' && e.hp > 0 && Math.abs(e.x - car.x) < 58 && Math.abs(e.y - car.y) < 50) {
                      car.ramCooldown = 0.25;
                      soundFX.carRam();
                      applyDamage(f, e, carSpec.ramDamage * (boostActive ? 1.35 : 1), car.facing * 320, true);
                    }
                  });
                  worldObjects.forEach((obj) => {
                    if (!obj.opened && obj.kind === 'barricade' && Math.abs(obj.x - car.x) < 60) {
                      obj.opened = true;
                      bonusGold += 20;
                      soundFX.carRam();
                      spawnSparks(obj.x, obj.y - 20, '#d97706', 16);
                      addFloatingText(obj.x, obj.y - 45, 'SMASH +20g', '#fbbf24');
                    }
                  });
                }
              }
            } else {
              // On-Foot Physics
              if (f.stunTimer > 0) {
                f.vx *= 0.85;
              } else if (f.dashTimer > 0) {
                f.dashTimer = Math.max(0, f.dashTimer - dt);
              } else if (f.isPlayerControlled && (!isPassPlay || idx === passTurnIdx)) {
                const inp = f.controlSlot === 2 ? p2InputRef.current : p1InputRef.current;
                const spdMult = (f.slowTimer > 0 ? 0.55 : 1) * (f.hasteTimer > 0 ? 1.25 : 1);

                f.guarding = inp.guard && f.grounded;
                if (inp.left && !f.guarding) {
                  f.vx = -f.speed * spdMult;
                  f.facing = -1;
                } else if (inp.right && !f.guarding) {
                  f.vx = f.speed * spdMult;
                  f.facing = 1;
                } else {
                  f.vx *= 0.72;
                }

                if (inp.jump && f.grounded) {
                  f.vy = -520;
                  f.grounded = false;
                  soundFX.jump();
                }

                if (inp.dash && f.dashCooldown <= 0) {
                  f.dashTimer = 0.16;
                  f.dashCooldown = 1.0;
                  f.vx = f.facing * 650;
                  soundFX.dash();
                  spawnSparks(f.x, f.y - 20, f.color, 6);
                }

                if (inp.gun && !f.guarding) {
                  fireGun(f);
                } else if (inp.attack && f.attackCooldown <= 0 && !f.guarding) {
                  f.attackCooldown = f.atkCooldownMs / 1000;
                  f.attackTimer = Math.min(0.28, f.atkCooldownMs / 1000);
                  f.attackTotal = f.attackTimer;
                  f.hasDealtSwingHit = false;
                  soundFX.slash();

                  const weapon = WEAPONS.find((w) => w.id === f.loadout?.weaponId);
                  if (weapon?.kind === 'staff') {
                    projectiles.push({
                      x: f.x + f.facing * 24,
                      y: f.y - 30,
                      vx: f.facing * 430,
                      vy: 0,
                      radius: 7,
                      damage: f.atk * 0.72,
                      ownerId: f.id,
                      team: f.team,
                      color: '#fb923c',
                      life: 0.75,
                      pierce: false,
                      kind: 'ember',
                      hitIds: new Set(),
                    });
                  }
                }

                if (inp.skill0) castSkill(f, 0);
                if (inp.skill1) castSkill(f, 1);
                if (inp.skill2) castSkill(f, 2);
              } else if (!f.isPlayerControlled) {
                if (startIntroHoldTimer <= 0) {
                  runAI(f, dt);
                } else {
                  f.vx *= 0.7;
                }
              } else {
                f.vx *= 0.75;
                f.guarding = false;
              }

              const prevY = f.y;
              f.vy += 1280 * dt;
              f.x += f.vx * dt;
              f.y += f.vy * dt;
              f.x = Math.max(26, Math.min(worldW - 26, f.x));

              // Adventure Boss Gate lock until 3 beacons cleared
              if (isAdventure && f.team === 'p1' && beaconsCleared < 3 && f.x > 3620) {
                f.x = 3620;
                if (Math.random() < 0.08) {
                  addFloatingText(f.x, f.y - 68, `Clear 3 Beacons (${beaconsCleared}/3)`, '#fbbf24');
                }
              }

              f.grounded = false;
              if (f.vy >= 0) {
                for (const plat of platforms) {
                  if (
                    f.x >= plat.x - 10 &&
                    f.x <= plat.x + plat.w + 10 &&
                    prevY <= plat.y + 6 &&
                    f.y >= plat.y
                  ) {
                    f.y = plat.y;
                    f.vy = 0;
                    f.grounded = true;
                    break;
                  }
                }
              }

              if (f.y >= GROUND_Y) {
                f.y = GROUND_Y;
                f.vy = 0;
                f.grounded = true;
              }
            }

            // Adventure world pickups & hazards
            if (isAdventure && f.team === 'p1') {
              worldObjects.forEach((obj) => {
                if (obj.kind === 'hazard') {
                  if (
                    !f.drivingCarId &&
                    f.grounded &&
                    Math.abs(f.x - obj.x) < (obj.w || 80) / 2 &&
                    f.hurtTimer <= 0
                  ) {
                    f.hp = Math.max(1, f.hp - 10);
                    f.vy = -340;
                    f.grounded = false;
                    f.hurtTimer = 0.6;
                    soundFX.hit(false);
                    addFloatingText(f.x, f.y - 60, 'Hazard -10', '#f97316');
                  }
                  return;
                }
                if (obj.opened) return;
                if (Math.hypot(obj.x - f.x, obj.y - f.y) < 46) {
                  if (obj.kind === 'chest') {
                    obj.opened = true;
                    bonusGold += 55;
                    f.hp = Math.min(f.maxHp, f.hp + 30);
                    soundFX.pickup();
                    addFloatingText(obj.x, obj.y - 45, '+55g · +30 HP', '#fbbf24');
                    spawnSparks(obj.x, obj.y - 16, '#fbbf24', 14);
                  } else if (obj.kind === 'shrine') {
                    obj.opened = true;
                    const heal = Math.round(f.maxHp * 0.5);
                    f.hp = Math.min(f.maxHp, f.hp + heal);
                    f.hasteTimer = 6.0;
                    soundFX.skill('heal');
                    addFloatingText(obj.x, obj.y - 50, `Campfire +${heal} HP`, '#4ade80');
                    spawnSparks(obj.x, obj.y - 20, '#4ade80', 16);
                  }
                }
              });
            }
          });

          // Projectiles update (hits fighters + adventure beacons/barricades)
          for (let i = projectiles.length - 1; i >= 0; i--) {
            const pr = projectiles[i];
            pr.x += pr.vx * dt;
            pr.y += pr.vy * dt;
            pr.life -= dt;

            if (pr.life <= 0 || pr.x < 0 || pr.x > worldW) {
              projectiles.splice(i, 1);
              continue;
            }

            const owner = fighters.find((f) => f.id === pr.ownerId);
            let hitSomething = false;

            if (pr.team !== 'enemy' && isAdventure) {
              for (const obj of worldObjects) {
                if (
                  !obj.opened &&
                  (obj.kind === 'beacon' || obj.kind === 'barricade') &&
                  Math.abs(obj.x - pr.x) < 28 &&
                  Math.abs(obj.y - 24 - pr.y) < 34
                ) {
                  obj.hp -= pr.damage;
                  hitSomething = true;
                  spawnSparks(pr.x, pr.y, pr.color, 6);
                  if (obj.hp <= 0) {
                    obj.opened = true;
                    if (obj.kind === 'beacon') {
                      beaconsCleared++;
                      bonusGold += 35;
                      addFloatingText(obj.x, obj.y - 50, `Beacon ${beaconsCleared}/3!`, '#38bdf8');
                    } else {
                      bonusGold += 20;
                      addFloatingText(obj.x, obj.y - 45, '+20g', '#fbbf24');
                    }
                  }
                  break;
                }
              }
            }

            if (!hitSomething) {
              for (const t of fighters) {
                if (t.hp <= 0 || t.id === pr.ownerId || pr.hitIds.has(t.id)) continue;
                const isHostile = isPassPlay
                  ? true
                  : config.mode === 'COOP_OFFLINE' ||
                      config.mode === 'ADVENTURE' ||
                      config.mode === 'MISSION'
                    ? pr.team === 'enemy'
                      ? t.team !== 'enemy'
                      : t.team === 'enemy'
                    : t.team !== pr.team;

                if (!isHostile) continue;
                if (
                  Math.abs(t.x - pr.x) < 22 + pr.radius &&
                  Math.abs(t.y - 28 - pr.y) < 36 + pr.radius
                ) {
                  pr.hitIds.add(t.id);
                  if (owner) {
                    applyDamage(owner, t, pr.damage, pr.vx >= 0 ? 150 : -150, true);
                  }
                  hitSomething = true;
                  if (!pr.pierce) break;
                }
              }
            }

            if (hitSomething && !pr.pierce) {
              projectiles.splice(i, 1);
            }
          }

          // Particles & Floating Texts
          for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 320 * dt;
            p.life -= dt;
            if (p.life <= 0) particles.splice(i, 1);
          }
          for (let i = floatingTexts.length - 1; i >= 0; i--) {
            const ft = floatingTexts[i];
            ft.y += ft.vy * dt;
            ft.life -= dt;
            if (ft.life <= 0) floatingTexts.splice(i, 1);
          }

          if (screenShake > 0) screenShake = Math.max(0, screenShake - dt * 25);

          const p1 = fighters[0];
          if (isAdventure && p1) {
            const targetCam = Math.max(0, Math.min(worldW - LOGICAL_W, p1.x - LOGICAL_W * 0.36));
            cameraX += (targetCam - cameraX) * Math.min(1, dt * 8);
          }

          // Mode Win/Loss
          if (config.mode === 'ADVENTURE') {
            const boss = fighters.find((f) => f.isBoss);
            if (p1.hp <= 0) {
              triggerDeathSequence(
                'GAME OVER — YOU DIED',
                `You died in ${region.name}. Spend your earned Gold in the Shop to buy Potions, Weapons & Armor!`
              );
            } else if (boss && boss.hp <= 0) {
              triggerVictorySequence(
                `${region.name} Conquered!`,
                `Cleared ${beaconsCleared}/3 Beacons and defeated ${region.bossName}!`
              );
            }
          } else if (config.mode === 'MISSION' && config.mission) {
            const m = config.mission;
            if (p1.hp <= 0) {
              triggerDeathSequence(
                'GAME OVER — YOU DIED',
                `You died during ${m.title}. Upgrade your Sword, Gun, or buy Potions in the Shop!`
              );
            } else if (m.objectiveType === 'no_heal' && usedHealInNoHeal) {
              triggerDeathSequence(
                'GAME OVER — TRIAL BROKEN',
                'Healing was used during a No-Heal Trial.'
              );
            } else if (m.timeLimitSec && elapsedSec >= m.timeLimitSec) {
              if (m.objectiveType === 'survive') {
                triggerVictorySequence(
                  'Mission Cleared!',
                  `Survived ${m.timeLimitSec}s! Next mission difficulty increased.`
                );
              } else {
                triggerDeathSequence(
                  'GAME OVER — TIME EXPIRED',
                  `Time ran out on ${m.title} (${m.timeLimitSec}s limit).`
                );
              }
            } else if (m.objectiveType === 'slay' || m.objectiveType === 'vehicle_raid') {
              if (kills >= m.targetCount) {
                triggerVictorySequence(
                  'Mission Cleared!',
                  `Eliminated ${kills} enemies! Next mission is now harder with bigger Gold rewards.`
                );
              } else {
                const activeEnemies = fighters.filter((f) => f.team === 'enemy' && f.hp > 0).length;
                spawnTimer -= dt;
                if (activeEnemies < 4 && spawnTimer <= 0 && kills + activeEnemies < m.targetCount) {
                  spawnTimer = 1.3;
                  const kind = region.enemyTypes[Math.floor(Math.random() * region.enemyTypes.length)];
                  const sideX = Math.random() < 0.5 ? 65 : LOGICAL_W - 65;
                  fighters.push(createEnemy(`ms_${Date.now()}_${Math.random()}`, kind, sideX));
                }
              }
            } else if (m.objectiveType === 'survive') {
              const activeEnemies = fighters.filter((f) => f.team === 'enemy' && f.hp > 0).length;
              spawnTimer -= dt;
              if (activeEnemies < 4 && spawnTimer <= 0) {
                spawnTimer = 1.65;
                const kind = region.enemyTypes[Math.floor(Math.random() * region.enemyTypes.length)];
                const sideX = Math.random() < 0.5 ? 60 : LOGICAL_W - 60;
                fighters.push(createEnemy(`sv_${Date.now()}_${Math.random()}`, kind, sideX));
              }
            } else if (m.objectiveType === 'boss_rush' || m.objectiveType === 'no_heal') {
              const boss = fighters.find((f) => f.isBoss);
              if (boss && boss.hp <= 0) {
                triggerVictorySequence(
                  'Boss Vanquished!',
                  `Defeated ${region.bossName} in ${Math.round(elapsedSec)}s!`
                );
              }
            }
          } else if (config.mode === 'ARENA' || config.mode === 'DUEL_OFFLINE') {
            const f1 = fighters[0];
            const f2 = fighters[1];
            roundTimer -= dt;
            if (f1.hp <= 0 || f2.hp <= 0 || roundTimer <= 0) {
              const p1WonRound =
                f2.hp <= 0 || (roundTimer <= 0 && f1.hp / f1.maxHp >= f2.hp / f2.maxHp);
              if (p1WonRound) roundsP1++;
              else roundsP2++;

              if (roundsP1 >= 2 || roundsP2 >= 2) {
                const winner = roundsP1 >= 2 ? f1 : f2;
                const p1IsChamp = roundsP1 >= 2;
                const summary = `Final Score: ${f1.name} ${roundsP1} - ${roundsP2} ${f2.name}`;
                if (config.mode === 'ARENA' && !p1IsChamp) {
                  triggerDeathSequence('GAME OVER — YOU DIED', summary, winner.name);
                } else {
                  triggerVictorySequence(`${winner.name} Wins!`, summary, winner.name);
                }
              } else {
                arenaRound++;
                roundTimer = 60;
                roundBannerTimer = 1.6;
                startIntroHoldTimer = 0.7;
                f1.hp = f1.maxHp;
                f1.energy = 100;
                f1.x = 200;
                f1.y = GROUND_Y;
                f1.facing = 1;
                f2.hp = f2.maxHp;
                f2.energy = 100;
                f2.x = 760;
                f2.y = GROUND_Y;
                f2.facing = -1;
                projectiles.length = 0;
              }
            }
          } else if (config.mode === 'COOP_OFFLINE') {
            const f1 = fighters[0];
            const f2 = fighters[1];
            if (f1.hp <= 0 && f2.hp <= 0) {
              triggerDeathSequence(
                'GAME OVER — TEAM DEFEATED',
                `Both heroes died at Wave ${coopWave} in ${region.name}.`
              );
            } else {
              const aliveEnemies = fighters.filter((f) => f.team === 'enemy' && f.hp > 0).length;
              if (aliveEnemies === 0) {
                if (coopWave >= 3) {
                  triggerVictorySequence(
                    'Co-Op Victory!',
                    `${f1.name} & ${f2.name} cleared all 3 waves in ${region.name}!`
                  );
                } else {
                  coopWave++;
                  roundBannerTimer = 1.6;
                  startIntroHoldTimer = 0.7;
                  const count = coopWave === 2 ? 4 : 3;
                  for (let i = 0; i < count; i++) {
                    const kind =
                      coopWave === 3 && i === 0
                        ? 'boss'
                        : region.enemyTypes[i % region.enemyTypes.length];
                    fighters.push(
                      createEnemy(`cw_${coopWave}_${i}`, kind, i % 2 === 0 ? 80 : LOGICAL_W - 80)
                    );
                  }
                }
              }
            }
          } else if (config.mode === 'PASS_PLAY') {
            const alive = fighters.filter((f) => f.hp > 0);
            if (alive.length === 1) {
              triggerVictorySequence(
                `${alive[0].name} Prevails!`,
                `${alive[0].name} won the ${fighters.length}-player Pass-and-Play Skirmish!`,
                alive[0].name
              );
            }
          }
          }
        }
      }

      // Render Graphics Frame
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.save();
        if (screenShake > 0) {
          ctx.translate(
            (Math.random() - 0.5) * screenShake,
            (Math.random() - 0.5) * screenShake
          );
        }

        // Layer 1: Sky & Painted Backdrop Parallax
        if (bgImgRef.current) {
          const img = bgImgRef.current;
          if (isAdventure) {
            const parallaxX = -(cameraX * 0.35) % LOGICAL_W;
            ctx.drawImage(img, parallaxX, 0, LOGICAL_W, LOGICAL_H);
            ctx.drawImage(img, parallaxX + LOGICAL_W, 0, LOGICAL_W, LOGICAL_H);
          } else {
            ctx.drawImage(img, 0, 0, LOGICAL_W, LOGICAL_H);
          }
          ctx.fillStyle = region.tintOverlay || 'rgba(9, 12, 18, 0.34)';
          ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
        } else {
          const sky = ctx.createLinearGradient(0, 0, 0, LOGICAL_H);
          sky.addColorStop(0, region.skyFallback[0]);
          sky.addColorStop(1, region.skyFallback[1]);
          ctx.fillStyle = sky;
          ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
        }

        // Layer 2: Volumetric Light Shafts & Ambient Motes
        ctx.save();
        const beamGrad = ctx.createLinearGradient(160, 0, 320, GROUND_Y);
        beamGrad.addColorStop(0, `${region.ambientColor}18`);
        beamGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(140, 0);
        ctx.lineTo(270, 0);
        ctx.lineTo(440, GROUND_Y);
        ctx.lineTo(250, GROUND_Y);
        ctx.closePath();
        ctx.fill();

        ambientMotes.forEach((m) => {
          ctx.fillStyle = region.ambientColor;
          ctx.globalAlpha = m.alpha;
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
        ctx.restore();

        ctx.save();
        ctx.translate(-cameraX, 0);

        // Layer 3: Detailed Ground & Highway Road Markings
        ctx.fillStyle = region.groundColor;
        ctx.fillRect(0, GROUND_Y, worldW, LOGICAL_H - GROUND_Y);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(0, GROUND_Y, worldW, 3);
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        for (let gx = 40; gx < worldW; gx += 90) {
          ctx.fillRect(gx, GROUND_Y + 26, 44, 4);
        }

        // Layer 4: Stone Platforms
        platforms.forEach((p) => {
          const pGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + 14);
          pGrad.addColorStop(0, '#475569');
          pGrad.addColorStop(1, '#1e293b');
          ctx.fillStyle = pGrad;
          ctx.beginPath();
          ctx.roundRect(p.x, p.y, p.w, 14, 4);
          ctx.fill();
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(p.x + 4, p.y, p.w - 8, 2.5);
        });

        // Layer 5: World Objects (Hazards, Beacons, Barricades, Chests, Shrines, Boss Gate)
        worldObjects.forEach((obj) => {
          if (obj.kind === 'hazard') {
            const hw = obj.w || 90;
            const hGrad = ctx.createLinearGradient(obj.x, GROUND_Y - 6, obj.x, GROUND_Y + 12);
            hGrad.addColorStop(0, '#f97316');
            hGrad.addColorStop(1, '#991b1b');
            ctx.fillStyle = hGrad;
            ctx.fillRect(obj.x - hw / 2, GROUND_Y - 2, hw, 10);
          } else if (obj.kind === 'barricade' && !obj.opened) {
            ctx.fillStyle = '#78350f';
            ctx.fillRect(obj.x - 18, obj.y - 44, 36, 44);
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(obj.x - 18, obj.y - 44);
            ctx.lineTo(obj.x + 18, obj.y);
            ctx.moveTo(obj.x + 18, obj.y - 44);
            ctx.lineTo(obj.x - 18, obj.y);
            ctx.stroke();
          } else if (obj.kind === 'beacon') {
            ctx.fillStyle = obj.opened ? '#334155' : '#0f172a';
            ctx.fillRect(obj.x - 14, obj.y - 52, 28, 52);
            ctx.fillStyle = obj.opened ? '#64748b' : '#38bdf8';
            ctx.beginPath();
            ctx.arc(obj.x, obj.y - 60, 10 + (obj.opened ? 0 : Math.sin(animClock * 6) * 2), 0, Math.PI * 2);
            ctx.fill();
            if (!obj.opened) {
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(obj.x - 20, obj.y - 78, 40, 4);
              ctx.fillStyle = '#38bdf8';
              ctx.fillRect(obj.x - 20, obj.y - 78, 40 * (obj.hp / obj.maxHp), 4);
            }
          } else if (obj.kind === 'chest') {
            ctx.fillStyle = obj.opened ? '#475569' : '#d97706';
            ctx.beginPath();
            ctx.roundRect(obj.x - 16, obj.y - 24, 32, 24, 4);
            ctx.fill();
            ctx.fillStyle = obj.opened ? '#64748b' : '#fde047';
            ctx.fillRect(obj.x - 4, obj.y - 16, 8, 8);
          } else if (obj.kind === 'shrine') {
            ctx.fillStyle = obj.opened ? '#334155' : '#059669';
            ctx.beginPath();
            ctx.moveTo(obj.x - 18, obj.y);
            ctx.lineTo(obj.x, obj.y - 46);
            ctx.lineTo(obj.x + 18, obj.y);
            ctx.closePath();
            ctx.fill();
            if (!obj.opened) {
              ctx.fillStyle = '#6ee7b7';
              ctx.beginPath();
              ctx.arc(obj.x, obj.y - 26, 6 + Math.sin(animClock * 5) * 1.5, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        });

        // Boss Gate Energy Barrier in Adventure
        if (isAdventure && beaconsCleared < 3) {
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(3640, GROUND_Y);
          ctx.lineTo(3640, 150);
          ctx.stroke();
        }

        // Layer 6: Cars (unoccupied cars drawn here; occupied cars draw with driver)
        cars.forEach((car) => {
          const driver = fighters.find((f) => f.id === car.driverId);
          drawCarSprite(ctx, {
            x: car.x,
            y: car.y,
            facing: car.facing,
            carId: car.carItemId,
            wheelAngle: car.wheelAngle,
            speedRatio: car.vx / 450,
            nitroActive: !!driver && p1InputRef.current.dash && driver.energy > 8,
            occupied: !!driver,
            driverColor: driver?.color,
            scale: 1,
          });
        });

        // Layer 7: Fighters (draw fallen silhouette during death sequence!)
        fighters.forEach((f, idx) => {
          if (f.hp <= 0) {
            if (f.id === 'p1' && deathSequenceTimer > 0) {
              ctx.save();
              ctx.translate(f.x, f.y - 6);
              ctx.rotate(-Math.PI / 2);
              ctx.globalAlpha = 0.72;
              if (f.loadout) {
                drawHeroSprite(ctx, {
                  x: 0,
                  y: 0,
                  facing: f.facing,
                  loadout: f.loadout,
                  animTime: animClock,
                  isMoving: false,
                  isGrounded: true,
                  attackProgress: 0,
                  gunFlash: 0,
                  isGuarding: false,
                  isShielded: false,
                  isHurt: true,
                  scale: 1,
                });
              }
              ctx.restore();
            }
            return;
          }
          if (!f.drivingCarId) {
            if (f.loadout) {
              drawHeroSprite(ctx, {
                x: f.x,
                y: f.y,
                facing: f.facing,
                loadout: f.loadout,
                animTime: animClock,
                isMoving: Math.abs(f.vx) > 15,
                isGrounded: f.grounded,
                attackProgress: f.attackTimer > 0 ? 1 - f.attackTimer / f.attackTotal : 0,
                gunFlash: f.gunFlashTimer / 0.14,
                isGuarding: f.guarding,
                isShielded: f.shieldTimer > 0,
                isHurt: f.hurtTimer > 0,
                scale: 1,
              });
            } else {
              const sc = f.isBoss ? 1.55 : 1;
              ctx.save();
              ctx.translate(f.x, f.y);
              ctx.scale(f.facing * sc, sc);
              if (f.hurtTimer > 0) ctx.filter = 'brightness(1.85)';

              ctx.fillStyle = 'rgba(0,0,0,0.4)';
              ctx.beginPath();
              ctx.ellipse(0, 2, 16, 4.5, 0, 0, Math.PI * 2);
              ctx.fill();

              const bob = Math.abs(f.vx) > 10 ? Math.sin(animClock * 12) * 2.5 : 0;
              ctx.fillStyle = f.color;
              ctx.beginPath();
              ctx.roundRect(-12, -38 + bob, 24, 28, 5);
              ctx.fill();

              ctx.fillStyle = f.isBoss ? '#0f172a' : '#1e293b';
              ctx.beginPath();
              ctx.arc(0, -46 + bob, 10, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#f87171';
              ctx.fillRect(3, -48 + bob, 5, 3);

              if (f.isBoss) {
                ctx.fillStyle = '#fbbf24';
                ctx.beginPath();
                ctx.moveTo(-8, -53 + bob);
                ctx.lineTo(-14, -66 + bob);
                ctx.lineTo(-3, -55 + bob);
                ctx.moveTo(8, -53 + bob);
                ctx.lineTo(14, -66 + bob);
                ctx.lineTo(3, -55 + bob);
                ctx.fill();
              }

              ctx.fillStyle = '#cbd5e1';
              ctx.save();
              ctx.translate(8, -28 + bob);
              ctx.rotate(f.attackTimer > 0 ? 1.1 : -0.3);
              ctx.fillRect(0, -2, 22, 4);
              ctx.restore();
              ctx.restore();
            }
          }

          if (isPassPlay && idx === passTurnIdx) {
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(f.x, f.y + 4, 24, 7, 0, 0, Math.PI * 2);
            ctx.stroke();
          }

          if (f.team === 'enemy' || isSimultaneous2P || isPassPlay) {
            const barW = f.isBoss ? 76 : 44;
            const barY = f.y - (f.isBoss ? 108 : 74);
            ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
            ctx.fillRect(f.x - barW / 2, barY, barW, 5);
            ctx.fillStyle = f.team === 'enemy' ? '#ef4444' : f.color;
            ctx.fillRect(f.x - barW / 2, barY, barW * (f.hp / f.maxHp), 5);
          }
        });

        // Layer 8: Projectiles & Bullets
        projectiles.forEach((pr) => {
          ctx.fillStyle = pr.color;
          if (pr.kind === 'bullet') {
            ctx.fillRect(pr.x - 8, pr.y - 2, 16, 4);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(pr.x - 2, pr.y - 1, 6, 2);
          } else if (pr.kind === 'lightning') {
            ctx.fillRect(pr.x - 18, pr.y - 3, 36, 6);
          } else {
            ctx.beginPath();
            ctx.arc(pr.x, pr.y, pr.radius, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        particles.forEach((p) => {
          ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        });
        ctx.globalAlpha = 1;

        ctx.font = '700 13px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        floatingTexts.forEach((ft) => {
          ctx.globalAlpha = Math.min(1, ft.life * 1.6);
          ctx.fillStyle = ft.color;
          ctx.fillText(ft.text, ft.x, ft.y);
        });
        ctx.globalAlpha = 1;

        ctx.restore(); // camera

        if (deathSequenceTimer > 0) {
          ctx.fillStyle = 'rgba(127, 29, 29, 0.42)';
          ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
          ctx.fillStyle = 'rgba(9, 12, 18, 0.78)';
          ctx.fillRect(0, LOGICAL_H / 2 - 58, LOGICAL_W, 116);
          ctx.textAlign = 'center';
          ctx.font = '800 40px "Cinzel", serif';
          ctx.fillStyle = '#ef4444';
          ctx.fillText('YOU DIED', LOGICAL_W / 2, LOGICAL_H / 2 - 6);
          ctx.font = '700 18px "Outfit", sans-serif';
          ctx.fillStyle = '#fbbf24';
          ctx.fillText('GAME OVER', LOGICAL_W / 2, LOGICAL_H / 2 + 28);
        } else if (victorySequenceTimer > 0) {
          ctx.fillStyle = 'rgba(14, 17, 23, 0.72)';
          ctx.fillRect(0, LOGICAL_H / 2 - 50, LOGICAL_W, 100);
          ctx.textAlign = 'center';
          ctx.font = '800 36px "Cinzel", serif';
          ctx.fillStyle = '#4ade80';
          ctx.fillText('STAGE CLEAR!', LOGICAL_W / 2, LOGICAL_H / 2 + 4);
          ctx.font = '600 14px "Outfit", sans-serif';
          ctx.fillStyle = '#fde047';
          ctx.fillText(`Gold & XP Earned!`, LOGICAL_W / 2, LOGICAL_H / 2 + 30);
        } else if (roundBannerTimer > 0) {
          const isGoPhase = roundBannerTimer <= 0.9;
          ctx.fillStyle = 'rgba(14, 17, 23, 0.78)';
          ctx.fillRect(0, LOGICAL_H / 2 - 52, LOGICAL_W, 104);
          ctx.textAlign = 'center';

          const topTag =
            config.mode === 'COOP_OFFLINE'
              ? `WAVE ${coopWave} STARTING`
              : config.mode === 'ARENA' || config.mode === 'DUEL_OFFLINE'
                ? `ROUND ${arenaRound} STARTING`
                : config.mode === 'MISSION' && config.mission
                  ? `MISSION START · ${config.mission.title.toUpperCase()}`
                  : `LEVEL START · ${region.name.toUpperCase()}`;

          ctx.font = '700 13px "Outfit", sans-serif';
          ctx.fillStyle = '#cbd5e1';
          ctx.fillText(topTag, LOGICAL_W / 2, LOGICAL_H / 2 - 18);

          ctx.font = '800 32px "Cinzel", serif';
          ctx.fillStyle = isGoPhase ? '#4ade80' : '#fbbf24';
          ctx.fillText(
            isGoPhase ? 'FIGHT! GO!' : 'GET READY!',
            LOGICAL_W / 2,
            LOGICAL_H / 2 + 18
          );

          ctx.font = '500 12px "Outfit", sans-serif';
          ctx.fillStyle = '#94a3b8';
          const subObjective =
            config.mode === 'ADVENTURE'
              ? `Destroy 3 Beacons & Defeat ${region.bossName}`
              : config.mode === 'MISSION' && config.mission
                ? config.mission.description
                : 'Defeat your opponent — Best of 3';
          ctx.fillText(subObjective, LOGICAL_W / 2, LOGICAL_H / 2 + 40);
        }

        ctx.restore();
      }

      // Sync HUD
      hudTick += rawDt;
      if (hudTick >= 0.08) {
        hudTick = 0;
        const p1 = fighters[0];
        const p2 = fighters[1];
        const boss = fighters.find((f) => f.isBoss && f.hp > 0 && Math.abs(f.x - p1.x) < 680);
        const nearCar =
          !!p1 &&
          !p1.drivingCarId &&
          cars.some((c) => !c.driverId && Math.abs(c.x - p1.x) < 76 && Math.abs(c.y - p1.y) < 60);

        let objText = '';
        let subText = '';
        if (config.mode === 'ADVENTURE') {
          const pct = Math.min(100, Math.round((p1.x / 3920) * 100));
          objText = `${region.name} · ${pct}%`;
          subText = `Beacons ${beaconsCleared}/3 · ${kills} Slain`;
        } else if (config.mode === 'MISSION' && config.mission) {
          const m = config.mission;
          if (m.objectiveType === 'slay' || m.objectiveType === 'vehicle_raid') {
            objText = `${m.title}: ${kills}/${m.targetCount}`;
            if (m.timeLimitSec) {
              subText = `${Math.max(0, Math.ceil(m.timeLimitSec - elapsedSec))}s Left · Threat x${config.missionThreatTier || 1}`;
            }
          } else if (m.objectiveType === 'survive') {
            const left = Math.max(0, Math.ceil((m.timeLimitSec || 45) - elapsedSec));
            objText = `${m.title}: ${left}s Left`;
            subText = `Threat Tier ${config.missionThreatTier || 1}`;
          } else {
            objText = m.title;
            subText = `Threat Tier ${config.missionThreatTier || 1}`;
          }
        } else if (config.mode === 'COOP_OFFLINE') {
          objText = `Co-Op Wave ${coopWave}/3 · ${kills} Slain`;
        } else if (config.mode === 'ARENA' || config.mode === 'DUEL_OFFLINE') {
          objText = `Round ${arenaRound} · ${Math.ceil(roundTimer)}s`;
        } else if (config.mode === 'PASS_PLAY') {
          objText = `Round ${passRoundNum} · ${fighters[passTurnIdx]?.name}'s Turn`;
        }

        const mins = Math.floor(elapsedSec / 60);
        const secs = Math.floor(elapsedSec % 60);
        const timerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        setHudState({
          p1Hp: Math.round(p1?.hp || 0),
          p1MaxHp: Math.round(p1?.maxHp || 100),
          p1Energy: Math.round(p1?.energy || 0),
          p1Name: p1?.name || save.hero.name,
          p2Hp: Math.round(p2?.hp || 0),
          p2MaxHp: Math.round(p2?.maxHp || 100),
          p2Name: p2?.name || '',
          p2Visible:
            !!p2 &&
            (config.mode === 'ARENA' ||
              config.mode === 'DUEL_OFFLINE' ||
              config.mode === 'COOP_OFFLINE'),
          skillCds: p1
            ? [
                Number(p1.skillCooldowns[0].toFixed(1)),
                Number(p1.skillCooldowns[1].toFixed(1)),
                Number(p1.skillCooldowns[2].toFixed(1)),
              ]
            : [0, 0, 0],
          inCar: !!p1?.drivingCarId,
          canEnterCar: nearCar,
          goldInMatch: bonusGold,
          objectiveText: objText,
          subObjectiveText: subText,
          timerText,
          bossName: boss ? boss.name : '',
          bossHp: boss ? Math.round(boss.hp) : 0,
          bossMaxHp: boss ? Math.round(boss.maxHp) : 0,
          roundsP1,
          roundsP2,
          roundLabel:
            config.mode === 'ARENA' || config.mode === 'DUEL_OFFLINE'
              ? `${roundsP1} - ${roundsP2}`
              : '',
          activeTurnName: isPassPlay ? fighters[passTurnIdx]?.name || '' : '',
          turnTimeLeft: isPassPlay ? Number(passTurnTimeLeft.toFixed(1)) : 0,
        });
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [config, region, runNonce]);

  // Keyboard bindings (P1: WASD + J/F Sword + Q/C Gun + E/V Car + G Guard + Shift Dash + 1/2/3 Skills)
  useEffect(() => {
    const is2P = config.mode === 'DUEL_OFFLINE' || config.mode === 'COOP_OFFLINE';

    const handleKey = (e: KeyboardEvent, down: boolean) => {
      if (e.key === 'Escape' && down) {
        setPaused((p) => !p);
        return;
      }

      const k = e.key.toLowerCase();
      const p1 = p1InputRef.current;
      const p2 = p2InputRef.current;

      if (k === 'a' || (!is2P && e.key === 'ArrowLeft')) p1.left = down;
      if (k === 'd' || (!is2P && e.key === 'ArrowRight')) p1.right = down;
      if (k === 'w' || k === ' ' || (!is2P && e.key === 'ArrowUp')) p1.jump = down;
      if (k === 'j' || k === 'f') p1.attack = down;
      if (k === 'q' || k === 'c') p1.gun = down;
      if (k === 'e' || k === 'v') p1.carToggle = down;
      if ((k === 'k' && !is2P) || k === 'g') p1.guard = down;
      if (k === 'shift' || k === 'h') p1.dash = down;
      if (k === '1' || k === 'u') p1.skill0 = down;
      if (k === '2' || k === 'i') p1.skill1 = down;
      if (k === '3' || k === 'o') p1.skill2 = down;
      if (k === 'r' && down) potionRequestRef.current = true;

      if (is2P) {
        if (e.key === 'ArrowLeft') p2.left = down;
        if (e.key === 'ArrowRight') p2.right = down;
        if (e.key === 'ArrowUp') p2.jump = down;
        if (k === 'k') p2.attack = down;
        if (k === 'm') p2.gun = down;
        if (k === 'l') p2.guard = down;
        if (k === ';') p2.skill0 = down;
        if (k === "'") p2.dash = down;
      }
    };

    const onDown = (e: KeyboardEvent) => handleKey(e, true);
    const onUp = (e: KeyboardEvent) => handleKey(e, false);
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [config.mode]);

  const bindTouchP2 = (field: keyof TouchInputPayload) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      p2InputRef.current[field] = true;
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      p2InputRef.current[field] = false;
    },
    onPointerLeave: () => {
      p2InputRef.current[field] = false;
    },
    onPointerCancel: () => {
      p2InputRef.current[field] = false;
    },
  });

  const bindTouchP1 = (field: keyof TouchInputPayload) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      p1InputRef.current[field] = true;
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      p1InputRef.current[field] = false;
    },
    onPointerLeave: () => {
      p1InputRef.current[field] = false;
    },
    onPointerCancel: () => {
      p1InputRef.current[field] = false;
    },
  });

  const isDualTouchMode = config.mode === 'DUEL_OFFLINE' || config.mode === 'COOP_OFFLINE';
  const equippedSkills = save.hero.skillIds.map(
    (id) => SKILLS.find((s) => s.id === id) || SKILLS[0]
  );

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[#090c12] overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        width={LOGICAL_W}
        height={LOGICAL_H}
        className="h-full w-full object-contain"
      />

      {/* Top Unobtrusive HUD */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 flex items-start justify-between gap-3 px-3 pt-2">
        <div className="w-44 sm:w-56 rounded-lg border border-slate-800/80 bg-[#0e1117]/80 px-2.5 py-1.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-100 truncate">
              {hudState.p1Name} {hudState.inCar ? '· Driving' : ''}
            </span>
            <span className="font-mono-num text-emerald-400">
              {hudState.p1Hp}/{hudState.p1MaxHp}
            </span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-emerald-500 transition-all duration-100"
              style={{
                width: `${Math.max(0, Math.min(100, (hudState.p1Hp / Math.max(1, hudState.p1MaxHp)) * 100))}%`,
              }}
            />
          </div>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-sky-400"
              style={{ width: `${Math.max(0, Math.min(100, hudState.p1Energy))}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="rounded-lg border border-slate-800/80 bg-[#0e1117]/85 px-3 py-1 text-center backdrop-blur-sm">
            <div className="text-[11px] font-semibold text-amber-300">
              {hudState.objectiveText}
            </div>
            <div className="flex items-center justify-center gap-1.5 font-mono-num text-[10px] text-slate-400">
              <span>
                {hudState.subObjectiveText ? `${hudState.subObjectiveText} · ` : ''}
                {hudState.roundLabel ? `Score ${hudState.roundLabel} · ` : ''}
                {hudState.timerText}
                {config.mode === 'PASS_PLAY' && ` · ${hudState.turnTimeLeft}s`}
              </span>
              <span className="text-slate-600">·</span>
              <span className="inline-flex items-center gap-0.5 font-bold text-amber-400">
                <Coins className="h-2.5 w-2.5" />+{hudState.goldInMatch}g
              </span>
            </div>
          </div>

          {hudState.bossName && (
            <div className="mt-1.5 w-52 rounded-md border border-rose-500/40 bg-[#0e1117]/85 px-2.5 py-1">
              <div className="flex justify-between text-[10px] font-semibold text-rose-300">
                <span>{hudState.bossName}</span>
                <span className="font-mono-num">{hudState.bossHp}</span>
              </div>
              <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-rose-500"
                  style={{
                    width: `${Math.max(0, (hudState.bossHp / Math.max(1, hudState.bossMaxHp)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-start gap-2">
          {hudState.p2Visible && (
            <div className="w-36 sm:w-44 rounded-lg border border-slate-800/80 bg-[#0e1117]/80 px-2.5 py-1.5 backdrop-blur-sm">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-100 truncate">{hudState.p2Name}</span>
                <span className="font-mono-num text-rose-400">
                  {hudState.p2Hp}/{hudState.p2MaxHp}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-rose-500 transition-all duration-100"
                  style={{
                    width: `${Math.max(0, Math.min(100, (hudState.p2Hp / Math.max(1, hudState.p2MaxHp)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="pointer-events-auto flex items-center gap-1.5">
            {config.mode === 'PASS_PLAY' && !passOverlay && (
              <button
                type="button"
                onClick={() =>
                  (window as unknown as { __endPassTurn?: () => void }).__endPassTurn?.()
                }
                className="min-h-[34px] rounded-full bg-amber-500 px-3 py-1 text-[11px] font-bold text-slate-950 hover:bg-amber-400"
              >
                End Turn
              </button>
            )}
            <button
              type="button"
              onClick={onToggleMute}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/80 bg-[#0e1117]/85 text-slate-200 hover:bg-slate-800"
              aria-label="Toggle audio"
            >
              {save.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/80 bg-[#0e1117]/85 text-slate-200 hover:bg-slate-800"
              aria-label="Pause game"
            >
              <Pause className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Circular Controls */}
      {!isDualTouchMode ? (
        <CircularControls
          settings={save.controllerSettings}
          skills={equippedSkills}
          skillCds={hudState.skillCds}
          inCar={hudState.inCar}
          canEnterCar={hudState.canEnterCar}
          potions={save.potions}
          disableHealing={config.mission?.objectiveType === 'no_heal'}
          onUsePotion={() => {
            potionRequestRef.current = true;
          }}
          onInputChange={(field, active) => {
            p1InputRef.current[field] = active;
          }}
          onJoystickUpdate={(left, right, jump) => {
            p1InputRef.current.left = left;
            p1InputRef.current.right = right;
            p1InputRef.current.jump = jump;
          }}
        />
      ) : (
        /* Shared-Screen 2P Circular Split Controls */
        <div
          className="pointer-events-none absolute bottom-2 left-2 right-2 flex items-end justify-between gap-4"
          style={{ opacity: save.controllerSettings.opacity }}
        >
          {/* P1 Circular Pad */}
          <div className="pointer-events-auto flex flex-col gap-1.5 touch-none p-1">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                {...bindTouchP1('attack')}
                className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-rose-400 bg-rose-600/90 text-[10px] font-bold text-white active:scale-95"
              >
                ATK
              </button>
              <button
                type="button"
                {...bindTouchP1('gun')}
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-600/90 text-[10px] font-bold text-white active:scale-95"
              >
                GUN
              </button>
              <button
                type="button"
                {...bindTouchP1('skill0')}
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-sky-400 bg-slate-900/85 text-[10px] font-bold text-sky-300 active:scale-95"
              >
                SKL
              </button>
              <button
                type="button"
                {...bindTouchP1('guard')}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-600 bg-slate-900/85 text-[9px] font-semibold text-slate-200 active:bg-sky-500"
              >
                BLK
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                {...bindTouchP1('left')}
                className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-slate-600 bg-slate-900/80 text-slate-100 active:bg-amber-500 active:text-slate-950"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                {...bindTouchP1('jump')}
                className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-slate-600 bg-slate-900/80 text-slate-100 active:bg-amber-500 active:text-slate-950"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
              <button
                type="button"
                {...bindTouchP1('right')}
                className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-slate-600 bg-slate-900/80 text-slate-100 active:bg-amber-500 active:text-slate-950"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* P2 Circular Pad */}
          <div className="pointer-events-auto flex flex-col items-end gap-1.5 touch-none p-1">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                {...bindTouchP2('guard')}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-600 bg-slate-900/85 text-[9px] font-semibold text-slate-200 active:bg-sky-500"
              >
                BLK
              </button>
              <button
                type="button"
                {...bindTouchP2('skill0')}
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-sky-400 bg-slate-900/85 text-[10px] font-bold text-sky-300 active:scale-95"
              >
                SKL
              </button>
              <button
                type="button"
                {...bindTouchP2('gun')}
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-600/90 text-[10px] font-bold text-white active:scale-95"
              >
                GUN
              </button>
              <button
                type="button"
                {...bindTouchP2('attack')}
                className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-rose-400 bg-rose-600/90 text-[10px] font-bold text-white active:scale-95"
              >
                ATK
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                {...bindTouchP2('left')}
                className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-slate-600 bg-slate-900/80 text-slate-100 active:bg-amber-500 active:text-slate-950"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                {...bindTouchP2('jump')}
                className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-slate-600 bg-slate-900/80 text-slate-100 active:bg-amber-500 active:text-slate-950"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
              <button
                type="button"
                {...bindTouchP2('right')}
                className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-slate-600 bg-slate-900/80 text-slate-100 active:bg-amber-500 active:text-slate-950"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pass-and-Play Handoff Modal */}
      {passOverlay && !result && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-amber-500/50 bg-[#141923] p-5 text-center shadow-2xl">
            <div className="text-xs font-semibold text-amber-400">
              Round {passOverlay.roundNum} · Pass the Phone
            </div>
            <h3 className="mt-1 font-display text-2xl font-bold text-slate-100">
              {passOverlay.nextName}&apos;s Turn
            </h3>
            <p className="mt-2 text-xs text-slate-400">
              Hand the rotated phone to {passOverlay.nextName}. Use your circular joystick, sword, gun, and skills!
            </p>
            <button
              type="button"
              onClick={() =>
                (window as unknown as { __resumePassTurn?: () => void }).__resumePassTurn?.()
              }
              className="mt-4 min-h-[44px] w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400"
            >
              Ready — Start Turn
            </button>
          </div>
        </div>
      )}

      {/* Pause Modal */}
      {paused && !result && !showCtrlModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-xl border border-slate-700 bg-[#141923] p-5 text-center shadow-2xl">
            <h3 className="font-display text-xl font-bold text-slate-100">Game Paused</h3>
            <p className="mt-1 text-[11px] text-slate-400">
              Keys: WASD Move · J/F Sword · Q/C Gun · E Car · Shift Nitro/Dash · 1/2/3 Skills
            </p>
            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => setPaused(false)}
                className="flex min-h-[38px] w-full items-center justify-center gap-2 rounded-lg bg-amber-500 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                <Play className="h-4 w-4 fill-current" /> Resume Match
              </button>
              <button
                type="button"
                onClick={() => setShowCtrlModal(true)}
                className="flex min-h-[38px] w-full items-center justify-center gap-2 rounded-lg bg-slate-800 text-xs font-medium text-amber-300 hover:bg-slate-700"
              >
                <Sliders className="h-4 w-4" /> Controller Settings
              </button>
              <button
                type="button"
                onClick={() => setRunNonce((n) => n + 1)}
                className="flex min-h-[38px] w-full items-center justify-center gap-2 rounded-lg bg-slate-800 text-xs font-medium text-slate-200 hover:bg-slate-700"
              >
                <RotateCcw className="h-4 w-4" /> Restart
              </button>
              <button
                type="button"
                onClick={onExit}
                className="flex min-h-[38px] w-full items-center justify-center gap-2 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4" /> Return to Hub
              </button>
            </div>
          </div>
        </div>
      )}

      {showCtrlModal && (
        <ControllerSettingsModal
          settings={save.controllerSettings}
          onChange={onUpdateControllerSettings}
          onClose={() => setShowCtrlModal(false)}
        />
      )}

      {/* Match Result Overlay */}
      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div
            className={`w-full max-w-md rounded-xl border bg-[#141923] p-5 shadow-2xl ${
              result.victory ? 'border-emerald-500/50' : 'border-rose-500/50'
            }`}
          >
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-900">
                {result.victory ? (
                  <Trophy className="h-5 w-5 text-amber-400" />
                ) : (
                  <Skull className="h-5 w-5 text-rose-400" />
                )}
              </div>
              <div
                className={`text-xs font-extrabold uppercase tracking-widest ${
                  result.victory ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {result.victory ? 'Victory · Level Cleared' : 'You Died · Game Over'}
              </div>
              <h2 className="mt-1 font-display text-2xl font-bold text-slate-100">
                {result.title}
              </h2>
              <p className="mt-1.5 text-xs text-slate-400">{result.summary}</p>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-slate-800 bg-slate-900/70 p-3 text-center">
              <div>
                <div className="text-[11px] text-slate-500">Gold Earned</div>
                <div className="font-mono-num text-sm font-bold text-amber-400">
                  +{result.goldEarned}g
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500">XP Gained</div>
                <div className="font-mono-num text-sm font-bold text-sky-400">
                  +{result.xpEarned}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500">Time</div>
                <div className="font-mono-num text-sm font-bold text-slate-200">
                  {result.durationSec}s
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setRunNonce((n) => n + 1)}
                className="flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                <RotateCcw className="h-4 w-4" />
                {result.victory ? 'Play Again' : 'Try Again'}
              </button>
              <button
                type="button"
                onClick={onOpenShop}
                className="flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
              >
                <ShoppingBag className="h-4 w-4" /> Shop
              </button>
              <button
                type="button"
                onClick={onExit}
                className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-3.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
              >
                Hub
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

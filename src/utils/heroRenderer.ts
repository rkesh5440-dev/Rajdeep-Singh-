import { ARMORS, CARS, GUNS, WEAPONS } from '../data/gameCatalog';
import { CarItem, HeroLoadout } from '../types/game';

export interface DrawHeroOptions {
  x: number;
  y: number;
  facing: 1 | -1;
  loadout: HeroLoadout;
  animTime: number;
  isMoving?: boolean;
  isGrounded?: boolean;
  attackProgress?: number; // 0 = idle, 0..1 = swinging
  gunFlash?: number; // 0..1 when firing gun
  isGuarding?: boolean;
  isShielded?: boolean;
  isHurt?: boolean;
  scale?: number;
}

export function drawHeroSprite(ctx: CanvasRenderingContext2D, opts: DrawHeroOptions): void {
  const {
    x,
    y,
    facing,
    loadout,
    animTime,
    isMoving = false,
    isGrounded = true,
    attackProgress = 0,
    gunFlash = 0,
    isGuarding = false,
    isShielded = false,
    isHurt = false,
    scale = 1,
  } = opts;

  const weapon = WEAPONS.find((w) => w.id === loadout.weaponId) || WEAPONS[0];
  const gun = GUNS.find((g) => g.id === loadout.gunId) || GUNS[0];
  const armor = ARMORS.find((a) => a.id === loadout.armorId) || ARMORS[0];

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing * scale, scale);

  // Ground contact shadow
  if (isGrounded) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 19, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const walkBob = isMoving && isGrounded ? Math.sin(animTime * 15) * 3 : Math.sin(animTime * 3) * 1.1;
  const legSwing = isMoving && isGrounded ? Math.sin(animTime * 15) * 9.5 : 0;

  if (isHurt) {
    ctx.filter = 'brightness(1.9) contrast(1.2)';
  }

  // Dynamic Cape with gradient shading
  if (loadout.cape !== 'none') {
    const wave = Math.sin(animTime * 9) * (isMoving ? 7 : 2.5);
    const capeGrad = ctx.createLinearGradient(-24, -40, 0, 0);
    capeGrad.addColorStop(
      0,
      loadout.cape === 'royal' ? '#991b1b' : loadout.cape === 'scarf' ? loadout.primaryColor : '#334155'
    );
    capeGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = capeGrad;
    ctx.beginPath();
    if (loadout.cape === 'scarf') {
      ctx.moveTo(-4, -39 + walkBob);
      ctx.quadraticCurveTo(-26, -37 + wave, -34, -22 + wave);
      ctx.lineTo(-14, -22 + walkBob);
    } else {
      ctx.moveTo(-6, -39 + walkBob);
      ctx.quadraticCurveTo(-18 - (isMoving ? 6 : 0), -20 + wave * 0.5, -24 - (isMoving ? 7 : 0), -5 + wave);
      ctx.lineTo(-5, -8 + walkBob);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Legs with knee articulation highlight
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-5, -14 + walkBob);
  ctx.lineTo(-6 - legSwing, 0);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(5, -14 + walkBob);
  ctx.lineTo(6 + legSwing, 0);
  ctx.stroke();

  // Armored Greaves / Boots
  ctx.fillStyle = armor.trimColor;
  ctx.beginPath();
  ctx.roundRect(-10 - legSwing, -5, 10, 5.5, 2);
  ctx.roundRect(1 + legSwing, -5, 10, 5.5, 2);
  ctx.fill();

  // Torso with metallic vertical gradient
  const torsoWidth = armor.heavyPlates ? 25 : 21;
  const torsoGrad = ctx.createLinearGradient(-torsoWidth / 2, -41 + walkBob, torsoWidth / 2, -13 + walkBob);
  torsoGrad.addColorStop(0, loadout.primaryColor);
  torsoGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = torsoGrad;
  ctx.beginPath();
  ctx.roundRect(-torsoWidth / 2, -41 + walkBob, torsoWidth, 28, 6);
  ctx.fill();

  // Chestplate trim & core emblem
  ctx.strokeStyle = armor.trimColor;
  ctx.lineWidth = 2.2;
  ctx.strokeRect(-torsoWidth / 2 + 2.5, -38 + walkBob, torsoWidth - 5, 14);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(-2, -34 + walkBob, 4, 6);

  // Heavy Shoulder Pauldrons
  if (armor.heavyPlates) {
    ctx.fillStyle = armor.trimColor;
    ctx.beginPath();
    ctx.arc(-12.5, -36 + walkBob, 6.5, 0, Math.PI * 2);
    ctx.arc(12.5, -36 + walkBob, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff44';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  // Head
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.arc(0, -50 + walkBob, 9.8, 0, Math.PI * 2);
  ctx.fill();

  // Glowing Visor / Eyes
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(3, -52 + walkBob, 5, 3);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(5, -51.5 + walkBob, 2.5, 1.5);

  // Helm / Hair
  if (loadout.helm === 'knight') {
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(0, -51 + walkBob, 11, Math.PI * 0.88, Math.PI * 2.12);
    ctx.fill();
    ctx.fillStyle = loadout.primaryColor;
    ctx.beginPath();
    ctx.moveTo(-2, -61 + walkBob);
    ctx.quadraticCurveTo(-13, -68 + walkBob, -17, -54 + walkBob);
    ctx.lineTo(-4, -57 + walkBob);
    ctx.fill();
  } else if (loadout.helm === 'hood') {
    ctx.fillStyle = loadout.primaryColor;
    ctx.beginPath();
    ctx.arc(-1, -51 + walkBob, 11.2, Math.PI * 0.58, Math.PI * 1.92);
    ctx.lineTo(8, -56 + walkBob);
    ctx.closePath();
    ctx.fill();
  } else if (loadout.helm === 'crown') {
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(-8, -57 + walkBob);
    ctx.lineTo(-9, -65 + walkBob);
    ctx.lineTo(-3, -60 + walkBob);
    ctx.lineTo(0, -68 + walkBob);
    ctx.lineTo(3, -60 + walkBob);
    ctx.lineTo(9, -65 + walkBob);
    ctx.lineTo(8, -57 + walkBob);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(-1, -53 + walkBob, 9.8, Math.PI, Math.PI * 2);
    ctx.fill();
  }

  // If firing Gun, render Aiming Arm + Gun + Muzzle Flash
  if (gunFlash > 0) {
    ctx.save();
    ctx.translate(8, -32 + walkBob);
    ctx.fillStyle = armor.trimColor;
    ctx.fillRect(-2, -2.5, 14, 5);

    // Gun Silhouette
    ctx.fillStyle = '#1e293b';
    const barrelLen = gun.kind === 'rifle' ? 26 : gun.kind === 'shotgun' ? 22 : gun.kind === 'plasma' ? 20 : 14;
    ctx.fillRect(10, -4, barrelLen, 5.5);
    ctx.fillStyle = gun.color;
    ctx.fillRect(12, -2.5, barrelLen - 4, 2);
    ctx.fillStyle = '#475569';
    ctx.fillRect(10, 1, 5, 7); // Grip

    // Muzzle Flash
    if (gunFlash > 0.35) {
      ctx.fillStyle = gun.color;
      ctx.globalAlpha = gunFlash;
      ctx.beginPath();
      ctx.moveTo(10 + barrelLen, -1);
      ctx.lineTo(22 + barrelLen, -7);
      ctx.lineTo(18 + barrelLen, -1);
      ctx.lineTo(26 + barrelLen, 0);
      ctx.lineTo(18 + barrelLen, 2);
      ctx.lineTo(22 + barrelLen, 7);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  } else {
    // Melee Sword/Weapon Arm + Slash Ribbon
    const swingAngle =
      attackProgress > 0
        ? -1.35 + Math.sin(attackProgress * Math.PI) * 2.65
        : isGuarding
          ? -0.35
          : Math.sin(animTime * 3) * 0.08;

    ctx.save();
    ctx.translate(7, -32 + walkBob);
    ctx.rotate(swingAngle);

    ctx.fillStyle = armor.trimColor;
    ctx.fillRect(-2, -3, 12, 5);

    ctx.translate(10, 0);
    if (weapon.kind === 'sword' || weapon.kind === 'greatsword') {
      const bladeLen = weapon.kind === 'greatsword' ? 42 : 30;
      const bladeW = weapon.kind === 'greatsword' ? 6.5 : 4.5;
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-2, -6.5, 4, 13);
      ctx.fillStyle = weapon.color;
      ctx.beginPath();
      ctx.moveTo(2, -bladeW / 2);
      ctx.lineTo(2 + bladeLen, 0);
      ctx.lineTo(2, bladeW / 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff88';
      ctx.fillRect(4, -1, bladeLen * 0.72, 1.5);
    } else if (weapon.kind === 'daggers') {
      ctx.fillStyle = weapon.color;
      ctx.beginPath();
      ctx.moveTo(0, -3.5);
      ctx.lineTo(21, 0);
      ctx.lineTo(0, 3.5);
      ctx.closePath();
      ctx.fill();
    } else if (weapon.kind === 'staff') {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-6, -2, 34, 4);
      ctx.fillStyle = weapon.color;
      ctx.beginPath();
      ctx.arc(30, 0, 6.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (weapon.kind === 'halberd') {
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-8, -2, 43, 3.5);
      ctx.fillStyle = weapon.color;
      ctx.beginPath();
      ctx.moveTo(26, -11);
      ctx.lineTo(40, 0);
      ctx.lineTo(26, 9);
      ctx.closePath();
      ctx.fill();
    } else if (weapon.kind === 'hammer') {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-4, -2, 28, 4);
      ctx.fillStyle = weapon.color;
      ctx.fillRect(20, -11, 14, 22);
    }

    // Glowing Sword Slash Ribbon
    if (attackProgress > 0.1 && attackProgress < 0.88) {
      ctx.strokeStyle = weapon.color;
      ctx.globalAlpha = 0.72;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, 0, weapon.range * 0.52, -0.85, 0.85);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, weapon.range * 0.56, -0.7, 0.7);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  // Guard / Aegis shield aura
  if (isGuarding || isShielded) {
    ctx.strokeStyle = isShielded ? '#fbbf24' : '#38bdf8';
    ctx.fillStyle = isShielded ? 'rgba(251, 191, 36, 0.16)' : 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 2.5;
    if (isShielded) {
      ctx.beginPath();
      ctx.arc(0, -28 + walkBob, 35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(14, -28 + walkBob, 25, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();
    }
  }

  ctx.restore();
}

export interface DrawCarOptions {
  x: number;
  y: number;
  facing: 1 | -1;
  carId: string;
  wheelAngle: number;
  speedRatio: number;
  nitroActive?: boolean;
  occupied?: boolean;
  driverColor?: string;
  scale?: number;
}

export function drawCarSprite(ctx: CanvasRenderingContext2D, opts: DrawCarOptions): void {
  const {
    x,
    y,
    facing,
    carId,
    wheelAngle,
    speedRatio,
    nitroActive = false,
    occupied = false,
    driverColor = '#3b82f6',
    scale = 1,
  } = opts;

  const car: CarItem = CARS.find((c) => c.id === carId) || CARS[0];

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing * scale, scale);

  // Ground shadow under chassis
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.ellipse(0, 1, 56, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  const bounce = Math.sin(wheelAngle * 2) * (Math.abs(speedRatio) > 0.1 ? 1.4 : 0.3);

  // Headlight glow beam
  if (occupied) {
    const beam = ctx.createLinearGradient(44, -20, 170, -8);
    beam.addColorStop(0, 'rgba(253, 224, 71, 0.42)');
    beam.addColorStop(1, 'rgba(253, 224, 71, 0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(46, -20 + bounce);
    ctx.lineTo(170, -40);
    ctx.lineTo(170, 2);
    ctx.closePath();
    ctx.fill();
  }

  // Nitro flame exhaust
  if (nitroActive) {
    const flameLen = 26 + Math.random() * 18;
    const flame = ctx.createLinearGradient(-48, -14, -48 - flameLen, -14);
    flame.addColorStop(0, '#ffffff');
    flame.addColorStop(0.35, '#38bdf8');
    flame.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.moveTo(-48, -19 + bounce);
    ctx.lineTo(-48 - flameLen, -14 + bounce);
    ctx.lineTo(-48, -9 + bounce);
    ctx.closePath();
    ctx.fill();
  }

  // Chassis Body
  const bodyGrad = ctx.createLinearGradient(0, -44 + bounce, 0, -12 + bounce);
  bodyGrad.addColorStop(0, car.primaryColor);
  bodyGrad.addColorStop(1, '#1e293b');
  ctx.fillStyle = bodyGrad;

  if (car.kind === 'interceptor') {
    ctx.beginPath();
    ctx.moveTo(-48, -13 + bounce);
    ctx.lineTo(-44, -28 + bounce);
    ctx.lineTo(-18, -32 + bounce);
    ctx.lineTo(10, -40 + bounce);
    ctx.lineTo(38, -26 + bounce);
    ctx.lineTo(50, -17 + bounce);
    ctx.lineTo(48, -11 + bounce);
    ctx.closePath();
    ctx.fill();
    // Rear spoiler
    ctx.fillStyle = car.accentColor;
    ctx.fillRect(-52, -34 + bounce, 12, 4);
  } else if (car.kind === 'warrig' || car.kind === 'truck') {
    ctx.beginPath();
    ctx.roundRect(-50, -32 + bounce, 98, 22, 5);
    ctx.fill();
    // Cab
    ctx.beginPath();
    ctx.roundRect(-12, -48 + bounce, 42, 20, 4);
    ctx.fill();
    // Spiked Ram Bumper
    ctx.fillStyle = car.accentColor;
    ctx.beginPath();
    ctx.moveTo(46, -28 + bounce);
    ctx.lineTo(58, -18 + bounce);
    ctx.lineTo(46, -10 + bounce);
    ctx.closePath();
    ctx.fill();
  } else {
    // Outlander Buggy with Roll Cage
    ctx.beginPath();
    ctx.roundRect(-45, -26 + bounce, 90, 16, 6);
    ctx.fill();
    ctx.strokeStyle = car.accentColor;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-26, -26 + bounce);
    ctx.lineTo(-10, -45 + bounce);
    ctx.lineTo(18, -45 + bounce);
    ctx.lineTo(34, -26 + bounce);
    ctx.stroke();
  }

  // Driver silhouette inside if occupied
  if (occupied) {
    ctx.fillStyle = driverColor;
    ctx.beginPath();
    ctx.arc(6, -34 + bounce, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(8, -36 + bounce, 4, 2.5);
  }

  // Windshield / Window Glint
  ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
  ctx.beginPath();
  ctx.moveTo(14, -43 + bounce);
  ctx.lineTo(30, -30 + bounce);
  ctx.lineTo(14, -30 + bounce);
  ctx.closePath();
  ctx.fill();

  // Roof-mounted Gun Turret
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-4, -50 + bounce, 14, 6);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(10, -49 + bounce, 18, 3.5);

  // Headlight lens
  ctx.fillStyle = occupied ? '#fef08a' : '#64748b';
  ctx.fillRect(45, -22 + bounce, 4, 6);

  // Rotating Spoked Wheels
  const drawWheel = (wx: number) => {
    ctx.save();
    ctx.translate(wx, -10);
    ctx.rotate(wheelAngle);

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, 12.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = car.accentColor;
    ctx.beginPath();
    ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(6, 0);
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 6);
    ctx.stroke();
    ctx.restore();
  };

  drawWheel(-28);
  drawWheel(29);

  ctx.restore();
}

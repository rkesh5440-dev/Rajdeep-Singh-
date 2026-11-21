import React, { useState } from 'react';
import { Swords, Users, Repeat, Play } from 'lucide-react';
import {
  ADVENTURE_REGIONS,
  ARMOR_COLORS,
  GUNS,
  HERO_CLASSES,
  SKILLS,
  WEAPONS,
} from '../data/gameCatalog';
import { ActiveSessionConfig, HeroLoadout, PlayerSaveData } from '../types/game';
import { HeroPreviewCanvas } from './HeroPreviewCanvas';

interface FriendsOfflineHubProps {
  save: PlayerSaveData;
  onUpdateFriends: (friends: HeroLoadout[]) => void;
  onStartSession: (config: ActiveSessionConfig) => void;
}

type OfflineFriendMode = 'DUEL_OFFLINE' | 'COOP_OFFLINE' | 'PASS_PLAY';

export const FriendsOfflineHub: React.FC<FriendsOfflineHubProps> = ({
  save,
  onUpdateFriends,
  onStartSession,
}) => {
  const [selectedMode, setSelectedMode] = useState<OfflineFriendMode>('DUEL_OFFLINE');
  const [regionId, setRegionId] = useState<string>(ADVENTURE_REGIONS[2].id);
  const [passPlayerCount, setPassPlayerCount] = useState<2 | 3 | 4>(2);
  const [editingFriendIdx, setEditingFriendIdx] = useState<number>(0);

  const friends = save.friendPresets;
  const activeFriend = friends[editingFriendIdx] || friends[0];

  const updateFriend = (patch: Partial<HeroLoadout>) => {
    const updated = friends.map((f, idx) =>
      idx === editingFriendIdx ? { ...f, ...patch } : f
    );
    onUpdateFriends(updated);
  };

  const handleLaunch = () => {
    if (selectedMode === 'PASS_PLAY') {
      const roster = [save.hero, ...friends.slice(0, passPlayerCount - 1)];
      onStartSession({
        mode: 'PASS_PLAY',
        regionId,
        friendsRoster: roster,
      });
    } else {
      onStartSession({
        mode: selectedMode,
        regionId,
        friendsRoster: [save.hero, friends[0]],
      });
    }
  };

  const modeCards: {
    id: OfflineFriendMode;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'DUEL_OFFLINE',
      title: '2P Shared-Screen Duel',
      subtitle: 'Simultaneous 1v1 on one rotated phone with circular touch pads (Swords & Guns).',
      icon: <Swords className="h-4 w-4 text-rose-400" />,
    },
    {
      id: 'COOP_OFFLINE',
      title: '2P Shared-Screen Co-Op',
      subtitle: 'Team up side-by-side on one screen to survive escalating waves and bosses.',
      icon: <Users className="h-4 w-4 text-emerald-400" />,
    },
    {
      id: 'PASS_PLAY',
      title: 'Pass-and-Play Skirmish',
      subtitle: '2 to 4 friends take turns passing the rotated phone with full joystick & gun controls.',
      icon: <Repeat className="h-4 w-4 text-amber-400" />,
    },
  ];

  return (
    <div className="grid h-full grid-cols-12 gap-3 overflow-hidden">
      <div className="col-span-5 flex flex-col justify-between rounded-xl border border-slate-800 bg-[#141923] p-3 overflow-y-auto custom-scroll">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-200">
            Offline Multiplayer (Zero Internet Required)
          </div>
          {modeCards.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedMode(m.id)}
              className={`w-full rounded-lg border p-2.5 text-left transition ${
                selectedMode === m.id
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-100">
                {m.icon}
                {m.title}
              </div>
              <p className="mt-1 text-[11px] leading-snug text-slate-400">{m.subtitle}</p>
            </button>
          ))}

          {selectedMode === 'PASS_PLAY' && (
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
              <span className="text-xs text-slate-300">Friends Playing</span>
              <div className="flex gap-1">
                {([2, 3, 4] as const).map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setPassPlayerCount(cnt)}
                    className={`h-7 w-8 rounded text-xs font-mono-num font-bold transition ${
                      passPlayerCount === cnt
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cnt}P
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="mb-1 text-[11px] text-slate-400">Battleground Stage</div>
            <div className="grid grid-cols-3 gap-1.5">
              {ADVENTURE_REGIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRegionId(r.id)}
                  className={`truncate rounded border px-2 py-1.5 text-[11px] font-medium transition ${
                    regionId === r.id
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

        <button
          type="button"
          onClick={handleLaunch}
          className="mt-3 flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-400 active:scale-[0.98]"
        >
          <Play className="h-4 w-4 fill-current" />
          Start Offline Match
        </button>
      </div>

      <div className="col-span-7 flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-[#141923] p-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div>
            <h3 className="text-xs font-semibold text-slate-100">Customize Friend Fighters</h3>
            <p className="text-[11px] text-slate-400">
              Player 1 uses {save.hero.name}. Customize Friend builds below.
            </p>
          </div>
          {selectedMode === 'PASS_PLAY' && (
            <div className="flex gap-1">
              {friends.slice(0, passPlayerCount - 1).map((f, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setEditingFriendIdx(idx)}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                    editingFriendIdx === idx
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  P{idx + 2}: {f.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-2.5 grid flex-1 grid-cols-12 gap-3 overflow-y-auto custom-scroll">
          <div className="col-span-4 flex flex-col items-center justify-center rounded-lg border border-slate-800 bg-slate-900/50 p-2">
            <HeroPreviewCanvas loadout={activeFriend} width={140} height={116} scale={1.3} />
            <span className="mt-1 text-xs font-semibold text-slate-200">
              {activeFriend.name}
            </span>
            <span className="text-[11px] text-slate-400 capitalize">{activeFriend.classId}</span>
          </div>

          <div className="col-span-8 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-400">Friend Name</label>
                <input
                  type="text"
                  maxLength={12}
                  value={activeFriend.name}
                  onChange={(e) => updateFriend({ name: e.target.value })}
                  className="mt-1 h-8 w-full rounded border border-slate-700 bg-slate-900 px-2.5 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Class</label>
                <select
                  value={activeFriend.classId}
                  onChange={(e) =>
                    updateFriend({
                      classId: e.target.value as HeroLoadout['classId'],
                    })
                  }
                  className="mt-1 h-8 w-full rounded border border-slate-700 bg-slate-900 px-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                >
                  {HERO_CLASSES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-400">Sword / Melee</label>
                <select
                  value={activeFriend.weaponId}
                  onChange={(e) => updateFriend({ weaponId: e.target.value })}
                  className="mt-1 h-8 w-full rounded border border-slate-700 bg-slate-900 px-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                >
                  {WEAPONS.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Gun</label>
                <select
                  value={activeFriend.gunId}
                  onChange={(e) => updateFriend({ gunId: e.target.value })}
                  className="mt-1 h-8 w-full rounded border border-slate-700 bg-slate-900 px-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                >
                  {GUNS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 items-center">
              <div>
                <label className="text-[11px] text-slate-400">Armor Color</label>
                <div className="mt-1 flex gap-1.5">
                  {ARMOR_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => updateFriend({ primaryColor: c.hex })}
                      className={`h-6 w-6 rounded-full border-2 ${
                        activeFriend.primaryColor === c.hex
                          ? 'border-white'
                          : 'border-slate-800'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400">Signature Skill</label>
                <select
                  value={activeFriend.skillIds[0]}
                  onChange={(e) =>
                    updateFriend({
                      skillIds: [
                        e.target.value,
                        activeFriend.skillIds[1],
                        activeFriend.skillIds[2],
                      ],
                    })
                  }
                  className="mt-1 h-8 w-full rounded border border-slate-700 bg-slate-900 px-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                >
                  {SKILLS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded border border-slate-800/80 bg-slate-900/50 px-2.5 py-1.5 text-[11px] text-slate-400">
              <strong className="text-slate-200">2P Controls:</strong> Phone uses circular touch pads on Left & Right. Keyboard: P1 <span className="font-mono-num text-slate-200">WASD + F/Q/G</span> · P2 <span className="font-mono-num text-slate-200">Arrows + K/M/L</span>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

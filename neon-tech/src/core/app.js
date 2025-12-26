import { Engine } from './engine.js';
import { Input } from './input.js';
import { StateMachine } from './stateMachine.js';
import { Storage } from './storage.js';
import { AudioBus } from './audio.js';
import { GameSession } from '../game/game.js';
import { Hud } from '../ui/hud.js';
import { Menus } from '../ui/menus.js';
import { DebugOverlay } from '../tools/debug.js';
import { GAME_CONFIG } from '../game/constants.js';

export const createApp = () => {
  const canvas = document.querySelector('#game-canvas');
  const input = new Input(canvas);
  const profile = Storage.load();
  const hud = new Hud(document.querySelector('#hud'));
  const menus = new Menus(document.querySelector('#app'));
  const debug = new DebugOverlay(document.querySelector('#debug'));
  const audio = new AudioBus(profile.settings);

  const stateMachine = new StateMachine(null);
  let session = null;
  let lastFrame = performance.now();
  let fps = 60;

  window.addEventListener('keydown', (event) => {
    if (event.code === 'F3') debug.toggle();
  });

  const updateFps = () => {
    const now = performance.now();
    const delta = now - lastFrame;
    fps = 1000 / delta;
    lastFrame = now;
  };

  const enterMenu = () => {
    menus.show(menus.menu);
    hud.hide();
    session = null;
  };

  const enterLoadout = () => {
    menus.show(menus.loadout);
  };

  const enterHideout = () => {
    menus.updateUpgradeLevels(profile.upgrades);
    menus.show(menus.hideout);
  };

  const enterSettings = () => {
    menus.show(menus.settings);
    syncSettingsInputs();
  };

  const enterPlay = () => {
    menus.show(null);
    hud.show();
    session = new GameSession({
      canvas,
      input,
      hud,
      audio,
      profile,
      debug,
      onMatchEnd: ({ extracted, summary }) => {
        Storage.save(profile);
        menus.showResults({
          title: extracted ? 'Extraction Complete' : 'Extraction Failed',
          summary,
        });
        hud.hide();
        stateMachine.change('results');
      },
    });
  };

  stateMachine.register('menu', { enter: enterMenu });
  stateMachine.register('loadout', { enter: enterLoadout });
  stateMachine.register('hideout', { enter: enterHideout });
  stateMachine.register('settings', { enter: enterSettings });
  stateMachine.register('play', {
    enter: enterPlay,
    update: (dt) => session?.update(dt),
    render: () => session?.render(),
  });
  stateMachine.register('results', { update: () => {}, render: () => {} });

  menus.onAction('play', () => stateMachine.change('play'));
  menus.onAction('loadout', () => stateMachine.change('loadout'));
  menus.onAction('hideout', () => stateMachine.change('hideout'));
  menus.onAction('settings', () => stateMachine.change('settings'));
  menus.onAction('back', () => stateMachine.change('menu'));
  menus.onAction('return', () => stateMachine.change('menu'));

  menus.onRole('runner', (role) => {
    profile.role = role;
    Storage.save(profile);
  });
  menus.onRole('hacker', (role) => {
    profile.role = role;
    Storage.save(profile);
  });
  menus.onRole('bruiser', (role) => {
    profile.role = role;
    Storage.save(profile);
  });

  menus.onUpgrade('storage', () => upgrade('storage'));
  menus.onUpgrade('scanner', () => upgrade('scanner'));
  menus.onUpgrade('workbench', () => upgrade('workbench'));

  const upgrade = (type) => {
    const maxLevel = GAME_CONFIG.upgrades[type].length;
    if (profile.upgrades[type] >= maxLevel) return;
    const cost = profile.upgrades[type] * 100;
    if (profile.credits < cost) return;
    profile.credits -= cost;
    profile.upgrades[type] += 1;
    menus.updateUpgradeLevels(profile.upgrades);
    Storage.save(profile);
  };

  const syncSettingsInputs = () => {
    document.querySelector('#volume-master').value = profile.settings.masterVolume;
    document.querySelector('#volume-sfx').value = profile.settings.sfxVolume;
    document.querySelector('#volume-music').value = profile.settings.musicVolume;
  };

  const bindSettings = () => {
    document.querySelector('#volume-master').addEventListener('input', (event) => {
      profile.settings.masterVolume = Number(event.target.value);
      Storage.save(profile);
    });
    document.querySelector('#volume-sfx').addEventListener('input', (event) => {
      profile.settings.sfxVolume = Number(event.target.value);
      Storage.save(profile);
    });
    document.querySelector('#volume-music').addEventListener('input', (event) => {
      profile.settings.musicVolume = Number(event.target.value);
      Storage.save(profile);
    });
  };

  bindSettings();

  const engine = new Engine({
    tickRate: GAME_CONFIG.tickRate,
    update: (dt) => {
      stateMachine.update(dt);
      updateFps();
      if (session) {
        debug.update({
          fps,
          entities: 1 + session.bots.length + session.pickups.length,
          bullets: session.bulletPool.countActive(),
          particles: session.particlePool.countActive(),
          tickTime: session.tickTimeMs,
        });
      }
    },
    render: (alpha) => {
      stateMachine.render(alpha);
    },
  });

  stateMachine.change('menu');

  return {
    start: () => engine.start(),
  };
};

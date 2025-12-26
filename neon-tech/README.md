# NEON HEIST: Micro-Extraction Arena

A fast, replayable micro-extraction shooter built with **HTML5 Canvas + vanilla JS modules**.

## Run locally

```bash
npx serve
```

Then open `http://localhost:3000/neon-tech/`.

## Controls

- **Move:** WASD
- **Aim:** Mouse
- **Shoot:** Left Click
- **Reload:** R
- **Role Ability:** E
- **Ping:** Q
- **Weapon Select:** 1 (Rifle), 2 (Pistol)
- **Debug Overlay:** F3

## Gameplay Loop

- Drop in, grab loot chips, and survive the bots.
- Extraction opens at **03:00** and closes at **06:00**.
- Extract with loot to convert chips into credits.
- Die or miss extraction to lose the loot.

## Project Structure

```
neon-tech/
  index.html
  style.css
  src/
    main.js
    core/      # engine, input, storage, audio
    game/      # rules, entities, map
    ui/        # HUD + menu overlays
    tools/     # debug overlay
    assets/    # reserved for future art/audio
```

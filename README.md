# Neon Knights · The Last Bastion

[Play the overhaul](https://oscarfury.github.io/NeonKnights/) · [Classic draft](https://oscarfury.github.io/NeonKnights/classic/)

**Next overhaul:** [The Foundry preview](https://oscarfury.github.io/NeonKnights/next/) adds the supplied rigged paladin, skeletal animation studies and a playable 3D training courtyard. See [implementation progress](docs/overhaul-v3/PROGRESS.md) and the [design/implementation plan](docs/overhaul-v3/README.md). The campaign described below is still the v2 prototype; the Foundry is an art and movement preview.

A static browser siege roguelite built with TypeScript, Vite, Phaser 3, and an original Blender character atlas. The playable campaign has fifteen authored waves, three bosses, and an optional endless continuation.

- Five weapon families, charged or alternate actions, two rank-III branches per weapon, and boss-seal awakenings.
- Six bounded runes, four build pads, eight structures, two knight orders, and eight discoverable combinations.
- Four-bastion movement, optional pointer orbit, time slow, squad commands, and complete touch actions.
- Stable shop offers, separate repairs and rerolls, upgrade previews, act events, a training yard, and explanatory results.
- Planning checkpoints, separate profile/settings saves, remappable keys, reduced motion/effects, damage-number controls, audio levels, and focus-loss pause.

## Run locally

Node 22 is used in CI. No accounts, API keys, backend, or external asset CDN are required.

```powershell
npm ci
npm run dev
```

Open `http://127.0.0.1:5173/NeonKnights/`. For the exact production artifact:

```powershell
npm test
npm run build
npm run preview
```

Open `http://127.0.0.1:4173/NeonKnights/`. Vite's base path is configured for this repository's GitHub Pages URL.

## Controls

| Input                           | Action                                                             |
| ------------------------------- | ------------------------------------------------------------------ |
| Hold left mouse / drag on touch | Aim and fire                                                       |
| Right mouse / Alternate         | Charge and release, vent, recall, or detonate, depending on weapon |
| W / A / S / D                   | Phase north / west / south / east                                  |
| Shift                           | Time slow; optional toggle mode in settings                        |
| Space                           | Command the garrison at the cursor                                 |
| Escape                          | Pause                                                              |

Touch devices have directional, alternate, slow, and command buttons. Landscape provides the most battlefield space. Menus and shops also support portrait.

The campaign saves at planning breaks and after purchases. Reloading during a wave resumes its previous planning checkpoint; mid-wave state is deliberately not saved. A new campaign replaces the active checkpoint. Classic high scores remain separate because the rules have changed.

## Verification and assets

`npm test` checks simulation, economy, persistence, and input contracts. `npm run balance` runs five deterministic campaigns with automated aiming; this measures rules and progression, not human difficulty.

Browser checks use the installed Playwright CLI:

```powershell
playwright-cli.cmd -s=neon-overhaul open http://127.0.0.1:5173/NeonKnights/ --browser=msedge
playwright-cli.cmd -s=neon-overhaul run-code --filename=tools/review/check-overhaul.js
playwright-cli.cmd -s=neon-overhaul run-code --filename=tools/review/check-touch.js
```

Screenshots go into ignored `output/playwright/`. Browser mutation helpers are present only in development builds. Production exposes `window.__NEON__.snapshot()` for read-only playtest inspection.

Regenerate the original knight source proof, then the eight-direction, six-frame runtime atlas:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 4.3\blender.exe' --background --factory-startup --python-exit-code 1 --python tools/blender/knight_puppet.py
& 'C:\Program Files\Blender Foundation\Blender 4.3\blender.exe' --background --python-exit-code 1 --python tools/blender/render_atlas.py
```

The atlas contains idle, locomotion, anticipation, strike, and recovery poses. Runtime artwork is in `public/assets`; the editable source and GLB proof remain under `docs/assets/knight-puppet`. Fortress and enemy art use the code renderer. Audio is generated locally through Web Audio.

## Deployment and design history

Pushes to `main` run tests and a production build, then publish `dist` through `.github/workflows/pages.yml`. GitHub Pages must use **GitHub Actions** as its source. Only runtime files and the classic draft enter the published artifact; Blender sources and review documents do not.

- [Implementation and validation notes](docs/IMPLEMENTATION.md)
- [Original overhaul design](docs/OVERHAUL.md)
- [Original architecture proposal](docs/ARCHITECTURE.md)
- [Historical review and baseline evidence](docs/REVIEW.md)

The original deployed baseline is commit `c32d843e601f3dec502fe17f64d716f7aeb31fa7`. The pre-existing unpublished HTML draft was preserved byte-for-byte in `public/classic/index.html` before replacement, including its chain-lightning and balance edits. Its old rules are separate from the overhaul.

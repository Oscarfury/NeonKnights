# Castle and Foundry preview — implementation progress

**Implementation update, 6 September 2026:** the fifteen-level expansion is now wired into the playable game at both `/NeonKnights/` and `/NeonKnights/next/`. See [the implementation record](CAMPAIGN_IMPLEMENTATION.md) for shipped content, tuning changes and current verification. The original specification below is retained as design history; runtime values take precedence.


The preview at `/NeonKnights/next/` now opens **The King's Battlements**, a connected three-encounter castle siege. The King fights on the walls; recruited, equipped knights deploy and fight automatically. See [the castle preview](CASTLE_PREVIEW.md) for controls, rules, persistence and verification, and [the latest direction](CASTLE_DIRECTION.md) for the design change.

The earlier [combat courtyard](COMBAT_PREVIEW.md), [Royal Workshop](CONSTRUCTION_PREVIEW.md) and Foundry inspection remain available under Art & training. Their free-movement and sandbox rules are separate from the castle campaign.

The latest combat pass removes King health and charge/release attacks. Both royal weapons auto-fire while moving; fast swept projectiles lead targets and push them back. E guards the current wall section, with a timed block exposing the final-watch Dragon. Knights engage faster and recover fully after victory. Character body batching, cached scenery shadows, contact shadows, cached projection dimensions and adaptive render resolution reduce rendering work. The attached castle wings and three visual tiers remain. Current verification is recorded in [the castle preview](CASTLE_PREVIEW.md); the Foundry/construction figures below are historical.

The [full fifteen-level campaign design](CAMPAIGN_15.md) and [all launch upgrade paths](UPGRADE_PATHS.md) are complete as specifications. Encounter packets, unlock gates and a reference purchase route have a checked [data worksheet](campaign-15.json). Content implementation and final art/balance acceptance remain outstanding; the preview still has three encounters.

The latest castle assault AI reserves wall positions, keeps targets stable, commits attack facing, and returns diverted enemies to their assigned wall. The current **123 tests and production build pass**, with three legal browser victories, an unattended wall-pressure observation and unchanged frame timing in the existing desktop fixture. See [the assault record](evidence/castle-assault.json). Historical work-package descriptions below retain the earlier courtyard scope where noted.

## Implemented

- An independent Three.js entry with static GitHub Pages delivery, asset loading/error/retry, separate skeletal instances, inspection controls and a read-only runtime snapshot.
- The user's supplied Silver Delivery paladin, retaining its original geometry, UVs and painted textures. A clean 74-bone deformation rig replaces the source scene's 410-bone control rig for runtime use.
- Thirty-three animation studies cover bow and Sunlance actions, locomotion, four dodge directions, stow/equip, draw cancellation, hit/downed and assistance/recovery. These need further animation polish and do not yet meet the full R02 clip/quality contract.
- Separate Blender-authored Stormbow and Sunlance equipment, hand-following attachments, a bowstring following the drawing hand and a visible nocked arrow.
- A Blender-authored training courtyard, raised firing balcony and a continuous ramp. Characters can move continuously and aim independently, swap weapons, fire travelling projectiles, charge, dodge and use bounded slow time.
- Two named companions with independent skeletons, persistent follow/hold orders, formation spacing and routing up and down the ramp. Held assistance consumes one of two field dressings and restores a downed ally to 35 health; a surviving knight can rescue the commander. The castle adds recruiting, equipment, service promotions and persistent wounds with its own automatic company rules.
- Physical ward hazards now include circular impacts, swept rays and lingering fire with explicit team/elevation filtering and fixed damage cadence. The danger display and collision use the same shape data. These remain ward drills; the castle now contains a separate physical Dragon encounter.
- A construction catalogue with Ballista and Aegis at ranks I–III, emission-free tier comparison, placement ghosts, facing and coverage, a separate saved ledger, known-cost upgrades, relocation, repair and salvage. Defenses operate and take damage in the courtyard; company routes avoid machines and wrecks.
- Desktop controls and touch movement, aim/fire, alternate, dodge, swap, order and slow controls. Focus loss pauses the courtyard and clears input.
- All runtime models, textures and fonts load from the game deployment. Model revisions are checked and included in asset URLs to avoid keeping an old model after an update.

## Work-package status

| Package                    | Status                                           | Remaining acceptance work                                                                                                                                      |
| -------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R00 baseline diagnostics   | Complete                                         | Recorded baseline remains available                                                                                                                            |
| R01 3D runtime and viewer  | Implemented; browser verification recorded below | Continue profiling as the actual siege content arrives                                                                                                         |
| R02 hero art and animation | In progress                                      | Refine gait, grips, torso/aim blending, weapon transitions, reactions and directional dodges; add the missing production clips and review at the reference bar |
| R03 commander/world        | Partial                                          | Courtyard, ramp, gate fading and training rescue work; operable gates, breaches, outer objectives and campaign recovery remain                                 |
| R04 ability/hazard rules   | Partial                                          | Projectiles, impacts, swept rays, fire, actor/structure masks and directional shields work; terrain line of sight and boss interrupt/resolve remain            |
| R05-R06 | Connected castle implementation | Three enemy roles, radial staging, persistent automatic company, recruitment, equipment and wounds work; final art acceptance and richer outer objectives remain |
| R07 construction | Mounted castle integration | Three circular wall tiers and twelve defense rank models work with enemies, damage, repairs and the Worldpiercer conversion; richer destruction and final art acceptance remain |
| R08-R10 progression and boss | First integrated implementation | Separate council systems, six stable offers, free rune equipment, three relics and an animated Dragon with real attacks work; expanded content and acceptance remain |
| R11 connected siege | Implemented; review in progress | Three encounters connect the King, company, defenses, boss, rewards and saved council choices |
| R12-R15 | Outstanding | Full campaign expansion, additional boss/weapon families, final balance, accessibility and promotion remain |


The main game continues to serve the existing campaign. The preview's source art and generated Blender working scenes are local, ignored files; they are not included as a downloadable source-asset pack.

## Reproduce the art build

Use Blender 4.3.2 and the same supplied source archive. Run commands from the repository root:

```powershell
python tools/blender/import_paladin.py 'C:\path\to\blend.zip'
& 'C:\Program Files\Blender Foundation\Blender 4.3\blender.exe' --background --factory-startup --python-exit-code 1 --python tools/blender/build_courtyard.py
& 'C:\Program Files\Blender Foundation\Blender 4.3\blender.exe' --background --disable-autoexec 'art/source/vendor/paladin/blend/paintpoly_humanoid_paladin_knight.blend' --python-exit-code 1 --python tools/blender/export_paladin.py
& 'C:\Program Files\Blender Foundation\Blender 4.3\blender.exe' --background --factory-startup --python-exit-code 1 --python tools/blender/build_defenses.py
npm run assets:stamp
npm run assets:check
```

The import keeps the original ZIP unchanged. The source is under `art/source/vendor/paladin`, working scenes are under `art/work`, and only derived game GLBs/metadata enter `public/assets/v3`. The embedded Rigify UI script is not needed and is not executed. New animations are authored by the export script and baked onto deformation bones.

The exported paladin has 26,055 triangles; that is a measured triangulated export count, not a reinterpretation of the store's polygon count. Its game file is approximately 3.4 MB including textures and clips. The preview now includes ten runtime models; their exact sizes and triangle counts are recorded in the construction validation evidence.

## Verification

- Current asset revision: `f4d3aa8d5062`. The production build and all **68 tests** passed. The [construction revision](CONSTRUCTION_PREVIEW.md) records the current scope and browser checks; the [combat revision](COMBAT_PREVIEW.md) remains the preceding delivery record. The [initial verification record](evidence/foundry-validation.json) remains historical evidence for the original Foundry.
- The simulation suite includes targeted new checks for movement on both axes, blocking balcony walls, ramp traversal, formation routing, projectile tunnelling, delayed release/contact, one-hit ward resolution, dodge protection, pause and slow-time depletion.
- `npm run assets:check` verifies GLB structure, embedded image/buffer delivery, sockets, joint indices, normalized weights, finite geometry/animation values, required clips, clip timing bounds and the asset revision.
- `tools/review/check-foundry.js` exercises actual browser movement, shots hitting targets, weapon swaps, dodge consumption, formation orders, ward damage and pause. It captures bow/Sunlance inspection and the playable courtyard.
- Both desktop and emulated touch checks passed against the production artifact. Touch checks cover portrait and landscape layouts, short fire taps, movement, swapping, dodging, orders and focus-loss pause. No external runtime requests or page errors were recorded in that check; physical mobile hardware remains untested.
- The construction revision's 120-frame sample at 1600 × 1000, with three paladins and two rank III defenses, measured 16.7 ms median / 16.8 ms p95 and 248 draw calls on the RTX 2080 Ti. This is a quiet-courtyard sample; earlier timings varied and full-battle/mobile performance remain open.
- The original Foundry's 120-frame desktop courtyard sample at 1600 × 1000 with three paladins measured 16.7 ms median and 16.8 ms p95 frame intervals on an RTX 2080 Ti. This historical sample does not establish full-battle or mobile performance. Production exposes only the read-only snapshot helper.
- Screenshots and browser output are review evidence, not proof that the full animation-quality milestone is complete. Review captures live in ignored `output/playwright/`.

The next delivery should refine hero motion and expand the now-connected castle siege with additional encounters and accepted enemy assets. The old primitive enemies and sprite atlas must not be used to fill those gaps.

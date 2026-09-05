# Foundry preview — implementation progress

The first implementation delivery is **The Foundry**, a real 3D character inspection scene and playable training courtyard at `/NeonKnights/next/`. It is an art/animation and movement review build. It is not the three-encounter siege or the completed overhaul.

## Implemented

- An independent Three.js entry with static GitHub Pages delivery, asset loading/error/retry, separate skeletal instances, inspection controls and a read-only runtime snapshot.
- The user's supplied Silver Delivery paladin, retaining its original geometry, UVs and painted textures. A clean 74-bone deformation rig replaces the source scene's 410-bone control rig for runtime use.
- Fifteen new animation studies: bow ready/draw/hold/release/full attack; Sunlance ready/discharge; walk/run/backward/left/right; dodge, hit and downed. These need further animation polish and do not yet meet the full R02 clip/quality contract.
- Separate Blender-authored Stormbow and Sunlance equipment, hand-following attachments, a bowstring following the drawing hand and a visible nocked arrow.
- A Blender-authored training courtyard, raised firing balcony and a continuous ramp. Characters can move continuously and aim independently, swap weapons, fire travelling projectiles, charge, dodge and use bounded slow time.
- Two named companions with independent skeletons, persistent follow/hold orders, formation spacing and routing up and down the ramp. Ward trials can injure them; restoration resets the training company. Recruiting, equipment inventories, promotions and campaign recovery remain future work.
- Physical ward hazards: a visible warning followed by an actual damaging volume. Stationary units take damage once; leaving the area or timing a dodge avoids it. This proves part of the hazard infrastructure; it is not a replacement Dragon fight.
- Desktop controls and touch movement, aim/fire, alternate, dodge, swap, order and slow controls. Focus loss pauses the courtyard and clears input.
- All runtime models, textures and fonts load from the game deployment. Model revisions are checked and included in asset URLs to avoid keeping an old model after an update.

## Work-package status

| Package                    | Status                                           | Remaining acceptance work                                                                                                                                      |
| -------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R00 baseline diagnostics   | Complete                                         | Recorded baseline remains available                                                                                                                            |
| R01 3D runtime and viewer  | Implemented; browser verification recorded below | Continue profiling as the actual siege content arrives                                                                                                         |
| R02 hero art and animation | In progress                                      | Refine gait, grips, torso/aim blending, weapon transitions, reactions and directional dodges; add the missing production clips and review at the reference bar |
| R03 commander/world        | Partial                                          | Courtyard and ramp work; operable gates, wall breaches, outer objectives, full camera occlusion and rescue rules remain                                        |
| R04 ability/hazard rules   | Partial                                          | Projectiles and a circular committed hazard work; swept breath/arcs, persistent fire, target masks, structure damage and boss interrupt/resolve remain         |
| R05–R15                    | Outstanding                                      | The planned enemy roles, campaign company, construction/economy, legends, bosses, campaign balancing, saves and promotion have not shipped                     |

The main game continues to serve the existing campaign. The preview's source art and generated Blender working scenes are local, ignored files; they are not included as a downloadable source-asset pack.

## Reproduce the art build

Use Blender 4.3.2 and the same supplied source archive. Run commands from the repository root:

```powershell
python tools/blender/import_paladin.py 'C:\path\to\blend.zip'
& 'C:\Program Files\Blender Foundation\Blender 4.3\blender.exe' --background --factory-startup --python-exit-code 1 --python tools/blender/build_courtyard.py
& 'C:\Program Files\Blender Foundation\Blender 4.3\blender.exe' --background --disable-autoexec 'art/source/vendor/paladin/blend/paintpoly_humanoid_paladin_knight.blend' --python-exit-code 1 --python tools/blender/export_paladin.py
npm run assets:stamp
npm run assets:check
```

The import keeps the original ZIP unchanged. The source is under `art/source/vendor/paladin`, working scenes are under `art/work`, and only derived game GLBs/metadata enter `public/assets/v3`. The embedded Rigify UI script is not needed and is not executed. New animations are authored by the export script and baked onto deformation bones.

The exported paladin has 26,055 triangles; that is a measured triangulated export count, not a reinterpretation of the store's polygon count. Its game file is approximately 2.7 MB including textures and clips. The entire four-model preview is approximately 8.8 MB before HTTP transfer compression.

## Verification

- Release candidate asset revision: `5d5674a3dc4b`. The production build and all **42 tests** passed. The [verification record](evidence/foundry-validation.json) records the tested scope and limitations.
- The simulation suite includes targeted new checks for movement on both axes, blocking balcony walls, ramp traversal, formation routing, projectile tunnelling, delayed release/contact, one-hit ward resolution, dodge protection, pause and slow-time depletion.
- `npm run assets:check` verifies GLB structure, embedded image/buffer delivery, sockets, joint indices, normalized weights, finite geometry/animation values, required clips, clip timing bounds and the asset revision.
- `tools/review/check-foundry.js` exercises actual browser movement, shots hitting targets, weapon swaps, dodge consumption, formation orders, ward damage and pause. It captures bow/Sunlance inspection and the playable courtyard.
- Both desktop and emulated touch checks passed against the production artifact. Touch checks cover portrait and landscape layouts, short fire taps, movement, swapping, dodging, orders and focus-loss pause. No external runtime requests or page errors were recorded in that check; physical mobile hardware remains untested.
- A 120-frame desktop courtyard sample at 1600 × 1000 with three paladins measured 16.7 ms median and 16.8 ms p95 frame intervals on an RTX 2080 Ti. This measures this small scene only; it does not establish full-battle or mobile performance. Production exposes only the read-only snapshot helper.
- Screenshots and browser output are review evidence, not proof that the full animation-quality milestone is complete. Review captures live in ignored `output/playwright/`.

The next delivery should refine the hero's motion and produce the accepted enemy and building assets, then connect those to the planned siege. The old primitive enemies and sprite atlas must not be used to fill those gaps.

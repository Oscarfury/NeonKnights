# Foundry: combat and recovery revision

This delivery extends the art/movement preview at `/next/`. It does not complete the planned siege, Dragon, construction, recruitment or campaign progression.

## Playtest

Enter the courtyard and start a ward trial. The repeating sequence now combines a committed circular impact, a ray that sweeps across the ground and fire that persists for three seconds. Move out of the marked area, dodge at contact, or order the company to safer ground with Tab + click.

Q starts a visible stow/equip transition. The commander carries the unused weapon on their back; Marksmen carry only their bows. Dodging before release cancels a drawn shot. The Sunlance alternate has its own charged discharge timing and animation.

Hold F near a downed companion for 1.8 uninterrupted seconds. Damage or releasing the button interrupts the assist. A rescue uses one of two shared field dressings, restores 35 health and gives brief protection during recovery. A surviving knight approaches and assists a downed commander automatically. An exhausted company must restore the training session. Touch has a held Rescue button. This is a training lifecycle, with no campaign inventory or saved wounds yet.

The gate frame fades when it blocks the camera's view of a company member. The renderer leaves navigation unchanged; an operable gate and breach remain future work.

## Animation and art

The paladin has 26 baked animation studies, including four dodge directions, stow/equip, draw cancellation, Sunlance prime/charged discharge, assistance and recovery. Simulation action clocks now drive the matching clips, and the asset validator compares their release moments. All motion remains subject to the R02 art review: clip coverage does not establish production-quality contact, gait or transitions.

The original geometry, painted texture buffers and rig binding are retained. When a full texture re-export exceeds available memory, the alternative motion-only workflow is:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 4.3\blender.exe' --background --disable-autoexec 'art/source/vendor/paladin/blend/paintpoly_humanoid_paladin_knight.blend' --python-exit-code 1 --python tools/blender/export_paladin.py -- --animations-only
python tools/blender/merge_paladin_motion.py
npm run assets:stamp
npm run assets:check
```

The merge verifies the rest transforms, maps animation targets by bone name, removes superseded animation buffers and preserves the embedded artwork without recompression. The standard full export remains supported. Both workflows keep source/working scenes outside the public artifact.

## Validation scope

- 52 simulation tests pass. New cases cover swept target travel, sweeping edges, team/elevation filtering, one-contact damage, timed fire at 30/60/144 updates per second, dodge protection, canceled draws, swap timing, rescue proximity/cancellation, damage interruption and commander recovery.
- The production build and GLB checks pass. Asset revision: `80309370b190`.
- `check-combat.js` exercises actual inspection controls, shot cancellation, stow/equip and the three naturally staged ward patterns. The renderer derives footprints from the same hazard data used by collision.
- `check-rescue.js` and `check-rescue-touch.js` use a clearly limited development setup to place a downed knight, then exercise normal input and simulation. Production must expose only the read-only snapshot helper.
- Screenshots inspect the stow/assist poses, sweeping ray, fire, gate fading, recovery and touch layout. These are review evidence, not acceptance of the full art or campaign milestones.
- Rigid equipment is batched by material at load time, retaining its authored geometry. The courtyard sample fell from 226 to 164 draw calls. On the RTX 2080 Ti test machine, the final 120-frame sample measured 20.8 ms median and 28.6 ms p95; it did not meet the 60 fps target. These measurements are recorded in the [validation evidence](evidence/combat-validation.json), without treating draw-call reduction as proof of a frame-rate gain.

R02, R03 and R04 remain partial. Enemy/Dragon assets, functional construction, recruiting/equipment, separate shops and legends, campaign pacing and saves are still required for the requested overhaul.

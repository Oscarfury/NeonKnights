# The King's Battlements - circular castle preview

The playable preview is at `/NeonKnights/next/`. The latest pass focuses on combat readability, active companions and a shorter build–fight–recruit loop. The existing training courtyard remains independent.

## Castle assault AI and campaign design · 6 September 2026

Raiders and Bulwarks now reserve distinct attack positions on one wall; Hexcasters occupy a rear firing row. The assignment survives diversions and knockback. Enemies evaluate reachable knights on staggered timers, retain targets within a pursuit leash, turn before attacking, and lock their target and facing through the attack. A missed swing cannot change into damage to a passing knight or the wall. Moving units yield to planted attackers, and separation keeps them outside the curtain.

Current verification: **123 tests and production build pass**. The legal browser campaign cleared its three watches in **28.53s, 35.73s and 38.08s**, including a perfect Dragon guard and no page errors. An unattended fresh watch recorded 368 samples of committed attacks with zero facing change, 19 wall attack releases and actual wall failure. The same funded seven-actor desktop fixture retained **16.7ms median / 16.8ms p95**, with 230 draw calls. [Evidence and limitations](evidence/castle-assault.json); the targeted browser observation is `tools/review/check-assault.js`.

The [fifteen-level campaign](CAMPAIGN_15.md) and [complete upgrade paths](UPGRADE_PATHS.md) are now specified, with authored encounter data and a checked [economy worksheet](campaign-economy.csv). They remain expansion designs: the current playable campaign still has the three encounters described below. The following combat-rhythm evidence records the preceding delivery.

## Combat rhythm and performance · September 2026

New sieges begin with **Aldren and 360 crowns**, alongside the player-controlled King. A **120-crown tavern** opens recruitment: Elin, Corvin and Lysa each cost **140 crowns**. Recruits automatically deploy while a place is free; up to three companions fight at once. All recruited knights, including downed and reserve knights, recover to full health after victory. Tavern ranks instead grant 10/20/30 starting ward to deployed companions.

Build now has **Castle wings** and **Defenses** views. The fixed central keep is removed. Four inner slots are interlocking quarters of a single tower, accepting a tavern and Dawn Sanctuaries without consuming defense power. The first wing creates the shared stair tower; further wings complete its footprint with connecting masonry and galleries. Building ranks I, II and III add actual floors, battlements and turrets. Fortifying the castle progresses **Outpost → Stonehold → Crownspire**, adding corner piers, roof galleries and a crowned central spire. Four separate cardinal mounts accept Ballistas, Aegis Projectors and Storm Spires. Planning raises the camera and placement fades obstructing walls. Placement, free relocation, repairs and salvage retain their existing transactions. Existing companies remain intact; legacy wall sanctuaries move into free courtyard slots with their health, rank and investment preserved.

The King has no damage or health mechanic in this preview: losing any wall section loses the watch. Stormbow fires every 0.36 seconds; Sunlance fires a stronger, shield-piercing bolt every 0.62 seconds. First release takes 0.07/0.06 seconds. Fast physical projectiles lead moving targets, use swept collision, and push invaders back without resetting every enemy attack. Auto-fire continues during movement and guard; mouse clicks no longer charge or interrupt attacks. Q or the weapon button switches weapons.

**E / Guard wall** protects the section occupied when activated for 1.5 seconds, with a 4.5-second cooldown. Guard reduces wall damage by 80%; the first 0.4 seconds completely block damage. A timed block against dragonfire staggers and exposes the Dragon for 30% bonus damage. Holding guard does not repeat casts. The shield stays on its chosen section while the King moves.

The encounters are now **First Watch, Break the Siege, Emberwing: The Final Siege**. The second victory unlocks the siege relic before the boss. The Dragon alternates claw/tail pressure against living knights with a breath into one clearly named wall section. Its wall cone terminates at that section instead of crossing the whole castle. Knights dodge the company attacks; the King moves to the threatened wall to guard it. With no living knights, the Dragon attacks the castle directly. Royal Decree damages and pushes nearby enemies but no longer cancels boss commitments.

Knights move faster, close the last few meters aggressively, release attacks sooner, and abandon stale attacks when their target moves out of reach. Guards still prefer their home front but reinforce fights. Marksmen check their firing path, lead moving targets, and retreat from close enemies. All classes seek reachable escapes from telegraphs, then resume fighting.

Wall damage chips and sinks outer masonry, adds cracks and fallen blocks, and throws debris at the actual impact. Repairs restore the intact geometry. The inner walkway remains traversable; a zero-health sector still ends the encounter. Small health bars and local impact flashes replace persistent enemy nameplates. The council hides during combat; knight talents and equipment open on demand. Short synthesised combat cues have a persistent Sound toggle.

Rapid kills extend a five-second chain, grant a little extra Decree power and award 2–6 crowns per normal enemy (35 for the Dragon). Kill rewards are granted once and join the saved ledger only after victory. Defeat restores the starting council. A cleared assault advances the next spawn, and encounter budgets are shorter.

The renderer combines compatible skinned body parts while preserving their skeleton bindings, geometry and materials. Scenery shadows are cached and refreshed after construction, gate changes or physical wall damage; actors use moving contact shadows in one instanced draw. Tower occlusion uses a bounding-box test. Screen dimensions are cached, and sustained slow frames lower scene resolution while HTML controls stay at native resolution. Original GLB files remain unchanged. Completed touch taps activate directly after placement drags; duplicate native clicks are suppressed, and guard queues on press so short taps survive until the next simulation tick.

Verification: **115 tests**, production build and asset checks pass. [Recorded results](evidence/combat-rhythm.json) include three legal victories in **28.4s, 39.3s, 36.0s**, full company recovery after reload, a timed boss guard, and production touch placement/recruitment, quick guard, weapon swap and pause. The desktop fixture measured **28.1 ms to 16.7 ms median** and **40.3 ms to 16.8 ms p95**, with draw calls **579 to 230**. This is one evolving desktop fixture, not a device-wide frame-rate claim; its intermediate render-only result is also retained. Earlier playability evidence remains in [the preceding pass](evidence/playability-polish.json). The current browser scripts are `tools/review/play-rhythm.js`, `check-rhythm-touch.js`, and `profile-castle.js`. The performance fixture deliberately funds a known castle for comparison; it is separate from legal campaign purchases. Scripted runs and desktop browser emulation do not measure human retention or physical mobile performance.

## Playing

Move the mouse around the battlefield, or drag on touch, to guide the King around the battlements. Both weapons fire automatically at invaders on his side. Q or the weapon button switches Stormbow/Sunlance. E or Guard wall protects the current wall. Space or Royal Decree pushes back a nearby assault when its meter is ready. Escape pauses. Arrow keys and the rotation buttons are alternatives to pointer movement.

The company deploys through the north and south gates and fights automatically. Aldren and Corvin are Wardens; Elin and Lysa are Marksmen. Up to three companions deploy. Equipment, talents, experience and promotions persist; all knights fully recover after victory. Guard prioritizes the assigned gate before reinforcing; Hunt pursues invaders around the outer wall.

## Building

Choose Build, then Castle wings or Defenses, and drag a building card onto a matching glowing platform. Selecting a card and then clicking/tapping a platform is equivalent and works with keyboard activation too. A transparent model previews placement; occupied platforms turn red. Release outside a platform, use Cancel, or press Escape to cancel without spending crowns. Select an existing building to upgrade, repair, salvage or move it for free. Its direction follows the new platform.

Wall defenses retain their distinct Blender models at ranks I, II and III. Inner buildings use three modular tower ranks, with the original Sanctuary asset crowning its chapel wing:

| Building | Purpose | Rank I cost / power |
| --- | --- | --- |
| Royal Ballista | Aims and releases physical siege bolts; rank III pierces three targets | 100 / 2 |
| Aegis Projector | Spends shield reserve to intercept enemy projectiles crossing its forward barrier at wall height | 120 / 1 |
| Storm Spire | Strikes the nearest invader and chains to one, two or three nearby targets as it upgrades | 140 / 1 |
| Dawn Sanctuary | Heals living knights in its radius every five seconds; higher ranks improve healing and range | 110 / 0 |
| Tavern | Unlocks recruiting and grants the company starting ward | 120 / 0 |

Fortification upgrades change the circular walls and shared tower silhouette, add health and building power, and unlock royal rune sockets. All four cardinal platforms exist at every wall tier. Upgrades preserve existing damage. Salvage returns 70% of the building's total investment.

## Knight talents and equipment

Choose one knight at a time in Knights. Every knight begins with one talent point. A completed watch grants one more, and a promotion grants another, up to six points. Learn a top node before its descendants. Points can be split between paths; resetting the complete tree is free in the council. All abilities activate automatically during combat.

| Class / path | Progression |
| --- | --- |
| Warden / Vanguard | Thunder Slam: area damage and a short non-boss stun -> Aftershock: more damage and range -> Earthshaker: faster recovery and a longer stun |
| Warden / Guardian | Challenging Cry: forces nearby invaders to attack the Warden -> Iron Resolve: damage reduction during the cry -> Sacred Ground: periodic healing around the Warden |
| Marksman / Stormshot | Split Volley: a second arrow every third attack -> Barbed Arrows: shield penetration and two-target piercing -> Deadeye: increased damage |
| Marksman / Lifewarden | Mending Light: heals the most wounded nearby living knight -> Sheltering Light: adds a temporary, non-stacking shield -> Beacon of Dawn: greater healing, reach and frequency |

Each node explains its exact numbers and prerequisite. A knight can also equip one owned item. Gear transfers are free. The King & gear screen retains six independent shop offers, separate royal rune sockets and weapon upgrades. Buying an offer leaves the others available. A siege relic is chosen after the second victory, before the Dragon: Worldpiercer, Oath of the Storm King or the Black Standard.

## World and Dragon

The castle sits within a river valley with stone causeways, broken banks, ruins, pines and painted meadow foliage. The sky has a gradient, sun glow and slowly moving cloud bands. The King and each unit can be inspected with its equipment and skeletal clips. The assembled tower fades when it hides the King during combat.

Emberwing replaces the generated Prism Dragon mesh. Its painted geometry, UVs and original 144-bone rig are by Styloo, from [The Company Characters Asset Pack](https://styloo.itch.io/company), released under CC0. The source has no animations; eight new clips were authored on its skeleton: idle, walk, arrival, breath, rake, tail, stagger and death. Scale, origin and material roughness were adapted for the game. The asset's internal filename stays `prism-dragon.glb` for compatibility. Attribution and the original archive hash are in `public/assets/v3/CREDITS.txt`.

The Dragon descends from a seeded radial approach, circles the castle, commits visible attacks and takes physical projectile damage. Warning and active footprints share collision data, and each attack hits a given target at most once. The connected preview contains three encounters, with Emberwing as the finale. Full campaign expansion, additional enemy/weapon families, final art acceptance and broad balance/accessibility work remain open.

## Saves and extensibility

The castle checkpoint remains `neon-knights:v3:castle:1`. Existing square-castle saves migrate to cardinal mounts and receive empty talent selections with their earned point budget. Gold, wounds, equipment and progress are preserved. Council changes save immediately; victory records rewards once. Defeat or reloading during battle returns to the starting council. Invalid ownership, impossible talents, duplicate platforms and non-finite health are rejected. Storage failures use the current session with a notice.

Building definitions, talent definitions, council rendering, placement geometry, simulation and presentation are separated. Additional building families and class paths can extend their registries without adding another monolithic screen. The older construction workshop still exposes its original two building families and remains separate from campaign currency.

## Earlier circular-castle verification (historical)

- All **90 tests** pass. Production build and GLB validation pass. Asset revision `028b14469a5e` contains **23 runtime models**; [the asset report](evidence/circular-assets.json) records sizes, triangles and hashes.
- [Mouse input checks](evidence/circular-inputs.json) passed drag/tap placement, free relocation, cancellation, talent learning/reset/persistence, hover movement in both directions, charge and pause.
- [The mouse-controlled campaign](evidence/circular-mouse-campaign.json) won all three encounters in **52.5s, 51.7s and 96.3s**, without runtime errors. The King ended those fights at **160, 92 and 141 HP**. Each victory survived a reload. The recorded loadout uses all four building families and three distinct talent paths. This scripted run demonstrates completion and persistence; it is not a human difficulty or win-rate estimate.

- `tests/castle.test.ts` adds cardinal placement, atomic relocation, old-save migration, talent budgets/prerequisites, actual slam damage and stun, forced targeting, bounded healing shields and distinct support-building behavior.
- `tools/review/check-circular-castle.js` exercises real mouse drag, tap placement, cancellation, free relocation, talent learning/reset/reload, mouse hover movement, charging and pause.
- `tools/review/play-circular-castle.js` plays the connected encounters using mouse movement and legal council purchases. It uses read-only development snapshots for observation; it does not change health, currency or combat state.
- The replacement Dragon is visually inspected with `tools/review/inspect-emberwing.js`.
- [Production touch checks](evidence/circular-touch.json) passed real touch drag placement, cancellation without spending, heading movement, full charge and release, pause, and unclipped controls at 412x915 and 915x412. The production build exposes no castle debug controls and the final browser console was clean. Physical mobile hardware remains untested.
- Blender sources: `build_castle.py`, `build_support_defenses.py`, `adapt_vendor_dragon.py` and `build_foliage.py`. Vendor originals remain local and ignored. Every runtime GLB embeds its textures; the game loads no third-party models at runtime.

The recorded delivery evidence below belongs to the preceding square-castle revision and is retained for comparison.

## Earlier square-castle verification (historical)

- All 83 tests pass, including 15 new castle scenarios. The production build and GLB validation pass; asset revision is `865adaadc2ea` (16 GLBs).
- The [first desktop run](evidence/castle-browser-campaign.json) won the First Watch in 58.3 seconds and the Dragon encounter in 69.1 seconds. It then lost the counter-siege; that failure and its purchased loadout are retained as evidence.
- The [counter-siege retry](evidence/castle-browser-counter-retry.json) purchased Stormbow II, used short patrol movements on the threatened side, and won in 93 seconds. The King finished with 141 health. The saved council restored encounter 3, wall tier III, the bound relic, earned crowns and company wounds after reload. No health or currency was changed during either recorded battle run.
- [Production touch checks](evidence/castle-touch.json) passed at 412x915 and 915x412: rotation moves the King, release clears the input, charging fills, pause works, and the controls remain inside the viewport. The production build exposes no castle state/debug controls. Browser checks recorded no runtime errors.
- The [active-breath check](evidence/castle-effects.json) restored a recorded legal second-encounter checkpoint for visual inspection. A 120-frame sample at 1600x1000 with seven actors measured 16.7 ms median and 20.7 ms p95, with 460 draw calls and 821,492 rendered triangles including passes. This headless-browser sample on the development machine is not a full-load or cross-device performance claim. The King took 39 damage when left inside the active breath.
- The original Classic file retains SHA-256 `7798BA0CC3E46E5422F91146D5FAC6AEEFA1398EEE21C70C93EA39416242DBB4`.

These results demonstrate connected gameplay, save recovery and input behavior. They do not establish a human completion rate, final art acceptance or full-campaign performance.

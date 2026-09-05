# The King's Battlements - circular castle preview

The playable preview is at `/NeonKnights/next/`. The current pass focuses on mouse control, cardinal construction, knight talents and a replacement painted Dragon. The existing courtyard remains an independent training area.

## Playing

Move the mouse around the battlefield to guide the legendary King around a circular battlement. No mouse button or movement key is needed. The camera keeps north at the top. The King automatically fires at nearby invaders on his side. Hold left click or E, then release a piercing charged shot. Space casts Royal Decree when its meter is full; it can interrupt a Dragon breath during the warning. Q swaps the royal weapon. Escape pauses. Touchscreens use a drag around the castle and separate skill buttons; rotation buttons and arrow keys remain available as alternatives.

The company leaves through the north and south gates and fights automatically. Aldren and Corvin are Wardens; Elin is a Marksman. Lysa can be recruited as a reserve Marksman. Up to three knights deploy. Guard keeps a knight near its assigned gate; Hunt pursues invaders around the outer wall. Units persist until downed or the encounter ends. Equipment, talents, experience, rank and wounds carry between watches.

## Building

Choose Build, then drag a building card onto one of the four glowing N/E/S/W platforms. Selecting a card and then clicking/tapping a platform is equivalent and works with keyboard activation too. A transparent model previews placement; occupied platforms turn red. Release outside a platform, use Cancel, or press Escape to cancel without spending crowns. Select an existing building to upgrade, repair, salvage or move it for free. Its outward direction follows the new platform.

Four building families have distinct Blender models for ranks I, II and III:

| Building | Purpose | Rank I cost / power |
| --- | --- | --- |
| Royal Ballista | Aims and releases physical siege bolts; rank III pierces three targets | 100 / 2 |
| Aegis Projector | Spends shield reserve to intercept enemy projectiles crossing its forward barrier at wall height | 120 / 1 |
| Storm Spire | Strikes the nearest invader and chains to one, two or three nearby targets as it upgrades | 140 / 1 |
| Dawn Sanctuary | Heals living knights in its radius every five seconds; higher ranks improve healing and range | 110 / 1 |

Wall upgrades change the entire circular silhouette, add health and building power, and unlock royal rune sockets. All four cardinal platforms exist at every wall tier. Upgrades preserve existing damage. Salvage returns 70% of the building's total investment.

## Knight talents and equipment

Choose one knight at a time in Knights. Every knight begins with one talent point. A completed watch grants one more, and a promotion grants another, up to six points. Learn a top node before its descendants. Points can be split between paths; resetting the complete tree is free in the council. All abilities activate automatically during combat.

| Class / path | Progression |
| --- | --- |
| Warden / Vanguard | Thunder Slam: area damage and a short non-boss stun -> Aftershock: more damage and range -> Earthshaker: faster recovery and a longer stun |
| Warden / Guardian | Challenging Cry: forces nearby invaders to attack the Warden -> Iron Resolve: damage reduction during the cry -> Sacred Ground: periodic healing around the Warden |
| Marksman / Stormshot | Split Volley: a second arrow every third attack -> Barbed Arrows: shield penetration and two-target piercing -> Deadeye: increased damage |
| Marksman / Lifewarden | Mending Light: heals the most wounded nearby living knight -> Sheltering Light: adds a temporary, non-stacking shield -> Beacon of Dawn: greater healing, reach and frequency |

Each node explains its exact numbers and prerequisite. A knight can also equip one owned item. Gear transfers are free. The King & gear screen retains six independent shop offers, separate royal rune sockets, weapon upgrades and King treatment. Buying an offer leaves the others available. Relics remain a separate choice earned from the Dragon: Worldpiercer, Oath of the Storm King or the Black Standard.

## World and Dragon

The castle sits within a river valley with stone causeways, broken banks, ruins, pines and painted meadow foliage. The sky has a gradient, sun glow and slowly moving cloud bands. The King and each unit can be inspected with its equipment and skeletal clips. The keep fades when it hides the King.

Emberwing replaces the generated Prism Dragon mesh. Its painted geometry, UVs and original 144-bone rig are by Styloo, from [The Company Characters Asset Pack](https://styloo.itch.io/company), released under CC0. The source has no animations; eight new clips were authored on its skeleton: idle, walk, arrival, breath, rake, tail, stagger and death. Scale, origin and material roughness were adapted for the game. The asset's internal filename stays `prism-dragon.glb` for compatibility. Attribution and the original archive hash are in `public/assets/v3/CREDITS.txt`.

The Dragon descends from a seeded radial approach, circles the castle, commits visible attacks and takes physical projectile damage. Warning and active footprints share collision data, and each attack hits a given target at most once. The connected preview still contains three encounters: First Watch, Emberwing and the Counter-siege. Full campaign expansion, additional enemy/weapon families, final art acceptance and broad balance/accessibility work remain open.

## Saves and extensibility

The castle checkpoint remains `neon-knights:v3:castle:1`. Existing square-castle saves migrate to cardinal mounts and receive empty talent selections with their earned point budget. Gold, wounds, equipment and progress are preserved. Council changes save immediately; victory records rewards once. Defeat or reloading during battle returns to the starting council. Invalid ownership, impossible talents, duplicate platforms and non-finite health are rejected. Storage failures use the current session with a notice.

Building definitions, talent definitions, council rendering, placement geometry, simulation and presentation are separated. Additional building families and class paths can extend their registries without adding another monolithic screen. The older construction workshop still exposes its original two building families and remains separate from campaign currency.

## Verification for this pass

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

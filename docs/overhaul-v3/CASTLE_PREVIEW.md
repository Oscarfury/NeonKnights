# The King's Battlements

This revision connects the rebuilt art, construction and company systems into a playable castle siege at `/NeonKnights/next/`. The [castle direction](CASTLE_DIRECTION.md) supersedes free ground movement for the main commander. The existing courtyard remains an independent training area.

## Playing

The legendary King patrols a continuous route on the battlements. A/D or the arrow keys moves him around the fixed castle. Dragging a heading on the battlefield sends him to that side. He automatically fires at targets on his side; hold E and release for a piercing charged shot. Space spends a full Royal Decree meter on nearby invaders and can interrupt a warned Dragon breath. Q swaps the royal weapon. Escape pauses. Touch buttons provide rotation, charge and decree; pinch zoom remains available.

The company deploys through the north and south gates automatically. Aldren and Corvin are sword-and-shield wardens; Elin is a marksman. Lysa can be recruited as a reserve marksman. Up to three knights deploy at once. Guard orders restrict target acquisition around the assigned gate, while Hunt orders pursue the invading force. Units remain until downed or the encounter ends. Gear, rank, service experience, wounds and roster membership carry between encounters.

## Council systems

- **Castle:** three complete Blender wall models, four mounted platforms, three known-cost ranks each of Ballista and Aegis, capacity, facing, repair and 70% salvage. Wall upgrades preserve existing damage and add height, integrity, capacity and rune sockets. Ballistas release physical bolts from their elevated mechanisms. Aegis consumes reserve only when an attack crosses its actual shield arc and height.
- **Company:** three active slots and one recruitable reserve, Guard/Hunt orders, one transferable gear item per knight, treatment and service promotions. Ward Seal blocks part of a hit and recharges; Storm Seal increases attack damage; Field Surgeon's Kit enables one automatic rescue per encounter.
- **Armory:** six stable offers; purchasing one leaves the others intact. Knight equipment and royal runes have distinct slots. Owned runes can be moved or removed freely. Quickdraw, Sundering, Vital Spark and Forked Light alter actual attacks or hit events. Both royal weapons have three upgrade ranks.
- **Relics:** the Dragon unlocks one of three legendary choices, each with a chromatic plate, explicit effects and limits. Worldpiercer changes ballista damage, pierce count, shield penetration, arc, turn speed and reload. Oath of the Storm King links marked targets to knight projectiles with a per-knight cooldown. The Black Standard grants its bonus only to guarding knights near their assigned position.

The King and all humanoid roles can be inspected from the council with their actual equipment and skeletal attack clips. The keep fades when it obscures the King. Wall health and critical-wall warnings remain visible during combat.

## Encounters and boss

The connected preview contains three encounters: First Watch, the Prism Dragon and the Counter-siege. Invaders stage around the perimeter under a threat budget, with varying approach angles and intervals. Raiders attack with axes, Bulwarks resist frontal hits, and Hexcasters launch travelling bolts at the company, King or walls.

The Blender-authored Dragon has a 21-bone deformation rig and eight clips: idle, walk, arrival, breath, rake, tail, stagger and death. It descends from a seeded approach, circles the castle, commits visible attacks and takes physical projectile damage. Breath and wall rake threaten the battlements; the tail sweep threatens nearby knights. Royal Decree can interrupt a breath during its warning, before commitment. Warning and active presentation use the same footprints as hit evaluation; a target cannot be hit repeatedly by one attack merely because it remains inside for multiple frames.

This is the first connected siege, **not the completed fifteen-wave campaign**. The full campaign, additional boss families, more weapon and item families, richer outer objectives, final art acceptance and broad balance/accessibility work remain in the implementation plan. The three encounters provide an integrated place to test the new castle direction before expanding its content.

## Persistence and verification

The castle uses its own versioned checkpoint, `neon-knights:v3:castle:1`. Council changes save immediately. A battle starts from a copied checkpoint; winning saves its reward and persistent state once. Defeat or reloading mid-battle returns to the starting council. Workshop sandbox crowns cannot enter the campaign. Invalid records are rejected, including duplicate item ownership, duplicate platforms, illegal ranks and non-finite health. Fractional wounds are valid. Storage failure falls back to the current session with a notice.

`tests/castle.test.ts` covers the wall path and heights, pause, persistent deployment, transactional purchases, rune/item ownership, recruit limits, wounds and save validation, frontal shields, mounted projectile elevation, shield-height crossings, the Worldpiercer tradeoff, boss approach and attack commitment, interrupt windows, defeat checkpoints and single victory rewards.

Browser reproduction scripts are `tools/review/check-castle.js` and `tools/review/play-castle.js`. The first checks real purchases, equipment, inspection, reload, wall patrol, gate deployment and pause; the second plays with keyboard controls and makes legal council purchases between encounters. `tools/review/castle-balance.ts` is a deterministic diagnostic with idle, constant-patrol and target-seeking policies. These policies demonstrate reachability and failure conditions, not a human win-rate estimate.

Art sources: `tools/blender/build_castle.py`, `build_company_kit.py`, `build_dragon.py`, `forge.py`, and the existing paladin export/merge scripts. Runtime GLBs retain the supplied paladin's original mesh and painted textures. New equipment, castle geometry, packed surface textures, Dragon geometry, skin weights and motions are authored additions. Vendor source files remain local and ignored.

## Recorded delivery checks

- All 83 tests pass, including 15 new castle scenarios. The production build and GLB validation pass; asset revision is `865adaadc2ea` (16 GLBs).
- The [first desktop run](evidence/castle-browser-campaign.json) won the First Watch in 58.3 seconds and the Dragon encounter in 69.1 seconds. It then lost the counter-siege; that failure and its purchased loadout are retained as evidence.
- The [counter-siege retry](evidence/castle-browser-counter-retry.json) purchased Stormbow II, used short patrol movements on the threatened side, and won in 93 seconds. The King finished with 141 health. The saved council restored encounter 3, wall tier III, the bound relic, earned crowns and company wounds after reload. No health or currency was changed during either recorded battle run.
- [Production touch checks](evidence/castle-touch.json) passed at 412x915 and 915x412: rotation moves the King, release clears the input, charging fills, pause works, and the controls remain inside the viewport. The production build exposes no castle state/debug controls. Browser checks recorded no runtime errors.
- The [active-breath check](evidence/castle-effects.json) restored a recorded legal second-encounter checkpoint for visual inspection. A 120-frame sample at 1600x1000 with seven actors measured 16.7 ms median and 20.7 ms p95, with 460 draw calls and 821,492 rendered triangles including passes. This headless-browser sample on the development machine is not a full-load or cross-device performance claim. The King took 39 damage when left inside the active breath.
- The original Classic file retains SHA-256 `7798BA0CC3E46E5422F91146D5FAC6AEEFA1398EEE21C70C93EA39416242DBB4`.

These results demonstrate connected gameplay, save recovery and input behavior. They do not establish a human completion rate, final art acceptance or full-campaign performance.

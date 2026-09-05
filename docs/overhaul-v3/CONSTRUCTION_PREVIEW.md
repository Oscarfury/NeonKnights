# Foundry: construction revision

The Royal Workshop is available from the Foundry at `/next/`, alongside the armory and courtyard. This delivers a construction sandbox within the ongoing overhaul. Enemy encounters, the campaign economy and recruitment are still required for the planned siege milestone.

## Playtest

Choose **Visit the workshop**, inspect either family, and compare all three ranks with emission disabled. Drag to orbit; pinch or scroll to zoom. Select a site from the courtyard or the site buttons, set its facing, then build the selected rank. Models in inspection are free to examine. Purchases, repairs and salvage change the separate workshop ledger.

The preview supplies **1,200 crowns and four capacity**. Ballistas occupy two capacity and Aegis Projectors occupy one. All costs are known:

| Family          | Rank I | Upgrade to II | Upgrade to III | Full rank III |
| --------------- | -----: | ------------: | -------------: | ------------: |
| Royal Ballista  |    100 |           160 |            240 |           500 |
| Aegis Projector |    120 |           170 |            260 |           550 |

Building a higher rank directly costs the same as building and upgrading sequentially. Relocation and facing changes are free. Salvage returns 70% of construction investment once. Repairs cost one crown per four missing durability, rounded up. Upgrading preserves existing wounds. A wreck must be repaired before upgrading and remains an obstacle until salvaged.

Enter the courtyard to operate the deployed machines:

- Ballistas assemble, turn toward living range boards inside their firing cone, release travelling bolts and recoil while winding the cable back. Damage occurs on contact. Rank III bolts can pierce three different boards. Commander and defense hit statistics are separate.
- Aegis Projectors protect targets inside their forward coverage when a sweeping ward ray crosses the outer barrier from outside. Blocking spends the actual prevented damage from the shield reserve. Recharge begins after 1.5 seconds without a block. A depleted reserve can prevent part of a hit; rays originating inside, ground impacts and lingering fire bypass the barrier.
- Defenses receive ward damage. At zero durability they stop operating and visibly slump. Their durability persists when leaving the courtyard, restoring the company or reloading the page. The workshop provides repair and salvage controls.
- Knights route around defense footprints, including wrecks, and can go around the balcony when both endpoints are on the courtyard floor.

For a shield check, build an Aegis III at the west courtyard site with its default facing. Move the commander to approximately three meters west of center, near the middle range line, and start the ward trial. The first impact hurts; the following ray crosses the shield. Stand closer to the machine during an impact to test structure damage and repair.

Workshop saves use `neon-knights:v3:workshop:1`. Loading validates ranks, sites, unique IDs, durability, funds and capacity. Corrupt storage produces a visible fresh-ledger notice. If browser storage is unavailable, the ledger lasts for the current session. **Reset all defenses & crowns** explicitly resets this sandbox; these funds are not campaign balance values.

## Art and implementation

Six separately authored GLBs come from `tools/blender/build_defenses.py`. Ballista silhouettes progress from a wheeled timber carriage through an armored turntable to an elevated siege frame with outriggers, recoil jacks, ammunition and mantlets. Aegis ranks add hinged protection, charge cartridges, return conductors and a larger grounding assembly. Plate borders, rivets, enamel and embossed crests remain visible without emission.

These machines use separate mechanical pivots for the turret, carriage, winch, cable, loaded bolt, core and armor hinges. Runtime motion follows simulation state; they do not use a humanoid deformation skeleton. Static details batch by material within their respective mechanisms. The paladin's existing 74-bone rig and 26 animation studies are retained.

Rebuild with Blender 4.3.2 from the repository root:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 4.3\blender.exe' --background --factory-startup --python-exit-code 1 --python tools/blender/build_defenses.py
npm run assets:stamp
npm run assets:check
```

Editable derived scenes stay in ignored `art/work/defenses`; runtime models are published in `public/assets/v3`. Original vendor source files and the user's ZIP remain local and unchanged.

## Verification and remaining work

The [validation record](evidence/construction-validation.json) records the final asset revision, tests and browser evidence. The simulation suite has **68 passing tests**, including atomic spending, rank costs, saved-state rejection, repairs, projectile travel/piercing, barrier geometry, recharge at different rates, structure damage and formation routing. Browser scripts exercise the actual production controls:

- `check-construction.js`: rank comparison, purchases, upgrades, relocation, reload, physical bolt hits and shield interception reached through normal movement.
- `check-construction-repair.js`: natural ward damage, company reset, reload, paid repair and salvage.
- `check-construction-touch.js`: taps, rank selection, construction, relocation, courtyard operation and portrait/landscape layout.

R07 remains partial pending the accepted siege setting, enemy interactions, branch equipment, richer destruction and final art review. The selectable models establish working mechanisms and distinguishable tiers; they do not close the user's overall art-quality milestone. Terrain line of sight for siege bolts, Dragon interactions, a complete planning/combat economy and campaign saves remain open. This delivery does not establish full-battle performance or physical mobile performance.

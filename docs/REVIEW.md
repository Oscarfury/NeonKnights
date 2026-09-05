# Neon Knights: review of the current game

Reviewed 5 September 2026. [Overhaul proposal](OVERHAUL.md) · [Architecture and Blender pipeline](ARCHITECTURE.md)

The game has a useful foundation: defend a central fortress, aim around its perimeter, use time slow, and assemble combinations of weapons, knights, shields, and necromancy. Its best future is a game about commanding an increasingly spectacular fortress. The current implementation already contains much of the raw material, but presentation, upgrade promises, and combat rules disagree in several places.

## What was reviewed

- The [live GitHub Pages game](https://oscarfury.github.io/NeonKnights/), including a browser-controlled first wave, the shop, and a fresh menu at a 390 × 844 viewport.
- GitHub's Pages and deployment APIs: the latest returned deployment was successful, used commit `c32d843e601f3dec502fe17f64d716f7aeb31fa7`, and was created on 16 August 2025. Pages currently builds `main` from the repository root.
- The local `index.html`: 7,222 lines, including substantial pre-existing unpublished edits. Its SHA-256 at the start of this review was `7798ba0cc3e46e5422f91146d5fac6aeefa1398eee21c70c93ea39416242dbb4`.
- Controlled browser probes of the live wave planner, weapon factory, upgrade shop, and charged-shot path. These probes changed state only in an isolated browser session.

This was a source review and a short automated gameplay inspection. The automated first wave used knowledge of enemy positions; its result is not evidence of normal player difficulty. Later waves were inspected through code and controlled state probes, not completed by a human player. No representative mobile-device performance benchmark or full campaign balance study was performed.

## What is worth preserving

**The central fortress.** It gives the player an immediately understandable objective and a recognizable silhouette. A changing castle can become the visual record of the player's build.

**Time slow.** It creates a moment to read the battlefield and make a deliberate intervention. Make its interaction with weapons consistent.

**Named combinations.** Angelic Knights, Midas Knights, Radiant Aegis, and Dragonkin Lord have much more character than generic damage bonuses. Their identities should become understandable build paths.

**The Golem.** A boss assembled from absorbed enemies is a distinctive premise. Expand the visible assembly, interruption, and dismemberment mechanics.

**A simple browser launch.** Retain the ability to follow a link and play. The codebase can become modular while the deployed result remains a static site.

## Findings that should precede expansion

Line references below refer to the reviewed local `index.html`; deployed lines differ.

| Priority | Finding | Evidence and consequence | Proposed correction |
|---|---|---|---|
| P0 | The menu teaches disabled controls | `buildMenu()` advertises WASD teleporting and power after movement. `handleControls()` explicitly disables WASD; `updatePlayerPos()` follows mouse angle. The same mismatch was verified in the live runtime. | Choose one control contract, implement it, and derive tutorials from the actual input map. |
| P0 | Purchased weapon families cannot level normally | In `buildUpgradeUI()` around line 1706, owning any primordial makes the filter reject every primordial, including the one already owned. A live probe with Sniper Shot owned produced no Sniper Shot offer; the filter establishes that this is deterministic. | Exclude competing weapon families while allowing the selected family until its real level cap. |
| P0 | Charged attacks do not consistently charge the selected weapon | `makeProjectile()` returns `null` after creating sniper, flame, or homing attacks; `fire()` then skips the later power multiplier. At wave 2, a live sniper probe produced 93.15 damage for both an uncharged and fully charged call. | Resolve alternate attacks inside each weapon definition, before creating its damage events. |
| P0 | Turrets inherit player weapon transformations | `ballistaThink()` calls `makeProjectile()` before assigning turret ownership and damage. With sniper owned, a live probe returned no projectile and created a sniper line instead. Time slow also changes this factory path. | Pass source and weapon definition into attack creation; keep support weapon behavior explicit. |
| P0 | The intended wave-10 Golem is skipped | The `w===10` cleric-introduction branch runs before the generic boss branch. Live planner probes returned a dragon at 5, no boss at 10, and a Golem at 20. | Represent boss encounters explicitly in wave data and validate the schedule. |
| P1 | The shop hides part of itself | The large next-wave intel overlay covers the shop header and upper card area at the reviewed desktop size. This is visible after ordinary wave 1 and in a settled shop probe. | Make forecast a compact part of the shop layout. |
| P1 | Mobile layout distorts and clips content | At 390 × 844, the canvas border box measured 396 × 639 despite its 1400 × 900 drawing surface; the three menu columns and HUD overflow their usable space. Touch supports aiming/shooting but has no equivalent Shift or right-click controls. | Preserve the playfield aspect ratio, reflow menus, and supply full touch controls. |
| P1 | Rewards multiply several sources of advantage | Live kill reward multiplies base bounty × treasury × combo × Midas, then accrues an additional treasury payout. Costs grow only as `50 + 25 × level`. | Separate score mastery from core purchasing power; cap and price economy benefits. |
| P1 | Upgrade descriptions disagree with calculations | Rapid Fire claims +25% fire rate per rank; the actual interval changes from .36 to .32 seconds at rank 1, about +12.5% shots/second. Local Boomerang text says +50% damage while the factory uses +85%. Local Midas text still describes the older multiplier. | Generate before/after values from the same definitions that resolve combat. |
| P1 | Caps are often comments rather than enforced rules | Local critical chance and damage comments describe level-5 maxima, but the calculations continue to grow. Rapid Fire reaches its interval floor at rank 7 while further purchases remain possible and still affect speed. | Give each rank an explicit effect and an enforced cap. |
| P1 | Buying an upgrade also redraws the entire random offer set | The purchase handler calls `buildUpgradeUI()` again. Cheap purchases become a way to search for new cards. | Keep offers stable for a shop visit; make rerolls a separate priced action. |
| P1 | Run and profile persistence are mixed | `persist()` stores upgrades, but `startGame()` replaces them with defaults. There is no complete resumable run snapshot. Some timers and special-state fields are not rebuilt by the new-run function. | Separate profile unlocks, settings, and a versioned run snapshot; build fresh run state through one constructor. |
| P1 | Pause and presentation use different clocks | Simulation scales `dt`, but various particles, wave transitions, and effects use `setTimeout()`, `performance.now()`, or fixed `.016` lifetime decrements in rendering. | Use a single lifecycle owner and explicit simulation, real-time input, and presentation clocks. |
| P2 | Visual emphasis is nearly uniform | The HUD, backdrop, castle ring, menu, and effects all glow and animate strongly. Most enemies remain colored geometric shapes. | Reserve strong contrast for threats and meaningful actions; give units material, silhouette, and motion identity. |
| P2 | Audio lacks material and spatial identity | Current effects use short oscillator tones with randomized pitch. | Add a small layered sound library, directional warnings, and restrained adaptive music. |

P0 here means a foundation issue to resolve before balancing the overhaul, not a claim that the live page cannot run.

## Balance examples

The baseline projectile is 18 damage with a .36-second firing interval: approximately 50 raw damage per second before accuracy, shields, range, and upgrades. The tutorial Squire has 23 HP. The wave-5 dragon has 2,899 HP; a Squire at the same wave has about 22. This suggests a sharp change in the kind of damage required. Boss pacing should be tuned against an expected early build and attack opportunities, not inferred from raw HP alone.

For a conditional economy example, a live Squire kill with Treasury 3, Midas 3, and a 10× combo computes:

`8 × 2.5 × 5 × 10 = 1,000 gold`, plus 300 accrued treasury payout.

That is a formula example, not a measured common gameplay event. In the local draft the corresponding expression is `8 × 1.75 × 2.4 × 10 = 336`, plus 15% accrued payout. The draft reduces the magnitude but preserves the multiplication of advantages.

The treasury's current “interest” accrues from kill income. It is not interest on unspent banked gold. Any replacement should explicitly choose and explain one of these models.

## Live and local differences

The unpublished draft replaces Piercing Shot with Chain Lightning, reduces Treasury from +50% kill income / 10% payout per rank to +25% / 5%, reduces Midas multipliers, caps cavalry spawns at three, rewrites critical hits, and restricts Orbital Strike to time-slow sniper shots. These are existing local edits, not changes made by this review.

Consequently, the live balance findings should not be mistaken for a complete evaluation of the local draft. Both versions need the same architectural separation and reliable upgrade contracts.

## Evidence

- [Live desktop menu](assets/review/live-menu-desktop.png)
- [Live first-wave combat](assets/review/live-combat-desktop.png)
- [Ordinary first-wave completion transition](assets/review/live-after-first-wave.png)
- [Settled shop layout in a controlled wave-2 state](assets/review/live-shop-controlled.png)
- [Fresh mobile menu](assets/review/live-menu-mobile.png)
- [Structured browser observations](assets/review/live-review.json)
- Reusable browser review script: `tools/review/inspect-live.js`. It uses controlled state changes after the first-wave inspection; resulting probe screenshots are not natural progression screenshots.

The inspected gameplay produced no JavaScript `pageerror` events. A missing site favicon produced a separate 404. Neither observation establishes correctness beyond the short reviewed paths.

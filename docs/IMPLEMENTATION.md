# Overhaul implementation · September 2026 playtest

The new game replaces the root HTML application with a TypeScript simulation, a Phaser scene host, a separate battlefield renderer, semantic DOM menus, and a Vite production build. The existing unpublished draft is retained unchanged at `/classic/`.

## Delivered for testing

| Plan area              | Implemented behavior                                                                                                                                                                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0: foundation         | Fresh-state constructor; fixed simulation steps; source-owned attacks; one damage/death/reward path; finite chain budgets, poison and companion caps; real pause; explicit boss schedule; stable shop offers; separate settings/profile/checkpoint storage.                      |
| M1: first siege        | Five-wave opening act; Stormbow, Sunlance and Cinder with working alternates; shields, charges, healers and Prism Dragon; bastion phasing, independent aim and castle obstruction; compact shop; generated Blender atlas integrated into the battlefield.                        |
| M2: builds             | Rift Chakram and Starfall complete the five-weapon arsenal; six runes; eight structures across four pads; Cavalry/Aegis doctrines; ten weapon branches; five boss-seal awakenings; the eight named combination rules and a discoverable field guide.                             |
| M3: campaign           | Fifteen authored waves across three acts; Procession Golem with breakable arms and reward-ineligible carriers; Hollow King with decree reinforcements and vulnerability windows; three act-event choices; results, retry, checkpoint recovery and optional endless continuation. |
| M4: playtest usability | Guided controls, training yard, isolated ten-second previews, touch equivalents, remapping, hold/toggle slow, focus-loss pause, motion/effect/number preferences, larger text, separate audio levels, responsive menus, automatic Pages deployment.                              |

The longer design document remains a direction, not a claim that every production-art suggestion has shipped. This build uses the original modular Blender knight and code-drawn fortress/enemy silhouettes, with synthesized audio. A full enemy animation library, custom musical score, representative physical-device profiling, human difficulty assessment, cosmetic reward collection, and the optional reserve ideas remain future production work. In particular, the proposed 15–20 minute pacing and device FPS targets are not claimed as human/device acceptance results.

## Architecture decisions

`src/game/simulation` owns every gameplay timer and rule. The loop runs at 60 fixed steps per second with at most 100ms of catch-up, so backgrounding cannot advance a siege by minutes. Time slow changes world time to 35%, retains player cadence, drains 40 energy per real second, and requires release after exhaustion. Rendering observes state and never awards rewards, decrements timers, or removes gameplay entities.

Phaser 3.90 handles boot, asset loading, scene lifecycle and display scaling. A Canvas-backed Phaser texture hosts the fixed-view renderer. This is a deliberate continuation of the proposal's Canvas migration stage, with a working Phaser scene boundary. It does not introduce a second 3D renderer. The 768 × 1024 knight atlas contains eight directions and six poses per direction; its metadata and Blender exporter are versioned. No shader services, external fonts or remote art are required to play.

Weapon definitions, rune compatibility and rank caps live in `src/game/data/catalog.ts`. The shop reads damage and interval values from the same functions as combat. Player projectiles, autonomous structures, squads, and status ticks have distinct owners. Secondary hits share an attack hit set; summons cannot produce gold or souls; score combo never multiplies purchasing power. Boss attack sectors are distinct from their physical approach, so changing a boss's target does not silently change turret coverage.

The run checkpoint is versioned and validated on load. It contains planning state and purchases, not in-flight projectiles or enemies. Reloading a battle therefore returns to its previous planning checkpoint. New-wave cooldowns reset consistently whether reached normally or through a restored checkpoint. Corrupt and incompatible snapshots are ignored safely. The legacy key `neon-knights-save-v1` is read only for its separate high-score field and is never rewritten by the overhaul.

## Validation

- **34 automated rule/input tests:** boss schedule, deterministic state, pause, energy exhaustion, phase cooldown, obstruction, charged attacks, all five turret/player combinations, death attribution, economy caps, poison expiry, weapon leveling, shop stability, rune capacity, repair/reroll limits, projectile alternates, companion capacity, boss interrupts, defeat/victory, act events, save validation, capstones, and rapid touch taps.
- **Five deterministic full campaigns:** the automated aiming harness reaches wave-15 victory with every weapon. It uses perfect knowledge of positions and automatic purchase decisions. Its results establish progression reachability, not normal player difficulty or an optimal build.
- **Desktop browser:** ordinary first-wave completion through mouse/keyboard input; pause; rank-II purchase with stable remaining offers; preview isolation; reload/resume after purchase; controlled captures of all three bosses; no JavaScript page errors in these checks.
- **Responsive browser:** 390 × 844 menu and planning panels remain within the viewport and scroll vertically. Touch emulation at 844 × 390 verifies hold/release time slow, rapid bastion taps, and blur pause. These are browser emulation checks, not physical-phone performance measurements.
- **Production:** TypeScript checking and Vite build under `/NeonKnights/`; runtime files isolated from editable Blender sources; Pages publishes the built artifact through CI.
- **Local production browser smoke:** settings persistence, Starfall training, pause, and absence of development mutation helpers passed with zero failed HTTP requests or page errors. A short 89-frame training sample on the development desktop had a 16.7ms median / 17.2ms p95 frame interval; this is not a mobile or dense-battle benchmark.

Reproducible commands are in the root README. Browser automation scripts distinguish ordinary first-wave input from controlled later-boss presentation captures. Temporary screenshots, logs, and local browser profiles are ignored by Git.

Committed evidence: [menu](assets/overhaul/menu.png), [ordinary first-wave shop](assets/overhaul/shop.png), [controlled Dragon encounter](assets/overhaul/dragon.png), [browser checks](assets/overhaul/browser-checks.json), and [local production checks](assets/overhaul/production-checks.json).

## Baseline reconciliation

The deployed baseline is `c32d843e601f3dec502fe17f64d716f7aeb31fa7`. Before changing the application, the local draft was copied into `public/classic/index.html`; its SHA-256 remains `7798ba0cc3e46e5422f91146d5fac6aeefa1398eee21c70c93ea39416242dbb4`, matching the historical review.

The draft's intended direction—chain lightning, bounded poison and cavalry, less inflationary treasury/Midas rewards, and meaningful critical targeting—is represented by the new bounded systems. Its exact old multipliers are retained only in Classic because the new campaign uses separate damage and economy budgets.

GitHub Pages previously built `main` at `/`. The Vite application requires the Pages source to be GitHub Actions. `.github/workflows/pages.yml` runs tests and the production build before deploying `dist`; pull requests only build and test. The classic route is included in the artifact, while the source `.blend`, GLB proof, and historical screenshots stay in the repository.

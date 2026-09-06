# Neon Knights: the second overhaul

**Implementation status:** [The King's Battlements](CASTLE_PREVIEW.md) is a playable three-encounter castle siege with auto-fire, wall Guard, a recruited company, a modular castle and committed enemy assault AI. The [fifteen-level campaign](CAMPAIGN_15.md) and [complete upgrade paths](UPGRADE_PATHS.md) are specified; their additional content is not yet implemented. The Foundry, workshop and courtyard remain separate inspection/training scenes.

**Baseline:** `2259a28`. The user's complete playthrough rates that build at roughly 15–20% of the intended game. Treat that as a prototype assessment, not as a release that needs a little polish.

**Art floor:** the user's [Hand Painted Paladin Knight reference](https://www.cgtrader.com/free-3d-models/character/fantasy-character/hand-painted-paladin-knight-rigged-and-game-ready). The next assets must satisfy the [art standard](ART_STANDARD.md), including real skeletal animation and the correct weapon. A larger polygon count alone does not meet that standard.

## Read this set in order

1. [Fifteen-level campaign](CAMPAIGN_15.md): exact encounters, enemy AI, all three bosses, director constraints, economy and acceptance.
2. [Complete upgrade paths](UPGRADE_PATHS.md): castle tiers and wings, four defenses, two weapons, four knight classes, gear, runes and relics.
3. [Current playable scope](CASTLE_PREVIEW.md) and [progress](PROGRESS.md): implemented behavior and verification.
4. [Art and animation standard](ART_STANDARD.md): required models, clips and asset verification.
5. [Implementation plan](IMPLEMENTATION_PLAN.md): historical work packages; the campaign specification now defines the expansion stages.
6. [Historical design](DESIGN.md) and [baseline diagnostics](evidence/v2-audit.json): the earlier proposals and their supporting probes.

This set supersedes the earlier proposal for **future development**. The root application and `docs/IMPLEMENTATION.md` still describe the deployed prototype. The plans here are proposals, not shipped features.

## Historical decisions arising from the first playthrough

The table and slice target below predate the castle controls. The current campaign documents above replace conflicting counts and mechanics.

| Player feedback                              | Replacement design                                                                                                                                | Evidence required before calling it done                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Crude character and mismatched sword attacks | Hand-painted, skinned 3D characters; continuous orientation; actual bow, lance, engine, chakram and mortar equipment with distinct animation sets | In-game clip review at battle and inspection scale; no sword visible or sword strike playing with Stormbow equipped      |
| Stationary bosses whose warnings do little   | Moving bosses with staged entrances, physical projectiles, swept breath, impact volumes, lingering hazards and finite interrupt opportunities     | Each attack resolves against a non-reacting player; dodging, bracing and interruption produce visibly different outcomes |
| Unsatisfying building                        | A construction catalogue, placement previews and visible structures with three authored tiers plus legendary transformations                      | All tier silhouettes differ with emissive effects disabled; aim, reload, recoil, construction and damage are animated    |
| Normal too easy; upgrades exhausted early    | Threat-based encounters, bounded fortress durability and separate act-by-act progression budgets                                                  | Runs with imperfect input, incomplete builds and passive play; no shop dominated by filler at wave 11                    |
| Trapped in a build; mixed shop systems       | Separate Construction, Armory, Garrison and Relics sections; free rune removal; stored equipment; affordable pivots; multiple offers              | A player can change strategy after act I and exploit a late legendary without losing the run's earlier investment        |
| Static four-lane battlefield                 | Free commander movement around a navigable fortress; flanking routes, gates, ramps, cover and changing objectives                                 | Movement changes attack angles, safety, rescue options and objective outcomes throughout a wave                          |
| Knights clump and expire                     | Recruited knights with health, equipment, roles and persistent orders; formation slots, collision avoidance, retreat and recovery                 | Knights survive between waves, maintain useful spacing and show equipped items in combat                                 |
| Prototype is far from the intended game      | A small, high-quality playable slice before expanding the campaign                                                                                | A recorded playthrough and asset/animation review; feature counts and passing unit tests are insufficient                |

## Historical three-encounter target

Build a **three-encounter, roughly 5–8 minute siege** at the new quality level: a free-moving commander with Stormbow and Sunlance, three enemy roles, a moving Dragon, three persistent knights and a recruitable reserve, two constructible buildings with all three tiers, separate planning sections, and an earned choice among three legendary build changes. The final encounter lets the player use that reward.

That is a production-quality sample of the intended experience. It deliberately proves the difficult foundations—art, animation, combat, movement and attachment to the garrison—before fifteen waves and a large asset roster multiply their cost.

The separate `/next/` route begins with the Foundry art/movement preview while the playable siege is developed. Publishing or promoting a future build should refer to the actual candidate and its checks. The Foundry does not yet complete the three-encounter milestone above.

# Neon Knights: The Last Bastion

An overhaul proposal, 5 September 2026. Working subtitle, not a final naming decision.

[Current-game review and evidence](REVIEW.md) · [Architecture and Blender pipeline](ARCHITECTURE.md)

## The direction

**Command the last luminous fortress in a fallen kingdom. Phase between its battlements, interrupt a siege in slow motion, and turn a modest garrison into an unmistakable machine of war.**

Keep the immediately legible act of defending a central castle. Expand the decisions surrounding it: which side needs the commander, how the fortress is built, which enemy formation must be disrupted, and what extraordinary combination the run is becoming.

The intended experience is a 15–20 minute action roguelite siege with an ending, followed by an optional endless continuation. A player should finish a run remembering a build and a battle: “My knights carried lightning between enemies, then I broke the Golem's arm during time slow.”

All figures in this proposal are **initial tuning hypotheses**, not validated balance values. The current-game findings are documented separately so observations and design suggestions are not confused.

## Brainstorming the possible games

Four directions emerged from the existing systems:

| Direction | Why it is attractive | Main risk | What to borrow |
|---|---|---|---|
| Fortress action roguelite | Direct aim, time slow, castle upgrades, and companions all support one fantasy | Passive defenses could make the commander unnecessary | The primary direction; preserve active intervention |
| A small real-time strategy siege | Engineers, squads, construction, and formations already suggest it | Selection and economy management could overwhelm a fast browser game | One squad command, four build pads, readable formations |
| A fortress survival spectacle | Large swarms and automatic weapons produce satisfying escalation | Builds may become visual noise and numerical inevitability | Late-run transformation and crowd effects within a strict readability budget |
| A cinematic 3D castle defense game | Blender characters, towering bosses, dynamic cameras | Camera, occlusion, and rendering work may dominate development | Dimensional art and carefully staged boss entrances |

The recommended game combines deliberate player action with a fortress that supports a recognizable build. Every major addition should serve at least one of these questions: **Where should I be? Which threat matters? What is my build becoming?**

## Five design commitments

1. **The commander matters.** Automatic units handle background pressure. Shields, formations, siege attacks, and weak points reward the player's attention.
2. **Power has a visible form.** An upgrade changes the knight, weapon, fortress, squad, or a recognizable combat effect.
3. **Danger is readable before it resolves.** An enemy's silhouette, preparation animation, ground marking, and sound explain the response.
4. **Builds change behavior.** A purchase creates a decision or a useful interaction. Higher numbers support those changes.
5. **A run has a dramatic shape.** Introduction, specialization, pressure, a boss, recovery, escalation, and a conclusion.

## Visual identity: enchanted war machines

Use dark stone, blue-black steel, muted plum cloth, old gold, and light trapped inside carved runes. The environment is a medieval fortress powered by impossible energy. Let the materials feel physical, with neon marking power, allegiance, and imminent action.

Aim for approximately 70% quiet surfaces, 20% readable material contrast, and 10% emissive accents in an ordinary battle frame. These are composition guidelines, not shader settings. A still frame should remain understandable when most particles are hidden.

### The battlefield

Replace the abstract grid and circle with a fortress on a basalt island: four substantial bastions, a central light engine, a visible gate, damaged bridges, and enemy approaches carved into the surrounding terrain. Retain a broad overhead view so every threat remains visible. Start with one fixed elevated projection; player-controlled camera rotation is outside the first version.

Use three depth layers. Foreground masonry and grass establish scale without covering paths. The playable ground uses quiet, consistent values. Distant ruins and mist establish the world without competing with units. Break up the ground with paths, rubble, old siege scars, and sparse reflected light.

Make the fortress visibly grow during a run. A ballista pad gains a platform and weapon; a lightning build adds conductors; a necromancy build raises bone braziers; a support build hangs lit banners and activates a chapel. Show construction through a short sequence of assembling parts rather than a size increase alone.

### Characters

Create broad silhouettes that survive being drawn at roughly 40–70 pixels tall. Knights have a clear helmet, shoulder line, shield, and gait. A Lancer reads as a long forward weapon; a Cleric carries a tall staff and a conspicuous halo; a Jester is asymmetrical and springy. Avoid spending production time on details that vanish at gameplay scale.

Use Blender to build a small library of compatible bodies, helmets, capes, weapons, and shields. Share animation rigs across humanoids. The included [Aegis Knight blockout](assets/knight-puppet/aegis-knight-preview.png) demonstrates the pipeline; final characters need stronger posing, silhouette iteration at small sizes, and a full animation set.

### Color and effect grammar

| Meaning | Main treatment | Redundant cue |
|---|---|---|
| Allied presence | Cyan or turquoise accents on restrained materials | Crest, consistent base marker, readable silhouette |
| Hostile attacks | Hot coral/orange at the attack origin and destination | Arrow, chevron, or filled danger shape |
| Electric interaction | Branching cyan-white strokes | Forked bolt icon and crackling rhythm |
| Fire and heat | Amber cores, dark smoke, directional streaks | Heat gauge and flame outline |
| Necromancy | Violet wisps and pale bone | Skull rune, tether, spectral movement |
| Healing and protection | Soft ivory/gold arcs | Shield or cross marker, rising particles |
| Critical or weak-point hit | Brief white-gold accent | Distinct impact sound and concise number treatment |

Color alone should never identify an enemy team or an imminent hazard. Boss telegraphs always draw above floor decoration and below units, with a high-contrast boundary.

### UI treatment

Use an ornamental display face sparingly for titles and a clean, easily scanned face for numbers and descriptions. Give panels opaque or nearly opaque dark fills. Keep selected cards still while they are being read. Restrict animated borders to a brief selection confirmation or newly unlocked evolution.

The battle HUD needs fortress health, wave progress, a compact threat compass, time energy, and the squad command. Gold and score can occupy quieter positions. High score belongs on menu/results screens. An incoming siege attack is more important than a large combo banner.

## Controls and the moment-to-moment loop

Prototype **four battlement anchors** first. WASD select north, west, south, and east respectively; each press phases the commander to that bastion through a roughly .18-second effect. Mouse aim remains independent of position. The existing pointer-orbit scheme should remain an alternative input preset and a comparison in playtests.

Basic attacks respect the fortress's line of sight, so the chosen bastion matters. Enemy shields face an approach, and some targets expose different angles. Repositioning is useful because it changes what the commander can intercept and hit. Explain blocked firing directions immediately through the reticle.

| Input | Action | Initial contract |
|---|---|---|
| Mouse movement | Aim | Reticle shows target validity and obstruction |
| Hold left button | Primary attack | Consistent behavior for the selected weapon |
| Right button | Weapon alternate | A defined charge, guard, detonation, or recall action |
| WASD | Phase to a cardinal bastion | Reliable movement, with no per-press damage stacking |
| Shift | Hold time slow | Energy is visible; weapon identity is preserved |
| Space | Issue the equipped squad command at the cursor | One deliberate command, with a visible cooldown |
| Escape | Pause | Stops all combat and wave timers |

An optional Phase Momentum rune empowers the first shot after a reposition. Give it a two-second internal cooldown and a short opportunity window so repeating movement inputs cannot generate unlimited damage.

Time slow starts with 100 energy, drains about 40 per real second, and recovers about 20 per second after a one-second delay. Slow the world to roughly 35% speed while retaining responsive aiming and the commander's normal attack cadence. Allied autonomous attacks use world time. This is already a large relative advantage; avoid also giving every weapon an unrelated free damage transformation. Judge the values through playtests.

Touch mode needs actual equivalents: aim/auto-fire area, four large bastion buttons or a directional selector, an alternate-action button, time slow, and command. Begin with landscape. Portrait menus must reflow correctly even if portrait combat is postponed. All schemes need remapping, a hold/toggle slow option, focus-loss pause, and input clearing when a pointer leaves or the window loses focus.

The intended 20-second battle rhythm is: identify a formation, reposition, remove its enabler, command knights to contain another side, use time slow to answer a dangerous attack, then exploit the opening. Periods of cleanup give the player room to appreciate the build.

## Animation and impact

Give movement and attacks distinct phases. An enemy should prepare, commit, connect, and recover. A player attack should feel immediate; its visible motion should communicate the attack's weight without hiding input latency.

| Event | Initial animation direction | Gameplay purpose |
|---|---|---|
| Basic arrow | Small bow draw/release, recoil, brief trail | Reliable rhythm and direction |
| Charged shot | Growing tension in pose and rune, then a fast release | Communicates thresholds without a giant popup |
| Knight shield block | Shield tilts into impact, sparks travel sideways | Shows that armor intercepted damage |
| Guard break | Shield cracks, silhouette opens for about .6s | Announces a punish opportunity |
| Phase movement | Short compression, two fading silhouettes, arrival ring | Makes position changes legible |
| Lancer charge | About .65s of lowered spear and marked lane | Gives a fair intercept or reposition window |
| Heavy impact | Local burst, brief pose hold, restrained camera impulse | Communicates weight without constant shaking |
| Death | Role-specific collapse or breakup; fragments fade quickly | Distinguishes a kill from a hit |
| New structure | Parts rise and lock into place over about .8s in the shop | Makes a purchase visible |
| Evolution | A short battlefield transformation preview, skippable | Celebrates a meaningful change |

Start with 8–12 pose samples per short action, rendered or interpolated according to the chosen asset route. A four-frame action with strong poses can be more effective than a long indistinct animation. Put most effort into anticipation, contact, and recoil.

Use micro hit-pause only on exceptional impacts, capped in frequency. Never let a multihit chain repeatedly freeze the battle. Add screen-shake and flash intensity controls, reduced motion, optional damage numbers, and a photosensitivity-friendly effect setting. Telegraphs retain full readability when decorative effects are disabled.

Audio should reinforce materials: metal-on-shield, a wooden bow transient, low fire pressure, an electric snap, hoofbeats, stone movement, and a clear boss warning. Limit simultaneous repeated sounds; cluster coin pickups into a satisfying short sequence. Mix time slow with a restrained low-pass effect and keep warning cues intelligible. Build music from quiet siege ambience, a combat pulse, and a boss layer.

## The new build system

Separate five things that are currently mixed together: the main weapon, weapon runes, fortress structures, the knight order, and rare relics.

The full-run loadout has **one main weapon, up to three weapon rune slots, four fortress build pads, one order doctrine, and one banner relic**. Unlock the slots gradually during a run. Gold pays for purchases and repairs; a boss seal enables a capstone. Profile progression unlocks alternative choices and cosmetics rather than permanent percentage advantages.

Main weapon ranks should form a clear arc: rank 1 establishes its behavior; rank 2 improves a meaningful limitation; rank 3 offers a branch. A capstone changes how it operates after an explicit boss milestone. Once chosen, the weapon remains available to upgrade. Preview the full path from the first purchase.

### Weapon families

| Family | Primary and alternate | Branch choice | Deliberate weakness |
|---|---|---|---|
| **Stormbow** — evolves the basic arrows | Precise repeated arrows; charged piercing shot | Forked Volley for width, or Railstring for narrow burst | Must aim well; shielded packs require an angle or charge |
| **Sunlance** — the sniper family | Telegraphable line shot; a focused weak-point charge | Prism Lance reflects once from a designated mirror pad, or Siege Lance specializes in guard breaks | Reload creates pressure from simultaneous approaches |
| **Rift Chakram** — the boomerang | Outbound/return blade; recall changes its return path | Orbit Guard circles a bastion, or Twin Return rewards two planned passes | Damage depends on travel and positioning |
| **Cinder Engine** — the flame cannon | Short cone with a heat meter; vent creates a brief push and cooling | Furnace Cone for sustained control, or Ember Mine for delayed traps | Short range and overheat; vulnerable to distant siege units |
| **Starfall Mortar** — the homing family | Marked delayed projectiles; alternate detonates the active volley | Comet Cluster controls groups, or Crown Breaker attacks exposed bosses | Warning-to-impact delay and weaker emergency interception |

A **Banner Spear** support/melee weapon is a later experiment: sweeping strikes near a bastion, planted banners, and commanded countercharges. It should earn its place in a prototype before joining the initial arsenal.

### Runes with actual decisions

| Rune | Proposed behavior | Cost, limit, or tradeoff |
|---|---|---|
| Chain Lightning | Hit up to three additional nearby targets, with decreasing damage | Shared per-attack hit set; cannot bounce indefinitely |
| Multishot | Fire a wider spread | Lower damage per extra projectile; bosses do not take full multiplicative overlap |
| Explosive Tips | Small impact splash | Splash uses its own reduced status-proc coefficient |
| Rapid Mechanism | Faster attack cycle | Explicit weapon-specific effect; it does not speed up an already instant beam's travel |
| Venom Seal | Apply a visible stackable poison | Fixed stack cap and duration; refresh rules are shown |
| Weak-point Sight | Improve manual weak-point rewards | Requires deliberate aim; ordinary hits remain useful |
| Ricochet Sigil | One bounce from an enemy or designated surface | Clear bounce rules and reduced secondary damage |
| Phase Momentum | Empower the first attack after moving bastions | Internal cooldown prevents input spam |
| Conductive Mark | Focus repeated hits into a brief vulnerability window | Helps sustained aim more than indiscriminate spreading |
| Fracture | Build stagger against guards and armored targets | Less direct health damage |
| Soul Thread | Generate a limited soul resource from eligible kills | Summoned enemies cannot create an infinite conversion economy |
| Mercy Bolt | A fraction of support-marked damage feeds a repair charge | Per-wave repair cap; no unlimited healing loop |

The initial release should implement a small compatible set thoroughly. The full vision can grow to 20–30 runes, with each adding a distinguishable role. Mark compatibility explicitly instead of letting attractive cards secretly do nothing.

### Fortress structures

Four pads make placement comprehensible. A structure sees a defined arc, with its range and obstruction previewed in the shop. Relocating during planning should be cheap enough to encourage learning.

| Structure | Function | Evolution possibility |
|---|---|---|
| Royal Ballista | Reliable single-target support | Pin a dangerous target, or fire through a prepared line |
| Tesla Pylon | Link two defended areas with controlled chain coverage | Conduit bridges between pads |
| Electric Moat | Slow and punish enemies near a chosen wall sector | Capacitor field that periodically staggers |
| Aegis Projector | Intercept projectiles in a directional arc | Radiant Aegis stores a capped amount of blocked energy |
| Chapel | Repair charges and rally support | Angelic sanctuary rewards timely commands |
| Ossuary | Limited souls and temporary spectral reinforcements | Bone artillery or elite conversion |
| Treasury Vault | A bounded income choice with an opportunity cost | Midas contracts fund a controlled mercenary surge |
| Engineer Workshop | Rebuild damage and operate a visible construction project | Central spire as a build commitment |

Fortifications should improve the actual fortress model and its durability. Repairs are a separate dependable service. Avoid forcing a player to wait for an HP card merely to remain in the run.

### Knight orders and commands

Retain autonomous basic targeting, then add one useful command. A cavalry player marks a charge lane. An Aegis order braces a chosen wall. A spectral order focuses a marked elite. A Midas order spends a visible, capped contract charge.

Commands let the player rescue poor positioning without requiring a strategy-game selection interface. Knights have a capacity limit and readable lifetimes. Higher ranks improve role and reliability rather than producing an unrestricted number of bodies.

### Eight signature combinations

| Combination | Visible result | Rule that keeps it understandable |
|---|---|---|
| **Storm Cavalry:** cavalry + conductive rune | Knights briefly connect into a moving lightning line | Each enemy is hit at most once per link pulse |
| **Angelic Knights:** cavalry + Aegis/chapel | Ivory banners, winglike shields, repair on a successful commanded engagement | Healing cap and cooldown per wave |
| **Midas Legion:** cavalry + treasury | Gold armor and a paid reinforcement charge | Income bonus is bounded; no multiplication by score combo |
| **Radiant Aegis:** shield + heat | Blocked shots charge a directed solar counterblast | Capped storage; no self-damage charging |
| **Graveglass:** necromancy + time slow | Eligible kills leave an echo that fights briefly after normal time resumes | Limited echoes; no echo-on-echo conversion |
| **Orbital Verdict:** Starfall + precision mark | A delayed lance lands on an exposed, marked target | Clear lock and delay, with a shared strike cooldown |
| **Dragonkin Lord:** necromancy + boss seal | Recruit a weakened spectral dragon through an execution opportunity | Major capstone commitment and companion capacity cost |
| **The Babel Engine:** workshop + electric network | Engineers build a central spire through visible stages | Construction competes with other spending and can be interrupted |

Move the current secret tower away from an unexplained requirement to skip upgrades for three turns. Offer a discoverable construction contract with a hint in the codex. Surprise should come from the result and the combination, not an opaque condition that encourages a player to avoid the shop.

### Six runs that should feel different

- **The Storm Marshal:** reposition to line up conductive marks, then command cavalry through them. Excellent at formations, demanding against isolated bosses.
- **The Sun Judge:** hold a precise angle, break a guard, and spend time energy on a weak-point window. Vulnerable to simultaneous swarms.
- **The Cinder Warden:** let enemies enter controlled moat sectors and alternate sustained fire with well-timed vents. Must answer distant siege units through positioning and support.
- **The Grave Regent:** choose which enemies are worth converting, bank limited souls, and commit a dragon capstone. Conversion is a tactical resource, not free extra income forever.
- **The Gilded Captain:** accept early combat weakness for a bounded economic advantage, then spend it on command bursts. A good run comes from timing purchases and contracts.
- **The Iron Architect:** arrange ballista sightlines, guard engineers, and complete the central spire. Strong preparation, weaker reaction when an approach changes.

## Balance: enjoyable excess inside clear limits

Let a completed build look extravagant. Keep its causes inspectable. A lightning chain, a turret, and a knight should each have a known damage source, cadence, eligible targets, and maximum number of secondary triggers.

Separate damage types from status effects. Start with a small vocabulary: direct damage, guard damage, burn, poison, slow, and stagger. Avoid a large resistance chart that obliges players to memorize elemental counters. Boss resistance to repeated crowd control should be visible and temporary; it should not make an entire build irrelevant.

Use five initial combat targets:

| Target | Initial intended outcome | How to assess it |
|---|---|---|
| Basic enemy | Roughly .4–.9s of purposeful early attacks | Player recognizes hits and can clear a small group |
| Armored enemy | Roughly 1.2–2.5s, substantially shorter after the correct response | Breaking or flanking armor feels worthwhile |
| Specialist | Enough time to read its role and respond before its major action | An attentive beginner can describe what happened |
| Elite | Roughly 4–8s of focused pressure plus its mechanic | Creates a priority without becoming a miniature health sponge |
| Boss | Roughly 60–90s with distinct opportunity windows | Fails through missed responses, not unexplained numerical collapse |

These are target bands for playtesting, not universal enemy stat formulas. Boss HP should follow measured expected build damage × vulnerable uptime × intended duration. Test weak, typical, and strong builds. Do not balance solely against a perfect-accuracy bot.

Replace universal exponential health growth with authored act budgets. Spend encounter difficulty on number, composition, approach, timing, and a small set of elite traits. Within an act, modest HP increases can preserve pacing; a new enemy behavior should create more interest than another large health multiplier.

Define proc rules early. Continuous beams and damage-over-time effects get a fixed tick cadence; they do not apply full on-hit effects every rendered frame. Secondary projectiles and lightning consume a per-attack budget. Multi-arrow damage is priced around realistic overlap. Life steal and castle healing have recoverable-HP budgets. Summoned enemies and converted allies have explicit reward eligibility.

For time slow, measure player influence per energy spent: interrupted threats, damage avoided, and productive attacks. It should be a tactical advantage for all weapons. Weapon identity, charge, reload, and energy behavior must agree between gameplay and tooltips.

## Economy and shop

Gold should support interesting purchases. Score should celebrate skill. Remove combo as a direct multiplier on all buying power; reward impressive play with score, visual rank, and perhaps a small explicitly capped wave bonus.

Start the economy prototype with these assumptions:

| Item | Initial hypothesis |
|---|---|
| Starting purse | 80 gold |
| Typical early-wave total income | 60–90 gold, including a predictable completion reward |
| Ordinary upgrade rank costs | Approximately 55 / 80 / 110, adjusted by actual benefit |
| Repair service | 25 gold for 20 fortress HP; always available, never offered at full HP |
| First reroll | 15 gold; second 30; at most two per visit |
| Boss reward | A clear gold award and a seal that enables an announced capstone choice |
| Respec | One partial-refund opportunity per act, available during planning |

Three offers are enough when their implications are clear. Guarantee an eligible continuation of the current build, a defensive/support option, and a wildcard. Add protection against repeatedly missing an announced evolution prerequisite. Explain locked recipes and show how close they are.

Keep offers stable after a purchase. Show exact before/after values, affected weapons or units, prerequisites, next rank, and capacity consequences. Keep repair and reroll outside the offer pool. Let the player inspect the next encounter beside the shop without covering cards.

Treasury becomes an investment with a visible return. An illustrative first rank might cost 70 gold and add 15% eligible income, capped at 15 per wave. At a 90-gold eligible wave, that returns 13.5 gold and takes about six waves to repay after whole-gold rounding. That is a meaningful early-run choice and a weak late-run purchase; the card should tell the player. Avoid a separate multiplicative Midas and combo layer on top.

Midas's dramatic payoffs should come from a spendable reinforcement contract or a capped bounty on a marked elite. Holding an enormous unused purse should not simultaneously maximize combat strength and future income. A risk/reward relic could deliberately reward saving, but it should occupy a valuable slot and have a stated ceiling.

Show a short wave ledger: completion award, enemy bounties, capped skill bonus, treasury benefit, repairs, and net change. This makes balancing and player understanding much easier.

## Enemy design: formations with answers

The existing roster is a strong starting list. Give each role a distinct question for the player.

| Enemy | New behavior | Player response |
|---|---|---|
| Squire | Advances in loose groups; a few raise ladders | Aim and prioritize the group nearing a weak sector |
| Shield Knight | Faces a formation's approach and covers units behind it | Change bastion, charge a guard break, or stagger the line |
| Lancer | Marks a straight lane, lowers its spear, and commits | Interrupt the preparation or intercept the lane |
| Pegasus | Flies over ground control and prepares a visible dive | Track the dive marker or use anti-air support |
| Cleric | Links to a small group; channels a clearly visible recovery pulse | Break the channel or eliminate the anchor |
| Jester | Leaves decoys and splits into fragile Pages on death | Read the real silhouette; use efficient area damage |
| Wizard | Places a summon sigil with a completion timer | Destroy the sigil or interrupt the caster |
| Rogue | Reveals through footprints, distortion, and a preparation tell | Spend attention or use a reveal tool before the strike |
| Siege Ram — new | Requires escorts and threatens a specific wall sector | Strip escorts, then expose the ram's weak point |
| Bell Herald — new | Changes the next formation while channeling | Disrupt it to prevent a harder combination |

Rogues are currently defined but absent from the ordinary wave selection. If reintroduced, they need detection cues and counterplay. Permanently invisible, broadly untargetable attackers would be a poor addition.

Build encounters from readable groups: a shield line protecting a Cleric; Lancers on one side while a Wizard summons on another; a flying diversion before a Ram reaches the gate. Avoid independently randomizing every enemy and hoping the mixture produces a good encounter.

Use a small set of elite modifiers with visible geometry: a plated helmet for armor, a banner for rallying, a cracked core for an explosive death. Do not allow arbitrary modifier stacks that remove all viable responses.

## Bosses worth learning

### Wave 5: the Prism Dragon

The dragon first lands on a ruined approach and illuminates a firing lane across the battlefield. Its opening patterns teach a breath cone and a sweeping pass, each with a substantial warning. The player can interrupt an exposed chest rune or shelter a threatened bastion with Aegis.

At roughly half health, it loses one armor plate and adds a second approach to its patterns. Destroying wing nodes changes the order of attacks rather than only subtracting health. After a committed breath, the chest opens for a satisfying damage window.

The finish is a short collapse into dark glass and a released light core. Award the first boss seal and show the player's available capstones immediately.

### Wave 10: the Procession Golem

Build on the existing absorption idea. A procession of small units visibly assembles its limbs. The player can kill or interrupt a carrier before it joins, producing a different weak point or reducing one attack's reach.

Give each limb a readable function: one arm slams a sector, one sweeps a lane, and the legs reposition its mass. The Golem opens a gathering channel to rebuild; the player chooses whether to stop it or exploit another exposed part.

Breaking an arm removes a specific attack for a meaningful period. Freed spectral figures scatter from the destroyed limb. The climax should visually reflect which parts the player dismantled, not just one generic HP bar reaching zero.

### Wave 15: the Hollow King

A new final boss acts as a rival commander. He signals a formation, fortifies an approach, and casts a dark version of a familiar defense. Each phase uses a small, learnable set of decrees. After the player defeats a decree's formation, the King becomes vulnerable.

For a late production version, he can react to the player's broad doctrine through one visible, predetermined variant. Do not let him secretly gain perfect counters to the current build. The final phase threatens multiple bastions while exposing his crown, inviting a last time-slow intervention and squad command.

## Run structure and replayability

Use three acts of five waves:

| Act | Environment and feeling | Mechanical purpose |
|---|---|---|
| I: The Broken Causeway | Storm-lit stone, intact banners, distant fires | Learn aiming, phasing, shields, and one build direction; Dragon at 5 |
| II: The Procession | Ash, ruined monuments, moving siege lights | Test combinations and construction; Golem at 10 |
| III: The Eclipse Court | Quiet black stone, eclipsed sky, hostile royal architecture | Test mastery under coordinated attacks; Hollow King at 15 |

Aim for ordinary waves around 35–50 seconds, bosses around 60–90, and brief untimed planning breaks. Twelve 45-second waves, three 75-second bosses, and fourteen 20-second shop visits total about 17.4 minutes before variations. Tune the actual run from observed sessions.

Each ordinary wave has a readable setup, pressure peak, and cleanup. Spawn formations over meaningful intervals. Prevent an offscreen straggler from turning completion into a hunt: show its direction and encourage it toward the fight. Bound summoned reinforcements so stalling cannot farm infinite gold.

After each act, offer one route choice with a visible tradeoff: an engineer rescue for construction help, a contested vault for gold, or a corrupted shrine for a risky relic. Begin with two or three authored event templates. A full branching world map is optional later scope.

Difficulty settings should change decision pressure and recovery opportunities: telegraph duration, simultaneous fronts, repair allowance, and encounter combinations. Show the differences. Keep permanent statistical progression out of the ordinary difficulty model so a fresh player can eventually win through learning.

Profile rewards include banner colors, alternate castle styles, weapon appearances, starting sidegrades, enemy lore, and discovered recipes. Provide a visible collection book and explicit unlock goals. Optional endless mode adds named mutators after victory; it should announce when standard-run balance ends.

A seeded challenge mode can come later. Freeze rules and content versions for comparisons. A browser-stored score is convenient personal progress; a trustworthy global leaderboard requires a separate design and service.

## Onboarding, clarity, and accessibility

The first minute should be playable instruction. Start with a quiet approach and one basic enemy. Show primary fire only until it is used. Then introduce an armored enemy that benefits from repositioning, followed by a clearly marked attack inviting time slow. Allow returning players to skip the tutorial.

Provide a short optional training yard with a shield dummy, a moving target, and instant build reset. When a player inspects an upgrade, allow a ten-second sandbox preview that pauses the run and spends no resources.

The shop should answer three questions quickly: what does this do now, what can it become, and why might it help against the next wave? Enemy forecasts should include a role and a response, not just a name and count.

At defeat, show the last meaningful threat, the sector that failed, a short damage-source breakdown, and one useful suggestion derived from the encounter. Avoid blaming the player with generic messages. The results screen shows the complete build, signature combination, bosses defeated, and a one-click retry.

Include scalable UI, keyboard navigation for menus, large touch targets, color-independent telegraphs, configurable shake/flash, reduced motion, separate audio levels, and persistent settings. Keep reset-save behavior away from the ordinary combat HUD; give destructive reset an explicit settings flow.

## Technical design that supports the overhaul

The recommended stack is TypeScript, Vite, Phaser, and Blender asset generation. Use a small simulation layer with explicit combat, status, wave, economy, and squad ownership. Keep semantic HTML controls for settings and shop menus. The [architecture proposal](ARCHITECTURE.md) explains the alternatives, migration, static deployment, and the working Blender proof.

Seed gameplay randomness and isolate it from visual randomness. A balance harness should replay the same wave with several builds and input patterns. It should record damage by source, damage taken by sector, status uptime, gold earned/spent, upgrade offers, and event timing. These measurements guide tuning; they do not replace observation of real players.

Proposed performance targets are 60 fps on an agreed ordinary desktop and at least 30 fps on an agreed mobile baseline. Choose and record actual test devices before treating these as acceptance gates. Begin stress testing near 100 enemies, 250 projectiles, and a capped decorative particle pool; adjust visual density from measurements.

Target a small initial download, then load later-act artwork when needed. Atlas size matters as much as compressed download size: a 2048 × 2048 RGBA image is 16 MiB when decoded before mipmaps and other overhead. Eight directions multiplied by many clips and ranks can grow quickly. Reuse materials, rigs, silhouettes, and recolors intelligently; do not render a complete independent atlas for every minor stat rank.

Test a production build at `/NeonKnights/`, including reload, asset URLs, font fallback, audio unlock, pause/focus behavior, and save migration. The site can remain on GitHub Pages.

## Delivery milestones

| Milestone | Concrete output | Acceptance gate |
|---|---|---|
| **M0: trustworthy foundation** | Modular state/data/combat boundaries; corrected tutorial, weapon leveling, charge/source behavior, boss schedule, pause, and fresh-run state | Focused rule tests and reproducible browser checks cover the confirmed defects |
| **M1: first complete siege** | Five waves; Stormbow, Sunlance, and Cinder Engine; three enemy roles plus Dragon; compact shop; one complete Blender character pipeline | A new player can start, understand the controls, make a build choice, and finish or explain a loss |
| **M2: distinctive builds** | All five weapon families; four initial structures; two orders; four signature combinations | Each build has a demonstrable strength, weakness, and readable battlefield identity |
| **M3: full run** | Three acts; Golem and Hollow King; events; remaining core structures and combinations | Multiple viable builds complete a run, with authored difficulty and reliable saves |
| **M4: release polish** | Complete animation/audio pass; touch controls; accessibility; performance; onboarding and results | Device targets, deployment checks, and representative playtests pass |

M1 is the first build worth judging as the new Neon Knights. Art production can progress through source assets while the simulation is extracted, but expanding the full asset roster should wait until camera, scale, and silhouettes are settled.

The review has already produced the audit, browser evidence, tool installation, architecture recommendation, and a working Blender asset proof. It has not yet migrated the live game or implemented M0/M1.

## Ideas to keep in reserve

These are worthwhile candidates after the core loop works:

- Weather that visibly changes one rule for a whole encounter, such as rain extending electric links.
- A fortress spirit whose voice and appearance change with the dominant doctrine.
- A rescued engineer who permanently changes one structure option for the remainder of the run.
- A boss trophy that physically occupies a build pad and grants an unusual effect.
- Replays of the final ten seconds, using deterministic events and inputs.
- Cosmetic banners earned by completing a run with a difficult combination.
- A workshop mode for constructing an encounter and sharing its seed/configuration.
- An optional short challenge where a damaged fortress must survive three authored waves.
- A mirrored “enemy commander” encounter that uses familiar mechanics with clearly hostile shapes.
- A final-victory fortress flyover rendered from the player's assembled build, if the chosen asset route supports it cheaply.

Defer multiplayer, procedural world generation, extensive crafting currencies, unrestricted free camera, realistic destruction, and hundreds of items. Each could consume substantial development effort before the first siege becomes more enjoyable. Revisit one at a time if it solves an observed need.

## Questions the prototype must answer

**Does deliberate bastion movement improve play?** Compare four-anchor phasing with the current pointer orbit. Observe whether players understand why their position matters and whether aiming remains comfortable.

**Do automatic defenses create choices or erase them?** Compare active damage, threat interruption, and moments when a human command changes the result. A visually strong support build should still ask for intervention.

**Can a player explain their build?** After a short run, ask what their weapon does, which combination they were pursuing, and what threat concerned them. Misunderstanding is a design signal.

**Does the art read at battle scale?** Compare silhouettes and telegraphs with effects disabled, at the smallest supported display, and in grayscale. Test the Blender blockout in the actual camera before producing many assets.

**Are losses informative?** A player should recognize a missed warning, neglected side, or questionable purchase. If the dominant explanation is “everything suddenly had too much health,” revisit encounter and damage budgets.

The next implementation should settle those questions through M0 and the first complete siege. That gives the larger overhaul a reliable creative and technical foundation.

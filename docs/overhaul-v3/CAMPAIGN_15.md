# The King's Battlements: fifteen levels
**Design revision: 6 September 2026.** This is the full campaign specification for the castle preview at `/NeonKnights/next/`. It supersedes the campaign, controls, roster and progression proposals in [DESIGN.md](DESIGN.md). [UPGRADE_PATHS.md](UPGRADE_PATHS.md) specifies every launch upgrade. [campaign-15.json](campaign-15.json) contains the authored encounter packets and economy worksheet.

**Delivery status:** the playable preview still has three encounters. This document designs the expansion; it does not mark these fifteen encounters or the new assets as implemented. The accompanying castle assault AI improvement is implemented and covered separately in [CASTLE_PREVIEW.md](CASTLE_PREVIEW.md).

## 1. The campaign promise
Build a small outpost into one connected Crownspire while a recruited company holds the approaches. The King moves around the battlements, fires continuously, and gets to the threatened wall in time to guard it. A successful defense gives a short burst of rewards, a visible construction or combat upgrade, and a new assault to try it against.

The target is **20–25 minutes including planning**, with about **14 minutes of authored combat** at the nominal clear times below. Fast builds can clear earlier; a struggling cleanup can take longer. These are tuning targets, not measured results.

Keep these rules throughout:
- One starting knight, Aldren. Recruiting requires a built Tavern. Maximum three active companions; six named recruits total.
- Four attached inner wings and four cardinal defense mounts. Every wing grows the same castle; there is no separately purchased central keep.
- Two royal weapons, two specializations each. Automatic firing never requires clicking or holding a charge.
- No King health, wounds, hunger, durability, treatment purchases or permanent stat grind. Any destroyed wall section loses the encounter. All recruited knights fully recover after victory.
- E guards the occupied wall section. Q swaps weapons. Space uses Royal Decree. No additional combat action bar.
- One currency, crowns. Service experience is earned automatically. Relic rewards are choices, not another spendable currency.
- The council opens on the next useful decision. Detail stays in inspect panels, away from combat.

## 2. Three acts, one changing place
| Act | Levels | Castle and atmosphere | Main question |
| --- | --- | --- | --- |
| I — Raise the banners | 1–5 | Morning river valley, timber quarters, practical stone additions, approaching siege crews | Can I position the King and company to stop a clear threat? |
| II — Fire on the river | 6–10 | Rain clearing into dusk, joined galleries, working forges, damaged causeways, Dragon shadows only from level 9 | Which threat gets my attention while the company holds the other front? |
| III — The stolen crown | 11–15 | Evening braziers, complete tower silhouettes, distant enemy standards, dawn after victory | Can this specialized castle answer a sequence of familiar threats? |

Use the same navigable arena. Change dressing, light and distant silhouettes between levels; preserve north, approach geometry and threat colors. Rain and embers are sparse optional ambient particles. The Dragon does not appear in the early acts as an enemy.

## 3. Exact encounter schedule
Each cell lists **packet trigger, approach and unit count**. N/E/S/W are visible approach sectors. R = Raider, B = Bulwark, A = Arbalist, S = Sapper, H = Hexcaster, F = Banneret, M = Ram, V = Reaver. HP triggers refer to the named boss.

Time is nominal total combat duration; cap includes the boss but excludes the King and companions. Rewards are **clear purse + fixed enemy bounties**, paid once on victory. The finale's 44 crowns are recorded in the result only; there is no post-victory spending requirement.

| Level | Time / live cap | Authored packets | Crowns |
| --- | --- | --- | --- |
| 1. The First Watch | 32s / 5 | 0s N: 4R; 10s E: 4R; 20s N: 4R | 140 + 24 |
| 2. Shields on the Causeway | 36s / 6 | 0s E: 4R; 10s E: 1B + 2R; 22s N: 1B + 2R | 160 + 24 |
| 3. The Far Bank | 40s / 7 | 0s N: 3R + 1A; 12s E: 1B + 2R + 1A; 24s N: 1B + 1R + 1A | 180 + 29 |
| 4. Sparks at the Gate | 44s / 7 | 0s W: 3R + 1S; 12s W: 1B + 1A + 2S; 24s S: 3R + 1B + 1A + 1S | 210 + 38 |
| 5. The Procession Golem | 65s / 5 | 0s N: 2R + 1B; 65% HP N: 2R + 1B; 35% HP E: 2S | 300 + 22 |
| 6. Hexfall | 44s / 8 | 0s E: 4R + 1H; 14s N: 2R + 1B + 1A; 28s E: 2R + 1B + 1H; 38s S: 1H + 1A | 220 + 42 |
| 7. Banners in the Rain | 48s / 8 | 0s W: 3R + 1B + 1F; 14s S: 3R + 2A; 28s W: 2R + 2B + 1F; 38s N: 1A | 240 + 47 |
| 8. The Iron Road | 52s / 9 | 0s N: 1M + 2B; 12s E: 3R + 2S + 1A; 26s N: 2B; 40s S: 3R + 2S + 1A | 260 + 56 |
| 9. Hunters at Dusk | 54s / 9 | 0s E: 3R + 2V; 12s S: 1H + 1B + 2R; 26s E: 2V + 1F + 2R; 40s W: 2H + 1B + 1R | 280 + 57 |
| 10. Emberwing | 80s / 5 | 0s W: 2R + 1H; 65% HP S: 2V + 1B; 35% HP E: 1H + 2R | 400 + 28 |
| 11. Broken Standards | 56s / 10 | 0s N: 3R + 2B + 1F; 12s S: 3S + 2A; 26s E: 3R + 2B + 1F; 42s N: 2R + 1S + 2A | 300 + 66 |
| 12. The Quiet Knives | 58s / 10 | 0s W: 2R + 2V + 1H; 12s E: 2V + 2A + 1H; 28s S: 2R + 2V + 1H; 44s W: 2R + 2A + 1H | 320 + 64 |
| 13. The Siege Train | 62s / 11 | 0s N: 1M + 2B; 12s E: 4R + 2A + 2S; 28s S: 1M + 2B; 44s W: 4R + 2A + 2S | 340 + 76 |
| 14. The Last Bell | 68s / 11 | 0s E: 3R + 1B + 1H + 1F; 12s N: 2V + 2A + 2S; 24s W: 3R + 2B + 1H + 1F; 36s S: 2V + 2A + 2S; 48s E: 4R + 1B + 1H | 420 + 98 |
| 15. The Hollow King | 100s / 5 | 0s N: 3R + 1B; 75% HP E: 2V + 1H; 50% HP W: 1F + 2B; 25% HP S: 2S + 1A | 0 + 44 |

A packet can contain more units than its live cap. It queues individuals with a minimum 0.45s entry spacing; it never places the entire packet inside the cap at once. The boss has a reserved slot. Escort packets in boss encounters permit at most four living escorts.

### What each level changes
**1. The First Watch.** Single-front defense; learn movement and automatic hits. Tavern and Elin available from the opening council.

**2. Shields on the Causeway.** A shield line followed by a flank; swap to Sunlance. Corvin becomes recruitable.

**3. The Far Bank.** Ranged fire behind a screen; move to expose the back line. Iona joins the recruit pool; weapon rank II opens.

**4. Sparks at the Gate.** Kill the visible fuse carrier or guard its wall impact. Stonehold II opens before the first boss.

**5. The Procession Golem.** Company stomp, then a committed wall blow; learn the guard counter. First relic; building rank II, knight rank II, Forge and War Room open.

**6. Hexfall.** Ground hexes encourage the company to reposition. Mira and Lysa join the recruit pool.

**7. Banners in the Rain.** Break a planted banner before its formation reaches the wall. Storm Spire and Aegis rank II are useful pivots.

**8. The Iron Road.** Escort screens protect a slow ram; choose its flank or its escorts. Cinder Mortar becomes available before this level.

**9. Hunters at Dusk.** Reavers hunt the ranged knights while a second front advances. Crownspire III opens before Emberwing.

**10. Emberwing.** Dragon hunts the company, then burns a named wall section. Second relic; all rank III purchases open.

**11. Broken Standards.** A Captain-led shield line draws attention away from sappers. First final weapon/defense specializations.

**12. The Quiet Knives.** A Hex Prelate holds a firing position behind hunting pairs. Final knight promotions and a viable reserve substitution.

**13. The Siege Train.** Two timed ram arrivals on different sides, separated by 28 seconds. Ascend one equipped relic for free.

**14. The Last Bell.** A five-packet relay around the castle; the developed build gets its showcase. Largest non-boss purse funds the final council.

**15. The Hollow King.** The Hollow King combines formations, company pressure and wall decrees. Campaign victory, castle portrait and a replay seed.

Levels 11 and 12 each replace one ordinary unit with its elite variant (the first Bulwark at 11; the first Hexcaster at 12). Level 14 replaces the first Reaver with a Champion. Replacement does not add a unit or a bounty. The remaining late levels remix known roles instead of introducing more icons and tutorials.

## 4. Encounter director and victory rules
**Staging.** Each approach sounds one horn and shows two distant standards 1.8s before its first unit enters. Spawn at radius 21–23, outside weapon reach and away from the company. Entrants fan toward reserved attack positions. Never spawn on a knight, inside a wall, or behind an opaque foreground object.

**Tempo.** The JSON times are normal packet eligibility times, not obligations to stand idle. Once a packet has fully entered and only one of its enemies remains, the next timed packet can move forward to four seconds after that packet's first entry. Give its full 1.8s scout cue. Never advance a boss HP packet this way. If the cap is full, wait; do not increase HP, teleport a packet, or erase a warning. Do not queue more than one newly eligible packet per simulation step.

**Victory.** All authored packets have entered, all enemies and the boss are defeated, and damaging hazards have expired. When a boss dies, discard its unspawned HP packets, let present escorts flee without further attacks, and resolve their fixed bounties as part of the clear reward. Scheduled bounties are therefore fixed for the economy worksheet. Bosses themselves have no extra bounty beyond their clear purse. Summoned banners, detached limbs and recreated effects never award money.

**Pressure.** At most two fronts are actively fighting in act I, three from act II. The five directions in level 14 form a relay: a new front waits if three fronts remain engaged. The final boss uses one main formation and, at most, one side skirmish.

**Damage fairness.** Only one major wall attack may be warning or active at a time. The director grants a token before its windup, then releases it after impact. Successive major wall impacts are at least 5.5s apart, preserving the 4.5s Guard cooldown plus time to move. A waiting ram holds a loaded pose; a waiting boss repositions or fights knights. Ordinary melee swings and missiles continue. This scheduling is visible behavior, independent of whether Guard is currently available.

**Difficulty.** Normal uses these values. Veteran uses +15% ordinary HP, +10% ordinary damage and +20% boss HP; it changes the order of already taught side packets using the run seed. Warning durations, actor caps, guard spacing, crown income and upgrade gates stay the same. No hidden adaptation to a player's purchased build.

## 5. Enemy roster and assault behavior
Values below are act I baselines. Act II ordinary units use 1.15× HP and 1.10× damage; act III uses 1.35× HP and 1.20× damage. Round final damage once at contact. Boss stats are explicit and do not receive act multipliers. Movement, attack cadence and telegraph windows do not accelerate by act.

| Enemy / first level | HP / damage / speed | Job and committed attack | Clear answer |
| --- | --- | --- | --- |
| Ash Raider / 1 | 94 / 13 / 2.25 | Takes a melee wall slot. Engages a reachable knight within 4m. 0.66s contact, 1.5s action, 1s recovery cooldown | Rapid bow fire, pushback, Warden interception |
| Iron Bulwark / 2 | 175 / 23 / 1.25 | Advances with its shield toward its assigned wall. Diverts only for a knight within 2.8m. Shield reduces frontal damage 70%; 0.5s bash contact | Sunlance, flank shots, pierce; shield does not rotate during a bash |
| Ash Arbalist / 3 | 85 / 18 / 1.5 | Uses a rear firing slot at about 13m. Shoots a reachable knight or its wall, with 1s draw and 1.8s reload. Moves at most once per reload | Remove the screen and shoot the exposed bowman; no chasing through the castle |
| Cinder Sapper / 4 | 65 / 50 wall / 2.8 | Ignores distant knights; carries a visible barrel to its slot and lights a 2.2s fuse. One explosion consumes the sapper. Killing it before contact extinguishes the fuse | Kill the carrier or guard the single marked wall; the dropped barrel does not explode |
| Hexcaster / 6 | 95 / 19 bolt, 16 hex / 1.65 | Plants in the rear row. Every third cast creates a 1.8m ground hex at a locked knight position; 1.4s warning, one impact. No overlapping personal hexes | Knights dodge automatically; the King or Marksman removes the stationary caster |
| Black Banneret / 7 | 150 / 12 / 1.5 | Stops 12m from the castle, plants one flag and grants +20% attack damage to allies within 5m. Does not stack. Repositions only when no formation remains | Shoot the visible flag bearer; killing it immediately ends the bonus |
| Iron Ram / 8 | 420 / 65 wall / 0.9 | A single crew-and-engine actor. Reserves a broad contact slot. 2.1s windup, 5s cycle; ignores ordinary taunts, yields to the major-wall-attack token | Kill from the exposed flank, pierce the escorts, or time Guard. Destruction leaves a harmless wreck |
| Dusk Reaver / 9 | 115 / 22 / 3.2 | Prefers reachable ranged companions, then other knights. A 0.65s tell locks a lunge of at most 4.5m; 2.2s cycle. Returns to its wall when pursuit expires | Warden interception, knockback, a ranged knight's automatic dodge; a missed lunge cannot hit the wall instead |

**Elite variations, three total.** Captain (11) is a Bulwark with 1.7× role HP and one 35-point shield grant to nearby entrants; 1.4s banner lift announces it. Prelate (12) is a Hexcaster with 1.7× role HP whose cast alternates two separated ground hexes, never simultaneous; the second cannot start before the first expires. Champion (14) is a Reaver with 1.8× role HP and one visible backstep before its ordinary lunge; it gets no extra attack or invulnerable phase. Elite damage stays at the role's act value. Each uses distinctive equipment and a short nameplate; no additional boss bar.

### AI rules shared by every assault
1. **Assign a side and a contact position once.** Surviving diversions, target death and pushback do not change the chosen wall. Casters and archers use a rear row. Rams reserve three adjacent melee positions, and a second ram queues behind its approach.
2. **Choose reachable targets deliberately.** Evaluate every 0.25–0.35s with staggered timers, not every render frame. Retain a living target within the larger disengagement radius. Ignore knights across the curtain. A 7m pursuit leash returns ordinary enemies to their assault position.
3. **Commit.** Plant feet, turn toward the selected target, then begin the authored clip. Lock the target and facing through contact and recovery. A dodged attack can miss. A dead target releases the next decision; it never redirects a swing already underway.
4. **Make space.** Moving units yield to planted attackers. Collision separation keeps feet outside the wall. Avoid a frame-by-frame push toward a wall point that the navigation system considers blocked.
5. **Resume the job.** After recovery, reacquire an interceptor or return to the reserved position and attack the same wall. If no route progresses for 1.2s, retry one adjacent free slot on that same side; do not randomly orbit the castle.
6. **Signal intent through bodies.** Raiders raise axes at the wall, Bulwarks lower shoulders, ranged troops load in place, and ram crews brace. A small targeted-wall highlight is enough; no AI state labels appear in normal play.

Rules 1–4 and the ordinary return behavior are now implemented for the current Raider, Bulwark and Hexcaster. Ram reservations, the authored director, new roles and the stuck-route retry are expansion work.

## 6. The three bosses
All bosses favor the company during repositioning and then commit to a named wall. They never target or damage the King. Warnings share the simulation's exact footprint. Only the currently dangerous attack has a filled footprint; the next intention uses body motion and sound.

Normal Guard: 1.5s duration, 4.5s cooldown, 80% wall damage reduction. Its first 0.4s blocks 100%. A perfect guard on a boss wall strike creates **2.2s of stagger and +30% incoming boss damage**. Ordinary attacks cannot cancel a committed boss attack. Decree can clear escorts and build pressure without erasing a boss pattern.

If all companions are down, replace company attacks with repositioning and a slower wall pattern that still obeys the 5.5s spacing. The fight remains recoverable through the King's damage and Guard. No boss heals because the company fell.

### Level 5 — The Procession Golem
**Role:** teach that a siege attack has weight, a clear destination and a counter. **Normal HP: 1,900.** Walks in from the north at 6s; a 2.5s entrance is the only entrance protection. Escorts have already shown its approach.

| Pattern | Preparation / contact | Consequence and response |
| --- | --- | --- |
| Company stomp | Raises its nearest foot for 1.1s; 3m circle, ground only | 24 damage and a short push to knights. The company steps out; the King keeps firing |
| Mason's fist | Walks to a valid wall contact, draws the fist back for 2s, then strikes | 60 damage to one wall. Guard its contact; the hand physically hits the marked masonry |
| Quarry shot | Plants both feet and loads its throwing arm; 2.4s from tell to boulder impact | 70 damage to one named wall. A visible arcing boulder arrives exactly with the impact marker |
| Broken-arm shoulder | Used after the throwing arm breaks; 2.2s preparation | 45 wall damage with longer recovery; the missing arm remains absent |

Pattern order: stomp → fist → stomp → quarry shot. At 50% HP a cracked throwing-arm joint opens during each recovery. Deal 240 damage during these exposed windows, or perfectly guard Quarry Shot once while the joint is open, to detach the arm. Arm damage also reduces the main HP; it is not a second health sponge. Breaking it removes Quarry Shot and adds 1s to recovery. The boss can be defeated without breaking the arm.

The exposed joint is automatically the King's preferred boss aim point when he has a clear shot from that side. No new precision-aim button or permanent sub-target HUD. Defeat collapses the Golem outward, with one bounded debris burst. First relic choice follows the victory.

### Level 10 — Emberwing
**Role:** protect the company, then read which wall will burn. **Normal HP: 4,200.** Descends at 8s with a 3s entrance. Its shadow arrives before its body. Circles between valid outer perches; it never clips through the castle.

| Pattern | Preparation / contact | Consequence and response |
| --- | --- | --- |
| Hunting rake | Tracks a living knight, locks a 3.1m-wide ground lane after a 1.15s tell | 26 damage, one push; affects knights only. No rotation or retargeting after commitment |
| Wall breath | Turns its chest toward one wall; 2.25s inhale, 0.6s exhale | 76 wall damage. The cone ends at that wall; the opposite side is outside the footprint |
| Tail clearance | Hips and tail pull back for 1.25s; 7.5m outer crescent | 24 knight damage and displacement; the Dragon's body shows the safe shoulder |
| Scorched perch | Only below half HP, after a rake; a 2m scorch patch remains for 2s | 6 damage each second to knights still inside. Maximum one patch, no wall damage |

Order with living knights: rake → breath → tail → breath. Each contact has at least 0.85s recovery. Below 50% HP the damaged wing changes its circling direction and ordinary repositioning shortens by 0.5s; breath damage becomes 92. The warning and Guard spacing do not shorten. The throat darkens after firing, and a perfect wall guard knocks its head back into the exposed pose. No compulsory long flight immunity.

### Level 15 — The Hollow King
**Role:** test the player's finished build through readable command sequences. **Normal HP: 6,200.** Arrives after the opening shield packet, at 8s. Carries a sword and a stolen crown standard; moves on the outside approaches.

| Pattern | Preparation / contact | Consequence and response |
| --- | --- | --- |
| Duel challenge | Faces a reachable companion, lifts the sword for 1.2s, then sweeps a 3m arc | 30 knight damage. A committed miss stays a miss; the boss recovers for 1s |
| Black standard | Plants one 180-HP banner 11m from its chosen wall | Nearby escorts receive 20% damage reduction. Destroying the banner opens the crown for 2s; banner damage gives no bounty |
| Stolen decree | Points the sword at a named wall; four spectral lances line up for a 2.4s tell | One combined 85-damage wall impact, counted once. Guard the wall; the lances are VFX for one hazard, not four entities |
| Crownfall | Final phase only; 2.6s tell, crown rises over one wall | 100 wall damage. This replaces every second Stolen Decree; it does not overlap another wall attack |

Phases are visible stance changes at 75%, 50% and 25% HP, with the finite escort packets in the schedule. No healing, invulnerability gate or newly randomized resistance. First phase alternates duel and decree. Second adds the banner, with at most one alive. Third changes approach after each recovery. Last phase alternates duel and Crownfall/decree, leaving familiar Guard windows.

A perfect wall guard or destroyed banner exposes the crown. The openings refresh to the longer duration; they do not stack or trigger each other. The boss has 3s stagger immunity after an opening ends, shown by a raised shield pose. Defeating him ends the siege; unspawned formations do not turn the result into another wave.

## 7. Economy and campaign rhythm
Start with **360 crowns**. The opening purchase of Tavern (120), Elin (140) and Ballista (100) is affordable, but optional. A player can keep Aldren alone and invest in defenses.

The authored schedule awards **4,801 spendable crowns including the starting balance before the finale**, plus 44 in the final result. Bounties are fixed by role: Raider 2, Bulwark 4, Arbalist 3, Sapper 3, Hexcaster 4, Banneret 5, Ram 10, Reaver 4. Kill chains affect score and Decree charge, so skillful play feels good without making the entire upgrade budget depend on perfect chains.

The [worksheet](campaign-15.json) contains one legal purchase route. It reserves **385 crowns for repairs**, fields three promoted knights, obtains all four inner wings, all four outer mounts, a rank III bow, a rank III Sanctuary, two upgraded support systems and two runes. It leaves **56 crowns before level 15**. The Sanctuary reaches its tallest structural tier, visibly completing one side of the main tower. This is an illustrative spending route, not a required loadout or combat-balance proof. Full maximization of every system is deliberately unaffordable.

- Wall repair costs ceil(total missing wall HP / 6); one button repairs all four.
- Defense repair costs ceil(missing HP / 4). Upgrades add only the increase in maximum HP, preserving existing damage.
- Salvage returns 70% of invested crowns. Relocation, equipment transfers, talent changes and unlocked specializations are free during planning.
- Earn +2 service XP for each active knight and +1 for each recruited reserve on victory. Downed active knights earn their service XP too. A new recruit joins with min(16, 2 × completed levels) service XP, making late substitutions affordable in time.
- Defeat restores the planning checkpoint, including the crowns and loadout spent before that attempt. No reward farming from abandoned or failed encounters.
- Offer stock persists during each council visit. Six item cards: three useful runes, three useful gear items. Buying one leaves the others unchanged. Whole-stock rerolls cost 35, then 50, then 65; reset that escalation each council. Core buildings, promotions and weapon ranks are always in their catalogue.
- Planning targets 15–30s normally, 45–60s after a boss. The result screen shows crowns, one short performance highlight and the next unlock. Full statistics are expandable.
- A 5s kill chain uses three readable thresholds (3/6/10): each reached threshold grants 4/6/8 Decree charge once per chain. Extra chain kills add score, not cascading VFX. No chain-triggered secondary attack can trigger another chain reward.

## 8. Presentation and performance acceptance
The campaign grows variety through jobs, formations and machinery, with a stable actor budget. The current seven-actor desktop fixture should remain near its measured 16.7ms median / 16.8ms p95; that existing fixture is not evidence for the unimplemented late levels.

| Resource | Campaign contract |
| --- | --- |
| Active actors | Maximum 11 enemies + King + 3 companions; boss encounters maximum boss + 4 escorts |
| Major warnings | One wall hazard and at most one separate company hazard; two ground hexes may exist only if their active windows are separated |
| Projectiles | Pool of 64 visible projectiles; reserve hostile projectile slots so effect overflow cannot erase a damaging shot |
| Debris | 24 fragments shared by all walls; 0.8s fall/fade; persistent damage uses cached masonry geometry |
| Corpses | At most six ordinary corpses; fade oldest after 1.5s when crowded. Boss death is one authored animation |
| Characters | Reuse compatible batched body materials, retain independent skeletons, use lower-detail distant variants; no material cloning per hit |
| Lighting | Cached scenery shadows; moving contact shadows in one batch. Wall/tier changes explicitly invalidate the cache |
| AI | Staggered decisions at roughly 3–4Hz; movement and collision at the fixed simulation step. No scene-tree traversal for targeting |
| Castle life | Workers, tavern doors, banners and forge motion are building animations or instanced decoration, not extra combat actors |
| HUD | Four compact wall bars, one boss bar, three companion portraits, current weapon, Guard and Decree. No King health or floating explanations |
| Accessibility | Shape plus color for threats; opacity/reduced-motion options preserve hazard boundaries and countdown. Touch Guard is as direct as E |

Worst-case acceptance is a rank III castle with three knights, eleven mixed invaders, four firing defenses, wall damage and two permitted warnings. Profile at 1600×1000 on the existing desktop and on a specified mid-range phone. Target 60fps desktop and stable 30fps on that phone; record the actual device and p95, including the build/repair transition. New content does not pass solely because the quieter fixture still passes.

## 9. Build-out and acceptance
1. **Campaign rules and act I:** versioned campaign data, packet director, level save migration, fixed bounty ledger, upgrade gates, Arbalist and Sapper, Golem rig and physical attacks. Make levels 1–5 playable end to end.
2. **Company and castle breadth:** Lancer and Chanter, six recruits, Forge/War Room, the fourth defense, all rank II machinery, free talent/specialization changes. Verify the first relic and three distinct spending routes.
3. **Act II:** Banneret, Ram, Reaver, authored Hexcaster cadence, levels 6–10 and the expanded Dragon. Verify every boss wall pattern both landing and being guarded.
4. **Final act:** levels 11–15, three elite equipment variants, Hollow King, rank III machinery, second relic and level-13 ascension. Ship complete final paths together so the late councils have worthwhile purchases.
5. **Balance and presentation:** normal reaction delays, missed guards, one downed companion, sparse construction, active King versus stationary King, melee-heavy versus ranged-heavy company, at least three viable final builds. Time each level and each council. Update the initial stats using those observations.

Save the full campaign as a new schema/namespace. Offer an explicit fresh campaign when replacing the three-watch preview; never interpret preview encounter index 2 as the full campaign's third level or silently grant early max ranks from preview tuning. Keep the old preview save for recovery. Do not overwrite the root v2 campaign.

**Content asset completion:** each new enemy needs a distinct silhouette, an identifiable weapon, approach/idle/committed attack/hit/death clips and a tested contact timestamp. Each new boss needs its own rig and phase changes. Each wing and defense needs three structural models that read with glow disabled. This specification does not license filling the roster with placeholder creatures.

Run `npx tsx tools/review/check-campaign-design.ts` to verify the schedule and arithmetic. That check proves the design data is consistent; actual playable campaign acceptance still requires the work above.

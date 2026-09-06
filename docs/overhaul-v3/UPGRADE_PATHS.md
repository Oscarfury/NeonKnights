# Complete upgrade paths
**Campaign design, 6 September 2026.** Companion specification to [CAMPAIGN_15.md](CAMPAIGN_15.md). Numbers are initial tuning values for the fifteen-level expansion. They are not a claim that these paths are already in the three-watch preview.

The complete launch set is **two royal weapons, four knight classes, six named knights, four castle wings, four defensive buildings, six runes, eight gear items and six relics**. Ordinary equipment has one clear effect. New purchases change a job, a silhouette or a useful combat behavior; there are no randomized affix ladders.

## 1. Unlock calendar and common rules
“After level” means its victory council, before the following level begins. Everything can be inspected before it unlocks.

| After level | Opens |
| --- | --- |
| Start | Both rank I weapons; Aldren; Tavern, Sanctuary, Ballista, Storm Spire and Aegis rank I; Elin with Tavern |
| 2 | Corvin recruitment |
| 3 | Iona recruitment; both weapon rank II choices; Anchor rune |
| 4 | Stonehold wall tier II |
| 5 | First relic slot/cache; building rank II; knight rank II; Forge and War Room rank I; Forked Light and specialist gear |
| 6 | Mira and Lysa recruitment |
| 7 | Cinder Mortar rank I and II |
| 9 | Crownspire wall tier III |
| 10 | Second relic slot/cache; all weapon, building and knight rank III paths; Afterglow rune and Return Sigil |
| 13 | Free ascension of one equipped relic |
| 14 | Final council; all unlocked purchases remain available |
| 15 | Victory and replay; no new combat system arrives after the final fight |

Building rank II requires Stonehold and level 5 cleared; rank III requires Crownspire and level 10 cleared. Weapons use the level gates alone. Knight promotions use the level gate and service XP below; they do not require upgrading the Tavern.

Costs shown as **I / II / III are incremental purchases**, not three alternative total prices. A rank III Ballista costs 100 + 160 + 240 = 500. Purchasing a rank III building outright pays all missing ranks and checks every prerequisite. Upgrading does not repair prior damage for free.

Unlocked weapon and defense specializations can be changed freely at the council. Knight talents can be reset freely. No fee, resource or cooldown applies to a planning respec. A relic conversion can override a normal specialization temporarily; the saved choice returns when the relic is unequipped.

## 2. One castle, assembled from four wings
The four inner slots accept **one of each wing**: Tavern, Sanctuary, Forge, War Room. Placement order and corner are free. Duplicates are not allowed. The wall loop and the shared stair structure form the attachment foundation; the stair is part of the assembled architecture, not a fifth purchased building.

A first wing wraps and supports one side of the shared stair. A second adds a physically supported gallery to its neighbor or around the central stair if placed diagonally. Three wings close the upper structure. Four complete the tower's cross-shaped footprint. Roofs connect at authored heights, and the central roof/spire is derived from the installed wings.

Each building rank changes its own geometry even before the whole castle reaches that visual tier:
- **I:** one occupied bay, pitched roof, timber braces, visible door and a working exterior feature.
- **II:** a stone second floor, an arch or gallery into the tower, an expanded working feature, stronger corner supports.
- **III:** a third occupied floor or tall vaulted bay, a recognizable turret or roof mechanism, joined upper parapets. All four completed wings produce one crowned main tower.

The assembly must also look complete with one or two wings: cap exposed walls and galleries, give projecting floors supports, and avoid disconnected floating pieces. Changing a wing never moves the King's walking ring or hides a wall warning.

### Structural castle tiers
| Tier | Cost / available | HP per wall / defense power | Physical change |
| --- | --- | --- | --- |
| Outpost I | Starting foundation | 230 / 4 | Low curtain, timber walks, exposed stone stair core only where wings attach |
| Stonehold II | 260 / after 4 | 360 / 6 | Taller curtain, piers, reinforced gate arches, stone galleries that receive tier II wings |
| Crownspire III | 460 / after 9 | 520 / 8 | Buttresses, deep battlements, an upper gallery and a crown silhouette completed by attached tier III roofs |

Each tier adds one royal rune socket per weapon, to a maximum of three. The four outer mounts remain four; power limits the combination placed on them. No repeatable wall-HP purchase exists.

Inner wings share the castle's survival condition. They do not need separate health bars or repair buttons in the expansion. Their damage dressing follows the adjacent wall. Outer defenses can be wrecked and repaired. Current preview support-building HP is a legacy behavior to replace when adding the full wing catalogue.

### Wing paths
| Wing | Cost I / II / III | Rank I | Rank II | Rank III | Silhouette and activity |
| --- | --- | --- | --- | --- | --- |
| **Crown & Ember Tavern** | 120 / 140 / 200 | Recruit from the unlocked roster. All active knights begin with 10 ward | Starting ward becomes 20 | Starting ward 30; once per battle, the first downed knight triggers a toast that heals living companions for 20 | Hearthside tavern → company inn with a balcony → guildhall with a square bell tower. Door opens at departure; one mug/bell cue for the toast |
| **Dawn Sanctuary** | 110 / 170 / 250 | Heal the most injured living knight within 12m for 8 every 5s | Heal 12 every 4.5s within 14m | Heal 18 every 4s within 16m; each pulse removes one ordinary slow from its target | Shrine attached to a stair bay → narrow chapel with a treatment gallery → tall vaulted sanctum and open bell arch |
| **Royal Forge** | 100 / 150 / 230 | Every sixth royal shot gains +10 damage on its first contact | Tempered contact becomes +16 | Tempered contact +24; a perfect Guard primes the next shot, at most once per 6s | Open smithy and chimney → armored workshop with racks → forge tower with a moving roof vent and a visible tempering mechanism |
| **War Room** | 110 / 140 / 220 | Start each encounter with 80 Decree charge; passive generation 4.5/s | Start at 100; generate 5/s | Generate 5.5/s; Decree grants 15 ward to all living active knights | Map alcove → command gallery and standards → high signal room with a crown mast |

Without a War Room, Decree starts at 60 and gains 4/s. Ward is a temporary damage pool lasting 8s from the most recent grant; take the greater current/new value, up to 40 ordinary ward. It does not stack by source. Tavern starting ward has no expiry until consumed. Healing never revives a downed knight. Automatic end-of-level recovery does not require a Sanctuary or Tavern upgrade.

Forge counts shots that actually release, not button presses or secondary effects. Its damage bonus applies once per shot, including a piercing shot. Weapon swaps preserve the counter. A primed perfect-Guard shot consumes the normal tempering charge and resets the counter; it cannot fire an extra recursive proc.

## 3. Four wall defenses
Defenses can be freely repositioned and rotated in planning. Outer mounts take no more than one building each. Display power beside price; show the arc and minimum range in the placement ghost.

Ordinary attackers damage the wall they are hitting. Ram and boss wall impacts also deal **40% of their post-Guard damage** to the mounted defense on that side. Never apply the same impact once through the wall event and again through its area footprint. Wrecked defenses stop firing and leave an identifiable broken mechanism. Repair restores that model.

| Defense | Power | Cost I / II / III | Base stats I → II → III |
| --- | --- | --- | --- |
| **Royal Ballista** | 2 | 100 / 160 / 240 | HP 140/220/320; damage 34/55/78; range 13/15/18; cycle 3/2.5/2.8s; arc 110/130/150° |
| **Storm Spire** | 1 | 140 / 180 / 260 | HP 135/210/290; damage 20/30/42 per struck target; maximum total targets 1/2/3; range 10/12/14; cycle 3.8/3.4/3s; 360° |
| **Aegis Engine** | 1 | 120 / 170 / 260 | HP 180/250/330; shield pool 50/90/140; recharge 6/9/12 per second; projection 3.5/4.5/5.5m; arc 120/140/160° |
| **Cinder Mortar** | 2 | 160 / 200 / 280 | HP 150/225/310; damage 45/65/90; splash radius 2/2.3/2.6m; range 13/15/17, minimum 5; cycle 4/3.8/3.6s; 150° |

Aegis absorbs hostile missiles that physically cross its projected shield, up to its remaining pool. It does not passively cancel melee wall damage or replace Guard against a boss's entire wall strike. Recharge begins after 1s without absorption. Zero pool visibly collapses the shield before it reforms; recharge is never a separate floating health bar for the player to manage.

Mortar predicts a landing point once at launch; its projectile lands after 0.75–1.2s based on distance. The small friendly impact mark uses a distinct border, never the filled hostile warning style. No persistent fire pool, friendly fire or screen flash.

### Rank III defense specializations
Choose one at the rank III purchase; the choice is included in the cost.

| Defense | Path A | Path B |
| --- | --- | --- |
| Ballista | **Impaler:** bolt pierces three targets for 78 each | **Gatekeeper:** one 110-damage bolt; slows the first ordinary target by 45% for 2s. Bosses and rams resist the slow |
| Storm Spire | **Stormchain:** 42 damage to up to three targets, each jump at most 5m | **Thunderhead:** 84 damage to one target; prioritizes rams, bosses and armored units |
| Aegis | **Bastion:** pool 180, 160° arc, recharge 12/s | **Mirror:** pool 100, 120° arc; returns 30% of absorbed damage as one visible bolt, at most 30 damage every 2s. Reflections cannot proc runes, gear or relic relays |
| Mortar | **Scatterfire:** 70 damage, 3.4m radius, maximum four enemies per blast | **Siegebreaker:** 90 damage, 1.8m radius; +50% against rams and bosses |

Ballista path changes the loaded bolt rack and winch braces; Spire path changes the conductor head; Aegis path changes the panel arrangement; Mortar path changes the barrel cluster and loading tray. This is equipment assembly, not recoloring.

## 4. The King's weapons and skills
Both weapons are owned from the start. The first projectile releases within **0.07s** when a valid target is present; switching weapons does not play a lengthy equip animation. Swap preserves the shared next-shot deadline, so repeated Q cannot bypass cadence. Guard and Decree never stop automatic fire.

| Weapon | Rank I | Rank II, 150 crowns after 3 | Rank III, 280 crowns after 10 |
| --- | --- | --- | --- |
| **Stormbow** | 25 damage; 0.36s cycle; arrow speed 58; moving-target lead; short physical push | 32 base damage; choose Gale or Hawkeye | 39 base damage; the chosen path gains its capstone |
| **Sunlance** | 43 damage; 0.62s cycle; bolt speed 48; pierces three; ignores frontal shields; stronger push | 53 base damage; choose Breaker or Daybreak | 63 base damage; the chosen path gains its capstone |

All hits use swept projectile contact. Push is an impulse, not a stun that resets enemy animation every shot. Bulwarks take 40% ordinary push; rams and bosses do not slide. Royal shots do not pass through the opposite castle wall to hit a concealed enemy on the far side.

### Four complete weapon paths
| Weapon path | Rank II behavior | Rank III behavior | Visual identity |
| --- | --- | --- | --- |
| **Stormbow → Gale** | Every fourth released arrow adds 0.6m of displacement against an ordinary enemy | Every third release also fires one 60%-damage arrow at a different nearby target; retains the fourth-arrow push | Split bow tips and paired string guides; small distinct secondary arrow |
| **Stormbow → Hawkeye** | Third consecutive primary hit on the same target deals +18; then restart that three-hit count | Third-hit bonus becomes +30 and ignores that hit's frontal shield reduction | Longer sight rail, narrow bright arrowhead, short single impact cue |
| **Sunlance → Breaker** | First contact gains +12 against a shielded unit, ram or boss | That first-contact bonus becomes +22; perfect Guard primes one such bonus against any target | Broad spearhead and reinforced focusing collars; hard contact spark |
| **Sunlance → Daybreak** | The third pierced target produces a 14-damage burst in a 2m radius, at most three additional victims | Burst becomes 22 damage in a 2.5m radius | Three-pronged emitter; one brief low ring at the final contact |

Daybreak's burst cannot hit a victim already hit by the same bolt. If fewer than three primary targets are hit, no burst occurs. Hawkeye's count resets on target change, a missed primary shot or encounter end. Target stickiness makes it usable without manual clicking. Secondary arrows, bursts and relic projectiles do not advance these counters.

**Guard remains a skillful fixed timing window** throughout the campaign: 1.5s protection, 4.5s cooldown, 0.4s perfect window, one wall. Higher tiers do not turn it into permanent castle invulnerability.

**Royal Decree** uses 100 charge. At wall tiers I/II/III it deals 58/74/90 damage within 13m, pushes ordinary enemies and marks survivors for 6s. It does not cancel committed boss attacks. The War Room and relic choices change how it supports the build; there is no separate skill-point tree or heavy-attack charge.

## 5. Six knights, four jobs
Up to three active companions. Reserves keep equipment, XP and learned talents. Between victories everyone heals fully, including reserves and downed knights. A downed knight stays down for the current encounter unless rescued by a finite ability/item.

Guard and Hunt are the only persistent orders. Guard starts at the assigned gate and intercepts nearby threats, then reinforces a neighboring threatened sector when its own approach is clear. Hunt prioritizes reachable threats, screens support units and returns before chasing outside its leash. Neither order means standing still while nearby allies are attacked.

| Knight | Class / availability / cost | Trait |
| --- | --- | --- |
| **Aldren** | Warden / start / free | **Steadfast:** 25% less displacement from boss hits |
| **Elin** | Marksman / Tavern / 140 | **Watchful:** prefers exposed ranged enemies and banner carriers when otherwise equally reachable |
| **Corvin** | Warden / after 2 / 140 | **Resolute:** takes 15% less damage while below half HP; checks HP before the hit |
| **Iona** | Lancer / after 3 / 160 | **First Light:** her first charge each encounter recharges immediately once |
| **Lysa** | Marksman / after 6 / 140 | **Fleet-footed:** +15% movement speed |
| **Mira** | Chanter / after 6 / 180 | **Evenhanded:** when her heal targets an ally, Mira also heals for 25% of the amount actually restored |

These are six authored people, without random positive/negative trait rolls or expendable recruits. New recruit gear and promotions are not bundled free.

| Class | Base HP / damage / range / speed | Autonomous behavior |
| --- | --- | --- |
| Warden | 135 / 26 / 2.1m / 4.3 | Intercepts melee, approaches with shield toward danger, picks a reachable contact slot. 0.33s ordinary contact and roughly 0.65s cycle |
| Marksman | 95 / 22 / 9m / 4.5 | Fires from useful range, leads movement, sidesteps a committed threat and stops retreating once it has room. Roughly 0.7s cycle |
| Lancer | 115 / 32 / 2.8m / 5.2 | Punctures an isolated screen or intercepts a hunter. A 4m charge every 6s needs a clear route, locks its lane and adds 12 first-contact damage. Ordinary cycle 0.8s |
| Chanter | 100 / 12 / 8m / 4.4 | Stays behind the nearest front, shoots light bolts every 0.9s, heals the weakest living ally within 6m for 10 every 5s |

Every promotion adds 25 maximum HP and 4 ordinary attack damage. Knight rank II costs **100**, needs **6 service XP** and level 5 cleared. Rank III costs **180**, needs **16 service XP** and level 10 cleared. Promotions do not slow contact animations.

### Talents: two paths per class, three points maximum
One point at rank I, a second at II, a third at III. Each node costs one point. A middle node requires its root; a capstone requires its middle and rank III. A knight can complete one path or take two roots and one middle; six-node completion is impossible. Free respec removes all points and then reapplies a valid selection.

| Class / path | Root — I | Middle — II | Capstone — III |
| --- | --- | --- | --- |
| **Warden: Vanguard** | **Thunder Slam:** every 8s, an announced shield slam deals 24 damage in 3m and stuns ordinary enemies 0.8s | **Aftershock:** slam becomes 36 damage and 3.5m radius | **Earthshaker:** cooldown 6s; first two enemies hit take a further 18 damage. Bosses take damage but cannot be stun-locked |
| **Warden: Guardian** | **Challenging Cry:** every 9s, taunt reachable ordinary enemies within 6m for 4s. Maximum three targets; no bosses/rams | **Iron Resolve:** 25% less incoming damage while Cry is active | **Sacred Ground:** every 4s, heal the most injured living ally within 5m for 8 |
| **Marksman: Stormshot** | **Split Volley:** every third primary attack sends a 16-damage arrow at another target | **Barbed Arrows:** primary arrows ignore shields and pierce two | **Deadeye:** ordinary damage +25%; the extra Volley arrow becomes 24 |
| **Marksman: Lifewarden** | **Mending Light:** every 5s, heal the weakest living ally within 7m for 8 | **Sheltering Light:** Mending also grants 10 ward for 5s | **Beacon of Dawn:** Mending becomes 14 every 4s within 10m |
| **Lancer: Dragoon** | **Driving Point:** charge pushes the first ordinary victim 1m further | **Skewer:** charge can hit a second enemy in its locked lane for 24 | **Comet Line:** charge cooldown 4.5s; first contact gains another 16 damage |
| **Lancer: Sentinel** | **Intercession:** if a nearby ranged ally is targeted by a lunge, charge the attacker when a safe interception lane exists | **Counterpoint:** after Intercession, gain 20 ward for 4s and deal +16 on the next thrust | **Royal Escort:** after Intercession, the protected ally also gains 20 ward and 20% movement speed for 3s |
| **Chanter: Concord** | **Kindled Hymn:** base heal becomes 14 | **Shared Light:** also heal a second living ally within 3m of the recipient for 6 | **Dawn Chorus:** every third heal grants 15 ward to the healed targets; base heal cooldown 4s |
| **Chanter: Battle Cantor** | **War Verse:** each heal gives its target +15% attack damage for 3s | **Resonance:** every third light bolt deals an extra 18 damage, once on first contact | **Crown's Answer:** Royal Decree resets the Chanter's heal timer and gives all living companions War Verse for 4s |

Intercession uses the same charge cooldown as an ordinary Lancer charge; it cannot produce extra free charges. Iona's once-per-encounter reset is consumed by either kind. Buffs of the same name refresh; they do not stack across two knights. Sacred Ground and Hymn do not resurrect. Healers skip undamaged recipients unless the heal explicitly also grants a useful ward or buff.

Ranged knights hold their firing position through release. Target reservation and hysteresis prevent all three companions from endlessly chasing one foe. A route failure falls back to defending a reachable wall threat. Rescue pathfinding never sends a helper through the curtain or into a currently active boss footprint.

## 6. Six royal runes
One copy of a rune kind per weapon; up to three sockets based on castle tier. Owned runes can be transferred freely. A shot ID carries all proc counters, so a Sunlance piercing three targets cannot count as three shots for a rune.

| Rune | Cost / availability | Effect |
| --- | --- | --- |
| **Quickdraw** | 100 / start | Royal shot interval ×0.85. No extra stacking copies; neither animation nor projectile contact is delayed |
| **Sundering** | 110 / start | +14 damage once on a shot's first armored, ram or boss contact |
| **Vital Spark** | 95 / start | Every fourth successful primary shot heals the weakest living knight for 6 |
| **Anchor** | 125 / after 3 | +25% physical push from the primary projectile against ordinary units; no extra stun |
| **Forked Light** | 145 / after 5 | Every third successful primary shot sends one travelling 16-damage spark to a different enemy within 6m |
| **Afterglow** | 140 / after 10 | A successful Guard primes the next primary shot for +24 first-contact damage. Perfect Guard increases it to +36. One stored charge across both weapons |

Forge, weapon and rune first-contact bonuses can add to one primary hit; secondary damage does not inherit them. A royal shot may create at most two secondary projectiles across weapon/rune effects, in weapon-then-rune order. Healing and score feedback are combined into one small cue. A blocked hit that deals positive damage is successful; an invulnerable entrance hit is not.

## 7. Eight company gear items
Each knight equips one item. No separate weapon/armor/insignia inventory grids. Gear attaches to a visible socket and has one short card. Purchased items may be transferred or sold for 70% of price in planning.

| Gear | Cost / availability | Effect |
| --- | --- | --- |
| **Ward Seal** | 85 / start | Absorb up to 12 damage from one hit, then recharge in 6s |
| **Storm Seal** | 100 / start | +6 ordinary attack damage |
| **Field Surgeon's Kit** | 120 / start | Once per encounter, safely reach one downed ally within 8m and channel 1.4s to revive at 35% HP |
| **Fleet Spurs** | 100 / after 3 | +15% movement speed; total trait/gear movement bonuses cap at +30% |
| **Duelist's Medal** | 125 / after 5 | +20% ordinary attack damage against an enemy with no other living enemy within 3m |
| **Beacon Charm** | 130 / after 5 | +25% healing from the wearer's own abilities; does not modify building healing |
| **Siege Hook** | 140 / after 7 | +35% ordinary attack damage against Bulwarks and Rams |
| **Return Sigil** | 145 / after 10 | Once per encounter, a lethal hit leaves the wearer at 1 HP and grants 25 ward for 2s |

A knight can be revived **once per encounter**, regardless of the number of Field Kits. Helpers reserve a downed target, so two kits cannot be consumed on the same rescue. A failed or interrupted channel does not consume the kit; the helper returns to a safe action before retrying. Return Sigil is a one-time prevention, not a revive; it cannot reset itself when the wearer is later rescued.

The six shop offers prioritize relevant rune/gear categories and exclude copies above two of a rune or three of a gear item. If useful stock is exhausted, show owned equipment and the known upgrade catalogue rather than six useless duplicates. No routine weapon upgrade depends on a shop roll.

## 8. Six relics, two equipped, one ascended
The first cache follows level 5; the second follows level 10. Choose one of three different offered relics. At least one King relic and one company relic appear when unowned; the third favors an existing defense. Never offer a conversion whose building family is absent. If only two distinct compatible unowned relics remain, show two; do not invent a filler duplicate.

The complete relic list can be inspected from the start. Caches stay available through their council so the player can build a compatible defense before opening them. The first slot is equipped immediately; the second adds another effect after level 10. No relic stacking copies, no random rarity levels, no active relic button.

After level 13, choose **one of the two equipped relics to ascend**, for free. This remains a choice at the level-14 council if deferred. Changing which relic is ascended is free during planning; at most one is ascended at a time.

| Relic | Base effect and cost in behavior | Ascended form | Physical change |
| --- | --- | --- | --- |
| **Worldpiercer** | Ballistas use base rank damage ×2.2, pierce five and ignore shields. Reload ×1.75, turn speed ×0.5, arc 75°. Overrides their normal rank III specialization | First victim takes another +30% damage; targets after the first retain the base conversion damage | Recoil anchors, huge loaded bolt, reinforced channel and a planted recoil animation |
| **Oath of the Storm King** | Decree marks survivors for 6s. Each knight can relay one 24-damage spark from a marked victim to another enemy within 7m every 3s. Relays cannot relay | A successful relay heals its knight for 6 | Royal conductor crest and small matching knight insignia; one short travelling connection |
| **The Black Standard** | Guarding knights gain +35% ordinary damage within 3m of their assigned gate. Leaving that area or choosing Hunt loses the bonus | Reinforcing an adjacent threatened gate retains the bonus for 4s after departure | Large shared standard on the War Room or an attached wall bracket if the wing is absent |
| **Dawn Engine** | Aegis stores absorbed missile energy up to 60. Guarding its wall discharges that energy once as a cone split equally among at most four enemies in 8m. Aegis recharge is 20% slower | Each discharge also repairs 10 HP on that wall, capped at 40 HP per encounter | Hinged reflector and a visible charge reservoir; one mechanical open/close cycle |
| **Tempest Cathedral** | A Spire attack can relay one 20-damage spark through an occupied neighboring wall mount to a foe within 6m of that mount. Spire range is reduced by 2m | May relay through both occupied neighbors, at most two extra sparks per Spire attack | Physical insulators and cable along the curtain, not a web of permanent airborne effects |
| **Ember Crown** | A successful Guard adds +12 to the first contact of the next royal shot; a perfect Guard grants three such shots. Decree radius becomes 10m | The Guard also releases one 43-damage Sunlance bolt toward the wall attacker, without delaying automatic fire | Articulated crown fins and a brief forward flare; no persistent full-screen aura |

Dawn Engine's charge comes only from actual Aegis absorption; Guard cannot create charge from its own damage prevention. Guard with no enemy in range retains stored energy. Tempest uses adjacent cardinal mounts only, and a relay cannot trigger another tower/knight/rune proc or hit a primary victim a second time.

Unusable relics are retained in storage if their prerequisite building is salvaged, with a single inactive icon in planning. Building the family again restores the effect. Their original building upgrades remain invested; equipping or removing a relic never silently sells or downgrades a defense.

## 9. Three finished builds and late pivots
These illustrate roles rather than mandatory recipes. Check all three in playable balance runs; the arithmetic worksheet is a fourth, mixed spending example.

| Build | King and company | Castle investment | Relic direction | Pressure it must still answer |
| --- | --- | --- | --- | --- |
| **The Gate Line** | Breaker; Aldren Guardian, Elin Stormshot, Iona Sentinel | Strong Ballista and Aegis, modest Tavern/War Room, upgraded walls | Black Standard + Worldpiercer | Rotating away from the defended gate, far-bank ranged fire |
| **Storm Company** | Gale with Vital Spark; Vanguard, Lifewarden, Battle Cantor | Stormchain Spire, Sanctuary, War Room; a cheaper Ballista | Storm Oath + Tempest Cathedral | Rams and shield screens require Sunlance and active wall Guard |
| **The Royal Battery** | Hawkeye or Breaker with Quickdraw/Sundering; Guardian, Dragoon, Concord | Forge and Siegebreaker Mortar, one protective Aegis | Ember Crown + Dawn Engine | Ranged hunters punish unattended companions; the King cannot stay on one side |

A late recruit has useful service XP immediately, but still costs crowns to hire and promote. A new relic can be used through free specializations and equipment transfers, or by salvaging one defense. The level-14 purse is deliberately larger so the last council can complete a choice the player has been working toward. Do not place a new weapon family, fourth active companion slot or whole new skill tree there.

## 10. UI contract for these paths
Combat shows the outcome of a build, not its entire specification. The council can expose depth one selection at a time:
- A building card shows its current model, next model, incremental cost and **one changed behavior**. The full three-tier comparison is an inspect action.
- A knight card shows class, current HP, one gear slot and promotion. Its two talent paths open on selection; only spendable nodes are emphasized.
- A weapon card shows “rapid / piercing”, current rank and one specialization choice. Detailed timings stay in inspect.
- A relic choice shows one sentence of effect and one sentence of tradeoff. Its machine/character preview demonstrates the attachment.
- Castle power appears beside the four wall mounts. Inner wings show their four unique slots and do not ask players to manage power.
- No separate “repair knights”, “King health”, heavy-charge meter, crew payroll or workshop crafting currencies remain in the castle campaign.

Every content path needs a real model/behavior change, save support, a bounded simulation effect and an understandable purchase screen before its corresponding level enters the playable campaign.

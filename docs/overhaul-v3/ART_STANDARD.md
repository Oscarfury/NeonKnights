# Art, rigging and animation requirements

This is the acceptance standard for the next overhaul. The existing knight puppet, directional atlas and code-drawn creatures are prototype assets. They do not meet it, and increasing their resolution or adding more atlas frames will not meet it.

## The reference is a minimum

The user's [Hand Painted Paladin Knight](https://www.cgtrader.com/free-3d-models/character/fantasy-character/hand-painted-paladin-knight-rigged-and-game-ready), by silverdelivery, establishes the visual floor: layered plate armor, believable proportions, articulated hands, cloth and leather between armor pieces, shaped equipment, and a carefully painted surface. The listing describes one skinned mesh, one material, four textures and a rig; it supplies Blender and FBX formats. It lists 13,888 polygons, which must not be relabelled as a triangle count. It does **not** document the complete combat animation library this game needs.

The reference sets quality and craft, not an instruction to copy its armor or make every role a paladin. A Stormbow commander should look like an armored archer capable of drawing a bow. A Warden should look and move like a shield-bearing defender. A Dragon requires a different skeleton and anatomy.

The user subsequently supplied the source archive. Its mesh and painted textures are now imported into the [Foundry preview](PROGRESS.md), with a clean game rig and new animation studies. The archive contained a pose action, not a completed locomotion/combat library. Final animation acceptance and the remaining asset roster are still implementation work.

## 1. Models and materials

Character models need all of the following:

- Coherent anatomy and proportions. Shoulders, hips, hands and feet must support the intended movement. Equipment must be held by a modeled hand with a plausible grip.
- Layered armor that reads as separate constructed pieces: pauldrons, breastplate, bracers, greaves, fastenings and flexible joints. Armor cannot be a collection of intersecting unshaped boxes.
- An authored silhouette for each role, readable against the basalt arena at the actual game camera. Larger enemies must earn their size with new anatomy or equipment.
- UVs and painted material detail: edge treatment, broad value separation, restrained wear, leather/cloth/metal distinctions and intentional color placement. Normal and roughness detail must support the painted style.
- Finished backs, undersides visible in attacks, and joints. Continuous rotation reveals every side of the model.
- Separate, correctly positioned weapon and major equipment attachments. An armor upgrade must change visible armor, not just its color or a label.

Use a consistent semi-realistic, hand-painted fantasy style. Keep the neon identity in runes, energy sources, glass and selective trim. Broad rainbow emission over an entire character hides form and undermines the reference's readability.

The commander, recruited knights, ordinary enemies and bosses all share this quality bar. Small runtime size permits a tested level of detail; it does not excuse unfinished source art. The armory and garrison show close-up models, so their inspection view is also a shipping view.

## 2. Render the rig in the browser

Use **Three.js with Blender-authored glTF/GLB models and skeletal animation** for the new runtime. Retain TypeScript rules, Vite's static delivery and DOM interface panels. Replace the Phaser/CanvasTexture battle renderer for this version. Do not layer a second renderer over the old battle to preserve its eight-direction assumptions.

Three.js provides glTF model/animation loading and skeletal clip playback with blending. That makes the proposed runtime feasible; animation quality still depends on the exported asset and its controller. See the official [GLTFLoader documentation](https://threejs.org/docs/pages/GLTFLoader.html), [animation system guide](https://threejs.org/manual/en/animation-system.html) and [AnimationMixer reference](https://threejs.org/docs/pages/AnimationMixer.html).

The battle remains an elevated-camera game. This change is about real orientation, deformation, weapon motion, lighting and depth. Navigation uses authored surfaces and ramp connections; a freely rotating camera and general rigid-body simulation are not prerequisites.

Use a shared environment palette, a controlled key light, softer fill and grounded contact shadows. Characters must remain readable when effects are disabled. Selection and hostile telegraphs need their own visual layer; emissive materials must not make friend, foe and danger indistinguishable.

## 3. Rig contract

The humanoid export requires a deform skeleton with a root, pelvis, spine/chest, neck/head, clavicles, arms, hands, fingers appropriate to the grip, legs and feet. A reusable production control rig may include IK, constraints and helpers in Blender. Exported clips must bake the necessary motion to runtime-compatible bones; the browser cannot depend on Blender's control constraints being present.

Shared humanoid topology and bone naming can make retargeting economical. Retargeted motion still needs contact, grip and silhouette cleanup for each weapon and body proportion. Shared rigs do not justify identical armor or a bow attack made from a sword clip.

Required sockets include right hand, left hand, bow grip, projectile release, back/sheath and insignia. A socket has a documented local axis and offset. Runtime attachments must follow the animated bone. Two-handed weapons require an authored support-hand pose or a tested runtime hand constraint.

The Dragon has a dedicated rig for torso, neck, jaw, tail, wings and legs, plus stable mouth and impact sockets. Mechanical buildings use articulated transforms or a mechanical rig where appropriate. A building does not need a humanoid skeleton, but its moving parts must really move.

Animation controls:

- Simulation owns world translation, facing, attack timing and hit decisions. Locomotion clips are authored in place; their visual speed follows travel speed. Dodges and lunges use a simulation trajectory matched to the clip.
- Lower-body locomotion blends with the equipped weapon's upper-body pose where the action permits movement. Whole-body attacks explicitly take control when they need a planted stance.
- Body yaw, aim yaw and head tracking have bounded offsets; legs turn instead of allowing the torso to twist through an impossible angle.
- Animation playback consumes the same simulation time scale as attacks. Pausing, slow time, hit reactions and an interrupted attack must not leave a projectile disconnected from its release pose.
- Per-instance skeleton and playback state must be independent. Two knights cannot share a live skeleton that forces them into the same pose.
- Death and downed states have explicit transitions. A living recruit never vanishes because an animation or summon timer ended.

## 4. Required animation coverage

These are behavioral clips and blend requirements, not a count of still poses. A short loop may cover several directions through blending; it must play continuously and pass the contact review.

| Actor / equipment      | Minimum authored motion                                                                                                                                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Humanoid foundation    | Relaxed and combat idle; walk/run forward, backward and lateral movement; starts/stops and turn in place; four dodge directions; hit reactions; downed, assisted recovery and death; interaction and weapon equip/stow |
| Stormbow commander     | Carry/aim; draw; held full draw; release with string motion; recovery and draw reset; moving aim; charged alternate with distinct tension and release; cancel/stow without firing                                      |
| Sunlance commander     | Two-handed carry and aim; emitter prime; planted charged discharge; ordinary shot recoil; recovery/cooling; moving fire where allowed; equip/stow distinct from bow draw                                               |
| Later Cinder Engine    | Heavy carry, spin-up/feed, firing, recoil, heat response and a physical vent action                                                                                                                                    |
| Later Grave Chakram    | Wind-up, release, empty-hand follow-through, recall anticipation, catch, recovery and a miss/return fallback                                                                                                           |
| Later Rift Mortar      | Heavy carry, load/arm, aim, launch, recoil, remote-detonation gesture and reload                                                                                                                                       |
| Warden                 | Shield-ready locomotion; brace; block impact; at least two authored sword attacks; recover; shield push; formation turn; rescue/interact                                                                               |
| Marksman               | Bow locomotion and attack set, aim settling, retreat while facing a threat, target change and downed/recovery                                                                                                          |
| Later Lancer / Chanter | Respectively plant/charge/thrust/disengage, or cast/channel/rally/rescue; all common movement and damage states                                                                                                        |
| Enemy Raider           | Approach, turn, melee anticipation, committed swing, recoil/recovery, stagger and death                                                                                                                                |
| Enemy Bulwark          | Shielded advance, brace, blocked impact, opening/attack, shield break, stagger and death                                                                                                                               |
| Enemy Hexcaster        | Move, plant, cast preparation, visible release, recovery, retreat, stagger and death                                                                                                                                   |
| Prism Dragon           | Flight loop, approach, landing, grounded locomotion/turning, take-off, inhalation, sweeping breath, talon landing, tail sweep, wall rake, interrupt, recovery, wing damage and death                                   |
| Buildings              | Construction assembly, operational idle, tracking, charge/load, release, recoil/reset, damaged state and destruction as applicable                                                                                     |

Melee swing paths must match their hit volume. Bowstring tension, hand placement and arrow release must agree. A ranged weapon cannot retain a drawn sword merely because the old puppet contains one.

Content metadata records a clip's intended role, looping policy, blend region and semantic moments such as `release`, `contact` and `recover`. Use normalized times exported or authored alongside the clip; an asset validator checks they exist and are ordered. Gameplay can inspect those timings, but damage is resolved by the simulation's ability state, not an unreliable render-frame callback.

## 5. Buildings must look worth purchasing

Each family has three authored tier models sharing a coherent construction language. The tier-II silhouette adds working machinery and armor. Tier III transforms its scale of operation through new structural members, mechanisms and supporting details. A legendary can add an authored conversion module when that convincingly changes the machine.

For the first slice:

- **Ballista I:** timber carriage, tension limbs, rope, bolt rail and a turning winch.
- **Ballista II:** armored turntable, reinforced limbs, ammunition rack and a visible loading mechanism.
- **Ballista III:** larger siege frame, bracing feet, a heavier winding system and authored pinning/piercing bolt variants.
- **Worldpiercer conversion:** deployed recoil anchors, a long finned bolt and a slower, weightier firing/reset sequence.
- **Aegis I:** grounded focus on a directional pivot, supported by struts and insulators.
- **Aegis II:** hinged protection plates, a charge housing and a larger physical focus.
- **Aegis III:** multi-panel engine with separate arc-protection and reflected-return equipment.

Show tier comparisons under neutral lighting with emission disabled. If the distinction disappears, the upgrade has failed the art requirement. Then review the same models in the fortress with aim, operation, damage and selection effects enabled.

Selection opens a turntable/inspection view with a tier comparison and footprint/arc preview. Use rendered views of the actual models for catalogue art and portraits, so the beautiful purchase plate and the deployed structure are the same object.

## 6. First production asset set

Do not approve fifteen waves around temporary silhouettes and promise to replace them later. Complete this smaller set first:

| Asset family      | First-slice delivery                                                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Commander         | One finished armored archer character; Stormbow and Sunlance equipment and complete action sets; visible stowed equipment                                                            |
| Company           | Finished Warden and Marksman variants on compatible rigs; sword/shield and bow sets; at least one visible equipment swap per role; roster identities and portraits from these models |
| Ordinary enemies  | Raider, Bulwark and Hexcaster with distinct modeled silhouettes and role-specific motion; compatible rigs may be reused                                                              |
| First boss        | One finished Dragon, its full four-pattern moveset, damaged wing state and physical death                                                                                            |
| Construction      | Ballista and Aegis at three tiers each; branch fittings and Worldpiercer conversion; operating/damage motion                                                                         |
| Battlefield       | A finished playable section of fortress, two approaches, connected ramp, operable gate, breach panel and one supply objective; consistent materials and navigation geometry          |
| Legendary rewards | Three authored plates for Worldpiercer, Oath of the Storm King and The Black Standard; the conversion, conductors and banner they add must appear in combat                          |
| Feedback          | Weapon-specific projectiles, breath and scorch, shields, impacts and warning shapes with distinct sounds; restrained effects that preserve model visibility                          |

The slice uses three active knights and one reserve place to demonstrate recruitment, reassignment and recovery. Full class and building rosters follow only after this set passes review.

## 7. Asset acceptance and delivery

Keep editable `.blend` sources, texture sources, export configuration, provenance and a named version for each accepted asset. An actual sourced model needs recorded runtime-use terms and source attribution where required before it enters published assets. The CGTrader reference does not itself establish the selected asset library.

Suggested repository layout for implementation:

```text
art/source/characters/           editable scenes and texture sources
art/source/buildings/
art/source/environment/
art/manifests/                  asset IDs, sockets, clips, export settings, provenance
tools/art/                      export, metadata and validation commands
public/assets/v3/               runtime GLB and optimized textures only
output/art-review/              ignored turntables, contact sheets and browser captures
```

Choose storage for larger source files before adding them to Git. Runtime delivery must remain self-contained on GitHub Pages, with base-path-safe URLs and asset loading/error states. Do not depend on a shop's thumbnail CDN for shipped art.

Every accepted animated asset needs:

1. Neutral-lit front/side/back and a continuous turntable, reviewed at battle and inspection scale.
2. Animation playback with a visible floor: inspect feet, knees, shoulders, grips and equipment intersections during movement and attacks.
3. The exported GLB playing in the browser, including moving aim, clip transitions, slow time, pause/resume and two independent instances.
4. Release/contact footage with the projectile or hit volume overlay enabled. There must be no early damage followed by a late cosmetic swing.
5. Validation of required clips, sockets, texture references, finite transforms and bounds, expected material slots and independent skeleton state.
6. An actual battle view beside the reference-quality inspection view. A source render alone cannot prove the runtime quality.

Set performance budgets from a measured representative scene. Record device/browser, visible characters, triangles after triangulation, texture/GPU memory, draw calls, frame times and loading bytes. Initial goals are smooth 60 fps on the agreed desktop test device and a readable 30 fps fallback on the agreed mobile device; these are targets until hardware and captures are recorded.

Optimize with tested LODs, texture reuse/compression, pooled effects, bounded lights/shadows and off-screen animation work. Lower distant detail before compromising the inspected hero asset. Do not silently replace the user's art floor with tiny textures or a primitive fallback to meet an invented polygon budget.

The art milestone is complete only when the new runtime visibly meets this standard. A rig flag, a successful export, a high polygon count or a passed loader check is insufficient.

# Neon Knights · The King's Battlements

[Play Neon Knights](https://oscarfury.github.io/NeonKnights/) · [Alternate campaign URL](https://oscarfury.github.io/NeonKnights/next/)

Both links open the same fifteen-level castle campaign. The older Phaser game lives at [/v2/](https://oscarfury.github.io/NeonKnights/v2/); the first draft remains at [/classic/](https://oscarfury.github.io/NeonKnights/classic/).

Build one modular castle from four attached wings: Tavern, Sanctuary, Royal Forge and War Room. Upgrade its walls and buildings through three visible tiers. Four outer mounts take Ballistas, Storm Spires, Aegis Projectors and Cinder Mortars, with two final specializations per defense.

Start with Aldren. A Tavern opens recruitment; six named knights cover Warden, Marksman, Lancer and Chanter classes. Deploy up to three, choose talents and equipment, and recover the whole company after each victory. Eight enemy roles arrive in authored assaults with stable wall assignments. The Procession Golem, Emberwing and Hollow King lead levels 5, 10 and 15.

Two royal weapons have upgrade branches, six runes, eight knight items and six relics. Earn two relics across the campaign and ascend one before the final act ends. See [implementation and verification](docs/overhaul-v3/CAMPAIGN_IMPLEMENTATION.md) and the original [campaign](docs/overhaul-v3/CAMPAIGN_15.md) / [upgrade specifications](docs/overhaul-v3/UPGRADE_PATHS.md).

## Controls

| Input | Action |
| --- | --- |
| Mouse hover / touch drag | Move the King around the wall; weapons fire automatically |
| A / D or arrow keys | Move around the wall |
| Q / weapon button | Swap Stormbow and Sunlance |
| E / Guard button | Protect the current wall; time it just before a boss impact to stagger the boss |
| Space / Decree button | Release Royal Decree at full charge |
| Escape | Pause |

Any wall falling ends the siege. The King has no health bar. Saves record the council between levels; a mid-battle reload restores that level's starting choices. Old three-watch checkpoints are retained under their old key while this expanded campaign starts separately.

## Run and verify

```powershell
npm ci
npm run dev
```

Open `http://127.0.0.1:5173/NeonKnights/`.

```powershell
npm test
npm run assets:check
npm run build
npx tsx tools/review/play-campaign.ts
npm run preview
```

The campaign simulation uses ordinary input and legal purchases. It checks reachability and progression, rather than measuring human difficulty. Browser reviews use the Playwright CLI; evidence and reproducible review scripts are described in the implementation record. GitHub Actions runs the tests, asset validator and production build before deploying Pages.

The game uses TypeScript, Vite, Three.js and Blender-authored GLBs. It needs no account, backend or external asset CDN. The Foundry and earlier training scenes remain under **Art & training**. Source and licensing records are in [the asset credits](public/assets/v3/CREDITS.txt).

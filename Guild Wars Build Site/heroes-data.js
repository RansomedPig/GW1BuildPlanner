/* heroes-data.js — Hero guide (source: wiki.guildwars.com/wiki/Hero, verified) */
var GW_HEROES = [
  // ── NIGHTFALL ─────────────────────────────────────────────
  // Warriors
  { name:'Koss', prof:'Warrior', campaign:'Nightfall', unlock:'Into Chahbek Village (NF characters) or talk to Kormir during Battle Preparations (others)',
    role:'Frontline melee tank/damage', build:'Weapon mastery + Strength. Dragon Slash or Hundred Blades for DPS. Good with "Save Yourselves!" if available.' },
  { name:'Goren', prof:'Warrior', campaign:'Nightfall', unlock:'Brains or Brawn quest in Vabbi (choose between Goren or Norgu — get the other after campaign completion)',
    role:'Frontline hammer tank', build:'Hammer Mastery + Strength. Earth Shaker knockdown chains. Tanky with high armor.' },
  // Rangers
  { name:'Acolyte Jin', prof:'Ranger', campaign:'Nightfall', unlock:'Student Jin quest (choose between Jin OR Sousuke — get the other after campaign completion)',
    role:'Ranged interrupt/damage', build:'Marksmanship + Expertise. Barrage/pet or interrupt build (Savage Shot + Distracting Shot).' },
  { name:'Margrid the Sly', prof:'Ranger', campaign:'Nightfall', unlock:'No Me, No Kormir OR To Kill a Demon (choose between Margrid or MoW — get the other after campaign)',
    role:'Ranged damage/interrupt', build:'Marksmanship + Expertise. Same builds as Jin — Barrage or interrupt.' },
  // Monks
  { name:'Dunkoro', prof:'Monk', campaign:'Nightfall', unlock:'Leaving a Legacy (NF characters) or talk to Kormir during Battle Preparations (others)',
    role:'Primary healer', build:'Healing Prayers + Divine Favor. Word of Healing or Zealous Benediction. Patient Spirit, Dwayna\'s Kiss, condition removal.' },
  { name:'Tahlkora', prof:'Monk', campaign:'Nightfall', unlock:'Big News, Small Package (NF characters) or talk to Kormir during Battle Preparations (others)',
    role:'Protection monk', build:'Protection Prayers + Divine Favor. Spirit Bond, Protective Spirit, Shield of Absorption.' },
  // Necromancers
  { name:'Master of Whispers', prof:'Necromancer', campaign:'Nightfall', unlock:'No Me, No Kormir OR To Kill a Demon (choose between MoW or Margrid — get the other after campaign)',
    role:'Minion master or curses hexer', build:'Death Magic for Minion Master (Animate + Death Nova). Or Curses for Spiteful Spirit. Soul Reaping fuels everything.' },
  // Mesmers
  { name:'Norgu', prof:'Mesmer', campaign:'Nightfall', unlock:'Brains or Brawn quest in Vabbi (choose between Norgu or Goren — get the other after campaign completion)',
    role:'Shutdown/interrupt — top-tier hero', build:'Domination + Fast Casting. Panic, Energy Surge, or Ineptitude. Mesmers are the strongest hero profession.' },
  // Elementalists
  { name:'Acolyte Sousuke', prof:'Elementalist', campaign:'Nightfall', unlock:'Student Sousuke quest (choose between Sousuke OR Jin — get the other after campaign completion)',
    role:'AoE spell damage', build:'Fire Magic + Energy Storage. Searing Flames or Invoke Lightning for AoE damage.' },
  { name:'Zhed Shadowhoof', prof:'Elementalist', campaign:'Nightfall', unlock:'Centaur Blackmail quest (Kourna)',
    role:'Flexible caster damage/support', build:'Fire for damage, Earth for armor/wards, Water for snares. Flexible depending on team needs.' },
  // Paragons
  { name:'General Morgahn', prof:'Paragon', campaign:'Nightfall', unlock:'Grand Court of Sebelkeh mission completion',
    role:'Party support/shouts', build:'Leadership + Command or Motivation. "There\'s Nothing to Fear!" and party-wide armor shouts.' },
  // Dervishes
  { name:'Melonni', prof:'Dervish', campaign:'Nightfall', unlock:'Signs and Portents (NF characters) or talk to Kormir during Battle Preparations (others)',
    role:'AoE melee damage', build:'Mysticism + Scythe Mastery. Vow of Strength build. Scythe hits 3 foes — excellent AoE.' },
  // Ritualists
  { name:'Razah', prof:'Ritualist', campaign:'Nightfall', unlock:'Finding a Purpose quest (requires Nightfall campaign completion). Can permanently change profession.',
    role:'Flexible — can change to ANY profession', build:'Default: SoS spirit spammer. Unique: change profession at Great Temple of Balthazar — commonly made Mesmer for triple-mesmer teams.' },

  // ── EYE OF THE NORTH ──────────────────────────────────────
  // Warriors
  { name:'Jora', prof:'Warrior', campaign:'Eye of the North', unlock:'Curse of the Nornbear quest (Norn storyline)',
    role:'Frontline melee', build:'Weapon mastery + Strength. Same builds as Koss/Goren.' },
  // Rangers
  { name:'Pyre Fierceshot', prof:'Ranger', campaign:'Eye of the North', unlock:'Warband of Brothers quest (Charr Homelands)',
    role:'Ranged damage', build:'Marksmanship + Expertise. Barrage or interrupt build.' },
  // Monks
  { name:'Ogden Stonehealer', prof:'Monk', campaign:'Eye of the North', unlock:'The Beginning of the End quest (automatic, early EotN)',
    role:'Healer/prot monk', build:'Healing or Protection + Divine Favor. Can run Unyielding Aura for fast resurrections.' },
  // Necromancers
  { name:'Livia', prof:'Necromancer', campaign:'Eye of the North', unlock:'Finding the Bloodstone quest (Tarnished Coast)',
    role:'Necromancer support', build:'Death Magic for MM, or Curses for SS/hexes. Third necromancer — allows MM + SS + BiP simultaneously.' },
  // Mesmers
  { name:'Gwen', prof:'Mesmer', campaign:'Eye of the North', unlock:'After watching The First Vision (early EotN)',
    role:'Shutdown/interrupt — one of the best heroes in the game', build:'Domination + Fast Casting. Panic or Energy Surge. Mesmer hero AI is excellent at interrupting.' },
  // Elementalists
  { name:'Vekk', prof:'Elementalist', campaign:'Eye of the North', unlock:'The Beginning of the End quest (automatic, early EotN)',
    role:'AoE spell damage', build:'Fire + Energy Storage for Searing Flames. Or Earth for utility.' },
  // Assassins
  { name:'Anton', prof:'Assassin', campaign:'Eye of the North', unlock:'The Assassin\'s Revenge quest (requires chain: The Missing Vanguard → Failure to Communicate → The Imploding Past)',
    role:'Melee spike damage', build:'Dagger Mastery + Critical Strikes. Combo chains. Glass cannon — needs healing support.' },
  // Ritualists
  { name:'Xandra', prof:'Ritualist', campaign:'Eye of the North', unlock:'Defeat her during The Norn Fighting Tournament (random appearance, optional)',
    role:'Spirit spammer or healer', build:'Channeling for SoS spirits, or Restoration for healing.' },
  // Paragons
  { name:'Hayda', prof:'Paragon', campaign:'Eye of the North', unlock:'Give Peace a Chance quest (requires Frogstomp first, Charr Homelands area)',
    role:'Party support', build:'Leadership + Command/Motivation. Second paragon for double shout coverage.' },
  // Dervishes
  { name:'Kahmu', prof:'Dervish', campaign:'Eye of the North', unlock:'Defeat him during The Norn Fighting Tournament (random appearance, optional)',
    role:'AoE melee', build:'Mysticism + Scythe Mastery. VoS build.' },

  // ── BEYOND / CROSS-CAMPAIGN ───────────────────────────────
  // Warriors
  { name:'Devona', prof:'Warrior', campaign:'Prophecies (Reforged Mode)', unlock:'Quest chain starting with Across the Wall (pre-Searing) or The Hero From Ascalon (Kryta). Requires Reforged Mode.',
    role:'Frontline melee', build:'Weapon mastery + Strength. Fourth warrior option. Requires Reforged Mode content.' },
  // Rangers
  { name:'Keiran Thackeray', prof:'Ranger', campaign:'Prophecies + Eye of the North', unlock:'Completion of War in Kryta + Hearts of the North quest chains (optional, endgame)',
    role:'Ranged damage', build:'Marksmanship + Expertise. Unlocked through lengthy quest chains.' },
  // Necromancers
  { name:'Olias', prof:'Necromancer', campaign:'Prophecies + Nightfall', unlock:'All for One and One for Justice quest (Kryta, optional)',
    role:'Minion master or hexer', build:'Same as Master of Whispers. Additional necromancer accessible from Prophecies.' },
  { name:'Ghost of Althea', prof:'Necromancer', campaign:'Prophecies (Reforged Mode)', unlock:'Quest chain starting with The Duke\'s Daughter. Requires Reforged Mode.',
    role:'Necromancer', build:'Death Magic or Curses. Requires Reforged Mode content.' },
  // Mesmers
  { name:'Miku', prof:'Mesmer', campaign:'Factions', unlock:'Completion of Winds of Change (Normal Mode) — challenging endgame quest chain',
    role:'Third mesmer hero for mesmerway', build:'Domination + Fast Casting. With Gwen + Norgu + Miku = triple-mesmer — strongest PvE hero composition.' },
  // Assassins
  { name:'Zenmai', prof:'Assassin', campaign:'Factions + Nightfall', unlock:'Chasing Zenmai quest (Kaineng City, optional)',
    role:'Melee spike', build:'Dagger Mastery + Critical Strikes. Second assassin option.' },
  // Ritualists
  { name:'Zei Ri', prof:'Ritualist', campaign:'Factions', unlock:'Completion of Winds of Change (Hard Mode) — very challenging endgame content',
    role:'Spirit spammer or healer', build:'Channeling or Restoration. Third ritualist. Requires HM Winds of Change.' },
  // Dervishes
  { name:'M.O.X.', prof:'Dervish', campaign:'Any campaign', unlock:'Talk to M.O.X. in North Kryta Province, Bukdek Byway, or Plains of Jarin (optional)',
    role:'AoE melee', build:'Mysticism + Scythe Mastery. VoS build. Available to all campaign owners.' },
];

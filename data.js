/* =============================================================
   data.js  —  Static lookup tables for Guild Wars 1
   Sources: wiki.guildwars.com (GNU FDL)
   ============================================================= */

// ── Professions ──────────────────────────────────────────────
const GW_PROFESSIONS = {
  0:  { name: 'Any',          abbr: '—'  },
  1:  { name: 'Warrior',      abbr: 'W'  },
  2:  { name: 'Ranger',       abbr: 'R'  },
  3:  { name: 'Monk',         abbr: 'Mo' },
  4:  { name: 'Necromancer',  abbr: 'N'  },
  5:  { name: 'Mesmer',       abbr: 'Me' },
  6:  { name: 'Elementalist', abbr: 'E'  },
  7:  { name: 'Assassin',     abbr: 'A'  },
  8:  { name: 'Ritualist',    abbr: 'Rt' },
  9:  { name: 'Paragon',      abbr: 'P'  },
  10: { name: 'Dervish',      abbr: 'D'  },
};

// ── Campaigns ─────────────────────────────────────────────────
const GW_CAMPAIGNS = {
  0: 'Core', 1: 'Prophecies', 2: 'Factions',
  3: 'Nightfall', 4: 'Eye of the North', 5: 'PvP',
};

// ── Attributes ────────────────────────────────────────────────
const GW_ATTRIBUTES = {
  0:'Fast Casting', 1:'Domination Magic', 2:'Illusion Magic', 3:'Inspiration Magic',
  4:'Blood Magic', 5:'Curses', 6:'Death Magic', 7:'Soul Reaping',
  8:'Communing', 9:'Restoration Magic', 10:'Channeling Magic', 11:'Spawning Power',
  12:'Air Magic', 13:'Earth Magic', 14:'Energy Storage', 15:'Fire Magic', 16:'Water Magic',
  17:'Divine Favor', 18:'Healing Prayers', 19:'Protection Prayers', 20:'Smiting Prayers',
  21:'Axe Mastery', 22:'Hammer Mastery', 23:'Strength', 24:'Swordsmanship', 25:'Tactics',
  26:'Beast Mastery', 27:'Expertise', 28:'Marksmanship', 29:'Wilderness Survival',
  30:'Critical Strikes', 31:'Dagger Mastery', 32:'Deadly Arts', 33:'Shadow Arts',
  34:'Command', 35:'Leadership', 36:'Motivation', 37:'Spear Mastery',
  38:'Earth Prayers', 39:'Mysticism', 40:'Scythe Mastery', 41:'Wind Prayers',
  101:'No Attribute',
};

// ── Skill types ───────────────────────────────────────────────
const GW_SKILL_TYPES = {
  0:'Other', 1:'Skill', 2:'Skill', 3:'Stance', 4:'Stance', 5:'Signet', 6:'Signet',
  7:'Enchantment Spell', 8:'Enchantment Spell', 9:'Touch Skill', 10:'Touch Skill',
  11:'Shout', 12:'Shout', 13:'Well Spell', 14:'Well Spell',
  15:'Preparation', 16:'Preparation', 17:'Trap', 18:'Trap', 19:'Glyph', 20:'Glyph',
  21:'Attack Skill', 22:'Attack Skill', 23:'Chant', 24:'Chant', 25:'Echo', 26:'Echo',
  27:'Hex Spell', 28:'Hex Spell', 29:'Spell', 30:'Spell',
  31:'Item Spell', 32:'Item Spell', 33:'Ward Spell', 34:'Ward Spell',
  35:'Binding Ritual', 36:'Binding Ritual', 37:'Nature Ritual', 38:'Nature Ritual',
  39:'Form', 40:'Form', 41:'Pet Attack', 42:'Pet Attack',
  43:'Ebon Vanguard Skill', 44:'Ebon Vanguard Skill',
  45:'Racial Skill', 46:'Racial Skill', 47:'Title Track Skill', 48:'Title Track Skill',
};

// ── Max armor rating per profession ──────────────────────────
// Source: wiki.guildwars.com/wiki/Armor_rating
const PROF_MAX_AR = {
  1: 80,   // Warrior
  2: 70,   // Ranger
  3: 60,   // Monk
  4: 60,   // Necromancer
  5: 60,   // Mesmer
  6: 60,   // Elementalist
  7: 70,   // Assassin
  8: 60,   // Ritualist
  9: 80,   // Paragon
  10: 70,  // Dervish
};

// Armor piece base AR values (as fraction of full set AR)
// Each piece: head=AR, chest=AR, arms=AR, legs=AR, feet=AR
// For a max set the total isn't summed — each piece has its own value that covers hits to that location
const ARMOR_PIECE_AR = { head: 1, chest: 1, arms: 1, legs: 1, feet: 1 }; // all same base AR

// Basic armor extra bonuses per profession & slot (non-insignia)
// Source: wiki.guildwars.com/wiki/Basic_armor
const BASIC_ARMOR_BONUS = {
  1:  { chest:'Armor +20 vs. Physical', },
  2:  { chest:'Energy +5', legs:'Energy recovery +1', feet:'Armor +30 vs. Elemental' },
  3:  { chest:'Energy +5', arms:'Energy +5', legs:'Energy recovery +1', feet:'Energy recovery +1' },
  4:  { chest:'Energy +5', arms:'Energy +5', legs:'Energy recovery +1', feet:'Energy recovery +1' },
  5:  { chest:'Energy +5', arms:'Energy +5', legs:'Energy recovery +1', feet:'Energy recovery +1' },
  6:  { chest:'Energy +5', arms:'Energy +5', legs:'Energy recovery +1', feet:'Energy recovery +1' },
  7:  { chest:'Energy +5', legs:'Energy recovery +1', feet:'Energy recovery +1' },
  8:  { chest:'Energy +5', arms:'Energy +5', legs:'Energy recovery +1', feet:'Energy recovery +1' },
  9:  { chest:'Energy +5', arms:'Energy +5' },
  10: { chest:'Health +25', legs:'Energy +5', feet:'Energy recovery +1' },
};

// ── Weapons ───────────────────────────────────────────────────
// Source: wiki.guildwars.com/wiki/Weapon
const WEAPON_TYPES = [
  // Martial Melee
  { id:'axe',    name:'Axe',    profs:[1],     hands:1, dmgMin:6,  dmgMax:28, speed:1.33, dmgType:'Slashing', category:'melee', mastery:'Axe Mastery'     },
  { id:'sword',  name:'Sword',  profs:[1],     hands:1, dmgMin:15, dmgMax:22, speed:1.33, dmgType:'Slashing', category:'melee', mastery:'Swordsmanship'   },
  { id:'hammer', name:'Hammer', profs:[1],     hands:2, dmgMin:19, dmgMax:35, speed:1.75, dmgType:'Blunt',    category:'melee', mastery:'Hammer Mastery'  },
  { id:'daggers',name:'Daggers',profs:[7],     hands:2, dmgMin:7,  dmgMax:17, speed:1.33, dmgType:'Piercing', category:'melee', mastery:'Dagger Mastery',
    notes:'2% double-strike chance per Dagger Mastery rank' },
  { id:'scythe', name:'Scythe', profs:[10],    hands:2, dmgMin:9,  dmgMax:41, speed:1.50, dmgType:'Slashing', category:'melee', mastery:'Scythe Mastery',
    notes:'Hits up to 2 additional adjacent foes' },
  // Martial Ranged
  { id:'flatbow',    name:'Flatbow',     profs:[2], hands:2, dmgMin:15, dmgMax:28, speed:2.0, dmgType:'Piercing', category:'ranged', mastery:'Marksmanship', range:'Long', notes:'High arc' },
  { id:'hornbow',    name:'Hornbow',     profs:[2], hands:2, dmgMin:15, dmgMax:28, speed:2.7, dmgType:'Piercing', category:'ranged', mastery:'Marksmanship', range:'Long', notes:'10% armor penetration, medium arc' },
  { id:'longbow',    name:'Longbow',     profs:[2], hands:2, dmgMin:15, dmgMax:28, speed:2.4, dmgType:'Piercing', category:'ranged', mastery:'Marksmanship', range:'Long', notes:'Medium arc' },
  { id:'recurve',   name:'Recurve Bow', profs:[2], hands:2, dmgMin:15, dmgMax:28, speed:2.4, dmgType:'Piercing', category:'ranged', mastery:'Marksmanship', range:'Long', notes:'Low arc, fast flight time' },
  { id:'shortbow',  name:'Shortbow',    profs:[2], hands:2, dmgMin:15, dmgMax:28, speed:2.0, dmgType:'Piercing', category:'ranged', mastery:'Marksmanship', range:'Short', notes:'Medium arc, shortest range' },
  { id:'spear',  name:'Spear',  profs:[9],     hands:1, dmgMin:14, dmgMax:27, speed:1.5, dmgType:'Piercing', category:'ranged', mastery:'Spear Mastery', range:'Medium' },
  // Caster
  { id:'staff',  name:'Staff',  profs:[3,4,5,6,8], hands:2, dmgMin:11, dmgMax:22, speed:1.75, dmgType:'Varies', category:'caster', mastery:null,
    notes:'Damage scales with attacker level, not attribute. +5-10 energy, 10-20% HSR' },
  { id:'wand',   name:'Wand',   profs:[3,4,5,6,8], hands:1, dmgMin:11, dmgMax:22, speed:1.75, dmgType:'Varies', category:'caster', mastery:null,
    notes:'Damage scales with attacker level, not attribute' },
];

// Off-hand items
const OFFHAND_TYPES = [
  { id:'none',    name:'None',                profs:'all' },
  { id:'shield',  name:'Shield (max +16 AL)', profs:[1,2,9,10,7],  arBonus:16, notes:'Requires 9 of linked attribute. +AR vs. damage types' },
  { id:'focus',   name:'Focus Item',          profs:[3,4,5,6,8],  notes:'+12 energy or other cast bonuses typical' },
];

// ── Weapon inscriptions / damage mods ────────────────────────
// Source: wiki.guildwars.com — verified numbers
// Inscriptions are suffix mods that increase BASE DAMAGE by a %
const WEAPON_MODS = [
  { id:'none',   name:'None',                                      mult:1.00, cond:'', effect:'' },
  { id:'s&h',    name:'"Strength and Honor" +15% (>50% HP)',        mult:1.15, cond:'Health above 50%', effect:'' },
  { id:'gbf',    name:'"Guided by Fate" +15% (Enchanted)',          mult:1.15, cond:'While enchanted', effect:'' },
  { id:'dwd',    name:'"Dance with Death" +15% (in Stance)',        mult:1.15, cond:'While in a stance', effect:'' },
  { id:'ttp',    name:'"To the Pain!" +15% (Armor -10)',            mult:1.15, cond:'Always (you lose 10 AR)', effect:'You have -10 armor while attacking' },
  { id:'bob',    name:'"Brawn over Brains" +15% (Energy -5)',       mult:1.15, cond:'Always (you lose 5 max energy)', effect:'-5 max energy' },
  { id:'tmi',    name:'"Too Much Information" +15% vs Hexed',       mult:1.15, cond:'vs Hexed foes only', effect:'' },
  { id:'vim',    name:'"Vengeance is Mine" +20% (<50% HP)',         mult:1.20, cond:'Health below 50%', effect:'' },
  { id:'dftr',   name:'"Don\'t Fear the Reaper" +20% (while Hexed)',mult:1.20, cond:'While you are hexed', effect:'' },
];

// Weapon PREFIX mods (mutually exclusive with each other on a weapon)
// These are separate from inscriptions and have fixed per-hit effects
// Source: wiki.guildwars.com/wiki/Vamp, wiki.guildwars.com/wiki/Zealous_Bow_String
const WEAPON_PREFIX_MODS = [
  { id:'none',      name:'None',        effect:'', hpPerHit:0, energyPerHit:0, hpDegen:0, energyDegen:0 },
  { id:'vampiric',  name:'Vampiric',    effect:'Steal 1-5 HP per hit (armor-ignoring life steal). -1 pip HP regen (-2 HP/sec).', hpPerHit:3, energyPerHit:0, hpDegen:-2, energyDegen:0 },
  { id:'zealous',   name:'Zealous',     effect:'+1 energy per hit. -1 pip energy regen (-1/3 energy/sec).', hpPerHit:0, energyPerHit:1, hpDegen:0, energyDegen:-0.33 },
  { id:'sundering', name:'Sundering',   effect:'10-20% chance of 20% armor penetration per hit.', hpPerHit:0, energyPerHit:0, hpDegen:0, energyDegen:0 },
  { id:'furious',   name:'Furious',     effect:'1-10% chance of double adrenaline on hit.', hpPerHit:0, energyPerHit:0, hpDegen:0, energyDegen:0 },
  { id:'fiery',     name:'Fiery',       effect:'Converts physical damage to fire damage.', hpPerHit:0, energyPerHit:0, hpDegen:0, energyDegen:0 },
  { id:'icy',       name:'Icy',         effect:'Converts physical damage to cold damage.', hpPerHit:0, energyPerHit:0, hpDegen:0, energyDegen:0 },
  { id:'shocking',  name:'Shocking',    effect:'Converts physical damage to lightning damage.', hpPerHit:0, energyPerHit:0, hpDegen:0, energyDegen:0 },
  { id:'ebon',      name:'Ebon',        effect:'Converts physical damage to earth damage.', hpPerHit:0, energyPerHit:0, hpDegen:0, energyDegen:0 },
];

// Shield inscriptions
const SHIELD_MODS = [
  { id:'none',     name:'None',                        arBonus:0 },
  { id:'rfyl',     name:'"Run For Your Life!" -2 dmg (Stance)',   dmgReduce:2, cond:'Stance' },
  { id:'im',       name:'"I\'m Unstoppable!" -2 dmg',             dmgReduce:2 },
  { id:'wd',       name:'while vs. X damage type +AR',            arBonus:10 },
];

// ── Runes ────────────────────────────────────────────────────
// Source: wiki.guildwars.com/wiki/Rune
const RUNES_UNIVERSAL = [
  { id:'none',       name:'— None —',                      hpDelta:0, effect:'' },
  // Vigor
  { id:'vigor_min',  name:'Rune of Minor Vigor (+30 HP)',  hpDelta:30,  effect:'+30 Health' },
  { id:'vigor_maj',  name:'Rune of Major Vigor (+41 HP)',  hpDelta:41,  effect:'+41 Health' },
  { id:'vigor_sup',  name:'Rune of Superior Vigor (+50 HP)',hpDelta:50, effect:'+50 Health' },
  // Attunement
  { id:'attune',     name:'Rune of Attunement (+2 Energy)', hpDelta:0,  effect:'+2 Energy' },
  // Vitae
  { id:'vitae',      name:'Rune of Vitae (+10 HP)',         hpDelta:10, effect:'+10 Health (stackable)' },
  // Condition reducers
  { id:'clarity',    name:'Rune of Clarity (-20% Blind/Weakness)', hpDelta:0, effect:'-20% Blind & Weakness duration' },
  { id:'purity',     name:'Rune of Purity (-20% Disease/Poison)',  hpDelta:0, effect:'-20% Disease & Poison duration' },
  { id:'recovery',   name:'Rune of Recovery (-20% Dazed/Deep Wound)',hpDelta:0,effect:'-20% Dazed & Deep Wound duration' },
  { id:'restoration',name:'Rune of Restoration (-20% Bleed/Cripple)',hpDelta:0,effect:'-20% Bleeding & Crippled duration' },
];

const RUNES_ATTR = [
  { id:'none',   name:'— None —',         bonus:0, hpDelta:0 },
  { id:'minor',  name:'Minor +1 Attr',    bonus:1, hpDelta:0,   label:'Minor' },
  { id:'major',  name:'Major +2 Attr (HP -35)',  bonus:2, hpDelta:-35, label:'Major' },
  { id:'superior',name:'Superior +3 Attr (HP -75)',bonus:3,hpDelta:-75,label:'Superior'},
];

// Special: Warrior Absorption
const RUNES_WARRIOR_ABSORB = [
  { id:'none',      name:'— None —',                   dmgReduce:0, hpDelta:0  },
  { id:'abs_min',   name:'Minor Absorption (phys -1)',  dmgReduce:1, hpDelta:0  },
  { id:'abs_maj',   name:'Major Absorption (phys -2)',  dmgReduce:2, hpDelta:0  },
  { id:'abs_sup',   name:'Superior Absorption (phys -3)',dmgReduce:3,hpDelta:0  },
];

// ── Insignias ─────────────────────────────────────────────────
// Source: wiki.guildwars.com/wiki/Insignias
// grouped by profession; 0 = universal
const INSIGNIAS = {
  // Universal
  0: [
    { id:'none',      name:'— None —',      effect:'' },
    { id:'survivor',  name:'Survivor',       effect:'+15/+10/+5 HP by slot' },
    { id:'radiant',   name:'Radiant',        effect:'+3/+2/+1 Energy by slot' },
    { id:'stalwart',  name:'Stalwart',       arBonus:10, cond:'vs. Physical',   effect:'Armor +10 vs. Physical' },
    { id:'brawlers',  name:"Brawler's",      arBonus:10, cond:'while Attacking',effect:'Armor +10 while attacking' },
    { id:'blessed',   name:'Blessed',        arBonus:10, cond:'Enchanted',      effect:'Armor +10 while Enchanted' },
    { id:'heralds',   name:"Herald's",       arBonus:10, cond:'Holding Item',   effect:'Armor +10 while holding item' },
    { id:'sentrys',   name:"Sentry's",       arBonus:10, cond:'Stance',         effect:'Armor +10 while in Stance' },
  ],
  1: [ // Warrior
    { id:'dreadnought',name:'Dreadnought',   arBonus:10, cond:'vs. Elemental',  effect:'Armor +10 vs. Elemental' },
    { id:'knights',    name:"Knight's",      dmgReduce:3, effect:'Received physical damage -3' },
    { id:'sentinel',   name:"Sentinel's",    arBonus:20, cond:'vs. Elemental (req 13 Str)', effect:'Armor +20 vs. Elemental (req 13 Str)' },
    { id:'stonefist',  name:'Stonefist',      effect:'+1 second knockdown time' },
    { id:'lieutenant', name:"Lieutenant's",  arBonus:-20,effect:'Armor -20, Hex durations -20%, damage -5%' },
  ],
  2: [ // Ranger
    { id:'frostbound', name:'Frostbound',    arBonus:15, cond:'vs. Cold',      effect:'Armor +15 vs. Cold' },
    { id:'pyrebound',  name:'Pyrebound',     arBonus:15, cond:'vs. Fire',      effect:'Armor +15 vs. Fire' },
    { id:'scouts',     name:"Scout's",       arBonus:10, cond:'Preparation',   effect:'Armor +10 while Preparation active' },
    { id:'stormbound', name:'Stormbound',    arBonus:15, cond:'vs. Lightning', effect:'Armor +15 vs. Lightning' },
    { id:'earthbound', name:'Earthbound',    arBonus:15, cond:'vs. Earth',     effect:'Armor +15 vs. Earth' },
    { id:'beastmaster',name:"Beastmaster's", arBonus:10, cond:'Pet alive',     effect:'Armor +10 while pet is alive' },
  ],
  3: [ // Monk
    { id:'wanderers',  name:"Wanderer's",    arBonus:10, cond:'vs. Elemental', effect:'Armor +10 vs. Elemental' },
    { id:'disciples',  name:"Disciple's",    arBonus:15, cond:'Conditioned',   effect:'Armor +15 while Conditioned' },
    { id:'anchorites', name:"Anchorite's",   arBonus:15, cond:'Recharging skills',effect:'Up to Armor +15 while recharging skills' },
  ],
  4: [ // Necromancer
    { id:'blighters',  name:"Blighter's",    arBonus:20, cond:'Hexed',         effect:'Armor +20 while Hexed' },
    { id:'bloodstained',name:'Bloodstained', effect:'-25% cast time on corpse-exploiting spells' },
    { id:'bonelace',   name:'Bonelace',      arBonus:15, cond:'vs. Piercing',  effect:'Armor +15 vs. Piercing' },
    { id:'minionmaster',name:"Minion Master's",arBonus:15,cond:'5+ Minions',   effect:'Up to Armor +15 based on minion count' },
    { id:'tormentors', name:"Tormentor's",   arBonus:10, effect:'Armor +10, Holy damage received +2-6' },
    { id:'undertakers', name:"Undertaker's", arBonus:20, cond:'Low HP',        effect:'Up to Armor +20 based on missing HP' },
  ],
  5: [ // Mesmer
    { id:'virtuosos',  name:"Virtuoso's",    arBonus:15, cond:'Activating skills', effect:'Armor +15 while activating skills' },
    { id:'artificers', name:"Artificer's",   arBonus:15, cond:'Signets equipped',  effect:'Armor +3 per equipped Signet' },
    { id:'prodigys',   name:"Prodigy's",     arBonus:15, cond:'Recharging skills', effect:'Up to Armor +15 while recharging skills' },
  ],
  6: [ // Elementalist
    { id:'aeromancer', name:'Aeromancer',    arBonus:20, cond:'vs. Ele+Lightning', effect:'Armor +10 vs. Elemental, +10 vs. Lightning' },
    { id:'geomancer',  name:'Geomancer',     arBonus:20, cond:'vs. Ele+Earth',     effect:'Armor +10 vs. Elemental, +10 vs. Earth' },
    { id:'hydromancer',name:'Hydromancer',   arBonus:20, cond:'vs. Ele+Cold',      effect:'Armor +10 vs. Elemental, +10 vs. Cold' },
    { id:'pyromancer', name:'Pyromancer',    arBonus:20, cond:'vs. Ele+Fire',      effect:'Armor +10 vs. Elemental, +10 vs. Fire' },
    { id:'prismatic',  name:'Prismatic',     arBonus:20, cond:'req 9 in each',     effect:'Armor +5 per attribute 9+ (up to +20)' },
  ],
  7: [ // Assassin
    { id:'infiltrators',name:"Infiltrator's",arBonus:20, cond:'vs. Phys+Pierce',  effect:'Armor +10 vs. Physical, +10 vs. Piercing' },
    { id:'nightstalker',name:"Nightstalker's",arBonus:15,cond:'Attacking',        effect:'Armor +15 while attacking' },
    { id:'saboteurs',  name:"Saboteur's",    arBonus:20, cond:'vs. Phys+Slash',   effect:'Armor +10 vs. Physical, +10 vs. Slashing' },
    { id:'vanguards',  name:"Vanguard's",    arBonus:20, cond:'vs. Phys+Blunt',   effect:'Armor +10 vs. Physical, +10 vs. Blunt' },
  ],
  8: [ // Ritualist
    { id:'ghost_forge',name:'Ghost Forge',   arBonus:15, cond:'Weapon Spell',     effect:'Armor +15 while affected by Weapon Spell' },
    { id:'mystics',    name:"Mystic's",      arBonus:15, cond:'Activating skills', effect:'Armor +15 while activating skills' },
    { id:'shamans',    name:"Shaman's",      arBonus:15, cond:'3+ Spirits',        effect:'Up to Armor +15 based on spirit count' },
  ],
  9: [ // Paragon
    { id:'centurions', name:"Centurion's",   arBonus:10, cond:'Shout/Echo/Chant', effect:'Armor +10 while affected by Shout/Echo/Chant' },
  ],
  10: [ // Dervish
    { id:'forsaken',   name:'Forsaken',      arBonus:10, cond:'No Enchantment',   effect:'Armor +10 while not Enchanted' },
    { id:'windwalker', name:'Windwalker',    arBonus:20, cond:'4 Enchantments',   effect:'Up to Armor +20 based on Enchantment count' },
  ],
};

// ── Attribute → profession mapping ───────────────────────────
const ATTR_TO_PROF = {
  0:5, 1:5, 2:5, 3:5,
  4:4, 5:4, 6:4, 7:4,
  8:8, 9:8, 10:8, 11:8,
  12:6, 13:6, 14:6, 15:6, 16:6,
  17:3, 18:3, 19:3, 20:3,
  21:1, 22:1, 23:1, 24:1, 25:1,
  26:2, 27:2, 28:2, 29:2,
  30:7, 31:7, 32:7, 33:7,
  34:9, 35:9, 36:9, 37:9,
  38:10, 39:10, 40:10, 41:10,
  101:0,
};

// Attribute rank → strike level multiplier table (level 20)
// Source: wiki.guildwars.com/wiki/Damage_calculation
const ATTR_DMG_PERCENT = {
  0:0.356, 1:0.386, 2:0.420, 3:0.459, 4:0.500, 5:0.545, 6:0.595,
  7:0.648, 8:0.707, 9:0.771, 10:0.841, 11:0.917, 12:1.000,
  13:1.035, 14:1.072, 15:1.110, 16:1.149
};

// ── Armor class groupings ─────────────────────────────────────
// Heavy = Warrior, Paragon  |  Medium = Ranger, Assassin, Dervish
// Light = Monk, Necro, Mesmer, Ele, Ritualist
const ARMOR_CLASS = {
  1:'heavy', 9:'heavy',
  2:'medium', 7:'medium', 10:'medium',
  3:'light', 4:'light', 5:'light', 6:'light', 8:'light',
};

// ── Armor tier sets ───────────────────────────────────────────
// Each tier: { name, ar, campaign, notes }
// AR = per-piece armor rating (all 5 pieces have the same base AR for that set)
// Source: wiki.guildwars.com/wiki/Armor, wiki.guildwars.com/wiki/Armor_rating
// Acquisition notes summarized from wiki armorer articles
const ARMOR_TIERS = {
  // ── HEAVY (Warrior AR 80, Paragon AR 80) ──────────────────
  heavy: [
    { id:'starter',    name:'Starter / Ringmail (AR 20)',    ar:20,  campaign:'Core',        notes:'Given at character creation (Prophecies/Factions starter)' },
    { id:'ascalon_35', name:'Ascalon AR 35',                  ar:35,  campaign:'Prophecies',  notes:'Ascalon City (Banoit) — earliest crafted upgrade' },
    { id:'ascalon_50', name:'Ascalon AR 50',                  ar:50,  campaign:'Prophecies',  notes:'Ascalon City (Corwen) / Yak\'s Bend (Breyshaw)' },
    { id:'krytan_59',  name:'Krytan / Lion\'s Arch AR 59',    ar:59,  campaign:'Prophecies',  notes:'Bergen Hot Springs / Lion\'s Arch / Beetletun — pre-jungle tier' },
    { id:'jungle_65',  name:'Jungle / Ventari\'s Refuge AR 65', ar:65, campaign:'Prophecies', notes:'Ventari\'s Refuge / Henge of Denravi' },
    { id:'ring_71',    name:'Stingray / Ring of Fire AR 71',  ar:71,  campaign:'Prophecies',  notes:'Stingray Strand / Amnoon Oasis — last pre-max tier' },
    { id:'tyrian_max', name:'Tyrian Max Armor (AR 80)',       ar:80,  campaign:'Prophecies',  notes:'Droknar\'s Forge — first max-AR location in Prophecies' },
    { id:'factions_max',name:'Canthan Max Armor (AR 80)',     ar:80,  campaign:'Factions',    notes:'Kaineng Center armorers' },
    { id:'nf_max',     name:'Elonian Max Armor (AR 80)',      ar:80,  campaign:'Nightfall',   notes:'Consulate Docks and beyond' },
    { id:'elite_15k',  name:'Elite / 15k Armor (AR 80)',      ar:80,  campaign:'Any',         notes:'End-game crafters; same AR as max, prestige appearance. ~15p/piece' },
    { id:'obsidian',   name:'Obsidian / FoW Armor (AR 80)',   ar:80,  campaign:'Core (FoW)',  notes:'Eternal Forgemaster, Fissure of Woe. Most expensive — Ecto + Obsidian Shards' },
  ],
  // ── MEDIUM (Ranger AR 70, Assassin AR 70, Dervish AR 70) ──
  medium: [
    { id:'starter',    name:'Starter (AR 10)',                ar:10,  campaign:'Core',        notes:'Given at character creation' },
    { id:'ascalon_30', name:'Ascalon AR 30',                  ar:30,  campaign:'Prophecies',  notes:'Ascalon City — earliest crafted upgrade' },
    { id:'ascalon_42', name:'Ascalon AR 42',                  ar:42,  campaign:'Prophecies',  notes:'Ascalon City / Yak\'s Bend' },
    { id:'krytan_51',  name:'Krytan / Lion\'s Arch AR 51',    ar:51,  campaign:'Prophecies',  notes:'Bergen Hot Springs / Lion\'s Arch' },
    { id:'jungle_57',  name:'Jungle AR 57',                   ar:57,  campaign:'Prophecies',  notes:'Ventari\'s Refuge / Henge of Denravi' },
    { id:'ring_62',    name:'Ring of Fire AR 62',             ar:62,  campaign:'Prophecies',  notes:'Stingray Strand / Amnoon Oasis' },
    { id:'tyrian_max', name:'Tyrian Max Armor (AR 70)',       ar:70,  campaign:'Prophecies',  notes:'Droknar\'s Forge' },
    { id:'factions_max',name:'Canthan Max Armor (AR 70)',     ar:70,  campaign:'Factions',    notes:'Kaineng Center' },
    { id:'nf_max',     name:'Elonian Max Armor (AR 70)',      ar:70,  campaign:'Nightfall',   notes:'Consulate Docks and beyond' },
    { id:'elite_15k',  name:'Elite / 15k Armor (AR 70)',      ar:70,  campaign:'Any',         notes:'End-game crafters; prestige skin, same stats as max. ~15p/piece' },
    { id:'obsidian',   name:'Obsidian / FoW Armor (AR 70)',   ar:70,  campaign:'Core (FoW)',  notes:'Eternal Forgemaster, Fissure of Woe' },
  ],
  // ── LIGHT (Monk/Necro/Mesmer/Ele/Ritualist AR 60) ─────────
  light: [
    { id:'starter',    name:'Starter (AR 5)',                 ar:5,   campaign:'Core',        notes:'Given at character creation (basic robes)' },
    { id:'ascalon_20', name:'Ascalon AR 20',                  ar:20,  campaign:'Prophecies',  notes:'Ascalon City — earliest crafted upgrade' },
    { id:'ascalon_32', name:'Ascalon AR 32',                  ar:32,  campaign:'Prophecies',  notes:'Ascalon City / Yak\'s Bend' },
    { id:'krytan_42',  name:'Krytan / Lion\'s Arch AR 42',    ar:42,  campaign:'Prophecies',  notes:'Bergen Hot Springs / Lion\'s Arch' },
    { id:'jungle_48',  name:'Jungle AR 48',                   ar:48,  campaign:'Prophecies',  notes:'Ventari\'s Refuge / Henge of Denravi' },
    { id:'ring_52',    name:'Ring of Fire AR 52',             ar:52,  campaign:'Prophecies',  notes:'Stingray Strand / Amnoon Oasis' },
    { id:'tyrian_max', name:'Tyrian Max Armor (AR 60)',       ar:60,  campaign:'Prophecies',  notes:'Droknar\'s Forge' },
    { id:'factions_max',name:'Canthan Max Armor (AR 60)',     ar:60,  campaign:'Factions',    notes:'Kaineng Center' },
    { id:'nf_max',     name:'Elonian Max Armor (AR 60)',      ar:60,  campaign:'Nightfall',   notes:'Consulate Docks and beyond' },
    { id:'elite_15k',  name:'Elite / 15k Armor (AR 60)',      ar:60,  campaign:'Any',         notes:'End-game crafters; prestige skin, same stats as max. ~15p/piece' },
    { id:'obsidian',   name:'Obsidian / FoW Armor (AR 60)',   ar:60,  campaign:'Core (FoW)',  notes:'Eternal Forgemaster, Fissure of Woe' },
  ],
};

// ── Template decoder — attribute ID mapping ───────────────────
// The skill template uses a DIFFERENT attribute index than our GW_ATTRIBUTES!
// Source: wiki.guildwars.com/wiki/Skill_template_format
const TEMPLATE_ATTR_INDEX = {
  0:'Fast Casting', 1:'Illusion Magic', 2:'Domination Magic', 3:'Inspiration Magic',
  4:'Blood Magic', 5:'Death Magic', 6:'Soul Reaping', 7:'Curses',
  8:'Air Magic', 9:'Earth Magic', 10:'Fire Magic', 11:'Water Magic',
  12:'Energy Storage', 13:'Healing Prayers', 14:'Smiting Prayers',
  15:'Protection Prayers', 16:'Divine Favor',
  17:'Strength', 18:'Axe Mastery', 19:'Hammer Mastery', 20:'Swordsmanship', 21:'Tactics',
  22:'Beast Mastery', 23:'Expertise', 24:'Wilderness Survival', 25:'Marksmanship',
  29:'Dagger Mastery', 30:'Deadly Arts', 31:'Shadow Arts',
  32:'Communing', 33:'Restoration Magic', 34:'Channeling Magic',
  35:'Critical Strikes', 36:'Spawning Power',
  37:'Spear Mastery', 38:'Command', 39:'Motivation', 40:'Leadership',
  41:'Scythe Mastery', 42:'Wind Prayers', 43:'Earth Prayers', 44:'Mysticism',
};

// Template profession index (also different numbering than GW_PROFESSIONS for the codec)
// 0=None, 1=Warrior, 2=Ranger, 3=Monk, 4=Necromancer, 5=Mesmer, 6=Elementalist,
// 7=Assassin, 8=Ritualist, 9=Paragon, 10=Dervish
// Matches GW_PROFESSIONS — no remapping needed.

// GW uses a custom Base64 alphabet: standard A-Z a-z 0-9 + /
// (same as RFC 4648 standard Base64 — confirmed from fandom wiki Equipment_Template_format)
const GW_B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Profession build recommendations moved to recommendations.js

// ── Attribute bonus descriptions ──────────────────────────────
// Each primary attribute and some secondary attributes have inherent bonuses
// that scale with rank. Format: { desc: 'description template', calc: function(rank) => string }
// Source: wiki.guildwars.com (GNU FDL)
var ATTR_BONUSES = {
  // ── PRIMARY ATTRIBUTES (verified from wiki.guildwars.com) ────────────
  // These have confirmed inherent bonuses that scale with rank.
  'Strength':         { desc: 'Each rank gives 1% armor penetration on all attack skills', calc: r => `${r}% armor penetration` },
  'Expertise':        { desc: 'Reduces energy cost of attack skills, rituals, touch skills, and binding rituals by ~4% per rank', calc: r => `~${Math.round(r * 4)}% energy cost reduction` },
  'Divine Favor':     { desc: 'Flat bonus healing added to every Monk spell that targets an ally (3.2 × rank)', calc: r => `+${Math.round(3.2 * r)} bonus healing per spell` },
  'Soul Reaping':     { desc: 'Gain energy whenever a non-spirit creature near you dies (5-second cooldown between triggers)', calc: r => `+${r} energy per nearby death` },
  'Fast Casting':     { desc: 'All spells and signets activate faster, including secondary profession skills (3% per rank)', calc: r => `${Math.round(r * 3)}% faster activation` },
  'Energy Storage':   { desc: 'Directly increases your maximum energy pool by 3 per rank', calc: r => `+${r * 3} max energy (${20 + r*3} total base)` },
  'Critical Strikes': { desc: 'Increases critical hit chance by 1% per rank and grants 1 energy on each critical hit', calc: r => `+${r}% crit chance, +1 energy per crit` },
  'Spawning Power':   { desc: 'Spirits have 4% more HP per rank and weapon spells last ~2% longer per rank', calc: r => `+${r * 4}% spirit HP, +${Math.round(r * 2)}% weapon spell duration` },
  'Leadership':       { desc: 'Gain energy for each ally in earshot affected by your shouts/chants (2 energy per ally at high ranks, caps around 6)', calc: r => `+${Math.min(2, Math.floor(r / 5) + 1)} energy per ally affected` },
  'Mysticism':        { desc: 'Gain health and energy every time an enchantment ends on you', calc: r => `+${r} HP, +${Math.floor(r / 3)} energy per enchantment end` },

  // ── WEAPON MASTERY ATTRIBUTES (verified damage % from wiki damage calc) ──
  'Axe Mastery':      { desc: 'Increases axe damage (6-28 slashing, 1-handed, high variance)', calc: r => `${Math.round((ATTR_DMG_PERCENT[Math.min(r,16)] || 1)*100)}% of base damage` },
  'Hammer Mastery':   { desc: 'Increases hammer damage (19-35 blunt, 2-handed, knockdown skills)', calc: r => `${Math.round((ATTR_DMG_PERCENT[Math.min(r,16)] || 1)*100)}% of base damage` },
  'Swordsmanship':    { desc: 'Increases sword damage (15-22 slashing, 1-handed, consistent range)', calc: r => `${Math.round((ATTR_DMG_PERCENT[Math.min(r,16)] || 1)*100)}% of base damage` },
  'Dagger Mastery':   { desc: 'Increases dagger damage (7-17 piercing, 2-handed) and gives 2% double-strike chance per rank', calc: r => `${Math.round((ATTR_DMG_PERCENT[Math.min(r,16)] || 1)*100)}% dmg, ${r*2}% double-strike` },
  'Marksmanship':     { desc: 'Increases bow damage (15-28 piercing, all bow types)', calc: r => `${Math.round((ATTR_DMG_PERCENT[Math.min(r,16)] || 1)*100)}% of base damage` },
  'Spear Mastery':    { desc: 'Increases spear damage (14-27 piercing, 1-handed ranged, allows shield)', calc: r => `${Math.round((ATTR_DMG_PERCENT[Math.min(r,16)] || 1)*100)}% of base damage` },
  'Scythe Mastery':   { desc: 'Increases scythe damage (9-41 slashing, hits up to 3 adjacent foes)', calc: r => `${Math.round((ATTR_DMG_PERCENT[Math.min(r,16)] || 1)*100)}% of base damage (×3 targets)` },
  'Beast Mastery':    { desc: 'Increases pet damage and gives 2% pet critical hit chance per rank', calc: r => `${Math.round((ATTR_DMG_PERCENT[Math.min(r,16)] || 1)*100)}% pet damage, ${r*2}% pet crit` },

  // ── CONFIRMED SPECIFIC MECHANIC ──
  'Death Magic':      { desc: 'Determines minion count cap (rank/2 + 2, max 10), minion HP, and corpse exploit/well effectiveness', calc: r => `Max ${Math.min(Math.floor(r/2) + 2, 10)} minions active` },

  // ── NON-PRIMARY ATTRIBUTES (no inherent bonus — just scales skills) ──
  // These don't have a single universal formula; each skill scales individually.
  // The actual per-skill values are visible in the skill tooltip via the A...B...C resolution.
  'Tactics':          { desc: 'Improves defensive shouts, shield requirement, and Healing Signet strength', calc: r => `Defensive shouts and shields scale with this attribute` },
  'Wilderness Survival': { desc: 'Improves traps, preparations, and nature rituals', calc: r => `Traps deal more damage, preparations and rituals last longer` },
  'Deadly Arts':      { desc: 'Improves lead/off-hand combo damage, shadow damage, and poison effects', calc: r => `Combo attacks and shadow damage spells hit harder` },
  'Shadow Arts':      { desc: 'Improves shadow steps, self-heals, and defensive skill durations', calc: r => `Shadow steps go further, self-heals recover more` },
  'Communing':        { desc: 'Improves defensive spirit HP, damage absorption, and duration', calc: r => `Defensive spirits last longer and absorb more damage` },
  'Restoration Magic':{ desc: 'Improves healing amounts, condition removal, and weapon spell strength', calc: r => `Healing spells heal more, weapon spells are stronger` },
  'Channeling Magic': { desc: 'Improves offensive spirit damage, lightning spells, and Painful Bond', calc: r => `Offensive spirits hit harder, lightning spells deal more` },
  'Air Magic':        { desc: 'Lightning damage with innate 25% armor pen on some spells, speed buffs, Cracked Armor', calc: r => `Lightning spells deal more damage with built-in armor penetration` },
  'Earth Magic':      { desc: 'Earth damage, personal armor enchantments, wards, and knockdown skills', calc: r => `Armor enchantments give more AR, wards cover larger area` },
  'Fire Magic':       { desc: 'Highest AoE damage element, applies Burning (-7 HP/s degen)', calc: r => `Fire spells deal more damage, Burning lasts longer` },
  'Water Magic':      { desc: 'Cold damage with built-in movement slow on most spells', calc: r => `Cold spells deal more and slows last longer` },
  'Healing Prayers':  { desc: 'Direct healing spell amounts', calc: r => `All healing spells restore more HP` },
  'Protection Prayers':{ desc: 'Damage prevention, barriers, and block durations', calc: r => `Protection spells prevent more damage and last longer` },
  'Smiting Prayers':  { desc: 'Holy damage (armor-ignoring vs undead) and retribution effects', calc: r => `Holy damage increases, extra effective against undead` },
  'Blood Magic':      { desc: 'Life-stealing amounts, sacrifice-based effects, and ally energy support', calc: r => `Life steal and sacrifice spells scale in power` },
  'Curses':           { desc: 'Hex damage/duration and condition application strength', calc: r => `Hexes deal more damage and conditions last longer` },
  'Domination Magic': { desc: 'Armor-ignoring damage, energy drain, and interrupt bonus damage', calc: r => `Damage spells and energy drains scale in power` },
  'Illusion Magic':   { desc: 'Anti-attacker hex damage, blind duration, and degeneration', calc: r => `Anti-attack hexes deal more, blind lasts longer` },
  'Inspiration Magic':{ desc: 'Energy gained from interrupts, enchantment removal, and passive drains', calc: r => `Energy management skills return more energy` },
  'Command':          { desc: 'Shout armor buffs, party buff durations, and offensive orders', calc: r => `Party armor shouts give more protection` },
  'Motivation':       { desc: 'Healing from shouts/chants and party regeneration', calc: r => `Shout-based healing restores more HP to allies` },
  'Earth Prayers':    { desc: 'Self-healing enchantments and earth damage', calc: r => `Self-heals restore more, earth enchantments last longer` },
  'Wind Prayers':     { desc: 'Movement speed buffs, cold damage, and enchantment stripping', calc: r => `Speed buffs move faster, cold attacks hit harder` },
};

// Crafting materials moved to crafting-data.js

// ── Attribute point cost table (wiki-verified) ────────────────
// Total attribute points required to reach each rank.
// Max 200 points available at level 20 with both attribute quests.
// Source: wiki.guildwars.com/wiki/Attribute_point
var ATTR_POINT_COST = [0, 1, 3, 6, 10, 15, 21, 28, 37, 48, 61, 77, 97];
// Index = rank, value = total points spent to reach that rank
// e.g. rank 12 costs 97 total points

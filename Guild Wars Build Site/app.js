/* =============================================================
   app.js  —  Guild Wars 1 Build Editor
   ============================================================= */
'use strict';

const SKILLDATA_URL = 'https://build-wars.github.io/gw-skilldata/json/skilldata-combined.json';

/* ── State ───────────────────────────────────────────────────── */
const state = {
  primaryProf: null,
  secondaryProf: null,
  skillBar: new Array(8).fill(null),
  allSkills: [],
  filteredSkills: [],
  attrRanks: {},   // { attrId: rank 0-16 }
  runeBonuses: {}, // { attrId: bonus from runes }
  equipment: {
    weaponType: null,
    weaponMod: 'none',
    weaponPrefix: 'none',
    customized: false,
    offhandType: 'none',
    shieldMod: 'none',
    slots: {
      head:  { insignia: '', rune: '', attrRune: 'none' },
      chest: { insignia: '', rune: '', attrRune: 'none' },
      arms:  { insignia: '', rune: '', attrRune: 'none' },
      legs:  { insignia: '', rune: '', attrRune: 'none' },
      feet:  { insignia: '', rune: '', attrRune: 'none' },
    }
  }
};

/* ── Helpers ─────────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function opt(val, label, selected='') {
  return `<option value="${esc(val)}" ${selected}>${esc(label)}</option>`;
}

/** Format gold value — show as platinum if >= 1000g (1k gold = 1 platinum) */
function formatGold(gold) {
  if (gold >= 1000) {
    const plat = gold / 1000;
    return (Number.isInteger(plat) ? plat : plat.toFixed(1)) + 'p';
  }
  return gold + 'g';
}

/* ── Tabs ────────────────────────────────────────────────────── */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
    btn.classList.add('active');
    $('tab-' + btn.dataset.tab).classList.remove('hidden');
  });
});

/* ══════════════════════════════════════════════════════════════
   SKILLS TAB
══════════════════════════════════════════════════════════════ */

function renderProfButtons() {
  const primaryEl   = $('primary-prof-buttons');
  const secondaryEl = $('secondary-prof-buttons');

  Object.entries(GW_PROFESSIONS).filter(([id]) => id !== '0').forEach(([id, prof]) => {
    const b = document.createElement('button');
    b.className = 'prof-btn';
    b.dataset.prof = id;
    b.dataset.role = 'primary';
    b.textContent = prof.abbr;
    b.title = prof.name;
    b.addEventListener('click', () => selectProf('primary', +id));
    primaryEl.appendChild(b);
  });

  // Secondary: "None" + all profs
  const none = document.createElement('button');
  none.className = 'prof-btn none-btn';
  none.textContent = '— None';
  none.dataset.prof = '0';
  none.dataset.role = 'secondary';
  none.addEventListener('click', () => selectProf('secondary', 0));
  secondaryEl.appendChild(none);

  Object.entries(GW_PROFESSIONS).filter(([id]) => id !== '0').forEach(([id, prof]) => {
    const b = document.createElement('button');
    b.className = 'prof-btn';
    b.dataset.prof = id;
    b.dataset.role = 'secondary';
    b.textContent = prof.abbr;
    b.title = prof.name;
    b.addEventListener('click', () => selectProf('secondary', +id));
    secondaryEl.appendChild(b);
  });
}

function selectProf(role, profId) {
  if (role === 'primary') {
    if (profId === state.secondaryProf) {
      // Swap: move current primary to secondary, set new primary
      state.secondaryProf = state.primaryProf;
      state.primaryProf = profId;
    } else {
      state.primaryProf = profId;
    }
  } else {
    if (profId !== 0 && profId === state.primaryProf) {
      // Swap: move current secondary to primary, set new secondary
      state.primaryProf = state.secondaryProf;
      state.secondaryProf = profId;
    } else {
      state.secondaryProf = profId === 0 ? null : profId;
    }
  }
  // Reset attribute ranks when changing professions
  state.attrRanks = {};
  purgeBadSkills();
  updateProfButtons();
  filterAndRender();
  refreshSkillDropdowns();
  refreshAttributeRunes();
  refreshArmorTiers();
  refreshAttrRankPanel();
  updateEquipSummaryFull();
  updateStickySnapshot();
  syncStickyProfSelects();
}

function updateProfButtons() {
  document.querySelectorAll('.prof-btn').forEach(btn => {
    const id = +btn.dataset.prof;
    const role = btn.dataset.role;
    const isActive = role === 'primary'
      ? id === state.primaryProf
      : (id === 0 ? state.secondaryProf === null : id === state.secondaryProf);
    btn.classList.toggle('active', isActive);
    if (role === 'primary')   btn.disabled = (id === state.secondaryProf);
    if (role === 'secondary') btn.disabled = (id !== 0 && id === state.primaryProf);
  });
}

function purgeBadSkills() {
  state.skillBar = state.skillBar.map(s => (!s || skillAllowed(s)) ? s : null);
  renderSkillBar();
}

function skillAllowed(s) {
  const p = s.profession;
  return p === 0 || p === state.primaryProf || (state.secondaryProf && p === state.secondaryProf);
}

/* ── Load skills ─────────────────────────────────────────────── */
async function loadSkills() {
  $('skill-grid').innerHTML = '<div class="loading">Fetching GW1 skill database…</div>';
  try {
    const dr = await fetch(SKILLDATA_URL);
    if (!dr.ok) throw new Error('Network response not OK');
    const dj = await dr.json();
    const rawData = dj.skilldata || dj;

    state.allSkills = Object.values(rawData)
      .filter(s => s.id)
      .map(s => {
        // Use lang.en strings directly — these are the authoritative names from the API
        const en = s.lang?.en || {};
        return {
          ...s,
          name:            en.name          || `Skill #${s.id}`,
          description:     en.description   || '',
          concise:         en.concise        || '',
          // Use API strings directly — never our numeric lookup tables for display
          type_name:       en.type          || GW_SKILL_TYPES[s.type]  || 'Skill',
          profession_name: en.profession    || GW_PROFESSIONS[s.profession]?.name || 'Any',
          profession_abbr: en.profession_abbr || GW_PROFESSIONS[s.profession]?.abbr || '—',
          attribute_name:  en.attribute     || GW_ATTRIBUTES[s.attribute] || 'No Attribute',
          campaign_name:   en.campaign      || GW_CAMPAIGNS[s.campaign]  || '',
        };
      })
      .filter(s => s.name !== `Skill #${s.id}`)
      .sort((a,b) => {
        if (a.profession !== b.profession) return a.profession - b.profession;
        if (a.attribute  !== b.attribute)  return a.attribute  - b.attribute;
        return a.name.localeCompare(b.name);
      });

    populateFilters();
    filterAndRender();
    refreshSkillDropdowns();
    populateEliteSkills();
  } catch(err) {
    $('skill-grid').innerHTML = `<div class="no-results">⚠️ Could not load skills. Check your internet connection.<br><small>${err.message}</small></div>`;
  }
}

function populateFilters() {
  const attrSel = $('attribute-filter');
  const typeSel = $('type-filter');

  // Build attribute list from actual skill data — use API strings, not our lookup table
  const attrMap = new Map(); // attrId → name
  state.allSkills.forEach(s => {
    if (!attrMap.has(s.attribute)) attrMap.set(s.attribute, s.attribute_name);
  });
  const sortedAttrs = [...attrMap.entries()].sort((a,b) => a[1].localeCompare(b[1]));
  attrSel.innerHTML = '<option value="all">All Attributes</option>';
  sortedAttrs.forEach(([id, name]) => {
    attrSel.insertAdjacentHTML('beforeend', opt(id, name));
  });

  // Types — also from actual skill data
  const types = [...new Set(state.allSkills.map(s => s.type_name))].sort();
  typeSel.innerHTML = '<option value="all">All Types</option>';
  types.forEach(t => typeSel.insertAdjacentHTML('beforeend', opt(t, t)));
}

/* ══════════════════════════════════════════════════════════════
   SKILL PROGRESSION ENGINE
   GW1 uses a non-linear lookup table for attribute scaling.
   Description format: "10...50...60" = value at rank 0 ... rank 15 ... rank 16
   The middle number (rank 15) is the standard max; the third is with +1 from rune/headgear.
   Source: wiki.guildwars.com/wiki/Template:Skill_progression (GNU FDL)
══════════════════════════════════════════════════════════════ */

// Standard GW1 progression table: maps (at0, at15) → value at each rank 0-16
// Formula: value(rank) = round( at0 + (at15 - at0) * PROG_FACTOR[rank] )
// Factors derived from the wiki progression table examples (verified against Domination 5→14)
const PROG_FACTORS = [
  0.000, 0.067, 0.133, 0.200, 0.267, 0.333, 0.400, 0.467,
  0.533, 0.600, 0.667, 0.733, 0.800, 0.867, 0.933, 1.000,
  1.067, 1.133, 1.200, 1.267, 1.333
];

/**
 * Compute the skill value at a given attribute rank.
 * at0  = value at rank 0
 * at15 = value at rank 15 (the second number in "X...Y...Z")
 * rank = 0-16 (16 = rank 15 + 1 from rune/headgear)
 */
function progValue(at0, at15, rank) {
  const r = Math.max(0, Math.min(rank, 20));
  const factor = r < PROG_FACTORS.length ? PROG_FACTORS[r] : (r / 15); // extrapolate beyond table
  return Math.round(at0 + (at15 - at0) * factor);
}

/**
 * Parse a skill description and resolve all "A...B...C" ranges.
 * Returns the description with ranges replaced by the calculated value,
 * wrapped in a highlight span.
 * If the rank is the default (no attr), uses the middle (rank-15) value.
 */
/**
 * Get the effective attribute rank including rune bonuses from equipment.
 * This is the rank used for all skill value calculations.
 */
function getEffectiveRank(attrId) {
  const base = state.attrRanks[attrId] ?? 0;
  const runeBonus = (state.runeBonuses && state.runeBonuses[attrId]) || 0;
  return Math.min(base + runeBonus, 20);
}

function resolveDesc(desc, attrId) {
  if (!desc) return '';
  const rank = getEffectiveRank(attrId);
  return desc.replace(/(\d+)\.\.\.(\d+)\.\.\.(\d+)/g, (_, a, b, c) => {
    const at0 = +a, at15 = +b;
    const resolved = progValue(at0, at15, rank);
    const isMax = (rank >= 15);
    return `<span class="sk-val${isMax ? ' sk-val-max' : ''}">${resolved}</span>`;
  }).replace(/(\d+)\.\.\.(\d+)/g, (_, a, b) => {
    // Two-dot format: A...B = rank 0 to rank 15
    const at0 = +a, at15 = +b;
    const resolved = progValue(at0, at15, rank);
    return `<span class="sk-val">${resolved}</span>`;
  });
}

/**
 * Extract the first numeric range from a description — used for the
 * skill card quick-value display (e.g. "50 dmg @ rank 12").
 * Returns { value, label } or null.
 */
function extractFirstValue(desc, attrId) {
  if (!desc) return null;
  const rank = getEffectiveRank(attrId);
  const m = desc.match(/(\d+)\.\.\.(\d+)\.\.\.(\d+)/);
  if (m) return { value: progValue(+m[1], +m[2], rank), rank };
  const m2 = desc.match(/(\d+)\.\.\.(\d+)/);
  if (m2) return { value: progValue(+m2[1], +m2[2], rank), rank };
  return null;
}

/**
 * Compute attack skill bonus damage for weapon-based skills.
 * Attack skills with "+X damage" in description add armor-ignoring damage
 * on top of the weapon hit. We use weapon + attrRank to compute the base hit,
 * then add the skill bonus.
 */
function computeAttackSkillDamage(sk, targetAR = 60) {
  const wep = state.equipment.weaponType;
  if (!wep) return null;
  if (!['Attack Skill', 'Pet Attack'].includes(sk.type_name)) return null;

  const attrId   = sk.attribute;
  const rank     = getEffectiveRank(attrId);
  const mod      = WEAPON_MODS.find(m => m.id === state.equipment.weaponMod);
  const modMult  = mod ? mod.mult : 1.0;
  const custMult = state.equipment.customized ? 1.20 : 1.00;
  const hornPen  = wep.id === 'hornbow' ? 0.10 : 0;
  const effAR    = targetAR * (1 - hornPen);
  const arMult   = Math.pow(2, (60 - effAR) / 40);

  let attrMult = 1.0;
  if (wep.category === 'caster') {
    attrMult = 1.0; // level 20
  } else if (wep.mastery) {
    attrMult = ATTR_DMG_PERCENT[Math.min(rank, 16)] ?? 1.0;
  }

  const baseMin = wep.dmgMin * custMult * modMult;
  const baseMax = wep.dmgMax * custMult * modMult;
  const hitMin  = baseMin * attrMult * arMult;
  const hitMax  = baseMax * attrMult * arMult;

  // Extract "+X damage" from description
  const desc = sk.description || '';
  const bonusMatch = desc.match(/\+(\d+)\.\.\.(\d+)\.\.\.(\d+)\s*(?:damage|holy damage|shadow damage)?/i)
                  || desc.match(/\+(\d+)\.\.\.(\d+)\s*(?:damage|holy damage)?/i)
                  || desc.match(/deals?\s+(\d+)\.\.\.(\d+)\.\.\.(\d+)\s*(?:\w+ )?damage/i)
                  || desc.match(/deals?\s+(\d+)\.\.\.(\d+)\s*(?:\w+ )?damage/i);

  let bonusDmg = 0;
  if (bonusMatch) {
    const at0  = +bonusMatch[1];
    const at15 = +bonusMatch[2];
    const at16 = bonusMatch[3] ? +bonusMatch[3] : null;
    const useAt15 = at16 !== null ? at15 : at15;
    bonusDmg = progValue(at0, useAt15, rank);
  }

  return {
    weaponMin:  hitMin.toFixed(1),
    weaponMax:  hitMax.toFixed(1),
    weaponAvg: ((hitMin + hitMax) / 2).toFixed(1),
    bonusDmg,
    totalMin:  (hitMin + bonusDmg).toFixed(1),
    totalMax:  (hitMax + bonusDmg).toFixed(1),
    totalAvg:  (((hitMin + hitMax) / 2) + bonusDmg).toFixed(1),
    wepName:   wep.name,
    targetAR,
  };
}

/* ── Attribute Rank Panel ────────────────────────────────────── */

function buildAttrRankPanel() {
  refreshAttrRankPanel();
}

function refreshAttrRankPanel() {
  const grid = $('attr-ranks-grid');
  if (!grid) return;

  const prof1 = state.primaryProf;
  const prof2 = state.secondaryProf;

  if (!prof1) {
    grid.innerHTML = '<span class="muted attr-ranks-hint">Select a profession to set attribute ranks.</span>';
    return;
  }

  // Primary attributes — only usable by the PRIMARY profession, never secondary.
  // These are determined by profession name matching from loaded skill data.
  const PRIMARY_ATTR_NAMES = {
    1: 'Strength', 2: 'Expertise', 3: 'Divine Favor', 4: 'Soul Reaping',
    5: 'Fast Casting', 6: 'Energy Storage', 7: 'Critical Strikes',
    8: 'Spawning Power', 9: 'Leadership', 10: 'Mysticism',
  };

  // Build attribute → profession map dynamically from loaded skill data (source of truth).
  const attrToProfMap = {}; // attrId → professionId
  const attrNameMap = {};   // attrId → attribute name string
  state.allSkills.forEach(s => {
    if (s.attribute >= 100) return;
    if (s.profession === 0) return;
    if (!attrToProfMap[s.attribute] && s.profession) {
      attrToProfMap[s.attribute] = s.profession;
      attrNameMap[s.attribute] = s.attribute_name || `Attr ${s.attribute}`;
    }
  });

  // Collect attributes belonging to primary and secondary professions
  // EXCLUDE the primary attribute of the secondary profession (can't use it as secondary)
  const secPrimaryAttrName = prof2 ? PRIMARY_ATTR_NAMES[prof2] : null;

  const relevantAttrs = Object.entries(attrToProfMap)
    .filter(([id, pId]) => {
      if (pId === prof1) return true;
      if (prof2 && pId === prof2) {
        // Exclude the secondary profession's primary attribute
        const name = attrNameMap[+id] || '';
        if (secPrimaryAttrName && name === secPrimaryAttrName) return false;
        return true;
      }
      return false;
    })
    .map(([id, pId]) => ({
      id:   +id,
      name: attrNameMap[+id] || `Attr ${id}`,
      prof: pId,
    }))
    .sort((a, b) => a.prof - b.prof || a.name.localeCompare(b.name));

  if (!relevantAttrs.length) {
    grid.innerHTML = '<span class="muted attr-ranks-hint">Skill data still loading…</span>';
    return;
  }

  grid.innerHTML = relevantAttrs.map(attr => {
    const rank = state.attrRanks[attr.id] ?? 0;
    const runeBonus = (state.runeBonuses && state.runeBonuses[attr.id]) || 0;
    const effectiveRank = Math.min(rank + runeBonus, 16);
    const profClass = `attr-prof-${attr.prof}`;
    const bonus = ATTR_BONUSES[attr.name];
    const bonusDesc = bonus ? bonus.desc : '';
    const bonusCalc = bonus ? bonus.calc(effectiveRank) : '';
    const runeTag = runeBonus ? `<span class="attr-rune-bonus">+${runeBonus} rune</span>` : '';
    const pointCost = ATTR_POINT_COST[Math.min(rank, 12)] || 0;
    return `
      <details class="attr-rank-details ${profClass}" data-attr="${attr.id}">
        <summary class="attr-rank-summary">
          <span class="attr-rank-name">${attr.name}</span>
          <span class="attr-point-cost" title="Attribute points invested">${pointCost}pt</span>
          <input class="attr-rank-slider" type="range" min="0" max="12"
                 value="${Math.min(rank, 12)}" data-attr="${attr.id}" />
          <span class="attr-rank-val">${rank}${runeBonus ? `<span class="attr-eff">(${effectiveRank})</span>` : ''}${runeTag}</span>
        </summary>
        <div class="attr-bonus-panel" data-attr="${attr.id}">
          <div class="attr-bonus-desc">${bonusDesc}</div>
          <div class="attr-bonus-value">${bonusCalc}</div>
        </div>
      </details>`;
  }).join('');

  // Wire sliders
  grid.querySelectorAll('.attr-rank-slider').forEach(sl => {
    // Stop click on slider from toggling the <details>
    sl.addEventListener('click', e => e.stopPropagation());
    sl.addEventListener('mousedown', e => e.stopPropagation());
    sl.addEventListener('input', () => {
      const id = +sl.dataset.attr;
      let v = +sl.value;

      // Enforce 200 total attribute point cap
      const totalIfSet = getTotalAttrPoints(id, v);
      if (totalIfSet > 200) {
        // Find max rank we can afford
        while (v > 0 && getTotalAttrPoints(id, v) > 200) v--;
        sl.value = v;
      }

      state.attrRanks[id] = v;
      syncRankRow(id, v);
      updateAttrPointsDisplay();
    });
  });
  updateAttrPointsDisplay();
}

/** Calculate total attribute points spent across all attributes */
function getTotalAttrPoints(overrideId, overrideVal) {
  let total = 0;
  Object.entries(state.attrRanks).forEach(([attrId, rank]) => {
    const r = (+attrId === overrideId) ? overrideVal : rank;
    total += ATTR_POINT_COST[Math.min(r, 12)] || 0;
  });
  // If overrideId isn't in attrRanks yet, add it
  if (overrideId !== undefined && !(overrideId in state.attrRanks) && overrideVal > 0) {
    total += ATTR_POINT_COST[Math.min(overrideVal, 12)] || 0;
  }
  return total;
}

/** Update attribute points remaining display */
function updateAttrPointsDisplay() {
  const el = $('attr-points-remaining');
  if (!el) return;
  let total = 0;
  Object.values(state.attrRanks).forEach(r => { total += ATTR_POINT_COST[Math.min(r, 12)] || 0; });
  const remaining = 200 - total;
  el.textContent = `${total}/200 spent (${remaining} remaining)`;
  el.classList.toggle('attr-over-budget', remaining < 0);
}

function syncRankRow(attrId, val) {
  const grid = $('attr-ranks-grid');
  if (!grid) return;
  const details = grid.querySelector(`.attr-rank-details[data-attr="${attrId}"]`);
  if (!details) return;
  const sl    = details.querySelector('.attr-rank-slider');
  const label = details.querySelector('.attr-rank-val');
  const bonusEl = details.querySelector('.attr-bonus-value');

  // Calculate effective rank including rune bonus
  const runeBonus = (state.runeBonuses && state.runeBonuses[attrId]) || 0;
  const effectiveRank = Math.min(val + runeBonus, 16);

  if (sl) sl.value = val;
  if (label) {
    label.innerHTML = runeBonus
      ? `${val}<span class="attr-eff">(${effectiveRank})</span><span class="attr-rune-bonus">+${runeBonus} rune</span>`
      : `${val}`;
  }

  // Update point cost display
  const costEl = details.querySelector('.attr-point-cost');
  if (costEl) costEl.textContent = (ATTR_POINT_COST[Math.min(val, 12)] || 0) + 'pt';

  // Update the bonus calculation using effective rank
  if (bonusEl) {
    const nameEl = details.querySelector('.attr-rank-name');
    const name = nameEl ? nameEl.textContent : '';
    const bonus = ATTR_BONUSES[name];
    if (bonus) bonusEl.textContent = bonus.calc(effectiveRank);
  }
  renderSkillGrid();
  renderSkillBar();
  updateEquipSummaryFull();
}

/* ── Filter & render skill grid ──────────────────────────────── */
function filterAndRender() {
  const query   = $('search-input').value.trim().toLowerCase();
  const attrVal = $('attribute-filter').value;
  const typeVal = $('type-filter').value;
  const elite   = $('elite-only').checked;
  const pvpMode = $('pvp-mode')?.checked || false;

  state.filteredSkills = state.allSkills.filter(s => {
    // PvE/PvP mode filtering:
    // In PvE mode: hide skills marked is_pvp (those are the PvP split variants)
    // In PvP mode: hide PvE originals that have a PvP split (pvp_split=true),
    //              show the PvP variant instead. Also hide is_rp (PvE-only) skills.
    if (!pvpMode) {
      // PvE mode: exclude PvP split variants
      if (s.is_pvp) return false;
    } else {
      // PvP mode: exclude PvE-only/title track skills
      if (s.is_rp) return false;
      // If a skill has a PvP split, hide the PvE version (show the PvP one)
      if (s.pvp_split && !s.is_pvp) return false;
      // If it's a PvP variant, show it
      // If it's a normal skill with no split, show it
    }

    // Profession filter
    const p = s.profession;
    if (state.primaryProf !== null) {
      if (p === 0) {
        // "Any" profession skills: in PvE show title track + No Attribute utility
        // In PvP show No Attribute utility only (is_rp already filtered above)
        if (!pvpMode && !s.is_rp && s.attribute !== 101) return false;
        if (pvpMode && s.attribute !== 101) return false;
      } else {
        const ok = p === state.primaryProf || (state.secondaryProf && p === state.secondaryProf);
        if (!ok) return false;
      }
    }

    if (attrVal !== 'all' && s.attribute !== +attrVal) return false;
    if (typeVal !== 'all' && s.type_name !== typeVal)  return false;
    if (elite && !s.is_elite) return false;
    if (query) {
      const hay = `${s.name} ${s.description} ${s.attribute_name} ${s.type_name}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });

  // Update attribute filter dropdown to only show relevant attributes
  updateAttrFilterOptions();
  renderSkillGrid();
}

/**
 * Dynamically update the attribute filter dropdown to only show
 * attributes that exist in currently visible skills (post-profession filter).
 */
function updateAttrFilterOptions() {
  const attrSel = $('attribute-filter');
  const currentVal = attrSel.value;
  const pvpMode = $('pvp-mode')?.checked || false;

  // Gather attributes from skills that pass the profession + mode filter
  const visibleAttrs = new Map();
  state.allSkills.forEach(s => {
    // Mode filter
    if (!pvpMode) {
      if (s.is_pvp) return;
    } else {
      if (s.is_rp) return;
      if (s.pvp_split && !s.is_pvp) return;
    }

    const p = s.profession;
    let visible = true;
    if (state.primaryProf !== null) {
      if (p === 0) {
        if (!pvpMode && !s.is_rp && s.attribute !== 101) visible = false;
        if (pvpMode && s.attribute !== 101) visible = false;
      } else {
        const ok = p === state.primaryProf || (state.secondaryProf && p === state.secondaryProf);
        if (!ok) visible = false;
      }
    }
    if (visible && !visibleAttrs.has(s.attribute)) {
      visibleAttrs.set(s.attribute, s.attribute_name);
    }
  });

  const sorted = [...visibleAttrs.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  attrSel.innerHTML = '<option value="all">All Attributes</option>';
  sorted.forEach(([id, name]) => {
    const sel = (+currentVal === id) ? 'selected' : '';
    attrSel.insertAdjacentHTML('beforeend', `<option value="${id}" ${sel}>${esc(name)}</option>`);
  });

  if (currentVal !== 'all' && !visibleAttrs.has(+currentVal)) {
    attrSel.value = 'all';
  }
}

function renderSkillGrid() {
  const grid = $('skill-grid');
  if (!state.filteredSkills.length) {
    grid.innerHTML = '<div class="no-results">No skills match your filters.</div>';
    return;
  }
  const inBar = new Set(state.skillBar.filter(Boolean).map(s => s.id));
  grid.innerHTML = '';
  const frag = document.createDocumentFragment();

  state.filteredSkills.forEach(sk => {
    const card = document.createElement('div');
    card.className = 'skill-card' + (inBar.has(sk.id) ? ' in-bar' : '');
    card.dataset.prof = sk.profession;

    // Skill card quick-value removed for clarity
    const qvHtml = '';

    const iconUrl = getSkillIconUrl(sk.name);

    card.innerHTML = `
      <div class="card-top">
        <img class="card-icon" src="${iconUrl}" alt="" loading="lazy" onerror="this.style.display='none'" />
        <div class="card-info">
          <div class="card-name">${esc(sk.name)}${sk.is_elite ? '<span class="elite-badge">ELITE</span>':''}${qvHtml}</div>
          <div class="card-meta">${sk.profession_abbr !== '—' ? sk.profession_abbr+' · ':'' }${sk.attribute_name}</div>
          <div class="card-type-row">
            <span class="card-type">${sk.type_name}</span>
            <span class="card-stats">
              ${sk.energy    ? `<span class="stat-pip">⚡<span>${sk.energy}e</span></span>` : '<span class="stat-pip">🖊 Signet</span>'}
              ${sk.activation? `<span class="stat-pip">⏱<span>${sk.activation}s</span></span>`:''}
              ${sk.recharge  ? `<span class="stat-pip">🔄<span>${sk.recharge}s</span></span>`:''}
              ${sk.adrenaline? `<span class="stat-pip">💢<span>${sk.adrenaline}</span></span>`:''}
            </span>
          </div>
        </div>`;
    card.addEventListener('click', () => addToBar(sk));
    card.addEventListener('mouseenter', e => showTooltip(e, sk));
    card.addEventListener('mousemove',  e => moveTooltip(e));
    card.addEventListener('mouseleave', hideTooltip);
    frag.appendChild(card);
  });
  grid.appendChild(frag);
}

/**
 * Get skill icon URL from the GW Wiki.
 * Pattern: https://wiki.guildwars.com/wiki/Special:FilePath/Skill_Name.jpg
 * Skill names with spaces become underscores; special chars get encoded.
 */
function getSkillIconUrl(name) {
  if (!name) return '';
  // The wiki uses the skill name with spaces→underscores and .jpg extension
  const encoded = encodeURIComponent(name.replace(/ /g, '_')) + '.jpg';
  return `https://wiki.guildwars.com/wiki/Special:FilePath/${encoded}`;
}

/* ── Skill dropdowns (per-profession accordion) ──────────────── */
function refreshSkillDropdowns() {
  // no-op — we use the grid with filters; dropdowns are the filter selects themselves
}

/* ── Skill bar ───────────────────────────────────────────────── */
function renderSkillBar() {
  const bar = $('skill-bar');
  bar.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const sk = state.skillBar[i];
    const slot = document.createElement('div');
    slot.className = 'skill-slot' + (sk ? ' filled' : '') + (sk?.is_elite ? ' elite-slot' : '');
    slot.innerHTML = `<span class="slot-num">${i+1}</span>`;
    if (sk) {
      const qv = extractFirstValue(sk.description || sk.concise, sk.attribute);
      const qvLine = qv ? `<span class="slot-qv">◆${qv.value}</span>` : '';
      const iconUrl = getSkillIconUrl(sk.name);
      slot.innerHTML += `
        ${sk.is_elite ? '<span class="slot-elite-star">⭐</span>' : ''}
        <img class="slot-icon" src="${iconUrl}" alt="" loading="lazy" onerror="this.style.display='none'" />
        <span class="slot-name">${esc(sk.name)}</span>
        <span class="slot-type">${sk.type_name}${qvLine}</span>
        <span class="slot-remove" title="Remove">✕</span>`;
      slot.addEventListener('click', () => { removeFromBar(i); });
      slot.addEventListener('mouseenter', e => showTooltip(e, sk));
      slot.addEventListener('mousemove',  e => moveTooltip(e));
      slot.addEventListener('mouseleave', hideTooltip);
    } else {
      slot.innerHTML += '<span class="slot-empty-label">Empty</span>';
    }
    bar.appendChild(slot);
  }
}

function addToBar(sk) {
  const idx = state.skillBar.findIndex(s => s?.id === sk.id);
  if (idx !== -1) { state.skillBar[idx] = null; renderSkillBar(); renderSkillGrid(); return; }
  if (sk.is_elite && state.skillBar.some(s => s?.is_elite)) {
    alert('Only 1 elite skill allowed per bar.'); return;
  }
  const empty = state.skillBar.findIndex(s => s === null);
  if (empty === -1) { alert('Skill bar is full. Click a skill to remove it.'); return; }
  state.skillBar[empty] = sk;
  renderSkillBar();
  renderSkillGrid();
}

function removeFromBar(i) {
  state.skillBar[i] = null;
  renderSkillBar();
  renderSkillGrid();
}

$('btn-clear').addEventListener('click', () => {
  if (!confirm('Clear entire build? This will reset skills, attributes, and equipment.')) return;
  // Clear skill bar
  state.skillBar = new Array(8).fill(null);
  // Clear attributes
  state.attrRanks = {};
  // Clear equipment
  state.equipment.weaponType = null;
  state.equipment.weaponMod = 'none';
  state.equipment.weaponPrefix = 'none';
  state.equipment.customized = false;
  state.equipment.offhandType = 'none';
  state.equipment.shieldMod = 'none';
  ['head','chest','arms','legs','feet'].forEach(slot => {
    state.equipment.slots[slot].insignia = '';
    state.equipment.slots[slot].rune = '';
  });
  state.runeBonuses = {};
  // Reset UI elements
  if ($('eq-weapon-type')) $('eq-weapon-type').value = '';
  if ($('eq-weapon-mod')) $('eq-weapon-mod').value = 'none';
  if ($('eq-weapon-prefix')) $('eq-weapon-prefix').value = 'none';
  if ($('eq-customized')) $('eq-customized').checked = false;
  if ($('eq-offhand-type')) $('eq-offhand-type').value = 'none';
  if ($('eq-shield-mod')) $('eq-shield-mod').value = 'none';
  document.querySelectorAll('.insig-select').forEach(s => s.value = '');
  document.querySelectorAll('.rune-select').forEach(s => s.value = '');
  // Refresh everything
  renderSkillBar();
  renderSkillGrid();
  refreshAttrRankPanel();
  updateEquipSummaryFull();
});

$('btn-copy-url').addEventListener('click', () => {
  const code = encodeSkillTemplate();
  if (code) {
    const outputEl = $('template-output');
    outputEl.textContent = code;
    outputEl.classList.remove('hidden');
    navigator.clipboard.writeText(code).then(() => {
      const el = $('copy-confirm');
      el.textContent = 'Copied to clipboard!';
      el.classList.remove('hidden');
      setTimeout(() => el.classList.add('hidden'), 3000);
    });
  }
});

/**
 * Encode current build state into a GW1 skill template code.
 * Uses the same format as decodeSkillTemplate (wiki spec).
 */
function encodeSkillTemplate() {
  if (!state.primaryProf) { alert('Select a primary profession first.'); return null; }

  const pri = state.primaryProf;
  const sec = state.secondaryProf || 0;

  // Build attribute map: template attr ID → points
  // We need to reverse-map our skill data attr IDs to template attr IDs
  const attrNameToTemplateId = {};
  Object.entries(TEMPLATE_ATTR_INDEX).forEach(([id, name]) => { attrNameToTemplateId[name] = +id; });

  // Get attribute name→ID from skill data
  const attrIdToName = {};
  state.allSkills.forEach(s => {
    if (s.attribute < 100 && s.attribute_name && !attrIdToName[s.attribute]) {
      attrIdToName[s.attribute] = s.attribute_name;
    }
  });

  // Build attributes array: [{ templateId, points }]
  const attrs = [];
  Object.entries(state.attrRanks).forEach(([attrId, points]) => {
    if (points <= 0) return;
    const name = attrIdToName[+attrId];
    if (!name) return;
    const templateId = attrNameToTemplateId[name];
    if (templateId === undefined) return;
    attrs.push({ id: templateId, pts: Math.min(points, 12) });
  });

  // Skills
  const skills = state.skillBar.map(s => s ? s.id : 0);

  // Encode to binary string (LSB-first per 6-bit chunk, same as decoder)
  let bin = '';
  // Type: 14 (skill template), Version: 0
  bin += decbin_pad(14, 4);
  bin += decbin_pad(0, 4);
  // Profession length code: 0 (4 bits per profession)
  bin += decbin_pad(0, 2);
  // Professions
  bin += decbin_pad(pri, 4);
  bin += decbin_pad(sec, 4);
  // Attribute count
  bin += decbin_pad(attrs.length, 4);
  // Attribute ID pad size
  const attrPad = getEncodePadSize(attrs.map(a => a.id), 5);
  bin += decbin_pad(attrPad - 4, 4);
  // Attributes
  attrs.forEach(a => {
    bin += decbin_pad(a.id, attrPad);
    bin += decbin_pad(a.pts, 4);
  });
  // Skill ID pad size
  const skillPad = getEncodePadSize(skills, 10);
  bin += decbin_pad(skillPad - 8, 4);
  // Skills
  skills.forEach(id => {
    bin += decbin_pad(id, skillPad);
  });

  // Pad to multiple of 6
  while (bin.length % 6 !== 0) bin += '0';

  // Convert binary string to Base64
  const code = [];
  for (let i = 0; i < bin.length; i += 6) {
    const chunk = bin.substring(i, i + 6);
    const val = bindec_flip(chunk);
    code.push(GW_B64[val]);
  }

  return code.join('');
}

function getEncodePadSize(nums, minPad) {
  let pad = minPad;
  for (const num of nums) {
    while (num >= Math.pow(2, pad)) pad++;
  }
  return pad;
}


// Inline import on Skills tab
$('btn-import-inline').addEventListener('click', () => {
  $('import-inline').classList.toggle('hidden');
});
$('btn-import-go').addEventListener('click', () => {
  const code = $('import-code-inline').value.trim();
  if (!code) return;
  try {
    const decoded = decodeSkillTemplate(code);
    lastDecodedBuild = decoded;
    applyImportedBuild();
    $('import-inline').classList.add('hidden');
    $('import-code-inline').value = '';
  } catch(e) {
    alert('Decode failed: ' + e.message);
  }
});

$('search-input').addEventListener('input',  filterAndRender);
$('attribute-filter').addEventListener('change', filterAndRender);
$('type-filter').addEventListener('change',  filterAndRender);
$('elite-only').addEventListener('change',   filterAndRender);
$('pvp-mode').addEventListener('change',     filterAndRender);


/* ══════════════════════════════════════════════════════════════
   EQUIPMENT TAB
══════════════════════════════════════════════════════════════ */

function buildEquipmentTab() {
  buildWeaponDropdown();
  buildWeaponPrefixDropdown();
  buildOffhandDropdown();
  buildWeaponModDropdown();
  buildShieldModDropdown();
  buildArmorSlots();

  $('eq-customized').addEventListener('change', e => {
    state.equipment.customized = e.target.checked;
    syncCalcFromEquip();
    updateEquipSummaryFull();
    updateStickySnapshot();
  });
}

function buildWeaponPrefixDropdown() {
  const sel = $('eq-weapon-prefix');
  if (!sel) return;
  sel.innerHTML = '';
  WEAPON_PREFIX_MODS.forEach(m => {
    const o = document.createElement('option');
    o.value = m.id;
    o.textContent = m.id === 'none' ? '— None —' : `${m.name} — ${m.effect.split('.')[0]}`;
    sel.appendChild(o);
  });
  sel.addEventListener('change', () => {
    state.equipment.weaponPrefix = sel.value;
    updateEquipSummaryFull();
    updateStickySnapshot();
  });
}

function buildWeaponDropdown() {
  const sel = $('eq-weapon-type');
  sel.innerHTML = '<option value="">— Select Weapon —</option>';

  const categories = ['melee','ranged','caster'];
  const labels = { melee:'Melee Weapons', ranged:'Ranged Weapons', caster:'Caster Weapons' };

  categories.forEach(cat => {
    const group = document.createElement('optgroup');
    group.label = labels[cat];
    WEAPON_TYPES.filter(w => w.category === cat).forEach(w => {
      const profNames = w.profs.map(p => GW_PROFESSIONS[p]?.abbr).join('/');
      const o = document.createElement('option');
      o.value = w.id;
      o.textContent = `${w.name} [${profNames}] — ${w.dmgMin}-${w.dmgMax} ${w.dmgType} (${w.speed}s)`;
      group.appendChild(o);
    });
    sel.appendChild(group);
  });

  sel.addEventListener('change', () => {
    const wep = WEAPON_TYPES.find(w => w.id === sel.value) || null;
    state.equipment.weaponType = wep;
    toggleOffhandVisibility(wep);
    syncCalcFromEquip();
    updateEquipSummaryFull();
    updateStickySnapshot();
  });
}

function toggleOffhandVisibility(wep) {
  const row = $('eq-offhand-row');
  if (!wep || wep.hands === 1) {
    row.style.display = '';
  } else {
    // Two-handed: hide offhand
    row.style.display = 'none';
    state.equipment.offhandType = 'none';
    $('eq-offhand-type').value = 'none';
  }
}

function buildOffhandDropdown() {
  const sel = $('eq-offhand-type');
  sel.innerHTML = '';
  OFFHAND_TYPES.forEach(oh => {
    const o = document.createElement('option');
    o.value = oh.id;
    o.textContent = oh.id === 'none' ? '— None —' : oh.name;
    sel.appendChild(o);
  });
  sel.addEventListener('change', () => {
    state.equipment.offhandType = sel.value;
    const showShield = sel.value === 'shield';
    $('eq-shield-mod-col').style.display = showShield ? '' : 'none';
    updateEquipSummaryFull();
    updateStickySnapshot();
  });
  $('eq-shield-mod-col').style.display = 'none';
}

function buildWeaponModDropdown() {
  const sel = $('eq-weapon-mod');
  sel.innerHTML = '';
  WEAPON_MODS.forEach(m => {
    const o = document.createElement('option');
    o.value = m.id;
    o.textContent = m.name;
    sel.appendChild(o);
  });
  sel.addEventListener('change', () => {
    state.equipment.weaponMod = sel.value;
    syncCalcFromEquip();
    updateEquipSummaryFull();
    updateStickySnapshot();
  });
}

function buildShieldModDropdown() {
  const sel = $('eq-shield-mod');
  sel.innerHTML = '';
  SHIELD_MODS.forEach(m => {
    const o = document.createElement('option');
    o.value = m.id;
    o.textContent = m.name;
    sel.appendChild(o);
  });
  sel.addEventListener('change', () => {
    state.equipment.shieldMod = sel.value;
    updateEquipSummaryFull();
    updateStickySnapshot();
  });
}

function buildArmorSlots() {
  const slots = ['head','chest','arms','legs','feet'];

  // Build insignia selects
  document.querySelectorAll('.insig-select').forEach(sel => {
    const slot = sel.dataset.slot;
    sel.innerHTML = '<option value="">— Insignia —</option>';
    populateInsigniaOptions(sel);
    sel.addEventListener('change', () => {
      state.equipment.slots[slot].insignia = sel.value;
      updateEquipSummaryFull();
      updateStickySnapshot();
    });
  });

  // Build rune selects (attribute runes + universal)
  document.querySelectorAll('.rune-select').forEach(sel => {
    const slot = sel.dataset.slot;
    sel.innerHTML = '<option value="">— Rune —</option>';

    // Attribute runes group (profession-specific, only if primary chosen)
    const attrGroup = document.createElement('optgroup');
    attrGroup.label = 'Attribute Runes (Primary Profession)';
    attrGroup.id = `rune-attr-group-${slot}`;
    sel.appendChild(attrGroup);

    // Universal runes
    const uniGroup = document.createElement('optgroup');
    uniGroup.label = 'Universal Runes';
    RUNES_UNIVERSAL.filter(r => r.id !== 'none').forEach(r => {
      const o = document.createElement('option');
      o.value = 'uni_' + r.id;
      o.textContent = r.name;
      uniGroup.appendChild(o);
    });
    sel.appendChild(uniGroup);

    sel.addEventListener('change', () => {
      state.equipment.slots[slot].rune = sel.value;
      refreshRuneAvailability();
      syncRuneBonusesToAttrRanks();
      updateEquipSummaryFull();
      updateStickySnapshot();
    });
  });

  // Refresh attribute rune options when profession changes (called in selectProf)
  refreshAttributeRunes();
}

function populateInsigniaOptions(sel) {
  // Universal first
  const uniGroup = document.createElement('optgroup');
  uniGroup.label = 'Universal';
  INSIGNIAS[0].filter(i => i.id !== 'none').forEach(i => {
    const label = i.effect ? `${i.name} — ${i.effect}` : i.name;
    uniGroup.insertAdjacentHTML('beforeend', opt(i.id, label));
  });
  sel.appendChild(uniGroup);

  // Profession-specific (all professions)
  Object.entries(INSIGNIAS).forEach(([profId, list]) => {
    if (+profId === 0) return;
    const profName = GW_PROFESSIONS[+profId]?.name || '';
    const group = document.createElement('optgroup');
    group.label = profName;
    group.dataset.insigProf = profId;
    list.forEach(i => {
      const o = document.createElement('option');
      o.value = `${profId}_${i.id}`;
      o.textContent = i.effect ? `${i.name} — ${i.effect}` : i.name;
      group.appendChild(o);
    });
    sel.appendChild(group);
  });
}

function refreshAttributeRunes() {
  document.querySelectorAll('.rune-select').forEach(sel => {
    const slot = sel.dataset.slot;
    const groupId = `rune-attr-group-${slot}`;
    const existing = document.getElementById(groupId);
    if (existing) existing.innerHTML = '';

    if (!state.primaryProf) return;

    // Build attribute list for primary profession from actual skill data (source of truth)
    const profAttrMap = {};
    state.allSkills.forEach(s => {
      if (s.attribute >= 100 || s.profession === 0) return;
      if (s.profession === state.primaryProf && !profAttrMap[s.attribute]) {
        profAttrMap[s.attribute] = s.attribute_name || `Attr ${s.attribute}`;
      }
    });
    const profAttrs = Object.entries(profAttrMap).map(([id, name]) => ({ id: +id, name }));

    if (!profAttrs.length) return;

    // Warrior gets Absorption rune option too
    if (state.primaryProf === 1) {
      RUNES_WARRIOR_ABSORB.filter(r => r.id !== 'none').forEach(r => {
        const o = document.createElement('option');
        o.value = 'abs_' + r.id;
        o.textContent = r.name;
        document.getElementById(groupId).appendChild(o);
      });
    }

    profAttrs.forEach(attr => {
      RUNES_ATTR.filter(r => r.id !== 'none').forEach(r => {
        const o = document.createElement('option');
        o.value = `attr_${attr.id}_${r.id}`;
        o.textContent = `${r.label} ${attr.name} (${r.bonus > 0 ? '+' : ''}${r.bonus} attr${r.hpDelta < 0 ? ', HP '+r.hpDelta : ''})`;
        document.getElementById(groupId).appendChild(o);
      });
    });
  });
}

/** Calculate DPS for the Build Snapshot — includes mastery, inscription, Strength pen */
function calcSnapshotDPS(wep, eq, prof) {
  if (!wep) return '—';
  var modMult = (WEAPON_MODS.find(function(m){return m.id===eq.weaponMod;}) || {}).mult || 1.0;
  var custMult = eq.customized ? 1.20 : 1.0;
  var attrMult = 1.0;
  if (wep.category !== 'caster' && wep.mastery) {
    var masteryId = null;
    state.allSkills.some(function(s) {
      if (s.attribute_name === wep.mastery && s.attribute < 100) { masteryId = s.attribute; return true; }
      return false;
    });
    if (masteryId !== null) {
      var r = Math.min((state.attrRanks[masteryId]||0) + ((state.runeBonuses&&state.runeBonuses[masteryId])||0), 16);
      attrMult = ATTR_DMG_PERCENT[r] || ATTR_DMG_PERCENT[0];
    }
  }
  var arPenMult = 1.0;
  if (prof === 1) {
    var strId = null;
    state.allSkills.some(function(s) {
      if (s.attribute_name === 'Strength' && s.profession === 1 && s.attribute < 100) { strId = s.attribute; return true; }
      return false;
    });
    if (strId !== null) {
      var strRank = Math.min((state.attrRanks[strId]||0) + ((state.runeBonuses&&state.runeBonuses[strId])||0), 20);
      var effAR = 60 * (1 - strRank/100);
      arPenMult = Math.pow(2, (60 - effAR) / 40);
    }
  }
  var avg = ((wep.dmgMin + wep.dmgMax) / 2) * custMult * modMult * attrMult * arPenMult;
  return (avg / wep.speed).toFixed(1);
}

/* ── Equipment Summary (core logic) ──────────────────────────── */
function updateEquipSummaryCore() {
  // Also keep calc tab in sync
  syncCalcFromEquip();

  const eq = state.equipment;
  const prof = state.primaryProf;
  const baseAR = prof ? PROF_MAX_AR[prof] || 60 : 60;

  let hp = 480;         // base HP at level 20
  let energy = 20;      // base energy
  let hpRunes = 0;
  let arNotes = [];
  let runeNotes = [];
  let insigniaNotes = [];

  // Add profession armor inherent energy/HP bonuses (wiki-verified)
  if (prof && BASIC_ARMOR_BONUS[prof]) {
    const bonus = BASIC_ARMOR_BONUS[prof];
    Object.values(bonus).forEach(v => {
      if (typeof v === 'string') {
        const enMatch = v.match(/Energy \+(\d+)/);
        if (enMatch) energy += +enMatch[1];
        const hpMatch = v.match(/Health \+(\d+)/);
        if (hpMatch) hp += +hpMatch[1];
      }
    });
  }

  // Runes — calculate HP delta & collect notes
  const slots = ['head','chest','arms','legs','feet'];
  slots.forEach(slot => {
    const runeVal = eq.slots[slot].rune;
    if (!runeVal) return;

    if (runeVal.startsWith('uni_')) {
      const runeId = runeVal.replace('uni_','');
      const rune = RUNES_UNIVERSAL.find(r => r.id === runeId);
      if (rune) {
        hpRunes += rune.hpDelta || 0;
        if (rune.effect) runeNotes.push(`${slot}: ${rune.effect}`);
      }
    } else if (runeVal.startsWith('attr_')) {
      const parts = runeVal.split('_');
      const tier = parts[parts.length-1];
      const runeData = RUNES_ATTR.find(r => r.id === tier);
      if (runeData) {
        hpRunes += runeData.hpDelta || 0;
        const attrId = +parts[1];
        runeNotes.push(`${slot}: ${runeData.label} ${GW_ATTRIBUTES[attrId] || ''} +${runeData.bonus}${runeData.hpDelta < 0 ? ' (HP '+runeData.hpDelta+')' : ''}`);
      }
    } else if (runeVal.startsWith('abs_')) {
      const absId = runeVal.replace('abs_','');
      const rune = RUNES_WARRIOR_ABSORB.find(r => r.id === absId);
      if (rune) runeNotes.push(`${slot}: ${rune.name}`);
    }
  });

  // Insignias — collect notes
  slots.forEach(slot => {
    const insig = eq.slots[slot].insignia;
    if (!insig || insig === 'none') return;
    // Find the insignia record
    let found = null;
    if (insig.includes('_')) {
      const [profId, insigId] = insig.split('_');
      found = INSIGNIAS[+profId]?.find(i => i.id === insigId);
    } else {
      found = INSIGNIAS[0].find(i => i.id === insig);
    }
    if (found) {
      insigniaNotes.push(`${slot}: ${found.name} — ${found.effect}`);
      if (found.id === 'survivor') {
        const hpBonus = slot==='chest' ? 15 : slot==='legs' ? 10 : 5;
        hp += hpBonus;
      }
      if (found.id === 'radiant') {
        const enBonus = slot==='chest' ? 3 : slot==='legs' ? 2 : 1;
        energy += enBonus;
      }
    }
  });

  // Attunement rune adds energy
  slots.forEach(slot => {
    if (eq.slots[slot].rune === 'uni_attune') energy += 2;
  });

  // Vigor / Vitae HP
  hp += hpRunes;

  // Weapon
  const wep = eq.weaponType;
  let wepLine = wep
    ? `<strong>${wep.name}</strong> — ${wep.dmgMin}-${wep.dmgMax} ${wep.dmgType}, ${wep.speed}s attack speed`
    : '<em class="muted">No weapon selected</em>';
  if (wep) {
    const prefix = WEAPON_PREFIX_MODS.find(m => m.id === eq.weaponPrefix);
    if (prefix && prefix.id !== 'none') wepLine += ` | <strong>${prefix.name}</strong>: ${prefix.effect}`;
    const mod = WEAPON_MODS.find(m => m.id === eq.weaponMod);
    if (mod && mod.id !== 'none') wepLine += ` | ${mod.name}`;
    if (eq.customized) wepLine += ' | +20% damage (Customized)';
    if (wep.notes) wepLine += ` | <em>${wep.notes}</em>`;
  }

  // Offhand
  let ohLine = '';
  if (wep?.hands !== 2) {
    const oh = OFFHAND_TYPES.find(o => o.id === eq.offhandType);
    if (oh && oh.id !== 'none') {
      ohLine = `<strong>${oh.name}</strong>${oh.notes ? ' — ' + oh.notes : ''}`;
      const sm = SHIELD_MODS.find(m => m.id === eq.shieldMod);
      if (sm && sm.id !== 'none') ohLine += ` | ${sm.name}`;
    }
  }

  // Basic armor bonuses
  const basicBonus = prof ? BASIC_ARMOR_BONUS[prof] || {} : {};

  // ── Damage reduction from armor ────────────────────────────
  // Formula: damage multiplier = 2^((60-AR)/40)
  // Also factor in profession inherent bonuses (Warrior +20 vs phys, Ranger +30 vs ele)
  const tierAR = selectedArmorTier ? selectedArmorTier.ar : baseAR;
  const physBonusAR = (prof === 1) ? 20 : 0;  // Warrior +20 vs phys
  const eleBonusAR  = (prof === 2) ? 30 : 0;  // Ranger +30 vs ele
  const shieldAR    = (eq.offhandType === 'shield') ? 16 : 0;

  const physAR = tierAR + physBonusAR + shieldAR;
  const eleAR  = tierAR + eleBonusAR;
  const baseMultPhys = Math.pow(2, (60 - physAR) / 40);
  const baseMultEle  = Math.pow(2, (60 - eleAR)  / 40);
  const baseMultRaw  = Math.pow(2, (60 - tierAR)  / 40);

  const physReduction = ((1 - baseMultPhys) * 100).toFixed(0);
  const eleReduction  = ((1 - baseMultEle)  * 100).toFixed(0);
  const dmgTakenPer100 = (100 * baseMultRaw).toFixed(1);

  // ── Estimated DPS from weapon ──────────────────────────────
  let dpsLine = '';
  if (wep) {
    const mod = WEAPON_MODS.find(m => m.id === eq.weaponMod);
    const modMult = mod ? mod.mult : 1.0;
    const custMult = eq.customized ? 1.20 : 1.0;
    // Assume rank 12 weapon mastery for the snapshot (or actual if available)
    let attrMult = 1.0;
    if (wep.category !== 'caster' && wep.mastery) {
      attrMult = ATTR_DMG_PERCENT[12] || 1.0;
    }
    const avgDmg = ((wep.dmgMin + wep.dmgMax) / 2) * custMult * modMult * attrMult;
    const estDps = (avgDmg / wep.speed).toFixed(1);
    dpsLine = `<span>Est. DPS: <strong>${estDps}</strong> <span class="muted">(vs 60 AR, rank 12)</span></span>`;
  }

  const html = `
    <div class="summary-stats-row">
      <div class="summary-stat-block">
        <div class="summary-stat-value">${hp}</div>
        <div class="summary-stat-label">Max HP</div>
      </div>
      <div class="summary-stat-block">
        <div class="summary-stat-value">${energy}</div>
        <div class="summary-stat-label">Energy</div>
      </div>
      <div class="summary-stat-block">
        <div class="summary-stat-value">${tierAR}</div>
        <div class="summary-stat-label">Armor Rating</div>
      </div>
      <div class="summary-stat-block">
        <div class="summary-stat-value">${physReduction > 0 ? physReduction+'%' : '0%'}</div>
        <div class="summary-stat-label">Phys Reduction</div>
      </div>
      <div class="summary-stat-block">
        <div class="summary-stat-value">${eleReduction > 0 ? eleReduction+'%' : '0%'}</div>
        <div class="summary-stat-label">Ele Reduction</div>
      </div>
      ${wep ? `<div class="summary-stat-block">
        <div class="summary-stat-value">${calcSnapshotDPS(wep, eq, prof)}</div>
        <div class="summary-stat-label">Est. DPS</div>
      </div>` : ''}
    </div>
    <div class="summary-details">
      <div class="summary-section">
        <div class="summary-label">Weapon</div>
        <div>${wepLine}</div>
        ${ohLine ? `<div>${ohLine}</div>` : ''}
      </div>
      <div class="summary-section">
        <div class="summary-label">Damage Taken (per 100 base damage)</div>
        <div>Physical: <strong>${(100*baseMultPhys).toFixed(1)}</strong> dmg (AR ${physAR}${shieldAR ? ' incl. shield' : ''})</div>
        <div>Elemental: <strong>${(100*baseMultEle).toFixed(1)}</strong> dmg (AR ${eleAR})</div>
        <div>Raw (no bonus): <strong>${dmgTakenPer100}</strong> dmg (AR ${tierAR})</div>
      </div>
      ${insigniaNotes.length ? `
      <div class="summary-section">
        <div class="summary-label">Insignias</div>
        ${insigniaNotes.map(n => `<div>${n}</div>`).join('')}
      </div>` : ''}
      ${runeNotes.length ? `
      <div class="summary-section">
        <div class="summary-label">Runes</div>
        ${runeNotes.map(n => `<div>${n}</div>`).join('')}
      </div>` : ''}
    </div>
  `;
  $('equip-summary').innerHTML = html;
}


/* ══════════════════════════════════════════════════════════════
   DAMAGE CALCULATOR TAB
══════════════════════════════════════════════════════════════ */

function syncCalcFromEquip() {
  // Calc now reads directly from equipment state — no separate display to sync
}

$('calc-target-preset').addEventListener('change', e => {
  if (e.target.value) $('calc-target-ar').value = e.target.value;
});

$('btn-open-calc').addEventListener('click', () => {
  const panel = $('calc-popup-inline');
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) {
    runDamageCalc();
  }
});
$('btn-close-calc').addEventListener('click', () => {
  $('calc-popup-inline').classList.add('hidden');
});
$('btn-calc').addEventListener('click', runDamageCalc);

function runDamageCalc() {
  const wep = state.equipment.weaponType;
  const results = $('calc-results');

  if (!wep) {
    results.innerHTML = '<p class="warn">⚠️ Select a weapon above first.</p>';
    return;
  }

  // Read mastery rank from attrRanks (actual slider + rune bonus)
  let attrRank = 0;
  if (wep.category !== 'caster' && wep.mastery) {
    state.allSkills.some(function(s) {
      if (s.attribute_name === wep.mastery && s.attribute < 100) {
        attrRank = (state.attrRanks[s.attribute] || 0) + ((state.runeBonuses && state.runeBonuses[s.attribute]) || 0);
        return true;
      }
      return false;
    });
  }
  attrRank = Math.min(attrRank, 16);

  const targetAR     = +$('calc-target-ar').value || 60;
  const attackerLvl  = 20; // Level 20 assumed
  const bonusDmg     = +$('calc-bonus-dmg').value || 0;
  const armorPen     = (+$('calc-armor-pen').value || 0) / 100;
  const customized   = state.equipment.customized;

  // Weapon mod multiplier
  const mod = WEAPON_MODS.find(m => m.id === state.equipment.weaponMod);
  const modMult = mod ? mod.mult : 1.0;

  // Customization multiplier
  const custMult = customized ? 1.20 : 1.00;

  // Hornbow intrinsic 10% armor penetration
  const hornbowPen = wep.id === 'hornbow' ? 0.10 : 0;
  const totalPenRate = Math.min(armorPen + hornbowPen, 1);

  // Effective armor after penetration
  const effAR = targetAR * (1 - totalPenRate);

  // Armor → damage multiplier  formula: 2^((60-AR)/40)
  const arMult = Math.pow(2, (60 - effAR) / 40);

  // Attribute damage modifier (martial weapons only)
  let attrMult = 1.0;
  if (wep.category !== 'caster' && wep.mastery) {
    attrMult = ATTR_DMG_PERCENT[attrRank] ?? 1.0;
  } else if (wep.category === 'caster') {
    // Caster weapons scale with level, not attribute
    attrMult = attackerLvl / 20;
  }

  // Final base damage range (before armor)
  const baseMin = wep.dmgMin * custMult * modMult;
  const baseMax = wep.dmgMax * custMult * modMult;

  // Against target armor
  const hitMin = baseMin * attrMult * arMult;
  const hitMax = baseMax * attrMult * arMult;
  const avg    = (hitMin + hitMax) / 2;

  // Critical hit: max damage, AR-20
  const critAR   = effAR - 20;
  const critMult = Math.pow(2, (60 - critAR) / 40);
  const critDmg  = baseMax * attrMult * critMult;

  // DPS approximation
  const dps = (avg / wep.speed);
  const critDps = (critDmg / wep.speed);

  // Damage to different armor tiers for comparison
  const arComparisons = [60, 70, 80, 100].map(ar => {
    const effAr2 = ar * (1 - totalPenRate);
    const m = Math.pow(2, (60 - effAr2) / 40);
    const mn = baseMin * attrMult * m + bonusDmg;
    const mx = baseMax * attrMult * m + bonusDmg;
    return { ar, min: mn, max: mx, avg: (mn+mx)/2 };
  });

  const profStr  = wep.mastery ? `${wep.mastery} Rank ${attrRank}` : `Level ${attackerLvl} (caster)`;

  results.innerHTML = `
    <div class="calc-result-header">
      <strong>${wep.name}</strong> (${wep.dmgMin}-${wep.dmgMax} ${wep.dmgType})
      ${customized ? ' · Customized' : ''}
      ${mod && mod.id !== 'none' ? ` · ${mod.name}` : ''}
      ${totalPenRate > 0 ? ` · ${(totalPenRate*100).toFixed(0)}% Armor Pen` : ''}
    </div>
    <div class="calc-result-sub">${profStr} vs. target AR ${targetAR}</div>

    <div class="calc-cards">
      <div class="calc-card">
        <div class="calc-card-label">Normal Hit</div>
        <div class="calc-card-value">${hitMin.toFixed(1)} – ${hitMax.toFixed(1)}</div>
        <div class="calc-card-sub">avg ${avg.toFixed(1)}</div>
      </div>
      <div class="calc-card">
        <div class="calc-card-label">Critical Hit</div>
        <div class="calc-card-value">${critDmg.toFixed(1)}</div>
        <div class="calc-card-sub">AR-20 effective</div>
      </div>
      <div class="calc-card">
        <div class="calc-card-label">Est. DPS (avg)</div>
        <div class="calc-card-value">${dps.toFixed(2)}</div>
        <div class="calc-card-sub">${wep.speed}s attack speed</div>
      </div>
      ${bonusDmg ? `
      <div class="calc-card">
        <div class="calc-card-label">+ Bonus Damage</div>
        <div class="calc-card-value">${bonusDmg}</div>
        <div class="calc-card-sub">armor-ignoring</div>
      </div>` : ''}
    </div>

    <div class="calc-comparison">
      <div class="comparison-label">Damage vs. different armor targets</div>
      <table class="comp-table">
        <thead><tr><th>Target AR</th><th>Min</th><th>Max</th><th>Avg</th><th>+Bonus</th></tr></thead>
        <tbody>
          ${arComparisons.map(row => `
            <tr class="${row.ar === targetAR ? 'active-row' : ''}">
              <td>${row.ar}</td>
              <td>${row.min.toFixed(1)}</td>
              <td>${row.max.toFixed(1)}</td>
              <td>${row.avg.toFixed(1)}</td>
              <td>${(row.avg + bonusDmg).toFixed(1)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="calc-note">
      Formula: Base × Customization × Mod × Attr% × 2^((60-AR)/40).
      Baseline is rank 12 vs. 60 AR. Bonus damage is armor-ignoring and added after.
      <a href="https://wiki.guildwars.com/wiki/Damage_calculation" target="_blank">Source: GW Wiki</a>
    </div>
  ` + getSkillDPSSection(wep, targetAR, totalPenRate, attrRank);
}

/**
 * Generate skill DPS contribution section for the damage calculator.
 * Shows each skill in the bar that has a damage component, resolved at current rank.
 */
function getSkillDPSSection(wep, targetAR, totalPenRate, masteryRank) {
  const skills = state.skillBar.filter(Boolean);
  if (!skills.length) return '';

  const dmgSkills = [];
  skills.forEach(sk => {
    const desc = sk.description || sk.concise || '';
    // Find ANY numeric range (X...Y...Z or X...Y) in the description
    // Then check if "damage" appears nearby (within 30 chars after the range)
    const allRanges = [];
    const rangeRegex = /(\d+)\.\.\.(\d+)(?:\.\.\.(\d+))?/g;
    let match;
    while ((match = rangeRegex.exec(desc)) !== null) {
      // Check if "damage" or "dmg" appears within 40 chars after this range
      const after = desc.substring(match.index, match.index + match[0].length + 40).toLowerCase();
      const before = desc.substring(Math.max(0, match.index - 30), match.index).toLowerCase();
      if (after.includes('damage') || before.includes('damage') || before.includes('deals') || before.includes('strike') || before.includes('takes')) {
        allRanges.push({ at0: +match[1], at15: +match[2] });
        break; // Take the first damage-related range found
      }
    }
    // If no damage keyword found but skill is an Attack Skill, take the first range as bonus damage
    if (!allRanges.length && (sk.type_name === 'Attack Skill' || sk.type_name === 'Pet Attack')) {
      const firstRange = desc.match(/(\d+)\.\.\.(\d+)/);
      if (firstRange) {
        allRanges.push({ at0: +firstRange[1], at15: +firstRange[2] });
      }
    }
    // Also check for flat "+X damage" without ranges (fixed bonus)
    if (!allRanges.length) {
      const flatMatch = desc.match(/\+(\d+)\s+damage/i) || desc.match(/deals?\s+(\d+)\s+damage/i);
      if (flatMatch) {
        allRanges.push({ at0: +flatMatch[1], at15: +flatMatch[1] }); // fixed value
      }
    }

    if (!allRanges.length) return;

    const rank = getEffectiveRank(sk.attribute);
    const resolved = progValue(allRanges[0].at0, allRanges[0].at15, rank);
    const recharge = sk.recharge || 0;
    const activation = sk.activation || 0;
    const dpsContrib = recharge > 0 ? (resolved / (recharge + activation)).toFixed(1) : (activation > 0 ? (resolved / activation).toFixed(1) : '∞');

    dmgSkills.push({
      name: sk.name,
      damage: resolved,
      recharge: recharge,
      activation: activation,
      dpsContrib: dpsContrib,
      type: sk.type_name,
      rank: rank,
    });
  });

  if (!dmgSkills.length) return '<div class="calc-skills-note muted" style="margin-top:12px;">No damage-dealing skills detected in bar.</div>';

  let totalSkillDPS = 0;
  dmgSkills.forEach(s => { if (s.dpsContrib !== '—') totalSkillDPS += parseFloat(s.dpsContrib); });

  let html = '<div class="calc-skill-dps" style="margin-top:14px;border-top:1px solid var(--border);padding-top:12px;">';
  html += '<div class="comparison-label">Skill Damage Contribution (at current attribute ranks)</div>';
  html += '<table class="comp-table"><thead><tr><th>Skill</th><th>Damage</th><th>Recharge</th><th>DPS Contrib</th></tr></thead><tbody>';
  dmgSkills.forEach(s => {
    html += `<tr>
      <td style="text-align:left;font-weight:600;">${esc(s.name)}</td>
      <td>${s.damage}</td>
      <td>${s.recharge}s</td>
      <td><strong>${s.dpsContrib}</strong></td>
    </tr>`;
  });
  html += '</tbody></table>';
  html += `<div style="margin-top:8px;font-size:.8rem;">
    <strong>Weapon auto-attack DPS: ${wep ? (((wep.dmgMin+wep.dmgMax)/2 * (state.equipment.customized?1.2:1) * (WEAPON_MODS.find(m=>m.id===state.equipment.weaponMod)?.mult||1) * (ATTR_DMG_PERCENT[masteryRank]||1)) / wep.speed).toFixed(1) : '—'}</strong>
    + Skill DPS: <strong>${totalSkillDPS.toFixed(1)}</strong>
    = Est. Combined: <strong>${wep ? (parseFloat(((((wep.dmgMin+wep.dmgMax)/2 * (state.equipment.customized?1.2:1) * (WEAPON_MODS.find(m=>m.id===state.equipment.weaponMod)?.mult||1) * (ATTR_DMG_PERCENT[masteryRank]||1)) / wep.speed)).toFixed(1)) + totalSkillDPS).toFixed(1) : '—'}</strong>
  </div>`;
  html += '<div class="muted" style="margin-top:6px;font-size:.7rem;">Skill DPS = damage / (recharge + cast time). Assumes each skill used on cooldown. Actual DPS varies with rotation timing and energy constraints.</div>';
  html += '</div>';
  return html;
}

/* ══════════════════════════════════════════════════════════════
   TOOLTIP
══════════════════════════════════════════════════════════════ */

const tooltip = $('tooltip');

function showTooltip(e, sk) {
  const rank    = getEffectiveRank(sk.attribute);
  const rawDesc = sk.description || sk.concise || '(No description)';

  // Resolve numbers in description at current rank
  const resolvedDesc = resolveDesc(rawDesc, sk.attribute)
    .replace(/<gray>(.*?)<\/gray>/g, '<span class="tt-gray">$1</span>')
    .replace(/<sic\/>/g, '<em>[sic]</em>');

  // Attack skill damage block
  const atkData = computeAttackSkillDamage(sk, 60);
  const atkHtml = atkData ? `
    <div class="tt-attack-block">
      <div class="tt-attack-label">⚔️ Attack vs. AR ${atkData.targetAR} (${atkData.wepName})</div>
      <div class="tt-attack-row">
        <span>Weapon: <strong>${atkData.weaponMin}–${atkData.weaponMax}</strong> avg <strong>${atkData.weaponAvg}</strong></span>
        ${atkData.bonusDmg ? `<span>+Skill: <strong>${atkData.bonusDmg}</strong> (armor-ignoring)</span>` : ''}
        ${atkData.bonusDmg ? `<span>Total avg: <strong>${atkData.totalAvg}</strong></span>` : ''}
      </div>
    </div>` : '';

  tooltip.innerHTML = `
    <div class="tt-prof">${sk.profession_name} · ${sk.campaign_name}</div>
    <div class="tt-name">${esc(sk.name)}${sk.is_elite ? ' ⭐':''}</div>
    <div class="tt-type">${sk.type_name} · ${sk.attribute_name} <span class="tt-rank">@ rank ${rank}</span></div>
    <div class="tt-stats">
      ${sk.energy     ? `<span class="stat-pip">⚡<span>${sk.energy}e</span></span>`    : '<span class="stat-pip">🖊 Signet</span>'}
      ${sk.activation ? `<span class="stat-pip">⏱<span>${sk.activation}s cast</span></span>`:''}
      ${sk.recharge   ? `<span class="stat-pip">🔄<span>${sk.recharge}s recharge</span></span>`:''}
      ${sk.adrenaline ? `<span class="stat-pip">💢<span>${sk.adrenaline} adrenaline</span></span>` :''}
      ${sk.sacrifice  ? `<span class="stat-pip">🩸<span>${sk.sacrifice}% sacrifice</span></span>` :''}
    </div>
    <div class="tt-desc">${resolvedDesc}</div>
    ${atkHtml}
    <div class="tt-attr">Attribute: ${sk.attribute_name} · Rank set to <strong>${rank}</strong></div>`;
  tooltip.classList.remove('hidden');
  moveTooltip(e);
}

function moveTooltip(e) {
  const pad = 14, tw = tooltip.offsetWidth, th = tooltip.offsetHeight;
  let x = e.clientX + pad, y = e.clientY + pad;
  if (x + tw > window.innerWidth  - 8) x = e.clientX - tw - pad;
  if (y + th > window.innerHeight - 8) y = e.clientY - th - pad;
  tooltip.style.left = x + 'px';
  tooltip.style.top  = y + 'px';
}

function hideTooltip() { tooltip.classList.add('hidden'); }

/* ══════════════════════════════════════════════════════════════
   URL PERSISTENCE
══════════════════════════════════════════════════════════════ */

function loadFromURL() {
  const p = new URLSearchParams(location.search);
  const pr = +p.get('p'), sc = +p.get('s');
  if (pr && GW_PROFESSIONS[pr]) selectProf('primary', pr);
  if (!isNaN(sc) && GW_PROFESSIONS[sc]) selectProf('secondary', sc);

  const bar = p.get('bar');
  if (bar && state.allSkills.length) {
    bar.split(',').map(Number).forEach((id, i) => {
      if (i >= 8 || !id) return;
      const sk = state.allSkills.find(s => s.id === id);
      if (sk) state.skillBar[i] = sk;
    });
    renderSkillBar();
    renderSkillGrid();
  }
  const notes = p.get('notes');
  // build-notes textarea removed; notes in URL are now ignored
}

/* ══════════════════════════════════════════════════════════════
   BOOT  (extended below after armor/import sections are defined)
══════════════════════════════════════════════════════════════ */

async function init() {
  // intentionally left empty — overridden below
}

/* ══════════════════════════════════════════════════════════════
   ARMOR TIER SELECTOR
══════════════════════════════════════════════════════════════ */

let selectedArmorTier = null;

function buildArmorTierSelector() {
  // Called once on init; re-called when profession changes via refreshArmorTiers()
  refreshArmorTiers();
}

function refreshArmorTiers() {
  const badge   = $('armor-class-badge');
  const btnCont = $('armor-tier-buttons');
  const detail  = $('armor-tier-detail');

  if (!state.primaryProf) {
    badge.textContent = '— select a profession first —';
    btnCont.innerHTML = '';
    detail.classList.add('hidden');
    return;
  }

  const armorClass = ARMOR_CLASS[state.primaryProf] || 'light';
  const classLabel = { heavy:'Heavy Armor', medium:'Medium Armor', light:'Light Armor' }[armorClass];
  badge.textContent = `${GW_PROFESSIONS[state.primaryProf].name} — ${classLabel}`;
  badge.className = `armor-class-badge armor-class-${armorClass}`;

  const tiers = ARMOR_TIERS[armorClass];
  btnCont.innerHTML = '';
  tiers.forEach(tier => {
    const btn = document.createElement('button');
    btn.className = 'tier-btn' + (selectedArmorTier?.id === tier.id ? ' active' : '');
    btn.dataset.tierId = tier.id;
    btn.innerHTML = `<span class="tier-ar">AR ${tier.ar}</span><span class="tier-name">${tier.name.replace(/ \(AR \d+\)/,'')}</span>`;
    btn.title = tier.notes;
    btn.addEventListener('click', () => selectArmorTier(tier, armorClass));
    btnCont.appendChild(btn);
  });

  // Reselect current tier if it still exists
  if (selectedArmorTier) {
    const stillValid = tiers.find(t => t.id === selectedArmorTier.id);
    if (stillValid) {
      selectArmorTier(stillValid, armorClass);
    } else {
      selectedArmorTier = null;
      detail.classList.add('hidden');
    }
  }
}

let _updatingEquipSummary = false;

function selectArmorTier(tier, armorClass) {
  selectedArmorTier = tier;
  document.querySelectorAll('.tier-btn').forEach(b => b.classList.toggle('active', b.dataset.tierId === tier.id));

  const detail = $('armor-tier-detail');
  detail.classList.remove('hidden');

  $('tier-ar-value').textContent    = `${tier.ar} (per piece)`;
  $('tier-campaign-value').textContent = tier.campaign;
  $('tier-notes-value').textContent  = tier.notes;

  // Damage calculation: how much does 100 physical/elemental deal vs this AR?
  const baseAR = tier.ar;
  const physDmg  = (100 * Math.pow(2, (60 - baseAR) / 40)).toFixed(1);
  const profBonus = getProfArmorBonus(state.primaryProf, armorClass);

  // Warrior gets +20 vs physical inherently; Ranger gets +30 vs elemental
  const physAR  = baseAR + (profBonus.vsPhys || 0);
  const eleAR   = baseAR + (profBonus.vsEle  || 0);
  const physTaken = (100 * Math.pow(2, (60 - physAR) / 40)).toFixed(1);
  const eleTaken  = (100 * Math.pow(2, (60 - eleAR)  / 40)).toFixed(1);
  const noInsig   = (100 * Math.pow(2, (60 - baseAR) / 40)).toFixed(1);

  $('armor-dmg-result')  && ($('armor-dmg-result').textContent  = `${physTaken} dmg (AR ${physAR})`);
  $('armor-ele-result')  && ($('armor-ele-result').textContent  = `${eleTaken} dmg (AR ${eleAR})`);
  $('armor-taken-result')&& ($('armor-taken-result').textContent = `${noInsig} dmg (AR ${baseAR})`);

  // Only call updateEquipSummaryFull if we're not already inside it (prevent infinite recursion)
  if (!_updatingEquipSummary) {
    updateEquipSummaryFull();
  }
  updateStickySnapshot();
}

function getProfArmorBonus(prof, armorClass) {
  // Inherent profession armor bonuses (from basic_armor wiki page)
  if (prof === 1) return { vsPhys: 20 };  // Warrior: +20 vs physical
  if (prof === 2) return { vsEle: 30 };   // Ranger: +30 vs elemental (boots)
  return {};
}

/* Override selectProf to also refresh armor tiers */
/* ══════════════════════════════════════════════════════════════
   GW1 SKILL TEMPLATE DECODER
   Approach verified against build-wars/gw-templates (MIT licence)
   Source spec: wiki.guildwars.com/wiki/Skill_template_format (GNU FDL)

   GW templates are NOT decoded with atob(). Instead each Base64
   character is converted to its 6-bit index, then those bits are
   stored LSB-first in a flat bit-string. bindec_flip() reverses a
   bit-substring before parsing it as an integer, which is how GW
   packs multi-bit values across the 6-bit char boundaries.
══════════════════════════════════════════════════════════════ */

// Standard Base64 alphabet (RFC 3548 / RFC 4648)
const GW_B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Convert a decimal to a bit-string, reversed (LSB-first), padded to `pad` bits
function decbin_pad(dec, pad) {
  return (dec >>> 0).toString(2).split('').reverse().join('').padEnd(pad, '0');
}

// Reverse a bit-string and parse as integer (used to read a field)
function bindec_flip(bitStr) {
  return bitStr === '' ? 0 : parseInt(bitStr.split('').reverse().join(''), 2);
}

// Validate & clean the code, then expand to a flat bit-string
function templateToBits(code) {
  code = code.trim().replace(/\s/g, '').replace(/=/g, '');
  if (!code) throw new Error('Empty template code.');
  if (!/^[A-Za-z0-9+/]*$/.test(code)) throw new Error('Invalid characters — make sure you copied the full code without extra spaces or punctuation.');

  // Each Base64 char → 6-bit LSB-first chunk
  return code.split('').map(ch => {
    const idx = GW_B64.indexOf(ch);
    if (idx === -1) throw new Error(`Invalid Base64 character: "${ch}"`);
    return decbin_pad(idx, 6);
  }).join('');
}

/**
 * Decode a GW1 skill template code string.
 * Returns { profPri, profSec, attributes, skills }
 */
function decodeSkillTemplate(code) {
  let bin = templateToBits(code);

  // ── Read the 4-bit header type ───────────────────────────
  const type = bindec_flip(bin.substring(0, 4));

  // TEMPLATE_SKILL_NEW = 14, TEMPLATE_SKILL_OLD = 0
  // TEMPLATE_EQUIPMENT_NEW = 15, TEMPLATE_EQUIPMENT_OLD = 1
  let bodyStart;
  if (type === 14) {
    // New skill template: 4-bit type + 4-bit version, body starts at bit 8
    bodyStart = 8;
  } else if (type === 0) {
    // Old skill template (pre-April 2007): 4-bit version only, body at bit 4
    bodyStart = 4;
  } else if (type === 15 || type === 1) {
    throw new Error('This is an equipment template, not a skill template. Paste a skill bar code instead (starts with "O" or "A").');
  } else {
    throw new Error(`Unrecognised template type ${type}. Make sure you copied a skill template code (starts with "O").`);
  }

  let offset = bodyStart;

  function read(n) {
    if (offset + n > bin.length) throw new Error('Template data ended unexpectedly — the code may be incomplete.');
    const val = bindec_flip(bin.substring(offset, offset + n));
    offset += n;
    return val;
  }

  // ── Professions ──────────────────────────────────────────
  // 2-bit profession length code (in practice always 0 → 4 bits each)
  read(2); // discard — always 0
  const profPri = read(4);
  const profSec = read(4);

  // ── Attributes ───────────────────────────────────────────
  const attrCount     = read(4);
  const bitsPerAttrId = read(4) + 4;

  const attributes = {};
  for (let i = 0; i < attrCount; i++) {
    const attrId     = read(bitsPerAttrId);
    const attrPoints = read(4);
    attributes[attrId] = {
      name:   TEMPLATE_ATTR_INDEX[attrId] || `Attr #${attrId}`,
      points: attrPoints,
    };
  }

  // ── Skills ───────────────────────────────────────────────
  const bitsPerSkillId = read(4) + 8;
  const skills = [];
  for (let i = 0; i < 8; i++) {
    skills.push(read(bitsPerSkillId));
  }

  return { profPri, profSec, attributes, skills };
}

/* ══════════════════════════════════════════════════════════════
   IMPORT TAB UI
══════════════════════════════════════════════════════════════ */

function buildImportTab() {
  // Import tab removed — functionality now inline on Skills tab
  const btnImport = $('btn-import');
  const codeInput = $('import-code-input');
  if (btnImport) btnImport.addEventListener('click', runImport);
  if (codeInput) codeInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') runImport();
  });
  const btnApply = $('btn-import-apply');
  if (btnApply) btnApply.addEventListener('click', applyImportedBuild);
}

let lastDecodedBuild = null;

function runImport() {
  const code = $('import-code-input').value.trim();
  const errEl = $('import-error');
  const cardEl = $('import-result-card');

  errEl.classList.add('hidden');
  cardEl.classList.add('hidden');
  lastDecodedBuild = null;

  if (!code) {
    showImportError('Please paste a template code first.');
    return;
  }

  let decoded;
  try {
    decoded = decodeSkillTemplate(code);
  } catch(e) {
    showImportError(`❌ Decode failed: ${e.message}`);
    return;
  }

  lastDecodedBuild = decoded;

  // Professions
  const pri = GW_PROFESSIONS[decoded.profPri];
  const sec = GW_PROFESSIONS[decoded.profSec];
  $('imp-primary').textContent   = pri ? `${pri.name} (${pri.abbr})` : `Unknown (${decoded.profPri})`;
  $('imp-secondary').textContent = sec ? (sec.abbr === '—' ? 'None' : `${sec.name} (${sec.abbr})`) : `Unknown (${decoded.profSec})`;

  // Attributes
  const attrEl = $('imp-attributes');
  if (Object.keys(decoded.attributes).length === 0) {
    attrEl.innerHTML = '<span class="muted">No attributes encoded</span>';
  } else {
    attrEl.innerHTML = Object.values(decoded.attributes)
      .sort((a, b) => b.points - a.points)
      .map(a => `<div class="imp-attr-row"><span class="imp-attr-name">${a.name}</span><span class="imp-attr-pts">${a.points}</span></div>`)
      .join('');
  }

  // Skills — map IDs to names (wait for skill data to load)
  renderImportSkillBar(decoded.skills);

  cardEl.classList.remove('hidden');
}

function renderImportSkillBar(skillIds) {
  const el = $('imp-skillbar');
  el.innerHTML = '';
  skillIds.forEach((id, i) => {
    const sk = state.allSkills.find(s => s.id === id);
    const slot = document.createElement('div');
    slot.className = 'imp-skill-slot' + (sk?.is_elite ? ' imp-elite' : '');
    if (id === 0) {
      slot.innerHTML = `<span class="imp-slot-num">${i+1}</span><span class="imp-empty">Empty</span>`;
    } else if (sk) {
      slot.innerHTML = `
        <span class="imp-slot-num">${i+1}</span>
        <span class="imp-skill-name">${esc(sk.name)}</span>
        <span class="imp-skill-type">${sk.type_name}</span>
        ${sk.is_elite ? '<span class="imp-elite-star">⭐</span>' : ''}`;
      slot.addEventListener('mouseenter', e => showTooltip(e, sk));
      slot.addEventListener('mousemove',  e => moveTooltip(e));
      slot.addEventListener('mouseleave', hideTooltip);
    } else {
      slot.innerHTML = `<span class="imp-slot-num">${i+1}</span><span class="imp-unknown">ID ${id}</span>`;
    }
    el.appendChild(slot);
  });
}

function showImportError(msg) {
  const el = $('import-error');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function applyImportedBuild() {
  if (!lastDecodedBuild) return;
  if (!state.allSkills.length) {
    alert('Skill data is still loading. Please wait a moment and try again.');
    return;
  }
  const d = lastDecodedBuild;

  // Set professions
  if (d.profPri && GW_PROFESSIONS[d.profPri]) {
    selectProf('primary', d.profPri);
  }
  if (d.profSec !== undefined && GW_PROFESSIONS[d.profSec]) {
    selectProf('secondary', d.profSec === 0 ? 0 : d.profSec);
  }

  // Apply imported attribute ranks
  // The decoder gives us template attr IDs → { name, points }.
  // We need to map the NAME to the actual attribute ID used in our loaded skill data.
  // Build a reverse map: attribute name → skill data attribute ID (from actual loaded skills)
  if (d.attributes) {
    const nameToAttrId = {};
    state.allSkills.forEach(s => {
      if (s.attribute < 100 && s.attribute_name && !nameToAttrId[s.attribute_name]) {
        nameToAttrId[s.attribute_name] = s.attribute;
      }
    });

    // Reset all ranks to 0 first, then apply imported values
    state.attrRanks = {};
    Object.entries(d.attributes).forEach(([templateAttrId, data]) => {
      const attrName = data.name;
      const realAttrId = nameToAttrId[attrName];
      if (realAttrId !== undefined) {
        state.attrRanks[realAttrId] = Math.min(data.points, 12);
      }
    });
  }

  // Set skill bar — search all skills (including PvP variants and RP skills)
  state.skillBar = new Array(8).fill(null);
  d.skills.forEach((id, i) => {
    if (!id) return;
    const sk = state.allSkills.find(s => s.id === id);
    if (sk) state.skillBar[i] = sk;
  });

  renderSkillBar();
  filterAndRender();
  refreshAttrRankPanel();
  updateEquipSummaryFull();

  // Switch to skills tab
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  document.querySelector('[data-tab="skills"]').classList.add('active');
  $('tab-skills').classList.remove('hidden');

  // Confirm
  const btn = $('btn-import-apply');
  if (btn) {
    btn.textContent = '✅ Loaded!';
    setTimeout(() => { btn.textContent = '⬆ Load into Build Editor'; }, 2000);
  }
}

/* ══════════════════════════════════════════════════════════════
   updateEquipSummaryFull — calls core logic + armor tier refresh
══════════════════════════════════════════════════════════════ */
function updateEquipSummaryFull() {
  if (_updatingEquipSummary) return; // prevent infinite recursion
  _updatingEquipSummary = true;

  refreshArmorTiers();
  updateEquipSummaryCore();

  // Append armor tier section to summary if a tier is selected
  if (selectedArmorTier) {
    const sumEl = $('equip-summary');
    if (sumEl && !sumEl.querySelector('.summary-armor-tier')) {
      const div = document.createElement('div');
      div.className = 'summary-section summary-armor-tier';
      div.innerHTML = `
        <div class="summary-label">Armor Tier</div>
        <div><strong>${selectedArmorTier.name}</strong> — ${selectedArmorTier.campaign}</div>
        <div class="muted">${selectedArmorTier.notes}</div>`;
      sumEl.appendChild(div);
    }
  }

  // Always sync sticky snapshot and damage calc when equipment changes
  updateStickySnapshot();
  syncCalcFromEquip();

  _updatingEquipSummary = false;
}

/* ══════════════════════════════════════════════════════════════
   ROTATION RECOMMENDATIONS
══════════════════════════════════════════════════════════════ */

$('btn-rotation').addEventListener('click', generateRotation);
$('btn-close-rotation').addEventListener('click', () => {
  $('rotation-panel').classList.add('hidden');
});

function generateRotation() {
  const panel = $('rotation-panel');
  const content = $('rotation-content');
  const skills = state.skillBar.filter(Boolean);

  if (skills.length === 0) {
    content.innerHTML = '<p class="muted">Add skills to your bar first.</p>';
    panel.classList.remove('hidden');
    return;
  }

  // Categorize skills by type and function
  const categories = {
    prebuffs: [],     // Stances, enchantments, preparations, echoes, forms
    attacks: [],      // Attack skills, pet attacks
    spells: [],       // Damage spells, hex spells, well spells
    support: [],      // Heals, shouts, chants, signets (non-damage)
    utility: [],      // Resurrect, misc
  };

  skills.forEach(sk => {
    const type = sk.type_name.toLowerCase();
    if (type.includes('stance') || type.includes('enchantment') || type.includes('preparation') || type.includes('echo') || type.includes('form') || type.includes('glyph')) {
      categories.prebuffs.push(sk);
    } else if (type.includes('attack') || type.includes('pet attack')) {
      categories.attacks.push(sk);
    } else if (type.includes('spell') || type.includes('hex') || type.includes('well') || type.includes('ward')) {
      categories.spells.push(sk);
    } else if (type.includes('shout') || type.includes('chant') || type.includes('signet') || type.includes('ritual')) {
      categories.support.push(sk);
    } else {
      categories.utility.push(sk);
    }
  });

  // Calculate energy budget
  let totalEnergyCost = 0;
  let adrenalineSkills = 0;
  skills.forEach(sk => {
    if (sk.adrenaline) adrenalineSkills++;
    else totalEnergyCost += (sk.energy || 0);
  });

  // Build rotation HTML
  let html = '';

  // Warnings
  const warnings = [];
  const hasRes = skills.some(sk => sk.name.toLowerCase().includes('resurrect') || sk.name.toLowerCase().includes('rebirth'));
  if (!hasRes) warnings.push('⚠️ No resurrection skill — consider adding one for party safety.');
  if (skills.filter(sk => sk.is_elite).length > 1) warnings.push('❌ Multiple elites — only 1 can be equipped in-game.');
  if (totalEnergyCost > 40 && !skills.some(sk => sk.type_name.includes('Signet'))) {
    warnings.push('⚠️ High energy cost (' + totalEnergyCost + 'e total) with no signets for free casts.');
  }

  if (warnings.length) {
    html += '<div class="rot-section rot-warnings">' + warnings.map(w => '<div>' + w + '</div>').join('') + '</div>';
  }

  // Phase 1: Pre-buffs
  if (categories.prebuffs.length) {
    html += '<div class="rot-section"><div class="rot-phase-label">Phase 1 — Pre-Buff (before engaging)</div>';
    html += '<div class="rot-phase-desc">Activate these before combat. Maintain throughout fight.</div>';
    categories.prebuffs.forEach(sk => {
      html += rotSkillLine(sk, getSkillNote(sk, 'prebuff'));
    });
    html += '</div>';
  }

  // Phase 2: Opener / Shouts
  if (categories.support.length) {
    html += '<div class="rot-section"><div class="rot-phase-label">Phase 2 — Engage (shouts/support)</div>';
    html += '<div class="rot-phase-desc">Use at fight start for party buffs or before attacking.</div>';
    categories.support.forEach(sk => {
      html += rotSkillLine(sk, getSkillNote(sk, 'support'));
    });
    html += '</div>';
  }

  // Phase 3: Attack chain / spells
  if (categories.attacks.length) {
    html += '<div class="rot-section"><div class="rot-phase-label">Phase 3 — Attack Chain</div>';
    html += '<div class="rot-phase-desc">Use in order. Auto-attack between cooldowns.</div>';
    // Sort attacks: adrenaline skills first (cheaper), then by recharge
    var sorted = categories.attacks.slice().sort(function(a,b) {
      if (a.adrenaline && !b.adrenaline) return -1;
      if (!a.adrenaline && b.adrenaline) return 1;
      return (a.recharge || 0) - (b.recharge || 0);
    });
    sorted.forEach(sk => {
      html += rotSkillLine(sk, getSkillNote(sk, 'attack'));
    });
    html += '</div>';
  }

  if (categories.spells.length) {
    html += '<div class="rot-section"><div class="rot-phase-label">Phase 3 — Spell Rotation</div>';
    html += '<div class="rot-phase-desc">Cast in priority order. Fastest recharge = most spam.</div>';
    var sorted = categories.spells.slice().sort(function(a,b) {
      return (a.recharge || 0) - (b.recharge || 0);
    });
    sorted.forEach(sk => {
      html += rotSkillLine(sk, getSkillNote(sk, 'spell'));
    });
    html += '</div>';
  }

  // Phase 4: Utility
  if (categories.utility.length) {
    html += '<div class="rot-section"><div class="rot-phase-label">Utility (situational)</div>';
    html += '<div class="rot-phase-desc">Use as needed — resurrects, interrupts, emergency skills.</div>';
    categories.utility.forEach(sk => {
      html += rotSkillLine(sk, getSkillNote(sk, 'utility'));
    });
    html += '</div>';
  }

  // Energy/Adrenaline summary
  html += '<div class="rot-section rot-summary">';
  html += '<div class="rot-phase-label">Energy Budget</div>';
  html += '<div>Total energy cost (full rotation): <strong>' + totalEnergyCost + 'e</strong></div>';
  if (adrenalineSkills > 0) html += '<div>Adrenaline skills: <strong>' + adrenalineSkills + '</strong> (charge via auto-attacks)</div>';
  html += '</div>';

  // Rotation repeat timing
  var longestRecharge = 0;
  var prebuffRecharges = [];
  var chainRecharges = [];

  categories.prebuffs.forEach(function(sk) {
    if (sk.recharge) prebuffRecharges.push({ name: sk.name, recharge: sk.recharge });
    if (sk.recharge > longestRecharge) longestRecharge = sk.recharge;
  });
  categories.attacks.concat(categories.spells).forEach(function(sk) {
    if (sk.recharge) chainRecharges.push({ name: sk.name, recharge: sk.recharge });
    if (sk.recharge > longestRecharge) longestRecharge = sk.recharge;
  });

  // Find the shortest recharge in the attack/spell chain — that's your "spam" cooldown
  var shortestChainRecharge = Infinity;
  chainRecharges.forEach(function(s) { if (s.recharge < shortestChainRecharge) shortestChainRecharge = s.recharge; });
  if (shortestChainRecharge === Infinity) shortestChainRecharge = 0;

  html += '<div class="rot-section rot-repeat">';
  html += '<div class="rot-phase-label">⟳ Repeat Timing</div>';

  if (categories.prebuffs.length > 0) {
    var shortestBuff = Infinity;
    categories.prebuffs.forEach(function(sk) {
      // Estimate buff duration — use recharge as proxy (most buffs last roughly their recharge)
      if (sk.recharge && sk.recharge < shortestBuff) shortestBuff = sk.recharge;
    });
    if (shortestBuff < Infinity) {
      html += '<div><strong>Re-buff every ~' + shortestBuff + 's</strong> — your shortest buff/stance expires around this time. Recast before it drops.</div>';
    }
  }

  if (chainRecharges.length > 0) {
    if (shortestChainRecharge <= 5) {
      html += '<div><strong>Spam cycle: ~' + shortestChainRecharge + 's</strong> — your fastest attack/spell comes off cooldown. Use it on recharge, fill with auto-attacks between.</div>';
    }
    // Find when the full chain becomes available again
    var longestChainRecharge = 0;
    chainRecharges.forEach(function(s) { if (s.recharge > longestChainRecharge) longestChainRecharge = s.recharge; });
    if (longestChainRecharge > shortestChainRecharge) {
      html += '<div><strong>Full chain repeats: ~' + longestChainRecharge + 's</strong> — all attack/spell skills are off cooldown. Restart the full rotation from the top.</div>';
    }
  }

  if (categories.prebuffs.length === 0 && chainRecharges.length === 0) {
    html += '<div class="muted">No recharging skills — auto-attack or use skills as they become available.</div>';
  }

  // Adrenaline recharge estimate
  if (adrenalineSkills > 0) {
    var wep = state.equipment.weaponType;
    var atkSpeed = wep ? wep.speed : 1.33;
    var maxAdr = 0;
    skills.forEach(function(sk) { if (sk.adrenaline && sk.adrenaline > maxAdr) maxAdr = sk.adrenaline; });
    if (maxAdr > 0) {
      var chargeTime = (maxAdr * atkSpeed).toFixed(1);
      html += '<div><strong>Adrenaline recharge: ~' + chargeTime + 's</strong> — your biggest adrenaline skill (' + maxAdr + ' strikes) takes this long to charge via auto-attacks.</div>';
    }
  }

  html += '</div>';

  content.innerHTML = html;
  panel.classList.remove('hidden');
}

function rotSkillLine(sk, note) {
  var costStr = '';
  if (sk.adrenaline) costStr = sk.adrenaline + ' adrenaline';
  else if (sk.energy) costStr = sk.energy + 'e';
  else costStr = 'Free';

  var timeStr = '';
  if (sk.activation) timeStr += sk.activation + 's cast';
  if (sk.recharge) timeStr += (timeStr ? ', ' : '') + sk.recharge + 's recharge';

  return '<div class="rot-skill-line">' +
    '<span class="rot-skill-name">' + esc(sk.name) + '</span>' +
    '<span class="rot-skill-cost">' + costStr + '</span>' +
    '<span class="rot-skill-time">' + timeStr + '</span>' +
    (note ? '<span class="rot-skill-note">' + note + '</span>' : '') +
    '</div>';
}

function getSkillNote(sk, phase) {
  var type = sk.type_name.toLowerCase();
  if (phase === 'prebuff') {
    if (type.includes('stance')) return 'Maintain — recast when it drops';
    if (type.includes('enchantment')) return 'Cast pre-fight, recast on recharge';
    if (type.includes('preparation')) return 'Apply once — lasts until overridden';
    if (type.includes('form')) return 'Transform before engaging — long duration';
    return 'Activate before combat';
  }
  if (phase === 'attack') {
    if (sk.adrenaline) return 'Adrenaline — charge with ' + Math.ceil(sk.adrenaline / 1) + ' hits';
    if (sk.recharge && sk.recharge <= 4) return 'Spam on cooldown';
    if (sk.recharge && sk.recharge >= 15) return 'Save for key moments';
    return '';
  }
  if (phase === 'spell') {
    if (sk.recharge && sk.recharge <= 5) return 'Primary spam skill';
    if (sk.recharge && sk.recharge >= 20) return 'Use once per fight or on priority target';
    if (type.includes('hex')) return 'Apply to target, then follow up';
    return '';
  }
  if (phase === 'support') {
    if (type.includes('shout')) return 'Affects allies in earshot';
    if (type.includes('chant')) return 'Triggers on next ally action';
    return '';
  }
  return '';
}

/* ══════════════════════════════════════════════════════════════
   TITLE FARMS TAB
══════════════════════════════════════════════════════════════ */

function buildTitleFarmsTab() {
  const container = $('title-farms-list');
  if (!container || !TITLE_FARMS) return;

  // Sort alphabetically by title name
  const sorted = TITLE_FARMS.slice().sort((a, b) => a.title.localeCompare(b.title));

  // Difficulty colors
  const diffColors = { Easy:'#27ae60', Medium:'#f39c12', Hard:'#e74c3c', Endgame:'#8e44ad' };

  container.innerHTML = `
    <div class="title-list-header">
      <span class="tlh-name">Title</span>
      <span class="tlh-badges">Campaign / Difficulty</span>
      <span class="tlh-gwamm">GWAMM?</span>
    </div>
  ` + sorted.map(t => {
    const tierHtml = t.tiers ? `
      <div class="title-tiers">
        <div class="title-tiers-label">Rank Progression</div>
        <div class="title-tiers-grid">
          ${t.tiers.map(tier => `
            <div class="title-tier-row">
              <span class="tier-rank-num">${tier.rank}</span>
              <span class="tier-rank-name">${esc(tier.name)}</span>
              <span class="tier-rank-pts">${tier.pts} pts</span>
              <span class="tier-rank-bonus">${esc(tier.bonus)}</span>
            </div>
          `).join('')}
        </div>
      </div>` : '';

    const diffBadge = t.difficulty ? `<span class="title-badge title-diff" style="color:${diffColors[t.difficulty] || '#888'}">${t.difficulty}</span>` : '';
    const campaignBadge = t.campaignAbbr ? `<span class="title-badge title-camp">${esc(t.campaignAbbr)}</span>` : '';
    const gwammCheck = t.gwamm ? '✓' : '';

    return `
      <details class="title-farm-details">
        <summary class="title-farm-summary">
          <span class="title-farm-name">${esc(t.title)}</span>
          <span class="title-badges">${campaignBadge}${diffBadge}</span>
          <span class="title-gwamm-col">${gwammCheck}</span>
        </summary>
        <div class="title-farm-body">
          ${tierHtml}
          <div class="title-farm-methods">
            <div class="title-tiers-label">Best Farms</div>
            ${t.farms.map(f => `
              <div class="title-farm-method">
                <div class="tfm-header">
                  <span class="tfm-name">${esc(f.method)}</span>
                  <span class="tfm-rate">${esc(f.rate)}</span>
                </div>
                <div class="tfm-desc">${esc(f.desc)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </details>`;
  }).join('');

  // Weekly bonus schedule
  if (typeof WEEKLY_BONUS_ROTATION !== 'undefined') {
    const scheduleHtml = `
      <section class="card" style="margin-top:16px;">
        <h2>📅 Weekly Bonus Rotation</h2>
        <p class="muted">9-week PvE cycle. Changes every Monday at 15:00 UTC. Farm reputation titles during their bonus week for double points.</p>
        <div class="weekly-schedule">
          ${WEEKLY_BONUS_ROTATION.map(w => `
            <div class="weekly-row">
              <span class="weekly-week">Wk ${w.week}</span>
              <span class="weekly-name">${esc(w.name)}</span>
              <span class="weekly-effect">${esc(w.effect)}</span>
            </div>
          `).join('')}
        </div>
      </section>`;
    container.insertAdjacentHTML('afterend', scheduleHtml);
  }
}

/* ══════════════════════════════════════════════════════════════
   CRAFTING TAB
══════════════════════════════════════════════════════════════ */

function buildCraftingTab() {
  renderCraftKits();
  renderCraftSection('craft-common', CRAFTING_MATERIALS.common);
  renderCraftSection('craft-rare', CRAFTING_MATERIALS.rare);
  renderCraftSection('craft-special', CRAFTING_MATERIALS.special);
  buildArmorRecipeSelector();

  const search = $('crafting-search');
  if (search) {
    search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      document.querySelectorAll('.craft-flip-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = (!q || text.includes(q)) ? '' : 'none';
      });
    });
  }
}

function buildArmorRecipeSelector() {
  const sel = $('armor-recipe-select');
  if (!sel) return;

  // Populate based on current profession
  function refreshRecipeOptions() {
    sel.innerHTML = '<option value="">— Select an armor set —</option>';
    const prof = state.primaryProf;
    if (!prof || !ARMOR_RECIPES[prof]) return;
    ARMOR_RECIPES[prof].forEach((recipe, i) => {
      sel.insertAdjacentHTML('beforeend',
        `<option value="${i}">${recipe.name} (AR ${recipe.ar}) — ${formatGold(recipe.gold)}</option>`);
    });
  }

  refreshRecipeOptions();
  // Re-populate when profession changes (hook into selectProf via observer)
  const origSelectProf = selectProf;
  // We'll just refresh on change — the select is rebuilt each time tab is shown
  sel.addEventListener('change', () => renderArmorRecipe(+sel.value));

  // Also listen for profession changes to refresh options
  const observer = new MutationObserver(() => refreshRecipeOptions());
  const profBtns = $('primary-prof-buttons');
  if (profBtns) observer.observe(profBtns, { attributes: true, subtree: true });

  // Simpler: refresh on focus
  sel.addEventListener('focus', refreshRecipeOptions);
}

function renderArmorRecipe(index) {
  const display = $('armor-recipe-display');
  if (!display) return;
  const prof = state.primaryProf;
  if (!prof || !ARMOR_RECIPES[prof] || isNaN(index)) {
    display.innerHTML = '';
    return;
  }
  const recipe = ARMOR_RECIPES[prof][index];
  if (!recipe) { display.innerHTML = ''; return; }

  const matRows = recipe.materials.map(m => {
    const price = MATERIAL_PRICES[m.name] || '?';
    return `<div class="recipe-mat-row">
      <span class="recipe-mat-name">${esc(m.name)}</span>
      <span class="recipe-mat-qty">×${m.qty}</span>
      <span class="recipe-mat-price">${price} each</span>
    </div>`;
  }).join('');

  display.innerHTML = `
    <div class="recipe-card">
      <div class="recipe-header">
        <strong>${esc(recipe.name)}</strong> — AR ${recipe.ar}
      </div>
      <div class="recipe-location">📍 ${esc(recipe.location)}</div>
      <div class="recipe-gold">💰 Cost: <strong>${formatGold(recipe.gold)}</strong></div>
      <div class="recipe-mats-label">Materials needed (full set):</div>
      <div class="recipe-mats">${matRows}</div>
    </div>
  `;
}

function renderCraftKits() {
  const el = $('craft-kits');
  if (!el || !CRAFTING_MATERIALS.salvageKits) return;
  el.innerHTML = CRAFTING_MATERIALS.salvageKits.map(k => {
    if (k.isPerfect && k.crafters) {
      const crafterRows = k.crafters.map(c => `
        <div class="craft-back-row"><strong>${esc(c.npc)}</strong> — ${esc(c.location)}</div>
        <div class="craft-back-row" style="margin-left:12px;font-size:.7rem;">Cost: ${esc(c.cost)} | Title: ${esc(c.title)}</div>
      `).join('');
      return `
        <div class="craft-flip-card" onclick="this.classList.toggle('flipped')">
          <div class="craft-flip-front craft-kit-card">
            <div class="craft-name">${esc(k.name)}</div>
            <div class="craft-location"><span class="craft-label">💰</span> ${esc(k.cost)} · ${k.charges} charges</div>
            <div class="craft-use"><span class="craft-label">📋</span> ${esc(k.desc)}</div>
            <div class="craft-hint">Click for crafters ▼</div>
          </div>
          <div class="craft-flip-back">
            <div class="craft-back-title">Where to get Perfect Salvage Kits</div>
            ${crafterRows}
            <div class="craft-hint">Click to close ▲</div>
          </div>
        </div>`;
    }
    return `
      <div class="craft-card craft-kit-card">
        <div class="craft-name">${esc(k.name)}</div>
        <div class="craft-location"><span class="craft-label">💰</span> ${esc(k.cost)} · ${k.charges} charges</div>
        <div class="craft-use"><span class="craft-label">📋</span> ${esc(k.desc)}</div>
      </div>`;
  }).join('');
}

function renderCraftSection(containerId, items) {
  const el = $(containerId);
  if (!el) return;
  el.innerHTML = items.map(m => {
    const price = MATERIAL_PRICES[m.name] || '';
    const priceHtml = price ? `<div class="craft-price">${price}</div>` : '';
    const iconName = m.name.replace(/ /g, '_');
    const iconExt = (m.name === 'Bone') ? 'jpg' : 'png';
    const iconUrl = `https://wiki.guildwars.com/wiki/Special:FilePath/${encodeURIComponent(iconName)}.${iconExt}`;
    return `
    <div class="craft-flip-card" onclick="this.classList.toggle('flipped')">
      <div class="craft-flip-front">
        <img class="craft-mat-icon" src="${iconUrl}" alt="" loading="lazy" onerror="this.style.display='none'" />
        <div class="craft-name">${esc(m.name)}</div>
        ${priceHtml}
        <div class="craft-use">${esc(m.front.use)}</div>
        <div class="craft-hint">Click for details ▼</div>
      </div>
      <div class="craft-flip-back">
        <div class="craft-back-title">${esc(m.name)}</div>
        <div class="craft-back-row"><span class="craft-label">📍 Areas:</span> ${esc(m.back.areas)}</div>
        <div class="craft-back-row"><span class="craft-label">👹 Drops from:</span> ${esc(m.back.drops)}</div>
        <div class="craft-back-row"><span class="craft-label">♻️ Salvage from:</span> ${esc(m.back.salvageItems)}</div>
        <div class="craft-back-row"><span class="craft-label">🔨 Kit needed:</span> ${esc(m.back.kit)}</div>
        <div class="craft-hint">Click to close ▲</div>
      </div>
    </div>`;
  }).join('');
}

/* ══════════════════════════════════════════════════════════════
   RUNE STACKING PREVENTION
   Attribute runes don't stack — only 1 per attribute across all slots.
   If you equip a Blood Magic rune on chest, you can't equip any Blood
   Magic rune on another slot.
══════════════════════════════════════════════════════════════ */

function getEquippedAttrRunes() {
  // Returns a Set of attribute rune base keys currently equipped (e.g. "attr_4" for Blood Magic)
  const equipped = new Set();
  const slots = ['head','chest','arms','legs','feet'];
  slots.forEach(slot => {
    const val = state.equipment.slots[slot].rune;
    if (val && val.startsWith('attr_')) {
      // Format: attr_{attrId}_{tier} — extract attrId
      const parts = val.split('_');
      equipped.add('attr_' + parts[1]); // e.g. "attr_4"
    }
    // Vigor is also non-stacking
    if (val && (val === 'uni_vigor_min' || val === 'uni_vigor_maj' || val === 'uni_vigor_sup')) {
      equipped.add('vigor');
    }
  });
  return equipped;
}

function refreshRuneAvailability() {
  // Disable rune options that are already equipped in another slot (non-stacking)
  const slots = ['head','chest','arms','legs','feet'];
  
  document.querySelectorAll('.rune-select').forEach(sel => {
    const thisSlot = sel.dataset.slot;
    const thisVal = state.equipment.slots[thisSlot].rune;

    // Get what's equipped in OTHER slots
    const othersEquipped = new Set();
    slots.forEach(s => {
      if (s === thisSlot) return;
      const v = state.equipment.slots[s].rune;
      if (v && v.startsWith('attr_')) {
        othersEquipped.add(v.split('_').slice(0,2).join('_')); // "attr_4"
      }
      if (v && v.startsWith('uni_vigor')) {
        othersEquipped.add('vigor');
      }
    });

    // Disable options that conflict
    sel.querySelectorAll('option').forEach(opt => {
      const v = opt.value;
      if (!v) return;
      let blocked = false;
      if (v.startsWith('attr_')) {
        const base = v.split('_').slice(0,2).join('_');
        blocked = othersEquipped.has(base);
      }
      if (v.startsWith('uni_vigor')) {
        blocked = othersEquipped.has('vigor');
      }
      opt.disabled = blocked;
      opt.title = blocked ? 'Already equipped — attribute runes do not stack' : '';
    });
  });
}

/* ══════════════════════════════════════════════════════════════
   EQUIPMENT → SKILLS SYNC
   When attribute runes are equipped, add their bonus to attrRanks
   and refresh the skills tab display.
══════════════════════════════════════════════════════════════ */

function syncRuneBonusesToAttrRanks() {
  // Calculate total rune bonuses per attribute
  const runeBonus = {}; // attrId → total bonus from runes
  const slots = ['head','chest','arms','legs','feet'];
  
  slots.forEach(slot => {
    const val = state.equipment.slots[slot].rune;
    if (!val || !val.startsWith('attr_')) return;
    const parts = val.split('_');
    const attrId = +parts[1];
    const tier = parts[2]; // 'minor','major','superior'
    const runeData = RUNES_ATTR.find(r => r.id === tier);
    if (runeData && runeData.bonus) {
      // Only count highest — runes don't stack, but we already prevent duplicates
      runeBonus[attrId] = Math.max(runeBonus[attrId] || 0, runeData.bonus);
    }
  });

  // Store rune bonuses in state so the attr panel can display them
  state.runeBonuses = runeBonus;

  // Refresh skills tab to reflect bonus
  refreshAttrRankPanel();
  renderSkillGrid();
  renderSkillBar();
}

/* ══════════════════════════════════════════════════════════════
   STICKY SNAPSHOT BAR
   Always visible — shows key build stats across all tabs.
══════════════════════════════════════════════════════════════ */

function updateStickySnapshot() { /* removed */ }
function buildStickyProfSelects() { /* removed */ }
function syncStickyProfSelects() { /* removed */ }
/* ══════════════════════════════════════════════════════════════
   ELITE SKILLS TAB
══════════════════════════════════════════════════════════════ */

function buildEliteSkillsTab() {
  // Wait for skills to load, then populate
  // Called after loadSkills completes
}

function populateEliteSkills() {
  const container = $('elite-list');
  const profFilter = $('elite-prof-filter');
  const campFilter = $('elite-campaign-filter');
  const searchInput = $('elite-search');
  if (!container) return;

  // Get all elite skills
  const elites = state.allSkills.filter(s => s.is_elite && !s.is_pvp);

  if (!elites.length) {
    container.innerHTML = '<div class="muted">No elite skills loaded yet.</div>';
    return;
  }

  // Populate filter dropdowns
  const profs = [...new Set(elites.map(s => s.profession_name))].sort();
  profFilter.innerHTML = '<option value="all">All Professions</option>';
  profs.forEach(p => { if (p && p !== 'none') profFilter.insertAdjacentHTML('beforeend', `<option value="${esc(p)}">${esc(p)}</option>`); });

  const camps = [...new Set(elites.map(s => s.campaign_name))].sort();
  campFilter.innerHTML = '<option value="all">All Campaigns</option>';
  camps.forEach(c => { if (c) campFilter.insertAdjacentHTML('beforeend', `<option value="${esc(c)}">${esc(c)}</option>`); });

  function renderElites() {
    const pf = profFilter.value;
    const cf = campFilter.value;
    const q = searchInput.value.trim().toLowerCase();

    let filtered = elites.filter(s => {
      if (pf !== 'all' && s.profession_name !== pf) return false;
      if (cf !== 'all' && s.campaign_name !== cf) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.attribute_name.toLowerCase().includes(q)) return false;
      return true;
    });

    // Group by profession
    const grouped = {};
    filtered.forEach(s => {
      const key = s.profession_name || 'Any';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(s);
    });

    if (!filtered.length) {
      container.innerHTML = '<div class="muted">No elite skills match your filters.</div>';
      return;
    }

    container.innerHTML = Object.entries(grouped).sort((a,b) => a[0].localeCompare(b[0])).map(([prof, skills]) => {
      const profId = skills[0]?.profession || 0;
      return `
        <section class="card elite-prof-group">
          <h3 class="elite-prof-header" style="color:var(--${getColorVar(profId)})">${esc(prof)} (${skills.length})</h3>
          <div class="elite-grid">
            ${skills.sort((a,b) => a.name.localeCompare(b.name)).map(sk => {
              const wikiName = sk.name.replace(/ /g, '_');
              const iconUrl = getSkillIconUrl(sk.name);
              return `
                <div class="elite-card">
                  <img class="elite-icon" src="${iconUrl}" alt="" loading="lazy" onerror="this.style.display='none'" />
                  <div class="elite-info">
                    <a class="elite-name" href="https://wiki.guildwars.com/wiki/${encodeURIComponent(wikiName)}" target="_blank" title="View on GW Wiki — includes boss locations">${esc(sk.name)}</a>
                    <div class="elite-meta">${esc(sk.attribute_name)} · ${esc(sk.type_name)} · ${esc(sk.campaign_name)}</div>
                  </div>
                </div>`;
            }).join('')}
          </div>
        </section>`;
    }).join('');
  }

  profFilter.addEventListener('change', renderElites);
  campFilter.addEventListener('change', renderElites);
  searchInput.addEventListener('input', renderElites);
  renderElites();
}

function getColorVar(profId) {
  const map = {1:'w',2:'r',3:'mo',4:'n',5:'me',6:'e',7:'a',8:'rt',9:'p',10:'d'};
  return map[profId] || 'text-dim';
}

/* ══════════════════════════════════════════════════════════════
   EVENTS CALENDAR
══════════════════════════════════════════════════════════════ */

var GW_EVENTS = [
  { name:'Canthan New Year', dates:'Jan 31 – Feb 7 (UTC)', icon:'🏮', size:'Major',
    rewards:['Lunar Fortunes (alcohol + sweets + party items)', 'Celestial miniatures (unique each year)', 'Festival hat', 'Lunar Tokens', 'Shing Jea Boardwalk open'],
    titles:['Drunkard', 'Sweet Tooth', 'Party Animal'],
    tips:'Lunar Fortunes count for all 3 consumable titles in one item. Stock up.' },
  { name:'Lucky Treats Week', dates:'Mar 14 – ~Mar 21 (St. Patrick\'s Day)', icon:'🍀', size:'Minor',
    rewards:['Four-Leaf Clover (lucky/unlucky title)', 'Shamrock Ale (alcohol)'],
    titles:['Lucky', 'Unlucky', 'Drunkard'],
    tips:'Four-Leaf Clovers give Lucky title points. Shamrock Ale for Drunkard.' },
  { name:'Sweet Treats Week', dates:'Apr 10 – ~Apr 17 (Easter)', icon:'🐣', size:'Minor',
    rewards:['Chocolate Bunny (sweet)', 'Golden Egg (sweet + lucky/unlucky)'],
    titles:['Sweet Tooth', 'Lucky', 'Unlucky'],
    tips:'Golden Eggs give Lucky/Unlucky points AND count as sweets.' },
  { name:'Anniversary Celebration', dates:'Apr 22 – ~May 5 (GW release anniversary)', icon:'🎂', size:'Minor',
    rewards:['Birthday Cupcakes', 'Proofs of Legend', 'Battle Isle Iced Tea', 'Champagne Poppers', 'Sparklers', 'Victory Tokens', 'Shing Jea Boardwalk open'],
    titles:['Sweet Tooth', 'Party Animal', 'Drunkard'],
    tips:'Birthday Cupcakes = sweet. Champagne Poppers/Sparklers = party items. Multiple alcohol drops.' },
  { name:'Dragon Festival', dates:'Jun 27 – ~Jul 11 (Dragon Boat Festival)', icon:'🐉', size:'Major',
    rewards:['Festival hat', 'Victory Tokens', 'Dragon Arena PvP', 'Mini-missions', 'Shing Jea Boardwalk open'],
    titles:['Party Animal'],
    tips:'Dragon Arena is a fun team PvP mode. Victory Tokens can be exchanged for festival items.' },
  { name:'Wintersday in July', dates:'Jul 24 – ~Jul 31', icon:'☀️', size:'Minor',
    rewards:['Eggnog (alcohol)', 'Fruitcake (sweet)', 'Frosty Tonic', 'Snowman Summoner', 'Dwayna vs Grenth'],
    titles:['Drunkard', 'Sweet Tooth'],
    tips:'Same drops as Wintersday but in summer. Good if you missed December.' },
  { name:'Wayfarer\'s Reverie', dates:'Aug 25 – ~Sep 1 (GW2 release anniversary)', icon:'🗺️', size:'Minor',
    rewards:['Wayfarer\'s Mark', 'Exploration quests', 'ALL reputation bonuses active simultaneously (Elonian + Northern + Faction + Luck)'],
    titles:['Sunspear', 'Lightbringer', 'Norn', 'Ebon Vanguard', 'Deldrimor', 'Asura', 'Kurzick', 'Luxon', 'Lucky', 'Unlucky'],
    tips:'BEST EVENT FOR TITLE FARMING. All reputation bonuses stack at once — farm every title track at double rate during this week.' },
  { name:'Pirate Week', dates:'Sep 13 – ~Sep 20 (Talk Like a Pirate Day)', icon:'🏴‍☠️', size:'Minor',
    rewards:['Bottle of Grog (alcohol)', 'NPCs talk and dress like pirates'],
    titles:['Drunkard'],
    tips:'Bottles of Grog are cheap alcohol for Drunkard title.' },
  { name:'Halloween', dates:'Oct 18 – Nov 2 (UTC)', icon:'🎃', size:'Major',
    rewards:['Trick-or-Treat Bags (alcohol + sweets + tonics)', 'Festival hat', 'Costume Brawl PvP', 'Mad King says minigame', 'Pumpkin Cookies', 'Witch\'s Brew', 'Scarred Psyche'],
    titles:['Drunkard', 'Sweet Tooth', 'Party Animal'],
    tips:'Trick-or-Treat bags are the CHEAPEST source of consumables in the game. Buy/farm hundreds for all 3 titles.' },
  { name:'Special Treats Week', dates:'Nov 21 – ~Nov 28 (Thanksgiving)', icon:'🦃', size:'Minor',
    rewards:['Hard Apple Cider (alcohol)', 'Slice of Pumpkin Pie (sweet)'],
    titles:['Drunkard', 'Sweet Tooth'],
    tips:'Cheap sources of alcohol and sweets between Halloween and Wintersday.' },
  { name:'Wintersday', dates:'Dec 19 – Jan 2 (UTC)', icon:'❄️', size:'Major',
    rewards:['Festival hat', 'Candy Cane Shards', 'Eggnog (alcohol)', 'Fruitcake (sweet)', 'Snowman Summoner', 'Frosty Tonic', 'Snowball Arena PvP', 'Secret Lair of the Snowmen dungeon', 'Dwayna vs Grenth', 'Wintergreen Candy Canes (morale boost)'],
    titles:['Drunkard', 'Sweet Tooth', 'Party Animal', 'Deldrimor'],
    tips:'Secret Lair of the Snowmen gives Deldrimor points + holiday drops. Wintergreen Candy Canes give free morale boosts (useful for Survivor). Eggnog = alcohol, Fruitcake = sweet.' },
];

function buildEventsTab() {
  const container = $('events-list');
  if (!container) return;

  // Already sorted chronologically in the data array
  const sorted = GW_EVENTS;

  container.innerHTML = sorted.map(ev => `
    <section class="card event-card">
      <div class="event-header">
        <span class="event-icon">${ev.icon}</span>
        <div class="event-header-info">
          <span class="event-name">${esc(ev.name)} <span class="event-size-badge event-size-${(ev.size||'').toLowerCase()}">${esc(ev.size || '')}</span></span>
          <span class="event-dates">${esc(ev.dates)}</span>
        </div>
      </div>
      <div class="event-body">
        <div class="event-section">
          <span class="event-label">Rewards</span>
          <ul class="event-rewards">${ev.rewards.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
        </div>
        ${ev.titles.length ? `
        <div class="event-section">
          <span class="event-label">Title Tracks Benefited</span>
          <div class="event-titles">${ev.titles.map(t => `<span class="event-title-tag">${esc(t)}</span>`).join('')}</div>
        </div>` : ''}
        <div class="event-section">
          <span class="event-label">💡 Tip</span>
          <p class="event-tip">${esc(ev.tips)}</p>
        </div>
      </div>
    </section>
  `).join('');
}

/* ══════════════════════════════════════════════════════════════
   HEROES GUIDE TAB
══════════════════════════════════════════════════════════════ */

function buildHeroesTab() {
  const container = $('heroes-list');
  const profFilter = $('hero-prof-filter');
  if (!container || !GW_HEROES) return;

  const profs = [...new Set(GW_HEROES.map(h => h.prof))].sort();
  profFilter.innerHTML = '<option value="all">All Professions</option>';
  profs.forEach(p => profFilter.insertAdjacentHTML('beforeend', `<option value="${esc(p)}">${esc(p)}</option>`));

  function render() {
    const pf = profFilter.value;
    const q = ($('hero-search')?.value || '').trim().toLowerCase();
    const filtered = GW_HEROES.filter(h => {
      if (pf !== 'all' && h.prof !== pf) return false;
      if (q && !h.name.toLowerCase().includes(q) && !h.prof.toLowerCase().includes(q)) return false;
      return true;
    });

    // Group by campaign
    const groups = {};
    filtered.forEach(h => {
      const camp = h.campaign.includes('Nightfall') ? 'Nightfall' : (h.campaign.includes('Eye of the North') ? 'Eye of the North' : h.campaign);
      if (!groups[camp]) groups[camp] = [];
      groups[camp].push(h);
    });

    // Render in order: Nightfall first, then EotN, then others
    const campOrder = ['Nightfall', 'Eye of the North', 'Factions (requires Nightfall)'];
    const sortedGroups = Object.entries(groups).sort((a,b) => {
      const ai = campOrder.findIndex(c => a[0].includes(c));
      const bi = campOrder.findIndex(c => b[0].includes(c));
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    const profColors = {Warrior:'w',Ranger:'r',Monk:'mo',Necromancer:'n',Mesmer:'me',Elementalist:'e',Assassin:'a',Ritualist:'rt',Paragon:'p',Dervish:'d'};

    container.innerHTML = sortedGroups.map(([camp, heroes]) => `
      <section class="card">
        <h3 class="hero-group-header">${esc(camp)} (${heroes.length} heroes)</h3>
        <div class="hero-group-list">
          ${heroes.map(h => {
            const colorVar = profColors[h.prof] || 'text-dim';
            return `
            <details class="hero-details" style="border-left-color:var(--${colorVar})">
              <summary class="hero-summary">
                <span class="hero-name">${esc(h.name)}</span>
                <span class="hero-prof" style="color:var(--${colorVar})">${esc(h.prof)}</span>
              </summary>
              <div class="hero-body">
                <div class="hero-row"><span class="hero-label">🔓 Unlock:</span> ${esc(h.unlock)}</div>
                <div class="hero-row"><span class="hero-label">⚔️ Role:</span> ${esc(h.role)}</div>
                <div class="hero-row"><span class="hero-label">📋 Build Suggestion:</span> ${esc(h.build)}</div>
              </div>
            </details>`;
          }).join('')}
        </div>
      </section>
    `).join('');
  }

  profFilter.addEventListener('change', render);
  var heroSearch = $('hero-search');
  if (heroSearch) heroSearch.addEventListener('input', render);
  render();
}

/* ══════════════════════════════════════════════════════════════
   BEGINNER TIPS TAB
══════════════════════════════════════════════════════════════ */

var BEGINNER_TIPS = [
  { category:'Getting Started', tips:[
    'Complete the tutorial and early story missions before exploring — they unlock key game features like secondary professions and heroes.',
    'You get 200 total attribute points at level 20 (170 from leveling + 30 from two quests). You can reassign them freely in any outpost.',
    'Pick up EVERYTHING. Salvage white/blue items for crafting materials. Sell purple/gold items to merchants or salvage with Expert kits for rare materials.',
    'Identify gold items before selling — unidentified items sell for less. Identification Kits cost 100g and pay for themselves.',
    'You can have only 1 elite skill equipped at a time. Capture them from bosses using Signet of Capture.',
  ]},
  { category:'Combat & Builds', tips:[
    'The skill bar has 8 slots — plan your build before leaving town. You cannot change skills outside of outposts.',
    'Bring a resurrection skill in every build. Resurrection Signet is free and available to all professions.',
    'Auto-attack happens naturally — focus on timing your skills rather than clicking constantly.',
    'Conditions stack from different sources but not from the same source. Hexes from different skills always stack.',
    'Armor only matters for the piece that gets hit. Chest (37.5% chance) and legs (25%) get hit most often — prioritize those slots.',
    'Bonus damage from attack skills ("+X damage") is armor-ignoring. This is why attack skills are so powerful against high-armor targets.',
  ]},
  { category:'Heroes & Henchmen', tips:[
    'Heroes (Nightfall/EotN) are vastly superior to henchmen — you control their builds, equipment, and targeting.',
    'Set hero skills and equipment in the Party window (P key). Give them max weapons and proper runes.',
    'A common hero setup: 3 mesmers with Panic/Energy Surge/Ineptitude + 1 healer + 1 protection + support.',
    'Heroes use skills more effectively when you flag them (hold Ctrl + click ground to position, or use hero flags).',
    'You can have up to 7 heroes in your party in most PvE content (with the Mercenary Hero system or in EotN).',
  ]},
  { category:'Economy & Trading', tips:[
    'Ectos (Globs of Ectoplasm) are the de facto currency for expensive items. ~4-7 platinum each.',
    'Material traders and rare material traders sell at fluctuating prices — buy when cheap, sell when expensive.',
    'Lockpicks cost 1.5 platinum but have a chance to not be consumed (scales with Treasure Hunter/Lucky titles).',
    'Nicholas the Traveler gives valuable gifts weekly in exchange for specific trophies. Check his location every Monday.',
    'Runes and insignias can be salvaged from armor drops with Expert/Superior Salvage Kits — some are worth several platinum.',
  ]},
  { category:'Progression & Efficiency', tips:[
    'Rush to max armor as soon as possible. In Prophecies, this means getting to Droknar\'s Forge (many players hire runners).',
    'Hard Mode unlocks after completing a campaign on any character. It doubles XP and improves drops.',
    'Vanquishing (clearing all foes in an area in HM) gives reputation points, XP, and counts toward titles.',
    'Complete all missions in Normal and Hard Mode for Guardian/Protector titles — these give large reputation point bonuses.',
    'Use Consumable sets ("consets": Essence of Celerity + Grail of Might + Armor of Salvation) for difficult content.',
  ]},
  { category:'Title Track Tips', tips:[
    'Don\'t specifically farm reputation titles until you\'ve vanquished and completed all missions — you get points passively from those.',
    'Wait for the weekly bonus rotation: Elonian Support (week 2) doubles Sunspear/Lightbringer; Northern Support (week 5) doubles EotN titles.',
    'Wayfarer\'s Reverie (late August) activates ALL bonuses simultaneously — plan your biggest farming for this event.',
    'Survivor title requires never dying. Start a new character and use safe XP sources (Vaettir farm, Kilroy punchout).',
    'Drunkard/Sweet Tooth/Party Animal can be done AFK in town — use cheap consumables and wait between uses.',
  ]},
  { category:'Quality of Life', tips:[
    'Press L to open the quest log. The green star on the compass shows your active quest direction.',
    'Ctrl+click a skill to ping it in chat. Ctrl+Shift+click to show your build to party members.',
    'Hold Alt to see all nearby item drops. Double-click items in inventory to equip/use them.',
    'You can store 250 of each crafting material in the Xunlai chest (storage) — accessible from any outpost.',
    'Map travel is free and instant to any outpost you\'ve visited. Use it constantly.',
    'The /bonus command unlocks promotional items if your account qualifies.',
    'Press U to see party members\' skill bars — useful for coordinating with heroes and other players.',
  ]},
];

function buildTipsTab() {
  const container = $('tips-list');
  if (!container) return;

  container.innerHTML = BEGINNER_TIPS.map(section => `
    <section class="card tips-section">
      <h3 class="tips-category">${esc(section.category)}</h3>
      <ul class="tips-list">
        ${section.tips.map(tip => `<li class="tip-item">${esc(tip)}</li>`).join('')}
      </ul>
    </section>
  `).join('');
}

/* ══════════════════════════════════════════════════════════════
   REAL BOOT — wires all tabs together
══════════════════════════════════════════════════════════════ */

async function init() {
  renderProfButtons();
  buildStickyProfSelects();
  renderSkillBar();
  buildEquipmentTab();
  buildArmorTierSelector();
  buildImportTab();
  buildAttrRankPanel();
  buildCraftingTab();
  buildTitleFarmsTab();
  buildEventsTab();
  buildTipsTab();
  buildHeroesTab();
  updateEquipSummaryFull();
  updateStickySnapshot();
  await loadSkills();
  loadFromURL();
}

function buildStickyProfSelects() {
  const priSel = $('snap-pri-prof');
  const secSel = $('snap-sec-prof');
  if (!priSel || !secSel) return;

  // Primary
  priSel.innerHTML = '<option value="">— Primary —</option>';
  Object.entries(GW_PROFESSIONS).filter(([id]) => id !== '0').forEach(([id, prof]) => {
    priSel.insertAdjacentHTML('beforeend', '<option value="'+id+'">'+prof.name+'</option>');
  });
  priSel.addEventListener('change', () => {
    const v = +priSel.value;
    if (v) selectProf('primary', v);
    syncStickyProfSelects();
  });

  // Secondary
  secSel.innerHTML = '<option value="0">— None —</option>';
  Object.entries(GW_PROFESSIONS).filter(([id]) => id !== '0').forEach(([id, prof]) => {
    secSel.insertAdjacentHTML('beforeend', '<option value="'+id+'">'+prof.name+'</option>');
  });
  secSel.addEventListener('change', () => {
    const v = +secSel.value;
    selectProf('secondary', v);
    syncStickyProfSelects();
  });
}

function syncStickyProfSelects() {
  const priSel = $('snap-pri-prof');
  const secSel = $('snap-sec-prof');
  if (priSel) priSel.value = state.primaryProf || '';
  if (secSel) secSel.value = state.secondaryProf || '0';
}

init();

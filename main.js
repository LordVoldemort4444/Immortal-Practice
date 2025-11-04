// ======== Immortal Practice — Idle Prototype ========
// Simple, framework-free. Persists to localStorage.
// One "year" = DAY_SECONDS (default 240s). Hourglass skips 1y.

const DAY_SECONDS = 240; // 4 minutes
const AUTOSAVE_EVERY_MS = 10000;

const ANIMALS = ["Wolf","Fox","Bear","Bird"];
const ELEMENTS = ["Fire","Ice","Gold","Electric"];
const DIMENSIONS = ["Animal","Human","Miraculous","God","Immortal"];

const ELEMENT_EFFECT = {
  // attacker -> defender multiplier
  Fire:     { Ice: 1.5, Gold: 0.75, Fire: 1, Electric: 1 },
  Ice:      { Electric: 1.5, Fire: 0.75, Ice: 1, Gold: 1 },
  Gold:     { Fire: 1.5, Electric: 0.75, Gold: 1, Ice: 1 },
  Electric: { Gold: 1.5, Ice: 0.75, Electric: 1, Fire: 1 },
};

const EVO_RULES = [
  { reqYears: 0,    reqLevel: 1,  mult: 1.00 }, // Animal
  { reqYears: 100,  reqLevel: 5,  mult: 1.20 }, // Human
  { reqYears: 300,  reqLevel: 12, mult: 1.45 }, // Miraculous
  { reqYears: 600,  reqLevel: 20, mult: 1.80 }, // God
  { reqYears: 1000, reqLevel: 30, mult: 2.40 }, // Immortal
];

const UPGRADE_DEFS = [
  { key: "atk",  name: "Attack",  baseCost: 30 },
  { key: "def",  name: "Defense", baseCost: 30 },
  { key: "hp",   name: "Vitality",baseCost: 30 },
  { key: "idle", name: "Idle Gain", baseCost: 50 }, // boosts essence/sec
];

// ---------- State ----------
let S = load() ?? createDefaultState();

function createDefaultState() {
  return {
    version: 1,
    animal: "Wolf",
    element: "Fire",
    dimensionIndex: 0,       // 0..4
    level: 1,
    xp: 0,
    xpToLevel: 20,
    years: 0,
    daySeconds: 0,           // 0..DAY_SECONDS
    essence: 0,
    hourglasses: 0,
    stats: { atk: 5, def: 3, hp: 30, idle: 1 },
    upgrades: { atk: 0, def: 0, hp: 0, idle: 0 },
    lastTick: Date.now(),
  };
}

// ---------- Utility ----------
function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
function fmt(n){ return Number.isInteger(n) ? n.toString() : n.toFixed(2); }
function multForDimension(idx){ return EVO_RULES[idx].mult; }

function save() {
  localStorage.setItem("immortal.save", JSON.stringify(S));
}

function load() {
  try {
    const raw = localStorage.getItem("immortal.save");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function wipe() {
  localStorage.removeItem("immortal.save");
  S = createDefaultState();
  renderAll();
}

// ---------- Idle Tick ----------
function tick() {
  const now = Date.now();
  const elapsed = Math.max(0, now - S.lastTick) / 1000; // seconds
  S.lastTick = now;

  // Essence gain per sec: base (idle) * dimension multiplier
  const gain = S.stats.idle * multForDimension(S.dimensionIndex) * elapsed;
  S.essence += gain;

  // Year progress
  S.daySeconds += elapsed;
  while (S.daySeconds >= DAY_SECONDS) {
    S.daySeconds -= DAY_SECONDS;
    S.years += 1;
    // Small birthday bonus
    S.essence += 5 + S.level;
  }

  renderTop();
}
setInterval(tick, 1000);
setInterval(()=>save(), AUTOSAVE_EVERY_MS);

// ---------- Battles ----------
function makeEnemy(tier) {
  // Tier 0..4 roughly maps to dimensions; scale with years and level
  const scale = 1 + tier * 0.45 + (S.years/400);
  const base = 1 + S.level * 0.15;

  const enemy = {
    name: [
      "Stray Wisp","Bone Jackal","Frost Vixen","Gilded Turtle",
      "Storm Kite","Miraculous Ape","Divine Sentinel","Void Wyrm"
    ][Math.floor(Math.random()*8)],
    element: ELEMENTS[Math.floor(Math.random()*ELEMENTS.length)],
    atk: Math.round((4 + S.stats.atk*0.8) * base * scale),
    def: Math.round((3 + S.stats.def*0.8) * base * scale),
    hp:  Math.round((24 + S.stats.hp*0.8) * base * scale),
  };
  return enemy;
}

function damageCalc(attackerAtk, defenderDef, aEl, dEl) {
  const base = Math.max(1, attackerAtk - Math.floor(defenderDef*0.6));
  const mult = (ELEMENT_EFFECT[aEl]?.[dEl] ?? 1);
  // small randomness
  const rand = 0.9 + Math.random()*0.2;
  return Math.max(1, Math.floor(base * mult * rand));
}

function simulateBattle(tier) {
  const log = [];
  const hero = {
    name: `${S.animal} (${S.element})`,
    element: S.element,
    atk: Math.round(S.stats.atk * multForDimension(S.dimensionIndex)),
    def: Math.round(S.stats.def * multForDimension(S.dimensionIndex)),
    hp:  Math.round(S.stats.hp  * multForDimension(S.dimensionIndex)) + 10*S.level
  };
  const enemy = makeEnemy(tier);

  log.push(`You encountered a ${enemy.element} ${enemy.name}!`);
  let round = 1;
  let hHP = hero.hp, eHP = enemy.hp;

  while (hHP > 0 && eHP > 0 && round < 50) {
    const hdmg = damageCalc(hero.atk, enemy.def, hero.element, enemy.element);
    eHP -= hdmg;
    log.push(`Round ${round}: You dealt ${hdmg} → Enemy HP ${Math.max(0,eHP)}/${enemy.hp}`);
    if (eHP <= 0) break;

    const edmg = damageCalc(enemy.atk, hero.def, enemy.element, hero.element);
    hHP -= edmg;
    log.push(`Round ${round}: Enemy dealt ${edmg} → Your HP ${Math.max(0,hHP)}/${hero.hp}`);
    round++;
  }

  const win = eHP <= 0 && hHP > 0;
  if (win) {
    const xpGain = 6 + Math.ceil((tier+1) * (1 + S.level/10));
    const essenceGain = 12 + Math.ceil((tier+1) * (1 + S.level/8));
    S.xp += xpGain;
    S.essence += essenceGain;

    // Chance for hourglass (higher tier = higher chance)
    const chance = 0.08 + tier*0.05;
    if (Math.random() < chance) {
      S.hourglasses += 1;
      log.push(`✨ You won! +${xpGain} XP, +${essenceGain} Essence, +1 Hourglass`);
    } else {
      log.push(`✨ You won! +${xpGain} XP, +${essenceGain} Essence`);
    }
    checkLevelUp(log);
  } else {
    log.push(`💀 Defeat. Train more before reattempting.`);
  }
  return log.join("\n");
}

function checkLevelUp(logArr) {
  while (S.xp >= S.xpToLevel) {
    S.xp -= S.xpToLevel;
    S.level++;
    S.xpToLevel = Math.floor(S.xpToLevel * 1.25 + 10);
    // tiny stat bump on level
    S.stats.atk += 1; S.stats.def += 1; S.stats.hp += 2;
    logArr?.push?.(`⬆️ Level Up! You are now Level ${S.level}.`);
  }
}

// ---------- Upgrades ----------
function upgradeCost(key, level) {
  const def = UPGRADE_DEFS.find(u=>u.key===key);
  return Math.floor(def.baseCost * Math.pow(1.4, level));
}
function tryUpgrade(key) {
  const current = S.upgrades[key] ?? 0;
  const cost = upgradeCost(key, current);
  if (S.essence < cost) return false;

  S.essence -= cost;
  S.upgrades[key] = current + 1;

  if (key === "atk") S.stats.atk += 2;
  if (key === "def") S.stats.def += 2;
  if (key === "hp")  S.stats.hp  += 6;
  if (key === "idle") S.stats.idle += 0.5;

  renderUpgrades();
  renderTop();
  return true;
}

// ---------- Evolution ----------
function evolveEligible() {
  const idx = S.dimensionIndex;
  if (idx >= DIMENSIONS.length-1) return { ok:false, reason:"Max evolution reached." };
  const next = EVO_RULES[idx+1];
  if (S.years < next.reqYears) return { ok:false, reason:`Need ${next.reqYears} years.` };
  if (S.level < next.reqLevel) return { ok:false, reason:`Need level ${next.reqLevel}.` };
  return { ok:true };
}
function performEvolve() {
  const check = evolveEligible();
  if (!check.ok) return check;

  S.dimensionIndex++;
  // grant a bonus & reset some soft stuff
  S.essence += 100 + 20*S.dimensionIndex;
  S.stats.atk += 3; S.stats.def += 3; S.stats.hp += 12;
  return { ok:true };
}

// ---------- UI Wiring ----------
const el = {
  heroSummary: document.getElementById("heroSummary"),
  progressSummary: document.getElementById("progressSummary"),
  resourceSummary: document.getElementById("resourceSummary"),
  battleTier: document.getElementById("battleTier"),
  battleLog: document.getElementById("battleLog"),
  btnBattle: document.getElementById("btnBattle"),
  btnUseHourglass: document.getElementById("btnUseHourglass"),
  btnSwitchAnimal: document.getElementById("btnSwitchAnimal"),
  btnSwitchElement: document.getElementById("btnSwitchElement"),
  upgradeList: document.getElementById("upgradeList"),
  evolveInfo: document.getElementById("evolveInfo"),
  evolveLog: document.getElementById("evolveLog"),
  btnEvolve: document.getElementById("btnEvolve"),
  saveBtn: document.getElementById("saveBtn"),
  wipeBtn: document.getElementById("wipeBtn")
};

function renderTop() {
  el.heroSummary.innerHTML = [
    `Animal: <b>${S.animal}</b>`,
    `Element: <b>${S.element}</b>`,
    `Dimension: <b>${DIMENSIONS[S.dimensionIndex]}</b> (x${multForDimension(S.dimensionIndex).toFixed(2)})`,
    `Level: <b>${S.level}</b> • XP: <b>${S.xp}/${S.xpToLevel}</b>`,
    `Stats: ATK <b>${S.stats.atk}</b> • DEF <b>${S.stats.def}</b> • HP <b>${S.stats.hp}</b> • Idle/s <b>${S.stats.idle.toFixed(1)}</b>`
  ].join("<br>");

  const dayPct = Math.floor((S.daySeconds / DAY_SECONDS) * 100);
  el.progressSummary.innerHTML = [
    `Years lived: <b>${S.years}</b>`,
    `Day progress: <b>${dayPct}%</b> of year`,
  ].join("<br>");

  el.resourceSummary.innerHTML = [
    `Essence: <b>${Math.floor(S.essence)}</b>`,
    `Hourglasses: <b>${S.hourglasses}</b>`
  ].join("<br>");

  renderEvolve();
}
function renderUpgrades() {
  el.upgradeList.innerHTML = "";
  for (const u of UPGRADE_DEFS) {
    const lvl = S.upgrades[u.key] ?? 0;
    const cost = upgradeCost(u.key, lvl);
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${u.name}</h3>
      <div class="kv">Level: <b>${lvl}</b></div>
      <div class="kv">Cost: <b>${cost} Essence</b></div>
      <button data-upg="${u.key}">Upgrade</button>
    `;
    card.querySelector("button").addEventListener("click", ()=>{
      const ok = tryUpgrade(u.key);
      if (!ok) alert("Not enough Essence!");
    });
    el.upgradeList.appendChild(card);
  }
}
function renderEvolve() {
  const idx = S.dimensionIndex;
  const next = EVO_RULES[idx+1];
  if (!next) {
    el.evolveInfo.innerHTML = `You are at the final dimension: <b>${DIMENSIONS[idx]}</b>.`;
    return;
  }
  el.evolveInfo.innerHTML = [
    `Current: <b>${DIMENSIONS[idx]}</b> (x${EVO_RULES[idx].mult.toFixed(2)})`,
    `Next: <b>${DIMENSIONS[idx+1]}</b> (x${next.mult.toFixed(2)})`,
    `Requires: <b>${next.reqYears} years</b> & <b>Level ${next.reqLevel}</b>`
  ].join("<br>");
}

function renderAll(){
  renderTop();
  renderUpgrades();
}

// Tabs
document.querySelectorAll(".tab").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".tab").forEach(b=>b.classList.remove("active"));
    document.querySelectorAll(".tabpanel").forEach(p=>p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
  });
});

// Buttons
el.btnBattle.addEventListener("click", ()=>{
  const tier = Number(el.battleTier.value);
  const out = simulateBattle(tier);
  el.battleLog.textContent = out;
  renderTop();
});
el.btnUseHourglass.addEventListener("click", ()=>{
  if (S.hourglasses <= 0) return alert("No hourglasses.");
  S.hourglasses -= 1;
  S.years += 1;
  S.essence += 10;
  renderTop();
});
el.btnEvolve.addEventListener("click", ()=>{
  const res = performEvolve();
  if (!res.ok) {
    el.evolveLog.textContent = `Cannot evolve: ${res.reason}`;
  } else {
    el.evolveLog.textContent = `✨ You evolved into ${DIMENSIONS[S.dimensionIndex]}! Multipliers increased.`;
    renderAll();
  }
});
el.btnSwitchAnimal.addEventListener("click", ()=>{
  const idx = (ANIMALS.indexOf(S.animal)+1) % ANIMALS.length;
  S.animal = ANIMALS[idx];
  renderTop();
});
el.btnSwitchElement.addEventListener("click", ()=>{
  const idx = (ELEMENTS.indexOf(S.element)+1) % ELEMENTS.length;
  S.element = ELEMENTS[idx];
  renderTop();
});
el.saveBtn.addEventListener("click", save);
el.wipeBtn.addEventListener("click", ()=>{
  if (confirm("Wipe save and restart?")) wipe();
});

// Kickoff
renderAll();

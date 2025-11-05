import { DAY_SECONDS, EVO_RULES, UPGRADE_DEFS, DIMENSIONS, ABILITY_DEFS, ANIMALS, ELEMENTS } from "./constants.js";
import { S, save, wipe, derivedLevel, multForDimension } from "./state.js";
import { startBattle, fleeBattle, getBattle, onBattleLog, onBattleUpdate, actStrike, actGuard, actElementSkill, actMeditate, actBurst, setCooldown, abilityOnCooldown } from "./battle.js";

// ----- DOM cache -----
const el = {
  heroSummary: document.getElementById("heroSummary"),
  progressSummary: document.getElementById("progressSummary"),
  resourceSummary: document.getElementById("resourceSummary"),
  prompt: document.getElementById("prompt"),
  // panels
  battlePanel: document.getElementById("battlePanel"),
  upgradesPanel: document.getElementById("upgradesPanel"),
  evolvePanel: document.getElementById("evolvePanel"),
  codexPanel: document.getElementById("codexPanel"),
  // battle elements
  battleTier: document.getElementById("battleTier"),
  btnStartBattle: document.getElementById("btnStartBattle"),
  btnRun: document.getElementById("btnRun"),
  heroStatus: document.getElementById("heroStatus"),
  enemyStatus: document.getElementById("enemyStatus"),
  abilityList: document.getElementById("abilityList"),
  battleLog: document.getElementById("battleLog"),
  // upgrades
  upgradeList: document.getElementById("upgradeList"),
  // evolve
  evolveInfo: document.getElementById("evolveInfo"),
  evolveLog: document.getElementById("evolveLog"),
  btnEvolve: document.getElementById("btnEvolve"),
  // top actions
  saveBtn: document.getElementById("saveBtn"),
  wipeBtn: document.getElementById("wipeBtn"),
  btnUseHourglass: document.getElementById("btnUseHourglass"),
  btnSwitchAnimal: document.getElementById("btnSwitchAnimal"),
  btnSwitchElement: document.getElementById("btnSwitchElement"),
};

function fmt(n){ return Number.isInteger(n) ? n.toString() : n.toFixed(2); }

// ----- Top HUD -----
export function renderTop() {
  const lvl = derivedLevel();
  el.heroSummary.innerHTML = [
    `Animal: <b>${S.animal}</b>`,
    `Element: <b>${S.element}</b>`,
    `Dimension: <b>${DIMENSIONS[S.dimensionIndex]}</b> (x${multForDimension(S.dimensionIndex).toFixed(2)})`,
    `Years: <b>${S.years}</b> • Level (from years): <b>${lvl}</b>`,
    `Stats: ATK <b>${S.stats.atk}</b> • DEF <b>${S.stats.def}</b> • HP <b>${S.stats.hp}</b> • Idle/s <b>${S.stats.idle.toFixed(1)}</b>`
  ].join("<br>");

  const dayPct = Math.floor((S.daySeconds / DAY_SECONDS) * 100);
  el.progressSummary.innerHTML = [
    `Day: <b>${S.days}</b> / 360`,
    `Day progress: <b>${dayPct}%</b>`,
    `Years lived: <b>${S.years}</b>`
  ].join("<br>");

  el.resourceSummary.innerHTML = [
    `Essence: <b>${Math.floor(S.essence)}</b>`,
    `Hourglasses: <b>${S.hourglasses}</b>`
  ].join("<br>");

  renderEvolve();
  renderUpgrades();
}

// ----- Evolve -----
function evolveEligible() {
  const idx = S.dimensionIndex;
  if (idx >= DIMENSIONS.length-1) return { ok:false, reason:"Max evolution reached." };
  const next = EVO_RULES[idx+1];
  if (S.years < next.reqYears) return { ok:false, reason:`Need ${next.reqYears} years.` };
  return { ok:true };
}
function performEvolve() {
  const check = evolveEligible();
  if (!check.ok) return check;
  S.dimensionIndex++;
  S.essence += 100 + 20*S.dimensionIndex;
  S.stats.atk += 3; S.stats.def += 3; S.stats.hp += 12;
  return { ok:true };
}
function renderEvolve() {
  const idx = S.dimensionIndex;
  const next = EVO_RULES[idx+1];
  if (!next) { el.evolveInfo.innerHTML = `Final dimension: <b>${DIMENSIONS[idx]}</b>.`; return; }
  el.evolveInfo.innerHTML = [
    `Current: <b>${DIMENSIONS[idx]}</b> (x${EVO_RULES[idx].mult.toFixed(2)})`,
    `Next: <b>${DIMENSIONS[idx+1]}</b> (x${next.mult.toFixed(2)})`,
    `Requires: <b>${next.reqYears} years</b>`
  ].join("<br>");
}

// ----- Upgrades -----
function renderUpgrades() {
  el.upgradeList.innerHTML = "";
  for (const u of UPGRADE_DEFS) {
    const lvl = S.upgrades[u.key] ?? 0;
    const cost = Math.floor(u.baseCost * Math.pow(1.4, lvl));
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${u.name}</h3>
      <div class="kv">Level: <b>${lvl}</b></div>
      <div class="kv">Cost: <b>${cost} Essence</b></div>
      <button data-upg="${u.key}">Upgrade</button>
    `;
    card.querySelector("button").addEventListener("click", ()=>{
      if (S.essence < cost) return alert("Not enough Essence!");
      S.essence -= cost;
      S.upgrades[u.key] = lvl + 1;
      if (u.key === "atk") S.stats.atk += 2;
      if (u.key === "def") S.stats.def += 2;
      if (u.key === "hp")  S.stats.hp  += 6;
      if (u.key === "idle") S.stats.idle += 0.5;
      renderTop();
    });
    el.upgradeList.appendChild(card);
  }
}

// ----- Battle Panel -----
export function renderBattleHUD() {
  const B = getBattle();
  if (!B) {
    el.heroStatus.innerHTML = `HP: — / —<br>ATK: — • DEF: —`;
    el.enemyStatus.innerHTML = `No enemy. Click <b>Start Battle</b>.`;
    const defs = ABILITY_DEFS(S.element);
    el.abilityList.innerHTML = "";
    defs.forEach(def=>{
      const btn = document.createElement("button");
      btn.textContent = def.name + (def.unlockYear?` (${def.unlockYear}y)`:"");
      btn.disabled = true;
      el.abilityList.appendChild(btn);
    });
    return;
  }
  el.heroStatus.innerHTML = [
    `HP: <b>${B.heroHP}</b> / ${B.hero.maxHp}`,
    `ATK: <b>${B.hero.atk}</b> • DEF: <b>${B.hero.def}</b>`,
    `Guarding: <b>${B.heroGuard ? "Yes" : "No"}</b>`,
    `Turn: <b>${B.turn === "player" ? "You" : "Enemy"}</b>`
  ].join("<br>");
  el.enemyStatus.innerHTML = [
    `Enemy: <b>${B.enemy.element} ${B.enemy.name}</b>`,
    `HP: <b>${B.enemyHP}</b> / ${B.enemy.hp}`,
    `ATK: <b>${B.enemy.atk}</b> • DEF: <b>${B.enemy.def}</b>`,
    `Guarding: <b>${B.enemyGuard ? "Yes" : "No"}</b>`
  ].join("<br>");

  const defs = ABILITY_DEFS(S.element);
  el.abilityList.innerHTML = "";
  defs.forEach(def => {
    const btn = document.createElement("button");
    const cdLeft = B.cds?.[def.key] ?? 0;
    const locked = S.years < (def.unlockYear ?? 0);
    const disabled = !!locked || !!cdLeft || B.turn !== "player";
    const label = locked
      ? `${def.name} (${def.unlockYear}y)`
      : cdLeft ? `${def.name} (CD ${cdLeft})` : def.name;
    btn.textContent = label;
    if (disabled) btn.disabled = true;
    btn.title = def.desc || "";
    btn.addEventListener("click", ()=>{
      if (def.key === "strike") return actStrike();
      if (def.key === "guard") return actGuard();
      if (def.key === "elemSkill") { setCooldown(def.key, def.cd); return actElementSkill(def.power, def.pierce); }
      if (def.key === "burst")     { setCooldown(def.key, def.cd); return actBurst(def.power, def.pierce); }
      if (def.key === "med")       { setCooldown(def.key, def.cd); return actMeditate(def.healPct, def.essence); }
    });
    el.abilityList.appendChild(btn);
  });
  // log output is handled by onBattleLog
}

// hook battle events
onBattleLog(line => {
  const B = getBattle(); if (!B) return;
  B.log.push(line);
  if (B.log.length > 20) B.log = B.log.slice(-20);
  el.battleLog.textContent = B.log.join("\n");
});
onBattleUpdate(()=> renderBattleHUD());

// ----- Panels open/close -----
export function openPanel(node){ node.classList.remove("hidden"); }
export function closePanel(node){ node.classList.add("hidden"); }
document.querySelectorAll(".close").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const target = btn.getAttribute("data-close");
    document.querySelector(target).classList.add("hidden");
  });
});

// ----- Button wiring (top & panels) -----
export function wireButtons() {
  // Battle
  el.btnStartBattle.addEventListener("click", ()=>{
    const tier = Number(el.battleTier.value);
    startBattle(tier);
  });
  el.btnRun.addEventListener("click", ()=> fleeBattle());

  // Hourglass
  el.btnUseHourglass.addEventListener("click", ()=>{
    if (S.hourglasses <= 0) return alert("No hourglasses.");
    S.hourglasses -= 1;
    S.years += 1;
    S.essence += 10;
    renderTop();
  });

  // Evolve
  el.btnEvolve.addEventListener("click", ()=>{
    const res = (function(){
      const idx = S.dimensionIndex;
      if (idx >= DIMENSIONS.length-1) return { ok:false, reason:"Max evolution reached." };
      const next = EVO_RULES[idx+1];
      if (S.years < next.reqYears) return { ok:false, reason:`Need ${next.reqYears} years.` };
      S.dimensionIndex++;
      S.essence += 100 + 20*S.dimensionIndex;
      S.stats.atk += 3; S.stats.def += 3; S.stats.hp += 12;
      return { ok:true };
    })();
    if (!res.ok) el.evolveLog.textContent = `Cannot evolve: ${res.reason}`;
    else {
      el.evolveLog.textContent = `✨ Evolved to ${DIMENSIONS[S.dimensionIndex]}! Multipliers up.`;
      renderTop();
    }
  });

  // Switch animal/element (disabled during battle)
  el.btnSwitchAnimal.addEventListener("click", ()=>{
    if (getBattle()) return alert("Can't switch during battle.");
    const idx = (ANIMALS.indexOf(S.animal)+1) % ANIMALS.length;
    S.animal = ANIMALS[idx];
    renderTop();
  });
  el.btnSwitchElement.addEventListener("click", ()=>{
    if (getBattle()) return alert("Can't switch during battle.");
    const idx = (ELEMENTS.indexOf(S.element)+1) % ELEMENTS.length;
    S.element = ELEMENTS[idx];
    renderTop();
  });

  // Save / Wipe
  el.saveBtn.addEventListener("click", save);
  el.wipeBtn.addEventListener("click", ()=>{
    if (confirm("Wipe save and restart?")) { wipe(); renderTop(); renderBattleHUD(); }
  });
}

// Utilities for prompt bubble (used by overworld)
export function showPrompt(text){ el.prompt.textContent = text; el.prompt.classList.add("show"); }
export function hidePrompt(){ el.prompt.classList.remove("show"); }
export { el as Els };

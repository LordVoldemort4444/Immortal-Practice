import { S, derivedLevel, multForDimension } from "./state.js";
import { ELEMENTS, ELEMENT_EFFECT, DEF_FACTOR } from "./constants.js";

// ----- tiny event hooks so UI can subscribe without circular imports -----
let _onLog = null, _onUpdate = null;
export function onBattleLog(fn){ _onLog = fn; }
export function onBattleUpdate(fn){ _onUpdate = fn; }
function emitLog(msg){ if (_onLog) _onLog(msg); }
function emitUpdate(){ if (_onUpdate) _onUpdate(); }

function elementMult(attEl, defEl) {
  return (ELEMENT_EFFECT[attEl] && ELEMENT_EFFECT[attEl][defEl]) || 1;
}
function rollDamage(attackerAtk, defenderDef, attEl, defEl, pierce=0) {
  const effectiveDef = Math.floor(defenderDef * DEF_FACTOR * (1 - pierce));
  const base = Math.max(1, attackerAtk - effectiveDef);
  const mult = elementMult(attEl, defEl);
  const rand = 0.9 + Math.random() * 0.2;
  return Math.max(1, Math.floor(base * mult * rand));
}

function makeEnemy(tier) {
  const inherit = 0.5;
  const base = 1 + derivedLevel() * 0.10;
  const scale = (tier === 0 ? 0.75 : 1) + tier * 0.35 + (S.years / 600);

  const all = ELEMENTS.slice();
  let eElem;
  if (tier === 0 && Math.random() < 0.5) {
    const weakAgainstYou = { Fire:"Ice", Ice:"Electric", Gold:"Fire", Electric:"Gold" };
    eElem = weakAgainstYou[S.element] ?? all[Math.floor(Math.random()*all.length)];
  } else {
    eElem = all[Math.floor(Math.random()*all.length)];
  }

  return {
    name: [
      "Stray Wisp","Bone Jackal","Frost Vixen","Gilded Turtle",
      "Storm Kite","Miraculous Ape","Divine Sentinel","Void Wyrm"
    ][Math.floor(Math.random()*8)],
    element: eElem,
    atk: Math.round((4  + S.stats.atk * inherit) * base * scale),
    def: Math.round((3  + S.stats.def * inherit) * base * scale),
    hp:  Math.round((24 + S.stats.hp  * inherit) * base * scale),
  };
}

export function startBattle(tier) {
  if (S.battle) return;
  const hero = {
    name: `${S.animal} (${S.element})`,
    element: S.element,
    atk: Math.round(S.stats.atk * multForDimension(S.dimensionIndex)),
    def: Math.round(S.stats.def * multForDimension(S.dimensionIndex)),
    maxHp: Math.round(S.stats.hp * multForDimension(S.dimensionIndex)) + 10*derivedLevel()
  };
  const enemy = makeEnemy(tier);
  S.battle = {
    tier, hero, enemy,
    heroHP: hero.maxHp, enemyHP: enemy.hp,
    heroGuard: false, enemyGuard: false,
    turn: "player",
    cds: {},
    log: [`A ${enemy.element} ${enemy.name} challenges you!`],
  };
  emitUpdate(); emitLog("It is your turn. Choose an action.");
}

export function fleeBattle() {
  if (!S.battle) return;
  emitLog("You fled the battle.");
  S.battle = null;
  emitUpdate();
}

export function getBattle(){ return S.battle; }

export function enemyAct() {
  const B = S.battle; if (!B) return;
  if (Math.random() < 0.2) {
    B.enemyGuard = true;
    emitLog(`Enemy braces for impact (guard).`);
  } else {
    let dmg = rollDamage(B.enemy.atk, B.hero.def, B.enemy.element, B.hero.element, 0);
    if (B.heroGuard) { dmg = Math.floor(dmg * 0.5); B.heroGuard = false; }
    B.heroHP = Math.max(0, B.heroHP - dmg);
    emitLog(`Enemy strikes you for ${dmg}. Your HP: ${B.heroHP}/${B.hero.maxHp}`);
  }
  if (B.heroHP <= 0) { endBattle(false); return; }
  B.turn = "player";
  emitUpdate();
  tickCooldowns();
  emitLog("Your turn.");
}

export function actStrike() {
  const B = S.battle; if (!B || B.turn !== "player") return;
  const dmg = rollDamage(B.hero.atk, B.enemy.def, B.hero.element, B.enemy.element, 0);
  let actual = dmg; if (B.enemyGuard) { actual = Math.floor(dmg * 0.5); B.enemyGuard = false; }
  B.enemyHP = Math.max(0, B.enemyHP - actual);
  emitLog(`You strike for ${actual}. Enemy HP: ${B.enemyHP}/${B.enemy.hp}`);
  postPlayerAction();
}
export function actGuard() {
  const B = S.battle; if (!B || B.turn !== "player") return;
  B.heroGuard = true; emitLog("You take a guarding stance. (Next damage halved)");
  postPlayerAction();
}
export function actElementSkill(power, pierce) {
  const B = S.battle; if (!B || B.turn !== "player") return;
  const dmg = rollDamage(B.hero.atk*Math.max(1,power), B.enemy.def, B.hero.element, B.enemy.element, pierce||0);
  let actual = dmg; if (B.enemyGuard) { actual = Math.floor(dmg * 0.5); B.enemyGuard = false; }
  B.enemyHP = Math.max(0, B.enemyHP - actual);
  emitLog(`You unleash your elemental skill for ${actual} damage.`);
  postPlayerAction();
}
export function actBurst(power, pierce) {
  return actElementSkill(power, pierce);
}
export function actMeditate(healPct=0.2, essenceGain=20) {
  const B = S.battle; if (!B || B.turn !== "player") return;
  const heal = Math.floor(B.hero.maxHp * healPct);
  B.heroHP = Math.min(B.hero.maxHp, B.heroHP + heal);
  S.essence += essenceGain;
  emitLog(`You meditate, healing ${heal} HP and gaining ${essenceGain} Essence.`);
  postPlayerAction();
}

function postPlayerAction() {
  const B = S.battle; if (!B) return;
  if (B.enemyHP <= 0) { endBattle(true); return; }
  B.turn = "enemy";
  emitUpdate();
  setTimeout(enemyAct, 300);
}

export function setCooldown(key, cd) {
  const B = S.battle; if (!B) return;
  if (cd > 0) B.cds[key] = cd;
}
export function tickCooldowns() {
  const B = S.battle; if (!B) return;
  for (const k of Object.keys(B.cds)) {
    B.cds[k] = Math.max(0, B.cds[k]-1);
    if (B.cds[k] === 0) delete B.cds[k];
  }
}
export function abilityOnCooldown(key) {
  return !!(S.battle && S.battle.cds && S.battle.cds[key]);
}

function endBattle(win) {
  const B = S.battle; if (!B) return;
  if (win) {
    const tier = B.tier;
    const essenceGain = 12 + Math.ceil((tier+1) * (1 + derivedLevel()/8));
    S.essence += essenceGain;
    const chance = 0.08 + tier * 0.05;
    if (Math.random() < chance) {
      S.hourglasses += 1;
      emitLog(`✨ Victory! +${essenceGain} Essence, +1 Hourglass`);
    } else {
      emitLog(`✨ Victory! +${essenceGain} Essence`);
    }
  } else {
    emitLog(`💀 Defeat. Train further and try again.`);
  }
  S.battle = null;
  emitUpdate();
}

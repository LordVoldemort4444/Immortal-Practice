import { EVO_RULES } from "./constants.js";

export let S = load() ?? createDefaultState();

export function createDefaultState() {
  return {
    version: 4,
    animal: "Wolf",
    element: "Fire",
    dimensionIndex: 0,     // 0..4
    years: 0,
    days: 0,               // 0..359
    daySeconds: 0,
    essence: 40,           // starter cushion
    hourglasses: 0,
    stats: { atk: 5, def: 3, hp: 30, idle: 1 },
    upgrades: { atk: 0, def: 0, hp: 0, idle: 0 },
    lastTick: Date.now(),
    battle: null,          // runtime battle session
  };
}

export function derivedLevel(){ return 1 + Math.floor(S.years / 12); }
export function multForDimension(idx){ return EVO_RULES[idx].mult; }

export function save(){ localStorage.setItem("immortal.save", JSON.stringify(S)); }
export function load() {
  try {
    const raw = localStorage.getItem("immortal.save");
    const obj = raw ? JSON.parse(raw) : null;
    if (obj) {
      if (obj.days == null) obj.days = 0;
      if (obj.version == null) obj.version = 4;
    }
    return obj;
  } catch { return null; }
}
export function wipe(){
  localStorage.removeItem("immortal.save");
  S = createDefaultState();
}

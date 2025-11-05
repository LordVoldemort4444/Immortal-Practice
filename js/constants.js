// ---- Time ----
export const DAY_SECONDS = 240;           // 4 minutes real = 1 in-game day
export const AUTOSAVE_EVERY_MS = 10000;

// ---- Game constants ----
export const ANIMALS = ["Wolf","Fox","Bear","Bird"];
export const ELEMENTS = ["Fire","Ice","Gold","Electric"];
export const DIMENSIONS = ["Animal","Human","Miraculous","God","Immortal"];

export const ELEMENT_EFFECT = {
  Fire:     { Ice: 1.5, Gold: 0.75, Fire: 1, Electric: 1 },
  Ice:      { Electric: 1.5, Fire: 0.75, Ice: 1, Gold: 1 },
  Gold:     { Fire: 1.5, Electric: 0.75, Gold: 1, Ice: 1 },
  Electric: { Gold: 1.5, Ice: 0.75, Electric: 1, Fire: 1 },
};

export const EVO_RULES = [
  { reqYears: 0,    mult: 1.00 }, // Animal
  { reqYears: 100,  mult: 1.20 }, // Human
  { reqYears: 300,  mult: 1.45 }, // Miraculous
  { reqYears: 600,  mult: 1.80 }, // God
  { reqYears: 1000, mult: 2.40 }, // Immortal
];

export const UPGRADE_DEFS = [
  { key: "atk",  name: "Attack",    baseCost: 30 },
  { key: "def",  name: "Defense",   baseCost: 30 },
  { key: "hp",   name: "Vitality",  baseCost: 30 },
  { key: "idle", name: "Idle Gain", baseCost: 50 },
];

// Combat constants
export const DEF_FACTOR = 0.45; // softened defense

// Abilities (unlock by YEARS)
export const ABILITY_DEFS = (elem) => {
  const elementSkillByElem = {
    Fire:     { key:"elemSkill", name:"Flame Bite",    power:1.6, pierce:0.2, unlockYear:50,  cd:2, type:"attack", desc:"A fierce bite wreathed in flame. Ignores 20% DEF." },
    Ice:      { key:"elemSkill", name:"Frost Spike",   power:1.6, pierce:0.2, unlockYear:50,  cd:2, type:"attack", desc:"A chilling spike. Ignores 20% DEF." },
    Gold:     { key:"elemSkill", name:"Gilded Slam",   power:1.6, pierce:0.2, unlockYear:50,  cd:2, type:"attack", desc:"A heavy slam. Ignores 20% DEF." },
    Electric: { key:"elemSkill", name:"Thunder Dash",  power:1.6, pierce:0.2, unlockYear:50,  cd:2, type:"attack", desc:"A lightning dash. Ignores 20% DEF." },
  };
  return [
    { key:"strike", name:"Strike", type:"attack", power:1.0, pierce:0, unlockYear:0, cd:0, desc:"Basic attack." },
    { key:"guard",  name:"Guard",  type:"guard",  unlockYear:0, cd:1, desc:"Halve the next damage you take." },
    elementSkillByElem[elem],
    { key:"med",    name:"Meditate", type:"heal", healPct:0.20, essence:20, unlockYear:100, cd:3, desc:"Heal 20% HP and gain 20 Essence." },
    { key:"burst",  name:"Elemental Burst", type:"attack", power:2.5, pierce:0.4, unlockYear:150, cd:4, desc:"Devastating elemental blast. Ignores 40% DEF." },
  ].filter(Boolean);
};
